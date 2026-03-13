import type { ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  type?: "button" | "submit" | "reset";
  size?: "sm" | "md" | "icon";
  variant?: "primary" | "outline";
  startIcon?: ReactNode;
  endIcon?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  size = "md",
  variant = "primary",
  startIcon,
  endIcon,
  onClick,
  className = "",
  disabled = false,
  type = "submit",
}) => {
  const sizeClasses = {
    sm: "px-4 py-3 text-sm",
    md: "px-5 py-3.5 text-sm h-[42px]",
    icon: "h-7 w-7 p-0",
  };

  const variantClasses = {
    primary:
      "bg-black dark:bg-blue-500 dark:hover:bg-blue-600 text-white shadow-theme-xs disabled:bg-black whitespace-nowrap",
    outline:
      "bg-white text-gray-700 ring-1 ring-inset ring-gray-300  hover:bg-gray-200 dark:hover:bg-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:ring-gray-700  ",
  };

  return (
    <button
      type={type}
      className={`inline-flex items-center justify-center gap-2 rounded-lg transition ${className} ${
        sizeClasses[size]
      } ${variantClasses[variant]} ${
        disabled ? "cursor-not-allowed opacity-50" : ""
      }`}
      onClick={onClick}
      disabled={disabled}
    >
      {startIcon && <span className="flex items-center">{startIcon}</span>}
      {children}
      {endIcon && <span className="flex items-center">{endIcon}</span>}
    </button>
  );
};

export default Button;
