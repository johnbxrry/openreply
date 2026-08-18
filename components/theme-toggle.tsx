"use client";

import { useTheme } from "@/components/theme-provider";

/* Icons are inline SVG — the app has no icon library. */
function MoonIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M4.93 4.93l1.41 1.41m11.32 11.32 1.41 1.41M2 12h2m16 0h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

export default function ThemeToggle({
  variant = "default",
}: {
  /** "hero" sits on the fixed cobalt ground where theme tokens don't apply. */
  variant?: "default" | "hero";
}) {
  const { theme, toggle } = useTheme();
  const label =
    theme === "dark" ? "Switch to light theme" : "Switch to dark theme";
  const chrome =
    variant === "hero"
      ? "border-white/35 text-ice hover:bg-white/10"
      : "border-ring-c bg-veil text-foreground hover:bg-surface-hover";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={label}
      title={label}
      className={`inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border transition-colors ${chrome}`}
    >
      {theme === "dark" ? <MoonIcon /> : <SunIcon />}
    </button>
  );
}
