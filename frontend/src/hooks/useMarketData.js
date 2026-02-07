"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { fetchSymbols, fetchOHLCV } from "@/lib/api";

const PAGE_SIZE = 1000; // Number of candles to load per page (adjust as needed)

/**
 * Hook to manage symbol list, OHLCV data loading with lazy pagination.
 * Loads the latest PAGE_SIZE candles initially, then loads older data on demand.
 */
export default function useMarketData(initialSymbol = "BTCUSDT", initialTimeframe = "1h") {
  const [symbols, setSymbols] = useState(["BTCUSDT", "ETHUSDT"]);
  const [selectedSymbol, setSelectedSymbol] = useState(initialSymbol);
  const [timeframe, setTimeframe] = useState(initialTimeframe);
  const [ohlcvData, setOhlcvData] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [lastPrice, setLastPrice] = useState(null);
  const [priceChange, setPriceChange] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const loadingMoreRef = useRef(false);
  const totalRef = useRef(0);

  // Load symbols on mount
  useEffect(() => {
    fetchSymbols()
      .then((s) => {
        if (s.length > 0) setSymbols(s);
      })
      .catch(() => {});
  }, []);

  // Load initial data when symbol/timeframe changes
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setDataLoading(true);
      setHasMore(true);
      totalRef.current = 0;
      try {
        const { records, total } = await fetchOHLCV(selectedSymbol, timeframe, PAGE_SIZE);
        if (cancelled) return;
        totalRef.current = total;
        // Sort to guarantee ascending time order
        records.sort((a, b) => a.time - b.time);
        setOhlcvData(records);
        setHasMore(records.length < total);
        if (records.length > 0) {
          const last = records[records.length - 1];
          setLastPrice(last.close);
          if (records.length > 1) {
            const prev = records[records.length - 2];
            const change = ((last.close - prev.close) / prev.close) * 100;
            setPriceChange(change);
          }
        }
      } catch (e) {
        console.error("Failed to load data:", e);
      }
      if (!cancelled) setDataLoading(false);
    };
    load();
    return () => { cancelled = true; };
  }, [selectedSymbol, timeframe]);

  // Load older data (called when user scrolls to the left edge)
  const loadMore = useCallback(async () => {
    if (loadingMoreRef.current || !hasMore || ohlcvData.length === 0) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const oldestTime = ohlcvData[0].time;
      const { records } = await fetchOHLCV(selectedSymbol, timeframe, PAGE_SIZE, oldestTime);
      if (records.length === 0) {
        setHasMore(false);
      } else {
        let noNew = false;
        setOhlcvData((prev) => {
          // Filter against the CURRENT state, not the stale closure
          const existingFirstTime = prev.length > 0 ? prev[0].time : Infinity;
          const newCandles = records.filter((r) => r.time < existingFirstTime);
          if (newCandles.length === 0) {
            noNew = true;
            return prev;
          }
          // Sort the combined array to guarantee ascending time order
          const combined = [...newCandles, ...prev];
          combined.sort((a, b) => a.time - b.time);
          return combined;
        });
        if (noNew) {
          setHasMore(false);
        } else if (records.length < PAGE_SIZE) {
          setHasMore(false);
        }
      }
    } catch (e) {
      console.error("Failed to load more data:", e);
    }
    loadingMoreRef.current = false;
    setLoadingMore(false);
  }, [hasMore, ohlcvData, selectedSymbol, timeframe]);

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
    hasMore,
    loadMore,
    loadingMore,
  };
}
