interface ComponentCardProps {
  title?: string;
  children: React.ReactNode;
  className?: string;
  desc?: string;
  action?: React.ReactNode;
  middle?: React.ReactNode;
}

const Card: React.FC<ComponentCardProps> = ({
  title,
  children,
  className = "",
  desc = "",
  action,
  middle,
}) => {
  const showHeader = title || desc || action || middle;

  return (
    <div
      className={`
        rounded-2xl border
        bg-white dark:bg-gray-900
        border-gray-200 dark:border-gray-800
        ${className}
      `}
    >
      {showHeader && (
        <div className="px-4 py-4 sm:px-6">
          <div className="flex items-center gap-4 pt-2">
            {(title || desc) && (
              <div>
                {title && (
                  <h3 className="text-2xl font-medium text-gray-800 dark:text-white/90">
                    {title}
                  </h3>
                )}

                {desc && (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    {desc}
                  </p>
                )}
              </div>
            )}

            {action && <div>{action}</div>}
            {middle && <div className="ml-auto">{middle}</div>}
          </div>
        </div>
      )}

      <div className="p-4 sm:p-6 dark:bg-gray-950">{children}</div>
    </div>
  );
};

export default Card;
