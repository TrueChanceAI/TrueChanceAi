import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { requireAuth, createUnauthorizedResponse } from "@/lib/auth-middleware";
import { createRateLimiter } from "@/lib/validation";

// Rate limiter: 20 requests per 15 minutes per IP
const rateLimiter = createRateLimiter(20, 15 * 60 * 1000);

export async function GET(req: NextRequest) {
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

    const { searchParams } = new URL(req.url);
    const filePath = searchParams.get('file');
    
    console.log("🔍 Dashboard resume URL request:", {
      url: req.url,
      filePath: filePath,
      hasFilePath: !!filePath,
      userEmail: authResult.user.email
    });
    
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
    
    // Check if file exists before proceeding
    console.log("📁 Checking if file exists:", filePath);
    
    const { data: fileExists, error: fileCheckError } = await supabase
      .storage
      .from('cvs')
      .list('', {
        search: filePath
      });
    
    if (fileCheckError) {
      console.error("❌ Error checking file existence:", fileCheckError);
      return NextResponse.json({ 
        success: false, 
        error: `Failed to check file: ${fileCheckError.message}` 
      }, { status: 500 });
    }
    
    if (!fileExists || fileExists.length === 0) {
      console.error("❌ File not found:", filePath);
      return NextResponse.json({ 
        success: false, 
        error: "File not found" 
      }, { status: 404 });
    }
    
    console.log("✅ File exists, proceeding with access logging and streaming");
    
    // First, update the interviews table to log this CV/Resume access
    try {
      // Find the interview record that contains this CV/Resume file
      const { data: interviewData, error: findError } = await supabase
        .from('interviews')
        .select('id, resume_file_name, resume_file_type')
        .eq('resume_file_name', filePath)
        .single();
      
      if (findError) {
        console.error("❌ Error finding interview record:", findError);
      } else if (interviewData) {
        // Update the interview record with access information
        const { data: updateData, error: updateError } = await supabase
          .from('interviews')
          .update({
            last_accessed: new Date().toISOString(),
            access_count: (interviewData.access_count || 0) + 1,
            last_accessed_by: authResult.user.email,
            last_access_ip: clientIP
          })
          .eq('id', interviewData.id);
        
        if (updateError) {
          console.error("❌ Error updating interview record:", updateError);
        } else {
          console.log("✅ Interview record updated with access info:", updateData);
        }
      }
    } catch (logError) {
      console.error("❌ Error logging CV access:", logError);
      // Don't fail the request, just log the error
    }
    
    // Now stream the file directly
    try {
      // Fetch the file content from Supabase
      const { data: fileData, error: fileError } = await supabase
        .storage
        .from('cvs')
        .download(filePath);
      
      if (fileError || !fileData) {
        console.error("❌ Error downloading file:", fileError);
        return NextResponse.json({ 
          success: false, 
          error: `Failed to download file: ${fileError?.message || 'File not found'}` 
        }, { status: 500 });
      }
      
      // Convert the file to a readable stream
      const fileBuffer = await fileData.arrayBuffer();
      
      // Return the file with proper headers
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${filePath}"`,
          'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        },
      });
      
    } catch (downloadError) {
      console.error("❌ Error streaming file:", downloadError);
      return NextResponse.json({ 
        success: false, 
        error: `Failed to stream file: ${downloadError instanceof Error ? downloadError.message : 'Unknown error'}` 
      }, { status: 500 });
    }
    
  } catch (error) {
    console.error("❌ Error generating dashboard resume URL:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
} 