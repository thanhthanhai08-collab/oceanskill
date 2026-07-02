import type {NextRequest} from "next/server";
import createMiddleware from "next-intl/middleware";
import {routing} from "@/i18n/routing";
import {updateSession} from "@/lib/supabase/proxy";

const handleI18nRouting = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  const hasLocale = routing.locales.some(
    (locale) => request.nextUrl.pathname === `/${locale}` || request.nextUrl.pathname.startsWith(`/${locale}/`)
  );
  if (!hasLocale) return handleI18nRouting(request);
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
