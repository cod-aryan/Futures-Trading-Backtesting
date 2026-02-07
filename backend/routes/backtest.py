from fastapi import APIRouter

from models.schemas import BacktestRequest
from services.backtest_engine import run_backtest

router = APIRouter(prefix="/api", tags=["backtest"])


@router.post("/backtest")
async def backtest(req: BacktestRequest):
    result = run_backtest(req)
    return result
