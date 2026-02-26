"use client";

import { useEffect, useMemo, useState } from "react";
import { Reorder } from "framer-motion";
import { BigGoalCard } from "../../components/goals/big-goal-card";
import { CreateBigGoalForm } from "../../components/goals/create-big-goal-form";
import { CreateMediumGoalForm } from "../../components/goals/create-medium-goal-form";
import { CreateTaskForm } from "../../components/tasks/create-task-form";
import { Card } from "../../components/ui/card";
import { useGoalTree, useReorderBigGoals, useReorderMediumGoals, useSetMediumGoalCompletion } from "../../hooks/use-goals";
import { useDeleteTask, useReorderTasks, useToggleTask } from "../../hooks/use-tasks";

export default function GoalsPage() {
  const goalsQuery = useGoalTree();
  const setMediumCompletion = useSetMediumGoalCompletion();
  const reorderBigGoals = useReorderBigGoals();
  const reorderMediumGoals = useReorderMediumGoals();
  const reorderTasks = useReorderTasks();
  const toggleTask = useToggleTask();
  const deleteTask = useDeleteTask();
  const [orderedGoals, setOrderedGoals] = useState(goalsQuery.data ?? []);

  useEffect(() => {
    setOrderedGoals(goalsQuery.data ?? []);
  }, [goalsQuery.data]);

  const initialOrderSignature = useMemo(() => (goalsQuery.data ?? []).map((goal) => goal.id).join("|"), [goalsQuery.data]);
  const orderedSignature = useMemo(() => orderedGoals.map((goal) => goal.id).join("|"), [orderedGoals]);

  const persistBigGoalOrder = () => {
    if (orderedSignature === initialOrderSignature) return;
    reorderBigGoals.mutate({ orderedGoalIds: orderedGoals.map((goal) => goal.id) });
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
              <Reorder.Item key={goal.id} value={goal} className="list-none" onDragEnd={persistBigGoalOrder}>
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
