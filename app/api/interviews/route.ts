import { createUnauthorizedResponse, requireAuth } from "@/lib/auth-middleware";
import { supabaseServer } from "@/lib/supabase-server";
import { NextRequest, NextResponse } from "next/server";
import {
  validateEmail,
  validateName,
  validateLanguage,
  validateResumeText,
  createRateLimiter,
} from "@/lib/validation";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if (!authResult.user) {
      return createUnauthorizedResponse(
        authResult.error || "Authentication required"
      );
    }

    const userId = authResult.user.id;
    if (!userId || userId === "unknown") {
      return createUnauthorizedResponse("Invalid token subject");
    }

    const { data: user, error } = await supabaseServer
      .from("app_users")
      .select(
        "id, first_name, last_name, email, phone_number, is_email_verified"
      )
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch user profile" },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { data: interviews, error: interviews_error } = await supabaseServer
      .from("interviews")
      .select("*")
      .eq("user_id", userId);

    if (interviews_error) {
      return NextResponse.json(
        { error: "Failed to fetch interviews" },
        { status: 500 }
      );
    }

    // Normalize interview_questions to a clean array of strings
    const normalize = (raw: any): string[] | null => {
      if (!raw) return null;
      const strip = (s: string) => {
        let t = s.trim();
        if (t.startsWith('"') && t.endsWith('"')) t = t.slice(1, -1);
        if (t.endsWith(",")) t = t.slice(0, -1);
        return t.trim();
      };

      try {
        if (typeof raw === "string") {
          const s = raw.trim();
          if (s.startsWith("[")) {
            const parsed = JSON.parse(s);
            if (Array.isArray(parsed)) {
              return parsed
                .filter((q) => typeof q === "string")
                .map((q: string) => q.trim());
            }
          }
          const lines = s.split("\n");
          return lines
            .filter(
              (ln) =>
                ln.trim() !== "```" &&
                ln.trim() !== "```json" &&
                ln.trim() !== "[" &&
                ln.trim() !== "]"
            )
            .map(strip)
            .filter(Boolean);
        }

        if (Array.isArray(raw)) {
          const joined = raw.join("\n");
          const cleanedJoined = joined
            .replace(/```json/g, "")
            .replace(/```/g, "");
          const start = cleanedJoined.indexOf("[");
          const end = cleanedJoined.lastIndexOf("]");
          if (start !== -1 && end !== -1 && end > start) {
            const inside = cleanedJoined.slice(start, end + 1);
            try {
              const parsed = JSON.parse(inside);
              if (Array.isArray(parsed)) {
                return parsed
                  .filter((q) => typeof q === "string")
                  .map((q: string) => q.trim());
              }
            } catch {}
          }
          return raw
            .filter((ln: unknown) => typeof ln === "string")
            .map((ln: string) => ln.trim())
            .filter(
              (ln: string) =>
                ln !== "```" && ln !== "```json" && ln !== "[" && ln !== "]"
            )
            .map(strip)
            .filter(Boolean);
        }
      } catch {}
      return null;
    };

    const normalized = (interviews || []).map((it) => ({
      ...it,
      interview_questions: normalize(it?.interview_questions) || [],
    }));

    return NextResponse.json({ interviews: normalized });
  } catch (error) {
    console.error("❌ Error saving interview data:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Rate limiter: 30 requests per 15 minutes per IP
const rateLimiter = createRateLimiter(30, 15 * 60 * 1000);

// Function to extract skills from resume text using Gemini
async function extractSkillsFromResume(
  resumeText: string
): Promise<string | null> {
  try {
    const prompt = `Extract all technical skills, programming languages, tools, frameworks, and technologies from this resume text. 
    
    Return ONLY a comma-separated list of skills without any additional text, formatting, or explanations.
    
    Examples of expected output:
    - python, sql, javascript, react, docker, aws
    - java, spring boot, mysql, git, kubernetes, jenkins
    - c++, matlab, arduino, mechatronics, robotics, python
    
    Resume text:
    ${resumeText}
    
    Skills:`;

    const { text: skills } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt,
    });

    console.log("✅ Skills extracted:", skills);
    return skills.trim();
  } catch (error) {
    console.error("❌ Error extracting skills:", error);
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    // Authentication check
    const authResult = await requireAuth(req);
    if (!authResult.user) {
      console.error("❌ Authentication failed:", {
        error: authResult.error,
        status: authResult.status,
        headers: Object.fromEntries(req.headers.entries()),
      });
      return createUnauthorizedResponse(
        authResult.error || "Authentication required"
      );
    }

    console.log("✅ Authentication successful:", {
      userId: authResult.user.id,
      userEmail: authResult.user.email,
      userName: authResult.user.name,
    });

    // Rate limiting
    const clientIP =
      req.headers.get("x-forwarded-for") ||
      req.headers.get("x-real-ip") ||
      "unknown";
    if (!rateLimiter(clientIP)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // Validate request body
    if (!req.body) {
      return NextResponse.json(
        { error: "Request body is required" },
        { status: 400 }
      );
    }

    const userId = authResult.user.id;
    if (!userId || userId === "unknown") {
      return createUnauthorizedResponse("Invalid token subject");
    }

    const { data: user, error: userError } = await supabaseServer
      .from("app_users")
      .select(
        "id, first_name, last_name, email, phone_number, is_email_verified"
      )
      .eq("id", userId)
      .maybeSingle();

    if (userError) {
      console.error("❌ User fetch error:", {
        error: userError,
        userId: userId,
        message: userError.message,
        code: userError.code,
        details: userError.details,
      });
      return NextResponse.json(
        { error: "Failed to fetch user profile" },
        { status: 500 }
      );
    }

    if (!user) {
      console.error("❌ User not found:", {
        userId: userId,
        searchedId: userId,
      });
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    console.log("✅ User fetched successfully:", {
      userId: user.id,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
    });

    const {
      resumeFile,
      resumeFileName,
      resumeFileType,
      resumeText,
      language,
      interviewQuestions,
    } = await req.json();

    // Validate all inputs
    const emailValidation = validateEmail(user.email);
    const nameValidation = validateName(user.first_name + " " + user.last_name);
    const languageValidation = validateLanguage(language);
    const resumeTextValidation = resumeText
      ? validateResumeText(resumeText)
      : { isValid: true, errors: [], sanitizedData: resumeText };

    // Check for validation errors
    const allErrors = [
      ...emailValidation.errors,
      ...nameValidation.errors,
      ...languageValidation.errors,
      ...resumeTextValidation.errors,
    ];

    if (allErrors.length > 0) {
      console.log("❌ Validation failed with errors:", allErrors);
      return NextResponse.json(
        { error: "Validation failed", details: allErrors },
        { status: 400 }
      );
    }

    // Use sanitized data
    const sanitizedEmail = emailValidation.sanitizedData;
    const sanitizedName = nameValidation.sanitizedData;
    const sanitizedLanguage = languageValidation.sanitizedData;
    const sanitizedResumeText = resumeTextValidation.sanitizedData;

    console.log("📊 Received validated data for Supabase:", {
      email: sanitizedEmail ? "Present" : "Missing",
      hasResume: !!resumeFile,
      fileName: resumeFileName,
      fileType: resumeFileType,
      fileSize: resumeFile ? Math.round(resumeFile.length * 0.75) : 0,
      hasResumeText: !!sanitizedResumeText,
      candidateName: sanitizedName,
      language: sanitizedLanguage,
    });

    // Upload resume file to Supabase storage bucket
    let resumeFilePath = null;
    let signedUrl = null;
    if (resumeFile) {
      try {
        // Validate base64 string
        if (typeof resumeFile !== "string" || resumeFile.length < 100) {
          throw new Error("Invalid or too small base64 file data");
        }

        // Convert base64 string to buffer
        const buffer = Buffer.from(resumeFile, "base64");

        // Validate buffer size (should be at least 1KB for a resume)
        if (buffer.length < 1024) {
          throw new Error(`File too small: ${buffer.length} bytes`);
        }

        console.log("📁 File upload details:", {
          originalName: resumeFileName,
          contentType: resumeFileType,
          bufferSize: buffer.length,
          base64Length: resumeFile.length,
        });

        // Generate unique filename with original extension
        const fileExtension = resumeFileName
          ? resumeFileName.split(".").pop()
          : "pdf";
        const uniqueFileName = `resume_${Date.now()}_${Math.random()
          .toString(36)
          .substring(7)}.${fileExtension}`;

        // Upload to Supabase storage
        const { error: uploadError } = await supabaseServer.storage
          .from("cvs")
          .upload(uniqueFileName, buffer, {
            contentType: resumeFileType || "application/pdf",
            upsert: true,
          });

        if (uploadError) {
          console.error("❌ Storage upload error details:", {
            error: uploadError,
            message: uploadError.message,
            name: uploadError.name,
          });

          // Check if it's an RLS policy error
          if (uploadError.message?.includes("row-level security policy")) {
            throw new Error(
              `Storage access denied: ${uploadError.message}. Please check your storage bucket permissions.`
            );
          }

          throw uploadError;
        }

        // Store the file path and generate direct signed URL
        resumeFilePath = uniqueFileName;

        // Generate a direct signed URL for immediate access
        const { data: signedUrlData, error: signedUrlError } =
          await supabaseServer.storage
            .from("cvs")
            .createSignedUrl(uniqueFileName, 3600); // 1 hour expiry

        if (signedUrlError) {
          console.error(
            "❌ Error generating initial signed URL:",
            signedUrlError
          );
        } else {
          console.log(
            "✅ Initial signed URL generated:",
            signedUrlData.signedUrl
          );
          signedUrl = signedUrlData.signedUrl;
        }

        console.log("✅ Resume file uploaded successfully:", {
          fileName: uniqueFileName,
          size: buffer.length,
          path: resumeFilePath,
          signedUrl: signedUrl || "Failed to generate",
        });
      } catch (uploadError) {
        console.error("❌ Error uploading resume file:", uploadError);
      }
    }

    // Extract skills from resume text
    let extractedSkills = null;
    if (resumeText) {
      try {
        // Extract skills as comma-separated list
        extractedSkills = await extractSkillsFromResume(resumeText);
        console.log("✅ Skills extracted from resume:", extractedSkills);
      } catch (skillsError) {
        console.error("❌ Error extracting skills:", skillsError);
      }
    }

    // For now, use localhost for development. In production, set NEXT_PUBLIC_APP_URL
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const supabaseData: any = {
      user_id: userId, // Use the authenticated user's ID instead of "anonymous"
      candidate_name: sanitizedName || "Unknown",
      duration: "N/A",
      language: sanitizedLanguage || "en",
      transcript: "Interview not started",
      feedback: "Interview conducted",
      tone: null,
      Email: sanitizedEmail,
      // Ensure clean URL concatenation without double slashes
      "CV/Resume": resumeFilePath
        ? `${appUrl.replace(
            /\/$/,
            ""
          )}/api/cv-preview?file=${encodeURIComponent(resumeFilePath)}`
        : null,
    };

    // Persist interview questions if provided (expects JSON array of strings)
    if (interviewQuestions) {
      let questionsArray: string[] | null = null;
      try {
        if (Array.isArray(interviewQuestions)) {
          questionsArray = interviewQuestions.filter(
            (q: unknown) => typeof q === "string"
          ) as string[];
        } else if (typeof interviewQuestions === "string") {
          const parsed = JSON.parse(interviewQuestions);
          if (Array.isArray(parsed)) {
            questionsArray = parsed.filter(
              (q: unknown) => typeof q === "string"
            ) as string[];
          }
        }
      } catch (e) {
        console.warn("⚠️ Failed to parse interviewQuestions; skipping save.");
      }

      if (questionsArray && questionsArray.length > 0) {
        supabaseData.interview_questions = questionsArray;
        console.log("✅ interview_questions added:", questionsArray.length);
      } else {
        console.log("ℹ️ No valid interview_questions provided.");
      }
    }

    // Add skills as text
    if (extractedSkills) {
      supabaseData.skills = extractedSkills;
      console.log("✅ Skills text added to Supabase data");
    }

    console.log("📊 Final Supabase data structure:", {
      hasSkillsText: !!supabaseData.skills,
      skillsTextType: typeof supabaseData.skills,
      resumeUrl: supabaseData["CV/Resume"] || "None",
              conductedInterview: supabaseData.is_conducted,
      note: "Initial data saved - interview not yet conducted",
    });

    // Log the exact data being sent
    console.log(
      "📤 Sending to Supabase:",
      JSON.stringify(supabaseData, null, 2)
    );

    const { data: insertedRow, error } = await supabaseServer
      .from("interviews")
      .insert(supabaseData)
      .select("id")
      .single();

    console.log("insertedRow", insertedRow);

    if (error) {
      console.error("❌ Database insertion error details:", {
        error: error,
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint,
      });

      // Check if it's an RLS policy error
      if (error.message?.includes("row-level security policy")) {
        return NextResponse.json(
          {
            success: false,
            error: `Database access denied: ${error.message}. Please check your RLS policies.`,
            details:
              "The user may not have permission to insert into the interviews table.",
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        {
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 500 }
      );
    } else {
      console.log("✅ Initial data saved to Supabase successfully", {
        interview_id: insertedRow?.id,
      });
      // Return the interview_id so the frontend can store it
      return NextResponse.json({
        success: true,
        interview: insertedRow,
      });
    }
  } catch (error) {
    console.error("❌ Error saving initial data:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
