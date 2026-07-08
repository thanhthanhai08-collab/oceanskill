import type {NextRequest} from "next/server";
import createMiddleware from "next-intl/middleware";
import {routing} from "@/i18n/routing";
import {updateSession} from "@/lib/supabase/proxy";

const handleI18nRouting = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) return;
  const i18nResponse = handleI18nRouting(request);
  const hasLocale = routing.locales.some(
    (locale) => request.nextUrl.pathname === `/${locale}` || request.nextUrl.pathname.startsWith(`/${locale}/`)
  );
  if (!hasLocale) return i18nResponse;
  return updateSession(request, i18nResponse);
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
