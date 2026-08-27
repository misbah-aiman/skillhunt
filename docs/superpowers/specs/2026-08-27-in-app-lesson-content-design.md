# In-app lesson content per topic

## Problem

Today `TopicDetailPage` only shows a topic's metadata plus a flat list of
external resource links (video/article/course URLs seeded from
`backend/src/seed.ts`). The user wants real learning material rendered
inside the app itself — an explanation, worked examples, and a practice
quiz — for every topic in the catalog, generic enough to cover all 8
existing categories (Web Development, Data Science, Design, DevOps &
Cloud, Machine Learning & AI, Mobile Development, Product & Business,
Cybersecurity), not just a fixed list of topics.

The external resource links stay exactly as they are today; this adds a
new section alongside them rather than replacing them.

## Approach

Reuse the Gemini structured-output pattern already established in
`chatController.ts` (both the `backend/src/controllers` and
`frontend/api/_lib` copies) to generate a lesson (summary, key concepts,
examples, quiz) for a topic on first request, then cache it in a new
`lessons` table so every later visit — by any user — is an instant DB
read with no repeat API cost and no drift in content between visits.

This repo consistently maintains two parallel implementations of every
controller/route: one under `backend/src` (Express, used via the Vite
dev proxy to `localhost:4000`) and one under `frontend/api` (Vercel
serverless functions, used in production). This feature follows that
same pattern rather than introducing a new one.

## Data model

New migration, `supabase/migrations/<timestamp>_create_lessons.sql`,
following the same shape/RLS pattern as `resources`:

```sql
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
```

`topic_id` is `unique` (one lesson per topic) and there is no insert/update
policy for `anon`/`authenticated` — writes only happen through the
server's service-role Supabase client, same as `topics`/`resources`.

Shapes stored in the `jsonb` columns:

- `key_concepts`: `{ title: string; explanation: string }[]` — 4-6 items.
- `examples`: `{ title: string; explanation: string; code: string; language: string }[]` —
  3 items. `code`/`language` are empty strings for non-technical topics
  (e.g. a Product & Business topic) so the shape stays uniform across
  every category; the frontend skips rendering a code block when `code`
  is empty.
- `quiz`: `{ question: string; options: string[4]; correctIndex: number; explanation: string }[]` —
  5 items.

## Generation logic

New functions `getOrGenerateLesson(topicId: string): Promise<LessonResult>`,
added to both `backend/src/lib/lessonController.ts` and
`frontend/api/_lib/lessonController.ts` (mirroring the existing
`topicController.ts` split):

1. Look up the topic by id (reuse `getTopicById`'s topic lookup — need
   the topic's title/description/category/difficulty/tags to prompt
   Gemini) and the existing `lessons` row for that `topic_id`.
2. If a `lessons` row exists, return it directly.
3. If not, call Gemini (`gemini-3.6-flash`, same model constant as
   `chatController`) with a system prompt instructing it to produce a
   summary, 4-6 key concepts, 3 worked examples (with code only when the
   topic is technical), and a 5-question multiple-choice quiz with
   explanations — using `responseMimeType: "application/json"` and a
   `responseSchema` mirroring the shapes above (same structured-output
   approach as `CHAT_RESPONSE_SCHEMA`).
4. Insert the generated content into `lessons`. If the insert fails on
   the `topic_id` unique constraint (a race: two users opened the same
   never-generated topic at once), re-select the row that the other
   request just inserted and return that instead of erroring.
5. If the insert fails for any other reason, log it and still return the
   generated content for this one request (best-effort caching, the same
   tradeoff `saveMessage` already makes in `chatController`) rather than
   blocking the user — the next visitor will simply regenerate.

Errors (Gemini failure, malformed JSON, topic not found) surface as
`{ lesson: null, error: string }`, matching the `ChatResult`/
`TopicDetailResult` error-shape convention already used across this
codebase.

## API

New route, added in both places:

- `backend/src/routes/topics.ts`: `GET /:id/lesson` → calls
  `getOrGenerateLesson`, returns `{ ok: true, lesson }` or
  `{ ok: false, error }` (404 if the topic itself doesn't exist, 500 on
  generation/DB failure).
- `frontend/api/topics/[id]/lesson.ts`: new Vercel Web Handler file,
  same response shape, mirroring `frontend/api/topics/[id].ts`'s style
  of reading the id from the URL path.

## Frontend

New `frontend/src/components/LessonContent.tsx`, taking `topicId` as a
prop. It fetches `GET /api/topics/:id/lesson` independently of
`TopicDetailPage`'s existing topic/resources fetch, so the page shell
(title, difficulty badge, category, description, prerequisites,
resources) still renders immediately while the lesson streams in
separately with its own loading state — since first-time generation can
take several seconds, this keeps the rest of the page from feeling
stuck.

Rendered in `TopicDetailPage` between the "Prerequisites" section and
the existing "Resources" section. Layout, top to bottom:

1. **Summary** — a short paragraph.
2. **Key Concepts** — a list of title + explanation pairs.
3. **Examples** — title + explanation per example, with a monospace code
   block shown only when `code` is non-empty.
4. **Practice Quiz** — a new small stateful piece (can live in the same
   file or a `Quiz.tsx` sibling if `LessonContent` gets too large):
   each question can be answered independently; selecting an option
   immediately reveals correct/incorrect styling plus the explanation
   text; a running "`n`/5 correct" badge updates as questions are
   answered. This is purely a self-check — it does not gate or interact
   with `LearningPathPage`'s existing "Mark as Complete" flow, which is
   left completely unchanged.

Loading state message: "Generating your lesson — this can take a few
seconds the first time." Error state: inline error text with a Retry
button that just re-fires the same fetch (a retry after a failed
generation attempt will attempt generation again, since nothing was
cached).

New types added to `frontend/src/lib/types.ts` (and the backend's
equivalent `lib/types.ts`): `KeyConcept`, `LessonExample`, `QuizQuestion`,
`Lesson`.

Visual styling follows the existing shared primitives in `lib/ui.ts`
(`cardClasses`, the gradient/shadow treatment already applied across the
app) rather than introducing a separate style system.

## Error handling

- Gemini call throws, returns empty text, or returns unparseable JSON →
  `getOrGenerateLesson` returns an error string; the route responds
  `{ ok: false, error }` with a 500; the frontend shows the inline
  error + Retry state described above.
- Topic id doesn't exist → 404, same as the existing
  `GET /api/topics/:id` behavior.
- DB insert race or failure → handled as described in Generation logic
  above; never surfaces as a user-facing error by itself.

## Testing

This repo has no automated test suite (`npm test` is a stub in both
`backend` and `frontend`). Verification for this feature:

- `tsc -b`/`tsc` and `eslint` clean in both `backend` and `frontend`.
- `vite build` clean.
- Direct `curl` against the new endpoint to confirm the JSON shape and
  that a second request for the same topic returns the cached row
  (no second Gemini call — verified by checking the `lessons` table
  row's `updated_at`/`created_at` don't change between requests).
- Manual read-through of generated content for at least one technical
  topic (e.g. "React Fundamentals") and one non-technical topic (e.g. a
  Product & Business topic) to confirm the schema holds up sensibly for
  both, and that `code`/`language` come back empty rather than
  malformed for the non-technical case.
- Manual check of the quiz interaction (answer, see reveal, score badge
  updates) via `npm run dev`, since browser automation tools aren't
  available this session.

## Out of scope

- Regenerating or editing lesson content after it's first generated.
- Gating "Mark as Complete" on quiz performance.
- Removing or restyling the existing external Resources section beyond
  what's needed to fit the new section above it.
- Pre-generating content for all topics ahead of time — generation stays
  on-demand, first-visit-triggered.
