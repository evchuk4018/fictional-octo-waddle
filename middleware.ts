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
  const config = getSupabaseConfig();
  if (!config) {
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

  const publicPaths = ["/login", "/api/widgets/summary", "/manifest.webmanifest"];
  const isPublic = publicPaths.some((path) => request.nextUrl.pathname.startsWith(path));

  if (!session && !isPublic) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    return NextResponse.redirect(loginUrl);
  }

  if (session && request.nextUrl.pathname === "/login") {
    const dashboardUrl = request.nextUrl.clone();
    dashboardUrl.pathname = "/dashboard";
    return NextResponse.redirect(dashboardUrl);
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icons|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"]
};
