import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error("Missing Supabase environment variables.");
  }

  return { url, key };
}

export function createSupabaseServerClient() {
  const cookieStore = cookies();
  const { url, key } = getSupabaseConfig();

  return createServerClient(url, key, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          return;
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", ...options });
        } catch {
          return;
        }
      }
    }
  });
}

export async function getServerSession() {
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.auth.getSession();
  if (error) return null;
  return data.session;
}

export async function requireUser() {
  const session = await getServerSession();
  if (!session?.user) {
    redirect("/login");
  }
  return session.user;
}
