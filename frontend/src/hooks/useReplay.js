"use client";

import { useState, useCallback, useMemo } from "react";

/**
 * Hook to manage replay/practice mode: cut chart, step forward, track positions.
 */
export default function useReplay(fullData) {
  const [isActive, setIsActive] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const [positions, setPositions] = useState([]);
  const [completedTrades, setCompletedTrades] = useState([]);
  const [startPercent, setStartPercent] = useState(70);

  const startReplay = useCallback(() => {
    if (!fullData || fullData.length === 0) return;
    const count = Math.max(1, Math.floor(fullData.length * (startPercent / 100)));
    setVisibleCount(count);
    setIsActive(true);
    setPositions([]);
    setCompletedTrades([]);
  }, [fullData, startPercent]);

  const stopReplay = useCallback(() => {
    setIsActive(false);
    setPositions([]);
    setCompletedTrades([]);
  }, []);

  const visibleData = useMemo(() => {
    if (!isActive || !fullData) return fullData || [];
    return fullData.slice(0, visibleCount);
  }, [isActive, fullData, visibleCount]);

  const hiddenCount = useMemo(() => {
    if (!isActive || !fullData) return 0;
    return fullData.length - visibleCount;
  }, [isActive, fullData, visibleCount]);

  const stepForward = useCallback(
    (count = 1) => {
      if (!isActive || !fullData || visibleCount >= fullData.length) return;

      const newCount = Math.min(visibleCount + count, fullData.length);
      const newCandles = fullData.slice(visibleCount, newCount);
      setVisibleCount(newCount);

      // Check positions against new candles
      const stillActive = [];
      const resolved = [];

      for (const pos of positions) {
        let wasResolved = false;
        for (const candle of newCandles) {
          if (pos.type === "long") {
            if (pos.sl && candle.low <= pos.sl) {
              resolved.push({
                ...pos,
                active: false,
                exitPrice: pos.sl,
                exitReason: "SL",
                exitTime: candle.time,
                pnl: ((pos.sl - pos.entry) / pos.entry) * 100,
              });
              wasResolved = true;
              break;
            }
            if (pos.tp && candle.high >= pos.tp) {
              resolved.push({
                ...pos,
                active: false,
                exitPrice: pos.tp,
                exitReason: "TP",
                exitTime: candle.time,
                pnl: ((pos.tp - pos.entry) / pos.entry) * 100,
              });
              wasResolved = true;
              break;
            }
          } else {
            if (pos.sl && candle.high >= pos.sl) {
              resolved.push({
                ...pos,
                active: false,
                exitPrice: pos.sl,
                exitReason: "SL",
                exitTime: candle.time,
                pnl: ((pos.entry - pos.sl) / pos.entry) * 100,
              });
              wasResolved = true;
              break;
            }
            if (pos.tp && candle.low <= pos.tp) {
              resolved.push({
                ...pos,
                active: false,
                exitPrice: pos.tp,
                exitReason: "TP",
                exitTime: candle.time,
                pnl: ((pos.entry - pos.tp) / pos.entry) * 100,
              });
              wasResolved = true;
              break;
            }
          }
        }
        if (!wasResolved) stillActive.push(pos);
      }

      setPositions(stillActive);
      if (resolved.length > 0) {
        setCompletedTrades((prev) => [...prev, ...resolved]);
      }
    },
    [isActive, fullData, visibleCount, positions]
  );

  const placePosition = useCallback(
    (type, entry, sl, tp) => {
      const pos = {
        id: Date.now() + Math.random(),
        type,
        entry,
        sl: sl || null,
        tp: tp || null,
        active: true,
        entryTime:
          visibleData.length > 0
            ? visibleData[visibleData.length - 1].time
            : 0,
      };
      setPositions((prev) => [...prev, pos]);
      return pos;
    },
    [visibleData]
  );

  const removePosition = useCallback((id) => {
    setPositions((prev) => prev.filter((p) => p.id !== id));
  }, []);

  const stats = useMemo(() => {
    const wins = completedTrades.filter((t) => t.pnl > 0);
    const losses = completedTrades.filter((t) => t.pnl <= 0);
    const totalPnl = completedTrades.reduce((sum, t) => sum + (t.pnl || 0), 0);
    return {
      totalTrades: completedTrades.length,
      wins: wins.length,
      losses: losses.length,
      winRate:
        completedTrades.length > 0
          ? ((wins.length / completedTrades.length) * 100).toFixed(1)
          : "0.0",
      totalPnl: totalPnl.toFixed(2),
    };
  }, [completedTrades]);

  return {
    isActive,
    visibleData,
    visibleCount,
    hiddenCount,
    positions,
    completedTrades,
    stats,
    startPercent,
    setStartPercent,
    startReplay,
    stopReplay,
    stepForward,
    placePosition,
    removePosition,
  };
}
