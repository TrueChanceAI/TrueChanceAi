import { NextRequest, NextResponse } from "next/server";
import { requireAuth, createUnauthorizedResponse } from "@/lib/auth-middleware";
import { supabaseServer } from "@/lib/supabase-server";
import { EDFAPayment } from "@/lib/edfaPay";

export async function POST(req: NextRequest) {
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

    const { interviewId, address } = await req.json();
    const { first_name, last_name, email, phone_number } = user;
    const ip = req.headers.get("x-forwarded-for");
    const description = `Interview payment for ${interviewId}`;
    const amount = 1;

    if (!ip) {
      return NextResponse.json(
        { error: "IP address not found" },
        { status: 400 }
      );
    }

    const { data: payment_order, error: payment_order_error } =
      await supabaseServer
        .from("payment_orders")
        .insert({
          user_id: user.id,
          amount,
          interview_id: interviewId,
        })
        .select()
        .single();

    if (payment_order_error) {
      console.log(payment_order_error);
      return NextResponse.json(
        { error: "Failed to create payment order" },
        { status: 500 }
      );
    }

    const edfaPay = new EDFAPayment();
    const response = await edfaPay.initiatePayment({
      user: {
        id: user.id,
        firstName: first_name,
        lastName: last_name,
        email,
        phoneNumber: phone_number,
        isEmailVerified: user.is_email_verified,
      },
      address,
      amount,
      description,
      paymentId: payment_order.id,
      ip,
    });

    if (response.success) {
      const redirectUrl = response.redirectUrl!;
      const orderId = edfaPay.extractOrderId(redirectUrl);

      await supabaseServer
        .from("payment_orders")
        .update({
          edfa_transaction_id: orderId,
        })
        .eq("id", payment_order.id);

      return NextResponse.json(response);
    } else {
      return NextResponse.json({ error: response.message }, { status: 500 });
    }
  } catch (e) {
    console.log(e);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
