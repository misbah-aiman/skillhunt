import { useState } from 'react';
import type { Skill } from '../lib/types';
import { inputClasses, secondaryButtonClasses } from '../lib/ui';
import { Tag } from './Tag';

interface ProfileFieldsProps {
  skills: Skill[];
  onSkillsChange: (skills: Skill[]) => void;
  interests: string[];
  onInterestsChange: (interests: string[]) => void;
  goals: string[];
  onGoalsChange: (goals: string[]) => void;
  bio: string;
  onBioChange: (bio: string) => void;
}

// Shared skills/interests/goals/bio fields, used by both the profile
// setup (first-time) and profile edit forms.
export function ProfileFields({
  skills,
  onSkillsChange,
  interests,
  onInterestsChange,
  goals,
  onGoalsChange,
  bio,
  onBioChange,
}: ProfileFieldsProps) {
  const [skillNameInput, setSkillNameInput] = useState('');
  const [skillLevelInput, setSkillLevelInput] = useState('');
  const [interestInput, setInterestInput] = useState('');
  const [goalInput, setGoalInput] = useState('');

  function addSkill() {
    const name = skillNameInput.trim();
    const level = skillLevelInput.trim();
    if (name && level) {
      onSkillsChange([...skills, { name, level }]);
    }
    setSkillNameInput('');
    setSkillLevelInput('');
  }

  function removeSkill(index: number) {
    onSkillsChange(skills.filter((_, i) => i !== index));
  }

  function addInterest() {
    const value = interestInput.trim();
    if (value && !interests.includes(value)) {
      onInterestsChange([...interests, value]);
    }
    setInterestInput('');
  }

  function removeInterest(value: string) {
    onInterestsChange(interests.filter((item) => item !== value));
  }

  function addGoal() {
    const value = goalInput.trim();
    if (value && !goals.includes(value)) {
      onGoalsChange([...goals, value]);
    }
    setGoalInput('');
  }

  function removeGoal(value: string) {
    onGoalsChange(goals.filter((item) => item !== value));
  }

  return (
    <>
      <section className="flex flex-col gap-2 border-b border-stone-200/70 pb-6">
        <h2 className="font-display text-lg text-stone-800">Skills</h2>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Skill name"
            value={skillNameInput}
            onChange={(e) => setSkillNameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addSkill();
              }
            }}
            className={`${inputClasses} min-w-36 flex-1`}
          />
          <input
            type="text"
            placeholder="Level (e.g. Intermediate)"
            value={skillLevelInput}
            onChange={(e) => setSkillLevelInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addSkill();
              }
            }}
            className={`${inputClasses} min-w-36 flex-1`}
          />
          <button type="button" onClick={addSkill} className={secondaryButtonClasses}>
            Add
          </button>
        </div>
        {skills.length === 0 && <p className="text-sm text-stone-500">No skills added yet.</p>}
        <div className="flex flex-wrap gap-2">
          {skills.map((skill, index) => (
            <Tag key={`${skill.name}-${skill.level}-${index}`} label={skill.name} onRemove={() => removeSkill(index)}>
              {`${skill.name} · ${skill.level}`}
            </Tag>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2 border-b border-stone-200/70 pb-6">
        <h2 className="font-display text-lg text-stone-800">Interests</h2>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Add an interest"
            value={interestInput}
            onChange={(e) => setInterestInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addInterest();
              }
            }}
            className={`${inputClasses} min-w-36 flex-1`}
          />
          <button type="button" onClick={addInterest} className={secondaryButtonClasses}>
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {interests.map((interest) => (
            <Tag key={interest} label={interest} onRemove={() => removeInterest(interest)}>
              {interest}
            </Tag>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2 border-b border-stone-200/70 pb-6">
        <h2 className="font-display text-lg text-stone-800">Goals</h2>
        <div className="flex flex-wrap gap-2">
          <input
            type="text"
            placeholder="Add a goal"
            value={goalInput}
            onChange={(e) => setGoalInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addGoal();
              }
            }}
            className={`${inputClasses} min-w-36 flex-1`}
          />
          <button type="button" onClick={addGoal} className={secondaryButtonClasses}>
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {goals.map((goal) => (
            <Tag key={goal} label={goal} onRemove={() => removeGoal(goal)}>
              {goal}
            </Tag>
          ))}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-display text-lg text-stone-800">Bio</h2>
        <textarea
          rows={4}
          placeholder="Tell us about yourself"
          value={bio}
          onChange={(e) => onBioChange(e.target.value)}
          className={`${inputClasses} resize-y`}
        />
      </section>
    </>
  );
}
