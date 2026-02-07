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
    limit: int = Query(500, ge=1, le=100000),
    end_time: int | None = Query(None),
):
    df = load_ohlcv(symbol, timeframe)
    if df.empty:
        return {"error": "Symbol not found", "data": [], "total": 0}

    total = len(df)

    # Slice the dataframe BEFORE formatting to avoid processing all rows
    from config import IST_OFFSET_SEC
    if end_time is not None:
        # Convert chart timestamp back to ms for comparison
        end_ms = (end_time - IST_OFFSET_SEC) * 1000
        mask = df["timestamp"] < end_ms
        df_slice = df[mask].tail(limit)
    else:
        df_slice = df.tail(limit)

    records = format_ohlcv_records(df_slice)
    return {"data": records, "total": total}
    return {"data": records, "total": total}
