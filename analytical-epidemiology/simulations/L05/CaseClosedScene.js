/**
 * CaseClosedScene - blk-l05-s09: the file, complete (live case illustrative; the real file is the chapter's).
 * Dot grammar: one dot = one man; blue = has the tumour; grey = a control; FILLED = cleaned the tanks,
 * HOLLOW = did not.
 *   beat 1 (cue strip)    the live case strip from lesson 2, every step lit: 20 cases > 60 controls > 14 of 20 vs
 *                         9 of 60 > OR 13.2 > four checks > RR 12.0; under it the 20 cases and 60 controls as people
 *                         and the two ratios (learner: "Walk the file" lights the steps in order)
 *   beat 2 (cue real)     the real file: angiosarcoma of the liver; vinyl chloride (the gas PVC is made from); 1974,
 *                         a cluster of 4 men from one section of one plant -> retrospective cohort studies across
 *                         33 plants the same year; your path beside it: cluster > comparison > cohort
 *                         (learner: "Open the real file" replays the reveal)
 *   beat 3 (cue verdict)  the two-column mirror, case-control | cohort, five rows, ending OR 13.2 | RR 12.0
 *                         (learner: "Mirror the two" replays it row by row)
 * Every beat lands at rest on its finished picture.
 */
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { SIM_CROWD_CSS, crowdLive, legendHtml } from 'simulations/base/kit/SimCrowd.js';
import { flowChipHtml, bindFlow } from 'simulations/base/kit/SimFlowDom.js';
import { withNarrationCues } from '../L01/NarrationCues.js';
import { na, tagFirst, tagLive } from '../L03/NarrTags.js';
import { narrOn, narrDotsCss } from './NarrDots.js';

// The live case's people: 20 cases (14 cleaned the tanks), 60 controls (9 did).
const CASES = Array.from({ length: 20 }, (_, i) => ({ id: `p${i}`, ill: true, exposed: i < 14 }));
const CTRLS = Array.from({ length: 60 }, (_, i) => ({ id: `k${i}`, ill: false, exposed: i < 9 }));
const CLUSTER = Array.from({ length: 4 }, (_, i) => ({ id: `v${i}`, ill: true, exposed: true }));
const STRIP = ['20 cases', '60 controls', '14 of 20 vs 9 of 60', 'OR 13.2', 'four checks', 'RR 12.0'];
const MIRROR = [
  ['starts from', 'the disease', 'the exposure'],
  ['runs', 'effect to cause', 'cause to effect'],
  ['measures', 'odds ratio', 'incidence and relative risk'],
  ['cost', 'quick and cheap', 'long and costly'],
  ['your live case', 'OR 13.2', 'RR 12.0'],
];
const TICK = 'M-6 0l4 4 8-9';

class CaseClosedBase extends SvgScene {}

export class CaseClosedScene extends withNarrationCues(CaseClosedBase) {
  static BEAT_STEP_MAP = [0, 1, 2].map((i) => [{ idx: i, dwellMs: null }]);
  static ARIA_LABEL = 'The case file complete: 20 cases, 60 controls, 14 of 20 against 9 of 60, odds ratio 13.2, four bias checks, relative risk 12.0. The real file: angiosarcoma of the liver and vinyl chloride, the gas PVC is made from; in 1974 a cluster of 4 men from one section of one plant, then retrospective cohort studies across 33 plants the same year. Your path: cluster, comparison, cohort. A mirror: case-control starts from the disease, runs effect to cause, measures an odds ratio, quick and cheap, 13.2; cohort starts from the exposure, runs cause to effect, measures incidence and relative risk, long and costly, 12.0.';
  static CONTROLS = [];
  static SETTING = 'none';
  static HEIGHT = 550;
  static PORTRAIT_HEIGHT = 762;
  // Narration focus (spec W1 D29n): data-narr ids strip, cases / controls (head and dots), or, checks, rr (beat 1);
  // real (kicker), disease, gas, plant (1974 plant, cluster and its caption), plants (the 33 plants, arrow and
  // caption), path (beat 2); cc / co (each column, rows 1-4, one box each), live (the last row) on beat 3; chips
  // and legend hidden while narrated.
  static CUES = ['strip', 'real', 'verdict'];

  /** Narration focus contract (content-block): lit dots keep their own colour (NarrDots). */
  narrationFocus(f) { narrOn(this, f); }

  async setup() {
    this.ccs = { gen: 0, anim: false };
    await super.setup();
    bindFlow(this.root, { action: (name) => { if (name === 'replay') { this.replay(); this.interactDone?.(this.constructor.CUES[this.stepIndex]); } } });
  }

  enter(step) { this.replay(true); }

  replay(fromEnter = false) {
    const s = this.ccs;
    s.gen++; s.anim = true;
    if (!fromEnter) this.repaint();
    this.after(3.4, () => { s.anim = false; });
  }

  applyCue(id) {
    const k = this.stepIndex;
    if ((id === 'strip' && k === 0) || (id === 'real' && k === 1) || (id === 'verdict' && k === 2)) this.replay();
  }

  cueBase() { return null; }
  cueReset() { this.ccs.anim = false; this.repaint(); }

  stageHeight(st) {
    const k = this.stepIndex ?? 0;
    return st.portrait ? [630, 680, 560][k] : [440, 470, 400][k];
  }

  stripHtml(x, y, w, dim) {
    const a = this.ccs.anim;
    const parts = STRIP.map((t, i) => `<span class="cc-on${a ? ' cc-seq' : ''}" style="--d:${(0.15 + i * 0.4).toFixed(2)}s">${t}</span>`);
    return `<div class="cc-strip${dim ? ' cc-dimstrip' : ''}"${na('strip')} style="left:${x}px;top:${y}px;width:${w}px">${parts.join('<i>&gt;</i>')}</div>`;
  }

  paint(st) {
    const k = this.stepIndex, P = st.portrait, W = st.W, s = this.ccs;
    let svg = '', over = '';
    const lay = { r: 0, step: 0, pos: new Map(), boxOf: new Map(), boxes: [], rules: [] };
    const grid = (list, x0, y0, cols, step) => list.forEach((p, i) => { lay.pos.set(p.id, { x: x0 + step * (i % cols + 0.5), y: y0 + step * (Math.floor(i / cols) + 0.5) }); lay.boxOf.set(p.id, 'g'); });
    this.people = [];
    let head = '';
    if (k === 0) {
      over += this.stripHtml(16, 6, W - 32, false);
      const step = P ? Math.min(22, (W - 32) / 15) : 21;
      lay.r = step * 0.36; lay.step = step;
      const x0 = P ? 16 : 20, yC = P ? 186 : 150, yK = yC + 2 * step + (P ? 72 : 50);
      grid(CASES, x0, yC, P ? 10 : 10, step);
      grid(CTRLS, x0, yK, P ? 15 : 15, step);
      this.people = [...CASES, ...CTRLS];
      over += `<span class="cc-gh"${na('cases')} style="left:${x0}px;top:${yC - 8}px"><b>20 men with the tumour</b>${P ? '<br>' : ' '}14 cleaned the tanks</span>`;
      over += `<span class="cc-gh"${na('controls')} style="left:${x0}px;top:${yK - 8}px"><b>60 controls</b>${P ? '<br>' : ' '}9 cleaned the tanks</span>`;
      const rx = P ? 16 : 384, ry = P ? yK + 4 * step + 20 : 128;
      const fade = s.anim ? ' cc-seq' : '';
      over += `<div class="cc-ratios${P ? ' cc-ratiosp' : ''}" style="left:${rx}px;top:${ry}px">`
        + `<div class="cc-ratio${fade}"${na('or')} style="--d:1.35s"><b class="sim-numeral">OR 13.2</b><span>case-control: 20 cases, 60 controls</span></div>`
        + `<div class="cc-ratio cc-checks${fade}"${na('checks')} style="--d:1.75s"><svg viewBox="-8 -10 112 16" width="112" height="16" aria-hidden="true">${[0, 1, 2, 3].map((i) => `<path class="cc-tick" transform="translate(${i * 28} 0)" d="${TICK}"/>`).join('')}</svg><span>four bias checks passed</span></div>`
        + `<div class="cc-ratio rr${fade}"${na('rr')} style="--d:2.15s"><b class="sim-numeral">RR 12.0</b><span>cohort: 10,000 men followed</span></div></div>`;
      head = tagFirst(flowChipHtml({ label: 'Walk the file', action: 'replay', icon: 'replay' }), '-')
        + tagFirst(legendHtml({ items: [
          { label: 'tumour', color: 'var(--sim-annot)', filled: true },
          { label: 'control', color: 'var(--sim-label-muted)', filled: true },
          { label: 'filled: cleaned tanks', color: 'var(--sim-label)', filled: true },
          { label: 'hollow: did not', color: 'var(--sim-label)', filled: false },
        ] }), '-');
    } else if (k === 1) {
      const a = s.anim ? ' cc-seq' : '';
      over += `<div class="cc-real" style="left:16px;top:6px;width:${W - 32}px"><span class="cc-kick"${na('real')}>The real file</span>`
        + `<b class="cc-dis${P ? ' cc-disp' : ''}"${na('disease')}>angiosarcoma of the liver</b><span class="cc-exp"${na('gas')}>vinyl chloride (the gas PVC is made from)</span></div>`;
      // 1974: one plant, four sections; the cluster sits in one of them.
      const py = P ? 160 : 156, pw = P ? W - 32 : 250, ph = P ? 100 : 150, px = 16;
      const sw = pw / 4;
      svg += `<g${na('plant')}><rect class="cc-plant" x="${px}" y="${py}" width="${pw}" height="${ph}"/>`;
      for (let i = 1; i < 4; i++) svg += `<line class="cc-wall" x1="${px + i * sw}" y1="${py}" x2="${px + i * sw}" y2="${py + ph}"/>`;
      svg += `<rect class="cc-sec" x="${px + 2 * sw}" y="${py}" width="${sw}" height="${ph}"/></g>`;
      const step = 24; lay.r = 8.6; lay.step = step;
      grid(CLUSTER, px + 2 * sw + (sw - 2 * step) / 2, py + ph / 2 - step, 2, step);
      this.people = CLUSTER;
      over += `<span class="cc-yr sim-numeral"${na('plant')} style="left:${px}px;top:${py - 4}px">1974</span>`;
      over += `<span class="cc-cap"${na('plant')} style="left:${px}px;top:${py + ph + 8}px;width:${pw}px">a cluster of 4 men, all from the one section of one plant where the gas was turned into PVC</span>`;
      // The same year: retrospective cohort studies across 33 plants.
      const gx = P ? 16 : px + pw + 70, gy = P ? py + ph + 136 : py, cols = 11, cw = P ? (W - 32) / cols : (W - 16 - gx) / cols, chh = P ? 22 : 30;
      svg += `<g${na('plants')}>`;
      if (!P) svg += `<path class="cc-arrow${a}" style="--d:0.6s" d="M${px + pw + 12} ${py + ph / 2}h44m-10 -7l10 7-10 7"/>`;
      else svg += `<path class="cc-arrow${a}" style="--d:0.6s" d="M${W / 2} ${py + ph + 80}v20m-7 -10l7 10 7-10"/>`;
      for (let i = 0; i < 33; i++) {
        const x = gx + (i % cols) * cw, y = gy + Math.floor(i / cols) * (chh + 8);
        svg += `<rect class="cc-p33${a}" style="--d:${(0.9 + i * 0.04).toFixed(2)}s" x="${x + 2}" y="${y}" width="${cw - 6}" height="${chh}"/>`;
      }
      svg += '</g>';
      const g3 = gy + 3 * (chh + 8);
      over += `<span class="cc-big33 sim-numeral"${na('plants')} style="left:${gx}px;top:${gy - 4}px">33 plants</span>`;
      over += `<span class="cc-cap"${na('plants')} style="left:${gx}px;top:${g3 + 2}px;width:${P ? W - 32 : W - 16 - gx}px">retrospective cohort studies of vinyl-chloride workers, the same year: the excess confirmed</span>`;
      // Your path, drawn beside the real one.
      const yy = P ? st.H - 64 : st.H - 70;
      over += `<div class="cc-path"${na('path')} style="left:16px;top:${yy}px;width:${W - 32}px"><span class="cc-pk">your path</span>`
        + ['a cluster', 'a comparison', 'a cohort'].map((t, i) => `<span class="cc-pstep${a}" style="--d:${(1.8 + i * 0.4).toFixed(2)}s">${t}</span>`).join('<i>&gt;</i>') + '</div>';
      head = tagFirst(flowChipHtml({ label: 'Open the real file', action: 'replay', icon: 'replay' }), '-');
    } else {
      const a = s.anim;
      const lw = P ? 0 : 130, cw = (W - 32 - lw) / 2, x1 = 16 + lw, x2 = x1 + cw;
      if (!P) svg += `<line class="cc-mid" x1="${x2}" y1="8" x2="${x2}" y2="${st.H - 8}"/>`;
      else svg += `<line class="cc-mid" x1="${x2}" y1="8" x2="${x2}" y2="48"/>`;
      // Narration: cells carry their column's id (cc / co; the last row: live) and dim with it; one empty box per
      // id, drawn last, carries the single outline (the cells' own outlines are off, css below). Paint order unchanged.
      over += `<span class="cc-colh"${na('cc')} style="left:${x1 + cw / 2}px;top:10px">case-control</span><span class="cc-colh rr"${na('co')} style="left:${x2 + cw / 2}px;top:10px">cohort</span>`;
      const rowH = P ? 92 : 64, y0 = P ? 56 : 54, yL = y0 + (MIRROR.length - 1) * rowH;
      MIRROR.forEach(([lab, l, r], i) => {
        const y = y0 + i * rowH, last = i === MIRROR.length - 1, d = (0.2 + i * 0.45).toFixed(2);
        const nl = last ? 'live' : '', nL = last ? 'live' : 'cc', nR = last ? 'live' : 'co';
        svg += `<line class="cc-hr" x1="16" y1="${y}" x2="${W - 16}" y2="${y}"/>`;
        if (P) svg += `<line class="cc-mid" x1="${x2}" y1="${y + 30}" x2="${x2}" y2="${y + rowH - 4}"/>`;
        if (P) over += `<span class="cc-rl cc-rlp"${na(nl)} style="left:${W / 2}px;top:${y + 6}px">${lab}</span>`;
        else over += `<span class="cc-rl"${na(nl)} style="left:16px;top:${y + rowH / 2}px">${lab}</span>`;
        const ty = P ? y + 30 + (rowH - 30) / 2 : y + rowH / 2;
        over += `<span class="cc-cell L${last ? ' cc-num sim-numeral' : ''}${a ? ' cc-from-r' : ''}"${na(nL)} style="left:${x2 - 14}px;top:${ty}px;max-width:${cw - 20}px;--d:${d}s">${l}</span>`;
        over += `<span class="cc-cell R${last ? ' cc-num sim-numeral rr' : ''}${a ? ' cc-from-l' : ''}"${na(nR)} style="left:${x2 + 14}px;top:${ty}px;max-width:${cw - 20}px;--d:${d}s">${r}</span>`;
      });
      // Each column's box keeps 8 px off the middle rule (its outline must not sit on the rule or cross into the
      // other column); in portrait the row labels move inside the case-control box while narrated (css below).
      const boxes = [['cc', x1, 8, x2 - x1 - 8, yL - 8], ['co', x2 + 8, 8, cw - 8, yL - 8], ['live', 16, yL, W - 32, rowH]];
      for (const [n, x, y, w, h] of boxes) over += `<div class="cc-box"${na(n)} style="left:${x}px;top:${y}px;width:${w}px;height:${h}px"></div>`;
      head = tagFirst(flowChipHtml({ label: 'Mirror the two', action: 'replay', icon: 'replay' }), '-');
    }
    this.lay = lay;
    return { svg, over, head };
  }

  animate() {
    if (!this.people.length) return;
    crowdLive(this.live, `cc${this.stepIndex}`, this.people, this.lay, { spread: 0 });
    tagLive(this.live, `cc${this.stepIndex}`, this.people, (p) => (this.stepIndex === 1 ? 'plant' : p.ill ? 'cases' : 'controls'));
  }

  css() {
    return SIM_CROWD_CSS + narrDotsCss(['cases', 'controls', 'plant']) + `
.svs-head { gap: 10px 14px; }
.svs-head .scw-legend { font-size: 16px; justify-content: center; }
.sflow-chip { min-height: 44px; font-size: 16px; }
.cc-strip { position: absolute; display: flex; flex-wrap: wrap; align-items: center; gap: 6px 8px; padding: 10px 0; border-top: 1px solid var(--sim-label-muted); border-bottom: 1px solid var(--sim-label-muted); font: 600 17px/1.3 var(--sim-font); color: var(--sim-label-muted); }
.cc-strip i { font-style: normal; color: var(--sim-label-muted); }
.cc-on { color: var(--sim-annot); font-weight: 700; background: var(--sim-annot-tint); padding: 2px 8px; }
.cc-seq { animation: cc-light 0.6s ease both; animation-delay: var(--d, 0s); }
@keyframes cc-light { from { opacity: 0.15; } to { opacity: 1; } }
.cc-gh { position: absolute; transform: translate(0, -100%); white-space: nowrap; font: 500 16px/1.2 var(--sim-font); color: var(--sim-label-muted); }
.cc-gh b { font-weight: 800; color: var(--sim-label); margin-right: 6px; }
.cc-ratios { position: absolute; display: flex; flex-direction: column; gap: 14px; }
.cc-ratiosp { flex-direction: row; flex-wrap: wrap; gap: 10px 24px; }
.cc-ratio { display: flex; flex-direction: column; gap: 2px; font: 500 16px/1.25 var(--sim-font); color: var(--sim-label-muted); }
.cc-ratio b { font: 400 50px/1 var(--sim-font-numeral); color: var(--sim-label); }
.cc-ratio.rr b { color: var(--sim-annot); }
.cc-checks { flex-direction: row; align-items: center; gap: 10px; }
svg .cc-tick, .cc-checks .cc-tick { fill: none; stroke: var(--sim-good); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
.cc-real { position: absolute; display: flex; flex-direction: column; gap: 4px; padding-bottom: 10px; border-bottom: 1px solid var(--sim-label-muted); }
.cc-kick { font: 700 16px/1.2 var(--sim-font); text-transform: uppercase; letter-spacing: 0.06em; color: var(--sim-label-muted); }
.cc-dis { font: 400 32px/1.1 var(--sim-font-numeral); color: var(--sim-label); }
.cc-disp { font-size: 27px; }
.cc-exp { font: 600 17px/1.25 var(--sim-font); color: var(--sim-label); }
.cc-yr { position: absolute; transform: translate(0, -100%); font: 400 28px/1 var(--sim-font-numeral); color: var(--sim-label); }
.cc-big33 { position: absolute; transform: translate(0, -100%); font: 400 28px/1 var(--sim-font-numeral); color: var(--sim-annot); white-space: nowrap; }
.cc-cap { position: absolute; font: 500 16px/1.3 var(--sim-font); color: var(--sim-label-muted); }
.cc-cap b { color: var(--sim-label); }
.cc-path { position: absolute; display: flex; flex-wrap: wrap; align-items: center; gap: 6px 10px; padding-top: 10px; border-top: 1px solid var(--sim-label-muted); font: 700 17px/1.3 var(--sim-font); color: var(--sim-label); }
.cc-path i { font-style: normal; color: var(--sim-label-muted); }
.cc-pk { font: 700 16px/1.2 var(--sim-font); text-transform: uppercase; letter-spacing: 0.06em; color: var(--sim-label-muted); margin-right: 4px; }
.cc-pstep { border: 1.5px solid var(--sim-annot); color: var(--sim-annot); padding: 3px 10px; }
svg .cc-plant { fill: none; stroke: var(--sim-label); stroke-width: 2; }
svg .cc-wall { stroke: var(--sim-label-muted); stroke-width: 1.2; stroke-dasharray: 4 4; }
svg .cc-sec { fill: var(--sim-annot-tint); stroke: var(--sim-annot); stroke-width: 2; }
svg .cc-arrow { fill: none; stroke: var(--sim-label); stroke-width: 2.5; stroke-linecap: round; stroke-linejoin: round; }
svg .cc-p33 { fill: var(--sim-annot-tint); stroke: var(--sim-annot); stroke-width: 1.5; }
svg .cc-seq { animation: cc-light 0.5s ease both; animation-delay: var(--d, 0s); }
svg .cc-mid { stroke: var(--sim-label); stroke-width: 2; }
svg .cc-hr { stroke: var(--sim-label-muted); stroke-width: 1; opacity: 0.5; }
.cc-box { position: absolute; pointer-events: none; }
#sim-canvas-host[data-narr-focus] :is(.cc-colh, .cc-rl, .cc-cell)[data-narr] { outline: none !important; }
/* Narrated portrait: a row label sits above its row, centred across both columns, so a lit column box would cut
   through it. It moves to the left edge, inside the case-control box and clear of the cohort box. */
#sim-canvas-host[data-narr-mode] .cc-rlp { left: 16px !important; transform: none; }
.cc-colh { position: absolute; transform: translate(-50%, 0); white-space: nowrap; font: 800 20px/1.2 var(--sim-font); color: var(--sim-label); }
.cc-colh.rr { color: var(--sim-annot); }
.cc-rl { position: absolute; transform: translate(0, -50%); white-space: nowrap; font: italic 600 16px/1.2 var(--sim-font); color: var(--sim-label-muted); }
.cc-rlp { transform: translate(-50%, 0); }
.cc-cell { position: absolute; font: 700 17px/1.25 var(--sim-font); color: var(--sim-label); }
.cc-cell.L { transform: translate(-100%, -50%); text-align: right; }
.cc-cell.R { transform: translate(0, -50%); text-align: left; }
.cc-num { font: 400 40px/1 var(--sim-font-numeral); white-space: nowrap; }
.cc-num.rr { color: var(--sim-annot); }
.cc-from-r { animation: cc-from-r 0.6s cubic-bezier(.2,.8,.3,1) both; animation-delay: var(--d, 0s); }
.cc-from-l { animation: cc-from-l 0.6s cubic-bezier(.2,.8,.3,1) both; animation-delay: var(--d, 0s); }
@keyframes cc-from-r { from { opacity: 0; translate: 12px 0; } to { opacity: 1; translate: 0 0; } }
@keyframes cc-from-l { from { opacity: 0; translate: -12px 0; } to { opacity: 1; translate: 0 0; } }
`;
  }
}
