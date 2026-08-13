/* Shimmer loading placeholders. The .skeleton class (globals.css) owns the
   background and sweep animation; size and shape via className. */

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton ${className}`} />;
}

/* Matches the stat-tile layout used on the dashboard and overview grids. */
export function StatTileSkeleton() {
  return (
    <div className="panel rounded p-4 sm:p-5">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="mt-3 h-6 w-20" />
    </div>
  );
}
