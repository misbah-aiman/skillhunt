import type { ActivitySummary } from '../lib/types';
import { cardClasses } from '../lib/ui';

interface StreakBarProps {
  activity: ActivitySummary;
}

const DAY_LABELS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function StreakBar({ activity }: StreakBarProps) {
  const { streak, week } = activity;

  return (
    <div
      className={`${cardClasses} animate-fade-up flex flex-col gap-3 hover:-translate-y-0.5 hover:shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_32px_-14px_rgba(41,37,36,0.24)]`}
      style={{ animationDelay: '0.08s' }}
    >
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-100 text-lg">🔥</span>
        <div className="flex flex-col leading-tight">
          <span className="font-display text-2xl font-bold text-stone-800">{streak}</span>
          <span className="text-sm text-stone-500">{streak > 0 ? 'day streak' : 'Start your streak today'}</span>
        </div>
      </div>

      <div className="flex items-center justify-between gap-1.5">
        {week.map((day, index) => (
          <div key={day.date} className="flex flex-col items-center gap-1">
            <span className="text-xs font-medium text-stone-400">{DAY_LABELS[index]}</span>
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs transition-colors duration-200 ${
                day.active
                  ? 'bg-gradient-to-b from-amber-400 to-orange-500 text-white shadow-[0_2px_6px_-1px_rgba(217,119,6,0.5)]'
                  : day.isToday
                    ? 'border-2 border-dashed border-emerald-400 text-emerald-500'
                    : 'border border-stone-200 text-stone-300'
              }`}
            >
              {day.active ? '✓' : ''}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
