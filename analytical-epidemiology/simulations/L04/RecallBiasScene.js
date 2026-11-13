/**
 * RecallBiasScene - L04 s04 (illustrative numbers). One dot = one man. Blue = a case; grey = a control.
 * FILLED = reported the exposure; HOLLOW = did not. The exposure truly does nothing: 30 of 60 cases and 30 of 60
 * controls were exposed, odds ratio 1.00. Extra recall adds reported exposure among the CASES only:
 * extra = round(60 x points / 100) men (+10 points = 6 men), ringed while they stand.
 * Odds ratio = (a x d) / (b x c) = ((30 + e) x 30) / ((30 - e) x 30): +10 gives (36 x 30) / (24 x 30) = 1.50.
 *   beat 1 (cue wards)    the two groups: cases interviewed on the ward, controls by post; OR 1.00
 *   beat 2 (cue recall)   learner slides "extra recall among cases" 0 .. +20 points; case dots fill one by one,
 *                         the OR recomputes live; preset +10: 36 of 60, OR 1.50 large
 *   beat 3 (cue records)  a "personnel records" card; the extra fills drop away, slider locked
 *                         "records do not remember", OR back to 1.00
 */
import { SvgScene, backdropSvg } from 'simulations/base/kit/SimSvg.js';
import { applyToneInks } from 'simulations/base/kit/SimLookDom.js';
import { SIM_CROWD_CSS, crowdLive, groupsLayout, legendHtml } from 'simulations/base/kit/SimCrowd.js';
import { SIM_PANEL_CSS, sliderHtml, bindPanel } from 'simulations/base/kit/SimPanel.js';
import { withNarrationCues } from '../L01/NarrationCues.js';
import { na, tagEl, tagLive } from './NarrTags.js';

const N = 60, E0 = 30, B = 30, D = 30, MAXPTS = 20;
const X = '\u00d7';
const extraOf = (pts) => Math.round((N * pts) / 100);
const orOf = (e) => ((E0 + e) * D) / (B * (N - E0 - e));
// Cases: 0..29 exposed; 30.. the men whose answer recall can turn (they fill in this order). Controls: 0..29 exposed.
const MEN = [
  ...Array.from({ length: N }, (_, i) => ({ id: `c${i}`, ill: true, i })),
  ...Array.from({ length: N }, (_, i) => ({ id: `k${i}`, ill: false, i })),
];
const STEP_S = 0.16;

const lab = (x, y, html, cls = '', n = '') => `<span${na(n)} class="rb-lab ${cls}" style="left:${x.toFixed(1)}px;top:${y.toFixed(1)}px">${html}</span>`;

class RecallBiasBase extends SvgScene {}

export class RecallBiasScene extends withNarrationCues(RecallBiasBase) {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }], [{ idx: 2, dwellMs: null }]];
  static ARIA_LABEL = 'Illustrative study with no true effect: 30 of 60 cases and 30 of 60 controls report the exposure, odds ratio 1.00. Cases are interviewed on the ward, controls by post. A slider adds extra recall among cases only: at plus 10 points six more cases report exposure, 36 of 60, and the odds ratio is 36 times 30 over 24 times 30, 1.50. Personnel records remove the extra reports and the ratio returns to 1.00.';
  static CONTROLS = [];
  static SETTING = 'none';
  static HEIGHT = 620;
  static PORTRAIT_HEIGHT = 700;
  static CUES = ['wards', 'recall', 'records'];

  async setup() {
    this.rb = { pts: 0, shown: 0, pumping: false, wards: false, keep: false, headHtml: null, came: null, last: null, gen: 0 };
    await super.setup();
    bindPanel(this.root, {
      input: (name, v) => {
        if (name !== 'recall' || this.stepIndex === 2) return;
        const t = this.rb;
        t.pts = Math.max(0, Math.min(MAXPTS, Number(v) || 0));
        const out = this.root.querySelector('[data-spn="recall-val"]');
        if (out) out.textContent = `+${t.pts} points`;
        t.keep = true;
        this.pump();
        this.interactDone?.('recall');
      },
    });
  }

  enter(step) {
    const t = this.rb;
    t.came = t.last != null && Math.abs(t.last - step) === 1 ? t.last : null;
    t.last = step;
    t.keep = false; t.pumping = false; t.wards = step === 0;
    t.pts = step === 1 ? 10 : 0;
    // The picture rests on the beat's finished state; arriving from the next-door beat, the change plays.
    if (t.narr && step === 1) { t.pts = 0; t.shown = 0; }
    else if (t.narr && step === 2) t.shown = extraOf(10);
    else if (step === 1 && t.came === 0) { t.shown = 0; this.after(0.4, () => this.pump()); }
    else if (step === 2 && t.came === 1) { t.shown = extraOf(10); this.after(0.6, () => this.pump()); }
    else t.shown = extraOf(t.pts);
    this.after(3, () => { t.wards = false; });
  }

  stageHeight(st) { return st.portrait ? 536 : 470; }

  pump() {
    const t = this.rb;
    if (t.pumping) return;
    const go = () => {
      const target = extraOf(t.pts);
      if (t.shown === target) { t.pumping = false; return; }
      t.shown += t.shown < target ? 1 : -1;
      this.repaint();
      this.after(STEP_S, go);
    };
    t.pumping = true;
    go();
  }

  applyCue(id) {
    const t = this.rb, k = this.stepIndex;
    if (id === 'wards' && k === 0) { t.wards = true; this.repaint(); }
    else if (id === 'recall' && k === 1) { t.pts = 10; t.shown = 0; t.pumping = false; this.repaint(); this.after(0.2, () => this.pump()); }
    else if (id === 'records' && k === 2) { t.pts = 0; t.shown = extraOf(10); t.pumping = false; this.repaint(); this.after(0.3, () => this.pump()); }
  }

  cueBase() { return null; }
  cueReset() {
    const t = this.rb, k = this.stepIndex;
    t.pts = k === 1 && !t.narr ? 10 : 0; t.shown = t.narr && k === 2 ? extraOf(10) : extraOf(t.pts); t.pumping = false; t.wards = false; this.repaint();
  }

  // Narrated (spec W1 D29n): beat 2 opens at +0 and beat 3 on the +10 picture; the recall and records cues
  // play the change at their words, not a timer at the beat start.
  narrationFocus(st) {
    const t = this.rb;
    if (!t) return;
    const was = t.narr, k = this.stepIndex;
    t.narr = !!st?.narrated;
    if (!t.narr || was || t.keep) return;
    if (k === 1 && !this._nc?.applied?.has('recall')) { t.pts = 0; t.shown = 0; t.pumping = false; this.repaint(); }
    else if (k === 2 && !this._nc?.applied?.has('records')) { t.pts = 0; t.shown = extraOf(10); t.pumping = false; this.repaint(); }
  }

  // Overridden only so the slider under the learner's finger is not rebuilt while it moves.
  repaint() {
    if (!this.sv) return;
    this.sv.measure();
    const out = this.paint(this.sv) ?? {};
    const h = out.head ?? '';
    if (!this.rb.keep && h !== this.rb.headHtml) { this._head.innerHTML = h; this.rb.headHtml = h; }
    this.sv.render(out.svg ?? '', out.over ?? '', backdropSvg(this.sv, { seed: 3 + this.stepIndex, floorY: out.floor }));
    applyToneInks(this.root);
    if (typeof this.animate === 'function') { this.live.reset(); this._liveFrame(); }
    this.relayout();
  }

  paint(st) {
    const k = this.stepIndex, t = this.rb, P = st.portrait, W = st.W;
    const e = t.shown, or = orOf(e);
    const rect = P ? { x: 14, y: 70, w: W - 28, h: 206 } : { x: 18, y: 84, w: 404, h: 300 };
    const lay = groupsLayout(MEN, rect, {
      groups: [{ key: true, label: '' }, { key: false, label: '' }], groupOf: (p) => p.ill, dir: 'row', gutter: P ? 26 : 34,
      align: 'top', cols: 6, maxR: 9.5, gap: 0.42, sort: (a, b) => a.i - b.i,
    });
    this.lay = lay;
    this.people = MEN.map((p) => {
      const extra = p.ill && p.i >= E0 && p.i < E0 + e;
      return { ...p, exposed: p.i < E0 || extra, mark: extra ? 'ring' : undefined };
    });
    let svg = '', over = '';
    const ar = lay.boxes.map((b) => b.area ?? b);
    const head = (a, n, how, cls) => lab(a.x + a.w / 2, rect.y - 40, `<b>${n}</b><span${na('how')} class="rb-how${t.wards ? ' rb-how--lit' : ''}">${how}</span>`, `rb-head ${cls}`, cls === 'case' ? 'cases' : 'controls');
    over += head(ar[0], '60 cases', 'interviewed on the ward', 'case');
    over += head(ar[1], '60 controls', 'asked by post', 'con');
    const yr = rect.y + rect.h + 18;
    const rep = P ? (n, c) => `<b class="rb-n${c}">${n}</b> of 60 report it` : (n, c) => `report exposure: <b class="rb-n${c}">${n}</b> of 60`;
    over += lab(ar[0].x + ar[0].w / 2, yr, rep(E0 + e, ' case'), 'rb-rep', k === 0 ? '-' : 'cases');
    over += lab(ar[1].x + ar[1].w / 2, yr, rep(B, ''), 'rb-rep', k === 0 ? '-' : 'controls');
    // The reading: the odds ratio, the largest thing on screen.
    const read = `<div${na(k === 0 ? '-' : 'or')} class="rb-read"><span class="rb-k">odds ratio</span><b class="sim-numeral rb-big${e ? ' rb-big--up' : ''}">${or.toFixed(2)}</b>`
      + `<span class="rb-f">(${E0 + e} ${X} ${D}) / (${N - E0 - e} ${X} ${B})</span></div>`;
    // The card fades in once per visit; later repaints (the count pump) keep it still, not re-fading.
    const card = k === 2
      ? `<div data-narr="records" class="rb-card${t.cardIn ? ' rb-card--still' : ''}"><b>Personnel records</b><span>written at the time, not remembered</span></div>`
      : '';
    t.cardIn = k === 2;
    over += P
      ? `<div class="rb-col rb-col--p" style="left:14px;right:14px;top:${yr + 30}px">${read}${card}</div>`
      : `<div class="rb-col" style="left:448px;right:12px;top:${rect.y - 10}px">${read}${card}</div>`;
    const legend = legendHtml({ items: [{ label: 'case', color: 'var(--sim-annot)', filled: true }, { label: 'control', color: 'var(--sim-label-muted)', filled: true }, { label: P ? 'filled: reports it' : 'filled: reports exposure', color: 'var(--sim-label)', filled: true }, { label: P ? 'hollow: not' : 'hollow: does not', color: 'var(--sim-label)', filled: false }] })
      + `<span class="rb-ringkey"><svg viewBox="-9 -9 18 18" aria-hidden="true"><circle r="4.5" class="rb-k-dot"/><circle r="7.6" class="rb-k-ring"/></svg>${P ? 'ringed: recall' : 'ringed: added by recall'}</span>`;
    over += `<div${na('-')} class="rb-legend" style="top:${st.H - (P ? 30 : 26)}px">${legend}</div>`;
    const locked = k === 2;
    const slider = sliderHtml({
      action: 'recall', label: locked ? 'Records do not remember' : 'Extra recall among cases', min: 0, max: MAXPTS, step: 1,
      value: locked ? 0 : t.pts, valueText: locked ? 'locked at 0' : `+${t.pts} points`, ticks: ['0', '+10', '+20'], disabled: locked,
      aria: locked ? 'locked at 0' : `plus ${t.pts} percentage points`,
    });
    return { svg, over, head: `<div${na(k === 1 ? 'slider' : '-')} class="spn rb-ctl">${slider}</div>` };
  }

  animate() {
    const key = `m${this.rb.gen}`;
    crowdLive(this.live, key, this.people, this.lay, {});
    tagLive(this.live, key, this.people, (p) => (p.ill ? 'cases' : 'controls'));
    tagEl(this.live.get(`${key}|marks`), 'cases');
  }

  testState() {
    const t = this.rb;
    return { stage: this.stepIndex, points: t.pts, extra: t.shown, a: E0 + t.shown, c: N - E0 - t.shown, or: orOf(t.shown).toFixed(2) };
  }

  css() {
    return SIM_CROWD_CSS + SIM_PANEL_CSS + `
/* Narrated focus: group labels light by brightness, not by a ring each (spec W1 D29n). */
.rb-head[data-narr], .rb-rep[data-narr] { outline: none !important; }
.svs-head { min-height: 0; }
.rb-ctl { width: min(100%, 440px); gap: 0; }
.rb-ctl .spn-slider__head { font-size: 16px; }
.rb-ctl .spn-label { font-size: 16px; }
.rb-ctl .spn-slider__val { font-size: 18px; font-weight: 700; }
.rb-ctl input[type=range] { min-height: 44px; }
.rb-ctl .spn-slider__ticks { font-size: 14px; }
.rb-lab { position: absolute; transform: translate(-50%, -50%); white-space: nowrap; font: 600 16px/1.2 var(--sim-font); color: var(--sim-label); }
.rb-head { display: flex; flex-direction: column; align-items: center; gap: 2px; transform: translate(-50%, -50%); }
.rb-head b { font-size: 19px; font-weight: 700; }
.rb-head.case b { color: var(--sim-annot); }
.rb-how { font-size: 16px; font-weight: 600; color: var(--sim-label-muted); padding: 1px 6px; transition: background 0.4s ease, color 0.4s ease; }
.rb-how--lit { color: var(--sim-label); background: var(--sim-annot-tint); }
.rb-rep { font-weight: 600; color: var(--sim-label-muted); }
.rb-n { font: 400 26px/1 var(--sim-font-numeral); color: var(--sim-label); }
.rb-n.case { color: var(--sim-annot); }
.rb-col { position: absolute; display: flex; flex-direction: column; gap: 16px; }
.rb-col--p { flex-direction: row; align-items: flex-start; justify-content: space-between; gap: 12px; }
.rb-read { display: flex; flex-direction: column; gap: 10px; border-top: 1px solid var(--sim-label); padding-top: 8px; }
.rb-k { font: 700 16px/1.2 var(--sim-font); color: var(--sim-label-muted); }
.rb-big { font: 400 96px/1 var(--sim-font-numeral); color: var(--sim-label); transition: color 0.4s ease; }
.rb-big--up { color: var(--sim-annot); }
.rb-f { font: 600 17px/1.3 var(--sim-font); color: var(--sim-label); font-variant-numeric: tabular-nums; white-space: nowrap; }
.rb-card { display: flex; flex-direction: column; gap: 4px; padding: 10px 12px; border: 1.5px solid var(--sim-label); border-top-width: 4px; background: var(--sim-bg-deep); font: 500 15px/1.3 var(--sim-font); color: var(--sim-label-muted); animation: rb-in 0.5s ease both; }
.rb-card b { font-size: 17px; color: var(--sim-label); }
@keyframes rb-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
.rb-legend { position: absolute; left: 0; right: 0; display: flex; flex-wrap: wrap; justify-content: center; gap: 4px 14px; transform: translateY(-50%); }
.rb-legend .scw-legend { font-size: 15px; justify-content: center; }
.rb-ringkey { display: inline-flex; align-items: center; gap: 6px; font: 500 15px/1.2 var(--sim-font); color: var(--sim-label-muted); }
.rb-ringkey svg { width: 18px; height: 18px; overflow: visible; }
.rb-k-dot { fill: var(--sim-label); }
.rb-k-ring { fill: none; stroke: var(--sim-label); stroke-width: 2; }
.sim-dom-root--portrait .rb-big { font-size: 66px; }
.sim-dom-root--portrait .rb-read { gap: 4px; }
.sim-dom-root--portrait .rb-legend { gap: 2px 10px; }
.sim-dom-root--portrait .rb-legend .scw-legend { gap: 2px 10px; }
.sim-dom-root--portrait .rb-card { max-width: 160px; }
.rb-card--still { animation: none; }
@media (prefers-reduced-motion: reduce) { .rb-card { animation: none; } }
`;
  }
}
