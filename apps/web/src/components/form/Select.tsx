import React from "react";

interface Option {
  value: string;
  label: string;
}

interface SelectProps {
  options: Option[];
  value?: string;
  placeholder?: string;
  onChange: (value: string) => void;
  className?: string;
  label?: string;
  required?: boolean;
}

const Select: React.FC<SelectProps> = ({
  options,
  value = "",
  placeholder = "Select an option",
  onChange,
  className = "",
  label,
  required,
}) => {
  return (
    <div className="space-y-1.5">
      {/* ✅ LABEL */}
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      )}

      {/* ✅ SELECT */}
      <select
        className={`
          h-11 w-full rounded-lg border px-4 py-2.5 text-sm
          bg-white dark:bg-gray-900
          text-gray-900 dark:text-gray-100
          border-gray-300 dark:border-gray-700
          focus:outline-none focus:ring-2 focus:ring-black/20
          ${className}
        `}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="" disabled>
          {placeholder}
        </option>

        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default Select;
