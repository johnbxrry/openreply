import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Aire Company Social Analytics",
  description:
    "A free, self-hosted ManyChat alternative. Turn Instagram keyword comments into automatic private replies using the official Meta API.",
};

/* Static, faithful copy of the real Overview screen, built in the app's own
   design tokens so what visitors see is what the app looks like. The hero's
   card-lg frame owns the outer shape, so AppWindow draws no border of its own. */

function AppWindow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="bg-surface">
      <div className="flex items-center gap-2 border-b border-border bg-surface-hover px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-veil" />
        <span className="h-2.5 w-2.5 rounded-full bg-veil" />
        <span className="h-2.5 w-2.5 rounded-full bg-veil" />
        <span className="ml-2 text-xs text-muted">{label}</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Stat({
  label,
  value,
  trend,
  up,
  spark,
}: {
  label: string;
  value: string;
  trend: string;
  up: boolean | null;
  spark: string;
}) {
  const tone =
    up === null ? "text-muted" : up ? "text-success" : "text-error";
  return (
    <div className="rounded-2xl border border-border bg-background/60 p-4">
      <p className="text-sm font-semibold text-faint">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-foreground">{value}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <p className={`text-xs font-semibold ${tone}`}>
          <span aria-hidden="true">{up === null ? "—" : up ? "▲" : "▼"}</span>{" "}
          {trend}
        </p>
        <svg
          viewBox="0 0 100 28"
          preserveAspectRatio="none"
          className={`h-5 w-14 shrink-0 ${tone}`}
          aria-hidden="true"
        >
          <polyline
            points={spark}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
      </div>
    </div>
  );
}

const overviewStats: [string, string, string, boolean | null, string][] = [
  ["Views", "847.2K", "12.4%", true, "0,22 20,18 40,20 60,12 80,8 100,4"],
  ["Reach", "612.4K", "8.1%", true, "0,20 20,21 40,16 60,17 80,10 100,6"],
  ["Likes", "38.1K", "-4.2%", false, "0,8 20,10 40,9 60,14 80,13 100,18"],
  ["Comments", "4,204", "0.0%", null, "0,14 20,12 40,15 60,12 80,15 100,13"],
  ["Saved", "9,712", "21.0%", true, "0,24 20,20 40,21 60,14 80,9 100,3"],
  ["Shares", "2,340", "-6.8%", false, "0,6 20,9 40,8 60,13 80,12 100,17"],
];

const overviewPosts = [
  ["Spring drop reel", "214.8K", "9.1K", "Apr 3"],
  ["Restock haul", "88.4K", "5.2K", "Mar 28"],
  ["Behind the studio", "51.3K", "3.4K", "Mar 21"],
];

function OverviewPreview() {
  return (
    <AppWindow label="app / overview">
      <div className="flex items-end justify-between">
        <div>
          <h3 className="text-base font-semibold text-foreground">Overview</h3>
          <p className="mt-1 text-xs text-muted">
            Recent — 24 posts from @studio.store
          </p>
        </div>
        <span className="rounded-full bg-veil px-3 py-1 text-xs font-semibold text-muted">
          Last 50
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {overviewStats.map(([label, value, trend, up, spark]) => (
          <Stat
            key={label}
            label={label}
            value={value}
            trend={trend}
            up={up}
            spark={spark}
          />
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-background/60 p-4">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-semibold text-foreground">
            Followers over time
          </p>
          <p className="text-xs text-muted">
            48,210 <span className="text-success">+1,240</span> · 30d
          </p>
        </div>
        <svg
          viewBox="0 0 300 64"
          preserveAspectRatio="none"
          className="mt-3 h-16 w-full"
          aria-hidden="true"
        >
          <polyline
            points="0,54 43,49 86,51 129,40 171,36 214,26 257,20 300,9"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
            className="text-accent"
          />
        </svg>
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-background/60 p-4">
        <p className="text-sm font-semibold text-foreground">Posts</p>
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-faint">
              <th className="pb-2 pr-3 font-semibold">Post</th>
              <th className="pb-2 px-3 text-right font-semibold">Views</th>
              <th className="pb-2 px-3 text-right font-semibold">Likes</th>
              <th className="pb-2 pl-3 text-right font-semibold">Date</th>
            </tr>
          </thead>
          <tbody>
            {overviewPosts.map(([post, views, likes, date]) => (
              <tr key={post} className="border-b border-border last:border-0">
                <td className="py-2 pr-3 text-foreground">{post}</td>
                <td className="py-2 px-3 text-right text-muted">{views}</td>
                <td className="py-2 px-3 text-right text-muted">{likes}</td>
                <td className="py-2 pl-3 text-right text-muted">{date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AppWindow>
  );
}

function MatchedCommentCard() {
  return (
    <div className="w-64 rounded-lg border border-border bg-surface p-5 shadow-2xl shadow-black/50">
      <p className="text-xs text-muted">New comment</p>
      <p className="mt-1 text-sm font-semibold text-foreground">@maya.co</p>
      <p className="mt-1 text-sm text-muted">LINK please</p>
      <div className="mt-3 border-t border-border pt-3">
        <p className="text-xs text-muted">
          Matched <span className="text-accent">GUIDE</span>
        </p>
        <p className="mt-1 text-sm font-semibold text-success">
          Queued private reply
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Cobalt hero block — header, hero copy, and media card all sit on it.
          The ground fades into the page background behind the card's lower
          half, so the card straddles cobalt and page ground per the Aire
          hero reference. */}
      <div className="relative isolate overflow-hidden bg-cobalt">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-b from-transparent to-background"
        />

        <header className="relative">
          <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-6 lg:px-8">
            <Link
              href="/"
              className="flex items-center gap-3"
              aria-label="Aire home"
            >
              {/* Wordmark in the brand display face (uppercased by the class). */}
              <span className="type-display text-2xl text-ice">Aire</span>
            </Link>

            <Link
              href="/login"
              className="text-base font-semibold text-ice underline decoration-ice/50 underline-offset-4 transition hover:decoration-ice"
            >
              Access your portal <span aria-hidden="true">&rarr;</span>
            </Link>
          </div>
        </header>

        <section className="relative mx-auto w-full max-w-6xl px-5 pt-14 text-center sm:px-6 sm:pt-20 lg:px-8">
          {/* Copy stays sentence case in source; .type-display uppercases it. */}
          <h1 className="type-display text-display text-ice">
            <span className="block">turn comments</span>
            <span className="block">into conversations.</span>
          </h1>

          <p className="mx-auto mt-8 max-w-xl text-lg font-semibold text-white">
            OpenReply is the open-source engine for Instagram analytics and
            DMs. Someone comments your keyword — they get your DM a second
            later. Free, self-hosted, official API.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
            <Link href="/login" className="btn-hero sm:min-w-[200px]">
              Access your portal
            </Link>
            <a
              href="#preview"
              className="text-base font-semibold text-ice underline decoration-ice/50 underline-offset-4 transition hover:decoration-ice"
            >
              Learn more <span aria-hidden="true">&rarr;</span>
            </a>
          </div>
        </section>

        <section
          id="preview"
          className="relative mx-auto w-full max-w-6xl px-5 pb-24 pt-14 sm:px-6 sm:pt-20 lg:px-8"
        >
          <div className="relative">
            <div className="overflow-hidden rounded-card-lg shadow-2xl shadow-black/25 ring-1 ring-black/10">
              <OverviewPreview />
            </div>
            <div className="absolute -bottom-8 -left-6 hidden lg:block">
              <MatchedCommentCard />
            </div>
          </div>
        </section>
      </div>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <span className="type-display text-2xl text-foreground">Aire</span>
          <nav className="flex items-center gap-[25px] text-sm text-muted">
            <Link href="/privacy" className="transition hover:text-foreground">
              privacy policy
            </Link>
            <Link href="/terms" className="transition hover:text-foreground">
              terms of service
            </Link>
            <Link
              href="/data-deletion"
              className="transition hover:text-foreground"
            >
              data deletion
            </Link>
          </nav>
        </div>
      </footer>
    </main>
  );
}
