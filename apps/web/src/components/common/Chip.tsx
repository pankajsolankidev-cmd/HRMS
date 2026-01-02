interface ChipProps {
  label: string;
}

export default function Chip({ label }: ChipProps) {
  return (
    <span
      className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium
                 text-gray-700 dark:bg-gray-800 dark:text-gray-300"
    >
      {label}
    </span>
  );
}
