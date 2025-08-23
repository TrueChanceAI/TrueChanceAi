import { createSlice, PayloadAction } from "@reduxjs/toolkit";

export interface LanguageState {
  currentLang: "en" | "ar";
  isRTL: boolean;
}

const getInitialLang = (): LanguageState => {
  if (typeof window === "undefined") return { currentLang: "en", isRTL: false };
  const saved = (localStorage.getItem("lang") as "en" | "ar") || "en";
  const isRTL = saved === "ar";
  return { currentLang: saved, isRTL };
};

const initialState: LanguageState = getInitialLang();

const applyLanguageSettings = (lang: "en" | "ar") => {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  const body = document.body;
  if (lang === "ar") {
    html.setAttribute("dir", "rtl");
    html.setAttribute("lang", "ar");
    body.style.fontFamily = "'Cairo', sans-serif";
  } else {
    html.setAttribute("dir", "ltr");
    html.setAttribute("lang", "en");
    body.style.fontFamily = "'Inter', sans-serif";
  }
};

const languageSlice = createSlice({
  name: "language",
  initialState,
  reducers: {
    setLanguage: (state, action: PayloadAction<"en" | "ar">) => {
      state.currentLang = action.payload;
      state.isRTL = action.payload === "ar";
      if (typeof window !== "undefined") {
        localStorage.setItem("lang", action.payload);
        applyLanguageSettings(action.payload);
      }
    },
    hydrateLanguageFromStorage: (state) => {
      if (typeof window === "undefined") return;
      const saved = (localStorage.getItem("lang") as "en" | "ar") || "en";
      state.currentLang = saved;
      state.isRTL = saved === "ar";
      applyLanguageSettings(saved);
    },
  },
});

export const { setLanguage, hydrateLanguageFromStorage } =
  languageSlice.actions;
export default languageSlice.reducer;
