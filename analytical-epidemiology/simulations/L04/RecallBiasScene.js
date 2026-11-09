/**
 * RecallBiasScene - L04 s04 "Cases remember harder". A demonstration study (illustrative numbers) in
 * which the exposure truly does nothing: 30 of 60 cases and 30 of 60 controls were exposed, odds ratio
 * 1.00. One slider adds reported exposure among the CASES only (0 to +20 points, step 5: each step moves
 * 3 of the 60 cases from "did not" to "reported"). The moved men stay visible as open rings in cell a,
 * the controls' column never moves, and the odds-ratio reading counts to its new value over the
 * stacked cross-product. Rebuilt 2026-11-05 on the editorial panel parts (kit/SimPanel.js).
 *   Beat 0: the truth, slider live at 0 (prompt says the move).
 *   Beat 1: same; the learner moves the slider (prose: +10 reads 1.50).
 *   Beat 2: rests at +10 from memory; two source chips, "Memory at interview" / "Employment records":
 *           records take the recalled men back out (slider locked at 0), the reading returns to 1.00.
 * Odds ratio = (a x d) / (b x c) with b = d = 30 fixed, so it equals a / c: 30/30, 33/27, 36/24, 39/21, 42/18.
 */
import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withBeats } from 'simulations/base/DomBeats.js';
import { SIM_PANEL_CSS, sliderHtml, ruleTableHtml, readoutHtml, setReadout, factRowsHtml, setText, bindPanel, promptHtml, chipsHtml, takeawayHtml } from 'simulations/base/kit/SimPanel.js';

const N = 60, E0 = 30, B = 30, D = 30;
const STEP = 5, PER_STEP = 3, EXTRA_MAX = 20;
const X = '×';
const aOf = (x) => E0 + (x / STEP) * PER_STEP;      // 30, 33, 36, 39, 42
const cOf = (x) => N - aOf(x);
const orOf = (x) => (aOf(x) * D) / (B * cOf(x));
const f2 = (v) => v.toFixed(2);
const MAP = [0, 1, 2].map((i) => [{ idx: i, dwellMs: null }]);

const CSS = SIM_PANEL_CSS + `
.rb { gap: var(--sim-space-3); }
.rb .spn-split { align-items: start; grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr); }
.rb .spn-row { padding-top: 5px; padding-bottom: 5px; }
.rb .spn-frac { font-size: 24px; }
.rb .spn-table td, .rb .spn-table th { padding-top: 6px; padding-bottom: 6px; }
.rb .spn-table tbody th { white-space: nowrap; }
.rb .spn-read { gap: 2px; }
.rb .spn-read__n { font-size: 48px; }
.rb-cell { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; }
.rb-dots { display: flex; flex-wrap: wrap; gap: 3px; justify-content: flex-end; max-width: 200px; }
.rb-dot { width: 8px; height: 8px; border-radius: 50%; box-sizing: border-box; background: var(--sim-series-8); }
.rb-dot--case { background: var(--sim-annot); }
.rb-dot--moved { background: transparent; border: 2px solid var(--sim-annot); animation: rb-in 0.35s ease-out both; }
@keyframes rb-in { from { opacity: 0; transform: scale(0.3); } }
.rb-key { display: flex; flex-wrap: wrap; gap: 2px var(--sim-space-4); margin: 0; font-size: var(--sim-text-sm); color: var(--sim-label-muted); }
.rb-key i { display: inline-block; width: 9px; height: 9px; border-radius: 50%; box-sizing: border-box; margin-right: 6px; vertical-align: -1px; background: var(--sim-series-8); }
.rb-key i.rb-dot--case { background: var(--sim-annot); }
.rb-key i.rb-dot--moved { background: transparent; border: 2px solid var(--sim-annot); animation: none; }
.rb .spn-rows { margin: 0; }
.rb-src { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sim-space-2) var(--sim-space-3); }
.rb-src .spn-label { white-space: nowrap; }
.rb-off { opacity: 0.45; }
.sim-dom-root--portrait .rb .spn-read__n { font-size: 40px; }
.sim-dom-root--portrait .rb-dots { max-width: 118px; gap: 2px; }
.sim-dom-root--portrait .rb-dot { width: 7px; height: 7px; }
.sim-dom-root--portrait .rb .spn-table td, .sim-dom-root--portrait .rb .spn-table th { padding: 4px 6px; }
.sim-dom-root--portrait .rb { gap: var(--sim-space-2); }
.sim-dom-root--portrait .rb .spn-split { grid-template-columns: minmax(0, 1fr); gap: var(--sim-space-2); }
.sim-dom-root--portrait .rb .spn-slider .spn-label { font-size: var(--sim-text-sm); }
.sim-dom-root--portrait .rb .spn-read__f { display: none; }
.sim-dom-root--portrait .rb .spn-rows, .sim-dom-root--portrait .rb .spn-take, .sim-dom-root--portrait .rb-src > .spn-label { display: none; }
.sim-dom-root--portrait .rb-key { gap: 0 var(--sim-space-3); }
.sim-dom-root--portrait .rb .spn-slider__ticks { display: none; }
.sim-dom-root--portrait .rb-src .spn-btns { flex-wrap: nowrap; gap: 4px; }
.sim-dom-root--portrait .rb-src .spn-act { white-space: nowrap; padding: 2px 4px; min-height: 30px; gap: 5px; font-size: var(--sim-text-sm); }
@media (prefers-reduced-motion: reduce) { .rb-dot--moved { animation: none; } }
`;

export class RecallBiasScene extends withBeats(DomSimulation) {
  static WIDTH = 580;
  static HEIGHT = 565;
  static PORTRAIT_WIDTH = 360;
  static PORTRAIT_HEIGHT = 580;
  static LAYOUT = 'fit';
  static SETTING = 'none';
  static BEAT_STEP_MAP = MAP;
  static CONTROLS = [];
  static ARIA_LABEL = 'Illustrative demonstration: an exposure that truly does nothing. Sixty cases and sixty controls, 30 exposed in each group, odds ratio 1.00. A slider adds reported exposure among the cases only: each 5-point step moves 3 cases into the exposed row. At plus 10 points the cases read 36 exposed and 24 not, and the odds ratio is 36 times 30 over 30 times 24, 1.50, while the controls stay 30 and 30. On the last beat, switching the source to employment records takes the recalled men back out and the reading returns to 1.00.';

  async setup() {
    this._x = 0; this._records = false;
    await super.setup();
    this.render({ css: CSS, rootClass: 'spn-page', html: '' });
    bindPanel(this.root, {
      input: (name, v) => { if (name === 'extra') this.onX(v); },
      action: (name, v) => { if (name === 'src' && this.stepIndex === 2) this.onSrc(v === 'records'); },
    });
    this.paint();
  }

  onStep(step) {
    this._records = false;
    this._x = step === 2 ? 10 : 0;
    this.paint();
  }

  onSrc(records) {
    if (records === this._records) return;
    const from = orOf(this._x);
    this._records = records;
    this._x = records ? 0 : 10;
    this.paint(from);
  }

  onX(v) {
    if (this._records) return;
    const x = Math.max(0, Math.min(EXTRA_MAX, Math.round(Number(v) / STEP) * STEP));
    if (x === this._x) return;
    this._x = x;
    setText(this.root, 'extra-val', `+${x}`);
    const t = this.root.querySelector('[data-rb-table]');
    if (t) t.innerHTML = this.tableHtml();
    setReadout(this.root, 'or', { value: orOf(x), fmt: f2, formulaHtml: this.formula() });
    this.patchFrac();
    setText(this.root, 'oddsc', `${aOf(x)} / ${cOf(x)} = ${f2(aOf(x) / cOf(x))}`);
    this.root.querySelector('input[type="range"]')?.setAttribute('aria-valuetext', `plus ${x} points, odds ratio ${f2(orOf(x))}`);
  }

  formula() { return this._x === 0 ? 'the truth: no link' : `true value 1.00; +${f2(orOf(this._x) - 1)} from the asking`; }

  patchFrac() {
    const n = this.root.querySelector('[data-rb-read] .spn-frac__n'), d = this.root.querySelector('[data-rb-read] .spn-frac__d');
    if (n) n.textContent = `${aOf(this._x)} ${X} ${D}`;
    if (d) d.textContent = `${B} ${X} ${cOf(this._x)}`;
  }

  tableHtml() {
    const x = this._x, a = aOf(x), c = cOf(x), moved = a - E0;
    const dots = (n, cls, extra = 0) => `<span class="rb-dots" aria-hidden="true">${`<i class="rb-dot ${cls}"></i>`.repeat(n)}${'<i class="rb-dot rb-dot--moved"></i>'.repeat(extra)}</span>`;
    const cell = (v, tag, html) => ({ v: '', html: `<span class="rb-cell"><span>${v}<sup>${tag}</sup></span>${html}</span>` });
    return ruleTableHtml({
      cols: [{ label: 'Cases', sub: '60' }, { label: 'Controls', sub: '60' }],
      rows: [
        { label: 'Reported exposure', cells: [cell(a, 'a', dots(E0, 'rb-dot--case', moved)), cell(B, 'b', dots(B, ''))] },
        { label: 'Did not', cells: [cell(c, 'c', dots(c, 'rb-dot--case')), cell(D, 'd', dots(D, ''))] },
      ],
      band: { col: 0 },
      label: 'Reported exposure by cases and controls, illustrative',
    });
  }

  paint(fromOr) {
    if (!this.root) return;
    const s = this.stepIndex ?? 0, x = this._x, rec = this._records;
    const prompt = s < 2
      ? promptHtml('Drag the slider: how much extra exposure do the cases report?')
      : rec ? promptHtml('Records: nobody has to remember. The reading is back at the truth.', { done: true })
        : promptHtml('Switch the source to the employment records');
    const slider = `<div class="${rec ? 'rb-off' : ''}">${sliderHtml({ action: 'extra', label: 'Extra exposure the cases report (percentage points)', min: 0, max: EXTRA_MAX, step: STEP, value: x,
      valueText: `+${x}`, ticks: ['0', '+5', '+10', '+15', '+20'], disabled: rec, aria: `plus ${x} points, odds ratio ${f2(orOf(x))}` })}</div>`;
    const read = `<div data-rb-read>${readoutHtml({ key: 'or', label: 'Odds ratio', value: f2(orOf(x)), frac: { n: `${aOf(x)} ${X} ${D}`, d: `${B} ${X} ${cOf(x)}` }, formula: this.formula() })}</div>`;
    const odds = factRowsHtml([
      { label: 'Odds among cases, a / c', key: 'oddsc', value: `${aOf(x)} / ${cOf(x)} = ${f2(aOf(x) / cOf(x))}`, state: 'moves' },
      { label: 'Odds among controls, b / d', value: '30 / 30 = 1.00', state: 'fixed' },
    ]);
    const key = '<p class="rb-key"><span>Illustrative counts.</span><span><i class="rb-dot--case"></i>a case</span><span><i class="rb-dot--moved"></i>a case moved by recall or probing</span><span><i></i>a control</span></p>';
    const src = s === 2
      ? `<div class="rb-src"><span class="spn-label">Exposure taken from</span>${chipsHtml([
        { label: 'Memory at interview', action: 'src', value: 'memory', pressed: !rec },
        { label: 'Employment records', action: 'src', value: 'records', pressed: rec },
      ], { label: 'Source of the exposure history' })}</div>`
      : '';
    const take = s === 2 && rec ? takeawayHtml('The whole rise came from how the cases were asked.', 'Records leave recall nothing to feed on.') : '';
    this.render({ html: `<div class="spn rb">${prompt}${src}<div class="spn-split">${slider}${read}</div><div data-rb-table>${this.tableHtml()}</div>${key}${take || odds}</div>` });
    if (fromOr != null) setReadout(this.root, 'or', { value: orOf(x), from: fromOr, fmt: f2 });
  }

  testState() {
    return { beat: this.stepIndex, extra: this._x, records: this._records, a: aOf(this._x), b: B, c: cOf(this._x), d: D, or: f2(orOf(this._x)) };
  }
}
