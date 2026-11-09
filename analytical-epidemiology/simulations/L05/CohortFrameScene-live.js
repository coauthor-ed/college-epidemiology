/**
 * CohortFrameScene-live - blk-l05-s08 (example). The demonstration cohort's move, scaled up to the live
 * case's records (illustrative): 2,000 reactor men with 12 cases, 8,000 other men with 4 cases, followed
 * twenty years.
 * Beat 0: the cohort table, cases / stayed well / total, cells a-d (12, 1,988 / 4, 7,996), totals 2,000
 *   and 8,000; reactor men are the focal row.
 * Beat 1: the worked steps: incidence 12 / 2,000 x 1,000 = 6.0 per 1,000, 4 / 8,000 x 1,000 = 0.5 per
 *   1,000, then the relative risk 6.0 / 0.5 counting up to 12.0; the odds ratio from file 3 (13.2) is
 *   set beside it as a fixed row.
 * Beat 2: two ratio bars on one scale that starts at 1.0 (no difference): RR 12.0 (the cohort's, focal)
 *   and OR 13.2 (the case-control study's, neutral). Two chips pick a ratio; the picked one reads large
 *   with the counts it was computed from (10,000 men followed forward; 20 cases and 60 controls).
 * No verdict wording in the scene: the slide's prose draws the conclusion.
 * Built on the editorial panel parts (kit/SimPanel.js): rule table, calc steps, fact rows, bars, chips, readout.
 */
import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withBeats } from 'simulations/base/DomBeats.js';
import { SIM_PANEL_CSS, ruleTableHtml, calcStepsHtml, overHtml, factRowsHtml, barsHtml, chipsHtml, readoutHtml, promptHtml, countValue, bindPanel } from 'simulations/base/kit/SimPanel.js';
import { fmtNum } from 'simulations/base/kit/SimText.js';
import { rowFromCounts, fmtRatio } from './CohortFrame.js';

const MAP = [0, 1, 2].map((i) => [{ idx: i, dwellMs: null }]);
const ROWS = [
  { label: 'Reactor men', ...rowFromCounts(12, 2000) },
  { label: 'Other men', ...rowFromCounts(4, 8000) },
];
const RR_V = ROWS[0].incidencePer1000 / ROWS[1].incidencePer1000; // 6.0 / 0.5 = 12.0 [slide]
const OR_V = 13.2;                                                // file 3: 714 / 54 [slide], shown, not recomputed
const TOP = 14;                                                   // bar scale: 1.0 to 14
const X = '×';
const n = (v) => fmtNum(v);
const frac = (v) => (v - 1) / (TOP - 1);
const RATIOS = [
  { key: 'rr', label: 'Relative risk', v: RR_V, tone: 'annot', from: 'This cohort: 10,000 men followed forward for twenty years.',
    formula: `${overHtml('6.0 per 1,000', '0.5 per 1,000')}` },
  { key: 'or', label: 'Odds ratio', v: OR_V, tone: 'label-muted', from: 'File 3: 20 men with the tumour and 60 controls, looking back.',
    formula: `${overHtml(`14 ${X} 51`, `9 ${X} 6`)} = ${overHtml('714', '54')}` },
];

const CSS = SIM_PANEL_CSS + `
.cl { gap: var(--sim-space-3); --spn-fx-size: 24px; }
.cl .spn-table tbody tr:first-child th { color: var(--sim-annot); }
.cl .spn-calc__row { grid-template-columns: 6.6em minmax(0, 1fr); padding-top: 5px; padding-bottom: 5px; }
.cl .spn-table sup { font-size: 13px; }
.sim-dom-root:not(.sim-dom-root--portrait) .cl .spn-table :is(th, td) { padding-top: 7px; padding-bottom: 7px; }
.cl .spn-calc__row--done .spn-calc__g { display: none; }
.sim-dom-root--portrait .cl .spn-calc__row { grid-template-columns: minmax(0, 1fr); }
.cl .spn-rows { border-top: 0; }
.cl .spn-row { padding: 6px 0 0; border-bottom: 0; }
.cl .spn-row dt { color: var(--sim-label-muted); }
.cl-pick { display: grid; grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr); gap: var(--sim-space-4); align-items: start; border-top: 1px solid var(--sim-label); padding-top: var(--sim-space-3); }
.cl-pick__l { display: flex; flex-direction: column; gap: var(--sim-space-2); }
.cl-pick__l .spn-btns { flex-direction: column; align-items: stretch; }
.cl-pick .spn-read__n { font-size: 48px; }
.sim-dom-root--portrait .cl-pick { grid-template-columns: minmax(0, 1fr); }
.sim-dom-root--portrait .cl-pick__l .spn-btns { flex-direction: row; }
.cl-pick .spn-read__f { display: flex; align-items: center; gap: 0.4em; font-family: var(--sim-font-numeral, var(--sim-font-display)); font-size: 24px; }
.cl-pick .spn-read__f .spn-over { font-size: 0.8em; }
`;

export class CohortFrameSceneLive extends withBeats(DomSimulation) {
  static WIDTH = 480;
  static HEIGHT = 486;
  static PORTRAIT_WIDTH = 360;
  static PORTRAIT_HEIGHT = 700;
  static LAYOUT = 'fit';
  static SETTING = 'none';
  static BEAT_STEP_MAP = MAP;
  static CONTROLS = [];
  static NOTES = ["Live case (illustrative): a made-up plant's totals. Follow-up: twenty years."];
  static ARIA_LABEL = 'Live case, illustrative. A cohort table: 2,000 reactor men with 12 cases and 8,000 other men with 4 cases, followed for twenty years. Incidence is 6.0 per 1,000 among the reactor men and 0.5 per 1,000 among the others, so the relative risk is 6.0 over 0.5, 12.0. Two bars on a scale starting at 1.0 compare it with the odds ratio from file 3, 13.2. Select either ratio to see the counts it was computed from.';

  async setup() {
    this.pick = 'rr';
    this._rrFresh = false;
    await super.setup();
    this.render({ css: CSS, rootClass: 'spn-page', html: '' });
    bindPanel(this.root, { action: (name, v) => this.act(name, v) });
    this.paint();
  }

  onStep(step) {
    this.pick = 'rr';
    this._rrFresh = step === 1;
    this.paint();
  }

  act(name, v) {
    if (name !== 'ratio' || (this.stepIndex ?? 0) < 2) return;
    if (v !== 'rr' && v !== 'or') return;
    this.pick = v;
    this.paint();
  }

  tableHtml() {
    return ruleTableHtml({
      corner: '',
      cols: [{ label: 'Tumour' }, { label: 'Stayed well' }, { label: 'Total' }],
      rows: ROWS.map((r, i) => ({ label: r.label, cells: [{ v: n(r.cases), tag: i ? 'c' : 'a' }, { v: n(r.total - r.cases), tag: i ? 'd' : 'b' }, { v: n(r.total) }] })),
      band: { col: 0 },
      label: 'Live case cohort, illustrative: tumour by reactor cleaning',
    });
  }

  stepsHtml() {
    const inc = (r) => ({ label: r.label, parts: [{ html: `${overHtml(n(r.cases), n(r.total))} ${X} 1,000` }, { v: `${r.incidencePer1000.toFixed(1)} per 1,000` }],
      gloss: `${r.cases} of ${n(r.total)} men developed the tumour over the follow-up.`, state: 'done' });
    return calcStepsHtml([
      inc(ROWS[0]), inc(ROWS[1]),
      { label: 'Relative risk', parts: ['RR', { n: '6.0', d: '0.5' }, { v: fmtRatio(RR_V, 1), key: 'rr' }], gloss: 'Incidence among the reactor men over incidence among the others.', state: 'now', fresh: this._rrFresh },
    ], { label: 'Two incidences, then their ratio' })
      + factRowsHtml([{ label: 'Odds ratio from file 3, 20 cases and 60 controls', value: fmtRatio(OR_V, 1), state: 'fixed' }]);
  }

  barsBlock() {
    const bars = barsHtml(RATIOS.map((r) => ({ key: r.key, label: r.label, v: frac(r.v), text: fmtRatio(r.v, 1), tone: r.tone })), { rule: true, max: 1 });
    return `<div class="cl-bars">${bars}<p class="spn-cap">Both bars start at 1.0, the value that would mean no difference.</p></div>`;
  }

  pickBlock() {
    const r = RATIOS.find((x) => x.key === this.pick);
    const chips = chipsHtml(RATIOS.map((x) => ({ label: x.label, action: 'ratio', value: x.key, pressed: x.key === this.pick })), { label: 'Pick a ratio' });
    const read = readoutHtml({ key: 'pick', label: r.label, value: fmtRatio(r.v, 1), tone: r.tone === 'annot' ? null : 'label', formula: `${r.formula} = ${fmtRatio(r.v, 1)}`, note: r.from });
    return `<div class="cl-pick"><div class="cl-pick__l">${promptHtml('Select a ratio')}${chips}</div>${read}</div>`;
  }

  paint() {
    if (!this.root) return;
    const s = this.stepIndex ?? 0;
    let body = this.tableHtml();
    if (s === 1) body += this.stepsHtml();
    if (s >= 2) body += this.barsBlock() + this.pickBlock();
    this.render({ html: `<div class="spn cl">${body}</div>` });
    if (s === 1 && this._rrFresh) { this._rrFresh = false; countValue(this.root, 'rr', RR_V, { from: 1, fmt: (v) => fmtRatio(v, 1), dur: 0.8 }); }
  }

  testState() {
    return { beat: this.stepIndex, pick: this.pick, rr: fmtRatio(RR_V, 1), or: fmtRatio(OR_V, 1) };
  }
}
