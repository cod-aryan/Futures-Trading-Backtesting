"use client";

/**
 * Grid showing key backtest statistics.
 */
export default function StatsGrid({ result }) {
  const stats = [
    { label: "Initial Capital", value: `$${result.initial_capital?.toLocaleString()}` },
    {
      label: "Final Capital",
      value: `$${result.final_capital?.toLocaleString()}`,
      color: result.total_pnl >= 0 ? "var(--accent-green)" : "var(--accent-red)",
    },
    {
      label: "Total PnL",
      value: `$${result.total_pnl?.toLocaleString()}`,
      color: result.total_pnl >= 0 ? "var(--accent-green)" : "var(--accent-red)",
    },
    { label: "Total Trades", value: result.total_trades },
    { label: "Winning", value: result.winning_trades, color: "var(--accent-green)" },
    { label: "Losing", value: result.losing_trades, color: "var(--accent-red)" },
    {
      label: "Win Rate",
      value: `${result.win_rate}%`,
      color: result.win_rate >= 50 ? "var(--accent-green)" : "var(--accent-red)",
    },
    {
      label: "Max Drawdown",
      value: `$${result.max_drawdown?.toLocaleString()}`,
      color: "var(--accent-red)",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        gap: 1,
        background: "var(--border-color)",
        borderBottom: "1px solid var(--border-color)",
      }}
    >
      {stats.map((s, i) => (
        <div
          key={i}
          style={{
            background: "var(--bg-secondary)",
            padding: "10px 12px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: "var(--text-secondary)",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              marginBottom: 4,
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
  );
}
