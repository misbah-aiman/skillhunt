interface ChatLauncherProps {
  onOpenChat: () => void;
}

// Floating action button that opens the full ChatPage — no popup panel,
// the conversation always lives on its own page.
export function ChatLauncher({ onOpenChat }: ChatLauncherProps) {
  return (
    <button
      type="button"
      onClick={onOpenChat}
      aria-label="Chat with Alex"
      className="fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom,0px))] z-30 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 text-2xl text-white shadow-[0_4px_12px_-2px_rgba(0,0,0,0.15),0_8px_24px_-4px_rgba(5,150,105,0.55)] transition-all duration-200 hover:scale-110 hover:shadow-[0_6px_16px_-2px_rgba(0,0,0,0.18),0_12px_28px_-4px_rgba(5,150,105,0.6)] active:scale-95 sm:right-6 sm:bottom-6"
    >
      <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-emerald-500/30 [animation-duration:2.5s]" />
      🤖
    </button>
  );
}
