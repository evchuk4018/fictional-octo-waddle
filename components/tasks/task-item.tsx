"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { DailyTask } from "../../types/db";
import { cn } from "../../lib/utils";

type TaskItemProps = {
  task: DailyTask;
  onToggle: (next: boolean) => void;
  onDelete?: () => void;
};

const SWIPE_DELETE_THRESHOLD = -80;
const SWIPE_MID_TONE_THRESHOLD = -30;
const SWIPE_HIGH_TONE_THRESHOLD = -70;

export function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  const [swipeOffset, setSwipeOffset] = useState(0);

  const swipeToneClass =
    swipeOffset <= SWIPE_HIGH_TONE_THRESHOLD
      ? "border-red-300 bg-red-100"
      : swipeOffset <= SWIPE_MID_TONE_THRESHOLD
        ? "border-red-200 bg-red-50"
        : "border-accent bg-card";

  return (
    <motion.label
      layout
      className={cn("flex items-center gap-3 rounded-button border px-4 py-3 transition-colors", swipeToneClass)}
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      drag={onDelete ? "x" : false}
      dragConstraints={{ left: -120, right: 0 }}
      dragElastic={0.1}
      whileDrag={{ scale: 0.99 }}
      onDrag={(_, info) => {
        setSwipeOffset(info.offset.x);
      }}
      onDragEnd={(_, info) => {
        setSwipeOffset(0);
        if (!onDelete) return;
        if (info.offset.x <= SWIPE_DELETE_THRESHOLD) {
          onDelete();
        }
      }}
      transition={{ duration: 0.2 }}
    >
      <input
        type="checkbox"
        checked={task.completed}
        onChange={(event) => onToggle(event.target.checked)}
        aria-label={`Mark ${task.title} as ${task.completed ? "incomplete" : "complete"}`}
        className="h-5 w-5 rounded border-accent text-primary focus:ring-primary"
      />
      <span className={task.completed ? "text-sm text-text-secondary line-through" : "text-sm text-text-primary"}>
        {task.title}
      </span>
    </motion.label>
  );
}
