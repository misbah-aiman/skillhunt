import { useState } from 'react';
import type { Skill } from '../lib/types';
import './ProfileFields.css';

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
      <section>
        <h2>Skills</h2>
        <div className="tag-input">
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
          />
          <button type="button" onClick={addSkill}>
            Add
          </button>
        </div>
        {skills.length === 0 && <p className="profile-empty">No skills added yet.</p>}
        <div className="tag-list">
          {skills.map((skill, index) => (
            <span className="tag" key={`${skill.name}-${skill.level}-${index}`}>
              {skill.name} · {skill.level}
              <button type="button" onClick={() => removeSkill(index)} aria-label={`Remove ${skill.name}`}>
                &times;
              </button>
            </span>
          ))}
        </div>
      </section>

      <section>
        <h2>Interests</h2>
        <div className="tag-input">
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
          />
          <button type="button" onClick={addInterest}>
            Add
          </button>
        </div>
        <div className="tag-list">
          {interests.map((interest) => (
            <span className="tag" key={interest}>
              {interest}
              <button type="button" onClick={() => removeInterest(interest)} aria-label={`Remove ${interest}`}>
                &times;
              </button>
            </span>
          ))}
        </div>
      </section>

      <section>
        <h2>Goals</h2>
        <div className="tag-input">
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
          />
          <button type="button" onClick={addGoal}>
            Add
          </button>
        </div>
        <div className="tag-list">
          {goals.map((goal) => (
            <span className="tag" key={goal}>
              {goal}
              <button type="button" onClick={() => removeGoal(goal)} aria-label={`Remove ${goal}`}>
                &times;
              </button>
            </span>
          ))}
        </div>
      </section>

      <section>
        <h2>Bio</h2>
        <textarea
          rows={4}
          placeholder="Tell us about yourself"
          value={bio}
          onChange={(e) => onBioChange(e.target.value)}
        />
      </section>
    </>
  );
}
