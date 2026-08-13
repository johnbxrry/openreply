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

/* A loading placeholder shaped like a real panel: same chrome and padding
   as the loaded state, with a title bar and a body block shimmering inside.
   `body` sizes the inner block; `className` places the panel in a grid. */
export function PanelSkeleton({
  className = "",
  body = "h-40",
}: {
  className?: string;
  body?: string;
}) {
  return (
    <div className={`panel rounded p-4 sm:p-6 ${className}`}>
      <Skeleton className="h-4 w-32 max-w-full" />
      <Skeleton className={`mt-4 ${body}`} />
    </div>
  );
}
