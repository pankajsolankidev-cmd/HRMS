import { useState } from "react";

interface DeleteConfirmProps<T> {
  title?: string;
  description?: string;
  loading?: boolean;
  onConfirm: (value: T) => void;
  children: (onDelete: (value: T) => void) => React.ReactNode;
}

export default function DeleteConfirm<T>({
  title = "Delete Confirmation",
  description = "Are you sure you want to delete this item? This action cannot be undone.",
  loading,
  onConfirm,
  children,
}: DeleteConfirmProps<T>) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<T | null>(null);

  const onDelete = (val: T) => {
    setValue(val);
    setOpen(true);
  };

  const close = () => {
    setOpen(false);
    setValue(null);
  };

  return (
    <>
      {children(onDelete)}

      {open && (
        <div className="fixed inset-0 z-999 flex items-center justify-center bg-black/40">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg dark:bg-gray-600">
            <h3 className="text-lg font-semibold text-gray-800 dark:text-white">
              {title}
            </h3>

            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {description}
            </p>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={close}
                disabled={loading}
                className="rounded-lg border px-4 py-2 text-sm text-gray-700 dark:text-gray-300 disabled:opacity-50"
              >
                Cancel
              </button>

              <button
                onClick={() => {
                  if (value) {
                    onConfirm(value);
                    close();
                  }
                }}
                disabled={loading}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white disabled:opacity-50"
              >
                {loading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
