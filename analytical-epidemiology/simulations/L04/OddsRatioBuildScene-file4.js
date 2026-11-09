/**
 * OddsRatioBuildScene-file4 - L04 s01, cold-case file 4 (Vessey and Doll, BMJ 1969, Table 15):
 * 84 cases with clots, 168 matched hospital controls; 42 and 23 had used oral contraceptives.
 * Rebuilt 2026-11-05 on the editorial panel parts (kit/SimPanel.js), the pattern of the approved
 * L03 OddsRatioBuildScene mount 2. Three beats:
 *   Beat 0: the 252 women as two pools (84 cases, 168 controls), the published shares under them,
 *           and the relative-risk line this table cannot fill ("needs a group followed forward").
 *   Beat 1: the pools sort into the 2x2 cells (42, 23 / 42, 145; margins 84 and 168); the learner
 *           enters both cross-products, a x d and b x c, and checks them. A wrong pair names the step.
 *   Beat 2: the products read 6090 and 966 and the odds ratio counts up to 6.30 over its stacked
 *           fraction; the printed label is corrected: "relative risk" struck, "odds ratio" in.
 * Dots: cases in the signature colour (the focal group), controls neutral grey, as in L03.
 */
import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withBeats } from 'simulations/base/DomBeats.js';
import { SIM_PANEL_CSS, ruleTableHtml, readoutHtml, setReadout, entryHtml, factRowsHtml, bindPanel, promptHtml, pullQuoteHtml, editHtml } from 'simulations/base/kit/SimPanel.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';
import { mulberry32 } from 'simulations/base/kit/SimLook.js';

// Table 15, exposure in rows, outcome in columns: a exposed cases, b exposed controls, c, d.
const T = { a: 42, b: 23, c: 42, d: 145 };
const AD = T.a * T.d, BC = T.b * T.c;        // 6090, 966
const OR = AD / BC;                          // 6.30
const X = '×';
const SORT_LAG = 0.006;                      // s between people in the sort (252 people: about 1.5 s)
const MAP = [0, 1, 2].map((i) => [{ idx: i, dwellMs: null }]);

// The 252 women in a seeded order, so the sort runs the same way every time.
const PEOPLE = (() => {
  const out = [];
  for (const [cell, n, isCase] of [['a', T.a, true], ['b', T.b, false], ['c', T.c, true], ['d', T.d, false]]) {
    for (let i = 0; i < n; i++) out.push({ cell, isCase });
  }
  const rnd = mulberry32(11);
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out.map((p, i) => ({ ...p, i }));
})();

const CSS = SIM_PANEL_CSS + `
.o4 { gap: var(--sim-space-3); }
.o4 .spn-table td, .o4 .spn-table th { padding-top: 6px; padding-bottom: 6px; }
.o4 .spn-table tbody th { white-space: nowrap; }
.o4 .spn-split { align-items: start; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); }
.o4 .spn-read { border-top: 1px solid var(--sim-label); padding-top: var(--sim-space-2); gap: var(--sim-space-1); }
.o4 .spn-read__n { font-size: 52px; }
.o4-wait { margin: 0; padding-top: var(--sim-space-2); border-top: 1px solid var(--sim-label); min-height: 96px; color: var(--sim-label-muted); }
.o4-rr dt { color: var(--sim-label-muted); }
.o4-rr dd { color: var(--sim-label-muted); font-style: italic; white-space: normal; text-align: right; }
.o4-rr .spn-row { border-bottom: 0; }
.o4-cell { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; }
.o4-dots { display: flex; flex-wrap: wrap; gap: 2px; justify-content: flex-end; max-width: 206px; }
.o4-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--sim-series-8); }
.o4-dot--case { background: var(--sim-annot); }
.o4-in { animation: o4-in 0.35s ease-out both; animation-delay: calc(var(--i) * ${SORT_LAG}s); }
@keyframes o4-in { from { opacity: 0; transform: scale(0.2); } }
.o4-pools { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.6fr); gap: var(--sim-space-5); align-items: start; }
.o4-pool { display: flex; flex-direction: column; gap: var(--sim-space-2); padding-top: var(--sim-space-2); border-top: 1px solid var(--sim-label); }
.o4-pool .o4-dots { justify-content: flex-start; max-width: none; }
.o4-pool .o4-dots { gap: 4px; }
.o4-pool .o4-dot { width: 11px; height: 11px; }
.o4-pool__n { font: 600 var(--sim-text-lg)/1.1 var(--sim-font); font-variant-numeric: tabular-nums; }
.o4-pool__s { margin: 0; font-size: var(--sim-text-sm); color: var(--sim-label-muted); }
.o4-pool__s b { color: var(--sim-label); font-weight: 700; }
.o4-src { margin: 0; font-size: var(--sim-text-sm); color: var(--sim-label-muted); }
.sim-dom-root--portrait .o4-pools { grid-template-columns: minmax(0, 1fr); gap: var(--sim-space-3); }
.sim-dom-root--portrait .o4-dots { max-width: 112px; }
.sim-dom-root--portrait .o4-dot { width: 5px; height: 5px; }
.sim-dom-root--portrait .o4 .spn-read__n { font-size: 40px; }
.sim-dom-root--portrait .o4 { --spn-quote-size: 22px; }
.sim-dom-root--portrait .o4 .spn-table caption { display: none; }
.sim-dom-root--portrait .o4 .spn-table td, .sim-dom-root--portrait .o4 .spn-table th { padding-top: 4px; padding-bottom: 4px; }
.sim-dom-root--portrait .o4-pool .o4-dot { width: 8px; height: 8px; }
.sim-dom-root--portrait .o4-pool .o4-dots { gap: 3px; }
@media (prefers-reduced-motion: reduce) { .o4-in { animation: none; } }
`;

export class OddsRatioBuildSceneFile4 extends withBeats(DomSimulation) {
  static WIDTH = 580;
  static HEIGHT = 545;
  static PORTRAIT_WIDTH = 360;
  static PORTRAIT_HEIGHT = 640;
  static LAYOUT = 'fit';
  static SETTING = 'none';
  static BEAT_STEP_MAP = MAP;
  static CONTROLS = [];
  static ARIA_LABEL = 'Cold-case file 4, oral contraceptives and clots, Vessey and Doll 1969. 84 women with clots and 168 controls sort into a 2 by 2 table: 42 exposed cases, 23 exposed controls, 42 unexposed cases, 145 unexposed controls. You enter the cross-products, 42 times 145 is 6090 and 42 times 23 is 966, and the odds ratio counts up to 6.30. The label printed in 1969, relative risk, is corrected to odds ratio.';

  async setup() {
    this._reset();
    await super.setup();
    this.render({ css: CSS, rootClass: 'spn-page', html: '' });
    bindPanel(this.root, {
      action: (name) => { if (name === 'check' && this.stepIndex === 1 && !this._checked) this.checkProds(); },
      input: (name, v) => {
        const s = String(v).replace(/[^\d]/g, '').slice(0, 5);
        if (name === 'p1') this._v1 = s;
        if (name === 'p2') this._v2 = s;
      },
    });
    this.paint();
  }

  _reset() {
    this._checked = false; this._selffill = false;
    this._bad1 = false; this._bad2 = false;
    this._v1 = ''; this._v2 = ''; this._hint = '';
    this._sorting = false; this._ratioFresh = false;
  }

  onStep(step) {
    if (step === 0) this._reset();
    else if (step === 1) { if (!this._checked) { this._v1 = ''; this._v2 = ''; this._hint = ''; } this._sorting = !reducedMotion() && !this._checked; }
    else if (step === 2) {
      this._sorting = false;
      if (!this._checked) { this._checked = true; this._selffill = true; this._ratioFresh = true; }
    }
    this.paint();
  }

  checkProds() {
    if (!this._v1 || !this._v2) { this._hint = 'Enter both products, then Check.'; this._bad1 = !this._v1; this._bad2 = !this._v2; this.paint(); return; }
    const ok1 = Number(this._v1) === AD, ok2 = Number(this._v2) === BC;
    this._bad1 = !ok1; this._bad2 = !ok2;
    if (ok1 && ok2) { this._checked = true; this._hint = ''; this._ratioFresh = true; this._sorting = false; }
    else if (Number(this._v1) === BC && Number(this._v2) === AD) this._hint = 'Swapped: a and d are the diagonal 42 and 145.';
    else if (Number(this._v1) === T.a + T.d || Number(this._v2) === T.b + T.c) this._hint = `Multiply, do not add: a ${X} d = 42 ${X} 145.`;
    else this._hint = `Multiply the diagonal cells: a ${X} d = 42 ${X} 145, b ${X} c = 23 ${X} 42.`;
    this.paint();
  }

  dotsHtml(list, cls) {
    return `<span class="o4-dots" aria-hidden="true">${list.map((p) => `<i class="o4-dot${p.isCase ? ' o4-dot--case' : ''}${cls ? ` ${cls}` : ''}" style="--i:${p.i}"></i>`).join('')}</span>`;
  }

  poolsHtml() {
    const pool = (n, label, share, isCase) => `<div class="o4-pool"><span class="o4-pool__n">${n} ${label}</span>`
      + `${this.dotsHtml(PEOPLE.filter((p) => p.isCase === isCase))}<p class="o4-pool__s">${share}</p></div>`;
    return `<div class="o4-pools">${pool(84, 'women with clots', 'Had used oral contraceptives: <b>50 per cent</b>', true)}`
      + `${pool(168, 'matched controls', 'Had used oral contraceptives: <b>14 per cent</b>', false)}</div>`;
  }

  tableHtml() {
    const sorting = this._sorting;
    const cell = (k) => ({ v: '', html: `<span class="o4-cell"><span>${T[k]}<sup>${k}</sup></span>${this.dotsHtml(PEOPLE.filter((p) => p.cell === k), sorting ? 'o4-in' : '')}</span>` });
    return ruleTableHtml({
      caption: 'Table 15 as counts',
      cols: [{ label: 'Cases (clots)' }, { label: 'Controls' }],
      rows: [{ label: 'Used the pill', cells: [cell('a'), cell('b')] }, { label: 'Never used', cells: [cell('c'), cell('d')] }],
      total: { label: 'Total', cells: [T.a + T.c, T.b + T.d] },
      note: '50 per cent of 84 = 42; 14 per cent of 168 = 23 (the exact share is 13.7 per cent).',
      label: 'Oral contraceptive use by cases and controls, Vessey and Doll 1969',
    });
  }

  workHtml() {
    const st = (bad) => (this._checked ? 'ok' : bad ? 'bad' : null);
    const entry = entryHtml({
      action: 'check', cta: this._checked ? false : 'Check',
      fields: [
        { name: 'p1', label: `a ${X} d =`, value: this._checked ? String(AD) : this._v1, locked: this._checked, state: st(this._bad1), aria: 'Product of a and d, 42 times 145' },
        { name: 'p2', label: `b ${X} c =`, value: this._checked ? String(BC) : this._v2, locked: this._checked, state: st(this._bad2), aria: 'Product of b and c, 23 times 42' },
      ],
      state: this._checked ? 'ok' : this._hint ? 'bad' : null,
      feedback: this._checked ? (this._selffill ? `42 ${X} 145 = 6090; 23 ${X} 42 = 966.` : 'Both cross-products check out.') : this._hint || 'Work both out on paper first.',
    });
    const read = this._checked
      ? readoutHtml({ key: 'or', label: 'Odds ratio', value: OR.toFixed(2), frac: { n: String(AD), d: String(BC) } })
      : '<p class="o4-wait">The ratio lands here once both products check.</p>';
    return `<div class="spn-split">${entry}${read}</div>`;
  }

  paint() {
    if (!this.root) return;
    const s = this.stepIndex ?? 0;
    let html;
    if (s === 0) {
      const rr = `<div class="o4-rr">${factRowsHtml([{ label: 'Relative risk', value: 'needs a group followed forward' }])}</div>`;
      html = `<div class="spn o4">${this.poolsHtml()}${rr}<p class="o4-src">Vessey and Doll, BMJ 1969: hospital cases and controls, matched for age, marital status and parity.</p></div>`;
    } else {
      const head = s === 2 || this._checked
        ? (s === 2 ? pullQuoteHtml(`Printed in 1969: ${editHtml('relative risk', 'odds ratio')} 6.3:1`, { label: 'What the table can give' }) : promptHtml('Both cross-products check. Read on.', { done: true }))
        : promptHtml('Enter a × d and b × c, then press Check');
      html = `<div class="spn o4">${head}${this.tableHtml()}${this.workHtml()}</div>`;
    }
    this.render({ html });
    if (this._checked && this._ratioFresh) {
      this._ratioFresh = false;
      setReadout(this.root, 'or', { value: OR, from: 0, fmt: (v) => v.toFixed(2), dur: 0.6 });
    }
  }

  testState() {
    return {
      stage: this.stepIndex, a: T.a, b: T.b, c: T.c, d: T.d,
      ad: this._checked ? AD : Number(this._v1) || 0, bc: this._checked ? BC : Number(this._v2) || 0,
      landed: !!this._checked, ratio: this._checked ? OR.toFixed(2) : '',
    };
  }
}
