create extension if not exists "pgcrypto";

create table if not exists public.big_goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null,
  description text,
  created_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.medium_goals (
  id uuid primary key default gen_random_uuid(),
  big_goal_id uuid not null references public.big_goals (id) on delete cascade,
  title text not null,
  order_index int not null default 0
);

create table if not exists public.daily_tasks (
  id uuid primary key default gen_random_uuid(),
  medium_goal_id uuid not null references public.medium_goals (id) on delete cascade,
  title text not null,
  completed boolean not null default false,
  due_date date not null
);

alter table public.big_goals enable row level security;
alter table public.medium_goals enable row level security;
alter table public.daily_tasks enable row level security;

create policy "big_goals_select_own"
  on public.big_goals for select
  using (auth.uid() = user_id);

create policy "big_goals_insert_own"
  on public.big_goals for insert
  with check (auth.uid() = user_id);

create policy "big_goals_update_own"
  on public.big_goals for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "big_goals_delete_own"
  on public.big_goals for delete
  using (auth.uid() = user_id);

create policy "medium_goals_select_own"
  on public.medium_goals for select
  using (
    exists (
      select 1 from public.big_goals b
      where b.id = medium_goals.big_goal_id and b.user_id = auth.uid()
    )
  );

create policy "medium_goals_insert_own"
  on public.medium_goals for insert
  with check (
    exists (
      select 1 from public.big_goals b
      where b.id = medium_goals.big_goal_id and b.user_id = auth.uid()
    )
  );

create policy "medium_goals_update_own"
  on public.medium_goals for update
  using (
    exists (
      select 1 from public.big_goals b
      where b.id = medium_goals.big_goal_id and b.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.big_goals b
      where b.id = medium_goals.big_goal_id and b.user_id = auth.uid()
    )
  );

create policy "medium_goals_delete_own"
  on public.medium_goals for delete
  using (
    exists (
      select 1 from public.big_goals b
      where b.id = medium_goals.big_goal_id and b.user_id = auth.uid()
    )
  );

create policy "daily_tasks_select_own"
  on public.daily_tasks for select
  using (
    exists (
      select 1
      from public.medium_goals m
      join public.big_goals b on b.id = m.big_goal_id
      where m.id = daily_tasks.medium_goal_id and b.user_id = auth.uid()
    )
  );

create policy "daily_tasks_insert_own"
  on public.daily_tasks for insert
  with check (
    exists (
      select 1
      from public.medium_goals m
      join public.big_goals b on b.id = m.big_goal_id
      where m.id = daily_tasks.medium_goal_id and b.user_id = auth.uid()
    )
  );

create policy "daily_tasks_update_own"
  on public.daily_tasks for update
  using (
    exists (
      select 1
      from public.medium_goals m
      join public.big_goals b on b.id = m.big_goal_id
      where m.id = daily_tasks.medium_goal_id and b.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1
      from public.medium_goals m
      join public.big_goals b on b.id = m.big_goal_id
      where m.id = daily_tasks.medium_goal_id and b.user_id = auth.uid()
    )
  );

create policy "daily_tasks_delete_own"
  on public.daily_tasks for delete
  using (
    exists (
      select 1
      from public.medium_goals m
      join public.big_goals b on b.id = m.big_goal_id
      where m.id = daily_tasks.medium_goal_id and b.user_id = auth.uid()
    )
  );
