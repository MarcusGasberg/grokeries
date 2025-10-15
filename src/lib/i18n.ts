import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Import translation files directly
import commonEN from "../../public/locales/en/common.json";
import groceriesEN from "../../public/locales/en/groceries.json";
import authEN from "../../public/locales/en/auth.json";
import settingsEN from "../../public/locales/en/settings.json";
import commonDA from "../../public/locales/da/common.json";
import groceriesDA from "../../public/locales/da/groceries.json";
import authDA from "../../public/locales/da/auth.json";
import settingsDA from "../../public/locales/da/settings.json";

export const defaultNS = "common";
export const resources = {
  en: {
    common: commonEN,
    groceries: groceriesEN,
    auth: authEN,
    settings: settingsEN,
  },
  da: {
    common: commonDA,
    groceries: groceriesDA,
    auth: authDA,
    settings: settingsDA,
  },
} as const;

i18n
  .use(LanguageDetector) // Detect language from browser
  .use(initReactI18next) // Bind to React
  .init({
    resources,
    fallbackLng: "en",
    supportedLngs: ["en", "es", "fr", "de", "pt", "da"],
    defaultNS,
    debug: true, // Enable debug to see what's happening

    interpolation: {
      escapeValue: false, // React already escapes
    },

    detection: {
      order: ["querystring", "cookie", "localStorage", "navigator"],
      caches: ["localStorage", "cookie"],
      lookupQuerystring: "lang",
      lookupCookie: "i18next",
      lookupLocalStorage: "i18nextLng",
    },

    react: {
      useSuspense: false,
    },
  });

export default i18n;
