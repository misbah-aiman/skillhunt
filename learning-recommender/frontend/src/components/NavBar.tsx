import './NavBar.css';

export type View = 'dashboard' | 'path' | 'topics' | 'chat' | 'profile';

interface NavBarProps {
  view: View;
  onNavigate: (view: View) => void;
  onSignOut: () => void;
}

const LINKS: { view: View; label: string }[] = [
  { view: 'dashboard', label: 'Dashboard' },
  { view: 'path', label: 'Learning Path' },
  { view: 'topics', label: 'Topics' },
  { view: 'chat', label: 'Chat' },
  { view: 'profile', label: 'Profile' },
];

export function NavBar({ view, onNavigate, onSignOut }: NavBarProps) {
  return (
    <>
      <nav className="navbar">
        <span className="navbar-brand">SkillHunt</span>
        <div className="navbar-links">
          {LINKS.map((link) => (
            <button
              type="button"
              key={link.view}
              className={`navbar-link${view === link.view ? ' active' : ''}`}
              onClick={() => onNavigate(link.view)}
            >
              {link.label}
            </button>
          ))}
        </div>
        <button type="button" className="link-button" onClick={onSignOut}>
          Sign Out
        </button>
      </nav>

      <nav className="bottom-nav" aria-label="Primary">
        {LINKS.map((link) => (
          <button
            type="button"
            key={link.view}
            className={`bottom-nav-link${view === link.view ? ' active' : ''}`}
            onClick={() => onNavigate(link.view)}
          >
            {link.label}
          </button>
        ))}
      </nav>
    </>
  );
}
