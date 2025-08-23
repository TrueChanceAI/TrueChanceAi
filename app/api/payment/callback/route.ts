import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase-server";
import { EDFAPayment } from "@/lib/edfaPay";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const paymentId = searchParams.get("paymentId");

    // Validate payment ID format (should be a UUID)
    if (
      !paymentId ||
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        paymentId
      )
    ) {
      console.error("Invalid payment ID format:", paymentId);
      return NextResponse.redirect(new URL("/payment-failed", req.url));
    }

    // Get payment order from database
    const { data: payment_order, error: payment_order_error } =
      await supabaseServer
        .from("payment_orders")
        .select("*")
        .eq("id", paymentId)
        .single();

    if (payment_order_error) {
      console.error("Payment order error:", payment_order_error);
      return NextResponse.redirect(new URL("/payment-failed", req.url));
    }

    if (!payment_order) {
      console.error("Payment order not found:", paymentId);
      return NextResponse.redirect(new URL("/payment-failed", req.url));
    }

    // Check if payment was already processed
    if (payment_order.status && payment_order.status !== "pending") {
      console.log(
        `Payment ${paymentId} already processed with status: ${payment_order.status}`
      );
      // Redirect based on existing status
      const redirectUrl =
        payment_order.status === "completed"
          ? "/upload-resume"
          : "/payment-failed";
      return NextResponse.redirect(new URL(redirectUrl, req.url));
    }

    const edfaPay = new EDFAPayment();
    const response = await edfaPay.checkPaymentStatus(
      payment_order.edfa_transaction_id,
      payment_order.amount
    );

    if (response.success) {
      // Parse the response to get payment status
      let paymentStatus = "unknown";
      let redirectUrl = "/payment-failed"; // Default to failed

      try {
        // Extract payment status from the response data
        const responseData = response.data;
        if (responseData && responseData.responseBody) {
          const status = responseData.responseBody.status;
          const orderAmount = responseData.responseBody.order?.amount;
          const orderCurrency = responseData.responseBody.order?.currency;

          // Validate payment amount and currency
          if (orderAmount && orderCurrency) {
            // Convert both amounts to numbers for proper comparison
            const expectedAmount = parseFloat(payment_order.amount.toString());
            const receivedAmount = parseFloat(orderAmount);

            console.log(
              `Amount comparison: Expected: ${expectedAmount} ${orderCurrency}, Got: ${receivedAmount} ${orderCurrency}`
            );

            if (
              Math.abs(receivedAmount - expectedAmount) > 0.01 ||
              orderCurrency !== "SAR"
            ) {
              console.error(
                `Payment amount/currency mismatch. Expected: ${expectedAmount} SAR, Got: ${receivedAmount} ${orderCurrency}`
              );
              paymentStatus = "declined"; // Use valid database status instead of AMOUNT_MISMATCH
              redirectUrl = "/payment-failed";
            } else if (status === "settled") {
              paymentStatus = "completed";
              redirectUrl = "/upload-resume";
            } else if (status === "declined") {
              paymentStatus = "declined";
              redirectUrl = "/payment-failed";
            } else if (status === "3ds") {
              paymentStatus = "3ds";
              redirectUrl = "/payment-failed";
            } else if (status === "redirect") {
              paymentStatus = "redirect";
              redirectUrl = "/payment-failed";
            } else if (status === "refund") {
              paymentStatus = "refund";
              redirectUrl = "/payment-failed";
            } else {
              // Unknown status, treat as failed
              paymentStatus = "declined"; // Use valid database status
              redirectUrl = "/payment-failed";
            }
          } else {
            console.error(
              "Payment response missing amount or currency information"
            );
            paymentStatus = "declined"; // Use valid database status instead of INVALID_RESPONSE
            redirectUrl = "/payment-failed";
          }
        } else {
          // Fallback: try to extract status from message
          if (response.message && response.message.includes("settled")) {
            paymentStatus = "completed";
            redirectUrl = "/upload-resume";
          } else {
            paymentStatus = "declined"; // Use valid database status
            redirectUrl = "/payment-failed";
          }
        }

        // Update payment order status in database
        const { error: updateError } = await supabaseServer
          .from("payment_orders")
          .update({
            status: paymentStatus,
            updated_at: new Date().toISOString(),
          })
          .eq("id", paymentId);

        if (updateError) {
          console.error("Failed to update payment order status:", updateError);
        }

        // Log the payment result for debugging
        console.log(
          `Payment ${paymentId} status: ${paymentStatus}, redirecting to: ${redirectUrl}`
        );
        console.log(
          `Payment details: Amount: ${responseData?.responseBody?.order?.amount} ${responseData?.responseBody?.order?.currency}, Status: ${responseData?.responseBody?.status}`
        );

        // update interview to link to payment order
        const { error: updateInterviewError } = await supabaseServer
          .from("interviews")
          .update({ payment_id: paymentId, payment_status: "completed" })
          .eq("id", payment_order.interview_id);

        if (updateInterviewError) {
          console.error("Failed to update interview:", updateInterviewError);
        }

        const url = process.env.NEXT_PUBLIC_APP_URL;
        // Redirect user based on payment status
        // ?paymentId=1234567890
        return NextResponse.redirect(
          new URL(
            `${redirectUrl}?paymentId=${paymentId}&interviewId=${payment_order.interview_id}`,
            url
          )
        );
      } catch (parseError) {
        console.error("Failed to parse payment status:", parseError);
        const url = process.env.NEXT_PUBLIC_APP_URL;

        // If we can't parse the status, redirect to payment failed
        return NextResponse.redirect(
          new URL(
            `/payment-failed?paymentId=${paymentId}&interviewId=${payment_order.interview_id}`,
            url
          )
        );
      }
    } else {
      // Payment status check failed, redirect to payment failed
      console.error("Payment status check failed:", response.message);
      const url = process.env.NEXT_PUBLIC_APP_URL;

      return NextResponse.redirect(
        new URL(
          `/payment-failed?paymentId=${paymentId}&interviewId=${payment_order.interview_id}`,
          url
        )
      );
    }
  } catch (error) {
    console.error("Payment callback error:", error);
    // On any error, redirect to payment failed
    const url = process.env.NEXT_PUBLIC_APP_URL;

    return NextResponse.redirect(new URL(`/payment-failed`, url));
  }
}
