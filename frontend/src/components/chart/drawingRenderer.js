/**
 * Canvas overlay renderer for drawings + Delta-style position projections.
 * Labels always render with background pills so they're never hidden by lines.
 */

const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
const FIB_COLORS = ["#787b86","#f44336","#ff9800","#ffeb3b","#4caf50","#2196f3","#787b86"];

/* ═══════════════════════════════════════════════════════════════════════
   PUBLIC
   ═══════════════════════════════════════════════════════════════════════ */

export function renderAllDrawings(
  ctx, chart, series, drawings, positions, w, h, lastPrice, dragState, hoveredId
) {
  ctx.clearRect(0, 0, w, h);
  if (!chart || !series) return;

  for (const d of drawings) {
    try {
      const hl = d.id === hoveredId;
      switch (d.type) {
        case "horizontal": renderHorizontal(ctx, series, d, w, hl); break;
        case "trendline":  renderTrendLine(ctx, chart, series, d, hl); break;
        case "ray":        renderRay(ctx, chart, series, d, w, h, hl); break;
        case "fib":        renderFib(ctx, chart, series, d, w, hl); break;
      }
    } catch (_) {}
  }

  for (const p of positions) {
    try { renderPosition(ctx, chart, series, p, w, h, lastPrice, dragState); } catch (_) {}
  }
}

/**
 * Hit-test drawings: returns drawing id if mouse is near a line.
 */
export function hitTestDrawing(drawings, chart, series, mx, my, threshold = 7) {
  if (!chart || !series || !drawings) return null;
  for (let i = drawings.length - 1; i >= 0; i--) {
    const d = drawings[i];
    try {
      if (d.type === "horizontal") {
        const y = series.priceToCoordinate(d.price);
        if (y != null && Math.abs(my - y) <= threshold) return d.id;
      } else if (d.type === "trendline" || d.type === "ray") {
        const x1 = chart.timeScale().timeToCoordinate(d.p1.time);
        const y1 = series.priceToCoordinate(d.p1.price);
        const x2 = chart.timeScale().timeToCoordinate(d.p2.time);
        const y2 = series.priceToCoordinate(d.p2.price);
        if (x1 == null || y1 == null || x2 == null || y2 == null) continue;
        const dist = pointToLineDist(mx, my, x1, y1, x2, y2);
        if (dist <= threshold) return d.id;
      } else if (d.type === "fib") {
        const p1 = d.p1.price, p2 = d.p2.price, range = p2 - p1;
        for (const lev of FIB_LEVELS) {
          const price = p1 + range * (1 - lev);
          const y = series.priceToCoordinate(price);
          if (y != null && Math.abs(my - y) <= threshold) return d.id;
        }
      }
    } catch (_) {}
  }
  return null;
}

/**
 * Hit-test drawing handles. Returns { id, handle } where handle is:
 *   "p1", "p2" for endpoints, "body" for the line body.
 * Endpoints are checked first (smaller radius) so they take priority.
 */
export function hitTestDrawingHandle(drawings, chart, series, mx, my, handleR = 10, bodyThreshold = 7) {
  if (!chart || !series || !drawings) return null;
  const ts = chart.timeScale();
  for (let i = drawings.length - 1; i >= 0; i--) {
    const d = drawings[i];
    try {
      if (d.type === "horizontal") {
        const y = series.priceToCoordinate(d.price);
        if (y != null && Math.abs(my - y) <= bodyThreshold) return { id: d.id, handle: "body" };
      } else if (d.type === "trendline" || d.type === "ray") {
        const x1 = ts.timeToCoordinate(d.p1.time), y1 = series.priceToCoordinate(d.p1.price);
        const x2 = ts.timeToCoordinate(d.p2.time), y2 = series.priceToCoordinate(d.p2.price);
        if (x1 == null || y1 == null || x2 == null || y2 == null) continue;
        if (Math.hypot(mx - x1, my - y1) <= handleR) return { id: d.id, handle: "p1" };
        if (Math.hypot(mx - x2, my - y2) <= handleR) return { id: d.id, handle: "p2" };
        if (pointToLineDist(mx, my, x1, y1, x2, y2) <= bodyThreshold) return { id: d.id, handle: "body" };
      } else if (d.type === "fib") {
        const x1 = ts.timeToCoordinate(d.p1.time), y1 = series.priceToCoordinate(d.p1.price);
        const x2 = ts.timeToCoordinate(d.p2.time), y2 = series.priceToCoordinate(d.p2.price);
        if (x1 != null && y1 != null && Math.hypot(mx - x1, my - y1) <= handleR) return { id: d.id, handle: "p1" };
        if (x2 != null && y2 != null && Math.hypot(mx - x2, my - y2) <= handleR) return { id: d.id, handle: "p2" };
        const p1 = d.p1.price, p2 = d.p2.price, range = p2 - p1;
        for (const lev of FIB_LEVELS) {
          const price = p1 + range * (1 - lev);
          const y = series.priceToCoordinate(price);
          if (y != null && Math.abs(my - y) <= bodyThreshold) return { id: d.id, handle: "body" };
        }
      }
    } catch (_) {}
  }
  return null;
}

/**
 * Hit-test position SL/TP lines. Returns {posId, field} or null.
 */
export function hitTestPositionLines(positions, series, y, threshold = 10) {
  if (!series || !positions) return null;
  for (const pos of positions) {
    if (!pos.active) continue;
    if (pos.sl != null) {
      try {
        const slY = series.priceToCoordinate(pos.sl);
        if (slY != null && Math.abs(y - slY) <= threshold) return { posId: pos.id, field: "sl" };
      } catch (_) {}
    }
    if (pos.tp != null) {
      try {
        const tpY = series.priceToCoordinate(pos.tp);
        if (tpY != null && Math.abs(y - tpY) <= threshold) return { posId: pos.id, field: "tp" };
      } catch (_) {}
    }
  }
  return null;
}

/* ═══════════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════════ */

function drawHandle(ctx, x, y, color) {
  ctx.save();
  ctx.beginPath(); ctx.arc(x, y, 6, 0, Math.PI * 2);
  // Read theme-aware handle fill from CSS var
  const s = typeof window !== "undefined" ? getComputedStyle(document.documentElement) : null;
  ctx.fillStyle = s ? s.getPropertyValue("--handle-fill").trim() || "#131722" : "#131722";
  ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();
}

function pointToLineDist(px, py, x1, y1, x2, y2) {
  const A = px - x1, B = py - y1, C = x2 - x1, D = y2 - y1;
  const dot = A * C + B * D;
  const lenSq = C * C + D * D;
  let t = lenSq !== 0 ? dot / lenSq : -1;
  t = Math.max(0, Math.min(1, t));
  const dx = px - (x1 + t * C), dy = py - (y1 + t * D);
  return Math.sqrt(dx * dx + dy * dy);
}

function pill(ctx, text, x, y, color, align = "left", solid = false) {
  ctx.save();
  ctx.font = "bold 11px 'SF Mono',Consolas,monospace";
  const tw = ctx.measureText(text).width;
  const px = 6, py = 3;
  const bw = tw + px * 2, bh = 18;
  const bx = align === "right" ? x - bw : x;
  const by = y - bh / 2;
  const r = 3;

  ctx.beginPath();
  ctx.moveTo(bx + r, by);
  ctx.lineTo(bx + bw - r, by);
  ctx.arcTo(bx + bw, by, bx + bw, by + r, r);
  ctx.lineTo(bx + bw, by + bh - r);
  ctx.arcTo(bx + bw, by + bh, bx + bw - r, by + bh, r);
  ctx.lineTo(bx + r, by + bh);
  ctx.arcTo(bx, by + bh, bx, by + bh - r, r);
  ctx.lineTo(bx, by + r);
  ctx.arcTo(bx, by, bx + r, by, r);
  ctx.closePath();

  if (solid) {
    ctx.fillStyle = color; ctx.globalAlpha = 0.92; ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = "#fff";
  } else {
    ctx.fillStyle = color; ctx.globalAlpha = 0.15; ctx.fill();
    ctx.globalAlpha = 0.7; ctx.strokeStyle = color; ctx.lineWidth = 1; ctx.stroke();
    ctx.globalAlpha = 1; ctx.fillStyle = color;
  }
  ctx.textBaseline = "middle";
  ctx.fillText(text, bx + px, y + 1);
  ctx.restore();
  return bw; // return width for chaining
}

/* ═══════════════════════════════════════════════════════════════════════
   HORIZONTAL LINE
   ═══════════════════════════════════════════════════════════════════════ */

function renderHorizontal(ctx, series, d, w, highlight) {
  const y = series.priceToCoordinate(d.price);
  if (y == null) return;
  ctx.save();
  ctx.strokeStyle = d.color || "#f7c948";
  ctx.lineWidth = highlight ? 2.5 : 1.2;
  ctx.setLineDash([8, 4]);
  ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
  ctx.setLineDash([]);
  if (highlight) {
    ctx.shadowColor = d.color || "#f7c948"; ctx.shadowBlur = 8;
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    ctx.shadowBlur = 0;
    // Drag handle in center
    drawHandle(ctx, w / 2, y, d.color || "#f7c948");
  }
  pill(ctx, d.price.toFixed(2), w - 8, y, d.color || "#f7c948", "right");
  ctx.restore();
}

/* ═══════════════════════════════════════════════════════════════════════
   TREND LINE
   ═══════════════════════════════════════════════════════════════════════ */

function renderTrendLine(ctx, chart, series, d, highlight) {
  const x1 = chart.timeScale().timeToCoordinate(d.p1.time);
  const y1 = series.priceToCoordinate(d.p1.price);
  const x2 = chart.timeScale().timeToCoordinate(d.p2.time);
  const y2 = series.priceToCoordinate(d.p2.price);
  if (x1 == null || y1 == null || x2 == null || y2 == null) return;
  ctx.save();
  ctx.strokeStyle = d.color || "#2962ff";
  ctx.lineWidth = highlight ? 2.8 : 1.8;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  if (highlight) {
    ctx.shadowColor = d.color || "#2962ff"; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.shadowBlur = 0;
    drawHandle(ctx, x1, y1, d.color || "#2962ff");
    drawHandle(ctx, x2, y2, d.color || "#2962ff");
  } else {
    ctx.fillStyle = d.color || "#2962ff";
    for (const [px, py] of [[x1, y1], [x2, y2]]) {
      ctx.beginPath(); ctx.arc(px, py, 4, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.restore();
}

/* ═══════════════════════════════════════════════════════════════════════
   RAY
   ═══════════════════════════════════════════════════════════════════════ */

function renderRay(ctx, chart, series, d, w, h, highlight) {
  const x1 = chart.timeScale().timeToCoordinate(d.p1.time);
  const y1 = series.priceToCoordinate(d.p1.price);
  const x2 = chart.timeScale().timeToCoordinate(d.p2.time);
  const y2 = series.priceToCoordinate(d.p2.price);
  if (x1 == null || y1 == null || x2 == null || y2 == null) return;
  const dx = x2 - x1, dy = y2 - y1;
  let extX, extY;
  if (Math.abs(dx) < 0.5) { extX = x2; extY = dy > 0 ? h * 3 : -h * 3; }
  else { const t = (dx > 0 ? w * 3 : -w * 3 - x1) / dx; extX = x1 + dx * t; extY = y1 + dy * t; }
  ctx.save();
  ctx.strokeStyle = d.color || "#e040fb";
  ctx.lineWidth = highlight ? 2.8 : 1.8;
  ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(extX, extY); ctx.stroke();
  if (highlight) {
    ctx.shadowColor = d.color || "#e040fb"; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(extX, extY); ctx.stroke(); ctx.shadowBlur = 0;
    drawHandle(ctx, x1, y1, d.color || "#e040fb");
    drawHandle(ctx, x2, y2, d.color || "#e040fb");
  } else {
    ctx.fillStyle = d.color || "#e040fb";
    ctx.beginPath(); ctx.arc(x1, y1, 4, 0, Math.PI * 2); ctx.fill();
  }
  ctx.restore();
}

/* ═══════════════════════════════════════════════════════════════════════
   FIBONACCI RETRACEMENT
   ═══════════════════════════════════════════════════════════════════════ */

function renderFib(ctx, chart, series, d, w, highlight) {
  const p1 = d.p1.price, p2 = d.p2.price, range = p2 - p1;
  // Compute bounded x range from the two anchor times (with 25% padding on each side)
  const x1Raw = chart.timeScale().timeToCoordinate(d.p1.time);
  const x2Raw = chart.timeScale().timeToCoordinate(d.p2.time);
  let fibL = 0, fibR = w;
  if (x1Raw != null && x2Raw != null) {
    const minX = Math.min(x1Raw, x2Raw);
    const maxX = Math.max(x1Raw, x2Raw);
    const span = maxX - minX;
    const pad = Math.max(span * 0.25, 30);
    fibL = Math.max(0, minX - pad);
    fibR = Math.min(w, maxX + pad);
  }
  const fibW = fibR - fibL;

  ctx.save();
  for (let i = 0; i < FIB_LEVELS.length; i++) {
    const lev = FIB_LEVELS[i];
    const price = p1 + range * (1 - lev);
    const y = series.priceToCoordinate(price);
    if (y == null) continue;
    ctx.strokeStyle = FIB_COLORS[i]; ctx.lineWidth = highlight ? 1.8 : 1;
    ctx.setLineDash([5, 3]);
    ctx.beginPath(); ctx.moveTo(fibL, y); ctx.lineTo(fibR, y); ctx.stroke();
    ctx.setLineDash([]);
    pill(ctx, `${(lev * 100).toFixed(1)}%  ${price.toFixed(2)}`, fibL + 4, y - 12, FIB_COLORS[i], "left");
    if (i < FIB_LEVELS.length - 1) {
      const nextPrice = p1 + range * (1 - FIB_LEVELS[i + 1]);
      const nextY = series.priceToCoordinate(nextPrice);
      if (nextY != null) {
        ctx.fillStyle = `${FIB_COLORS[i]}18`;
        ctx.fillRect(fibL, Math.min(y, nextY), fibW, Math.abs(nextY - y));
      }
    }
  }
  // Draw vertical border lines on both sides for clarity
  ctx.strokeStyle = "#787b8644"; ctx.lineWidth = 0.7; ctx.setLineDash([]);
  const topY = series.priceToCoordinate(p1 + range * (1 - FIB_LEVELS[0]));
  const botY = series.priceToCoordinate(p1 + range * (1 - FIB_LEVELS[FIB_LEVELS.length - 1]));
  if (topY != null && botY != null) {
    ctx.beginPath(); ctx.moveTo(fibL, Math.min(topY, botY)); ctx.lineTo(fibL, Math.max(topY, botY)); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(fibR, Math.min(topY, botY)); ctx.lineTo(fibR, Math.max(topY, botY)); ctx.stroke();
  }
  // Grab handles on anchor points when highlighted
  if (highlight && x1Raw != null && x2Raw != null) {
    const y1 = series.priceToCoordinate(d.p1.price);
    const y2 = series.priceToCoordinate(d.p2.price);
    if (y1 != null) drawHandle(ctx, x1Raw, y1, FIB_COLORS[0]);
    if (y2 != null) drawHandle(ctx, x2Raw, y2, FIB_COLORS[FIB_COLORS.length - 1]);
  }
  ctx.restore();
}

/* ═══════════════════════════════════════════════════════════════════════
   DELTA-STYLE POSITION PROJECTION
   Shows entry line, SL/TP zones with shaded boxes, risk:reward, PnL
   ═══════════════════════════════════════════════════════════════════════ */

function renderPosition(ctx, chart, series, pos, w, h, lastPrice, dragState) {
  // Compute coordinates — render each element independently so nothing disappears
  const entryY = series.priceToCoordinate(pos.entry);

  let sl = pos.sl, tp = pos.tp;
  if (dragState?.active && dragState.posId === pos.id) {
    if (dragState.field === "sl" && dragState.price != null) sl = dragState.price;
    if (dragState.field === "tp" && dragState.price != null) tp = dragState.price;
  }

  const isLong = pos.type === "long";
  const badgeR = w - 8;
  ctx.save();

  // ─── SL zone ───────────────────────────────────────────────
  if (sl != null) {
    const slY = series.priceToCoordinate(sl);
    if (slY != null) {
      if (entryY != null) {
        const top = Math.min(entryY, slY), height = Math.abs(slY - entryY);
        ctx.fillStyle = "rgba(239,83,80,0.08)"; ctx.fillRect(0, top, w, height);
      }
      const isDrag = dragState?.active && dragState.posId === pos.id && dragState.field === "sl";
      ctx.strokeStyle = "#ef5350"; ctx.lineWidth = isDrag ? 2.5 : 1.2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(0, slY); ctx.lineTo(w, slY); ctx.stroke();
      if (isDrag) { ctx.shadowColor="#ef5350"; ctx.shadowBlur=10; ctx.beginPath(); ctx.moveTo(0,slY); ctx.lineTo(w,slY); ctx.stroke(); ctx.shadowBlur=0; }
      ctx.setLineDash([]);
      const slPct = isLong ? ((sl - pos.entry) / pos.entry) * 100 : ((pos.entry - sl) / pos.entry) * 100;
      pill(ctx, `SL ${sl.toFixed(2)} │ ${slPct >= 0 ? "+" : ""}${slPct.toFixed(2)}%`, badgeR, slY, "#ef5350", "right");
      if (pos.active) pill(ctx, "⇕ drag", 6, slY, "#ef535088", "left");
    }
  }

  // ─── TP zone ───────────────────────────────────────────────
  if (tp != null) {
    const tpY = series.priceToCoordinate(tp);
    if (tpY != null) {
      if (entryY != null) {
        const top = Math.min(entryY, tpY), height = Math.abs(tpY - entryY);
        ctx.fillStyle = "rgba(38,166,154,0.08)"; ctx.fillRect(0, top, w, height);
      }
      const isDrag = dragState?.active && dragState.posId === pos.id && dragState.field === "tp";
      ctx.strokeStyle = "#26a69a"; ctx.lineWidth = isDrag ? 2.5 : 1.2;
      ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(0, tpY); ctx.lineTo(w, tpY); ctx.stroke();
      if (isDrag) { ctx.shadowColor="#26a69a"; ctx.shadowBlur=10; ctx.beginPath(); ctx.moveTo(0,tpY); ctx.lineTo(w,tpY); ctx.stroke(); ctx.shadowBlur=0; }
      ctx.setLineDash([]);
      const tpPct = isLong ? ((tp - pos.entry) / pos.entry) * 100 : ((pos.entry - tp) / pos.entry) * 100;
      pill(ctx, `TP ${tp.toFixed(2)} │ ${tpPct >= 0 ? "+" : ""}${tpPct.toFixed(2)}%`, badgeR, tpY, "#26a69a", "right");
      if (pos.active) pill(ctx, "⇕ drag", 6, tpY, "#26a69a88", "left");
    }
  }

  // ─── Risk:Reward ratio in zone ─────────────────────────────
  if (sl != null && tp != null && pos.active && entryY != null) {
    const risk = Math.abs(pos.entry - sl);
    const reward = Math.abs(tp - pos.entry);
    const rr = risk > 0 ? (reward / risk).toFixed(2) : "∞";
    pill(ctx, `R:R 1:${rr}`, w / 2 - 30, entryY + 20, "#aaa", "left");
  }

  // ─── Entry line ────────────────────────────────────────────
  if (entryY != null) {
    const eColor = isLong ? "#26a69a" : "#ef5350";
    const isPending = pos.active && !pos.executed && !pos.preview;
    ctx.strokeStyle = isPending ? "#f7c948" : eColor;
    ctx.lineWidth = isPending ? 1.5 : 2;
    ctx.setLineDash(isPending ? [6, 4] : []);
    ctx.beginPath(); ctx.moveTo(0, entryY); ctx.lineTo(w, entryY); ctx.stroke();
    ctx.setLineDash([]);
    const arrow = isLong ? "▲" : "▼";
    const entryLabel = isPending
      ? `⏳ ${arrow} ${pos.type.toUpperCase()} @ ${pos.entry.toFixed(2)} [PENDING]`
      : `${arrow} ${pos.type.toUpperCase()} @ ${pos.entry.toFixed(2)}`;
    pill(ctx, entryLabel, 8, entryY - 14, isPending ? "#f7c948" : eColor, "left", true);

    // ─── Live PnL (only when executed) ─────────────────────────
    if (pos.active && pos.executed && lastPrice != null) {
      const pnl = isLong
        ? ((lastPrice - pos.entry) / pos.entry) * 100
        : ((pos.entry - lastPrice) / pos.entry) * 100;
      const pColor = pnl >= 0 ? "#26a69a" : "#ef5350";
      pill(ctx, `PnL: ${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}%`, 8, entryY + 14, pColor, "left");
    }

    // ─── Pending status hint ──────────────────────────────────
    if (isPending) {
      pill(ctx, "Waiting for price to reach entry...", 8, entryY + 14, "#f7c94888", "left");
    }

    // ─── Closed result ────────────────────────────────────────
    if (!pos.active && pos.exitReason) {
      const pnl = pos.pnl || 0;
      const rColor = pnl >= 0 ? "#26a69a" : "#ef5350";
      pill(ctx, `${pos.exitReason} HIT │ ${pnl >= 0 ? "+" : ""}${pnl.toFixed(2)}%`, 8, entryY + 14, rColor, "left", true);
      ctx.strokeStyle = "#555"; ctx.lineWidth = 0.5; ctx.setLineDash([2, 2]);
      ctx.beginPath(); ctx.moveTo(0, entryY); ctx.lineTo(w, entryY); ctx.stroke(); ctx.setLineDash([]);
    }
  }

  ctx.restore();
}
