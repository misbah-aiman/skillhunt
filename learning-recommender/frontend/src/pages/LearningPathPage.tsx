import { useCallback, useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { LearningPath, RecommendedTopic } from '../lib/types';
import { Spinner } from '../components/Spinner';
import { TopicDetailPage } from './TopicDetailPage';
import {
  difficultyBadgeClasses,
  emptyStateClasses,
  primaryButtonClasses,
  secondaryButtonClasses,
  statusBlockClasses,
  statusErrorClasses,
} from '../lib/ui';

interface LearningPathPageProps {
  session: Session;
  onNavigateToChat: () => void;
}

export function LearningPathPage({ session, onNavigateToChat }: LearningPathPageProps) {
  const [recommendations, setRecommendations] = useState<RecommendedTopic[]>([]);
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [completingId, setCompletingId] = useState<string | null>(null);
  const [justCompletedTitle, setJustCompletedTitle] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const successTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
    };
  }, []);

  const generate = useCallback(
    async (isRegenerate: boolean) => {
      if (isRegenerate) {
        setRegenerating(true);
      } else {
        setLoading(true);
      }
      setError(null);

      try {
        const res = await fetch('/api/recommendations/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({}),
        });
        const json = await res.json();

        if (!json.ok) {
          setError(json.error ?? 'Failed to generate your learning path.');
          return;
        }

        setRecommendations(json.recommendations ?? []);
        setLearningPath(json.learningPath ?? null);
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        setError(`Failed to reach the server: ${detail}`);
      } finally {
        if (isRegenerate) {
          setRegenerating(false);
        } else {
          setLoading(false);
        }
      }
    },
    [session.access_token],
  );

  useEffect(() => {
    generate(false);
  }, [generate]);

  async function handleComplete(topicId: string, title: string) {
    setCompletingId(topicId);
    setError(null);

    try {
      const res = await fetch(`/api/progress/complete/${topicId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();

      if (!json.ok) {
        setError(json.error ?? 'Failed to mark topic complete.');
        return;
      }

      // The backend refreshes recommendations to exclude the completed topic,
      // so applying its response is what makes the card disappear from the path.
      setRecommendations(json.recommendations ?? []);
      setLearningPath(json.learningPath ?? null);

      setJustCompletedTitle(title);
      if (successTimeoutRef.current) clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = setTimeout(() => setJustCompletedTitle(null), 3000);
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      setError(`Failed to reach the server: ${detail}`);
    } finally {
      setCompletingId(null);
    }
  }

  if (selectedTopicId) {
    return <TopicDetailPage topicId={selectedTopicId} onBack={() => setSelectedTopicId(null)} />;
  }

  return (
    <div className="mx-auto w-full max-w-3xl text-left">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-stone-800">Your Learning Path</h1>
        <button type="button" onClick={() => generate(true)} disabled={loading || regenerating} className={secondaryButtonClasses}>
          {regenerating ? 'Regenerating...' : 'Regenerate Path'}
        </button>
      </div>

      {justCompletedTitle && (
        <p className="animate-scale-in mb-4 rounded-xl border border-emerald-200/80 bg-gradient-to-r from-emerald-50 to-teal-50 px-3.5 py-2.5 text-sm font-medium text-emerald-800 shadow-sm">
          ✓ "{justCompletedTitle}" marked complete!
        </p>
      )}

      {loading && (
        <div className={statusBlockClasses}>
          <Spinner label="Generating your learning path..." />
        </div>
      )}
      {!loading && error && <p className={statusErrorClasses}>{error}</p>}
      {!loading && !error && recommendations.length === 0 && (
        <div className={emptyStateClasses}>
          <p>No recommendations yet — start a chat to get recommendations.</p>
          <button type="button" onClick={onNavigateToChat} className={primaryButtonClasses}>
            Chat with Nova
          </button>
        </div>
      )}

      {!loading && !error && recommendations.length > 0 && (
        <ol className="flex flex-col gap-4">
          {recommendations.map((entry, index) => (
            <li
              key={entry.topic.id}
              style={{ animationDelay: `${Math.min(index, 12) * 0.05}s` }}
              className="animate-fade-up group flex flex-col gap-3 rounded-2xl border border-stone-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(0,0,0,0.03),0_10px_28px_-14px_rgba(41,37,36,0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-200 hover:shadow-[0_1px_2px_rgba(0,0,0,0.04),0_16px_32px_-14px_rgba(41,37,36,0.24)] sm:flex-row"
            >
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-sm font-bold text-white shadow-[0_4px_10px_-3px_rgba(5,150,105,0.5)] transition-transform duration-300 group-hover:scale-110">
                {index + 1}
              </div>

              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="text-base font-semibold text-stone-800">{entry.topic.title}</h2>
                  <span className={difficultyBadgeClasses(entry.topic.difficulty)}>{entry.topic.difficulty}</span>
                </div>

                {entry.topic.category && <p className="text-sm text-stone-500">{entry.topic.category}</p>}

                <p className="text-sm text-stone-600">
                  {entry.matchedOn.length > 0
                    ? `Recommended because it matches: ${entry.matchedOn.join(', ')}`
                    : 'Recommended based on your profile'}
                </p>

                <p className="text-sm text-stone-500">
                  {entry.resourceCount} {entry.resourceCount === 1 ? 'resource' : 'resources'} available
                </p>

                <div className="mt-1 flex flex-wrap gap-2">
                  <button type="button" onClick={() => setSelectedTopicId(entry.topic.id)} className={primaryButtonClasses}>
                    Start Learning
                  </button>
                  <button
                    type="button"
                    onClick={() => handleComplete(entry.topic.id, entry.topic.title)}
                    disabled={completingId === entry.topic.id}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-emerald-300 bg-white px-4 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-50 hover:shadow-md active:translate-y-0 active:scale-[0.97] disabled:pointer-events-none disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:shadow-none"
                  >
                    {completingId === entry.topic.id ? '✓ Marking...' : '✓ Mark as Complete'}
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ol>
      )}

      {learningPath && !loading && (
        <p className="mt-6 text-center text-sm text-stone-500">
          Last generated {new Date(learningPath.updatedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}
