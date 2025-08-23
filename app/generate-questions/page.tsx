"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function GenerateQuestionsPage() {
  const [resumeText, setResumeText] = useState<string | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  // Get selected language from sessionStorage
  const language = typeof window !== "undefined" ? sessionStorage.getItem("interviewLanguage") || "en" : "en";
  const config = language === "ar"
    ? {
        model: "eleven_turbo_v2_5",
        language: "ar",
        voiceProvider: "11labs",
        voiceId: "vgsapVXnlLvlrWNbPs6y",
        transcriber: {
          model: "scribe_v1",
          language: "ar",
          provider: "11labs",
        },
      }
    : {
        model: "nova-2",
        language: "en",
        voiceProvider: "azure",
        voiceId: "en-US-AriaNeural",
      };

  useEffect(() => {
    const text = sessionStorage.getItem("resumeText");
    setResumeText(text);
    if (text) {
      generateQuestions(text, language);
    }
  }, []);

  async function generateQuestions(resume: string, language: string) {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resume, language }),
      });
      if (!res.ok) throw new Error("Failed to generate questions.");
      const data = await res.json();
      setQuestions(data.questions || []);
      sessionStorage.setItem("interviewQuestions", JSON.stringify(data.questions || []));
    } catch (err: any) {
      setError(err.message || "An error occurred.");
    } finally {
      setLoading(false);
    }
  }

  const handleStartInterview = () => {
    router.push("/interview");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-8">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 text-center">Generated Interview Questions</h1>
      {loading && (
        <div className="text-center">
          <p className="text-base sm:text-lg mb-4">Generating questions from your resume...</p>
          <div className="flex justify-center">
            <svg aria-hidden="true" className="inline w-8 h-8 text-gray-200 animate-spin dark:text-gray-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#6b7280"/>
              <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="#9333ea"/>
            </svg>
          </div>
        </div>
      )}
      {error && <p className="text-red-500 mb-4 text-center text-sm sm:text-base">{error}</p>}
      {!loading && questions.length > 0 && (
        <>
          <ul className="mb-6 list-disc list-inside max-w-2xl space-y-2 px-4 sm:px-0">
            {questions.map((q, i) => (
              <li key={i} className="mb-3 text-sm sm:text-base leading-relaxed">{q}</li>
            ))}
          </ul>
          <button 
            className="btn btn-primary w-full max-w-xs mx-auto text-white font-medium rounded-lg text-sm px-5 py-2.5 text-center bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 transition-all duration-200" 
            onClick={handleStartInterview}
          >
            Start Interview
          </button>
        </>
      )}
    </div>
  );
} 