export type UUID = string;

export type BigGoal = {
  id: UUID;
  user_id: UUID;
  title: string;
  description: string | null;
  created_at: string;
};

export type MediumGoal = {
  id: UUID;
  big_goal_id: UUID;
  title: string;
  order_index: number;
};

export type DailyTask = {
  id: UUID;
  medium_goal_id: UUID;
  title: string;
  completed: boolean;
  due_date: string;
};

export type GoalTree = BigGoal & {
  medium_goals: Array<MediumGoal & { daily_tasks: DailyTask[] }>;
};
