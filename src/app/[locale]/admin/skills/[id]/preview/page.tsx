import type {Metadata} from "next";
import {notFound, redirect} from "next/navigation";
import {getPlatformAdmin} from "@/lib/admin/auth";
import {listPlatformSkillDrafts} from "@/lib/skills/platform-publishing";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {robots: {index: false, follow: false}};

export default async function SkillDraftPreview({params}: {params: Promise<{locale: string; id: string}>}) {
  const {locale, id} = await params;
  if (!await getPlatformAdmin()) notFound();
  const draft = (await listPlatformSkillDrafts()).find((item) => item.id === id && item.status === "review");
  if (!draft?.skills?.slug) notFound();
  redirect(`/${locale}/skills/${draft.skills.slug}?preview=${draft.id}`);
}
