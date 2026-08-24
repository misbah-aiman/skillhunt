import { useEffect, useState } from 'react';
import type { Resource, Topic } from '../lib/types';
import './TopicsPage.css';
import './TopicDetailPage.css';

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

      const res = await fetch(`/api/topics/${topicId}`);
      const json = await res.json();

      if (cancelled) return;

      if (!json.ok) {
        setError(json.error ?? 'Failed to load topic.');
        setLoading(false);
        return;
      }

      setTopic(json.topic);
      setResources(json.resources ?? []);
      setLoading(false);
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [topicId]);

  return (
    <div className="topic-detail">
      <button type="button" className="link-button" onClick={onBack}>
        ← Back to Topics
      </button>

      {loading && <p className="topics-status">Loading topic...</p>}
      {!loading && error && <p className="topics-status topics-error">{error}</p>}

      {!loading && !error && topic && (
        <>
          <div className="topic-detail-header">
            <h1>{topic.title}</h1>
            <span className={`difficulty-badge difficulty-${topic.difficulty}`}>{topic.difficulty}</span>
          </div>

          {topic.category && <p className="topic-category">{topic.category}</p>}
          {topic.description && <p className="topic-detail-description">{topic.description}</p>}

          {topic.tags.length > 0 && (
            <div className="topic-tags">
              {topic.tags.map((tag) => (
                <span className="tag" key={tag}>
                  {tag}
                </span>
              ))}
            </div>
          )}

          {topic.prerequisites.length > 0 && (
            <section>
              <h2>Prerequisites</h2>
              <ul className="topic-prerequisites">
                {topic.prerequisites.map((prereq) => (
                  <li key={prereq}>{prereq}</li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <h2>Resources</h2>
            {resources.length === 0 ? (
              <p className="topics-status">No resources yet.</p>
            ) : (
              <ul className="resource-list">
                {resources.map((resource) => (
                  <li className="resource-item" key={resource.id}>
                    <a href={resource.url} target="_blank" rel="noreferrer">
                      {resource.title}
                    </a>
                    <span className="resource-meta">
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
