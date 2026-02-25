"use client";

import { motion } from "framer-motion";
import { DailyTask } from "../../types/db";

type TaskItemProps = {
  task: DailyTask;
  onToggle: (next: boolean) => void;
};

export function TaskItem({ task, onToggle }: TaskItemProps) {
  return (
    <motion.label
      layout
      className="flex items-center gap-3 rounded-button border border-accent bg-card px-4 py-3"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
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
