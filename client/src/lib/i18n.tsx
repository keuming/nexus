import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { translations, Language } from "./translations";

const STORAGE_KEY = "nexus_lang";

interface I18nContextValue {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (section: keyof typeof translations, key: string) => string;
}

const I18nContext = createContext<I18nContextValue>({
  lang: "fr",
  setLang: () => {},
  t: (section, key) => {
    const sec = translations[section] as Record<string, Record<Language, string>>;
    return sec?.[key]?.fr ?? key;
  },
});

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Language>(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === "fr" || stored === "en" || stored === "es") return stored;
    // Auto-detect from browser
    const browser = navigator.language.slice(0, 2).toLowerCase();
    if (browser === "en") return "en";
    if (browser === "es") return "es";
    return "fr";
  });

  const setLang = useCallback((newLang: Language) => {
    setLangState(newLang);
    localStorage.setItem(STORAGE_KEY, newLang);
    document.documentElement.lang = newLang;
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const t = useCallback(
    (section: keyof typeof translations, key: string): string => {
      const sec = translations[section] as Record<string, Record<Language, string>>;
      return sec?.[key]?.[lang] ?? sec?.[key]?.fr ?? key;
    },
    [lang]
  );

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}

// Language metadata
export const LANGUAGES: { code: Language; label: string; flag: string; nativeName: string }[] = [
  { code: "fr", label: "Français", flag: "🇫🇷", nativeName: "Français" },
  { code: "en", label: "English", flag: "🇬🇧", nativeName: "English" },
  { code: "es", label: "Español", flag: "🇪🇸", nativeName: "Español" },
];
