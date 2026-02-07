"use client";

/**
 * Drawing tools toolbar with delete/clear controls.
 */
export default function DrawingToolbar({
  activeTool,
  selectedId,
  stepLabel,
  canUndo,
  canRedo,
  onSelectTool,
  onRemoveSelected,
  onClearAll,
  onUndo,
  onRedo,
}) {
  const tools = [
    { id: "horizontal", label: "─", title: "Horizontal Line" },
    { id: "trendline", label: "╲", title: "Trend Line" },
    { id: "ray", label: "→", title: "Ray" },
    { id: "fib", label: "Fib", title: "Fibonacci Retracement" },
    { id: "long-position", label: "▲ Long", title: "Long Position" },
    { id: "short-position", label: "▼ Short", title: "Short Position" },
  ];

  const btnBase = {
    padding: "5px 10px",
    borderRadius: 4,
    border: "1px solid var(--border-color)",
    fontSize: 11,
    fontWeight: 600,
    cursor: "pointer",
    transition: "all 0.15s",
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "4px 8px",
        background: "var(--bg-secondary)",
        borderBottom: "1px solid var(--border-color)",
        flexWrap: "wrap",
        minHeight: 36,
      }}
    >
      {tools.map((t) => (
        <button
          key={t.id}
          title={t.title}
          onClick={() => onSelectTool(t.id)}
          style={{
            ...btnBase,
            background: activeTool === t.id ? "var(--accent-blue)" : "var(--bg-primary)",
            color: activeTool === t.id ? "#fff" : "var(--text-secondary)",
            borderColor: activeTool === t.id ? "var(--accent-blue)" : "var(--border-color)",
          }}
        >
          {t.label}
        </button>
      ))}

      <div style={{ width: 1, height: 20, background: "var(--border-color)", margin: "0 4px" }} />

      {/* Undo / Redo */}
      <button
        onClick={onUndo}
        title="Undo (Ctrl+Z)"
        disabled={!canUndo}
        style={{
          ...btnBase,
          background: "var(--bg-primary)",
          color: canUndo ? "var(--text-primary)" : "var(--text-secondary)",
          opacity: canUndo ? 1 : 0.4,
          cursor: canUndo ? "pointer" : "default",
        }}
      >
        ↩
      </button>
      <button
        onClick={onRedo}
        title="Redo (Ctrl+Shift+Z)"
        disabled={!canRedo}
        style={{
          ...btnBase,
          background: "var(--bg-primary)",
          color: canRedo ? "var(--text-primary)" : "var(--text-secondary)",
          opacity: canRedo ? 1 : 0.4,
          cursor: canRedo ? "pointer" : "default",
        }}
      >
        ↪
      </button>

      <div style={{ width: 1, height: 20, background: "var(--border-color)", margin: "0 4px" }} />

      {selectedId != null && (
        <button
          onClick={onRemoveSelected}
          title="Delete selected drawing (Del)"
          style={{
            ...btnBase,
            background: "#ef535022",
            color: "#ef5350",
            borderColor: "#ef535044",
          }}
        >
          🗑 Delete
        </button>
      )}

      <button
        onClick={onClearAll}
        title="Clear all drawings"
        style={{
          ...btnBase,
          background: "var(--bg-primary)",
          color: "var(--text-secondary)",
        }}
      >
        Clear All
      </button>

      {stepLabel && (
        <span
          style={{
            marginLeft: 8,
            fontSize: 11,
            color: "var(--accent-blue)",
            fontWeight: 600,
          }}
        >
          {stepLabel}
        </span>
      )}
    </div>
  );
}
