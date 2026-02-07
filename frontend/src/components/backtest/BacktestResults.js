"use client";

import StatsGrid from "./StatsGrid";
import EquityCurveChart from "./EquityCurveChart";
import TradesTable from "./TradesTable";

/**
 * Combined backtest results view: stats, equity curve, and trade history.
 */
export default function BacktestResults({ result }) {
  if (!result) return null;

  if (result.error) {
    return (
      <div style={{ padding: 16, color: "var(--accent-red)" }}>
        Error: {result.error}
      </div>
    );
  }

  return (
    <div style={{ height: "100%", overflowY: "auto" }}>
      <StatsGrid result={result} />
      <EquityCurveChart
        equityCurve={result.equity_curve}
        totalPnl={result.total_pnl}
      />
      <TradesTable trades={result.trades} />
    </div>
  );
}
