export type View = 'dashboard' | 'path' | 'chat' | 'call' | 'profile';

interface NavBarProps {
  view: View;
  onNavigate: (view: View) => void;
  onSignOut: () => void;
}

const LINKS: { view: View; label: string; icon: string }[] = [
  { view: 'dashboard', label: 'Dashboard', icon: '🏠' },
  { view: 'path', label: 'Learning Path', icon: '🗺️' },
  { view: 'chat', label: 'Chat', icon: '💬' },
  { view: 'profile', label: 'Profile', icon: '👤' },
];

export function NavBar({ view, onNavigate, onSignOut }: NavBarProps) {
  return (
    <>
      <nav className="sticky top-0 z-20 -mx-4 mb-8 flex w-auto items-center justify-between gap-4 border-b border-stone-200/70 bg-[#fbfaf8]/80 px-4 py-4 backdrop-blur-md sm:-mx-8 sm:px-8">
        <span className="flex items-center gap-2 font-display text-lg font-semibold text-stone-800">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-sm shadow-[0_4px_10px_-2px_rgba(5,150,105,0.5)]">
            🎯
          </span>
          <span className="text-gradient-brand">SkillHunt</span>
        </span>
        <div className="hidden gap-1 rounded-full border border-stone-200/70 bg-white/60 p-1 shadow-sm sm:flex">
          {LINKS.map((link) => (
            <button
              type="button"
              key={link.view}
              onClick={() => onNavigate(link.view)}
              className={`relative rounded-full px-3.5 py-1.5 text-sm font-medium transition-all duration-200 ${
                view === link.view
                  ? 'bg-gradient-to-b from-emerald-500 to-emerald-600 text-white shadow-[0_4px_10px_-3px_rgba(5,150,105,0.55)]'
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
          className="text-sm font-medium text-emerald-700 transition-colors hover:text-emerald-800"
        >
          Sign Out
        </button>
      </nav>

      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-20 flex border-t border-stone-200/70 bg-white/90 shadow-[0_-8px_24px_rgba(41,37,36,0.08)] backdrop-blur-md sm:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {LINKS.map((link) => (
          <button
            type="button"
            key={link.view}
            onClick={() => onNavigate(link.view)}
            className={`flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-xs font-medium transition-colors duration-200 ${
              view === link.view ? 'text-emerald-700' : 'text-stone-400'
            }`}
          >
            <span className={`text-base transition-transform duration-200 ${view === link.view ? '-translate-y-0.5 scale-110' : ''}`}>
              {link.icon}
            </span>
            {link.label}
          </button>
        ))}
      </nav>
    </>
  );
}
