// GA4 helper utilities for Next.js App Router

export const GA_MEASUREMENT_ID: string =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || "G-XXXXXXX";

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

export const pageview = (url: string): void => {
  if (typeof window === "undefined") return;
  if (!GA_MEASUREMENT_ID) return;
  if (typeof window.gtag !== "function") return;

  window.gtag("config", GA_MEASUREMENT_ID, {
    page_path: url,
  });
};

type GtagEventParams = {
  action: string;
  category?: string;
  label?: string;
  value?: number;
  params?: Record<string, unknown>;
};

export const event = ({
  action,
  category,
  label,
  value,
  params,
}: GtagEventParams): void => {
  if (typeof window === "undefined") return;
  if (!GA_MEASUREMENT_ID) return;
  if (typeof window.gtag !== "function") return;

  const payload: Record<string, unknown> = {
    ...(category ? { event_category: category } : {}),
    ...(label ? { event_label: label } : {}),
    ...(typeof value === "number" ? { value } : {}),
    ...(params || {}),
  };

  window.gtag("event", action, payload);
};

export default { GA_MEASUREMENT_ID, pageview, event };
