import React from "react";

interface FilterCardProps {
  children: React.ReactNode;
  className?: string;
}

const FilterCard: React.FC<FilterCardProps> = ({
  children,
  className = "",
}) => {
  return (
    <div
      className={`
        rounded-2xl border border-gray-200 dark:border-gray-800
        bg-white dark:bg-gray-900
        px-4 py-4 sm:px-6
        ${className}
      `}
    >
      {children}
    </div>
  );
};

export default FilterCard;
