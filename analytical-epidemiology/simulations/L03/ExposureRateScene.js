/**
 * ExposureRateScene - analytical-epidemiology L03 s02. Doll and Hill, BMJ 1950, Table V (source counts,
 * nothing illustrative). One dot = one man. Blue = a lung-cancer patient (case); grey = a control.
 * FILLED = smoked; HOLLOW = did not. The crowd IS the table: two columns of men, a smokers row and a
 * non-smokers row, each cell with its count beside it.
 *   beat 1 (cue columns)  35 cases (33 filled) and 82 controls (55 filled) walk into their two columns
 *   beat 2 (cue read)     tap a column head: its smokers light (numerator) and a frame closes round the
 *                         whole column (denominator): 33 of 35 = 94.2%, 55 of 82 = 67.0%; after both,
 *                         the gap lands large: 27.2 percentage points. A cold landing has both read.
 *   beat 3 (cue source)   "Table V, Doll and Hill, BMJ 1950"; the controls head names them:
 *                         hospital patients, admitted for other diseases
 *   beat 4 (cue turn)     two sentences: "Smokers got cancer more often" struck (the table cannot say it),
 *                         "Cancer patients had smoked more often" ticked
 * Printed rates are the source's own (94.2, 67.0; gap 27.2). Never says risk, odds or incidence except in
 * the struck sentence (which says neither).
 */
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { SIM_CROWD_CSS, crowdLive, legendHtml, countOf } from 'simulations/base/kit/SimCrowd.js';
import { flowChipHtml, bindFlow } from 'simulations/base/kit/SimFlowDom.js';
import { withNarrationCues } from '../L01/NarrationCues.js';
import { na, tagFirst, tagLive } from './NarrTags.js';
import { narrOn, narrDotsCss } from '../L05/NarrDots.js';

// 35 cases (33 smoked), 82 controls (55 smoked): Table V. Smokers first in each column.
const MEN = [
  ...Array.from({ length: 35 }, (_, i) => ({ id: `c${i}`, ill: true, exposed: i < 33 })),
  ...Array.from({ length: 82 }, (_, i) => ({ id: `k${i}`, ill: false, exposed: i < 55 })),
];
const COLS = [
  { ill: true, n: countOf(MEN, (p) => p.ill && p.exposed), d: countOf(MEN, (p) => p.ill), rate: '94.2', name: 'Cases', sub: 'lung cancer' },
  { ill: false, n: countOf(MEN, (p) => !p.ill && p.exposed), d: countOf(MEN, (p) => !p.ill), rate: '67.0', name: 'Controls', sub: 'no lung cancer' },
];
const GAP = '27.2';
const CTRL_SRC = 'hospital patients, admitted for other diseases';

const lab = (x, y, html, cls = '', n = '') => `<span class="er-lab ${cls}"${na(n)} style="left:${x.toFixed(1)}px;top:${y.toFixed(1)}px">${html}</span>`;

class ExposureRateBase extends SvgScene {}

export class ExposureRateScene extends withNarrationCues(ExposureRateBase) {
  static BEAT_STEP_MAP = [0, 1, 2, 3].map((i) => [{ idx: i, dwellMs: null }]);
  static ARIA_LABEL = 'Doll and Hill 1950, Table V, as men: 35 lung-cancer cases, 33 of whom smoked, and 82 hospital controls, 55 of whom smoked. Tap a column head to light its smokers over the whole column: 33 of 35 is 94.2 per cent, 55 of 82 is 67.0 per cent, a gap of 27.2 percentage points. The table supports "cancer patients had smoked more often", not "smokers got cancer more often".';
  static CONTROLS = [];
  static SETTING = 'none';
  static HEIGHT = 560;
  static PORTRAIT_HEIGHT = 700;
  // Narration focus (spec W1 D29n): data-narr ids cases/controls (head, dots, counts, frame), totals, rows, smokers,
  // ctlsrc, rate-cases/rate-controls, gap, source, claim-no/claim-yes; legend and chip hidden while narrated.
  // Narrated, show.rate-controls and show.gap drive the reading (no 1.6 s / 3.4 s timers), and the turn's
  // own late fade is skipped (the show cue reveals each sentence at its word).
  static CUES = ['columns', 'read', 'source', 'turn', 'show.rate-controls', 'show.gap'];

  async setup() {
    this.er = { sel: null, seen: new Set([0, 1]), walk: false, gen: 0, came: null, last: null, src: true, turn: true };
    await super.setup();
    bindFlow(this.root, { action: (name, v) => this.act(name, v) });
  }

  enter(step) {
    const e = this.er;
    e.came = e.last != null && step - e.last === 1 ? e.last : null;
    e.last = step;
    e.gen++;
    e.walk = false; e.src = step >= 2; e.turn = step >= 3;
    e.sel = null;
    // Arriving by Next on the reading beat: nothing read yet, the learner taps. Any other landing: both read.
    e.seen = step === 1 && e.came === 0 ? new Set() : new Set([0, 1]);
  }

  act(name, v) {
    const e = this.er;
    if (name === 'walk') { if (this.stepIndex === 0) { e.gen++; e.walk = true; this.repaint(); this.interactDone?.('walk'); } return; }
    if (name !== 'pick' || (this.stepIndex ?? 0) < 1) return;
    const i = Number(v);
    e.sel = e.sel === i ? null : i;
    if (e.sel != null) e.seen.add(i);
    this.repaint();
    if (e.seen.size === 2) this.interactDone?.('read');
  }

  applyCue(id) {
    const e = this.er, k = this.stepIndex;
    if (id === 'columns' && k === 0) { e.gen++; e.walk = true; this.repaint(); }
    else if (id === 'read' && k === 1 && e.seen.size < 2 && this.erNarr) { e.sel = 0; e.seen.add(0); this.repaint(); }
    else if (id === 'show.rate-controls' && k === 1) { e.sel = 1; e.seen.add(0); e.seen.add(1); this.repaint(); }
    else if (id === 'show.gap' && k === 1) { e.sel = null; e.seen.add(0); e.seen.add(1); this.repaint(); }
    else if (id === 'read' && k === 1 && e.seen.size < 2) {
      e.sel = 0; e.seen.add(0); this.repaint();
      this.after(1.6, () => { e.sel = 1; e.seen.add(1); this.repaint(); });
      this.after(3.4, () => { e.sel = null; this.repaint(); });
    } else if (id === 'source' && k === 2) { e.src = false; this.repaint(); this.after(0.05, () => { e.src = true; this.repaint(); }); }
    else if (id === 'turn' && k === 3 && !this.erNarr) { e.turn = false; this.repaint(); this.after(0.05, () => { e.turn = true; this.repaint(); }); }
  }

  /** Narration focus contract (content-block): only the narrated flag is kept; the engine dims and holds the tagged parts. */
  narrationFocus(f) {
    const n = !!f?.narrated, was = !!this.erNarr;
    this.erNarr = n; narrOn(this, f);
    // Narrated, beat 4 keeps 8 px under the claims for a lit claim's outline (geo); relayout when that flips.
    if (n !== was && (this.stepIndex ?? 0) >= 3 && this.sv) this.repaint();
  }

  cueBase() { const e = this.er; return { sel: e.sel, seen: [...e.seen] }; }
  cueReset(b) { const e = this.er; if (b) { e.sel = b.sel; e.seen = new Set(b.seen); } e.src = this.stepIndex >= 2; e.turn = this.stepIndex >= 3; this.repaint(); }

  geo(st) {
    const P = st.portrait, W = st.W, k = this.stepIndex ?? 0;
    const labW = P ? 0 : Math.min(150, Math.round(W * 0.22));
    const gut = P ? 14 : 22, cols = P ? 8 : 10, countW = P ? 34 : 50;
    const cellW = (W - labW - gut - 4) / 2;
    const step = Math.min(P ? 19 : 21, (cellW - countW - 6) / cols);
    const r = Math.min(8.2, step * 0.4);
    const colX = [labW, labW + cellW + gut];
    const headH = k >= 2 && P ? 94 : 66;
    const band = P ? 26 : 0;
    let y = 4;
    const headY = y; y += headH + 12;
    const row1 = y + band; y = row1 + Math.ceil(55 / cols) * step + 14;
    const row2 = y + band; y = row2 + Math.ceil(27 / cols) * step + 10;
    const totY = y + 16; y += 38;
    const readY = y; y += k >= 1 && k < 3 ? 92 : 0;
    const gapY = y; y += k >= 1 ? 78 : 0;
    const turnY = y; y += k >= 3 ? (P ? 112 : 92) : 0;
    return { P, W, labW, gut, cols, cellW, step, r, colX, headY, headH, band, row1, row2, totY, readY, gapY, turnY, H: y + 6 + (k >= 3 && this.erNarr ? 8 : 0) };
  }

  stageHeight(st) { return this.geo(st).H; }

  layoutOf(g) {
    const pos = new Map(), boxOf = new Map();
    MEN.forEach((p) => {
      const j = p.ill ? 0 : 1, list = MEN.filter((q) => q.ill === p.ill && q.exposed === p.exposed);
      const i = list.indexOf(p), y0 = p.exposed ? g.row1 : g.row2;
      pos.set(p.id, { x: g.colX[j] + 4 + g.step * (i % g.cols + 0.5), y: y0 + g.step * (Math.floor(i / g.cols) + 0.5) });
      boxOf.set(p.id, `${j}${p.exposed ? 'a' : 'b'}`);
    });
    return { r: g.r, step: g.step, pos, boxOf, rules: [], boxes: [] };
  }

  paint(st) {
    const k = this.stepIndex ?? 0, e = this.er, g = this.geo(st), P = g.P, W = g.W;
    this.lay = this.layoutOf(g);
    const sel = k >= 1 ? e.sel : null, both = e.seen.size === 2;
    this.people = MEN.map((p) => {
      const j = p.ill ? 0 : 1;
      return { ...p, lit: sel === j && p.exposed, dim: sel != null && sel !== j };
    });
    this.from = e.walk ? (p) => ({ x: p.ill ? -20 : W + 20, y: g.row1 + 40 }) : null;
    e.walk = false;
    let svg = '', over = '';
    // Table rules: under the heads, between the rows, above the total.
    const x0 = g.labW ? 0 : 0, x1 = W;
    const rule = (y, cls = '') => { svg += `<line class="er-rule ${cls}" x1="${x0}" y1="${y.toFixed(1)}" x2="${x1}" y2="${y.toFixed(1)}"/>`; };
    rule(g.headY + g.headH + 6, 'er-rule--ink');
    rule(g.row2 - g.band - 7);
    rule(g.totY - 18);
    // Row heads.
    const rows = [[g.row1, 'Smokers', 'under 5 a day', 'er-smk'], [g.row2, 'Non-smokers', '', '']];
    rows.forEach(([y, a, b, cls]) => {
      const n = cls ? 'rows smokers' : 'rows';
      if (P) over += lab(2, y - g.band / 2 - 2, `<span class="er-rn">${a}</span>${b ? ` <small>(${b})</small>` : ''}`, `er-band ${cls}`, n);
      else over += lab(g.labW - 14, y + 18, `<span class="er-rn">${a}</span>${b ? `<small>${b}</small>` : ''}`, `er-row ${cls}`, n);
    });
    if (P) over += lab(2, g.totY, 'Total', 'er-band', 'rows');
    else over += lab(g.labW - 14, g.totY, 'Total', 'er-row', 'rows');
    // Counts beside each block, totals under each column.
    COLS.forEach((c, j) => {
      const xr = g.colX[j] + 4 + g.step * g.cols + 6, hot = sel === j || (sel == null && k >= 1 && both), cid = j ? 'controls' : 'cases';
      over += lab(xr, g.row1 + 12, String(c.n), `er-count${hot ? ' er-hot' : ''}`, cid);
      over += lab(xr, g.row2 + 12, String(c.d - c.n), 'er-count', cid);
      over += lab(g.colX[j] + g.cellW / 2, g.totY, String(c.d), `er-total${hot ? ' er-hot' : ''}`, `${cid} totals`);
      // Column head: the learner's control from beat 2 on; on beat 1 it is only a label, so it is disabled.
      const subTxt = j === 1 && e.src && k >= 2 ? CTRL_SRC : c.sub;
      const on = sel === j ? ' is-on' : (e.seen.has(j) && k >= 1 ? ' is-read' : '');
      over += `<button type="button" class="er-head sv-hit${on}${k >= 1 ? '' : ' is-quiet'}"${na(cid)} data-sflow-action="pick" data-sflow-value="${j}" aria-pressed="${sel === j}"${k >= 1 ? '' : ' disabled'} style="left:${g.colX[j].toFixed(1)}px;top:${g.headY}px;width:${g.cellW.toFixed(1)}px;height:${g.headH}px"><b>${c.name}, ${c.d} men</b><span class="${j === 1 && e.src && k >= 2 ? 'er-srcsub' : ''}"${j === 1 && k >= 2 ? na('ctlsrc') : ''}>${subTxt}</span></button>`;
      // Denominator frame round the whole column (both rows and the total).
      if (k >= 1 && (sel === j || (sel == null && both))) {
        const fx = g.colX[j] - 2, fy = g.row1 - g.band - 4, fw = g.cellW + 4, fh = g.totY + 16 - fy;
        svg += `<rect class="er-frame${sel === j ? ' er-frame--on' : ''}"${na(cid)} x="${fx.toFixed(1)}" y="${fy.toFixed(1)}" width="${fw.toFixed(1)}" height="${fh.toFixed(1)}" rx="8"/>`;
      }
      // The reading under the column.
      if (k >= 1 && k < 3) {
        const cx = g.colX[j] + g.cellW / 2;
        if (e.seen.has(j)) over += `<div class="er-read${sel === j ? ' is-on' : ''}"${na(`rate-${cid}`)} style="left:${cx.toFixed(1)}px;top:${g.readY + 4}px"><span>${c.n} of ${c.d} =</span><b class="sim-numeral">${c.rate}%</b></div>`;
        else over += `<div class="er-read er-wait"${na(`rate-${cid}`)} style="left:${cx.toFixed(1)}px;top:${g.readY + 4}px"><span>tap <b>${c.name}</b> above</span></div>`;
      }
    });
    // Narration: one empty box per column (head to total) and one round the totals row carries the single
    // outline of a lit column or of the totals; the heads, counts and totals keep no outline of their own (css).
    // Invisible with narration off (no style but position).
    COLS.forEach((c, j) => { over += `<div class="er-box"${na(j ? 'controls' : 'cases')} style="left:${g.colX[j].toFixed(1)}px;top:${g.headY}px;width:${g.cellW.toFixed(1)}px;height:${(g.totY + 16 - g.headY).toFixed(1)}px"></div>`; });
    over += `<div class="er-box"${na('totals')} style="left:${g.colX[0].toFixed(1)}px;top:${(g.totY - 15).toFixed(1)}px;width:${(g.colX[1] + g.cellW - g.colX[0]).toFixed(1)}px;height:30px"></div>`;
    if (k >= 1 && both) {
      over += `<div class="er-gap"${na('gap')} style="left:${W / 2}px;top:${g.gapY}px"><span>${k >= 3 ? `${COLS[0].rate}% vs<br>${COLS[1].rate}%: gap` : 'gap'}</span><b class="sim-numeral">${GAP}</b><span>percentage<br>points</span></div>`;
    }
    if (k >= 3) {
      const anim = e.turn ? ' is-in' : '';
      over += `<div class="er-turn${anim}" style="left:0;top:${g.turnY}px;width:${W}px">`
        + `<p class="er-no"${na('claim-no')}><i aria-hidden="true"><svg viewBox="0 0 16 16" width="16" height="16"><path d="M3 3 L13 13 M13 3 L3 13"/></svg></i><s>Smokers got cancer more often.</s><em>the table cannot say this</em></p>`
        + `<p class="er-yes"${na('claim-yes')}><i aria-hidden="true"><svg viewBox="0 0 16 16" width="16" height="16"><path d="M2 9 L6 13 L14 3"/></svg></i><span>Cancer patients had smoked more often.</span><em>these counts say this</em></p></div>`;
    }
    const legend = legendHtml({ items: [{ label: 'case', color: 'var(--sim-annot)', filled: true }, { label: 'control', color: 'var(--sim-label-muted)', filled: true }, { label: 'filled: smoked', color: 'var(--sim-label)', filled: true }, { label: 'hollow: did not', color: 'var(--sim-label)', filled: false }] });
    const src = k >= 2 && P ? `<span class="er-cite${e.src ? ' is-in' : ''}"${na('source')}>Table V, Doll and Hill, BMJ 1950</span>` : '';
    if (k >= 2 && !P) over += `<span class="er-cite er-cite--in${e.src ? ' is-in' : ''}"${na('source')} style="left:0;top:${g.headY + 2}px;width:${g.labW - 12}px">Table V,<br>Doll and Hill,<br>BMJ 1950</span>`;
    const chip = k === 0 ? flowChipHtml({ label: 'Bring the men in', action: 'walk', icon: 'replay' }) : '';
    return { svg, over, head: src + tagFirst(chip, '-') + tagFirst(legend, '-') };
  }

  animate() {
    crowdLive(this.live, `m${this.er.gen}`, this.people, this.lay, { from: this.from, order: 'random', spread: 1.2, dimOpacity: 0.35 });
    tagLive(this.live, `m${this.er.gen}`, this.people, (p) => (p.ill ? 'cases' : 'controls'));
  }

  testState() {
    const e = this.er;
    return { beat: this.stepIndex, sel: e.sel, casesRead: e.seen.has(0), controlsRead: e.seen.has(1), gapShown: e.seen.size === 2 && (this.stepIndex ?? 0) >= 1 };
  }

  css() {
    return SIM_CROWD_CSS + narrDotsCss(['cases', 'controls']) + `
.svs-head { gap: 8px 16px; }
.svs-head .scw-legend { font-size: 15px; flex-wrap: wrap; justify-content: center; }
.sflow-chip { min-height: 44px; font-size: 16px; }
.er-cite { flex-basis: 100%; text-align: center; font: italic 600 16px/1.3 var(--sim-font); color: var(--sim-label); }
.er-cite--in { position: absolute; flex-basis: auto; text-align: left; font-size: 15px; line-height: 1.25; }
.er-cite.is-in { animation: er-in 0.6s ease both; }
.er-lab { position: absolute; white-space: nowrap; font: 600 16px/1.2 var(--sim-font); color: var(--sim-label); transform: translate(0, -50%); }
.er-row { transform: translate(-100%, -50%); text-align: right; font-weight: 700; font-size: 17px; }
.er-row small, .er-band small { display: block; font-size: 15px; font-weight: 500; color: var(--sim-label-muted); }
.er-band { font-weight: 700; font-size: 16px; }
.er-band small { display: inline; }
[data-step="2"] .er-smk .er-rn, [data-step="3"] .er-smk .er-rn { text-decoration: underline 2px var(--sim-annot); text-underline-offset: 5px; }
.er-count { font: 700 20px/1 var(--sim-font); font-variant-numeric: tabular-nums; color: var(--sim-label-muted); transition: color 0.3s; }
.er-total { transform: translate(-50%, -50%); font: 700 20px/1 var(--sim-font); font-variant-numeric: tabular-nums; color: var(--sim-label); }
.er-hot { color: var(--sim-annot); }
.er-head { position: absolute; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px; padding: 4px 6px; box-sizing: border-box;
  border: 1.5px solid var(--sim-label-muted); border-radius: 8px; background: var(--sim-bg-surface); color: var(--sim-label); cursor: pointer;
  font: 600 15px/1.2 var(--sim-font); text-align: center; white-space: normal; box-shadow: 0 2px 0 var(--sim-label-muted); transition: background 0.25s, border-color 0.25s; }
.er-head b { font-size: 17px; font-weight: 700; }
.er-head span { color: var(--sim-label-muted); }
.er-head .er-srcsub { color: var(--sim-label); animation: er-in 0.6s ease both; }
.er-head.is-quiet { cursor: default; box-shadow: none; }
.er-head.is-read { border-color: var(--sim-annot); }
.er-head.is-on { background: var(--sim-annot-tint); border-color: var(--sim-annot); border-width: 2.5px; }
.er-head:focus-visible { outline: 3px solid var(--sim-annot); outline-offset: 2px; }
svg .er-rule { stroke: var(--sim-label-muted); stroke-width: 1; opacity: 0.6; }
svg .er-rule--ink { stroke: var(--sim-label); opacity: 1; stroke-width: 1.5; }
svg .er-frame { fill: none; stroke: var(--sim-annot); stroke-width: 1.5; stroke-dasharray: 5 4; opacity: 0.7; }
svg .er-frame--on { stroke-width: 2.5; stroke-dasharray: none; opacity: 1; animation: er-in 0.4s ease both; }
.er-read { position: absolute; transform: translate(-50%, 0); display: flex; flex-direction: column; align-items: center; gap: 2px; white-space: nowrap; font: 600 16px/1.2 var(--sim-font); color: var(--sim-label-muted); }
.er-read b { font: 400 44px/1 var(--sim-font-numeral); color: var(--sim-label); }
.er-read.is-on b { color: var(--sim-annot); animation: er-in 0.5s ease both; }
.er-wait { padding-top: 14px; }
.er-wait b { font: 700 16px/1.2 var(--sim-font); color: var(--sim-label); }
.er-gap { position: absolute; transform: translate(-50%, 0); display: flex; align-items: center; gap: 12px; white-space: nowrap; padding: 4px 16px;
  border-top: 2px solid var(--sim-annot); background: var(--sim-annot-tint); font: 700 16px/1.15 var(--sim-font); color: var(--sim-label); animation: er-in 0.6s ease both; }
.er-gap b { font: 400 58px/1.05 var(--sim-font-numeral); color: var(--sim-annot); }
.er-turn { position: absolute; display: flex; flex-direction: column; gap: 10px; padding-top: 10px; border-top: 1px solid var(--sim-label-muted); }
.er-turn p { margin: 0; display: flex; flex-wrap: wrap; align-items: baseline; gap: 2px 10px; font: 600 17px/1.3 var(--sim-font); }
.er-turn i { font-style: normal; width: 18px; align-self: center; display: inline-flex; }
.er-turn i svg { fill: none; stroke: currentColor; stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; }
.er-turn em { font-style: italic; font-weight: 500; font-size: 15px; color: var(--sim-label-muted); flex-basis: 100%; padding-left: 28px; }
.er-no { color: var(--sim-label-muted); }
.er-no s { text-decoration-thickness: 2px; }
.er-yes { color: var(--sim-annot); }
.er-yes span { background: var(--sim-annot-tint); padding: 1px 6px; }
.er-turn.is-in .er-no { animation: er-in 0.5s ease both; }
.er-turn.is-in .er-yes { animation: er-in 0.5s ease 0.7s both; }
@keyframes er-in { from { opacity: 0; } to { opacity: 1; } }
/* Narrated: a lit column or totals row reads as one box (er-box), not a box per head, count and total; the
   column's own dashed or solid frame gives way to it while lit. */
.er-box { position: absolute; pointer-events: none; border-radius: 10px; }
#sim-canvas-host[data-narr-focus] .er-box[data-narr] { outline-offset: 2px !important; border-radius: 10px !important; }
#sim-canvas-host[data-narr-focus] :is(.er-head, .er-count, .er-total)[data-narr] { outline: none !important; }
[data-narr-on~="cases"] svg .er-frame[data-narr~="cases"], [data-narr-on~="controls"] svg .er-frame[data-narr~="controls"] { visibility: hidden; }
/* Narrated: the gap shows at its show. cue word, so its own fade would only delay it. */
#sim-canvas-host[data-narr-mode] .er-gap { animation: none; }
@media (prefers-reduced-motion: reduce) { .er-cite, .er-read b, .er-gap, .er-turn p, svg .er-frame--on { animation: none !important; } }
`;
  }
}
