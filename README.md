# Futures Trading Simulator & Backtester

A full-featured crypto futures trading practice platform with interactive chart replay, drawing tools, automated backtesting, and real historical data. Built with **Next.js** and **FastAPI**.

**[Live Demo →](https://futures-trading-backtesting.onrender.com/)**

---

## Features

### 📊 Interactive Candlestick Chart
- Real-time OHLCV chart powered by [Lightweight Charts](https://github.com/nicehash/TradeView)
- Multiple timeframes: 1m, 5m, 15m, 1h, 4h, 1D
- Multiple symbols: BTCUSDT, ETHUSDT
- Lazy-loaded historical data — scroll left to load older candles
- Crosshair with OHLC overlay
- Dark / Light theme toggle

### 🔁 Replay & Practice Mode
- **Scissor tool** — cut the chart at any candle to hide future data
- **Step forward** candle-by-candle with Space / Arrow keys
- Place **Long / Short** positions with customizable SL & TP
- Drag to adjust stop-loss and take-profit levels on chart
- Real-time P&L tracking per position
- Trade history with completed trade stats (win rate, total P&L, profit factor)

### ✏️ Drawing Tools
- Horizontal lines, Trendlines, Rays, Fibonacci retracements
- Click-to-place with visual guides
- Select, move, delete drawings
- Undo / Redo support (Ctrl+Z / Ctrl+Shift+Z)
- Persistent per symbol via localStorage

### 📈 Automated Backtesting
- **SMA Crossover** strategy (configurable fast/slow periods)
- **RSI** strategy (configurable period, overbought/oversold thresholds)
- Adjustable leverage, position sizing, stop-loss & take-profit
- Equity curve chart
- Detailed stats: net P&L, win rate, max drawdown, Sharpe ratio, profit factor
- Full trade log table

### 🎨 Theming
- Dark and Light mode with smooth toggle
- Flash-free hydration (inline blocking script)
- All chart elements, overlays, and UI adapt to active theme

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Lightweight Charts v5 |
| Styling | CSS Variables, Tailwind CSS 4 |
| Backend | FastAPI, Uvicorn, Gunicorn |
| Data Processing | Pandas, NumPy |
| Deployment | Render (separate frontend + backend services) |

---

## Project Structure

```
├── backend/
│   ├── main.py                 # FastAPI app entry point
│   ├── config.py               # Data dir, timeframe map, IST offset
│   ├── requirements.txt
│   ├── data/
│   │   ├── BTCUSDT.csv         # Historical 1m OHLCV data
│   │   ├── ETHUSDT.csv
│   │   └── fetching_data_script.py
│   ├── models/
│   │   └── schemas.py          # Pydantic request models
│   ├── routes/
│   │   ├── data.py             # /api/symbols, /api/ohlcv (paginated)
│   │   ├── backtest.py         # /api/backtest
│   │   └── trade.py            # /api/manual-trade
│   └── services/
│       ├── data_service.py     # CSV loading, caching, resampling
│       ├── backtest_engine.py  # SMA & RSI backtest logic
│       ├── trade_service.py    # Manual trade simulation
│       └── indicators.py       # SMA, RSI computation
│
├── frontend/
│   ├── next.config.mjs         # API proxy rewrites
│   ├── package.json
│   └── src/
│       ├── app/
│       │   ├── layout.js       # Root layout, viewport, theme init
│       │   ├── page.js         # Main page orchestrating all components
│       │   └── globals.css     # Theme variables (dark + light)
│       ├── components/
│       │   ├── chart/
│       │   │   ├── Chart.js          # Candlestick chart + canvas overlay
│       │   │   ├── chartConfig.js    # Chart/series options
│       │   │   └── drawingRenderer.js # Canvas drawing (lines, fibs, positions)
│       │   ├── replay/
│       │   │   ├── ReplayPanel.js    # Side panel: orders, positions, stats
│       │   │   └── DrawingToolbar.js # Drawing tool selector
│       │   ├── toolbar/
│       │   │   └── Toolbar.js        # Symbol, timeframe, theme toggle
│       │   ├── trading/
│       │   │   └── TradingPanel.js
│       │   └── backtest/
│       │       ├── BacktestPanel.js
│       │       ├── BacktestResults.js
│       │       ├── EquityCurveChart.js
│       │       ├── StatsGrid.js
│       │       └── TradesTable.js
│       ├── hooks/
│       │   ├── useMarketData.js  # Symbol + OHLCV loading with pagination
│       │   ├── useReplay.js      # Replay state, positions, trades
│       │   ├── useDrawings.js    # Drawing tools + undo/redo
│       │   ├── useTheme.js       # Dark/light theme toggle
│       │   ├── useBacktest.js
│       │   └── useTrade.js
│       └── lib/
│           ├── api.js            # API client functions
│           └── constants.js      # Timeframes, chart colors
└── README.md
```

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.10

### Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate    # On Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:3000`. API requests are proxied to the backend via Next.js rewrites.

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/symbols` | List available trading symbols |
| GET | `/api/ohlcv?symbol=BTCUSDT&timeframe=1h&limit=500&end_time=...` | Paginated OHLCV candle data |
| POST | `/api/backtest` | Run automated backtest with strategy params |
| POST | `/api/manual-trade` | Simulate a manual trade from a given entry |

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` / `→` | Step forward one candle (replay mode) |
| `Escape` | Cancel active tool / scissor mode |
| `Delete` / `Backspace` | Remove selected drawing |
| `Ctrl+Z` | Undo |
| `Ctrl+Shift+Z` / `Ctrl+Y` | Redo |

---

## Deployment

The project is deployed on **Render** as two separate services:

1. **Backend** — Python web service running `gunicorn main:app`
2. **Frontend** — Node.js web service running `next build && next start`

Set the `BACKEND_URL` environment variable on the frontend service to point to the backend URL. Set `CORS_ORIGIN` on the backend to the frontend URL.

---

## License

This project is for educational and personal use.
