"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { OVERLAY_COLORS, getThemeChartColors } from "@/lib/constants";
import {
  getChartOptions,
  getCandleSeriesOptions,
  getVolumeSeriesOptions,
} from "./chartConfig";
import {
  renderAllDrawings,
  hitTestDrawing,
  hitTestDrawingHandle,
  hitTestPositionLines,
} from "./drawingRenderer";

export default function Chart({
  data,
  drawings = [],
  positions = [],
  activeTool = null,
  selectedDrawingId = null,
  hoveredDrawingId = null,
  theme = "dark",
  hasMore = false,
  onLoadMore,
  onChartClick,
  onPositionUpdate,
  onDrawingUpdate,
  onDrawingHover,
  onDrawingSelect,
  onCrosshairMove,
}) {
  const wrapperRef = useRef(null);
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const chartRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);
  const prevDataLenRef = useRef(0);
  const prevIntervalRef = useRef(0);
  const renderIdRef = useRef(null);

  // Mutable refs
  const drawingsRef = useRef(drawings);
  const positionsRef = useRef(positions);
  const dataRef = useRef(data);
  const onChartClickRef = useRef(onChartClick);
  const onPositionUpdateRef = useRef(onPositionUpdate);
  const onDrawingHoverRef = useRef(onDrawingHover);
  const onDrawingSelectRef = useRef(onDrawingSelect);
  const onDrawingUpdateRef = useRef(onDrawingUpdate);
  const activeToolRef = useRef(activeTool);
  const hoveredRef = useRef(hoveredDrawingId);
  const dragRef = useRef({ active: false, posId: null, field: null, price: null });
  const drawingDragRef = useRef({ active: false, id: null, handle: null, originTime: null, originPrice: null, origDrawing: null });
  const onLoadMoreRef = useRef(onLoadMore);
  const hasMoreRef = useRef(hasMore);
  const loadingMoreRef = useRef(false);
  const [ctxMenu, setCtxMenu] = useState(null); // { x, y, price }

  drawingsRef.current = drawings;
  positionsRef.current = positions;
  dataRef.current = data;
  onChartClickRef.current = onChartClick;
  onPositionUpdateRef.current = onPositionUpdate;
  onDrawingHoverRef.current = onDrawingHover;
  onDrawingSelectRef.current = onDrawingSelect;
  onDrawingUpdateRef.current = onDrawingUpdate;
  activeToolRef.current = activeTool;
  hoveredRef.current = hoveredDrawingId;
  onLoadMoreRef.current = onLoadMore;
  hasMoreRef.current = hasMore;

  // ── Render loop ──────────────────────────────────────────────────

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

      const d = dataRef.current;
      const lastPrice = d && d.length > 0 ? d[d.length - 1].close : null;

      renderAllDrawings(
        ctx, chartRef.current, candleSeriesRef.current,
        drawingsRef.current, positionsRef.current,
        w, h, lastPrice, dragRef.current, hoveredRef.current
      );
    });
  }, []);

  // ── Chart init ───────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;
    import("lightweight-charts").then((mod) => {
      if (cancelled || !containerRef.current) return;

      const {
        createChart, ColorType, CrosshairMode,
        CandlestickSeries, HistogramSeries,
      } = mod;

      if (chartRef.current) chartRef.current.remove();

      const opts = getChartOptions(ColorType);
      const chart = createChart(containerRef.current, {
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
        ...opts,
        crosshair: { ...opts.crosshair, mode: CrosshairMode.Normal },
      });

      const candleSeries = chart.addSeries(CandlestickSeries, getCandleSeriesOptions());
      const volumeSeries = chart.addSeries(HistogramSeries, getVolumeSeriesOptions());
      volumeSeries.priceScale().applyOptions({ scaleMargins: { top: 0.8, bottom: 0 } });

      chartRef.current = chart;
      candleSeriesRef.current = candleSeries;
      volumeSeriesRef.current = volumeSeries;

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
          onCrosshairMove({ time: param.time, open: d.open, high: d.high, low: d.low, close: d.close });
        }
      });

      // Chart click → drawing tools or selection
      chart.subscribeClick((param) => {
        if (!param || !param.point) return;
        if (dragRef.current.active || drawingDragRef.current.active) return;

        const price = candleSeries.coordinateToPrice(param.point.y);
        if (price == null) return;

        let time = param.time;
        if (time == null && dataRef.current?.length > 0) {
          try {
            const logical = chart.timeScale().coordinateToLogical(param.point.x);
            if (logical != null) {
              const idx = Math.max(0, Math.min(Math.round(logical), dataRef.current.length - 1));
              time = dataRef.current[idx]?.time;
            }
          } catch (_) {}
        }

        // If no tool active, check for drawing selection
        if (!activeToolRef.current) {
          const hitId = hitTestDrawing(drawingsRef.current, chart, candleSeries, param.point.x, param.point.y, 8);
          if (hitId != null) {
            onDrawingSelectRef.current?.(hitId);
            return;
          }
        }

        if (onChartClickRef.current) {
          onChartClickRef.current(time, price);
        }
      });

      chart.timeScale().subscribeVisibleLogicalRangeChange((range) => {
        scheduleRender();
        // Load more data when user scrolls near the left edge
        if (range && range.from < 10 && hasMoreRef.current && !loadingMoreRef.current) {
          loadingMoreRef.current = true;
          Promise.resolve(onLoadMoreRef.current?.()).finally(() => {
            loadingMoreRef.current = false;
          });
        }
      });
      setTimeout(scheduleRender, 100);
      return () => ro.disconnect();
    });

    return () => {
      cancelled = true;
      if (chartRef.current) { chartRef.current.remove(); chartRef.current = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Mouse hover for drawings + SL/TP cursor ─────────────────────

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const onMove = (e) => {
      if (dragRef.current.active || drawingDragRef.current.active) return;
      if (activeToolRef.current) {
        // In scissor mode, don't do hover detection
        return;
      }
      if (!chartRef.current || !candleSeriesRef.current) return;

      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      // Check position lines first
      const posHit = hitTestPositionLines(positionsRef.current, candleSeriesRef.current, my, 10);
      if (posHit) {
        el.style.cursor = "ns-resize";
        onDrawingHoverRef.current?.(null);
        return;
      }

      // Check drawing handles for cursor
      const handleHit = hitTestDrawingHandle(drawingsRef.current, chartRef.current, candleSeriesRef.current, mx, my, 10, 8);
      if (handleHit) {
        onDrawingHoverRef.current?.(handleHit.id);
        if (handleHit.handle === "p1" || handleHit.handle === "p2") el.style.cursor = "grab";
        else el.style.cursor = "move";
        return;
      }

      onDrawingHoverRef.current?.(null);
      el.style.cursor = "";
    };

    el.addEventListener("mousemove", onMove);
    return () => el.removeEventListener("mousemove", onMove);
  }, []);

  // ── Drag SL/TP + Drawing drag ───────────────────────────────────

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const coordToTime = (x) => {
      try {
        const logical = chartRef.current.timeScale().coordinateToLogical(x);
        if (logical == null || !dataRef.current?.length) return null;
        const idx = Math.max(0, Math.min(Math.round(logical), dataRef.current.length - 1));
        return dataRef.current[idx]?.time ?? null;
      } catch (_) { return null; }
    };

    const onDown = (e) => {
      if (activeToolRef.current || !candleSeriesRef.current || !chartRef.current) return;
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left;
      const my = e.clientY - rect.top;

      // Check position SL/TP drag first
      const posHit = hitTestPositionLines(positionsRef.current, candleSeriesRef.current, my, 10);
      if (posHit) {
        e.stopPropagation(); e.preventDefault();
        dragRef.current = { active: true, posId: posHit.posId, field: posHit.field, price: null };
        chartRef.current.applyOptions({ handleScroll: false, handleScale: false });
        return;
      }

      // Check drawing handle drag
      const handleHit = hitTestDrawingHandle(drawingsRef.current, chartRef.current, candleSeriesRef.current, mx, my, 10, 8);
      if (handleHit) {
        e.stopPropagation(); e.preventDefault();
        const drawing = drawingsRef.current.find((d) => d.id === handleHit.id);
        if (!drawing) return;
        const time = coordToTime(mx);
        const price = candleSeriesRef.current.coordinateToPrice(my);
        drawingDragRef.current = {
          active: true,
          id: handleHit.id,
          handle: handleHit.handle,
          originTime: time,
          originPrice: price,
          origDrawing: JSON.parse(JSON.stringify(drawing)),
        };
        chartRef.current.applyOptions({ handleScroll: false, handleScale: false });
        el.style.cursor = handleHit.handle === "body" ? "grabbing" : "grabbing";
        onDrawingSelectRef.current?.(handleHit.id);
        return;
      }
    };

    const onMove = (e) => {
      // Position SL/TP drag
      if (dragRef.current.active) {
        const rect = el.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const price = candleSeriesRef.current?.coordinateToPrice(y);
        if (price != null) {
          dragRef.current.price = price;
          onPositionUpdateRef.current?.(dragRef.current.posId, dragRef.current.field, price);
          scheduleRender();
        }
        e.preventDefault();
        return;
      }

      // Drawing drag
      if (drawingDragRef.current.active) {
        const rect = el.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const curTime = coordToTime(mx);
        const curPrice = candleSeriesRef.current?.coordinateToPrice(my);
        if (curPrice == null) return;
        e.preventDefault();

        const dd = drawingDragRef.current;
        const orig = dd.origDrawing;
        const dPrice = curPrice - (dd.originPrice || 0);

        if (orig.type === "horizontal") {
          // Only price movement
          onDrawingUpdateRef.current?.(dd.id, { price: orig.price + dPrice });
        } else if (orig.type === "trendline" || orig.type === "ray" || orig.type === "fib") {
          if (dd.handle === "p1") {
            const newP1 = { time: curTime || orig.p1.time, price: curPrice };
            onDrawingUpdateRef.current?.(dd.id, { p1: newP1 });
          } else if (dd.handle === "p2") {
            const newP2 = { time: curTime || orig.p2.time, price: curPrice };
            onDrawingUpdateRef.current?.(dd.id, { p2: newP2 });
          } else {
            // body: move both points by same delta
            const dTime = (curTime || 0) - (dd.originTime || 0);
            const newP1 = { time: orig.p1.time + dTime, price: orig.p1.price + dPrice };
            const newP2 = { time: orig.p2.time + dTime, price: orig.p2.price + dPrice };
            onDrawingUpdateRef.current?.(dd.id, { p1: newP1, p2: newP2 });
          }
        }
        scheduleRender();
      }
    };

    const onUp = () => {
      if (dragRef.current.active) {
        dragRef.current = { active: false, posId: null, field: null, price: null };
        if (chartRef.current) chartRef.current.applyOptions({ handleScroll: true, handleScale: true });
        scheduleRender();
      }
      if (drawingDragRef.current.active) {
        drawingDragRef.current = { active: false, id: null, handle: null, originTime: null, originPrice: null, origDrawing: null };
        if (chartRef.current) chartRef.current.applyOptions({ handleScroll: true, handleScale: true });
        el.style.cursor = "";
        scheduleRender();
      }
    };

    el.addEventListener("mousedown", onDown, true);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      el.removeEventListener("mousedown", onDown, true);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [scheduleRender]);

  // ── Data updates (preserve zoom) ────────────────────────────────

  useEffect(() => {
    if (!candleSeriesRef.current || !data || data.length === 0) return;
    const ts = chartRef.current?.timeScale();
    const prevLen = prevDataLenRef.current;
    const savedLogical = ts ? ts.getVisibleLogicalRange() : null;
    // Save visible time range for cross-timeframe alignment
    let savedTimeRange = null;
    try { savedTimeRange = ts?.getVisibleRange?.() ?? null; } catch (_) {}

    candleSeriesRef.current.setData(data);
    if (volumeSeriesRef.current) {
      volumeSeriesRef.current.setData(
        data.map((d) => {
          const c = getThemeChartColors();
          return {
            time: d.time, value: d.volume,
            color: d.close >= d.open ? c.volumeUp : c.volumeDown,
          };
        })
      );
    }

    if (ts) {
      // Detect timeframe switch by checking if the candle interval changed
      const interval = data.length >= 2 ? data[1].time - data[0].time : 0;
      const prevInterval = prevIntervalRef.current;
      const isTimeframeSwitch = prevLen > 0 && prevInterval > 0 && interval !== prevInterval;
      prevIntervalRef.current = interval;

      const added = data.length - prevLen;
      if (prevLen === 0 || isTimeframeSwitch) {
        // First load or timeframe switch: show the last ~100 candles at a comfortable zoom
        const barsToShow = Math.min(100, data.length);
        ts.setVisibleLogicalRange({ from: data.length - barsToShow - 5, to: data.length + 5 });
      } else if (savedLogical) {
        // Shift the logical range by the number of candles added/prepended
        // This keeps the exact same candles visible regardless of prepend or append
        ts.setVisibleLogicalRange({ from: savedLogical.from + added, to: savedLogical.to + added });
      }
    }
    prevDataLenRef.current = data.length;
    scheduleRender();
    // Delayed re-render to catch coordinate updates after chart processes new data
    const t = setTimeout(scheduleRender, 60);
    return () => clearTimeout(t);
  }, [data, scheduleRender]);

  // ── Re-render on drawing / position changes ─────────────────────

  useEffect(() => { scheduleRender(); }, [drawings, positions, hoveredDrawingId, scheduleRender]);

  // ── Theme change: re-apply chart + series colors ────────────────

  useEffect(() => {
    if (!chartRef.current || !candleSeriesRef.current) return;
    import("lightweight-charts").then((mod) => {
      const { ColorType } = mod;
      const opts = getChartOptions(ColorType);
      chartRef.current.applyOptions({
        layout: opts.layout,
        grid: opts.grid,
        crosshair: opts.crosshair,
        rightPriceScale: opts.rightPriceScale,
        timeScale: opts.timeScale,
      });
      candleSeriesRef.current.applyOptions(getCandleSeriesOptions());
      if (volumeSeriesRef.current) {
        volumeSeriesRef.current.applyOptions(getVolumeSeriesOptions());
        // Re-color existing volume bars
        const d = dataRef.current;
        if (d?.length) {
          const c = getThemeChartColors();
          volumeSeriesRef.current.setData(
            d.map((bar) => ({
              time: bar.time, value: bar.volume,
              color: bar.close >= bar.open ? c.volumeUp : c.volumeDown,
            }))
          );
        }
      }
      scheduleRender();
    });
  }, [theme, scheduleRender]);

  // ── Right-click context menu ────────────────────────────────────

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;

    const onContext = (e) => {
      e.preventDefault();
      if (!candleSeriesRef.current) return;
      const rect = el.getBoundingClientRect();
      const my = e.clientY - rect.top;
      const price = candleSeriesRef.current.coordinateToPrice(my);
      if (price == null) return;
      setCtxMenu({ x: e.clientX - rect.left, y: e.clientY - rect.top, price });
    };

    const dismiss = () => setCtxMenu(null);
    el.addEventListener("contextmenu", onContext);
    window.addEventListener("click", dismiss);
    window.addEventListener("scroll", dismiss, true);
    return () => {
      el.removeEventListener("contextmenu", onContext);
      window.removeEventListener("click", dismiss);
      window.removeEventListener("scroll", dismiss, true);
    };
  }, []);

  // ── Cursor for active tool ──────────────────────────────────────

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    if (activeTool === "__scissor__") {
      el.style.cursor = 'url("data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' width=\'28\' height=\'28\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%23f7c948\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'><circle cx=\'6\' cy=\'6\' r=\'3\'/><circle cx=\'6\' cy=\'18\' r=\'3\'/><line x1=\'20\' y1=\'4\' x2=\'8.12\' y2=\'15.88\'/><line x1=\'14.47\' y1=\'14.48\' x2=\'20\' y2=\'20\'/><line x1=\'8.12\' y1=\'8.12\' x2=\'12\' y2=\'12\'/></svg>") 14 14, crosshair';
    } else if (activeTool) {
      el.style.cursor = "crosshair";
    } else {
      el.style.cursor = "";
    }
  }, [activeTool]);

  return (
    <div ref={wrapperRef} style={{ width: "100%", height: "100%", position: "relative" }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%", position: "relative", zIndex: 1 }} />
      <canvas
        ref={canvasRef}
        style={{
          position: "absolute", top: 0, left: 0,
          width: "100%", height: "100%",
          pointerEvents: "none", zIndex: 3,
        }}
      />
      {ctxMenu && (
        <div
          style={{
            position: "absolute",
            top: ctxMenu.y,
            left: ctxMenu.x,
            zIndex: 50,
            background: "var(--bg-secondary, #1e222d)",
            border: "1px solid var(--border-color, #2a2e39)",
            borderRadius: 6,
            boxShadow: "0 4px 16px rgba(0,0,0,0.5)",
            padding: "4px 0",
            minWidth: 180,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              navigator.clipboard.writeText(ctxMenu.price.toFixed(2));
              setCtxMenu(null);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              padding: "8px 14px",
              background: "none",
              border: "none",
              color: "var(--text-primary, #d1d4dc)",
              fontSize: 12,
              cursor: "pointer",
              textAlign: "left",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-primary, #131722)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
          >
            <span style={{ fontSize: 14 }}>📋</span>
            Copy Price — {ctxMenu.price.toFixed(2)}
          </button>
        </div>
      )}
    </div>
  );
}
