/**
 * Stat Card
 *
 * Metric panel with label, value, and an optional trend row: arrow + percent
 * on the left, a micro sparkline on the right. Direction carries the color —
 * up is green, down is red, flat (trendUp omitted) is muted, matching the
 * live dashboard's tiles.
 */

interface StatCardProps {
  label: string;
  value: string | number;
  /** Formatted delta, e.g. "-61.0%" — rendered next to the direction arrow. */
  trend?: string;
  /** true = up (green), false = down (red), omitted with trend = flat (muted). */
  trendUp?: boolean;
  /** Recent values for the micro sparkline; colored by trend direction. */
  spark?: number[];
}

function Sparkline({ points, className }: { points: number[]; className: string }) {
  const min = Math.min(...points);
  const span = Math.max(...points) - min || 1;
  const step = 100 / (points.length - 1);
  const path = points
    .map((v, i) => `${(i * step).toFixed(1)},${(26 - ((v - min) / span) * 24).toFixed(1)}`)
    .join(" ");

  return (
    <svg
      viewBox="0 0 100 28"
      preserveAspectRatio="none"
      className={`h-6 w-16 shrink-0 ${className}`}
      aria-hidden="true"
    >
      <polyline
        points={path}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

export default function StatCard({
  label,
  value,
  trend,
  trendUp,
  spark,
}: StatCardProps) {
  const direction =
    trendUp === undefined ? "flat" : trendUp ? "up" : "down";
  const tone =
    direction === "up"
      ? "text-success"
      : direction === "down"
        ? "text-error"
        : "text-muted";
  const arrow = direction === "up" ? "▲" : direction === "down" ? "▼" : "—";

  return (
    <div className="panel p-5">
      <p className="text-sm font-semibold text-faint">{label}</p>
      <p className="text-2xl font-semibold text-foreground mt-1">{value}</p>
      {(trend || spark) && (
        <div className="mt-2 flex items-center justify-between gap-3">
          {trend ? (
            <p className={`text-xs font-semibold ${tone}`}>
              <span aria-hidden="true">{arrow}</span>{" "}
              <span className="sr-only">
                {direction === "up" ? "Up" : direction === "down" ? "Down" : "Flat"}
              </span>
              {trend}
            </p>
          ) : (
            <span />
          )}
          {spark && spark.length > 1 && (
            <Sparkline points={spark} className={tone} />
          )}
        </div>
      )}
    </div>
  );
}
