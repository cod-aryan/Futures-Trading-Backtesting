"use client";

import { useState, useCallback, useRef } from "react";

const TOOL_CLICK_COUNTS = {
  horizontal: 1,
  trendline: 2,
  ray: 2,
  fib: 2,
  "long-position": 3,
  "short-position": 3,
};

const TOOL_STEP_LABELS = {
  horizontal: ["Click to place horizontal line"],
  trendline: ["Click start point", "Click end point"],
  ray: ["Click origin point", "Click direction point"],
  fib: ["Click first price level", "Click second price level"],
  "long-position": ["Click entry price", "Click stop loss", "Click take profit"],
  "short-position": ["Click entry price", "Click stop loss", "Click take profit"],
};

/**
 * Hook to manage chart drawing state and tool interactions.
 */
export default function useDrawings(onPositionPlace) {
  const [drawings, setDrawings] = useState([]);
  const [activeTool, setActiveTool] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);
  const pendingPointsRef = useRef([]);

  const handleChartClick = useCallback(
    (time, price) => {
      if (!activeTool) return;

      const needed = TOOL_CLICK_COUNTS[activeTool];
      if (!needed) return;

      pendingPointsRef.current.push({ time, price });
      const stepNow = pendingPointsRef.current.length;
      setCurrentStep(stepNow);

      if (stepNow >= needed) {
        const points = [...pendingPointsRef.current];
        pendingPointsRef.current = [];
        setCurrentStep(0);

        if (activeTool === "horizontal") {
          setDrawings((prev) => [
            ...prev,
            { id: Date.now(), type: "horizontal", price: points[0].price, color: "#f7c948" },
          ]);
        } else if (activeTool === "trendline") {
          setDrawings((prev) => [
            ...prev,
            { id: Date.now(), type: "trendline", p1: points[0], p2: points[1], color: "#2962ff" },
          ]);
        } else if (activeTool === "ray") {
          setDrawings((prev) => [
            ...prev,
            { id: Date.now(), type: "ray", p1: points[0], p2: points[1], color: "#e040fb" },
          ]);
        } else if (activeTool === "fib") {
          setDrawings((prev) => [
            ...prev,
            { id: Date.now(), type: "fib", p1: points[0], p2: points[1] },
          ]);
        } else if (activeTool === "long-position") {
          if (onPositionPlace) onPositionPlace("long", points[0].price, points[1].price, points[2].price);
        } else if (activeTool === "short-position") {
          if (onPositionPlace) onPositionPlace("short", points[0].price, points[1].price, points[2].price);
        }

        setActiveTool(null);
      }
    },
    [activeTool, onPositionPlace]
  );

  const selectTool = useCallback((tool) => {
    pendingPointsRef.current = [];
    setCurrentStep(0);
    setActiveTool((prev) => (prev === tool ? null : tool));
  }, []);

  const cancelTool = useCallback(() => {
    pendingPointsRef.current = [];
    setCurrentStep(0);
    setActiveTool(null);
  }, []);

  const removeDrawing = useCallback((id) => {
    setDrawings((prev) => prev.filter((d) => d.id !== id));
  }, []);

  const removeLastDrawing = useCallback(() => {
    setDrawings((prev) => prev.slice(0, -1));
  }, []);

  const clearDrawings = useCallback(() => {
    setDrawings([]);
    pendingPointsRef.current = [];
    setCurrentStep(0);
    setActiveTool(null);
  }, []);

  const getStepLabel = useCallback(() => {
    if (!activeTool) return null;
    const labels = TOOL_STEP_LABELS[activeTool];
    if (!labels) return null;
    return labels[currentStep] || labels[labels.length - 1];
  }, [activeTool, currentStep]);

  return {
    drawings,
    activeTool,
    currentStep,
    selectTool,
    cancelTool,
    handleChartClick,
    removeDrawing,
    removeLastDrawing,
    clearDrawings,
    getStepLabel,
  };
}
