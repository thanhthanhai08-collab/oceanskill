import {redirect} from "next/navigation";

export default async function AdminIndexPage({params}: {readonly params: Promise<{locale: string}>}) {
  const {locale} = await params;
  redirect(`/${locale}/admin/skills`);
}
