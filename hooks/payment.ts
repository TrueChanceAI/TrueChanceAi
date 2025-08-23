import { initiatePayment, checkPaymentStatus } from "@/services/payment";
import { useMutation, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { IAPIError } from "@/types/api";
import { PaymentInitiateResponse } from "@/types/payment";
import { queryRetry } from "@/lib/api/client";

export const useInitiatePayment = () => {
  const onSuccess = (data: PaymentInitiateResponse) => {
    toast.success(data.message || "Payment initiated successfully");
  };

  const onError = (error: IAPIError) => {
    toast.error(
      (error?.response as any)?.data?.error ||
        (error?.response as any)?.message ||
        error?.message ||
        "Something went wrong"
    );
  };

  const { mutateAsync, isPending, isSuccess, isError, error } = useMutation({
    mutationFn: initiatePayment,
    onSuccess,
    onError,
  });

  return {
    initiatePayment: mutateAsync,
    isLoading: isPending,
    isSuccess,
    isError,
    error,
  };
};

export const useGetPaymentStatus = (paymentId: string) => {
  const { data, isLoading, isError, error, isSuccess } = useQuery({
    queryKey: ["paymentStatus", paymentId],
    queryFn: () => checkPaymentStatus(paymentId),
    enabled: !!paymentId,
    retry: queryRetry,
  });

  return {
    paymentStatus: data,
    isLoading,
    isError,
    error,
    isSuccess,
  };
};
