import { CalendarIcon, ClockIcon } from "@heroicons/react/24/outline";
import flatpickr from "flatpickr";
import "flatpickr/dist/flatpickr.css";
import type { Instance as FlatpickrInstance } from "flatpickr/dist/types/instance";
import type { DateOption } from "flatpickr/dist/types/options";
import { useEffect, useRef } from "react";
import Label from "./Label";

type PropsType = {
  id: string;
  mode?: "single" | "multiple" | "range" | "time";
  value?: DateOption | DateOption[] | null;
  onChange?: (
    selectedDates: Date[],
    dateStr: string,
    instance: FlatpickrInstance,
  ) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  error?: boolean;
  hint?: string;
  minDate?: string | Date;
  maxDate?: string | Date;
  disableFuture?: boolean;
  disablePast?: boolean;
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
  minDate,
  maxDate,
  disableFuture,
  disablePast,
}: PropsType) {
  const fpRef = useRef<FlatpickrInstance | null>(null);
  const isTimeMode = mode === "time";

  useEffect(() => {
    const today = new Date();

    fpRef.current = flatpickr(`#${id}`, {
      mode: isTimeMode ? "single" : mode,
      static: true,
      monthSelectorType: "static",

      enableTime: isTimeMode,
      noCalendar: isTimeMode,
      time_24hr: true,

      dateFormat: isTimeMode ? "H:i" : "Y-m-d",

      minDate: disablePast ? today : minDate,
      maxDate: disableFuture ? today : maxDate,

      onChange,
    }) as FlatpickrInstance;

    return () => {
      fpRef.current?.destroy();
      fpRef.current = null;
    };
  }, [id, mode, onChange, minDate, maxDate, disableFuture, disablePast]);

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
          className={`h-12 w-full rounded-lg border px-4 pr-11 text-sm
          transition-all duration-200
          bg-white/70 backdrop-blur-md
          dark:bg-gray-900/60
          ${isTimeMode ? "text-center text-base font-medium tracking-wide" : ""}
          ${
            error
              ? "border-red-400 focus:ring-4 focus:ring-red-200"
              : "border-gray-300 focus:border-brand-400 focus:ring-4 focus:ring-brand-200 dark:border-gray-700"
          }
          focus:outline-none`}
        />

        <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 dark:text-gray-400">
          {isTimeMode ? (
            <ClockIcon className="h-5 w-5" />
          ) : (
            <CalendarIcon className="h-5 w-5" />
          )}
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
