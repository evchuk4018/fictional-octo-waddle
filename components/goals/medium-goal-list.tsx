import { ProgressBar } from "@/components/ui/progress-bar";

type MediumGoal = {
  id: string;
  title: string;
  completionPercent: number;
  daily_tasks: Array<{ id: string }>;
};

type MediumGoalListProps = {
  goals: MediumGoal[];
};

export function MediumGoalList({ goals }: MediumGoalListProps) {
  if (goals.length === 0) {
    return <p className="text-sm text-text-secondary">No medium goals yet.</p>;
  }

  return (
    <div className="space-y-3">
      {goals.map((goal) => (
        <ProgressBar key={goal.id} value={goal.completionPercent} label={`${goal.title} (${goal.daily_tasks.length} tasks)`} />
      ))}
    </div>
  );
}
