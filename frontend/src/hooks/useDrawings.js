"use client";

import { useState, useCallback, useRef, useEffect } from "react";

const TOOL_CLICK_COUNTS = {
  horizontal: 1,
  trendline: 2,
  ray: 2,
  fib: 2,
  rectangle: 2,
  "long-position": 3,
  "short-position": 3,
};

const TOOL_STEP_LABELS = {
  horizontal: ["Click to place horizontal line"],
  trendline: ["Click start point", "Click end point"],
  ray: ["Click origin point", "Click direction point"],
  fib: ["Click first level", "Click second level"],
  rectangle: ["Click first corner", "Click opposite corner"],
  "long-position": ["Click entry price", "Click stop loss", "Click take profit"],
  "short-position": ["Click entry price", "Click stop loss", "Click take profit"],
};

export default function useDrawings(onPositionPlace, storageKey) {
  const [drawings, setDrawings] = useState([]);
  const [activeTool, setActiveTool] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [hoveredId, setHoveredId] = useState(null);
  const [pendingPosition, setPendingPosition] = useState(null);
  const pendingPointsRef = useRef([]);
  const skipSaveRef = useRef(false);

  // ── Undo / Redo history ────────────────────────────────────────
  const undoStackRef = useRef([]);
  const redoStackRef = useRef([]);

  const pushToHistory = useCallback((prev) => {
    undoStackRef.current = [...undoStackRef.current, prev];
    redoStackRef.current = [];  // clear redo on new action
  }, []);

  const undo = useCallback(() => {
    if (undoStackRef.current.length === 0) return;
    const prev = undoStackRef.current[undoStackRef.current.length - 1];
    undoStackRef.current = undoStackRef.current.slice(0, -1);
    setDrawings((cur) => {
      redoStackRef.current = [...redoStackRef.current, cur];
      return prev;
    });
  }, []);

  const redo = useCallback(() => {
    if (redoStackRef.current.length === 0) return;
    const next = redoStackRef.current[redoStackRef.current.length - 1];
    redoStackRef.current = redoStackRef.current.slice(0, -1);
    setDrawings((cur) => {
      undoStackRef.current = [...undoStackRef.current, cur];
      return next;
    });
  }, []);

  // ── Load drawings from localStorage when key changes ───────

  useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = localStorage.getItem(`drawings_${storageKey}`);
      skipSaveRef.current = true;
      setDrawings(saved ? JSON.parse(saved) : []);
      setSelectedId(null);
      setActiveTool(null);
      pendingPointsRef.current = [];
      setCurrentStep(0);
    } catch (_) {
      setDrawings([]);
    }
  }, [storageKey]);

  // ── Save drawings to localStorage on change ────────────────

  useEffect(() => {
    if (!storageKey) return;
    if (skipSaveRef.current) { skipSaveRef.current = false; return; }
    try {
      localStorage.setItem(`drawings_${storageKey}`, JSON.stringify(drawings));
    } catch (_) {}
  }, [drawings, storageKey]);

  // ── Place a drawing via chart clicks ───────────────────────────

  const handleChartClick = useCallback(
    (time, price) => {
      // If no tool active, deselect
      if (!activeTool) {
        setSelectedId(null);
        setPendingPosition(null);
        return;
      }

      const needed = TOOL_CLICK_COUNTS[activeTool];
      if (!needed) return;

      pendingPointsRef.current.push({ time, price });
      const step = pendingPointsRef.current.length;
      setCurrentStep(step);

      // Build live preview for position tools
      const isPosTool = activeTool === "long-position" || activeTool === "short-position";
      if (isPosTool && step < needed) {
        const type = activeTool === "long-position" ? "long" : "short";
        const pts = pendingPointsRef.current;
        setPendingPosition({
          id: "preview",
          type,
          entry: pts[0]?.price,
          sl: pts[1]?.price || null,
          tp: null,
          active: true,
          preview: true,
        });
      }

      if (step >= needed) {
        const pts = [...pendingPointsRef.current];
        pendingPointsRef.current = [];
        setCurrentStep(0);
        setPendingPosition(null);

        const id = Date.now() + Math.random();
        switch (activeTool) {
          case "horizontal":
            setDrawings((p) => { pushToHistory(p); return [...p, { id, type: "horizontal", price: pts[0].price, color: "#f7c948" }]; });
            break;
          case "trendline":
            setDrawings((p) => { pushToHistory(p); return [...p, { id, type: "trendline", p1: pts[0], p2: pts[1], color: "#2962ff" }]; });
            break;
          case "ray":
            setDrawings((p) => { pushToHistory(p); return [...p, { id, type: "ray", p1: pts[0], p2: pts[1], color: "#e040fb" }]; });
            break;
          case "fib":
            setDrawings((p) => { pushToHistory(p); return [...p, { id, type: "fib", p1: pts[0], p2: pts[1] }]; });
            break;
          case "rectangle":
            setDrawings((p) => { pushToHistory(p); return [...p, { id, type: "rectangle", p1: pts[0], p2: pts[1], color: "#2196f3" }]; });
            break;
          case "long-position":
            if (onPositionPlace) onPositionPlace("long", pts[0].price, pts[1].price, pts[2].price);
            break;
          case "short-position":
            if (onPositionPlace) onPositionPlace("short", pts[0].price, pts[1].price, pts[2].price);
            break;
        }
        setActiveTool(null);
      }
    },
    [activeTool, onPositionPlace, pushToHistory]
  );

  // ── Tool selection ─────────────────────────────────────────────

  const selectTool = useCallback((tool) => {
    pendingPointsRef.current = [];
    setCurrentStep(0);
    setSelectedId(null);
    setActiveTool((prev) => (prev === tool ? null : tool));
  }, []);

  const cancelTool = useCallback(() => {
    pendingPointsRef.current = [];
    setCurrentStep(0);
    setActiveTool(null);
    setPendingPosition(null);
  }, []);

  // ── Drawing management ─────────────────────────────────────────

  const selectDrawing = useCallback((id) => {
    setSelectedId(id);
    setActiveTool(null);
  }, []);

  const removeDrawing = useCallback((id) => {
    setDrawings((prev) => { pushToHistory(prev); return prev.filter((d) => d.id !== id); });
    setSelectedId((prev) => (prev === id ? null : prev));
  }, [pushToHistory]);

  const removeSelected = useCallback(() => {
    if (selectedId != null) {
      setDrawings((prev) => { pushToHistory(prev); return prev.filter((d) => d.id !== selectedId); });
      setSelectedId(null);
    }
  }, [selectedId, pushToHistory]);

  const removeLastDrawing = useCallback(() => {
    setDrawings((prev) => { pushToHistory(prev); return prev.slice(0, -1); });
  }, [pushToHistory]);

  const updateDrawing = useCallback((id, changes) => {
    setDrawings((prev) => {
      pushToHistory(prev);
      return prev.map((d) => (d.id === id ? { ...d, ...changes } : d));
    });
  }, [pushToHistory]);

  const clearDrawings = useCallback(() => {
    setDrawings((prev) => { pushToHistory(prev); return []; });
    pendingPointsRef.current = [];
    setCurrentStep(0);
    setActiveTool(null);
    setSelectedId(null);
    setPendingPosition(null);
  }, [pushToHistory]);

  // ── Step label ─────────────────────────────────────────────────

  const getStepLabel = useCallback(() => {
    if (!activeTool) return null;
    const labels = TOOL_STEP_LABELS[activeTool];
    return labels?.[currentStep] || labels?.[labels.length - 1] || null;
  }, [activeTool, currentStep]);

  const canUndo = undoStackRef.current.length > 0;
  const canRedo = redoStackRef.current.length > 0;

  return {
    drawings,
    activeTool,
    selectedId,
    hoveredId,
    currentStep,
    pendingPosition,
    canUndo,
    canRedo,
    selectTool,
    cancelTool,
    handleChartClick,
    selectDrawing,
    removeDrawing,
    removeSelected,
    removeLastDrawing,
    clearDrawings,
    updateDrawing,
    undo,
    redo,
    setHoveredId,
    getStepLabel,
  };
}
