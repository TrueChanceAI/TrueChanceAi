"use client";

import React, { useState } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { AddressValidationSchema } from "@/validation/common.validation";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { useInitiatePayment } from "@/hooks/payment";
import { IAddress } from "@/types/common";
import { getUserIP } from "@/utils/getIP";

interface PaymentFormProps {
  onPaymentSuccess: (paymentId: string) => void;
  onPaymentError: (error: string) => void;
  onClose: () => void;
  interviewId: string;
}

const PaymentForm: React.FC<PaymentFormProps> = ({
  onPaymentSuccess,
  onPaymentError,
  onClose,
  interviewId,
}) => {
  const { initiatePayment, isLoading, isSuccess, isError, error } =
    useInitiatePayment();

  const user = useSelector((state: RootState) => state.me.user);
  const [paymentError, setPaymentError] = useState<string>("");

  const handleSubmit = async (values: IAddress) => {
    if (!user) {
      onPaymentError("User not authenticated");
      return; // Don't close modal, just show error
    }

    try {
      if (!interviewId) {
        throw new Error("Interview not initialized");
      }

      const userIP = await getUserIP();
      console.log(userIP);

      initiatePayment({
        interviewId,
        address: values,
        userIP,
      }).then((response) => {
        if (response.success && response.redirectUrl) {
          // Store payment ID for later use
          const paymentId =
            response.redirectUrl.split("paymentId=")[1] || "unknown";

          // Clear any previous errors
          setPaymentError("");

          // Notify parent in case it needs to track the payment id
          try {
            onPaymentSuccess(paymentId);
          } catch {}

          // Redirect to payment gateway
          window.location.href = response.redirectUrl;
        } else {
          throw new Error("Invalid payment response");
        }
      });
    } catch (error: any) {
      console.error("Payment error:", error);
      setPaymentError(error.message || "Payment failed");
      onPaymentError(error.message || "Payment failed");
    }
  };

  const initialValues: IAddress = {
    address: "",
    city: "",
    country: "",
    zip: "",
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl">
      {/* Payment Header */}
      <div className="text-center p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Complete Your Interview
        </h2>
        <p className="text-gray-600 dark:text-gray-300">
          Your resume has been processed successfully!
        </p>

        {/* Pricing Display */}
        <div className="mt-4 flex items-center justify-center gap-3">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            $49
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400 line-through">
            $99
          </span>
          <span className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 text-xs font-medium px-2 py-1 rounded-full">
            50% OFF
          </span>
        </div>
      </div>

      {/* Address Form */}
      <div className="p-6">
        {/* Error Display */}
        {paymentError && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">
              ⚠️ {paymentError}
            </p>
          </div>
        )}

        <Formik
          initialValues={initialValues}
          validationSchema={AddressValidationSchema}
          onSubmit={handleSubmit}
          onReset={() => setPaymentError("")}
        >
          {({ isValid, dirty, touched, errors, setFieldTouched }) => (
            <Form className="space-y-4">
              {/* Address Field */}
              <div>
                <label
                  htmlFor="address"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  Street Address
                </label>
                <Field
                  as="textarea"
                  id="address"
                  name="address"
                  rows={2}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 text-sm ${
                    touched.address && errors.address
                      ? "border-red-500 dark:border-red-400"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  placeholder="Enter your complete street address"
                />
                <ErrorMessage
                  name="address"
                  component="div"
                  className="mt-1 text-xs text-red-600 dark:text-red-400"
                />
              </div>

              {/* City and Country Row */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="city"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    City
                  </label>
                  <Field
                    type="text"
                    id="city"
                    name="city"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 text-sm ${
                      touched.city && errors.city
                        ? "border-red-500 dark:border-red-400"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                    placeholder="City"
                  />
                  <ErrorMessage
                    name="city"
                    component="div"
                    className="mt-1 text-xs text-red-600 dark:text-red-400"
                  />
                </div>

                <div>
                  <label
                    htmlFor="country"
                    className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                  >
                    Country
                  </label>
                  <Field
                    type="text"
                    id="country"
                    name="country"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 text-sm ${
                      touched.country && errors.country
                        ? "border-red-500 dark:border-red-400"
                        : "border-gray-300 dark:border-gray-600"
                    }`}
                    placeholder="Country"
                  />
                  <ErrorMessage
                    name="country"
                    component="div"
                    className="mt-1 text-xs text-red-600 dark:text-red-400"
                  />
                </div>
              </div>

              {/* ZIP Code */}
              <div>
                <label
                  htmlFor="zip"
                  className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                >
                  ZIP/Postal Code
                </label>
                <Field
                  type="text"
                  id="zip"
                  name="zip"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 text-sm ${
                    touched.zip && errors.zip
                      ? "border-red-500 dark:border-red-400"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  placeholder="ZIP code"
                />
                <ErrorMessage
                  name="zip"
                  component="div"
                  className="mt-1 text-xs text-red-600 dark:text-red-400"
                />
              </div>

              {/* Payment Button */}
              <button
                type="submit"
                disabled={!isValid || !dirty || isLoading}
                className="w-full py-3 px-4 text-white font-semibold rounded-lg transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-300 dark:focus:ring-red-600 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm"
                style={{ backgroundColor: "#E53935" }}
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                    Processing...
                  </div>
                ) : (
                  "Unlock Interview - $49"
                )}
              </button>

              {/* Close Button */}
              <button
                type="button"
                onClick={onClose}
                className="w-full py-2 px-4 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 text-sm"
              >
                Cancel
              </button>

              {/* Security Note */}
              <div className="text-center pt-2">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  🔒 Secure payment powered by EDFA Pay
                </p>
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default PaymentForm;
