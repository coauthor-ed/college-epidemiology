/**
 * CohortFrame.js - shared helper for the two L05 cohort scenes (CohortFrameScene on blk-l05-s03,
 * CohortFrameScene-live on blk-l05-s08). Counts to cohort rows, per-1,000 and ratio formatting
 * (subject card: rates carry numerator, denominator, multiplier and period; ratios have no unit
 * and use the caller's decimals), dot-grid positions matching SimChart's dotsSvg, and ratio-bar
 * geometry rising from a marked 1.0 line. Pure functions: no kit imports, no DOM. Original code.
 */

/** A cohort row from its counts: incidence per 1,000 over the follow-up (cumulative incidence x 1,000). */
export function rowFromCounts(cases, total) {
  return { cases, total, incidencePer1000: (cases / total) * 1000 };
}

/** '100 per 1,000' - dp is the caller's (0 for whole rates like 100 and 25, 1 for 6.0 and 0.5). */
export function fmtPer1000(v, dp = 0) {
  return `${v.toFixed(dp)} per 1,000`;
}

/** A risk ratio / odds ratio as text: no unit, the caller's decimals ('4.00', '12.0'). */
export function fmtRatio(v, dp = 2) {
  return v.toFixed(dp);
}

/** Dot centres of a dotsSvg grid (same rect, same cols), row-major - so a scene can fill, ring or
 * fly from single dots. Mirrors SimChart.dotsSvg's layout: cw = rect.w / cols, one row per ceil(n/cols). */
export function dotPos(rect, n, cols) {
  const rows = Math.ceil(n / cols), cw = rect.w / cols, ch = rect.h / rows;
  return Array.from({ length: n }, (_, i) => ({
    x: rect.x + ((i % cols) + 0.5) * cw,
    y: rect.y + (Math.floor(i / cols) + 0.5) * ch,
  }));
}

/** Two-bar ratio panel rising from a marked 1.0 line: each bar's base sits ON the 1.0 line and its
 * height is (v - 1) * scale, so a ratio of 1 would be no bar at all. values: [{ key, v }];
 * o = { maxV (scale top, default: largest value), padTop, padBottom, barW }. Returns the line's y
 * (baseY), the scale s, and per-bar rects (y = top edge, h = height above the line). */
export function ratioBars(rect, values, o = {}) {
  const top = rect.y + (o.padTop ?? 8);
  const baseY = rect.y + rect.h - (o.padBottom ?? 10);
  const maxV = o.maxV ?? Math.max(1.01, ...values.map((b) => b.v));
  const s = (baseY - top) / (maxV - 1);
  const n = Math.max(1, values.length), slot = rect.w / n, bw = Math.min(slot * 0.5, o.barW ?? 64);
  return {
    baseY, s, maxV,
    bars: values.map((b, i) => {
      const h = Math.max(0, (b.v - 1) * s);
      return { key: b.key, v: b.v, x: rect.x + (i + 0.5) * slot - bw / 2, w: bw, y: baseY - h, h };
    }),
  };
}
