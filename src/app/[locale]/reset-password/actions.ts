"use server";

import {revalidatePath} from "next/cache";
import {getLocale, getTranslations} from "next-intl/server";
import {redirect} from "next/navigation";
import {createClient} from "@/lib/supabase/server";

const resetUrl = (locale: string, message: string) =>
  `/${locale}/reset-password?message=${encodeURIComponent(message)}`;

export async function updatePassword(formData: FormData) {
  const locale = await getLocale();
  const t = await getTranslations("Login");
  const password = String(formData.get("password") ?? "");

  if (password.length < 6) redirect(resetUrl(locale, t("shortPassword")));

  const supabase = await createClient();
  const {error} = await supabase.auth.updateUser({password});

  if (error) redirect(resetUrl(locale, error.message));

  revalidatePath(`/${locale}`, "layout");
  redirect(`/${locale}/login?message=${encodeURIComponent(t("passwordUpdated"))}`);
}
