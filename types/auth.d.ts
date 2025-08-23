import { IAPIResponse } from "./api";
import { IUser } from "./me";

export interface ISinginPayload {
  email: string;
  password: string;
}

export interface ISinginResponse extends IAPIResponse {
  user: IUser;
  token: string;
}
export interface ISignupPayload {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  password: string;
}

export interface ISignupResponse extends IAPIResponse {
  message: string;
  userId: string;
}

export interface IVerifyOtpPayload {
  id: string;
  otp: string;
}

export interface IVerifyOtpResponse extends IAPIResponse {
  message: string;
}

export interface IResendOtpPayload {
  id: string;
}

export interface IResendOtpResponse extends IAPIResponse {
  message: string;
}

export type TSigninService = (
  payload: ISinginPayload
) => Promise<ISinginResponse>;

export type TSignupService = (
  payload: ISignupPayload
) => Promise<ISignupResponse>;

export type TVerifyOtpService = (
  payload: IVerifyOtpPayload
) => Promise<IVerifyOtpResponse>;

export type TResendOtpService = (
  payload: IResendOtpPayload
) => Promise<IResendOtpResponse>;
