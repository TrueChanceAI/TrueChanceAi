import dayjs from "dayjs";
import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";

import {
  getFeedbackByInterviewId,
  getInterviewById,
} from "@/lib/actions/general.action";
import { Button } from "@/components/ui/button";
import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";

const Feedback = async ({ params }: RouteParams) => {
  const { id } = await params;
  const user = useSelector((s: RootState) => s.me.user);

  const interview = await getInterviewById(id);
  const feedback = interview ? await getFeedbackByInterviewId({
    interviewId: id,
    userId: user?.id!,
  }) : null;

  if (!interview || !feedback) {
    return (
      <section className="section-feedback flex flex-col items-center justify-center min-h-[60vh] px-4 sm:px-0">
        <h1 className="text-2xl sm:text-3xl font-semibold mb-4 text-red-400 text-center">Feedback Not Found</h1>
        <p className="mb-6 text-base sm:text-lg text-center text-light-100 max-w-xl px-4">
          Sorry, we couldn't find feedback for this interview. It may not have been generated yet, or there was an error. Please try again later or contact support if the problem persists.
        </p>
        <Button className="btn-primary">
          <Link href="/">Return to Dashboard</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="section-feedback px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row justify-center text-center sm:text-left">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold">
          Feedback on the Interview -{" "}
          <span className="capitalize">{interview.role}</span> Interview
        </h1>
      </div>

      <div className="flex flex-col sm:flex-row justify-center mt-4 sm:mt-6">
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-5">
          {/* Overall Impression */}
          <div className="flex flex-row gap-2 items-center justify-center sm:justify-start">
            <Image src="/star.svg" width={18} height={18} className="sm:w-[22px] sm:h-[22px]" alt="star" />
            <p className="text-sm sm:text-base">
              Overall Impression:{" "}
              <span className="text-primary-200 font-bold">
                {feedback?.totalScore}
              </span>
              /100
            </p>
          </div>

          {/* Date */}
          <div className="flex flex-row gap-2 items-center justify-center sm:justify-start">
            <Image src="/calendar.svg" width={18} height={18} className="sm:w-[22px] sm:h-[22px]" alt="calendar" />
            <p className="text-sm sm:text-base">
              {feedback?.createdAt
                ? dayjs(feedback.createdAt).format("MMM D, YYYY h:mm A")
                : "N/A"}
            </p>
          </div>
        </div>
      </div>

      <hr className="my-6" />

      {/* Structured Feedback Sections */}
      <div className="w-full max-w-2xl mx-auto overflow-y-auto max-h-[60vh] animate-fade-in bg-zinc-900 rounded-xl p-4 sm:p-6 mt-6 mb-8 border border-zinc-700 shadow-sm">
        {(() => {
          const text = (feedback?.finalAssessment || '').replace(/---+/g, '').trim();
          const sectionRegex = /(Communication Skills:|Technical Knowledge:|Problem-Solving Ability:|Cultural & Role Fit:|Confidence & Clarity:|Final Assessment:)([\s\S]*?)(?=Communication Skills:|Technical Knowledge:|Problem-Solving Ability:|Cultural & Role Fit:|Confidence & Clarity:|Final Assessment:|$)/g;
          const sections = [];
          let match;
          while ((match = sectionRegex.exec(text)) !== null) {
            const header = match[1].replace(":", "").trim();
            const content = match[2].trim();
            sections.push({ header, content });
          }
          return sections.map((section, idx) => (
            <section key={idx} className="mb-4 sm:mb-6">
              <h3 className="block font-bold text-primary-200 mb-1 text-base sm:text-lg">
                {section.header}
              </h3>
              <p className="text-light-100 whitespace-pre-line leading-relaxed text-sm sm:text-base">
                {section.content}
              </p>
              {idx < sections.length - 1 && (
                <hr className="my-4 sm:my-6 border-zinc-700" />
              )}
            </section>
          ));
        })()}
      </div>

      {/* Interview Breakdown */}
      <div className="flex flex-col gap-3 sm:gap-4">
        <h2 className="text-xl sm:text-2xl font-semibold">Breakdown of the Interview:</h2>
        {feedback?.categoryScores?.map((category, index) => (
          <div key={index} className="mb-3 sm:mb-4">
            <p className="font-bold text-sm sm:text-base">
              {index + 1}. {category.name} ({category.score}/100)
            </p>
            <p className="text-sm sm:text-base mt-1">{category.comment}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 sm:gap-3 mt-6">
        <h3 className="text-lg sm:text-xl font-semibold">Strengths</h3>
        <ul className="space-y-1">
          {feedback?.strengths?.map((strength, index) => (
            <li key={index} className="text-sm sm:text-base">{strength}</li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-2 sm:gap-3 mt-6">
        <h3 className="text-lg sm:text-xl font-semibold">Areas for Improvement</h3>
        <ul className="space-y-1">
          {feedback?.areasForImprovement?.map((area, index) => (
            <li key={index} className="text-sm sm:text-base">{area}</li>
          ))}
        </ul>
      </div>

      <div className="buttons mt-8">
        <Button className="btn-secondary flex-1">
          <Link href="/" className="flex w-full justify-center">
            <p className="text-sm font-semibold text-primary-200 text-center">
              Back to dashboard
            </p>
          </Link>
        </Button>

        <Button className="btn-primary flex-1">
          <Link
            href={`/interview/${id}`}
            className="flex w-full justify-center"
          >
            <p className="text-sm font-semibold text-black text-center">
              Retake Interview
            </p>
          </Link>
        </Button>
      </div>
    </section>
  );
};

export default Feedback;
