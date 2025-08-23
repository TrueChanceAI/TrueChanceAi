import { useRouter } from "next/navigation";
import { useDispatch } from "react-redux";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { setMe, setSessionToken } from "@/redux/slices/meSlice";
import {
  ISinginResponse,
  ISignupResponse,
  IVerifyOtpResponse,
  IResendOtpResponse,
  ISinginPayload,
  ISignupPayload,
  IVerifyOtpPayload,
  IResendOtpPayload,
} from "@/types/auth";
import { IAPIError } from "@/types/api";
import {
  resendOtpService,
  signInService,
  signUpService,
  verifyOtpService,
} from "@/services/auth";
import { setToken } from "@/lib/token";

export const useSignIn = () => {
  const router = useRouter();
  const dispatch = useDispatch();

  const onSuccess = (data: ISinginResponse) => {
    toast.success(data.message || "Login successful");
    if (data?.token) {
      dispatch(setSessionToken(data.token));
      setToken(data.token);
    }
    if (data?.user) dispatch(setMe(data.user as any));
    router.push("/");
  };

  const onError = (error: IAPIError) => {
    toast.error(
      (error?.response as any)?.data?.error ||
        (error?.response as any)?.message ||
        error?.message ||
        "Something went wrong"
    );
  };

  const { mutateAsync, error, isError, isPending, isSuccess } = useMutation({
    mutationKey: ["signIn"],
    mutationFn: (payload: ISinginPayload) => signInService(payload),
    onSuccess,
    onError,
  });

  return {
    signIn: mutateAsync,
    error,
    isError,
    isLoading: isPending,
    isSuccess,
  };
};

export const useSignUp = () => {
  const router = useRouter();

  const onSuccess = (data: ISignupResponse) => {
    toast.success(data.message || "OTP sent to your email");
    router.push("/verify-otp");
  };

  const onError = (error: IAPIError) => {
    toast.error(
      (error?.response as any)?.data?.error ||
        (error?.response as any)?.message ||
        error?.message ||
        "Something went wrong"
    );
  };

  const { mutateAsync, error, isError, isPending, isSuccess } = useMutation({
    mutationKey: ["signUp"],
    mutationFn: (payload: ISignupPayload) => signUpService(payload),
    onSuccess,
    onError,
  });

  return {
    signUp: mutateAsync,
    error,
    isError,
    isLoading: isPending,
    isSuccess,
  };
};

export const useVerifyOtp = () => {
  const router = useRouter();

  const onSuccess = (data: IVerifyOtpResponse) => {
    toast.success(data.message || "Email verified successfully");
    router.push("/signin");
  };

  const onError = (error: IAPIError) => {
    toast.error(
      (error?.response as any)?.data?.error ||
        (error?.response as any)?.message ||
        error?.message ||
        "Something went wrong"
    );
  };

  const { mutateAsync, error, isError, isPending, isSuccess } = useMutation({
    mutationKey: ["verifyOtp"],
    mutationFn: (payload: IVerifyOtpPayload) => verifyOtpService(payload),
    onSuccess,
    onError,
  });

  return {
    verifyOtp: mutateAsync,
    error,
    isError,
    isLoading: isPending,
    isSuccess,
  };
};

export const useResendOtp = () => {
  const onSuccess = (data: IResendOtpResponse) => {
    toast.success(data.message || "OTP resent to your email");
  };

  const onError = (error: IAPIError) => {
    toast.error(
      (error?.response as any)?.data?.error ||
        (error?.response as any)?.message ||
        error?.message ||
        "Something went wrong"
    );
  };

  const { mutateAsync, error, isError, isPending, isSuccess } = useMutation({
    mutationKey: ["resendOtp"],
    mutationFn: (payload: IResendOtpPayload) => resendOtpService(payload),
    onSuccess,
    onError,
  });

  return {
    resendOtp: mutateAsync,
    error,
    isError,
    isLoading: isPending,
    isSuccess,
  };
};
