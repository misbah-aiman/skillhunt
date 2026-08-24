-- Resource model: a learning resource (video/article/course) attached
-- to a topic. Catalog content, not user-owned.
create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  title text not null,
  url text not null,
  type text not null check (type in ('video', 'article', 'course')),
  provider text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (topic_id, url)
);

-- Postgres doesn't auto-index foreign key columns; this table is
-- always queried by topic_id ("resources for this topic").
create index if not exists resources_topic_id_idx on public.resources (topic_id);

alter table public.resources enable row level security;

create policy "Resources are publicly readable"
on public.resources for select
to anon, authenticated
using (true);
