"use server";

import {revalidatePath} from "next/cache";
import {headers} from "next/headers";
import {getLocale, getTranslations} from "next-intl/server";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

const loginUrl = (locale: string, message: string) => `/${locale}/login?message=${encodeURIComponent(message)}`;

export async function login(formData: FormData) {
  const locale = await getLocale();
  const t = await getTranslations("Login");
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || !password) redirect(loginUrl(locale, t("missingFields")));
  const supabase = await createClient();
  const {error} = await supabase.auth.signInWithPassword({email, password});
  if (error) redirect(loginUrl(locale, error.message));
  revalidatePath(`/${locale}`, "layout");
  redirect(`/${locale}/dashboard`);
}

export async function signup(formData: FormData) {
  const locale = await getLocale();
  const t = await getTranslations("Login");
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  if (!email || password.length < 6) redirect(loginUrl(locale, t("shortPassword")));
  const origin = (await headers()).get("origin") ?? "http://localhost:3000";
  const supabase = await createClient();
  const {data, error} = await supabase.auth.signUp({
    email,
    password,
    options: {emailRedirectTo: `${origin}/${locale}/auth/confirm`}
  });
  if (error) redirect(loginUrl(locale, error.message));
  if (data.session) redirect(`/${locale}/dashboard`);
  redirect(loginUrl(locale, t("checkEmail")));
}
