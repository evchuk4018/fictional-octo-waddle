"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "../lib/supabase";
import { toPercent } from "../lib/utils";
import { GoalTree } from "../types/db";

type GoalStats = GoalTree & {
  completionPercent: number;
  medium_goals: Array<GoalTree["medium_goals"][number] & { completionPercent: number }>;
};

const GOALS_QUERY_KEY = ["goals"];

export function useGoalTree() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  return useQuery({
    queryKey: GOALS_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("big_goals")
        .select(
          "id,user_id,title,description,due_date,created_at,medium_goals(id,big_goal_id,title,due_date,is_completed,completed_at,order_index,daily_tasks(id,medium_goal_id,title,completed))"
        )
        .order("created_at", { ascending: true });

      if (error) {
        throw error;
      }

      const typed = (data ?? []) as GoalTree[];

      return typed.map<GoalStats>((goal) => {
        const mediumGoals = [...(goal.medium_goals ?? [])].sort((a, b) => a.order_index - b.order_index);

        const mediumWithCompletion = mediumGoals.map((medium) => {
          const total = medium.daily_tasks.length;
          const completed = medium.daily_tasks.filter((task) => task.completed).length;
          const derivedCompletion = toPercent(completed, total);

          return {
            ...medium,
            completionPercent: medium.is_completed ? 100 : derivedCompletion
          };
        });

        const mediumCount = mediumWithCompletion.length;
        const totalCompletion = mediumWithCompletion.reduce((sum, medium) => sum + medium.completionPercent, 0);

        return {
          ...goal,
          medium_goals: mediumWithCompletion,
          completionPercent: mediumCount > 0 ? Math.round(totalCompletion / mediumCount) : 0
        };
      });
    }
  });
}

export function useCreateBigGoal() {
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  return useMutation({
    mutationFn: async (payload: { title: string; description?: string; dueDate: string }) => {
      const {
        data: { user },
        error: userError
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw userError ?? new Error("User session is required");
      }

      const { error } = await supabase.from("big_goals").insert({
        user_id: user.id,
        title: payload.title,
        description: payload.description?.trim() || null,
        due_date: payload.dueDate
      });

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY });
    }
  });
}

export function useCreateMediumGoal() {
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  return useMutation({
    mutationFn: async (payload: { bigGoalId: string; title: string; orderIndex: number; dueDate: string }) => {
      const { error } = await supabase.from("medium_goals").insert({
        big_goal_id: payload.bigGoalId,
        title: payload.title,
        due_date: payload.dueDate,
        order_index: payload.orderIndex
      });

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY });
    }
  });
}

export function useSetMediumGoalCompletion() {
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  return useMutation({
    mutationFn: async (payload: { mediumGoalId: string; isCompleted: boolean }) => {
      const { error } = await supabase
        .from("medium_goals")
        .update({
          is_completed: payload.isCompleted,
          completed_at: payload.isCompleted ? new Date().toISOString() : null
        })
        .eq("id", payload.mediumGoalId);

      if (error) throw error;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ["active-tasks"] }),
        queryClient.invalidateQueries({ queryKey: ["task-calendar"] })
      ]);
    }
  });
}
