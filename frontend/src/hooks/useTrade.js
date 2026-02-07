"use client";

import { runManualTrade } from "@/lib/api";

/**
 * Hook to handle manual trade submission.
 */
export default function useTrade({ selectedSymbol, timeframe, crosshairData, ohlcvData }) {
  const handleManualTrade = async (tradeParams) => {
    const entryTime = crosshairData?.time
      ? new Date(crosshairData.time * 1000).toISOString()
      : ohlcvData.length > 0
      ? new Date(ohlcvData[ohlcvData.length - 1].time * 1000).toISOString()
      : null;

    if (!entryTime) return { error: "No entry time" };

    return await runManualTrade({
      symbol: selectedSymbol,
      timeframe,
      entry_time: entryTime,
      ...tradeParams,
    });
  };

  return { handleManualTrade };
}
