"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

export default function ResumeResultPage() {
  const [text, setText] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    setText(sessionStorage.getItem("resumeText"));
    setEmail(sessionStorage.getItem("resumeEmail"));
  }, []);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 sm:p-8">
      <h1 className="text-xl sm:text-2xl font-bold mb-4 text-center">Resume Extraction Result</h1>
      {email && (
        <div className="mb-4 text-center sm:text-left">
          <span className="font-semibold text-sm sm:text-base">Email:</span> 
          <span className="font-mono text-sm sm:text-base ml-2">{email}</span>
        </div>
      )}
      {text ? (
        <pre className="bg-gray-100 dark:bg-gray-800 p-3 sm:p-4 rounded w-full max-w-2xl overflow-auto whitespace-pre-wrap mb-4 text-xs sm:text-sm leading-relaxed border border-gray-200 dark:border-gray-700">{text}</pre>
      ) : (
        <p className="text-center text-sm sm:text-base mb-4">No resume text found. Please upload your resume again.</p>
      )}
      <Link 
        href="/" 
        className="btn btn-primary mt-4 w-full max-w-xs mx-auto text-white font-medium rounded-lg text-sm px-5 py-2.5 text-center bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 transition-all duration-200"
      >
        Continue
      </Link>
    </div>
  );
} 