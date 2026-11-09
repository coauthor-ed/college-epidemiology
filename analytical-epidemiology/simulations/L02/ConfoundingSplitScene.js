/**
 * ConfoundingSplitScene - analytical-epidemiology L02 s06 "split by smoking and the effect shrinks".
 * Illustrative case-control study of alcohol and oesophageal cancer. One ruled table of drinkers by
 * group: crude, 60 of 100 cases against 40 of 112 controls (60 against 36 per cent, a gap of 24
 * points). The learner selects "Split by smoking": the Smokers and Non-smokers columns open beside the
 * crude one (50 of 55 against 20 of 22, 91 against 91; 10 of 45 against 20 of 90, 22 against 22) and
 * the bars and the gap reading fall to 0 inside each group.
 *   Beat 0: crude only; the split chip shown but not live.
 *   Beat 1: the split chip is live (Crude / Split by smoking).
 *   Beat 2: why smoking confounds: from the same table, 70 of the 100 drinkers smoked against 7 of the
 *           112 non-drinkers (cases and controls together) - smoking travels with the drinkers.
 *   Beat 3: the take-away on what to match (it takes the place of the beat-2 rows, to keep the panel's height).
 * Strata add back to the crude table (55 + 45 = 100, 22 + 90 = 112). Shares and gaps only: no ratio.
 * Built on the editorial panel parts (kit/SimPanel.js): prompt, chips, rule table, bars, readout,
 * fact rows, take-away.
 */
import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withBeats } from 'simulations/base/DomBeats.js';
import { SIM_PANEL_CSS, chipsHtml, promptHtml, ruleTableHtml, barsHtml, readoutHtml, setReadout, factRowsHtml, takeawayHtml, bindPanel } from 'simulations/base/kit/SimPanel.js';

// [drank, group total] for cases and controls, crude and by smoking. The strata add back to the crude.
const CRUDE = { cases: [60, 100], ctl: [40, 112] };
const SMOK = { cases: [50, 55], ctl: [20, 22] };
const NON = { cases: [10, 45], ctl: [20, 90] };
const pct = ([a, b]) => (100 * a) / b;
const r0 = (v) => String(Math.round(v));
const of = ([a, b]) => `${a} of ${b}`;
// Smoking among drinkers and non-drinkers, cases and controls together (derived from the cells).
const DRINKERS = SMOK.cases[0] + SMOK.ctl[0] + NON.cases[0] + NON.ctl[0];                  // 100
const DRINKERS_SMOKE = SMOK.cases[0] + SMOK.ctl[0];                                         // 70
const NONDRINK = (SMOK.cases[1] - SMOK.cases[0]) + (SMOK.ctl[1] - SMOK.ctl[0]) + (NON.cases[1] - NON.cases[0]) + (NON.ctl[1] - NON.ctl[0]); // 112
const NONDRINK_SMOKE = (SMOK.cases[1] - SMOK.cases[0]) + (SMOK.ctl[1] - SMOK.ctl[0]);       // 7
const CRUDE_GAP = Math.round(pct(CRUDE.cases)) - Math.round(pct(CRUDE.ctl));                 // 60 - 36 = 24
const MAP = [0, 1, 2, 3].map((i) => [{ idx: i, dwellMs: null }]);

const CSS = SIM_PANEL_CSS + `
.cf { gap: var(--sim-space-3); }
.cf .spn-table th, .cf .spn-table td { padding-top: 8px; padding-bottom: 8px; }
.cf .spn-table td { white-space: nowrap; }
.cf-past { color: var(--sim-label-muted); }
.cf-fresh th:nth-child(n+3), .cf-fresh td:nth-child(n+3) { animation: cf-in 0.35s ease-out both; }
@keyframes cf-in { from { opacity: 0; transform: translateX(-10px); } }
.cf-row { display: grid; grid-template-columns: minmax(0, 1fr) 128px; gap: var(--sim-space-5); align-items: end; padding-top: var(--sim-space-3); border-top: 1px solid var(--sim-label); }
.cf-bars { display: flex; flex-direction: column; gap: var(--sim-space-2); }
.cf-bars .spn-label { margin-top: 2px; }
.cf-bars--split { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: var(--sim-space-4); }
.cf-bars--split > div { display: flex; flex-direction: column; gap: var(--sim-space-2); }
.cf-bars--split .sim-bars--rule .sim-bars__row { grid-template-columns: 4.4em minmax(0, 1fr) 2.6em; }
.cf .spn-read { gap: var(--sim-space-1); }
.cf .spn-read__n { font-size: 44px; }
.cf .spn-rows { border-top: 0; }
.cf .spn-row { padding: 7px 0; }
.cf-note { margin: 0; font-size: var(--sim-text-sm); color: var(--sim-label-muted); }
.sim-dom-root--portrait .cf-row { grid-template-columns: minmax(0, 1fr); gap: var(--sim-space-3); }
.sim-dom-root--portrait .cf .spn-table th, .sim-dom-root--portrait .cf .spn-table td { padding: 7px 7px; }
.sim-dom-root--portrait .cf .spn-table td { white-space: normal; }
@media (prefers-reduced-motion: reduce) { .cf-fresh th, .cf-fresh td { animation: none; } }
`;

export class ConfoundingSplitScene extends withBeats(DomSimulation) {
  static WIDTH = 560;
  static HEIGHT = 540;
  static PORTRAIT_WIDTH = 360;
  static PORTRAIT_HEIGHT = 790;
  static LAYOUT = 'fit';
  static SETTING = 'none';
  static BEAT_STEP_MAP = MAP;
  static CONTROLS = [];
  static ARIA_LABEL = 'Illustrative case-control study of alcohol and oesophageal cancer. Crude: 60 of 100 cases drank against 40 of 112 controls, 60 against 36 per cent, a gap of 24 points. Split by smoking: among smokers 50 of 55 cases and 20 of 22 controls drank, 91 per cent on both sides; among non-smokers 10 of 45 and 20 of 90, 22 per cent on both sides; the gap inside each group is 0. In the same people, 70 of the 100 drinkers smoked against 7 of the 112 non-drinkers.';

  async setup() {
    this.split = false;
    this.fresh = false;
    await super.setup();
    this.render({ css: CSS, rootClass: 'spn-page', html: '' });
    bindPanel(this.root, { action: (name, v) => this.act(name, v) });
    this.paint();
  }

  onStep(step) {
    if (step <= 1) this.split = false;
    else if (!this.split) { this.split = true; this.fresh = true; }
    this.paint();
  }

  act(name, v) {
    if (name !== 'view' || (this.stepIndex ?? 0) < 1) return;
    const want = v === 'split';
    if (want === this.split) return;
    const wasGap = this.split ? 0 : CRUDE_GAP;
    this.split = want;
    this.fresh = want;
    this.paint();
    setReadout(this.root, 'gap', { value: want ? 0 : CRUDE_GAP, from: wasGap, fmt: r0, dur: 0.5 });
  }

  paint() {
    if (!this.root) return;
    const s = this.stepIndex ?? 0, split = this.split, fresh = this.fresh;
    this.fresh = false;
    const prompt = s === 0
      ? '<p class="cf-note">One table, two groups, one exposure.</p>'
      : promptHtml(split ? 'Split. Select Crude to put the table back together.' : 'Select Split by smoking.', { key: 'prompt', done: split });
    const chips = chipsHtml([
      { label: 'Crude', action: 'view', value: 'crude', pressed: !split, disabled: s < 1 },
      { label: 'Split by smoking', action: 'view', value: 'split', pressed: split, disabled: s < 1 },
    ], { label: 'Table view' });
    const cols = [{ label: 'All', sub: 'crude' }];
    const cell = (x, past) => ({ v: '', html: `<span class="${past ? 'cf-past' : ''}">${of(x)} (${r0(pct(x))}%)</span>` });
    const rowC = [cell(CRUDE.cases, split)], rowK = [cell(CRUDE.ctl, split)];
    if (split) {
      cols.push({ label: 'Smokers' }, { label: 'Non-smokers' });
      rowC.push(cell(SMOK.cases), cell(NON.cases));
      rowK.push(cell(SMOK.ctl), cell(NON.ctl));
    }
    const table = `<div class="${split && fresh ? 'cf-fresh' : ''}">` + ruleTableHtml({
      caption: 'Drank alcohol, by group (illustrative; per cent rounded)',
      corner: 'Group',
      cols,
      rows: [{ label: 'Cases', cells: rowC }, { label: 'Controls', cells: rowK }],
      band: split ? {} : { col: 0 },
      label: split ? 'Drinkers among cases and controls, crude and split by smoking' : 'Drinkers among cases and controls, crude',
    }) + '</div>';
    const bars = split
      ? '<div class="cf-bars cf-bars--split"><div><span class="spn-label">Smokers</span>' + barsHtml([
        { key: 'sc', label: 'Cases', v: pct(SMOK.cases), text: `${r0(pct(SMOK.cases))}%`, tone: 'annot' },
        { key: 'sk', label: 'Controls', v: pct(SMOK.ctl), text: `${r0(pct(SMOK.ctl))}%`, tone: 'label-muted' },
      ], { rule: true, max: 100 }) + '</div><div><span class="spn-label">Non-smokers</span>' + barsHtml([
        { key: 'nc', label: 'Cases', v: pct(NON.cases), text: `${r0(pct(NON.cases))}%`, tone: 'annot' },
        { key: 'nk', label: 'Controls', v: pct(NON.ctl), text: `${r0(pct(NON.ctl))}%`, tone: 'label-muted' },
      ], { rule: true, max: 100 }) + '</div></div>'
      : '<div class="cf-bars"><span class="spn-label">All</span>' + barsHtml([
        { key: 'cc', label: 'Cases', v: pct(CRUDE.cases), text: `${r0(pct(CRUDE.cases))}%`, tone: 'annot' },
        { key: 'ck', label: 'Controls', v: pct(CRUDE.ctl), text: `${r0(pct(CRUDE.ctl))}%`, tone: 'label-muted' },
      ], { rule: true, max: 100 }) + '</div>';
    const read = readoutHtml({
      key: 'gap', label: split ? 'Gap inside each group' : 'Gap, all together',
      value: r0(split ? 0 : CRUDE_GAP), unit: ' points',
      formula: split ? '91 − 91 = <b>0</b><br>22 − 22 = <b>0</b>' : `60 − 36 = <b>${CRUDE_GAP}</b>`, size: 'sm',
    });
    let why = '';
    if (s === 2) {
      why = '<div><span class="spn-label">Why: in the same people, smoking travels with drinking</span>' + factRowsHtml([
        { label: 'Drinkers who smoked', valueHtml: `<b>${DRINKERS_SMOKE}</b> of ${DRINKERS} (${r0((100 * DRINKERS_SMOKE) / DRINKERS)}%)`, state: 'moves' },
        { label: 'Non-drinkers who smoked', valueHtml: `<b>${NONDRINK_SMOKE}</b> of ${NONDRINK} (${r0((100 * NONDRINK_SMOKE) / NONDRINK)}%)` },
      ]) + '</div>';
    }
    const take = s >= 3 ? takeawayHtml('Split or match on the confounder.', 'Never on drinking itself: that is the exposure under test.') : '';
    this.render({ html: `<div class="spn cf">${prompt}${chips}${table}<div class="cf-row">${bars}${read}</div>${why}${take}</div>` });
  }

  testState() {
    return { beat: this.stepIndex, split: this.split, gap: this.split ? 0 : CRUDE_GAP, drinkersSmoke: [DRINKERS_SMOKE, DRINKERS], nonDrinkersSmoke: [NONDRINK_SMOKE, NONDRINK] };
  }
}
