"use client";

import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createSupabaseBrowserClient } from "../lib/supabase";
import { toPercent } from "../lib/utils";
import { GoalTree } from "../types/db";
import { GOALS_QUERY_KEY } from "./query-keys";
import { runTwoPhaseOrderUpdate, withReorderedIndexes } from "./reorder-utils";

export type GoalStats = GoalTree & {
  completionPercent: number;
  medium_goals: Array<GoalTree["medium_goals"][number] & { completionPercent: number }>;
};

function applyGoalTreeBigGoalOrder(goals: GoalStats[], orderedGoalIds: string[]) {
  const withIndexes = withReorderedIndexes(goals, orderedGoalIds);
  return [...withIndexes].sort((a, b) => a.order_index - b.order_index);
}

function applyGoalTreeMediumGoalOrder(goals: GoalStats[], bigGoalId: string, orderedMediumGoalIds: string[]) {
  return goals.map((goal) => {
    if (goal.id !== bigGoalId) return goal;

    const reorderedMediumGoals = withReorderedIndexes(goal.medium_goals, orderedMediumGoalIds).sort(
      (a, b) => a.order_index - b.order_index
    );

    return {
      ...goal,
      medium_goals: reorderedMediumGoals
    };
  });
}

export function useGoalTree() {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  return useQuery({
    queryKey: GOALS_QUERY_KEY,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("big_goals")
        .select(
          "id,user_id,title,description,due_date,order_index,created_at,medium_goals(id,big_goal_id,title,due_date,is_completed,completed_at,order_index,daily_tasks(id,medium_goal_id,title,completed,order_index))"
        )
        .order("order_index", { ascending: true });

      if (error) {
        throw error;
      }

      const typed = (data ?? []) as GoalTree[];

      return typed.map<GoalStats>((goal) => {
        const mediumGoals = [...(goal.medium_goals ?? [])].sort((a, b) => a.order_index - b.order_index);

        const mediumWithCompletion = mediumGoals.map((medium) => {
          const orderedTasks = [...(medium.daily_tasks ?? [])].sort((a, b) => a.order_index - b.order_index);
          const total = orderedTasks.length;
          const completed = orderedTasks.filter((task) => task.completed).length;
          const derivedCompletion = toPercent(completed, total);

          return {
            ...medium,
            daily_tasks: orderedTasks,
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

      const { data: latestGoal, error: latestGoalError } = await supabase
        .from("big_goals")
        .select("order_index")
        .eq("user_id", user.id)
        .order("order_index", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestGoalError) throw latestGoalError;

      const { error } = await supabase.from("big_goals").insert({
        user_id: user.id,
        title: payload.title,
        description: payload.description?.trim() || null,
        due_date: payload.dueDate,
        order_index: (latestGoal?.order_index ?? -1) + 1
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
    mutationFn: async (payload: { bigGoalId: string; title: string; dueDate: string }) => {
      const { data: latestMediumGoal, error: latestMediumGoalError } = await supabase
        .from("medium_goals")
        .select("order_index")
        .eq("big_goal_id", payload.bigGoalId)
        .order("order_index", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestMediumGoalError) throw latestMediumGoalError;

      const { error } = await supabase.from("medium_goals").insert({
        big_goal_id: payload.bigGoalId,
        title: payload.title,
        due_date: payload.dueDate,
        order_index: (latestMediumGoal?.order_index ?? -1) + 1
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

export function useReorderBigGoals() {
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  return useMutation({
    mutationFn: async (payload: { orderedGoalIds: string[] }) => {
      await runTwoPhaseOrderUpdate(payload.orderedGoalIds, (goalId, index) =>
        supabase.from("big_goals").update({ order_index: index }).eq("id", goalId)
      );
    },
    onMutate: async ({ orderedGoalIds }) => {
      await queryClient.cancelQueries({ queryKey: GOALS_QUERY_KEY });
      const previous = queryClient.getQueryData<GoalStats[]>(GOALS_QUERY_KEY);

      queryClient.setQueryData<GoalStats[]>(GOALS_QUERY_KEY, (current) => {
        if (!current) return current;
        return applyGoalTreeBigGoalOrder(current, orderedGoalIds);
      });

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(GOALS_QUERY_KEY, context.previous);
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ["active-tasks"] })
      ]);
    }
  });
}

export function useReorderMediumGoals() {
  const queryClient = useQueryClient();
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  return useMutation({
    mutationFn: async (payload: { bigGoalId: string; orderedMediumGoalIds: string[] }) => {
      await runTwoPhaseOrderUpdate(payload.orderedMediumGoalIds, (mediumGoalId, index) =>
        supabase.from("medium_goals").update({ order_index: index }).eq("id", mediumGoalId)
      );
    },
    onMutate: async ({ bigGoalId, orderedMediumGoalIds }) => {
      await queryClient.cancelQueries({ queryKey: GOALS_QUERY_KEY });
      const previous = queryClient.getQueryData<GoalStats[]>(GOALS_QUERY_KEY);

      queryClient.setQueryData<GoalStats[]>(GOALS_QUERY_KEY, (current) => {
        if (!current) return current;
        return applyGoalTreeMediumGoalOrder(current, bigGoalId, orderedMediumGoalIds);
      });

      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) {
        queryClient.setQueryData(GOALS_QUERY_KEY, context.previous);
      }
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: GOALS_QUERY_KEY }),
        queryClient.invalidateQueries({ queryKey: ["active-tasks"] })
      ]);
    }
  });
}
