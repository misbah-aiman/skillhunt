-- Progress model: tracks a user's status on a topic (in_progress or
-- completed). One row per (user, topic) — marking complete again just
-- updates the existing row rather than creating a duplicate.
create table if not exists public.progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, topic_id)
);

-- Postgres doesn't auto-index foreign key columns; always queried by
-- user_id ("this user's progress across topics").
create index if not exists progress_user_id_idx on public.progress (user_id);

alter table public.progress enable row level security;

create policy "Users can view their own progress"
on public.progress for select
to authenticated
using ( (select auth.uid()) = user_id );

create policy "Users can insert their own progress"
on public.progress for insert
to authenticated
with check ( (select auth.uid()) = user_id );

create policy "Users can update their own progress"
on public.progress for update
to authenticated
using ( (select auth.uid()) = user_id )
with check ( (select auth.uid()) = user_id );
