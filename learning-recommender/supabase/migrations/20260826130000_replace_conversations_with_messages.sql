-- Replaces the unused public.conversations table (jsonb messages column,
-- never wired up by any code) with a normalized schema for the AI persona
-- chat feature: one row per conversation, one row per message.
drop table if exists public.conversations;

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  status text not null default 'active' check (status in ('active', 'completed'))
);

create index conversations_user_id_idx on public.conversations (user_id);

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

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

create index messages_conversation_id_idx on public.messages (conversation_id);

alter table public.messages enable row level security;

-- Messages have no user_id of their own, so ownership is checked through
-- the parent conversation.
create policy "Users can view messages in their own conversations"
on public.messages for select
to authenticated
using (
  exists (
    select 1 from public.conversations
    where conversations.id = messages.conversation_id
    and conversations.user_id = (select auth.uid())
  )
);

create policy "Users can insert messages into their own conversations"
on public.messages for insert
to authenticated
with check (
  exists (
    select 1 from public.conversations
    where conversations.id = messages.conversation_id
    and conversations.user_id = (select auth.uid())
  )
);
