import type { Difficulty } from './types';

const DIFFICULTY_CLASSES: Record<Difficulty, string> = {
  beginner: 'bg-emerald-100 text-emerald-700',
  intermediate: 'bg-amber-100 text-amber-800',
  advanced: 'bg-rose-100 text-rose-700',
};

export function difficultyBadgeClasses(difficulty: Difficulty): string {
  return `inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${DIFFICULTY_CLASSES[difficulty]}`;
}

// Shared form/button primitives so every page's inputs and buttons look and
// behave the same, without a full component library.
export const inputClasses =
  'min-h-11 w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm text-stone-800 placeholder:text-stone-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30';

export const labelClasses = 'text-sm font-medium text-stone-700';

export const primaryButtonClasses =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50';

export const secondaryButtonClasses =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 transition-colors hover:bg-stone-50 disabled:cursor-not-allowed disabled:opacity-50';

export const cardClasses = 'rounded-xl border border-stone-200 bg-white p-5 shadow-sm';

export const statusBlockClasses = 'flex items-center justify-center gap-2 py-16 text-center text-stone-500';
export const statusErrorClasses = 'flex items-center justify-center gap-2 py-16 text-center text-rose-600';
export const plainTagClasses = 'rounded-full border border-stone-200 bg-stone-100 px-2.5 py-0.5 text-xs text-stone-600';

export function chatBubbleRowClasses(role: 'user' | 'assistant'): string {
  return `animate-fade-up flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;
}

export function chatBubbleClasses(role: 'user' | 'assistant'): string {
  const base = 'max-w-[75%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm sm:max-w-[70%]';
  return role === 'user'
    ? `${base} rounded-br-md bg-emerald-600 text-white`
    : `${base} rounded-bl-md bg-stone-100 text-stone-800`;
}

export const emptyStateClasses =
  'flex flex-col items-center gap-4 rounded-xl border border-dashed border-stone-300 py-16 text-center text-stone-500';
