interface ComponentCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  desc?: string;
  action?: React.ReactNode;
}

const ComponentCard: React.FC<ComponentCardProps> = ({
  title,
  children,
  className = "",
  desc = "",
  action
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
        <div className="flex items-center justify-between">
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

          {action && <div className="ml-4">{action}</div>}
        </div>
      </div>

      <div className="p-4 sm:p-6  dark:bg-gray-950">
        <div className="space-y-6 text-gray-700 dark:text-gray-300">
          {children}
        </div>
      </div>
    </div>
  );
};

export default ComponentCard;
