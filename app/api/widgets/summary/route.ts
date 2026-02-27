import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "../../../../lib/auth";
import { toPercent } from "../../../../lib/utils";

export async function GET() {
  try {
    console.log("[widget-summary] GET /api/widgets/summary called");
    const supabase = createSupabaseServerClient();

    const {
      data: { user },
      error: userError
    } = await supabase.auth.getUser();

    console.log("[widget-summary] user:", user ? user.id : "none", "error:", userError?.message ?? "none");

    if (userError || !user) {
      console.log("[widget-summary] returning 401 unauthorized");
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { data: tasks, error: tasksError } = await supabase
      .from("daily_tasks")
      .select("id,title,completed,medium_goals!inner(is_completed)")
      .eq("medium_goals.is_completed", false)
      .order("completed", { ascending: true })
      .limit(20);

    if (tasksError) {
      console.error("[widget-summary] tasks query error:", tasksError.message);
      return NextResponse.json({ ok: false, error: tasksError.message }, { status: 500 });
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

    console.log("[widget-summary] success tasks:", activeTasks.length, "completed:", completed);
    return NextResponse.json({
      ok: true,
      date,
      completionPercent,
      totalActiveTasks: activeTasks.length,
      completedActiveTasks: completed,
      nextIncompleteTask: nextIncomplete,
      tasks: activeTasks
    });
  } catch (err) {
    console.error("[widget-summary] unexpected error:", err);
    return NextResponse.json(
      {
        ok: false,
        error: "Widget summary failed",
        details: err instanceof Error ? err.message : "unknown error"
      },
      { status: 500 }
    );
  }
}
