import {getTranslations} from "next-intl/server";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function SettingsAccountPage({params}: {readonly params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const supabase = await createClient();
  const {data: claimsData} = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) redirect(`/${locale}/login`);

  const {data: profile} = await supabase
    .from("profiles")
    .select("display_name,email,avatar_url")
    .eq("id", String(userId))
    .maybeSingle();

  const t = await getTranslations("Dashboard");

  return (
    <>
      <header>
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-tertiary">{t("settingsEyebrow")}</p>
        <h1 className="mt-3 font-geist text-3xl font-bold tracking-tight">{t("settingsAccount")}</h1>
        <p className="mt-3 max-w-2xl text-on-surface-variant">{t("settingsAccountDescription")}</p>
      </header>

      <section className="mt-8 rounded-2xl border border-outline-variant/40 bg-surface-container-low/65 p-6">
        {/* Avatar */}
        <div className="mb-7 flex items-center gap-5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-container to-secondary-container text-2xl font-bold">
            {profile?.display_name?.[0]?.toUpperCase() ?? profile?.email?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <p className="font-geist font-semibold">{profile?.display_name ?? t("noDisplayName")}</p>
            <p className="text-sm text-on-surface-variant">{profile?.email ?? ""}</p>
          </div>
        </div>

        <form className="space-y-5">
          <div>
            <label htmlFor="display-name" className="mb-1.5 block text-sm font-semibold">{t("fieldDisplayName")}</label>
            <input
              id="display-name"
              name="displayName"
              type="text"
              defaultValue={profile?.display_name ?? ""}
              placeholder={t("placeholderDisplayName")}
              className="w-full rounded-xl border border-outline-variant/50 bg-surface-container px-4 py-3 text-sm outline-none ring-primary/30 transition focus:border-primary/50 focus:ring-2"
            />
          </div>
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-semibold">{t("fieldEmail")}</label>
            <input
              id="email"
              type="email"
              defaultValue={profile?.email ?? ""}
              disabled
              className="w-full cursor-not-allowed rounded-xl border border-outline-variant/30 bg-surface-container/50 px-4 py-3 text-sm text-on-surface-variant"
            />
            <p className="mt-1.5 text-xs text-on-surface-variant">{t("emailChangeHint")}</p>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled
              className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-on-primary opacity-60 transition hover:opacity-80"
            >
              {t("saveChanges")} <span className="ml-1 text-[10px] opacity-70">(coming soon)</span>
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
