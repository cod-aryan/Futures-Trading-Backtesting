"use client";

import { TIMEFRAMES } from "@/lib/constants";

export default function Toolbar({
  symbols,
  selectedSymbol,
  onSymbolChange,
  timeframe,
  onTimeframeChange,
  activeTab,
  onTabChange,
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        background: "var(--bg-secondary)",
        borderBottom: "1px solid var(--border-color)",
        padding: "0 12px",
        height: 44,
        gap: 2,
        flexShrink: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          fontWeight: 800,
          fontSize: 15,
          marginRight: 16,
          color: "var(--accent-blue)",
          letterSpacing: -0.5,
        }}
      >
        TradeBacktest
      </div>

      {/* Symbol Selector */}
      <select
        value={selectedSymbol}
        onChange={(e) => onSymbolChange(e.target.value)}
        style={{
          background: "var(--bg-tertiary)",
          border: "none",
          color: "var(--text-primary)",
          padding: "6px 12px",
          borderRadius: 4,
          fontSize: 13,
          fontWeight: 600,
          cursor: "pointer",
          marginRight: 8,
        }}
      >
        {symbols.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      {/* Timeframe buttons */}
      <div style={{ display: "flex", gap: 2 }}>
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf}
            onClick={() => onTimeframeChange(tf)}
            style={{
              background:
                timeframe === tf ? "var(--accent-blue)" : "transparent",
              color:
                timeframe === tf ? "white" : "var(--text-secondary)",
              padding: "5px 10px",
              borderRadius: 3,
              fontSize: 12,
              fontWeight: 500,
            }}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Tab switching */}
      <div style={{ display: "flex", gap: 4 }}>
        <button
          className={activeTab === "trade" ? "btn-primary" : "btn-secondary"}
          style={{ padding: "6px 16px", fontSize: 12 }}
          onClick={() => onTabChange("trade")}
        >
          Trade
        </button>
        <button
          className={activeTab === "backtest" ? "btn-primary" : "btn-secondary"}
          style={{ padding: "6px 16px", fontSize: 12 }}
          onClick={() => onTabChange("backtest")}
        >
          Backtest
        </button>
        <button
          className={activeTab === "practice" ? "btn-primary" : "btn-secondary"}
          style={{ padding: "6px 16px", fontSize: 12 }}
          onClick={() => onTabChange("practice")}
        >
          Practice
        </button>
      </div>
    </div>
  );
}
