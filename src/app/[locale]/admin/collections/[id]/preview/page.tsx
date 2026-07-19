import type {Metadata} from "next";
import {notFound, redirect} from "next/navigation";
import {getPlatformAdmin} from "@/lib/admin/auth";
import {getCollectionDraft} from "@/lib/admin/content";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {robots: {index: false, follow: false}};

export default async function CollectionPreview({params}: {params: Promise<{locale: string; id: string}>}) {
  const {locale, id} = await params;
  if (!await getPlatformAdmin()) notFound();
  const draft = await getCollectionDraft(id);
  if (!draft || draft.status !== "review") notFound();
  redirect(`/${locale}/skills/collections/${draft.slug}?preview=${draft.id}`);
}
