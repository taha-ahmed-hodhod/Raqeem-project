import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/lib/i18n/routing";

const intlProxy = createMiddleware(routing);

async function refreshAdminSupabaseSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return response;
  }

        // Skip network call if no Supabase session cookie exists on the request
        const hasSupabaseCookie = request.cookies
          .getAll()
          .some((cookie) => cookie.name.startsWith("sb-"));
        if (!hasSupabaseCookie) {
          return response;
        }

        try {
          const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
            cookies: {
              getAll() {
                return request.cookies.getAll();
              },
              setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) => {
                  request.cookies.set(name, value);
                });
                response = NextResponse.next({
                  request,
                });
                cookiesToSet.forEach(({ name, value, options }) => {
                  response.cookies.set(name, value, options);
                });
              },
            },
});

await supabase.auth.getUser();
  } catch {
  // Never crash middleware/proxy or trigger a dev reload loop on transient network errors
}

return response;
}

export default async function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin")) {
    return refreshAdminSupabaseSession(request);
  }
  return intlProxy(request);
}

export const config = {
  matcher: ["/", "/(ar|en)/:path*", "/admin/:path*"],
};
