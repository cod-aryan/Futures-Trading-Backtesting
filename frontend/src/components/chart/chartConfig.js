import { CHART_COLORS } from "@/lib/constants";

/**
 * Default chart options for lightweight-charts v5.
 */
export function getChartOptions(ColorType) {
  return {
    layout: {
      background: { type: ColorType.Solid, color: CHART_COLORS.background },
      textColor: CHART_COLORS.text,
      fontSize: 12,
    },
    grid: {
      vertLines: { color: CHART_COLORS.grid },
      horzLines: { color: CHART_COLORS.grid },
    },
    crosshair: {
      vertLine: {
        color: CHART_COLORS.crosshair,
        width: 1,
        style: 3,
        labelBackgroundColor: CHART_COLORS.labelBg,
      },
      horzLine: {
        color: CHART_COLORS.crosshair,
        width: 1,
        style: 3,
        labelBackgroundColor: CHART_COLORS.labelBg,
      },
    },
    rightPriceScale: {
      borderColor: CHART_COLORS.border,
      scaleMargins: { top: 0.1, bottom: 0.25 },
    },
    timeScale: {
      borderColor: CHART_COLORS.border,
      timeVisible: true,
      secondsVisible: false,
    },
  };
}

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
