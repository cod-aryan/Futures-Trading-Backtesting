"use client";

import { TIMEFRAMES } from "@/lib/constants";

/**
 * Top toolbar: logo, symbol selector, timeframe picker.
 * Practice-only — no Trade/Backtest tabs.
 */
export default function Toolbar({
  symbols,
  selectedSymbol,
  timeframe,
  onSymbolChange,
  onTimeframeChange,
  lastPrice,
  priceChange,
  isDark,
  onToggleTheme,
  replayActive,
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        padding: "0 12px",
        height: 44,
        background: "var(--bg-secondary)",
        borderBottom: "1px solid var(--border-color)",
        gap: 10,
      }}
    >
      {/* Logo */}
      <div
        style={{
          fontWeight: 800,
          fontSize: 14,
          color: "var(--text-primary)",
          letterSpacing: -0.3,
          marginRight: 8,
          userSelect: "none",
        }}
      >
        <span style={{ color: "var(--accent-blue)" }}>Trade</span>Practice
      </div>

      {/* Divider */}
      <div style={{ width: 1, height: 22, background: "var(--border-color)" }} />

      {/* Symbol selector */}
      <select
        value={selectedSymbol}
        onChange={(e) => onSymbolChange(e.target.value)}
        disabled={replayActive}
        title={replayActive ? "Stop replay to change symbol" : undefined}
        style={{
          background: "var(--bg-primary)",
          color: "var(--text-primary)",
          border: "1px solid var(--border-color)",
          borderRadius: 4,
          padding: "4px 8px",
          fontSize: 12,
          fontWeight: 700,
          cursor: replayActive ? "not-allowed" : "pointer",
          outline: "none",
          opacity: replayActive ? 0.4 : 1,
        }}
      >
        {symbols.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>

      {/* Price display */}
      {lastPrice != null && (
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
            {lastPrice.toFixed(2)}
          </span>
          {priceChange != null && (
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                color: priceChange >= 0 ? "var(--accent-green)" : "var(--accent-red)",
              }}
            >
              {priceChange >= 0 ? "+" : ""}
              {priceChange.toFixed(2)}%
            </span>
          )}
        </div>
      )}

      {/* Divider */}
      <div style={{ width: 1, height: 22, background: "var(--border-color)" }} />

      {/* Timeframe buttons */}
      <div style={{ display: "flex", gap: 2, position: "relative" }}>
        {TIMEFRAMES.map((tf) => (
          <button
            key={tf}
            onClick={() => !replayActive && onTimeframeChange(tf)}
            disabled={replayActive && timeframe !== tf}
            title={replayActive ? "Stop replay to change timeframe" : undefined}
            style={{
              padding: "4px 8px",
              borderRadius: 3,
              border: "none",
              fontSize: 11,
              fontWeight: 600,
              cursor: replayActive && timeframe !== tf ? "not-allowed" : "pointer",
              background: timeframe === tf ? "var(--accent-blue)" : "transparent",
              color: timeframe === tf ? "#fff" : "var(--text-secondary)",
              opacity: replayActive && timeframe !== tf ? 0.35 : 1,
              transition: "all 0.15s",
            }}
          >
            {tf}
          </button>
        ))}
      </div>

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Theme toggle */}
      <button
        onClick={onToggleTheme}
        title={isDark ? "Switch to Light mode" : "Switch to Dark mode"}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 30,
          height: 30,
          borderRadius: 6,
          background: "var(--bg-tertiary)",
          border: "1px solid var(--border-color)",
          color: "var(--text-primary)",
          fontSize: 15,
          cursor: "pointer",
          transition: "all 0.2s",
          marginRight: 8,
        }}
      >
        {isDark ? "☀️" : "🌙"}
      </button>

      {/* Keyboard shortcuts hint */}
      <div
        style={{
          fontSize: 10,
          color: "var(--text-secondary)",
          opacity: 0.6,
        }}
      >
        Space: step • Del: delete drawing • Esc: cancel
      </div>
    </div>
  );
}
