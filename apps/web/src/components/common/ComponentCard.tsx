interface ComponentCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  desc?: string;
  action?: React.ReactNode;
  middle?: React.ReactNode;
}

const ComponentCard: React.FC<ComponentCardProps> = ({
  title,
  children,
  className = "",
  desc = "",
  action,
  middle,
}) => {
  return (
    <div
      className={`
        rounded-2xl border
        bg-white dark:bg-gray-900
        border-gray-200 dark:border-gray-800
        ${className}
      `}
    >
      <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
        <div className="flex flex-wrap items-center gap-4">
          <div>
            <h3 className="text-base font-medium text-gray-800 dark:text-white/90">
              {title}
            </h3>
            {desc && (
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {desc}
              </p>
            )}
          </div>

          {middle && <div className="flex-1">{middle}</div>}
          {action && <div>{action}</div>}
        </div>
      </div>

      <div className="p-4 sm:p-6 dark:bg-gray-950">{children}</div>
    </div>
  );
};

export default ComponentCard;
