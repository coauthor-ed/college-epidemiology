/**
 * ControlRatioScene - analytical-epidemiology L03 s03. The tempting sum and why it moves. Beat 0
 * shows the source's printed table (33, 55 / 2, 27) with its share of the exposed group who were
 * cases, 33 / 88 = 37.5 per cent. From beat 1 the table is an illustrative small study: 20 cases,
 * 14 of them smokers; a slider sets how many controls per case the investigator takes (1:1 to 4:1),
 * and 40 per cent of every control group smoked (8 of 20, 16 of 40, 24 of 60, 32 of 80), so the
 * rates are exact at every stop. Under the table, live and side by side:
 *   - the apparent "risk": the share of the smokers who were cases, 14 / (14 + 8k), which falls from
 *     63.6 to 30.4 per cent as k goes from 1 to 4;
 *   - the exposure rate in the cases, 14 / 20 = 70 per cent, and in the controls, 8k / 20k = 40 per
 *     cent, each with a bar; neither moves;
 *   - their difference, 70 - 40 = 30 percentage points, which does not move either.
 * Beat 2 adds the take-away (the design sets the apparent risk; the rates are the fair test) and
 * bands the controls column; beat 3 keeps it. The counts are illustrative.
 * Narration focus (spec W1 D29n): data-narr ids table, slider, share, rate-cases, rate-controls, gap,
 * rates (both rate rows). The beat-0 slider (disabled, never spoken) is hidden while narrated.
 * Cues k4 / k1: the narration sets the slider to 4:1 when it reads that stop, and back to 1:1 for the
 * learner's try (withNarrationCues: seekable, a scrub back restores 1:1).
 * Completion: none sent; the beat-1 wait is an exploration (Done / Skip).
 * Built on the editorial panel parts (kit/SimPanel.js): slider, rule table, readout, take-away.
 */
import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withBeats } from 'simulations/base/DomBeats.js';
import { withNarrationCues } from '../L01/NarrationCues.js';
import { na, tagFirst } from './NarrTags.js';
import { SIM_PANEL_CSS, sliderHtml, ruleTableHtml, readoutHtml, setReadout, takeawayHtml, setText, bindPanel } from 'simulations/base/kit/SimPanel.js';

const MAP = [0, 1, 2, 3].map((i) => [{ idx: i, dwellMs: null }]);
const SRC_CELLS = [[33, 55], [2, 27]];               // the source's own counts, Table 12
const N_CASES = 20;                                  // illustrative small study
const EXP_CASES = 14;                                // 14 / 20 = 70 per cent
const CTRL_PER_CASE_EXP = 8;                         // 8 of every 20 controls smoked = 40 per cent
const CASES_RATE = 70;
const CONTROLS_RATE = 40;
const f1 = (v) => v.toFixed(1);
const pct = (v) => (Number.isInteger(v) ? String(v) : f1(v));

const CSS = SIM_PANEL_CSS + `
.cr { gap: var(--sim-space-3); }
.cr .spn-table td, .cr .spn-table th { padding-top: 6px; padding-bottom: 6px; }
.cr .spn-table tbody th { white-space: nowrap; }
.cr .spn-read--tint { padding: var(--sim-space-2) var(--sim-space-3); gap: 2px; }
.cr .spn-read__n { font-size: 40px; }
.cr .spn-split { align-items: center; }
.cr-off { opacity: 0.45; }
.cr-rates { display: flex; flex-direction: column; gap: 6px; margin: 0; padding-top: var(--sim-space-2); border-top: 1px solid var(--sim-label); font: 500 15px/1.25 var(--sim-font); color: var(--sim-label); }
.cr-rates .cr-grp { display: flex; flex-direction: column; gap: 6px; }
.cr-row { display: grid; grid-template-columns: 10em minmax(48px, 1fr) 11em; column-gap: var(--sim-space-3); align-items: center; }
.cr-rates dt { font-weight: 600; }
.cr-rates dd { margin: 0; font-variant-numeric: tabular-nums; white-space: nowrap; text-align: right; }
.cr-rates dd b { font-weight: 700; }
.cr-bar { height: 12px; border-radius: 2px; background: var(--sim-track); position: relative; overflow: hidden; }
.cr-bar i { position: absolute; inset: 0 auto 0 0; background: var(--sim-label-muted); transition: width 0.45s ease; }
.cr-bar--share i { background: var(--sim-annot); }
.cr-gap { padding-top: 5px; border-top: 1px dashed var(--sim-label-muted); }
.cr-gap .cr-bar { visibility: hidden; }
.cr-gap dd b { color: var(--sim-annot); }
.cr-move { color: var(--sim-annot); }
.sim-dom-root--portrait .cr-row { grid-template-columns: minmax(0, 1fr) max-content; row-gap: 2px; }
.sim-dom-root--portrait .cr-row dt { grid-column: 1 / -1; }
@media (prefers-reduced-motion: reduce) { .cr-bar i { transition: none; } }
`;

export class ControlRatioScene extends withNarrationCues(withBeats(DomSimulation)) {
  static WIDTH = 520;
  static HEIGHT = 600;
  static PORTRAIT_WIDTH = 360;
  static PORTRAIT_HEIGHT = 840;
  static LAYOUT = 'fit';
  static SETTING = 'none';
  static BEAT_STEP_MAP = MAP;
  static CONTROLS = [];
  static CUES = ['k4', 'k1'];
  static ARIA_LABEL = 'A two by two table of smoking against lung-cancer cases and controls. In the illustrative study, 14 of 20 cases smoked, and 40 per cent of the controls smoked. A slider sets how many controls per case the investigator takes. The apparent risk, the share of the smokers who were cases, falls from 63.6 to 30.4 per cent, while the exposure rates stay at 70 per cent in the cases and 40 per cent in the controls, and their difference stays at 30 percentage points. The first beat shows the printed source table, where the share is 33 of 88, or 37.5 per cent.';

  async setup() {
    this.k = 1;
    await super.setup();
    this.render({ css: CSS, rootClass: 'spn-page', html: '' });
    bindPanel(this.root, { input: (name, v) => this.onK(v) });
    this.paint();
  }

  onStep(step) {
    if (step <= 1) this.k = 1;
    this.paint();
  }

  expCtrl() { return CTRL_PER_CASE_EXP * this.k; }
  nCtrl() { return N_CASES * this.k; }

  shareVal() {
    return this.stepIndex === 0 ? (100 * 33) / 88 : (100 * EXP_CASES) / (EXP_CASES + this.expCtrl());
  }

  formula() {
    if (this.stepIndex === 0) return `33 / 88 = <b>${f1(this.shareVal())}%</b>`;
    return `14 / (14 + ${this.expCtrl()}) = <b>${f1(this.shareVal())}%</b>`;
  }

  tableHtml() {
    const s = this.stepIndex ?? 0, k = this.k;
    const src = s === 0;
    const cells = src ? SRC_CELLS : [[EXP_CASES, this.expCtrl()], [N_CASES - EXP_CASES, this.nCtrl() - this.expCtrl()]];
    return ruleTableHtml({
      corner: src ? 'Doll and Hill' : 'Small study',
      cols: [{ label: 'Cases' }, { label: 'Controls' }],
      rows: [{ label: 'Smokers', cells: cells[0] }, { label: 'Non-smokers', cells: cells[1] }],
      total: { label: 'Total', cells: src ? [35, 82] : [N_CASES, this.nCtrl()] },
      band: src ? { row: 0 } : s >= 2 ? { col: 1 } : {},
      note: src ? 'Source counts, Table V.' : s >= 2 ? 'Controls: the investigator chooses how many.' : `Illustrative: ${k} control${k > 1 ? 's' : ''} per case.`,
      label: 'Smoking by cases and controls',
    });
  }

  ratesHtml() {
    const share = this.shareVal(), e = this.expCtrl(), n = this.nCtrl();
    const row = (id, cls, label, sub, v, val) => `<div class="cr-row ${cls}"${na(id)}><dt>${label}</dt>`
      + `<dd class="cr-bar${cls === 'cr-share' ? ' cr-bar--share' : ''}" aria-hidden="true"><i style="width:${v.toFixed(1)}%"></i></dd><dd>${val}</dd></div>`;
    return `<dl class="cr-rates" data-cr-rates>`
      + row('share', 'cr-share', 'Smokers who were cases', '', share, `14 / ${14 + e} = <b class="cr-move">${f1(share)}%</b>`)
      + `<div class="cr-grp"${na('rates')}>`
      + row('rate-cases', 'cr-rc', 'Exposure rate, cases', '', CASES_RATE, `14 / 20 = <b>${CASES_RATE}%</b>`)
      + row('rate-controls', 'cr-rk', 'Exposure rate, controls', '', CONTROLS_RATE, `${e} / ${n} = <b>${CONTROLS_RATE}%</b>`)
      + '</div>'
      + row('gap', 'cr-gap', 'Difference', '', 0, `${CASES_RATE}% - ${CONTROLS_RATE}% = <b>30 points</b>`)
      + '</dl>';
  }

  applyCue(id) {
    if ((this.stepIndex ?? 0) !== 1) return;
    if (id === 'k4' || id === 'k1') this.setK(id === 'k4' ? 4 : 1);
  }

  cueBase() { return null; }
  cueReset() { if ((this.stepIndex ?? 0) === 1) this.setK(1); }

  /** A narration cue moves the slider: the same repaint as the learner's input (never counted as the learner's). */
  setK(k) {
    this.onK(k);
    const r = this.root?.querySelector('input[type="range"]');
    if (r && Number(r.value) !== this.k) { r.value = String(this.k); r.style.setProperty('--sim-range-p', `${(((this.k - 1) / 3) * 100).toFixed(1)}%`); }
  }

  onK(v) {
    if ((this.stepIndex ?? 0) < 1) return;
    const k = Math.max(1, Math.min(4, Math.round(Number(v)) || 1));
    if (k === this.k) return;
    this.k = k;
    setText(this.root, 'k-val', `${k}:1`);
    const t = this.root.querySelector('[data-cr-table]');
    if (t) t.innerHTML = this.tableHtml();
    const share = this.shareVal();
    setReadout(this.root, 'share', { value: share, fmt: f1, formulaHtml: this.formula() });
    const r = this.root.querySelector('[data-cr-rates]');
    if (r) {
      // Patch in place so the share bar slides; the rate rows are re-written with the same numbers.
      const fresh = document.createElement('div');
      fresh.innerHTML = this.ratesHtml();
      const nr = fresh.firstElementChild;
      r.querySelectorAll('dd').forEach((dd, i) => {
        const src = nr.querySelectorAll('dd')[i];
        if (!src) return;
        const bar = dd.querySelector('i'), nb = src.querySelector('i');
        if (bar && nb) bar.style.width = nb.style.width; else dd.innerHTML = src.innerHTML;
      });
    }
    this.root.querySelector('input[type="range"]')?.setAttribute('aria-valuetext', `${k} controls per case, apparent risk ${f1(share)} per cent, exposure rates still 70 and 40 per cent`);
  }

  paint() {
    if (!this.root) return;
    const s = this.stepIndex ?? 0, share = this.shareVal();
    const slider = `<div class="${s === 0 ? 'cr-off' : ''}"${na(s === 0 ? '-' : 'slider')}>${sliderHtml({ action: 'k', label: 'Controls per case', min: 1, max: 4, step: 1, value: this.k, valueText: `${this.k}:1`,
      ticks: ['1:1', '2:1', '3:1', '4:1'], disabled: s === 0, aria: `${this.k} controls per case` })}</div>`;
    const read = readoutHtml({ key: 'share', tint: true, label: s === 0 ? 'Share of the smokers who were cases' : 'Apparent "risk" among smokers', value: f1(share), unit: '%', formula: this.formula() });
    const rates = s >= 1 ? this.ratesHtml() : '';
    const take = s >= 2
      ? tagFirst(takeawayHtml('The design sets the apparent risk.', 'The exposure rates and their difference stay put.'), '-')
      : '';
    this.render({ html: `<div class="spn cr"><div class="spn-split">${slider}${tagFirst(read, 'share')}</div><div data-cr-table${na('table')}>${this.tableHtml()}</div>${rates}${take}</div>` });
  }

  testState() {
    return {
      beat: this.stepIndex,
      k: this.stepIndex === 0 ? 0 : this.k,
      share: Math.round(this.shareVal() * 10) / 10,
      casesRate: this.stepIndex === 0 ? null : CASES_RATE,
      controlsRate: this.stepIndex === 0 ? null : CONTROLS_RATE,
      gap: this.stepIndex === 0 ? null : CASES_RATE - CONTROLS_RATE,
    };
  }
}
