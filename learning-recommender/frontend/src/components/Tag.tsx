interface TagProps {
  children: string;
  label: string;
  onRemove: () => void;
}

export function Tag({ children, label, onRemove }: TagProps) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm text-emerald-800">
      {children}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="text-emerald-600 hover:text-emerald-900"
      >
        &times;
      </button>
    </span>
  );
}
