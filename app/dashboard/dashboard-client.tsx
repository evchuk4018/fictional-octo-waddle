"use client";

import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { BigGoalCard } from "../../components/goals/big-goal-card";
import { TaskList } from "../../components/tasks/task-list";
import { useAuth } from "../../hooks/use-auth";
import { CompletionCalendar } from "../../components/ui/completion-calendar";
import { useGoalTree, useSetMediumGoalCompletion } from "../../hooks/use-goals";
import { useActiveTasks, useTaskCalendar, useToggleTask } from "../../hooks/use-tasks";
import { toPercent } from "../../lib/utils";

type DashboardClientProps = {
  email: string;
};

export function DashboardClient({ email }: DashboardClientProps) {
  const { signOut } = useAuth();
  const goalsQuery = useGoalTree();
  const activeTasksQuery = useActiveTasks();
  const calendarQuery = useTaskCalendar();
  const toggleTask = useToggleTask();
  const setMediumCompletion = useSetMediumGoalCompletion();

  const activeTasks = activeTasksQuery.data ?? [];
  const completedCount = activeTasks.filter((task) => task.completed).length;
  const completion = toPercent(completedCount, activeTasks.length);
  const nextTask = activeTasks.find((task) => !task.completed);

  return (
    <div className="space-y-section">
      <header className="space-y-1">
        <p className="text-sm text-text-secondary">Signed in as {email}</p>
        <h1 className="text-2xl font-semibold">Home</h1>
      </header>

      <Card className="space-y-2">
        <p className="text-sm text-text-secondary">Active task completion</p>
        <p className="text-2xl font-semibold">{completion}%</p>
        <p className="text-sm text-text-secondary">
          {nextTask ? `Next incomplete: ${nextTask.title}` : "All active tasks completed."}
        </p>
      </Card>

      <section className="space-y-3" aria-labelledby="active-tasks-title">
        <h2 id="active-tasks-title" className="text-base font-semibold">
          Active Daily Tasks
        </h2>
        {activeTasksQuery.isLoading ? (
          <Card>
            <p className="text-sm text-text-secondary">Loading active tasks...</p>
          </Card>
        ) : activeTasksQuery.isError ? (
          <Card>
            <p className="text-sm text-red-700">Unable to load tasks.</p>
          </Card>
        ) : (
          <TaskList
            tasks={activeTasks}
            onToggleTask={(task, completed) => toggleTask.mutate({ taskId: task.id, completed })}
          />
        )}
      </section>

      <section className="space-y-3" aria-labelledby="calendar-title">
        <h2 id="calendar-title" className="text-base font-semibold">
          Accountability Calendar
        </h2>
        {calendarQuery.isLoading ? (
          <Card>
            <p className="text-sm text-text-secondary">Loading calendar...</p>
          </Card>
        ) : calendarQuery.isError ? (
          <Card>
            <p className="text-sm text-red-700">Unable to load calendar.</p>
          </Card>
        ) : (
          <Card>
            <CompletionCalendar days={calendarQuery.data ?? []} />
          </Card>
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
                dueDate={goal.due_date}
                completionPercent={goal.completionPercent}
                mediumGoals={goal.medium_goals}
                onToggleMediumCompletion={(mediumGoalId, isCompleted) =>
                  setMediumCompletion.mutate({ mediumGoalId, isCompleted })
                }
                onToggleTask={(taskId, completed) => toggleTask.mutate({ taskId, completed })}
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
