"use client";

import { useState } from "react";
import { LEVERAGE_OPTIONS } from "@/lib/constants";
import TradeResult from "./TradeResult";

export default function TradingPanel({ onSubmitTrade, currentPrice, symbol }) {
  const [side, setSide] = useState("long");
  const [leverage, setLeverage] = useState(10);
  const [capital, setCapital] = useState(1000);
  const [slPct, setSlPct] = useState(2);
  const [tpPct, setTpPct] = useState(4);
  const [slEnabled, setSlEnabled] = useState(true);
  const [tpEnabled, setTpEnabled] = useState(true);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const slPrice = currentPrice
    ? side === "long"
      ? currentPrice * (1 - slPct / 100)
      : currentPrice * (1 + slPct / 100)
    : null;
  const tpPrice = currentPrice
    ? side === "long"
      ? currentPrice * (1 + tpPct / 100)
      : currentPrice * (1 - tpPct / 100)
    : null;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await onSubmitTrade({
        side,
        leverage,
        capital,
        stop_loss_pct: slEnabled ? slPct : null,
        take_profit_pct: tpEnabled ? tpPct : null,
      });
      setResult(res);
    } catch (e) {
      setResult({ error: e.message });
    }
    setLoading(false);
  };

  return (
    <div
      style={{
        background: "var(--bg-secondary)",
        borderLeft: "1px solid var(--border-color)",
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
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span style={{ fontWeight: 700, fontSize: 14 }}>Trade</span>
        <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>
          {symbol}
        </span>
      </div>

      <div style={{ padding: 16, flex: 1, overflowY: "auto" }}>
        {/* Long / Short Toggle */}
        <div style={{ display: "flex", gap: 0, marginBottom: 16 }}>
          <button
            className={side === "long" ? "btn-long" : "btn-secondary"}
            style={{ flex: 1, borderRadius: "4px 0 0 4px", padding: "10px 0", fontSize: 13 }}
            onClick={() => setSide("long")}
          >
            Buy / Long
          </button>
          <button
            className={side === "short" ? "btn-short" : "btn-secondary"}
            style={{ flex: 1, borderRadius: "0 4px 4px 0", padding: "10px 0", fontSize: 13 }}
            onClick={() => setSide("short")}
          >
            Sell / Short
          </button>
        </div>

        {/* Current Price */}
        {currentPrice && (
          <div
            style={{
              textAlign: "center",
              marginBottom: 16,
              background: "var(--bg-primary)",
              padding: "8px",
              borderRadius: 4,
            }}
          >
            <div style={{ color: "var(--text-secondary)", fontSize: 11 }}>Last Price</div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 0.5 }}>
              {currentPrice.toFixed(2)}
            </div>
          </div>
        )}

        {/* Leverage */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Leverage</label>
          <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
            {LEVERAGE_OPTIONS.map((l) => (
              <button
                key={l}
                className={leverage === l ? "btn-primary" : "btn-secondary"}
                style={{ padding: "5px 10px", fontSize: 11, minWidth: 38 }}
                onClick={() => setLeverage(l)}
              >
                {l}x
              </button>
            ))}
          </div>
        </div>

        {/* Capital */}
        <div style={{ marginBottom: 14 }}>
          <label style={labelStyle}>Capital (USDT)</label>
          <input
            type="number"
            value={capital}
            onChange={(e) => setCapital(Number(e.target.value))}
            style={{ width: "100%" }}
          />
        </div>

        {/* Stop Loss */}
        <div
          style={{
            marginBottom: 14,
            background: "var(--bg-primary)",
            padding: 12,
            borderRadius: 4,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <label
              style={{
                color: "var(--accent-red)",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                fontWeight: 600,
              }}
            >
              Stop Loss
            </label>
            <button
              style={{
                background: slEnabled ? "var(--accent-red)" : "var(--bg-tertiary)",
                color: "white",
                padding: "2px 8px",
                borderRadius: 3,
                fontSize: 10,
              }}
              onClick={() => setSlEnabled(!slEnabled)}
            >
              {slEnabled ? "ON" : "OFF"}
            </button>
          </div>
          {slEnabled && (
            <>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="number"
                  step="0.1"
                  value={slPct}
                  onChange={(e) => setSlPct(Number(e.target.value))}
                  style={{ width: 70 }}
                />
                <span style={{ color: "var(--text-secondary)" }}>%</span>
              </div>
              {slPrice && (
                <div style={{ color: "var(--accent-red)", fontSize: 11, marginTop: 4 }}>
                  ≈ ${slPrice.toFixed(2)}
                </div>
              )}
            </>
          )}
        </div>

        {/* Take Profit */}
        <div
          style={{
            marginBottom: 16,
            background: "var(--bg-primary)",
            padding: 12,
            borderRadius: 4,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 8,
            }}
          >
            <label
              style={{
                color: "var(--accent-green)",
                fontSize: 11,
                textTransform: "uppercase",
                letterSpacing: 0.5,
                fontWeight: 600,
              }}
            >
              Take Profit
            </label>
            <button
              style={{
                background: tpEnabled ? "var(--accent-green)" : "var(--bg-tertiary)",
                color: "white",
                padding: "2px 8px",
                borderRadius: 3,
                fontSize: 10,
              }}
              onClick={() => setTpEnabled(!tpEnabled)}
            >
              {tpEnabled ? "ON" : "OFF"}
            </button>
          </div>
          {tpEnabled && (
            <>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="number"
                  step="0.1"
                  value={tpPct}
                  onChange={(e) => setTpPct(Number(e.target.value))}
                  style={{ width: 70 }}
                />
                <span style={{ color: "var(--text-secondary)" }}>%</span>
              </div>
              {tpPrice && (
                <div style={{ color: "var(--accent-green)", fontSize: 11, marginTop: 4 }}>
                  ≈ ${tpPrice.toFixed(2)}
                </div>
              )}
            </>
          )}
        </div>

        {/* Summary */}
        <div
          style={{
            background: "var(--bg-primary)",
            padding: 12,
            borderRadius: 4,
            marginBottom: 14,
            fontSize: 11,
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ color: "var(--text-secondary)" }}>Side</span>
            <span
              style={{
                color: side === "long" ? "var(--accent-green)" : "var(--accent-red)",
                fontWeight: 600,
              }}
            >
              {side.toUpperCase()}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ color: "var(--text-secondary)" }}>Leverage</span>
            <span>{leverage}x</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
            <span style={{ color: "var(--text-secondary)" }}>Position Size</span>
            <span>${(capital * leverage).toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ color: "var(--text-secondary)" }}>Margin</span>
            <span>${capital.toLocaleString()}</span>
          </div>
        </div>

        {/* Submit */}
        <button
          className={side === "long" ? "btn-long" : "btn-short"}
          style={{ width: "100%", padding: "12px 0", fontSize: 14 }}
          onClick={handleSubmit}
          disabled={loading}
        >
          {loading
            ? "Simulating..."
            : side === "long"
            ? "Buy / Long"
            : "Sell / Short"}
        </button>

        <TradeResult result={result} />
      </div>
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
