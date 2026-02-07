"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import Toolbar from "@/components/toolbar/Toolbar";
import TradingPanel from "@/components/trading/TradingPanel";
import BacktestPanel from "@/components/backtest/BacktestPanel";
import BacktestResults from "@/components/backtest/BacktestResults";
import useMarketData from "@/hooks/useMarketData";
import useBacktest from "@/hooks/useBacktest";
import useTrade from "@/hooks/useTrade";
import useReplay from "@/hooks/useReplay";
import useDrawings from "@/hooks/useDrawings";
import DrawingToolbar from "@/components/replay/DrawingToolbar";
import ReplayPanel from "@/components/replay/ReplayPanel";

const Chart = dynamic(() => import("@/components/chart/Chart"), { ssr: false });

export default function Home() {
  const {
    symbols,
    selectedSymbol,
    setSelectedSymbol,
    timeframe,
    setTimeframe,
    ohlcvData,
    dataLoading,
    lastPrice,
    priceChange,
  } = useMarketData("BTCUSDT", "1h");

  const [activeTab, setActiveTab] = useState("trade");
  const [crosshairData, setCrosshairData] = useState(null);

  const { backtestResult, loading, handleBacktest } = useBacktest();
  const { handleManualTrade } = useTrade({
    selectedSymbol,
    timeframe,
    crosshairData,
    ohlcvData,
  });

  const replay = useReplay(ohlcvData);
  const drawingTools = useDrawings(replay.placePosition);

  const handleCrosshairMove = useCallback((data) => {
    setCrosshairData(data);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") drawingTools.cancelTool();
      if ((e.metaKey || e.ctrlKey) && e.key === "z") {
        e.preventDefault();
        drawingTools.removeLastDrawing();
      }
      if (activeTab === "practice" && replay.isActive) {
        if (e.key === " " || e.key === "ArrowRight") {
          e.preventDefault();
          replay.stepForward(1);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeTab, replay, drawingTools]);

  const chartData = activeTab === "practice" && replay.isActive
    ? replay.visibleData
    : ohlcvData;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh" }}>
      {/* Top Toolbar */}
      <Toolbar
        symbols={symbols}
        selectedSymbol={selectedSymbol}
        onSymbolChange={setSelectedSymbol}
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Price Info Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 24,
          padding: "6px 16px",
          background: "var(--bg-secondary)",
          borderBottom: "1px solid var(--border-color)",
          fontSize: 12,
          flexShrink: 0,
        }}
      >
        <div>
          <span style={{ color: "var(--text-secondary)", marginRight: 6 }}>
            {selectedSymbol}
          </span>
          <span
            style={{
              fontSize: 18,
              fontWeight: 700,
              color:
                priceChange >= 0
                  ? "var(--accent-green)"
                  : "var(--accent-red)",
            }}
          >
            {crosshairData
              ? crosshairData.close?.toFixed(2)
              : lastPrice?.toFixed(2) || "—"}
          </span>
        </div>
        {crosshairData && (
          <>
            <div>
              <span style={{ color: "var(--text-secondary)" }}>O </span>
              <span>{crosshairData.open?.toFixed(2)}</span>
            </div>
            <div>
              <span style={{ color: "var(--text-secondary)" }}>H </span>
              <span style={{ color: "var(--accent-green)" }}>
                {crosshairData.high?.toFixed(2)}
              </span>
            </div>
            <div>
              <span style={{ color: "var(--text-secondary)" }}>L </span>
              <span style={{ color: "var(--accent-red)" }}>
                {crosshairData.low?.toFixed(2)}
              </span>
            </div>
            <div>
              <span style={{ color: "var(--text-secondary)" }}>C </span>
              <span>{crosshairData.close?.toFixed(2)}</span>
            </div>
          </>
        )}
        {priceChange !== null && !crosshairData && (
          <span
            style={{
              color:
                priceChange >= 0
                  ? "var(--accent-green)"
                  : "var(--accent-red)",
              fontWeight: 600,
            }}
          >
            {priceChange >= 0 ? "+" : ""}
            {priceChange.toFixed(2)}%
          </span>
        )}
        <div style={{ flex: 1 }} />
        <span style={{ color: "var(--text-secondary)" }}>
          {activeTab === "practice" && replay.isActive
            ? `${replay.visibleCount.toLocaleString()} / ${ohlcvData.length.toLocaleString()} candles`
            : `${ohlcvData.length.toLocaleString()} candles`}
        </span>
      </div>

      {/* Main Content */}
      <div style={{ display: "flex", flex: 1, minHeight: 0 }}>
        {/* Chart Area */}
        <div
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minWidth: 0,
          }}
        >
          {/* Chart */}
          <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
            {dataLoading && (
              <div
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(19,23,34,0.8)",
                  zIndex: 10,
                }}
              >
                <div className="spinner" />
              </div>
            )}
            {activeTab === "practice" && replay.isActive && (
              <DrawingToolbar
                activeTool={drawingTools.activeTool}
                stepLabel={drawingTools.getStepLabel()}
                onSelectTool={drawingTools.selectTool}
                onClear={drawingTools.clearDrawings}
                onUndo={drawingTools.removeLastDrawing}
              />
            )}
            <Chart
              data={chartData}
              trades={activeTab === "backtest" ? backtestResult?.trades : null}
              overlays={activeTab === "backtest" ? backtestResult?.overlay : null}
              drawings={activeTab === "practice" ? drawingTools.drawings : []}
              positions={activeTab === "practice" ? replay.positions : []}
              activeTool={activeTab === "practice" ? drawingTools.activeTool : null}
              onChartClick={activeTab === "practice" ? drawingTools.handleChartClick : null}
              onCrosshairMove={handleCrosshairMove}
            />
          </div>

          {/* Bottom panel - Backtest Results (when backtest tab is active and we have results) */}
          {activeTab === "backtest" && backtestResult && (
            <div
              style={{
                height: 320,
                borderTop: "1px solid var(--border-color)",
                background: "var(--bg-secondary)",
                overflowY: "auto",
                flexShrink: 0,
              }}
            >
              <BacktestResults result={backtestResult} />
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div
          style={{
            width: 320,
            flexShrink: 0,
            background: "var(--bg-secondary)",
            borderLeft: "1px solid var(--border-color)",
            overflowY: "auto",
          }}
        >
          {activeTab === "practice" ? (
            <ReplayPanel
              replay={replay}
              onRemovePosition={replay.removePosition}
            />
          ) : activeTab === "trade" ? (
            <TradingPanel
              symbol={selectedSymbol}
              currentPrice={
                crosshairData?.close || lastPrice
              }
              onSubmitTrade={handleManualTrade}
            />
          ) : (
            <BacktestPanel
              symbol={selectedSymbol}
              timeframe={timeframe}
              onRunBacktest={handleBacktest}
              loading={loading}
            />
          )}
        </div>
      </div>

      {/* Loading overlay for backtest */}
      {loading && (
        <div className="loading-overlay">
          <div style={{ textAlign: "center" }}>
            <div className="spinner" style={{ margin: "0 auto 12px" }} />
            <div style={{ color: "var(--text-primary)", fontSize: 14 }}>
              Running backtest...
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
