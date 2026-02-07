from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes.data import router as data_router
from routes.backtest import router as backtest_router
from routes.trade import router as trade_router

app = FastAPI(title="Trading Backtest API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Include routers ──────────────────────────────────────────────────
app.include_router(data_router)
app.include_router(backtest_router)
app.include_router(trade_router)


@app.get("/")
async def root():
    return {"status": "ok", "message": "Trading Backtest API"}