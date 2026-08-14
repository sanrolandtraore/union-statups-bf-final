import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import fr from "./locales/fr.json";
import en from "./locales/en.json";

/**
 * Registry of supported languages.
 * To add a new language (es, pt, ar…):
 *  1. create `src/i18n/locales/<code>.json`
 *  2. import it above
 *  3. add an entry here — nothing else to change.
 */
export const LANGUAGES = [
  { code: "fr", label: "Français", short: "FR", flag: "🇫🇷", dir: "ltr", resource: fr },
  { code: "en", label: "English", short: "EN", flag: "🇺🇸", dir: "ltr", resource: en },
] as const;

export type LanguageCode = (typeof LANGUAGES)[number]["code"];

export const DEFAULT_LANGUAGE: LanguageCode = "fr";
export const LANGUAGE_STORAGE_KEY = "unions.lang";

const resources = Object.fromEntries(
  LANGUAGES.map((l) => [l.code, { translation: l.resource }])
);

// Safety net: if a translation key is missing in every language,
// display a readable label built from the last segment instead of the raw key.
const humanizeKey = (key: string) => {
  const last = (key || "").split(".").pop() || key || "";
  return last
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^./, (c) => c.toUpperCase());
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
      // Respect an explicit user choice, otherwise start in French as declared
      // by the document instead of silently following the browser language.
      order: ["localStorage", "htmlTag"],
      lookupLocalStorage: LANGUAGE_STORAGE_KEY,
      caches: ["localStorage"],
    },
    returnNull: false,
    // Si un texte par défaut est fourni à t(), on l'utilise tel quel.
    // Sinon seulement, on "humanise" la clé pour éviter d'afficher du technique.
    parseMissingKeyHandler: (key, defaultValue) =>
      typeof defaultValue === "string" && defaultValue.length > 0
        ? defaultValue
        : humanizeKey(key),
  });

const applyHtmlLang = (lng: string) => {
  const meta = LANGUAGES.find((l) => lng?.startsWith(l.code));
  document.documentElement.lang = meta?.code ?? DEFAULT_LANGUAGE;
  document.documentElement.dir = meta?.dir ?? "ltr";
};

applyHtmlLang(i18n.language || DEFAULT_LANGUAGE);
i18n.on("languageChanged", applyHtmlLang);

export default i18n;
