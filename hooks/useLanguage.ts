"use client";
import { useDispatch, useSelector } from "react-redux";
import type { RootState } from "@/redux/store";
import { setLanguage } from "@/redux/slices/languageSlice";
import { getTranslation } from "@/constants/translations";

export const useLanguage = () => {
  const dispatch = useDispatch();
  const currentLang = useSelector((s: RootState) => s.language.currentLang);

  const t = (key: string): any => getTranslation(currentLang, key);

  return {
    currentLang,
    setLanguage: (lang: "en" | "ar") => dispatch(setLanguage(lang)),
    t,
  };
};
