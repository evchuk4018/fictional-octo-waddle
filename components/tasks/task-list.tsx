"use client";

import { DailyTask } from "../../types/db";
import { TaskItem } from "./task-item";

type TaskListProps = {
  tasks: DailyTask[];
  onToggleTask: (task: DailyTask, completed: boolean) => void;
};

export function TaskList({ tasks, onToggleTask }: TaskListProps) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-card bg-card p-card text-sm text-text-secondary" role="status">
        No active daily tasks right now.
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {tasks.map((task) => (
        <TaskItem key={task.id} task={task} onToggle={(completed) => onToggleTask(task, completed)} />
      ))}
    </div>
  );
}
