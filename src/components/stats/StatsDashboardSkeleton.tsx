"use client";


function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-gray-100 animate-pulse rounded-lg ${className}`}
      aria-hidden="true"
    />
  );
}

export function StatsDashboardSkeleton() {
  return (
    <div className="space-y-4" aria-label="Carregando estatísticas...">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Skeleton className="h-72" />
        <Skeleton className="h-72" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}