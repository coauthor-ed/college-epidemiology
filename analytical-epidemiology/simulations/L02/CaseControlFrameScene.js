/**
 * CaseControlFrameScene - analytical-epidemiology L02 s02 "start from the disease, look back for the
 * exposure", on the DES study (Herbst 1971): 8 women with the cancer, controls chosen by the investigator
 * from girls born in the same hospital within days. One dot = one person: blue = case, grey = control.
 * Each row is one woman with her controls to her right, picked from the pool on the right.
 *   Beat 0 cases:  8 blue dots, an empty "controls: ?" area, the pool waiting; an arrow back in time.
 *   Beat 1 chosen: stepper "controls for each case 1 2 3 4"; controls fly from the pool into the rows;
 *                  "ill in this study" 8 of 16 = 50, 8 of 24 = 33, 8 of 32 = 25, 8 of 40 = 20 per cent.
 *                  Rest: 4 each, 32 controls (what Boston chose). Cues: controls -> 1 each, chosen -> 4.
 *   Beat 2 frame:  the 40 people line up under an EMPTY 2 x 2 (exposure not asked yet); then the letters
 *                  a b c d settle in the cells and the margins a + c = 8, b + d = 32, small, last.
 *   Beat 3 steps:  the four-step strip; the first two lit, "next: one at a time"; a tap on a step lights
 *                  the people it is about (1: the cases, 2: the controls, 3 and 4: all 40, the rest dimmed)
 *                  and the line above the steps names them. A second tap on the same step clears it.
 * Narration focus ids (beat 2 table): cells (all four), cell-a/b/c/d, row-e / row-u (row heads),
 * col-ac / col-bd (a column's two cells), margins, mar-ac / mar-bd, letters, ask, cases, controls.
 * Completion: beat 1 (controls stepper) and beat 3 (step tap) send scene-interact-done on each tap;
 * both beats are exploration (Done/Skip), so the signal never moves the narration on.
 * Exposure is not shown anywhere here (the DES answer is kept for s07), so every dot is a plain disc.
 */
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { SIM_CROWD_CSS, crowdLive, legendHtml, scatterLayout } from 'simulations/base/kit/SimCrowd.js';
import { withNarrationCues } from '../L01/NarrationCues.js';

const CASES = Array.from({ length: 8 }, (_, i) => ({ id: `k${i}`, ill: true, row: i }));
const CTRL = Array.from({ length: 32 }, (_, i) => ({ id: `c${i}`, ill: false, row: Math.floor(i / 4), j: i % 4 }));
const SPARE = Array.from({ length: 8 }, (_, i) => ({ id: `p${i}`, ill: false, spare: true }));
const POOL = [...CTRL, ...SPARE];
const MAP = [0, 1, 2, 3].map((i) => [{ idx: i, dwellMs: null }]);
const PCT = { 1: 50, 2: 33, 3: 25, 4: 20 };
// Narration focus (spec W1 D29n): data-narr ids on the parts; inert with narration off.
const hideTag = (html) => html.replace(/^<(\w+)/, '<$1 data-narr-hide=""');
const STEPS = ['Choose the cases', 'Choose the controls', 'Measure exposure the same way in both', 'Compare the two groups'];
// A tapped step names its people (beat 3): which dots it is about. 0 = cases, 1 = controls, 2-3 = both.
const ABOUT = ['step 1 is about the 8 cases', 'step 2 is about the 32 controls', 'step 3: all 40, asked the same way', 'step 4: the 8 cases against the 32'];

export class CaseControlFrameScene extends withNarrationCues(SvgScene) {
  static WIDTH = 680;
  static HEIGHT = 560;
  static PORTRAIT_WIDTH = 380;
  static PORTRAIT_HEIGHT = 640;
  static MIN_SCALE = 0.85;
  static SETTING = 'none';
  static BEAT_STEP_MAP = MAP;
  static CONTROLS = [];
  static CUES = ['cases', 'controls', 'chosen', 'frame', 'steps'];
  static ARIA_LABEL = 'A case-control study of the DES cancer, one dot per person. The 8 women with the cancer are the cases, in blue; the study looks back in time from them. Controls, in grey, are picked from girls born in the same hospital within days. A stepper sets the controls for each case: with 1 each, 8 of 16 people in the study are ill, 50 per cent; with 2, 8 of 24, 33 per cent; with 3, 8 of 32, 25 per cent; with 4, 8 of 40, 20 per cent. That share is your choice, not a rate of disease. Boston chose 4 for each case, 32 controls. Both groups are then asked the same question and fall into an empty 2 by 2 table: exposed cases a, exposed controls b, unexposed cases c, unexposed controls d; the margins a plus c, 8, and b plus d, 32, are the two groups chosen. Four steps: choose the cases, choose the controls, measure exposure the same way in both, compare.';

  enter(step) {
    this.cfK = step === 0 ? 0 : 4;
    this.cfPick = null;
  }

  geo(st) {
    const P = st.portrait, M = P ? 12 : 16;
    const g = { P, M, W: st.W, rowY: P ? 128 : 134, rowStep: P ? 27 : 34, r: P ? 10 : 11.5 };
    g.caseX = P ? 36 : 64;
    g.ctrlX = (j) => (P ? 94 + j * 32 : 158 + j * 38);
    g.pool = P ? { x: 228, y: g.rowY - 14, w: st.W - M - 228, h: 7 * g.rowStep + 28 } : { x: 330, y: g.rowY - 14, w: st.W - M - 330, h: 100 };
    g.rowsEnd = g.rowY + 7 * g.rowStep + g.r;
    return g;
  }

  stageHeight(st) { return st.portrait ? 548 : 476; }

  // The rows picture (beats 0, 1, 3): row i = case i at the left, her k controls to her right.
  rowsLayout(g, k, withPool) {
    const pos = new Map(), boxOf = new Map();
    for (const p of CASES) { pos.set(p.id, { x: g.caseX, y: g.rowY + p.row * g.rowStep }); boxOf.set(p.id, 'cases'); }
    const pr = g.P ? { x: g.pool.x, y: g.pool.y + 76, w: g.pool.w, h: g.pool.h - 76 } : g.pool;
    const scatter = withPool ? scatterLayout(POOL, pr, { seed: 7 }) : null;
    for (const p of POOL) {
      if (!p.spare && p.j < k) { pos.set(p.id, { x: g.ctrlX(p.j), y: g.rowY + p.row * g.rowStep }); boxOf.set(p.id, 'ctrl'); }
      else if (scatter) { pos.set(p.id, scatter.pos.get(p.id)); boxOf.set(p.id, 'pool'); }
    }
    return { r: g.r, step: g.rowStep, pos, boxOf, boxes: [], rules: [] };
  }

  // The frame picture (beat 2): table on top, cases under "cases", controls under "controls".
  frameGeo(g) {
    const P = g.P;
    const t = P ? { head: 96, c1: 104, c1w: 94, c2: 206, c2w: g.W - g.M - 206, top: 64, ch: 62 } : { head: 130, c1: 140, c1w: 184, c2: 336, c2w: g.W - g.M - 336, top: 64, ch: 70 };
    t.dotY = t.top + 30 + 2 * t.ch + (P ? 86 : 52); // portrait: the ask line wraps to three lines above the dots
    return t;
  }

  frameLayout(g) {
    const t = this.frameGeo(g), P = g.P, step = P ? 30 : 36, pos = new Map(), boxOf = new Map();
    const place = (list, cols, x0, w, key) => list.forEach((p, i) => {
      const c = i % cols, rr = Math.floor(i / cols), x = x0 + (w - (cols - 1) * step) / 2;
      pos.set(p.id, { x: x + c * step, y: t.dotY + rr * step }); boxOf.set(p.id, key);
    });
    place(CASES, P ? 3 : 4, t.c1, t.c1w, 'cases');
    place(CTRL, P ? 5 : 8, t.c2, t.c2w, 'ctrl');
    t.dotEnd = t.dotY + (P ? 6 : 3) * step + g.r;
    return { r: g.r, step, pos, boxOf, boxes: [], rules: [] };
  }

  paint(st) {
    const g = this.geo(st), s = this.stepIndex ?? 0, k = this.cfK ?? 0;
    let svg = this.timeSvg(g, s), over = '';
    if (s === 2) {
      this.lay = this.frameLayout(g);
      over += this.frameHtml(g);
    } else {
      this.lay = this.rowsLayout(g, s === 3 ? 4 : k, s < 3);
      over += this.rowLabels(g, s, k);
      if (s < 3) over += this.poolLabel(g, s);
      if (s === 1) over += this.readoutHtml(g, k);
      if (s === 3) over += this.stepsHtml(g);
      if (s === 0) svg += `<rect class="cf-empty" data-narr="controls" x="${g.ctrlX(0) - g.r - 6}" y="${g.rowY - g.r - 6}" width="${g.ctrlX(3) - g.ctrlX(0) + 2 * g.r + 12}" height="${g.rowsEnd - g.rowY + g.r + 12}" rx="6"/>`;
      svg += `<line class="cf-rule" x1="${g.caseX + g.r + 12}" y1="${g.rowY - 18}" x2="${g.caseX + g.r + 12}" y2="${g.rowsEnd + 6}"/>`;
    }
    const head = hideTag(legendHtml({ show: ['ill', 'well'], text: { ill: 'case: has the cancer', well: 'control: does not' } }));
    return { svg, over, head };
  }

  timeSvg(g, s) {
    const y = 26, x1 = g.M + 4, x2 = g.W - g.M - 4, on = s === 0 ? ' cf-time--on' : '';
    return `<g class="cf-time${on}"${s === 2 ? ' data-narr-hide=""' : ' data-narr="time"'}><line x1="${x2}" y1="${y}" x2="${x1 + 10}" y2="${y}"/><path d="M${x1} ${y} l14 -7 v14 z"/>`
      + `<text x="${x1}" y="${y - 12}">past: the exposure</text><text x="${x2}" y="${y - 12}" text-anchor="end">now: the disease</text>`
      + `<text class="cf-look" x="${(x1 + x2) / 2}" y="${y + 22}" text-anchor="middle">look back</text></g>`;
  }

  rowLabels(g, s, k) {
    const P = g.P, top = P ? 50 : 52, lit = this.cfPick;
    const caseW = P ? 74 : 106, ctrlX = g.ctrlX(0) - g.r, ctrlW = P ? 124 : 150;
    const dimC = lit === 1 ? ' cf-lab--dim' : '', dimK = lit === 0 ? ' cf-lab--dim' : '';
    const nCtl = s === 3 ? 32 : k * 8;
    const ctl = s === 0 ? 'controls: ?' : `controls: ${nCtl}`;
    const sub = s === 0 ? 'not yet chosen' : `${s === 3 ? 4 : k} for each case`;
    if (P) {
      return `<div class="cf-lab cf-lab--case cf-lab--line${dimC}" data-narr="cases" style="left:${g.M}px;top:58px;width:${g.W - 2 * g.M}px"><b>cases: 8 <span>women with the cancer</span></b></div>`
        + `<div class="cf-lab cf-lab--line${dimK}" data-narr="controls" style="left:${g.M}px;top:84px;width:${g.W - 2 * g.M}px"><b>${ctl} <span>${sub}</span></b></div>`;
    }
    return `<div class="cf-lab cf-lab--case${dimC}" data-narr="cases" style="left:${g.M}px;top:${top}px;width:${caseW}px"><b>cases: 8</b><span>women with the cancer</span></div>`
      + `<div class="cf-lab${dimK}" data-narr="controls" style="left:${ctrlX}px;top:${top}px;width:${ctrlW}px"><b>${ctl}</b><span>${sub}</span></div>`;
  }

  poolLabel(g, s) {
    const P = g.P;
    return `<div class="cf-lab cf-lab--pool${s === 0 ? '' : ' cf-lab--soft'}" data-narr="pool" style="left:${g.pool.x}px;top:${P ? g.pool.y : 52}px;width:${g.pool.w}px"><b>pool</b><span>${P ? 'same hospital, born within days' : 'girls born in the same hospital within days'}</span></div>`;
  }

  readoutHtml(g, k) {
    const P = g.P, x = P ? g.M : g.pool.x, y = P ? g.rowsEnd + 10 : g.pool.y + g.pool.h + 12, w = P ? g.W - 2 * g.M : g.pool.w;
    const tot = 8 + 8 * k;
    let btns = '';
    for (let n = 1; n <= 4; n++) btns += `<button type="button" class="cf-k${n === k ? ' cf-k--on' : ''}" data-k="${n}" aria-pressed="${n === k}">${n}</button>`;
    return `<div class="cf-read" style="left:${x}px;top:${y}px;width:${w}px">`
      + '<span class="cf-kick" data-narr="share">ill in this study</span>'
      + `<span class="cf-big" data-narr="share"><span class="cf-num">${k ? `8<small>of</small>${tot}` : '8<small>of</small>8'}</span><span class="cf-pct">= ${k ? PCT[k] : 100} per cent</span></span>`
      + '<span class="cf-cap" data-narr="choice">your choice, not a rate of disease</span>'
      + `<span class="cf-step" data-narr="stepper"><span class="cf-steplab">controls for each case</span><span class="cf-ks" role="group" aria-label="controls for each case">${btns}</span></span></div>`;
  }

  frameHtml(g) {
    const t = this.frameGeo(g), P = g.P, r0 = t.top + 30, rows = ['exposed', 'not exposed'], L = [['a', 'b'], ['c', 'd']];
    let h = `<div class="cf-th" data-narr="cases" style="left:${t.c1}px;top:${t.top}px;width:${t.c1w}px">cases</div><div class="cf-th" data-narr="controls" style="left:${t.c2}px;top:${t.top}px;width:${t.c2w}px">controls</div>`;
    rows.forEach((name, i) => {
      const y = r0 + i * t.ch;
      h += `<div class="cf-rh" data-narr="cells row-${i ? 'u' : 'e'}" style="left:${g.M}px;top:${y}px;width:${t.head - g.M - 6}px;height:${t.ch}px">${name}</div>`;
      [t.c1, t.c2].forEach((x, j) => {
        const w = j ? t.c2w : t.c1w;
        h += `<div class="cf-cell" data-narr="cells cell-${L[i][j]} col-${j ? 'bd' : 'ac'}" style="left:${x}px;top:${y}px;width:${w}px;height:${t.ch}px"><i class="cf-let" data-narr="letters" style="--d:${1.5 + (2 * i + j) * 0.25}s">${L[i][j]}</i><span class="cf-q">?</span></div>`;
      });
    });
    h += `<div class="cf-ask" data-narr="ask" style="left:${t.c1}px;top:${r0 + 2 * t.ch + 6}px;width:${t.c2 + t.c2w - t.c1}px">exposure: not asked yet, the same question for both groups</div>`;
    const my = t.dotY + (P ? 6 : 3) * (P ? 30 : 36) + g.r + 14;
    h += `<div class="cf-mar" data-narr="margins mar-ac" style="left:${t.c1}px;top:${my}px;width:${t.c1w}px"><i>a</i> + <i>c</i> = 8</div>`;
    h += `<div class="cf-mar" data-narr="margins mar-bd" style="left:${t.c2}px;top:${my}px;width:${t.c2w}px"><i>b</i> + <i>d</i> = 32</div>`;
    return h;
  }

  stepsHtml(g) {
    const P = g.P, x = P ? g.M : g.pool.x, y = P ? g.rowsEnd + 10 : g.rowY - 14, w = P ? g.W - 2 * g.M : g.pool.w;
    let h = `<div class="cf-steps${P ? ' cf-steps--grid' : ''}" style="left:${x}px;top:${y}px;width:${w}px"><span class="cf-next${this.cfPick != null ? ' cf-next--about' : ''}" data-narr="next">${this.cfPick != null ? ABOUT[this.cfPick] : 'next: one at a time'}</span>`;
    STEPS.forEach((txt, i) => {
      const on = this.cfPick === i;
      h += `<button type="button" class="cf-card${i < 2 ? ' cf-card--next' : ''}${on ? ' cf-card--on' : ''}" data-st="${i}" data-narr="step${i + 1}" aria-pressed="${on}"><span class="cf-no">${i + 1}</span><span>${txt}</span></button>`;
    });
    return h + '</div>';
  }

  animate() {
    if (!this.lay) return;
    const s = this.stepIndex ?? 0, pick = this.cfPick;
    const people = [...CASES, ...POOL].filter((p) => this.lay.pos.has(p.id)).map((p) => {
      const inPool = this.lay.boxOf.get(p.id) === 'pool';
      let dim = inPool && s !== 0 ? true : inPool ? false : false;
      if (s === 0 && !p.ill) dim = true;
      let lit = s === 0 && p.ill;
      if (s === 3 && pick != null) {
        const mine = pick === 0 ? p.ill : pick === 1 ? !p.ill : true;
        dim = !mine; lit = mine;
      }
      return { ...p, dim, lit };
    });
    crowdLive(this.live, 'cf', people, this.lay, { order: s === 1 ? 'x' : 'row' });
    for (const p of people) {
      const e = this.live.get(`cf|${p.id}`), n = p.ill ? 'cases' : this.lay.boxOf.get(p.id) === 'pool' ? 'pool' : 'controls';
      if (e && e.getAttribute('data-narr') !== n) e.setAttribute('data-narr', n);
    }
  }

  async setup() {
    await super.setup();
    this.cfListen = (e) => this.onClick(e);
    this.root.addEventListener('click', this.cfListen);
  }

  onClick(e) {
    const b = e.target?.closest?.('[data-k],[data-st]');
    if (!b) return;
    if (b.dataset.k && this.stepIndex === 1) { this.cfK = Number(b.dataset.k); this.interactDone('controls'); }
    else if (b.dataset.st && this.stepIndex === 3) { const i = Number(b.dataset.st); this.cfPick = this.cfPick === i ? null : i; this.interactDone('steps'); }
    else return;
    this.repaint();
  }

  applyCue(id) {
    if (this.stepIndex === 1 && (id === 'controls' || id === 'chosen')) { this.cfK = id === 'controls' ? 1 : 4; this.repaint(); }
  }

  cueBase() { return { k: this.cfK, pick: this.cfPick }; }

  cueReset(b) {
    this.cfK = b?.k ?? this.cfK;
    this.cfPick = b?.pick ?? null;
    this.repaint();
  }

  testState() { return { beat: this.stepIndex, perCase: this.cfK, controls: this.stepIndex === 0 ? 0 : 8 * (this.stepIndex === 1 ? this.cfK : 4), pick: this.cfPick }; }

  destroy() {
    this.root?.removeEventListener('click', this.cfListen);
    super.destroy();
  }

  css() {
    return SIM_CROWD_CSS + `
.svs-head { justify-content: flex-start; }
.cf-time line { stroke: var(--sim-label-muted); stroke-width: 1.5; }
.cf-time path { fill: var(--sim-label-muted); }
.cf-time text { font: 500 16px var(--sim-font); fill: var(--sim-label-muted); }
.cf-time .cf-look { font-weight: 700; }
.cf-time--on line { stroke: var(--sim-annot); stroke-width: 2.5; }
.cf-time--on path, .cf-time--on .cf-look { fill: var(--sim-annot); }
.cf-empty { fill: none; stroke: var(--sim-label-muted); stroke-width: 1.5; stroke-dasharray: 6 6; }
.cf-rule { stroke: var(--sim-label); stroke-width: 1; opacity: 0.25; }
.cf-lab { position: absolute; display: flex; flex-direction: column; gap: 2px; font: 500 var(--sim-text-md)/1.2 var(--sim-font); color: var(--sim-label-muted); transition: opacity 0.3s ease; }
.cf-lab b { font: 700 var(--sim-text-lg)/1.2 var(--sim-font); color: var(--sim-label); white-space: nowrap; }
.cf-lab--case b { color: var(--sim-annot); }
.cf-lab--line b span { font-weight: 500; color: var(--sim-label-muted); }
.cf-lab--dim, .cf-lab--soft { opacity: 0.45; }
.cf-read { position: absolute; display: flex; flex-direction: column; gap: 4px; }
.cf-kick { font: 700 var(--sim-text-md)/1.2 var(--sim-font); color: var(--sim-label); letter-spacing: 0.02em; }
.cf-big { display: flex; align-items: baseline; flex-wrap: nowrap; gap: 4px 12px; }
.cf-num { font: 400 60px/1 var(--sim-font-numeral, var(--sim-font)); font-variant-numeric: lining-nums tabular-nums; color: var(--sim-annot); white-space: nowrap; }
.cf-num small { font-size: 24px; margin: 0 8px; color: var(--sim-label-muted); }
.cf-pct { font: 400 26px/1 var(--sim-font-numeral, var(--sim-font)); color: var(--sim-label); white-space: nowrap; }
.cf-cap { font: 500 var(--sim-text-md)/1.3 var(--sim-font); color: var(--sim-label-muted); font-style: italic; }
.cf-step { display: flex; flex-direction: column; align-items: flex-start; gap: 6px; margin-top: 4px; }
.cf-steplab { font: 600 var(--sim-text-md)/1.2 var(--sim-font); color: var(--sim-label); }
.cf-ks { display: flex; gap: 6px; }
.cf-k { pointer-events: auto; width: 48px; height: 48px; border-radius: var(--sim-radius-sm); border: 1.5px solid var(--sim-label); background: var(--sim-bg-surface); color: var(--sim-label); font: 700 var(--sim-text-xl)/1 var(--sim-font); cursor: pointer; }
.cf-k--on { background: var(--sim-annot); border-color: var(--sim-annot); color: var(--sim-bg-surface); }
.cf-k:focus-visible, .cf-card:focus-visible { outline: 2px solid var(--sim-annot); outline-offset: 2px; }
.cf-th { position: absolute; text-align: center; font: 700 var(--sim-text-lg)/30px var(--sim-font); color: var(--sim-label); }
.cf-th:first-child { color: var(--sim-annot); }
.cf-rh { position: absolute; display: flex; align-items: center; justify-content: flex-end; text-align: right; font: 600 var(--sim-text-md)/1.2 var(--sim-font); color: var(--sim-label); }
.cf-cell { position: absolute; box-sizing: border-box; border: 1px solid color-mix(in oklab, var(--sim-label) 40%, transparent); margin: -0.5px; display: flex; align-items: center; justify-content: center; }
.cf-q { font: 400 34px/1 var(--sim-font-numeral, var(--sim-font)); color: var(--sim-label-muted); }
.cf-let { position: absolute; left: 10px; top: 6px; font: italic 700 var(--sim-text-xl)/1 var(--sim-font); color: var(--sim-annot); animation: cf-in 0.45s ease-out both; animation-delay: var(--d, 0s); }
.cf-ask { position: absolute; text-align: center; font: 500 var(--sim-text-md)/1.3 var(--sim-font); color: var(--sim-label-muted); font-style: italic; }
.cf-mar { position: absolute; text-align: center; font: 600 var(--sim-text-lg)/1.2 var(--sim-font); color: var(--sim-label); border-top: 1px solid var(--sim-label); padding-top: 6px; animation: cf-in 0.45s ease-out both; animation-delay: 2.6s; }
.cf-mar i { color: var(--sim-annot); }
.cf-steps { position: absolute; display: flex; flex-direction: column; gap: 8px; }
.cf-steps--grid { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 8px; }
.cf-steps--grid .cf-next { grid-column: 1 / -1; }
.cf-next { font: 700 var(--sim-text-md)/1.2 var(--sim-font); color: var(--sim-annot); }
.cf-next--about { padding: 4px 10px; border-radius: var(--sim-radius-sm); background: var(--sim-annot-tint); color: var(--sim-label); align-self: flex-start; }
.cf-card { pointer-events: auto; display: flex; align-items: center; gap: 12px; min-height: 56px; padding: 8px 12px; box-sizing: border-box; text-align: left; border: 1px solid color-mix(in oklab, var(--sim-label) 30%, transparent); border-radius: var(--sim-radius-sm); background: var(--sim-bg-surface); color: var(--sim-label-muted); font: 500 var(--sim-text-md)/1.25 var(--sim-font); cursor: pointer; }
.cf-card--next { color: var(--sim-label); border: 1.5px solid var(--sim-label); }
.cf-card--next .cf-no { background: var(--sim-annot); color: var(--sim-bg-surface); border-color: var(--sim-annot); }
.cf-card--on { border-left: 5px solid var(--sim-annot); background: var(--sim-annot-tint); }
.cf-no { flex: none; display: inline-flex; align-items: center; justify-content: center; width: 30px; height: 30px; border-radius: 50%; border: 1.5px solid var(--sim-label-muted); font: 700 var(--sim-text-md)/1 var(--sim-font); }
@keyframes cf-in { from { opacity: 0; transform: translateY(6px); } }
.sim-dom-root--portrait .cf-lab, .sim-dom-root--portrait .cf-cap, .sim-dom-root--portrait .cf-ask, .sim-dom-root--portrait .cf-card, .sim-dom-root--portrait .cf-rh, .sim-dom-root--portrait .cf-kick, .sim-dom-root--portrait .cf-steplab, .sim-dom-root--portrait .cf-next { font-size: 17px; }
.sim-dom-root--portrait .cf-time text { font-size: 17px; }
.sim-dom-root--portrait .cf-card { padding: 6px 8px; gap: 8px; min-height: 64px; }
.sim-dom-root--portrait .cf-num { font-size: 56px; }
@media (prefers-reduced-motion: reduce) { .cf-let, .cf-mar { animation: none; } }
`;
  }
}
