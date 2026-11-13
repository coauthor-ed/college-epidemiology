/**
 * EmptyColumnScene - L01 s08, one striking count and nothing beside it (the plant, illustrative numbers).
 * One dot = one man. Blue = has the tumour (a case); grey = a man at the plant without it.
 * FILLED = cleaned the tanks; HOLLOW = did not (or not asked yet, the legend says so).
 *   step 0 (cue count)    the 20 men with the tumour; learner taps "Ask: did you clean the tanks?": 14 fill,
 *                         6 stay hollow, they sort into two rows; "14 of 20 = 70 per cent" lands large
 *   step 1 (cue gap)      beside them a dashed, empty column headed "comparison group": "?" in every count
 *   step 2 (cue anyman)   two SUPPOSE plants of 200 grey men each: most cleaned tanks (140) or few did (30);
 *                         "Draw 20 men at random" lifts 20 out of each (seeded, no crypto): about 14 and about 3
 *                         filled. The same 14 of 20 means nothing in one plant and a great deal in the other.
 *                         Neither plant is claimed to be the real one.
 * Every step lands at rest on its finished picture (the first draw is fixed: 14 and 3); cues and chips replay.
 */
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { SIM_CROWD_CSS, crowdLive, legendHtml } from 'simulations/base/kit/SimCrowd.js';
import { flowChipHtml, bindFlow } from 'simulations/base/kit/SimFlowDom.js';
import { withNarrationCues } from './NarrationCues.js';

// The 20 cases: 14 cleaned the tanks (spread through the unsorted crowd).
const CASES = Array.from({ length: 20 }, (_, i) => ({ id: `c${i}`, ill: true, ex: (i * 7) % 20 < 14 }));
const TOOK = CASES.filter((p) => p.ex), NOT = CASES.filter((p) => !p.ex);
// Two supposed plants of 200 men without the tumour: 140 cleaned tanks, or 30 did.
const PLANT = (tag, n) => Array.from({ length: 200 }, (_, i) => ({ id: `${tag}${i}`, ill: false, ex: (i * 73) % 200 < n }));
const PA = PLANT('a', 140), PB = PLANT('b', 30);

/** A small seeded generator (mulberry32): the same seed, the same draw. */
function rng(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
function drawIds(plant, seed) {
  const idx = plant.map((_, i) => i), r = rng(seed);
  for (let i = 0; i < 20; i++) { const j = i + Math.floor(r() * (idx.length - i)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  return idx.slice(0, 20).map((i) => plant[i]);
}
const filledOf = (list) => list.filter((p) => p.ex).length;
// The resting draw: the first seed whose draws give 14 and 3 (the expected counts), found once.
let SEED0 = 1;
for (let s = 1; s < 5000; s++) { if (filledOf(drawIds(PA, s)) === 14 && filledOf(drawIds(PB, s * 31 + 7)) === 3) { SEED0 = s; break; } }
const seedA = (d) => SEED0 + d * 101, seedB = (d) => (SEED0 + d * 101) * 31 + 7;

// Narration focus (spec W1 D29n): n = a data-narr id, '-' = data-narr-hide; inert with narration off.
// Ids: men (the 20 cases), ask, count (14 of 20 = 70 per cent), illus, table (men + rules), gap (the empty column),
// cases (step 2 strip), plantA (most cleaned), question. Never spoken, hidden while narrated: the chips, the
// legend, plant B (few cleaned) and the caption lines around the question.
const na = (n) => (!n ? '' : n === '-' ? ' data-narr-hide=""' : ` data-narr="${n}"`);
const hideTag = (html) => html.replace(/^<(\w+)/, '<$1 data-narr-hide=""');
const lab = (x, y, html, cls = '', n = '') => `<span class="ec-lab ${cls}"${na(n)} style="left:${x.toFixed(1)}px;top:${y.toFixed(1)}px">${html}</span>`;
const fx = (v) => v.toFixed(1);
function mkLay(r, step) { return { r, step, pos: new Map(), boxOf: new Map(), boxes: [], rules: [] }; }
function place(lay, list, x, y, cols, step, key = 'all', skip = null) {
  let j = 0;
  list.forEach((p, i) => {
    const k = skip ? i : j++;
    if (skip?.has(p.id)) return;
    lay.pos.set(p.id, { x: x + step * (k % cols + 0.5), y: y + step * (Math.floor(k / cols) + 0.5) }); lay.boxOf.set(p.id, key);
  });
  return Math.ceil(list.length / cols) * step;
}

class EmptyColumnBase extends SvgScene {}

export class EmptyColumnScene extends withNarrationCues(EmptyColumnBase) {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }], [{ idx: 2, dwellMs: null }]];
  static ARIA_LABEL = 'Illustrative numbers. 20 men with the tumour are asked whether they cleaned the tanks: 14 did, 70 per cent. The comparison column beside them is empty. Two supposed plants of 200 men: in one most men cleaned tanks, in the other few did. Drawing 20 men at random gives about 14 in the first and about 3 in the second, so the same 14 of 20 means nothing in one plant and a great deal in the other.';
  static CONTROLS = [];
  static SETTING = 'none';
  static HEIGHT = 560;
  static PORTRAIT_HEIGHT = 740;
  static CUES = ['count', 'gap', 'anyman'];

  async setup() {
    this.ec = { gen: 0, came: null, last: null, phase: 'rest', answered: 20, draw: 0, lifted: true, outline: false };
    await super.setup();
    bindFlow(this.root, { action: (name) => {
      if (name === 'ask') { this.runAsk(); this.interactDone?.('ask'); }
      else if (name === 'draw') { this.runDraw(this.ec.draw + 1); this.interactDone?.('draw'); }
    } });
  }

  enter(step) {
    const s = this.ec;
    s.came = s.last != null && Math.abs(s.last - step) === 1 ? s.last : null;
    s.last = step;
    s.gen++;
    s.phase = 'rest'; s.answered = 20; s.draw = 0; s.lifted = true; s.outline = step === 1 && s.came === 0;
    if (step === 2 && s.came === 1) { s.lifted = false; this.after(1.2, () => { s.lifted = true; this.repaint(); }); }
  }

  runAsk() {
    if (this.stepIndex !== 0) return;
    const s = this.ec;
    s.phase = 'ask'; s.answered = 0; this.repaint();
    const n = 5;
    for (let i = 1; i <= n; i++) this.after(0.3 + 0.28 * i, () => { s.answered = Math.round((20 * i) / n); this.repaint(); });
    this.after(0.3 + 0.28 * n + 0.5, () => { s.phase = 'rest'; this.repaint(); });
  }

  runDraw(d) {
    if (this.stepIndex !== 2) return;
    const s = this.ec;
    s.lifted = false; this.repaint();
    this.after(0.7, () => { s.draw = d; s.lifted = true; this.repaint(); });
  }

  applyCue(id) {
    const s = this.ec, k = this.stepIndex;
    if (this.constructor.CUES[k] !== id) return;
    if (k === 0) this.runAsk();
    else if (k === 1) { s.gen++; s.came = 0; s.outline = true; this.repaint(); }
    else this.runDraw(0);
  }

  cueBase() { return null; }
  cueReset() { const s = this.ec; s.phase = 'rest'; s.answered = 20; s.draw = 0; s.lifted = true; this.repaint(); }

  geo(k, st) {
    const P = st.portrait, W = st.W, g = { P, W };
    if (k === 0) {
      g.c = P ? { x: 16, cols: 7, step: 44 } : { x: 24, cols: 6, step: 42 };
      g.rowY = P ? [62, 62 + 88 + 44] : [64, 64 + 126 + 44];
      g.pay = P ? { x: W / 2, y: 330 } : { x: 24 + 252 + (W - 24 - 252) / 2, y: 190 };
      g.H = P ? 470 : 380;
    } else if (k === 1) {
      g.c = P ? { x: 16, cols: 4, step: 34 } : { x: 24, cols: 6, step: 42 };
      g.rowY = P ? [64, 64 + 136 + 44] : [64, 64 + 126 + 44];
      g.cw = g.c.cols * g.c.step;
      g.col = { x: g.c.x + g.cw + (P ? 22 : 40), y: 38 };
      g.col.w = W - 16 - g.col.x;
      g.totY = g.rowY[1] + (P ? 2 : 1) * g.c.step + 34;
      g.H = g.totY + 52;
    } else {
      const pw = P ? W - 32 : (W - 76) / 2, cols = P ? 25 : 20, step = pw / cols;
      g.strip = P ? { x: 16, y: 28, step: (W - 32) / 20 } : { x: 262, y: 14, step: 20 };
      const h = Math.ceil(200 / cols) * step;
      g.plants = [0, 1].map((i) => {
        const x = P ? 16 : 24 + i * (pw + 28), y = P ? 96 + i * (h + 84) : 104;
        return { x, y, w: pw, cols, step, h, dy: y + h + 14, dstep: P ? 16 : 15 };
      });
      const last = g.plants[1];
      g.capY = last.dy + 2 * last.dstep + 22;
      g.H = g.capY + (P ? 132 : 86);
    }
    return g;
  }

  stageHeight(st) { return this.geo(this.stepIndex ?? 0, st).H; }

  laysFor(k, st, phase = 'rest', draw = 0, lifted = true) {
    const g = this.geo(k, st), out = {};
    if (k <= 1) {
      const c = g.c;
      out.cases = mkLay(c.step * 0.36, c.step);
      if (k === 0 && phase === 'ask') place(out.cases, CASES, c.x, g.rowY[0], c.cols, c.step);
      else { place(out.cases, TOOK, c.x, g.rowY[0], c.cols, c.step, 'took'); place(out.cases, NOT, c.x, g.rowY[1], c.cols, c.step, 'not'); }
      return out;
    }
    const sp = g.strip;
    out.cases = mkLay(sp.step * 0.36, sp.step);
    place(out.cases, [...TOOK, ...NOT], sp.x, sp.y, 20, sp.step);
    const picks = [drawIds(PA, seedA(draw)), drawIds(PB, seedB(draw))];
    out.plants = [PA, PB].map((plant, i) => {
      const pl = g.plants[i], lay = mkLay(Math.min(pl.step * 0.36, 7), pl.step);
      const pick = picks[i].slice().sort((a, b) => b.ex - a.ex);
      const ids = new Set(pick.map((p) => p.id));
      place(lay, plant, pl.x, pl.y, pl.cols, pl.step, 'plant', lifted ? ids : null);
      if (lifted) pick.forEach((p, j) => { lay.pos.set(p.id, { x: pl.x + pl.dstep * (j % 10 + 0.5), y: pl.dy + pl.dstep * (Math.floor(j / 10) + 0.5) }); lay.boxOf.set(p.id, 'drawn'); });
      return { lay, ids, n: filledOf(pick) };
    });
    return out;
  }

  paint(st) {
    const k = this.stepIndex, s = this.ec, g = this.geo(k, st), P = g.P, W = st.W;
    const L = this.laysFor(k, st, s.phase, s.draw, s.lifted);
    const asked = k === 0 && s.phase === 'ask' ? s.answered : 20;
    this.lays = L;
    this.people = {
      cases: CASES.map((p, i) => ({ ...p, exposed: i < asked ? p.ex : false, dim: false })),
      plants: [PA, PB].map((pl, i) => pl.map((p) => ({ ...p, exposed: p.ex, lit: L.plants?.[i].ids.has(p.id) && s.lifted }))),
    };
    const prev = s.came != null ? this.laysFor(s.came, st) : null;
    this.from = { cases: prev?.cases ?? null };
    let svg = '', over = '', head = '';
    const legend = (items) => legendHtml({ items });
    const caseIt = { label: 'man with the tumour', color: 'var(--sim-annot)', filled: true };
    const wellIt = { label: 'man without it', color: 'var(--sim-label-muted)', filled: true };
    const fillIt = { label: 'filled: cleaned tanks', color: 'var(--sim-label)', filled: true };
    const holIt = { label: k === 0 && s.phase === 'ask' ? 'hollow: not asked yet' : 'hollow: did not', color: 'var(--sim-label)', filled: false };
    if (k <= 1) {
      const c = g.c, sorted = !(k === 0 && s.phase === 'ask');
      over += lab(c.x, 20, P && k === 1 ? 'The 20 cases' : 'The 20 men with the tumour', 'ec-head ec-l', 'men table');
      if (sorted) {
        over += lab(c.x, g.rowY[0] - 16, P && k === 1 ? '<b class="ec-n">14</b> cleaned' : '<b class="ec-n">14</b> cleaned tanks', 'ec-row ec-l', 'men table');
        over += lab(c.x, g.rowY[1] - 16, '<b class="ec-n">6</b> did not', 'ec-row ec-l', 'men table');
      }
      if (k === 0) {
        if (sorted) over += `<div class="ec-pay" data-narr="count" style="left:${fx(g.pay.x)}px;top:${fx(g.pay.y)}px"><b class="sim-numeral ec-big">14 of 20</b><span class="ec-pct">= 70 per cent</span><span>cleaned the tanks</span></div>`;
        else over += lab(g.pay.x, g.pay.y, 'Did you clean<br>the tanks?', 'ec-ask', 'count');
        over += lab(W - 16, g.H - 14, 'Illustrative numbers.', 'ec-cap ec-r', 'illus');
        head = hideTag(flowChipHtml({ label: 'Ask: did you clean the tanks?', action: 'ask', icon: 'replay' })) + hideTag(legend([caseIt, fillIt, holIt]));
      } else {
        // The empty comparison column: a dashed outline, a "?" for every count.
        const col = g.col, h = g.totY + 24 - col.y;
        svg += `<rect class="ec-dash${s.outline ? ' sv-draw' : ''}"${na('gap')} style="--len:${fx(2 * (col.w + h))};--dur:1.2s" x="${fx(col.x)}" y="${fx(col.y)}" width="${fx(col.w)}" height="${fx(h)}" rx="8"/>`;
        over += lab(col.x + col.w / 2, 20, 'comparison group', 'ec-head ec-dim', 'gap');
        const q = (y, cls = '') => lab(col.x + col.w / 2, y, '?', `ec-q${cls}${s.outline ? ' ec-late' : ''}`, 'gap');
        over += q(g.rowY[0] + (P ? 60 : 44)) + q(g.rowY[1] + c.step * 0.5);
        const ruleY = g.rowY[1] - 34;
        svg += `<line class="ec-rule"${na('table')} x1="16" y1="${fx(ruleY)}" x2="${fx(W - 16)}" y2="${fx(ruleY)}"/>`;
        svg += `<line class="ec-rule ec-rule--k"${na('table')} x1="16" y1="${fx(g.totY - 22)}" x2="${fx(W - 16)}" y2="${fx(g.totY - 22)}"/>`;
        over += lab(c.x, g.totY, 'total <b class="ec-n">20</b>', 'ec-row ec-l', 'men table');
        over += lab(col.x + col.w / 2, g.totY, 'total <b class="ec-n">?</b>', `ec-row${s.outline ? ' ec-late' : ''}`, 'gap');
        head = hideTag(legend([caseIt, fillIt, { ...holIt, label: 'hollow: did not' }]));
      }
      return { svg, over, head };
    }
    // Step 2: the cases as a strip, then two supposed plants and the learner's draws.
    over += P ? lab(W / 2, 12, 'Cases: <b class="ec-n ec-a">14 of 20</b> cleaned tanks', 'ec-row ec-on', 'cases')
      : lab(16, 24, 'Cases: <b class="ec-n ec-a">14 of 20</b> cleaned', 'ec-row ec-on ec-l', 'cases');
    const names = P ? ['Suppose most cleaned', 'Suppose few cleaned'] : ['Suppose most men<br>cleaned tanks', 'Suppose few<br>men did'];
    const sub = ['140 of 200', '30 of 200'];
    g.plants.forEach((pl, i) => {
      const pn = i === 0 ? 'plantA' : '-';
      over += lab(pl.x, pl.y - (P ? 20 : 30), `${names[i]} <span class="ec-sub">(${sub[i]})</span>`, 'ec-head ec-l ec-2l', pn);
      svg += `<rect class="ec-plant"${na(pn)} x="${fx(pl.x - 6)}" y="${fx(pl.y - 6)}" width="${fx(pl.w + 12)}" height="${fx(pl.h + 12)}" rx="4"/>`;
      const n = L.plants[i].n;
      const tx = pl.x + 10 * pl.dstep + 14, ty = pl.dy + pl.dstep;
      if (s.lifted) over += `<span class="ec-lab ec-l ec-drawn"${na(pn)} style="left:${fx(tx)}px;top:${fx(ty)}px"><b class="sim-numeral ec-mid${i === 0 ? '' : ' ec-mid--b'}">${n} of 20</b><span>drawn, cleaned</span></span>`;
      else over += lab(pl.x, ty, 'drawing 20 men...', 'ec-row ec-l', pn);
    });
    over += `<div class="ec-capt" style="left:16px;top:${fx(g.capY)}px;width:${fx(W - 32)}px"><span data-narr-hide="">The same 14 of 20 means nothing in one plant and a great deal in the other.</span><b data-narr="question">Whom do you compare the 20 with?</b><i data-narr-hide="">Illustrative numbers: neither plant is the real one.</i></div>`;
    head = hideTag(flowChipHtml({ label: 'Draw 20 men at random', action: 'draw', icon: 'replay' })) + hideTag(legend([caseIt, wellIt, fillIt, { ...holIt, label: 'hollow: did not' }]));
    return { svg, over, head };
  }

  animate() {
    const s = this.ec, L = this.lays, P = this.people, G = s.gen;
    crowdLive(this.live, `c${G}`, P.cases, L.cases, { from: this.from.cases, order: 'random', spread: 0.6 });
    if (L.plants) L.plants.forEach((pl, i) => crowdLive(this.live, `p${i}${G}`, P.plants[i], pl.lay, { order: 'random', spread: 0.5 }));
    // Narration focus: each crowd is one tagged group (plant B is never spoken: hidden while narrated).
    const tags = [[`c${G}`, this.stepIndex === 2 ? 'cases' : 'men table'], [`p0${G}`, 'plantA'], [`p1${G}`, '-']];
    for (const [key, n] of tags) {
      const e = this.live.get(key);
      if (!e) continue;
      if (n === '-') { if (!e.hasAttribute('data-narr-hide')) e.setAttribute('data-narr-hide', ''); }
      else if (e.getAttribute('data-narr') !== n) e.setAttribute('data-narr', n);
    }
  }

  css() {
    return SIM_CROWD_CSS + `
.svs-head { gap: 8px 16px; flex-wrap: wrap; justify-content: center; }
.svs-head .scw-legend { font-size: 16px; justify-content: center; gap: 4px 14px; }
.sflow-chip { min-height: 44px; font-size: 17px; }
.ec-lab { position: absolute; transform: translate(-50%, -50%); white-space: nowrap; font: 600 17px/1.2 var(--sim-font); color: var(--sim-label); }
.ec-l { transform: translate(0, -50%); }
.ec-r { transform: translate(-100%, -50%); }
.ec-head { font-size: 18px; font-weight: 700; }
.ec-2l { line-height: 1.15; }
.ec-sub { font-weight: 500; color: var(--sim-label-muted); }
.ec-dim { color: var(--sim-label-muted); }
.ec-row { color: var(--sim-label-muted); }
.ec-on { color: var(--sim-label); }
.ec-n { font: 400 26px/1 var(--sim-font-numeral); color: var(--sim-label); margin: 0 4px; }
.ec-n.ec-a { color: var(--sim-annot); }
.ec-q { font: 400 64px/1 var(--sim-font-numeral); color: var(--sim-label-muted); }
.ec-ask { font: 400 28px/1.2 var(--sim-font-numeral); text-align: center; }
.ec-cap { font: italic 500 16px/1.2 var(--sim-font); color: var(--sim-label-muted); }
.ec-pay { position: absolute; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; gap: 6px; white-space: nowrap; font: 600 18px/1.2 var(--sim-font); color: var(--sim-label-muted); animation: ec-in 0.6s ease both; }
.ec-big { font: 400 88px/1 var(--sim-font-numeral); color: var(--sim-annot); }
.ec-pct { font: 400 34px/1.1 var(--sim-font-numeral); color: var(--sim-label); }
.ec-drawn { display: flex; flex-direction: column; gap: 2px; font-size: 16px; font-weight: 600; color: var(--sim-label-muted); animation: ec-in 0.5s ease both; }
.ec-mid { font: 400 34px/1 var(--sim-font-numeral); color: var(--sim-label); }
.ec-capt { position: absolute; display: flex; flex-direction: column; gap: 8px; padding-top: 10px; border-top: 1px solid var(--sim-label-muted); font: 600 17px/1.3 var(--sim-font); color: var(--sim-label); }
.ec-capt b { font: 400 22px/1.2 var(--sim-font-numeral); color: var(--sim-label); }
.sim-dom-root--portrait .ec-capt b { font-size: 19px; }
.ec-capt i { font: italic 500 16px/1.2 var(--sim-font); color: var(--sim-label-muted); }
.ec-late { animation: ec-in 0.5s ease 1s both; }
@keyframes ec-in { from { opacity: 0; } to { opacity: 1; } }
svg .ec-dash { fill: none; stroke: var(--sim-label-muted); stroke-width: 2; stroke-dasharray: 8 6; }
svg .ec-dash.sv-draw { stroke-dasharray: 8 6; stroke-dashoffset: 0; animation: ec-in 1s ease both; }
svg .ec-rule { stroke: var(--sim-label-muted); stroke-width: 1; opacity: 0.5; }
svg .ec-rule--k { opacity: 0.8; }
svg .ec-plant { fill: none; stroke: var(--sim-label-muted); stroke-width: 1; opacity: 0.6; }
`;
  }
}
