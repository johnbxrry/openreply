/**
 * Sparkline
 *
 * Tiny inline-SVG trend line for stat tiles. Deliberately not Recharts — six
 * chart instances would be heavy for a 96×28 decoration. Colors are literal
 * hex mirroring the :root tokens (SVG presentation attributes can't resolve
 * var()): --success #22c55e, --muted #909090, --error #ef4444.
 */

import type { TrendDirection } from "@/lib/analytics-trends";

const STROKE: Record<TrendDirection, string> = {
  up: "#22c55e",
  neutral: "#909090",
  down: "#ef4444",
};

export default function Sparkline({
  values,
  direction,
  width = 96,
  height = 28,
  className = "",
}: {
  values: number[]; // oldest → newest
  direction: TrendDirection;
  width?: number;
  height?: number;
  className?: string;
}) {
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = 2;
  const span = max - min;
  const points = values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width;
      // Flat series draws a midline instead of hugging an edge.
      const y =
        span === 0
          ? height / 2
          : pad + (1 - (v - min) / span) * (height - pad * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className}
      style={{ width, height }}
      aria-hidden="true"
    >
      <polyline
        points={points}
        fill="none"
        stroke={STROKE[direction]}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
