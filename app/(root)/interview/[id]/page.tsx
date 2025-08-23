"use client";

import Image from "next/image";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";

import Agent from "@/components/Agent";
import { getRandomInterviewCover } from "@/lib/utils";
import { getInterviewerConfig } from "@/constants";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { UserMenu } from "@/components/UserMenu";

import {
  getFeedbackByInterviewId,
  getInterviewById,
} from "@/lib/actions/general.action";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import DisplayTechIcons from "@/components/DisplayTechIcons";

interface RouteParams {
  params: Promise<{ id: string }>;
}

function InterviewContent({ params }: RouteParams) {
  const [id, setId] = useState<string>("");
  const [interview, setInterview] = useState<any>(null);
  const [feedback, setFeedback] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const user = useSelector((s: RootState) => s.me.user);

  useEffect(() => {
    const getParams = async () => {
      const { id: interviewId } = await params;
      setId(interviewId);

      try {
        // Fetch interview data
        const interviewData = await getInterviewById(interviewId);
        if (!interviewData) {
          redirect("/");
          return;
        }
        setInterview(interviewData);

        // Fetch feedback data
        if (user?.id) {
          const feedbackData = await getFeedbackByInterviewId({
            interviewId: interviewId,
            userId: user.id,
          });
          setFeedback(feedbackData);
        }
      } catch (error) {
        console.error("Error fetching interview data:", error);
        redirect("/");
      } finally {
        setLoading(false);
      }
    };

    getParams();
  }, [params, user?.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-zinc-900 rounded-2xl p-8 flex flex-col items-center gap-4">
          <svg
            className="animate-spin h-8 w-8 text-purple-600"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-white">Loading interview...</span>
        </div>
      </div>
    );
  }

  if (!interview) {
    redirect("/");
  }

  return (
    <ProtectedRoute>
      <div className="px-4 sm:px-0">
        {/* Header with User Menu */}
        <div className="absolute top-4 right-4 z-20">
          <UserMenu />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-between mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <div className="flex flex-row gap-3 sm:gap-4 items-center">
              <Image
                src={getRandomInterviewCover()}
                alt="cover-image"
                width={40}
                height={40}
                className="rounded-full object-cover size-[40px] flex-shrink-0"
              />
              <h3 className="capitalize text-lg sm:text-xl font-semibold">
                {interview.role} Interview
              </h3>
            </div>

            <DisplayTechIcons techStack={interview.techstack} />
          </div>

          <p className="bg-dark-200 px-3 sm:px-4 py-2 rounded-lg h-fit text-sm sm:text-base self-start sm:self-auto">
            {interview.type}
          </p>
        </div>

        <Agent
          userName={(user as any)?.name || user?.email || "User"}
          userId={user?.id}
          interviewId={id}
          type="interview"
          questions={interview.questions}
          feedbackId={feedback?.id}
          interviewerConfig={getInterviewerConfig()}
        />
      </div>
    </ProtectedRoute>
  );
}

export default function InterviewDetails(props: RouteParams) {
  return <InterviewContent {...props} />;
}
