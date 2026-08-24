-- Topic model: a browsable catalog entry (not user-owned), used to
-- recommend learning material against a profile's skills/interests/goals.
create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  title text not null unique,
  description text,
  category text,
  difficulty text not null check (difficulty in ('beginner', 'intermediate', 'advanced')),
  prerequisites text[] not null default '{}',
  tags text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.topics enable row level security;

-- Catalog content: readable by anyone, written only via the service
-- role (which bypasses RLS), same as how the rest of this app writes.
create policy "Topics are publicly readable"
on public.topics for select
to anon, authenticated
using (true);
