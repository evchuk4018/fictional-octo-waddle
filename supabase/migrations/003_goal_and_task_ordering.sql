alter table public.big_goals
  add column if not exists order_index int;

with ranked as (
  select id, row_number() over (partition by user_id order by created_at asc, id asc) - 1 as next_order
  from public.big_goals
)
update public.big_goals bg
set order_index = ranked.next_order
from ranked
where bg.id = ranked.id
  and bg.order_index is null;

alter table public.big_goals
  alter column order_index set not null,
  alter column order_index set default 0;

create unique index if not exists big_goals_user_order_index_uidx
  on public.big_goals (user_id, order_index);

with ranked_medium as (
  select
    id,
    row_number() over (partition by big_goal_id order by order_index asc, id asc) - 1 as next_order
  from public.medium_goals
)
update public.medium_goals mg
set order_index = ranked_medium.next_order
from ranked_medium
where mg.id = ranked_medium.id;

create unique index if not exists medium_goals_big_goal_order_index_uidx
  on public.medium_goals (big_goal_id, order_index);

alter table public.daily_tasks
  add column if not exists order_index int;

with ranked_tasks as (
  select
    id,
    row_number() over (partition by medium_goal_id order by completed asc, title asc, id asc) - 1 as next_order
  from public.daily_tasks
)
update public.daily_tasks dt
set order_index = ranked_tasks.next_order
from ranked_tasks
where dt.id = ranked_tasks.id
  and dt.order_index is null;

alter table public.daily_tasks
  alter column order_index set not null,
  alter column order_index set default 0;

create unique index if not exists daily_tasks_medium_goal_order_index_uidx
  on public.daily_tasks (medium_goal_id, order_index);
