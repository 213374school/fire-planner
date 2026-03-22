import { useHoldRepeat } from "../hooks/useHoldRepeat";

interface Props {
  onClick: () => void;
  className?: string;
  children: React.ReactNode;
}

export function StepButton({ onClick, className, children }: Props) {
  const { start, stop } = useHoldRepeat(onClick);

  return (
    <button
      onPointerDown={(e) => { e.preventDefault(); start(); }}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onKeyDown={(e) => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); onClick(); } }}
      className={className}
    >
      {children}
    </button>
  );
}
