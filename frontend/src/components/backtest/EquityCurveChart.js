"use client";

import { useEffect, useRef } from "react";
import { CHART_COLORS } from "@/lib/constants";

/**
 * A small area chart showing the equity curve from a backtest.
 */
export default function EquityCurveChart({ equityCurve, totalPnl }) {
  const containerRef = useRef(null);
  const chartInstanceRef = useRef(null);

  useEffect(() => {
    if (!equityCurve || equityCurve.length === 0) return;

    let cancelled = false;
    import("lightweight-charts").then((mod) => {
      if (cancelled || !containerRef.current) return;
      const { createChart, ColorType, AreaSeries } = mod;

      if (chartInstanceRef.current) chartInstanceRef.current.remove();

      const chart = createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height: 180,
        layout: {
          background: { type: ColorType.Solid, color: CHART_COLORS.background },
          textColor: CHART_COLORS.textSecondary,
          fontSize: 11,
        },
        grid: {
          vertLines: { color: CHART_COLORS.grid },
          horzLines: { color: CHART_COLORS.grid },
        },
        rightPriceScale: { borderColor: CHART_COLORS.border },
        timeScale: { borderColor: CHART_COLORS.border, timeVisible: true },
      });

      const isPositive = totalPnl >= 0;
      const series = chart.addSeries(AreaSeries, {
        topColor: isPositive ? "rgba(38,166,154,0.3)" : "rgba(239,83,80,0.3)",
        bottomColor: "rgba(0,0,0,0)",
        lineColor: isPositive ? "#26a69a" : "#ef5350",
        lineWidth: 2,
      });

      series.setData(equityCurve);
      chart.timeScale().fitContent();
      chartInstanceRef.current = chart;

      const ro = new ResizeObserver((entries) => {
        if (entries.length === 0) return;
        chart.applyOptions({ width: entries[0].contentRect.width });
      });
      ro.observe(containerRef.current);

      return () => ro.disconnect();
    });

    return () => {
      cancelled = true;
      if (chartInstanceRef.current) {
        chartInstanceRef.current.remove();
        chartInstanceRef.current = null;
      }
    };
  }, [equityCurve, totalPnl]);

  return (
    <div style={{ padding: "12px 16px" }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          marginBottom: 8,
          color: "var(--text-secondary)",
        }}
      >
        Equity Curve
      </div>
      <div ref={containerRef} style={{ width: "100%", height: 180 }} />
    </div>
  );
}
