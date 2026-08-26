import { useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import type { Progress, RecommendedTopic } from '../lib/types';
import { TopicDetailPage } from './TopicDetailPage';
import './TopicsPage.css';
import './DashboardPage.css';

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
    <div className="dashboard-page">
      <h1>Dashboard</h1>

      {loading && <p className="topics-status">Loading your dashboard...</p>}
      {!loading && error && <p className="topics-status topics-error">{error}</p>}

      {!loading && !error && (
        <>
          <div className="dashboard-stats">
            <div className="dashboard-stat-card">
              <span className="dashboard-stat-value">{completedCount}</span>
              <span className="dashboard-stat-label">Topics Completed</span>
            </div>

            <div className="dashboard-stat-card dashboard-progress-card">
              <div className="dashboard-progress-bar">
                <div className="dashboard-progress-fill" style={{ width: `${percent}%` }} />
              </div>
              <span className="dashboard-stat-label">{percent}% of your learning path complete</span>
            </div>
          </div>

          <section className="dashboard-section">
            <h2>Next Up</h2>
            {nextTopic ? (
              <div className="topic-card dashboard-next-topic">
                <div className="topic-card-header">
                  <h3>{nextTopic.topic.title}</h3>
                  <span className={`difficulty-badge difficulty-${nextTopic.topic.difficulty}`}>
                    {nextTopic.topic.difficulty}
                  </span>
                </div>
                {nextTopic.topic.category && <p className="topic-category">{nextTopic.topic.category}</p>}
                {nextTopic.topic.description && <p className="topic-description">{nextTopic.topic.description}</p>}
                <button type="button" onClick={() => setSelectedTopicId(nextTopic.topic.id)}>
                  Start Learning
                </button>
              </div>
            ) : (
              <p className="topics-status">
                No recommendations yet — add some goals or interests to your profile to get a path.
              </p>
            )}
          </section>

          <button type="button" className="dashboard-chat-link" onClick={onNavigateToChat}>
            Chat with Scout again
          </button>
        </>
      )}
    </div>
  );
}
