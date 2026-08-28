# Weekly streak bar

## Problem

The user wants a Duolingo-style streak indicator — how many consecutive
days the learner has been active, plus a week strip showing which of the
last 7 days were active — to motivate daily engagement. Nothing today
records per-day activity: the only per-user event the DB tracks is
completing a topic (`progress.status = 'completed'`), which is too rare a
signal (a learner can read lessons for days without finishing a topic).

Decisions made during brainstorming:

- **Activity signal:** any app engagement counts — visiting the Dashboard
  is enough to mark the day active, not just completing a topic.
- **Placement:** the streak bar lives on `DashboardPage` only (a new card
  in the existing stat grid), not in the `NavBar`.
- **Day boundary:** the user's local browser timezone. The frontend sends
  a plain `YYYY-MM-DD` date string computed from local time; the server
  treats it as an opaque calendar date and never re-derives it from a
  timestamp.

## Approach

Add a new `activity_log` table (one row per user per active day) and a
single new endpoint that both records today's activity and returns the
computed streak + current week in one round trip.

**Constraint that shapes the API design:** `frontend/api` is already at
Vercel's Hobby-plan cap of 12 Serverless Functions (see the `?lesson=1`
amendment in `docs/superpowers/specs/2026-08-27-in-app-lesson-content-design.md`
for the prior instance of this same limit). This feature must not add a
13th file. `progress/index.ts` already handles `GET /` and has no `POST
/` handler, so the new behavior is added there as a POST — no new file,
no query-param branching needed (unlike the lesson case, which had to
share a single GET handler and used a query param to distinguish).

This repo maintains two parallel implementations of every
controller/route — `backend/src` (Express, local dev) and `frontend/api`
(Vercel functions, production) — this feature follows that same pattern.

## Data model

New migration, `supabase/migrations/20260828120000_create_activity_log.sql`:

```sql
create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_date date not null,
  created_at timestamptz not null default now(),
  unique (user_id, activity_date)
);

create index if not exists activity_log_user_id_idx on public.activity_log (user_id);

alter table public.activity_log enable row level security;

create policy "Users can view their own activity"
on public.activity_log for select
to authenticated
using ( (select auth.uid()) = user_id );

create policy "Users can insert their own activity"
on public.activity_log for insert
to authenticated
with check ( (select auth.uid()) = user_id );
```

`activity_date` stores exactly the `YYYY-MM-DD` string the client sends —
the client, not the server, decides what "today" is. The `unique`
constraint makes recording idempotent: visiting the Dashboard five times
in a day is five harmless upserts on the same row, not five rows. No
update policy is needed since a row is never modified after insert.

## Backend logic

New `getOrRecordActivity(userId: string, localDate: string)` in
`backend/src/lib/activityController.ts` and its mirror in
`frontend/api/_lib/activityController.ts`:

1. Validate `localDate` matches `/^\d{4}-\d{2}-\d{2}$/`; reject otherwise
   (400).
2. Upsert `{ user_id, activity_date: localDate }` into `activity_log`
   with `onConflict: "user_id,activity_date", ignoreDuplicates: true`.
3. Select the user's last 60 `activity_date` rows, descending, and load
   them into a `Set<string>`.
4. **Streak:** starting at `localDate`, walk backward one calendar day at
   a time (pure string date-math in UTC — see below), counting while the
   date is in the set, stopping at the first gap. Since step 2 just
   inserted `localDate`, the streak is always ≥ 1 after a successful
   ping.
5. **Week:** compute the Monday–Sunday week containing `localDate`
   (`offset = (dayOfWeek + 6) % 7` from `localDate` gives Monday), then
   build 7 entries `{ date, active, isToday }` from the same set.

Date arithmetic parses `YYYY-MM-DD` via `Date.UTC(y, m - 1, d)` and adds/
subtracts whole days in UTC, then reformats back to `YYYY-MM-DD` — this
is calendar-date math on an already-resolved local date, not a timezone
conversion, so UTC is just a safe, DST-free scratch space for it.

Return shape: `{ streak: number, week: WeekDay[], error: null }` or
`{ streak: null, week: null, error: string }`, matching this codebase's
existing result-object convention.

## API

`POST /api/progress` (both `backend/src/routes/progress.ts` and
`frontend/api/progress/index.ts`, both already behind the existing
`authenticate`/`getAuthedUser` auth):

- Body: `{ "localDate": "2026-08-28" }`.
- 400 `{ ok: false, error }` if `localDate` is missing or malformed.
- 200 `{ ok: true, streak, week }` on success.
- 500 `{ ok: false, error }` on a DB failure.

`GET /api/progress` (topic progress list) is unchanged.

## Frontend

New type in `frontend/src/lib/types.ts`:

```ts
export interface WeekDay {
  date: string; // YYYY-MM-DD
  active: boolean;
  isToday: boolean;
}

export interface ActivitySummary {
  streak: number;
  week: WeekDay[];
}
```

New helper `getLocalDateString()` in `frontend/src/lib/date.ts`, using
`Date#getFullYear`/`getMonth`/`getDate` (local-time accessors) to build
the `YYYY-MM-DD` string — this is what makes the day boundary the
browser's local timezone.

`DashboardPage`'s existing `load()` gains a third, independent call
alongside the progress/recommendations `Promise.all`:

```ts
fetch('/api/progress', {
  method: 'POST',
  headers: { ...headers, 'Content-Type': 'application/json' },
  body: JSON.stringify({ localDate: getLocalDateString() }),
})
```

This call is wrapped in its own `try/catch`, separate from the existing
`setError` path used for progress/recommendations — a failed activity
ping is a lost motivational nice-to-have, not a broken dashboard, so it
just leaves `activity` as `null` (streak card doesn't render) rather than
surfacing an error banner.

New `frontend/src/components/StreakBar.tsx`, taking `activity:
ActivitySummary` as a prop. Rendered as a third card in `DashboardPage`'s
existing stat grid (same `cardClasses`/`animate-fade-up` treatment as the
"Topics Completed" and "Path progress" cards), showing:

- 🔥 + `{streak}` as the headline number (reusing the same
  `font-display text-4xl font-bold` treatment as the completed-count
  card), with the label "day streak" (or "Start your streak today" copy
  when `streak === 0`).
- A row of 7 pips labeled M/T/W/T/F/S/S, one per `week` entry: filled
  emerald for `active`, a subtle ring instead of fill for `isToday &&
  !active` (visually distinct "today, not logged yet" vs "missed"), and
  plain outline for a past inactive day.

## Error handling

- Malformed/missing `localDate` → 400, frontend just skips rendering the
  streak card (see above).
- DB upsert or select failure → 500, same handling.
- No retry/backoff: a missed ping just means the streak card doesn't
  appear for that page load; the next Dashboard visit tries again.

## Testing

This repo has no automated test suite (`npm test` is a stub in both
`backend` and `frontend`). Verification for this feature:

- `tsc -b`/`tsc` and `eslint` clean in both `backend` and `frontend`.
- `vite build` clean.
- Direct `curl -X POST /api/progress` with a fixed `localDate` body,
  repeated on consecutive fabricated dates, to confirm: idempotency (same
  date twice → streak unchanged), streak increments across consecutive
  dates, and streak resets to 1 after a gap.
- Confirm the `activity_log` row count matches expectations after
  repeated same-day pings (no duplicate rows).
- Manual check in the browser (`npm run dev`) that the week pips line up
  with today's actual weekday and that revisiting the Dashboard the same
  day doesn't change the streak number.

## Out of scope

- Streak freezes / grace periods for a missed day.
- Tracking or displaying a longest-streak record.
- Any activity history beyond the current calendar week.
- Surfacing the streak anywhere outside `DashboardPage` (e.g. `NavBar`).
- Server-side trust/verification of the client-sent date beyond format
  validation — a user could spoof `localDate`, but this is a motivational
  feature, not a security boundary.
