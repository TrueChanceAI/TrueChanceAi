import { IAddress } from "@/types/common";
import { IUser } from "@/types/me";
import crypto from "crypto";

export interface EDFAPaymentInitiateRequest {
  action: string;
  edfa_merchant_id: string;
  order_id: string;
  order_amount: string;
  order_currency: string;
  order_description: string;
  req_token: string;
  payer_first_name: string;
  payer_last_name: string;
  payer_address: string;
  payer_country: string;
  payer_city: string;
  payer_zip: string;
  payer_email: string;
  payer_phone: string;
  payer_ip: string;
  term_url_3ds: string;
  auth: string;
  recurring_init: string;
  hash: string;
}

export interface EDFAPaymentStatusRequest {
  order_id: string;
  merchant_id: string;
  hash: string;
}

export interface EDFAPaymentResponse {
  success: boolean;
  message: string;
  redirectUrl?: string;
  data?: any; // Added for new functionality
}

export interface EDFAPaymentData {
  user: IUser;
  address: IAddress;
  amount: number;
  description: string;
  paymentId: string;
  ip: string;
}

export class EDFAPayment {
  private merchantId: string;
  private password: string;
  private callbackUrl: string;
  private baseUrl: string;

  constructor() {
    this.merchantId = process.env.EDFA_MERCHANT_KEY || "";
    this.password = process.env.EDFA_PASSWORD || "";
    this.callbackUrl = process.env.EDFA_CALLBACK_URL || "";
    this.baseUrl = "https://api.edfapay.com";

    if (!this.merchantId || !this.password) {
      throw new Error("EDFA credentials not configured");
    }
  }

  /**
   * Generate hash for initiate payment
   * sha1(md5(strtoupper(id.order.amount.currency.description.PASSWORD)))
   */
  private generateInitiateHash(payload: string): string {
    const md5Hash = crypto
      .createHash("md5")
      .update(payload.toUpperCase())
      .digest("hex");
    return crypto.createHash("sha1").update(md5Hash).digest("hex");
  }

  /**
   * Generate hash for status check
   * sha1(md5(strtoupper(payment.id + amount + merchant.pass)))
   */
  private generateStatusHash(orderId: string, amount: number): string {
    const toMd5 = `${orderId}${amount}${this.password}`;
    const md5Hash = crypto
      .createHash("md5")
      .update(toMd5.toUpperCase())
      .digest("hex");
    return crypto.createHash("sha1").update(md5Hash).digest("hex");
  }

  /**
   * Initiate payment with EDFA
   */
  async initiatePayment(
    paymentData: EDFAPaymentData
  ): Promise<EDFAPaymentResponse> {
    try {
      // Var to_md5 = order.number + order.amount + order.currency + order.description + merchant.pass;
      const payload = `${paymentData.paymentId}${paymentData.amount}SAR${paymentData.description}${this.password}`;
      const hash = this.generateInitiateHash(payload);
      const term_url_3ds = `${this.callbackUrl}?paymentId=${paymentData.paymentId}`;

      const paymentRequest: EDFAPaymentInitiateRequest = {
        action: "SALE",
        edfa_merchant_id: this.merchantId,
        order_id: paymentData.paymentId,
        order_amount: paymentData.amount.toString(),
        order_currency: "SAR",
        order_description: paymentData.description,
        req_token: "N",
        payer_first_name: paymentData.user.firstName,
        payer_last_name: paymentData.user.lastName,
        payer_address: paymentData.address.address,
        payer_country: paymentData.address.country,
        payer_city: paymentData.address.city,
        payer_zip: paymentData.address.zip,
        payer_email: paymentData.user.email,
        payer_phone: paymentData.user.phoneNumber,
        payer_ip: paymentData.ip,
        term_url_3ds,
        auth: "N",
        recurring_init: "N",
        hash: hash,
      };

      // Create form data for the request
      const formData = new FormData();
      Object.entries(paymentRequest).forEach(([key, value]) => {
        formData.append(key, value);
      });

      // Make request to EDFA
      const response = await fetch(`${this.baseUrl}/payment/initiate`, {
        method: "POST",
        body: formData,
      });

      let responseData: any;
      let rawText: string | undefined;
      try {
        // Check if response is JSON
        const contentType = response.headers.get("content-type") || "";
        if (contentType.includes("application/json")) {
          responseData = await response.json();
        } else {
          // Handle non-JSON responses (EDFA sometimes returns text containing JSON with redirect_url)
          rawText = await response.text();
          try {
            responseData = JSON.parse(rawText);
          } catch {
            responseData = undefined;
          }
        }
      } catch (parseError) {
        console.error("Failed to parse EDFA API response:", parseError);
        return {
          success: false,
          message: "Invalid response format from payment gateway",
        };
      }

      // Extract redirect URL from possible shapes
      let redirectUrl: string | undefined =
        responseData?.data?.redirect_url || responseData?.redirect_url;

      // If still not found, try to pull from raw text
      if (!redirectUrl && rawText) {
        const match = rawText.match(/\"redirect_url\"\s*:\s*\"([^\"]+)\"/i);
        if (match && match[1]) {
          redirectUrl = match[1];
        }
      }

      if (response.ok && redirectUrl) {
        return {
          success: true,
          message: "Payment initiated successfully",
          redirectUrl,
        };
      }

      return {
        success: false,
        message:
          responseData?.message || rawText || "Failed to initiate payment",
      };
    } catch (error) {
      console.error("EDFA payment initiation error:", error);
      return {
        success: false,
        message: "Internal server error during payment initiation",
      };
    }
  }

  /**
   * Check payment status with EDFA
   */
  async checkPaymentStatus(
    orderId: string,
    amount: number
  ): Promise<EDFAPaymentResponse> {
    try {
      const hash = this.generateStatusHash(orderId, amount);

      const statusRequest: EDFAPaymentStatusRequest = {
        order_id: orderId,
        merchant_id: this.merchantId,
        hash: hash,
      };

      const response = await fetch(`${this.baseUrl}/payment/status`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(statusRequest),
      });

      let responseData;
      try {
        // Check if response is JSON
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          responseData = await response.json();
          console.log("EDFA Payment Status Response:", responseData);
        } else {
          // Handle non-JSON responses (like error messages)
          const textResponse = await response.text();
          console.error("EDFA API returned non-JSON response:", textResponse);
          return {
            success: false,
            message: textResponse || "Invalid response from payment gateway",
          };
        }
      } catch (parseError) {
        console.error("Failed to parse EDFA API response:", parseError);
        return {
          success: false,
          message: "Invalid response format from payment gateway",
        };
      }

      if (response.ok && responseData) {
        // Extract the payment status from the response
        const paymentStatus =
          responseData.responseBody?.status || responseData.status;

        if (paymentStatus) {
          return {
            success: true,
            message: `Payment status: ${paymentStatus}`,
            // Include the full response data for the callback to use
            data: responseData,
          };
        } else {
          return {
            success: false,
            message: "Payment status not found in response",
          };
        }
      } else {
        return {
          success: false,
          message: responseData?.message || "Failed to get payment status",
        };
      }
    } catch (error) {
      console.error("EDFA payment status error:", error);
      return {
        success: false,
        message: "Internal server error during status check",
      };
    }
  }

  /**
   * Validate callback from EDFA
   */
  validateCallback(callbackData: any): boolean {
    try {
      // Extract required fields from callback
      const { order_id, amount, currency, status, hash } = callbackData;

      if (!order_id || !amount || !currency || !status || !hash) {
        return false;
      }

      // Generate hash to validate callback
      const expectedHash = this.generateStatusHash(order_id, amount);

      return expectedHash === hash;
    } catch (error) {
      console.error("EDFA callback validation error:", error);
      return false;
    }
  }

  extractOrderId(url: string): string | null {
    try {
      const parsedUrl = new URL(url);
      const segments = parsedUrl.pathname.split("/").filter(Boolean);
      // Find the segment after "checkout"
      const checkoutIndex = segments.indexOf("checkout");
      if (checkoutIndex !== -1 && checkoutIndex + 1 < segments.length) {
        return segments[checkoutIndex + 1];
      }
      return null;
    } catch {
      return null; // invalid URL
    }
  }

  /**
   * Get merchant configuration
   */
  getConfig() {
    return {
      merchantId: this.merchantId,
      callbackUrl: this.callbackUrl,
      baseUrl: this.baseUrl,
    };
  }
}

// Export singleton instance
export const edfaPayment = new EDFAPayment();
