/**
 * DirectionOfInquiryScene - L01 s05, Fig. 8 as one picture of time (rebuilt 2026-11-05, editorial panel).
 * Time runs left to right on one stage for both designs: exposure boxes on the left (earlier), disease
 * boxes on the right (later). Each dot is one person; its place is a pure function of the time handle,
 * so nothing moves until the learner drags. Cohort: the study starts on the left, with people free of
 * the disease grouped by exposure, and the handle goes forward; a person who falls ill takes the signature
 * colour on arrival. Case-control: the study starts on the right, with cases (signature colour) and
 * controls, and the handle goes back to find their exposure. The box the study starts from is outlined in
 * the signature colour; the end it has not reached yet is dashed with a "?". From beat 2 the direction-of-
 * inquiry arrow sits over the stage: with time for a cohort, against it for a case-control study.
 *   Beat 0: read only, cohort, one person ringed: each person is studied, the conclusion is about the population.
 *   Beat 1: design chips and the time handle go live.  Beat 2: the inquiry arrow.  Beat 3: the two questions.
 * Numbers (illustrative dots, no counts on screen): cohort 12 people, 6 exposed (3 fall ill), 6 not exposed
 * (1 falls ill); case-control 8 people, 4 cases (3 exposed), 4 controls (1 exposed).
 * Narrated (spec W1 D15), from beat 2 on (beat 1 is read only and ignores cues): cue cohort switches to the
 * cohort and sweeps the time handle forward; case-control switches and sweeps it back; compare runs the
 * cohort sweep and then the case-control sweep, so the two directions are seen one after the other. A sweep
 * is the same pure function of the handle the learner drags; a drag takes over at once. Replay and scrub
 * re-derive the picture from the beat time (NarrationCues.js). Beats 2-3 send scene-interact-done the first
 * time the learner drags a design to its far end.
 */
import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { esc } from 'simulations/base/SimUi.js';
import { SIM_PANEL_CSS, chipsHtml, promptHtml, bindPanel } from 'simulations/base/kit/SimPanel.js';
import { withNarrationCues } from './NarrationCues.js';

/** One narrated sweep of the time handle, ms; the pause between the two sweeps of compare. */
const SWEEP_MS = 2400;
const GAP_MS = 700;

const COHORT = [
  ...[1, 1, 1, 0, 0, 0].map((d) => ({ e: 1, d })),
  ...[1, 0, 0, 0, 0, 0].map((d) => ({ e: 0, d })),
];
const CASECONTROL = [
  ...[1, 1, 1, 0].map((e) => ({ d: 1, e })),
  ...[1, 0, 0, 0].map((e) => ({ d: 0, e })),
];
const DESIGNS = {
  cohort: { label: 'Cohort', start: 'left', people: COHORT, right: ['Disease', 'No disease'], sub: ['', ''],
    inquiry: 'Direction of inquiry: from cause to effect', go: 'Drag the time handle forward, from exposure to disease', done: 'Followed forward: who fell ill is now known' },
  cc: { label: 'Case-control', start: 'right', people: CASECONTROL, right: ['Cases', 'Controls'], sub: ['with the disease', 'without it'],
    inquiry: 'Direction of inquiry: from effect back to cause', go: 'Drag the time handle back, from disease to exposure', done: 'Traced back: each person\'s exposure is now known' },
};

const CSS = SIM_PANEL_CSS + `
.doi { gap: 10px; }
.doi-top { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px 12px; min-height: 42px; }
.doi-top .spn-btns { gap: 8px; }
.doi-note { margin: 0; font-size: var(--sim-text-md); line-height: 1.45; color: var(--sim-label); }
.doi-svg { display: block; width: 100%; height: auto; overflow: visible; }
.doi-svg text { font-family: var(--sim-font); font-size: 15px; fill: var(--sim-label); }
.doi-svg .doi-t-sm { font-size: 14px; fill: var(--sim-label-muted); }
.doi-svg .doi-t-b { font-weight: 700; }
.doi-svg .doi-t-annot { fill: var(--sim-annot); font-weight: 700; }
.doi-box { fill: var(--sim-bg-surface); stroke: color-mix(in oklab, var(--sim-label) 40%, transparent); stroke-width: 1.5; }
.doi-box.is-start { stroke: var(--sim-annot); stroke-width: 2.5; fill: color-mix(in oklab, var(--sim-annot-tint) 55%, var(--sim-bg-surface)); }
.doi-box.is-unknown { stroke-dasharray: 5 4; fill: transparent; }
.doi-guide { stroke: var(--sim-track); stroke-width: 1; stroke-dasharray: 2 5; }
.doi-dot { fill: var(--sim-series-8); stroke: var(--sim-bg-deep); stroke-width: 1.5; transition: fill 0.25s ease; }
.doi-dot.is-ill { fill: var(--sim-annot); }
.doi-ring { fill: none; stroke: var(--sim-annot); stroke-width: 2; }
.doi-arrow { stroke: var(--sim-annot); stroke-width: 3; fill: none; stroke-linecap: round; }
.doi-head { fill: var(--sim-annot); }
.doi-arrow--time { stroke: var(--sim-label); stroke-width: 2; }
.doi-head--time { fill: var(--sim-label); }
.doi-time { display: flex; flex-direction: column; gap: 0; }
.doi-time input[type="range"] { -webkit-appearance: none; appearance: none; width: 100%; height: 30px; margin: 0; background: transparent; cursor: pointer; touch-action: pan-y; }
.doi-time input[type="range"]::-webkit-slider-runnable-track { height: 3px; background: var(--sim-track); }
.doi-time input[type="range"]::-moz-range-track { height: 3px; background: var(--sim-track); }
.doi-time input[type="range"]::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 24px; height: 24px; margin-top: -10.5px; border-radius: 50%;
  background: var(--sim-annot); border: 4px solid var(--sim-bg-surface); box-shadow: 0 0 0 1.5px var(--sim-annot); }
.doi-time input[type="range"]::-moz-range-thumb { width: 16px; height: 16px; border-radius: 50%; background: var(--sim-annot); border: 4px solid var(--sim-bg-surface); box-shadow: 0 0 0 1.5px var(--sim-annot); }
.doi-time input[type="range"]:focus-visible { outline: 2px solid var(--sim-annot); outline-offset: 2px; }
.doi-time input[type="range"]:disabled { cursor: default; opacity: 0.45; }
.doi-q { display: grid; grid-template-columns: auto minmax(0, 1fr) minmax(0, 1fr); align-items: baseline; gap: 4px 16px; margin: 0; padding: 8px 0; border-top: 1px solid var(--sim-label); border-bottom: 1px solid var(--sim-label); }
.doi-q b { font-size: var(--sim-text-md); }
.doi-q span { font-size: var(--sim-text-lg); font-weight: 700; color: var(--sim-label); }
.sim-dom-root--portrait .doi-q { grid-template-columns: minmax(0, 1fr); }
`;

const clamp01 = (v) => Math.max(0, Math.min(1, v));
const ease = (u) => (u < 0.5 ? 2 * u * u : 1 - Math.pow(-2 * u + 2, 2) / 2);

export class DirectionOfInquiryScene extends withNarrationCues(DomSimulation) {
  static SETTING = 'none';
  static LAYOUT = 'fit';
  static WIDTH = 560;
  static HEIGHT = 520;
  static PORTRAIT_WIDTH = 360;
  static PORTRAIT_HEIGHT = 570;
  static CONTROLS = [];
  static BEAT_STEP_MAP = [
    [{ idx: 0, dwellMs: null }], // read only: each person studied, conclusion about the population
    [{ idx: 1, dwellMs: null }], // design chips + time handle live
    [{ idx: 2, dwellMs: null }], // direction-of-inquiry arrow
    [{ idx: 3, dwellMs: null }], // both ask the same two questions
  ];
  static ARIA_LABEL = 'Figure 8 as one picture of time, running left to right: exposure boxes on the left, disease boxes on the right, each dot one person. In a cohort study the study starts from exposure and the time handle is dragged forward until disease appears. In a case-control study it starts from cases and controls and the handle is dragged back to find their exposure. The direction of inquiry runs with time for a cohort and against time for a case-control study.';

  async setup() {
    this._design = 'cohort';
    this._p = 0;
    this._reached = false;
    await super.setup();
    this.render({ css: CSS, rootClass: 'spn-page', html: '' });
    bindPanel(this.root, { action: (n, v) => this._act(n, v), input: (n, v) => this._onTime(v) });
    this._paint();
  }

  onStep(step) {
    this._stopSweep();
    this._ncSent = false;
    if (step === 0) { this._design = 'cohort'; this._p = 0; this._reached = false; }
    this._paint();
  }

  // ---- narration cues ----
  static CUES = ['cohort', 'case-control', 'compare'];

  cueBase() { return { design: this._design, p: this._p, reached: this._reached }; }

  cueReset(base) {
    this._stopSweep();
    if (!base) return;
    const repaint = base.design !== this._design;
    this._design = base.design; this._p = base.p; this._reached = base.reached;
    if (repaint) this._paint(); else this._moveDots();
  }

  /** ms: how long ago the cue was due, so a re-applied cue lands where the sweep would be by now. */
  applyCue(id, ms = 0) {
    if (!this._live()) return;
    const plan = id === 'cohort' ? [['cohort', 0]] : id === 'case-control' ? [['cc', 0]]
      : id === 'compare' ? [['cohort', 0], ['cc', SWEEP_MS + GAP_MS]] : null;
    if (!plan) return;
    this._stopSweep();
    const sw = { plan, t0: performance.now() - Math.max(0, ms), raf: null, k: -1 };
    this._sweep = sw;
    const frame = () => {
      if (this._sweep !== sw || !this.root) return;
      const el = performance.now() - sw.t0;
      let k = 0;
      for (let i = 0; i < plan.length; i++) if (el >= plan[i][1]) k = i;
      const [design, at] = plan[k];
      if (k !== sw.k) { sw.k = k; this._setDesign(design); }
      const u = Math.max(0, Math.min(1, (el - at) / SWEEP_MS));
      const D = DESIGNS[design];
      this._setTime(D.start === 'left' ? 100 * ease(u) : 100 - 100 * ease(u));
      if (k === plan.length - 1 && u >= 1) { this._sweep = null; return; }
      this.animateFor?.(400);
      sw.raf = requestAnimationFrame(frame);
    };
    frame();
  }

  destroy() {
    this._stopSweep();
    super.destroy();
  }

  _stopSweep() {
    if (this._sweep?.raf != null) cancelAnimationFrame(this._sweep.raf);
    this._sweep = null;
  }

  _setDesign(v) {
    this._design = v;
    this._p = DESIGNS[v].start === 'left' ? 0 : 100;
    this._reached = false;
    this._paint();
  }

  /** The handle at p (0..100): dots, boxes, prompt and the range input itself. */
  _setTime(p) {
    this._p = Math.max(0, Math.min(100, p));
    const D = DESIGNS[this._design];
    if ((D.start === 'left' && this._p >= 98) || (D.start === 'right' && this._p <= 2)) this._reached = true;
    const inp = this.root?.querySelector('input[data-spn-input="time"]');
    if (inp) inp.value = String(Math.round(this._p));
    this._moveDots();
  }

  _live() { return (this.stepIndex ?? 0) >= 1; }

  _act(name, v) {
    if (name !== 'design' || !this._live() || !DESIGNS[v] || v === this._design) return;
    this._stopSweep();
    this._design = v;
    this._p = DESIGNS[v].start === 'left' ? 0 : 100;
    this._reached = false;
    this._paint();
  }

  _onTime(v) {
    if (!this._live()) return;
    this._stopSweep();
    this._p = Math.max(0, Math.min(100, Number(v) || 0));
    const D = DESIGNS[this._design];
    if ((D.start === 'left' && this._p >= 98) || (D.start === 'right' && this._p <= 2)) this._reached = true;
    this._moveDots();
    if (this._reached && !this._ncSent) { this._ncSent = true; this.interactDone(`b${(this.stepIndex ?? 0) + 1}`); }
  }

  // Geometry in SVG units: landscape 520 wide, portrait 330 wide.
  _geo() {
    const port = !!this._isPortrait;
    const W = port ? 330 : 520, bw = port ? 112 : 150, top = 28, bh = port ? 88 : 80, gap = 16;
    const H = top + 2 * bh + gap + 4;
    const left = 0, right = W - bw;
    const boxes = { L0: { x: left, y: top, w: bw, h: bh }, L1: { x: left, y: top + bh + gap, w: bw, h: bh },
      R0: { x: right, y: top, w: bw, h: bh }, R1: { x: right, y: top + bh + gap, w: bw, h: bh } };
    return { W, H, bw, bh, boxes, port };
  }

  _slot(box, k, g) {
    const per = g.port ? 5 : 6, sp = g.port ? 18 : 20;
    const col = k % per, row = Math.floor(k / per);
    const x0 = box.x + (box.w - (per - 1) * sp) / 2;
    return { x: x0 + col * sp, y: box.y + box.h - 22 - row * 20 };
  }

  _people(g) {
    const D = DESIGNS[this._design];
    const nL = [0, 0], nR = [0, 0];
    return D.people.map((q, i) => {
      const li = q.e ? 0 : 1, ri = q.d ? 0 : 1;
      const a = this._slot(g.boxes[`L${li}`], nL[li]++, g), b = this._slot(g.boxes[`R${ri}`], nR[ri]++, g);
      return { ...q, i, a, b };
    });
  }

  _pos(person, n) {
    const u = this._p / 100;
    const lag = 0.18 * (person.i / Math.max(1, n - 1));
    const D = DESIGNS[this._design];
    // Cohort dots leave the left a little apart; case-control dots leave the right a little apart.
    const t = D.start === 'left' ? clamp01((u - lag) / (1 - 0.18)) : 1 - clamp01(((1 - u) - lag) / (1 - 0.18));
    const e = ease(t);
    return { x: person.a.x + (person.b.x - person.a.x) * e, y: person.a.y + (person.b.y - person.a.y) * e - Math.sin(Math.PI * e) * 10, t };
  }

  _ill(person, t) {
    return person.d === 1 && (this._design === 'cc' || t > 0.6);
  }

  _boxState(g) {
    const D = DESIGNS[this._design], u = this._p / 100;
    const startL = D.start === 'left';
    const leftKnown = startL || u <= 0.12, rightKnown = !startL || u >= 0.88;
    return { L: startL ? 'is-start' : leftKnown ? '' : 'is-unknown', R: !startL ? 'is-start' : rightKnown ? '' : 'is-unknown', leftKnown, rightKnown };
  }

  _arrow(x1, x2, y, cls) {
    const dir = x2 > x1 ? 1 : -1, hx = x2, tip = 9;
    return `<line class="doi-arrow ${cls}" x1="${x1}" y1="${y}" x2="${hx - dir * tip}" y2="${y}"/>`
      + `<path class="doi-head ${cls === 'doi-arrow--time' ? 'doi-head--time' : ''}" d="M${hx} ${y} L${hx - dir * (tip + 3)} ${y - 6} L${hx - dir * (tip + 3)} ${y + 6} Z"/>`;
  }

  _stageSvg() {
    const g = this._geo(), D = DESIGNS[this._design], s = this.stepIndex ?? 0;
    const bs = this._boxState(g);
    const labels = { L0: 'Exposed', L1: 'Not exposed', R0: D.right[0], R1: D.right[1] };
    let out = '';
    // faint guides between the two ends of time
    for (const a of ['L0', 'L1']) for (const b of ['R0', 'R1']) {
      const A = g.boxes[a], B = g.boxes[b];
      out += `<line class="doi-guide" x1="${A.x + A.w}" y1="${A.y + A.h / 2}" x2="${B.x}" y2="${B.y + B.h / 2}"/>`;
    }
    for (const k of ['L0', 'L1', 'R0', 'R1']) {
      const b = g.boxes[k], side = k[0];
      const st = side === 'L' ? bs.L : bs.R;
      const known = side === 'L' ? bs.leftKnown : bs.rightKnown;
      out += `<rect class="doi-box ${st}" x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="4"/>`;
      out += `<text class="doi-t-b" x="${b.x + 10}" y="${b.y + 21}">${esc(labels[k])}${known ? '' : ' ?'}</text>`;
      const sub = side === 'R' ? D.sub[Number(k[1])] : '';
      if (sub) out += `<text class="doi-t-sm" x="${b.x + 10}" y="${b.y + 39}">${esc(sub)}</text>`;
    }
    // column heads: what each end of time holds, and where the study starts
    const startX = D.start === 'left' ? g.boxes.L0.x : g.boxes.R0.x;
    out += `<text class="doi-t-sm" x="0" y="12">Earlier: exposure</text>`;
    out += `<text class="doi-t-sm" x="${g.W}" y="12" text-anchor="end">Later: disease</text>`;
    if (s >= 1) out += `<text class="doi-t-annot" x="${startX + g.bw / 2}" y="${g.boxes.L1.y + g.bh + 20}" text-anchor="middle">Study starts here</text>`;
    const ppl = this._people(g);
    ppl.forEach((q) => {
      const p = this._pos(q, ppl.length);
      out += `<circle class="doi-dot${this._ill(q, p.t) ? ' is-ill' : ''}" data-i="${q.i}" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="6.5"/>`;
    });
    if (s === 0) {
      const p = this._pos(ppl[0], ppl.length);
      out += `<circle class="doi-ring" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="11"/>`;
    }
    const H = g.H + 24;
    return `<svg class="doi-svg" viewBox="0 0 ${g.W} ${H}" role="img" aria-label="${esc(D.label)} study: ${D.start === 'left' ? 'starts from exposure' : 'starts from cases and controls'}">${out}</svg>`;
  }

  _inquirySvg() {
    const g = this._geo(), D = DESIGNS[this._design];
    const fwd = D.start === 'left';
    const x1 = fwd ? 8 : g.W - 8, x2 = fwd ? g.W - 8 : 8;
    return `<svg class="doi-svg" viewBox="0 0 ${g.W} 40" aria-hidden="true"><text class="doi-t-annot" x="${fwd ? 0 : g.W}" y="14" text-anchor="${fwd ? 'start' : 'end'}">${esc(D.inquiry)}</text>${this._arrow(x1, x2, 30, '')}</svg>`;
  }

  _timeHtml() {
    const g = this._geo(), live = this._live();
    const arrow = `<svg class="doi-svg" viewBox="0 0 ${g.W} 26" aria-hidden="true">${this._arrow(2, g.W - 2, 6, 'doi-arrow--time')}<text class="doi-t-b" x="0" y="24">Time</text><text class="doi-t-sm" x="${g.W}" y="24" text-anchor="end">always runs this way</text></svg>`;
    return `<div class="doi-time"><input type="range" data-spn-input="time" min="0" max="100" step="1" value="${this._p}" aria-label="Time handle"${live ? '' : ' disabled'}>${arrow}</div>`;
  }

  _promptHtml() {
    const s = this.stepIndex ?? 0, D = DESIGNS[this._design];
    if (s >= 3) return '<p class="doi-q"><b>Both designs ask</b><span>Is there an association?</span><span>If so, how strong?</span></p>';
    if (s === 0) return '<p class="doi-note">Each dot is one person, studied one at a time. The conclusion is about the population they were drawn from.</p>';
    return promptHtml(this._reached ? D.done : D.go, { done: this._reached, key: 'doi-prompt' });
  }

  _moveDots() {
    const g = this._geo(), ppl = this._people(g);
    const dots = this.root?.querySelectorAll('.doi-dot');
    if (!dots) return;
    ppl.forEach((q) => {
      const el = dots[q.i];
      if (!el) return;
      const p = this._pos(q, ppl.length);
      el.setAttribute('cx', p.x.toFixed(1));
      el.setAttribute('cy', p.y.toFixed(1));
      el.classList.toggle('is-ill', this._ill(q, p.t));
    });
    // box states and labels can change as an end of time is reached
    const bs = this._boxState(g);
    const rects = this.root.querySelectorAll('.doi-box');
    const texts = this.root.querySelectorAll('.doi-box + text');
    const D = DESIGNS[this._design];
    const labels = ['Exposed', 'Not exposed', D.right[0], D.right[1]];
    ['L', 'L', 'R', 'R'].forEach((side, k) => {
      const st = side === 'L' ? bs.L : bs.R, known = side === 'L' ? bs.leftKnown : bs.rightKnown;
      if (rects[k]) rects[k].setAttribute('class', `doi-box ${st}`);
      if (texts[k]) texts[k].textContent = labels[k] + (known ? '' : ' ?');
    });
    const pr = this.root.querySelector('[data-spn="doi-prompt"]');
    if (pr && this._reached && !pr.classList.contains('spn-prompt--done')) pr.outerHTML = promptHtml(D.done, { done: true, key: 'doi-prompt' });
  }

  _paint() {
    if (!this.root) return;
    const s = this.stepIndex ?? 0;
    const chips = s >= 1
      ? chipsHtml(Object.entries(DESIGNS).map(([k, d]) => ({ label: d.label, action: 'design', value: k, pressed: k === this._design })), { label: 'Study design' })
      : '<span class="spn-label">Cohort study</span>';
    const top = `<div class="doi-top"><span class="spn-label">Design</span>${chips}</div>`;
    const inquiry = s >= 2 ? this._inquirySvg() : '';
    this.render({ html: `<div class="spn doi">${top}${this._promptHtml()}${inquiry}${this._stageSvg()}${this._timeHtml()}</div>` });
  }

  testState() {
    const g = this._geo(), ppl = this._people(g);
    const at = { L0: 0, L1: 0, R0: 0, R1: 0 };
    ppl.forEach((q) => { const p = this._pos(q, ppl.length); if (p.t >= 0.999) at[`R${q.d ? 0 : 1}`]++; else if (p.t <= 0.001) at[`L${q.e ? 0 : 1}`]++; });
    return { beat: this.stepIndex, design: this._design, p: this._p, inquiry: (this.stepIndex ?? 0) >= 2 ? (DESIGNS[this._design].start === 'left' ? 'right' : 'left') : null, at, reached: this._reached, sweeping: !!this._sweep };
  }
}
