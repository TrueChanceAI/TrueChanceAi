"use client";

import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import type { RootState } from "@/redux/store";
import { resetMeState, setSessionToken } from "@/redux/slices/meSlice";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/hooks/useLanguage";
import { removeToken } from "@/lib/token";

export function UserMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const user = useSelector((s: RootState) => s.me.user);
  const dispatch = useDispatch();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  if (!user) return null;

  const getInitials = (name?: string) => {
    if (!name) return user.email?.charAt(0).toUpperCase() || "U";
    return name
      .split(" ")
      .map((n) => n.charAt(0))
      .join("")
      .toUpperCase();
  };

  const handleProfileClick = () => {
    router.push("/profile");
    setIsOpen(false);
  };

  const handleSignOut = () => {
    dispatch(resetMeState());
    dispatch(setSessionToken(null));
    removeToken();
    router.push("/");
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-blue-500 text-white font-medium hover:from-purple-700 hover:to-blue-600 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-zinc-900 shadow-lg"
        aria-label="User menu"
        aria-expanded={isOpen}
      >
        {getInitials(user.firstName + " " + user.lastName)}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-zinc-900 rounded-lg shadow-xl border border-zinc-700 py-2 z-50 min-w-[200px] sm:min-w-[200px] max-w-[calc(100vw-2rem)] transform -translate-x-0 sm:translate-x-0">
          <div className="px-4 py-2 border-b border-zinc-700">
            <p className="text-sm font-medium text-white truncate">
              {user.firstName + " " + user.lastName}
            </p>
            <p className="text-xs text-zinc-400 truncate">{user.email}</p>
          </div>

          <button
            onClick={handleProfileClick}
            className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors flex items-center gap-2"
          >
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            <span className="truncate">{t("profile.profile")}</span>
          </button>

          <button
            onClick={handleSignOut}
            className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors flex items-center gap-2"
          >
            <svg
              className="w-4 h-4 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            <span className="truncate">{t("profile.signOut")}</span>
          </button>
        </div>
      )}
    </div>
  );
}
