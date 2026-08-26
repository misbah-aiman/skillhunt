import { useEffect, useState } from 'react';
import type { Resource, Topic } from '../lib/types';
import { Spinner } from '../components/Spinner';
import { difficultyBadgeClasses, emptyStateClasses, plainTagClasses, statusBlockClasses, statusErrorClasses } from '../lib/ui';

interface TopicDetailPageProps {
  topicId: string;
  onBack: () => void;
}

const RESOURCE_TYPE_LABEL: Record<Resource['type'], string> = {
  video: 'Video',
  article: 'Article',
  course: 'Course',
};

export function TopicDetailPage({ topicId, onBack }: TopicDetailPageProps) {
  const [topic, setTopic] = useState<Topic | null>(null);
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="mx-auto flex w-full max-w-2xl animate-fade-up flex-col gap-4 text-left">
      <button type="button" onClick={onBack} className="self-start text-sm font-medium text-emerald-700 hover:text-emerald-800">
        ← Back to Topics
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

          <section>
            <h2 className="mb-2 text-lg font-semibold text-stone-800">Resources</h2>
            {resources.length === 0 ? (
              <div className={emptyStateClasses}>
                <p>No resources yet for this topic.</p>
              </div>
            ) : (
              <ul className="flex flex-col gap-2">
                {resources.map((resource) => (
                  <li
                    key={resource.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-stone-200 px-3 py-2.5 transition-colors hover:border-emerald-300"
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
