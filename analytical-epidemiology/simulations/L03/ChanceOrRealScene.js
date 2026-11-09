/**
 * ChanceOrRealScene - analytical-epidemiology L03 s04. A long-run shuffle built from the source's
 * own counts (35 cases: 33 exposed, 2 not; 82 controls: 55 exposed, 27 not; 117 men). Each press
 * re-deals the 35 "case" labels among the 117 men at random and re-computes the gap in exposure
 * rate (percentage points) between the dealt cases and the rest. The shuffled gaps pile into a
 * histogram near zero; the real gap, 27.2 points, is a dashed rule outside every column. The scene
 * prints the source's own P value only as a quoted figure with its source. Shuffles are illustrative.
 * Built on the editorial panel parts (kit/SimPanel.js): column chart with a marker, readout, buttons, take-away.
 */
import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withBeats } from 'simulations/base/DomBeats.js';
import { SIM_PANEL_CSS, columnsHtml, setColumns, readoutHtml, setReadout, buttonsHtml, takeawayHtml, bindPanel, countUp } from 'simulations/base/kit/SimPanel.js';
import { mulberry32 } from 'simulations/base/kit/SimLook.js';

const MAP = [0, 1, 2, 3].map((i) => [{ idx: i, dwellMs: null }]);
const SEED = 34;                 // node -e: over the first 2000 deals max gap 23.1, min -29.9, none reaches 27.2
const N_CASES = 35;
const N_MEN = 117;
const N_EXPOSED = 88;            // 33 exposed cases + 55 exposed controls
const REAL_GAP = 27.2;           // percentage points, 94.2 - 67.0 as printed
const EDGES = [-30, -25, -20, -15, -10, -5, 0, 5, 10, 15, 20, 25, 30];
const NBINS = EDGES.length - 1;
const AT = (x) => (x - EDGES[0]) / (EDGES[NBINS] - EDGES[0]);
const TICKS = [-30, -20, -10, 0, 10, 20, 30].map((v) => ({ at: AT(v), label: v > 0 ? `+${v}` : String(v) }));
const fmtN = (v) => Math.round(v).toLocaleString('en-IN');

const CSS = SIM_PANEL_CSS + `
.cor { gap: var(--sim-space-3); }
.cor .spn-cols { height: 170px; }
.cor-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: var(--sim-space-4); align-items: end; border-top: 1px solid var(--sim-label); padding-top: var(--sim-space-3); }
.sim-dom-root--portrait .cor-row { grid-template-columns: minmax(0, 1fr); }
.cor .spn-read { gap: var(--sim-space-1); }
.cor .spn-read__n { font-size: 52px; }
.cor-src { transition: opacity 0.5s ease; min-height: 1.45em; }
.cor-src--off { opacity: 0; }
`;

export class ChanceOrRealScene extends withBeats(DomSimulation) {
  static WIDTH = 560;
  static HEIGHT = 552;
  static PORTRAIT_WIDTH = 360;
  static PORTRAIT_HEIGHT = 760;
  static LAYOUT = 'fit';
  static SETTING = 'none';
  static BEAT_STEP_MAP = MAP;
  static CONTROLS = [];
  static ARIA_LABEL = 'A histogram of shuffled gaps in exposure rate between dealt cases and the rest, piling up near zero. A dashed rule marks the real gap of 27.2 points, and a counter tracks how many shuffled gaps reached it. Buttons deal one table, run 500 deals, or reset.';

  async setup() {
    this.reset();
    await super.setup();
    this.render({ css: CSS, rootClass: 'spn-page', html: '' });
    bindPanel(this.root, { action: (name) => this.act(name) });
    this.paint();
  }

  reset() {
    this.bins = new Array(NBINS).fill(0);
    this.deals = 0;
    this.reached = 0;
    this.crossed = false;
    this.onAxis = true;
    this.lastGap = null;
    this.deck = Array(N_EXPOSED).fill(1).concat(Array(N_MEN - N_EXPOSED).fill(0));
    this.rnd = mulberry32(SEED);
  }

  onStep(step) {
    if (step === 0) this.reset();
    this.paint();
  }

  // One deal: hand the 35 case labels out at random, then recompute the gap.
  dealOnce() {
    const a = this.deck;
    for (let i = 0; i < N_CASES; i++) {
      const j = i + Math.floor(this.rnd() * (N_MEN - i));
      const t = a[i]; a[i] = a[j]; a[j] = t;
    }
    let s = 0;
    for (let i = 0; i < N_CASES; i++) s += a[i];
    const gap = 100 * (s / N_CASES - (N_EXPOSED - s) / (N_MEN - N_CASES));
    const bin = Math.max(0, Math.min(NBINS - 1, Math.floor((gap - EDGES[0]) / 5)));
    this.bins[bin] += 1;
    this.deals += 1;
    if (gap >= REAL_GAP) { this.reached += 1; this.crossed = true; }
    if (gap <= EDGES[0] || gap >= EDGES[NBINS]) this.onAxis = false;
    this.lastGap = gap;
    return bin;
  }

  yMax() { return Math.max(8, Math.ceil(Math.max(...this.bins) * 1.06)); }

  act(name) {
    if ((this.stepIndex ?? 0) < 1) return;
    if (name === 'reset') { this.reset(); this.paint(); return; }
    const fromDeals = this.deals;
    let fresh = -1;
    if (name === 'shuffle') fresh = this.dealOnce();
    else if (name === 'run') for (let i = 0; i < 500; i++) this.dealOnce();
    else return;
    setColumns(this.root, 'gaps', this.bins.map((n) => ({ n })), this.yMax(), fresh);
    const dur = name === 'run' ? 1.0 : 0.3;
    setReadout(this.root, 'count', { value: this.reached, fmt: fmtN, formulaHtml: this.formula(), dur });
    const d = this.root.querySelector('[data-cor-deals]');
    if (d) countUp(d, fromDeals, this.deals, { fmt: fmtN, dur });
    const r = this.root.querySelector('[data-sflow-action="reset"]');
    if (r) r.disabled = false;
  }

  formula() {
    const last = this.lastGap == null ? '' : ` Last gap: <b>${this.lastGap >= 0 ? '+' : ''}${this.lastGap.toFixed(1)}</b> points.`;
    return `of <span data-cor-deals>${fmtN(this.deals)}</span> shuffled tables reached 27.2 points.${last}`;
  }

  paint() {
    if (!this.root) return;
    const s = this.stepIndex ?? 0;
    const chart = columnsHtml({
      key: 'gaps', bins: this.bins.map((n) => ({ n })), max: this.yMax(), ticks: TICKS,
      marker: { at: AT(REAL_GAP), label: 'The gap we saw, 27.2' },
      axis: 'Gap in exposure rate, shuffled cases minus the rest (percentage points)',
      label: 'Histogram of shuffled gaps with the real gap marked at 27.2 points',
    });
    const read = readoutHtml({ key: 'count', label: s === 3 ? 'Chance alone' : 'Gaps as big as ours', value: fmtN(this.reached), formula: this.formula(), size: 'sm', tone: 'label' });
    const btns = buttonsHtml([
      { label: 'Shuffle once', action: 'shuffle', primary: true, disabled: s < 1 },
      { label: 'Run 500', action: 'run', disabled: s < 1 },
      { label: 'Reset', action: 'reset', quiet: true, disabled: s < 1 || this.deals === 0 },
    ]);
    const src = `<p class="spn-cap cor-src${s >= 2 ? '' : ' cor-src--off'}">The source prints P &lt; 0.001 for this table (Doll and Hill, 1950, Table V).</p>`;
    const take = s === 3 ? takeawayHtml('Shuffled labels pile up near zero.', 'The gap we saw sits far out past the pile.') : '';
    const lede = s === 0 ? '<p class="spn-note">Each shuffle deals the 35 case labels among the 117 men at random, then measures the gap again.</p>' : '';
    this.render({ html: `<div class="spn cor">${lede}${chart}<div class="cor-row">${read}${btns}</div>${src}${take}</div>` });
  }

  testState() {
    return { beat: this.stepIndex, deals: this.deals, reached: this.reached, crossed: this.crossed, onAxis: this.onAxis };
  }
}
