import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const vapiToken = process.env.VAPI_WEB_TOKEN;
    
    if (!vapiToken) {
      return NextResponse.json(
        { error: 'VAPI_WEB_TOKEN is not set' },
        { status: 500 }
      );
    }

    // Test the token by making a simple request to Vapi
    const testResponse = await fetch('https://api.vapi.ai/assistant', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${vapiToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (testResponse.ok) {
      const data = await testResponse.json();
      return NextResponse.json({
        success: true,
        message: 'Vapi token is valid',
        tokenPreview: `${vapiToken.substring(0, 8)}...`,
        responseStatus: testResponse.status,
        data: data
      });
    } else {
      const errorData = await testResponse.text();
      return NextResponse.json({
        success: false,
        message: 'Vapi token validation failed',
        tokenPreview: `${vapiToken.substring(0, 8)}...`,
        responseStatus: testResponse.status,
        error: errorData
      }, { status: testResponse.status });
    }
  } catch (error) {
    console.error('Vapi test error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Test failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
