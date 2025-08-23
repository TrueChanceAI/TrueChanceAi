import { NextRequest, NextResponse } from "next/server";

import bcrypt from "bcryptjs";
import { supabaseServer } from "@/lib/supabase-server";
import jwt from "jsonwebtoken";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
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

    // Find user by email
    const { data: user, error: fetchError } = await supabaseServer
      .from("app_users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (fetchError) {
      console.error("Database fetch error:", fetchError);
      return NextResponse.json(
        { error: "Failed to authenticate user" },
        { status: 500 }
      );
    }

    if (!user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Check if email is verified
    if (!user.is_email_verified) {
      return NextResponse.json(
        {
          error: "Please verify your email before logging in",
          isEmailVerified: user.is_email_verified,
        },
        { status: 403 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Generate JWT
    const jwtSecret = process.env.JWT_SECRET || "";

    const payload = {
      sub: user.id,
      id: user.id,
      email: user.email,
      name: `${user.first_name || ""} ${user.last_name || ""}`.trim(),
    } as any;
    const token = jwt.sign(payload, jwtSecret, { expiresIn: "7d" });

    // Return user data (without sensitive information)
    return NextResponse.json({
      message: "Login successful",
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        phoneNumber: user.phone_number,
        isEmailVerified: user.is_email_verified,
      },
      token,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
