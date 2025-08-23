import { NextRequest, NextResponse } from "next/server";

export interface CorsOptions {
  origin: string | string[];
  methods?: string[];
  headers?: string[];
  credentials?: boolean;
  maxAge?: number;
}

const defaultOptions: CorsOptions = {
  origin: ["https://www.true-chance.com", "https://true-chance.com"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  headers: ["Content-Type", "Authorization"],
  credentials: true,
  maxAge: 86400, // 24 hours
};

export function cors(
  request: NextRequest,
  options: Partial<CorsOptions> = {}
): NextResponse | null {
  const config = { ...defaultOptions, ...options };

  // Handle preflight OPTIONS request
  if (request.method === "OPTIONS") {
    const response = new NextResponse(null, { status: 200 });

    // Set CORS headers
    setCorsHeaders(response, config);

    return response;
  }

  return null;
}

export function setCorsHeaders(
  response: NextResponse,
  options: CorsOptions
): void {
  const { origin, methods, headers, credentials, maxAge } = options;

  // Handle multiple origins
  const originHeader = Array.isArray(origin) ? origin.join(", ") : origin;

  response.headers.set("Access-Control-Allow-Origin", originHeader);

  if (methods && methods.length > 0) {
    response.headers.set("Access-Control-Allow-Methods", methods.join(", "));
  }

  if (headers && headers.length > 0) {
    response.headers.set("Access-Control-Allow-Headers", headers.join(", "));
  }

  if (credentials !== undefined) {
    response.headers.set(
      "Access-Control-Allow-Credentials",
      credentials.toString()
    );
  }

  if (maxAge) {
    response.headers.set("Access-Control-Max-Age", maxAge.toString());
  }
}

// Helper function to check if request is from allowed origin
export function isAllowedOrigin(
  request: NextRequest,
  allowedOrigins: string | string[]
): boolean {
  const origin = request.headers.get("origin");
  if (!origin) return false;

  if (typeof allowedOrigins === "string") {
    return origin === allowedOrigins;
  }

  return allowedOrigins.includes(origin);
}
