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

    const workflowId = process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID;
    
    if (!workflowId) {
      return NextResponse.json(
        { error: 'NEXT_PUBLIC_VAPI_WORKFLOW_ID is not set' },
        { status: 500 }
      );
    }

    // Test 1: Check if we can access the workflow
    const workflowResponse = await fetch(`https://api.vapi.ai/workflow/${workflowId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${vapiToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (workflowResponse.ok) {
      const workflowData = await workflowResponse.json();
      return NextResponse.json({
        success: true,
        message: 'Workflow found',
        workflowId,
        workflowData,
        tokenPreview: `${vapiToken.substring(0, 8)}...`
      });
    } else {
      const errorData = await workflowResponse.text();
      return NextResponse.json({
        success: false,
        message: 'Workflow not accessible',
        workflowId,
        responseStatus: workflowResponse.status,
        error: errorData
      }, { status: workflowResponse.status });
    }
  } catch (error) {
    console.error('Workflow test error:', error);
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
