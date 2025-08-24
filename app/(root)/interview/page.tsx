"use client";
import Agent from "@/components/Agent";
import { getInterviewerConfig } from "@/constants";
import { useLanguage } from "@/hooks/useLanguage";
import { useSearchParams } from "next/navigation";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { useGetInterviewById } from "@/hooks/interview";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function InterviewProtectedRoute({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const interviewId = searchParams.get("interviewId");
  const paymentId = searchParams.get("paymentId");
  const router = useRouter();
  const user = useSelector((s: RootState) => s.me.user);

  const {
    interview,
    isLoading: isLoadingInterview,
    isError: isErrorInterview,
  } = useGetInterviewById(interviewId as string);

  // Redirect if missing required parameters
  useEffect(() => {
    if (!interviewId) {
      console.log("Missing interviewId:", interviewId);
      console.log("redirecting to upload resume");
      router.push("/upload-resume");
      return;
    }
    
    // Check for payment ID requirement
    if (!paymentId) {
      console.log("Missing paymentId:", paymentId);
      console.log("redirecting to upload resume");
      router.push("/upload-resume");
      return;
    }
  }, [interviewId, paymentId, router]);

  if (isLoadingInterview) {
    return (
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
            Loading interview...
          </span>
        </div>
      </div>
    );
  }

  // Check if user and interview exist
  if (!user || !interview) {
    return null;
  }

  // Check if payment IDs match
  if (interview.payment_id && paymentId !== interview.payment_id) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="bg-zinc-900 rounded-2xl p-6 sm:p-8 flex flex-col items-center gap-4 min-w-[280px] sm:min-w-[320px] relative shadow-xl mx-4">
          <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white text-center">
            Payment Mismatch
          </h2>
          <p className="text-sm text-gray-300 text-center">
            The payment ID doesn't match this interview. Please use the correct
            payment link.
          </p>
          <button
            onClick={() => router.push("/upload-resume")}
            className="mt-2 px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            Go to Upload Resume
          </button>
        </div>
      </div>
    );
  }

  // Check payment status
  console.log("🔍 Payment validation debug:", {
    interviewId: interview.id,
    paymentId: interview.payment_id,
    paymentStatus: interview.payment_status,
    interviewData: interview
  });

  if (interview.payment_status !== "completed") {
    console.log("❌ Payment not completed:", interview.payment_status);
    
    // If we have a payment ID but the status is not completed, log the mismatch
    if (interview.payment_id) {
      console.log("🔍 Payment ID exists but status mismatch:", {
        paymentId: interview.payment_id,
        interviewStatus: interview.payment_status,
        expectedStatus: "completed"
      });
    }
    
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="bg-zinc-900 rounded-2xl p-6 sm:p-8 flex flex-col items-center gap-4 min-w-[280px] sm:min-w-[320px] relative shadow-xl mx-4">
          <div className="w-16 h-16 bg-yellow-900/20 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-yellow-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white text-center">
            Payment Required
          </h2>
          <p className="text-sm text-gray-300 text-center">
            {interview.payment_status === "pending"
              ? "Your payment is still being processed. Please wait for confirmation."
              : `Payment is required to access this interview. Current status: ${interview.payment_status}`}
          </p>
          <button
            onClick={() => router.push("/upload-resume")}
            className="mt-2 px-6 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors"
          >
            Go to Upload Resume
          </button>
        </div>
      </div>
    );
  }

  console.log("✅ Payment validation passed - interview should be accessible");

  // Check if interview is already conducted (handle both string and boolean types)
  const isConducted = String(interview.is_conducted).toLowerCase() === "true";
  if (isConducted) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="bg-zinc-900 rounded-2xl p-6 sm:p-8 flex flex-col items-center gap-4 min-w-[280px] sm:min-w-[320px] relative shadow-xl mx-4">
          <div className="w-16 h-16 bg-blue-900/20 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-blue-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white text-center">
            Interview Completed
          </h2>
          <p className="text-sm text-gray-300 text-center">
            This interview has already been conducted. You can view your results
            and feedback.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/interview/${interview.id}/feedback`)}
              className="px-6 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              View Feedback
            </button>
            <button
              onClick={() => router.push("/upload-resume")}
              className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              New Interview
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check if interview has started but not completed
  if (
    interview.transcript &&
    interview.transcript !== "Interview not started" &&
    !isConducted
  ) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="bg-zinc-900 rounded-2xl p-6 sm:p-8 flex flex-col items-center gap-4 min-w-[280px] sm:min-w-[320px] relative shadow-xl mx-4">
          <div className="w-16 h-16 bg-orange-900/20 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-orange-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white text-center">
            Interview In Progress
          </h2>
          <p className="text-sm text-gray-300 text-center">
            This interview has been started but not completed. You can continue
            from where you left off.
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => router.push(`/interview/${interview.id}`)}
              className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors"
            >
              Continue Interview
            </button>
            <button
              onClick={() => router.push("/upload-resume")}
              className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              New Interview
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Check if user is authorized to access this interview
  if (interview.user_id && user.id && interview.user_id !== user.id) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="bg-zinc-900 rounded-2xl p-6 sm:p-8 flex flex-col items-center gap-4 min-w-[280px] sm:min-w-[320px] relative shadow-xl mx-4">
          <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white text-center">
            Access Denied
          </h2>
          <p className="text-sm text-gray-300 text-center">
            You are not authorized to access this interview. Please use your own
            interview link.
          </p>
          <button
            onClick={() => router.push("/upload-resume")}
            className="mt-2 px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            Go to Upload Resume
          </button>
        </div>
      </div>
    );
  }

  // Check if interview questions exist
  if (
    !interview.interview_questions ||
    interview.interview_questions.length === 0
  ) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="bg-zinc-900 rounded-2xl p-6 sm:p-8 flex flex-col items-center gap-4 min-w-[280px] sm:min-w-[320px] relative shadow-xl mx-4">
          <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-white text-center">
            Interview Not Ready
          </h2>
          <p className="text-sm text-gray-300 text-center">
            Interview questions are not available. Please contact support.
          </p>
          <button
            onClick={() => router.push("/upload-resume")}
            className="mt-2 px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            Go to Upload Resume
          </button>
        </div>
      </div>
    );
  }

  if (isErrorInterview) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
        <div className="bg-zinc-900 rounded-2xl p-6 sm:p-8 flex flex-col items-center gap-4 min-w-[280px] sm:min-w-[320px] relative shadow-xl mx-4">
          <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center">
            <svg
              className="w-8 h-8 text-red-500"
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
          </div>
          <h2 className="text-xl font-bold text-white text-center">
            Error Loading Interview
          </h2>
          <p className="text-sm text-gray-300 text-center">
            There was a problem loading the interview. Please try again later.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-2 px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function InterviewPageContent() {
  const searchParams = useSearchParams();
  const interviewId = searchParams.get("interviewId");
  const { interview, isLoading } = useGetInterviewById(interviewId as string);

  const { t } = useLanguage();

  // Show loading state if interview is still loading
  if (isLoading || !interview) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-gray-200 dark:border-gray-700 rounded-full animate-spin mx-auto mb-4">
            <div className="w-full h-full border-4 border-transparent border-t-purple-500 rounded-full"></div>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Loading interview...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-0">
      <div className="mb-6">
        <h3 className="text-xl sm:text-2xl font-semibold mb-2">
          {t("interview.title")}
        </h3>
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <span>Candidate: {interview.candidate_name}</span>
          <span>Language: {interview.language?.toUpperCase()}</span>
          <span>Duration: {interview.duration || "N/A"}</span>
        </div>
      </div>

      <Agent
        interviewId={interviewId || ""}
        questions={interview.interview_questions}
        type="interview"
        userName={interview.candidate_name || ""}
        interviewerConfig={getInterviewerConfig(
          interview.language,
          interview.candidate_name
        )}
      />
    </div>
  );
}

export default function InterviewPage() {
  return (
    <InterviewProtectedRoute>
      <InterviewPageContent />
    </InterviewProtectedRoute>
  );
}
