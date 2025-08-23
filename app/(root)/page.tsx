"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/hooks/useLanguage";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { AuthModal } from "@/components/AuthModal";
import { event as gaEvent } from "@/lib/gtag";

function HomeContent() {
  const [loading, setLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const router = useRouter();
  const { t } = useLanguage();
  const user = useSelector((state: RootState) => state.me.user);

  const handleStart = () => {
    // Example: log a GA custom event for button click
    gaEvent({
      action: "click_start_upload",
      category: "engagement",
      label: "home_upload_button",
    });
    console.log("handleStart clicked, user:", user);
    if (!user) {
      // Show auth modal if not authenticated - default to signin
      console.log("No user, showing auth modal in signin mode");
      setAuthMode("signin");
      setShowAuthModal(true);
    } else {
      // Continue with upload flow if authenticated
      console.log("User authenticated, starting upload flow");
      startUploadFlow();
    }
  };

  const startUploadFlow = () => {
    setLoading(true);
    setTimeout(() => {
      router.push("/upload-resume");
    }, 600);
  };

  const handleAuthModalClose = () => {
    setShowAuthModal(false);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <div className="relative z-10 flex flex-col items-center w-full px-4 sm:px-0">
        {/* Remove the logo and TrueChance text above the robot image */}
        <Image
          src="/robot.png"
          alt="AI Interview Robot"
          width={200}
          height={200}
          className="mb-4 sm:mb-6 mt-2 w-48 h-48 sm:w-64 sm:h-64"
        />
        <h1 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4 text-center px-2">
          {t("home.title")}
        </h1>
        <p className="text-base sm:text-lg mb-4 sm:mb-6 text-center max-w-xl px-4">
          {t("home.subtitle")}
        </p>
        {loading && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-zinc-900 rounded-2xl p-6 sm:p-8 flex flex-col items-center gap-4 min-w-[280px] sm:min-w-[320px] relative shadow-xl mx-4">
              <svg
                aria-hidden="true"
                className="inline w-8 h-8 text-gray-200 animate-spin dark:text-gray-600 mb-4"
                viewBox="0 0 100 101"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                  fill="#6b7280"
                />
                <path
                  d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                  fill="#9333ea"
                />
              </svg>
              <span className="text-base sm:text-lg font-medium text-white text-center">
                {t("home.redirectingText")}
              </span>
            </div>
          </div>
        )}
        <button
          type="button"
          className="inline-flex items-center justify-center px-6 py-3 text-white font-medium rounded-lg text-sm text-center bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 transition-all duration-200"
          onClick={handleStart}
          disabled={loading}
        >
          {t("home.uploadButton")}
        </button>
      </div>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={handleAuthModalClose}
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </div>
  );
}

export default function Home() {
  return <HomeContent />;
}
