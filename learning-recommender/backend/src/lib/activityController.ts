import { supabase } from "./supabase.js";

export interface WeekDay {
  date: string;
  active: boolean;
  isToday: boolean;
}

export interface ActivityResult {
  streak: number | null;
  week: WeekDay[] | null;
  error: string | null;
}

const LOCAL_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

// Calendar-date math done entirely as UTC-midnight timestamps, on a date
// string that's already been resolved to the caller's local day — this is
// a DST-free scratch space for adding/subtracting whole days, not a
// timezone conversion.
function parseLocalDate(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return Date.UTC(y, m - 1, d);
}

function formatLocalDate(timestamp: number): string {
  const d = new Date(timestamp);
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(date: string, days: number): string {
  return formatLocalDate(parseLocalDate(date) + days * 86_400_000);
}

// Monday-start week containing `date`. getUTCDay() is 0 (Sun) .. 6 (Sat).
function startOfWeek(date: string): string {
  const dayOfWeek = new Date(parseLocalDate(date)).getUTCDay();
  const offsetFromMonday = (dayOfWeek + 6) % 7;
  return addDays(date, -offsetFromMonday);
}

export function isValidLocalDate(date: unknown): date is string {
  if (typeof date !== "string" || !LOCAL_DATE_PATTERN.test(date)) return false;
  return !Number.isNaN(parseLocalDate(date));
}

async function getActivitySummary(userId: string, localDate: string): Promise<ActivityResult> {
  const { data, error } = await supabase
    .from("activity_log")
    .select("activity_date")
    .eq("user_id", userId)
    .order("activity_date", { ascending: false })
    .limit(60);

  if (error) {
    return { streak: null, week: null, error: error.message };
  }

  const activeDates = new Set((data as { activity_date: string }[]).map((row) => row.activity_date));

  let streak = 0;
  let cursor = localDate;
  while (activeDates.has(cursor)) {
    streak++;
    cursor = addDays(cursor, -1);
  }

  const weekStart = startOfWeek(localDate);
  const week: WeekDay[] = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(weekStart, i);
    return { date, active: activeDates.has(date), isToday: date === localDate };
  });

  return { streak, week, error: null };
}

// Records today's activity (idempotent per user per day via the unique
// constraint) and returns the resulting streak + current Mon-Sun week.
export async function recordActivity(userId: string, localDate: string): Promise<ActivityResult> {
  const { error: upsertError } = await supabase
    .from("activity_log")
    .upsert({ user_id: userId, activity_date: localDate }, { onConflict: "user_id,activity_date", ignoreDuplicates: true });

  if (upsertError) {
    return { streak: null, week: null, error: upsertError.message };
  }

  return getActivitySummary(userId, localDate);
}
