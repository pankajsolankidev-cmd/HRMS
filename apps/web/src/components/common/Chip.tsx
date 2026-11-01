interface ChipProps {
  label: string;
  className?: string;
}

export default function Chip({ label, className = "" }: ChipProps) {
  return (
    <span
      className={`inline-flex items-center justify-center
        min-w-[90px] h-[28px] px-3
        rounded-full text-xs font-medium
        ${className}`}
    >
      {label}
    </span>
  );
}
