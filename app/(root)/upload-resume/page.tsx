"use client";
import { useState } from "react";
import React, { useRef } from "react";
import { useEffect } from "react";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import PaymentForm from "@/components/PaymentForm";
import PaymentSuccessModal from "@/components/PaymentSuccessModal";
import { useCreateInterview } from "@/hooks/interview";
import UploadResumeForm from "@/components/UploadResumeForm";

function UploadResumeContent() {
  // New payment-related states
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [currentPaymentId, setCurrentPaymentId] = useState("");
  const [currentInterviewId, setCurrentInterviewId] = useState("");
  // Check for payment success redirect
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const paymentId = urlParams.get("paymentId");

    if (paymentId) {
      setCurrentPaymentId(paymentId);
      setShowSuccessModal(true);
    }
  }, []);

  // Handle payment success
  const handlePaymentSuccess = (paymentId: string) => {
    setCurrentPaymentId(paymentId);
    setShowPaymentForm(false);
    
    // Redirect to interview page with both interviewId and paymentId
    if (currentInterviewId) {
      window.location.href = `/interview?interviewId=${currentInterviewId}&paymentId=${paymentId}`;
    }
  };

  const handleInterviewCreated = (interviewId: string) => {
    setCurrentInterviewId(interviewId);
    // Show payment form to complete the interview setup
    setShowPaymentForm(true);
  };

  // Handle closing payment form
  const handleClosePaymentForm = () => {
    setShowPaymentForm(false);
  };

  return (
    <ProtectedRoute>
      <div className="flex min-h-screen items-start justify-center bg-transparent p-4 pt-0">
        {/*  */}
        <UploadResumeForm onInterviewCreated={handleInterviewCreated} />

        {/* Payment Form Modal */}
        {showPaymentForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-md">
              <PaymentForm
                onPaymentSuccess={handlePaymentSuccess}
                onPaymentError={() => {}}
                onClose={handleClosePaymentForm}
                interviewId={currentInterviewId}
              />
            </div>
          </div>
        )}

        {/* Payment Success Modal */}
        {showSuccessModal && (
          <PaymentSuccessModal
            paymentId={currentPaymentId}
            onClose={() => setShowSuccessModal(false)}
          />
        )}
      </div>
    </ProtectedRoute>
  );
}

export default function UploadResumePage() {
  return <UploadResumeContent />;
}
