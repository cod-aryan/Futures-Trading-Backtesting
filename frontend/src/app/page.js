"use client";

import dynamic from "next/dynamic";
import { useEffect, useCallback, useState } from "react";

import useMarketData from "@/hooks/useMarketData";
import useReplay from "@/hooks/useReplay";
import useDrawings from "@/hooks/useDrawings";
import useTheme from "@/hooks/useTheme";

import Toolbar from "@/components/toolbar/Toolbar";
import DrawingToolbar from "@/components/replay/DrawingToolbar";
import ReplayPanel from "@/components/replay/ReplayPanel";

const Chart = dynamic(() => import("@/components/chart/Chart"), { ssr: false });

export default function Home() {
  const { theme, isDark, toggleTheme } = useTheme();

  const {
    symbols, selectedSymbol, timeframe, ohlcvData, dataLoading,
    lastPrice, priceChange, setSelectedSymbol, setTimeframe,
    hasMore, loadMore, loadingMore,
  } = useMarketData();

  const {
    isActive, visibleData, visibleCount, hiddenCount,
    positions, completedTrades, stats,
    cutAtIndex, stopReplay, stepForward,
    placePosition, removePosition, updatePosition, clearAllOrders,
  } = useReplay(ohlcvData, `${selectedSymbol}`);

  const [scissorMode, setScissorMode] = useState(false);

  const {
    drawings, activeTool, selectedId, hoveredId, currentStep,
    pendingPosition, canUndo, canRedo,
    selectTool, cancelTool, handleChartClick, selectDrawing,
    removeDrawing, removeSelected, removeLastDrawing, clearDrawings,
    updateDrawing, undo, redo,
    setHoveredId, getStepLabel,
  } = useDrawings(placePosition, `${selectedSymbol}`);

  // Crosshair data
  const [crosshairData, setCrosshairData] = useState(null);

  // Chart data source
  const chartData = isActive ? visibleData : ohlcvData;

  // ── Keyboard shortcuts ────────────────────────────────────────

  useEffect(() => {
    const handleKey = (e) => {
      // Ignore if user is in an input
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.tagName === "SELECT") return;

      switch (e.key) {
        case "Escape":
          cancelTool();
          setScissorMode(false);
          break;
        case "Delete":
        case "Backspace":
          if (selectedId != null) {
            e.preventDefault();
            removeSelected();
          }
          break;
        case " ": // Space
        case "ArrowRight":
          if (isActive) {
            e.preventDefault();
            stepForward(1);
          }
          break;
        case "ArrowLeft":
          // No step back, but prevent default
          break;
        case "z":
          if ((e.ctrlKey || e.metaKey) && e.shiftKey) {
            e.preventDefault();
            redo();
          } else if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            undo();
          }
          break;
        case "y":
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            redo();
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [isActive, selectedId, cancelTool, removeSelected, stepForward, undo, redo, scissorMode]);

  // ── Handlers ──────────────────────────────────────────────────

  const onChartClick = useCallback(
    (time, price) => {
      if (scissorMode) {
        // Find the candle index for this time
        if (ohlcvData && ohlcvData.length > 0) {
          let idx = ohlcvData.findIndex((c) => c.time >= time);
          if (idx < 0) idx = ohlcvData.length;
          if (idx > 0) {
            cutAtIndex(idx);
            setScissorMode(false);
          }
        }
        return;
      }
      handleChartClick(time, price);
    },
    [scissorMode, ohlcvData, cutAtIndex, handleChartClick]
  );

  const onDrawingSelect = useCallback(
    (id) => {
      selectDrawing(id);
    },
    [selectDrawing]
  );

  const onDrawingHover = useCallback(
    (id) => {
      setHoveredId(id);
    },
    [setHoveredId]
  );

  const onPositionUpdate = useCallback(
    (posId, field, value) => {
      updatePosition(posId, field, value);
    },
    [updatePosition]
  );

  const onDrawingUpdate = useCallback(
    (id, changes) => {
      updateDrawing(id, changes);
    },
    [updateDrawing]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", width: "100vw" }}>
      {/* Top toolbar */}
      <Toolbar
        symbols={symbols}
        selectedSymbol={selectedSymbol}
        timeframe={timeframe}
        onSymbolChange={setSelectedSymbol}
        onTimeframeChange={setTimeframe}
        lastPrice={lastPrice}
        priceChange={priceChange}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        replayActive={isActive}
      />

      {/* Drawing toolbar (always visible when replay active) */}
      {isActive && (
        <DrawingToolbar
          activeTool={activeTool}
          selectedId={selectedId}
          stepLabel={getStepLabel()}
          canUndo={canUndo}
          canRedo={canRedo}
          onSelectTool={selectTool}
          onRemoveSelected={removeSelected}
          onClearAll={clearDrawings}
          onUndo={undo}
          onRedo={redo}
        />
      )}

      {/* Main content area */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Chart area */}
        <div style={{ flex: 1, position: "relative" }}>
          {dataLoading && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 10,
                color: "var(--text-secondary)",
                fontSize: 13,
              }}
            >
              Loading data...
            </div>
          )}

          {loadingMore && (
            <div
              style={{
                position: "absolute",
                top: 8,
                left: "50%",
                transform: "translateX(-50%)",
                zIndex: 10,
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-color)",
                borderRadius: 6,
                padding: "6px 16px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 11,
                fontWeight: 600,
                color: "var(--text-secondary)",
                boxShadow: "0 2px 8px var(--shadow-color)",
                pointerEvents: "none",
              }}
            >
              <span className="spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
              Loading older candles…
            </div>
          )}

          {/* OHLC overlay */}
          {crosshairData && (
            <div
              style={{
                position: "absolute",
                top: 8,
                left: 8,
                zIndex: 5,
                display: "flex",
                gap: 12,
                fontSize: 11,
                fontFamily: "'SF Mono', Consolas, monospace",
                pointerEvents: "none",
              }}
            >
              <span style={{ color: "var(--text-secondary)" }}>
                O <span style={{ color: "var(--text-primary)" }}>{crosshairData.open?.toFixed(2)}</span>
              </span>
              <span style={{ color: "var(--text-secondary)" }}>
                H <span style={{ color: "var(--text-primary)" }}>{crosshairData.high?.toFixed(2)}</span>
              </span>
              <span style={{ color: "var(--text-secondary)" }}>
                L <span style={{ color: "var(--text-primary)" }}>{crosshairData.low?.toFixed(2)}</span>
              </span>
              <span style={{ color: "var(--text-secondary)" }}>
                C{" "}
                <span
                  style={{
                    color:
                      crosshairData.close >= crosshairData.open
                        ? "var(--accent-green)"
                        : "var(--accent-red)",
                  }}
                >
                  {crosshairData.close?.toFixed(2)}
                </span>
              </span>
            </div>
          )}

          <Chart
            data={chartData}
            drawings={drawings}
            positions={[...positions, ...(pendingPosition ? [pendingPosition] : [])]}
            activeTool={scissorMode ? "__scissor__" : activeTool}
            selectedDrawingId={selectedId}
            hoveredDrawingId={hoveredId}
            theme={theme}
            hasMore={hasMore}
            onLoadMore={loadMore}
            onChartClick={onChartClick}
            onPositionUpdate={onPositionUpdate}
            onDrawingUpdate={onDrawingUpdate}
            onDrawingHover={onDrawingHover}
            onDrawingSelect={onDrawingSelect}
            onCrosshairMove={setCrosshairData}
          />
        </div>

        {/* Side panel */}
        <ReplayPanel
          isActive={isActive}
          scissorMode={scissorMode}
          visibleCount={visibleCount}
          hiddenCount={hiddenCount}
          positions={positions}
          completedTrades={completedTrades}
          stats={stats}
          onScissorStart={() => setScissorMode(true)}
          onScissorCancel={() => setScissorMode(false)}
          onStop={stopReplay}
          onStep={stepForward}
          onPlacePosition={placePosition}
          onRemovePosition={removePosition}
          onClearAllOrders={clearAllOrders}
        />
      </div>
    </div>
  );
}
