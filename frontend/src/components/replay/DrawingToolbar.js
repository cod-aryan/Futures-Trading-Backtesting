"use client";

const TOOLS = [
  { id: "horizontal", label: "H-Line", icon: "─", title: "Horizontal Line" },
  { id: "trendline", label: "Trend", icon: "╱", title: "Trend Line" },
  { id: "ray", label: "Ray", icon: "→", title: "Ray" },
  { id: "fib", label: "Fib", icon: "ƒ", title: "Fibonacci Retracement" },
  { id: "long-position", label: "Long", icon: "▲", title: "Long Position (Entry → SL → TP)", color: "#26a69a" },
  { id: "short-position", label: "Short", icon: "▼", title: "Short Position (Entry → SL → TP)", color: "#ef5350" },
];

/**
 * Floating vertical toolbar for selecting drawing tools.
 * Positioned on the left side of the chart, TradingView-style.
 */
export default function DrawingToolbar({
  activeTool,
  stepLabel,
  onSelectTool,
  onClear,
  onUndo,
}) {
  return (
    <div
      style={{
        position: "absolute",
        top: 8,
        left: 8,
        zIndex: 20,
        display: "flex",
        flexDirection: "column",
        gap: 2,
        background: "var(--bg-secondary)",
        border: "1px solid var(--border-color)",
        borderRadius: 6,
        padding: 4,
        boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
      }}
    >
      {TOOLS.map((tool) => (
        <button
          key={tool.id}
          title={tool.title}
          onClick={() => onSelectTool(tool.id)}
          style={{
            width: 36,
            height: 32,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              activeTool === tool.id
                ? "var(--accent-blue)"
                : "transparent",
            color: tool.color
              ? activeTool === tool.id
                ? "#fff"
                : tool.color
              : activeTool === tool.id
              ? "#fff"
              : "var(--text-secondary)",
            borderRadius: 4,
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            border: "none",
            transition: "all 0.12s",
          }}
        >
          {tool.icon}
        </button>
      ))}

      {/* Divider */}
      <div
        style={{
          height: 1,
          background: "var(--border-color)",
          margin: "2px 0",
        }}
      />

      {/* Undo */}
      <button
        title="Undo last drawing (Ctrl+Z)"
        onClick={onUndo}
        style={{
          width: 36,
          height: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
          color: "var(--text-secondary)",
          borderRadius: 4,
          fontSize: 12,
          cursor: "pointer",
          border: "none",
        }}
      >
        ↩
      </button>

      {/* Clear all */}
      <button
        title="Clear all drawings"
        onClick={onClear}
        style={{
          width: 36,
          height: 28,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
          color: "var(--accent-red)",
          borderRadius: 4,
          fontSize: 13,
          cursor: "pointer",
          border: "none",
        }}
      >
        ✕
      </button>

      {/* Active tool hint */}
      {stepLabel && (
        <div
          style={{
            position: "absolute",
            left: 44,
            top: 0,
            background: "rgba(41,98,255,0.95)",
            color: "white",
            padding: "5px 10px",
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 600,
            whiteSpace: "nowrap",
            pointerEvents: "none",
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
          }}
        >
          {stepLabel}
        </div>
      )}
    </div>
  );
}
