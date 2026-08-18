/* Shimmer loading placeholders. The .skeleton class (globals.css) owns the
   background and sweep animation; size and shape via className. */

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`skeleton ${className}`} />;
}

/* Matches StatCard exactly: label line + value line in a p-5 panel. */
export function StatTileSkeleton() {
  return (
    <div className="panel p-5">
      <Skeleton className="h-4 w-16" />
      <Skeleton className="mt-2 h-7 w-20" />
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
    <div className={`panel p-5 sm:p-7 ${className}`}>
      <Skeleton className="h-4 w-32 max-w-full" />
      <Skeleton className={`mt-4 ${body}`} />
    </div>
  );
}
