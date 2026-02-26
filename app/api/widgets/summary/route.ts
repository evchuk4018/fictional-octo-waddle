import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient, createSupabaseServiceRoleClient } from "../../../../lib/auth";
import { toPercent } from "../../../../lib/utils";

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  let userId: string;

  if (token) {
    const serviceClient = createSupabaseServiceRoleClient();
    const { data, error } = await serviceClient
      .from("widget_tokens")
      .select("user_id")
      .eq("token", token)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    userId = data.user_id;
  } else {
    const supabase = createSupabaseServerClient();

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    userId = user.id;
  }

  const serviceClient = createSupabaseServiceRoleClient();

  const { data: tasks, error: tasksError } = await serviceClient
    .from("daily_tasks")
    .select(
      // daily_tasks → medium_goals → big_goals, filtering to the authenticated user's tasks
      "id,title,completed,medium_goals!inner(is_completed,big_goals!inner(user_id))"
    )
    .eq("medium_goals.is_completed", false)
    .eq("medium_goals.big_goals.user_id", userId)
    .order("completed", { ascending: true })
    .limit(20);

  if (tasksError) {
    return NextResponse.json({ error: tasksError.message }, { status: 500 });
  }

  const activeTasks = (tasks ?? []).map((task) => ({
    id: task.id,
    title: task.title,
    completed: task.completed
  }));
  const completed = activeTasks.filter((task) => task.completed).length;
  const completionPercent = toPercent(completed, activeTasks.length);
  const nextIncomplete = activeTasks.find((task) => !task.completed) ?? null;
  const date = new Date().toISOString().slice(0, 10);

  return NextResponse.json({
    date,
    completionPercent,
    totalActiveTasks: activeTasks.length,
    completedActiveTasks: completed,
    nextIncompleteTask: nextIncomplete,
    tasks: activeTasks
  });
}
