import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createSupabaseServerClient } from "../../../../lib/auth";

const SCRIPT_PATH = path.join(process.cwd(), "public/widgets/ios-scriptable-widget.js");

function getSupabaseAuthCookieHeader() {
  const cookieStore = cookies();
  const authCookies = cookieStore
    .getAll()
    .filter((cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"))
    .sort((left, right) => left.name.localeCompare(right.name, undefined, { numeric: true }));

  return authCookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
}

function escapeForScript(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

export async function GET() {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const authCookieHeader = getSupabaseAuthCookieHeader();
  if (!authCookieHeader) {
    return NextResponse.json({ error: "No active auth cookie found. Sign in again and retry." }, { status: 400 });
  }

  try {
    const template = await fs.readFile(SCRIPT_PATH, "utf8");
    const scriptWithAuthCookie = template.replace("YOUR_AUTH_COOKIE", escapeForScript(authCookieHeader));

    return new NextResponse(scriptWithAuthCookie, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store"
      }
    });
  } catch {
    return NextResponse.json({ error: "Unable to build widget script" }, { status: 500 });
  }
}