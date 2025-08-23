"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/hooks/useLanguage";
import { useRouter } from "next/navigation";

export interface IProps {
  isOpen: boolean;
  onClose: () => void;
  mode: "signin" | "signup";
  onModeChange?: (mode: "signin" | "signup") => void;
}

export function AuthModal({ isOpen, onClose, mode, onModeChange }: IProps) {
  const { t } = useLanguage();
  const router = useRouter();

  if (!isOpen) return null;

  const toggleMode = () => {
    // Call the parent callback to change mode
    if (onModeChange) {
      const newMode = mode === "signin" ? "signup" : "signin";
      onModeChange(newMode);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-zinc-900 rounded-2xl p-8 flex flex-col gap-6 min-w-[400px] max-w-[500px] relative shadow-xl mx-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-white transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>

        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            {mode === "signup" ? t("auth.createAccount") : t("auth.signIn")}
          </h2>
          <p className="text-zinc-400">
            {mode === "signup"
              ? t("auth.signUpToGetStarted")
              : t("auth.signInToContinue")}
          </p>
        </div>

        <div className="flex justify-center">
          <Button
            type="button"
            onClick={() => {
              const href = mode === "signup" ? "/signup" : "/signin";
              onClose();
              router.push(href);
            }}
            className="w-full max-w-xs bg-gradient-to-br from-purple-600 to-blue-500 hover:from-purple-700 hover:to-blue-600 text-white font-medium py-3 px-6 rounded-lg text-center transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            {mode === "signup" ? t("auth.createAccount") : t("auth.signIn")}
          </Button>
        </div>

        <div className="text-center text-sm">
          <span className="text-zinc-400">
            {mode === "signup"
              ? t("auth.alreadyHaveAccount")
              : t("auth.dontHaveAccount")}
          </span>
          <button
            type="button"
            onClick={toggleMode}
            className="ml-1 text-purple-400 hover:text-purple-300 font-medium transition-colors"
          >
            {mode === "signup" ? t("auth.signIn") : t("auth.signUp")}
          </button>
        </div>
      </div>
    </div>
  );
}
