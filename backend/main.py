from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Enable CORS so Next.js can talk to FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/backtest-result")
async def get_result():
    return {"status": "success", "pnl": 150.50}

@app.get("/")
async def get_result():
    return {"status": "success", "message": "Welcome to the Backtesting API!"}