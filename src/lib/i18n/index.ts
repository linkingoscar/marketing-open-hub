"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { navTranslations } from "./locales/nav";
import { homeTranslations } from "./locales/home";
import { workspaceTranslations } from "./locales/workspace";
import { settingsTranslations } from "./locales/settings";
import { commonTranslations } from "./locales/common";

type Lang = "zh" | "en";

interface I18nStore {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

/**
 * 合并所有模块化翻译文件
 * 按模块拆分便于维护和扩展
 */
const translations: Record<string, Record<Lang, string>> = {
  ...navTranslations,
  ...homeTranslations,
  ...workspaceTranslations,
  ...settingsTranslations,
  ...commonTranslations,
};

export const useI18n = create<I18nStore>()(
  persist(
    (set, get) => ({
      lang: "zh",
      setLang: (lang) => set({ lang }),
      t: (key: string) => {
        const entry = translations[key];
        if (!entry) return key;
        return entry[get().lang] ?? entry.zh ?? key;
      },
    }),
    { name: "martech-i18n" }
  )
);
