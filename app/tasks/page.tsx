"use client";

import { Card } from "../../components/ui/card";
import { CreateTaskForm } from "../../components/tasks/create-task-form";
import { TaskList } from "../../components/tasks/task-list";
import { useGoalTree } from "../../hooks/use-goals";
import { useActiveTasks, useToggleTask } from "../../hooks/use-tasks";

export default function TasksPage() {
  const goalsQuery = useGoalTree();
  const activeTasksQuery = useActiveTasks();
  const toggleTask = useToggleTask();

  const options = (goalsQuery.data ?? []).flatMap((goal) =>
    goal.medium_goals.map((mediumGoal) => ({
      id: mediumGoal.id,
      title: mediumGoal.title,
      bigGoalTitle: goal.title
    }))
  );

  return (
    <div className="space-y-section">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Tasks</h1>
        <p className="text-sm text-text-secondary">Track active daily accountability tasks across your goals.</p>
      </header>

      <CreateTaskForm options={options} />

      <section className="space-y-3" aria-labelledby="active-task-list">
        <h2 id="active-task-list" className="text-base font-semibold">
          Active Tasks
        </h2>
        {activeTasksQuery.isLoading ? (
          <Card>
            <p className="text-sm text-text-secondary">Loading tasks...</p>
          </Card>
        ) : activeTasksQuery.isError ? (
          <Card>
            <p className="text-sm text-red-700">Unable to load tasks.</p>
          </Card>
        ) : (
          <TaskList
            tasks={activeTasksQuery.data ?? []}
            onToggleTask={(task, completed) => toggleTask.mutate({ taskId: task.id, completed })}
          />
        )}
      </section>
    </div>
  );
}
