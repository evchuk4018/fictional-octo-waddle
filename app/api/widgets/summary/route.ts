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

  const today = new Date().toISOString().slice(0, 10);

  const { data: tasks, error: tasksError } = await supabase
    .from("daily_tasks")
    .select("id,title,completed,due_date")
    .eq("due_date", today)
    .order("completed", { ascending: true })
    .limit(20);

  if (tasksError) {
    return NextResponse.json({ error: tasksError.message }, { status: 500 });
  }

  const todayTasks = tasks ?? [];
  const completed = todayTasks.filter((task) => task.completed).length;
  const completionPercent = toPercent(completed, todayTasks.length);
  const nextIncomplete = todayTasks.find((task) => !task.completed) ?? null;

  return NextResponse.json({
    date: today,
    completionPercent,
    totalTodayTasks: todayTasks.length,
    completedTodayTasks: completed,
    nextIncompleteTask: nextIncomplete,
    tasks: todayTasks
  });
}
