import { IAPIResponse } from "./api";

export interface PaymentOrder {
  id: string;
  user_id: string;
  interview_id: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  payment_method?: string;
  transaction_id?: string;
  created_at: string;
  updated_at: string;
  address?: BillingAddress;
}

export interface BillingAddress {
  address: string;
  city: string;
  country: string;
  zip: string;
}

export type PaymentStatus =
  | "pending"
  | "completed"
  | "declined"
  | "3ds"
  | "redirect"
  | "refund"
  | "unknown";

export interface PaymentInitiateRequest {
  interviewId: string;
  address: BillingAddress;
  userIP: string;
}

export interface PaymentInitiateResponse extends IAPIResponse {
  success: boolean;
  redirectUrl?: string;
  paymentId?: string;
  error?: string;
}

export interface PaymentStatusResponse {
  success: boolean;
  status: PaymentStatus;
  paymentId: string;
  amount?: number;
  currency?: string;
  error?: string;
}

export interface EDFAPaymentData {
  date: string;
  status: string;
  brand?: string;
  order: {
    number: string;
    amount: string;
    currency: string;
    description: string;
  };
  customer: {
    name: string;
    email: string;
  };
  rrn?: string;
  payment_id: string;
}

export interface PaymentCallbackData {
  paymentId: string;
  status: PaymentStatus;
  amount?: number;
  currency?: string;
  transactionId?: string;
}

export type TInitiatePaymentService = (
  payload: PaymentInitiateRequest
) => Promise<PaymentInitiateResponse>;

export type TCheckPaymentStatusService = (
  paymentId: string
) => Promise<PaymentStatusResponse>;
