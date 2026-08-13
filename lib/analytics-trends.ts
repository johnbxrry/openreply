/**
 * Analytics Trends
 *
 * Pure helpers behind the Instagram analytics dashboard: trend direction for
 * metric tiles, sparkline series, per-post averages, and follower-history
 * windows for the week-over-week chart. No I/O — everything is unit-testable.
 */

import type { FollowerHistoryPoint } from "@/lib/reports/follower-history";

export type TrendDirection = "up" | "neutral" | "down";

export interface Trend {
  direction: TrendDirection;
  /** Fractional change (0.12 = +12%); null when there isn't enough data. */
  pct: number | null;
}

/** Structural subset of OverviewPost so this lib doesn't import a route file. */
export interface TrendPost {
  timestamp: string;
  views: number | null;
  reach: number | null;
  likes: number;
  comments: number;
  saved: number | null;
  shares: number | null;
}

export type MetricKey = "views" | "reach" | "likes" | "comments" | "saved" | "shares";

/** |change| below this is "neutral" — avoids flapping arrows on noise. */
const NEUTRAL_THRESHOLD = 0.025;

export const NEUTRAL_TREND: Trend = { direction: "neutral", pct: null };

function sortAsc(posts: TrendPost[]): TrendPost[] {
  return [...posts].sort(
    (a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp)
  );
}

function sumMetric(posts: TrendPost[], metric: MetricKey): number {
  return posts.reduce((sum, p) => sum + (p[metric] ?? 0), 0);
}

function trendFromChange(pct: number): Trend {
  if (pct > NEUTRAL_THRESHOLD) return { direction: "up", pct };
  if (pct < -NEUTRAL_THRESHOLD) return { direction: "down", pct };
  return { direction: "neutral", pct };
}

/**
 * Compare the recent half of the selected posts against the older half.
 * The split is by post count, not calendar time — on "all time" ranges the
 * older half can span far longer, which is accepted: the question answered
 * is "are my recent posts doing better than the ones before them?"
 */
export function computeTrend(posts: TrendPost[], metric: MetricKey): Trend {
  if (posts.length < 4) return NEUTRAL_TREND;
  const sorted = sortAsc(posts);
  const mid = Math.floor(sorted.length / 2);
  const olderSum = sumMetric(sorted.slice(0, mid), metric);
  const recentSum = sumMetric(sorted.slice(mid), metric);
  if (olderSum === 0) return NEUTRAL_TREND;
  return trendFromChange((recentSum - olderSum) / olderSum);
}

export interface SparklinePoint {
  date: string; // ISO yyyy-mm-dd of the post (or the last post in a bucket)
  value: number;
}

/**
 * Oldest→newest series for a tile sparkline. One point per post when the
 * range is small; otherwise posts are grouped into `buckets` equal-count
 * chunks and summed so the line stays readable. Each point carries the date
 * so hover tooltips can label it.
 */
export function sparklineSeries(
  posts: TrendPost[],
  metric: MetricKey,
  buckets = 12
): SparklinePoint[] {
  if (posts.length < 2) return [];
  const sorted = sortAsc(posts);
  if (sorted.length <= buckets) {
    return sorted.map((p) => ({
      date: p.timestamp.slice(0, 10),
      value: p[metric] ?? 0,
    }));
  }
  const chunkSize = Math.ceil(sorted.length / buckets);
  const series: SparklinePoint[] = [];
  for (let i = 0; i < sorted.length; i += chunkSize) {
    const chunk = sorted.slice(i, i + chunkSize);
    series.push({
      date: chunk[chunk.length - 1].timestamp.slice(0, 10),
      value: sumMetric(chunk, metric),
    });
  }
  return series;
}

/** Mean over posts where the metric is present; null when none qualify. */
export function averageMetricPerPost(
  posts: TrendPost[],
  metric: MetricKey
): number | null {
  const values = posts
    .map((p) => p[metric])
    .filter((v): v is number => v !== null);
  if (values.length === 0) return null;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** Net follower change inside [fromIso, toIso]; null with < 2 points there. */
export function followerGainInWindow(
  history: FollowerHistoryPoint[],
  fromIso: string,
  toIso?: string
): number | null {
  const points = history.filter(
    (p) => p.date >= fromIso && (toIso === undefined || p.date <= toIso)
  );
  if (points.length < 2) return null;
  return points[points.length - 1].followers - points[0].followers;
}

function isoDay(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

function daysAgo(base: Date, days: number): Date {
  const d = new Date(base);
  d.setDate(d.getDate() - days);
  return d;
}

/** Follower gain this week ([today-6, today]) vs last week ([today-13, today-7]). */
export function weekOverWeekGain(
  history: FollowerHistoryPoint[],
  today: Date = new Date()
): { thisWeek: number | null; lastWeek: number | null; trend: Trend } {
  const thisWeek = followerGainInWindow(
    history,
    isoDay(daysAgo(today, 6)),
    isoDay(today)
  );
  const lastWeek = followerGainInWindow(
    history,
    isoDay(daysAgo(today, 13)),
    isoDay(daysAgo(today, 7))
  );
  let trend: Trend = NEUTRAL_TREND;
  if (thisWeek !== null && lastWeek !== null) {
    if (lastWeek === 0) {
      trend =
        thisWeek === 0
          ? { direction: "neutral", pct: 0 }
          : { direction: thisWeek > 0 ? "up" : "down", pct: null };
    } else {
      trend = trendFromChange((thisWeek - lastWeek) / Math.abs(lastWeek));
    }
  }
  return { thisWeek, lastWeek, trend };
}

export interface WeekOverWeekPoint {
  weekday: string; // label of the this-week date, e.g. "Thu"
  thisDate: string;
  lastDate: string;
  thisWeek: number | null; // follower total that day
  lastWeek: number | null;
}

/**
 * Seven rows ending today: each day of the last 7 days paired with the same
 * weekday one week earlier. Missing snapshots stay null (charts connectNulls).
 */
export function buildWeekOverWeekSeries(
  history: FollowerHistoryPoint[],
  today: Date = new Date()
): WeekOverWeekPoint[] {
  const byDate = new Map(history.map((p) => [p.date, p.followers]));
  const rows: WeekOverWeekPoint[] = [];
  for (let i = 6; i >= 0; i--) {
    const thisDay = daysAgo(today, i);
    const lastDay = daysAgo(today, i + 7);
    const thisDate = isoDay(thisDay);
    const lastDate = isoDay(lastDay);
    rows.push({
      weekday: thisDay.toLocaleDateString("en-US", { weekday: "short" }),
      thisDate,
      lastDate,
      thisWeek: byDate.get(thisDate) ?? null,
      lastWeek: byDate.get(lastDate) ?? null,
    });
  }
  return rows;
}

/** History points within the last `days` days (for month/60-day chart views). */
export function buildWindowSeries(
  history: FollowerHistoryPoint[],
  days: number,
  today: Date = new Date()
): FollowerHistoryPoint[] {
  const from = isoDay(daysAgo(today, days - 1));
  return history.filter((p) => p.date >= from);
}

/**
 * Trend of engagement rate — Σ(likes+comments+saved+shares) / Σreach — for
 * the recent half of posts vs the older half.
 */
export function engagementTrend(posts: TrendPost[]): Trend {
  if (posts.length < 4) return NEUTRAL_TREND;
  const sorted = sortAsc(posts);
  const mid = Math.floor(sorted.length / 2);
  const rate = (half: TrendPost[]): number | null => {
    const reach = sumMetric(half, "reach");
    if (reach === 0) return null;
    const interactions =
      sumMetric(half, "likes") +
      sumMetric(half, "comments") +
      sumMetric(half, "saved") +
      sumMetric(half, "shares");
    return interactions / reach;
  };
  const older = rate(sorted.slice(0, mid));
  const recent = rate(sorted.slice(mid));
  if (older === null || recent === null || older === 0) return NEUTRAL_TREND;
  return trendFromChange((recent - older) / older);
}
