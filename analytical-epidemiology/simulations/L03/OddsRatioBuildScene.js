/**
 * OddsRatioBuildScene - the 2x2 count table whose two odds the learner builds, then the odds ratio
 * lands as one large reading. One file, two mounts, told apart by beat count only (no state is
 * shared: every mount is a fresh scene).
 *   Mount 1 (blk-l03-s05, 4 beats, stages 10..13) - Doll and Hill, BMJ 1950, Table V:
 *     a 33, b 55, c 2, d 27. Beat 0: the table with its margins and a relative-risk line that the
 *     table cannot fill ("needs a group followed forward"), nothing built. Beat 1: a prompt says
 *     "Select the Cases column"; the column heads are chips; selecting Cases tints a and c and
 *     reveals calc step 1, Odds of smoking = 33 / 2 = 16.5. Beat 2: selecting Controls reveals step 2,
 *     55 / 27 = 2.04, and step 3, OR = (33 x 27) over (55 x 2) as a stacked fraction, counting up to
 *     8.1 and named the odds ratio; "Show worked arithmetic" opens 891 / 110. Beat 3: the three
 *     conditions before it reads as a relative risk; the working stays.
 *   Mount 2 (blk-l03-s09, 3 beats, stages 20..22) - live case (illustrative): a 14, b 9, c 6,
 *     d 51, margins 20 and 60. Beat 0: 80 dots (one dot = one man; blue = case, grey = control, FILLED = cleaned the tanks, HOLLOW = did not; 20 cases, 60 controls) leave two pools and fill
 *     the cells one by one. Beat 1: the learner enters the cross-products a x d = 714 and
 *     b x c = 54 and checks them. Beat 2: the ratio counts up to 13.2 over 714 / 54.
 * The odds rows show the slides' rounded values; the ratio is derived exactly (891/110, 714/54).
 * Built on the editorial panel parts (kit/SimPanel.js): rule table, calc steps, numeric entry, readout.
 */
import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withBeats } from 'simulations/base/DomBeats.js';
import { SIM_PANEL_CSS, ruleTableHtml, readoutHtml, setReadout, entryHtml, takeawayHtml, factRowsHtml, bindPanel, calcStepsHtml, countValue, revealHtml, promptHtml } from 'simulations/base/kit/SimPanel.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';
import { mulberry32 } from 'simulations/base/kit/SimLook.js';
import { withNarrationCues } from '../L01/NarrationCues.js';
import { na, tagFirst, tagEach } from './NarrTags.js';
import { narrOn } from '../L05/NarrDots.js';

const T1 = { a: 33, b: 55, c: 2, d: 27 };   // Doll and Hill, BMJ 1950, Table V
const T2 = { a: 14, b: 9, c: 6, d: 51 };    // live case (illustrative)
const OR1 = (T1.a * T1.d) / (T1.b * T1.c);  // 891 / 110 = 8.1
const OR2 = (T2.a * T2.d) / (T2.b * T2.c);  // 714 / 54 = 13.22
const X = '\u00d7';
const SORT_LAG = 0.02;                      // s between people in the sort (80 people: about 1.6 s)

// Mount 2's 80 people in a seeded order, so the sort runs the same way every time.
const PEOPLE = (() => {
  const out = [];
  for (const [cell, n, isCase] of [['a', T2.a, true], ['b', T2.b, false], ['c', T2.c, true], ['d', T2.d, false]]) {
    for (let i = 0; i < n; i++) out.push({ cell, isCase });
  }
  const rnd = mulberry32(7);
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out.map((p, i) => ({ ...p, i }));
})();

const MAP1 = [{ idx: 10, dwellMs: null }, { idx: 11, dwellMs: null }, { idx: 12, dwellMs: null }, { idx: 13, dwellMs: null }];
const MAP2 = [{ idx: 20, dwellMs: null }, { idx: 21, dwellMs: null }, { idx: 22, dwellMs: null }];

const CSS = SIM_PANEL_CSS + `
.or { gap: var(--sim-space-3); }
.or .spn-table td, .or .spn-table th { padding-top: 7px; padding-bottom: 7px; }
.or .spn-split { align-items: start; grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); }
.or-m1 { gap: var(--sim-space-3); }
.or-m1 { --spn-fx-size: 26px; min-height: 500px; }
.or-m1 .spn-calc__row:has(.spn-reveal[open]) .spn-calc__g { display: none; }
.or-m1 .spn-pick { min-height: 34px; padding-top: 3px; padding-bottom: 3px; }
.or-m1 .spn-calc__row { grid-template-columns: 5.6em minmax(0, 1fr); padding-top: 8px; padding-bottom: 8px; }
.sim-dom-root--portrait .or-m1 { --spn-fx-size: 24px; }
.sim-dom-root--portrait .or-m1 .spn-calc__row { grid-template-columns: minmax(0, 1fr); }
.or-m1 .or-rr .spn-rows { border-top: 0; }
.or-m1 .spn-row { padding: 4px 0; border-bottom: 0; }
.or-m1 .spn-calc__row--done .spn-calc__g, .or-m1 .spn-calc__row--todo .spn-calc__g { display: none; }
.or-m1 .spn-table thead th:first-child { font-weight: 400; color: var(--sim-label-muted); }
.or-m1 .spn-take { padding: var(--sim-space-2) 0; font-size: var(--sim-text-md); }
.or-work { display: flex; flex-wrap: wrap; gap: 2px var(--sim-space-4); font-size: var(--sim-text-sm); }
.or-work span { white-space: nowrap; }
.or-work b { font-weight: 700; }
.or .spn-read { border-top: 1px solid var(--sim-label); padding-top: var(--sim-space-2); gap: var(--sim-space-1); }
.or .spn-read__n { font-size: 56px; }
.or-wait { margin: 0; padding-top: var(--sim-space-2); border-top: 1px solid var(--sim-label); min-height: 108px; color: var(--sim-label-muted); }
.or .spn-step__f { font-size: var(--sim-text-md); }
.or-rr dt { color: var(--sim-label-muted); }
.or-rr dd { color: var(--sim-label-muted); font-style: italic; white-space: normal; text-align: right; }
.or-cell { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
.or-dots { display: flex; flex-wrap: wrap; gap: 3px; justify-content: flex-end; max-width: 196px; min-height: 12px; }
.or-dot { --c: var(--sim-label-muted); box-sizing: border-box; width: 12px; height: 12px; border-radius: 50%; background: var(--c); }
.or-dot--case { --c: var(--sim-annot); }
.or-dot--no { background: transparent; box-shadow: inset 0 0 0 2.5px var(--c); }
.or-in { animation: or-in 0.35s ease-out both; animation-delay: calc(var(--i) * ${SORT_LAG}s); }
.or-out { animation: or-out 0.3s ease-in both; animation-delay: calc(var(--i) * ${SORT_LAG}s); }
@keyframes or-in { from { opacity: 0; transform: scale(0.2); } }
@keyframes or-out { to { opacity: 0.12; transform: scale(0.6); } }
.or-pools { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 2fr); gap: var(--sim-space-4); }
.or-pool { display: flex; flex-direction: column; gap: 6px; }
.or-pool .or-dots { justify-content: flex-start; max-width: none; }
.or-key { display: flex; flex-wrap: wrap; gap: 4px var(--sim-space-4); font-size: var(--sim-text-sm); color: var(--sim-label-muted); }
.or-key i { display: inline-block; vertical-align: -1px; margin-right: 6px; }
.or-key i.or-dot--ink { --c: var(--sim-label); }
@media (prefers-reduced-motion: reduce) { .or-in, .or-out { animation: none; } }
/* Narrated: a lit column, diagonal or margin row of the table is a tint over its cells, not an outline per cell
   (a box per cell reads as broken pieces). Narration off: no attribute, no match. */
#sim-canvas-host[data-narr-focus] .or :is(td, th)[data-narr] { outline: none !important; }
${['cases', 'controls', 'cells', 'ad', 'bc', 'margins'].map((i) => `[data-narr-on~="${i}"] .or :is(td, th)[data-narr~="${i}"]`).join(',\n')} { background: var(--sim-annot-tint) !important; }
`;

export class OddsRatioBuildScene extends withNarrationCues(withBeats(DomSimulation)) {
  static WIDTH = 600;
  static HEIGHT = 560;
  static PORTRAIT_WIDTH = 360;
  static PORTRAIT_HEIGHT = 860;
  static LAYOUT = 'fit';
  static SETTING = 'none';
  static BEAT_MAPS = { 4: MAP1, 3: MAP2 };
  static BEAT_STEP_MAP = MAP1;
  static CONTROLS = [];
  // Narration focus (spec W1 D29n). Both mounts: cell-a..cell-d (one count cell), ad / bc (the diagonals);
  // mount 2 also mar-ac / mar-bd (one column total). Mount 1 ids: rr, table, cases/controls (head, cells, total), steps with
  // odds-cases/odds-controls/or inside, take; the prompt line (repeats the narration) hidden, and steps not yet
  // spoken hidden (all on beat 0, the two unbuilt ones on beat 1). Mount 2 ids: table, pools, cells (+ ad / bc,
  // the diagonals), margins, entry, or2; key and wait line hidden. Narrated, the sort waits for show.cells (the
  // pools hold still until the narration reaches the cells), and show.or2 counts the ratio up at its word.
  static CUES = ['show.cells', 'show.or2'];
  static ARIA_LABEL = 'Two 2 by 2 count tables. Mount one, Doll and Hill 1950: 33 smokers and 2 non-smokers among 35 lung cancer cases, 55 smokers and 27 non-smokers among 82 controls. Selecting each column head builds its odds of smoking as a numbered step, 16.5 and 2.04; the third step sets the cross-product 33 times 27 over 55 times 2 and counts up to an odds ratio of 8.1. Mount two, illustrative: 80 dots sort into cells 14, 9, 6 and 51 with margins 20 and 60; cross-products 714 and 54 give an odds ratio of 13.2.';

  async setup() {
    this._reset();
    await super.setup();
    this.render({ css: CSS, rootClass: 'spn-page', html: '' });
    bindPanel(this.root, {
      action: (name, v) => this.act(name, v),
      toggle: (key, open) => { if (key === 'worked') this._worked = open; },
      input: (name, v) => { if (name === 'p1') this._v1 = String(v).replace(/[^\d]/g, '').slice(0, 4); if (name === 'p2') this._v2 = String(v).replace(/[^\d]/g, '').slice(0, 4); },
    });
    this.paint();
  }

  get m2() { return (this.stepIndex ?? 0) >= 20; }

  _reset() {
    this._c1 = false; this._c2 = false;
    this._focus = null; this._fresh = 0; this._worked = false;
    this._checked = false; this._selffill = false;
    this._bad1 = false; this._bad2 = false;
    this._v1 = ''; this._v2 = ''; this._hint = '';
    this._sorting = false; this._ratioFresh = false; this._sortWait = false;
  }

  /** Narration focus contract (content-block): only the narrated flag is kept; the engine dims and holds the tagged parts. */
  narrationFocus(f) {
    narrOn(this, f);
    const n = !!f?.narrated;
    if (n === !!this._narr) return;
    this._narr = n;
    if (n && this.stepIndex === 20 && !this._nc?.applied?.has('show.cells')) { this._sortWait = true; this._sorting = false; this.paint(); }
  }

  applyCue(id) {
    const s = this.stepIndex;
    if (id === 'show.cells' && s === 20 && this._sortWait) { this._sortWait = false; this._sorting = !reducedMotion(); this.paint(); }
    else if (id === 'show.or2' && s === 22 && this._checked) { this._ratioFresh = true; this.landRatio('or2', OR2, (v) => v.toFixed(1)); }
  }

  cueBase() { return null; }
  cueReset() { if (this.stepIndex === 20 && this._narr) { this._sortWait = true; this._sorting = false; this.paint(); } }

  onStep(step) {
    if (step === 10 || step === 0) this._reset();
    else if (step === 20) { this._reset(); this._sorting = !reducedMotion(); if (this._narr) { this._sortWait = true; this._sorting = false; } }
    else if (step === 22 && !this._checked) { this._checked = true; this._selffill = true; this._ratioFresh = true; }
    else this._sorting = false;
    this.paint();
  }

  act(name, v) {
    if (this.m2) {
      if (name === 'check' && this.stepIndex >= 21 && !this._checked) this.checkProds();
      return;
    }
    if ((this.stepIndex ?? 0) < 11 || name !== 'pick') return;
    const col = Number(v);
    if (col === 0) {
      if (!this._c1) { this._c1 = true; this._fresh = 1; }
      this._focus = 0;
    } else if (col === 1) {
      // A Controls tap before Cases builds step 1 too: the working must add up.
      if (!this._c2) { this._fresh = this._c1 ? 2 : 3; this._c1 = true; this._c2 = true; this._ratioFresh = true; this._focus = 2; }
      else this._focus = 1;
    } else return;
    this.paint();
  }

  checkProds() {
    const ok1 = Number(this._v1) === T2.a * T2.d, ok2 = Number(this._v2) === T2.b * T2.c;
    this._bad1 = !ok1; this._bad2 = !ok2;
    if (ok1 && ok2) { this._checked = true; this._hint = ''; this._ratioFresh = true; }
    else {
      this._hint = (Number(this._v1) === T2.b * T2.c && Number(this._v2) === T2.a * T2.d)
        ? 'The larger product belongs on top.'
        : `Multiply the diagonal cells: a ${X} d and b ${X} c.`;
    }
    this.paint();
  }

  // The ratio counts up from 0 once, when it first lands.
  landRatio(key, value, fmt) {
    if (!this._ratioFresh) return;
    this._ratioFresh = false;
    setReadout(this.root, key, { value, from: 0, fmt, dur: 0.6 });
  }

  paintM1() {
    const s = this.stepIndex, c1 = this._c1, c2 = this._c2, X2 = ` ${X} `;
    const focus = this._focus ?? (c2 ? 2 : c1 ? 0 : null);
    const sel = focus === 0 ? [0] : focus === 1 ? [1] : c2 ? [0, 1] : [];
    const table = ruleTableHtml({
      corner: 'Doll and Hill 1950',
      cols: [{ label: 'Cases' }, { label: 'Controls' }],
      rows: [{ label: 'Smoked', cells: [{ v: T1.a, tag: 'a' }, { v: T1.b, tag: 'b' }] }, { label: 'Not smoked', cells: [{ v: T1.c, tag: 'c' }, { v: T1.d, tag: 'd' }] }],
      total: { label: 'Total', cells: [T1.a + T1.c, T1.b + T1.d] },
      pick: s >= 11 ? 'col' : null,
      sel: s >= 11 ? sel : [],
      label: 'Doll and Hill, BMJ 1950, Table V: smoking by cases and controls',
    });
    const tableT = tagFirst(tagEach(tagEach(table, 'th', ['', 'cases', 'controls']), 'td', ['cases cell-a ad', 'controls cell-b bc', 'cases cell-c bc', 'controls cell-d ad', 'cases', 'controls']), 'table');
    const fresh = this._fresh;
    this._fresh = 0;
    const st = (i, built) => (!built ? 'todo' : focus === i ? 'now' : 'done');
    const worked = c2 ? revealHtml({ key: 'worked', open: this._worked, html: '<p class="or-work">'
      + `<span>a${X2}d = 33${X2}27 = <b>891</b></span><span>b${X2}c = 55${X2}2 = <b>110</b></span>`
      + `<span>891 / 110 = <b>${OR1.toFixed(2)}</b></span></p>` }) : '';
    const steps = calcStepsHtml([
      { label: 'Cases', parts: ['Odds of smoking', '33 / 2', ...(c1 ? [{ v: '16.5' }] : [])],
        gloss: '33 cases smoked for every 2 who did not.', state: st(0, c1), fresh: fresh === 1 || fresh === 3 },
      { label: 'Controls', parts: ['Odds of smoking', '55 / 27', ...(c2 ? [{ v: '2.04' }] : [])],
        gloss: '55 controls smoked for every 27 who did not.', state: st(1, c2), fresh: fresh >= 2 },
      { label: 'Compare', parts: c2 ? ['OR', { n: `33${X2}27`, d: `55${X2}2` }, { v: OR1.toFixed(1), key: 'or' }] : ['OR', { n: 'odds, cases', d: 'odds, controls' }],
        gloss: 'This number is the odds ratio: cases over controls, as a cross-product.', state: st(2, c2), fresh: fresh >= 2, moreHtml: worked },
    ], { label: 'Building the odds ratio' });
    const stepIds = s === 10 ? [] : s === 11 && !c2 ? ['odds-cases', '-', '-'] : ['odds-cases', 'odds-controls', 'or'];
    const stepsT = tagFirst(tagEach(steps, 'li', stepIds), s === 10 ? '-' : 'steps');
    let prompt = '';
    if (s >= 11 && !(s === 13 && c2)) {
      prompt = !c1 ? tagFirst(promptHtml('Select the Cases column'), '-')
        : !c2 ? tagFirst(promptHtml('Now select the Controls column'), '-')
          : tagFirst(promptHtml('Both odds built. Select a column to see its step again.', { done: true }), '-');
    }
    const take = s === 13 ? tagFirst(takeawayHtml('It reads as a relative risk only if', 'the disease is rare, the cases are representative, and the controls are representative.'), 'take') : '';
    const rr = s === 10 ? `<div class="or-rr"${na('rr')}>${factRowsHtml([{ label: 'Relative risk', value: 'needs a group followed forward' }])}</div>` : '';
    // One slot above the table says what this beat is about: the missing relative risk, the move, or the take-away.
    const head = s === 10 ? rr : s === 13 && c2 ? take : prompt;
    this.render({ html: `<div class="spn or or-m1">${head}${tableT}${stepsT}${s === 13 && !c2 ? take : ''}</div>` });
    if (c2 && this._ratioFresh) { this._ratioFresh = false; countValue(this.root, 'or', OR1, { from: 0, fmt: (v) => v.toFixed(1), dur: 0.6 }); }
  }

  dotsHtml(list, cls) {
    return `<span class="or-dots" aria-hidden="true">${list.map((p) => `<i class="or-dot${p.isCase ? ' or-dot--case' : ''}${p.cell === 'c' || p.cell === 'd' ? ' or-dot--no' : ''}${cls ? ` ${cls}` : ''}" style="--i:${p.i}"></i>`).join('')}</span>`;
  }

  paintM2() {
    const s = this.stepIndex, sorting = this._sorting;
    const cell = (k) => ({ v: '', html: `<span class="or-cell"><span>${T2[k]}<sup>${k}</sup></span>${this.dotsHtml(PEOPLE.filter((p) => p.cell === k), sorting ? 'or-in' : '')}</span>` });
    const out = sorting ? 'or-out' : '';
    const pools = sorting || this._sortWait
      ? `<div class="or-pools"${na('pools')}><div class="or-pool"><span class="spn-label">20 with the tumour</span>${this.dotsHtml(PEOPLE.filter((p) => p.isCase), out)}</div>`
        + `<div class="or-pool"><span class="spn-label">60 controls</span>${this.dotsHtml(PEOPLE.filter((p) => !p.isCase), out)}</div></div>`
      : '';
    const table = ruleTableHtml({
      caption: 'Live case, illustrative counts',
      cols: [{ label: 'Cases' }, { label: 'Controls' }],
      rows: [{ label: 'Cleaned tanks', cells: [cell('a'), cell('b')] }, { label: 'Did not clean', cells: [cell('c'), cell('d')] }],
      total: { label: 'Total', cells: [T2.a + T2.c, T2.b + T2.d] },
      label: 'Tank cleaning by cases and controls, illustrative',
    });
    const tableT = tagFirst(tagEach(table, 'td', ['cells ad cell-a', 'cells bc cell-b', 'cells bc cell-c', 'cells ad cell-d', 'margins mar-ac', 'margins mar-bd']), 'table');
    const key = `<p class="or-key"><span><i class="or-dot or-dot--case"></i>a man with the tumour</span><span><i class="or-dot"></i>a control</span><span><i class="or-dot or-dot--ink"></i>filled: cleaned the tanks</span><span><i class="or-dot or-dot--ink or-dot--no"></i>hollow: did not</span></p>`;
    let work = '';
    if (s >= 21) {
      const st = (bad) => (this._checked ? 'ok' : bad ? 'bad' : null);
      const entry = tagFirst(entryHtml({
        action: 'check', cta: this._checked ? false : 'Check',
        fields: [
          { name: 'p1', label: `a ${X} d =`, value: this._checked ? String(T2.a * T2.d) : this._v1, locked: this._checked, state: st(this._bad1), aria: 'Product of a and d' },
          { name: 'p2', label: `b ${X} c =`, value: this._checked ? String(T2.b * T2.c) : this._v2, locked: this._checked, state: st(this._bad2), aria: 'Product of b and c' },
        ],
        state: this._checked ? 'ok' : this._hint ? 'bad' : null,
        feedback: this._checked ? (this._selffill ? 'The cross-products: 714 and 54.' : 'Both cross-products check out.') : this._hint || 'Work out both on paper first.',
      }), 'entry');
      const read = this._checked
        ? tagFirst(readoutHtml({ key: 'or2', label: 'Odds ratio', value: OR2.toFixed(1), formula: `714 / 54 = ${OR2.toFixed(1)}` }), 'or2')
        : '<p class="or-wait" data-narr-hide="">The larger product goes on top.</p>';
      work = `<div class="spn-split">${entry}${read}</div>`;
    }
    this.render({ html: `<div class="spn or">${pools}${tableT}${tagFirst(key, '-')}${work}</div>` });
    if (this._checked) this.landRatio('or2', OR2, (v) => v.toFixed(1));
  }

  paint() {
    if (!this.root) return;
    if ((this.stepIndex ?? 0) < 10) { this.render({ html: '<div class="spn or"></div>' }); return; }
    if (this.m2) this.paintM2(); else this.paintM1();
  }

  testState() {
    const ratio = this.m2 ? (this._checked ? OR2.toFixed(1) : '') : (this._c2 ? OR1.toFixed(2) : '');
    return {
      mount: this.m2 ? 2 : (this.stepIndex ?? 0) >= 10 ? 1 : 0,
      cases: !!this._c1, controls: !!this._c2,
      ratio, checked: !!this._checked,
      slots: this._checked ? [T2.a * T2.d, T2.b * T2.c] : [null, null],
    };
  }
}
