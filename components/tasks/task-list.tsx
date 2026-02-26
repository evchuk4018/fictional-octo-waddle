"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Reorder, useReducedMotion } from "framer-motion";
import { DailyTask } from "../../types/db";
import { TaskItem } from "./task-item";

type TaskListProps = {
  tasks: DailyTask[];
  onToggleTask: (task: DailyTask, completed: boolean) => void;
  onDeleteTask?: (task: DailyTask) => void;
  onReorderTasks?: (orderedTaskIds: string[]) => void;
  disableInteractions?: boolean;
  onInteractionChange?: (isActive: boolean) => void;
  emptyMessage?: string;
};

export function TaskList({
  tasks,
  onToggleTask,
  onDeleteTask,
  onReorderTasks,
  disableInteractions = false,
  onInteractionChange,
  emptyMessage = "No active daily tasks right now."
}: TaskListProps) {
  const [orderedTasks, setOrderedTasks] = useState(tasks);
  const [isReordering, setIsReordering] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);
  const [activeDragTaskId, setActiveDragTaskId] = useState<string | null>(null);
  const [dropTargetTaskId, setDropTargetTaskId] = useState<string | null>(null);
  const reducedMotion = Boolean(useReducedMotion());

  useEffect(() => {
    setOrderedTasks(tasks);
  }, [tasks]);

  const initialOrderSignature = useMemo(() => tasks.map((task) => task.id).join("|"), [tasks]);

  const orderedSignature = useMemo(() => orderedTasks.map((task) => task.id).join("|"), [orderedTasks]);

  const onInteractionChangeRef = useRef(onInteractionChange);
  onInteractionChangeRef.current = onInteractionChange;

  useEffect(() => {
    onInteractionChangeRef.current?.(isReordering || isSwiping);
  }, [isReordering, isSwiping]);

  const persistOrder = () => {
    if (!onReorderTasks) return;
    if (orderedSignature === initialOrderSignature) return;
    onReorderTasks(orderedTasks.map((task) => task.id));
  };

  const getDropTargetId = useCallback(
    (draggedId: string, offsetY: number) => {
      const direction = offsetY > 0 ? "down" : offsetY < 0 ? "up" : null;
      if (!direction) return null;

      const draggedIndex = orderedTasks.findIndex((task) => task.id === draggedId);
      if (draggedIndex === -1) return null;

      const targetIndex = direction === "down" ? draggedIndex + 1 : draggedIndex - 1;
      if (targetIndex < 0 || targetIndex >= orderedTasks.length) return null;

      return orderedTasks[targetIndex]?.id ?? null;
    },
    [orderedTasks]
  );

  if (tasks.length === 0) {
    return (
      <div className="rounded-card bg-card p-card text-sm text-text-secondary" role="status">
        {emptyMessage}
      </div>
    );
  }

  if (onReorderTasks) {
    return (
      <Reorder.Group axis="y" values={orderedTasks} onReorder={setOrderedTasks} className="space-y-2">
        {orderedTasks.map((task) => (
          <TaskItem
            key={task.id}
            task={task}
            onToggle={(completed) => onToggleTask(task, completed)}
            onDelete={onDeleteTask ? () => onDeleteTask(task) : undefined}
            isReorderEnabled
            disableSwipe={isReordering || disableInteractions}
            onSwipeStart={() => setIsSwiping(true)}
            onSwipeEnd={() => setIsSwiping(false)}
            onReorderStart={() => {
              setIsReordering(true);
              setActiveDragTaskId(task.id);
              setDropTargetTaskId(null);
            }}
            onReorderMove={(offsetY) => {
              const targetId = getDropTargetId(task.id, offsetY);
              setDropTargetTaskId(targetId);
            }}
            onReorderEnd={() => {
              setIsReordering(false);
              setActiveDragTaskId(null);
              setDropTargetTaskId(null);
              persistOrder();
            }}
            isDragging={activeDragTaskId === task.id}
            isDropTarget={dropTargetTaskId === task.id}
            reducedMotion={reducedMotion}
          />
        ))}
      </Reorder.Group>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onToggle={(completed) => onToggleTask(task, completed)}
          onDelete={onDeleteTask ? () => onDeleteTask(task) : undefined}
          disableSwipe={disableInteractions}
          onSwipeStart={() => setIsSwiping(true)}
          onSwipeEnd={() => setIsSwiping(false)}
          reducedMotion={reducedMotion}
        />
      ))}
    </div>
  );
}
