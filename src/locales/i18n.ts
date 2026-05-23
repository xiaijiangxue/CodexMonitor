import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

import enApp from "./en/app.json";
import enCommon from "./en/common.json";
import enComposer from "./en/composer.json";
import enGit from "./en/git.json";
import enHome from "./en/home.json";
import enLayout from "./en/layout.json";
import enMessages from "./en/messages.json";
import enSettings from "./en/settings.json";
import enThreads from "./en/threads.json";
import enWorkspaces from "./en/workspaces.json";
import zhApp from "./zh-CN/app.json";
import zhCommon from "./zh-CN/common.json";
import zhComposer from "./zh-CN/composer.json";
import zhGit from "./zh-CN/git.json";
import zhHome from "./zh-CN/home.json";
import zhLayout from "./zh-CN/layout.json";
import zhMessages from "./zh-CN/messages.json";
import zhSettings from "./zh-CN/settings.json";
import zhThreads from "./zh-CN/threads.json";
import zhWorkspaces from "./zh-CN/workspaces.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        app: enApp,
        common: enCommon,
        composer: enComposer,
        git: enGit,
        home: enHome,
        layout: enLayout,
        messages: enMessages,
        settings: enSettings,
        threads: enThreads,
        workspaces: enWorkspaces,
      },
      "zh-CN": {
        app: zhApp,
        common: zhCommon,
        composer: zhComposer,
        git: zhGit,
        home: zhHome,
        layout: zhLayout,
        messages: zhMessages,
        settings: zhSettings,
        threads: zhThreads,
        workspaces: zhWorkspaces,
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
