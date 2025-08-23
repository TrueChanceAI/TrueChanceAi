"use client";

import { ReactNode } from "react";
import BaseLayout from "@/layouts/BaseLayout";
import AppLayout from "@/layouts/AppLayout";

export default function Layout({ children }: { children: ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}
