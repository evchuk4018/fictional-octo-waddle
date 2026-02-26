import { promises as fs } from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "../../../../lib/auth";

const SCRIPT_PATH = path.join(process.cwd(), "public/widgets/ios-scriptable-widget.js");

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

  const serviceClient = createSupabaseServiceRoleClient();

  const { data: existing, error: selectError } = await serviceClient
    .from("widget_tokens")
    .select("token")
    .eq("user_id", user.id)
    .maybeSingle();

  if (selectError) {
    return NextResponse.json({ error: selectError.message }, { status: 500 });
  }

  let widgetToken: string;

  if (existing) {
    widgetToken = existing.token;
  } else {
    const { data: created, error: insertError } = await serviceClient
      .from("widget_tokens")
      .insert({ user_id: user.id })
      .select("token")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    widgetToken = created.token;
  }

  try {
    const template = await fs.readFile(SCRIPT_PATH, "utf8");
    const scriptWithToken = template.replace("YOUR_WIDGET_TOKEN", escapeForScript(widgetToken));

    return new NextResponse(scriptWithToken, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store"
      }
    });
  } catch {
    return NextResponse.json({ error: "Unable to build widget script" }, { status: 500 });
  }
}