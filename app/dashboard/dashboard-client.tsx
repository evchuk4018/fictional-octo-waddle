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

  const fallbackCopy = (text: string): boolean => {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      textarea.setSelectionRange(0, text.length);
      const ok = document.execCommand("copy");
      document.body.removeChild(textarea);
      console.log("[copy] fallback execCommand result:", ok);
      return ok;
    } catch (err) {
      console.error("[copy] fallback execCommand error:", err);
      return false;
    }
  };

  const handleCopyWidgetCode = async () => {
    console.log("[copy] starting widget script copy");
    setCopyStatus("idle");
    try {
      const response = await fetch("/api/widgets/script", {
        cache: "no-store",
        credentials: "same-origin",
      });
      console.log("[copy] fetch status:", response.status, "type:", response.headers.get("content-type"), "url:", response.url);

      if (!response.ok) {
        const body = await response.text();
        console.error("[copy] non-ok response body:", body.slice(0, 300));
        setCopyStatus("error");
        window.setTimeout(() => setCopyStatus("idle"), 4000);
        return;
      }

      const contentType = response.headers.get("content-type") ?? "";
      const scriptCode = await response.text();
      console.log("[copy] response length:", scriptCode.length, "content-type:", contentType);

      if (contentType.includes("text/html") || scriptCode.trimStart().startsWith("<!DOCTYPE") || scriptCode.trimStart().startsWith("<html")) {
        console.error("[copy] received HTML instead of script — likely a redirect to login page");
        setCopyStatus("error");
        window.setTimeout(() => setCopyStatus("idle"), 4000);
        return;
      }

      if (!scriptCode || scriptCode.length < 50) {
        console.error("[copy] script response empty or too short:", scriptCode.length);
        setCopyStatus("error");
        window.setTimeout(() => setCopyStatus("idle"), 4000);
        return;
      }

      let copied = false;
      if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
        try {
          await navigator.clipboard.writeText(scriptCode);
          copied = true;
          console.log("[copy] clipboard API succeeded");
        } catch (clipErr) {
          console.warn("[copy] clipboard API failed, trying fallback:", clipErr);
        }
      } else {
        console.warn("[copy] clipboard API not available, using fallback");
      }

      if (!copied) {
        copied = fallbackCopy(scriptCode);
      }

      if (copied) {
        setCopyStatus("copied");
        window.setTimeout(() => setCopyStatus("idle"), 2500);
      } else {
        console.error("[copy] all copy methods failed");
        setCopyStatus("error");
        window.setTimeout(() => setCopyStatus("idle"), 4000);
      }
    } catch (err) {
      console.error("[copy] unexpected error:", err);
      setCopyStatus("error");
      window.setTimeout(() => setCopyStatus("idle"), 4000);
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
