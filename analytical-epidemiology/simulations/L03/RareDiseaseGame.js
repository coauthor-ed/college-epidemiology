import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withChallenge } from 'simulations/base/ChallengeMode.js';
import { fmtNum } from 'simulations/base/kit/SimText.js';
import { SIM_PANEL_CSS, ruleTableHtml, sliderHtml, barsHtml, setBar, buttonsHtml, promptHtml, setText, bindPanel } from 'simulations/base/kit/SimPanel.js';

/**
 * RareDiseaseGame - mini-game@1 on blk-l03-s08 (analytical-epidemiology L03), framed as an exercise.
 * (The file name is historical; nothing on screen or in ARIA calls it a game.)
 * One instruction line, a disease-frequency slider, a live whole-population 2x2 table and two ratio
 * bars on one scale: relative risk fixed at 3.00, odds ratio moving with the slider, a shaded band
 * for "within 10 per cent of the relative risk". The scene owns its Check (SELF_CHECKING): the
 * feedback line gives the worked comparison (OR, RR, the gap in per cent) and, when correct, why
 * the two agree - cases are a small share of each row, so odds and risks almost match.
 * Plain look: rules, no burst, no timer, no score. Desk 900 x 420; portrait 360 x 470 (caption, totals
 * row and the scale line drop in portrait), so neither viewport scrolls the page.
 * Built on the editorial panel parts (kit/SimPanel.js): prompt, slider, rule table, bars, buttons.
 */
const TOTAL = 100000;
const EXPOSED = 30000;
const UNEXPOSED = 70000;
const RR = 3.0;
const P_MIN = 0.1;
const P_MAX = 20.0;
const P_STEP = 0.1;
const P_DEF = 12.0;
const SCALE_TOP = 6.0; // ratio axis top: OR reaches 6.00 at 20%
const BAND_LO = 2.7; // within 10% of RR: 2.70 to 3.30
const BAND_HI = 3.3;

const BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }]]; // mounts once, no beats

const bandLoPct = ((BAND_LO - 1) / (SCALE_TOP - 1)) * 100; // 34
const bandHiPct = ((BAND_HI - 1) / (SCALE_TOP - 1)) * 100; // 46

/** OR for unexposed risk p (fraction): 3(1-p)/(1-3p). */
function orOf(p) {
  return (RR * (1 - p)) / (1 - 3 * p);
}

const people = (n) => fmtNum(n, { indian: true });
const frac = (v) => (v - 1) / (SCALE_TOP - 1);
const cellsOf = (p) => {
  const a = Math.round(EXPOSED * 3 * p);
  const c = Math.round(UNEXPOSED * p);
  return { a, b: EXPOSED - a, c, d: UNEXPOSED - c };
};
const gapPct = (or) => ((or - RR) / RR) * 100;

const CSS = SIM_PANEL_CSS + `
.rdg { gap: var(--sim-space-3); }
.rdg .spn-split { gap: var(--sim-space-5); align-items: start; }
.rdg-col { display: flex; flex-direction: column; gap: var(--sim-space-3); }
.rdg .spn-table tbody th, .rdg .spn-table tfoot th { white-space: nowrap; }
[data-sim-look="plain"] .rdg .spn-table th, [data-sim-look="plain"] .rdg .spn-table td { padding-top: 8px; padding-bottom: 8px; }
.rdg .sim-bars__track { background: linear-gradient(90deg, var(--sim-track) ${bandLoPct}%, var(--sim-annot-tint) ${bandLoPct}% ${bandHiPct}%, var(--sim-track) ${bandHiPct}%); }
.rdg-scale { display: flex; justify-content: space-between; margin: -4px 0 0; padding: 0 4.2em 0 8.4em; font-size: var(--sim-text-sm); color: var(--sim-label-muted); }
.rdg-band { display: flex; align-items: center; gap: var(--sim-space-2); margin: 0; font-size: var(--sim-text-sm); color: var(--sim-label-muted); }
.rdg-band i { display: inline-block; width: 18px; height: 10px; background: var(--sim-annot-tint); border: 1px solid var(--sim-annot); }
.rdg-check { display: flex; align-items: flex-start; gap: var(--sim-space-3); border-top: 1px solid var(--sim-label); padding-top: var(--sim-space-3); }
.rdg-fb { margin: 0; flex: 1 1 0; min-height: 3.9em; font-size: var(--sim-text-md); line-height: 1.3; color: var(--sim-label); }
.rdg-fb b { font-weight: 700; }
.rdg-fb--ok b:first-child { color: var(--sim-good); }
.sim-dom-root--portrait .rdg { gap: var(--sim-space-2); }
.sim-dom-root--portrait .rdg .spn-split { gap: var(--sim-space-2); }
.sim-dom-root--portrait .rdg .spn-table th, .sim-dom-root--portrait .rdg .spn-table td { padding: 4px 6px; }
.sim-dom-root--portrait .rdg .spn-table caption { padding-bottom: 4px; }
.sim-dom-root--portrait .rdg-scale { display: none; }
.sim-dom-root--portrait .rdg .spn-table caption { display: none; }
.sim-dom-root--portrait .rdg .spn-table tfoot { display: none; }
.sim-dom-root--portrait .rdg-check { padding-top: var(--sim-space-2); }
.sim-dom-root--portrait .rdg-fb { font-size: var(--sim-text-sm); min-height: 3.9em; }
.sim-dom-root--portrait .rdg .spn-slider__val { font-size: 26px; }
.sim-dom-root--portrait .rdg .spn-slider__ticks { display: none; }
`;

export class RareDiseaseGame extends withChallenge(DomSimulation) {
  static WIDTH = 900;
  static HEIGHT = 420;
  static PORTRAIT_WIDTH = 360;
  static PORTRAIT_HEIGHT = 470;
  static LAYOUT = 'fit';
  static SETTING = 'none';
  static SELF_CHECKING = true;
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static ARIA_LABEL = 'Exercise: a slider sets how common the disease is among the unexposed. A whole-population 2x2 table updates, and two bars on one scale compare the fixed relative risk of 3.00 with the odds ratio from the table. Find a frequency where the odds ratio is within 10 per cent of the relative risk, then press Check.';
  static CONTROLS = [];
  static OBJECTIVE = { prompt: { en: 'Find a disease frequency where the odds ratio is within 10 per cent of the relative risk.' } };

  async setup() {
    this._p = P_DEF;
    this._moved = false;
    this._won = false;
    this._fb = '';
    this._ok = false;
    await super.setup();
    this.render({ css: CSS, rootClass: 'spn-page', html: this.html() });
    bindPanel(this.root, {
      input: (name, v) => { if (name === 'freq') this._onFreq(v); },
      action: (name) => { if (name === 'check') this._onCheck(); },
    });
  }

  tableHtml() {
    const k = cellsOf(this._p / 100);
    return ruleTableHtml({
      caption: 'Whole population, illustrative',
      cols: [{ label: 'Cases' }, { label: 'Not cases' }, { label: 'Total' }],
      rows: [
        { label: 'Exposed', cells: [people(k.a), people(k.b), people(EXPOSED)] },
        { label: 'Unexposed', cells: [people(k.c), people(k.d), people(UNEXPOSED)] },
      ],
      total: { label: 'Total', cells: [people(k.a + k.c), people(k.b + k.d), people(TOTAL)] },
      band: { col: 0 },
      label: 'Cases and non-cases by exposure, whole population',
    });
  }

  html() {
    const p = this._p, or = orOf(p / 100);
    const prompt = promptHtml(this._won ? 'Done. You can keep moving the slider.' : 'Move the slider, then press Check.', { key: 'prompt', done: this._won });
    const left = `<div class="rdg-col">`
      + sliderHtml({ action: 'freq', label: 'Disease frequency, unexposed', min: P_MIN, max: P_MAX, step: P_STEP, value: p, valueText: `${p.toFixed(1)}%`, ticks: ['0.1%', '10%', '20%'], aria: `${p.toFixed(1)} per cent` })
      + `<div data-rdg-table>${this.tableHtml()}</div></div>`;
    const right = `<div class="rdg-col">`
      + barsHtml([
        { key: 'rr', label: 'Relative risk', v: frac(RR), text: RR.toFixed(2), tone: 'label-muted' },
        { key: 'or', label: 'Odds ratio', v: frac(or), text: or.toFixed(2), tone: 'annot' },
      ], { rule: true, max: 1 })
      + '<p class="rdg-scale" aria-hidden="true"><span>1.0</span><span>6.0</span></p>'
      + '<p class="rdg-band"><i></i>Shaded: within 10 per cent of 3.00 (2.70 to 3.30)</p>'
      + `<div class="rdg-check">${buttonsHtml([{ label: 'Check', action: 'check', primary: true }])}<p class="rdg-fb${this._ok ? ' rdg-fb--ok' : ''}" data-rdg-fb aria-live="polite">${this._fb}</p></div>`
      + '</div>';
    return `<div class="spn rdg">${prompt}<div class="spn-split">${left}${right}</div></div>`;
  }

  _insideBand() {
    return orOf(this._p / 100) <= BAND_HI + 1e-9;
  }

  _onFreq(v) {
    const n = Number(v);
    if (!Number.isFinite(n)) return;
    this._p = Math.min(P_MAX, Math.max(P_MIN, n));
    this._moved = true;
    this._paint();
  }

  /** Worked feedback: the two numbers, the gap, and (when correct) why they agree. */
  _onCheck() {
    const p = this._p, or = orOf(p / 100), g = gapPct(or);
    const at = `At ${p.toFixed(1)}% the odds ratio is ${or.toFixed(2)}, ${g.toFixed(1)}% above 3.00.`;
    if (!this._moved) {
      this._setFb('<b>Move the slider first.</b> At 12.0% the odds ratio is 4.13, 37.5% above 3.00.', false);
      return;
    }
    if (this._insideBand()) {
      this._won = true;
      this._setFb(`<b>Correct.</b> ${at} Cases are few in each row, so odds and risks almost match.`, true);
      const pr = this.root?.querySelector('[data-spn="prompt"]');
      if (pr) pr.outerHTML = promptHtml('Done. You can keep moving the slider.', { key: 'prompt', done: true });
      this.requestCheck?.();
    } else {
      this._setFb(`<b>Not yet.</b> ${at} The band ends at 3.30.`, false);
    }
  }

  _setFb(htmlText, ok) {
    this._fb = htmlText;
    this._ok = !!ok;
    const el = this.root?.querySelector('[data-rdg-fb]');
    if (el) { el.innerHTML = htmlText; el.classList.toggle('rdg-fb--ok', !!ok); }
  }

  /** Re-post every number and the OR bar from the current slider value. */
  _paint() {
    const p = this._p, or = orOf(p / 100);
    const t = this.root?.querySelector('[data-rdg-table]');
    if (t) t.innerHTML = this.tableHtml();
    setText(this.root, 'freq-val', `${p.toFixed(1)}%`);
    setBar(this.root, 'or', frac(or), or.toFixed(2));
    this.root?.querySelector('input[type="range"]')?.setAttribute('aria-valuetext', `${p.toFixed(1)} per cent, odds ratio ${or.toFixed(2)}`);
    if (this._fb && !this._won) this._setFb('', false);
  }

  checkObjective() {
    if (!this._moved) return null; // pressing Check without moving never counts
    return this._won || this._insideBand() ? { ok: true } : { ok: false };
  }

  resetChallenge() {
    super.resetChallenge();
    this._won = false;
    this._setFb('', false);
  }

  testState() {
    return { p: this._p, moved: this._moved, won: this._won, or: orOf(this._p / 100) };
  }
}
