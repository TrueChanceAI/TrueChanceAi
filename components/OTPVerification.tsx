"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import OTPInput from "./OTPInput";
import { useVerifyOtp, useResendOtp } from "@/hooks/auth";
import { useRouter } from "next/navigation";

export default function OTPVerification() {
  const router = useRouter();
  const userId = localStorage.getItem("userId");
  const email = localStorage.getItem("email");

  const [otp, setOtp] = useState("");

  const { verifyOtp, isLoading: isVerifying } = useVerifyOtp();
  const { resendOtp, isLoading: isResending } = useResendOtp();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp || otp.length !== 6) {
      toast.error("Please enter a valid 6-digit OTP");
      return;
    }

    if (!userId) {
      toast.error("User ID not found. Please try registering again.");
      return;
    }

    try {
      await verifyOtp({ id: userId, otp });
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const onResend = async () => {
    if (!userId) {
      toast.error("User ID not found. Please try registering again.");
      return;
    }

    try {
      await resendOtp({ id: userId });
    } catch (error) {
      // Error handling is done in the hook
    }
  };

  const isLoading = isVerifying || isResending;

  if (!email || !userId) {
    router.push("/");
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-white">Verify Your Email</h1>
        <p className="text-white/70">
          We've sent a 6-digit verification code to{" "}
          <span className="text-purple-400 font-semibold">{email}</span>
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <Label className="text-white font-medium text-center block">
            Enter Verification Code
          </Label>

          {/* OTP Input Component */}
          <OTPInput
            value={otp}
            onChange={setOtp}
            disabled={isLoading}
            length={6}
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]"
          disabled={isLoading || otp.length !== 6}
        >
          {isVerifying ? (
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Verifying...
            </div>
          ) : (
            "Verify Email"
          )}
        </Button>
      </form>

      {/* Links */}
      <div className="text-center space-y-3">
        <div className="text-sm">
          <span className="text-white/70">Didn't receive the code? </span>
          <button
            type="button"
            onClick={onResend}
            className="text-purple-400 hover:text-purple-300 font-medium transition-colors"
            disabled={isLoading}
          >
            {isResending ? "Sending..." : "Resend"}
          </button>
        </div>
      </div>
    </div>
  );
}
