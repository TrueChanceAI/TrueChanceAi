import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";

export interface AuthenticatedUser {
  id: string;
  email: string;
  name?: string;
}

export interface AuthResult {
  user: AuthenticatedUser | null;
  error?: string;
  status: number;
}

/**
 * Extract user information from JWT token in Authorization header
 */
export async function authenticateUser(req: NextRequest): Promise<AuthResult> {
  try {
    // Get Authorization header
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return {
        user: null,
        error: "Missing or invalid authorization header",
        status: 401,
      };
    }

    // Extract token
    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Support either JWT (header.payload.signature) or our custom base64 token format "<userId>:<timestamp>"
    const parts = token.split(".");
    if (parts.length === 3) {
      try {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
          // No secret configured; reject signed tokens
          return { user: null, error: "Server misconfiguration", status: 500 };
        }
        const payload = jwt.verify(token, secret) as any;
        return {
          user: {
            id: payload.sub || payload.id || payload.kid || "unknown",
            email: payload.email || payload.em || "unknown",
            name: payload.name || payload.given_name || undefined,
          },
          status: 200,
        };
      } catch (e) {
        console.error("JWT verify error:", e);
        return { user: null, error: "Invalid token", status: 401 };
      }
    }

    // Try custom base64 token format
    try {
      const raw = Buffer.from(token, "base64").toString("utf8");
      const [userId, ts] = raw.split(":");
      if (!userId || !ts) {
        return { user: null, error: "Invalid token format", status: 401 };
      }
      return {
        user: { id: userId, email: "unknown" },
        status: 200,
      };
    } catch (e) {
      console.error("Custom token decode error:", e);
      return { user: null, error: "Invalid token", status: 401 };
    }
  } catch (error) {
    console.error("Authentication error:", error);
    return {
      user: null,
      error: "Authentication failed",
      status: 500,
    };
  }
}

/**
 * Middleware function to protect API routes
 */
export async function requireAuth(req: NextRequest): Promise<AuthResult> {
  const authResult = await authenticateUser(req);

  if (authResult.user) {
    return authResult;
  }

  return authResult;
}

/**
 * Middleware function to verify user owns the resource
 */
export function requireOwnership(
  userEmail: string,
  resourceEmail: string
): boolean {
  // Normalize emails for comparison (trim whitespace, convert to lowercase)
  const normalizedUserEmail = userEmail?.trim().toLowerCase();
  const normalizedResourceEmail = resourceEmail?.trim().toLowerCase();

  console.log("🔍 Ownership check:", {
    userEmail: normalizedUserEmail,
    resourceEmail: normalizedResourceEmail,
    match: normalizedUserEmail === normalizedResourceEmail,
  });

  return normalizedUserEmail === normalizedResourceEmail;
}

/**
 * Helper function to create unauthorized response
 */
export function createUnauthorizedResponse(message: string = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

/**
 * Helper function to create forbidden response
 */
export function createForbiddenResponse(message: string = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}
