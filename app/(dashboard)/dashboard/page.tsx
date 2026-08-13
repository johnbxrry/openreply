"use client";

/**
 * Dashboard Home Page
 *
 * Overview cards, 7-day chart, and recent activity feed.
 */

import { useEffect, useState } from "react";
import AccountSelect, { type AccountOption } from "@/components/account-select";
import DmChart from "@/components/dm-chart";
import { PanelSkeleton, Skeleton, StatTileSkeleton } from "@/components/skeleton";
import StatCard from "@/components/stat-card";
import StatusBadge from "@/components/status-badge";

type ChartRange = "week" | "month" | "year";

const RANGE_OPTIONS: { value: ChartRange; label: string; title: string }[] = [
  { value: "week", label: "This week", title: "DMs (This Week)" },
  { value: "month", label: "This month", title: "DMs (This Month)" },
  { value: "year", label: "This year", title: "DMs (This Year)" },
];

interface DashboardStats {
  userName: string | null;
  contactsCount: number;
  totalAutomations: number;
  activeAutomations: number;
  dmsSentToday: number;
  dmsSentWeek: number;
  dmsSentMonth: number;
  dmsSkippedMonth: number;
  dmsFailedMonth: number;
  totalDMs: number;
  clicksThisMonth: number;
  totalClicks: number;
  ctrThisMonth: number;
  instagramAccounts: AccountOption[];
  selectedInstagramAccountId: string | null;
  topKeywords: { keyword: string; count: number }[];
  dailyDMs: { date: string; count: number }[];
  recentLogs: Array<{
    id: string;
    commenterName: string | null;
    commentText: string;
    status: string;
    createdAt: string;
    automation: { name: string };
    instagramAccount?: { username: string };
  }>;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAccountId, setSelectedAccountId] = useState("all");
  const [range, setRange] = useState<ChartRange>("week");

  useEffect(() => {
    const params = new URLSearchParams();
    if (selectedAccountId !== "all") {
      params.set("instagramAccountId", selectedAccountId);
    }
    if (range !== "week") {
      params.set("range", range);
    }

    fetch(`/api/dashboard/stats${params.size ? `?${params}` : ""}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setStats(data.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [selectedAccountId, range]);

  function handleAccountChange(accountId: string) {
    setLoading(true);
    setSelectedAccountId(accountId);
  }

  function handleRangeChange(next: ChartRange) {
    setLoading(true);
    setRange(next);
  }

  const rangeOption =
    RANGE_OPTIONS.find((o) => o.value === range) ?? RANGE_OPTIONS[0];

  if (loading) {
    // Mirrors the loaded layout: greeting, stat grid, chart/keywords/activity.
    return (
      <div className="space-y-8">
        <div>
          <Skeleton className="h-8 w-56" />
          <Skeleton className="mt-2 h-4 w-72 max-w-full" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
          {[...Array(6)].map((_, i) => (
            <StatTileSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 sm:gap-6">
          <PanelSkeleton className="lg:col-span-3" body="h-44" />
          <PanelSkeleton className="lg:col-span-1" body="h-44" />
          <PanelSkeleton className="lg:col-span-2" body="h-44" />
        </div>
      </div>
    );
  }

  const connectedCount = stats?.instagramAccounts.length ?? 0;

  return (
    <div className="space-y-8">
      {/* Greeting header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-medium text-foreground sm:text-3xl">
            Hello, {stats?.userName ?? "there"}!
          </h1>
          <p className="mt-1 text-sm text-muted">
            {connectedCount} connected{" "}
            {connectedCount === 1 ? "account" : "accounts"}
            {" · "}
            {stats?.contactsCount ?? 0}{" "}
            {stats?.contactsCount === 1 ? "contact" : "contacts"}
            {" · "}
            <a href="/logs" className="text-accent hover:underline">
              See activity
            </a>
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
          <label className="flex flex-col gap-2 text-sm">
            <span className="text-xs font-medium uppercase tracking-wide text-muted">
              Range
            </span>
            <select
              value={range}
              onChange={(e) => handleRangeChange(e.target.value as ChartRange)}
              className="border-0 bg-transparent py-2 pr-1 text-sm text-foreground outline-none"
            >
              {RANGE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
          {stats && stats.instagramAccounts.length > 1 && (
            <AccountSelect
              accounts={stats.instagramAccounts}
              value={selectedAccountId}
              onChange={handleAccountChange}
            />
          )}
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
        <StatCard
          label="Active Campaigns"
          value={stats?.activeAutomations ?? 0}
        />
        <StatCard label="DMs Sent" value={stats?.dmsSentMonth ?? 0} />
        <StatCard label="Skipped" value={stats?.dmsSkippedMonth ?? 0} />
        <StatCard label="Failed" value={stats?.dmsFailedMonth ?? 0} />
        <StatCard label="Clicks" value={stats?.clicksThisMonth ?? 0} />
        <StatCard label="CTR" value={`${stats?.ctrThisMonth ?? 0}%`} />
      </div>

      {/* Chart + Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 sm:gap-6">
        {/* DM chart */}
        <div className="lg:col-span-3 panel rounded p-4 sm:p-6">
          <h2 className="text-sm font-medium text-foreground mb-6">
            {rangeOption.title}
          </h2>
          <DmChart data={stats?.dailyDMs ?? []} monthly={range === "year"} />
        </div>

        {/* Top Keywords */}
        <div className="lg:col-span-1 panel rounded p-4 sm:p-6">
          <h2 className="text-sm font-medium text-foreground mb-4">Top Keywords</h2>
          <div className="space-y-3">
            {stats?.topKeywords.length === 0 && (
              <p className="text-sm text-muted py-8">No keyword matches yet</p>
            )}
            {stats?.topKeywords.map((keyword) => (
              <div key={keyword.keyword} className="flex items-center justify-between gap-3">
                <span className="truncate text-sm font-medium text-foreground">
                  {keyword.keyword}
                </span>
                <span className="text-xs text-muted">{keyword.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 panel rounded p-4 sm:p-6">
          <h2 className="text-sm font-medium text-foreground mb-4">Recent Activity</h2>
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {stats?.recentLogs.length === 0 && (
              <p className="text-sm text-muted text-center py-8">No activity yet</p>
            )}
            {stats?.recentLogs.map((log) => (
              <div
                key={log.id}
                className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">
                    @{log.commenterName ?? "unknown"}
                  </p>
                  <p className="text-xs text-muted truncate">
                    {log.instagramAccount
                      ? `@${log.instagramAccount.username} · `
                      : ""}
                    {log.commentText}
                  </p>
                </div>
                <StatusBadge status={log.status} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
