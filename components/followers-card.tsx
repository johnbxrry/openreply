"use client";

/**
 * Followers Card
 *
 * Shopify-style followers panel. "This week" overlays the last 7 days as a
 * gradient area against the same weekdays one week earlier as a dashed line;
 * "This month" / "60 days" show a single gradient area over that window.
 * A table toggle lists the full stored history.
 */

import { useMemo, useState } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { FollowerHistoryPoint } from "@/lib/reports/follower-history";
import {
  buildWeekOverWeekSeries,
  buildWindowSeries,
  weekOverWeekGain,
  type WeekOverWeekPoint,
} from "@/lib/analytics-trends";

// Recharts sets these as SVG presentation attributes, where var() doesn't
// resolve, so they mirror the :root tokens in globals.css by literal value.
const SERIES_COLOR = "#4c88f7"; // --accent
const COMPARE_COLOR = "#909090"; // --muted
const GRID_COLOR = "#222222"; // --border
const AXIS_TEXT = "#909090"; // --muted

type ChartWindow = "week" | "month" | "sixty";

const WINDOW_OPTIONS: { value: ChartWindow; label: string }[] = [
  { value: "week", label: "This week" },
  { value: "month", label: "This month" },
  { value: "sixty", label: "60 days" },
];

function formatDay(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function formatSigned(n: number): string {
  return `${n > 0 ? "+" : ""}${n.toLocaleString()}`;
}

function formatCompact(n: number): string {
  if (Math.abs(n) >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (Math.abs(n) >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return `${n}`;
}

function WeekTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: WeekOverWeekPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  const delta =
    p.thisWeek !== null && p.lastWeek !== null ? p.thisWeek - p.lastWeek : null;
  return (
    <div className="rounded border border-border bg-surface px-3 py-2 text-xs shadow-lg">
      <p className="text-muted">{formatDay(p.thisDate)}</p>
      {p.thisWeek !== null && (
        <p className="mt-1 font-medium text-foreground">
          {p.thisWeek.toLocaleString()} followers
        </p>
      )}
      {p.lastWeek !== null && (
        <p className="mt-0.5 text-muted">
          Last week ({formatDay(p.lastDate)}): {p.lastWeek.toLocaleString()}
        </p>
      )}
      {delta !== null && delta !== 0 && (
        <p className={delta > 0 ? "text-success" : "text-error"}>
          {formatSigned(delta)} vs last week
        </p>
      )}
    </div>
  );
}

function WindowTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: FollowerHistoryPoint }>;
}) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="rounded border border-border bg-surface px-3 py-2 text-xs shadow-lg">
      <p className="text-muted">{formatDay(point.date)}</p>
      <p className="mt-1 font-medium text-foreground">
        {point.followers.toLocaleString()} followers
      </p>
      {point.delta !== null && point.delta !== 0 && (
        <p className={point.delta > 0 ? "text-success" : "text-error"}>
          {formatSigned(point.delta)} that day
        </p>
      )}
    </div>
  );
}

const axisProps = {
  tick: { fill: AXIS_TEXT, fontSize: 12 },
  stroke: GRID_COLOR,
  tickLine: false,
} as const;

export default function FollowersCard({
  history,
  followers,
}: {
  history: FollowerHistoryPoint[];
  followers: number | null;
}) {
  const [showTable, setShowTable] = useState(false);
  const [window, setWindow] = useState<ChartWindow>("week");

  const current = followers ?? history.at(-1)?.followers ?? null;
  const weekSeries = useMemo(() => buildWeekOverWeekSeries(history), [history]);
  const wow = useMemo(() => weekOverWeekGain(history), [history]);
  const windowSeries = useMemo(
    () => buildWindowSeries(history, window === "month" ? 30 : 60),
    [history, window]
  );

  const hasLastWeek = weekSeries.some((p) => p.lastWeek !== null);
  const chartablePoints =
    window === "week"
      ? weekSeries.filter((p) => p.thisWeek !== null).length
      : windowSeries.length;

  return (
    <div className="panel rounded p-4 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h2 className="text-lg font-normal tracking-[-0.02em] text-foreground">
            followers
          </h2>
          <p className="mt-1 text-sm text-muted">
            {current === null
              ? "Follower count unavailable"
              : `${current.toLocaleString()} now`}
            {wow.thisWeek !== null && (
              <>
                {" · "}
                <span className={wow.thisWeek >= 0 ? "text-success" : "text-error"}>
                  {formatSigned(wow.thisWeek)}
                </span>{" "}
                this week
              </>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={window}
            onChange={(e) => setWindow(e.target.value as ChartWindow)}
            className="rounded border border-border bg-transparent px-2 py-1.5 text-xs text-muted outline-none transition-colors hover:border-border-hover hover:text-foreground"
            aria-label="Chart window"
          >
            {WINDOW_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {history.length > 1 && (
            <button
              type="button"
              onClick={() => setShowTable((v) => !v)}
              className="rounded border border-border px-3 py-1.5 text-xs font-medium text-muted transition-colors hover:border-border-hover hover:text-foreground"
            >
              {showTable ? "Show chart" : "Show table"}
            </button>
          )}
        </div>
      </div>

      {chartablePoints < 2 && !showTable ? (
        <div className="mt-6 rounded border border-border bg-surface/60 p-6 text-center">
          <p className="text-sm text-foreground">Collecting follower history</p>
          <p className="mt-1 text-sm text-muted">
            {history.length === 0
              ? "No snapshots recorded yet."
              : "Not enough days recorded in this window yet."}{" "}
            A point is added daily — the chart appears once there are at least
            two.
          </p>
        </div>
      ) : showTable ? (
        <div className="no-scrollbar mt-4 max-h-72 overflow-y-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left text-xs uppercase tracking-wide text-muted">
                <th className="py-2 pr-4 font-medium">Date</th>
                <th className="py-2 px-3 font-medium text-right">Followers</th>
                <th className="py-2 pl-3 font-medium text-right">Change</th>
              </tr>
            </thead>
            <tbody>
              {[...history].reverse().map((p) => (
                <tr key={p.date} className="border-b border-border last:border-0">
                  <td className="py-2 pr-4 text-foreground">{formatDay(p.date)}</td>
                  <td className="py-2 px-3 text-right text-muted">
                    {p.followers.toLocaleString()}
                  </td>
                  <td className="py-2 pl-3 text-right text-muted">
                    {p.delta === null ? "—" : formatSigned(p.delta)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <div className="mt-6 h-56 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              {window === "week" ? (
                <ComposedChart
                  data={weekSeries}
                  margin={{ top: 8, right: 16, bottom: 0, left: 0 }}
                >
                  <defs>
                    <linearGradient id="followersFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={SERIES_COLOR} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={SERIES_COLOR} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke={GRID_COLOR} strokeDasharray="3 3" />
                  <XAxis dataKey="weekday" {...axisProps} />
                  <YAxis
                    {...axisProps}
                    tickFormatter={formatCompact}
                    width={52}
                    domain={["dataMin - 5", "dataMax + 5"]}
                  />
                  <Tooltip
                    content={<WeekTooltip />}
                    cursor={{ stroke: GRID_COLOR, strokeWidth: 1 }}
                  />
                  {hasLastWeek && (
                    <Line
                      type="monotone"
                      dataKey="lastWeek"
                      stroke={COMPARE_COLOR}
                      strokeWidth={1.5}
                      strokeDasharray="4 4"
                      dot={false}
                      connectNulls
                      isAnimationActive={false}
                    />
                  )}
                  <Area
                    type="monotone"
                    dataKey="thisWeek"
                    stroke={SERIES_COLOR}
                    strokeWidth={2}
                    fill="url(#followersFill)"
                    connectNulls
                    isAnimationActive={false}
                    activeDot={{
                      r: 4,
                      fill: SERIES_COLOR,
                      stroke: "#ffffff",
                      strokeWidth: 2,
                    }}
                  />
                </ComposedChart>
              ) : (
                <ComposedChart
                  data={windowSeries}
                  margin={{ top: 8, right: 16, bottom: 0, left: 0 }}
                >
                  <defs>
                    <linearGradient id="followersFillLong" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={SERIES_COLOR} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={SERIES_COLOR} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke={GRID_COLOR} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    {...axisProps}
                    tickFormatter={formatDay}
                    minTickGap={24}
                  />
                  <YAxis
                    {...axisProps}
                    tickFormatter={formatCompact}
                    width={52}
                    domain={["dataMin - 5", "dataMax + 5"]}
                  />
                  <Tooltip
                    content={<WindowTooltip />}
                    cursor={{ stroke: GRID_COLOR, strokeWidth: 1 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="followers"
                    stroke={SERIES_COLOR}
                    strokeWidth={2}
                    fill="url(#followersFillLong)"
                    connectNulls
                    isAnimationActive={false}
                    activeDot={{
                      r: 4,
                      fill: SERIES_COLOR,
                      stroke: "#ffffff",
                      strokeWidth: 2,
                    }}
                  />
                </ComposedChart>
              )}
            </ResponsiveContainer>
          </div>
          {window === "week" && (
            <div className="mt-3 flex items-center gap-4 text-xs text-muted">
              <span className="inline-flex items-center gap-1.5">
                <span
                  className="inline-block h-0.5 w-4"
                  style={{ background: SERIES_COLOR }}
                />
                this week
              </span>
              {hasLastWeek && (
                <span className="inline-flex items-center gap-1.5">
                  <span
                    className="inline-block w-4 border-t-2 border-dashed"
                    style={{ borderColor: COMPARE_COLOR }}
                  />
                  last week
                </span>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
