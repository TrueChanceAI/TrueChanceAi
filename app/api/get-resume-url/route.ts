import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { requireAuth, createUnauthorizedResponse } from "@/lib/auth-middleware";
import { createRateLimiter } from "@/lib/validation";

// Rate limiter: 25 requests per 15 minutes per IP
const rateLimiter = createRateLimiter(25, 15 * 60 * 1000);

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

    const { filePath } = await req.json();
    
    if (!filePath) {
      return NextResponse.json({ 
        success: false, 
        error: "File path is required" 
      }, { status: 400 });
    }

    // Validate file path to prevent directory traversal attacks
    if (filePath.includes('..') || filePath.includes('/') || filePath.includes('\\')) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid file path" 
      }, { status: 400 });
    }

    // Validate file path format (should be like: resume_1234567890_abc123.pdf)
    const filePathRegex = /^resume_\d+_[a-zA-Z0-9]+\.pdf$/;
    if (!filePathRegex.test(filePath)) {
      return NextResponse.json({ 
        success: false, 
        error: "Invalid file path format" 
      }, { status: 400 });
    }
    
    // Initialize Supabase client
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Generate signed URL for the file (valid for 1 hour)
    const { data: signedUrlData, error: signedUrlError } = await supabase
      .storage
      .from('cvs')
      .createSignedUrl(filePath, 3600); // 1 hour expiry
    
    if (signedUrlError) {
      console.error("❌ Error generating signed URL:", signedUrlError);
      return NextResponse.json({ 
        success: false, 
        error: `Failed to generate signed URL: ${signedUrlError.message}` 
      }, { status: 500 });
    }
    
    console.log("✅ Signed URL generated for file:", filePath, "for user:", authResult.user.email);
    
    return NextResponse.json({ 
      success: true, 
      signedUrl: signedUrlData.signedUrl 
    });
    
  } catch (error) {
    console.error("❌ Error generating resume URL:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
} 