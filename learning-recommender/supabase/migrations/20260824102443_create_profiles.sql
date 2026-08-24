-- Profile model: one row per authenticated user, holding their skills,
-- interests, goals, and bio for the SkillHunt recommender.
--
-- Named "profiles" (lowercase) to avoid colliding with the existing
-- "Profiles" table used by /api/db-check for connectivity checks.
create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  skills jsonb not null default '[]'::jsonb,
  interests text[] not null default '{}',
  goals text[] not null default '{}',
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
on public.profiles for select
to authenticated
using ( (select auth.uid()) = user_id );

create policy "Users can insert their own profile"
on public.profiles for insert
to authenticated
with check ( (select auth.uid()) = user_id );

create policy "Users can update their own profile"
on public.profiles for update
to authenticated
using ( (select auth.uid()) = user_id )
with check ( (select auth.uid()) = user_id );
