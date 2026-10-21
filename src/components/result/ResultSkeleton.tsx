const shimmer = "bg-surface-2 animate-pulse rounded-xl";

/** Placeholder while the result streams in. */
export function ResultSkeleton() {
  return (
    <div aria-busy="true" aria-label="Memuat hasil" className="mx-auto flex w-full max-w-4xl flex-col gap-6 px-5 pb-16 sm:px-8">
      <div className="bg-surface border-border rounded-card flex flex-col items-center gap-8 border p-6 sm:flex-row sm:p-8">
        <div className="bg-surface-2 size-48 shrink-0 animate-pulse rounded-full sm:size-52" />
        <div className="flex w-full flex-col gap-3">
          <div className={`${shimmer} h-4 w-28`} />
          <div className={`${shimmer} h-8 w-2/3`} />
          <div className={`${shimmer} h-4 w-1/2`} />
          <div className={`${shimmer} mt-4 h-11 w-full rounded-full sm:w-72`} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className={`${shimmer} h-24 rounded-2xl`} />
        ))}
      </div>
      <div className={`${shimmer} rounded-card h-56`} />
    </div>
  );
}
