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
  ({ className = "", success, error, hint, ...rest }, ref) => {
    let inputClasses = `h-11 w-full rounded-lg border px-4 py-2.5 text-sm ${className}`;

    return (
      <div className="relative">
        <input ref={ref} className={inputClasses} {...rest} />

        {hint && <p className="mt-1.5 text-xs text-gray-500">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export default Input;
