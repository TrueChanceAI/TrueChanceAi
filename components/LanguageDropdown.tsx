"use client";
import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/hooks/useLanguage";

interface LanguageOption {
  code: string;
  nameEn: string;
  nameAr: string;
  flag: string;
  font: string;
}

const languages: LanguageOption[] = [
  {
    code: "en",
    nameEn: "English",
    nameAr: "الإنجليزية",
    flag: "https://flagcdn.com/w320/us.png",
    font: "'Inter', sans-serif",
  },
  {
    code: "ar",
    nameEn: "Arabic",
    nameAr: "العربية",
    flag: "https://flagcdn.com/w320/sa.png",
    font: "'Cairo', sans-serif",
  },
];

export default function LanguageDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const { currentLang, setLanguage, t } = useLanguage();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Handle click outside to close dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleLanguageChange = (langCode: string) => {
    setLanguage(langCode as "en" | "ar");
    setIsOpen(false);
  };

  const currentLanguage =
    languages.find((lang) => lang.code === currentLang) || languages[0];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        id="lang-toggle"
        type="button"
        className="inline-flex items-center font-medium justify-center px-4 py-2 text-sm text-white rounded-lg cursor-pointer hover:bg-gradient-to-br hover:from-purple-600 hover:to-blue-500 focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 transition-all duration-200"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="mr-2">🌐</span>
        <span className="hidden sm:inline">{t("navigation.language")}</span>
      </button>

      {isOpen && (
        <div
          id="lang-menu"
          className="absolute z-50 mt-2 w-40 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 right-0"
        >
          <div className="py-2">
            {languages.map((lang) => (
              <button
                key={lang.code}
                className={`w-full text-left px-4 py-2 flex items-center hover:text-white hover:bg-[#a75717] transition-colors ${
                  currentLang === lang.code
                    ? "bg-[#a75717] text-white"
                    : "text-gray-900 dark:text-white"
                }`}
                onClick={() => handleLanguageChange(lang.code)}
                style={{ fontFamily: lang.font }}
              >
                <img
                  src={lang.flag}
                  alt={currentLang === "ar" ? lang.nameAr : lang.nameEn}
                  className="h-4 w-6 me-2 rounded-md"
                />
                {currentLang === "ar" ? lang.nameAr : lang.nameEn}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
