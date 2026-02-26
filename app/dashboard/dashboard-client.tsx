"use client";

import { useState } from "react";
import { Card } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { BigGoalCard } from "../../components/goals/big-goal-card";
import { TaskList } from "../../components/tasks/task-list";
import { useAuth } from "../../hooks/use-auth";
import { CompletionCalendar } from "../../components/ui/completion-calendar";
import { useGoalTree, useSetMediumGoalCompletion } from "../../hooks/use-goals";
import { useActiveTasks, useTaskCalendar, useToggleTask } from "../../hooks/use-tasks";
import { toPercent } from "../../lib/utils";

type CopyStatus = "idle" | "copied" | "error";

export function DashboardClient() {
  const { signOut } = useAuth();
  const goalsQuery = useGoalTree();
  const activeTasksQuery = useActiveTasks();
  const calendarQuery = useTaskCalendar();
  const toggleTask = useToggleTask();
  const setMediumCompletion = useSetMediumGoalCompletion();
  const [showWidgetInstructions, setShowWidgetInstructions] = useState(false);
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");

  const activeTasks = activeTasksQuery.data ?? [];
  const completedCount = activeTasks.filter((task) => task.completed).length;
  const completion = toPercent(completedCount, activeTasks.length);
  const nextTask = activeTasks.find((task) => !task.completed);

  const handleCopyWidgetCode = async () => {
    try {
      const response = await fetch("/api/widgets/script", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Unable to load widget script");
      }

      const scriptCode = await response.text();
      await navigator.clipboard.writeText(scriptCode);
      setCopyStatus("copied");
      window.setTimeout(() => setCopyStatus("idle"), 2500);
    } catch {
      setCopyStatus("error");
      window.setTimeout(() => setCopyStatus("idle"), 3000);
    }
  };

  return (
    <div className="space-y-section">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold">Home</h1>
          <Button type="button" variant="secondary" onClick={handleCopyWidgetCode}>
            Copy current script
          </Button>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowWidgetInstructions((current) => !current)}
          >
            {showWidgetInstructions ? "Hide instructions" : "View instructions"}
          </Button>
          <p className="text-sm text-text-secondary" role="status" aria-live="polite">
            {copyStatus === "copied"
              ? "Copied!"
              : copyStatus === "error"
                ? "Could not copy. Try again."
                : ""}
          </p>
        </div>
      </header>

      {showWidgetInstructions ? (
        <Card className="space-y-3">
          <h2 className="text-base font-semibold">iOS widget setup</h2>
          <ol className="list-decimal space-y-2 pl-5 text-sm text-text-secondary">
            <li>
              Install the PWA in Safari via Share → Add to Home Screen, then launch from the home screen.
            </li>
            <li>
              Log in from this dashboard, then tap
              <span className="font-semibold text-text-primary"> Copy current script</span> to copy a
              Scriptable script that already contains your current auth cookie.
            </li>
            <li>
              In Scriptable, create a new script and paste the copied code. The endpoint is already set to
              <span className="font-semibold text-text-primary">
                {" "}
                https://theapp-blue.vercel.app/api/widgets/summary
              </span>
              and the cookie is prefilled.
            </li>
            <li>
              Run the script once to allow network access, then add a Scriptable widget and select this
              script.
            </li>
            <li>
              If the widget stops authenticating, log in again and copy a fresh current script.
            </li>
          </ol>
        </Card>
      ) : null}

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
                bigGoalId={goal.id}
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
