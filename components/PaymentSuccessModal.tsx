"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLanguage } from "@/hooks/useLanguage";
import { useGetPaymentStatus } from "@/hooks/payment";

interface PaymentSuccessModalProps {
  paymentId: string;
  onClose: () => void;
}

const PaymentSuccessModal: React.FC<PaymentSuccessModalProps> = ({
  paymentId,
  onClose,
}) => {
  const router = useRouter();
  const { t } = useLanguage();

  const { paymentStatus, isLoading } = useGetPaymentStatus(paymentId);

  const [isStarting, setIsStarting] = useState(false);
  const searchParams = useSearchParams();
  const interviewId = searchParams.get("interviewId");

  const handleStartInterview = async () => {
    console.log("Start Interview button clicked!", { interviewId, paymentId });
    setIsStarting(true);

    // Small delay for better UX
    setTimeout(() => {
      console.log("Redirecting to interview...");
      router.push(
        `/interview?interviewId=${interviewId}&paymentId=${paymentId}`
      );
    }, 500);
  };

  if (paymentStatus && paymentStatus.status !== "completed") {
    router.push("/payment-failed");
  }

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 flex flex-col items-center gap-6 min-w-[320px] max-w-[400px] shadow-xl">
          {/* Loading Spinner */}
          <div className="relative">
            <div className="w-16 h-16 border-4 border-gray-200 dark:border-gray-700 rounded-full"></div>
            <div className="absolute top-0 left-0 w-16 h-16 border-4 border-transparent border-t-red-500 rounded-full animate-spin"></div>
          </div>

          {/* Loading Text */}
          <div className="text-center">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              Verifying Payment
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              Please wait while we confirm your payment...
            </p>
          </div>

          {/* Loading Dots */}
          <div className="flex space-x-2">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-red-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-red-500 rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl p-8 flex flex-col items-center gap-6 min-w-[320px] max-w-[400px] shadow-2xl border border-gray-100 dark:border-gray-700 animate-in fade-in-0 zoom-in-95 duration-300 relative"
        style={{
          position: "relative",
          zIndex: 10000,
          pointerEvents: "auto",
        }}
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-blue-500"></div>
        </div>
        {/* Success Icon with Animation */}
        <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900/30 dark:to-emerald-900/30 rounded-full flex items-center justify-center shadow-lg animate-pulse">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center shadow-inner">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>

        {/* Success Message */}
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Payment Successful! 🎉
          </h2>
          <p className="text-base text-gray-600 dark:text-gray-300 mb-4 leading-relaxed">
            Congratulations! Your interview has been successfully unlocked and
            is ready to begin.
          </p>
        </div>

        {/* Start Interview Button */}
        <div
          className="relative z-10 w-full"
          style={{ position: "relative", zIndex: 10 }}
        >
          <button
            onClick={handleStartInterview}
            onMouseEnter={() => console.log("Button hovered")}
            onMouseDown={() => console.log("Button mousedown")}
            onTouchStart={() => console.log("Button touch start")}
            disabled={isStarting}
            type="button"
            className="w-full py-4 px-6 text-white font-semibold rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-red-300 dark:focus:ring-red-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-base bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-md cursor-pointer"
            style={{
              position: "relative",
              pointerEvents: "auto",
              userSelect: "none",
              touchAction: "manipulation",
            }}
          >
            {isStarting ? (
              <div className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Starting Interview...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <svg
                  className="w-5 h-5 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Start Interview Now
              </div>
            )}
          </button>
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          type="button"
          className="relative z-10 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium transition-all duration-200 text-sm px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
          style={{ position: "relative", zIndex: 10 }}
        >
          <div className="flex items-center">
            <svg
              className="w-4 h-4 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
            Close
          </div>
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccessModal;
