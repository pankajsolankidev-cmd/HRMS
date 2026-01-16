import { CalendarIcon } from "@heroicons/react/24/outline";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import type { Instance as FlatpickrInstance } from "flatpickr/dist/types/instance";
import type { DateOption, Hook } from "flatpickr/dist/types/options";
import { useEffect, useRef } from "react";
import Label from "./Label";

type PropsType = {
  id: string;
  mode?: "single" | "multiple" | "range" | "time";
  value?: DateOption | null;
  onChange?: Hook | Hook[];
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: boolean;
  hint?: string;
};

export default function DatePicker({
  id,
  mode = "single",
  value,
  onChange,
  label,
  placeholder,
  required,
  error,
  hint,
}: PropsType) {
  const fpRef = useRef<FlatpickrInstance | null>(null);

  useEffect(() => {
    fpRef.current = flatpickr(`#${id}`, {
      mode,
      static: true,
      monthSelectorType: "static",
      dateFormat: "Y-m-d",
      onChange,
    }) as FlatpickrInstance;

    return () => {
      fpRef.current?.destroy();
      fpRef.current = null;
    };
  }, [id, mode, onChange]);

  useEffect(() => {
    if (fpRef.current) {
      if (value) {
        fpRef.current.setDate(value, false);
      } else {
        fpRef.current.clear();
      }
    }
  }, [value]);

  return (
    <div className="space-y-1.5">
      {label && (
        <Label htmlFor={id}>
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </Label>
      )}

      <div className="relative">
        <input
          id={id}
          placeholder={placeholder}
          className={`h-11 w-full rounded-lg border appearance-none px-4 py-2.5 text-sm shadow-theme-xs
            placeholder:text-gray-400 focus:outline-hidden focus:ring-3 bg-transparent
            text-gray-800 dark:bg-gray-900 dark:text-white/90
            dark:placeholder:text-white/30
            ${
              error
                ? "border-red-500 focus:ring-red-500/20"
                : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:focus:border-brand-800"
            }
          `}
        />

        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 dark:text-gray-400">
          <CalendarIcon className="h-5 w-5" />
        </span>
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
}
