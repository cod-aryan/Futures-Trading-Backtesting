const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export async function fetchSymbols() {
  const res = await fetch(`${API_BASE}/api/symbols`);
  const data = await res.json();
  return data.symbols || [];
}

export async function fetchOHLCV(symbol, timeframe = "1h", limit = 500, endTime = null) {
  let url = `${API_BASE}/api/ohlcv?symbol=${symbol}&timeframe=${timeframe}&limit=${limit}`;
  if (endTime != null) url += `&end_time=${endTime}`;
  const res = await fetch(url);
  const data = await res.json();
  return { records: data.data || [], total: data.total || 0 };
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
