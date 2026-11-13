/**
 * CaseFileScene - analytical-epidemiology L03 s10. The live case (the plant, illustrative): the odds ratio
 * goes into the case file, and the file asks how it came about. One dot = one man. Blue = a man with the
 * tumour (case); grey = a control. FILLED = cleaned the tanks; HOLLOW = did not.
 *   beat 1 (cue filed)  the case strip: 20 cases > 60 controls > 14 of 20 vs 9 of 60 > OR 13.2 (lit, new);
 *                       later steps dashed. The 80 men sit in their cells (14, 9, 6, 51); the 13.2 card
 *                       lands large with 14 x 51 over 6 x 9 = 714 / 54. Chip "File the ratio" replays it.
 *   beat 2 (cue rare)   beside 13.2: "strong association"; "rare disease: close to the relative risk
 *                       (last exercise)"; an open dashed line "how did it come about?". Chip replays.
 *   beat 3 (cue doors)  the 80 men leave the cells and split by the door they came through: the 20 patients
 *                       "interviewed on the ward", the 60 controls "asked at home, by post"; a "?" over the
 *                       13.2 card: "a ratio this large can be built by the way the data were collected".
 *                       Chip toggles table / doors so the learner makes the split.
 * Every beat lands at rest on its finished picture; cues and chips replay the move.
 */
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { SIM_CROWD_CSS, crowdLive, cellsLayout, groupsLayout, rulesSvg, legendHtml, countOf } from 'simulations/base/kit/SimCrowd.js';
import { flowChipHtml, bindFlow } from 'simulations/base/kit/SimFlowDom.js';
import { withNarrationCues } from '../L01/NarrationCues.js';
import { na, tagFirst, tagLive } from './NarrTags.js';
import { narrOn, narrDotsCss } from '../L05/NarrDots.js';

// 20 men with the tumour (14 cleaned the tanks), 60 controls (9 cleaned them). Same men as TableFillScene.
const MEN = [
  ...Array.from({ length: 20 }, (_, i) => ({ id: `p${i}`, ill: true, exposed: (i * 7) % 20 < 14 })),
  ...Array.from({ length: 60 }, (_, i) => ({ id: `k${i}`, ill: false, exposed: (i * 13) % 60 < 9 })),
];
const A = countOf(MEN, (p) => p.ill && p.exposed), B = countOf(MEN, (p) => !p.ill && p.exposed);
const C = countOf(MEN, (p) => p.ill && !p.exposed), D = countOf(MEN, (p) => !p.ill && !p.exposed);
const OR = ((A * D) / (B * C)).toFixed(1);   // 714 / 54 = 13.2
const X = '\u00d7';

const lab = (x, y, html, cls = '', n = '') => `<span class="cf-lab ${cls}"${na(n)} style="left:${x.toFixed(1)}px;top:${y.toFixed(1)}px">${html}</span>`;
const door = (x, y, w, h, n) => `<g class="cf-door"${na(n)}><rect x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${w}" height="${h}" rx="2"/><line x1="${(x - 6).toFixed(1)}" y1="${(y + h).toFixed(1)}" x2="${(x + w + 6).toFixed(1)}" y2="${(y + h).toFixed(1)}"/><circle cx="${(x + w - 7).toFixed(1)}" cy="${(y + h * 0.55).toFixed(1)}" r="2.4"/></g>`;

class CaseFileBase extends SvgScene {}

export class CaseFileScene extends withNarrationCues(CaseFileBase) {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }], [{ idx: 2, dwellMs: null }]];
  static ARIA_LABEL = 'The live case file, illustrative. 20 men with the tumour and 60 controls sit in a 2 by 2: 14, 9, 6 and 51. Their odds ratio, 14 times 51 over 6 times 9, 714 over 54, is 13.2: a strong association, and close to the relative risk if the disease is rare. Then the men split by how they were asked: the patients interviewed on the ward, the controls asked at home by post. A ratio this large can be built by the way the data were collected.';
  static CONTROLS = [];
  static SETTING = 'none';
  static HEIGHT = 560;
  static PORTRAIT_HEIGHT = 780;
  // Narration focus (spec W1 D29n): data-narr ids strip (strip-or, strip-believe inside), table (cells view: dots,
  // labels, counts), ward / home (split view: each group's dots, door and label), card (formula inside), strength,
  // rare-note, open, why, illus; legend and chip hidden while narrated. Narrated, beat 3 starts on the table and
  // the doors cue makes the split at its word (text mode still lands on the finished split).
  static CUES = ['filed', 'rare', 'doors'];

  async setup() {
    this.cf = { gen: 0, came: null, last: null, anim: false, split: true };
    await super.setup();
    bindFlow(this.root, { action: (name) => this.act(name) });
  }

  enter(step) {
    const c = this.cf;
    c.came = c.last != null && step - c.last === 1 ? c.last : null;
    c.last = step;
    c.gen++;
    c.anim = c.came != null;      // arriving by Next plays the beat's move; any other landing is at rest
    c.split = !(step === 2 && this.cfNarr);
  }

  /** Narration focus contract (content-block): only the narrated flag is kept; the engine dims and holds the tagged parts. */
  narrationFocus(f) {
    narrOn(this, f);
    const n = !!f?.narrated;
    if (n === !!this.cfNarr) return;
    this.cfNarr = n;
    if (n && this.stepIndex === 2 && !this._nc?.applied?.has('doors')) { this.cf.split = false; this.repaint(); }
  }

  act(name) {
    const c = this.cf, k = this.stepIndex ?? 0;
    if (name === 'replay') { c.gen++; c.anim = true; this.repaint(); this.interactDone?.('replay'); }
    else if (name === 'split' && k === 2) { c.split = !c.split; c.anim = true; this.repaint(); this.interactDone?.('split'); }
  }

  applyCue(id) {
    const c = this.cf, k = this.stepIndex;
    if ((id === 'filed' && k === 0) || (id === 'rare' && k === 1)) { c.gen++; c.anim = true; this.repaint(); }
    else if (id === 'doors' && k === 2) { c.split = false; this.repaint(); this.after(0.1, () => { c.split = true; c.anim = true; this.repaint(); }); }
  }

  cueBase() { return null; }
  cueReset() { const c = this.cf; c.split = !(this.stepIndex === 2 && this.cfNarr); c.anim = false; this.repaint(); }

  geo(st) {
    const P = st.portrait, W = st.W, k = this.stepIndex ?? 0;
    const stripH = P ? 84 : 62;
    if (P) {
      const crowd = { x: 84, y: stripH + 34, w: W - 84 - 2, h: 236 };
      const cardY = crowd.y + crowd.h + 14;
      const notesY = cardY + 124;
      return { P, W, stripH, crowd, card: { x: 0, y: cardY, w: W }, notesY, H: notesY + (k === 1 ? 118 : k === 2 ? 52 : 0) + 26 };
    }
    const cw = Math.round(W * 0.56);
    const crowd = { x: 112, y: stripH + 40, w: cw - 112, h: 300 };
    return { P, W, stripH, crowd, card: { x: cw + 18, y: stripH + 24, w: W - cw - 18 }, notesY: stripH + 200, H: crowd.y + crowd.h + 40 };
  }

  stageHeight(st) { return this.geo(st).H; }

  cellsOf(g) {
    return cellsLayout(MEN, g.crowd, { row: (p) => (p.exposed ? 0 : 1), col: (p) => (p.ill ? 0 : 1), padTop: 28, gutter: g.P ? 8 : 14, minR: g.P ? 4.6 : 5, maxR: 9, gap: g.P ? 0.22 : 0.3 });
  }

  doorsOf(g) {
    const r = { x: g.crowd.x - (g.P ? 84 : 100), y: g.crowd.y + 4, w: g.crowd.w + (g.P ? 84 : 100), h: g.crowd.h - 4 };
    return groupsLayout(MEN, r, {
      groups: [{ key: true, label: '' }, { key: false, label: '' }],
      groupOf: (p) => p.ill, dir: 'col', gutter: 22, align: 'top', padTop: 64, maxR: 9, minR: 5,
      sort: (a, b) => Number(b.exposed) - Number(a.exposed),
    });
  }

  paint(st) {
    const k = this.stepIndex ?? 0, c = this.cf, g = this.geo(st), P = g.P, W = g.W;
    const split = k === 2 && c.split;
    const cells = this.cellsOf(g);
    this.lay = split ? this.doorsOf(g) : cells;
    this.cfTag = split ? 'doors' : 'table';
    // A replayed or narrated split flies from the cells; a cold landing is at rest.
    this.from = c.anim && k === 2 ? (split ? cells : this.doorsOf(g)) : null;
    this.people = MEN.map((p) => ({ ...p }));
    const anim = c.anim ? ' is-in' : '';
    c.anim = false;
    let svg = '', over = '';
    // The case strip.
    const later = k === 2 ? '<span class="cf-s cf-s--now">how was it collected?</span>' : '<span class="cf-s cf-s--todo">how did it come about?</span>';
    over += `<div class="cf-strip"${na('strip')} style="left:0;top:4px;width:${W}px"><span class="cf-s">20 cases</span><i>&gt;</i><span class="cf-s">60 controls</span><i>&gt;</i><span class="cf-s">14 of 20 vs 9 of 60</span><i>&gt;</i>`
      + `<span class="cf-s cf-s--new${k === 0 ? anim : ''}"${na('strip-or')}>OR 13.2 <small>714 / 54</small></span><i>&gt;</i>${later}<i>&gt;</i><span class="cf-s cf-s--todo"${na('strip-believe')}>can it be believed?</span></div>`;
    if (!split) {
      svg += rulesSvg(cells);
      const ar = cells.boxes.map((b) => b.area);
      over += lab(ar[0].x + ar[0].w / 2, ar[0].y - 8, 'with the tumour', 'cf-col', 'table');
      over += lab(ar[1].x + ar[1].w / 2, ar[1].y - 8, 'controls', 'cf-col', 'table');
      over += lab(ar[0].x - 10, ar[0].y + ar[0].h / 2, 'cleaned<br>tanks', 'cf-row', 'table');
      over += lab(ar[2].x - 10, ar[2].y + ar[2].h / 2, 'did not', 'cf-row', 'table');
      const diag = [true, false, false, true];
      cells.boxes.forEach((b, i) => { over += lab(b.area.x + b.area.w / 2, b.area.y + 14, `<i>${b.letter}</i> ${b.n}`, `cf-n${diag[i] ? ' cf-n--top' : ' cf-n--bot'}`, 'table'); });
      // Narration: one empty box round the whole table (heads, row labels, cells) carries the single outline of
      // a lit table; its labels, counts and dots keep none of their own (css). Invisible with narration off.
      const bx1 = Math.max(...ar.map((a) => a.x + a.w)) + 4, by0 = Math.min(...ar.map((a) => a.y)) - 32, by1 = Math.max(...ar.map((a) => a.y + a.h)) + 4;
      over += `<div class="cf-box"${na('table')} style="left:2px;top:${by0.toFixed(1)}px;width:${(bx1 - 2).toFixed(1)}px;height:${(by1 - by0).toFixed(1)}px"></div>`;
    } else {
      this.lay.boxes.forEach((b, i) => {
        const dx = b.area.x + 6, dy = b.area.y + 4;
        svg += door(dx, dy, 34, 52, i === 0 ? 'ward' : 'home');
        const t = i === 0 ? ['20 with the tumour', 'interviewed on the ward'] : ['60 controls', 'asked at home, by post'];
        over += `<div class="cf-dlab${anim}"${na(i === 0 ? 'ward' : 'home')} style="left:${(dx + 48).toFixed(1)}px;top:${(dy + 4).toFixed(1)}px"><b>${t[0]}</b><span>${t[1]}</span></div>`;
      });
    }
    // The ratio card: the payoff, largest thing on screen.
    const q = k === 2 ? '<span class="cf-q" aria-hidden="true">?</span>' : '';
    over += `<div class="cf-card${k === 0 ? anim : ''}${k === 2 ? ' is-q' : ''}"${na('card')} style="left:${g.card.x.toFixed(1)}px;top:${g.card.y}px;width:${g.card.w.toFixed(1)}px">`
      + `<span class="cf-k">odds ratio</span><b class="sim-numeral">${OR}</b><span class="cf-f"${na('formula')}>${A} ${X} ${D} over ${C} ${X} ${B} = ${A * D} / ${B * C}</span>${q}</div>`;
    if (k === 1) {
      over += `<div class="cf-notes${anim}" style="left:${g.card.x.toFixed(1)}px;top:${g.notesY}px;width:${g.card.w.toFixed(1)}px">`
        + `<p class="cf-yes"${na('strength')}>strong association</p><p class="cf-yes"${na('rare-note')}>rare disease: close to the relative risk <small>(last exercise)</small></p><p class="cf-open"${na('open')}>how did it come about?</p></div>`;
    } else if (k === 2) {
      over += `<div class="cf-notes cf-why${anim}"${na('why')} style="left:${g.card.x.toFixed(1)}px;top:${g.notesY}px;width:${g.card.w.toFixed(1)}px"><p>a ratio this large can be built by the way the data were collected</p></div>`;
    }
    over += `<p class="cf-illus"${na('illus')} style="left:0;top:${g.H - 22}px;width:${W}px">Illustrative: the plant and every count are invented for this course.</p>`;
    const legend = legendHtml({ items: [{ label: 'with the tumour', color: 'var(--sim-annot)', filled: true }, { label: 'control', color: 'var(--sim-label-muted)', filled: true }, { label: 'filled: cleaned the tanks', color: 'var(--sim-label)', filled: true }, { label: 'hollow: did not', color: 'var(--sim-label)', filled: false }] });
    const chip = k === 2
      ? flowChipHtml({ label: c.split ? 'Back to the table' : 'Split by how they were asked', action: 'split', icon: 'replay' })
      : flowChipHtml({ label: k === 0 ? 'File the ratio' : 'Weigh the number', action: 'replay', icon: 'replay' });
    return { svg, over, head: tagFirst(chip, '-') + tagFirst(legend, '-') };
  }

  animate() {
    crowdLive(this.live, `m${this.cf.gen}`, this.people, this.lay, { from: this.from, order: 'random', spread: 1.1 });
    tagLive(this.live, `m${this.cf.gen}`, this.people, (p) => (this.cfTag === 'table' ? 'table' : p.ill ? 'ward' : 'home'));
  }

  testState() { return { beat: this.stepIndex, split: this.stepIndex === 2 && this.cf.split, or: OR, a: A, b: B, c: C, d: D }; }

  css() {
    return SIM_CROWD_CSS + narrDotsCss(['table']) + `
.svs-head { gap: 8px 16px; }
.svs-head .scw-legend { font-size: 15px; flex-wrap: wrap; justify-content: center; }
.sflow-chip { min-height: 44px; font-size: 16px; }
.cf-lab { position: absolute; transform: translate(-50%, -50%); white-space: nowrap; font: 600 16px/1.2 var(--sim-font); color: var(--sim-label); }
.cf-col { transform: translate(-50%, -100%); font-weight: 700; font-size: 17px; }
.cf-row { transform: translate(-100%, -50%); text-align: right; font-weight: 700; line-height: 1.15; }
.cf-n { font: 700 18px/1 var(--sim-font); font-variant-numeric: tabular-nums; color: var(--sim-label-muted); }
.cf-n i { font: italic 500 15px/1 var(--sim-font); }
.cf-n--top { color: var(--sim-annot); }
.cf-strip { position: absolute; display: flex; flex-wrap: wrap; align-items: center; gap: 6px 6px; padding-bottom: 8px; border-bottom: 1px solid var(--sim-label-muted); font: 600 15px/1.25 var(--sim-font); color: var(--sim-label-muted); }
.cf-strip i { font-style: normal; }
.cf-s { padding: 2px 6px; border: 1.5px solid transparent; }
.cf-s small { font-size: 14px; font-weight: 600; }
.cf-s--new { color: var(--sim-annot); font-weight: 700; background: var(--sim-annot-tint); border-color: var(--sim-annot); }
.cf-s--todo { border: 1.5px dashed var(--sim-label-muted); opacity: 0.8; font-weight: 500; }
.cf-s--now { border: 1.5px dashed var(--sim-annot); color: var(--sim-annot); }
.cf-card { position: absolute; box-sizing: border-box; display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 8px 10px 10px;
  border-top: 2px solid var(--sim-annot); background: var(--sim-annot-tint); color: var(--sim-label); }
.cf-k { font: 700 16px/1.2 var(--sim-font); letter-spacing: 0.04em; color: var(--sim-label-muted); }
.cf-card b { font: 400 72px/1 var(--sim-font-numeral); color: var(--sim-annot); }
.cf-f { font: 600 16px/1.3 var(--sim-font); text-align: center; }
.cf-card.is-q b { opacity: 0.55; }
.cf-q { position: absolute; right: 10px; top: 6px; width: 48px; height: 48px; border-radius: 50%; border: 2.5px solid var(--sim-annot); display: flex; align-items: center; justify-content: center;
  font: 400 34px/1 var(--sim-font-numeral); color: var(--sim-annot); background: var(--sim-bg-surface); animation: cf-in 0.5s ease 0.8s both; }
.cf-notes { position: absolute; display: flex; flex-direction: column; gap: 6px; }
.cf-notes p { margin: 0; font: 600 16px/1.3 var(--sim-font); color: var(--sim-label); padding-left: 10px; border-left: 3px solid var(--sim-annot); }
.cf-notes small { display: block; font-size: 14px; font-weight: 500; color: var(--sim-label-muted); }
.cf-notes .cf-open { border: 1.5px dashed var(--sim-label-muted); border-left-width: 3px; padding: 4px 10px; color: var(--sim-label-muted); font-style: italic; }
.cf-why p { font-size: 17px; font-style: italic; border-left-color: var(--sim-annot); }
.cf-notes.is-in p { animation: cf-in 0.5s ease both; }
.cf-notes.is-in p:nth-child(2) { animation-delay: 0.7s; }
.cf-notes.is-in p:nth-child(3) { animation-delay: 1.4s; }
.cf-card.is-in { animation: cf-drop 0.7s cubic-bezier(.3,.8,.3,1) both; }
.cf-s--new.is-in { animation: cf-in 0.5s ease 0.6s both; }
.cf-dlab { position: absolute; display: flex; flex-direction: column; gap: 2px; white-space: nowrap; font: 600 16px/1.2 var(--sim-font); color: var(--sim-label-muted); }
.cf-dlab b { font-weight: 700; color: var(--sim-label); font-size: 17px; }
.cf-dlab.is-in { animation: cf-in 0.5s ease both; }
.cf-illus { position: absolute; margin: 0; text-align: center; font: italic 500 14px/1.2 var(--sim-font); color: var(--sim-label-muted); }
svg .cf-door rect { fill: var(--sim-bg-surface); stroke: var(--sim-label); stroke-width: 2; }
svg .cf-door line { stroke: var(--sim-label); stroke-width: 2.5; }
svg .cf-door circle { fill: var(--sim-label); }
/* Narrated: a lit table reads as one box (cf-box), not a box per label and count. Narration off: no match. */
.cf-box { position: absolute; pointer-events: none; }
#sim-canvas-host[data-narr-focus] .cf-box[data-narr] { outline-offset: 2px !important; border-radius: 8px !important; }
#sim-canvas-host[data-narr-focus] .cf-lab[data-narr~="table"] { outline: none !important; }
@keyframes cf-in { from { opacity: 0; } to { opacity: 1; } }
@keyframes cf-drop { from { opacity: 0; transform: translateY(-24px); } to { opacity: 1; transform: none; } }
.sim-dom-root--portrait .cf-card { padding: 4px 8px 8px; }
.sim-dom-root--portrait .cf-card b { font-size: 56px; }
.sim-dom-root--portrait .cf-strip { font-size: 14px; gap: 4px; }
.sim-dom-root--portrait .cf-row { font-size: 15px; }
.sim-dom-root--portrait .svs-head .scw-legend { font-size: 14px; gap: 4px 12px; }
@media (prefers-reduced-motion: reduce) { .cf-card, .cf-notes p, .cf-q, .cf-s--new, .cf-dlab { animation: none !important; } }
`;
  }
}
