interface SpinnerProps {
  size?: number;
  label?: string;
}

export function Spinner({ size = 20, label }: SpinnerProps) {
  return (
    <span className="inline-flex items-center gap-2 text-stone-500" role="status" aria-live="polite">
      <span
        className="inline-block shrink-0 animate-spin rounded-full border-2 border-stone-300 border-t-emerald-600"
        style={{ width: size, height: size }}
      />
      {label && <span>{label}</span>}
    </span>
  );
}
