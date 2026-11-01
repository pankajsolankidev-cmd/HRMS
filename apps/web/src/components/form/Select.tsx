import { IconChevronDown, IconChevronUp, IconX } from "@tabler/icons-react";
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
  error?: boolean;
  hint?: string;
}

const Select: React.FC<SelectProps> = ({
  options,
  value = "",
  placeholder = "Select",
  onChange,
  className = "",
  label,
  required,
  error,
  hint,
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const hasOptions = options.length > 0;

  return (
    <div className="space-y-1.5">
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <select
          className={`
            h-11 w-full rounded-lg border px-4 py-2.5 text-sm
            bg-white dark:bg-gray-900
            focus:outline-none focus:ring-2
            appearance-none
            ${
              value === ""
                ? "text-gray-400 dark:text-gray-500"
                : "text-gray-900 dark:text-gray-100"
            }
            ${
              error
                ? "border-red-500 focus:ring-red-500/20"
                : "border-gray-300 dark:border-gray-700 focus:ring-black/20"
            }
            ${className}
          `}
          value={value}
          disabled={!hasOptions}
          onChange={(e) => {
            onChange(e.target.value);
            setIsOpen(false);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setIsOpen(false)}
        >
          {!hasOptions ? (
            <option value="">No systems available</option>
          ) : (
            <>
              <option value="" disabled>
                {placeholder}
              </option>

              {options.map((option) => (
                <option
                  key={option.value}
                  value={option.value}
                  className="text-gray-900 dark:text-gray-100"
                >
                  {option.label}
                </option>
              ))}
            </>
          )}
        </select>

        <div className="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
          {value && hasOptions && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                onChange("");
              }}
              className="text-gray-400 hover:text-red-500 transition-colors dark:text-gray-500"
            >
              <IconX size={16} stroke={2.5} />
            </button>
          )}

          {isOpen ? (
            <IconChevronUp
              size={18}
              className="pointer-events-none text-gray-400 dark:text-gray-500"
            />
          ) : (
            <IconChevronDown
              size={18}
              className="pointer-events-none text-gray-400 dark:text-gray-500"
            />
          )}
        </div>
      </div>

      {hint && (
        <p
          className={`text-xs ${
            error ? "text-red-500" : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {hint}
        </p>
      )}
    </div>
  );
};

export default Select;