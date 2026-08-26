import { useCallback, useEffect, useRef, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { LearningPath, RecommendedTopic } from '../lib/types';
import { Spinner } from '../components/Spinner';
import { TopicDetailPage } from './TopicDetailPage';
import './TopicsPage.css';
import './LearningPathPage.css';

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
    <div className="learning-path-page">
      <div className="learning-path-header">
        <h1>Your Learning Path</h1>
        <button type="button" onClick={() => generate(true)} disabled={loading || regenerating}>
          {regenerating ? 'Regenerating...' : 'Regenerate Path'}
        </button>
      </div>

      {justCompletedTitle && (
        <p className="learning-path-success">✓ "{justCompletedTitle}" marked complete!</p>
      )}

      {loading && (
        <div className="status-block">
          <Spinner label="Generating your learning path..." />
        </div>
      )}
      {!loading && error && <p className="status-block status-error">{error}</p>}
      {!loading && !error && recommendations.length === 0 && (
        <div className="empty-state">
          <p>No recommendations yet — start a chat to get recommendations.</p>
          <button type="button" onClick={onNavigateToChat}>
            Chat with Scout
          </button>
        </div>
      )}

      {!loading && !error && recommendations.length > 0 && (
        <ol className="learning-path-list">
          {recommendations.map((entry, index) => (
            <li
              className="learning-path-card"
              key={entry.topic.id}
              style={{ animationDelay: `${Math.min(index, 12) * 0.05}s` }}
            >
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

                <div className="learning-path-actions">
                  <button type="button" onClick={() => setSelectedTopicId(entry.topic.id)}>
                    Start Learning
                  </button>
                  <button
                    type="button"
                    className="mark-complete-button"
                    onClick={() => handleComplete(entry.topic.id, entry.topic.title)}
                    disabled={completingId === entry.topic.id}
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
        <p className="learning-path-updated">
          Last generated {new Date(learningPath.updatedAt).toLocaleString()}
        </p>
      )}
    </div>
  );
}
