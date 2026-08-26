import { useEffect, useMemo, useState } from 'react';
import type { Difficulty, Topic } from '../lib/types';
import { Spinner } from '../components/Spinner';
import { TopicDetailPage } from './TopicDetailPage';
import { difficultyBadgeClasses, emptyStateClasses, inputClasses, plainTagClasses, statusBlockClasses, statusErrorClasses } from '../lib/ui';

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

      try {
        const res = await fetch('/api/topics');
        const json = await res.json();

        if (!json.ok) {
          setError(json.error ?? 'Failed to load topics.');
          return;
        }

        setTopics(json.topics);
      } catch (err) {
        const detail = err instanceof Error ? err.message : String(err);
        setError(`Failed to reach the server: ${detail}`);
      } finally {
        setLoading(false);
      }
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
    <div className="mx-auto w-full max-w-4xl text-left">
      <h1 className="mb-4 text-2xl font-semibold text-stone-800">Topics</h1>

      <div className="mb-6 flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search by title or tag..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className={`${inputClasses} min-w-52 flex-1`}
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filter by category"
          className={inputClasses}
        >
          <option value={ALL}>All categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={difficulty}
          onChange={(e) => setDifficulty(e.target.value)}
          aria-label="Filter by difficulty"
          className={inputClasses}
        >
          <option value={ALL}>All levels</option>
          {DIFFICULTIES.map((d) => (
            <option key={d} value={d}>
              {d[0].toUpperCase() + d.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {loading && (
        <div className={statusBlockClasses}>
          <Spinner label="Loading topics..." />
        </div>
      )}
      {!loading && error && <p className={statusErrorClasses}>{error}</p>}
      {!loading && !error && filteredTopics.length === 0 && (
        <div className={emptyStateClasses}>
          <p>No topics found matching your filters.</p>
        </div>
      )}

      {!loading && !error && filteredTopics.length > 0 && (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
          {filteredTopics.map((topic, index) => (
            <article
              key={topic.id}
              role="button"
              tabIndex={0}
              style={{ animationDelay: `${Math.min(index, 12) * 0.04}s` }}
              onClick={() => setSelectedTopicId(topic.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelectedTopicId(topic.id);
                }
              }}
              className="animate-fade-up flex cursor-pointer flex-col gap-2 rounded-xl border border-stone-200 bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
            >
              <div className="flex items-center justify-between gap-2">
                <h2 className="text-base font-semibold text-stone-800">{topic.title}</h2>
                <span className={difficultyBadgeClasses(topic.difficulty)}>{topic.difficulty}</span>
              </div>
              {topic.category && <p className="text-sm text-stone-500">{topic.category}</p>}
              {topic.description && <p className="flex-grow text-sm text-stone-600">{topic.description}</p>}
              {topic.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {topic.tags.map((tag) => (
                    <span key={tag} className={plainTagClasses}>
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
