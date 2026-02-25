import { Card } from "../ui/card";
import { CircularProgress } from "../ui/circular-progress";
import { ProgressBar } from "../ui/progress-bar";
import { Button } from "../ui/button";
import { TaskList } from "../tasks/task-list";
import { DailyTask } from "../../types/db";

type MediumGoalView = {
  id: string;
  title: string;
  due_date: string | null;
  is_completed: boolean;
  completionPercent: number;
  daily_tasks: DailyTask[];
};

type BigGoalCardProps = {
  title: string;
  description: string | null;
  dueDate: string | null;
  completionPercent: number;
  mediumGoals: MediumGoalView[];
  onToggleMediumCompletion: (mediumGoalId: string, isCompleted: boolean) => void;
  onToggleTask: (taskId: string, completed: boolean) => void;
  onDeleteTask?: (taskId: string) => void;
};

function formatDate(value: string | null) {
  if (!value) return "No due date";
  return new Date(`${value}T00:00:00Z`).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC"
  });
}

export function BigGoalCard({
  title,
  description,
  dueDate,
  completionPercent,
  mediumGoals,
  onToggleMediumCompletion,
  onToggleTask,
  onDeleteTask
}: BigGoalCardProps) {
  return (
    <Card className="space-y-cardGap">
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-text-primary">{title}</h3>
          {description ? <p className="text-sm text-text-secondary">{description}</p> : null}
          <p className="text-xs text-text-secondary">Due {formatDate(dueDate)}</p>
        </div>
        <CircularProgress percent={completionPercent} />
      </header>

      <div className="space-y-3">
        {mediumGoals.length === 0 ? (
          <p className="text-sm text-text-secondary">No medium goals yet.</p>
        ) : (
          mediumGoals.map((mediumGoal) => (
            <div key={mediumGoal.id} className="space-y-2 rounded-button border border-accent p-3">
              <ProgressBar value={mediumGoal.completionPercent} label={`${mediumGoal.title} (${mediumGoal.daily_tasks.length} tasks)`} />
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-text-secondary">Due {formatDate(mediumGoal.due_date)}</p>
                <Button
                  type="button"
                  variant={mediumGoal.is_completed ? "secondary" : "primary"}
                  className="h-9 px-3 text-xs"
                  onClick={() => onToggleMediumCompletion(mediumGoal.id, !mediumGoal.is_completed)}
                >
                  {mediumGoal.is_completed ? "Mark Incomplete" : "Mark Complete"}
                </Button>
              </div>
              <TaskList
                tasks={mediumGoal.daily_tasks}
                onToggleTask={(task, completed) => onToggleTask(task.id, completed)}
                onDeleteTask={onDeleteTask ? (task) => onDeleteTask(task.id) : undefined}
              />
            </div>
          ))
        )}
      </div>
    </Card>
  );
}
