import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { validateResumeText, validateLanguage, createRateLimiter } from "@/lib/validation";
import { requireAuth, createUnauthorizedResponse } from "@/lib/auth-middleware";

// Rate limiter: 20 requests per 15 minutes per IP
const rateLimiter = createRateLimiter(20, 15 * 60 * 1000);

export async function POST(req: NextRequest) {
  try {
    // Authentication check
    const authResult = await requireAuth(req);
    if (!authResult.user) {
      return createUnauthorizedResponse(authResult.error || "Authentication required");
    }
    
    // Rate limiting
    const clientIP = req.ip || req.headers.get('x-forwarded-for') || 'unknown';
    if (!rateLimiter(clientIP)) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // Validate request body
    if (!req.body) {
      return NextResponse.json({ error: "Request body is required" }, { status: 400 });
    }

    const body = await req.json();
    
    // Validate resume text
    const resumeValidation = validateResumeText(body.resume);
    if (!resumeValidation.isValid) {
      return NextResponse.json(
        { error: "Invalid resume text", details: resumeValidation.errors },
        { status: 400 }
      );
    }

    // Validate language
    const languageValidation = validateLanguage(body.language);
    if (!languageValidation.isValid) {
      return NextResponse.json(
        { error: "Invalid language selection", details: languageValidation.errors },
        { status: 400 }
      );
    }

    const { resume, language } = body;
    const sanitizedResume = resumeValidation.sanitizedData;
    const sanitizedLanguage = languageValidation.sanitizedData;

    // Set prompt language using sanitized data
    let prompt = "";
    if (sanitizedLanguage === "ar") {
      prompt = `قم بإعداد أسئلة لمقابلة عمل باللغة العربية بناءً على السيرة الذاتية التالية. يجب أن تكون الأسئلة باللغة العربية فقط وذات صلة بخبرة ومهارات وخلفية المرشح. يرجى إرجاع الأسئلة باللغة العربية فقط، بدون أي نص إضافي. صِغها كمصفوفة JSON من السلاسل النصية العربية.\n\nمهم: جميع الأسئلة يجب أن تكون باللغة العربية فقط.\n\nالسيرة الذاتية:\n${sanitizedResume}`;
    } else {
      prompt = `Prepare questions for a job interview based on the following resume. The questions should be relevant to the candidate's experience, skills, and background. Please return only the questions, without any additional text. Format as a JSON array of strings.\nResume:\n${sanitizedResume}`;
    }

    const { text: questions } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt,
    });

    let parsedQuestions: string[] = [];
    try {
      parsedQuestions = JSON.parse(questions);
    } catch {
      // fallback: try to split by newlines if not valid JSON
      parsedQuestions = questions.split("\n").filter(Boolean);
    }

    return NextResponse.json({ questions: parsedQuestions });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to generate questions." }, { status: 500 });
  }
} 