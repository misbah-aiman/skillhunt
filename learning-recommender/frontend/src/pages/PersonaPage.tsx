interface PersonaPageProps {
  onNavigateToChat: () => void;
  onNavigateToCall: () => void;
}

export function PersonaPage({ onNavigateToChat, onNavigateToCall }: PersonaPageProps) {
  return (
    <div className="animate-fade-up mx-auto flex w-full max-w-xl flex-col items-center gap-4 py-8 text-center">
      <div className="mb-1 flex h-22 w-22 items-center justify-center rounded-full border-2 border-emerald-200 bg-emerald-50 text-4xl">
        🤖
      </div>
      <h1 className="text-2xl font-semibold text-stone-800">Meet Alex, your AI Learning Assistant</h1>
      <p className="max-w-md text-stone-500">
        Alex asks a few questions about your skills, interests, and goals, then suggests what to add to your
        profile — type it out in a chat, or talk it through live on a call, whichever feels more natural.
      </p>

      <div className="mt-4 grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={onNavigateToChat}
          className="flex flex-col items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-8 text-base font-semibold text-stone-800 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
        >
          <span className="text-3xl">💬</span>
          Chat with Alex
        </button>
        <button
          type="button"
          onClick={onNavigateToCall}
          className="flex flex-col items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-8 text-base font-semibold text-stone-800 shadow-sm transition-all hover:-translate-y-0.5 hover:border-emerald-300 hover:shadow-md"
        >
          <span className="text-3xl">📞</span>
          Call Alex
        </button>
      </div>
    </div>
  );
}
