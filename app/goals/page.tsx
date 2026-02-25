"use client";

import { BigGoalCard } from "../../components/goals/big-goal-card";
import { CreateBigGoalForm } from "../../components/goals/create-big-goal-form";
import { CreateMediumGoalForm } from "../../components/goals/create-medium-goal-form";
import { Card } from "../../components/ui/card";
import { useGoalTree, useSetMediumGoalCompletion } from "../../hooks/use-goals";

export default function GoalsPage() {
  const goalsQuery = useGoalTree();
  const setMediumCompletion = useSetMediumGoalCompletion();

  const options = (goalsQuery.data ?? []).map((goal) => ({
    id: goal.id,
    title: goal.title,
    mediumCount: goal.medium_goals.length
  }));

  return (
    <div className="space-y-section">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Goals</h1>
        <p className="text-sm text-text-secondary">Build your hierarchy from big outcomes to daily execution.</p>
      </header>

      <CreateBigGoalForm />
      <CreateMediumGoalForm options={options} />

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
        ) : goalsQuery.data && goalsQuery.data.length > 0 ? (
          <div className="space-y-3">
            {goalsQuery.data.map((goal) => (
              <BigGoalCard
                key={goal.id}
                title={goal.title}
                description={goal.description}
                dueDate={goal.due_date}
                completionPercent={goal.completionPercent}
                mediumGoals={goal.medium_goals}
                onToggleMediumCompletion={(mediumGoalId, isCompleted) =>
                  setMediumCompletion.mutate({ mediumGoalId, isCompleted })
                }
              />
            ))}
          </div>
        ) : (
          <Card>
            <p className="text-sm text-text-secondary">No goals yet. Start with your first big goal above.</p>
          </Card>
        )}
      </section>
    </div>
  );
}
