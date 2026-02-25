alter table public.big_goals
  add column if not exists due_date date;

alter table public.medium_goals
  add column if not exists due_date date,
  add column if not exists is_completed boolean not null default false,
  add column if not exists completed_at timestamptz;

alter table public.daily_tasks
  drop column if exists due_date;

create table if not exists public.daily_task_checkins (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.daily_tasks (id) on delete cascade,
  checkin_date date not null default (timezone('utc', now()))::date,
  completed boolean not null default false,
  created_at timestamptz not null default timezone('utc', now()),
  unique (task_id, checkin_date)
);

alter table public.daily_task_checkins enable row level security;

create policy "daily_task_checkins_select_own"
  on public.daily_task_checkins for select
  using (
    exists (
      select 1
      from public.daily_tasks t
      join public.medium_goals m on m.id = t.medium_goal_id
      join public.big_goals b on b.id = m.big_goal_id
      where t.id = daily_task_checkins.task_id and b.user_id = auth.uid()
    )
  );

create policy "daily_task_checkins_insert_own"
  on public.daily_task_checkins for insert
  with check (
    exists (
      select 1
      from public.daily_tasks t
      join public.medium_goals m on m.id = t.medium_goal_id
      join public.big_goals b on b.id = m.big_goal_id
      where t.id = daily_task_checkins.task_id and b.user_id = auth.uid()
    )
  );

create policy "daily_task_checkins_update_own"
  on public.daily_task_checkins for update
  using (
    exists (
      select 1
      from public.daily_tasks t
      join public.medium_goals m on m.id = t.medium_goal_id
      join public.big_goals b on b.id = m.big_goal_id
      where t.id = daily_task_checkins.task_id and b.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.daily_tasks t
      join public.medium_goals m on m.id = t.medium_goal_id
      join public.big_goals b on b.id = m.big_goal_id
      where t.id = daily_task_checkins.task_id and b.user_id = auth.uid()
    )
  );

create policy "daily_task_checkins_delete_own"
  on public.daily_task_checkins for delete
  using (
    exists (
      select 1
      from public.daily_tasks t
      join public.medium_goals m on m.id = t.medium_goal_id
      join public.big_goals b on b.id = m.big_goal_id
      where t.id = daily_task_checkins.task_id and b.user_id = auth.uid()
    )
  );
