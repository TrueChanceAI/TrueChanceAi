import { IAPIResponse } from "./api";

export interface Interview {
  id: string;
  user_id: string;
  candidate_name: string;
  duration: string;
  language: string;
  transcript: string;
  feedback: string;
  tone: string | null;
  created_at: string;
  Email: string;
  "CV/Resume": string | null;
  skills: string;
  is_conducted: boolean;
  payment_id: string | null;
  interview_questions: string[];
  payment_status: string;
}

export interface ICreateInterviewRequest {
  email: string;
  resumeText: string;
  candidateName: string;
  language: string;
  resumeFile: string;
  resumeFileName: string;
  resumeFileType: string;
  authenticatedUserEmail: string;
  interviewQuestions: string[];
}

export interface ICreateInterviewResponse extends IAPIResponse {
  interview: Interview;
}

export interface IGetAnterviewResponse extends IAPIResponse {
  interviews: Interview[];
}

export interface IGetInterviewByIdResponse extends IAPIResponse {
  interview: Interview;
}

export interface IExtractResumeRequest {
  file: File;
  email: string;
}

export interface IExtractResumeResponse extends IAPIResponse {
  text: string;
  name: string;
}

export interface IGenerateQuestionsRequest {
  resume: string;
  language: string;
  candidateName: string;
}

export interface IGenerateQuestionsResponse extends IAPIResponse {
  questions: string[];
}

export type TExtractResumeService = (
  payload: IExtractResumeRequest
) => Promise<IExtractResumeResponse>;

export type TCreateInterviewService = (
  payload: ICreateInterviewRequest
) => Promise<ICreateInterviewResponse>;

export type TGetAllInterviewsService = () => Promise<IGetAnterviewResponse>;
export type TGetInterviewByIdService = (
  id: string
) => Promise<IGetInterviewByIdResponse>;

export type TGenerateQuestionsService = (
  payload: IGenerateQuestionsRequest
) => Promise<IGenerateQuestionsResponse>;
