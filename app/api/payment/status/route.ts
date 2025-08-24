import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get("paymentId");

    if (!paymentId) {
      return NextResponse.json(
        { error: "Payment ID is required" },
        { status: 400 }
      );
    }

    console.log("🔍 Checking payment status for:", paymentId);

    // Get payment order from database
    const { data: payment_order, error: payment_order_error } =
      await supabaseServer
        .from("payment_orders")
        .select("*")
        .eq("id", paymentId)
        .single();

    if (payment_order_error || !payment_order) {
      console.error("Payment order error:", payment_order_error);
      return NextResponse.json(
        { error: "Payment order not found" },
        { status: 404 }
      );
    }

    console.log("📊 Payment order found:", {
      id: payment_order.id,
      status: payment_order.status,
      amount: payment_order.amount,
      currency: payment_order.currency,
      interview_id: payment_order.interview_id,
      created_at: payment_order.created_at,
      updated_at: payment_order.updated_at
    });

    // Also check the interview status
    if (payment_order.interview_id) {
      const { data: interview, error: interview_error } = await supabaseServer
        .from("interviews")
        .select("id, payment_status, payment_id")
        .eq("id", payment_order.interview_id)
        .single();

      if (!interview_error && interview) {
        console.log("📋 Interview status:", {
          interview_id: interview.id,
          payment_status: interview.payment_status,
          payment_id: interview.payment_id
        });
      }
    }

    return NextResponse.json({
      success: true,
      paymentId: paymentId,
      status: payment_order.status,
      amount: payment_order.amount,
      currency: payment_order.currency,
      interview_id: payment_order.interview_id
    });
  } catch (error) {
    console.error("Payment status check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
