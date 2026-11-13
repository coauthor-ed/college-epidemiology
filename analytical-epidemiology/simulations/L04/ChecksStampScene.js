/**
 * ChecksStampScene - analytical-epidemiology L04 s09 (live case, illustrative). The case card on the board:
 * the 80 men studied, one dot each (20 men with the tumour in blue, 60 comparison men in grey; filled =
 * cleaned tanks: 14 of 20 and 9 of 60), and the odds ratio (14 x 51) / (9 x 6) = 13.2. Four bias checks,
 * each with its ground: same workforce; personnel records; interviewer blind; same employment door.
 *   Beat 0 checks: the learner ticks each check (or the checks cue ticks them in turn); a ticked check lights
 *                  the men its ground is about. Back from beat 1, all four sit ticked.
 *   Beat 1 stamp, records: "Stamp the odds ratio" lands a ruled NO INCIDENCE stamp across the card; then the
 *                  plant's records fade in behind as a faint crowd of grey outlines (not yet known), labelled
 *                  "twenty years of records: every man who entered the plant" (no count claimed), and the
 *                  question "Start from the workers?". A cold landing shows both at rest.
 */
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { SIM_CROWD_CSS, crowdLive, crowdSvg, scatterLayout, legendHtml } from 'simulations/base/kit/SimCrowd.js';
import { withNarrationCues } from '../L01/NarrationCues.js';
import { na, tagTop, tagEl } from './NarrTags.js';

const CASES = Array.from({ length: 20 }, (_, i) => ({ id: `k${i}`, ill: true, exposed: i < 14 }));
const CTRL = Array.from({ length: 60 }, (_, i) => ({ id: `c${i}`, ill: false, exposed: i < 9 }));
const MEN = [...CASES, ...CTRL];
const RECORDS = Array.from({ length: 160 }, (_, i) => ({ id: `r${i}`, ill: false, ghost: true }));
const GATES = [
  { title: 'Same workforce', ground: "Controls from the plant's own workforce", short: "The plant's own men" },
  { title: 'Personnel records', ground: 'Counts from records, not memory', short: 'Records, not memory' },
  { title: 'Interviewer blind', ground: 'Never knew who was a case', short: 'Never knew who was a case' },
  { title: 'Same employment door', ground: 'Both groups entered the same way', short: 'Both came in the same way' },
];
const MAP = [0, 1].map((i) => [{ idx: i, dwellMs: null }]);

export class ChecksStampScene extends withNarrationCues(SvgScene) {
  static WIDTH = 680;
  static HEIGHT = 470;
  static PORTRAIT_WIDTH = 380;
  static PORTRAIT_HEIGHT = 660;
  static MIN_SCALE = 0.85;
  static SETTING = 'none';
  static BEAT_STEP_MAP = MAP;
  static CONTROLS = [];
  static CUES = ['checks', 'stamp', 'records'];
  static ARIA_LABEL = 'Live case, illustrative. The case card: 80 men studied, one dot each. 20 men with the tumour in blue, 14 of them cleaned tanks; 60 comparison men in grey, 9 of them cleaned tanks. Odds ratio 14 times 51 over 9 times 6, 13.2. Four bias checks, each ticked with its ground: same workforce, controls from the plant\'s own workforce; personnel records, counts from records rather than memory; interviewer blind, never knew who was a case; same employment door, both groups entered the same way. Then a stamp lands across the card: no incidence. Behind it, the plant\'s records fade in: twenty years of records, every man who entered the plant. Start from the workers?';

  async setup() {
    this.ckTick = [false, false, false, false]; this.ckAct = null;
    this.ckStamp = false; this.ckRec = false; this.ckAnim = false;
    await super.setup();
    this.ckClick = (e) => this.onClick(e);
    this.root.addEventListener('click', this.ckClick);
  }

  enter(step) {
    const came = this.ckLast === step - 1, back = this.ckLast === step + 1;
    this.ckLast = step;
    this.ckAnim = false;
    if (step === 0) {
      const all = back;
      this.ckTick = [all, all, all, all]; this.ckAct = all ? 3 : null; this.ckStamp = false; this.ckRec = false;
    } else {
      this.ckTick = [true, true, true, true]; this.ckAct = 3;
      this.ckStamp = !came; this.ckRec = !came;
    }
  }

  geo(st) {
    const P = st.portrait, W = st.W;
    if (P) {
      const cardW = W, step = 30, r = 9.2, x0 = (W - 10 * step) / 2 + step / 2;
      const caseY = 108, ctrlLab = caseY + step + 20, ctrlY = ctrlLab + 34, sc = (W - 24) / 12, cardH = ctrlY + 4 * sc + r + 14;
      const gx = 0, gy = cardH + 14, gw = (W - 8) / 2, gh = 86;
      const botY = gy + 2 * gh + 8 + 12;
      return { P, W, cardW, cardH, step, r, x0, cols: [10, 12], caseY, caseLab: caseY - 34, ctrlLab, ctrlY, gx, gy, gw, gh, botY, H: botY + 56 };
    }
    const cardW = 392, step = 24, r = 8, x0 = 20 + step / 2;
    const caseY = 112, ctrlLab = caseY + step + 26, ctrlY = ctrlLab + 36, cardH = ctrlY + 3 * step + 26;
    const gx = cardW + 20, gw = W - gx, gh = (cardH - 3 * 8) / 4;
    const botY = cardH + 14;
    return { P, W, cardW, cardH, step, r, x0, cols: [10, 15], caseY, caseLab: caseY - 36, ctrlLab, ctrlY, gx, gy: 0, gw, gh, botY, H: botY + 70 };
  }

  stageHeight(st) { return Math.ceil(this.geo(st).H); }

  layout(g) {
    const pos = new Map(), boxOf = new Map();
    const stepC = g.P ? (g.W - 24) / g.cols[1] : g.step;
    const x1 = g.P ? 12 + stepC / 2 : g.x0;
    CASES.forEach((p, i) => { pos.set(p.id, { x: g.x0 + (i % g.cols[0]) * g.step, y: g.caseY + Math.floor(i / g.cols[0]) * g.step }); boxOf.set(p.id, 'k'); });
    CTRL.forEach((p, i) => { pos.set(p.id, { x: x1 + (i % g.cols[1]) * stepC, y: g.ctrlY + Math.floor(i / g.cols[1]) * (g.P ? stepC : g.step) }); boxOf.set(p.id, 'c'); });
    return { kind: 'card', r: g.P ? Math.min(g.r, stepC * 0.32) : g.r, step: g.step, pos, boxOf, boxes: [], rules: [] };
  }

  paint(st) {
    const g = this.geo(st), s = this.stepIndex ?? 0;
    this.g = g;
    this.lay = this.layout(g);
    let svg = '', over = '';
    if (this.ckRec) {
      // A field of its own, clear of every text line and card: beat 1 folds the check cards to one line.
      const rect = g.P ? { x: 8, y: g.gy + 46, w: g.W - 16, h: g.botY - 14 - (g.gy + 46) } : { x: g.gx + 8, y: 52, w: g.gw - 16, h: g.cardH - 60 };
      const rl = scatterLayout(RECORDS, rect, { seed: 7, density: 0.62, maxR: 5.5 });
      svg += `<g${na('records')} class="ck-rec${this.ckAnim ? ' ck-rec--in' : ''}">${crowdSvg(RECORDS, rl)}</g>`;
    }
    svg += `<rect${na('file')} class="ck-card" x="0.5" y="0.5" width="${g.cardW - 1}" height="${g.cardH - 1}" rx="4"/>`;
    over += `<div${na('file')} class="ck-head" style="left:16px;top:10px;width:${g.cardW - 32}px"><span class="ck-file">Case file: the plant<small>${g.P ? 'illustrative &middot; 80 men' : 'live case, illustrative &middot; 80 men studied'}</small></span>`
      + `<span${na('or')} class="ck-or"><small>OR</small>13.2</span></div>`;
    const lx = g.P ? 12 : 20;
    over += `<span${na('file')} class="ck-lab ck-lab--case" style="left:${lx}px;top:${g.caseLab}px">20 men with the tumour<em>14 cleaned tanks</em></span>`;
    over += `<span${na('file')} class="ck-lab" style="left:${lx}px;top:${g.ctrlLab}px">60 comparison men<em>9 cleaned tanks</em></span>`;
    over += s === 1 ? `<p${na('all4')} class="ck-all" style="left:${g.P ? 0 : g.gx}px;top:${g.P ? g.gy : 0}px;width:${g.P ? g.W : g.gw}px"><i class="ck-box ck-box--on" aria-hidden="true"><svg viewBox="0 0 20 20" width="20" height="20"><path d="M4 10.5l4 4 8-9"/></svg></i>All four checks ticked</p>` : this.gatesHtml(g);
    if (this.ckStamp) {
      over += `<div${na('stamp')} class="ck-stamp${this.ckAnim ? ' ck-stamp--in' : ''}" style="left:${g.cardW / 2}px;top:${g.cardH / 2 + 12}px"><b>No incidence</b><small>it says how strongly, not how often</small></div>`;
    }
    over += this.footHtml(g, s);
    const head = legendHtml({ show: ['ill', 'well', 'exposed', 'unexposed', ...(this.ckRec ? ['ghost'] : [])], text: { ill: 'tumour', well: 'comparison', exposed: 'cleaned tanks', unexposed: 'other work', ghost: 'records' } });
    return { svg, over, head: tagTop(head, '-') };
  }

  gatesHtml(g) {
    let h = '';
    GATES.forEach((q, i) => {
      const x = g.P ? g.gx + (i % 2) * (g.gw + 8) : g.gx, y = g.P ? g.gy + Math.floor(i / 2) * (g.gh + 8) : g.gy + i * (g.gh + 8);
      const on = this.ckTick[i];
      h += `<button type="button"${na(`gates g${i + 1}`)} class="ck-gate${on ? ' ck-gate--on' : ''}${this.ckAct === i ? ' ck-gate--act' : ''}" data-gate="${i}" aria-pressed="${on}" style="left:${x}px;top:${y}px;width:${g.gw}px;height:${g.gh}px">`
        + `<i class="ck-box" aria-hidden="true">${on ? '<svg viewBox="0 0 20 20" width="20" height="20"><path d="M4 10.5l4 4 8-9"/></svg>' : ''}</i>`
        + `<span class="ck-gt"><b>${q.title}</b><small>${g.P ? q.short : q.ground}</small></span></button>`;
    });
    return h;
  }

  footHtml(g, s) {
    const y = g.botY, w = g.W;
    if (s === 0) {
      const n = this.ckTick.filter(Boolean).length;
      const t = n === 4 ? '<b>Four checks, each with a ground you can point to.</b>' : `Tick each check to see what it rests on. ${n} of 4 ticked.`;
      return `<p${na('foot')} class="ck-cap" style="left:0;top:${y}px;width:${w}px">${t}</p>`;
    }
    if (!this.ckStamp) return `<button type="button"${na('-')} class="ck-btn" data-stamp="1" style="left:0;top:${y}px">Stamp the odds ratio</button>`
      + (g.P ? '' : `<p${na('-')} class="ck-cap ck-cap--side" style="left:${g.P ? 0 : 250}px;top:${g.P ? y + 54 : y + 10}px;width:${g.P ? w : w - 250}px">Every check is ticked. What can 13.2 still not say?</p>`);
    if (!this.ckRec) return `<p${na('-')} class="ck-cap" style="left:0;top:${y}px;width:${w}px">13.2 says how strongly tank cleaning and the tumour travel together among the 80 men.</p>`;
    return `<p${na('records')} class="ck-rl${this.ckAnim ? ' ck-in' : ''}" style="left:0;top:${y}px;width:${w}px">Twenty years of records: every man who entered the plant<b>Start from the workers?</b></p>`;
  }

  animate() {
    if (!this.lay) return;
    const a = this.ckAct;
    const people = MEN.map((p) => ({ ...p, dim: (a === 0 && p.ill) || (a === 1 && !p.exposed), lit: (a === 0 && !p.ill) || (a === 1 && p.exposed) }));
    crowdLive(this.live, 'men', people, this.lay, {});
    tagEl(this.live.get('men'), 'file');
  }

  onClick(e) {
    const b = e.target?.closest?.('[data-gate],[data-stamp]');
    if (!b || b.disabled) return;
    if (b.dataset.stamp) { this.stamp(true); return; }
    const i = Number(b.dataset.gate);
    if ((this.stepIndex ?? 0) !== 0) { this.ckAct = i; this.repaint(); return; }
    this.tick(i, true);
  }

  tick(i, byLearner) {
    const was = this.ckTick[i];
    this.ckTick[i] = true; this.ckAct = i;
    this.repaint();
    if (byLearner && !was && this.ckTick.every(Boolean)) this.root?.dispatchEvent(new CustomEvent('scene-interact-done', { bubbles: true, composed: true }));
  }

  stamp(byLearner) {
    if ((this.stepIndex ?? 0) !== 1 || this.ckStamp) return;
    this.ckStamp = true; this.ckAnim = true;
    this.repaint();
    // Narrated, the records wait for their cue (spec W1 D29n); a timer would show them early.
    if (!this.ckNarr) this.after(1.6, () => this.records());
    if (byLearner) this.root?.dispatchEvent(new CustomEvent('scene-interact-done', { bubbles: true, composed: true }));
  }

  records() {
    if (this.ckRec) return;
    this.ckStamp = true; this.ckRec = true; this.ckAnim = true;
    this.repaint();
  }

  applyCue(id) {
    if (id === 'checks') {
      if ((this.stepIndex ?? 0) !== 0) return;
      GATES.forEach((_, i) => this.after(i * 0.7, () => this.tick(i, false)));
    } else if (id === 'stamp') this.stamp(false);
    else if (id === 'records') { if ((this.stepIndex ?? 0) === 1) this.records(); }
  }

  narrationFocus(st) { this.ckNarr = !!st?.narrated; }

  cueBase() { return { tick: [...this.ckTick], act: this.ckAct, stamp: this.ckStamp, rec: this.ckRec }; }

  cueReset(b) {
    this.ckTick = [...(b?.tick ?? [false, false, false, false])]; this.ckAct = b?.act ?? null;
    this.ckStamp = !!b?.stamp; this.ckRec = !!b?.rec; this.ckAnim = false;
    this.repaint();
  }

  testState() {
    return { beat: this.stepIndex, ticks: this.ckTick.filter(Boolean).length, stamp: this.ckStamp, records: this.ckRec, or: '13.2', men: MEN.length };
  }

  destroy() {
    this.root?.removeEventListener('click', this.ckClick);
    super.destroy();
  }

  css() {
    return SIM_CROWD_CSS + `
/* Narrated focus: group labels light by brightness, not by a ring each (spec W1 D29n). */
.ck-lab[data-narr], .ck-head[data-narr] { outline: none !important; }
.svs-head { justify-content: flex-start; }
.ck-card { fill: var(--sim-bg-surface); stroke: var(--sim-label); stroke-opacity: 0.35; stroke-width: 1; }
.ck-rec { opacity: 0.6; }
.ck-all { position: absolute; margin: 0; display: flex; align-items: center; gap: 10px; min-height: 40px; box-sizing: border-box; border-bottom: 1px solid var(--sim-label); font: 700 15px/1.2 var(--sim-font); color: var(--sim-label); }
.ck-box--on { border-color: var(--sim-good); }
.ck-rec--in { animation: ck-fade 1.6s ease-out both; }
@keyframes ck-fade { from { opacity: 0; } to { opacity: 0.6; } }
.ck-head { position: absolute; display: flex; align-items: flex-end; justify-content: space-between; gap: 10px; padding-bottom: 6px; border-bottom: 1px solid var(--sim-label); }
.ck-file { display: flex; flex-direction: column; font: 700 var(--sim-text-md)/1.25 var(--sim-font); color: var(--sim-label); }
.ck-file small { font-weight: 500; font-size: var(--sim-text-sm); color: var(--sim-label-muted); }
.ck-or { display: flex; align-items: baseline; gap: 6px; font: 400 52px/1 var(--sim-font-numeral, var(--sim-font)); font-variant-numeric: lining-nums; color: var(--sim-annot); }
.ck-or small { font: 700 var(--sim-text-sm)/1 var(--sim-font); color: var(--sim-label-muted); letter-spacing: 0.06em; }
.ck-lab { position: absolute; display: flex; gap: 10px; align-items: baseline; font: 700 15px/1.2 var(--sim-font); color: var(--sim-label); white-space: nowrap; }
.ck-lab em { font-style: normal; font-weight: 500; font-size: var(--sim-text-sm); color: var(--sim-label-muted); }
.ck-lab--case { color: var(--sim-annot); }
.ck-gate { position: absolute; pointer-events: auto; box-sizing: border-box; display: flex; align-items: flex-start; gap: 10px; padding: 8px 10px; text-align: left;
  border: 1px solid color-mix(in oklab, var(--sim-label) 30%, transparent); border-radius: var(--sim-radius-sm); background: var(--sim-bg-surface); color: var(--sim-label); cursor: pointer; transition: border-color 0.3s ease; }
.ck-gate--on { border-color: var(--sim-label); }
.ck-gate--act { border-left: 4px solid var(--sim-good); }
.ck-gate:focus-visible, .ck-btn:focus-visible { outline: 2px solid var(--sim-annot); outline-offset: 2px; }
.ck-box { flex: none; width: 24px; height: 24px; box-sizing: border-box; border: 2px solid var(--sim-label); border-radius: 3px; display: flex; align-items: center; justify-content: center; }
.ck-gate--on .ck-box { border-color: var(--sim-good); }
.ck-box path { fill: none; stroke: var(--sim-good); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 22; animation: ck-draw 0.35s ease-out both; }
@keyframes ck-draw { from { stroke-dashoffset: 22; } to { stroke-dashoffset: 0; } }
.ck-gt { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.ck-gt b { font: 700 15px/1.2 var(--sim-font); }
.ck-gt small { font: 500 var(--sim-text-sm)/1.25 var(--sim-font); color: var(--sim-label-muted); }
.ck-stamp { position: absolute; transform: translate(-50%, -50%) rotate(-7deg); display: flex; flex-direction: column; align-items: center; gap: 2px; padding: 8px 18px;
  border: 3px double var(--sim-bad); color: var(--sim-bad); background: color-mix(in oklab, var(--sim-bg-surface) 82%, transparent); white-space: nowrap; pointer-events: none; }
.ck-stamp b { font: 800 40px/1.05 var(--sim-font); letter-spacing: 0.08em; text-transform: uppercase; }
.ck-stamp small { font: 600 var(--sim-text-sm)/1.2 var(--sim-font); letter-spacing: 0.04em; }
.ck-stamp--in { animation: ck-stamp 0.45s cubic-bezier(0.2, 0.9, 0.3, 1.2) both; }
@keyframes ck-stamp { from { opacity: 0; transform: translate(-50%, -50%) rotate(-7deg) scale(1.35); } }
.ck-btn { position: absolute; pointer-events: auto; min-height: 46px; padding: 0 18px; border: 1.5px solid var(--sim-annot); border-radius: var(--sim-radius-sm); background: var(--sim-annot); color: var(--sim-bg-surface); font: 700 var(--sim-text-md)/1 var(--sim-font); cursor: pointer; }
.ck-cap { position: absolute; margin: 0; font: 500 var(--sim-text-md)/1.35 var(--sim-font); color: var(--sim-label-muted); }
.ck-cap b { color: var(--sim-label); }
.ck-rl { position: absolute; margin: 0; padding: 4px 8px 6px; box-sizing: border-box; border-left: 3px solid var(--sim-label); display: flex; flex-direction: column; gap: 4px; font: 600 var(--sim-text-md)/1.3 var(--sim-font); color: var(--sim-label-muted); }
.ck-rl b { font: 700 24px/1.2 var(--sim-font); color: var(--sim-label); }
.ck-in { animation: ck-in 0.6s ease-out 0.5s both; }
@keyframes ck-in { from { opacity: 0; transform: translateY(6px); } }
.sim-dom-root--portrait .ck-or { font-size: 44px; }
.sim-dom-root--portrait .ck-or small { font-size: 15px; }
.sim-dom-root--portrait .ck-stamp b { font-size: 32px; }
.sim-dom-root--portrait .ck-gt b, .sim-dom-root--portrait .ck-lab { font-size: 14px; }
.sim-dom-root--portrait .ck-gate { padding: 6px 8px; gap: 6px; }
.sim-dom-root--portrait .ck-rl b { font-size: 21px; }
@media (prefers-reduced-motion: reduce) { .ck-rec--in, .ck-stamp--in, .ck-in, .ck-box path { animation: none; } }
`;
  }
}
