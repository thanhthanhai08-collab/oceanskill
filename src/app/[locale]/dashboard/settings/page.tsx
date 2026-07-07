import {getTranslations} from "next-intl/server";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";
import {logout} from "../actions";

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
  const labels = locale === "vi" ? {
    eyebrow: "Cai dat tai khoan",
    description: "Quan ly tai khoan, bao mat va tuy chinh trai nghiem OceanSkill cua ban.",
    account: "Ho so ca nhan",
    noDisplayName: "Chua co ten hien thi",
    displayName: "Ho va ten",
    displayNamePlaceholder: "Nhap ten hien thi",
    email: "Email",
    save: "Luu thay doi",
    security: "Bao mat",
    notifications: "Thong bao",
    logout: "Dang xuat",
  } : {
    eyebrow: "Account settings",
    description: "Manage your account, security, and OceanSkill experience.",
    account: "Personal profile",
    noDisplayName: "No display name",
    displayName: "Display name",
    displayNamePlaceholder: "Enter display name",
    email: "Email",
    save: "Save changes",
    security: "Security",
    notifications: "Notifications",
    logout: "Logout",
  };
  const displayName = profile?.display_name ?? labels.noDisplayName;
  const email = profile?.email ?? String(claimsData?.claims?.email ?? "");
  const avatarInitial = displayName?.[0]?.toUpperCase() ?? email?.[0]?.toUpperCase() ?? "?";

  return (
    <>
      <header className="mb-10">
        <p className="font-mono text-xs uppercase tracking-[0.2em] text-tertiary">{labels.eyebrow}</p>
        <h1 className="mt-3 font-geist text-4xl font-bold tracking-tight">{t("settings")}</h1>
        <p className="mt-3 max-w-2xl text-on-surface-variant">{labels.description}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-12">
        <section className="rounded-xl border border-white/10 bg-surface-container-low/65 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.18)] lg:col-span-8 lg:p-8">
          <div className="mb-7 flex items-center gap-4">
            <span className="material-symbols-outlined text-3xl text-primary">account_circle</span>
            <h2 className="font-geist text-2xl font-bold">{labels.account}</h2>
          </div>
          <div className="flex flex-col gap-5 md:flex-row md:items-center">
            <div className="relative">
              {profile?.avatar_url ? (
                <div
                  aria-label=""
                  className="h-24 w-24 rounded-full border-2 border-primary/50 bg-cover bg-center"
                  style={{backgroundImage: `url(${profile.avatar_url})`}}
                />
              ) : (
                <div className="grid h-24 w-24 place-items-center rounded-full border-2 border-primary/50 bg-gradient-to-br from-primary-container to-secondary-container font-geist text-3xl font-bold">
                  {avatarInitial}
                </div>
              )}
              <span className="absolute bottom-0 right-0 grid h-8 w-8 place-items-center rounded-full bg-primary text-on-primary shadow-lg">
                <span className="material-symbols-outlined text-sm">edit</span>
              </span>
            </div>
            <div>
              <p className="font-semibold">{displayName}</p>
              <p className="mt-1 text-sm text-on-surface-variant">{email}</p>
              <p className="mt-3 max-w-md text-xs leading-5 text-on-surface-variant">Profile image should be at least 400x400px. JPG or PNG works best.</p>
            </div>
          </div>

          <form className="mt-8 space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <label className="space-y-2">
                <span className="block font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">{labels.displayName}</span>
                <input
                  name="displayName"
                  type="text"
                  defaultValue={profile?.display_name ?? ""}
                  placeholder={labels.displayNamePlaceholder}
                  className="w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm outline-none transition focus:border-primary"
                />
              </label>
              <label className="space-y-2">
                <span className="block font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">{labels.email}</span>
                <input
                  type="email"
                  defaultValue={email}
                  disabled
                  className="w-full cursor-not-allowed rounded-lg border border-outline-variant/30 bg-surface-container-lowest/70 px-4 py-3 text-sm text-on-surface-variant"
                />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="block font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">Bio</span>
                <textarea
                  rows={4}
                  placeholder="Share a short note about your AI work..."
                  className="w-full resize-none rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm outline-none transition focus:border-primary"
                />
              </label>
            </div>
            <div className="flex justify-end">
              <button type="submit" disabled className="rounded-xl bg-primary-container px-6 py-3 text-sm font-bold text-on-primary-container opacity-70 transition hover:opacity-90">
                {labels.save}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-xl border border-white/10 bg-surface-container-low/65 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.18)] lg:col-span-4 lg:p-8">
          <div className="mb-7 flex items-center gap-4">
            <span className="material-symbols-outlined text-3xl text-tertiary">palette</span>
            <h2 className="font-geist text-2xl font-bold">Appearance</h2>
          </div>
          <div className="space-y-6">
            <div>
              <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">Display mode</p>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" className="flex flex-col items-center justify-center rounded-xl border border-primary bg-primary/10 p-4 text-primary">
                  <span className="material-symbols-outlined mb-2">dark_mode</span>
                  <span className="text-sm font-semibold">Dark</span>
                </button>
                <button type="button" className="flex flex-col items-center justify-center rounded-xl border border-outline-variant/40 p-4 text-on-surface-variant transition hover:bg-surface-container-high">
                  <span className="material-symbols-outlined mb-2">light_mode</span>
                  <span className="text-sm font-semibold">Light</span>
                </button>
              </div>
            </div>
            <label className="block space-y-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">System language</span>
              <select defaultValue={locale} className="w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm outline-none focus:border-primary">
                <option value="vi">Tieng Viet</option>
                <option value="en">English</option>
              </select>
            </label>
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-surface-container-low/65 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.18)] lg:col-span-8 lg:p-8">
          <div className="mb-7 flex items-center gap-4">
            <span className="material-symbols-outlined text-3xl text-secondary">shield</span>
            <h2 className="font-geist text-2xl font-bold">{labels.security}</h2>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-4 rounded-xl border border-outline-variant/30 bg-surface-container p-4">
              <div>
                <p className="font-semibold">Password</p>
                <p className="mt-1 text-sm text-on-surface-variant">Update your password regularly to protect the account.</p>
              </div>
              <button className="rounded-lg bg-surface-container-high px-4 py-2 text-sm font-bold transition hover:bg-surface-container-highest">Change</button>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-xl border border-outline-variant/30 bg-surface-container p-4">
              <div>
                <p className="font-semibold">Two-factor authentication</p>
                <p className="mt-1 text-sm text-on-surface-variant">Add a second verification layer for sensitive actions.</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" defaultChecked className="peer sr-only" />
                <span className="h-6 w-11 rounded-full bg-surface-variant after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full" />
              </label>
            </div>
            <div className="pt-2">
              <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">Active sessions</p>
              <div className="divide-y divide-outline-variant/20">
                <div className="flex items-center justify-between gap-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">desktop_windows</span>
                    <div><p className="font-semibold">Chrome on Windows</p><p className="text-sm text-on-surface-variant">Current session</p></div>
                  </div>
                  <span className="text-sm font-bold text-primary">Current</span>
                </div>
                <div className="flex items-center justify-between gap-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-on-surface-variant">smartphone</span>
                    <div><p className="font-semibold">Mobile browser</p><p className="text-sm text-on-surface-variant">Recently active</p></div>
                  </div>
                  <form action={logout}><button className="text-sm font-bold text-error hover:underline">{labels.logout}</button></form>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-xl border border-white/10 bg-surface-container-low/65 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.18)] lg:col-span-4 lg:p-8">
          <div className="mb-7 flex items-center gap-4">
            <span className="material-symbols-outlined text-3xl text-primary">notifications</span>
            <h2 className="font-geist text-2xl font-bold">{labels.notifications}</h2>
          </div>
          <div className="space-y-4">
            {[
              ["Email notifications", "Security, billing, and product updates by email.", true],
              ["Push notifications", "Browser notifications for important events.", true],
              ["Marketing messages", "Offers and new model updates.", false],
            ].map(([label, description, checked]) => (
              <label key={label as string} className="flex cursor-pointer items-start gap-3 rounded-lg p-2 transition hover:bg-white/[0.03]">
                <input type="checkbox" defaultChecked={Boolean(checked)} className="mt-1 h-5 w-5 rounded border-outline-variant bg-surface-container-lowest text-primary" />
                <span>
                  <span className="block font-semibold">{label}</span>
                  <span className="mt-1 block text-sm text-on-surface-variant">{description}</span>
                </span>
              </label>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
