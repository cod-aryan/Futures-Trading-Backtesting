import { CHART_COLORS, getThemeChartColors } from "@/lib/constants";

/**
 * Default chart options for lightweight-charts v5.
 * Reads live CSS variables so it works for both themes.
 */
export function getChartOptions(ColorType) {
  const c = getThemeChartColors();
  return {
    layout: {
      background: { type: ColorType.Solid, color: c.background },
      textColor: c.text,
      fontSize: 12,
    },
    grid: {
      vertLines: { color: c.grid },
      horzLines: { color: c.grid },
    },
    crosshair: {
      vertLine: {
        color: c.crosshair,
        width: 1,
        style: 3,
        labelBackgroundColor: c.labelBg,
      },
      horzLine: {
        color: c.crosshair,
        width: 1,
        style: 3,
        labelBackgroundColor: c.labelBg,
      },
    },
    rightPriceScale: {
      borderColor: c.border,
      scaleMargins: { top: 0.1, bottom: 0.25 },
    },
    timeScale: {
      borderColor: c.border,
      timeVisible: true,
      secondsVisible: false,
    },
  };
}

export function getCandleSeriesOptions() {
  const c = getThemeChartColors();
  return {
    upColor: c.up,
    downColor: c.down,
    borderUpColor: c.up,
    borderDownColor: c.down,
    wickUpColor: c.up,
    wickDownColor: c.down,
  };
}

export function getVolumeSeriesOptions() {
  const c = getThemeChartColors();
  return {
    color: c.up,
    priceFormat: { type: "volume" },
    priceScaleId: "volume",
  };
}

/** Keep static versions for backward compat / initial import. */
export const CANDLE_SERIES_OPTIONS = {
  upColor: CHART_COLORS.up,
  downColor: CHART_COLORS.down,
  borderUpColor: CHART_COLORS.up,
  borderDownColor: CHART_COLORS.down,
  wickUpColor: CHART_COLORS.up,
  wickDownColor: CHART_COLORS.down,
};

export const VOLUME_SERIES_OPTIONS = {
  color: CHART_COLORS.up,
  priceFormat: { type: "volume" },
  priceScaleId: "volume",
};

export const EQUITY_CHART_OPTIONS = {
  height: 180,
  layout: {
    textColor: CHART_COLORS.textSecondary,
    fontSize: 11,
  },
  grid: {
    vertLines: { color: CHART_COLORS.grid },
    horzLines: { color: CHART_COLORS.grid },
  },
  rightPriceScale: { borderColor: CHART_COLORS.border },
  timeScale: { borderColor: CHART_COLORS.border, timeVisible: true },
};
