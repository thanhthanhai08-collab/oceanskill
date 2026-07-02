export const localeConfig = {
  vi: {label: "Tiếng Việt", shortLabel: "VI", hreflang: "vi-VN", openGraphLocale: "vi_VN"},
  en: {label: "English", shortLabel: "EN", hreflang: "en-US", openGraphLocale: "en_US"},
  // Future locale example: zh: {label: "中文", shortLabel: "ZH", hreflang: "zh-CN", openGraphLocale: "zh_CN"}
} as const;

export type Locale = keyof typeof localeConfig;
export const supportedLocales = Object.keys(localeConfig) as Locale[];
export const defaultLocale: Locale = "vi";
