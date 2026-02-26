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
import { useWidgetToken, useRevokeWidgetToken } from "../../hooks/use-widget-token";
import { toPercent } from "../../lib/utils";

type CopyStatus = "idle" | "copied" | "manual" | "error";

export function DashboardClient() {
  const { signOut } = useAuth();
  const goalsQuery = useGoalTree();
  const activeTasksQuery = useActiveTasks();
  const calendarQuery = useTaskCalendar();
  const toggleTask = useToggleTask();
  const setMediumCompletion = useSetMediumGoalCompletion();
  const widgetTokenQuery = useWidgetToken();
  const revokeToken = useRevokeWidgetToken();
  const [showWidgetInstructions, setShowWidgetInstructions] = useState(false);
  const [showToken, setShowToken] = useState(false);
  const [copyStatus, setCopyStatus] = useState<CopyStatus>("idle");
  const [manualCopyCode, setManualCopyCode] = useState("");

  const activeTasks = activeTasksQuery.data ?? [];
  const completedCount = activeTasks.filter((task) => task.completed).length;
  const completion = toPercent(completedCount, activeTasks.length);
  const nextTask = activeTasks.find((task) => !task.completed);

  const handleCopyWidgetCode = async () => {
    // Keep script code available for manual fallback when clipboard APIs fail on iOS.
    let scriptCode = "";

    try {
      const response = await fetch("/api/widgets/script", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Unable to load widget script");
      }

      scriptCode = await response.text();

      // Try the modern Clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        try {
          await navigator.clipboard.writeText(scriptCode);
          setManualCopyCode("");
          setCopyStatus("copied");
          window.setTimeout(() => setCopyStatus("idle"), 2500);
          return;
        } catch {
          // Fall through to fallback method
        }
      }

      // Fallback for iOS Safari/PWA and older browsers
      const textArea = document.createElement("textarea");
      textArea.value = scriptCode;
      textArea.style.position = "absolute";
      textArea.style.left = "0";
      textArea.style.top = "0";
      textArea.style.opacity = "0";
      textArea.setAttribute("readonly", "");
      textArea.setAttribute("aria-hidden", "true");
      document.body.appendChild(textArea);

      try {
        textArea.focus();
        textArea.select();

        // iOS-specific selection handling
        const range = document.createRange();
        range.selectNodeContents(textArea);
        const selection = window.getSelection();
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
        textArea.setSelectionRange(0, scriptCode.length);

        const success = document.execCommand("copy");
        if (!success) {
          throw new Error("execCommand copy failed");
        }

        setManualCopyCode("");
        setCopyStatus("copied");
        window.setTimeout(() => setCopyStatus("idle"), 2500);
      } finally {
        document.body.removeChild(textArea);
      }
    } catch {
      if (scriptCode) {
        setManualCopyCode(scriptCode);
        setCopyStatus("manual");
        window.setTimeout(() => setCopyStatus("idle"), 4000);
      } else {
        setCopyStatus("error");
        window.setTimeout(() => setCopyStatus("idle"), 3000);
      }
    }
  };

  const handleRevokeToken = async () => {
    await revokeToken.mutateAsync();
  };

  const token = widgetTokenQuery.data?.token;
  const maskedToken = token ? `${token.slice(0, 4)}${"•".repeat(token.length - 4)}` : "";
  let tokenText = "Token unavailable";
  if (widgetTokenQuery.isLoading) {
    tokenText = "Loading…";
  } else if (token) {
    tokenText = showToken ? token : maskedToken;
  }
  let copyStatusText = "";
  if (copyStatus === "copied") {
    copyStatusText = "Copied!";
  } else if (copyStatus === "manual") {
    copyStatusText = "Auto-copy unavailable. Use manual copy field below.";
  } else if (copyStatus === "error") {
    copyStatusText = "Could not copy. Try again.";
  }

  return (
    <div className="space-y-section">
      <header>
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold">Home</h1>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowWidgetInstructions((current) => !current)}
          >
            {showWidgetInstructions ? "Hide widget setup" : "iOS widget setup"}
          </Button>
        </div>
      </header>

      {showWidgetInstructions ? (
        <Card className="space-y-4">
          <h2 className="text-base font-semibold">iOS widget setup (one-time)</h2>

          <div className="space-y-2">
            <p className="text-sm font-semibold">Your widget token</p>
            <div className="flex flex-wrap items-center gap-2">
              <code className="rounded bg-[#E6F0EE] px-2 py-1 text-xs text-text-primary">
                {tokenText}
              </code>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowToken((v) => !v)}
                disabled={widgetTokenQuery.isLoading || !token}
              >
                {showToken ? "Hide" : "Show"}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button type="button" variant="secondary" onClick={handleCopyWidgetCode} disabled={widgetTokenQuery.isLoading}>
              Copy Scriptable script
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={handleRevokeToken}
              disabled={revokeToken.isPending || widgetTokenQuery.isLoading}
            >
              {revokeToken.isPending ? "Regenerating…" : "Regenerate token"}
            </Button>
            <p className="text-sm text-text-secondary" role="status" aria-live="polite">
              {copyStatusText}
            </p>
          </div>
          {manualCopyCode ? (
            <div className="space-y-2">
              <p className="text-sm text-text-secondary">
                Manual copy fallback: select all text in this field, then copy it to your clipboard.
              </p>
              <textarea
                readOnly
                value={manualCopyCode}
                rows={8}
                className="w-full rounded border border-accent bg-white p-2 text-xs text-text-primary"
              />
            </div>
          ) : null}

          <ol className="list-decimal space-y-2 pl-5 text-sm text-text-secondary">
            <li>
              Install the PWA in Safari via Share → Add to Home Screen, then launch from the home
              screen.
            </li>
            <li>
              Tap{" "}
              <span className="font-semibold text-text-primary">Copy Scriptable script</span> — the
              script already contains your personal widget token.
            </li>
            <li>
              In Scriptable, create a new script and paste the copied code. Run it once to allow
              network access.
            </li>
            <li>Add a Scriptable widget and select this script. The widget will stay up automatically.</li>
            <li>
              If you suspect your token is compromised, tap{" "}
              <span className="font-semibold text-text-primary">Regenerate token</span>, then
              copy and paste the script once more.
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
