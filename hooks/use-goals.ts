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
          "id,user_id,title,description,created_at,medium_goals(id,big_goal_id,title,order_index,daily_tasks(id,medium_goal_id,title,completed,due_date))"
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
          return {
            ...medium,
            completionPercent: toPercent(completed, total)
          };
        });

        const allTasks = mediumGoals.flatMap((medium) => medium.daily_tasks);
        const totalTasks = allTasks.length;
        const completedTasks = allTasks.filter((task) => task.completed).length;

        return {
          ...goal,
          medium_goals: mediumWithCompletion,
          completionPercent: toPercent(completedTasks, totalTasks)
        };
      });
    }
  });
}

export function useCreateBigGoal() {
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  return useMutation({
    mutationFn: async (payload: { title: string; description?: string }) => {
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
        description: payload.description?.trim() || null
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
    mutationFn: async (payload: { bigGoalId: string; title: string; orderIndex: number }) => {
      const { error } = await supabase.from("medium_goals").insert({
        big_goal_id: payload.bigGoalId,
        title: payload.title,
        order_index: payload.orderIndex
      });

      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY });
    }
  });
}
