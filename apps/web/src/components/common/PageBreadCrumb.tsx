import { Link } from "react-router";

interface BreadcrumbProps {
  pageTitle: string;
}

const PageBreadcrumb: React.FC<BreadcrumbProps> = ({ pageTitle }) => {
  return (
    <div
      className="
        mb-6
        rounded-xl
        bg-white dark:bg-gray-900
        border border-gray-200 dark:border-gray-800
        px-6 py-4
      "
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          {pageTitle}
        </h2>

        <nav>
          <ol className="flex items-center gap-1.5">
            <li>
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400"
              >
                Home
                <svg
                  className="stroke-current"
                  width="17"
                  height="16"
                  viewBox="0 0 17 16"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </li>

            <li className="text-sm text-gray-800 dark:text-white/90">
              {pageTitle}
            </li>
          </ol>
        </nav>
      </div>
    </div>
  );
};

export default PageBreadcrumb;
