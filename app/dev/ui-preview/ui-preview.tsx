"use client";

/**
 * TEMPORARY — dev-only UI preview for the Aire rebrand. Delete before merging
 * to main.
 *
 * Mirrors the real pages with static data — same components, same labels, same
 * layout classes — so the restyle can be judged against the true content:
 *   1. DM analytics (app/(dashboard)/dashboard/page.tsx)
 *   2. Overview (app/(dashboard)/overview/page.tsx)
 *   3. An inbox thread excerpt (app/(dashboard)/inbox/page.tsx)
 *   4. A styleguide strip (buttons, badges, skeletons, type ramp)
 */

import DashboardShell from "@/components/dashboard-shell";
import DmChart, { type DmChartPoint } from "@/components/dm-chart";
import FollowerChart, {
  type FollowerChartPoint,
} from "@/components/follower-chart";
import StatCard from "@/components/stat-card";
import StatusBadge from "@/components/status-badge";
import { PanelSkeleton, Skeleton, StatTileSkeleton } from "@/components/skeleton";

const dailyDMs: DmChartPoint[] = [
  { date: "2026-08-11", count: 96 },
  { date: "2026-08-12", count: 132 },
  { date: "2026-08-13", count: 118 },
  { date: "2026-08-14", count: 171 },
  { date: "2026-08-15", count: 203 },
  { date: "2026-08-16", count: 244 },
  { date: "2026-08-17", count: 240 },
];

const followerHistory: FollowerChartPoint[] = [
  { date: "2026-08-04", followers: 47898, delta: null },
  { date: "2026-08-05", followers: 47921, delta: 23 },
  { date: "2026-08-06", followers: 47940, delta: 19 },
  { date: "2026-08-07", followers: 47934, delta: -6 },
  { date: "2026-08-08", followers: 47969, delta: 35 },
  { date: "2026-08-09", followers: 48004, delta: 35 },
  { date: "2026-08-10", followers: 48031, delta: 27 },
  { date: "2026-08-11", followers: 48042, delta: 11 },
  { date: "2026-08-12", followers: 48066, delta: 24 },
  { date: "2026-08-13", followers: 48095, delta: 29 },
  { date: "2026-08-14", followers: 48121, delta: 26 },
  { date: "2026-08-15", followers: 48140, delta: 19 },
  { date: "2026-08-16", followers: 48181, delta: 41 },
  { date: "2026-08-17", followers: 48210, delta: 29 },
];

const topKeywords = [
  { keyword: "DROP", count: 214 },
  { keyword: "PRESET", count: 96 },
  { keyword: "GUIDE", count: 41 },
  { keyword: "LINK", count: 22 },
];

const recentLogs = [
  { id: "1", commenter: "mira.k", comment: "DROP please!", status: "SENT" },
  { id: "2", commenter: "leo.builds", comment: "preset link?", status: "SENT" },
  { id: "3", commenter: "ana.styles", comment: "GUIDE", status: "PENDING" },
  { id: "4", commenter: "tom.codes", comment: "DROP", status: "SKIPPED_DEDUP" },
  { id: "5", commenter: "jo.frames", comment: "link pls", status: "FAILED" },
];

const overviewPosts = [
  ["Spring drop reel", "214.8K", "180.1K", "9.1K", "812", "3.1K", "640", "Apr 3"],
  ["Restock haul", "88.4K", "71.9K", "5.2K", "402", "1.4K", "228", "Mar 28"],
  ["Behind the studio", "51.3K", "44.7K", "3.4K", "266", "902", "144", "Mar 21"],
];

const inboxThread = [
  { id: "m1", text: "DROP", fromMe: false, time: "2:14 PM" },
  {
    id: "m2",
    text: "Here's the link you asked for — enjoy! ✦",
    fromMe: true,
    time: "2:14 PM",
  },
  { id: "m3", text: "that was fast, thank you!!", fromMe: false, time: "2:16 PM" },
  { id: "m4", text: "Anytime — happy building.", fromMe: true, time: "2:17 PM" },
];

const allStatuses = [
  "SENT",
  "FAILED",
  "PENDING",
  "SKIPPED_DEDUP",
  "SKIPPED_RATE_LIMIT",
  "SKIPPED_PLAN_LIMIT",
  "SKIPPED_NO_MATCH",
];

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wide text-faint">
      {children}
    </p>
  );
}

export default function UiPreview() {
  return (
    <DashboardShell
      workspaceName="Studio Store"
      instagramUsername="studio.store"
      instagramAccountCount={1}
    >
      <div className="space-y-12">
        {/* ── 1. DM analytics mirror ─────────────────────────────────── */}
        <div className="space-y-8">
          <SectionLabel>Preview · DM analytics (/dashboard)</SectionLabel>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-foreground sm:text-3xl">
                Hello, John!
              </h1>
              <p className="mt-1 text-sm text-muted">
                1 connected account · 132 contacts ·{" "}
                <span className="text-accent">See activity</span>
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-x-4 gap-y-3">
              <label className="flex flex-col gap-2 text-sm">
                <span className="text-xs font-semibold uppercase tracking-wide text-faint">
                  Range
                </span>
                <select
                  defaultValue="week"
                  className="rounded-full border-0 bg-veil px-4 py-2 text-sm font-semibold text-foreground outline-none"
                >
                  <option value="week">This week</option>
                  <option value="month">This month</option>
                  <option value="year">This year</option>
                </select>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4">
            <StatCard label="Active Campaigns" value={4} />
            <StatCard label="DMs Sent" value="1,204" />
            <StatCard label="Skipped" value={86} />
            <StatCard label="Failed" value={12} />
            <StatCard label="Clicks" value={341} />
            <StatCard label="CTR" value="28%" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-6 gap-4 sm:gap-6">
            <div className="lg:col-span-3 panel p-5 sm:p-7">
              <h2 className="text-sm font-semibold text-foreground mb-6">
                DMs (This Week)
              </h2>
              <DmChart data={dailyDMs} />
            </div>

            <div className="lg:col-span-1 panel p-5 sm:p-7">
              <h2 className="text-sm font-semibold text-foreground mb-4">
                Top Keywords
              </h2>
              <div className="space-y-3">
                {topKeywords.map((keyword) => (
                  <div
                    key={keyword.keyword}
                    className="flex items-center justify-between gap-3"
                  >
                    <span className="truncate text-sm font-semibold text-foreground">
                      {keyword.keyword}
                    </span>
                    <span className="text-xs text-muted">{keyword.count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-2 panel p-5 sm:p-7">
              <h2 className="text-sm font-semibold text-foreground mb-4">
                Recent Activity
              </h2>
              <div className="no-scrollbar space-y-3 max-h-60 overflow-y-auto">
                {recentLogs.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between gap-3 py-2 border-b border-border last:border-0"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground truncate">
                        @{log.commenter}
                      </p>
                      <p className="text-xs text-muted truncate">
                        @studio.store · {log.comment}
                      </p>
                    </div>
                    <StatusBadge status={log.status} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── 2. Overview mirror ─────────────────────────────────────── */}
        <div className="space-y-8">
          <SectionLabel>Preview · Overview (/overview)</SectionLabel>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-foreground">Overview</h1>
              <p className="text-sm text-muted mt-1">
                Recent — 24 posts from @studio.store
              </p>
              <p className="mt-1 text-sm text-muted">48,210 followers</p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <StatCard
              label="Views"
              value="847.2K"
              trend="12.4%"
              trendUp
              spark={[4, 5, 4, 6, 7, 9, 8, 11]}
            />
            <StatCard
              label="Reach"
              value="612.4K"
              trend="8.1%"
              trendUp
              spark={[6, 6, 7, 6, 8, 9, 9, 10]}
            />
            <StatCard
              label="Likes"
              value="38.1K"
              trend="-4.2%"
              trendUp={false}
              spark={[9, 8, 9, 7, 7, 6, 7, 5]}
            />
            <StatCard
              label="Comments"
              value="4,204"
              trend="0.0%"
              spark={[5, 6, 5, 6, 5, 6, 5, 6]}
            />
            <StatCard
              label="Saved"
              value="9,712"
              trend="21.0%"
              trendUp
              spark={[3, 4, 6, 5, 7, 8, 10, 12]}
            />
            <StatCard
              label="Shares"
              value="2,340"
              trend="-6.8%"
              trendUp={false}
              spark={[10, 9, 9, 8, 7, 8, 6, 6]}
            />
          </div>

          <FollowerChart data={followerHistory} followers={48210} />

          <div className="panel p-5 sm:p-7">
            <h2 className="text-sm font-semibold text-foreground mb-4">Posts</h2>
            <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-faint border-b border-border">
                    <th className="py-2 pr-4 font-semibold">Post</th>
                    <th className="py-2 px-3 font-semibold text-right">Views</th>
                    <th className="py-2 px-3 font-semibold text-right">Reach</th>
                    <th className="py-2 px-3 font-semibold text-right">Likes</th>
                    <th className="py-2 px-3 font-semibold text-right">
                      Comments
                    </th>
                    <th className="py-2 px-3 font-semibold text-right">Saved</th>
                    <th className="py-2 px-3 font-semibold text-right">Shares</th>
                    <th className="py-2 pl-3 font-semibold text-right">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {overviewPosts.map(
                    ([caption, views, reach, likes, comments, saved, shares, date]) => (
                      <tr
                        key={caption}
                        className="border-b border-border last:border-0"
                      >
                        <td className="py-3 pr-4 max-w-xs">
                          <span className="text-foreground truncate block">
                            {caption}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right text-muted">{views}</td>
                        <td className="py-3 px-3 text-right text-muted">{reach}</td>
                        <td className="py-3 px-3 text-right text-muted">{likes}</td>
                        <td className="py-3 px-3 text-right text-muted">
                          {comments}
                        </td>
                        <td className="py-3 px-3 text-right text-muted">{saved}</td>
                        <td className="py-3 px-3 text-right text-muted">{shares}</td>
                        <td className="py-3 pl-3 text-right text-muted">{date}</td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ── 3. Inbox thread excerpt ────────────────────────────────── */}
        <div className="space-y-4">
          <SectionLabel>Preview · Inbox thread (/inbox)</SectionLabel>

          <div className="overflow-hidden rounded-card border border-border bg-surface">
            <div className="flex shrink-0 items-center gap-2 border-b border-border px-4 py-3 text-sm font-semibold text-foreground">
              <span className="truncate">@mira.k</span>
            </div>
            <div className="space-y-2 p-4">
              {inboxThread.map((m) => (
                <div
                  key={m.id}
                  className={`flex ${m.fromMe ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg px-3.5 py-2 text-sm ${
                      m.fromMe
                        ? "bg-accent text-button-text"
                        : "bg-surface-hover text-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words">{m.text}</p>
                    <p
                      className={`mt-1 text-[10px] ${
                        m.fromMe ? "opacity-70" : "text-muted"
                      }`}
                    >
                      {m.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            <div className="shrink-0 border-t border-border p-3">
              <div className="flex items-end gap-2">
                <textarea
                  rows={1}
                  disabled
                  placeholder="Write a reply…  (Enter to send, Shift+Enter for a new line)"
                  className="max-h-32 min-h-[40px] flex-1 resize-none rounded-lg border border-ring-c bg-surface-hover px-3.5 py-2 text-sm text-foreground placeholder:text-muted focus:border-accent/40 focus:outline-none"
                />
                <button type="button" disabled className="btn-primary btn-compact">
                  Send
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── 4. Styleguide strip ────────────────────────────────────── */}
        <div className="space-y-4">
          <SectionLabel>Preview · Styleguide</SectionLabel>

          <div className="panel p-5 sm:p-7 space-y-6">
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" className="btn-primary">
                Primary · Medium
              </button>
              <button type="button" className="btn-primary btn-compact">
                Compact
              </button>
              <button type="button" className="btn-primary btn-sm">
                Small
              </button>
              <button type="button" className="btn-secondary">
                Secondary
              </button>
              <button type="button" className="btn-secondary btn-sm">
                Secondary · Small
              </button>
            </div>

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
              {allStatuses.map((s) => (
                <StatusBadge key={s} status={s} />
              ))}
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatTileSkeleton />
              <StatTileSkeleton />
              <PanelSkeleton className="col-span-2" body="h-16" />
            </div>

            <div className="space-y-2">
              <p className="type-display text-display text-foreground">
                Aa Display
              </p>
              <p className="text-lg font-semibold text-foreground">
                Large — Inter SemiBold 20/28
              </p>
              <p className="text-base font-semibold text-foreground">
                Base — Inter SemiBold 16/24
              </p>
              <p className="text-sm text-muted">Muted supporting copy, 14px.</p>
              <p className="text-xs font-semibold uppercase tracking-wide text-faint">
                Faint uppercase label
              </p>
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
