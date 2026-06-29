import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { logout } from "./actions";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) redirect("/login");

  return (
    <main className="mx-auto min-h-screen w-full max-w-5xl px-6 py-16">
      <nav className="flex items-center justify-between">
        <span className="text-xl font-bold text-sky-950">OceanSkill</span>
        <form action={logout}><button className="rounded-full border border-slate-200 bg-white px-5 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Đăng xuất</button></form>
      </nav>
      <section className="mt-20 rounded-3xl bg-sky-950 p-10 text-white shadow-2xl shadow-sky-950/20">
        <p className="text-sm font-semibold uppercase tracking-[0.25em] text-cyan-300">Protected route</p>
        <h1 className="mt-4 text-4xl font-bold">Chào, {String(claims.email)}</h1>
        <p className="mt-4 max-w-xl text-lg leading-8 text-sky-100">Route này chỉ render sau khi Supabase xác thực chữ ký JWT ở phía server. Session được lưu trong cookie và tự động làm mới qua Next.js Proxy.</p>
      </section>
    </main>
  );
}
