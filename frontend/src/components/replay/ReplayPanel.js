"use client";

import { useState } from "react";
import ReplayStats from "./ReplayStats";

/**
 * Practice panel: replay controls, quick order, active positions, stats.
 */
export default function ReplayPanel({
  isActive,
  scissorMode,
  visibleCount,
  hiddenCount,
  positions,
  completedTrades,
  stats,
  onScissorStart,
  onScissorCancel,
  onStop,
  onStep,
  onPlacePosition,
  onRemovePosition,
  onClearAllOrders,
}) {
  const [quickSide, setQuickSide] = useState("long");
  const [quickEntry, setQuickEntry] = useState("");
  const [quickSl, setQuickSl] = useState("");
  const [quickTp, setQuickTp] = useState("");

  const sectionTitle = {
    fontSize: 10,
    color: "var(--text-secondary)",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
  };

  const btnStyle = (bg, color) => ({
    padding: "6px 12px",
    borderRadius: 4,
    border: "none",
    fontSize: 11,
    fontWeight: 700,
    cursor: "pointer",
    background: bg,
    color,
    flex: 1,
  });

  const inputStyle = {
    width: "100%",
    padding: "5px 8px",
    borderRadius: 4,
    border: "1px solid var(--border-color)",
    background: "var(--bg-primary)",
    color: "var(--text-primary)",
    fontSize: 11,
    outline: "none",
  };

  const handleQuickOrder = () => {
    const entry = parseFloat(quickEntry);
    const sl = parseFloat(quickSl) || 0;
    const tp = parseFloat(quickTp) || 0;
    if (isNaN(entry) || entry <= 0) return;
    onPlacePosition(quickSide, entry, sl, tp);
    setQuickEntry("");
    setQuickSl("");
    setQuickTp("");
  };

  return (
    <div
      style={{
        width: 280,
        background: "var(--bg-secondary)",
        borderLeft: "1px solid var(--border-color)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "10px 14px",
          borderBottom: "1px solid var(--border-color)",
          fontSize: 13,
          fontWeight: 700,
          color: "var(--text-primary)",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        🎯 Practice Mode
      </div>

      <div style={{ padding: 14, flex: 1, overflowY: "auto" }}>
        {/* ─── Replay Controls ─────────────────────────────────── */}
        {!isActive ? (
          <div>
            <div style={sectionTitle}>Start Practice</div>
            <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 10, lineHeight: 1.5 }}>
              Click the button below, then click anywhere on the chart to cut. Data to the right will be hidden — step candle by candle to practice.
            </div>
            {scissorMode ? (
              <>
                <div style={{
                  padding: "10px 12px",
                  background: "#f7c94815",
                  border: "1px solid #f7c94840",
                  borderRadius: 6,
                  fontSize: 12,
                  color: "#f7c948",
                  textAlign: "center",
                  marginBottom: 8,
                  fontWeight: 600,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f7c948" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
                    <line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/>
                  </svg>
                  Click on chart to cut
                </div>
                <button
                  onClick={onScissorCancel}
                  style={{
                    ...btnStyle("var(--bg-primary)", "var(--text-secondary)"),
                    width: "100%",
                    padding: "7px 0",
                  }}
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                onClick={onScissorStart}
                style={{
                  ...btnStyle("var(--accent-blue)", "#fff"),
                  width: "100%",
                  padding: "10px 0",
                  fontSize: 13,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/>
                  <line x1="20" y1="4" x2="8.12" y2="15.88"/><line x1="14.47" y1="14.48" x2="20" y2="20"/><line x1="8.12" y1="8.12" x2="12" y2="12"/>
                </svg>
                Cut Chart to Practice
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Navigation */}
            <div style={{ marginBottom: 16 }}>
              <div style={sectionTitle}>Navigation</div>
              <div
                style={{
                  fontSize: 11,
                  color: "var(--text-secondary)",
                  marginBottom: 8,
                }}
              >
                Candle {visibleCount} • {hiddenCount} remaining
              </div>
              <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                <button onClick={() => onStep(1)} style={btnStyle("var(--bg-primary)", "var(--text-primary)")}>
                  +1
                </button>
                <button onClick={() => onStep(5)} style={btnStyle("var(--bg-primary)", "var(--text-primary)")}>
                  +5
                </button>
                <button onClick={() => onStep(20)} style={btnStyle("var(--bg-primary)", "var(--text-primary)")}>
                  +20
                </button>
              </div>
              <button
                onClick={onStop}
                style={{
                  ...btnStyle("#ef535022", "#ef5350"),
                  width: "100%",
                }}
              >
                ■ Stop Replay
              </button>
            </div>

            {/* ─── Quick Order ───────────────────────────────────── */}
            <div style={{ marginBottom: 16 }}>
              <div style={sectionTitle}>Quick Order</div>
              <div style={{ display: "flex", gap: 4, marginBottom: 8 }}>
                <button
                  onClick={() => setQuickSide("long")}
                  style={{
                    ...btnStyle(
                      quickSide === "long" ? "var(--accent-green)" : "var(--bg-primary)",
                      quickSide === "long" ? "#fff" : "var(--text-secondary)"
                    ),
                  }}
                >
                  ▲ Long
                </button>
                <button
                  onClick={() => setQuickSide("short")}
                  style={{
                    ...btnStyle(
                      quickSide === "short" ? "var(--accent-red)" : "var(--bg-primary)",
                      quickSide === "short" ? "#fff" : "var(--text-secondary)"
                    ),
                  }}
                >
                  ▼ Short
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                <input
                  type="number"
                  placeholder="Entry price"
                  value={quickEntry}
                  onChange={(e) => setQuickEntry(e.target.value)}
                  style={inputStyle}
                />
                <div style={{ display: "flex", gap: 4 }}>
                  <input
                    type="number"
                    placeholder="Stop Loss"
                    value={quickSl}
                    onChange={(e) => setQuickSl(e.target.value)}
                    style={inputStyle}
                  />
                  <input
                    type="number"
                    placeholder="Take Profit"
                    value={quickTp}
                    onChange={(e) => setQuickTp(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <button
                  onClick={handleQuickOrder}
                  style={{
                    ...btnStyle(
                      quickSide === "long" ? "var(--accent-green)" : "var(--accent-red)",
                      "#fff"
                    ),
                    width: "100%",
                    padding: "7px 0",
                  }}
                >
                  Place {quickSide.toUpperCase()} Order
                </button>
              </div>
              <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 4 }}>
                Tip: Use drawing tools ▲Long / ▼Short to place visually on chart
              </div>
            </div>

            {/* ─── Active Positions ──────────────────────────────── */}
            {positions.filter((p) => p.active).length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={sectionTitle}>Orders & Positions</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
                  {positions
                    .filter((p) => p.active)
                    .map((p) => {
                      const isPending = !p.executed;
                      return (
                        <div
                          key={p.id}
                          style={{
                            background: "var(--bg-primary)",
                            padding: "6px 8px",
                            borderRadius: 4,
                            borderLeft: `3px solid ${
                              isPending
                                ? "var(--accent-yellow)"
                                : p.type === "long"
                                  ? "var(--accent-green)"
                                  : "var(--accent-red)"
                            }`,
                            fontSize: 11,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                          }}
                        >
                          <div>
                            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                              <span
                                style={{
                                  fontWeight: 700,
                                  color: p.type === "long" ? "var(--accent-green)" : "var(--accent-red)",
                                }}
                              >
                                {p.type.toUpperCase()}
                              </span>
                              <span
                                style={{
                                  fontSize: 9,
                                  fontWeight: 700,
                                  padding: "1px 5px",
                                  borderRadius: 3,
                                  background: isPending ? "#f7c94822" : "#26a69a22",
                                  color: isPending ? "var(--accent-yellow)" : "var(--accent-green)",
                                }}
                              >
                                {isPending ? "⏳ PENDING" : "✓ FILLED"}
                              </span>
                            </div>
                            <span style={{ color: "var(--text-secondary)" }}>
                              @ {p.entry.toFixed(2)}
                            </span>
                            <br />
                            <span style={{ color: "var(--text-secondary)", fontSize: 10 }}>
                              SL: {p.sl?.toFixed(2) || "None"} | TP: {p.tp?.toFixed(2) || "None"}
                            </span>
                          </div>
                          <button
                            onClick={() => onRemovePosition(p.id)}
                            title={isPending ? "Cancel order" : "Close position"}
                            style={{
                              background: "none",
                              border: "none",
                              color: "#ef5350",
                              cursor: "pointer",
                              fontSize: 14,
                              padding: 4,
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}

            {/* ─── Clear All ────────────────────────────────────── */}
            {(positions.length > 0 || completedTrades.length > 0) && (
              <div style={{ marginBottom: 16 }}>
                <button
                  onClick={onClearAllOrders}
                  style={{
                    ...btnStyle("#ef535018", "#ef5350"),
                    width: "100%",
                    padding: "7px 0",
                    fontSize: 11,
                    border: "1px solid #ef535033",
                  }}
                >
                  🗑 Clear All Orders & History
                </button>
              </div>
            )}

            {/* ─── Stats ────────────────────────────────────────── */}
            <ReplayStats stats={stats} completedTrades={completedTrades} />
          </>
        )}
      </div>
    </div>
  );
}
