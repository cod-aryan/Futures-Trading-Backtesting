"use client";

import { useState } from "react";

export default function BacktestPanel({ symbol, timeframe, onRunBacktest, loading }) {
  const [strategy, setStrategy] = useState("sma_cross");
  const [fastPeriod, setFastPeriod] = useState(10);
  const [slowPeriod, setSlowPeriod] = useState(30);
  const [rsiPeriod, setRsiPeriod] = useState(14);
  const [rsiOB, setRsiOB] = useState(70);
  const [rsiOS, setRsiOS] = useState(30);
  const [leverage, setLeverage] = useState(1);
  const [capital, setCapital] = useState(10000);
  const [slPct, setSlPct] = useState("");
  const [tpPct, setTpPct] = useState("");
  const [posSize, setPosSize] = useState(100);

  const handleRun = () => {
    onRunBacktest({
      symbol,
      timeframe,
      strategy,
      fast_period: fastPeriod,
      slow_period: slowPeriod,
      rsi_period: rsiPeriod,
      rsi_overbought: rsiOB,
      rsi_oversold: rsiOS,
      leverage,
      initial_capital: capital,
      stop_loss_pct: slPct ? Number(slPct) : null,
      take_profit_pct: tpPct ? Number(tpPct) : null,
      position_size_pct: posSize,
    });
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 16 }}>
        Backtest Configuration
      </div>

      {/* Strategy */}
      <div style={{ marginBottom: 14 }}>
        <label style={labelStyle}>Strategy</label>
        <select
          value={strategy}
          onChange={(e) => setStrategy(e.target.value)}
          style={{ width: "100%" }}
        >
          <option value="sma_cross">SMA Crossover</option>
          <option value="rsi">RSI Overbought/Oversold</option>
        </select>
      </div>

      {/* SMA params */}
      {strategy === "sma_cross" && (
        <div style={{ background: "var(--bg-primary)", padding: 12, borderRadius: 4, marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "var(--accent-yellow)", marginBottom: 8, fontWeight: 600 }}>
            SMA Parameters
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Fast Period</label>
              <input type="number" value={fastPeriod} onChange={(e) => setFastPeriod(Number(e.target.value))} style={{ width: "100%" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Slow Period</label>
              <input type="number" value={slowPeriod} onChange={(e) => setSlowPeriod(Number(e.target.value))} style={{ width: "100%" }} />
            </div>
          </div>
        </div>
      )}

      {/* RSI params */}
      {strategy === "rsi" && (
        <div style={{ background: "var(--bg-primary)", padding: 12, borderRadius: 4, marginBottom: 14 }}>
          <div style={{ fontSize: 11, color: "var(--accent-yellow)", marginBottom: 8, fontWeight: 600 }}>
            RSI Parameters
          </div>
          <div style={{ marginBottom: 8 }}>
            <label style={labelStyle}>RSI Period</label>
            <input type="number" value={rsiPeriod} onChange={(e) => setRsiPeriod(Number(e.target.value))} style={{ width: "100%" }} />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Oversold</label>
              <input type="number" value={rsiOS} onChange={(e) => setRsiOS(Number(e.target.value))} style={{ width: "100%" }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={labelStyle}>Overbought</label>
              <input type="number" value={rsiOB} onChange={(e) => setRsiOB(Number(e.target.value))} style={{ width: "100%" }} />
            </div>
          </div>
        </div>
      )}

      {/* Trade Parameters */}
      <div style={{ background: "var(--bg-primary)", padding: 12, borderRadius: 4, marginBottom: 14 }}>
        <div style={{ fontSize: 11, color: "var(--accent-blue)", marginBottom: 8, fontWeight: 600 }}>
          Trade Parameters
        </div>
        <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Capital (USDT)</label>
            <input type="number" value={capital} onChange={(e) => setCapital(Number(e.target.value))} style={{ width: "100%" }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Leverage</label>
            <input type="number" value={leverage} onChange={(e) => setLeverage(Number(e.target.value))} style={{ width: "100%" }} />
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, marginBottom: 8 }}>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Stop Loss %</label>
            <input type="number" placeholder="None" value={slPct} onChange={(e) => setSlPct(e.target.value)} style={{ width: "100%" }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={labelStyle}>Take Profit %</label>
            <input type="number" placeholder="None" value={tpPct} onChange={(e) => setTpPct(e.target.value)} style={{ width: "100%" }} />
          </div>
        </div>
        <div>
          <label style={labelStyle}>Position Size %</label>
          <input type="number" value={posSize} onChange={(e) => setPosSize(Number(e.target.value))} style={{ width: 80 }} />
        </div>
      </div>

      <button
        className="btn-primary"
        style={{ width: "100%", padding: "12px 0", fontSize: 14 }}
        onClick={handleRun}
        disabled={loading}
      >
        {loading ? "Running Backtest..." : "Run Backtest"}
      </button>
    </div>
  );
}

const labelStyle = {
  display: "block",
  marginBottom: 4,
  color: "var(--text-secondary)",
  fontSize: 11,
  textTransform: "uppercase",
  letterSpacing: 0.5,
};
