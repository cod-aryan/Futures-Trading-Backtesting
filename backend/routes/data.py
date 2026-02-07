import os

from fastapi import APIRouter, Query

from config import DATA_DIR
from services.data_service import load_ohlcv, format_ohlcv_records

router = APIRouter(prefix="/api", tags=["data"])


@router.get("/symbols")
async def list_symbols():
    files = [f.replace(".csv", "") for f in os.listdir(DATA_DIR) if f.endswith(".csv")]
    return {"symbols": sorted(files)}


@router.get("/ohlcv")
async def get_ohlcv(
    symbol: str = Query("BTCUSDT"),
    timeframe: str = Query("1m"),
    limit: int = Query(5000, ge=1, le=100000),
):
    df = load_ohlcv(symbol, timeframe)
    if df.empty:
        return {"error": "Symbol not found", "data": []}

    df = df.tail(limit)
    records = format_ohlcv_records(df)
    return {"data": records}
