"use client";

import { Card } from "../../components/ui/card";
import { CreateTaskForm } from "../../components/tasks/create-task-form";
import { TaskList } from "../../components/tasks/task-list";
import { useGoalTree } from "../../hooks/use-goals";
import { useTodayTasks, useToggleTask } from "../../hooks/use-tasks";

export default function TasksPage() {
  const goalsQuery = useGoalTree();
  const todayTasksQuery = useTodayTasks();
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
        <p className="text-sm text-text-secondary">Plan daily work and check it off in real time.</p>
      </header>

      <CreateTaskForm options={options} />

      <section className="space-y-3" aria-labelledby="today-task-list">
        <h2 id="today-task-list" className="text-base font-semibold">
          Today&apos;s Tasks
        </h2>
        {todayTasksQuery.isLoading ? (
          <Card>
            <p className="text-sm text-text-secondary">Loading tasks...</p>
          </Card>
        ) : todayTasksQuery.isError ? (
          <Card>
            <p className="text-sm text-red-700">Unable to load tasks.</p>
          </Card>
        ) : (
          <TaskList
            tasks={todayTasksQuery.data ?? []}
            onToggleTask={(task, completed) => toggleTask.mutate({ taskId: task.id, completed })}
          />
        )}
      </section>
    </div>
  );
}
