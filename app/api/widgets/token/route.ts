import { NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "../../../../lib/auth";

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

  if (existing) {
    return NextResponse.json({ token: existing.token });
  }

  const { data: created, error: insertError } = await serviceClient
    .from("widget_tokens")
    .insert({ user_id: user.id })
    .select("token")
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  return NextResponse.json({ token: created.token });
}

export async function DELETE() {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createSupabaseServiceRoleClient();

  const { error } = await serviceClient.from("widget_tokens").delete().eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
