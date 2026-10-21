const shimmer = "bg-surface-2 animate-pulse rounded-xl";

/** Placeholder while the exam session streams in. */
export function ExamSkeleton() {
  return (
    <div aria-busy="true" aria-label="Memuat soal" className="flex flex-1 flex-col">
      <div className="border-border h-16 border-b" />
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 pt-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="bg-surface border-border rounded-card flex flex-col gap-5 border p-7">
          <div className={`${shimmer} h-5 w-40`} />
          <div className={`${shimmer} h-7 w-full`} />
          <div className={`${shimmer} h-7 w-3/4`} />
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className={`${shimmer} h-14 w-full rounded-2xl`} />
          ))}
        </div>
        <div className="hidden flex-col gap-3 lg:flex">
          <div className={`${shimmer} h-5 w-32`} />
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 25 }, (_, i) => (
              <div key={i} className={`${shimmer} h-10`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
