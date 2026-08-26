import './PersonaPage.css';

interface PersonaPageProps {
  onNavigateToChat: () => void;
  onNavigateToCall: () => void;
}

export function PersonaPage({ onNavigateToChat, onNavigateToCall }: PersonaPageProps) {
  return (
    <div className="persona-page">
      <div className="persona-avatar">🤖</div>
      <h1>Meet Alex, your AI Learning Assistant</h1>
      <p className="persona-description">
        Alex asks a few questions about your skills, interests, and goals, then suggests
        what to add to your profile — type it out in a chat, or talk it through live on a
        call, whichever feels more natural.
      </p>

      <div className="persona-actions">
        <button type="button" className="persona-button" onClick={onNavigateToChat}>
          <span className="persona-button-icon">💬</span>
          Chat with Alex
        </button>
        <button type="button" className="persona-button" onClick={onNavigateToCall}>
          <span className="persona-button-icon">📞</span>
          Call Alex
        </button>
      </div>
    </div>
  );
}
