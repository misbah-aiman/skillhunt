import { useEffect, useMemo, useState } from 'react';
import type { Difficulty, Topic } from '../lib/types';
import { TopicDetailPage } from './TopicDetailPage';
import './TopicsPage.css';

const ALL = 'all';
const DIFFICULTIES: Difficulty[] = ['beginner', 'intermediate', 'advanced'];

export function TopicsPage() {
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState(ALL);
  const [difficulty, setDifficulty] = useState(ALL);
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/topics');
      const json = await res.json();

      if (!json.ok) {
        setError(json.error ?? 'Failed to load topics.');
        setLoading(false);
        return;
      }

      setTopics(json.topics);
      setLoading(false);
    }

    load();
  }, []);

  const categories = useMemo(
    () => Array.from(new Set(topics.map((t) => t.category).filter((c): c is string => Boolean(c)))).sort(),
    [topics],
  );

  const filteredTopics = useMemo(() => {
    const term = query.trim().toLowerCase();

    return topics.filter((topic) => {
      const matchesQuery =
        !term ||
        topic.title.toLowerCase().includes(term) ||
        topic.tags.some((tag) => tag.toLowerCase().includes(term));
      const matchesCategory = category === ALL || topic.category === category;
      const matchesDifficulty = difficulty === ALL || topic.difficulty === difficulty;

      return matchesQuery && matchesCategory && matchesDifficulty;
    });
  }, [topics, query, category, difficulty]);

  if (selectedTopicId) {
    return <TopicDetailPage topicId={selectedTopicId} onBack={() => setSelectedTopicId(null)} />;
  }

  return (
    <div className="topics-page">
      <h1>Topics</h1>

      <div className="topics-filters">
        <input
          type="search"
          className="topics-search"
          placeholder="Search by title or tag..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={category} onChange={(e) => setCategory(e.target.value)} aria-label="Filter by category">
          <option value={ALL}>All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} aria-label="Filter by difficulty">
          <option value={ALL}>All levels</option>
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {d[0].toUpperCase() + d.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {loading && <p className="topics-status">Loading topics...</p>}
      {!loading && error && <p className="topics-status topics-error">{error}</p>}
      {!loading && !error && filteredTopics.length === 0 && (
        <p className="topics-status">No topics match your filters.</p>
      )}

      {!loading && !error && filteredTopics.length > 0 && (
        <div className="topics-grid">
          {filteredTopics.map((topic) => (
            <article
              className="topic-card"
              key={topic.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedTopicId(topic.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedTopicId(topic.id);
                }
              }}
            >
              <div className="topic-card-header">
                <h2>{topic.title}</h2>
                <span className={`difficulty-badge difficulty-${topic.difficulty}`}>{topic.difficulty}</span>
              </div>
              {topic.category && <p className="topic-category">{topic.category}</p>}
              {topic.description && <p className="topic-description">{topic.description}</p>}
              {topic.tags.length > 0 && (
                <div className="topic-tags">
                  {topic.tags.map((tag) => (
                    <span className="tag" key={tag}>
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
