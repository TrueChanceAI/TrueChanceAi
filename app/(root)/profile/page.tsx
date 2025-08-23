"use client";

import { useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useLanguage } from "@/hooks/useLanguage";

function ProfileContent() {
  const user = useSelector((s: RootState) => s.me.user);
  const { t, currentLang } = useLanguage();

  if (!user) return null;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-transparent p-4">
        <div className="max-w-2xl mx-auto pt-8">
          <div className="bg-zinc-900 rounded-2xl p-8 border border-zinc-700">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 flex items-center justify-center text-white font-bold text-2xl">
                {user.firstName?.[0]?.toUpperCase() ||
                  user.email[0].toUpperCase()}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">
                  {t("profile.title")}
                </h1>
                <p className="text-zinc-400">{t("profile.subtitle")}</p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-white text-sm font-medium mb-2">
                  {t("profile.email")}
                </h3>
                <div className="bg-zinc-800 border border-zinc-700 text-zinc-300 p-3 rounded-lg">
                  {user.email}
                </div>
                <p className="text-zinc-500 text-sm mt-1">
                  {t("profile.emailCannotChange")}
                </p>
              </div>

              {user.firstName && (
                <div>
                  <h3 className="text-white text-sm font-medium mb-2">
                    {t("profile.firstName")}
                  </h3>
                  <div className="bg-zinc-800 border border-zinc-700 text-zinc-300 p-3 rounded-lg">
                    {user.firstName}
                  </div>
                </div>
              )}

              <div className="pt-4">
                <p className="text-zinc-400 text-sm">
                  {t("profile.profileInfoNote")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}

export default function ProfilePage() {
  return <ProfileContent />;
}
