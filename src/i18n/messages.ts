import type {Locale} from "@/i18n/locales";

async function loadEnglishMessages() {
  const [common, home, marketplace, skillDetail, leaderboard, dashboard, creatorSkills, auth, blog, docs, chatbot, faq, seo] = await Promise.all([
    import("../../messages/en/common.json"), import("../../messages/en/home.json"), import("../../messages/en/marketplace.json"), import("../../messages/en/skill-detail.json"),
    import("../../messages/en/leaderboard.json"), import("../../messages/en/dashboard.json"), import("../../messages/en/creator-skills.json"), import("../../messages/en/auth.json"), import("../../messages/en/blog.json"), import("../../messages/en/docs.json"), import("../../messages/en/chatbot.json"), import("../../messages/en/faq.json"), import("../../messages/en/seo.json"),
  ]);
  return {...common.default, ...home.default, ...marketplace.default, ...skillDetail.default, ...leaderboard.default, ...dashboard.default, ...creatorSkills.default, ...auth.default, ...blog.default, ...docs.default, ...chatbot.default, ...faq.default, ...seo.default};
}

async function loadVietnameseMessages() {
  const [common, home, marketplace, skillDetail, leaderboard, dashboard, creatorSkills, auth, blog, docs, chatbot, faq, seo] = await Promise.all([
    import("../../messages/vi/common.json"), import("../../messages/vi/home.json"), import("../../messages/vi/marketplace.json"), import("../../messages/vi/skill-detail.json"),
    import("../../messages/vi/leaderboard.json"), import("../../messages/vi/dashboard.json"), import("../../messages/vi/creator-skills.json"), import("../../messages/vi/auth.json"), import("../../messages/vi/blog.json"), import("../../messages/vi/docs.json"), import("../../messages/vi/chatbot.json"), import("../../messages/vi/faq.json"), import("../../messages/vi/seo.json"),
  ]);
  return {...common.default, ...home.default, ...marketplace.default, ...skillDetail.default, ...leaderboard.default, ...dashboard.default, ...creatorSkills.default, ...auth.default, ...blog.default, ...docs.default, ...chatbot.default, ...faq.default, ...seo.default};
}

export async function loadMessages(locale: Locale) {
  switch (locale) {
    case "en": return loadEnglishMessages();
    case "vi": return loadVietnameseMessages();
  }
}
