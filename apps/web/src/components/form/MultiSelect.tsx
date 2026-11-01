import { IconChevronDown, IconX } from "@tabler/icons-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";

interface Option {
  value: string;
  text: string;
}

interface MultiSelectProps {
  label: string;
  options: Option[];
  defaultSelected?: string[];
  value?: string[];
  onChange?: (selected: string[]) => void;
  onBlur?: () => void;
  disabled?: boolean;
  placeholder?: string;

  required?: boolean;
  error?: boolean;
  hint?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({
  label,
  options,
  defaultSelected = [],
  value,
  onChange,
  onBlur,
  disabled = false,
  placeholder = "Select options",
  required,
  error,
  hint,
}) => {
  const isControlled = value !== undefined;
  const [internalSelected, setInternalSelected] =
    useState<string[]>(defaultSelected);
  const selectedOptions = isControlled ? value : internalSelected;
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        onBlur?.();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const updateSelection = (newSelected: string[]) => {
    if (!isControlled) setInternalSelected(newSelected);
    onChange?.(newSelected);
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen((prev) => {
        if (prev) {
          onBlur?.();
        }
        return !prev;
      });

      setFocusedIndex(-1);
    }
  };

  const handleSelect = (optionValue: string) => {
    const newSelected = selectedOptions.includes(optionValue)
      ? selectedOptions.filter((v) => v !== optionValue)
      : [...selectedOptions, optionValue];
    updateSelection(newSelected);
  };

  const removeOption = (optionValue: string) => {
    updateSelection(selectedOptions.filter((v) => v !== optionValue));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    e.preventDefault();
    switch (e.key) {
      case "Enter":
        if (!isOpen) {
          setIsOpen(true);
        } else if (focusedIndex >= 0) {
          handleSelect(options[focusedIndex].value);
        }
        break;
      case "Escape":
        setIsOpen(false);
        break;
      case "ArrowDown":
        if (!isOpen) {
          setIsOpen(true);
        } else {
          setFocusedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
        }
        break;
      case "ArrowUp":
        if (isOpen) {
          setFocusedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
        }
        break;
    }
  };

  return (
    <div className="w-full" ref={dropdownRef}>
      <label
        className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400"
        id={`${label}-label`}
      >
        {label}
        {required && <span className="ml-0.5 text-red-500">*</span>}
      </label>

      <div className="relative z-20 inline-block w-full">
        <div className="relative flex flex-col items-center">
          <div
            onClick={toggleDropdown}
            onKeyDown={handleKeyDown}
            className="w-full"
            role="combobox"
            aria-expanded={isOpen}
            aria-haspopup="listbox"
            aria-labelledby={`${label}-label`}
            aria-disabled={disabled}
            tabIndex={disabled ? -1 : 0}
          >
            <div
              className={`mb-2 flex min-h-11 rounded-lg border py-1.5 pl-3 pr-3 shadow-theme-xs transition
              ${
                error
                  ? "border-red-500 focus-within:ring-2 focus-within:ring-red-500/20"
                  : "border-gray-300 focus-within:border-brand-300 focus-within:ring-2 focus-within:ring-brand-500/20 dark:border-gray-700 dark:focus-within:border-brand-300"
              }
              ${
                disabled
                  ? "opacity-50 cursor-not-allowed bg-gray-50 dark:bg-gray-900"
                  : "cursor-pointer bg-white dark:bg-gray-900"
              }
            `}
            >
              <div className="flex flex-wrap flex-auto gap-2">
                {selectedOptions.length > 0 ? (
                  selectedOptions.map((value) => {
                    const text =
                      options.find((opt) => opt.value === value)?.text || value;
                    return (
                      <div
                        key={value}
                        className="group flex items-center justify-center rounded-full border-[0.7px] border-transparent bg-gray-100 py-1 pl-2.5 pr-2 text-sm text-gray-800 hover:border-gray-200 dark:bg-gray-800 dark:text-white/90 dark:hover:border-gray-800"
                      >
                        <span className="flex-initial max-w-full">{text}</span>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!disabled) removeOption(value);
                          }}
                          disabled={disabled}
                          className="pl-2 text-gray-500 cursor-pointer group-hover:text-gray-400 dark:text-gray-400 disabled:cursor-not-allowed"
                          aria-label={`Remove ${text}`}
                        >
                          <IconX size={14} stroke={2.5} />
                        </button>
                      </div>
                    );
                  })
                ) : (
                  <div className="w-full h-full p-1 pr-2 text-sm text-gray-400 dark:text-gray-500 pointer-events-none">
                    {placeholder}
                  </div>
                )}
              </div>
              <div className="flex items-center self-start py-1 pl-1 pr-1 w-7">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleDropdown();
                  }}
                  disabled={disabled}
                  className="w-5 h-5 text-gray-700 outline-hidden cursor-pointer focus:outline-hidden dark:text-gray-400 disabled:cursor-not-allowed"
                >
                  <IconChevronDown
                    size={20}
                    stroke={1.8}
                    className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
              </div>
            </div>
          </div>

          {isOpen && (
            <div
              className="absolute left-0 z-40 w-full overflow-y-auto bg-white rounded-lg shadow-sm top-full max-h-select dark:bg-gray-900"
              onClick={(e) => e.stopPropagation()}
              role="listbox"
              aria-label={label}
            >
              {options.map((option, index) => {
                const isSelected = selectedOptions.includes(option.value);
                const isFocused = index === focusedIndex;

                return (
                  <div
                    key={option.value}
                    className={`hover:bg-primary/5 w-full cursor-pointer rounded-t border-b border-gray-200 dark:border-gray-800 ${
                      isFocused ? "bg-primary/5" : ""
                    } ${isSelected ? "bg-primary/10" : ""}`}
                    onClick={() => handleSelect(option.value)}
                    role="option"
                    aria-selected={isSelected}
                  >
                    <div className="relative flex w-full items-center p-2 pl-2">
                      <div className="mx-2 leading-6 text-gray-800 dark:text-white/90">
                        {option.text}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      {error && hint && <p className="text-xs text-red-500">{hint}</p>}
    </div>
  );
};

export default MultiSelect;
