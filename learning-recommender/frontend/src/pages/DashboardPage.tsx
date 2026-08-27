import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { Progress, RecommendedTopic } from '../lib/types';
import { Spinner } from '../components/Spinner';
import { TopicDetailPage } from './TopicDetailPage';
import {
  cardClasses,
  difficultyBadgeClasses,
  emptyStateClasses,
  primaryButtonClasses,
  secondaryButtonClasses,
  statusBlockClasses,
  statusErrorClasses,
} from '../lib/ui';

interface DashboardPageProps {
  session: Session;
  onNavigateToChat: () => void;
}

export function DashboardPage({ session, onNavigateToChat }: DashboardPageProps) {
  const [progress, setProgress] = useState<Progress[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendedTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const headers = { Authorization: `Bearer ${session.access_token}` };
        const [progressRes, recommendationsRes] = await Promise.all([
          fetch('/api/progress', { headers }),
          fetch('/api/recommendations', { headers }),
        ]);
        const progressJson = await progressRes.json();
        const recommendationsJson = await recommendationsRes.json();

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
  }, [session.access_token]);

  if (selectedTopicId) {
    return <TopicDetailPage topicId={selectedTopicId} onBack={() => setSelectedTopicId(null)} />;
  }

  const completedCount = progress.filter((p) => p.status === 'completed').length;
  const remainingCount = recommendations.length;
  const total = completedCount + remainingCount;
  const percent = total > 0 ? Math.round((completedCount / total) * 100) : 0;
  const nextTopic = recommendations[0] ?? null;

  return (
    <div className="mx-auto w-full max-w-3xl text-left">
      <h1 className="mb-6 text-2xl font-semibold text-stone-800">Dashboard</h1>

      {loading && (
        <div className={statusBlockClasses}>
          <Spinner label="Loading your dashboard..." />
        </div>
      )}
      {!loading && error && <p className={statusErrorClasses}>{error}</p>}

      {!loading && !error && (
        <>
          <div className="mb-8 grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
            <div className={`${cardClasses} animate-fade-up flex flex-col gap-2 hover:-translate-y-0.5 hover:shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_32px_-14px_rgba(41,37,36,0.24)]`}>
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-100 text-lg">✅</span>
              <span className="font-display text-4xl font-bold text-stone-800">{completedCount}</span>
              <span className="text-sm text-stone-500">Topics Completed</span>
            </div>

            <div
              className={`${cardClasses} animate-fade-up flex flex-col justify-center gap-2 hover:-translate-y-0.5 hover:shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_32px_-14px_rgba(41,37,36,0.24)]`}
              style={{ animationDelay: '0.05s' }}
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-stone-600">Path progress</span>
                <span className="font-display text-lg font-semibold text-emerald-700">{percent}%</span>
              </div>
              <div className="h-2.5 w-full overflow-hidden rounded-full bg-stone-200 shadow-inner">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 shadow-[0_0_10px_rgba(5,150,105,0.5)] transition-[width] duration-500 ease-out"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="text-sm text-stone-500">{percent}% of your learning path complete</span>
            </div>
          </div>

          <section className="animate-fade-up mb-8" style={{ animationDelay: '0.1s' }}>
            <h2 className="mb-3 text-lg font-semibold text-stone-800">Next Up</h2>
            {nextTopic ? (
              <div
                className={`${cardClasses} flex flex-col gap-2 border-emerald-200/80 bg-gradient-to-br from-white to-emerald-50/40 hover:-translate-y-0.5 hover:shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_32px_-14px_rgba(41,37,36,0.24)]`}
              >
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base font-semibold text-stone-800">{nextTopic.topic.title}</h3>
                  <span className={difficultyBadgeClasses(nextTopic.topic.difficulty)}>{nextTopic.topic.difficulty}</span>
                </div>
                {nextTopic.topic.category && <p className="text-sm text-stone-500">{nextTopic.topic.category}</p>}
                {nextTopic.topic.description && <p className="text-sm text-stone-600">{nextTopic.topic.description}</p>}
                <button
                  type="button"
                  onClick={() => setSelectedTopicId(nextTopic.topic.id)}
                  className={`${primaryButtonClasses} mt-1 self-start`}
                >
                  Start Learning
                </button>
              </div>
            ) : (
              <div className={emptyStateClasses}>
                <p>No recommendations yet — start a chat to get recommendations.</p>
                <button type="button" onClick={onNavigateToChat} className={primaryButtonClasses}>
                  Chat with Nova
                </button>
              </div>
            )}
          </section>

          <button type="button" className={`${secondaryButtonClasses} w-full`} onClick={onNavigateToChat}>
            Chat with Nova again
          </button>
        </>
      )}
    </div>
  );
}
