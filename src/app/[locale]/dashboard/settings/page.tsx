import {getTranslations} from "next-intl/server";
import {redirect} from "next/navigation";
import ProfileAvatarUploader from "@/components/dashboard/ProfileAvatarUploader";
import {createClient} from "@/lib/supabase/server";
import {logout, updateAvatar} from "../actions";

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
    eyebrow: "Cài đặt tài khoản",
    description: "Quản lý tài khoản, bảo mật và tùy chỉnh trải nghiệm OceanSkill của bạn.",
    account: "Hồ sơ cá nhân",
    noDisplayName: "Chưa có tên hiển thị",
    displayName: "Họ và tên",
    displayNamePlaceholder: "Nhập tên hiển thị",
    email: "Email",
    save: "Lưu thay đổi",
    security: "Bảo mật",
    notifications: "Thông báo",
    logout: "Đăng xuất",
    imageHint: "Ảnh hồ sơ nên có kích thước tối thiểu 400x400px. JPG hoặc PNG là phù hợp nhất.",
    avatarChoose: "Chọn ảnh",
    avatarUpload: "Tải lên",
    avatarUploading: "Đang tải...",
    avatarUpdated: "Ảnh đại diện đã được cập nhật.",
    bio: "Tiểu sử",
    bioPlaceholder: "Chia sẻ ngắn về công việc AI của bạn...",
    appearance: "Giao diện",
    displayMode: "Chế độ hiển thị",
    dark: "Tối",
    light: "Sáng",
    systemLanguage: "Ngôn ngữ hệ thống",
    vietnamese: "Tiếng Việt",
    password: "Mật khẩu",
    passwordDescription: "Cập nhật mật khẩu định kỳ để bảo vệ tài khoản.",
    change: "Thay đổi",
    twoFactor: "Xác thực hai lớp",
    twoFactorDescription: "Thêm một lớp xác minh cho các thao tác nhạy cảm.",
    activeSessions: "Phiên đang hoạt động",
    currentDevice: "Chrome trên Windows",
    currentSession: "Phiên hiện tại",
    mobileBrowser: "Trình duyệt di động",
    recentlyActive: "Hoạt động gần đây",
    current: "Hiện tại",
    notificationRows: [
      ["Thông báo email", "Bảo mật, thanh toán và cập nhật sản phẩm qua email.", true],
      ["Thông báo đẩy", "Thông báo trình duyệt cho các sự kiện quan trọng.", true],
      ["Tin nhắn marketing", "Ưu đãi và cập nhật model mới.", false],
    ],
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
    imageHint: "Profile image should be at least 400x400px. JPG or PNG works best.",
    avatarChoose: "Choose image",
    avatarUpload: "Upload",
    avatarUploading: "Uploading...",
    avatarUpdated: "Avatar updated.",
    bio: "Bio",
    bioPlaceholder: "Share a short note about your AI work...",
    appearance: "Appearance",
    displayMode: "Display mode",
    dark: "Dark",
    light: "Light",
    systemLanguage: "System language",
    vietnamese: "Vietnamese",
    password: "Password",
    passwordDescription: "Update your password regularly to protect the account.",
    change: "Change",
    twoFactor: "Two-factor authentication",
    twoFactorDescription: "Add a second verification layer for sensitive actions.",
    activeSessions: "Active sessions",
    currentDevice: "Chrome on Windows",
    currentSession: "Current session",
    mobileBrowser: "Mobile browser",
    recentlyActive: "Recently active",
    current: "Current",
    notificationRows: [
      ["Email notifications", "Security, billing, and product updates by email.", true],
      ["Push notifications", "Browser notifications for important events.", true],
      ["Marketing messages", "Offers and new model updates.", false],
    ],
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
          <ProfileAvatarUploader
            displayName={displayName}
            email={email}
            avatarUrl={profile?.avatar_url ?? null}
            avatarInitial={avatarInitial}
            hint={labels.imageHint}
            action={updateAvatar}
            labels={{
              choose: labels.avatarChoose,
              upload: labels.avatarUpload,
              uploading: labels.avatarUploading,
              updated: labels.avatarUpdated,
            }}
          />

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
                <span className="block font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">{labels.bio}</span>
                <textarea
                  rows={4}
                  placeholder={labels.bioPlaceholder}
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
            <h2 className="font-geist text-2xl font-bold">{labels.appearance}</h2>
          </div>
          <div className="space-y-6">
            <div>
              <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">{labels.displayMode}</p>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" className="flex flex-col items-center justify-center rounded-xl border border-primary bg-primary/10 p-4 text-primary">
                  <span className="material-symbols-outlined mb-2">dark_mode</span>
                  <span className="text-sm font-semibold">{labels.dark}</span>
                </button>
                <button type="button" className="flex flex-col items-center justify-center rounded-xl border border-outline-variant/40 p-4 text-on-surface-variant transition hover:bg-surface-container-high">
                  <span className="material-symbols-outlined mb-2">light_mode</span>
                  <span className="text-sm font-semibold">{labels.light}</span>
                </button>
              </div>
            </div>
            <label className="block space-y-2">
              <span className="font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">{labels.systemLanguage}</span>
              <select defaultValue={locale} className="w-full rounded-lg border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm outline-none focus:border-primary">
                <option value="vi">{labels.vietnamese}</option>
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
                <p className="font-semibold">{labels.password}</p>
                <p className="mt-1 text-sm text-on-surface-variant">{labels.passwordDescription}</p>
              </div>
              <button className="rounded-lg bg-surface-container-high px-4 py-2 text-sm font-bold transition hover:bg-surface-container-highest">{labels.change}</button>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-xl border border-outline-variant/30 bg-surface-container p-4">
              <div>
                <p className="font-semibold">{labels.twoFactor}</p>
                <p className="mt-1 text-sm text-on-surface-variant">{labels.twoFactorDescription}</p>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input type="checkbox" defaultChecked className="peer sr-only" />
                <span className="h-6 w-11 rounded-full bg-surface-variant after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:transition-all peer-checked:bg-primary peer-checked:after:translate-x-full" />
              </label>
            </div>
            <div className="pt-2">
              <p className="mb-3 font-mono text-[10px] uppercase tracking-wider text-on-surface-variant">{labels.activeSessions}</p>
              <div className="divide-y divide-outline-variant/20">
                <div className="flex items-center justify-between gap-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-primary">desktop_windows</span>
                    <div><p className="font-semibold">{labels.currentDevice}</p><p className="text-sm text-on-surface-variant">{labels.currentSession}</p></div>
                  </div>
                  <span className="text-sm font-bold text-primary">{labels.current}</span>
                </div>
                <div className="flex items-center justify-between gap-4 py-3">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-on-surface-variant">smartphone</span>
                    <div><p className="font-semibold">{labels.mobileBrowser}</p><p className="text-sm text-on-surface-variant">{labels.recentlyActive}</p></div>
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
            {labels.notificationRows.map(([label, description, checked]) => (
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
