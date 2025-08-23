import { NextRequest, NextResponse } from "next/server";
import { requireAuth, createUnauthorizedResponse } from "@/lib/auth-middleware";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  try {
    // Validate JWT from Authorization header
    const authResult = await requireAuth(req);
    if (!authResult.user) {
      return createUnauthorizedResponse(
        authResult.error || "Authentication required"
      );
    }

    const userId = authResult.user.id;
    if (!userId || userId === "unknown") {
      return createUnauthorizedResponse("Invalid token subject");
    }

    // Fetch latest user profile from DB
    const { data: user, error } = await supabaseServer
      .from("app_users")
      .select(
        "id, first_name, last_name, email, phone_number, is_email_verified"
      )
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch user profile" },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phoneNumber: user.phone_number,
        isEmailVerified: user.is_email_verified,
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
