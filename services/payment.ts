import apiClient from "@/lib/api/client";
import type {
  TCheckPaymentStatusService,
  TInitiatePaymentService,
} from "@/types/payment";

export const initiatePayment: TInitiatePaymentService = async (payload) => {
  const { interviewId, address, userIP } = payload;

  const { data } = await apiClient.post(
    "/payment/initiate",
    {
      interviewId,
      address,
    },
    {
      headers: {
        "x-forwarded-for": userIP,
      },
    }
  );

  return data;
};

export const checkPaymentStatus: TCheckPaymentStatusService = async (
  paymentId
) => {
  const { data } = await apiClient.get(
    `/payment/status?paymentId=${paymentId}`
  );

  return data;
};
