export const TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1d"];

export const LEVERAGE_OPTIONS = [1, 2, 5, 10, 20, 50, 100];

/** Static fallback colors (dark theme). At runtime prefer getThemeChartColors(). */
export const CHART_COLORS = {
  up: "#26a69a",
  down: "#ef5350",
  background: "#131722",
  grid: "#1e222d",
  crosshair: "#363a45",
  text: "#d1d4dc",
  textSecondary: "#787b86",
  border: "#363a45",
  labelBg: "#2a2e39",
};

/** Read current CSS variables to derive chart colors matching the active theme. */
export function getThemeChartColors() {
  if (typeof window === "undefined") return CHART_COLORS;
  const s = getComputedStyle(document.documentElement);
  const v = (name) => s.getPropertyValue(name).trim();
  return {
    up: v("--accent-green") || CHART_COLORS.up,
    down: v("--accent-red") || CHART_COLORS.down,
    background: v("--bg-primary") || CHART_COLORS.background,
    grid: v("--bg-secondary") || CHART_COLORS.grid,
    crosshair: v("--border-color") || CHART_COLORS.crosshair,
    text: v("--text-primary") || CHART_COLORS.text,
    textSecondary: v("--text-secondary") || CHART_COLORS.textSecondary,
    border: v("--border-color") || CHART_COLORS.border,
    labelBg: v("--bg-tertiary") || CHART_COLORS.labelBg,
    handleFill: v("--handle-fill") || CHART_COLORS.background,
    volumeUp: v("--volume-up") || "rgba(38,166,154,0.3)",
    volumeDown: v("--volume-down") || "rgba(239,83,80,0.3)",
  };
}

export const OVERLAY_COLORS = ["#f7c948", "#2962ff", "#e040fb", "#00bcd4"];
