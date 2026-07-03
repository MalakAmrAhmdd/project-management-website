export function ProjectSkeleton() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="h-4 w-16 bg-surface-200 rounded mb-3" />
      <div className="h-4 w-3/4 bg-surface-200 rounded mb-2" />
      <div className="h-3 w-full bg-surface-100 rounded mb-4" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-3 w-full bg-surface-100 rounded" />
        <div className="h-3 w-full bg-surface-100 rounded" />
        <div className="h-3 w-full bg-surface-100 rounded" />
        <div className="h-3 w-full bg-surface-100 rounded" />
      </div>
    </div>
  );
}

export function ProjectsLoadingGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <ProjectSkeleton key={i} />
      ))}
    </div>
  );
}
