"use client";

import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { BigGoalCard } from "../../components/goals/big-goal-card";
import { TaskList } from "../../components/tasks/task-list";
import { useAuth } from "../../hooks/use-auth";
import { useGoalTree } from "../../hooks/use-goals";
import { useTodayTasks, useToggleTask } from "../../hooks/use-tasks";
import { toPercent } from "../../lib/utils";

type DashboardClientProps = {
  email: string;
};

export function DashboardClient({ email }: DashboardClientProps) {
  const { signOut } = useAuth();
  const goalsQuery = useGoalTree();
  const todayTasksQuery = useTodayTasks();
  const toggleTask = useToggleTask();

  const todayTasks = todayTasksQuery.data ?? [];
  const completedCount = todayTasks.filter((task) => task.completed).length;
  const completion = toPercent(completedCount, todayTasks.length);
  const nextTask = todayTasks.find((task) => !task.completed);

  return (
    <div className="space-y-section">
      <header className="space-y-1">
        <p className="text-sm text-text-secondary">Signed in as {email}</p>
        <h1 className="text-2xl font-semibold">Today</h1>
      </header>

      <Card className="space-y-2">
        <p className="text-sm text-text-secondary">Today&apos;s completion</p>
        <p className="text-2xl font-semibold">{completion}%</p>
        <p className="text-sm text-text-secondary">
          {nextTask ? `Next incomplete: ${nextTask.title}` : "All today tasks completed."}
        </p>
      </Card>

      <section className="space-y-3" aria-labelledby="today-tasks-title">
        <h2 id="today-tasks-title" className="text-base font-semibold">
          Today&apos;s Tasks
        </h2>
        {todayTasksQuery.isLoading ? (
          <Card>
            <p className="text-sm text-text-secondary">Loading today&apos;s tasks...</p>
          </Card>
        ) : todayTasksQuery.isError ? (
          <Card>
            <p className="text-sm text-red-700">Unable to load tasks.</p>
          </Card>
        ) : (
          <TaskList
            tasks={todayTasks}
            onToggleTask={(task, completed) => toggleTask.mutate({ taskId: task.id, completed })}
          />
        )}
      </section>

      <section className="space-y-3" aria-labelledby="goals-title">
        <h2 id="goals-title" className="text-base font-semibold">
          Big Goals
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
                completionPercent={goal.completionPercent}
                mediumGoals={goal.medium_goals}
              />
            ))}
          </div>
        ) : (
          <Card>
            <p className="text-sm text-text-secondary">No goals yet. Create one in the Goals tab.</p>
          </Card>
        )}
      </section>

      <Button variant="secondary" className="w-full" onClick={() => signOut()}>
        Sign Out
      </Button>
    </div>
  );
}
