from pydantic import BaseModel
from typing import Optional


class BacktestRequest(BaseModel):
    symbol: str = "BTCUSDT"
    timeframe: str = "1h"
    strategy: str = "sma_cross"  # sma_cross | rsi
    # SMA params
    fast_period: int = 10
    slow_period: int = 30
    # RSI params
    rsi_period: int = 14
    rsi_overbought: float = 70
    rsi_oversold: float = 30
    # Trade params
    leverage: float = 1
    initial_capital: float = 10000
    stop_loss_pct: Optional[float] = None   # e.g. 2.0 means 2%
    take_profit_pct: Optional[float] = None  # e.g. 4.0 means 4%
    position_size_pct: float = 100  # % of capital per trade


class ManualTradeRequest(BaseModel):
    symbol: str = "BTCUSDT"
    timeframe: str = "1h"
    side: str = "long"  # long | short
    entry_time: str  # ISO timestamp for candle lookup
    leverage: float = 1
    capital: float = 10000
    stop_loss_pct: Optional[float] = None
    take_profit_pct: Optional[float] = None
