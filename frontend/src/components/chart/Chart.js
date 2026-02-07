"use client";

import { useEffect, useRef, useCallback } from "react";
import { OVERLAY_COLORS } from "@/lib/constants";
import {
  getChartOptions,
  CANDLE_SERIES_OPTIONS,
  VOLUME_SERIES_OPTIONS,
} from "./chartConfig";
import { renderAllDrawings } from "./drawingRenderer";

export default function Chart({
  data,
  trades,
  overlays,
  drawings = [],
  positions = [],
  activeTool = null,
  onChartClick,
  volumeVisible = true,
  onCrosshairMove,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const overlaySeriesRef = useRef([]);
  const LineSeriesRef = useRef(null);
  const createSeriesMarkersRef = useRef(null);
  const markersRef = useRef(null);
  const prevDataLenRef = useRef(0);

  // Keep mutable refs for values needed inside callbacks
  const drawingsRef = useRef(drawings);
  const positionsRef = useRef(positions);
  const onChartClickRef = useRef(onChartClick);
  const renderIdRef = useRef(null);

  drawingsRef.current = drawings;
  positionsRef.current = positions;
  onChartClickRef.current = onChartClick;

  // ── Canvas rendering ─────────────────────────────────────────────────

  const scheduleRender = useCallback(() => {
    if (renderIdRef.current) cancelAnimationFrame(renderIdRef.current);
    renderIdRef.current = requestAnimationFrame(() => {
      renderIdRef.current = null;
      const canvas = canvasRef.current;
      if (!canvas || !chartRef.current || !candleSeriesRef.current) return;

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
      }
      const ctx = canvas.getContext("2d");
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      renderAllDrawings(
        ctx,
        chartRef.current,
        candleSeriesRef.current,
        drawingsRef.current,
        positionsRef.current,
        w,
        h
      );
    });
  }, []);

  // ── Chart initialisation ─────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    import("lightweight-charts").then((mod) => {
      if (cancelled || !containerRef.current) return;

      const {
        createChart,
        ColorType,
        CrosshairMode,
        CandlestickSeries,
        HistogramSeries,
        LineSeries,
        createSeriesMarkers,
      } = mod;

      if (chartRef.current) chartRef.current.remove();

      const opts = getChartOptions(ColorType);
      const chart = createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
        ...opts,
        crosshair: { ...opts.crosshair, mode: CrosshairMode.Normal },
      });

      const candleSeries = chart.addSeries(
        CandlestickSeries,
        CANDLE_SERIES_OPTIONS
      );
      const volumeSeries = chart.addSeries(
        HistogramSeries,
        VOLUME_SERIES_OPTIONS
      );
      volumeSeries
        .priceScale()
        .applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

      chartRef.current = chart;
      candleSeriesRef.current = candleSeries;
      volumeSeriesRef.current = volumeSeries;
      LineSeriesRef.current = LineSeries;
      createSeriesMarkersRef.current = createSeriesMarkers;

      // Resize
      const ro = new ResizeObserver((entries) => {
        if (entries.length === 0 || !containerRef.current) return;
        const { width, height } = entries[0].contentRect;
        chart.applyOptions({ width, height });
        scheduleRender();
      });
      ro.observe(containerRef.current);

      // Crosshair
      chart.subscribeCrosshairMove((param) => {
        if (!param || !param.time) {
          if (onCrosshairMove) onCrosshairMove(null);
          return;
        }
        const d = param.seriesData?.get(candleSeries);
        if (d && onCrosshairMove) {
          onCrosshairMove({
            time: param.time,
            open: d.open,
            high: d.high,
            low: d.low,
            close: d.close,
          });
        }
      });

      // Chart click → forwarded to parent for drawing tools
      chart.subscribeClick((param) => {
        if (!param || !param.point) return;
        const price = candleSeries.coordinateToPrice(param.point.y);
        const time = param.time;
        if (price != null && time != null && onChartClickRef.current) {
          onChartClickRef.current(time, price);
        }
      });

      // Scroll / zoom → re-render drawings
      chart.timeScale().subscribeVisibleLogicalRangeChange(() => {
        scheduleRender();
      });

      return () => ro.disconnect();
    });

    return () => {
      cancelled = true;
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Update candle data ───────────────────────────────────────────────

  useEffect(() => {
    if (!candleSeriesRef.current || !data || data.length === 0) return;

    const ts = chartRef.current?.timeScale();
    const prevLen = prevDataLenRef.current;
    const savedRange = ts ? ts.getVisibleLogicalRange() : null;

    candleSeriesRef.current.setData(data);
    if (volumeSeriesRef.current) {
      volumeSeriesRef.current.setData(
        data.map((d) => ({
          time: d.time,
          value: d.volume,
          color:
            d.close >= d.open
              ? "rgba(38,166,154,0.3)"
              : "rgba(239,83,80,0.3)",
        }))
      );
    }

    if (ts) {
      if (prevLen === 0 || Math.abs(data.length - prevLen) > 50) {
        // First load or big data change (symbol/timeframe switch) → fit
        ts.fitContent();
      } else if (savedRange) {
        // Incremental step-forward → keep zoom, shift range by added candles
        const added = data.length - prevLen;
        ts.setVisibleLogicalRange({
          from: savedRange.from + added,
          to: savedRange.to + added,
        });
      }
    }

    prevDataLenRef.current = data.length;
    scheduleRender();
  }, [data, scheduleRender]);

  // ── Trade markers ────────────────────────────────────────────────────

  useEffect(() => {
    if (!candleSeriesRef.current || !trades) return;
    const markers = [];
    trades.forEach((t) => {
      markers.push({
        time: t.entry_time,
        position: t.side === "long" ? "belowBar" : "aboveBar",
        color: t.side === "long" ? "#26a69a" : "#ef5350",
        shape: t.side === "long" ? "arrowUp" : "arrowDown",
        text: `${t.side.toUpperCase()} @ ${t.entry_price?.toFixed(0)}`,
      });
      if (t.exit_time) {
        markers.push({
          time: t.exit_time,
          position: "aboveBar",
          color: t.pnl >= 0 ? "#26a69a" : "#ef5350",
          shape: "circle",
          text: `${t.exit_reason} ${t.pnl >= 0 ? "+" : ""}${t.pnl?.toFixed(2)}`,
        });
      }
    });
    markers.sort((a, b) => a.time - b.time);
    if (createSeriesMarkersRef.current && candleSeriesRef.current) {
      if (markersRef.current) markersRef.current.setMarkers([]);
      markersRef.current = createSeriesMarkersRef.current(
        candleSeriesRef.current,
        markers
      );
    }
  }, [trades]);

  // ── Overlay indicator lines ──────────────────────────────────────────

  useEffect(() => {
    if (!chartRef.current) return;
    overlaySeriesRef.current.forEach((s) => {
      try {
        chartRef.current.removeSeries(s);
      } catch (e) {}
    });
    overlaySeriesRef.current = [];
    if (!overlays) return;
    let idx = 0;
    Object.entries(overlays).forEach(([key, lineData]) => {
      if (!lineData || lineData.length === 0 || key === "rsi") return;
      const s = chartRef.current.addSeries(LineSeriesRef.current, {
        color: OVERLAY_COLORS[idx % OVERLAY_COLORS.length],
        lineWidth: 1,
        title: key,
      });
      s.setData(lineData);
      overlaySeriesRef.current.push(s);
      idx++;
    });
  }, [overlays]);

  // ── Re-render drawings when they change ──────────────────────────────

  useEffect(() => {
    scheduleRender();
  }, [drawings, positions, scheduleRender]);

  // ── Cursor style for drawing mode ────────────────────────────────────

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    if (activeTool) {
      el.style.cursor = "crosshair";
    } else {
      el.style.cursor = "";
    }
  }, [activeTool]);

  // ── Render ───────────────────────────────────────────────────────────

  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
