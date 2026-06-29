import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-6 py-8">
      <nav className="flex items-center justify-between">
        <span className="text-xl font-black tracking-tight text-sky-950">OceanSkill</span>
        <Link href={signedIn ? "/dashboard" : "/login"} className="rounded-full bg-sky-950 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-800">{signedIn ? "Vào dashboard" : "Đăng nhập"}</Link>
      </nav>
      <section className="grid flex-1 items-center gap-12 py-20 md:grid-cols-[1.2fr_0.8fr]">
        <div>
          <p className="font-semibold uppercase tracking-[0.3em] text-sky-600">Learn deeper</p>
          <h1 className="mt-5 max-w-3xl text-5xl font-black leading-[1.05] tracking-tight text-slate-950 sm:text-7xl">Kỹ năng vững vàng như đại dương.</h1>
          <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600">Nền tảng học tập cá nhân với tài khoản an toàn, session SSR và nội dung chỉ dành cho thành viên.</p>
          <Link href={signedIn ? "/dashboard" : "/login"} className="mt-9 inline-flex rounded-2xl bg-sky-600 px-7 py-4 font-bold text-white shadow-lg shadow-sky-600/20 hover:bg-sky-700">{signedIn ? "Tiếp tục học" : "Bắt đầu miễn phí"} →</Link>
        </div>
        <div className="relative aspect-square overflow-hidden rounded-[2.5rem] bg-sky-950 p-8 text-white shadow-2xl shadow-sky-950/20">
          <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-cyan-400/30 blur-2xl" />
          <div className="absolute -bottom-20 -left-20 h-72 w-72 rounded-full bg-blue-500/40 blur-3xl" />
          <div className="relative flex h-full flex-col justify-end"><span className="text-8xl">🌊</span><p className="mt-8 text-2xl font-bold">Supabase Auth</p><p className="mt-2 text-sky-200">Cookie-based SSR · PKCE · Protected routes</p></div>
        </div>
      </section>
    </main>
  );
}
