import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json();
    if (!id) {
      return NextResponse.json(
        { error: "User id is required" },
        { status: 400 }
      );
    }

    const { data: user, error } = await supabaseServer
      .from("app_users")
      .select("id, is_email_verified, email")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      return NextResponse.json(
        { error: "Failed to resend OTP" },
        { status: 500 }
      );
    }
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    if (user.is_email_verified) {
      return NextResponse.json({ message: "Email already verified" });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const { error: updateError } = await supabaseServer
      .from("app_users")
      .update({ otp })
      .eq("id", user.id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to regenerate OTP" },
        { status: 500 }
      );
    }

    try {
      const { sendOtpEmail } = await import("@/lib/mail");
      await sendOtpEmail(user.email, otp);
    } catch (e) {
      console.warn("Failed to send OTP email (continuing):", e);
    }

    return NextResponse.json({ message: "OTP sent" });
  } catch (e) {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
