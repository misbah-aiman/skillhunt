import { useEffect, useState } from 'react';
import type { Lesson, QuizQuestion } from '../lib/types';
import { Spinner } from './Spinner';
import { cardClasses, secondaryButtonClasses, statusErrorClasses } from '../lib/ui';

interface LessonContentProps {
  topicId: string;
}

interface QuizItemProps {
  index: number;
  question: QuizQuestion;
  selected: number | null;
  onSelect: (index: number, optionIndex: number) => void;
}

function QuizItem({ index, question, selected, onSelect }: QuizItemProps) {
  const answered = selected !== null;

  return (
    <div className={`${cardClasses} flex flex-col gap-3`}>
      <p className="font-medium text-stone-800">
        {index + 1}. {question.question}
      </p>
      <div className="flex flex-col gap-2">
        {question.options.map((option, optionIndex) => {
          const isCorrect = optionIndex === question.correctIndex;
          const isSelected = optionIndex === selected;

          let stateClasses = 'border-stone-200 bg-white hover:border-emerald-300 hover:bg-emerald-50/40';
          if (answered && isCorrect) {
            stateClasses = 'border-emerald-400 bg-emerald-50 text-emerald-800';
          } else if (answered && isSelected && !isCorrect) {
            stateClasses = 'border-rose-300 bg-rose-50 text-rose-700';
          } else if (answered) {
            stateClasses = 'border-stone-200 bg-white text-stone-400';
          }

          return (
            <button
              key={optionIndex}
              type="button"
              disabled={answered}
              onClick={() => onSelect(index, optionIndex)}
              className={`flex min-h-11 items-center gap-2 rounded-xl border px-3.5 py-2 text-left text-sm shadow-sm transition-all duration-200 disabled:cursor-default ${stateClasses}`}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-xs">
                {answered && isCorrect ? '✓' : answered && isSelected ? '✕' : String.fromCharCode(65 + optionIndex)}
              </span>
              {option}
            </button>
          );
        })}
      </div>
      {answered && <p className="animate-scale-in text-sm text-stone-600">{question.explanation}</p>}
    </div>
  );
}

export function LessonContent({ topicId }: LessonContentProps) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/topics/${topicId}?lesson=1`);
        const json = await res.json();

        if (cancelled) return;

        if (!json.ok) {
          setError(json.error ?? 'Failed to load lesson.');
          return;
        }

        setLesson(json.lesson);
        setAnswers(new Array(json.lesson?.quiz?.length ?? 0).fill(null));
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
  }, [topicId, attempt]);

  function handleSelect(questionIndex: number, optionIndex: number) {
    setAnswers((prev) => {
      const next = [...prev];
      next[questionIndex] = optionIndex;
      return next;
    });
  }

  if (loading) {
    return (
      <section className="flex flex-col items-center gap-2 py-10 text-center text-stone-500">
        <Spinner label="Generating your lesson..." />
        <p className="text-xs text-stone-400">This can take a few seconds the first time.</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex flex-col items-center gap-3 py-10">
        <p className={statusErrorClasses}>{error}</p>
        <button type="button" className={secondaryButtonClasses} onClick={() => setAttempt((a) => a + 1)}>
          Retry
        </button>
      </section>
    );
  }

  if (!lesson) return null;

  const score = answers.filter((answer, index) => answer === lesson.quiz[index]?.correctIndex).length;
  const answeredCount = answers.filter((answer) => answer !== null).length;

  return (
    <section className="animate-fade-up flex flex-col gap-8">
      <div className={`${cardClasses} border-emerald-200/80 bg-gradient-to-br from-emerald-50/60 to-teal-50/30`}>
        <h2 className="mb-2 flex items-center gap-2 font-display text-lg text-stone-800">
          <span className="text-xl">🎓</span> Lesson
        </h2>
        <p className="text-stone-700">{lesson.summary}</p>
      </div>

      <div>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-stone-800">
          <span className="text-xl">🧩</span> Key Concepts
        </h2>
        <div className="flex flex-col gap-3">
          {lesson.keyConcepts.map((concept, index) => (
            <div key={index} className={cardClasses}>
              <h3 className="mb-1 font-semibold text-stone-800">{concept.title}</h3>
              <p className="text-sm text-stone-600">{concept.explanation}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-stone-800">
          <span className="text-xl">💡</span> Examples
        </h2>
        <div className="flex flex-col gap-3">
          {lesson.examples.map((example, index) => (
            <div key={index} className={cardClasses}>
              <h3 className="mb-1 font-semibold text-stone-800">{example.title}</h3>
              <p className="mb-2 text-sm text-stone-600">{example.explanation}</p>
              {example.code && (
                <pre className="overflow-x-auto rounded-xl bg-stone-900 px-4 py-3 text-xs text-stone-100 shadow-inner">
                  <code>{example.code}</code>
                </pre>
              )}
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-stone-800">
            <span className="text-xl">📝</span> Practice Quiz
          </h2>
          {answeredCount > 0 && (
            <span className="animate-scale-in rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-inset ring-emerald-600/15">
              {score}/{lesson.quiz.length} correct
            </span>
          )}
        </div>
        <div className="flex flex-col gap-3">
          {lesson.quiz.map((question, index) => (
            <QuizItem key={index} index={index} question={question} selected={answers[index] ?? null} onSelect={handleSelect} />
          ))}
        </div>
      </div>
    </section>
  );
}
