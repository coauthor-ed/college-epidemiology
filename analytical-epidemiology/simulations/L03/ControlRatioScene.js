/**
 * ControlRatioScene - analytical-epidemiology L03 s03. The tempting sum and why it moves. Beat 0
 * shows the source's printed table (33, 55 / 2, 27) with its share of the exposed group who were
 * cases, 33 / 88 = 37.5 per cent. From beat 1 the table is the illustrative 100-case re-run: a
 * slider sets how many controls per case the investigator takes (1:1 to 4:1), the control cells
 * re-lay, and the share 94 / (94 + 67k) falls from 58.4 to 26.0 per cent as one large reading.
 * Beat 2 adds the bar comparison: the share moves while the two column rates hold at 94 / 100 and
 * 67 / 100 at every stop. Beat 3 bands the controls column (the investigator's choice) and states
 * the take-away. Numbers nobody chose do not move; the counts here are illustrative.
 * Built on the editorial panel parts (kit/SimPanel.js): slider, rule table, readout, bars, take-away.
 * Layout: the table takes the full width at the kit's own type (plain: 16px sans, row labels on one
 * line). Slider and readout share the top row (stacked in portrait); the bars run under the table.
 */
import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withBeats } from 'simulations/base/DomBeats.js';
import { SIM_PANEL_CSS, sliderHtml, ruleTableHtml, readoutHtml, setReadout, barsHtml, setBar, takeawayHtml, setText, bindPanel } from 'simulations/base/kit/SimPanel.js';

const MAP = [0, 1, 2, 3].map((i) => [{ idx: i, dwellMs: null }]);
const SRC_CELLS = [[33, 55], [2, 27]];               // the source's own counts, Table 12
const N_CASES = 94;                                  // illustrative re-run, scaled to 100 cases
const N_NOT = 6;
const CASES_RATE = 94.0;                             // 94 / 100
const CONTROLS_RATE = 67.0;                          // 67 / 100 at every stop
const f1 = (v) => v.toFixed(1);

const CSS = SIM_PANEL_CSS + `
.cr { gap: var(--sim-space-3); }
.cr .spn-table td, .cr .spn-table th { padding-top: 7px; padding-bottom: 7px; }
.cr .spn-table tbody th { white-space: nowrap; }
.cr .spn-read--tint { padding: var(--sim-space-2) var(--sim-space-3); gap: 2px; }
.cr .spn-read__n { font-size: 40px; }
.cr .spn-split { align-items: center; }
.cr-off { opacity: 0.45; }
.cr-bars { min-height: 84px; }
.cr-hidden { visibility: hidden; }
`;

export class ControlRatioScene extends withBeats(DomSimulation) {
  static WIDTH = 520;
  static HEIGHT = 552;
  static PORTRAIT_WIDTH = 360;
  static PORTRAIT_HEIGHT = 760;
  static LAYOUT = 'fit';
  static SETTING = 'none';
  static BEAT_STEP_MAP = MAP;
  static CONTROLS = [];
  static ARIA_LABEL = 'A two by two table of smoking against lung-cancer cases and controls. A slider sets how many controls per case the investigator takes: the control cells re-lay, and the share of the smokers who were cases falls from 58.4 to 26.0 per cent, while the two column rates hold at 94.0 and 67.0 per cent at every stop. The first beat shows the printed source table, where the share is 33 of 88, or 37.5 per cent.';

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

  shareVal() {
    return this.stepIndex === 0 ? (100 * 33) / 88 : (100 * N_CASES) / (N_CASES + CONTROLS_RATE * this.k);
  }

  formula() {
    if (this.stepIndex === 0) return `33 / 88 = <b>${f1(this.shareVal())}%</b>`;
    return `94 / (94 + ${CONTROLS_RATE * this.k}) = <b>${f1(this.shareVal())}%</b>`;
  }

  tableHtml() {
    const s = this.stepIndex ?? 0, k = this.k;
    const src = s === 0;
    const cells = src ? SRC_CELLS : [[N_CASES, CONTROLS_RATE * k], [N_NOT, (100 - CONTROLS_RATE) * k]];
    return ruleTableHtml({
      corner: src ? 'Doll and Hill' : 'Re-run, 100 cases',
      cols: [{ label: 'Cases' }, { label: 'Controls' }],
      rows: [{ label: 'Smokers', cells: cells[0] }, { label: 'Non-smokers', cells: cells[1] }],
      total: { label: 'Total', cells: src ? [35, 82] : [100, 100 * k] },
      band: src ? { row: 0 } : s === 3 ? { col: 1 } : {},
      note: src ? 'Source counts, Table V.' : s === 3 ? 'Controls: chosen by the investigator.' : 'Illustrative: counts scaled to 100 cases.',
      label: 'Smoking by cases and controls',
    });
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
    setBar(this.root, 'share', share / 100, `${f1(share)}%`);
    this.root.querySelector('input[type="range"]')?.setAttribute('aria-valuetext', `${k} controls per case, share ${f1(share)} per cent`);
  }

  paint() {
    if (!this.root) return;
    const s = this.stepIndex ?? 0, share = this.shareVal();
    const slider = `<div class="${s === 0 ? 'cr-off' : ''}">${sliderHtml({ action: 'k', label: 'Controls per case', min: 1, max: 4, step: 1, value: this.k, valueText: `${this.k}:1`,
      ticks: ['1:1', '2:1', '3:1', '4:1'], disabled: s === 0, aria: `${this.k} controls per case` })}</div>`;
    const read = readoutHtml({ key: 'share', tint: true, label: s === 0 ? 'Share of the smokers who were cases' : 'Tempting "risk" among smokers', value: f1(share), unit: '%', formula: this.formula() });
    const bars = `<div class="cr-bars${s >= 2 ? '' : ' cr-hidden'}">${barsHtml([
      { key: 'share', label: 'Apparent "risk"', v: share, text: `${f1(share)}%`, tone: 'annot' },
      { key: 'cases', label: 'Cases exposed', v: CASES_RATE, text: `${f1(CASES_RATE)}%`, tone: 'label-muted' },
      { key: 'controls', label: 'Controls exposed', v: CONTROLS_RATE, text: `${f1(CONTROLS_RATE)}%`, tone: 'label-muted' },
    ], { rule: true, max: 100 })}</div>`;
    const take = s === 3
      ? takeawayHtml('A number moved by the investigator\'s sampling choice is not a property of smoking.', 'The two column rates never move.')
      : '';
    this.render({ html: `<div class="spn cr"><div class="spn-split">${slider}${read}</div><div data-cr-table>${this.tableHtml()}</div>${s >= 1 ? bars : ''}${take}</div>` });
  }

  testState() {
    return {
      beat: this.stepIndex,
      k: this.stepIndex === 0 ? 0 : this.k,
      share: Math.round(this.shareVal() * 10) / 10,
      casesRate: this.stepIndex === 0 ? null : CASES_RATE,
      controlsRate: this.stepIndex === 0 ? null : CONTROLS_RATE,
    };
  }
}
