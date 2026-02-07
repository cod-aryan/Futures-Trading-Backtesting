"use client";

/**
 * Table displaying individual trade rows from a backtest.
 */
export default function TradesTable({ trades }) {
  if (!trades || trades.length === 0) return null;

  return (
    <div style={{ padding: "0 16px 16px" }}>
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          marginBottom: 8,
          color: "var(--text-secondary)",
        }}
      >
        Trade History ({trades.length})
      </div>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 11 }}>
          <thead>
            <tr
              style={{
                background: "var(--bg-tertiary)",
                color: "var(--text-secondary)",
                textTransform: "uppercase",
                fontSize: 10,
                letterSpacing: 0.5,
              }}
            >
              <th style={thStyle}>#</th>
              <th style={thStyle}>Side</th>
              <th style={thStyle}>Entry</th>
              <th style={thStyle}>Exit</th>
              <th style={thStyle}>PnL</th>
              <th style={thStyle}>Reason</th>
            </tr>
          </thead>
          <tbody>
            {trades.slice(0, 100).map((t, i) => (
              <tr key={i} style={{ borderBottom: "1px solid var(--border-color)" }}>
                <td style={tdStyle}>{i + 1}</td>
                <td
                  style={{
                    ...tdStyle,
                    color: t.side === "long" ? "var(--accent-green)" : "var(--accent-red)",
                    fontWeight: 600,
                  }}
                >
                  {t.side?.toUpperCase()}
                </td>
                <td style={tdStyle}>${t.entry_price?.toFixed(2)}</td>
                <td style={tdStyle}>${t.exit_price?.toFixed(2)}</td>
                <td
                  style={{
                    ...tdStyle,
                    color: t.pnl >= 0 ? "var(--accent-green)" : "var(--accent-red)",
                    fontWeight: 600,
                  }}
                >
                  {t.pnl >= 0 ? "+" : ""}${t.pnl?.toFixed(2)}
                </td>
                <td style={tdStyle}>{t.exit_reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {trades.length > 100 && (
          <div
            style={{
              textAlign: "center",
              padding: 8,
              color: "var(--text-secondary)",
              fontSize: 11,
            }}
          >
            Showing first 100 of {trades.length} trades
          </div>
        )}
      </div>
    </div>
  );
}

const thStyle = { padding: "8px 10px", textAlign: "left", fontWeight: 600 };
const tdStyle = { padding: "8px 10px" };
