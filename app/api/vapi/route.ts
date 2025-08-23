import { NextRequest, NextResponse } from 'next/server';

// Use VAPI REST API directly instead of SDK
const vapiToken = process.env.VAPI_WEB_TOKEN;
const vapiBaseUrl = 'https://api.vapi.ai';

if (!vapiToken) {
  console.error('VAPI_WEB_TOKEN is not set in environment variables');
  throw new Error('VAPI_WEB_TOKEN environment variable is required');
}

console.log('Initializing Vapi with token:', vapiToken.substring(0, 8) + '...');

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...params } = body;

    // Log the request for debugging
    console.log('Vapi API request:', { action, params });
    console.log('VAPI Token available:', !!vapiToken);
    console.log('VAPI Base URL:', vapiBaseUrl);

    switch (action) {
      case 'start':
        // Handle starting a call with proper parameters
        console.log('Starting Vapi call with config:', params.config);
        
        try {
          // Use VAPI REST API to start a call
          // The VAPI API expects the assistant config directly, not nested
          const callData = {
            ...params.config.assistant,
            variableValues: params.config.variableValues,
            ...(params.workflowId && { workflowId: params.workflowId })
          };

          console.log('Call data being sent to VAPI:', callData);

          const startResponse = await fetch(`${vapiBaseUrl}/call/web`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${vapiToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(callData)
          });

          if (!startResponse.ok) {
            const errorText = await startResponse.text();
            console.error('VAPI API error response:', {
              status: startResponse.status,
              statusText: startResponse.statusText,
              error: errorText
            });
            throw new Error(`VAPI API error: ${startResponse.status} - ${errorText}`);
          }

          const startResponseData = await startResponse.json();
          console.log('Vapi start response:', startResponseData);
          return NextResponse.json({ success: true, data: startResponseData });
        } catch (error) {
          console.error('Error starting VAPI call:', error);
          throw error;
        }

      case 'stop':
        // Handle stopping a call
        try {
          // For now, just return success since we need the call ID to stop
          // In a real implementation, you'd need to track active calls
          console.log('Stop call requested');
          return NextResponse.json({ success: true, message: 'Stop call requested' });
        } catch (error) {
          console.error('Error stopping VAPI call:', error);
          throw error;
        }

      case 'create':
        // Handle creating a call - using start with create parameters
        try {
          // Use VAPI REST API to create a call
          // The VAPI API expects the assistant config directly, not nested
          const callData = {
            ...params.config.assistant,
            variableValues: params.config.variableValues,
            ...(params.workflowId && { workflowId: params.workflowId })
          };

          console.log('Create call data being sent to VAPI:', callData);

          const createResponse = await fetch(`${vapiBaseUrl}/call/web`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${vapiToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(callData)
          });

          if (!createResponse.ok) {
            const errorText = await createResponse.text();
            console.error('VAPI API create error response:', {
              status: createResponse.status,
              statusText: createResponse.statusText,
              error: errorText
            });
            throw new Error(`VAPI API create error: ${createResponse.status} - ${errorText}`);
          }

          const createResponseData = await createResponse.json();
          console.log('Vapi create response:', createResponseData);
          return NextResponse.json({ success: true, data: createResponseData });
        } catch (error) {
          console.error('Error creating VAPI call:', error);
          throw error;
        }

      default:
        return NextResponse.json(
          { error: 'Invalid action specified' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Vapi API error:', error);
    
    // Return more detailed error information
    if (error instanceof Error) {
      return NextResponse.json(
        { 
          error: 'Vapi API error', 
          message: error.message,
          details: error
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const callId = searchParams.get('callId');

    if (!callId) {
      return NextResponse.json(
        { error: 'Call ID is required' },
        { status: 400 }
      );
    }

    // For now, return call ID since Vapi doesn't have a get method
    // You can implement call status tracking in your database if needed
    return NextResponse.json({ 
      success: true, 
      data: { callId, status: 'active' } 
    });
  } catch (error) {
    console.error('Vapi GET error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
