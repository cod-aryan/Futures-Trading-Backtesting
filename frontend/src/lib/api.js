const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchSymbols() {
  const res = await fetch(`${API_BASE}/api/symbols`);
  const data = await res.json();
  return data.symbols || [];
}

export async function fetchOHLCV(symbol, timeframe = "1h", limit = 5000) {
  const res = await fetch(
    `${API_BASE}/api/ohlcv?symbol=${symbol}&timeframe=${timeframe}&limit=${limit}`
  );
  const data = await res.json();
  return data.data || [];
}

export async function runBacktest(params) {
  const res = await fetch(`${API_BASE}/api/backtest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return await res.json();
}

export async function runManualTrade(params) {
  const res = await fetch(`${API_BASE}/api/manual-trade`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  return await res.json();
}
