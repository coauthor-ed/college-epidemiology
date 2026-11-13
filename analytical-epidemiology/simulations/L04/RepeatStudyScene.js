/**
 * RepeatStudyScene - L04 s02 "A small P value feels like a certificate". One dot = one run of the same study
 * (100 cases, 100 controls, true exposure 30 per cent in both: illustrative). The runs are COMPUTED here: a seeded
 * PRNG (mulberry32, seed 3, no crypto) draws each person's exposure; each run gives a 2 x 2, its odds ratio
 * (0.5 added to every cell if a cell is 0) and a Pearson chi-square P (1 df). Same seed, same picture, every time.
 * The bias: cases over-report exposure by 15 percentage points (reported 45 per cent); the same draws are reused,
 * so each run's dot travels right from its honest place.
 *   beat 1 (cues honest, repeat)  "Run the study 100 times": the dots drop as a beeswarm round 1.00 on a log axis
 *                                 0.25 .. 8; ringed = P < 0.05; counter P < 0.05: 5 of 100 (computed)
 *   beat 2 (cues bias, pblind)    "Add one bias": the cloud moves right and stays there; P < 0.05: 58 of 100
 *   beat 3                        three door labels as the hook; the biased cloud kept
 */
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { SIM_CROWD_CSS, crowdLive, swarmLayout, axisParts, legendHtml } from 'simulations/base/kit/SimCrowd.js';
import { flowChipHtml, bindFlow } from 'simulations/base/kit/SimFlowDom.js';
import { mulberry32 } from 'simulations/base/kit/SimLook.js';
import { withNarrationCues } from '../L01/NarrationCues.js';
import { na, tagTop, tagEl } from './NarrTags.js';

const RUNS = 100, N = 100, P_TRUE = 0.3, P_BIAS = 0.45, SEED = 3;
const LO = 0.25, HI = 8;

// erfc by Abramowitz and Stegun 7.1.26 (x >= 0); P for chi-square with 1 df = erfc(sqrt(chi2 / 2)).
function erfc(x) {
  const t = 1 / (1 + 0.3275911 * x);
  return t * (0.254829592 + t * (-0.284496736 + t * (1.421413741 + t * (-1.453152027 + t * 1.061405429)))) * Math.exp(-x * x);
}
function runAll(pCase) {
  const rnd = mulberry32(SEED), out = [];
  for (let k = 0; k < RUNS; k++) {
    let a = 0, b = 0;
    for (let i = 0; i < N; i++) if (rnd() < pCase) a++;
    for (let i = 0; i < N; i++) if (rnd() < P_TRUE) b++;
    let A = a, B = b, C = N - a, D = N - b;
    const chi = (2 * N * (A * D - B * C) ** 2) / ((A + B) * (C + D) * (A + C) * (B + D) || 1);
    const p = erfc(Math.sqrt(chi / 2));
    if (!A || !B || !C || !D) { A += 0.5; B += 0.5; C += 0.5; D += 0.5; }
    out.push({ or: (A * D) / (B * C), p });
  }
  return out;
}
const HONEST = runAll(P_TRUE), BIASED = runAll(P_BIAS);
const sig = (list) => list.filter((r) => r.p < 0.05).length;
const median = (list) => { const v = list.map((r) => r.or).sort((x, y) => x - y); return (v[RUNS / 2 - 1] + v[RUNS / 2]) / 2; };
const SIG_H = sig(HONEST), SIG_B = sig(BIASED), MED_H = median(HONEST), MED_B = median(BIASED);
const fmtOr = (v) => (v < 1 ? String(v) : `${v}`);

const lab = (x, y, html, cls = '', n = '') => `<span${na(n)} class="rs-lab ${cls}" style="left:${x.toFixed(1)}px;top:${y.toFixed(1)}px">${html}</span>`;

class RepeatStudyBase extends SvgScene {}

export class RepeatStudyScene extends withNarrationCues(RepeatStudyBase) {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }], [{ idx: 2, dwellMs: null }]];
  static ARIA_LABEL = `The same study, 100 cases and 100 controls with no true effect, is run 100 times. Each run is a dot on a log odds-ratio axis from 0.25 to 8; the honest runs scatter on both sides of 1.00, the truth, and ${SIG_H} of 100 reach P below 0.05. With one bias, cases over-reporting exposure by 15 points, the whole cloud moves right, centred near ${MED_B.toFixed(2)}, and ${SIG_B} of 100 reach P below 0.05.`;
  static CONTROLS = [];
  static SETTING = 'none';
  static HEIGHT = 670;
  static PORTRAIT_HEIGHT = 690;
  static CUES = ['honest', 'repeat', 'bias', 'pblind'];

  async setup() {
    this.rs = { bias: false, gen: 0, drop: false, came: null, last: null, truth: false, pl: false, fresh: false };
    await super.setup();
    bindFlow(this.root, {
      action: (name) => {
        if (name === 'run') { this.runDrop(); this.interactDone?.('repeat'); }
        if (name === 'bias') { this.toggleBias(); this.interactDone?.('bias'); }
      },
    });
  }

  enter(step) {
    const t = this.rs;
    t.came = t.last != null && Math.abs(t.last - step) === 1 ? t.last : null;
    t.last = step;
    t.drop = false; t.truth = step === 0; t.pl = false;
    t.fresh = step === 1 && t.came === 0;   // forward from the honest cloud: the dots travel right
    t.bias = step > 0;
    this.after(3, () => { t.truth = false; t.fresh = false; });
  }

  stageHeight(st) { const k = this.stepIndex ?? 0; return st.portrait ? (k === 2 ? 600 : 596) : (k === 2 ? 584 : 534); }

  runDrop() {
    const t = this.rs;
    t.gen++; t.drop = true; t.fresh = false;
    this.repaint();
  }

  toggleBias() {
    const t = this.rs;
    if (this.stepIndex === 0) return;
    t.bias = !t.bias; t.drop = false; t.fresh = false;
    this.repaint();
  }

  applyCue(id) {
    const t = this.rs, k = this.stepIndex;
    if (id === 'honest' && k === 0) { t.truth = true; this.repaint(); }
    else if (id === 'repeat' && k === 0) this.runDrop();
    else if (id === 'bias' && k === 1) { t.bias = false; this.repaint(); this.after(0.15, () => { t.bias = true; this.repaint(); }); }
    else if (id === 'pblind' && k === 1) { t.bias = true; t.pl = true; this.repaint(); }
  }

  cueBase() { return null; }
  cueReset() { const t = this.rs; t.pl = false; t.truth = false; t.bias = this.stepIndex > 0; this.repaint(); }

  rect(st) {
    const k = this.stepIndex ?? 0;
    return st.portrait ? { x: 22, y: 150, w: st.W - 44, h: k === 2 ? 240 : 296 } : { x: 34, y: 152, w: st.W - 68, h: 262 };
  }

  layOf(st, bias) {
    const list = bias ? BIASED : HONEST;
    const people = list.map((r, i) => ({ id: `r${i}`, v: Math.log(r.or) }));
    return swarmLayout(people, this.rect(st), { value: (p) => p.v, min: Math.log(LO), max: Math.log(HI), side: 'both', maxR: 9.5 });
  }

  paint(st) {
    const k = this.stepIndex, t = this.rs, P = st.portrait, W = st.W;
    const list = t.bias ? BIASED : HONEST;
    const lay = this.layOf(st, t.bias);
    this.lay = lay;
    const toX = lay.axis.toX, rect = this.rect(st);
    this.people = list.map((r, i) => ({ id: `r${i}`, ill: false, tone: 'label', mark: r.p < 0.05 ? 'ring' : undefined, dim: (t.pl && r.p >= 0.05) || (k === 2 && false), lit: t.pl && r.p < 0.05 }));
    this.from = t.drop ? (p) => ({ x: lay.pos.get(p.id).x, y: rect.y - 90 }) : (t.fresh ? this.layOf(st, false) : null);
    this.flyOpt = { order: t.drop ? 'random' : 'x', spread: t.drop ? 2.2 : 0.9 };
    let svg = '', over = '';
    // Axis, ticks and the truth line.
    const ax = axisParts(lay, { ticks: [0.25, 0.5, 1, 2, 4, 8].map(Math.log), fmt: (v) => fmtOr(Number(Math.exp(v).toFixed(2))) });
    svg += tagTop(ax.svg, 'runs'); over += tagTop(ax.over, 'runs');
    over += lab(W / 2, lay.axis.y + 46, 'odds ratio of one run (log scale)', 'rs-axlab', 'runs');
    const x1 = toX(0);
    svg += `<line${na('truth')} class="rs-truth${t.truth ? ' rs-truth--lit' : ''}" x1="${x1}" y1="${rect.y - 12}" x2="${x1}" y2="${lay.axis.y}"/>`;
    over += lab(x1, rect.y - 24, '1.00 the truth: no effect', `rs-tag${t.truth ? ' rs-tag--lit' : ''}`, 'truth');
    // Where the honest cloud sat, and the centre of the cloud on screen.
    const med = t.bias ? MED_B : MED_H, xm = toX(Math.log(med));
    svg += `<path${na('centre')} class="rs-med" d="M${xm - 7} ${lay.axis.y + 14} L${xm + 7} ${lay.axis.y + 14} L${xm} ${lay.axis.y + 5} Z"/>`;
    if (t.bias) {
      const yA = rect.y + 2;
      svg += `<line${na('shift')} class="rs-shift" x1="${x1 + 4}" y1="${yA - 4}" x2="${xm - 10}" y2="${yA - 4}"/>`;
      svg += `<path${na('shift')} class="rs-shift-hd" d="M${xm - 10} ${yA - 9} L${xm - 2} ${yA - 4} L${xm - 10} ${yA + 1} Z"/>`;
      if (!P) over += lab(W - 34, rect.y - 24, 'repeats do not pull it back', `rs-note rs-note--r${k === 1 ? ' rs-note--on' : ''}`, 'note');
    }
    // The counter: the payoff of each beat, the biggest thing on screen.
    const n = t.bias ? SIG_B : SIG_H;
    const cx = P ? 22 : 34, cy = P ? 16 : 10;
    over += `<div${na(k === 0 ? '-' : 'pcount')} class="rs-count${t.pl ? ' rs-count--lit' : ''}" style="left:${cx}px;top:${cy}px"><span class="rs-count__k">P &lt; 0.05</span>`
      + `<b class="sim-numeral rs-count__n">${n}</b><span class="rs-count__of">of 100 runs</span></div>`;
    over += `<div${na('study')} class="rs-meta" style="right:${P ? 22 : 34}px;top:${cy + 6}px">${t.bias ? `one bias: cases over-report<br>exposure by 15 points${P ? `<br><b${na('note')}>repeats do not pull it back</b>` : ''}` : 'honest study, no bias'}<br><span>centre ${med.toFixed(2)}</span></div>`;
    const legend = legendHtml({ items: [{ label: 'one run of the study', color: 'var(--sim-label)', filled: true }] })
      + '<span class="rs-ringkey"><svg viewBox="-9 -9 18 18" aria-hidden="true"><circle r="4.5" class="rs-k-dot"/><circle r="7.6" class="rs-k-ring"/></svg>ringed: P &lt; 0.05</span>';
    over += `<div${na('-')} class="rs-legend" style="top:${lay.axis.y + 72}px">${legend}</div>`;
    if (k === 2) {
      const doors = ['what they remember', 'who asks', 'which door'];
      const y = lay.axis.y + (P ? 110 : 104);
      over += `<div class="rs-doors" style="left:${P ? 14 : 34}px;right:${P ? 14 : 34}px;top:${y}px">${doors.map((d, i) => `<span${na(`door${i + 1}`)} class="rs-door" style="--d:${0.2 + i * 0.25}s">${d}</span>`).join('')}</div>`;
    }
    const chip = k === 0
      ? flowChipHtml({ label: 'Run the study 100 times', action: 'run', icon: 'replay' })
      : flowChipHtml({ label: t.bias ? 'Remove the bias' : 'Add one bias', action: 'bias', value: t.bias ? 'on' : 'off' }) + flowChipHtml({ label: 'Run again', action: 'run', icon: 'replay' });
    return { svg, over, head: tagTop(chip, '-') };
  }

  animate() {
    // Each dot keeps 0.66 of its swarm slot, so a P < 0.05 ring never touches a neighbour.
    const key = `s${this.rs.gen}`;
    crowdLive(this.live, key, this.people, this.lay, { from: this.from, scale: 0.66, ...this.flyOpt });
    tagEl(this.live.get(key), 'runs');
    tagEl(this.live.get(`${key}|marks`), this.stepIndex === 0 ? '-' : 'rings');
  }

  testState() {
    const t = this.rs;
    return { stage: this.stepIndex, bias: t.bias, sigHonest: SIG_H, sigBiased: SIG_B, medianHonest: MED_H.toFixed(2), medianBiased: MED_B.toFixed(2) };
  }

  css() {
    return SIM_CROWD_CSS + `
/* Narrated focus: group labels light by brightness, not by a ring each (spec W1 D29n). */
.scw-tk[data-narr], .rs-axlab[data-narr] { outline: none !important; }
.svs-head { gap: 8px 12px; }
.sflow-chip { min-height: 44px; font-size: 16px; }
.rs-lab { position: absolute; transform: translate(-50%, -50%); white-space: nowrap; font: 600 16px/1.2 var(--sim-font); color: var(--sim-label); }
.rs-axlab { font-weight: 600; color: var(--sim-label-muted); }
.scw-tk { font-size: 16px; }
.rs-tag { font-weight: 700; color: var(--sim-label); background: var(--sim-bg-deep); padding: 0 6px; transition: color 0.4s ease; }
.rs-tag--lit { color: var(--sim-annot); }
.rs-note { transform: translate(0, -50%); text-align: left; font-weight: 700; color: var(--sim-label-muted); line-height: 1.2; }
.rs-note--r { transform: translate(-100%, -50%); text-align: right; }
.rs-note--on { color: var(--sim-label); }
.rs-count { position: absolute; display: grid; grid-template-columns: auto auto; grid-template-rows: auto auto; column-gap: 10px; align-items: end; }
.rs-count__k { grid-column: 1 / 3; margin-bottom: 8px; font: 700 16px/1.2 var(--sim-font); color: var(--sim-label-muted); }
.rs-count__n { font: 400 64px/1 var(--sim-font-numeral); color: var(--sim-label); transition: color 0.4s ease; }
.rs-count__of { font: 600 17px/1.2 var(--sim-font); color: var(--sim-label-muted); padding-bottom: 6px; }
.rs-count--lit .rs-count__n { color: var(--sim-annot); }
.rs-meta { position: absolute; text-align: right; font: 600 15px/1.3 var(--sim-font); color: var(--sim-label-muted); }
.rs-meta b { color: var(--sim-label); }
.rs-meta span { color: var(--sim-label); font-weight: 700; }
.rs-legend { position: absolute; left: 0; right: 0; display: flex; flex-wrap: wrap; justify-content: center; gap: 4px 16px; transform: translateY(-50%); }
.rs-legend .scw-legend { font-size: 15px; }
.rs-ringkey { display: inline-flex; align-items: center; gap: 6px; font: 500 15px/1.2 var(--sim-font); color: var(--sim-label-muted); }
.rs-ringkey svg { width: 18px; height: 18px; overflow: visible; }
.rs-k-dot { fill: var(--sim-label); }
.rs-k-ring { fill: none; stroke: var(--sim-label); stroke-width: 2; }
.rs-doors { position: absolute; display: flex; flex-wrap: wrap; justify-content: center; gap: 8px 10px; }
.rs-door { font: 700 16px/1.2 var(--sim-font); color: var(--sim-label); border: 1.5px solid var(--sim-label); border-top-width: 4px; padding: 8px 12px; background: var(--sim-bg-deep); animation: rs-in 0.5s ease both; animation-delay: var(--d, 0s); }
@keyframes rs-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
svg .rs-truth { stroke: var(--sim-label); stroke-width: 2; stroke-dasharray: 5 4; transition: stroke 0.4s ease, stroke-width 0.4s ease; }
svg .rs-truth--lit { stroke: var(--sim-annot); stroke-width: 3; }
svg .rs-med { fill: var(--sim-label); }
svg .rs-shift { stroke: var(--sim-annot); stroke-width: 2.5; }
svg .rs-shift-hd { fill: var(--sim-annot); }
@media (prefers-reduced-motion: reduce) { .rs-door { animation: none; } }
`;
  }
}
