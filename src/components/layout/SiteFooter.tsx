import {getTranslations} from "next-intl/server";
import {Link} from "@/i18n/navigation";

export default async function SiteFooter() {
  const [common, footer, navigation] = await Promise.all([getTranslations("Common"), getTranslations("Footer"), getTranslations("Navigation")]);
  return (
    <footer className="border-t border-outline-variant/30 bg-surface-container-lowest/50">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div>
          <Link href="/" className="font-geist text-xl font-bold text-primary">{common("brand")}</Link>
          <p className="mt-4 max-w-sm text-sm leading-6 text-on-surface-variant">{footer("description")}</p>
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-on-surface">{footer("platform")}</p>
          <div className="mt-4 flex flex-col gap-3 text-sm text-on-surface-variant">
            <Link href="/skills" className="hover:text-primary">{navigation("marketplace")}</Link>
            <Link href="/leaderboard" className="hover:text-primary">{navigation("leaderboard")}</Link>
            <Link href="/pricing" className="hover:text-primary">{navigation("pricing")}</Link>
            <Link href="/blog" className="hover:text-primary">{navigation("blog")}</Link>
            <Link href="/document" className="hover:text-primary">{navigation("docs")}</Link>
            <Link href="/faq" className="hover:text-primary">{navigation("faq")}</Link>
            <Link href="/dashboard" className="hover:text-primary">{common("dashboard")}</Link>
          </div>
        </div>
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.18em] text-on-surface">{footer("company")}</p>
          <div className="mt-4 flex flex-col gap-3 text-sm text-on-surface-variant">
            <Link href="/about" className="hover:text-primary">{navigation("about")}</Link>
            <Link href="/privacy" className="hover:text-primary">{footer("privacy")}</Link>
            <Link href="/terms" className="hover:text-primary">{footer("terms")}</Link>
          </div>
        </div>
      </div>
      <div className="border-t border-outline-variant/20 px-6 py-5 text-center font-mono text-xs text-on-surface-variant">{footer("copyright", {year: new Date().getFullYear()})}</div>
    </footer>
  );
}
