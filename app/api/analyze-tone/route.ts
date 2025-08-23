import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { requireAuth, createUnauthorizedResponse } from "@/lib/auth-middleware";
import { createRateLimiter } from "@/lib/validation";

// Rate limiter: 15 requests per 15 minutes per IP
const rateLimiter = createRateLimiter(15, 15 * 60 * 1000);

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

    const { text } = await req.json();
    if (!text) {
      return NextResponse.json({ tone: "No text provided." }, { status: 400 });
    }

    // Validate text length to prevent abuse
    if (typeof text !== 'string' || text.length > 10000) {
      return NextResponse.json({ 
        error: "Text too long. Maximum 10,000 characters allowed." 
      }, { status: 400 });
    }

    const { text: tone } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt: `
    You are an AI communication analyst.
    
    Analyze the tone, confidence, and energy of the candidate's responses. Focus on verbal cues such as filler words ("um", "uh"), hesitations, vocal tone, emotional expressiveness, pace, and overall delivery.
    
    Return your response strictly in the following JSON format:
    
    {
      "confidence": "<low | medium | high>",
      "tone": "<professional | informal | nervous | enthusiastic | monotone | etc.>",
      "energy": "<low | medium | high>",
      "summary": "<2-3 sentence narrative on overall impression>"
    }
    
    Answers:
    ${text}
    `,
    });
    

    return NextResponse.json({ tone });
  } catch (error: any) {
    console.error("❌ Error in analyze-tone:", error);
    return NextResponse.json({ tone: "Could not analyze tone." }, { status: 500 });
  }
} 