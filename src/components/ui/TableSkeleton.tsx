interface TableSkeletonProps {
  columns?: number
  rows?: number
}

export function TableSkeleton({
  columns = 5,
  rows = 6,
}: TableSkeletonProps) {
  return (
    <div
      role="status"
      aria-label="Loading data"
      className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
    >
      <div className="border-b border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
          {Array.from({ length: columns }, (_, index) => (
            <div
              key={index}
              className="h-3 animate-pulse rounded bg-slate-200 dark:bg-slate-700"
            />
          ))}
        </div>
      </div>
      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {Array.from({ length: rows }, (_, row) => (
          <div
            key={row}
            className="grid gap-4 px-4 py-4"
            style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
          >
            {Array.from({ length: columns }, (_, column) => (
              <div
                key={column}
                className={`h-4 animate-pulse rounded bg-slate-100 dark:bg-slate-800 ${
                  column === 0 ? 'w-4/5' : 'w-3/5'
                }`}
              />
            ))}
          </div>
        ))}
      </div>
      <span className="sr-only">Loading data...</span>
    </div>
  )
}
