"use client";

import { useState } from "react";
import { runBacktest } from "@/lib/api";

/**
 * Hook to manage backtest execution state.
 */
export default function useBacktest() {
  const [backtestResult, setBacktestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleBacktest = async (params) => {
    setLoading(true);
    try {
      const result = await runBacktest(params);
      setBacktestResult(result);
    } catch (e) {
      setBacktestResult({ error: e.message });
    }
    setLoading(false);
  };

  const clearResult = () => setBacktestResult(null);

  return { backtestResult, loading, handleBacktest, clearResult };
}
