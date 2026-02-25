"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useCreateTask } from "../../hooks/use-tasks";

type MediumGoalOption = {
  id: string;
  title: string;
  bigGoalTitle: string;
};

const schema = z.object({
  mediumGoalId: z.string().uuid("Select a valid medium goal"),
  title: z.string().min(2, "Task title must be at least 2 characters").max(120, "Task title is too long"),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date")
});

type FormValues = z.infer<typeof schema>;

type CreateTaskFormProps = {
  options: MediumGoalOption[];
};

function todayDateInput() {
  return new Date().toISOString().slice(0, 10);
}

export function CreateTaskForm({ options }: CreateTaskFormProps) {
  const createTask = useCreateTask();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      dueDate: todayDateInput()
    }
  });

  return (
    <Card>
      <form
        className="space-y-3"
        onSubmit={handleSubmit(async (values) => {
          await createTask.mutateAsync(values);
          reset({ dueDate: values.dueDate });
        })}
      >
        <h2 className="text-base font-semibold">Add Daily Task</h2>
        <label className="space-y-1 text-sm">
          <span className="text-text-secondary">Medium Goal</span>
          <select
            className="h-input w-full rounded-button border border-accent bg-white px-4 text-sm text-text-primary"
            aria-invalid={Boolean(errors.mediumGoalId)}
            {...register("mediumGoalId")}
            defaultValue=""
          >
            <option value="" disabled>
              Select a medium goal
            </option>
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.bigGoalTitle} · {option.title}
              </option>
            ))}
          </select>
          {errors.mediumGoalId ? <p className="text-xs text-red-600">{errors.mediumGoalId.message}</p> : null}
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-text-secondary">Task Title</span>
          <Input aria-invalid={Boolean(errors.title)} {...register("title")} placeholder="Publish landing page" />
          {errors.title ? <p className="text-xs text-red-600">{errors.title.message}</p> : null}
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-text-secondary">Due Date</span>
          <Input type="date" aria-invalid={Boolean(errors.dueDate)} {...register("dueDate")} />
          {errors.dueDate ? <p className="text-xs text-red-600">{errors.dueDate.message}</p> : null}
        </label>
        <Button type="submit" className="w-full" disabled={createTask.isPending || options.length === 0}>
          {createTask.isPending ? "Saving..." : "Add Task"}
        </Button>
      </form>
    </Card>
  );
}
