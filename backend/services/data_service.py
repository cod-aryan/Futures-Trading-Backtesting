import os
import math
import numpy as np
import pandas as pd

from config import DATA_DIR, TIMEFRAME_MAP, IST_OFFSET_SEC

# ── In-memory cache: symbol → raw 1m DataFrame ──────────────────
_cache: dict[str, pd.DataFrame] = {}
# ── Resampled cache: (symbol, timeframe) → resampled DataFrame ──
_resample_cache: dict[tuple[str, str], pd.DataFrame] = {}


def _load_raw(symbol: str) -> pd.DataFrame:
    """Load raw 1m CSV into cache (once per symbol)."""
    if symbol in _cache:
        return _cache[symbol]
    path = os.path.join(DATA_DIR, f"{symbol}.csv")
    if not os.path.exists(path):
        return pd.DataFrame()
    df = pd.read_csv(path, parse_dates=["datetime"])
    df = df.sort_values("datetime").reset_index(drop=True)
    _cache[symbol] = df
    return df


def load_ohlcv(symbol: str, timeframe: str = "1m") -> pd.DataFrame:
    """Load OHLCV data, resampled to the requested timeframe. Cached."""
    key = (symbol, timeframe)
    if key in _resample_cache:
        return _resample_cache[key]

    df = _load_raw(symbol)
    if df.empty:
        return df

    tf = TIMEFRAME_MAP.get(timeframe, "1min")
    if tf != "1min":
        df = df.set_index("datetime")
        df = df.resample(tf).agg({
            "open": "first",
            "high": "max",
            "low": "min",
            "close": "last",
            "volume": "sum",
            "timestamp": "first",
        }).dropna().reset_index()

    _resample_cache[key] = df
    return df


def sanitize_float(v):
    """Replace NaN/Inf with None for JSON serialization."""
    if v is None:
        return None
    if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
        return None
    return v


def to_chart_ts(ms_timestamp: int) -> int:
    """Convert a millisecond UTC timestamp to a chart-friendly IST second timestamp."""
    return int(ms_timestamp) // 1000 + IST_OFFSET_SEC


def format_ohlcv_records(df: pd.DataFrame) -> list[dict]:
    """Convert a DataFrame to a list of OHLCV dicts — vectorized, fast."""
    if df.empty:
        return []
    times = (df["timestamp"].values.astype(np.int64) // 1000 + IST_OFFSET_SEC).tolist()
    opens = df["open"].values
    highs = df["high"].values
    lows = df["low"].values
    closes = df["close"].values
    volumes = df["volume"].values

    records = [
        {
            "time": t,
            "open": None if (math.isnan(o) or math.isinf(o)) else o,
            "high": None if (math.isnan(h) or math.isinf(h)) else h,
            "low": None if (math.isnan(lo) or math.isinf(lo)) else lo,
            "close": None if (math.isnan(c) or math.isinf(c)) else c,
            "volume": None if (math.isnan(v) or math.isinf(v)) else v,
        }
        for t, o, h, lo, c, v in zip(times, opens, highs, lows, closes, volumes)
    ]
    return records
