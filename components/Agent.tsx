"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRef } from "react";

import { cn } from "@/lib/utils";
import { vapi } from "@/lib/vapi.sdk";
import { interviewer } from "@/constants";
import { createFeedback } from "@/lib/actions/general.action";
import { map } from "zod";
import dayjs from "dayjs";
import { CreateAssistantDTO } from "@vapi-ai/web/dist/api";
import { useLanguage } from "@/hooks/useLanguage";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { getToken } from "@/lib/token";

enum CallStatus {
  INACTIVE = "INACTIVE",
  CONNECTING = "CONNECTING",
  ACTIVE = "ACTIVE",
  FINISHED = "FINISHED",
}

interface SavedMessage {
  role: "user" | "system" | "assistant";
  content: string;
  words?: Array<{ word: string; start: number; end: number }>;
  timestamp?: string; // Added timestamp for duration calculation
}

// Add language to AgentProps
type AgentProps = {
  userName: string;
  userId?: string;
  interviewId?: string;
  feedbackId?: string;
  type: string;
  questions?: string[];
  language?: string;
  interviewerConfig?: CreateAssistantDTO;
};

// 45 minutes in milliseconds
const TIME_LIMIT = 45 * 60 * 1000;

const Agent = ({
  userName,
  userId,
  interviewId,
  feedbackId,
  type,
  questions,
  language: propLanguage,
  interviewerConfig,
}: AgentProps & {
  language?: string;
  interviewerConfig: CreateAssistantDTO;
}) => {
  const router = useRouter();
  const { t } = useLanguage();
  const sessionToken = useSelector((s: RootState) => s.me.sessionToken);

  const [callStatus, setCallStatus] = useState<CallStatus>(CallStatus.INACTIVE);
  const [messages, setMessages] = useState<SavedMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [lastMessage, setLastMessage] = useState<string>("");
  const [pauseAnalysis, setPauseAnalysis] = useState<any[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [tone, setTone] = useState<any>("");
  const [feedback, setFeedback] = useState<any>(null);
  const [loadingFeedback, setLoadingFeedback] = useState(false);
  const [showAnalysisSpinner, setShowAnalysisSpinner] = useState(false);
  const [showFeedbackCard, setShowFeedbackCard] = useState(false);
  const analysisTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [interviewStartTime, setInterviewStartTime] = useState<number | null>(
    null
  );
  const [loadingReturnDashboard, setLoadingReturnDashboard] = useState(false);
  const [loadingCall, setLoadingCall] = useState(false);
  const timeLimitRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const onCallStart = () => {
      console.log("📞 Call started - Setting up 1-minute timer...");
      setCallStatus(CallStatus.ACTIVE);
      setLoadingCall(false);
      setInterviewStartTime(Date.now());

      // Start the timer when the call begins
      timeLimitRef.current = setTimeout(() => {
        console.log("⏰ Timer fired - 1 minute reached!");

        // Use appropriate language message
        const endMessage =
          language === "ar"
            ? "يبدو أننا انتهينا من الوقت الآن. شكرًا جزيلًا على هذه المحادثة — لقد كانت ممتعة، وأتمنى لك كل التوفيق في المستقبل."
            : "It looks like we're out of time for now. Thank you so much for the conversation — I really appreciated it, and I wish you the best going forward.";

        vapi.say(endMessage, true);
      }, TIME_LIMIT);
    };

    const onCallEnd = () => {
      console.log("Call ended unexpectedly", {
        callStatus,
        messages: messages.length,
      });
      setCallStatus(CallStatus.FINISHED);

      // Clear the timer if call ends before time limit
      if (timeLimitRef.current) {
        clearTimeout(timeLimitRef.current);
        timeLimitRef.current = null;
      }
    };

    const onMessage = (message: any) => {
      console.log("Received message:", message);
      if (message.type === "transcript" && message.transcriptType === "final") {
        // Save words array if available
        const newMessage: SavedMessage = {
          role: message.role,
          content: message.transcript,
          words: message.words || [],
          timestamp: message.timestamp, // Store timestamp
        };
        setMessages((prev) => [...prev, newMessage]);
      }
    };

    const onSpeechStart = () => {
      console.log("speech start");
      setIsSpeaking(true);
    };

    const onSpeechEnd = () => {
      console.log("speech end");
      setIsSpeaking(false);
    };

    const onError = (error: any) => {
      console.error("VAPI Error:", error);
      
      // Handle specific error types
      if (error?.type === "ejected" && error?.msg === "Meeting has ended") {
        console.log("Call ended normally");
        setCallStatus(CallStatus.FINISHED);
        setLoadingCall(false);
        return;
      }
      
      // Handle audio-related errors
      if (error?.endedReason === "call.in-progress.error-assistant-did-not-receive-customer-audio") {
        console.error("❌ Microphone audio not detected by VAPI");
        alert("VAPI cannot hear your microphone. Please check:\n1. Microphone is not muted\n2. Microphone permissions are allowed\n3. Try speaking louder\n\nRefreshing the page...");
        setCallStatus(CallStatus.INACTIVE);
        setLoadingCall(false);
        window.location.reload();
        return;
      }
      
      // Handle other errors
      console.error("Unhandled VAPI error:", error);
      setCallStatus(CallStatus.INACTIVE);
      setLoadingCall(false);
    };

    vapi.on("call-start", onCallStart);
    vapi.on("call-end", onCallEnd);
    vapi.on("message", onMessage);
    vapi.on("speech-start", onSpeechStart);
    vapi.on("speech-end", onSpeechEnd);
    vapi.on("error", onError);

    return () => {
      vapi.off("call-start", onCallStart);
      vapi.off("call-end", onCallEnd);
      vapi.off("message", onMessage);
      vapi.off("speech-start", onSpeechStart);
      vapi.off("speech-end", onSpeechEnd);
      vapi.off("error", onError);

      // Clear timer on cleanup
      if (timeLimitRef.current) {
        clearTimeout(timeLimitRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      setLastMessage(messages[messages.length - 1].content);
    }

    const handleGenerateFeedback = async (messages: SavedMessage[]) => {
      // Only save feedback if interviewId and userId are present
      if (interviewId && userId) {
        const { success, feedbackId: id } = await createFeedback({
          interviewId,
          userId,
          transcript: messages,
          feedbackId,
        });

        console.log("Feedback creation result:", { success, id, interviewId });

        if (success && id) {
          console.log(
            "Redirecting to feedback page for interviewId:",
            interviewId
          );
          router.push(`/interview/${interviewId}/feedback`);
          return;
        } else {
          console.log("Error saving feedback");
        }
      } else {
        console.log("Missing interviewId or userId", { interviewId, userId });
      }
      // Do not redirect to home automatically; let user view analysis first
    };

    if (callStatus === CallStatus.FINISHED) {
      setShowAnalysisSpinner(true);
      const doAnalysisAndShowFeedback = async () => {
        const toneResult = await analyzePausesAndTone(messages);
        if (type === "generate") {
          // Save data after tone analysis is complete with the tone result
          await saveToSupabase(
            messages,
            { raw: "Generated interview completed." },
            toneResult
          );
          router.push("/");
        } else {
          await generateFeedback(messages, toneResult);
          setShowAnalysisSpinner(false);
          setShowFeedbackCard(true);
        }
      };
      doAnalysisAndShowFeedback();
    }
    if (callStatus === CallStatus.ACTIVE) {
      setLoadingCall(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, callStatus, feedbackId, interviewId, router, type, userId]);

  // Analyze pauses and tone
  async function analyzePausesAndTone(messages: SavedMessage[]) {
    setAnalyzing(true);
    // Gather all user messages with word-level timestamps
    const userWords = messages
      .filter((msg) => msg.role === "user" && msg.words && msg.words.length > 1)
      .map((msg) => msg.words!);
    // Analyze pauses for each answer
    let allPauses: any[] = [];
    userWords.forEach((words, idx) => {
      const pauses = analyzePauses(words);
      allPauses.push({ answer: idx + 1, pauses });
    });
    setPauseAnalysis(allPauses);
    // Analyze tone for all user answers (concatenated)
    const allText = messages
      .filter((msg) => msg.role === "user")
      .map((msg) => msg.content)
      .join("\n");
    const toneResult = await analyzeTone(allText);
    setTone(toneResult);
    setAnalyzing(false);
    return toneResult; // Return the tone result directly
  }

  // Pause analysis function
  function analyzePauses(
    words: { word: string; start: number; end: number }[],
    threshold = 1.5
  ) {
    let pauses = [];
    for (let i = 1; i < words.length; i++) {
      const gap = words[i].start - words[i - 1].end;
      if (gap > threshold) {
        pauses.push({ from: words[i - 1].word, to: words[i].word, gap });
      }
    }
    return pauses;
  }

  // Tone analysis using Gemini/OpenAI
  async function analyzeTone(text: string): Promise<any> {
    try {
      const token = sessionToken as string;
      const res = await fetch("/api/analyze-tone", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ text }),
      });
      if (!res.ok) return "Could not analyze tone.";
      const data = await res.json();
      if (typeof data.tone === "object") return data.tone;
      if (typeof data.tone === "string") {
        // Try to extract JSON from code block or 'json' prefix
        let str = data.tone.trim();
        // Remove code block markers and 'json' prefix
        if (str.startsWith("```")) {
          str = str
            .replace(/^```json|^```/i, "")
            .replace(/```$/, "")
            .trim();
        }
        if (str.toLowerCase().startsWith("json")) {
          str = str.replace(/^json/i, "").trim();
        }
        // Try to parse as JSON, otherwise return as string
        try {
          const parsed = JSON.parse(str);
          if (typeof parsed === "object" && parsed !== null) return parsed;
          return str;
        } catch {
          return str;
        }
      }
      return "No tone detected.";
    } catch {
      return "Could not analyze tone.";
    }
  }

  async function generateFeedback(messages: SavedMessage[], toneResult: any) {
    setLoadingFeedback(true);
    const MAX_CHARS = 8000;
    const transcriptText = messages
      .map((msg) => `${msg.role}: ${msg.content}`)
      .join("\n")
      .slice(0, MAX_CHARS);

    const token = await getToken();
    const res = await fetch("/api/interview-feedback", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ transcript: transcriptText }),
    });
    if (res.ok) {
      const data = await res.json();
      try {
        const feedbackData =
          typeof data.feedback === "string"
            ? JSON.parse(data.feedback)
            : data.feedback;
        setFeedback(feedbackData);

        // Save with the tone result directly
        await saveToSupabase(messages, feedbackData, toneResult);
      } catch {
        const feedbackData = { raw: data.feedback };
        setFeedback(feedbackData);

        // Save with the tone result directly
        await saveToSupabase(messages, feedbackData, toneResult);
      }
    } else {
      const feedbackData = { raw: "Could not generate feedback." };
      setFeedback(feedbackData);

      // Save with the tone result directly
      await saveToSupabase(messages, feedbackData, toneResult);
    }
    setLoadingFeedback(false);
  }

  // Calculate interview duration
  let interviewDuration = null;
  if (interviewStartTime) {
    let endTime = null;
    if (messages.length > 0 && messages[messages.length - 1].timestamp) {
      endTime = dayjs(messages[messages.length - 1].timestamp).valueOf();
    } else if (feedback?.createdAt) {
      endTime = dayjs(feedback.createdAt).valueOf();
    } else {
      endTime = Date.now();
    }
    const diff = dayjs(endTime).diff(dayjs(interviewStartTime), "minute");
    const seconds =
      dayjs(endTime).diff(dayjs(interviewStartTime), "second") % 60;
    interviewDuration = `${diff}m ${seconds}s`;
  }

  // Detect language from prop or sessionStorage (default to 'en')
  let language = propLanguage || "en";
  if (!propLanguage && typeof window !== "undefined") {
    language = sessionStorage.getItem("interviewLanguage") || "en";
  }

  // Use interviewerConfig for voice/transcriber/model
  const config = interviewerConfig;

  const handleCall = async () => {
    console.log("Starting call with config:", { type, questions, config });
    setInterviewStartTime(Date.now());
    setCallStatus(CallStatus.CONNECTING);
    setLoadingCall(true);

    try {
      if (type === "generate") {
        console.log("Starting generate call");
        // Use VAPI SDK directly (this was working before)
        await vapi.start(
          undefined,
          undefined,
          undefined,
          process.env.NEXT_PUBLIC_VAPI_WORKFLOW_ID!,
          {
            variableValues: {
              username: userName,
              userid: userId,
              ...config,
            },
          }
        );
        console.log("Generate call started successfully");
      } else {
        console.log("Starting interview call");
        let formattedQuestions = "";
        if (questions) {
          formattedQuestions = questions
            .map((question) => `- ${question}`)
            .join("\n");
        }
        console.log("Formatted questions:", formattedQuestions);

        // Use VAPI SDK directly (this was working before)
        await vapi.start(config, {
          variableValues: {
            questions: formattedQuestions,
            ...config,
          },
        });
        console.log("Interview call started successfully");
      }
      console.log("Call started successfully");
    } catch (error) {
      console.error("Error starting call:", error);
      setCallStatus(CallStatus.INACTIVE);
      setLoadingCall(false);
    }
  };

  const handleDisconnect = () => {
    setCallStatus(CallStatus.FINISHED);
    setShowAnalysisSpinner(true);
    vapi.stop();
  };

  // Function to save interview data to Supabase
  const saveToSupabase = async (
    messages: SavedMessage[],
    feedback: any,
    toneResult: any
  ) => {
    try {
      // Create transcript text
      const transcriptText = messages
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join("\n");

      // Get email and resume file content from sessionStorage
      const email = sessionStorage.getItem("resumeEmail") || "";
      const resumeFileContent =
        sessionStorage.getItem("resumeFileContent") || "";
      const resumeFileName =
        sessionStorage.getItem("resumeFileName") || "resume.pdf";
      const resumeFileType =
        sessionStorage.getItem("resumeFileType") || "application/pdf";
      const resumeText = sessionStorage.getItem("resumeText") || ""; // Get resume text for skills extraction

      // Debug: Log what we're getting from sessionStorage
      console.log("🔍 SessionStorage data:", {
        resumeEmail: email,
        hasResumeFile: !!resumeFileContent,
        resumeFileName,
        resumeFileType,
        hasResumeText: !!resumeText,
      });

      // Prepare tone data for storage - store the complete tone object
      let toneDataForStorage = null;
      if (toneResult) {
        if (typeof toneResult === "object" && !Array.isArray(toneResult)) {
          // Store the complete tone object with all fields
          toneDataForStorage = {
            confidence: toneResult.confidence || null,
            tone: toneResult.tone || null,
            energy: toneResult.energy || null,
            summary: toneResult.summary || null,
          };
        } else if (typeof toneResult === "string") {
          // If tone is a string, store it as is
          toneDataForStorage = toneResult;
        } else {
          // Fallback: convert to string
          toneDataForStorage = String(toneResult);
        }
      }

      // Get the extracted candidate name from sessionStorage for consistency
      const extractedCandidateName =
        sessionStorage.getItem("extractedCandidateName") || userName;

      // Get the initial interview_id from sessionStorage
      const initialInterviewId = sessionStorage.getItem("initialInterviewId");

      // Debug: Log what we got from sessionStorage
      console.log("🔍 SessionStorage interview ID data:", {
        initialInterviewId: initialInterviewId,
        initialInterviewIdType: typeof initialInterviewId,
        hasInitialInterviewId: !!initialInterviewId,
        allSessionKeys: Object.keys(sessionStorage),
      });

      // Debug: Log tone data structure
      console.log("🎭 Tone data structure:", {
        tone: toneDataForStorage,
        toneType: typeof toneDataForStorage,
        hasConfidence: !!toneDataForStorage?.confidence,
        confidenceType: typeof toneDataForStorage?.confidence,
        confidenceValue: toneDataForStorage?.confidence,
        hasTone: !!toneDataForStorage?.tone,
        hasEnergy: !!toneDataForStorage?.energy,
        hasSummary: !!toneDataForStorage?.summary
      });

      // Prepare data for Supabase
      const interviewData = {
        transcript: transcriptText,
        feedback: feedback,
        candidateName: extractedCandidateName, // Use extracted name for consistency
        duration: interviewDuration || "N/A",
        tone: toneDataForStorage, // Store the complete tone object
        language: language || "en",
        userId: userId || "anonymous",
        interviewId: initialInterviewId || interviewId, // Use initial ID if available, no fallback
        email: email,
        resumeFile: resumeFileContent, // Store the original file content for upload
        resumeFileName: resumeFileName, // Pass original filename
        resumeFileType: resumeFileType, // Pass content type
        resumeText: resumeText, // Pass resume text for skills extraction
      };

      console.log("📊 Saving interview data:", {
        candidateName: userName,
        duration: interviewDuration,
        tone: toneDataForStorage,
        email: email,
        hasResume: !!resumeFileContent,
        fileName: resumeFileName,
      });

      // Debug: Log the final interview data being sent
      console.log("📤 Sending interview data to API:", {
        email: interviewData.email,
        candidateName: interviewData.candidateName,
        hasTranscript: !!interviewData.transcript,
        hasFeedback: !!interviewData.feedback,
        hasResumeFile: !!interviewData.resumeFile,
        interviewId: interviewData.interviewId,
        interviewIdType: typeof interviewData.interviewId,
        userId: interviewData.userId
      });

      // Debug: Check if email is empty and why
      if (!interviewData.email) {
        console.error("❌ EMAIL IS EMPTY! SessionStorage contents:", {
          resumeEmail: sessionStorage.getItem("resumeEmail"),
          allKeys: Object.keys(sessionStorage),
        });
      }

      // Check if we have a valid interview ID
      if (!interviewData.interviewId) {
        console.error("❌ NO VALID INTERVIEW ID! Cannot save interview data.");
        console.error("SessionStorage contents:", {
          initialInterviewId: sessionStorage.getItem("initialInterviewId"),
          allKeys: Object.keys(sessionStorage),
        });
        return; // Don't proceed without a valid ID
      }

      // Get authentication token for API calls
      const token = await getToken();

      // Get user ID from token or use the one from props
      let finalUserId = userId || "unknown";
      if (token) {
        try {
          // Decode the JWT token to get user ID
          const tokenPayload = JSON.parse(atob(token.split('.')[1]));
          if (tokenPayload.sub || tokenPayload.user_id) {
            finalUserId = tokenPayload.sub || tokenPayload.user_id;
            console.log("🔐 Using user ID from JWT token:", finalUserId);
          }
        } catch (error) {
          console.log("⚠️ Could not decode JWT token, using props userId:", userId);
        }
      }

      // Update the interview data with the correct user ID
      interviewData.userId = finalUserId;

      // Log the user ID source
      console.log("🔐 User ID details:", {
        originalUserId: userId,
        finalUserId: finalUserId,
        source: finalUserId === userId ? "props" : "jwt_token"
      });

      // Send to API to save to Supabase
      const response = await fetch("/api/save-interview", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(interviewData),
      });

      if (response.ok) {
        console.log("✅ Interview data saved to Supabase successfully");
      } else {
        const errorData = await response.json();
        console.error("❌ Failed to save to Supabase:", errorData);
      }
    } catch (error) {
      console.error("Error saving to Supabase:", error);
    }
  };

  return (
    <>
      <div
        className="call-view"
        style={{
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
        }}
      >
        {/* AI Interviewer Card */}
        <div className="card-interviewer bg-black">
          <div className="avatar bg-black">
            <Image
              src="/logo.svg"
              alt="AI Interviewer Logo"
              width={65}
              height={54}
              className="object-cover"
            />
            {isSpeaking && <span className="animate-speak" />}
          </div>
          <h3>TrueChance</h3>
        </div>

        {/* User Profile Card */}
        <div className="card-border">
          <div className="card-content">
            <Image
              src="/user-avatar.png" // Replace with your own image path if you want a personal photo
              alt="profile-image"
              width={539}
              height={539}
              className="rounded-full object-cover size-[120px]"
            />
            <h3>{userName}</h3>
          </div>
        </div>
      </div>

      {messages.length > 0 && (
        <div className="transcript-border">
          <div className="transcript">
            <p
              key={lastMessage}
              className={cn(
                "transition-opacity duration-500 opacity-0",
                "animate-fadeIn opacity-100"
              )}
              style={{
                fontFamily:
                  language === "ar"
                    ? '"Cairo", "Host Grotesk", "Inter", "Poppins", "Roboto Mono", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif'
                    : 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif',
              }}
            >
              {lastMessage}
            </p>
          </div>
        </div>
      )}

      {/* After interview, show pause and tone analysis and feedback */}
      {showAnalysisSpinner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="bg-zinc-900 rounded-2xl p-8 flex flex-col items-center gap-4 min-w-[320px] relative shadow-xl">
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
            <span className="text-lg font-medium text-white">
              {t("interview.analyzingInterview")}
            </span>
          </div>
        </div>
      )}

      {/* Thank You Card Modal */}
      {showFeedbackCard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-2 sm:p-4">
          <div
            className="bg-zinc-900 rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-6 flex flex-col gap-3 sm:gap-4 w-full max-w-[95vw] sm:max-w-lg md:max-w-2xl lg:max-w-4xl xl:max-w-5xl h-[90vh] max-h-[90vh] relative shadow-xl animate-fade-in mx-2 sm:mx-4 overflow-hidden"
            style={{
              fontFamily:
                'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
            }}
          >
            {/* Header - Fixed */}
            <div className="text-center mb-3 sm:mb-4 flex-shrink-0">
              <div className="text-2xl sm:text-3xl md:text-4xl mb-2 sm:mb-3 md:mb-4">
                🎉
              </div>
              <span
                className="text-xl sm:text-2xl md:text-3xl font-bold mb-2 block"
                style={{ color: "#a78bfa" }}
              >
                {t("interview.thankYouTitle")}
              </span>
              <div className="text-center">
                <span className="text-xs sm:text-sm md:text-base text-light-200 mb-1 sm:mb-2 block">
                  Interview completed on:{" "}
                  {dayjs(feedback?.createdAt || Date.now()).format(
                    "MMMM D, YYYY h:mm A"
                  )}
                </span>
                {interviewDuration && (
                  <span className="text-xs sm:text-sm md:text-base text-light-200 mb-2 sm:mb-3 md:mb-4 block">
                    Duration: {interviewDuration}
                  </span>
                )}
              </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">

            {/* Actual Feedback Content */}
            {feedback && (
              <div className="mb-3 p-3 bg-zinc-800 rounded-lg">
                <h4 className="text-lg font-semibold text-purple-400 mb-3 text-center">
                  📝 Interview Feedback
                </h4>
                <div className="text-sm text-light-100 leading-relaxed space-y-3">
                  {/* Final Assessment - Most Important */}
                  {feedback.final_assessment && (
                    <div className="mb-4 p-3 bg-purple-900/20 rounded-lg border border-purple-500/30">
                      <h5 className="font-semibold text-purple-300 mb-2 text-center">🎯 Final Assessment</h5>
                      <p className="text-light-100 text-center">{feedback.final_assessment}</p>
                    </div>
                  )}

                  {/* Core Competencies Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {feedback.communication && (
                      <div className="p-2 bg-zinc-700/50 rounded-lg">
                        <h6 className="font-medium text-blue-400 mb-1 text-sm">💬 Communication</h6>
                        <p className="text-xs text-light-200 leading-tight">{feedback.communication}</p>
                      </div>
                    )}
                    
                    {feedback.analytical_thinking_problem_solving && (
                      <div className="p-2 bg-zinc-700/50 rounded-lg">
                        <h6 className="font-medium text-green-400 mb-1 text-sm">🧠 Analytical Thinking</h6>
                        <p className="text-xs text-light-200 leading-tight">{feedback.analytical_thinking_problem_solving}</p>
                      </div>
                    )}
                    
                    {feedback.technical_depth_accuracy && (
                      <div className="p-2 bg-zinc-700/50 rounded-lg">
                        <h6 className="font-medium text-yellow-400 mb-1 text-sm">⚡ Technical Depth</h6>
                        <p className="text-xs text-light-200 leading-tight">{feedback.technical_depth_accuracy}</p>
                      </div>
                    )}
                    
                    {feedback.adaptability_learning_mindset && (
                      <div className="p-2 bg-zinc-700/50 rounded-lg">
                        <h6 className="font-medium text-purple-400 mb-1 text-sm">🔄 Adaptability</h6>
                        <p className="text-xs text-light-200 leading-tight">{feedback.adaptability_learning_mindset}</p>
                      </div>
                    )}
                    
                    {feedback.motivation && (
                      <div className="p-2 bg-zinc-700/50 rounded-lg">
                        <h6 className="font-medium text-red-400 mb-1 text-sm">🔥 Motivation</h6>
                        <p className="text-xs text-light-200 leading-tight">{feedback.motivation}</p>
                      </div>
                    )}
                    
                    {feedback.confidence && (
                      <div className="p-2 bg-zinc-700/50 rounded-lg">
                        <h6 className="font-medium text-indigo-400 mb-1 text-sm">💪 Confidence</h6>
                        <p className="text-xs text-light-200 leading-tight">{feedback.confidence}</p>
                      </div>
                    )}
                    
                    {feedback.collaboration_teamwork && (
                      <div className="p-2 bg-zinc-700/50 rounded-lg">
                        <h6 className="font-medium text-teal-400 mb-1 text-sm">🤝 Collaboration</h6>
                        <p className="text-xs text-light-200 leading-tight">{feedback.collaboration_teamwork}</p>
                      </div>
                    )}
                    
                    {feedback.accountability_ownership && (
                      <div className="p-2 bg-zinc-700/50 rounded-lg">
                        <h6 className="font-medium text-orange-400 mb-1 text-sm">🎯 Accountability</h6>
                        <p className="text-xs text-light-200 leading-tight">{feedback.accountability_ownership}</p>
                      </div>
                    )}
                    
                    {feedback.cultural_fit_values_alignment && (
                      <div className="p-2 bg-zinc-700/50 rounded-lg">
                        <h6 className="font-medium text-pink-400 mb-1 text-sm">🏢 Cultural Fit</h6>
                        <p className="text-xs text-light-200 leading-tight">{feedback.cultural_fit_values_alignment}</p>
                      </div>
                    )}
                    
                    {feedback.leadership_influence && (
                      <div className="p-2 bg-zinc-700/50 rounded-lg">
                        <h6 className="font-medium text-cyan-400 mb-1 text-sm">👑 Leadership</h6>
                        <p className="text-xs text-light-200 leading-tight">{feedback.leadership_influence}</p>
                      </div>
                    )}
                    
                    {feedback.decision_making_quality && (
                      <div className="p-2 bg-zinc-700/50 rounded-lg">
                        <h6 className="font-medium text-lime-400 mb-1 text-sm">⚖️ Decision Making</h6>
                        <p className="text-xs text-light-200 leading-tight">{feedback.decision_making_quality}</p>
                      </div>
                    )}
                    
                    {feedback.time_management_prioritization && (
                      <div className="p-2 bg-zinc-700/50 rounded-lg">
                        <h6 className="font-medium text-amber-400 mb-1 text-sm">⏰ Time Management</h6>
                        <p className="text-xs text-light-200 leading-tight">{feedback.time_management_prioritization}</p>
                      </div>
                    )}
                    
                    {feedback.emotional_intelligence && (
                      <div className="p-2 bg-zinc-700/50 rounded-lg">
                        <h6 className="font-medium text-rose-400 mb-1 text-sm">❤️ Emotional Intelligence</h6>
                        <p className="text-xs text-light-200 leading-tight">{feedback.emotional_intelligence}</p>
                      </div>
                    )}
                  </div>

                  {/* Fallback for raw feedback if structured format fails */}
                  {feedback.raw && typeof feedback.raw === 'string' && (
                    <div className="mt-3 p-3 bg-zinc-700/50 rounded-lg">
                      <h5 className="font-semibold text-purple-400 mb-2">📋 Raw Feedback:</h5>
                      <p className="text-light-200 text-xs">{feedback.raw}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tone Analysis */}
            {tone && (
              <div className="mb-3 p-3 bg-zinc-800 rounded-lg">
                <h4 className="text-lg font-semibold text-purple-400 mb-3 text-center">
                  🎭 Tone Analysis
                </h4>
                <div className="text-sm text-light-100 leading-relaxed space-y-3">
                  {tone.confidence && (
                    <div className="text-center">
                      <span className="text-lg font-semibold text-blue-400">
                        {typeof tone.confidence === 'number' 
                          ? `${Math.round(tone.confidence * 100)}%`
                          : tone.confidence
                        }
                      </span>
                      <span className="text-light-200 ml-2">Confidence</span>
                    </div>
                  )}
                  
                  {tone.tone && (
                    <div className="text-center">
                      <span className="text-lg font-semibold text-orange-400">
                        {tone.tone}
                      </span>
                      <span className="text-light-200 ml-2">Primary Tone</span>
                    </div>
                  )}
                  
                  {tone.energy && (
                    <div className="text-center">
                      <span className="text-lg font-semibold text-green-400">
                        {tone.energy}
                      </span>
                      <span className="text-light-200 ml-2">Energy Level</span>
                    </div>
                  )}
                  
                  {tone.summary && (
                    <div>
                      <h5 className="font-semibold text-yellow-400 mb-2">📊 Analysis:</h5>
                      <p className="text-light-200">{tone.summary}</p>
                    </div>
                  )}
                  
                  {/* Fallback for old tone format */}
                  {tone.tones && Array.isArray(tone.tones) && tone.tones.length > 0 && (
                    <div>
                      <h5 className="font-semibold text-green-400 mb-2">🎨 Detected Tones:</h5>
                      <div className="flex flex-wrap gap-2">
                        {tone.tones.map((toneItem: any, index: number) => (
                          <span 
                            key={index}
                            className="px-3 py-1 bg-purple-600 text-white text-xs rounded-full"
                          >
                            {toneItem.name || toneItem}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {tone.analysis && !tone.summary && (
                    <div>
                      <h5 className="font-semibold text-yellow-400 mb-2">📊 Analysis:</h5>
                      <p className="text-light-200">{tone.analysis}</p>
                    </div>
                  )}
                  
                  {tone.raw && (
                    <div>
                      <h5 className="font-semibold text-purple-400 mb-2">📋 Raw Tone Data:</h5>
                      <p className="text-light-200 text-xs">{JSON.stringify(tone.raw, null, 2)}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Pause Analysis */}
            {pauseAnalysis && pauseAnalysis.length > 0 && (
              <div className="mb-3 p-3 bg-zinc-800 rounded-lg">
                <h4 className="text-lg font-semibold text-purple-400 mb-3 text-center">
                  ⏱️ Speaking Analysis
                </h4>
                <div className="text-sm text-light-100 leading-relaxed space-y-3">
                  {pauseAnalysis.map((answer: any, index: number) => (
                    <div key={index} className="border-l-2 border-purple-500 pl-3">
                      <h6 className="font-medium text-blue-400">Answer {answer.answer}:</h6>
                      {answer.pauses && answer.pauses.length > 0 ? (
                        <div className="text-light-200">
                          <span className="text-xs">Pauses detected: {answer.pauses.length}</span>
                          {answer.pauses.slice(0, 3).map((pause: any, pauseIndex: number) => (
                            <div key={pauseIndex} className="text-xs text-gray-400 mt-1">
                              Between "{pause.from}" and "{pause.to}" ({pause.gap.toFixed(1)}s gap)
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-green-400">✓ Smooth delivery</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            </div> {/* Close scrollable content */}

            {/* Action Buttons - Fixed at bottom */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 md:gap-4 w-full justify-center mt-3 sm:mt-4 flex-shrink-0">
              <button
                className="w-full sm:w-auto text-white font-medium rounded-lg text-xs sm:text-sm px-3 sm:px-4 md:px-5 py-2 sm:py-2.5 text-center bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 transition-all duration-200"
                onClick={() => {
                  setLoadingReturnDashboard(true);
                  router.push("/");
                }}
                disabled={loadingReturnDashboard}
              >
                {loadingReturnDashboard ? (
                  <svg
                    aria-hidden="true"
                    className="inline w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-gray-200 animate-spin dark:text-gray-600 mr-1 sm:mr-2"
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
                ) : (
                  t("interview.returnToDashboard")
                )}
              </button>
              {interviewId && (
                <button
                  className="w-full sm:w-auto text-white font-medium rounded-lg text-xs sm:text-sm px-3 sm:px-4 md:px-6 py-2 sm:py-2.5 text-center bg-zinc-700 hover:bg-zinc-600 focus:ring-4 focus:outline-none focus:ring-zinc-300 dark:focus:ring-zinc-800 transition-all duration-200"
                  onClick={() => router.push(`/interview/${interviewId}`)}
                >
                  {t("interview.retakeInterview")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="w-full flex justify-center mt-8">
        {callStatus !== "ACTIVE" ? (
          <button
            className="relative btn-call"
            onClick={() => {
              setLoadingCall(true);
              handleCall();
            }}
            disabled={loadingCall}
          >
            {loadingCall ? (
              <svg
                aria-hidden="true"
                className="inline w-5 h-5 text-white animate-spin mr-2"
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
            ) : (
              <span className="relative">
                {callStatus === "INACTIVE" || callStatus === "FINISHED"
                  ? t("interview.callButton")
                  : ". . ."}
              </span>
            )}
          </button>
        ) : (
          <button className="btn-disconnect" onClick={() => handleDisconnect()}>
            {t("interview.endButton")}
          </button>
        )}
      </div>
    </>
  );
};

export default Agent;
