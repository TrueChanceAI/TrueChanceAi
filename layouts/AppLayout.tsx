"use client";

import Link from "next/link";
import Image from "next/image";
import { ReactNode, useState, useEffect } from "react";
import LanguageDropdown from "@/components/LanguageDropdown";
import { useLanguage } from "@/hooks/useLanguage";
import { UserMenu } from "@/components/UserMenu";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { usePathname, useSearchParams } from "next/navigation";
import { pageview } from "@/lib/gtag";
import { useGetMe } from "@/hooks/me";
import { setMe } from "@/redux/slices/meSlice";

interface IProps {
  children: ReactNode;
}

const AppLayout = ({ children }: IProps) => {
  const dispatch = useDispatch();
  const { me } = useGetMe();
  const { t } = useLanguage();
  const user = useSelector((state: RootState) => state.me.user);
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  // Handle ESC key press
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isMobileMenuOpen) {
        closeMobileMenu();
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener("keydown", handleEscKey);
      // Prevent body scroll when menu is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("keydown", handleEscKey);
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  // Track page views on route changes
  useEffect(() => {
    if (!pathname) return;
    const url = `${pathname}${
      searchParams?.toString() ? `?${searchParams.toString()}` : ""
    }`;
    pageview(url);
  }, [pathname, searchParams]);

  useEffect(() => {
    if (me) {
      dispatch(setMe(me));
    }
  }, [me]);

  return (
    <div className="root-layout">
      <nav className="flex items-center justify-between w-full py-2 px-4 sm:px-6 relative">
        {/* Logo and Brand */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <Link href="/" className="flex items-center gap-2 sm:gap-3 min-w-0">
            <Image
              src="/logo.svg"
              alt="PrepWithAhamed Logo"
              width={32}
              height={28}
              className="w-8 h-7 sm:w-[38px] sm:h-[32px] flex-shrink-0"
            />
            <span
              className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold tracking-tight text-white truncate sm:truncate-none"
              style={{
                fontFamily:
                  'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"',
              }}
            >
              <span className="hidden sm:inline">TrueChance</span>
              <span className="sm:hidden">TrueChance</span>
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="hidden sm:flex gap-4 items-center">
          <Link
            href="/"
            className="text-white hover:bg-gradient-to-br hover:from-purple-600 hover:to-blue-500 font-medium transition-all duration-200 px-4 py-2 rounded-lg"
          >
            {t("navigation.home")}
          </Link>
          <Link
            href="/about"
            className="text-white hover:bg-gradient-to-br hover:from-purple-600 hover:to-blue-500 font-medium transition-all duration-200 px-4 py-2 rounded-lg"
          >
            {t("navigation.aboutUs")}
          </Link>
          <LanguageDropdown />
          {user ? (
            <UserMenu />
          ) : (
            <Link
              href="/signin"
              className="relative inline-flex items-center justify-center px-6 py-2.5 text-sm font-semibold text-white border-2 border-white/30 rounded-lg bg-white/10 backdrop-blur-sm transition-all duration-300 ease-out hover:scale-105 hover:border-white/60 hover:bg-white/20 hover:shadow-lg hover:shadow-white/10 group overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-2">
                <svg
                  className="w-4 h-4 transition-transform duration-300 group-hover:scale-110"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
                {t("navigation.signIn")}
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 to-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-lg"></div>
            </Link>
          )}
        </div>

        {/* Mobile Navigation */}
        <div className="sm:hidden flex items-center gap-2">
          <LanguageDropdown />
          {user ? <UserMenu /> : null}
          <button
            onClick={toggleMobileMenu}
            className="text-white hover:text-primary-200 transition-colors p-2 focus:outline-none focus:ring-2 focus:ring-primary-200 rounded-md z-50 relative"
            aria-label="Toggle mobile menu"
            aria-expanded={isMobileMenuOpen}
          >
            <svg
              className="w-6 h-6 transition-transform duration-200"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile Side Menu Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 sm:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Mobile Side Menu */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-black bg-opacity-90 backdrop-blur-sm border-l border-zinc-800 shadow-xl z-50 transform transition-transform duration-300 ease-in-out sm:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Menu Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-lg font-semibold text-white">
            {t("navigation.menu")}
          </h2>
          <button
            onClick={closeMobileMenu}
            className="text-white hover:text-primary-200 transition-colors p-2 focus:outline-none focus:ring-2 focus:ring-primary-200 rounded-md"
            aria-label="Close menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Menu Links */}
        <nav className="py-4">
          <div className="space-y-1">
            <Link
              href="/"
              className="block px-4 py-3 text-white hover:text-primary-200 hover:bg-black hover:bg-opacity-50 transition-colors duration-200"
              onClick={closeMobileMenu}
            >
              <div className="flex items-center space-x-3">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                  />
                </svg>
                <span>{t("navigation.home")}</span>
              </div>
            </Link>
            <Link
              href="/about"
              className="block px-4 py-3 text-white hover:text-primary-200 hover:bg-black hover:bg-opacity-50 transition-colors duration-200"
              onClick={closeMobileMenu}
            >
              <div className="flex items-center space-x-3">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span>{t("navigation.aboutUs")}</span>
              </div>
            </Link>
            {!user && (
              <Link
                href="/signin"
                className="block px-4 py-3 text-white hover:text-primary-200 hover:bg-black hover:bg-opacity-50 transition-colors duration-200"
                onClick={closeMobileMenu}
              >
                <div className="flex items-center space-x-3">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                  <span>{t("navigation.signIn")}</span>
                </div>
              </Link>
            )}
          </div>
        </nav>
      </div>

      {children}
    </div>
  );
};

export default AppLayout;
