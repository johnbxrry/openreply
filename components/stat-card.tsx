/**
 * Stat Card
 *
 * Metric panel with label, value, and an optional trend row: direction
 * arrow + percent change on the left, micro sparkline on the right.
 */

import type { SparklinePoint, Trend } from "@/lib/analytics-trends";
import Sparkline from "@/components/sparkline";

const ARROWS = { up: "▲", neutral: "—", down: "▼" } as const;
const COLORS = {
  up: "text-success",
  neutral: "text-muted",
  down: "text-error",
} as const;

function formatPct(pct: number | null): string {
  if (pct === null) return "—";
  const value = pct * 100;
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}

interface StatCardProps {
  label: string;
  value: string | number;
  trend?: Trend;
  spark?: SparklinePoint[];
}

export default function StatCard({ label, value, trend, spark }: StatCardProps) {
  return (
    <div className="panel rounded p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="text-2xl font-medium text-foreground mt-1">{value}</p>
      {trend && (
        <div className="mt-2 flex items-center justify-between gap-2">
          <span className={`text-xs ${COLORS[trend.direction]}`}>
            {ARROWS[trend.direction]} {formatPct(trend.pct)}
          </span>
          {spark && spark.length > 1 && (
            <Sparkline
              points={spark}
              direction={trend.direction}
              width={72}
              height={24}
              className="shrink-0"
            />
          )}
        </div>
      )}
    </div>
  );
}
