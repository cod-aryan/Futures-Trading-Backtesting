import os
import time
import ccxt
import pandas as pd

# 1. Configuration
symbols = ['BTC/USDT', 'ETH/USDT']
timeframe_str = "1m"
ms_1min = 60 * 1000  # 1 minute in milliseconds
outdir = "./"

if not os.path.exists(outdir):
    os.mkdir(outdir)

exchange = ccxt.binance({
    'enableRateLimit': True,
    'options': {'defaultType': 'spot'}
})

# 2. Execution Loop
for symbol in symbols:
    print(f"🚀 Starting fetch for {symbol}...")
    
    file_name = symbol.replace("/", "") + ".csv"
    outfile = os.path.join(outdir, file_name)
    
    accumulator = []
    
    # --- UPDATED LOGIC FOR START DATE ---
    if os.path.exists(outfile):
        # Resume from where we left off
        existing_df = pd.read_csv(outfile)
        since = int(existing_df['timestamp'].iloc[-1]) + ms_1min
        accumulator.append(existing_df)
    else:
        # Start fresh from Jan 1, 2024
        since = exchange.parse8601('2024-01-01T00:00:00Z')

    while since < exchange.milliseconds():
        try:
            # Binance allows up to 1000 candles per request
            ohlcv = exchange.fetch_ohlcv(symbol, timeframe_str, since, 1000)
            
            if not ohlcv:
                break
            
            df_temp = pd.DataFrame(ohlcv, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
            df_temp['datetime'] = pd.to_datetime(df_temp['timestamp'], unit='ms')
            
            # Organize columns
            df_temp = df_temp[['datetime', 'timestamp', 'open', 'high', 'low', 'close', 'volume']]
            
            accumulator.append(df_temp)
            
            # Move the pointer to the last received candle + 1 interval
            since = ohlcv[-1][0] + ms_1min
            
            print(f"Fetched until: {df_temp['datetime'].iloc[-1]} | Total rows: {len(df_temp)}")
            
            # Sleep is crucial for 1m data as you'll make many requests
            time.sleep(exchange.rateLimit / 1000)
            
        except Exception as e:
            print(f"Error fetching {symbol}: {e}")
            time.sleep(10) # Wait a bit longer if an error occurs
            continue

    # 3. Final Save
    if accumulator:
        final_df = pd.concat(accumulator, ignore_index=True)
        final_df.drop_duplicates(subset=['timestamp'], keep='last', inplace=True)
        final_df.to_csv(outfile, index=False)
        print(f"✅ Saved {symbol} to {outfile}\n")