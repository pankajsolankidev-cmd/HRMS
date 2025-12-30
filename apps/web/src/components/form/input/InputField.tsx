import React, { forwardRef } from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
  success?: boolean;
  error?: boolean;
  hint?: string;
  type?: string;
  id?: string;
  name?: string;
  placeholder?: string;
  value?: string | number; 
  required?: boolean;
  label?: string;
};

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className = "",
      success,
      error,
      hint,
      label,
      id,
      name,
      required,
      ...rest
    },
    ref
  ) => {
    const inputId = id || name;

    const inputClasses = `
      h-11 w-full rounded-lg border px-4 py-2.5 text-sm
      bg-white dark:bg-gray-900
      text-gray-900 dark:text-gray-100
      placeholder-gray-400 dark:placeholder-gray-500
      focus:outline-none focus:ring-2
      ${error ? "border-red-500 focus:ring-red-200" : "border-gray-300 dark:border-gray-700 focus:ring-black/20"}
      ${success ? "border-green-500 focus:ring-green-200" : ""}
      ${className}
    `;

    return (
      <div className="space-y-1.5">
        {/* ✅ LABEL */}
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 dark:text-gray-300"
          >
            {label}
            {required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}

        {/* ✅ INPUT */}
        <input
          ref={ref}
          id={inputId}
          name={name}
          required={required}
          className={inputClasses}
          {...rest}
        />

        {/* ✅ HINT / ERROR TEXT */}
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
  }
);

Input.displayName = "Input";
export default Input;
