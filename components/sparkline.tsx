"use client";

/**
 * Sparkline
 *
 * Scaled-down version of the analytics area chart for stat tiles: smooth
 * monotone curve, gradient fill, and a hover tooltip showing date + value.
 * Colors are literal hex per theme (SVG presentation attributes can't
 * resolve var()) — see lib/chart-theme.ts.
 */

import { useId } from "react";
import { Area, AreaChart, Tooltip } from "recharts";
import type { SparklinePoint, TrendDirection } from "@/lib/analytics-trends";
import { useTheme } from "@/components/theme-provider";
import { CHART_COLORS, TREND_COLORS } from "@/lib/chart-theme";

function formatDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function SparkTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: SparklinePoint }>;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded border border-border bg-surface px-2 py-1 text-[11px] shadow-lg whitespace-nowrap">
      <span className="text-muted">{formatDay(point.date)}</span>{" "}
      <span className="font-semibold text-foreground">
        {point.value.toLocaleString()}
      </span>
    </div>
  );
}

export default function Sparkline({
  points,
  direction,
  width = 80,
  height = 26,
  className = "",
}: {
  points: SparklinePoint[]; // oldest → newest
  direction: TrendDirection;
  width?: number;
  height?: number;
  className?: string;
}) {
  const gradientId = useId();
  const { theme } = useTheme();
  if (points.length < 2) return null;
  const color = TREND_COLORS[theme][direction];
  const dotRing = CHART_COLORS[theme].dotRing;

  return (
    // overflow-visible lets the hover dot render past the tiny viewBox edge
    // instead of clipping; outline-none + no accessibility layer keep the
    // decoration from taking focus and drawing the global focus ring.
    <div
      className={`outline-none [&_svg]:overflow-visible [&_.recharts-wrapper]:outline-none ${className}`}
      style={{ width, height }}
    >
      <AreaChart
        width={width}
        height={height}
        data={points}
        margin={{ top: 5, right: 2, bottom: 5, left: 2 }}
        accessibilityLayer={false}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <Tooltip
          content={<SparkTooltip />}
          cursor={{ stroke: color, strokeWidth: 1, strokeOpacity: 0.4 }}
          allowEscapeViewBox={{ x: true, y: true }}
          wrapperStyle={{ zIndex: 40 }}
          isAnimationActive={false}
        />
        <Area
          type="monotone"
          dataKey="value"
          stroke={color}
          strokeWidth={1.5}
          fill={`url(#${gradientId})`}
          isAnimationActive={false}
          activeDot={{ r: 3, fill: color, stroke: dotRing, strokeWidth: 1.5 }}
        />
      </AreaChart>
    </div>
  );
}
