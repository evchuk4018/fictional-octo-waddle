"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Reorder } from "framer-motion";
import { Card } from "../ui/card";
import { CircularProgress } from "../ui/circular-progress";
import { ProgressBar } from "../ui/progress-bar";
import { Button } from "../ui/button";
import { TaskList } from "../tasks/task-list";
import { DailyTask } from "../../types/db";

const MEDIUM_REORDER_DEADZONE = 14;

type MediumGoalView = {
  id: string;
  title: string;
  due_date: string | null;
  is_completed: boolean;
  completionPercent: number;
  daily_tasks: DailyTask[];
};

type BigGoalCardProps = {
  bigGoalId: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  completionPercent: number;
  mediumGoals: MediumGoalView[];
  onToggleMediumCompletion: (mediumGoalId: string, isCompleted: boolean) => void;
  onToggleTask?: (taskId: string, completed: boolean) => void;
  onDeleteTask?: (taskId: string) => void;
  showTasks?: boolean;
  enableReorder?: boolean;
  onReorderMediumGoals?: (bigGoalId: string, orderedMediumGoalIds: string[]) => void;
  onReorderTasks?: (mediumGoalId: string, orderedTaskIds: string[]) => void;
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
  bigGoalId,
  title,
  description,
  dueDate,
  completionPercent,
  mediumGoals,
  onToggleMediumCompletion,
  onToggleTask,
  onDeleteTask,
  showTasks = false,
  enableReorder = false,
  onReorderMediumGoals,
  onReorderTasks
}: BigGoalCardProps) {
  const [orderedMediumGoals, setOrderedMediumGoals] = useState(mediumGoals);
  const [isMediumReordering, setIsMediumReordering] = useState(false);
  const [activeTaskInteractionIds, setActiveTaskInteractionIds] = useState<string[]>([]);
  const mediumListContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setOrderedMediumGoals(mediumGoals);
  }, [mediumGoals]);

  const initialOrderSignature = useMemo(() => mediumGoals.map((goal) => goal.id).join("|"), [mediumGoals]);
  const orderedSignature = useMemo(() => orderedMediumGoals.map((goal) => goal.id).join("|"), [orderedMediumGoals]);

  const persistMediumOrder = () => {
    if (!enableReorder || !onReorderMediumGoals) return;
    if (orderedSignature === initialOrderSignature) return;
    onReorderMediumGoals(bigGoalId, orderedMediumGoals.map((goal) => goal.id));
  };

  const setTaskInteraction = useCallback((mediumGoalId: string, isActive: boolean) => {
    setActiveTaskInteractionIds((current) => {
      if (isActive) {
        if (current.includes(mediumGoalId)) return current;
        return [...current, mediumGoalId];
      }
      return current.filter((id) => id !== mediumGoalId);
    });
  }, []);

  const isTaskGestureActive = activeTaskInteractionIds.length > 0;
  const canReorderMediumGoals = enableReorder && orderedMediumGoals.length > 1 && !isTaskGestureActive;

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
        {orderedMediumGoals.length === 0 ? (
          <p className="text-sm text-text-secondary">No medium goals yet.</p>
        ) : (
          <div ref={mediumListContainerRef} className="relative">
            <Reorder.Group axis="y" values={orderedMediumGoals} onReorder={setOrderedMediumGoals} className="space-y-3">
              {orderedMediumGoals.map((mediumGoal) => (
                <Reorder.Item
                  key={mediumGoal.id}
                  value={mediumGoal}
                  className="list-none"
                  drag={canReorderMediumGoals ? "y" : false}
                  dragConstraints={mediumListContainerRef}
                  dragDirectionLock
                  onDrag={(_, info) => {
                    if (isMediumReordering) return;
                    if (Math.abs(info.offset.y) >= MEDIUM_REORDER_DEADZONE) {
                      setIsMediumReordering(true);
                    }
                  }}
                  onDragEnd={() => {
                    setIsMediumReordering(false);
                    persistMediumOrder();
                  }}
                >
                  <div className="space-y-2 rounded-button border border-accent p-3">
                    <div className="min-w-0 flex-1">
                      <ProgressBar value={mediumGoal.completionPercent} label={`${mediumGoal.title} (${mediumGoal.daily_tasks.length} tasks)`} />
                    </div>

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
                    {showTasks && onToggleTask ? (
                      <TaskList
                        tasks={mediumGoal.daily_tasks}
                        onToggleTask={(task, completed) => onToggleTask(task.id, completed)}
                        onDeleteTask={onDeleteTask ? (task) => onDeleteTask(task.id) : undefined}
                        onReorderTasks={onReorderTasks ? (orderedTaskIds) => onReorderTasks(mediumGoal.id, orderedTaskIds) : undefined}
                        disableInteractions={isMediumReordering}
                        onInteractionChange={(isActive) => setTaskInteraction(mediumGoal.id, isActive)}
                        emptyMessage="No daily tasks for this medium goal yet."
                      />
                    ) : null}
                  </div>
                </Reorder.Item>
              ))}
            </Reorder.Group>
          </div>
        )}
      </div>
    </Card>
  );
}
