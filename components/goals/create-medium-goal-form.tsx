"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateMediumGoal } from "../../hooks/use-goals";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

type BigGoalOption = {
  id: string;
  title: string;
  mediumCount: number;
};

const schema = z.object({
  bigGoalId: z.string().uuid("Select a valid big goal"),
  title: z.string().min(3, "Title must be at least 3 characters").max(120, "Title is too long"),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid due date")
});

type FormValues = z.infer<typeof schema>;

type CreateMediumGoalFormProps = {
  options: BigGoalOption[];
};

export function CreateMediumGoalForm({ options }: CreateMediumGoalFormProps) {
  const createMediumGoal = useCreateMediumGoal();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<FormValues>({
    resolver: zodResolver(schema)
  });

  return (
    <Card>
      <form
        className="space-y-3"
        onSubmit={handleSubmit(async (values) => {
          const selected = options.find((option) => option.id === values.bigGoalId);
          await createMediumGoal.mutateAsync({
            bigGoalId: values.bigGoalId,
            title: values.title,
            orderIndex: selected?.mediumCount ?? 0,
            dueDate: values.dueDate
          });
          reset();
        })}
      >
        <h2 className="text-base font-semibold">Create Medium Goal</h2>
        <label className="space-y-1 text-sm">
          <span className="text-text-secondary">Parent Big Goal</span>
          <select
            className="h-input w-full rounded-button border border-accent bg-white px-4 text-sm text-text-primary"
            aria-invalid={Boolean(errors.bigGoalId)}
            {...register("bigGoalId")}
            defaultValue=""
          >
            <option value="" disabled>
              Select a big goal
            </option>
            {options.map((option) => (
              <option key={option.id} value={option.id}>
                {option.title}
              </option>
            ))}
          </select>
          {errors.bigGoalId ? <p className="text-xs text-red-600">{errors.bigGoalId.message}</p> : null}
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-text-secondary">Title</span>
          <Input aria-invalid={Boolean(errors.title)} {...register("title")} placeholder="Get first 100 users" />
          {errors.title ? <p className="text-xs text-red-600">{errors.title.message}</p> : null}
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-text-secondary">Due Date</span>
          <Input type="date" aria-invalid={Boolean(errors.dueDate)} {...register("dueDate")} />
          {errors.dueDate ? <p className="text-xs text-red-600">{errors.dueDate.message}</p> : null}
        </label>
        <Button type="submit" disabled={createMediumGoal.isPending || options.length === 0} className="w-full">
          {createMediumGoal.isPending ? "Saving..." : "Add Medium Goal"}
        </Button>
      </form>
    </Card>
  );
}
