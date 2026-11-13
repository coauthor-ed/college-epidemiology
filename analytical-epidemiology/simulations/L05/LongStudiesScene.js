/**
 * LongStudiesScene - blk-l05-s01: the three long cohort studies, as people. One dot = one person
 * (illustrative: the dots are not the studies' real numbers, the caption says so). Blue = a new case;
 * grey = no disease; FILLED = exposed, HOLLOW = not exposed.
 *   beat 1 (cues dayone, years)  three crowd strips, all grey on day one: "nobody ill". The learner runs
 *                                the years: a counter climbs, and each new case turns blue and leaves its
 *                                crowd for its own strip's time line, at the year it appeared. Rest: day one.
 *   beat 2 (cue stamp)           the years have run; the strips step back and the live case card slides in:
 *                                OR 13.2, stamped NO INCIDENCE.
 *   beat 3 (cue howoften)        each strip's time line gains its label: new cases per head over time.
 * No counts or rates on screen: the picture is a shape, not data.
 */
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { SIM_CROWD_CSS, crowdLive, legendHtml } from 'simulations/base/kit/SimCrowd.js';
import { flowChipHtml, bindFlow } from 'simulations/base/kit/SimFlowDom.js';
import { withNarrationCues } from '../L01/NarrationCues.js';
import { na, tagFirst, tagLive } from '../L03/NarrTags.js';
import { narrOn, narrDotsCss } from './NarrDots.js';

const END = 20;   // years drawn on each study's own clock; the line runs on past it (no end date)
const mk = (key, n, ex, cases) => {
  const on = new Map(cases);
  return Array.from({ length: n }, (_, i) => ({ id: `${key}${i}`, strip: key, exposed: ex(i), onset: on.get(i) ?? null }));
};
const STRIPS = [
  { key: 'd', narr: 'doctors', title: 'British doctors, from 1951', people: mk('d', 60, (i) => (i * 7) % 10 < 6, [[3, 4], [10, 7], [17, 9], [24, 12], [31, 13], [38, 16], [45, 18], [56, 19]]) },
  { key: 'f', narr: 'framingham', title: 'Framingham, a whole town', people: mk('f', 60, (i) => (i * 3) % 10 < 5, [[2, 2], [9, 5], [14, 8], [21, 10], [29, 11], [36, 14], [43, 15], [50, 17], [57, 20]]) },
  { key: 'm', narr: 'miners', title: 'Uranium miners  |  men never near a mine', people: mk('m', 60, (i) => i % 10 < 5, [[1, 3], [12, 6], [23, 8], [33, 11], [42, 14], [4, 15], [51, 17], [17, 18], [48, 19]]) },
];
const ALL = STRIPS.flatMap((s) => s.people);
const NARR_OF = Object.fromEntries(STRIPS.map((S) => [S.key, S.narr]));

class LongStudiesBase extends SvgScene {}

export class LongStudiesScene extends withNarrationCues(LongStudiesBase) {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }], [{ idx: 2, dwellMs: null }]];
  static ARIA_LABEL = 'Three long cohort studies drawn as crowds of dots: British doctors from 1951, the town of Framingham, and uranium miners beside men never near a mine. Nobody is ill on day one; as the years run, new cases turn blue one by one and move onto each study\'s time line. The live case card reads odds ratio 13.2, stamped no incidence. Illustrative dots, not the studies\' real numbers.';
  static CONTROLS = [];
  static SETTING = 'none';
  static HEIGHT = 640;
  static PORTRAIT_HEIGHT = 782;
  // Narration focus (spec W1 D29n): data-narr ids doctors / framingham / miners (title, dots, time line of each
  // strip), clock, noend (the no-end-date labels), perhead (beat 3 labels and bands), card with or, stamp, why inside;
  // chip, legend and the illustrative caption (never spoken) hidden while narrated.
  static CUES = ['dayone', 'years', 'stamp', 'howoften'];

  /** Narration focus contract (content-block): lit dots and bands keep their own colour (NarrDots). */
  narrationFocus(f) { narrOn(this, f); }

  async setup() {
    this.lss = { year: 0, gen: 0, card: false, lab: false };
    await super.setup();
    bindFlow(this.root, { action: (name) => { if (name === 'run') { this.runYears(); this.interactDone?.('years'); } } });
  }

  enter(step) {
    const s = this.lss;
    s.gen++;
    s.year = step === 0 ? 0 : END;
    s.card = step === 1; s.lab = step === 2;
    this.after(1.4, () => { s.card = false; s.lab = false; });
  }

  stageHeight(st) { return st.portrait ? 650 : 560; }

  runYears() {
    const s = this.lss, g = ++s.gen;
    s.year = 0;
    this.repaint();
    for (let y = 1; y <= END; y++) this.after(0.32 * y, () => { if (s.gen !== g) return; s.year = y; this.repaint(); });
  }

  applyCue(id) {
    const s = this.lss, k = this.stepIndex;
    if (id === 'dayone' && k === 0) { s.gen++; s.year = 0; this.repaint(); }
    else if (id === 'years' && k === 0) this.runYears();
    else if (id === 'stamp' && k === 1) { s.card = true; this.repaint(); this.after(1.4, () => { s.card = false; }); }
    else if (id === 'howoften' && k === 2) { s.lab = true; this.repaint(); this.after(1.4, () => { s.lab = false; }); }
  }

  cueBase() { return null; }
  cueReset() { const s = this.lss; s.gen++; s.year = this.stepIndex === 0 ? 0 : END; this.repaint(); }

  /** Band geometry for each strip: crowd block, time line. Pure in st. */
  geom(st) {
    const P = st.portrait, W = st.W;
    if (P) {
      const cols = 16, step = Math.min(20, (W - 32) / cols), r = step * 0.36, bandH = 186, top = 58;
      return STRIPS.map((S, i) => {
        const y0 = top + i * bandH, by = y0 + 26, bh = 4 * step;
        const axisY = by + bh + 10 + 2 * step + 6;
        return { S, P, y0, step, r, cols, bx: (W - cols * step) / 2, by, axisY, x0: 22, x1: W - 30, yEnd: W - 30 - (W - 52) * 0.14 };
      });
    }
    const cols = 12, step = 18, r = 6.6, bandH = 160, top = 56;
    return STRIPS.map((S, i) => {
      const y0 = top + i * bandH, by = y0 + 28, bh = 5 * step;
      return { S, P, y0, step, r, cols, bx: 20, by, axisY: by + bh, x0: 20 + cols * step + 44, x1: W - 30, yEnd: W - 30 - (W - 274) * 0.28 };
    });
  }

  layoutOf(st, year) {
    const G = this.geom(st);
    const lay = { r: G[0].r, step: G[0].step, pos: new Map(), boxOf: new Map(), boxes: [], rules: [] };
    for (const g of G) {
      const put = (list, c0, cols, dx) => list.forEach((p, i) => {
        lay.pos.set(p.id, { x: g.bx + dx + g.step * (c0 + (i % cols) + 0.5), y: g.by + g.step * (Math.floor(i / cols) + 0.5) });
        lay.boxOf.set(p.id, g.S.key);
      });
      if (g.S.key === 'm') {
        // Miners on the left, the men never near a mine on the right, a small gap between.
        const h = g.cols / 2;
        put(g.S.people.filter((p) => p.exposed), 0, h, -g.step * 0.3);
        put(g.S.people.filter((p) => !p.exposed), h, h, g.step * 0.3);
      } else put(g.S.people, 0, g.cols, 0);
      // Each case's spot on its time line is fixed (stacked over all cases), so a case lands where it always lands.
      const placed = [];
      for (const p of g.S.people.filter((q) => q.onset != null).sort((a, b) => a.onset - b.onset)) {
        const x = g.x0 + ((g.yEnd - g.x0) * p.onset) / END;
        let lvl = 0;
        while (placed.some((q) => q.lvl === lvl && Math.abs(q.x - x) < g.step * 1.02)) lvl++;
        placed.push({ x, lvl });
        if (p.onset <= year) lay.pos.set(p.id, { x, y: g.axisY - g.step * (lvl + 0.5) - 3 });
      }
    }
    return { lay, G };
  }

  paint(st) {
    const k = this.stepIndex, s = this.lss, P = st.portrait, W = st.W;
    const { lay, G } = this.layoutOf(st, s.year);
    this.lay = lay;
    this.people = ALL.map((p) => ({ ...p, ill: p.onset != null && p.onset <= s.year, dim: k === 1 }));
    let svg = '', over = '';
    for (const g of G) {
      over += `<span class="ls-title"${na(g.S.narr)} style="left:${g.P ? 16 : 20}px;top:${g.y0 + (g.P ? 2 : 4)}px">${g.S.title}</span>`;
      // The time line: years since this study began, running on past the last tick.
      svg += `<g${na(g.S.narr)}><line class="ls-axis${k === 1 ? ' ls-dim' : ''}" x1="${g.x0}" y1="${g.axisY}" x2="${g.x1}" y2="${g.axisY}"/>`;
      svg += `<path class="ls-head${k === 1 ? ' ls-dim' : ''}" d="M${g.x1 + 9} ${g.axisY}l-11 -6v12z"/>`;
      let ticks = '';
      if (!(P && k === 2) && k !== 1) {
        for (let t = 0; t <= END; t += P ? 10 : 5) {
          const x = g.x0 + ((g.yEnd - g.x0) * t) / END;
          ticks += `<line class="ls-tick" x1="${x}" y1="${g.axisY}" x2="${x}" y2="${g.axisY + 6}"/>`;
          over += `<span class="ls-tk"${na('-')} style="left:${x}px;top:${g.axisY + 8}px">${t === 0 ? 'year 0' : t}</span>`;
        }
        if (!P) over += `<span class="ls-tk ls-open"${na('noend')} style="left:${g.x1 + 10}px;top:${g.axisY + 8}px">no end date</span>`;
      }
      svg += ticks + '</g>';
      if (k === 2) {
        const lx = P ? g.x0 : g.x1 + 10, ly = P ? g.axisY + 8 : g.y0 + 2;
        over += `<span class="ls-per${P ? '' : ' ls-right'}${s.lab ? ' ls-in' : ''}"${na('perhead')} style="left:${lx}px;top:${ly}px">new cases per head over time</span>`;
        svg += `<rect class="ls-band"${na('perhead')} x="${g.x0}" y="${g.by - (P ? 4 : 2)}" width="${g.x1 - g.x0}" height="${g.axisY - g.by + (P ? 4 : 2)}"/>`;
      }
    }
    // The clock, large: day one, then the years.
    const clock = s.year === 0
      ? `<b class="sim-numeral ls-yr">Day one</b><span>nobody ill</span>`
      : `<b class="sim-numeral ls-yr">${s.year}</b><span>${s.year === 1 ? 'year' : 'years'} since each study began</span>`;
    over += `<div class="ls-clock"${na('clock')} style="left:${P ? 16 : 20}px;top:${P ? 2 : 4}px">${clock}</div>`;
    over += `<span class="ls-cap"${na('-')} style="left:${W / 2}px;top:${st.H - 22}px">illustrative: dots are not the studies' real numbers</span>`;
    if (k === 1) {
      const cw = P ? W - 40 : 300, cx = P ? 20 : W - cw - 20, cy = P ? st.H - 292 : 150;
      over += `<div class="ls-card${s.card ? ' ls-slide' : ''}"${na('card')} style="left:${cx}px;top:${cy}px;width:${cw}px">`
        + `<span class="ls-kick">Your live case</span>`
        + `<b class="sim-numeral ls-or"${na('or')}>OR 13.2</b>`
        + `<span class="ls-line">how strongly tank cleaning and the tumour travel together</span>`
        + `<span class="ls-stamp"${na('stamp')}>NO INCIDENCE</span>`
        + `<span class="ls-line ls-why"${na('why')}>groups assembled after the fact, never followed forward</span></div>`;
    }
    const head = tagFirst(flowChipHtml({ label: 'Run the years', action: 'run', icon: 'replay' }), '-')
      + tagFirst(legendHtml({ text: { ill: 'new case', well: 'no disease' } }), '-');
    return { svg, over, head };
  }

  animate() {
    crowdLive(this.live, `ls${this.lss.gen}`, this.people, this.lay, { spread: 0, dimOpacity: 0.3 });
    tagLive(this.live, `ls${this.lss.gen}`, this.people, (p) => NARR_OF[p.strip]);
  }

  css() {
    return SIM_CROWD_CSS + narrDotsCss(['doctors', 'framingham', 'miners']) + narrDotsCss(['perhead'], '.ls-band') + `
.svs-head { gap: 10px 16px; }
.svs-head .scw-legend { font-size: 16px; justify-content: center; }
.sflow-chip { min-height: 44px; font-size: 16px; }
.ls-title { position: absolute; white-space: nowrap; font: 700 17px/1.2 var(--sim-font); color: var(--sim-label); }
.ls-clock { position: absolute; display: flex; align-items: baseline; gap: 10px; white-space: nowrap; font: 600 16px/1.2 var(--sim-font); color: var(--sim-label-muted); }
.ls-yr { font: 400 40px/1 var(--sim-font-numeral); color: var(--sim-label); min-width: 1.2em; }
.ls-tk { position: absolute; transform: translate(-50%, 0); white-space: nowrap; font: 500 16px/1.1 var(--sim-font); color: var(--sim-label-muted); font-variant-numeric: tabular-nums; }
.ls-open { transform: translate(-100%, 0); font-style: italic; }
.ls-per { position: absolute; white-space: nowrap; font: 700 17px/1.2 var(--sim-font); color: var(--sim-annot); }
.ls-right { transform: translateX(-100%); }
.ls-in { animation: ls-fade 0.7s ease both; }
.ls-cap { position: absolute; transform: translate(-50%, 0); white-space: nowrap; font: italic 500 16px/1.2 var(--sim-font); color: var(--sim-label-muted); }
.ls-card { position: absolute; display: flex; flex-direction: column; gap: 6px; padding: 16px 20px 18px; background: var(--sim-bg-surface); border: 1px solid var(--sim-label-muted); border-top: 3px solid var(--sim-annot); box-shadow: 0 10px 28px color-mix(in srgb, var(--sim-label) 18%, transparent); }
.ls-slide { animation: ls-slide 0.7s cubic-bezier(.2,.8,.3,1) both; }
.ls-kick { font: 700 16px/1.2 var(--sim-font); color: var(--sim-label-muted); text-transform: uppercase; letter-spacing: 0.06em; }
.ls-or { font: 400 60px/1 var(--sim-font-numeral); color: var(--sim-annot); }
.ls-line { font: 500 16px/1.3 var(--sim-font); color: var(--sim-label); }
.ls-why { color: var(--sim-label-muted); }
.ls-stamp { align-self: flex-start; margin: 6px 0 2px; padding: 4px 12px; border: 3px solid var(--sim-bad); color: var(--sim-bad); font: 800 22px/1.1 var(--sim-font); letter-spacing: 0.08em; transform: rotate(-4deg); }
svg .ls-axis { stroke: var(--sim-label); stroke-width: 2; }
svg .ls-head { fill: var(--sim-label); }
svg .ls-tick { stroke: var(--sim-label-muted); stroke-width: 1.5; }
svg .ls-dim { opacity: 0.35; }
svg .ls-band { fill: var(--sim-annot-tint); }
@keyframes ls-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes ls-slide { from { opacity: 0; transform: translateX(60px); } to { opacity: 1; transform: none; } }
`;
  }
}
