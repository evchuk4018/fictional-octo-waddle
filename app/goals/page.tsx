"use client";

import { useEffect, useMemo, useState } from "react";
import { Reorder, motion, useReducedMotion } from "framer-motion";
import { BigGoalCard } from "../../components/goals/big-goal-card";
import { CreateBigGoalForm } from "../../components/goals/create-big-goal-form";
import { CreateMediumGoalForm } from "../../components/goals/create-medium-goal-form";
import { CreateTaskForm } from "../../components/tasks/create-task-form";
import { Card } from "../../components/ui/card";
import { useGoalTree, useReorderBigGoals, useReorderMediumGoals, useSetMediumGoalCompletion } from "../../hooks/use-goals";
import { useDeleteTask, useReorderTasks, useToggleTask } from "../../hooks/use-tasks";
import { cn } from "../../lib/utils";
import { reorderLayoutTransition, reorderLiftTransition } from "../../lib/motion";

export default function GoalsPage() {
  const goalsQuery = useGoalTree();
  const setMediumCompletion = useSetMediumGoalCompletion();
  const reorderBigGoals = useReorderBigGoals();
  const reorderMediumGoals = useReorderMediumGoals();
  const reorderTasks = useReorderTasks();
  const toggleTask = useToggleTask();
  const deleteTask = useDeleteTask();
  const [orderedGoals, setOrderedGoals] = useState(goalsQuery.data ?? []);
  const [activeDragGoalId, setActiveDragGoalId] = useState<string | null>(null);
  const [dropTargetGoalId, setDropTargetGoalId] = useState<string | null>(null);
  const reducedMotion = Boolean(useReducedMotion());

  useEffect(() => {
    setOrderedGoals(goalsQuery.data ?? []);
  }, [goalsQuery.data]);

  const initialOrderSignature = useMemo(() => (goalsQuery.data ?? []).map((goal) => goal.id).join("|"), [goalsQuery.data]);
  const orderedSignature = useMemo(() => orderedGoals.map((goal) => goal.id).join("|"), [orderedGoals]);

  const persistBigGoalOrder = () => {
    if (orderedSignature === initialOrderSignature) return;
    reorderBigGoals.mutate({ orderedGoalIds: orderedGoals.map((goal) => goal.id) });
  };

  const getDropTargetId = (draggedGoalId: string, offsetY: number) => {
    const direction = offsetY > 0 ? "down" : offsetY < 0 ? "up" : null;
    if (!direction) return null;

    const draggedIndex = orderedGoals.findIndex((goal) => goal.id === draggedGoalId);
    if (draggedIndex === -1) return null;

    const targetIndex = direction === "down" ? draggedIndex + 1 : draggedIndex - 1;
    if (targetIndex < 0 || targetIndex >= orderedGoals.length) return null;

    return orderedGoals[targetIndex]?.id ?? null;
  };

  const options = (goalsQuery.data ?? []).map((goal) => ({
    id: goal.id,
    title: goal.title,
    mediumCount: goal.medium_goals.length
  }));

  const taskOptions = (goalsQuery.data ?? []).flatMap((goal) =>
    goal.medium_goals.map((mediumGoal) => ({
      id: mediumGoal.id,
      title: mediumGoal.title,
      bigGoalTitle: goal.title
    }))
  );

  return (
    <div className="space-y-section">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Goals</h1>
        <p className="text-sm text-text-secondary">Build your hierarchy from big outcomes to daily execution.</p>
      </header>

      <CreateBigGoalForm />
      <CreateMediumGoalForm options={options} />
      <CreateTaskForm options={taskOptions} />

      <section className="space-y-3" aria-labelledby="goal-list-title">
        <h2 id="goal-list-title" className="text-base font-semibold">
          Goal Hierarchy
        </h2>

        {goalsQuery.isLoading ? (
          <Card>
            <p className="text-sm text-text-secondary">Loading goals...</p>
          </Card>
        ) : goalsQuery.isError ? (
          <Card>
            <p className="text-sm text-red-700">Unable to load goals.</p>
          </Card>
        ) : orderedGoals.length > 0 ? (
          <Reorder.Group axis="y" values={orderedGoals} onReorder={setOrderedGoals} className="space-y-3">
            {orderedGoals.map((goal) => (
              <Reorder.Item
                key={goal.id}
                value={goal}
                layout
                transition={reorderLayoutTransition(reducedMotion)}
                className={cn("list-none", activeDragGoalId === goal.id ? "z-20" : "")}
                whileDrag={reducedMotion ? undefined : { scale: 1.01 }}
                onDragStart={() => {
                  setActiveDragGoalId(goal.id);
                  setDropTargetGoalId(null);
                }}
                onDrag={(_, info) => {
                  const targetId = getDropTargetId(goal.id, info.offset.y);
                  setDropTargetGoalId(targetId);
                }}
                onDragEnd={() => {
                  setActiveDragGoalId(null);
                  setDropTargetGoalId(null);
                  persistBigGoalOrder();
                }}
              >
                <motion.div
                  className={cn(
                    "rounded-card transition-colors",
                    activeDragGoalId === goal.id ? "shadow-lg" : "shadow-none",
                    dropTargetGoalId === goal.id ? "ring-2 ring-accent bg-background/70" : ""
                  )}
                  transition={reorderLiftTransition(reducedMotion)}
                >
                  <BigGoalCard
                    bigGoalId={goal.id}
                    title={goal.title}
                    description={goal.description}
                    dueDate={goal.due_date}
                    completionPercent={goal.completionPercent}
                    mediumGoals={goal.medium_goals}
                    onToggleMediumCompletion={(mediumGoalId, isCompleted) =>
                      setMediumCompletion.mutate({ mediumGoalId, isCompleted })
                    }
                    showTasks
                    enableReorder
                    onToggleTask={(taskId, completed) => toggleTask.mutate({ taskId, completed })}
                    onDeleteTask={(taskId) => deleteTask.mutate({ taskId })}
                    onReorderMediumGoals={(bigGoalId, orderedMediumGoalIds) =>
                      reorderMediumGoals.mutate({ bigGoalId, orderedMediumGoalIds })
                    }
                    onReorderTasks={(mediumGoalId, orderedTaskIds) => reorderTasks.mutate({ mediumGoalId, orderedTaskIds })}
                  />
                </motion.div>
              </Reorder.Item>
            ))}
          </Reorder.Group>
        ) : (
          <Card>
            <p className="text-sm text-text-secondary">No goals yet. Start with your first big goal above.</p>
          </Card>
        )}
      </section>
    </div>
  );
}
