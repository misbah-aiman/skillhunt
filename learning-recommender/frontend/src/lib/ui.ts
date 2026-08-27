import type { Difficulty } from './types';

const DIFFICULTY_CLASSES: Record<Difficulty, string> = {
  beginner: 'bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-600/15',
  intermediate: 'bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-600/15',
  advanced: 'bg-rose-100 text-rose-700 ring-1 ring-inset ring-rose-600/15',
};

export function difficultyBadgeClasses(difficulty: Difficulty): string {
  return `inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${DIFFICULTY_CLASSES[difficulty]}`;
}

// Shared form/button primitives so every page's inputs and buttons look and
// behave the same, without a full component library.
export const inputClasses =
  'min-h-11 w-full rounded-xl border border-stone-300 bg-white px-3.5 py-2 text-sm text-stone-800 shadow-sm transition-all duration-200 placeholder:text-stone-400 hover:border-stone-400 focus:border-emerald-500 focus:outline-none focus:ring-4 focus:ring-emerald-500/15';

export const labelClasses = 'text-sm font-medium text-stone-700';

export const primaryButtonClasses =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-gradient-to-b from-emerald-500 to-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.08),0_8px_16px_-6px_rgba(5,150,105,0.45)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_2px_4px_rgba(0,0,0,0.08),0_12px_20px_-6px_rgba(5,150,105,0.5)] hover:brightness-105 active:translate-y-0 active:scale-[0.97] active:brightness-95 disabled:pointer-events-none disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none';

export const secondaryButtonClasses =
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-stone-400 hover:bg-stone-50 hover:shadow-md active:translate-y-0 active:scale-[0.97] disabled:pointer-events-none disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none';

export const cardClasses =
  'rounded-2xl border border-stone-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_10px_28px_-14px_rgba(41,37,36,0.18)] transition-all duration-300';

export const statusBlockClasses = 'flex items-center justify-center gap-2 py-16 text-center text-stone-500';
export const statusErrorClasses = 'flex items-center justify-center gap-2 py-16 text-center text-rose-600';
export const plainTagClasses =
  'rounded-full border border-stone-200 bg-stone-50 px-2.5 py-0.5 text-xs font-medium text-stone-600 transition-colors hover:border-stone-300 hover:bg-stone-100';

export function chatBubbleRowClasses(role: 'user' | 'assistant'): string {
  return `animate-fade-up flex ${role === 'user' ? 'justify-end' : 'justify-start'}`;
}

export function chatBubbleClasses(role: 'user' | 'assistant'): string {
  const base = 'max-w-[75%] whitespace-pre-wrap break-words rounded-2xl px-3.5 py-2.5 text-sm shadow-sm sm:max-w-[70%]';
  return role === 'user'
    ? `${base} rounded-br-md bg-gradient-to-b from-emerald-500 to-emerald-600 text-white`
    : `${base} rounded-bl-md border border-stone-200/80 bg-stone-50 text-stone-800`;
}

export const emptyStateClasses =
  'flex flex-col items-center gap-4 rounded-2xl border border-dashed border-stone-300 bg-white/60 py-16 text-center text-stone-500 backdrop-blur-sm';
