interface TagProps {
  children: string;
  label: string;
  onRemove: () => void;
}

export function Tag({ children, label, onRemove }: TagProps) {
  return (
    <span className="animate-scale-in inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm text-emerald-800 shadow-sm transition-colors hover:border-emerald-300 hover:bg-emerald-100">
      {children}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="rounded-full text-emerald-600 transition-colors hover:text-emerald-900"
      >
        &times;
      </button>
    </span>
  );
}
