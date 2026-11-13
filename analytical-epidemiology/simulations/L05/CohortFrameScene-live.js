/**
 * CohortFrameScene-live - blk-l05-s08, the lesson's payoff (live case, illustrative). The plant's two cohorts as
 * people: 2,000 tank cleaners (FILLED) and 8,000 other men (HOLLOW), all grey (free of the tumour) when follow-up
 * opens. Cohort dots: 1 dot = 20 men (100 and 400 dots). Case dots: 1 dot = 1 man. Blue = has the tumour.
 *   beat 1 (cues cohorts, cases)  twenty years run (learner: "Run twenty years"); the 12 and 4 cases leave their
 *                                 cohorts one by one and stand in front of them, a count beside each
 *   beat 2 (cue rr)               learner: "Work the incidences": 12 / 2,000 = 6.0 per 1,000; 4 / 8,000 = 0.5 per
 *                                 1,000; RR = 6.0 / 0.5 = 12.0 lands large (a quiet celebrate once)
 *   beat 3 (cue agree)            two bars rising from 1.0 (no difference): OR 13.2 from 20 cases and 60 controls,
 *                                 RR 12.0 from 10,000 men followed; caption: a very rare disease keeps the two close
 * Every beat lands at rest on its finished picture (beat 2 starts unworked only when stepped into from beat 1).
 */
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { SIM_CROWD_CSS, crowdLive, legendHtml } from 'simulations/base/kit/SimCrowd.js';
import { flowChipHtml, bindFlow } from 'simulations/base/kit/SimFlowDom.js';
import { withNarrationCues } from '../L01/NarrationCues.js';
import { na, tagFirst, tagLive } from '../L03/NarrTags.js';
import { narrOn, narrDotsCss } from './NarrDots.js';

const PER = 20, NR = 2000, NO = 8000, CR = 12, CO = 4, YEARS = 20;
const I1 = (1000 * CR) / NR, I0 = (1000 * CO) / NO, RR = I1 / I0, OR = 13.2;   // 6.0, 0.5, 12.0; OR from lesson 3
const REACT = Array.from({ length: NR / PER }, (_, i) => ({ id: `r${i}`, exposed: true, ill: false }));
const OTHER = Array.from({ length: NO / PER }, (_, i) => ({ id: `o${i}`, exposed: false, ill: false }));
const CASES = [
  ...Array.from({ length: CR }, (_, i) => ({ id: `c${i}`, exposed: true, ill: true, host: `r${(i * 8 + 3) % 100}`, onset: 1 + ((i * 7) % YEARS) })),
  ...[5, 9, 14, 18].map((t, i) => ({ id: `k${i}`, exposed: false, ill: true, host: `o${(i * 97 + 41) % 400}`, onset: t })),
];
const fmt = (n) => n.toLocaleString('en-US');

class LiveCohortBase extends SvgScene {}

export class CohortFrameSceneLive extends withNarrationCues(LiveCohortBase) {
  static BEAT_STEP_MAP = [0, 1, 2].map((i) => [{ idx: i, dwellMs: null }]);
  static ARIA_LABEL = 'The plant cohort: 2,000 tank cleaners and 8,000 other men, one dot for 20 men, all free of the tumour. Over twenty years 12 tank cleaners and 4 other men develop the tumour, one dot per man. Incidence 12 of 2,000 is 6.0 per 1,000; 4 of 8,000 is 0.5 per 1,000; relative risk 12.0. Two bars from 1.0: odds ratio 13.2 from 20 cases and 60 controls, relative risk 12.0 from 10,000 men followed.';
  static CONTROLS = [];
  static SETTING = 'none';
  static HEIGHT = 580;
  static PORTRAIT_HEIGHT = 792;
  // Narration focus (spec W1 D29n): data-narr ids reactor / other (head and cohort dots), clock, rcases / ocases
  // (case dots and count of each tray), read0, read1, rr (beat 2); orbar / rrbar (bar, value, source), base (the 1.0
  // line, its tick and label), rare (the caption) on beat 3; chips, legend, scale caption and title hidden while
  // narrated. Narrated, beat 2 posts its readouts at show.read0 / show.read1, not on the scene's own timer. A cue
  // never counts as the learner's (the rr cue works the incidences without interactDone).
  static CUES = ['cohorts', 'cases', 'rr', 'agree', 'show.read0', 'show.read1'];

  /** Narration focus contract (content-block): only the narrated flag is kept; the engine dims and holds the tagged parts. */
  narrationFocus(f) { this.lcNarr = !!f?.narrated; narrOn(this, f); }

  async setup() {
    this.lcs = { year: YEARS, gen: 0, last: null, worked: 2, grow: false, cheered: false };
    await super.setup();
    bindFlow(this.root, {
      action: (name) => {
        if (name === 'run') { this.runYears(); this.interactDone?.('cases'); }
        else if (name === 'work') this.work();
        else if (name === 'bars') { this.lcs.grow = true; this.lcs.gen++; this.repaint(); this.after(1.6, () => { this.lcs.grow = false; }); }
      },
    });
  }

  enter(step) {
    const s = this.lcs, came = s.prevShown;   // a beat this scene really showed before (never setup's own enter(0))
    s.last = step;
    s.gen++;
    s.year = YEARS;
    s.worked = 2;   // rest: worked; stepping forward from beat 1 replays the working by itself
    if (step === 1 && came === 0 && this.lcNarr) s.worked = 0;
    else if (step === 1 && came === 0) this.after(0.5, () => this.work(true));
    s.grow = step === 2;
    this.after(1.6, () => { s.grow = false; });
  }

  onBeatChange(beat, count) {
    const s = this.lcs;
    s.prevShown = s.shown ?? null;
    super.onBeatChange(beat, count);
    s.shown = this.stepIndex;
  }

  stageHeight(st) {
    const k = this.stepIndex ?? 0;
    if (st.portrait) return [636, 660, 580][k];
    return k === 2 ? 440 : 470;
  }

  runYears() {
    const s = this.lcs, g = ++s.gen;
    s.year = 0;
    this.repaint();
    for (let y = 1; y <= YEARS; y++) this.after(0.26 * y, () => { if (s.gen !== g) return; s.year = y; this.repaint(); });
  }

  work(auto = false) {
    const s = this.lcs;
    if (this.stepIndex !== 1) return;
    s.worked = 0; s.gen++;
    this.repaint();
    this.after(0.3, () => { s.worked = 1; this.repaint(); });
    this.after(1.3, () => {
      s.worked = 2; this.repaint();
      if (!auto) this.interactDone?.('rr');
      if (!s.cheered) { s.cheered = true; this.after(0.8, () => this.celebrate()); }
    });
  }

  applyCue(id) {
    const s = this.lcs, k = this.stepIndex;
    if (id === 'cohorts' && k === 0) { s.gen++; s.year = 0; this.repaint(); }
    else if (id === 'cases' && k === 0) this.runYears();
    else if (id === 'rr' && k === 1 && s.worked < 2) this.work(true);
    else if (id === 'show.read0' && k === 1 && s.worked < 1) { s.worked = 1; this.repaint(); }
    else if (id === 'show.read1' && k === 1 && s.worked < 2) {
      s.worked = 2; this.repaint();
      if (!s.cheered) { s.cheered = true; this.after(0.8, () => this.celebrate()); }
    }
    else if (id === 'agree' && k === 2) { s.grow = true; s.gen++; this.repaint(); this.after(1.6, () => { s.grow = false; }); }
  }

  cueBase() { return { worked: this.lcs.worked }; }
  cueReset(base) { const s = this.lcs; s.gen++; s.year = YEARS; if (base) s.worked = base.worked; this.repaint(); }

  geom(st) {
    const P = st.portrait, W = st.W;
    if (P) {
      const cols = 25, step = Math.min(14, (W - 32) / cols), x0 = (W - cols * step) / 2;
      const yR = this.stepIndex === 1 ? 50 : 110, yT1 = yR + 4 * step + 16, yO = yT1 + step + 96, yT2 = yO + 16 * step + 16;
      return { P, W, cols, step, r: step * 0.36, x0, yR, yO, rows: 1, tray: [{ x: x0, y: yT1, cols: 12 }, { x: x0, y: yT2, cols: 12 }], rr: { x: 16, y: yT2 + step + 50 } };
    }
    const cols = 25, step = 13, x0 = 20, yR = 96, yO = 204;
    const tx = x0 + cols * step + 40;
    return { P, W, cols, step, r: step * 0.36, x0, yR, yO, rows: 2, tray: [{ x: tx, y: yR, cols: 6 }, { x: tx, y: yO, cols: 6 }], rr: { x: tx, y: yO + 96 } };
  }

  layoutOf(st, year) {
    const g = this.geom(st);
    const lay = { r: g.r, step: g.step, pos: new Map(), boxOf: new Map(), boxes: [], rules: [] };
    const put = (list, x0, y0, cols, box) => list.forEach((p, i) => { lay.pos.set(p.id, { x: x0 + g.step * (i % cols + 0.5), y: y0 + g.step * (Math.floor(i / cols) + 0.5) }); lay.boxOf.set(p.id, box); });
    put(REACT, g.x0, g.yR, g.cols, 'R');
    put(OTHER, g.x0, g.yO, g.cols, 'O');
    const out = CASES.filter((p) => p.onset <= year);
    put(out.filter((p) => p.exposed), g.tray[0].x, g.tray[0].y, g.tray[0].cols, 'CR');
    put(out.filter((p) => !p.exposed), g.tray[1].x, g.tray[1].y, g.tray[1].cols, 'CO');
    return { lay, g, nR: out.filter((p) => p.exposed).length, nO: out.filter((p) => !p.exposed).length };
  }

  paint(st) {
    const k = this.stepIndex, s = this.lcs, P = st.portrait, W = st.W;
    let svg = '', over = '';
    const legend = legendHtml({ items: [
      { label: 'tumour', color: 'var(--sim-annot)', filled: true },
      { label: 'free of it', color: 'var(--sim-label-muted)', filled: true },
      { label: 'filled: tank cleaning', color: 'var(--sim-label)', filled: true },
      { label: 'hollow: other work', color: 'var(--sim-label)', filled: false },
    ] });
    if (k === 2) { this.lay = null; return this.paintBars(st, legend); }
    const { lay, g, nR, nO } = this.layoutOf(st, s.year);
    this.lay = lay;
    this.people = [...REACT, ...OTHER, ...CASES];
    this.hostOf = (p) => lay.pos.get(p.host ?? p.id);
    over += `<span class="lc-head"${na('reactor')} style="left:${g.x0}px;top:${g.yR - 10}px"><b>2,000 tank cleaners</b>${P ? '' : '<span>at least five years cleaning the tanks</span>'}</span>`;
    over += `<span class="lc-head"${na('other')} style="left:${g.x0}px;top:${g.yO - 10}px"><b>8,000 other men</b>${P ? '' : '<span>same workforce</span>'}</span>`;
    const clock = s.year === 0
      ? `<b class="sim-numeral lc-yr">Follow-up opens</b><span>all free of the tumour</span>`
      : `<b class="sim-numeral lc-yr">Year ${s.year}</b><span>${s.year === YEARS ? 'twenty years of follow-up' : 'of follow-up'}</span>`;
    if (!(P && k === 1)) over += `<div class="lc-clock${P ? ' lc-clockp' : ''}"${na('clock')} style="left:${g.x0}px;top:4px">${clock}</div>`;
    // Each tray: the cases pulled out in front of their cohort, counted; beat 2 adds the incidence.
    const rows = [[nR, CR, NR, I1], [nO, CO, NO, I0]];
    rows.forEach(([n, total, N, inc], i) => {
      const t = g.tray[i], tw = Math.min(total, t.cols) * g.step;
      const lx = t.x + tw + 14, ly = t.y + (g.rows * g.step) / 2;
      over += `<div class="lc-count"${na(i === 0 ? 'rcases' : 'ocases')} style="left:${lx}px;top:${ly}px"><b class="sim-numeral lc-n">${n}</b><span>${n === 1 ? 'man' : 'men'} with<br>the tumour</span></div>`;
      if (k === 1) {
        const on = s.worked > i;
        const ry = t.y + g.rows * g.step + (P ? 28 : 10);
        over += `<div class="lc-read${on ? ' on' : ''}${on && s.worked < 2 + i ? ' lc-land' : ''}"${na(`read${i}`)} style="left:${t.x}px;top:${ry}px">`
          + (on ? `<span>${total} / ${fmt(N)} =</span><b class="sim-numeral lc-inc">${inc.toFixed(1)}</b><span>per 1,000</span>` : `<span class="lc-wait">${total} / ${fmt(N)} = ?</span>`) + '</div>';
      }
    });
    if (k === 1) {
      const on = s.worked >= 2;
      over += `<div class="lc-rr${P ? ' lc-rrp' : ''}${on ? ' on' : ''}"${na('rr')} style="left:${g.rr.x}px;top:${g.rr.y + (P ? 36 : 8)}px">`
        + (on ? `<span>RR = ${I1.toFixed(1)} / ${I0.toFixed(1)} =</span><b class="sim-numeral lc-big">${RR.toFixed(1)}</b>` : '<span class="lc-wait">RR = ?</span>') + '</div>';
    }
    over += `<span class="lc-cap"${na('-')} style="left:${W / 2}px;top:${st.H - 24}px">cohorts: 1 dot = 20 men &middot; cases: 1 dot = 1 man</span>`;
    const head = tagFirst(k === 0 ? flowChipHtml({ label: 'Run twenty years', action: 'run', icon: 'replay' }) : flowChipHtml({ label: 'Work the incidences', action: 'work', icon: '' }), '-') + tagFirst(legend, '-');
    return { svg, over, head };
  }

  paintBars(st, legend) {
    const P = st.portrait, W = st.W, s = this.lcs;
    let svg = '', over = '';
    const top = P ? 150 : 140, base = P ? st.H - 150 : st.H - 128, L = P ? 48 : 120, R = P ? W - 20 : W - 120, MAX = 14;
    const yOf = (v) => base - ((v - 1) / (MAX - 1)) * (base - top);
    for (const v of [5, 10]) {
      svg += `<line class="lc-grid" x1="${L}" y1="${yOf(v)}" x2="${R}" y2="${yOf(v)}"/>`;
      over += `<span class="lc-tk" style="left:${L - 8}px;top:${yOf(v)}px">${v.toFixed(1)}</span>`;
    }
    const bw = P ? 92 : 128, gap = (R - L - 2 * bw) / 3;
    const bars = [
      { v: OR, name: 'OR', from: P ? 'from 20 cases<br>and 60<br>controls' : 'from 20 cases and<br>60 controls', cls: 'or' },
      { v: RR, name: 'RR', from: P ? 'from 10,000<br>men<br>followed' : 'from 10,000 men<br>followed', cls: 'rr' },
    ];
    bars.forEach((b, i) => {
      const x = L + gap + i * (bw + gap), y = yOf(b.v), n = `${b.cls}bar`;
      svg += `<rect${na(n)} class="lc-bar ${b.cls}${s.grow ? ' lc-grow' : ''}" style="--d:${0.15 + i * 0.35}s" x="${x}" y="${y}" width="${bw}" height="${base - y}"/>`;
      over += `<div class="lc-bv ${b.cls}${s.grow ? ' lc-late' : ''}"${na(n)} style="left:${x + bw / 2}px;top:${y - 8}px;--d:${0.9 + i * 0.35}s"><span>${b.name}</span><b class="sim-numeral">${b.v.toFixed(1)}</b></div>`;
      over += `<span class="lc-from"${na(n)} style="left:${x + bw / 2}px;top:${base + 12}px">${b.from}</span>`;
    });
    svg += `<line${na('base')} class="lc-base" x1="${L - 4}" y1="${base}" x2="${R}" y2="${base}"/>`;
    over += `<span class="lc-tk lc-one"${na('base')} style="left:${L - 8}px;top:${base}px">1.0</span>`;
    over += P ? `<span class="lc-nod"${na('base')} style="left:4px;top:${base + 30}px">no<br>difference</span>` : `<span class="lc-nod"${na('base')} style="left:${R + 10}px;top:${base - 18}px">1.0 = no<br>difference</span>`;
    over += `<span class="lc-cap lc-capb"${na('rare')} style="left:${W / 2}px;top:${st.H - 34}px">a very rare disease keeps the two close</span>`;
    over += `<div class="lc-title"${na('-')} style="left:${W / 2}px;top:8px">Same plant, two designs</div>`;
    return { svg, over, head: tagFirst(flowChipHtml({ label: 'Set them side by side', action: 'bars', icon: 'replay' }), '-') };
  }

  animate() {
    if (!this.lay) return;
    crowdLive(this.live, `lc${this.lcs.gen}`, this.people, this.lay, { from: this.hostOf, spread: 0 });
    tagLive(this.live, `lc${this.lcs.gen}`, this.people, (p) => (p.ill ? (p.exposed ? 'rcases' : 'ocases') : (p.exposed ? 'reactor' : 'other')));
  }

  css() {
    return SIM_CROWD_CSS + narrDotsCss(['reactor', 'other', 'rcases', 'ocases']) + `
.svs-head { gap: 10px 14px; }
.svs-head .scw-legend { font-size: 16px; justify-content: center; }
.sflow-chip { min-height: 44px; font-size: 16px; }
.lc-head { position: absolute; transform: translate(0, -100%); display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; white-space: nowrap; font: 500 16px/1.2 var(--sim-font); color: var(--sim-label-muted); }
.lc-head b { font-size: 18px; font-weight: 800; color: var(--sim-label); }
.lc-clock { position: absolute; display: flex; align-items: baseline; gap: 12px; white-space: nowrap; font: 600 16px/1.2 var(--sim-font); color: var(--sim-label-muted); }
.lc-clockp { flex-direction: column; gap: 4px; }
.lc-yr { font: 400 34px/1 var(--sim-font-numeral); color: var(--sim-label); }
.lc-count { position: absolute; transform: translate(0, -50%); display: flex; align-items: center; gap: 8px; font: 600 16px/1.15 var(--sim-font); color: var(--sim-label-muted); }
.lc-n { font: 400 38px/1 var(--sim-font-numeral); color: var(--sim-annot); min-width: 1.1em; text-align: right; }
.lc-read { position: absolute; display: flex; align-items: baseline; gap: 8px; white-space: nowrap; font: 600 16px/1.2 var(--sim-font); color: var(--sim-label-muted); }
.lc-read.on { color: var(--sim-label); }
.lc-inc { font: 400 30px/1 var(--sim-font-numeral); color: var(--sim-annot); }
.lc-wait { font-style: italic; }
.lc-rr { position: absolute; display: flex; flex-direction: column; gap: 2px; white-space: nowrap; font: 600 16px/1.2 var(--sim-font); color: var(--sim-label-muted); }
.lc-rrp { flex-direction: row; align-items: baseline; gap: 12px; }
.lc-rr.on { color: var(--sim-label); }
.lc-big { font: 400 78px/1 var(--sim-font-numeral); color: var(--sim-annot); }
.lc-rr.on .lc-big, .lc-read.on.lc-land { animation: lc-land 0.8s cubic-bezier(.2,.8,.3,1) both; }
@keyframes lc-land { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
.lc-cap { position: absolute; transform: translate(-50%, 0); white-space: nowrap; font: italic 500 16px/1.2 var(--sim-font); color: var(--sim-label-muted); }
.lc-capb { font-size: 18px; color: var(--sim-label); }
.lc-title { position: absolute; transform: translate(-50%, 0); white-space: nowrap; font: 700 20px/1.2 var(--sim-font); color: var(--sim-label); }
.lc-tk { position: absolute; transform: translate(-100%, -50%); font: 500 16px/1 var(--sim-font); color: var(--sim-label-muted); font-variant-numeric: tabular-nums; }
.lc-one { font-weight: 800; color: var(--sim-label); }
.lc-nod { position: absolute; white-space: nowrap; font: italic 600 16px/1.2 var(--sim-font); color: var(--sim-label-muted); }
.lc-bv { position: absolute; transform: translate(-50%, -100%); display: flex; align-items: baseline; gap: 8px; white-space: nowrap; font: 700 18px/1.1 var(--sim-font); color: var(--sim-label); }
.lc-bv b { font: 400 52px/1 var(--sim-font-numeral); }
.lc-bv.rr b { color: var(--sim-annot); }
.lc-from { position: absolute; transform: translate(-50%, 0); text-align: center; white-space: nowrap; font: 600 16px/1.25 var(--sim-font); color: var(--sim-label-muted); }
.lc-late { animation: lc-fade 0.5s ease both; animation-delay: var(--d, 0s); }
@keyframes lc-fade { from { opacity: 0; } to { opacity: 1; } }
svg .lc-bar.or { fill: var(--sim-label-muted); }
svg .lc-bar.rr { fill: var(--sim-annot); }
svg .lc-grow { transform-box: fill-box; transform-origin: bottom; animation: lc-grow 0.9s cubic-bezier(.3,.8,.3,1) both; animation-delay: var(--d, 0s); }
@keyframes lc-grow { from { transform: scaleY(0); } to { transform: none; } }
svg .lc-base { stroke: var(--sim-label); stroke-width: 2.5; }
svg .lc-grid { stroke: var(--sim-label-muted); stroke-width: 1; opacity: 0.4; stroke-dasharray: 4 5; }
`;
  }
}
