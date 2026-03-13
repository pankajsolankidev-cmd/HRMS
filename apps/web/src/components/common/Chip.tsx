interface ChipProps {
  label: string;
  className?: string;
}

export default function Chip({ label, className = "" }: ChipProps) {
  return (
    <span
      className={`rounded-full px-2.5 py-1 text-xs font-medium
        ${className}`}
    >
      {label}
    </span>
  );
}
