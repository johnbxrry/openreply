"use client";

/**
 * Top Bar
 *
 * Mobile hamburger, theme toggle, and the Connect CTA when no Instagram
 * account is linked. Page titles live in each page's own header, and the
 * connected-account chip was intentionally removed — the bar stays quiet.
 */

import ThemeToggle from "@/components/theme-toggle";

interface TopBarProps {
  onMenuClick: () => void;
  instagramUsername: string | null;
  instagramAccountCount: number;
}

export default function TopBar({
  onMenuClick,
  instagramAccountCount,
}: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-3 h-16 px-4 lg:px-8 border-b border-border bg-background">
      <button
        onClick={onMenuClick}
        className="btn-secondary btn-sm lg:hidden shrink-0"
        aria-label="Toggle sidebar"
      >
        Menu
      </button>
      <span className="hidden lg:block" aria-hidden="true" />

      <div className="flex shrink-0 items-center gap-2 sm:gap-3">
        <ThemeToggle />
        {instagramAccountCount === 0 && (
          <a
            href="/api/instagram/connect"
            className="btn-primary btn-sm whitespace-nowrap"
          >
            {/* Full label needs more room than a 360px header has to spare. */}
            <span className="sm:hidden">Connect</span>
            <span className="hidden sm:inline">Connect Instagram</span>
          </a>
        )}
      </div>
    </header>
  );
}
