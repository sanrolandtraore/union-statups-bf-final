import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import fr from "./locales/fr.json";
import en from "./locales/en.json";

export const LANGUAGES = [
  { code: "fr", label: "Français", short: "FR", dir: "ltr", resource: fr },
  { code: "en", label: "English", short: "EN", dir: "ltr", resource: en },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];
export const DEFAULT_LANGUAGE: LanguageCode = "fr";
export const LANGUAGE_STORAGE_KEY = "unions.lang";

const resources = Object.fromEntries(LANGUAGES.map((l) => [l.code, { translation: l.resource }]));

const humanizeKey = (key: string) => {
  const last = (key || "").split(".").pop() || key || "";
  return last.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim().replace(/^./, (c) => c.toUpperCase());
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: DEFAULT_LANGUAGE,
    supportedLngs: LANGUAGES.map((l) => l.code),
    nonExplicitSupportedLngs: true,
    load: "languageOnly",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "htmlTag"],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ["localStorage"],
    },
    returnNull: false,
    parseMissingKeyHandler: (key, defaultValue) =>
      typeof defaultValue === "string" && defaultValue.length > 0 ? defaultValue : humanizeKey(key),
  });

const applyHtmlLang = (lng: string) => {
  const meta = LANGUAGES.find((l) => lng?.startsWith(l.code));
  document.documentElement.lang = meta?.code ?? DEFAULT_LANGUAGE;
  document.documentElement.dir = meta?.dir ?? "ltr";
};

applyHtmlLang(i18n.language || DEFAULT_LANGUAGE);
i18n.on("languageChanged", applyHtmlLang);

export default i18n;
