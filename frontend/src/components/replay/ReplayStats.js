"use client";

/**
 * Displays practice mode trade statistics.
 */
export default function ReplayStats({ stats, completedTrades }) {
  return (
    <div>
      {/* Stats grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 1,
          background: "var(--border-color)",
          borderRadius: 4,
          overflow: "hidden",
          marginBottom: 12,
        }}
      >
        {[
          { label: "Total Trades", value: stats.totalTrades },
          {
            label: "Win Rate",
            value: `${stats.winRate}%`,
            color:
              parseFloat(stats.winRate) >= 50
                ? "var(--accent-green)"
                : "var(--accent-red)",
          },
          {
            label: "Wins",
            value: stats.wins,
            color: "var(--accent-green)",
          },
          {
            label: "Losses",
            value: stats.losses,
            color: "var(--accent-red)",
          },
          {
            label: "Total PnL %",
            value: `${parseFloat(stats.totalPnl) >= 0 ? "+" : ""}${stats.totalPnl}%`,
            color:
              parseFloat(stats.totalPnl) >= 0
                ? "var(--accent-green)"
                : "var(--accent-red)",
          },
        ].map((s, i) => (
          <div
            key={i}
            style={{
              background: "var(--bg-primary)",
              padding: "8px 10px",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: 9,
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                letterSpacing: 0.5,
                marginBottom: 2,
              }}
            >
              {s.label}
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: s.color || "var(--text-primary)",
              }}
            >
              {s.value}
            </div>
          </div>
        ))}
      </div>

      {/* Trade history */}
      {completedTrades.length > 0 && (
        <div>
          <div
            style={{
              fontSize: 11,
              color: "var(--text-secondary)",
              fontWeight: 600,
              textTransform: "uppercase",
              marginBottom: 6,
              letterSpacing: 0.5,
            }}
          >
            Trade History
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            {completedTrades
              .slice()
              .reverse()
              .map((t, i) => (
                <div
                  key={i}
                  style={{
                    background: "var(--bg-primary)",
                    padding: "8px 10px",
                    borderRadius: 4,
                    borderLeft: `3px solid ${
                      (t.pnl || 0) > 0
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
                      marginBottom: 2,
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        color:
                          t.type === "long"
                            ? "var(--accent-green)"
                            : "var(--accent-red)",
                      }}
                    >
                      {t.type.toUpperCase()}
                    </span>
                    <span
                      style={{
                        fontWeight: 700,
                        color:
                          (t.pnl || 0) > 0
                            ? "var(--accent-green)"
                            : "var(--accent-red)",
                      }}
                    >
                      {(t.pnl || 0) > 0 ? "+" : ""}
                      {(t.pnl || 0).toFixed(2)}%
                    </span>
                  </div>
                  <div style={{ color: "var(--text-secondary)" }}>
                    {t.entry.toFixed(2)} → {t.exitPrice?.toFixed(2)} ({t.exitReason})
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
