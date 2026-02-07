"use client";

import { useState, useEffect } from "react";
import { fetchSymbols, fetchOHLCV } from "@/lib/api";

/**
 * Hook to manage symbol list, OHLCV data loading, and price info.
 */
export default function useMarketData(initialSymbol = "BTCUSDT", initialTimeframe = "1h") {
  const [symbols, setSymbols] = useState(["BTCUSDT", "ETHUSDT"]);
  const [selectedSymbol, setSelectedSymbol] = useState(initialSymbol);
  const [timeframe, setTimeframe] = useState(initialTimeframe);
  const [ohlcvData, setOhlcvData] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [lastPrice, setLastPrice] = useState(null);
  const [priceChange, setPriceChange] = useState(null);

  // Load symbols on mount
  useEffect(() => {
    fetchSymbols()
      .then((s) => {
        if (s.length > 0) setSymbols(s);
      })
      .catch(() => {});
  }, []);

  // Load OHLCV when symbol/timeframe changes
  useEffect(() => {
    loadData();
  }, [selectedSymbol, timeframe]);

  const loadData = async () => {
    setDataLoading(true);
    try {
      const data = await fetchOHLCV(selectedSymbol, timeframe, 10000);
      setOhlcvData(data);
      if (data.length > 0) {
        const last = data[data.length - 1];
        setLastPrice(last.close);
        if (data.length > 1) {
          const prev = data[data.length - 2];
          const change = ((last.close - prev.close) / prev.close) * 100;
          setPriceChange(change);
        }
      }
    } catch (e) {
      console.error("Failed to load data:", e);
    }
    setDataLoading(false);
  };

  return {
    symbols,
    selectedSymbol,
    setSelectedSymbol,
    timeframe,
    setTimeframe,
    ohlcvData,
    dataLoading,
    lastPrice,
    priceChange,
  };
}
