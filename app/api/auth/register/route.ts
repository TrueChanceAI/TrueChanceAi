import { NextRequest, NextResponse } from "next/server";

import bcrypt from "bcryptjs";
import { supabaseServer } from "@/lib/supabase-server";

export async function POST(request: NextRequest) {
  try {
    const { firstName, lastName, email, phoneNumber, password } =
      await request.json();

    if (!firstName || !lastName || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    const phoneNumberRegex = /^[1-9]\d{6,14}$/;
    if (phoneNumber && !phoneNumberRegex.test(phoneNumber)) {
      return NextResponse.json(
        { error: "Invalid phone number format" },
        { status: 400 }
      );
    }

    const passwordRegex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};:'"\\|,.<>\/?]).{8,16}$/;

    if (!passwordRegex.test(password)) {
      return NextResponse.json(
        {
          error:
            "Password must be at least 8 characters and contain at least 1 uppercase letter, 1 lowercase letter, 1 number, and 1 special character",
        },
        { status: 400 }
      );
    }

    // Check if email exists
    const { data: existingEmail } = await supabaseServer
      .from("app_users")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingEmail) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // Check if phone exists
    if (phoneNumber) {
      const { data: existingPhone } = await supabaseServer
        .from("app_users")
        .select("id")
        .eq("phone_number", phoneNumber)
        .maybeSingle();

      if (existingPhone) {
        return NextResponse.json(
          { error: "User with this phone already exists" },
          { status: 409 }
        );
      }
    }

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const { data: insertedUser, error } = await supabaseServer
      .from("app_users")
      .insert({
        email,
        first_name: firstName,
        last_name: lastName,
        phone_number: phoneNumber || null,
        password_hash,
        otp,
        is_email_verified: false,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        {
          error: `Failed to register user: ${error.message || "Unknown error"}`,
          details: error.details,
          hint: error.hint,
        },
        { status: 500 }
      );
    }

    // Send OTP via email
    try {
      const { sendOtpEmail } = await import("@/lib/mail");
      await sendOtpEmail(email, otp);
    } catch (e) {
      console.warn("Failed to send OTP email (continuing):", e);
    }

    return NextResponse.json(
      {
        message: "OTP Sent to your email",
        userId: insertedUser.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
