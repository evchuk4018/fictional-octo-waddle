import { DailyTask } from "../types/db";

const TASK_CACHE_KEY = "goal-tracker.active-tasks";

export function persistCachedTasks(tasks: DailyTask[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TASK_CACHE_KEY, JSON.stringify(tasks));
}

export function readCachedTasks(): DailyTask[] {
  if (typeof window === "undefined") return [];

  const raw = window.localStorage.getItem(TASK_CACHE_KEY);
  if (!raw) return [];

  try {
    return (JSON.parse(raw) as Array<DailyTask & { order_index?: number }>).map((task) => ({
      ...task,
      order_index: task.order_index ?? 0
    }));
  } catch {
    return [];
  }
}
