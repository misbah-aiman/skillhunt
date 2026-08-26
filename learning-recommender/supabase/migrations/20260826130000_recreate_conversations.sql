-- Replaces the old public.conversations table (jsonb messages column,
-- status in_progress/completed, never wired up by any code) with a flat
-- schema for the Learning Recommender chat feature: one row per message.
drop table if exists public.messages;
drop table if exists public.conversations;

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  message text not null,
  created_at timestamptz not null default now()
);

-- Postgres doesn't auto-index foreign key columns; always queried by
-- user_id ("this user's conversation history").
create index conversations_user_id_idx on public.conversations (user_id);

alter table public.conversations enable row level security;

create policy "Users can view their own conversation messages"
on public.conversations for select
to authenticated
using ( (select auth.uid()) = user_id );

create policy "Users can insert their own conversation messages"
on public.conversations for insert
to authenticated
with check ( (select auth.uid()) = user_id );
