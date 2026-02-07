"use client";

import { useState, useCallback, useMemo, useEffect, useRef } from "react";

/**
 * Hook to manage replay/practice mode: cut chart, step forward, track positions.
 */
export default function useReplay(fullData, storageKey) {
  const [isActive, setIsActive] = useState(false);
  const [visibleCount, setVisibleCount] = useState(0);
  const [positions, setPositions] = useState([]);
  const [completedTrades, setCompletedTrades] = useState([]);
  const [cutTime, setCutTime] = useState(null); // timestamp where user cut
  const skipTradeSaveRef = useRef(false);
  const skipPosSaveRef = useRef(false);
  const prevDataLenRef = useRef(0);

  // ── Load positions & completed trades from localStorage when key changes ─

  useEffect(() => {
    if (!storageKey) return;
    try {
      const savedTrades = localStorage.getItem(`trades_${storageKey}`);
      skipTradeSaveRef.current = true;
      setCompletedTrades(savedTrades ? JSON.parse(savedTrades) : []);
    } catch (_) {
      setCompletedTrades([]);
    }
    try {
      const savedPos = localStorage.getItem(`positions_${storageKey}`);
      skipPosSaveRef.current = true;
      setPositions(savedPos ? JSON.parse(savedPos) : []);
    } catch (_) {
      setPositions([]);
    }
  }, [storageKey]);

  // ── Save completed trades to localStorage on change ──────────

  useEffect(() => {
    if (!storageKey) return;
    if (skipTradeSaveRef.current) { skipTradeSaveRef.current = false; return; }
    try {
      localStorage.setItem(`trades_${storageKey}`, JSON.stringify(completedTrades));
    } catch (_) {}
  }, [completedTrades, storageKey]);

  // ── Save active positions to localStorage on change ──────────

  useEffect(() => {
    if (!storageKey) return;
    if (skipPosSaveRef.current) { skipPosSaveRef.current = false; return; }
    try {
      localStorage.setItem(`positions_${storageKey}`, JSON.stringify(positions));
    } catch (_) {}
  }, [positions, storageKey]);

  // ── Adjust visibleCount when fullData changes (timeframe switch) using cutTime ──

  const isActiveRef = useRef(isActive);
  const visibleCountRef = useRef(visibleCount);
  const cutTimeRef = useRef(cutTime);
  const lastVisibleTimeRef = useRef(null);
  isActiveRef.current = isActive;
  visibleCountRef.current = visibleCount;
  cutTimeRef.current = cutTime;

  // Keep lastVisibleTimeRef in sync whenever visibleCount or data changes
  useEffect(() => {
    if (isActive && fullData && visibleCount > 0 && visibleCount <= fullData.length) {
      lastVisibleTimeRef.current = fullData[visibleCount - 1]?.time ?? null;
    }
  }, [isActive, fullData, visibleCount]);

  useEffect(() => {
    if (!fullData || fullData.length === 0) return;
    const newLen = fullData.length;
    const oldLen = prevDataLenRef.current;

    if (isActiveRef.current && lastVisibleTimeRef.current != null && newLen !== oldLen) {
      // Find the candle in the new timeframe data closest to the last visible time
      let bestIdx = 0;
      let bestDiff = Infinity;
      for (let i = 0; i < fullData.length; i++) {
        const diff = Math.abs(fullData[i].time - lastVisibleTimeRef.current);
        if (diff < bestDiff) { bestDiff = diff; bestIdx = i; }
      }
      const newVisible = Math.max(1, Math.min(bestIdx + 1, newLen));
      setVisibleCount(newVisible);
    }

    prevDataLenRef.current = newLen;
  }, [fullData]);

  const cutAtIndex = useCallback((index) => {
    if (!fullData || fullData.length === 0) return;
    const idx = Math.max(1, Math.min(index, fullData.length));
    setVisibleCount(idx);
    const t = fullData[idx - 1]?.time ?? null;
    setCutTime(t);
    lastVisibleTimeRef.current = t;
    setIsActive(true);
  }, [fullData]);

  const stopReplay = useCallback(() => {
    // Remove any active (pending or open) positions on stop
    setPositions((prev) => prev.filter((p) => !p.active));
    setIsActive(false);
    setCutTime(null);
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

      // Work on a mutable copy so execution + SL/TP can happen in same candle
      let working = positions.map((p) => ({ ...p }));

      for (const candle of newCandles) {
        const next = [];
        for (const pos of working) {
          // ── Step 1: Check execution for pending orders ─────
          if (!pos.executed) {
            let filled = false;
            if (pos.type === "long" && candle.low <= pos.entry) filled = true;
            if (pos.type === "short" && candle.high >= pos.entry) filled = true;
            if (filled) {
              pos.executed = true;
              pos.executedTime = candle.time;
              // Just filled — do NOT check SL/TP on this same candle
              next.push(pos);
              continue;
            } else {
              next.push(pos);
              continue;
            }
          }

          // ── Step 2: Check SL/TP only for previously executed orders ──
          let wasResolved = false;
          if (pos.type === "long") {
            if (pos.sl && candle.low <= pos.sl) {
              resolved.push({
                ...pos, active: false, exitPrice: pos.sl, exitReason: "SL",
                exitTime: candle.time, pnl: ((pos.sl - pos.entry) / pos.entry) * 100,
              });
              wasResolved = true;
            } else if (pos.tp && candle.high >= pos.tp) {
              resolved.push({
                ...pos, active: false, exitPrice: pos.tp, exitReason: "TP",
                exitTime: candle.time, pnl: ((pos.tp - pos.entry) / pos.entry) * 100,
              });
              wasResolved = true;
            }
          } else {
            if (pos.sl && candle.high >= pos.sl) {
              resolved.push({
                ...pos, active: false, exitPrice: pos.sl, exitReason: "SL",
                exitTime: candle.time, pnl: ((pos.entry - pos.sl) / pos.entry) * 100,
              });
              wasResolved = true;
            } else if (pos.tp && candle.low <= pos.tp) {
              resolved.push({
                ...pos, active: false, exitPrice: pos.tp, exitReason: "TP",
                exitTime: candle.time, pnl: ((pos.entry - pos.tp) / pos.entry) * 100,
              });
              wasResolved = true;
            }
          }
          if (!wasResolved) next.push(pos);
        }
        working = next;
      }

      setPositions(working);
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
        executed: false,
        executedTime: null,
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

  const clearAllOrders = useCallback(() => {
    setPositions([]);
    setCompletedTrades([]);
    if (storageKey) {
      try {
        localStorage.removeItem(`trades_${storageKey}`);
        localStorage.removeItem(`positions_${storageKey}`);
      } catch (_) {}
    }
  }, [storageKey]);

  const updatePosition = useCallback((id, field, value) => {
    setPositions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );
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
    cutAtIndex,
    stopReplay,
    stepForward,
    placePosition,
    removePosition,
    updatePosition,
    clearAllOrders,
  };
}
