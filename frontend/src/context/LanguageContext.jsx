import { createContext, useContext, useEffect, useState } from "react";

import am from "../i18n/am";
import en from "../i18n/en";
import ti from "../i18n/ti";
import om from "../i18n/om";

import {
  DEFAULT_LANGUAGE,
  LANGUAGES,
} from "../i18n/languages";

const LanguageContext = createContext(null);

const translations = {
  am,
  en,
  ti,
  om,
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return (
      localStorage.getItem("goldbingo-language") ||
      DEFAULT_LANGUAGE
    );
  });

  useEffect(() => {
    localStorage.setItem(
      "goldbingo-language",
      language
    );
  }, [language]);

  const changeLanguage = (newLanguage) => {
    if (!LANGUAGES[newLanguage]) {
      console.warn(
        `Unsupported language: ${newLanguage}`
      );
      return;
    }

    setLanguage(newLanguage);
  };

  /*
   * Translation function
   *
   * Example:
   * t("navigation.dashboard")
   * t("common.welcome")
   */
  const t = (key) => {
    const dictionary =
      translations[language] || translations[DEFAULT_LANGUAGE];

    const value = key
      .split(".")
      .reduce(
        (object, property) =>
          object?.[property],
        dictionary
      );

    /*
     * If translation doesn't exist,
     * fall back to Amharic.
     */
    if (value !== undefined) {
      return value;
    }

    const fallback =
      translations[DEFAULT_LANGUAGE];

    const fallbackValue = key
      .split(".")
      .reduce(
        (object, property) =>
          object?.[property],
        fallback
      );

    /*
     * If neither language contains the key,
     * show the key instead of crashing.
     */
    return fallbackValue ?? key;
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        languages: LANGUAGES,
        changeLanguage,
        t,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context =
    useContext(LanguageContext);

  if (!context) {
    throw new Error(
      "useLanguage must be used inside LanguageProvider"
    );
  }

  return context;
}