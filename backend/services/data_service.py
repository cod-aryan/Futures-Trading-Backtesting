import os
import math
import pandas as pd

from config import DATA_DIR, TIMEFRAME_MAP, IST_OFFSET_SEC


def load_ohlcv(symbol: str, timeframe: str = "1m") -> pd.DataFrame:
    """Load OHLCV data from CSV and optionally resample to a higher timeframe."""
    path = os.path.join(DATA_DIR, f"{symbol}.csv")
    if not os.path.exists(path):
        return pd.DataFrame()

    df = pd.read_csv(path, parse_dates=["datetime"])
    df = df.sort_values("datetime").reset_index(drop=True)

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
    """Convert a DataFrame to a list of OHLCV dicts for the API response."""
    records = []
    for _, row in df.iterrows():
        records.append({
            "time": to_chart_ts(row["timestamp"]),
            "open": sanitize_float(row["open"]),
            "high": sanitize_float(row["high"]),
            "low": sanitize_float(row["low"]),
            "close": sanitize_float(row["close"]),
            "volume": sanitize_float(row["volume"]),
        })
    return records
