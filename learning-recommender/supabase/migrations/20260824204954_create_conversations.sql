-- Conversation model: chat history for the onboarding assistant,
-- scoped per user so a session can resume where it left off.
create table if not exists public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  messages jsonb not null default '[]'::jsonb,
  status text not null default 'in_progress' check (status in ('in_progress', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Postgres doesn't auto-index foreign key columns; always queried by
-- user_id ("this user's conversation history").
create index if not exists conversations_user_id_idx on public.conversations (user_id);

alter table public.conversations enable row level security;

create policy "Users can view their own conversations"
on public.conversations for select
to authenticated
using ( (select auth.uid()) = user_id );

create policy "Users can insert their own conversations"
on public.conversations for insert
to authenticated
with check ( (select auth.uid()) = user_id );

create policy "Users can update their own conversations"
on public.conversations for update
to authenticated
using ( (select auth.uid()) = user_id )
with check ( (select auth.uid()) = user_id );
