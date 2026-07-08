import {getTranslations} from "next-intl/server";
import {NextResponse, type NextRequest} from "next/server";
import {createClient} from "@/lib/supabase/server";

export async function GET(request: NextRequest, {params}: {params: Promise<{locale: string}>}) {
  const {locale} = await params;
  const code = request.nextUrl.searchParams.get("code");

  if (code) {
    const supabase = await createClient();
    const {error} = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(`/${locale}/reset-password`, request.url));
  }

  const t = await getTranslations({locale, namespace: "Auth"});
  const url = new URL(`/${locale}/login`, request.url);
  url.searchParams.set("message", t("invalidReset"));
  return NextResponse.redirect(url);
}
