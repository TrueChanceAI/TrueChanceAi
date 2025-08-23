import clientApi from "@/lib/api/client";
import {
  TSigninService,
  TSignupService,
  TVerifyOtpService,
  TResendOtpService,
} from "@/types/auth";

export const signInService: TSigninService = async (payload) => {
  const { data } = await clientApi.post("/auth/login", payload);

  return data;
};

export const signUpService: TSignupService = async (payload) => {
  const { data } = await clientApi.post("/auth/register", payload);
  return data;
};

export const verifyOtpService: TVerifyOtpService = async (payload) => {
  const { data } = await clientApi.post("/auth/verify-otp", payload);
  return data;
};

export const resendOtpService: TResendOtpService = async (payload) => {
  const { data } = await clientApi.post("/auth/resend-otp", payload);
  return data;
};
