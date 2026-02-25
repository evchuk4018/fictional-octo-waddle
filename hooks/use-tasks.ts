"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "../lib/supabase";
import { DailyTask } from "../types/db";

const TASKS_KEY = ["active-tasks"];
const CALENDAR_KEY = ["task-calendar"];
const CACHE_KEY = "goal-tracker.active-tasks";

function currentIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function persistTasks(tasks: DailyTask[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(CACHE_KEY, JSON.stringify(tasks));
}

function readCachedTasks() {
  if (typeof window === "undefined") return [] as DailyTask[];
  const raw = window.localStorage.getItem(CACHE_KEY);
  if (!raw) return [] as DailyTask[];
  try {
    return JSON.parse(raw) as DailyTask[];
  } catch {
    return [] as DailyTask[];
  }
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
    queryKey: TASKS_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("daily_tasks")
        .select("id,medium_goal_id,title,completed,medium_goals!inner(is_completed)")
        .eq("medium_goals.is_completed", false)
        .order("completed", { ascending: true })
        .order("title", { ascending: true });

      if (error) {
        const cached = readCachedTasks();
        if (cached.length > 0) return cached;
        throw error;
      }

      const tasks = ((data ?? []) as Array<
        DailyTask & {
          medium_goals: Array<{ is_completed: boolean }>;
        }
      >).map((task) => ({
        id: task.id,
        medium_goal_id: task.medium_goal_id,
        title: task.title,
        completed: task.completed
      }));

      persistTasks(tasks);
      return tasks;
    }
  });
}

export function useTaskCalendar() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  return useQuery({
    queryKey: CALENDAR_KEY,
    queryFn: async () => {
      const { startDate, endDate, totalDays } = monthDateRange();

      const { data: activeTasks, error: activeTasksError } = await supabase
        .from("daily_tasks")
        .select("id,medium_goals!inner(is_completed)")
        .eq("medium_goals.is_completed", false);

      if (activeTasksError) throw activeTasksError;

      const activeTaskIds = (activeTasks ?? []).map((task) => task.id);
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
      const { error } = await supabase.from("daily_tasks").insert({
        medium_goal_id: payload.mediumGoalId,
        title: payload.title,
        completed: false
      });

      if (error) throw error;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["goals"] }),
        queryClient.invalidateQueries({ queryKey: TASKS_KEY })
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
        queryClient.invalidateQueries({ queryKey: ["goals"] }),
        queryClient.invalidateQueries({ queryKey: TASKS_KEY }),
        queryClient.invalidateQueries({ queryKey: CALENDAR_KEY })
      ]);
    }
  });
}
