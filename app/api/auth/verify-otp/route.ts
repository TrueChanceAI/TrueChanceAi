import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import jwt from "jsonwebtoken";

export async function POST(request: NextRequest) {
  try {
    const { id, otp } = await request.json();
    if (!id || !otp) {
      return NextResponse.json(
        { error: "User id and OTP are required" },
        { status: 400 }
      );
    }

    const { data: user, error } = await supabaseServer
      .from("app_users")
      .select("id, email, first_name, last_name, is_email_verified, otp")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: "Failed to verify OTP" },
        { status: 500 }
      );
    }
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (user.is_email_verified) {
      return NextResponse.json({ message: "Email already verified" });
    }
    if (user.otp !== otp) {
      return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
    }

    // Mark verified and clear OTP
    const { error: updateError } = await supabaseServer
      .from("app_users")
      .update({ is_email_verified: true, otp: null })
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update verification" },
        { status: 500 }
      );
    }

    // Issue JWT similar to login
    const jwtSecret = process.env.JWT_SECRET || "";

    const payload = {
      sub: user.id,
      id: user.id,
      email: user.email,
      name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
    } as any;
    const token = jwt.sign(payload, jwtSecret, { expiresIn: "7d" });

    return NextResponse.json({
      message: "Email verified successfully",
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        isEmailVerified: true,
      },
      token,
    });
  } catch (e) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
