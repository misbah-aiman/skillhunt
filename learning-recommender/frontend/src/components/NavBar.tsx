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
      <nav className="mb-8 flex w-full items-center justify-between gap-4 border-b border-stone-200 pb-6">
        <span className="font-display text-lg font-semibold text-stone-800">SkillHunt</span>
        <div className="hidden gap-1 sm:flex">
          {LINKS.map((link) => (
            <button
              type="button"
              key={link.view}
              onClick={() => onNavigate(link.view)}
              className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
                isLinkActive(view, link.view)
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800'
              }`}
            >
              {link.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="text-sm font-medium text-emerald-700 hover:text-emerald-800"
        >
          Sign Out
        </button>
      </nav>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-20 flex border-t border-stone-200 bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.06)] sm:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {LINKS.map((link) => (
          <button
            type="button"
            key={link.view}
            onClick={() => onNavigate(link.view)}
            className={`flex min-h-11 flex-1 items-center justify-center px-1 py-2 text-xs font-medium transition-colors ${
              isLinkActive(view, link.view) ? 'text-emerald-700' : 'text-stone-400'
            }`}
          >
            {link.label}
          </button>
        ))}
      </nav>
    </>
  );
}
