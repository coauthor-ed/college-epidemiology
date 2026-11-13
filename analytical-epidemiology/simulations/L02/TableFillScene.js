/**
 * TableFillScene - the live case's table fills (the plant, illustrative). One dot = one man.
 * Blue = a patient (has the tumour); grey = a control. FILLED = cleaned the tanks; HOLLOW = did not,
 * or not asked yet (beat 1, the legend says so).
 *   beat 1 (cue walk-in)  20 patients and 60 controls walk in as two crowds, hollow: not asked yet
 *   beat 2 (cues ask, cells)  learner taps "Ask: did you clean the tanks?": each man answers (fills or stays
 *                         hollow), then flies into the 2 x 2: a = 14, b = 9, c = 6, d = 51; letters and the
 *                         margins a + c = 20, b + d = 60 come last
 *   beat 3 (cue gap)      two share bars to scale: 14 of 20 vs 9 of 60 (no percentages: the next item asks for
 *                         the gap); the case strip: 20 cases > 60 controls > 14 of 20 vs 9 of 60 > how large? next lesson
 * Every beat lands at rest on its finished picture; the button and cues replay the move.
 * Focus ids: a / b / c / d (one cell: its dots, count and letter), cells, letters, margins, mar-ac / mar-bd
 * (one column's margin), patients, controls, table, bars, strip, ctl.
 */
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { SIM_CROWD_CSS, crowdLive, groupsLayout, cellsLayout, rulesSvg, legendHtml, countOf } from 'simulations/base/kit/SimCrowd.js';
import { flowChipHtml, bindFlow } from 'simulations/base/kit/SimFlowDom.js';
import { withNarrationCues } from '../L01/NarrationCues.js';

// 20 patients (14 cleaned the tanks), 60 controls (9 cleaned them). ex = the answer they will give.
const MEN = [
  ...Array.from({ length: 20 }, (_, i) => ({ id: `p${i}`, ill: true, ex: (i * 7) % 20 < 14 })),
  ...Array.from({ length: 60 }, (_, i) => ({ id: `k${i}`, ill: false, ex: (i * 13) % 60 < 9 })),
];
const A = countOf(MEN, (p) => p.ill && p.ex), B = countOf(MEN, (p) => !p.ill && p.ex);
const C = countOf(MEN, (p) => p.ill && !p.ex), D = countOf(MEN, (p) => !p.ill && !p.ex);
const ASK_STEPS = 6;

// Narration focus (spec W1 D29n): n = a data-narr id, '-' = data-narr-hide; inert with narration off.
const na = (n) => (!n ? '' : n === '-' ? ' data-narr-hide=""' : ` data-narr="${n}"`);
const hideTag = (html) => html.replace(/^<(\w+)/, '<$1 data-narr-hide=""');
const narrTag = (html, n) => html.replace(/^<(\w+)/, `<$1 data-narr="${n}"`);
const CELL = { r0c0: 'a', r0c1: 'b', r1c0: 'c', r1c1: 'd' };
const lab = (x, y, html, cls = '', n = '') => `<span class="tf-lab ${cls}"${na(n)} style="left:${x.toFixed(1)}px;top:${y.toFixed(1)}px">${html}</span>`;

class TableFillBase extends SvgScene {}

export class TableFillScene extends withNarrationCues(TableFillBase) {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }], [{ idx: 2, dwellMs: null }]];
  static ARIA_LABEL = '20 patients and 60 controls are asked whether they cleaned the tanks; their answers fill a 2 by 2 table, a = 14, b = 9, c = 6, d = 51, and two bars compare 14 of 20 with 9 of 60.';
  static CONTROLS = [];
  static SETTING = 'none';
  static HEIGHT = 600;
  static PORTRAIT_HEIGHT = 700;
  static CUES = ['walk-in', 'ask', 'cells', 'gap'];

  async setup() {
    this.tfs = { phase: 'table', answered: 80, gen: 0, walk: true, late: false, grow: false, came: null, last: null };
    await super.setup();
    bindFlow(this.root, { action: (name) => { if (name === 'ask') { this.runAsk(); this.interactDone?.('ask'); } } });
  }

  enter(step) {
    const t = this.tfs;
    t.came = t.last != null && Math.abs(t.last - step) === 1 ? t.last : null;
    t.last = step;
    t.gen++;
    t.phase = 'table'; t.answered = 80; t.late = false;
    t.walk = false;   // the walk-in plays on its cue; a landing is at rest
    t.grow = step === 2;
    this.after(2, () => { t.grow = false; t.late = false; });
    if (step === 1 && t.came === 0) { this.runAsk(true); return; }
  }

  stageHeight(st) { return st.portrait ? [400, 510, 566][this.stepIndex ?? 0] : 450; }

  runAsk(fromEnter = false) {
    if (this.stepIndex !== 1 && !fromEnter) return;
    const t = this.tfs;
    t.phase = 'ask'; t.answered = 0; t.late = true;
    if (!fromEnter) this.repaint();
    for (let i = 1; i <= ASK_STEPS; i++) this.after(0.25 * i, () => { t.answered = Math.round((80 * i) / ASK_STEPS); this.repaint(); });
    this.after(0.25 * ASK_STEPS + 0.6, () => { t.phase = 'table'; this.repaint(); this.after(4, () => { t.late = false; }); });
  }

  applyCue(id) {
    const t = this.tfs, k = this.stepIndex;
    if (id === 'walk-in' && k === 0) { t.gen++; t.walk = true; this.repaint(); }
    else if (id === 'ask' && k === 1) { t.phase = 'ask'; t.answered = 80; this.repaint(); }
    else if (id === 'cells' && k === 1) { t.phase = 'table'; t.late = true; this.repaint(); }
    else if (id === 'gap' && k === 2) { t.grow = true; this.repaint(); }
  }

  /** Narration focus contract (content-block): only the narrated flag is kept; the engine dims and holds the tagged parts. */
  narrationFocus(f) {
    const n = !!f?.narrated;
    if (n === !!this.tfNarr) return;
    this.tfNarr = n;
    if (this.tfs?.late && this.lay) this.repaint();
  }

  cueBase() { return null; }
  cueReset() { const t = this.tfs; t.phase = 'table'; t.answered = 80; this.repaint(); }

  groupsOf(st) {
    const P = st.portrait, W = st.W;
    if (P) {
      // Portrait: two blocks with one dot size and one column count (they compare like bars), each as tall as it needs.
      const cols = 10, step = (W - 40) / cols, r = Math.min(11, step * 0.36), pos = new Map(), boxOf = new Map();
      const pat = MEN.filter((p) => p.ill), con = MEN.filter((p) => !p.ill);
      const yA = 56, yB = yA + Math.ceil(pat.length / cols) * step + 64;
      const put = (list, y0, key) => list.forEach((p, i) => { pos.set(p.id, { x: 20 + step * (i % cols + 0.5), y: y0 + step * (Math.floor(i / cols) + 0.5) }); boxOf.set(p.id, key); });
      put(pat, yA, true); put(con, yB, false);
      return { r, step, pos, boxOf, rules: [], boxes: [], heads: [[W / 2, yA - 20, '20 men with the tumour'], [W / 2, yB - 20, '60 controls, same plant, matched on age']] };
    }
    return groupsLayout(MEN, P ? { x: 20, y: 40, w: W - 40, h: st.H - 90 } : { x: 20, y: 52, w: W - 40, h: st.H - 110 }, {
      groups: [{ key: true, label: '20 men with the tumour' }, { key: false, label: '60 controls, same plant, matched on age' }],
      groupOf: (p) => p.ill, dir: P ? 'col' : 'row', gutter: P ? 70 : 48, align: 'top', padTop: 34, maxR: P ? 13 : 12,
    });
  }

  tableOf(st, small) {
    const P = st.portrait, W = st.W;
    const left = P ? 100 : 160;
    const rect = small
      ? (P ? { x: 96, y: 36, w: W - 96 - 16, h: 206 } : { x: 120, y: 44, w: W * 0.5 - 120, h: 268 })
      : (P ? { x: left, y: 44, w: W - left - 16, h: st.H - 44 - 84 } : { x: left, y: 44, w: W - left - 24, h: st.H - 44 - 76 });
    return cellsLayout(MEN, rect, { row: (p) => (p.ex ? 0 : 1), col: (p) => (p.ill ? 0 : 1), padTop: small ? 26 : 34, gutter: small ? 12 : 20, minR: small ? 4.2 : 5.5, maxR: 9 });
  }

  paint(st) {
    const k = this.stepIndex, t = this.tfs, P = st.portrait, W = st.W;
    let svg = '', over = '';
    // Interleave the answering so patients and controls answer together.
    const order = [...MEN].sort((a, b) => (Number(a.id.slice(1)) / (a.ill ? 20 : 60)) - (Number(b.id.slice(1)) / (b.ill ? 20 : 60)));
    const answeredIds = new Set(order.slice(0, k === 1 ? t.answered : (k === 0 ? 0 : 80)).map((p) => p.id));
    if (k === 0) {
      this.lay = this.groupsOf(st);
      this.people = MEN.map((p) => ({ ...p, exposed: false }));
      this.from = t.walk ? (p) => ({ x: p.ill ? 12 : W - 12, y: P ? (p.ill ? 80 : 300) : 200 }) : null;
      this.flyOpt = { order: 'random', spread: 1.4, labels: P ? null : { place: 'above', count: 'none' } };
      (this.lay.heads ?? []).forEach(([x, y, h], i) => { over += lab(x, y, h, 'tf-head', i ? 'controls' : 'patients'); });
      t.walk = false;
      const head = hideTag(legendHtml({ items: [{ label: 'patient', color: 'var(--sim-annot)', filled: false }, { label: 'control', color: 'var(--sim-label-muted)', filled: false }, { label: 'hollow: not asked yet', color: 'var(--sim-label)', filled: false }] }));
      return { svg, over, head };
    }
    const tableNow = k === 2 || t.phase === 'table';
    const lay = tableNow ? this.tableOf(st, k === 2) : this.groupsOf(st);
    this.lay = lay;
    this.people = MEN.map((p) => ({ ...p, exposed: answeredIds.has(p.id) ? p.ex : false, lit: k === 2 && p.ex, dim: k === 2 && !p.ex }));
    this.from = k === 1 && t.came === 0 && t.phase === 'ask' ? this.groupsOf(st) : (k === 2 && t.came === 1 ? this.tableOf(st, false) : null);
    this.flyOpt = { order: 'random', spread: 1.0, dimOpacity: 0.5, labels: tableNow ? { place: 'above', count: 'landed', big: k === 1 } : (P ? null : { place: 'above', count: 'none' }) };
    const legend = hideTag(legendHtml({ items: [{ label: 'patient', color: 'var(--sim-annot)', filled: true }, { label: 'control', color: 'var(--sim-label-muted)', filled: true }, { label: 'filled: cleaned the tanks', color: 'var(--sim-label)', filled: true }, { label: 'hollow: did not', color: 'var(--sim-label)', filled: false }] }));
    if (!tableNow) {
      (lay.heads ?? []).forEach(([x, y, h], i) => { over += lab(x, y, h, 'tf-head', i ? 'controls' : 'patients'); });
      const head = narrTag(flowChipHtml({ label: 'Ask: did you clean the tanks?', action: 'ask', icon: 'replay' }), 'ctl') + legend;
      return { svg, over, head };
    }
    svg += rulesSvg(lay).replaceAll('<line ', '<line data-narr="cells table" ');
    const ar = lay.boxes.map((b) => b.area), small = k === 2;
    over += lab(ar[0].x + ar[0].w / 2, ar[0].y - 18, 'patients', 'tf-col', 'patients table');
    over += lab(ar[1].x + ar[1].w / 2, ar[1].y - 18, 'controls', 'tf-col', 'controls table');
    over += lab(ar[0].x - 12, ar[0].y + ar[0].h / 2, 'cleaned<br>tanks', 'tf-row', 'cells table');
    over += lab(ar[2].x - 12, ar[2].y + ar[2].h / 2, 'did not', 'tf-row', 'cells table');
    // Narrated, letters and margins appear on their show. cue at the word; the scene's own late fade would delay them.
    const late = t.late && k === 1 && !this.tfNarr ? ' tf-late' : '';
    const letters = ['a', 'b', 'c', 'd'];
    lay.boxes.forEach((b, i) => { over += lab(b.area.x + 6, b.area.y + 6, letters[i], `tf-letter${late}`, `letters table ${letters[i]}`); });
    const my = ar[2].y + ar[2].h + (small ? 16 : 22);
    over += lab(ar[2].x + ar[2].w / 2, my, `a + c = ${A + C}`, `tf-margin${late}`, 'margins table mar-ac');
    over += lab(ar[3].x + ar[3].w / 2, my, `b + d = ${B + D}`, `tf-margin${late}`, 'margins table mar-bd');
    if (k === 1) {
      const head = narrTag(flowChipHtml({ label: 'Ask: did you clean the tanks?', action: 'ask', icon: 'replay' }), 'ctl') + legend;
      return { svg, over, head };
    }
    // Beat 3: two share bars to scale, and the case strip.
    const bx = P ? 24 : W * 0.56, bw = P ? W - 48 : W - 16 - W * 0.56, by = P ? 312 : 84, gapY = P ? 90 : 118, bh = 28;
    over += lab(bx, by - 22, 'cleaned the tanks', 'tf-cap', 'bars');
    const grow = t.grow ? ' tf-grow' : '';
    const bar = (i, n, d, cls, name) => {
      const y = by + i * gapY, nid = `bars ${cls}bar`;
      svg += `<rect class="tf-track" data-narr="${nid}" x="${bx}" y="${y + 56}" width="${bw}" height="${bh}"/>`;
      svg += `<rect class="tf-fill ${cls}${grow}" data-narr="${nid}" style="--d:${0.15 + i * 0.35}s" x="${bx}" y="${y + 56}" width="${(bw * n) / d}" height="${bh}"/>`;
      over += `<div class="tf-read ${cls}" data-narr="${nid}" style="left:${bx}px;top:${y}px"><b class="sim-numeral tf-big">${n} of ${d}</b><span>${name}</span></div>`;
    };
    bar(0, A, A + C, 'pat', 'patients');
    bar(1, B, B + D, 'con', 'controls');
    const sy = P ? 494 : 392;
    over += `<div class="tf-strip" data-narr="strip" style="left:${16}px;top:${sy}px;width:${W - 32}px"><span>20 cases</span><i>&gt;</i><span>60 controls</span><i>&gt;</i><span class="on">14 of 20 vs 9 of 60</span><i>&gt;</i><span class="off">how large? next lesson</span></div>`;
    return { svg, over, head: legend };
  }

  animate() {
    const key = `m${this.tfs.gen}`;
    crowdLive(this.live, key, this.people, this.lay, { from: this.from, ...this.flyOpt });
    const tag = (e, n) => { if (e && e.getAttribute('data-narr') !== n) e.setAttribute('data-narr', n); };
    for (const p of this.people) {
      const c = CELL[this.lay.boxOf.get(p.id)];
      tag(this.live.get(`${key}|${p.id}`), `${p.ill ? 'patients' : 'controls'}${c ? ` ${c} table` : ''}`);
    }
    for (const b of this.lay.boxes ?? []) {
      const c = CELL[b.key];
      tag(this.live.get(`${key}|lab|${b.key}`), c ? `cells ${c} table` : (b.key ? 'patients' : 'controls'));
    }
  }

  css() {
    return SIM_CROWD_CSS + `
.svs-head { gap: 10px 16px; }
.svs-head .scw-legend { font-size: 16px; flex-wrap: wrap; justify-content: center; }
.sflow-chip { min-height: 44px; font-size: 16px; }
.scw-lab { font-size: 17px; }
.tf-lab { position: absolute; transform: translate(-50%, -50%); white-space: nowrap; font: 600 16px/1.2 var(--sim-font); color: var(--sim-label); }
.tf-head { font-size: 17px; font-weight: 700; }
.tf-col { font-size: 18px; font-weight: 700; transform: translate(-50%, -100%); }
.tf-row { font-size: 17px; font-weight: 700; transform: translate(-100%, -50%); text-align: right; line-height: 1.15; }
.tf-letter { transform: none; font: italic 600 16px/1 var(--sim-font); color: var(--sim-label-muted); }
.tf-cap { transform: translate(0, -50%); font-size: 17px; font-weight: 700; color: var(--sim-label); }
.tf-margin { font-size: 16px; font-weight: 600; color: var(--sim-label-muted); }
.tf-late { animation: tf-in 0.5s ease 2.9s both; }
@keyframes tf-in { from { opacity: 0; } to { opacity: 1; } }
.tf-read { position: absolute; display: flex; align-items: baseline; gap: 12px; white-space: nowrap; font: 600 16px/1.2 var(--sim-font); color: var(--sim-label-muted); }
.tf-big { font: 400 46px/1 var(--sim-font-numeral); }
.tf-read.pat .tf-big { color: var(--sim-annot); }
.tf-read.con .tf-big { color: var(--sim-label); }
.tf-strip { position: absolute; display: flex; flex-wrap: wrap; align-items: center; gap: 4px 8px; padding-top: 10px; border-top: 1px solid var(--sim-label-muted); font: 600 16px/1.3 var(--sim-font); color: var(--sim-label-muted); }
.tf-strip i { font-style: normal; color: var(--sim-label-muted); }
.tf-strip .on { color: var(--sim-annot); font-weight: 700; background: var(--sim-annot-tint); padding: 2px 8px; }
.tf-strip .off { opacity: 0.7; font-weight: 500; }
svg .tf-track { fill: none; stroke: var(--sim-label-muted); stroke-width: 1.5; }
svg .tf-fill.pat { fill: var(--sim-annot); }
svg .tf-fill.con { fill: var(--sim-label-muted); }
svg .tf-grow { transform-box: fill-box; transform-origin: left; animation: tf-grow 0.9s cubic-bezier(.3,.8,.3,1) both; animation-delay: var(--d, 0s); }
@keyframes tf-grow { from { transform: scaleX(0); } to { transform: none; } }
`;
  }
}
