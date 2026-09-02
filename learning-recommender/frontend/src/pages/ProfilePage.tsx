import { useState, type FormEvent } from 'react';
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import { cardClasses, inputClasses, plainTagClasses, primaryButtonClasses, secondaryButtonClasses } from '../lib/ui';

type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced';

// Mastery badges: unlike topic difficulty (where "advanced" means harder,
// i.e. more caution/red), a skill level badge should read as progress —
// green for mastery, not a warning.
const SKILL_LEVEL_CLASSES: Record<SkillLevel, string> = {
  Beginner: 'bg-stone-100 text-stone-600 ring-1 ring-inset ring-stone-500/15',
  Intermediate: 'bg-amber-100 text-amber-800 ring-1 ring-inset ring-amber-600/15',
  Advanced: 'bg-emerald-100 text-emerald-700 ring-1 ring-inset ring-emerald-600/15',
};

function skillLevelBadgeClasses(level: SkillLevel): string {
  return `inline-flex shrink-0 items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${SKILL_LEVEL_CLASSES[level]}`;
}

interface ProfileSkill {
  name: string;
  level: SkillLevel;
}

interface Goal {
  id: string;
  text: string;
  completed: boolean;
}

interface RadarPoint {
  subject: string;
  current: number;
  target: number;
}

interface ProfilePageProps {
  onNavigateToChat: () => void;
}

// Mock data — replace with the real profile/session-backed values when
// this page is wired back up to /api/profile.
const INITIAL_NAME = 'Amara Okafor';
const INITIAL_BIO =
  "Front-end leaning full-stack developer. I like building things that feel fast and learning just enough backend to be dangerous.";

const INITIAL_SKILLS: ProfileSkill[] = [
  { name: 'JavaScript', level: 'Advanced' },
  { name: 'React', level: 'Advanced' },
  { name: 'CSS', level: 'Intermediate' },
  { name: 'Node.js', level: 'Intermediate' },
  { name: 'SQL', level: 'Beginner' },
  { name: 'System Design', level: 'Beginner' },
];

const INITIAL_INTERESTS = ['Web Performance', 'Developer Tools', 'AI Products', 'Design Systems'];

const INITIAL_GOALS: Goal[] = [
  { id: 'g1', text: 'Land a Full-Stack Developer role', completed: false },
  { id: 'g2', text: 'Get comfortable with backend architecture', completed: false },
  { id: 'g3', text: 'Ship a side project end-to-end', completed: true },
];

const RADAR_DATA: RadarPoint[] = [
  { subject: 'JavaScript', current: 85, target: 90 },
  { subject: 'React', current: 80, target: 85 },
  { subject: 'CSS', current: 65, target: 75 },
  { subject: 'Node.js', current: 55, target: 80 },
  { subject: 'SQL', current: 30, target: 70 },
  { subject: 'System Design', current: 25, target: 65 },
];

const LEVEL_ORDER: SkillLevel[] = ['Beginner', 'Intermediate', 'Advanced'];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
  return `${first}${last}`.toUpperCase();
}

export function ProfilePage({ onNavigateToChat }: ProfilePageProps) {
  const [name, setName] = useState(INITIAL_NAME);
  const [bio, setBio] = useState(INITIAL_BIO);
  const [isEditingHeader, setIsEditingHeader] = useState(false);
  const [draftName, setDraftName] = useState(name);
  const [draftBio, setDraftBio] = useState(bio);

  const [skills, setSkills] = useState<ProfileSkill[]>(INITIAL_SKILLS);
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<SkillLevel>('Beginner');

  const [interests] = useState<string[]>(INITIAL_INTERESTS);
  const [goals, setGoals] = useState<Goal[]>(INITIAL_GOALS);

  const targetGoal = goals.find((goal) => !goal.completed)?.text ?? goals[0]?.text ?? 'your next goal';

  function startEditingHeader() {
    setDraftName(name);
    setDraftBio(bio);
    setIsEditingHeader(true);
  }

  function saveHeader(e: FormEvent) {
    e.preventDefault();
    setName(draftName.trim() || name);
    setBio(draftBio.trim());
    setIsEditingHeader(false);
  }

  function removeSkill(index: number) {
    setSkills((prev) => prev.filter((_, i) => i !== index));
  }

  function addSkill(e: FormEvent) {
    e.preventDefault();
    const trimmed = newSkillName.trim();
    if (!trimmed) return;
    setSkills((prev) => [...prev, { name: trimmed, level: newSkillLevel }]);
    setNewSkillName('');
    setNewSkillLevel('Beginner');
    setIsAddingSkill(false);
  }

  function toggleGoal(id: string) {
    setGoals((prev) => prev.map((goal) => (goal.id === id ? { ...goal, completed: !goal.completed } : goal)));
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 text-left">
      {/* Header */}
      <div className={`${cardClasses} animate-fade-up`}>
        {isEditingHeader ? (
          <form className="flex flex-col gap-3" onSubmit={saveHeader}>
            <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
              Name
              <input
                type="text"
                value={draftName}
                onChange={(e) => setDraftName(e.target.value)}
                className={inputClasses}
                autoFocus
              />
            </label>
            <label className="flex flex-col gap-1 text-sm font-medium text-stone-700">
              Bio
              <textarea
                rows={3}
                value={draftBio}
                onChange={(e) => setDraftBio(e.target.value)}
                className={`${inputClasses} resize-y`}
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="submit" className={primaryButtonClasses}>
                Save
              </button>
              <button type="button" onClick={() => setIsEditingHeader(false)} className={secondaryButtonClasses}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <span className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 font-display text-xl font-semibold text-white shadow-[0_6px_14px_-4px_rgba(5,150,105,0.55)]">
              {getInitials(name)}
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-2xl font-semibold text-stone-800">{name}</h1>
              <p className="mt-1 text-stone-500">{bio || 'Add a short bio to tell Nova a bit about yourself.'}</p>
            </div>
            <button
              type="button"
              onClick={startEditingHeader}
              className={`${secondaryButtonClasses} w-full shrink-0 sm:w-auto`}
            >
              Edit
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
        {/* Left column: skills, interests, goals */}
        <div className="flex flex-col gap-6">
          {/* Skills */}
          <section className={`${cardClasses} animate-fade-up flex flex-col gap-3`} style={{ animationDelay: '0.05s' }}>
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-lg text-stone-800">Skills</h2>
              {!isAddingSkill && (
                <button type="button" onClick={() => setIsAddingSkill(true)} className={secondaryButtonClasses}>
                  + Add Skill
                </button>
              )}
            </div>

            {isAddingSkill && (
              <form
                className="animate-scale-in flex flex-col gap-2 rounded-xl border border-stone-200 bg-stone-50 p-3 sm:flex-row sm:items-center"
                onSubmit={addSkill}
              >
                <input
                  type="text"
                  placeholder="Skill name"
                  value={newSkillName}
                  onChange={(e) => setNewSkillName(e.target.value)}
                  className={`${inputClasses} w-full sm:min-w-36 sm:flex-1`}
                  autoFocus
                />
                <select
                  value={newSkillLevel}
                  onChange={(e) => setNewSkillLevel(e.target.value as SkillLevel)}
                  className={`${inputClasses} w-full sm:w-auto`}
                >
                  {LEVEL_ORDER.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
                <div className="flex gap-2">
                  <button type="submit" className={`${primaryButtonClasses} flex-1 sm:flex-none`}>
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingSkill(false);
                      setNewSkillName('');
                    }}
                    className={`${secondaryButtonClasses} flex-1 sm:flex-none`}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {skills.length === 0 ? (
              <p className="text-sm text-stone-500">No skills added yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, index) => (
                  <span
                    key={`${skill.name}-${index}`}
                    className="animate-scale-in group inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white py-1 pr-1.5 pl-3 text-sm text-stone-700 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
                  >
                    {skill.name}
                    <span className={skillLevelBadgeClasses(skill.level)}>{skill.level}</span>
                    <button
                      type="button"
                      onClick={() => removeSkill(index)}
                      aria-label={`Remove ${skill.name}`}
                      className="flex h-5 w-5 items-center justify-center rounded-full text-stone-400 transition-colors duration-150 hover:bg-rose-100 hover:text-rose-600"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Interests */}
          <section className={`${cardClasses} animate-fade-up flex flex-col gap-3`} style={{ animationDelay: '0.1s' }}>
            <h2 className="font-display text-lg text-stone-800">Interests</h2>
            {interests.length === 0 ? (
              <p className="text-sm text-stone-500">No interests added yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {interests.map((interest) => (
                  <span key={interest} className={`${plainTagClasses} hover:-translate-y-0.5`}>
                    {interest}
                  </span>
                ))}
              </div>
            )}
          </section>

          {/* Goals */}
          <section className={`${cardClasses} animate-fade-up flex flex-col gap-3`} style={{ animationDelay: '0.15s' }}>
            <h2 className="font-display text-lg text-stone-800">Goals</h2>
            {goals.length === 0 ? (
              <p className="text-sm text-stone-500">No goals added yet.</p>
            ) : (
              <ul className="flex flex-col gap-1">
                {goals.map((goal) => (
                  <li key={goal.id}>
                    <label className="flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-colors duration-150 hover:bg-stone-50">
                      <input
                        type="checkbox"
                        checked={goal.completed}
                        onChange={() => toggleGoal(goal.id)}
                        className="h-5 w-5 shrink-0 cursor-pointer rounded-md border-stone-300 accent-emerald-600 transition-colors focus:ring-emerald-500/40"
                      />
                      <span
                        className={`text-sm transition-colors duration-150 ${
                          goal.completed ? 'text-stone-400 line-through' : 'text-stone-700'
                        }`}
                      >
                        {goal.text}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* Right column: skill gap radar chart */}
        <section className={`${cardClasses} animate-fade-up flex flex-col gap-1`} style={{ animationDelay: '0.1s' }}>
          <h2 className="font-display text-lg text-stone-800">Skill Gap</h2>
          <p className="text-sm text-stone-500">Current skills vs. what "{targetGoal}" typically needs.</p>

          <div className="mt-2 h-72 w-full sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={RADAR_DATA} outerRadius="75%">
                <PolarGrid stroke="var(--color-border)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--color-text-secondary)', fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: 'var(--color-text-muted)', fontSize: 10 }} />
                <Radar
                  name="Current"
                  dataKey="current"
                  stroke="var(--color-primary-500)"
                  fill="var(--color-primary-400)"
                  fillOpacity={0.35}
                  isAnimationActive={false}
                />
                <Radar
                  name="Target"
                  dataKey="target"
                  stroke="var(--color-secondary-500)"
                  fill="var(--color-secondary-400)"
                  fillOpacity={0.15}
                  isAnimationActive={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-surface)',
                    fontSize: 13,
                  }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-4 text-xs text-stone-500">
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> Current
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-teal-500" /> Target
            </span>
          </div>
        </section>
      </div>

      <button
        type="button"
        onClick={onNavigateToChat}
        className={`${primaryButtonClasses} w-full self-center sm:w-auto sm:self-start`}
      >
        💬 Update with Nova
      </button>
    </div>
  );
}
