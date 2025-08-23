import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { requireAuth, createUnauthorizedResponse } from "@/lib/auth-middleware";
import { createRateLimiter } from "@/lib/validation";

// Rate limiter: 10 requests per 15 minutes per IP (more restrictive for AI generation)
const rateLimiter = createRateLimiter(10, 15 * 60 * 1000);

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

    const { transcript } = await req.json();
    if (!transcript) {
      return NextResponse.json({ error: "No transcript provided." }, { status: 400 });
    }

    // Validate transcript length to prevent abuse
    if (typeof transcript !== 'string' || transcript.length > 50000) {
      return NextResponse.json({ 
        error: "Transcript too long. Maximum 50,000 characters allowed." 
      }, { status: 400 });
    }

    // Validate transcript content (basic check)
    if (transcript.trim().length < 100) {
      return NextResponse.json({ 
        error: "Transcript too short. Minimum 100 characters required." 
      }, { status: 400 });
    }

    const { text } = await generateText({
      model: google("gemini-2.0-flash-001"),
      prompt: `
You are an AI evaluator reviewing a candidate's full voice interview transcript.

Your job is to write a detailed, structured evaluation of the candidate's performance, focusing on the 13 key traits listed below. Responses must be deeply analytical and draw evidence from multiple parts of the transcript — remember that **one answer can provide clues about multiple traits** (e.g., leadership, time management, and EQ).

---

**IMPORTANT RULES:**
- DO NOT include numeric scores or rating systems.
- DO NOT use markdown or code formatting. Return ONLY raw JSON.
- Be fair, specific, and professional. Provide both praise and constructive feedback.
- No repetition across sections — insights must be unique per trait.
- Show signs of active listening and inference, not just surface-level analysis.

---

Return feedback in this exact JSON format:

{
  "communication": "...",
  "analytical_thinking_problem_solving": "...",
  "technical_depth_accuracy": "...",
  "adaptability_learning_mindset": "...",
  "motivation": "...",
  "confidence": "...",
  "collaboration_teamwork": "...",
  "accountability_ownership": "...",
  "cultural_fit_values_alignment": "...",
  "leadership_influence": "...",
  "decision_making_quality": "...",
  "time_management_prioritization": "...",
  "emotional_intelligence": "...",
  "final_assessment": "..."
}

---

### Trait Guidance:

- **communication**: Clarity, flow, coherence, use of filler words, fluency
- **analytical_thinking_problem_solving**: Logic, structure, creative reasoning, examples
- **technical_depth_accuracy**: Mastery of technical concepts, terminology, problem explanations
- **adaptability_learning_mindset**: Response to change, curiosity, willingness to learn
- **motivation**: Passion, personal drive, enthusiasm, values alignment
- **confidence**: Tone, assertiveness, hesitation, belief in their own abilities
- **collaboration_teamwork**: Mentions of team dynamics, humility, shared goals
- **accountability_ownership**: Responsibility for mistakes or results, self-awareness
- **cultural_fit_values_alignment**: Match with role/company vibe, tone, professionalism
- **leadership_influence**: Initiative, persuasion, vision, stakeholder communication
- **decision_making_quality**: Structured thinking, clarity, ownership of tough calls
- **time_management_prioritization**: Planning, deadlines, prioritizing under pressure
- **emotional_intelligence**: Empathy, social awareness, handling conflict

---

Transcript:
${transcript}
`.trim()
    });

    // ✅ Clean output to remove backticks and extra junk
    let cleanedText = text.trim();

    if (cleanedText.startsWith("```")) {
      cleanedText = cleanedText.replace(/^```(json)?/i, "").replace(/```$/, "").trim();
    }

    let feedback;
    try {
      feedback = JSON.parse(cleanedText);
    } catch (err) {
      console.error("❌ Failed to parse AI output:", text);
      return NextResponse.json({ error: "Invalid JSON from AI", raw: text }, { status: 500 });
    }

    return NextResponse.json({ feedback });
  } catch (error: any) {
    console.error("❌ Error generating feedback:", error);
    return NextResponse.json({ error: "Could not generate feedback." }, { status: 500 });
  }
}
