import pandas as pd

from models.schemas import ManualTradeRequest
from services.data_service import load_ohlcv


def simulate_manual_trade(req: ManualTradeRequest) -> dict:
    """Simulate a single manual trade from a given entry candle."""
    df = load_ohlcv(req.symbol, req.timeframe)
    if df.empty:
        return {"error": "No data"}

    # Find the entry candle
    df["ts_sec"] = df["timestamp"] // 1000
    entry_ts = pd.Timestamp(req.entry_time)

    # Ensure tz-compatibility: strip timezone info from both sides
    if entry_ts.tzinfo is not None:
        entry_ts = entry_ts.tz_localize(None)
    if hasattr(df["datetime"].dtype, "tz") and df["datetime"].dtype.tz is not None:
        df["datetime"] = df["datetime"].dt.tz_localize(None)

    idx = df["datetime"].searchsorted(entry_ts)
    if idx >= len(df):
        return {"error": "Entry time out of range"}

    entry_row = df.iloc[idx]
    entry_price = entry_row["close"]
    size = req.capital / entry_price

    sl_price = None
    tp_price = None
    if req.stop_loss_pct:
        sl_price = (
            entry_price * (1 - req.stop_loss_pct / 100)
            if req.side == "long"
            else entry_price * (1 + req.stop_loss_pct / 100)
        )
    if req.take_profit_pct:
        tp_price = (
            entry_price * (1 + req.take_profit_pct / 100)
            if req.side == "long"
            else entry_price * (1 - req.take_profit_pct / 100)
        )

    # Walk forward through candles
    for j in range(idx + 1, len(df)):
        row = df.iloc[j]
        if req.side == "long":
            if sl_price and row["low"] <= sl_price:
                pnl = size * (sl_price - entry_price) * req.leverage
                return _trade_result(req, entry_price, sl_price, entry_row, row, pnl, "SL")
            if tp_price and row["high"] >= tp_price:
                pnl = size * (tp_price - entry_price) * req.leverage
                return _trade_result(req, entry_price, tp_price, entry_row, row, pnl, "TP")
        else:
            if sl_price and row["high"] >= sl_price:
                pnl = size * (entry_price - sl_price) * req.leverage
                return _trade_result(req, entry_price, sl_price, entry_row, row, pnl, "SL")
            if tp_price and row["low"] <= tp_price:
                pnl = size * (entry_price - tp_price) * req.leverage
                return _trade_result(req, entry_price, tp_price, entry_row, row, pnl, "TP")

    # No SL/TP hit — close at last candle
    last = df.iloc[-1]
    exit_price = last["close"]
    if req.side == "long":
        pnl = size * (exit_price - entry_price) * req.leverage
    else:
        pnl = size * (entry_price - exit_price) * req.leverage
    return _trade_result(req, entry_price, exit_price, entry_row, last, pnl, "end")


def _trade_result(req, entry_price, exit_price, entry_row, exit_row, pnl, reason):
    return {
        "side": req.side,
        "entry_price": round(entry_price, 2),
        "exit_price": round(exit_price, 2),
        "entry_time": str(entry_row["datetime"]),
        "exit_time": str(exit_row["datetime"]),
        "pnl": round(pnl, 2),
        "pnl_pct": round(pnl / req.capital * 100, 2),
        "exit_reason": reason,
        "leverage": req.leverage,
    }
