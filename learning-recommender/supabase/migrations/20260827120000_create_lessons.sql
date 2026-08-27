-- Lesson model: AI-generated in-app learning material (summary, key
-- concepts, worked examples, practice quiz) for a topic. One row per
-- topic, generated on first request and cached — see lessonController.
-- Catalog content, not user-owned, same pattern as resources.
create table if not exists public.lessons (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null unique references public.topics(id) on delete cascade,
  summary text not null,
  key_concepts jsonb not null default '[]'::jsonb,
  examples jsonb not null default '[]'::jsonb,
  quiz jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.lessons enable row level security;

create policy "Lessons are publicly readable"
on public.lessons for select
to anon, authenticated
using (true);
