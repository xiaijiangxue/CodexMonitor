import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enCommon from "./en/common.json";
import enHome from "./en/home.json";
import enLayout from "./en/layout.json";
import enSettings from "./en/settings.json";
import zhCommon from "./zh-CN/common.json";
import zhHome from "./zh-CN/home.json";
import zhLayout from "./zh-CN/layout.json";
import zhSettings from "./zh-CN/settings.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        home: enHome,
        layout: enLayout,
        settings: enSettings,
      },
      "zh-CN": {
        common: zhCommon,
        home: zhHome,
        layout: zhLayout,
        settings: zhSettings,
      },
    },
    fallbackLng: "en",
    supportedLngs: ["en", "zh-CN"],
    defaultNS: "common",
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
    },
  });

export default i18n;
