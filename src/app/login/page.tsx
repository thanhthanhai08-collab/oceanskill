import Link from "next/link";
import { login, signup } from "./actions";

export default async function LoginPage({ searchParams }: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;
  return (
    <main className="grid min-h-screen place-items-center px-6 py-16">
      <section className="w-full max-w-md rounded-3xl border border-sky-100 bg-white/90 p-8 shadow-xl shadow-sky-950/10 backdrop-blur">
        <Link href="/" className="text-sm font-semibold text-sky-700">← OceanSkill</Link>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-slate-950">Chào mừng trở lại</h1>
        <p className="mt-2 text-slate-600">Đăng nhập hoặc tạo tài khoản để vào vùng học tập riêng.</p>
        {message && <p className="mt-5 rounded-xl bg-sky-50 px-4 py-3 text-sm text-sky-900">{message}</p>}
        <form className="mt-6 space-y-4">
          <label className="block text-sm font-medium text-slate-700">Email
            <input name="email" type="email" autoComplete="email" required className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100" placeholder="ban@example.com" />
          </label>
          <label className="block text-sm font-medium text-slate-700">Mật khẩu
            <input name="password" type="password" autoComplete="current-password" minLength={6} required className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none transition focus:border-sky-500 focus:ring-4 focus:ring-sky-100" placeholder="Ít nhất 6 ký tự" />
          </label>
          <button formAction={login} className="w-full rounded-xl bg-sky-600 px-4 py-3 font-semibold text-white transition hover:bg-sky-700">Đăng nhập</button>
          <button formAction={signup} className="w-full rounded-xl border border-sky-200 px-4 py-3 font-semibold text-sky-800 transition hover:bg-sky-50">Tạo tài khoản</button>
        </form>
      </section>
    </main>
  );
}
