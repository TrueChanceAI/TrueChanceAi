"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { useLanguage } from "@/hooks/useLanguage";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { event as gaEvent } from "@/lib/gtag";

const PaymentFailed = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const paymentId = searchParams.get("paymentId");
  const { t, currentLang } = useLanguage();
  const user = useSelector((state: RootState) => state.me.user);
  const [loading, setLoading] = useState(false);

  // Track payment failure event
  useEffect(() => {
    gaEvent({
      action: "payment_failed",
      category: "payment",
      label: paymentId || "unknown",
    });
  }, [paymentId]);

  const handleTryAgain = () => {
    setLoading(true);
    gaEvent({
      action: "click_try_again",
      category: "payment",
      label: "payment_failed_page",
    });

    // Redirect to interview page to restart payment flow
    setTimeout(() => {
      router.push("/interview");
    }, 500);
  };

  const handleContactSupport = () => {
    gaEvent({
      action: "click_contact_support",
      category: "payment",
      label: "payment_failed_page",
    });

    // You can implement support contact logic here
    // For now, we'll open a mailto link
    const subject = encodeURIComponent("Payment Failed - Support Request");
    const body = encodeURIComponent(
      `Hello,\n\nI'm experiencing issues with my payment.\n\nPayment ID: ${
        paymentId || "N/A"
      }\nUser: ${
        user?.email || "Not logged in"
      }\n\nPlease help me resolve this issue.\n\nBest regards`
    );
    window.open(
      `mailto:support@truechance.com?subject=${subject}&body=${body}`
    );
  };

  const handleReturnHome = () => {
    setLoading(true);
    gaEvent({
      action: "click_return_home",
      category: "payment",
      label: "payment_failed_page",
    });

    setTimeout(() => {
      router.push("/");
    }, 500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800">
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-5 dark:opacity-10"
        style={{ top: "5rem" }}
      >
        <div className="absolute inset-0 bg-[url('/pattern.png')] bg-repeat opacity-20"></div>
      </div>

      {/* Main Content Container */}
      <div className="relative z-10 container mx-auto px-4 py-8 pt-24">
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
          {/* Main Content Card */}
          <div
            className="w-full max-w-2xl mx-auto"
            role="main"
            aria-labelledby="payment-failed-title"
          >
            {/* Error Icon */}
            <div className="flex justify-center mb-8" aria-hidden="true">
              <div className="relative">
                <div className="w-24 h-24 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
                  <svg
                    className="w-12 h-12 text-red-600 dark:text-red-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-label="Payment failed warning icon"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                </div>
                {/* Animated ring */}
                <div className="absolute inset-0 w-24 h-24 border-4 border-red-200 dark:border-red-800 rounded-full animate-ping opacity-20"></div>
              </div>
            </div>

            {/* Title and Subtitle */}
            <div className="text-center mb-8">
              <h1
                id="payment-failed-title"
                className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4"
              >
                {t("payment.failed.title")}
              </h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">
                {t("payment.failed.subtitle")}
              </p>
              <p className="text-base text-gray-500 dark:text-gray-400 max-w-lg mx-auto">
                {t("payment.failed.description")}
              </p>
            </div>

            {/* Payment ID Display */}
            {paymentId && (
              <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 mb-8 text-center border border-gray-200 dark:border-gray-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Payment Reference ID:
                </p>
                <p className="font-mono text-lg font-semibold text-gray-900 dark:text-white bg-white dark:bg-gray-700 px-3 py-2 rounded border break-all">
                  {paymentId}
                </p>
              </div>
            )}

            {/* What Happened Section */}
            <div
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 mb-8 shadow-lg border border-gray-100 dark:border-gray-700"
              role="region"
              aria-labelledby="what-happened-title"
            >
              <h2
                id="what-happened-title"
                className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center"
              >
                <svg
                  className="w-5 h-5 text-blue-600 dark:text-blue-400 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {t("payment.failed.whatHappened")}
              </h2>
              <div className="space-y-3">
                {t("payment.failed.reasons").map(
                  (reason: string, index: number) => (
                    <div key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-red-400 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-gray-600 dark:text-gray-300">
                        {reason}
                      </p>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Next Steps */}
            <div
              className="bg-blue-50 dark:bg-blue-900/20 rounded-2xl p-6 mb-8 border border-blue-100 dark:border-blue-800"
              role="region"
              aria-labelledby="next-steps-title"
            >
              <h3
                id="next-steps-title"
                className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-3"
              >
                {t("payment.failed.nextSteps")}
              </h3>
              <div className="space-y-3">
                {t("payment.failed.nextStepsList").map(
                  (step: string, index: number) => (
                    <div key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0"></div>
                      <p className="text-blue-800 dark:text-blue-200">{step}</p>
                    </div>
                  )
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div
              className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
              role="group"
              aria-label="Payment failure actions"
            >
              <button
                onClick={handleTryAgain}
                disabled={loading}
                className="flex-1 sm:flex-none px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                aria-label="Try payment again"
                aria-describedby="try-again-description"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
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
                    Processing...
                  </div>
                ) : (
                  t("payment.failed.tryAgainButton")
                )}
              </button>
              <span id="try-again-description" className="sr-only">
                Attempt to process the payment again
              </span>

              <button
                onClick={handleContactSupport}
                className="flex-1 sm:flex-none px-8 py-4 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-xl border-2 border-gray-200 dark:border-gray-600 transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-gray-300 dark:focus:ring-gray-600"
                aria-label="Contact customer support for help"
              >
                {t("payment.failed.contactSupportButton")}
              </button>
            </div>

            {/* Return Home Button */}
            <div className="text-center">
              <button
                onClick={handleReturnHome}
                disabled={loading}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 font-medium transition-colors duration-200 flex items-center justify-center mx-auto"
                aria-label="Return to home page"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 19l-7-7m0 0l7-7m-7 7h18"
                  />
                </svg>
                {t("payment.failed.returnHomeButton")}
              </button>
            </div>

            {/* Support Note */}
            <div className="text-center mt-8">
              <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
                {t("payment.failed.supportNote")}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 flex flex-col items-center gap-4 min-w-[320px] shadow-xl">
            <div className="w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
            <p className="text-lg font-medium text-gray-900 dark:text-white text-center">
              Redirecting...
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentFailed;
