export type UUID = string;

export type BigGoal = {
  id: UUID;
  user_id: UUID;
  title: string;
  description: string | null;
  due_date: string | null;
  order_index: number;
  created_at: string;
};

export type MediumGoal = {
  id: UUID;
  big_goal_id: UUID;
  title: string;
  due_date: string | null;
  is_completed: boolean;
  completed_at: string | null;
  order_index: number;
};

export type DailyTask = {
  id: UUID;
  medium_goal_id: UUID;
  title: string;
  completed: boolean;
  order_index: number;
};

export type DailyTaskCheckin = {
  id: UUID;
  task_id: UUID;
  checkin_date: string;
  completed: boolean;
  created_at: string;
};

export type GoalTree = BigGoal & {
  medium_goals: Array<MediumGoal & { daily_tasks: DailyTask[] }>;
};
