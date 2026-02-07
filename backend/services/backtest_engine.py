import pandas as pd

from models.schemas import BacktestRequest
from services.data_service import load_ohlcv, sanitize_float, to_chart_ts
from services.indicators import compute_sma, compute_rsi


def run_backtest(req: BacktestRequest) -> dict:
    """Execute a full backtest for the given strategy and parameters."""
    df = load_ohlcv(req.symbol, req.timeframe)
    if df.empty:
        return {"error": "No data"}

    trades = []
    capital = req.initial_capital
    position = None  # {side, entry_price, size, sl, tp, entry_time}

    # ── Calculate indicators ──────────────────────────────────────
    if req.strategy == "sma_cross":
        df["fast_sma"] = compute_sma(df["close"], req.fast_period)
        df["slow_sma"] = compute_sma(df["close"], req.slow_period)
        df["signal"] = 0
        df.loc[df["fast_sma"] > df["slow_sma"], "signal"] = 1
        df.loc[df["fast_sma"] < df["slow_sma"], "signal"] = -1
        df["signal_change"] = df["signal"].diff()
    elif req.strategy == "rsi":
        df["rsi"] = compute_rsi(df["close"], req.rsi_period)
        df["signal"] = 0
        df.loc[df["rsi"] < req.rsi_oversold, "signal"] = 1
        df.loc[df["rsi"] > req.rsi_overbought, "signal"] = -1
        df["signal_change"] = df["signal"].diff()

    equity_curve = []

    # ── Walk through candles ──────────────────────────────────────
    for i, row in df.iterrows():
        price = row["close"]
        ts = to_chart_ts(row["timestamp"])

        # Check SL/TP on open position
        if position is not None:
            hit_sl = False
            hit_tp = False
            exit_price = price

            if position["side"] == "long":
                if position["sl"] and row["low"] <= position["sl"]:
                    hit_sl = True
                    exit_price = position["sl"]
                if position["tp"] and row["high"] >= position["tp"]:
                    hit_tp = True
                    exit_price = position["tp"]
            else:
                if position["sl"] and row["high"] >= position["sl"]:
                    hit_sl = True
                    exit_price = position["sl"]
                if position["tp"] and row["low"] <= position["tp"]:
                    hit_tp = True
                    exit_price = position["tp"]

            if hit_sl or hit_tp:
                pnl = _calc_pnl(position, exit_price, req.leverage)
                capital += pnl
                trades.append({
                    "side": position["side"],
                    "entry_price": position["entry_price"],
                    "exit_price": exit_price,
                    "entry_time": position["entry_time"],
                    "exit_time": ts,
                    "pnl": round(pnl, 2),
                    "exit_reason": "SL" if hit_sl else "TP",
                })
                position = None

        # Signal-based entry/exit
        if "signal_change" in df.columns:
            sig = row.get("signal_change", 0)
            if sig and not pd.isna(sig) and sig != 0:
                if position is not None:
                    pnl = _calc_pnl(position, price, req.leverage)
                    capital += pnl
                    trades.append({
                        "side": position["side"],
                        "entry_price": position["entry_price"],
                        "exit_price": price,
                        "entry_time": position["entry_time"],
                        "exit_time": ts,
                        "pnl": round(pnl, 2),
                        "exit_reason": "signal",
                    })
                    position = None

                side = "long" if row["signal"] == 1 else "short"
                size = (capital * (req.position_size_pct / 100)) / price
                sl_price = None
                tp_price = None
                if req.stop_loss_pct:
                    sl_price = (
                        price * (1 - req.stop_loss_pct / 100)
                        if side == "long"
                        else price * (1 + req.stop_loss_pct / 100)
                    )
                if req.take_profit_pct:
                    tp_price = (
                        price * (1 + req.take_profit_pct / 100)
                        if side == "long"
                        else price * (1 - req.take_profit_pct / 100)
                    )

                position = {
                    "side": side,
                    "entry_price": price,
                    "size": size,
                    "sl": sl_price,
                    "tp": tp_price,
                    "entry_time": ts,
                }

        equity_curve.append({"time": ts, "value": round(capital, 2)})

    # ── Close remaining position ──────────────────────────────────
    if position is not None and not df.empty:
        last = df.iloc[-1]
        pnl = _calc_pnl(position, last["close"], req.leverage)
        capital += pnl
        trades.append({
            "side": position["side"],
            "entry_price": position["entry_price"],
            "exit_price": last["close"],
            "entry_time": position["entry_time"],
            "exit_time": to_chart_ts(last["timestamp"]),
            "pnl": round(pnl, 2),
            "exit_reason": "end",
        })

    # ── Sanitize floats ───────────────────────────────────────────
    for t in trades:
        for k, v in t.items():
            t[k] = sanitize_float(v)
    for e in equity_curve:
        for k, v in e.items():
            e[k] = sanitize_float(v)

    # ── Compute stats ─────────────────────────────────────────────
    winning = [t for t in trades if t["pnl"] and t["pnl"] > 0]
    losing = [t for t in trades if t["pnl"] and t["pnl"] < 0]
    total_pnl = sum(t["pnl"] for t in trades if t["pnl"])
    max_drawdown = _calc_max_drawdown(equity_curve)

    # ── Build indicator overlay data ──────────────────────────────
    overlay = _build_overlay(req, df)

    return {
        "initial_capital": req.initial_capital,
        "final_capital": round(capital, 2),
        "total_pnl": round(total_pnl, 2),
        "total_trades": len(trades),
        "winning_trades": len(winning),
        "losing_trades": len(losing),
        "win_rate": round(len(winning) / len(trades) * 100, 1) if trades else 0,
        "max_drawdown": round(max_drawdown, 2),
        "trades": trades,
        "equity_curve": equity_curve[::max(1, len(equity_curve) // 500)],
        "overlay": overlay,
    }


# ─── Private helpers ──────────────────────────────────────────────────


def _calc_pnl(position: dict, exit_price: float, leverage: float) -> float:
    if position["side"] == "long":
        return position["size"] * (exit_price - position["entry_price"]) * leverage
    else:
        return position["size"] * (position["entry_price"] - exit_price) * leverage


def _calc_max_drawdown(equity_curve: list[dict]) -> float:
    if not equity_curve:
        return 0
    peak = equity_curve[0]["value"] or 0
    max_dd = 0
    for point in equity_curve:
        val = point["value"] or 0
        if val > peak:
            peak = val
        dd = peak - val
        if dd > max_dd:
            max_dd = dd
    return max_dd


def _build_overlay(req: BacktestRequest, df) -> dict:
    overlay = {}
    if req.strategy == "sma_cross":
        overlay["fast_sma"] = [
            {"time": to_chart_ts(r["timestamp"]), "value": sanitize_float(r["fast_sma"])}
            for _, r in df.iterrows() if not pd.isna(r["fast_sma"])
        ]
        overlay["slow_sma"] = [
            {"time": to_chart_ts(r["timestamp"]), "value": sanitize_float(r["slow_sma"])}
            for _, r in df.iterrows() if not pd.isna(r["slow_sma"])
        ]
    elif req.strategy == "rsi":
        overlay["rsi"] = [
            {"time": to_chart_ts(r["timestamp"]), "value": sanitize_float(r["rsi"])}
            for _, r in df.iterrows() if not pd.isna(r.get("rsi", float("nan")))
        ]
    return overlay
