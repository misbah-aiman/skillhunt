import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { Resource, Topic } from '../lib/types';
import { Spinner } from '../components/Spinner';
import { LessonContent } from '../components/LessonContent';
import {
  cardClasses,
  difficultyBadgeClasses,
  emptyStateClasses,
  plainTagClasses,
  primaryButtonClasses,
  statusBlockClasses,
  statusErrorClasses,
} from '../lib/ui';
import { CheckIcon } from '../components/icons';

interface TopicDetailPageProps {
  topicId: string;
  session: Session;
  onBack: () => void;
  // Called once the topic is successfully marked complete on the server.
  onComplete?: () => void;
}

const RESOURCE_TYPE_LABEL: Record<Resource['type'], string> = {
  video: 'Video',
  article: 'Article',
  course: 'Course',
};

export function TopicDetailPage({ topicId, session, onBack, onComplete }: TopicDetailPageProps) {
  const [topic, setTopic] = useState<Topic | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/topics/${topicId}`);
        const json = await res.json();

        if (cancelled) return;

        if (!json.ok) {
          setError(json.error ?? 'Failed to load topic.');
          return;
        }

        setTopic(json.topic);
        setResources(json.resources ?? []);
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
  }, [topicId]);

  useEffect(() => {
    setCompleted(false);
    setCompleteError(null);
  }, [topicId]);

  async function handleComplete() {
    setCompleting(true);
    setCompleteError(null);

    try {
      const res = await fetch(`/api/progress/complete/${topicId}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const json = await res.json();

      if (!json.ok) {
        setCompleteError(json.error ?? 'Failed to mark topic complete.');
        return;
      }

      setCompleted(true);
      onComplete?.();
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      setCompleteError(`Failed to reach the server: ${detail}`);
    } finally {
      setCompleting(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl animate-fade-up flex-col gap-4 text-left">
      <button
        type="button"
        onClick={onBack}
        className="group inline-flex w-fit items-center gap-1 self-start text-sm font-medium text-emerald-700 transition-colors hover:text-emerald-800"
      >
        <span className="transition-transform duration-200 group-hover:-translate-x-0.5">←</span> Back
      </button>

      {loading && (
        <div className={statusBlockClasses}>
          <Spinner label="Loading topic..." />
        </div>
      )}
      {!loading && error && <p className={statusErrorClasses}>{error}</p>}

      {!loading && !error && topic && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold text-stone-800">{topic.title}</h1>
            <span className={difficultyBadgeClasses(topic.difficulty)}>{topic.difficulty}</span>
          </div>

          {topic.category && <p className="text-sm text-stone-500">{topic.category}</p>}
          {topic.description && <p className="text-stone-700">{topic.description}</p>}

          {topic.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {topic.tags.map((tag) => (
                <span key={tag} className={plainTagClasses}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {topic.prerequisites.length > 0 && (
            <section>
              <h2 className="mb-2 text-lg font-semibold text-stone-800">Prerequisites</h2>
              <ul className="list-disc pl-5 text-stone-600">
                {topic.prerequisites.map((prereq) => (
                  <li key={prereq}>{prereq}</li>
                ))}
              </ul>
            </section>
          )}

          <LessonContent topicId={topic.id} />

          <div className={`${cardClasses} flex flex-wrap items-center justify-between gap-3`}>
            {completed ? (
              <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                <CheckIcon className="h-4 w-4" /> Marked complete!
              </span>
            ) : (
              <>
                <p className="text-sm text-stone-600">Done with this topic?</p>
                <button type="button" onClick={handleComplete} disabled={completing} className={primaryButtonClasses}>
                  {completing ? 'Marking complete...' : 'Mark as Complete'}
                </button>
              </>
            )}
            {completeError && <p className="w-full text-sm text-rose-600">{completeError}</p>}
          </div>

          <section>
            <h2 className="mb-2 text-lg font-semibold text-stone-800">Further Resources</h2>
            {resources.length === 0 ? (
              <div className={emptyStateClasses}>
                <p>No external resources yet for this topic.</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {resources.map((resource) => (
                  <li
                    key={resource.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-stone-200 bg-white px-3.5 py-2.5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
                  >
                    <a href={resource.url} target="_blank" rel="noreferrer" className="font-medium text-emerald-700 hover:text-emerald-800">
                      {resource.title}
                    </a>
                    <span className="whitespace-nowrap text-sm text-stone-500">
                      {RESOURCE_TYPE_LABEL[resource.type]}
                      {resource.provider ? ` · ${resource.provider}` : ''}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}
    </div>
  );
}
