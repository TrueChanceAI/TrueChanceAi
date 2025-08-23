// app/api/extract-resume/route.ts
import { NextRequest, NextResponse } from "next/server";
import os from "os";
import fs from "fs/promises";
import path from "path";
import https from "https";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { validateFileUpload, createRateLimiter } from "@/lib/validation";
import { requireAuth, createUnauthorizedResponse } from "@/lib/auth-middleware";

const API_KEY = process.env.PDFCO_API_KEY!;
export const runtime = "nodejs";

// Rate limiter: 10 requests per 15 minutes per IP
const rateLimiter = createRateLimiter(10, 15 * 60 * 1000);

// Get presigned URL from PDF.co
async function getPresignedUrl(fileName: string): Promise<[string, string]> {
  return new Promise((resolve, reject) => {
    const queryPath = `/v1/file/upload/get-presigned-url?contenttype=application/octet-stream&name=${encodeURIComponent(
      fileName
    )}`;
    const options = {
      host: "api.pdf.co",
      path: queryPath,
      method: "GET",
      headers: { "x-api-key": API_KEY },
    };

    https
      .get(options, (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          const json = JSON.parse(body);
          if (!json.error) resolve([json.presignedUrl, json.url]);
          else reject(json.message);
        });
      })
      .on("error", reject);
  });
}

// Upload PDF to presigned URL using fetch
async function uploadFileWithFetch(localPath: string, uploadUrl: string) {
  const buffer = await fs.readFile(localPath);
  const res = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": "application/octet-stream" },
    body: buffer,
  });

  if (!res.ok) throw new Error("Upload to PDF.co failed");
}

// Request PDF text extraction
function convertPdfToText(uploadedFileUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({
      name: "result.txt",
      url: uploadedFileUrl,
    });
    const options = {
      host: "api.pdf.co",
      path: "/v1/pdf/convert/to/text",
      method: "POST",
      headers: {
        "x-api-key": API_KEY,
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        const json = JSON.parse(body);
        json.error ? reject(json.message) : resolve(json.url || json.body);
      });
    });

    req.on("error", reject);
    req.write(payload);
    req.end();
  });
}

// Main API route
export async function POST(req: NextRequest) {
  try {
    // Authentication check
    const authResult = await requireAuth(req);
    if (!authResult.user) {
      return createUnauthorizedResponse(
        authResult.error || "Authentication required"
      );
    }

    // Rate limiting
    const clientIP = req.headers.get("x-forwarded-for") || "unknown";
    if (!rateLimiter(clientIP)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // Get form data
    const form = await req.formData();
    const file = form.get("file") as File | null;

    // Validate file
    const fileValidation = validateFileUpload(file);
    if (!fileValidation.isValid) {
      return NextResponse.json(
        { error: "File validation failed", details: fileValidation.errors },
        { status: 400 }
      );
    }

    // Additional server-side file validation
    if (!fileValidation.sanitizedData) {
      return NextResponse.json({ error: "Invalid file" }, { status: 400 });
    }

    const validatedFile = fileValidation.sanitizedData;

    // Check file size again server-side
    if (validatedFile.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File size exceeds 10MB limit" },
        { status: 400 }
      );
    }

    // Check MIME type server-side
    if (validatedFile.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Only PDF files are allowed" },
        { status: 400 }
      );
    }

    const arrayBuffer = await validatedFile.arrayBuffer();
    const tempPath = path.join(os.tmpdir(), validatedFile.name);
    await fs.writeFile(tempPath, Buffer.from(arrayBuffer));

    try {
      const [uploadUrl, uploadedFileUrl] = await getPresignedUrl(
        validatedFile.name
      );
      await uploadFileWithFetch(tempPath, uploadUrl);
      const result = await convertPdfToText(uploadedFileUrl);

      const text = result.startsWith("http")
        ? await (await fetch(result)).text()
        : result;

      // Use Gemini to extract the candidate's name from the resume text
      const { text: geminiResult } = await generateText({
        model: google("gemini-2.0-flash-001"),
        prompt: `Extract ONLY the candidate's full name from the following resume text. The name is usually at the top and may be in all caps or bold. Return a JSON object: { "name": "<name>", "resume": "<resume text>" }. If you cannot find a name, set "name" to an empty string. Resume:\n${text}`,
      });

      console.log("Gemini raw result:", geminiResult);

      let name = "";
      let resumeText = text;
      let cleaned = geminiResult.trim();
      if (cleaned.startsWith("```")) {
        cleaned = cleaned
          .replace(/^```(json)?/i, "")
          .replace(/```$/, "")
          .trim();
      }
      try {
        const parsed = JSON.parse(cleaned);
        name = parsed.name || "";
        resumeText = parsed.resume || text;
      } catch {
        name = "";
        resumeText = text;
      }

      return NextResponse.json({ text: resumeText, name });
    } catch (err: any) {
      console.error("Error processing resume:", err);
      return NextResponse.json(
        { error: "Failed to process resume. Please try again." },
        { status: 500 }
      );
    } finally {
      // Clean up temporary file
      try {
        if (tempPath) {
          await fs.unlink(tempPath);
        }
      } catch (cleanupErr) {
        console.error("Failed to cleanup temp file:", cleanupErr);
      }
    }
  } catch (err: any) {
    console.error("Error in resume extraction:", err);
    return NextResponse.json(
      { error: "Failed to process resume. Please try again." },
      { status: 500 }
    );
  }
}
