import { describe, expect, it } from "vitest";
import {
  averageMetricPerPost,
  buildWeekOverWeekSeries,
  buildWindowSeries,
  computeTrend,
  engagementTrend,
  followerGainInWindow,
  sparklineSeries,
  weekOverWeekGain,
  type TrendPost,
} from "@/lib/analytics-trends";
import type { FollowerHistoryPoint } from "@/lib/reports/follower-history";

function post(overrides: Partial<TrendPost> & { timestamp: string }): TrendPost {
  return {
    views: null,
    reach: null,
    likes: 0,
    comments: 0,
    saved: null,
    shares: null,
    ...overrides,
  };
}

/** n posts, one per day, with a metric value per post (oldest first). */
function postsWithLikes(likes: number[]): TrendPost[] {
  return likes.map((value, i) =>
    post({
      timestamp: `2026-08-${String(i + 1).padStart(2, "0")}T12:00:00+0000`,
      likes: value,
    })
  );
}

function historyOf(entries: Array<[string, number]>): FollowerHistoryPoint[] {
  return entries.map(([date, followers], i) => ({
    date,
    followers,
    delta: i === 0 ? null : followers - entries[i - 1][1],
  }));
}

describe("computeTrend", () => {
  it("detects a clear upward trend", () => {
    const trend = computeTrend(postsWithLikes([10, 10, 15, 15]), "likes");
    expect(trend.direction).toBe("up");
    expect(trend.pct).toBeCloseTo(0.5);
  });

  it("detects a clear downward trend", () => {
    const trend = computeTrend(postsWithLikes([20, 20, 10, 10]), "likes");
    expect(trend.direction).toBe("down");
    expect(trend.pct).toBeCloseTo(-0.5);
  });

  it("is neutral inside the threshold", () => {
    const trend = computeTrend(postsWithLikes([100, 100, 101, 100]), "likes");
    expect(trend.direction).toBe("neutral");
    expect(trend.pct).toBeCloseTo(0.005);
  });

  it("is neutral with fewer than 4 posts", () => {
    const trend = computeTrend(postsWithLikes([1, 100, 500]), "likes");
    expect(trend).toEqual({ direction: "neutral", pct: null });
  });

  it("is neutral when the older half sums to zero", () => {
    const trend = computeTrend(postsWithLikes([0, 0, 10, 10]), "likes");
    expect(trend).toEqual({ direction: "neutral", pct: null });
  });

  it("treats null metrics as zero rather than crashing", () => {
    const posts = [
      post({ timestamp: "2026-08-01T00:00:00+0000", views: 100 }),
      post({ timestamp: "2026-08-02T00:00:00+0000", views: null }),
      post({ timestamp: "2026-08-03T00:00:00+0000", views: 200 }),
      post({ timestamp: "2026-08-04T00:00:00+0000", views: null }),
    ];
    const trend = computeTrend(posts, "views");
    expect(trend.direction).toBe("up");
    expect(trend.pct).toBeCloseTo(1.0);
  });

  it("sorts unsorted input by timestamp", () => {
    const posts = postsWithLikes([10, 10, 15, 15]).reverse();
    expect(computeTrend(posts, "likes").direction).toBe("up");
  });
});

describe("sparklineSeries", () => {
  it("returns one value per post for small ranges, oldest first", () => {
    const series = sparklineSeries(postsWithLikes([1, 2, 3]), "likes");
    expect(series).toEqual([1, 2, 3]);
  });

  it("buckets larger ranges into chunk sums", () => {
    const series = sparklineSeries(
      postsWithLikes(Array.from({ length: 24 }, () => 1)),
      "likes",
      12
    );
    expect(series).toHaveLength(12);
    expect(series.every((v) => v === 2)).toBe(true);
  });

  it("returns [] for fewer than 2 posts", () => {
    expect(sparklineSeries(postsWithLikes([5]), "likes")).toEqual([]);
  });
});

describe("averageMetricPerPost", () => {
  it("averages only non-null values", () => {
    const posts = [
      post({ timestamp: "2026-08-01T00:00:00+0000", views: 100 }),
      post({ timestamp: "2026-08-02T00:00:00+0000", views: null }),
      post({ timestamp: "2026-08-03T00:00:00+0000", views: 300 }),
    ];
    expect(averageMetricPerPost(posts, "views")).toBe(200);
  });

  it("returns null when every value is null", () => {
    const posts = [post({ timestamp: "2026-08-01T00:00:00+0000" })];
    expect(averageMetricPerPost(posts, "views")).toBeNull();
  });
});

describe("followerGainInWindow", () => {
  const history = historyOf([
    ["2026-08-01", 100],
    ["2026-08-05", 110],
    ["2026-08-10", 130],
  ]);

  it("computes last minus first inside the window", () => {
    expect(followerGainInWindow(history, "2026-08-01")).toBe(30);
    expect(followerGainInWindow(history, "2026-08-02", "2026-08-10")).toBe(20);
  });

  it("returns null with fewer than 2 points in the window", () => {
    expect(followerGainInWindow(history, "2026-08-09")).toBeNull();
    expect(followerGainInWindow(history, "2026-09-01")).toBeNull();
  });
});

describe("weekOverWeekGain", () => {
  const today = new Date("2026-08-14T12:00:00");

  it("compares this week's gain against last week's", () => {
    const history = historyOf([
      ["2026-08-01", 100],
      ["2026-08-07", 110], // last week: +5 (Aug 1–7 window starts Aug 1)
      ["2026-08-08", 112],
      ["2026-08-14", 130], // this week: +18
    ]);
    const result = weekOverWeekGain(history, today);
    expect(result.thisWeek).toBe(18);
    expect(result.lastWeek).toBe(10);
    expect(result.trend.direction).toBe("up");
  });

  it("returns nulls on empty history", () => {
    const result = weekOverWeekGain([], today);
    expect(result.thisWeek).toBeNull();
    expect(result.lastWeek).toBeNull();
    expect(result.trend).toEqual({ direction: "neutral", pct: null });
  });
});

describe("buildWeekOverWeekSeries", () => {
  const today = new Date("2026-08-14T12:00:00");

  it("aligns each of the last 7 days with the same day a week earlier", () => {
    const history = historyOf([
      ["2026-08-07", 100],
      ["2026-08-14", 120],
    ]);
    const rows = buildWeekOverWeekSeries(history, today);
    expect(rows).toHaveLength(7);
    const last = rows[6];
    expect(last.thisDate).toBe("2026-08-14");
    expect(last.lastDate).toBe("2026-08-07");
    expect(last.thisWeek).toBe(120);
    expect(last.lastWeek).toBe(100);
  });

  it("leaves missing snapshot days null", () => {
    const rows = buildWeekOverWeekSeries(
      historyOf([["2026-08-14", 120]]),
      today
    );
    expect(rows[6].thisWeek).toBe(120);
    expect(rows[5].thisWeek).toBeNull();
    expect(rows[6].lastWeek).toBeNull();
  });
});

describe("buildWindowSeries", () => {
  it("keeps only points within the last N days", () => {
    const today = new Date("2026-08-14T12:00:00");
    const history = historyOf([
      ["2026-06-01", 90],
      ["2026-08-01", 100],
      ["2026-08-14", 120],
    ]);
    const series = buildWindowSeries(history, 30, today);
    expect(series.map((p) => p.date)).toEqual(["2026-08-01", "2026-08-14"]);
  });
});

describe("engagementTrend", () => {
  it("trends up when the recent engagement rate is higher", () => {
    const posts = [
      post({ timestamp: "2026-08-01T00:00:00+0000", reach: 1000, likes: 10 }),
      post({ timestamp: "2026-08-02T00:00:00+0000", reach: 1000, likes: 10 }),
      post({ timestamp: "2026-08-03T00:00:00+0000", reach: 1000, likes: 30 }),
      post({ timestamp: "2026-08-04T00:00:00+0000", reach: 1000, likes: 30 }),
    ];
    expect(engagementTrend(posts).direction).toBe("up");
  });

  it("is neutral when a half has zero reach", () => {
    const posts = [
      post({ timestamp: "2026-08-01T00:00:00+0000", likes: 10 }),
      post({ timestamp: "2026-08-02T00:00:00+0000", likes: 10 }),
      post({ timestamp: "2026-08-03T00:00:00+0000", reach: 1000, likes: 30 }),
      post({ timestamp: "2026-08-04T00:00:00+0000", reach: 1000, likes: 30 }),
    ];
    expect(engagementTrend(posts)).toEqual({ direction: "neutral", pct: null });
  });
});
