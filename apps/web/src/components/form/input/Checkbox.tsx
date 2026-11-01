import { IconCheck } from "@tabler/icons-react";
import type React from "react";

interface CheckboxProps {
  label?: string;
  checked: boolean;
  className?: string;
  id?: string;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

const Checkbox: React.FC<CheckboxProps> = ({
  label,
  checked,
  id,
  onChange,
  className = "",
  disabled = false,
}) => {
  return (
    <label
      htmlFor={id}
      className={`flex items-center gap-3 cursor-pointer select-none ${
        disabled ? "cursor-not-allowed opacity-60" : ""
      }`}
    >
      <div className="relative flex items-center justify-center w-5 h-5">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={(e) => onChange(e.target.checked)}
          className={`peer w-5 h-5 appearance-none rounded-md border border-gray-300 dark:border-gray-700 
          checked:bg-brand-500 checked:border-brand-500 transition ${className}`}
        />

        {checked && (
          <IconCheck
            size={14}
            stroke={3}
            className={`absolute pointer-events-none ${
              disabled ? "text-gray-300" : "text-white"
            }`}
          />
        )}
      </div>

      {label && (
        <span className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-none">
          {label}
        </span>
      )}
    </label>
  );
};

export default Checkbox;
