import { useCallback, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { LearningPath, RecommendedTopic } from '../lib/types';
import { TopicDetailPage } from './TopicDetailPage';
import './TopicsPage.css';
import './LearningPathPage.css';

interface LearningPathPageProps {
  session: Session;
}

export function LearningPathPage({ session }: LearningPathPageProps) {
  const [recommendations, setRecommendations] = useState<RecommendedTopic[]>([]);
  const [learningPath, setLearningPath] = useState<LearningPath | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

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

  if (selectedTopicId) {
    return <TopicDetailPage topicId={selectedTopicId} onBack={() => setSelectedTopicId(null)} />;
  }

  return (
    <div className="learning-path-page">
      <div className="learning-path-header">
        <h1>Your Learning Path</h1>
        <button type="button" onClick={() => generate(true)} disabled={loading || regenerating}>
          {regenerating ? 'Regenerating...' : 'Regenerate Path'}
        </button>
      </div>

      {loading && <p className="topics-status">Generating your learning path...</p>}
      {!loading && error && <p className="topics-status topics-error">{error}</p>}
      {!loading && !error && recommendations.length === 0 && (
        <p className="topics-status">
          No recommendations yet — add some goals or interests to your profile to build a path.
        </p>
      )}

      {!loading && !error && recommendations.length > 0 && (
        <ol className="learning-path-list">
          {recommendations.map((entry, index) => (
            <li className="learning-path-card" key={entry.topic.id}>
              <div className="learning-path-order">{index + 1}</div>

              <div className="learning-path-card-body">
                <div className="topic-card-header">
                  <h2>{entry.topic.title}</h2>
                  <span className={`difficulty-badge difficulty-${entry.topic.difficulty}`}>
                    {entry.topic.difficulty}
                  </span>
                </div>

                {entry.topic.category && <p className="topic-category">{entry.topic.category}</p>}

                <p className="learning-path-reason">
                  {entry.matchedOn.length > 0
                    ? `Recommended because it matches: ${entry.matchedOn.join(', ')}`
                    : 'Recommended based on your profile'}
                </p>

                <p className="learning-path-resources">
                  {entry.resourceCount} {entry.resourceCount === 1 ? 'resource' : 'resources'} available
                </p>

                <button type="button" onClick={() => setSelectedTopicId(entry.topic.id)}>
                  Start Learning
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}

      {learningPath && !loading && (
        <p className="learning-path-updated">
          Last generated {new Date(learningPath.updatedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}
