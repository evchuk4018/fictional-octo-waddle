"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "../lib/supabase";
import { DailyTask } from "../types/db";
import { readCachedTasks, persistCachedTasks } from "./task-cache";
import { GOALS_QUERY_KEY, TASKS_QUERY_KEY, TASK_CALENDAR_QUERY_KEY } from "./query-keys";
import { runTwoPhaseOrderUpdate, withReorderedIndexes } from "./reorder-utils";
import type { GoalStats } from "./use-goals";

const ACTIVE_TASKS_SELECT =
  "id,medium_goal_id,title,completed,order_index,medium_goals!inner(is_completed,order_index,big_goals!inner(order_index))";

function currentIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function mapActiveTaskRows(rows: Array<Pick<DailyTask, "id" | "medium_goal_id" | "title" | "completed" | "order_index">>): DailyTask[] {
  return rows.map((task) => ({
    id: task.id,
    medium_goal_id: task.medium_goal_id,
    title: task.title,
    completed: task.completed,
    order_index: task.order_index
  }));
}

type CalendarDayStatus = {
  date: string;
  status: "none" | "partial" | "all";
};

function monthDateRange() {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = now.getUTCMonth();
  const start = new Date(Date.UTC(year, month, 1));
  const end = new Date(Date.UTC(year, month + 1, 0));

  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    totalDays: end.getUTCDate()
  };
}

export function useActiveTasks() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  return useQuery({
    queryKey: TASKS_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_tasks")
        .select(ACTIVE_TASKS_SELECT)
        .eq("medium_goals.is_completed", false);

      if (error) {
        const cached = readCachedTasks();
        if (cached.length > 0) return cached;
        throw error;
      }

      const tasks = ((data ?? []) as Array<
        Pick<DailyTask, "id" | "medium_goal_id" | "title" | "completed" | "order_index"> & {
          medium_goals: Array<{ order_index: number; big_goals: Array<{ order_index: number }> }>;
        }
      >)
        .sort((a, b) => {
          const aMediumOrder = a.medium_goals[0]?.order_index ?? Number.MAX_SAFE_INTEGER;
          const bMediumOrder = b.medium_goals[0]?.order_index ?? Number.MAX_SAFE_INTEGER;
          const aBigOrder = a.medium_goals[0]?.big_goals?.[0]?.order_index ?? Number.MAX_SAFE_INTEGER;
          const bBigOrder = b.medium_goals[0]?.big_goals?.[0]?.order_index ?? Number.MAX_SAFE_INTEGER;

          const bigOrderDelta = aBigOrder - bBigOrder;
          if (bigOrderDelta !== 0) return bigOrderDelta;

          const mediumOrderDelta = aMediumOrder - bMediumOrder;
          if (mediumOrderDelta !== 0) return mediumOrderDelta;

          const taskOrderDelta = a.order_index - b.order_index;
          if (taskOrderDelta !== 0) return taskOrderDelta;

          return a.title.localeCompare(b.title);
        });

      const mappedTasks = mapActiveTaskRows(tasks);

      persistCachedTasks(mappedTasks);
      return mappedTasks;
    }
  });
}

export function useTaskCalendar() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  return useQuery({
    queryKey: TASK_CALENDAR_QUERY_KEY,
    queryFn: async () => {
      const { startDate, endDate, totalDays } = monthDateRange();

      const { data: activeTasks, error: activeTasksError } = await supabase
        .from("daily_tasks")
        .select(ACTIVE_TASKS_SELECT)
        .eq("medium_goals.is_completed", false);

      if (activeTasksError) throw activeTasksError;

      const activeTaskRows = mapActiveTaskRows(
        (activeTasks ?? []) as Array<Pick<DailyTask, "id" | "medium_goal_id" | "title" | "completed" | "order_index">>
      );
      const activeTaskIds = activeTaskRows.map((task) => task.id);
      const completedByDate = new Map<string, number>();

      if (activeTaskIds.length > 0) {
        const { data: checkins, error: checkinsError } = await supabase
          .from("daily_task_checkins")
          .select("task_id,checkin_date,completed")
          .gte("checkin_date", startDate)
          .lte("checkin_date", endDate)
          .in("task_id", activeTaskIds);

        if (checkinsError) throw checkinsError;

        for (const checkin of checkins ?? []) {
          if (!checkin.completed) continue;
          const currentCount = completedByDate.get(checkin.checkin_date) ?? 0;
          completedByDate.set(checkin.checkin_date, currentCount + 1);
        }
      }

      const calendar: CalendarDayStatus[] = [];
      const now = new Date();
      const year = now.getUTCFullYear();
      const month = now.getUTCMonth();

      for (let day = 1; day <= totalDays; day += 1) {
        const date = new Date(Date.UTC(year, month, day)).toISOString().slice(0, 10);
        const completedCount = completedByDate.get(date) ?? 0;

        let status: CalendarDayStatus["status"] = "none";
        if (completedCount > 0 && completedCount < activeTaskIds.length) {
          status = "partial";
        }
        if (activeTaskIds.length > 0 && completedCount >= activeTaskIds.length) {
          status = "all";
        }

        calendar.push({ date, status });
      }

      return calendar;
    }
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  return useMutation({
    mutationFn: async (payload: { mediumGoalId: string; title: string }) => {
      const { data: latestTask, error: latestTaskError } = await supabase
        .from("daily_tasks")
        .select("order_index")
        .eq("medium_goal_id", payload.mediumGoalId)
        .order("order_index", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestTaskError) throw latestTaskError;

      const { error } = await supabase.from("daily_tasks").insert({
        medium_goal_id: payload.mediumGoalId,
        title: payload.title,
        completed: false,
        order_index: (latestTask?.order_index ?? -1) + 1
      });

      if (error) throw error;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: TASK_CALENDAR_QUERY_KEY })
      ]);
    }
  });
}

export function useToggleTask() {
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  return useMutation({
    mutationFn: async (payload: { taskId: string; completed: boolean }) => {
      const { error: taskError } = await supabase
        .from("daily_tasks")
        .update({ completed: payload.completed })
        .eq("id", payload.taskId);

      if (taskError) throw taskError;

      const { error: checkinError } = await supabase.from("daily_task_checkins").upsert(
        {
          task_id: payload.taskId,
          checkin_date: currentIsoDate(),
          completed: payload.completed
        },
        {
          onConflict: "task_id,checkin_date"
        }
      );

      if (checkinError) throw checkinError;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: TASK_CALENDAR_QUERY_KEY })
      ]);
    }
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  return useMutation({
    mutationFn: async (payload: { taskId: string }) => {
      const { error } = await supabase.from("daily_tasks").delete().eq("id", payload.taskId);

      if (error) throw error;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: TASK_CALENDAR_QUERY_KEY })
      ]);
    }
  });
}

export function useReorderTasks() {
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  return useMutation({
    mutationFn: async (payload: { mediumGoalId: string; orderedTaskIds: string[] }) => {
      await runTwoPhaseOrderUpdate(payload.orderedTaskIds, (taskId, index) =>
        supabase.from("daily_tasks").update({ order_index: index }).eq("id", taskId).eq("medium_goal_id", payload.mediumGoalId)
      );
    },
    onMutate: async ({ mediumGoalId, orderedTaskIds }) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: GOALS_QUERY_KEY }),
        queryClient.cancelQueries({ queryKey: TASKS_QUERY_KEY })
      ]);

      const previousGoals = queryClient.getQueryData<GoalStats[]>(GOALS_QUERY_KEY);
      const previousActiveTasks = queryClient.getQueryData<DailyTask[]>(TASKS_QUERY_KEY);

      queryClient.setQueryData<GoalStats[]>(GOALS_QUERY_KEY, (current) => {
        if (!current) return current;

        return current.map((goal: GoalStats) => ({
          ...goal,
          medium_goals: goal.medium_goals.map((mediumGoal: GoalStats["medium_goals"][number]) => {
            if (mediumGoal.id !== mediumGoalId) return mediumGoal;

            const reorderedTasks = withReorderedIndexes(mediumGoal.daily_tasks ?? [], orderedTaskIds).sort(
              (a, b) => a.order_index - b.order_index
            );

            return {
              ...mediumGoal,
              daily_tasks: reorderedTasks
            };
          })
        }));
      });

      queryClient.setQueryData<DailyTask[]>(TASKS_QUERY_KEY, (current) => {
        if (!current) return current;
        const scoped = current.filter((task) => task.medium_goal_id === mediumGoalId);
        if (scoped.length === 0) return current;

        const reorderedScoped = withReorderedIndexes(scoped, orderedTaskIds).sort((a, b) => a.order_index - b.order_index);
        const scopedMap = new Map(reorderedScoped.map((task) => [task.id, task]));

        return current.map((task) => scopedMap.get(task.id) ?? task);
      });

      return { previousGoals, previousActiveTasks };
    },
    onError: (_error, _variables, context) => {
      if (context?.previousGoals) {
        queryClient.setQueryData(GOALS_QUERY_KEY, context.previousGoals);
      }
      if (context?.previousActiveTasks) {
        queryClient.setQueryData(TASKS_QUERY_KEY, context.previousActiveTasks);
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: TASKS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: TASK_CALENDAR_QUERY_KEY })
      ]);
    }
  });
}
