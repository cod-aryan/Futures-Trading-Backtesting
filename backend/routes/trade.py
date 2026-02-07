from fastapi import APIRouter

from models.schemas import ManualTradeRequest
from services.trade_service import simulate_manual_trade

router = APIRouter(prefix="/api", tags=["trade"])


@router.post("/manual-trade")
async def manual_trade(req: ManualTradeRequest):
    result = simulate_manual_trade(req)
    return result
