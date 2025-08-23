import { LANGUAGES } from "@/constants/translations";
import {
  useCreateInterview,
  useExtractResume,
  useGenerateQuestions,
} from "@/hooks/interview";
import { useLanguage } from "@/hooks/useLanguage";
import { useSelector } from "react-redux";
import { RootState } from "@/redux/store";
import React, { useState, useRef, useEffect } from "react";

interface IProps {
  onInterviewCreated: (interviewId: string) => void;
}

const UploadResumeForm = ({ onInterviewCreated }: IProps) => {
  const { createInterview, isLoading: isCreatingInterview } =
    useCreateInterview();
  const { extractResume, isLoading: isExtractingResume } = useExtractResume();
  const { generateQuestions, isLoading: isGeneratingQuestions } =
    useGenerateQuestions();

  const { t, currentLang } = useLanguage();
  const user = useSelector((s: RootState) => s.me.user);
  const progressSteps = t("upload.progressSteps");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [language, setLanguage] = useState("en");
  const [errorMessage, setErrorMessage] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [email, setEmail] = useState(user?.email || "");
  const [showProgress, setShowProgress] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  // Show progress when any operation is loading
  useEffect(() => {
    if (isExtractingResume || isGeneratingQuestions || isCreatingInterview) {
      setShowProgress(true);
    } else {
      setShowProgress(false);
    }
  }, [isExtractingResume, isGeneratingQuestions, isCreatingInterview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setErrorMessage("");
    }
  };

  const handleExtractResume = async (): Promise<{
    extractedText: string;
    extractedName: string;
  }> => {
    const { text, name } = await extractResume({
      file: file as File,
      email,
    });

    return { extractedText: text, extractedName: name };
  };

  const handleGenerateQuestions = async (
    extractedText: string,
    extractedName: string
  ) => {
    const { questions } = await generateQuestions({
      resume: extractedText,
      language,
      candidateName: extractedName,
    });

    return questions;
  };

  const handleCreateInterview = async (
    extractedText: string,
    extractedName: string,
    generatedQuestions: string[]
  ) => {
    const fileReader = new FileReader();
    const fileData = await new Promise<string>((resolve, reject) => {
      fileReader.onload = () => resolve(fileReader.result as string);
      fileReader.onerror = reject;
      fileReader.readAsDataURL(file as File);
    });

    const base64Data = fileData.split(",")[1];

    const { interview } = await createInterview({
      email,
      resumeText: extractedText,
      candidateName: extractedName,
      language,
      resumeFile: base64Data,
      resumeFileName: file?.name || "",
      resumeFileType: file?.type || "",
      authenticatedUserEmail: user?.email || "",
      interviewQuestions: generatedQuestions,
    });

    onInterviewCreated(interview.id);
  };

  const handleDrop = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setErrorMessage("");
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!file) {
      setErrorMessage("Please select a file.");
      return;
    }
    if (!acceptedTerms) {
      setErrorMessage(t("upload.termsErrorText"));
      return;
    }
    if (!user) {
      setErrorMessage("You must be authenticated to upload a resume.");
      return;
    }

    setErrorMessage("");
    setCurrentStep(0);

    try {
      // Step 1: Extract resume
      setCurrentStep(0);
      const { extractedText, extractedName } = await handleExtractResume();

      // Step 2: Generate questions
      setCurrentStep(1);
      const generatedQuestions = await handleGenerateQuestions(
        extractedText,
        extractedName
      );

      // Step 3: Create interview
      setCurrentStep(2);
      await handleCreateInterview(
        extractedText,
        extractedName,
        generatedQuestions
      );

      // Step 4: Initialize interview
      setCurrentStep(3);
      // Small delay to show the final step
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error: any) {
      setErrorMessage(
        error.response.data.error ||
          "An error occurred while creating interview."
      );
    }
  };

  return (
    <div
      className="w-full max-w-md p-4 border border-zinc-700 rounded-lg shadow-sm sm:p-6 md:p-8 bg-zinc-900 mt-4"
      style={{
        fontFamily:
          'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
      }}
    >
      {showProgress && (
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

            {/* Progress Steps */}
            <div className="w-full space-y-3">
              {progressSteps.map((step: string, index: number) => (
                <div key={index} className="flex items-center space-x-3">
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      index <= currentStep ? "bg-purple-500" : "bg-zinc-600"
                    }`}
                  >
                    {index < currentStep ? (
                      <svg
                        className="w-3 h-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ) : (
                      <span className="text-xs text-white">{index + 1}</span>
                    )}
                  </div>
                  <span
                    className={`text-sm ${
                      index === currentStep
                        ? "text-white font-medium"
                        : index < currentStep
                        ? "text-zinc-400"
                        : "text-zinc-500"
                    }`}
                  >
                    {step}
                  </span>
                </div>
              ))}
            </div>

            {/* Current Step Text */}
            <span className="text-base sm:text-lg font-medium text-white text-center mt-2">
              {progressSteps[currentStep]}
            </span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <h1 className="text-xl font-medium text-white text-center">
          {t("upload.title")}
        </h1>
        <p className="text-zinc-400 text-center">{t("upload.subtitle")}</p>

        {/* Drag and drop or browse area always visible */}
        <div className="flex items-center justify-center w-full">
          <label
            htmlFor="resume-upload"
            className={`flex flex-col items-center justify-center w-full h-56 border-2 border-dashed rounded-lg transition-colors ${
              isExtractingResume || isGeneratingQuestions || isCreatingInterview
                ? "border-zinc-600 bg-zinc-800 cursor-not-allowed opacity-50"
                : "border-zinc-500 bg-zinc-800 hover:bg-zinc-700 cursor-pointer"
            }`}
            onDrop={(e) =>
              !isExtractingResume &&
              !isGeneratingQuestions &&
              !isCreatingInterview &&
              handleDrop(e)
            }
            onDragOver={(e) =>
              !isExtractingResume &&
              !isGeneratingQuestions &&
              !isCreatingInterview &&
              handleDragOver(e)
            }
          >
            <div className="flex flex-col items-center justify-center pt-4 pb-6">
              <svg
                className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 20 16"
              >
                <path
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                />
              </svg>
              {file ? (
                <span className="text-sm font-semibold text-zinc-300 mb-2">
                  {file.name}
                </span>
              ) : (
                <>
                  <p className="mb-2 text-sm text-zinc-400 text-center">
                    {isExtractingResume ||
                    isGeneratingQuestions ||
                    isCreatingInterview
                      ? t("upload.processingInProgress")
                      : t("upload.dragDropText")}
                  </p>
                  <p className="text-xs text-zinc-500 text-center">
                    {t("upload.pdfOnlyText")}
                  </p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              id="resume-upload"
              type="file"
              accept="application/pdf"
              onChange={handleFileChange}
              disabled={
                isExtractingResume ||
                isGeneratingQuestions ||
                isCreatingInterview
              }
              className="hidden"
            />
          </label>
        </div>

        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          disabled={
            isExtractingResume || isGeneratingQuestions || isCreatingInterview
          }
          className="block w-full p-2.5 text-sm rounded-lg border border-zinc-700 bg-zinc-800 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        >
          {LANGUAGES.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {currentLang === "ar" ? lang.labelAr : lang.labelEn}
            </option>
          ))}
        </select>

        {/* Email Field - Editable with user's email pre-filled */}
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-white mb-2"
          >
            {t("profile.email")}
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={
              isExtractingResume || isGeneratingQuestions || isCreatingInterview
            }
            className="block w-full p-2.5 text-sm rounded-lg border border-zinc-700 bg-zinc-800 text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder={t("upload.emailPlaceholder")}
          />
        </div>

        {/* Terms and Conditions Checkbox */}
        <div className="w-full">
          <div className="flex items-start space-x-3">
            <input
              type="checkbox"
              id="terms-checkbox"
              checked={acceptedTerms}
              onChange={(e) => setAcceptedTerms(e.target.checked)}
              disabled={
                isExtractingResume ||
                isGeneratingQuestions ||
                isCreatingInterview
              }
              className="mt-1 h-4 w-4 text-purple-600 bg-zinc-800 border-zinc-600 rounded focus:ring-purple-500 focus:ring-2"
            />
            <label
              htmlFor="terms-checkbox"
              className="text-sm text-zinc-300 leading-relaxed"
            >
              {currentLang === "ar" ? (
                <>
                  أوافق على{" "}
                  <a
                    href="/terms-ar"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 underline"
                  >
                    الشروط والأحكام
                  </a>{" "}
                  وأوافق على معالجة بياناتي لأغراض المقابلة.
                </>
              ) : (
                <>
                  I accept the{" "}
                  <a
                    href="/terms-en"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 underline"
                  >
                    Terms and Conditions
                  </a>{" "}
                  and agree to the processing of my data for interview purposes.
                </>
              )}
            </label>
          </div>
        </div>

        {errorMessage && (
          <p className="text-red-500 text-center">{errorMessage}</p>
        )}
        <button
          type="submit"
          disabled={
            isExtractingResume ||
            isGeneratingQuestions ||
            isCreatingInterview ||
            !acceptedTerms ||
            !file
          }
          className="w-full text-white font-medium rounded-lg text-sm px-5 py-2.5 text-center bg-gradient-to-br from-purple-600 to-blue-500 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExtractingResume || isGeneratingQuestions || isCreatingInterview
            ? progressSteps[currentStep]
            : t("upload.uploadButton")}
        </button>
      </form>
    </div>
  );
};

export default UploadResumeForm;
