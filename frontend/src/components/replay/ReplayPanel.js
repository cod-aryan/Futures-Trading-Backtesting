"use client";

import ReplayStats from "./ReplayStats";

/**
 * Right sidebar panel for Practice/Replay mode.
 * Contains start/stop, navigation, active positions, and stats.
 */
export default function ReplayPanel({
  replay,
  onRemovePosition,
}) {
  const {
    isActive,
    visibleCount,
    hiddenCount,
    positions,
    completedTrades,
    stats,
    startPercent,
    setStartPercent,
    startReplay,
    stopReplay,
    stepForward,
  } = replay;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "100%",
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--border-color)",
          fontWeight: 700,
          fontSize: 14,
        }}
      >
        Practice Mode
      </div>

      <div style={{ padding: 16, flex: 1, overflowY: "auto" }}>
        {!isActive ? (
          /* ── Setup ────────────────────────────────── */
          <div>
            <div
              style={{
                background: "var(--bg-primary)",
                padding: 12,
                borderRadius: 4,
                marginBottom: 14,
              }}
            >
              <div style={{ ...labelStyle, marginBottom: 8 }}>
                Start from ({startPercent}% of data)
              </div>
              <input
                type="range"
                min={10}
                max={95}
                value={startPercent}
                onChange={(e) => setStartPercent(Number(e.target.value))}
                style={{ width: "100%", accentColor: "var(--accent-blue)" }}
              />
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 10,
                  color: "var(--text-secondary)",
                  marginTop: 4,
                }}
              >
                <span>10%</span>
                <span>95%</span>
              </div>
            </div>

            <div
              style={{
                background: "var(--bg-primary)",
                padding: 12,
                borderRadius: 4,
                marginBottom: 14,
                fontSize: 11,
                color: "var(--text-secondary)",
                lineHeight: 1.6,
              }}
            >
              <strong style={{ color: "var(--text-primary)" }}>How it works:</strong>
              <br />
              1. Set how much historical data to show
              <br />
              2. Use drawing tools to analyze the chart
              <br />
              3. Place Long/Short positions with SL/TP
              <br />
              4. Click Next to reveal candles one by one
              <br />
              5. SL/TP hits are detected automatically
            </div>

            <button
              className="btn-primary"
              style={{ width: "100%", padding: "12px 0", fontSize: 14 }}
              onClick={startReplay}
            >
              Start Practice
            </button>
          </div>
        ) : (
          /* ── Active Replay ────────────────────────── */
          <div>
            {/* Navigation */}
            <div
              style={{
                background: "var(--bg-primary)",
                padding: 12,
                borderRadius: 4,
                marginBottom: 14,
              }}
            >
              <div style={{ ...labelStyle, marginBottom: 8 }}>
                Navigation ({hiddenCount} candles remaining)
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: 6,
                  marginBottom: 8,
                }}
              >
                <button
                  className="btn-primary"
                  style={{ padding: "10px 0", fontSize: 12 }}
                  onClick={() => stepForward(1)}
                  disabled={hiddenCount === 0}
                >
                  Next 1
                </button>
                <button
                  className="btn-primary"
                  style={{ padding: "10px 0", fontSize: 12 }}
                  onClick={() => stepForward(5)}
                  disabled={hiddenCount === 0}
                >
                  Next 5
                </button>
                <button
                  className="btn-primary"
                  style={{ padding: "10px 0", fontSize: 12 }}
                  onClick={() => stepForward(20)}
                  disabled={hiddenCount === 0}
                >
                  Next 20
                </button>
              </div>

              {/* Progress bar */}
              <div
                style={{
                  height: 4,
                  background: "var(--bg-tertiary)",
                  borderRadius: 2,
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${(visibleCount / (visibleCount + hiddenCount)) * 100}%`,
                    background: "var(--accent-blue)",
                    transition: "width 0.15s ease",
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--text-secondary)",
                  marginTop: 4,
                  textAlign: "center",
                }}
              >
                {visibleCount} / {visibleCount + hiddenCount} candles
              </div>

              {hiddenCount === 0 && (
                <div
                  style={{
                    textAlign: "center",
                    color: "var(--accent-yellow)",
                    fontSize: 11,
                    fontWeight: 600,
                    marginTop: 8,
                  }}
                >
                  All candles revealed!
                </div>
              )}
            </div>

            {/* Active Positions */}
            {positions.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <div style={{ ...labelStyle, marginBottom: 6 }}>
                  Active Positions ({positions.length})
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 6,
                  }}
                >
                  {positions.map((pos) => (
                    <div
                      key={pos.id}
                      style={{
                        background: "var(--bg-primary)",
                        padding: "8px 10px",
                        borderRadius: 4,
                        borderLeft: `3px solid ${
                          pos.type === "long"
                            ? "var(--accent-green)"
                            : "var(--accent-red)"
                        }`,
                        fontSize: 11,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          marginBottom: 4,
                        }}
                      >
                        <span
                          style={{
                            fontWeight: 700,
                            color:
                              pos.type === "long"
                                ? "var(--accent-green)"
                                : "var(--accent-red)",
                          }}
                        >
                          {pos.type.toUpperCase()} @ {pos.entry.toFixed(2)}
                        </span>
                        <button
                          onClick={() => onRemovePosition(pos.id)}
                          style={{
                            background: "none",
                            color: "var(--text-secondary)",
                            fontSize: 12,
                            cursor: "pointer",
                            padding: "0 4px",
                            border: "none",
                          }}
                        >
                          ✕
                        </button>
                      </div>
                      <div style={{ color: "var(--text-secondary)" }}>
                        {pos.sl && (
                          <span style={{ color: "var(--accent-red)" }}>
                            SL: {pos.sl.toFixed(2)}{" "}
                          </span>
                        )}
                        {pos.tp && (
                          <span style={{ color: "var(--accent-green)" }}>
                            TP: {pos.tp.toFixed(2)}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Stats */}
            <ReplayStats stats={stats} completedTrades={completedTrades} />

            {/* Stop */}
            <button
              className="btn-secondary"
              style={{
                width: "100%",
                padding: "10px 0",
                fontSize: 12,
                marginTop: 14,
                color: "var(--accent-red)",
                borderColor: "var(--accent-red)",
              }}
              onClick={stopReplay}
            >
              Stop Practice
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const labelStyle = {
  fontSize: 11,
  color: "var(--text-secondary)",
  fontWeight: 600,
  textTransform: "uppercase",
  letterSpacing: 0.5,
};
