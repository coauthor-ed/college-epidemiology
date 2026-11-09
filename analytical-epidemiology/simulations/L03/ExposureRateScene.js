/**
 * ExposureRateScene - analytical-epidemiology L03 s02. Table 12 of the source (Table V of Doll and
 * Hill, BMJ 1950): 33 of the 35 lung-cancer cases smoked, 55 of the 82 hospital controls smoked.
 * The learner reads the table DOWN its columns: select a column head and its count, its total and
 * the fraction built from them light together, as one large reading. Once both columns have been
 * read, the gap between the two rates lands under them: 27.2 points. Nothing is illustrative here -
 * these are the source's own counts and its own printed rates (94.2, 67.0). The scene never says
 * risk, odds, incidence, or prints a P value: the table compares exposure.
 * Built on the editorial panel parts (kit/SimPanel.js): rule table with column picking, readout, take-away.
 */
import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withBeats } from 'simulations/base/DomBeats.js';
import { SIM_PANEL_CSS, ruleTableHtml, readoutHtml, takeawayHtml, bindPanel } from 'simulations/base/kit/SimPanel.js';

const MAP = [0, 1, 2, 3].map((i) => [{ idx: i, dwellMs: null }]);
const CELLS = [[33, 55], [2, 27]];                  // a, b / c, d - the source's own counts
const TOTALS = [35, 82];
const RATE_TEXT = ['94.2', '67.0'];                 // the source's own printed figures (33/35 truncated, 55/82)
const GAP_TEXT = '27.2';                            // 94.2 - 67.0 as printed
const COL = [
  { label: 'Cases', sub: '(n=35)', who: 'Among cases', n: '33 smokers', d: '35 cases', note: 'The total is every man in the case column.' },
  { label: 'Controls', sub: '(n=82)', who: 'Among controls', n: '55 smokers', d: '82 controls', note: 'The total is every man in the control column.' },
];

const CSS = SIM_PANEL_CSS + `
.er { gap: var(--sim-space-3); }
.er .spn-table td, .er .spn-table th { padding-top: 4px; padding-bottom: 4px; }
.sim-dom-root:not(.sim-dom-root--portrait) .er .spn-table tbody th { white-space: nowrap; }
.er .spn-table sup { font-size: 13px; }
.er-read, .er-wait { min-height: 104px; }
.er-wait { display: flex; align-items: center; margin: 0; color: var(--sim-label-muted); font-size: var(--sim-text-md); border-top: 1px solid var(--sim-label); }
.er .spn-read { gap: var(--sim-space-1); }
.er-gap { margin: 0; padding: 6px 14px; font-weight: 700; font-size: var(--sim-text-lg); font-variant-numeric: tabular-nums;
  background: linear-gradient(var(--sim-annot-tint), var(--sim-annot-tint)) 0 0 / 100% 100% no-repeat; animation: er-sweep 0.3s ease-out both; }
.er-gap--off { visibility: hidden; animation: none; }
@keyframes er-sweep { from { background-size: 0% 100%; } }
.er-src { transition: opacity 0.5s ease; }
.er-src--off { opacity: 0; }
[data-step="2"] .spn-table tbody tr:first-child th, [data-step="3"] .spn-table tbody tr:first-child th {
  text-decoration: underline 2px var(--sim-annot); text-underline-offset: 5px; }
.er .spn-read { border-top: 1px solid var(--sim-label); padding-top: var(--sim-space-3); }
@media (prefers-reduced-motion: reduce) { .er-gap { animation: none; } }
`;

export class ExposureRateScene extends withBeats(DomSimulation) {
  static WIDTH = 560;
  static HEIGHT = 550;
  static PORTRAIT_WIDTH = 360;
  static PORTRAIT_HEIGHT = 745;
  static LAYOUT = 'fit';
  static SETTING = 'none';
  static BEAT_STEP_MAP = MAP;
  static CONTROLS = [];
  static ARIA_LABEL = 'The Doll and Hill table of smoking against lung cancer: 33 of the 35 cases smoked and 55 of the 82 hospital controls smoked. Select a column head to read that column down: its count over its own total gives the exposure rate, 94.2 per cent among cases and 67.0 among controls. Read both and the gap between them, 27.2 percentage points, lands under the table. The controls were hospital patients with other diseases.';

  async setup() {
    this.sel = null;
    this.seen = new Set();
    await super.setup();
    this.render({ css: CSS, rootClass: 'spn-page', html: '' });
    bindPanel(this.root, { action: (name, v) => this.act(name, v) });
    this.paint();
  }

  onStep(step) {
    if (step === 0) { this.sel = null; this.seen = new Set(); }
    this.paint();
  }

  act(name, v) {
    if (name !== 'pick' || this.stepIndex < 1) return;
    const i = Number(v);
    this.sel = this.sel === i ? null : i;
    if (this.sel != null) this.seen.add(i);
    this.paint();
  }

  paint() {
    if (!this.root) return;
    const s = this.stepIndex ?? 0, live = s >= 1, sel = this.sel;
    const table = ruleTableHtml({
      caption: 'Smoking histories of lung-cancer cases and controls',
      corner: 'Smoking history',
      cols: COL.map((c) => ({ label: c.label, sub: c.sub })),
      rows: [
        { label: 'Smokers, under 5 a day', cells: [{ v: CELLS[0][0], tag: 'a' }, { v: CELLS[0][1], tag: 'b' }] },
        { label: 'Non-smokers', cells: [{ v: CELLS[1][0], tag: 'c' }, { v: CELLS[1][1], tag: 'd' }] },
      ],
      total: { label: 'Total', cells: TOTALS },
      pick: live ? 'col' : null,
      sel: live ? sel : null,
      label: 'Smoking history by cases and controls, Doll and Hill 1950, Table V',
    });
    const src = `<p class="spn-cap er-src${s >= 2 ? '' : ' er-src--off'}">Doll and Hill, BMJ 1950, Table V. Controls: same hospitals, other diseases.</p>`;
    let read;
    if (live && sel != null) {
      const c = COL[sel];
      read = `<div class="er-read">${readoutHtml({ key: 'rate', label: c.who, frac: { n: c.n, d: c.d }, value: RATE_TEXT[sel], unit: '%', note: c.note, size: 'sm' })}</div>`;
    } else {
      read = `<p class="er-wait">${live ? (this.seen.size ? 'Select the other column head.' : 'Select a column head to read that column down.') : 'From the last slide: smoking is more common among the cases.'}</p>`;
    }
    const both = this.seen.size === 2;
    const gap = `<p class="er-gap${both ? '' : ' er-gap--off'}" aria-live="polite">Exposure gap: ${RATE_TEXT[0]}% \u2212 ${RATE_TEXT[1]}% = ${GAP_TEXT} percentage points</p>`;
    const take = s >= 3 ? takeawayHtml('Supported: smoking was more common among the cases.', 'Not in these counts: how many smokers get lung cancer.') : '';
    this.render({ html: `<div class="spn er">${table}${src}${read}${gap}${take}</div>` });
  }

  testState() {
    return { beat: this.stepIndex, casesLit: this.sel === 0 || this.seen.has(0), controlsLit: this.sel === 1 || this.seen.has(1), gapShown: this.seen.size === 2, sel: this.sel };
  }
}
