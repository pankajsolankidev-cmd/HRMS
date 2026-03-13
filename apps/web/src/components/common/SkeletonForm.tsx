interface Skeleton {
  loading: boolean;
  children: React.ReactNode;
}

export default function Skeleton({ loading, children }: Skeleton) {
  return (
    <div className="relative">
      {children}

      {loading && (
        <div
          className="absolute inset-0 flex items-center justify-center
                        bg-white/60 dark:bg-black/40 backdrop-blur-xs rounded-lg"
        >
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-gray-300 border-t-blue-500" />
        </div>
      )}
    </div>
  );
}
