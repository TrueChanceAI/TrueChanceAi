import { NextRequest, NextResponse } from "next/server";
import { setCorsHeaders, CorsOptions } from "./cors";

export function withCors(
  handler: (request: NextRequest) => Promise<NextResponse>,
  options: Partial<CorsOptions> = {}
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    // Handle preflight OPTIONS request
    if (request.method === "OPTIONS") {
      const response = new NextResponse(null, { status: 200 });
      setCorsHeaders(response, {
        origin: ["https://www.true-chance.com", "https://true-chance.com"],
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        headers: ["Content-Type", "Authorization"],
        credentials: true,
        ...options,
      });
      return response;
    }

    // Call the original handler
    const response = await handler(request);

    // Add CORS headers to the response
    setCorsHeaders(response, {
      origin: ["https://www.true-chance.com", "https://true-chance.com"],
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      headers: ["Content-Type", "Authorization"],
      credentials: true,
      ...options,
    });

    return response;
  };
}

// Example usage:
// export const GET = withCors(async (request: NextRequest) => {
//   // Your API logic here
//   return NextResponse.json({ message: 'Hello World' });
// });
