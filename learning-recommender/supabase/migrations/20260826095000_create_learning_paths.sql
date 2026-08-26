-- LearningPath model: the ordered list of recommended topic ids generated
-- for a user. One row per user — regenerating a path overwrites the
-- previous one rather than keeping history, same as the profiles model.
create table if not exists public.learning_paths (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  topic_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.learning_paths enable row level security;

create policy "Users can view their own learning path"
on public.learning_paths for select
to authenticated
using ( (select auth.uid()) = user_id );

create policy "Users can insert their own learning path"
on public.learning_paths for insert
to authenticated
with check ( (select auth.uid()) = user_id );

create policy "Users can update their own learning path"
on public.learning_paths for update
to authenticated
using ( (select auth.uid()) = user_id )
with check ( (select auth.uid()) = user_id );
