"use client";

/**
 * DM Chart
 *
 * Line chart of DMs sent per day (or per month on the year range), with the
 * same hover treatment as the followers-over-time chart: a tooltip showing
 * the date and the DM count.
 */

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export interface DmChartPoint {
  date: string; // ISO yyyy-mm-dd
  count: number;
}

// Recharts sets these as SVG presentation attributes, where var() doesn't
// resolve, so they mirror the :root tokens in globals.css by literal value.
const SERIES_COLOR = "#4c88f7"; // --accent
const GRID_COLOR = "#222222"; // --border
const AXIS_TEXT = "#909090"; // --muted

function parseDay(iso: string): Date | null {
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d;
}

function formatTick(iso: string, monthly: boolean): string {
  const d = parseDay(iso);
  if (!d) return iso;
  return monthly
    ? d.toLocaleDateString("en-US", { month: "short" })
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatFull(iso: string, monthly: boolean): string {
  const d = parseDay(iso);
  if (!d) return iso;
  return monthly
    ? d.toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : d.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
}

function ChartTooltip({
  active,
  payload,
  monthly,
}: {
  active?: boolean;
  payload?: Array<{ payload: DmChartPoint }>;
  monthly: boolean;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;

  return (
    <div className="rounded border border-border bg-surface px-3 py-2 text-xs shadow-lg">
      <p className="text-muted">{formatFull(point.date, monthly)}</p>
      <p className="mt-1 font-medium text-foreground">
        {point.count.toLocaleString()} DM{point.count === 1 ? "" : "s"}
      </p>
    </div>
  );
}

export default function DmChart({
  data,
  monthly = false,
}: {
  data: DmChartPoint[];
  monthly?: boolean;
}) {
  return (
    <div className="h-48 sm:h-56">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid
            vertical={false}
            stroke={GRID_COLOR}
            strokeDasharray="3 3"
          />
          <XAxis
            dataKey="date"
            tickFormatter={(iso: string) => formatTick(iso, monthly)}
            tick={{ fill: AXIS_TEXT, fontSize: 12 }}
            stroke={GRID_COLOR}
            tickLine={false}
            minTickGap={24}
          />
          <YAxis
            tick={{ fill: AXIS_TEXT, fontSize: 12 }}
            stroke={GRID_COLOR}
            tickLine={false}
            width={40}
            allowDecimals={false}
            domain={[0, "dataMax + 1"]}
          />
          <Tooltip
            content={<ChartTooltip monthly={monthly} />}
            cursor={{ stroke: GRID_COLOR, strokeWidth: 1 }}
          />
          <Line
            type="monotone"
            dataKey="count"
            stroke={SERIES_COLOR}
            strokeWidth={2}
            dot={false}
            activeDot={{
              r: 4,
              fill: SERIES_COLOR,
              stroke: "#ffffff",
              strokeWidth: 2,
            }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
