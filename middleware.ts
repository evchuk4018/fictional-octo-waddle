import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return null;
  }
  return { url, key };
}

export async function middleware(request: NextRequest) {
  console.log("[middleware] path:", request.nextUrl.pathname);

  const config = getSupabaseConfig();
  if (!config) {
    console.log("[middleware] no supabase config, passing through");
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers
    }
  });

  const supabase = createServerClient(config.url, config.key, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        request.cookies.set({ name, value, ...options });
        response = NextResponse.next({
          request: {
            headers: request.headers
          }
        });
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options: CookieOptions) {
        request.cookies.set({ name, value: "", ...options });
        response = NextResponse.next({
          request: {
            headers: request.headers
          }
        });
        response.cookies.set({ name, value: "", ...options });
      }
    }
  });

  const {
    data: { session }
  } = await supabase.auth.getSession();

  console.log("[middleware] session:", session ? "exists" : "none", "path:", request.nextUrl.pathname);

  const publicPaths = ["/login", "/api/widgets/summary", "/api/widgets/script", "/manifest.webmanifest"];
  const isPublic = publicPaths.some((p) => request.nextUrl.pathname.startsWith(p));

  if (isPublic) {
    console.log("[middleware] public path, passing through:", request.nextUrl.pathname);
  }

  if (!session && !isPublic) {
    console.log("[middleware] no session, redirecting to /login");
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  if (session && request.nextUrl.pathname === "/login") {
    console.log("[middleware] has session on /login, redirecting to /dashboard");
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  console.log("[middleware] passing through for path:", request.nextUrl.pathname);
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
