import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Aire Company Social Analytics",
  description:
    "A free, self-hosted ManyChat alternative. Turn Instagram keyword comments into automatic private replies using the official Meta API.",
};

/* Static, faithful copy of the real Overview screen, built in the app's own
   design tokens so what visitors see is what the app looks like. */

function AppWindow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-surface shadow-2xl shadow-black/50">
      <div className="flex items-center gap-2 border-b border-border bg-surface-hover px-4 py-3">
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
        <span className="h-2.5 w-2.5 rounded-full bg-border" />
        <span className="ml-2 text-xs text-muted">{label}</span>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded border border-border bg-background/40 p-4">
      <p className="text-sm text-muted">{label}</p>
      <p className="mt-1 text-2xl font-medium text-foreground">{value}</p>
    </div>
  );
}

const overviewStats = [
  ["Views", "847.2K"],
  ["Reach", "612.4K"],
  ["Likes", "38.1K"],
  ["Comments", "4,204"],
  ["Saved", "9,712"],
  ["Shares", "2,340"],
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
          <h3 className="text-base font-medium text-foreground">Overview</h3>
          <p className="mt-1 text-xs text-muted">
            Recent — 24 posts from @studio.store
          </p>
        </div>
        <span className="rounded border border-border px-2 py-1 text-xs text-muted">
          Last 50
        </span>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {overviewStats.map(([label, value]) => (
          <Stat key={label} label={label} value={value} />
        ))}
      </div>

      <div className="mt-4 rounded border border-border bg-background/40 p-4">
        <div className="flex items-baseline justify-between">
          <p className="text-sm font-medium text-foreground">
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

      <div className="mt-4 rounded border border-border bg-background/40 p-4">
        <p className="text-sm font-medium text-foreground">Posts</p>
        <table className="mt-3 w-full text-sm">
          <thead>
            <tr className="border-b border-border text-left text-[11px] uppercase tracking-wide text-muted">
              <th className="pb-2 pr-3 font-medium">Post</th>
              <th className="pb-2 px-3 text-right font-medium">Views</th>
              <th className="pb-2 px-3 text-right font-medium">Likes</th>
              <th className="pb-2 pl-3 text-right font-medium">Date</th>
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
    <div className="w-64 rounded-lg border border-border bg-surface p-4 shadow-2xl shadow-black/50">
      <p className="text-xs text-muted">New comment</p>
      <p className="mt-1 text-sm font-medium text-foreground">@maya.co</p>
      <p className="mt-1 text-sm text-muted">LINK please</p>
      <div className="mt-3 border-t border-border pt-3">
        <p className="text-xs text-muted">
          Matched <span className="text-accent">GUIDE</span>
        </p>
        <p className="mt-1 text-sm font-medium text-success">
          Queued private reply
        </p>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="OpenReply home">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/openreply-mark.svg"
              alt="OpenReply"
              className="h-8 w-auto opacity-90"
            />
          </Link>

          <Link
            href="/login"
            className="text-lg font-normal text-foreground/80 transition hover:text-foreground"
          >
            access your portal <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </header>

      <section className="mx-auto w-full max-w-6xl px-5 pt-20 sm:px-6 sm:pt-28 lg:px-8">
        <h1 className="text-4xl font-normal leading-[1.15] tracking-[-0.02em] sm:text-5xl lg:text-[56px] lg:leading-[1.0]">
          <span className="block text-foreground">insta-analytics, made simple.</span>
          <span className="block text-muted">the open source engine for</span>
          <span className="block text-muted">instagram analytics and DMs.</span>
        </h1>

        <p className="mt-8 max-w-xl text-lg leading-7 text-muted">
          Open-sourced ManyChat. When someone comments your keyword on a post
          or reel, they get your DM a second later. Free, self-hosted, and
          built on the official Instagram API.
        </p>

        <div className="mt-10 flex items-center gap-6">
          <Link href="/login" className="btn-primary px-3.5 py-2 text-base">
            access your portal
          </Link>
          <a
            href="#preview"
            className="text-lg font-normal text-foreground/80 transition hover:text-foreground"
          >
            learn more <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      </section>

      <section
        id="preview"
        className="mx-auto w-full max-w-6xl px-5 pb-24 pt-16 sm:px-6 sm:pt-20 lg:px-8"
      >
        <div className="relative">
          <OverviewPreview />
          <div className="absolute -bottom-8 -left-6 hidden lg:block">
            <MatchedCommentCard />
          </div>
        </div>
      </section>

      <footer className="border-t border-border py-8">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/openreply-mark.svg"
            alt="OpenReply"
            className="h-8 w-auto opacity-90"
          />
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
