import { Card } from "../ui/card";
import { CircularProgress } from "../ui/circular-progress";
import { ProgressBar } from "../ui/progress-bar";

type MediumGoalView = {
  id: string;
  title: string;
  completionPercent: number;
  daily_tasks: Array<{ id: string }>;
};

type BigGoalCardProps = {
  title: string;
  description: string | null;
  completionPercent: number;
  mediumGoals: MediumGoalView[];
};

export function BigGoalCard({ title, description, completionPercent, mediumGoals }: BigGoalCardProps) {
  return (
    <Card className="space-y-cardGap">
      <header className="flex items-start justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-text-primary">{title}</h3>
          {description ? <p className="text-sm text-text-secondary">{description}</p> : null}
        </div>
        <CircularProgress percent={completionPercent} />
      </header>

      <div className="space-y-3">
        {mediumGoals.length === 0 ? (
          <p className="text-sm text-text-secondary">No medium goals yet.</p>
        ) : (
          mediumGoals.map((mediumGoal) => (
            <ProgressBar
              key={mediumGoal.id}
              value={mediumGoal.completionPercent}
              label={`${mediumGoal.title} (${mediumGoal.daily_tasks.length} tasks)`}
            />
          ))
        )}
      </div>
    </Card>
  );
}
