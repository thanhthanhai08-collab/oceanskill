import {createServerClient} from "@supabase/ssr";
import {NextResponse, type NextRequest} from "next/server";

export async function updateSession(request: NextRequest, initialResponse = NextResponse.next({request})) {
  let response = initialResponse;
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)!,
    {
      cookies: {
        getAll: () => request.cookies.getAll(),
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({name, value}) => request.cookies.set(name, value));
          const preservedHeaders = new Headers(response.headers);
          response = NextResponse.next({request});
          preservedHeaders.forEach((value, key) => response.headers.set(key, value));
          cookiesToSet.forEach(({name, value, options}) => response.cookies.set(name, value, options));
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    },
  );

  const {data} = await supabase.auth.getClaims();
  const segments = request.nextUrl.pathname.split("/").filter(Boolean);
  const locale = segments[0] === "en" ? "en" : "vi";
  const page = segments[1];

  if (!data?.claims && page === "dashboard") {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    url.searchParams.set("message", locale === "vi" ? "Vui lòng đăng nhập để tiếp tục." : "Please sign in to continue.");
    return NextResponse.redirect(url);
  }
  if (data?.claims && (page === "login" || page === "signup")) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/dashboard`;
    url.search = "";
    return NextResponse.redirect(url);
  }
  return response;
}
