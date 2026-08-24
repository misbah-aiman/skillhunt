import './NavBar.css';

export type View = 'home' | 'topics' | 'chat' | 'profile';

interface NavBarProps {
  view: View;
  onNavigate: (view: View) => void;
  onSignOut: () => void;
}

export function NavBar({ view, onNavigate, onSignOut }: NavBarProps) {
  return (
    <nav className="navbar">
      <span className="navbar-brand">SkillHunt</span>
      <div className="navbar-links">
        <button
          type="button"
          className={`navbar-link${view === 'home' ? ' active' : ''}`}
          onClick={() => onNavigate('home')}
        >
          Home
        </button>
        <button
          type="button"
          className={`navbar-link${view === 'topics' ? ' active' : ''}`}
          onClick={() => onNavigate('topics')}
        >
          Topics
        </button>
        <button
          type="button"
          className={`navbar-link${view === 'chat' ? ' active' : ''}`}
          onClick={() => onNavigate('chat')}
        >
          Chat
        </button>
        <button
          type="button"
          className={`navbar-link${view === 'profile' ? ' active' : ''}`}
          onClick={() => onNavigate('profile')}
        >
          Profile
        </button>
      </div>
      <button type="button" className="link-button" onClick={onSignOut}>
        Sign Out
      </button>
    </nav>
  );
}
