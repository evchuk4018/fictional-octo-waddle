"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "../lib/supabase";
import { DailyTask } from "../types/db";

const TASKS_KEY = ["today-tasks"];
const CACHE_KEY = "goal-tracker.today-tasks";

function todayIsoDate() {
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

export function useTodayTasks() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  return useQuery({
    queryKey: TASKS_KEY,
    queryFn: async () => {
      const today = todayIsoDate();
      const { data, error } = await supabase
        .from("daily_tasks")
        .select("id,medium_goal_id,title,completed,due_date")
        .eq("due_date", today)
        .order("completed", { ascending: true });

      if (error) {
        const cached = readCachedTasks();
        if (cached.length > 0) return cached;
        throw error;
      }

      const tasks = (data ?? []) as DailyTask[];
      persistTasks(tasks);
      return tasks;
    }
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  return useMutation({
    mutationFn: async (payload: { mediumGoalId: string; title: string; dueDate: string }) => {
      const { error } = await supabase.from("daily_tasks").insert({
        medium_goal_id: payload.mediumGoalId,
        title: payload.title,
        due_date: payload.dueDate,
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
      const { error } = await supabase
        .from("daily_tasks")
        .update({ completed: payload.completed })
        .eq("id", payload.taskId);

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
