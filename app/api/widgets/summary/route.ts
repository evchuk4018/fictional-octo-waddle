import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/auth";
import { toPercent } from "../../../../lib/utils";

export async function GET() {
  const supabase = createSupabaseServerClient();

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: tasks, error: tasksError } = await supabase
    .from("daily_tasks")
    .select("id,title,completed,medium_goals!inner(is_completed)")
    .eq("medium_goals.is_completed", false)
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
    totalTodayTasks: activeTasks.length,
    completedTodayTasks: completed,
    totalActiveTasks: activeTasks.length,
    completedActiveTasks: completed,
    nextIncompleteTask: nextIncomplete,
    tasks: activeTasks
  });
}
