import { useTheme } from "../../context/ThemeContext";

export default function ThemeTogglerTwo() {
  const { toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="
        fixed bottom-6 right-6 z-50
        inline-flex items-center justify-center
        size-14 rounded-full
        bg-brand-500 text-white
        hover:bg-brand-600
        shadow-lg transition
      "
      aria-label="Toggle theme"
    >
      {/* ☀️ Sun (dark mode) */}
      <svg
        className="hidden dark:block"
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M9.99998 1.5415C10.4142 1.5415 10.75 1.87729 10.75 2.2915V3.5415C10.75 3.95572 10.4142 4.2915 9.99998 4.2915C9.58577 4.2915 9.24998 3.95572 9.24998 3.5415V2.2915C9.24998 1.87729 9.58577 1.5415 9.99998 1.5415Z"
          fill="currentColor"
        />
      </svg>

      {/* 🌙 Moon (light mode) */}
      <svg
        className="dark:hidden"
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
      >
        <path
          d="M17.4547 11.97C15.8869 12.4035 14.4721 13.0035 12.9154 13.0035C9.64678 13.0035 6.99707 10.3538 6.99707 7.08524C6.99707 5.52854 7.5971 4.11366 8.57989 3.05657"
          fill="currentColor"
        />
      </svg>
    </button>
  );
}
