"use client";

import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useCreateBigGoal } from "../../hooks/use-goals";
import { Card } from "../ui/card";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { Button } from "../ui/button";

const schema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters").max(120, "Title is too long"),
  description: z.string().max(400, "Description is too long").optional()
});

type FormValues = z.infer<typeof schema>;

export function CreateBigGoalForm() {
  const createBigGoal = useCreateBigGoal();
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: "", description: "" }
  });

  return (
    <Card>
      <form
        className="space-y-3"
        onSubmit={handleSubmit(async (values) => {
          await createBigGoal.mutateAsync(values);
          reset();
        })}
      >
        <h2 className="text-base font-semibold">Create Big Goal</h2>
        <label className="space-y-1 text-sm">
          <span className="text-text-secondary">Title</span>
          <Input aria-invalid={Boolean(errors.title)} {...register("title")} placeholder="Launch my startup" />
          {errors.title ? <p className="text-xs text-red-600">{errors.title.message}</p> : null}
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-text-secondary">Description</span>
          <Textarea {...register("description")} placeholder="What does success look like?" />
          {errors.description ? <p className="text-xs text-red-600">{errors.description.message}</p> : null}
        </label>
        <Button type="submit" disabled={createBigGoal.isPending} className="w-full">
          {createBigGoal.isPending ? "Saving..." : "Add Big Goal"}
        </Button>
      </form>
    </Card>
  );
}
