/**
 * Chart palette per theme.
 *
 * Recharts writes colors as SVG presentation attributes, where CSS var()
 * doesn't resolve, so these mirror the globals.css tokens by literal value:
 * series = --accent, grid = --border, axis = --muted (dark) / --faint (light),
 * dotRing = the surface the active dot sits on.
 */

import type { Theme } from "@/components/theme-provider";

export const CHART_COLORS: Record<
  Theme,
  { series: string; grid: string; axis: string; dotRing: string }
> = {
  dark: {
    series: "#99c7ff",
    grid: "#1b1f27",
    axis: "#c6cdd9",
    dotRing: "#20242d",
  },
  light: {
    series: "#0166ff",
    grid: "#e4eaf2",
    axis: "#949ba8",
    dotRing: "#ffffff",
  },
};

/* Trend-direction strokes for sparklines: --success / --muted / --error. */
export const TREND_COLORS: Record<
  Theme,
  { up: string; neutral: string; down: string }
> = {
  dark: { up: "#22c55e", neutral: "#c6cdd9", down: "#ffa8ad" },
  light: { up: "#15803d", neutral: "#949ba8", down: "#dc2626" },
};
