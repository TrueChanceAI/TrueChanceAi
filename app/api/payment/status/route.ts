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

    // Get payment order from database
    const { data: payment_order, error: payment_order_error } =
      await supabaseServer
        .from("payment_orders")
        .select("*")
        .eq("id", paymentId)
        .single();

    if (payment_order_error || !payment_order) {
      return NextResponse.json(
        { error: "Payment order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      paymentId: paymentId,
      status: payment_order.status,
    });
  } catch (error) {
    console.error("Payment status check error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
