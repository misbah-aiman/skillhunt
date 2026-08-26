import './Spinner.css';

interface SpinnerProps {
  size?: number;
  label?: string;
}

export function Spinner({ size = 20, label }: SpinnerProps) {
  return (
    <span className="spinner-wrap" role="status" aria-live="polite">
      <span className="spinner" style={{ width: size, height: size }} />
      {label && <span>{label}</span>}
    </span>
  );
}
