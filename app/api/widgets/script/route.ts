import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "../../../../lib/auth";

const SCRIPT_PATH = path.join(process.cwd(), "public/widgets/ios-scriptable-widget.js");

function getSupabaseAuthCookieHeader() {
  const cookieStore = cookies();
  const allCookies = cookieStore.getAll();
  console.log("[widget-script] total cookies:", allCookies.length, "names:", allCookies.map((c) => c.name));

  const authCookies = allCookies
    .filter((cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"))
    .sort((left, right) => left.name.localeCompare(right.name, undefined, { numeric: true }));

  console.log("[widget-script] matched auth cookies:", authCookies.length, "names:", authCookies.map((c) => c.name));

  const header = authCookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
  console.log("[widget-script] auth cookie header length:", header.length);
  return header;
}

function escapeForScript(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

export async function GET() {
  console.log("[widget-script] GET /api/widgets/script called");
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  console.log("[widget-script] user:", user ? user.id : "none", "error:", userError?.message ?? "none");

  if (userError || !user) {
    console.log("[widget-script] returning 401 — user missing or error");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const authCookieHeader = getSupabaseAuthCookieHeader();
  if (!authCookieHeader) {
    console.log("[widget-script] returning 400 — no auth cookie found");
    return NextResponse.json({ error: "No active auth cookie found. Sign in again and retry." }, { status: 400 });
  }

  try {
    const template = await fs.readFile(SCRIPT_PATH, "utf8");
    console.log("[widget-script] template loaded, length:", template.length);
    const scriptWithAuthCookie = template.replace("YOUR_AUTH_COOKIE", escapeForScript(authCookieHeader));
    console.log("[widget-script] script built, length:", scriptWithAuthCookie.length, "cookie injected:", scriptWithAuthCookie.includes("YOUR_AUTH_COOKIE") ? "NO (still has placeholder!)" : "yes");

    return new NextResponse(scriptWithAuthCookie, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store"
      }
    });
  } catch (err) {
    console.error("[widget-script] template read/build error:", err);
    return NextResponse.json({ error: "Unable to build widget script" }, { status: 500 });
  }
}