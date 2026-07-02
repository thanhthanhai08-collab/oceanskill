import {permanentRedirect} from "next/navigation";

export default async function LegacyChatbotPage({params}: {readonly params: Promise<{locale: string}>}) {
  const {locale} = await params;
  permanentRedirect(`/${locale}/faq`);
}
