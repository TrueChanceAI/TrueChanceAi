import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filePath = searchParams.get('file');
    
    console.log("🔍 CV Preview request:", { filePath });
    
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
    
    // Initialize Supabase client with service role key
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
    
    // Stream the file directly
    try {
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
      
      const fileBuffer = await fileData.arrayBuffer();
      
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `inline; filename="${filePath}"`,
          'Cache-Control': 'public, max-age=3600',
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
    console.error("❌ Error in CV preview:", error);
    return NextResponse.json({ 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
