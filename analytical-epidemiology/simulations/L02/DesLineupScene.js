/**
 * DesLineupScene - analytical-epidemiology L02 s07, the lesson payoff. Table 14 of the source (Herbst,
 * Ulfelder and Poskanzer, NEJM 1971): 8 cases and 32 birth-record controls (4 per case), four suspects
 * from the mothers' pregnancies. One dot = one person: blue = case, grey = control; FILLED = her mother had
 * the open suspect, HOLLOW = did not. Each column is one woman with her four controls beneath her.
 *   Beat 0 lineup:  four suspect cards, all closed.
 *   Beat 1 suspects: the learner opens cards: age as two mean ticks 26.1 vs 29.3; smoked 7 of 8 vs 21 of 32;
 *                    X-rays 1 of 8 vs 4 of 32; each stamped n.s. (cold landing: the three open).
 *   Beat 2 des:      the learner opens oestrogen (DES): 7 of 8 cases fill, 0 of 32 controls; the payoff
 *                    lands large, P < 0.00001, then the 2 x 2 settles small: a 7, b 0, c 1, d 32.
 * Which individual dots had smoking or X-rays is illustrative; the counts are the table's.
 */
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { SIM_CROWD_CSS, crowdLive, legendHtml } from 'simulations/base/kit/SimCrowd.js';
import { withNarrationCues } from '../L01/NarrationCues.js';

const SMOKE_C = new Set([0, 2, 3, 5, 6, 8, 9, 11, 12, 13, 15, 16, 18, 19, 21, 22, 24, 26, 27, 29, 30]); // 21 of 32
const XRAY_C = new Set([3, 11, 18, 27]); // 4 of 32
const CASES = Array.from({ length: 8 }, (_, i) => ({ id: `k${i}`, ill: true, col: i, row: -1, had: [false, i !== 6, i === 2, i !== 7] }));
const CTRL = Array.from({ length: 32 }, (_, i) => ({ id: `c${i}`, ill: false, col: Math.floor(i / 4), row: i % 4, had: [false, SMOKE_C.has(i), XRAY_C.has(i), false] }));
const PEOPLE = [...CASES, ...CTRL];

const ROWS = [
  { name: "Mother's age", key: 'age' },
  { name: 'Mother smoked', key: 'smoking', a: 7, b: 21 },
  { name: 'X-rays in pregnancy', key: 'xray', a: 1, b: 4 },
  { name: 'Oestrogen (DES) in pregnancy', key: 'des', a: 7, b: 0 },
];
const MAP = [0, 1, 2].map((i) => [{ idx: i, dwellMs: null }]);
const HAD = ['', 'smoked', 'had X-rays in pregnancy', 'was given DES in pregnancy'];
const CUE_ROW = { age: 0, smoking: 1, xray: 2, des: 3 };
// Narration focus (spec W1 D29n): data-narr ids on the parts; inert with narration off.
const hideTag = (html) => html.replace(/^<(\w+)/, '<$1 data-narr-hide=""');

export class DesLineupScene extends withNarrationCues(SvgScene) {
  static WIDTH = 680;
  static HEIGHT = 532;
  static PORTRAIT_WIDTH = 380;
  static PORTRAIT_HEIGHT = 670;
  static MIN_SCALE = 0.85;
  static SETTING = 'none';
  static BEAT_STEP_MAP = MAP;
  static CONTROLS = [];
  static CUES = ['lineup', 'age', 'smoking', 'xray', 'des', 'table'];
  static ARIA_LABEL = 'The DES study, one dot per person: 8 women with the cancer in blue, each above her 4 controls in grey, 32 girls born in the same hospital within days. Four suspects from the mothers\' pregnancies open as cards; a filled dot means her mother had that suspect. Mother\'s age 26.1 against 29.3 years on average, not significant. Mother smoked 7 of 8 against 21 of 32, not significant. X-rays in pregnancy 1 of 8 against 4 of 32, not significant. Oestrogen, DES, in pregnancy: 7 of 8 against 0 of 32, P less than 0.00001. As a 2 by 2 table: a 7, b 0, c 1, d 32.';

  enter(step) {
    const came = this._dlLast === step - 1;
    this._dlLast = step;
    this.dlTable = false;
    if (step === 0) { this.dlOpen = new Set(); this.dlActive = null; }
    else if (step === 1) { this.dlOpen = came ? new Set() : new Set([0, 1, 2]); this.dlActive = came ? null : 1; }
    else {
      this.dlOpen = came ? new Set([0, 1, 2]) : new Set([0, 1, 2, 3]);
      this.dlActive = came ? 1 : 3;
      this.dlTable = !came;
    }
  }

  geo(st) {
    const P = st.portrait, M = P ? 8 : 16;
    const crowdW = P ? st.W - 2 * M : 284, step = P ? Math.min(31, crowdW / 8) : crowdW / 8;
    const r = Math.min(13, step * 0.34);
    const cx = M + (crowdW - 8 * step) / 2;
    const yCase = P ? 36 : 96, yLab2 = yCase + step * 0.5 + 10, yCtrl = yLab2 + (P ? 46 : 52) + step * 0.5;
    const crowdBottom = yCtrl + 3.5 * step + 6;
    const cardX = P ? M : M + crowdW + 20, cardW = P ? st.W - 2 * M : st.W - cardX - M;
    const cardY = P ? crowdBottom + 14 : 0;
    return { P, M, crowdW, step, r, cx, yCase, yLab2, yCtrl, crowdBottom, cardX, cardW, cardY };
  }

  layout(st) {
    const g = this.geo(st), pos = new Map(), boxOf = new Map();
    for (const p of PEOPLE) {
      pos.set(p.id, { x: g.cx + (p.col + 0.5) * g.step, y: p.row < 0 ? g.yCase : g.yCtrl + p.row * g.step });
      boxOf.set(p.id, p.ill ? 'cases' : 'ctrl');
    }
    return { kind: 'grid', r: g.r, step: g.step, pos, boxOf, boxes: [], rules: [] };
  }

  // Card heights for a state: folded once DES is open, so the payoff is the biggest thing on screen.
  cardH(i, open, desOpen, P, act) {
    if (i === 3) return open.has(3) ? (P ? 200 : 224) : 54;
    if (!open.has(i)) return 54;
    return this.folded(i, desOpen, P, act) ? (P ? 40 : 66) : 94;
  }

  folded(i, desOpen, P, act) { return desOpen || (P && i !== act); }

  stageHeight(st) {
    const g = this.geo(st), gap = g.P ? 6 : 8;
    let h = 0;
    for (const open of [new Set([0, 1, 2]), new Set([0, 1, 2, 3])]) {
      let y = g.cardY;
      for (let i = 0; i < 4; i++) y += this.cardH(i, open, open.has(3), g.P, open.has(3) ? 3 : 0) + gap;
      h = Math.max(h, y);
    }
    return Math.ceil(Math.max(h, g.crowdBottom + (g.P ? 0 : 90)) + 4);
  }

  rowHtml(i, g) {
    const r = ROWS[i];
    if (i === 0) {
      const lo = 20, hi = 35, w = Math.min(170, g.cardW - 150), X = (v) => 10 + ((v - lo) / (hi - lo)) * w;
      return `<svg class="dl-scale" viewBox="0 0 ${w + 20} 34" width="${w + 20}" height="34" aria-hidden="true">`
        + `<line class="dl-ax" x1="10" y1="22" x2="${w + 10}" y2="22"/>`
        + `<text class="dl-axt" x="10" y="33" text-anchor="middle">20</text><text class="dl-axt" x="${w + 10}" y="33" text-anchor="middle">35</text>`
        + `<line class="dl-tk dl-tk--case" x1="${X(26.1)}" y1="12" x2="${X(26.1)}" y2="26"/><text class="dl-tkt dl-tkt--case" x="${X(26.1)}" y="10" text-anchor="end">26.1</text>`
        + `<line class="dl-tk" x1="${X(29.3)}" y1="12" x2="${X(29.3)}" y2="26"/><text class="dl-tkt" x="${X(29.3)}" y="10" text-anchor="start">29.3</text></svg>`
        + '<span class="dl-unit">years, average</span>';
    }
    return `<span class="dl-n dl-n--case">${r.a}</span><span class="dl-of">of 8</span><span class="dl-bar" aria-hidden="true"></span>`
      + `<span class="dl-n">${r.b}</span><span class="dl-of">of 32</span>`;
  }

  paint(st) {
    const g = this.geo(st), s = this.stepIndex ?? 0, open = this.dlOpen ?? new Set(), desOpen = open.has(3);
    this.lay = this.layout(st);
    let over = '', svg = '';
    over += `<span class="dl-lab dl-lab--case" data-narr="cases" style="left:${g.cx}px;top:${g.yCase - g.step * 0.5 - 26}px">8 women with the cancer</span>`;
    over += `<span class="dl-lab" data-narr="controls" style="left:${g.cx}px;top:${g.yLab2}px;width:${8 * g.step}px">32 girls born in the same hospital within days</span>`;
    svg += `<line class="dl-rule" data-narr="controls" x1="${g.cx}" y1="${g.yLab2 - 4}" x2="${g.cx + 8 * g.step}" y2="${g.yLab2 - 4}"/>`;
    const act = this.dlActive;
    if (!g.P) over += `<p class="dl-cap" data-narr-hide="" style="left:${g.cx}px;top:${g.crowdBottom + 2}px;width:${8 * g.step}px">`
      + (act != null && act > 0 ? `Filled: her mother <b>${HAD[act]}</b>.` : act === 0 ? 'Age is a number, not a yes or no: see the scale.' : 'Each column: one woman and her four controls.') + '</p>';
    let y = g.cardY;
    for (let i = 0; i < 4; i++) {
      const h = this.cardH(i, open, desOpen, g.P, act), isOpen = open.has(i), fold = isOpen && i < 3 && this.folded(i, desOpen, g.P, act);
      const enabled = (s === 1 && i < 3) || (s === 2);
      const cls = ['dl-card', isOpen ? 'dl-card--open' : 'dl-card--shut', fold ? 'dl-card--fold' : '', i === 3 ? 'dl-card--des' : '', act === i ? 'dl-card--act' : '', !isOpen && enabled ? 'dl-card--ready' : ''].filter(Boolean).join(' ');
      let right = '';
      if (isOpen) right = i === 3 ? '' : '<span class="dl-ns">n.s.</span>';
      else right = enabled ? '<span class="dl-go">Open</span>' : '<span class="dl-closed">closed</span>';
      let body = '';
      if (isOpen && i < 3 && !fold) body = `<span class="dl-body">${this.rowHtml(i, g)}</span>`;
      const mini = fold ? `<span class="dl-mini">${i === 0 ? '26.1 | 29.3 years' : `${ROWS[i].a} of 8 | ${ROWS[i].b} of 32`}</span>` : '';
      if (fold && g.P) right = mini + right;
      if (fold && !g.P) body = mini;
      if (isOpen && i === 3) {
        body = '<span class="dl-pay">'
          + '<span class="dl-side" data-narr="descase"><span class="dl-big dl-big--case">7<small>of</small>8</span><span class="dl-who">case mothers</span></span>'
          + '<span class="dl-side" data-narr="desctrl"><span class="dl-big">0<small>of</small>32</span><span class="dl-who">control mothers</span></span></span>'
          + `<span class="dl-low"><span class="dl-p" data-narr="pvalue">P &lt; 0.00001</span>${this.dlTable ? this.tableHtml() : ''}</span>`;
      }
      over += `<button type="button" class="${cls}" data-row="${i}" data-narr="${ROWS[i].key}"${enabled || isOpen ? '' : ' disabled'} aria-expanded="${isOpen}" style="left:${g.cardX}px;top:${y}px;width:${g.cardW}px;height:${h}px">`
        + `<span class="dl-head"><span class="dl-name">${ROWS[i].name}</span>${right}</span>${body}</button>`;
      y += h + (g.P ? 6 : 8);
    }
    const legend = hideTag(legendHtml({ show: ['ill', 'well', 'exposed', 'unexposed'], text: { ill: 'case', well: 'control', exposed: 'had it', unexposed: 'did not' } }));
    return { svg, over, head: legend };
  }

  tableHtml() {
    return '<span class="dl-tab" data-narr="table" role="table" aria-label="2 by 2 table: DES and cases a 7, DES and controls b 0, no DES and cases c 1, no DES and controls d 32">'
      + '<span></span><span class="dl-th">cases</span><span class="dl-th">controls</span>'
      + '<span class="dl-rh">DES</span><span class="dl-td"><i>a</i>7</span><span class="dl-td"><i>b</i>0</span>'
      + '<span class="dl-rh">no DES</span><span class="dl-td"><i>c</i>1</span><span class="dl-td"><i>d</i>32</span></span>';
  }

  animate() {
    if (!this.lay) return;
    const a = this.dlActive, des = a === 3;
    const people = PEOPLE.map((p) => ({ ...p, exposed: a != null && a > 0 ? p.had[a] : false, lit: des && p.had[3] }));
    crowdLive(this.live, 'dl', people, this.lay, {});
    for (const p of people) {
      const e = this.live.get(`dl|${p.id}`), n = p.ill ? 'cases dots' : 'controls dots';
      if (e && e.getAttribute('data-narr') !== n) e.setAttribute('data-narr', n);
    }
  }

  async setup() {
    await super.setup();
    this.dlListen = (e) => this.onRowClick(e);
    this.root.addEventListener('click', this.dlListen);
  }

  onRowClick(e) {
    const b = e.target?.closest?.('[data-row]');
    if (!b || b.disabled) return;
    const i = Number(b.dataset.row);
    const found = this.openRow(i, true) && i === 3;
    if (found) {
      const g = this.geo(this.sv);
      this.celebrate(g.cx + 4 * g.step, (g.P ? g.yCtrl + 1.5 * g.step : g.crowdBottom + 60), { stamp: 'FOUND' });
    }
  }

  openRow(i, byLearner) {
    const s = this.stepIndex ?? 0;
    if (!ROWS[i] || s === 0 || (i === 3 && s < 2)) return false;
    const was = this.dlOpen.has(i);
    this.dlOpen.add(i);
    this.dlActive = i;
    this.repaint();
    if (i === 3 && !was) {
      if (byLearner) this.interactDone('des');
      this.after(1.4, () => { this.dlTable = true; this.repaint(); });
    } else if (byLearner && !was) this.interactDone(ROWS[i].key);
    return !was;
  }

  applyCue(id) {
    if (id === 'table') { if (this.dlOpen.has(3)) { this.dlTable = true; this.repaint(); } return; }
    const i = CUE_ROW[id];
    if (i != null) this.openRow(i, false);
  }

  cueBase() { return { open: [...this.dlOpen], active: this.dlActive, table: this.dlTable }; }

  cueReset(b) {
    this.dlOpen = new Set(b?.open ?? []);
    this.dlActive = b?.active ?? null;
    this.dlTable = !!b?.table;
    this.repaint();
  }

  testState() {
    return { beat: this.stepIndex, open: [...this.dlOpen].sort(), active: this.dlActive, table: this.dlTable };
  }

  destroy() {
    this.root?.removeEventListener('click', this.dlListen);
    super.destroy();
  }

  css() {
    return SIM_CROWD_CSS + `
.svs-head { justify-content: flex-start; }
.dl-lab { position: absolute; font: 700 var(--sim-text-md)/1.25 var(--sim-font); color: var(--sim-label); }
.dl-lab--case { color: var(--sim-annot); white-space: nowrap; }
.dl-rule { stroke: var(--sim-label); stroke-width: 1; opacity: 0.4; }
.dl-cap { position: absolute; margin: 0; font: 500 var(--sim-text-md)/1.35 var(--sim-font); color: var(--sim-label-muted); }
.dl-cap b { color: var(--sim-label); }
.dl-card { position: absolute; pointer-events: auto; box-sizing: border-box; display: flex; flex-direction: column; justify-content: flex-start; gap: 6px; padding: 10px 14px; text-align: left;
  border: 1px solid color-mix(in oklab, var(--sim-label) 35%, transparent); border-radius: var(--sim-radius-sm); background: var(--sim-bg-surface); color: var(--sim-label);
  font: 500 var(--sim-text-md)/1.2 var(--sim-font); cursor: pointer; transition: top 0.35s ease, height 0.35s ease, border-color 0.3s ease; overflow: hidden; }
.dl-card--fold { padding: 6px 10px; }
.dl-card--fold .dl-head { gap: 8px; }
.dl-card:disabled { cursor: default; color: var(--sim-label-muted); }
.dl-card--ready { border: 1.5px solid var(--sim-label); background: var(--sim-annot-tint); }
.dl-card--act { border-left: 4px solid var(--sim-annot); }
.dl-card:focus-visible { outline: 2px solid var(--sim-annot); outline-offset: 2px; }
.dl-head { display: flex; align-items: center; gap: 10px; min-height: 30px; }
.dl-name { flex: 1; min-width: 0; font-weight: 700; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.dl-go { font-weight: 700; color: var(--sim-annot); }
.dl-closed { font-size: var(--sim-text-sm); color: var(--sim-label-muted); letter-spacing: 0.06em; }
.dl-ns { padding: 1px 7px; border: 1px solid var(--sim-label-muted); border-radius: 3px; font: 600 var(--sim-text-sm)/1.3 var(--sim-font); color: var(--sim-label-muted); }
.dl-mini { font: 500 var(--sim-text-sm)/1 var(--sim-font); color: var(--sim-label-muted); font-variant-numeric: tabular-nums; white-space: nowrap; }
.dl-body { display: flex; align-items: baseline; gap: 6px; white-space: nowrap; animation: dl-in 0.35s ease-out both; }
.dl-n { font: 400 30px/1 var(--sim-font-numeral, var(--sim-font)); font-variant-numeric: lining-nums tabular-nums; color: var(--sim-label); }
.dl-n--case { color: var(--sim-annot); }
.dl-of { font-size: var(--sim-text-sm); color: var(--sim-label-muted); }
.dl-bar { width: 1px; height: 22px; margin: 0 6px; background: var(--sim-label-muted); align-self: center; }
.dl-unit { font-size: var(--sim-text-sm); color: var(--sim-label-muted); align-self: flex-end; }
.dl-scale { overflow: visible; }
.dl-ax { stroke: var(--sim-label-muted); stroke-width: 1.5; }
.dl-axt { font: 500 14px var(--sim-font); fill: var(--sim-label-muted); }
.dl-tk { stroke: var(--sim-label-muted); stroke-width: 3; }
.dl-tk--case { stroke: var(--sim-annot); }
.dl-tkt { font: 700 14px var(--sim-font); fill: var(--sim-label); }
.dl-tkt--case { fill: var(--sim-annot); }
.dl-card--des.dl-card--open { border: 2px solid var(--sim-annot); cursor: default; }
.dl-pay { display: flex; gap: 22px; align-items: flex-end; animation: dl-in 0.5s ease-out both; }
.dl-side { display: flex; flex-direction: column; }
.dl-big { font: 400 64px/1 var(--sim-font-numeral, var(--sim-font)); font-variant-numeric: lining-nums; color: var(--sim-label); white-space: nowrap; }
.dl-big small { font-size: 24px; margin: 0 6px; color: var(--sim-label-muted); }
.dl-big--case { color: var(--sim-annot); }
.dl-who { font: 600 var(--sim-text-sm)/1.3 var(--sim-font); color: var(--sim-label-muted); }
.dl-low { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-top: 4px; }
.dl-p { font: 700 var(--sim-text-lg)/1.2 var(--sim-font); color: var(--sim-annot); white-space: nowrap; }
.dl-tab { display: grid; grid-template-columns: auto auto auto; gap: 1px 10px; font: 500 var(--sim-text-sm)/1.3 var(--sim-font); color: var(--sim-label); animation: dl-in 0.5s ease-out both; }
.dl-th { color: var(--sim-label-muted); text-align: right; }
.dl-rh { color: var(--sim-label-muted); white-space: nowrap; }
.dl-td { text-align: right; font-variant-numeric: tabular-nums; font-weight: 700; border-top: 1px solid color-mix(in oklab, var(--sim-label) 30%, transparent); }
.dl-td i { margin-right: 6px; font-weight: 400; color: var(--sim-annot); }
@keyframes dl-in { from { opacity: 0; transform: translateY(6px); } }
.sim-dom-root--portrait .dl-big { font-size: 56px; }
.sim-dom-root--portrait .dl-card { padding: 8px 12px; }
@media (prefers-reduced-motion: reduce) { .dl-body, .dl-pay, .dl-tab { animation: none; } .dl-card { transition: none; } }
`;
  }
}
