create table if not exists public.widget_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  token text not null unique default encode(gen_random_bytes(32), 'hex'),
  created_at timestamptz not null default timezone('utc', now())
);

create unique index if not exists widget_tokens_user_id_idx on public.widget_tokens (user_id);

alter table public.widget_tokens enable row level security;

create policy "widget_tokens_select_own"
  on public.widget_tokens for select
  using (auth.uid() = user_id);

create policy "widget_tokens_insert_own"
  on public.widget_tokens for insert
  with check (auth.uid() = user_id);

create policy "widget_tokens_delete_own"
  on public.widget_tokens for delete
  using (auth.uid() = user_id);
