import './NavBar.css';

export type View = 'dashboard' | 'path' | 'topics' | 'persona' | 'chat' | 'call' | 'profile';

interface NavBarProps {
  view: View;
  onNavigate: (view: View) => void;
  onSignOut: () => void;
}

const LINKS: { view: View; label: string }[] = [
  { view: 'dashboard', label: 'Dashboard' },
  { view: 'path', label: 'Learning Path' },
  { view: 'topics', label: 'Topics' },
  { view: 'persona', label: 'Alex' },
  { view: 'profile', label: 'Profile' },
];

// The chat and call screens are only reachable through the Alex hub, not
// their own top-level tab, so that tab should still read as active while
// either of them is open.
function isLinkActive(view: View, linkView: View): boolean {
  if (view === linkView) return true;
  return linkView === 'persona' && (view === 'chat' || view === 'call');
}

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
              className={`navbar-link${isLinkActive(view, link.view) ? ' active' : ''}`}
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
            className={`bottom-nav-link${isLinkActive(view, link.view) ? ' active' : ''}`}
            onClick={() => onNavigate(link.view)}
          >
            {link.label}
          </button>
        ))}
      </nav>
    </>
  );
}
