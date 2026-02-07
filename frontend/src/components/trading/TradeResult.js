"use client";

/**
 * Displays the result of a single manual trade simulation.
 */
export default function TradeResult({ result }) {
  if (!result) return null;

  if (result.error) {
    return (
      <div style={{ marginTop: 16, color: "var(--accent-red)", fontSize: 12 }}>
        Error: {result.error}
      </div>
    );
  }

  return (
    <div
      style={{
        marginTop: 16,
        background: "var(--bg-primary)",
        padding: 12,
        borderRadius: 4,
        borderLeft: `3px solid ${
          result.pnl >= 0 ? "var(--accent-green)" : "var(--accent-red)"
        }`,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 700,
          marginBottom: 8,
          color: result.pnl >= 0 ? "var(--accent-green)" : "var(--accent-red)",
        }}
      >
        Trade Result: {result.exit_reason}
      </div>
      <div style={{ fontSize: 11, lineHeight: 1.8 }}>
        <div>
          Entry: <strong>${result.entry_price}</strong>
        </div>
        <div>
          Exit: <strong>${result.exit_price}</strong>
        </div>
        <div>
          PnL:{" "}
          <strong className={result.pnl >= 0 ? "pnl-positive" : "pnl-negative"}>
            ${result.pnl} ({result.pnl_pct}%)
          </strong>
        </div>
        <div>
          Exit Reason: <strong>{result.exit_reason}</strong>
        </div>
      </div>
    </div>
  );
}
