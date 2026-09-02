import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import type { Difficulty } from '../lib/types';
import { CheckIcon, ChevronDownIcon, LockIcon } from '../components/icons';
import { cardClasses, difficultyBadgeClasses, plainTagClasses, primaryButtonClasses, secondaryButtonClasses } from '../lib/ui';

type TopicStatus = 'completed' | 'current' | 'locked';

interface MockTopic {
  id: string;
  title: string;
  difficulty: Difficulty;
  estimatedTime: string;
  category: string;
}

// Mock data — replace with the real /api/recommendations-backed path when
// this page is wired back up to the backend.
const GOAL = 'Frontend Developer';

const TOPICS: MockTopic[] = [
  { id: 't1', title: 'HTML & CSS Fundamentals', difficulty: 'beginner', estimatedTime: '3 hrs', category: 'Web Basics' },
  { id: 't2', title: 'JavaScript Essentials', difficulty: 'beginner', estimatedTime: '6 hrs', category: 'Programming' },
  { id: 't3', title: 'React Fundamentals', difficulty: 'intermediate', estimatedTime: '8 hrs', category: 'Frameworks' },
  { id: 't4', title: 'State Management with Context & Redux', difficulty: 'intermediate', estimatedTime: '5 hrs', category: 'Frameworks' },
  { id: 't5', title: 'TypeScript for React', difficulty: 'intermediate', estimatedTime: '4 hrs', category: 'Type Safety' },
  { id: 't6', title: 'Testing with Jest & React Testing Library', difficulty: 'advanced', estimatedTime: '5 hrs', category: 'Quality' },
  { id: 't7', title: 'Performance & Deployment', difficulty: 'advanced', estimatedTime: '4 hrs', category: 'Production' },
];

// First two topics start completed and the third is up next, purely so the
// mock path has something interesting to look at.
const INITIAL_COMPLETED_COUNT = 2;

function initialStatuses(): Record<string, TopicStatus> {
  const statuses: Record<string, TopicStatus> = {};
  TOPICS.forEach((topic, index) => {
    if (index < INITIAL_COMPLETED_COUNT) {
      statuses[topic.id] = 'completed';
    } else if (index === INITIAL_COMPLETED_COUNT) {
      statuses[topic.id] = 'current';
    } else {
      statuses[topic.id] = 'locked';
    }
  });
  return statuses;
}

// Fades + slides a card in the first time it scrolls into the viewport,
// rather than animating everything at once on mount.
function useRevealOnScroll<T extends HTMLElement>(): [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2, rootMargin: '0px 0px -40px 0px' },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return [ref, inView];
}

function TimelineCard({ topic, status, onStart }: { topic: MockTopic; status: TopicStatus; onStart: () => void }) {
  const [ref, inView] = useRevealOnScroll<HTMLDivElement>();

  const isCompleted = status === 'completed';
  const isCurrent = status === 'current';
  const isLocked = status === 'locked';

  return (
    <div
      ref={ref}
      className={`transition-all duration-500 ease-out ${inView ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'}`}
    >
      <div
        className={`${cardClasses} flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${
          isCompleted ? 'opacity-70' : ''
        } ${isLocked ? 'opacity-60' : ''} ${
          isCurrent ? 'animate-pulse-ring border-emerald-400/80 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_32px_-14px_rgba(41,37,36,0.24)]' : ''
        }`}
        style={isCurrent ? ({ '--pulse-ring-color': 'oklch(58% 0.155 152 / 0.18)' } as CSSProperties) : undefined}
      >
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className={`text-base font-semibold ${isCompleted ? 'text-stone-500 line-through decoration-stone-300' : 'text-stone-800'}`}>
              {topic.title}
            </h3>
            <span className={difficultyBadgeClasses(topic.difficulty)}>{topic.difficulty}</span>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-stone-500">
            <span className={plainTagClasses}>{topic.category}</span>
            <span className="flex items-center gap-1">⏱ {topic.estimatedTime}</span>
          </div>
        </div>

        <div className="shrink-0">
          {isCompleted && (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
              <CheckIcon className="h-4 w-4" /> Completed
            </span>
          )}
          {isCurrent && (
            <button type="button" onClick={onStart} className={`${primaryButtonClasses} w-full sm:w-auto`}>
              Start
            </button>
          )}
          {isLocked && (
            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-stone-400">
              <LockIcon className="h-4 w-4" /> Locked
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export function LearningPathPage() {
  const [statuses, setStatuses] = useState<Record<string, TopicStatus>>(initialStatuses);
  const [regenerating, setRegenerating] = useState(false);
  const [justCompletedTitle, setJustCompletedTitle] = useState<string | null>(null);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  const completedCount = TOPICS.filter((topic) => statuses[topic.id] === 'completed').length;
  const percent = Math.round((completedCount / TOPICS.length) * 100);

  function handleStart(index: number) {
    const topic = TOPICS[index];
    const next = TOPICS[index + 1];

    setStatuses((prev) => {
      const updated = { ...prev, [topic.id]: 'completed' as TopicStatus };
      if (next) updated[next.id] = 'current';
      return updated;
    });

    setJustCompletedTitle(topic.title);
    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    successTimeoutRef.current = setTimeout(() => setJustCompletedTitle(null), 3000);
  }

  function handleRegenerate() {
    setRegenerating(true);
    setTimeout(() => {
      setStatuses(initialStatuses());
      setRegenerating(false);
    }, 600);
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 text-left">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-stone-800">
            Your path to: <span className="text-gradient-brand">{GOAL}</span>
          </h1>
          <p className="mt-1 text-sm text-stone-500">
            {completedCount} of {TOPICS.length} topics completed
          </p>
        </div>
        <button type="button" onClick={handleRegenerate} disabled={regenerating} className={secondaryButtonClasses}>
          {regenerating ? 'Regenerating...' : 'Regenerate Path'}
        </button>
      </div>

      <div className={`${cardClasses} flex flex-col gap-2`}>
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-stone-600">Overall progress</span>
          <span className="font-display text-lg font-semibold text-emerald-700">{percent}%</span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-200 shadow-inner">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 shadow-[0_0_10px_rgba(5,150,105,0.5)] transition-[width] duration-500 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
      </div>

      {justCompletedTitle && (
        <p className="animate-scale-in rounded-xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50 to-teal-50 px-3.5 py-2.5 text-sm font-medium text-emerald-800 shadow-sm">
          ✓ "{justCompletedTitle}" marked complete!
        </p>
      )}

      <ol className="flex flex-col">
        {TOPICS.map((topic, index) => (
          <li key={topic.id} className="flex gap-4">
            <div className="flex flex-col items-center">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm transition-colors duration-300 ${
                  statuses[topic.id] === 'completed'
                    ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                    : statuses[topic.id] === 'current'
                      ? 'border-2 border-emerald-500 bg-white text-emerald-600'
                      : 'border border-stone-300 bg-stone-100 text-stone-400'
                }`}
              >
                {statuses[topic.id] === 'completed' ? <CheckIcon className="h-4 w-4" /> : index + 1}
              </span>
              {index < TOPICS.length - 1 && (
                <div className="relative my-1 min-h-16 w-0.5 flex-1 bg-stone-200">
                  <span className="absolute top-1/2 left-1/2 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-background text-stone-300">
                    <ChevronDownIcon className="h-4 w-4" />
                  </span>
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 pb-6">
              <TimelineCard topic={topic} status={statuses[topic.id]} onStart={() => handleStart(index)} />
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
