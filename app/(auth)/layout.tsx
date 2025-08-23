"use client";

import { ReactNode } from "react";
import AppLayout from "@/layouts/AppLayout";

interface AuthLayoutProps {
  children: ReactNode;
}

const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <AppLayout>
      <div className="min-h-screen flex items-center justify-center px-4 py-8 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <div className="w-full max-w-md">
          <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8">
            {children}
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default AuthLayout;
