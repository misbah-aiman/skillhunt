-- Activity log: one row per (user, day) they engaged with the app at
-- all, used to compute the Dashboard streak bar. Deliberately separate
-- from `progress`, which only tracks per-topic status and is too sparse
-- a signal for "was the learner here today" (see
-- docs/superpowers/specs/2026-08-28-streak-bar-design.md).
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_date date not null,
  created_at timestamptz not null default now(),
  unique (user_id, activity_date)
);

create index if not exists activity_log_user_id_idx on public.activity_log (user_id);

alter table public.activity_log enable row level security;

create policy "Users can view their own activity"
on public.activity_log for select
to authenticated
using ( (select auth.uid()) = user_id );

create policy "Users can insert their own activity"
on public.activity_log for insert
to authenticated
with check ( (select auth.uid()) = user_id );
