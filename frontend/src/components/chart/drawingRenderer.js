/**
 * Pure rendering functions for chart drawings on a canvas overlay.
 * All coordinate conversions use lightweight-charts' built-in APIs.
 */

const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
const FIB_COLORS = [
  "#787b86", "#f44336", "#ff9800", "#ffeb3b", "#4caf50", "#2196f3", "#787b86",
];

export function renderAllDrawings(ctx, chart, series, drawings, positions, w, h) {
  ctx.clearRect(0, 0, w, h);
  if (!chart || !series) return;

  for (const d of drawings) {
    try {
      switch (d.type) {
        case "horizontal": renderHorizontal(ctx, series, d, w); break;
        case "trendline": renderTrendLine(ctx, chart, series, d); break;
        case "ray": renderRay(ctx, chart, series, d, w, h); break;
        case "fib": renderFib(ctx, chart, series, d, w); break;
      }
    } catch (e) { /* skip broken drawing */ }
  }

  for (const p of positions) {
    try { renderPosition(ctx, chart, series, p, w); } catch (e) {}
  }
}

// ─── Horizontal Line ──────────────────────────────────────────────────

function renderHorizontal(ctx, series, d, w) {
  const y = series.priceToCoordinate(d.price);
  if (y == null) return;

  ctx.save();
  ctx.strokeStyle = d.color || "#f7c948";
  ctx.lineWidth = 1;
  ctx.setLineDash([6, 4]);
  ctx.beginPath();
  ctx.moveTo(0, y);
  ctx.lineTo(w, y);
  ctx.stroke();

  // Label
  ctx.setLineDash([]);
  ctx.fillStyle = d.color || "#f7c948";
  ctx.font = "bold 10px sans-serif";
  ctx.fillText(d.price.toFixed(2), 6, y - 5);
  ctx.restore();
}

// ─── Trend Line ───────────────────────────────────────────────────────

function renderTrendLine(ctx, chart, series, d) {
  const x1 = chart.timeScale().timeToCoordinate(d.p1.time);
  const y1 = series.priceToCoordinate(d.p1.price);
  const x2 = chart.timeScale().timeToCoordinate(d.p2.time);
  const y2 = series.priceToCoordinate(d.p2.price);
  if (x1 == null || y1 == null || x2 == null || y2 == null) return;

  ctx.save();
  ctx.strokeStyle = d.color || "#2962ff";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // Endpoints
  ctx.fillStyle = d.color || "#2962ff";
  [x1, x2].forEach((x, i) => {
    const y = i === 0 ? y1 : y2;
    ctx.beginPath();
    ctx.arc(x, y, 3.5, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

// ─── Ray ──────────────────────────────────────────────────────────────

function renderRay(ctx, chart, series, d, w, h) {
  const x1 = chart.timeScale().timeToCoordinate(d.p1.time);
  const y1 = series.priceToCoordinate(d.p1.price);
  const x2 = chart.timeScale().timeToCoordinate(d.p2.time);
  const y2 = series.priceToCoordinate(d.p2.price);
  if (x1 == null || y1 == null || x2 == null || y2 == null) return;

  const dx = x2 - x1;
  const dy = y2 - y1;
  let extX, extY;

  if (Math.abs(dx) < 0.01) {
    extX = x2;
    extY = dy > 0 ? h * 2 : -h;
  } else {
    const targetX = dx > 0 ? w * 2 : -w;
    const t = (targetX - x1) / dx;
    extX = targetX;
    extY = y1 + dy * t;
  }

  ctx.save();
  ctx.strokeStyle = d.color || "#e040fb";
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(extX, extY);
  ctx.stroke();

  // Origin point
  ctx.fillStyle = d.color || "#e040fb";
  ctx.beginPath();
  ctx.arc(x1, y1, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

// ─── Fibonacci Retracement ────────────────────────────────────────────

function renderFib(ctx, chart, series, d, w) {
  const p1Price = d.p1.price;
  const p2Price = d.p2.price;
  const range = p2Price - p1Price;

  ctx.save();

  for (let i = 0; i < FIB_LEVELS.length; i++) {
    const level = FIB_LEVELS[i];
    const price = p1Price + range * (1 - level);
    const y = series.priceToCoordinate(price);
    if (y == null) continue;

    // Dashed level line
    ctx.strokeStyle = FIB_COLORS[i] || "#787b86";
    ctx.lineWidth = 0.8;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();

    // Label
    ctx.setLineDash([]);
    ctx.fillStyle = FIB_COLORS[i] || "#787b86";
    ctx.font = "10px sans-serif";
    ctx.fillText(`${(level * 100).toFixed(1)}%  ${price.toFixed(2)}`, 6, y - 3);

    // Shaded zone between levels
    if (i < FIB_LEVELS.length - 1) {
      const nextPrice = p1Price + range * (1 - FIB_LEVELS[i + 1]);
      const nextY = series.priceToCoordinate(nextPrice);
      if (nextY != null) {
        ctx.fillStyle = `${FIB_COLORS[i]}12`;
        ctx.fillRect(0, Math.min(y, nextY), w, Math.abs(nextY - y));
      }
    }
  }
  ctx.restore();
}

// ─── Long / Short Position ────────────────────────────────────────────

function renderPosition(ctx, chart, series, pos, w) {
  const entryY = series.priceToCoordinate(pos.entry);
  if (entryY == null) return;

  const entryX = pos.entryTime
    ? chart.timeScale().timeToCoordinate(pos.entryTime)
    : null;
  const startX = entryX != null ? Math.max(0, entryX) : 0;

  ctx.save();

  // ── Entry line ──
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([]);
  ctx.beginPath();
  ctx.moveTo(startX, entryY);
  ctx.lineTo(w, entryY);
  ctx.stroke();

  // Entry label
  ctx.fillStyle = pos.type === "long" ? "#26a69a" : "#ef5350";
  ctx.font = "bold 11px sans-serif";
  ctx.fillText(
    `${pos.type.toUpperCase()} @ ${pos.entry.toFixed(2)}`,
    startX + 6,
    entryY - 6
  );

  // ── SL zone ──
  if (pos.sl != null) {
    const slY = series.priceToCoordinate(pos.sl);
    if (slY != null) {
      const top = Math.min(entryY, slY);
      const height = Math.abs(slY - entryY);

      ctx.fillStyle = pos.active
        ? "rgba(239,83,80,0.18)"
        : "rgba(239,83,80,0.06)";
      ctx.fillRect(startX, top, w - startX, height);

      ctx.strokeStyle = "#ef5350";
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(startX, slY);
      ctx.lineTo(w, slY);
      ctx.stroke();

      const slPct = ((pos.sl - pos.entry) / pos.entry) * 100;
      ctx.setLineDash([]);
      ctx.fillStyle = "#ef5350";
      ctx.font = "10px sans-serif";
      const slLabelY = pos.type === "long" ? slY + 13 : slY - 5;
      ctx.fillText(
        `SL: ${pos.sl.toFixed(2)} (${slPct >= 0 ? "+" : ""}${slPct.toFixed(1)}%)`,
        startX + 6,
        slLabelY
      );
    }
  }

  // ── TP zone ──
  if (pos.tp != null) {
    const tpY = series.priceToCoordinate(pos.tp);
    if (tpY != null) {
      const top = Math.min(entryY, tpY);
      const height = Math.abs(tpY - entryY);

      ctx.fillStyle = pos.active
        ? "rgba(38,166,154,0.18)"
        : "rgba(38,166,154,0.06)";
      ctx.fillRect(startX, top, w - startX, height);

      ctx.strokeStyle = "#26a69a";
      ctx.lineWidth = 1;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.moveTo(startX, tpY);
      ctx.lineTo(w, tpY);
      ctx.stroke();

      const tpPct = ((pos.tp - pos.entry) / pos.entry) * 100;
      ctx.setLineDash([]);
      ctx.fillStyle = "#26a69a";
      ctx.font = "10px sans-serif";
      const tpLabelY = pos.type === "long" ? tpY - 5 : tpY + 13;
      ctx.fillText(
        `TP: ${pos.tp.toFixed(2)} (${tpPct >= 0 ? "+" : ""}${tpPct.toFixed(1)}%)`,
        startX + 6,
        tpLabelY
      );
    }
  }

  // ── Closed marker ──
  if (!pos.active && pos.exitReason) {
    ctx.fillStyle = (pos.pnl || 0) > 0 ? "#26a69a" : "#ef5350";
    ctx.font = "bold 11px sans-serif";
    ctx.fillText(
      `CLOSED: ${pos.exitReason} (${(pos.pnl || 0) > 0 ? "+" : ""}${(pos.pnl || 0).toFixed(2)}%)`,
      startX + 6,
      entryY + 18
    );
  }

  ctx.restore();
}
