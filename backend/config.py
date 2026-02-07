import os

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")

# IST = UTC+5:30 → offset in seconds for lightweight-charts display
IST_OFFSET_SEC = 5 * 3600 + 30 * 60  # 19800

TIMEFRAME_MAP = {
    "1m": "1min",
    "5m": "5min",
    "15m": "15min",
    "1h": "1h",
    "4h": "4h",
    "1d": "1D",
}
