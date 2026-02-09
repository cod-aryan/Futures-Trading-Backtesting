import os
import time
import ccxt
import pandas as pd

# 1. Configuration
symbols = ['BTC/USDT', 'ETH/USDT']
timeframe_str = "1m"
ms_1min = 60 * 1000  
outdir = "./"
ist_offset = pd.Timedelta(hours=5, minutes=30)

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
    desired_start = exchange.parse8601('2022-01-01T00:00:00Z')
    
    # --- Check for existing data to resume ---
    if os.path.exists(outfile):
        existing_df = pd.read_csv(outfile)
        earliest_ts = int(existing_df['timestamp'].iloc[0])
        
        # --- Backfill: fetch older data if existing CSV starts after desired_start ---
        if earliest_ts > desired_start:
            print(f"⏪ Backfilling data from 2022-01-01 to earliest existing entry...")
            backfill_since = desired_start
            backfill_end = earliest_ts
            while backfill_since < backfill_end:
                try:
                    ohlcv = exchange.fetch_ohlcv(symbol, timeframe_str, backfill_since, 1000)
                    if not ohlcv:
                        break
                    df_temp = pd.DataFrame(ohlcv, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
                    df_temp['datetime'] = pd.to_datetime(df_temp['timestamp'], unit='ms') + ist_offset
                    df_temp = df_temp[['datetime', 'timestamp', 'open', 'high', 'low', 'close', 'volume']]
                    # Only keep rows before existing data
                    df_temp = df_temp[df_temp['timestamp'] < backfill_end]
                    accumulator.append(df_temp)
                    backfill_since = ohlcv[-1][0] + ms_1min
                    print(f"Backfilled until (IST): {df_temp['datetime'].iloc[-1]}")
                    time.sleep(exchange.rateLimit / 1000)
                except Exception as e:
                    print(f"Error backfilling {symbol}: {e}")
                    time.sleep(10)
                    continue
            print(f"✅ Backfill complete.")
        
        # Now resume forward from the last timestamp
        since = int(existing_df['timestamp'].iloc[-1]) + ms_1min
        accumulator.append(existing_df)
        print(f"Resuming from last timestamp. Last IST entry: {existing_df['datetime'].iloc[-1]}")
    else:
        # Start from Jan 1, 2022 (UTC)
        since = desired_start

    while since < exchange.milliseconds():
        try:
            ohlcv = exchange.fetch_ohlcv(symbol, timeframe_str, since, 1000)
            
            if not ohlcv:
                break
            
            df_temp = pd.DataFrame(ohlcv, columns=['timestamp', 'open', 'high', 'low', 'close', 'volume'])
            
            # --- Convert to IST ---
            df_temp['datetime'] = pd.to_datetime(df_temp['timestamp'], unit='ms') + ist_offset
            
            # Reorder columns
            df_temp = df_temp[['datetime', 'timestamp', 'open', 'high', 'low', 'close', 'volume']]
            
            accumulator.append(df_temp)
            since = ohlcv[-1][0] + ms_1min
            
            print(f"Fetched until (IST): {df_temp['datetime'].iloc[-1]}")
            
            time.sleep(exchange.rateLimit / 1000)
            
        except Exception as e:
            print(f"Error fetching {symbol}: {e}")
            time.sleep(10)
            continue

    # 3. Final Save
    if accumulator:
        final_df = pd.concat(accumulator, ignore_index=True)
        # Drop duplicates in case of overlapping batches
        final_df.drop_duplicates(subset=['timestamp'], keep='last', inplace=True)
        final_df.sort_values('timestamp', inplace=True)
        final_df.to_csv(outfile, index=False)
        print(f"✅ Saved/Updated {symbol} in IST to {outfile}\n")