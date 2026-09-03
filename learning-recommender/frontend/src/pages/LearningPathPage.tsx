import { useEffect, useRef, useState, type CSSProperties, type RefObject } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { Difficulty, Progress, RecommendedTopic, Topic } from '../lib/types';
import { CheckIcon, ChevronDownIcon, LockIcon } from '../components/icons';
import { Spinner } from '../components/Spinner';
import { TopicDetailPage } from './TopicDetailPage';
import {
  cardClasses,
  difficultyBadgeClasses,
  emptyStateClasses,
  plainTagClasses,
  primaryButtonClasses,
  secondaryButtonClasses,
  statusBlockClasses,
  statusErrorClasses,
} from '../lib/ui';

type TopicStatus = 'completed' | 'current' | 'locked';

interface PathItem {
  id: string;
  title: string;
  difficulty: Difficulty;
  category: string | null;
  status: TopicStatus;
}

interface LearningPathPageProps {
  session: Session;
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

function TimelineCard({ item, onStart }: { item: PathItem; onStart: () => void }) {
  const [ref, inView] = useRevealOnScroll<HTMLDivElement>();

  const isCompleted = item.status === 'completed';
  const isCurrent = item.status === 'current';
  const isLocked = item.status === 'locked';

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
              {item.title}
            </h3>
            <span className={difficultyBadgeClasses(item.difficulty)}>{item.difficulty}</span>
          </div>
          {item.category && (
            <div className="flex flex-wrap items-center gap-2 text-sm text-stone-500">
              <span className={plainTagClasses}>{item.category}</span>
            </div>
          )}
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

export function LearningPathPage({ session }: LearningPathPageProps) {
  const [progress, setProgress] = useState<Progress[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedTopic[]>([]);
  const [topicsById, setTopicsById] = useState<Record<string, Topic>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [justCompletedTitle, setJustCompletedTitle] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const headers = { Authorization: `Bearer ${session.access_token}` };

      try {
        const [progressRes, recommendationsRes, topicsRes] = await Promise.all([
          fetch('/api/progress', { headers }),
          fetch('/api/recommendations', { headers }),
          fetch('/api/topics'),
        ]);
        const progressJson = await progressRes.json();
        const recommendationsJson = await recommendationsRes.json();
        const topicsJson = await topicsRes.json();

        if (cancelled) return;

        if (!progressJson.ok) {
          setError(progressJson.error ?? 'Failed to load your progress.');
          return;
        }

        if (!recommendationsJson.ok) {
          setError(recommendationsJson.error ?? 'Failed to load your recommendations.');
          return;
        }

        setProgress(progressJson.progress ?? []);
        setRecommendations(recommendationsJson.recommendations ?? []);

        if (topicsJson.ok) {
          const byId: Record<string, Topic> = {};
          for (const topic of (topicsJson.topics ?? []) as Topic[]) {
            byId[topic.id] = topic;
          }
          setTopicsById(byId);
        }
      } catch (err) {
        if (cancelled) return;
        const detail = err instanceof Error ? err.message : String(err);
        setError(`Failed to reach the server: ${detail}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [session.access_token, reloadKey]);

  const completedTopics = progress
    .filter((entry) => entry.status === 'completed')
    .sort((a, b) => (a.completedAt ?? '').localeCompare(b.completedAt ?? ''))
    .map((entry) => topicsById[entry.topicId])
    .filter((topic): topic is Topic => Boolean(topic));

  const items: PathItem[] = [
    ...completedTopics.map((topic) => ({
      id: topic.id,
      title: topic.title,
      difficulty: topic.difficulty,
      category: topic.category,
      status: 'completed' as TopicStatus,
    })),
    ...recommendations.map((entry, index) => ({
      id: entry.topic.id,
      title: entry.topic.title,
      difficulty: entry.topic.difficulty,
      category: entry.topic.category,
      status: (index === 0 ? 'current' : 'locked') as TopicStatus,
    })),
  ];

  const completedCount = completedTopics.length;
  const percent = items.length > 0 ? Math.round((completedCount / items.length) * 100) : 0;

  function handleTopicCompleted(title: string) {
    setSelectedTopicId(null);
    setReloadKey((key) => key + 1);
    setJustCompletedTitle(title);
    if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    successTimeoutRef.current = setTimeout(() => setJustCompletedTitle(null), 3000);
  }

  async function handleRegenerate() {
    setRegenerating(true);
    try {
      await fetch('/api/recommendations/generate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}`, 'Content-Type': 'application/json' },
      });
      setReloadKey((key) => key + 1);
    } finally {
      setRegenerating(false);
    }
  }

  if (selectedTopicId) {
    const title = items.find((item) => item.id === selectedTopicId)?.title ?? '';
    return (
      <TopicDetailPage
        topicId={selectedTopicId}
        session={session}
        onBack={() => setSelectedTopicId(null)}
        onComplete={() => handleTopicCompleted(title)}
      />
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 text-left">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-stone-800">Your Learning Path</h1>
          <p className="mt-1 text-sm text-stone-500">
            {completedCount} of {items.length} topics completed
          </p>
        </div>
        <button type="button" onClick={handleRegenerate} disabled={regenerating} className={secondaryButtonClasses}>
          {regenerating ? 'Regenerating...' : 'Regenerate Path'}
        </button>
      </div>

      {loading && (
        <div className={statusBlockClasses}>
          <Spinner label="Loading your path..." />
        </div>
      )}
      {!loading && error && <p className={statusErrorClasses}>{error}</p>}

      {!loading && !error && (
        <>
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

          {items.length === 0 ? (
            <div className={emptyStateClasses}>
              <p>No learning path yet — chat with Nova to get personalized recommendations.</p>
            </div>
          ) : (
            <ol className="flex flex-col">
              {items.map((item, index) => (
                <li key={item.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold shadow-sm transition-colors duration-300 ${
                        item.status === 'completed'
                          ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                          : item.status === 'current'
                            ? 'border-2 border-emerald-500 bg-white text-emerald-600'
                            : 'border border-stone-300 bg-stone-100 text-stone-400'
                      }`}
                    >
                      {item.status === 'completed' ? <CheckIcon className="h-4 w-4" /> : index + 1}
                    </span>
                    {index < items.length - 1 && (
                      <div className="relative my-1 min-h-16 w-0.5 flex-1 bg-stone-200">
                        <span className="absolute top-1/2 left-1/2 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-background text-stone-300">
                          <ChevronDownIcon className="h-4 w-4" />
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 pb-6">
                    <TimelineCard item={item} onStart={() => setSelectedTopicId(item.id)} />
                  </div>
                </li>
              ))}
            </ol>
          )}
        </>
      )}
    </div>
  );
}
