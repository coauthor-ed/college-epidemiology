import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withChallenge } from 'simulations/base/ChallengeMode.js';
import { SIM_PANEL_CSS, ruleTableHtml, readoutHtml, chipsHtml, buttonsHtml, promptHtml, bindPanel } from 'simulations/base/kit/SimPanel.js';

/**
 * RigTheStudyGame - mini-game@1 on blk-l04-s07 (analytical-epidemiology L04), framed as an exercise.
 * (The file name is historical; nothing on screen or in ARIA calls it a game.) Illustrative numbers.
 * A training file of 20 cases and 60 controls in which the exposure (reactor work) truly does nothing:
 * 6 of 20 cases and 18 of 60 controls exposed, odds ratio (6 x 42) / (18 x 14) = 1.00. Four rows of
 * choice chips run the study badly or well; the live 2x2 and the odds-ratio reading recompute with each
 * choice. Once the reading is 2.00 or more, every changed row opens a line of flaw chips (selection,
 * interviewer, recall, overmatching). Check gives the worked cross-product and, per changed choice, the
 * mechanism; it passes only when the reading is 2.00 or more and every flaw is named right (tie L2: the
 * check is the bias mechanism). Model (unchanged from the stub):
 *   a = 6 + 2 if the interviewer knows + 2 if the past comes from memory;
 *   b = 18 (same workforce) | 6 (office staff) | 27 (cases' relatives); matching on reactor work: b = 3a;
 *   c = 20 - a, d = 60 - b; OR = ad / bc.
 * Rebuilt 2026-11-05 on the editorial panel parts (kit/SimPanel.js), the pattern of L03 RareDiseaseGame:
 * one instruction line, live model, one Check (SELF_CHECKING), worked feedback, no chrome, no timer.
 */
const CASES_N = 20;
const CONTROLS_N = 60;
const TARGET_OR = 2.0;
const X = '×';
const FAIR = { source: 'workforce', interviewer: 'blind', past: 'records', match: 'age' };
const ROWS = [
  { id: 'source', label: 'Control source', opts: [
    { id: 'workforce', label: 'Same workforce' },
    { id: 'office', label: 'Office staff' },
    { id: 'relatives', label: "Cases' relatives" },
  ] },
  { id: 'interviewer', label: 'The interviewer', opts: [
    { id: 'blind', label: 'Kept in the dark' },
    { id: 'knows', label: 'Knows, on the ward' },
  ] },
  { id: 'past', label: 'The past', opts: [
    { id: 'records', label: 'Employment records' },
    { id: 'memory', label: "Men's memory" },
  ] },
  { id: 'match', label: 'Matching', opts: [
    { id: 'age', label: 'On age' },
    { id: 'job', label: 'On reactor work' },
    { id: 'none', label: 'None' },
  ] },
];
const FLAWS = [
  { id: 'selection', label: 'Selection' },
  { id: 'interviewer', label: 'Interviewer' },
  { id: 'recall', label: 'Recall' },
  { id: 'overmatching', label: 'Overmatching' },
];
const ROW_FLAW = { source: 'selection', interviewer: 'interviewer', past: 'recall', match: 'overmatching' };
const CONTROL_B = { workforce: 18, office: 6, relatives: 27 };
// Why each changed choice moves the table (worked feedback).
const WHY = {
  office: 'Office staff: selection bias. They never cleaned a reactor, so only 6 of 60 controls are exposed instead of 18.',
  relatives: "Cases' relatives: selection bias. In this file 27 of 60 such controls are exposed, so this choice pushes the ratio down, not up.",
  knows: 'Knows, on the ward: interviewer bias. Probing the cases harder records 2 more exposed cases.',
  memory: "Men's memory: recall bias. Cases search their past harder: 2 more exposed cases.",
  job: 'On reactor work: overmatching. The controls are made as exposed as the cases (b = 3a), which pins the ratio at 1.00.',
};
const isFair = (row, opt) => opt === FAIR[row] || (row === 'match' && opt === 'none');

function countsOf(pick) {
  const a = 6 + (pick.interviewer === 'knows' ? 2 : 0) + (pick.past === 'memory' ? 2 : 0);
  const b = pick.match === 'job' ? a * 3 : CONTROL_B[pick.source];
  return { a, b, c: CASES_N - a, d: CONTROLS_N - b };
}
const orOf = (t) => (t.a * t.d) / (t.b * t.c);
const f2 = (v) => v.toFixed(2);
const changedRows = (pick) => ROWS.map((r) => r.id).filter((id) => !isFair(id, pick[id]));
const worked = (t) => `(${t.a} ${X} ${t.d}) / (${t.b} ${X} ${t.c}) = ${t.a * t.d} / ${t.b * t.c} = ${f2(orOf(t))}`;

const CSS = SIM_PANEL_CSS + `
.rig { gap: var(--sim-space-3); }
.rig .spn-split { gap: var(--sim-space-5); align-items: start; grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); }
.rig-col { display: flex; flex-direction: column; gap: var(--sim-space-3); }
.rig-rows { display: flex; flex-direction: column; }
.rig-row { display: grid; grid-template-columns: 7.8em minmax(0, 1fr); align-items: center; gap: var(--sim-space-2); padding: 5px 0; border-bottom: 1px solid color-mix(in oklab, var(--sim-stroke) 45%, transparent); }
.rig-row:first-child { border-top: 1px solid var(--sim-label); }
.rig-row .spn-label { font-weight: 600; }
.rig-row--open { row-gap: 6px; }
.rig-flawk { justify-self: end; font-size: var(--sim-text-sm); font-weight: 700; color: var(--sim-annot); }
.rig-flawk + .spn-btns { padding-left: var(--sim-space-2); border-left: 2px solid var(--sim-annot); }
.rig .spn-table th, .rig .spn-table td { padding: 5px 8px; }
.rig .spn-table tbody th { white-space: nowrap; }
.rig .spn-read { gap: 2px; }
.rig .spn-read__n { font-size: 44px; }
.rig .spn-frac { font-size: 26px; }
.rig-check { display: flex; align-items: flex-start; gap: var(--sim-space-3); border-top: 1px solid var(--sim-label); padding-top: var(--sim-space-2); }
.rig-fb { margin: 0; flex: 1 1 0; min-height: 2.7em; font-size: var(--sim-text-sm); line-height: 1.35; color: var(--sim-label); }
.rig-fb b { font-weight: 700; }
.rig-fb--ok b:first-child { color: var(--sim-good); }
.rig-fb--no b:first-child { color: var(--sim-bad); }
.sim-dom-root--portrait .rig { gap: var(--sim-space-2); }
.sim-dom-root--portrait .rig .spn-split { gap: var(--sim-space-2); grid-template-columns: minmax(0, 1fr); }
.sim-dom-root--portrait .rig .spn-split > .rig-col:last-child { order: -1; }
.sim-dom-root--portrait .rig .spn-kicker { display: none; }
.sim-dom-root--portrait .rig-table { display: none; }
.sim-dom-root--portrait .rig-row { grid-template-columns: minmax(0, 1fr); gap: 3px; padding: 3px 0; }
.sim-dom-root--portrait .rig-row .spn-label { font-size: var(--sim-text-sm); }
.sim-dom-root--portrait .rig-flawk { display: none; }
.sim-dom-root--portrait .rig .spn-act { white-space: nowrap; }
.sim-dom-root--portrait .rig-flawk + .spn-btns { flex-wrap: nowrap; gap: 3px; padding-left: 4px; }
.sim-dom-root--portrait .rig-flawk + .spn-btns .spn-act { min-height: 28px; padding: 2px 3px; letter-spacing: -0.01em; }
.sim-dom-root--portrait .rig-why { display: none; }
.sim-dom-root--portrait .rig-fb { font-size: var(--sim-text-sm); }
.sim-dom-root--portrait .rig-check { gap: var(--sim-space-2); }
.sim-dom-root--portrait .rig .spn-read__n { font-size: 34px; }
.sim-dom-root--portrait .rig .spn-frac { font-size: 24px; }
.sim-dom-root--portrait .rig .spn-read__f { display: none; }
`;

export class RigTheStudyGame extends withChallenge(DomSimulation) {
  static WIDTH = 900;
  static HEIGHT = 450;
  static PORTRAIT_WIDTH = 360;
  static PORTRAIT_HEIGHT = 590;
  static LAYOUT = 'fit';
  static SETTING = 'none';
  static SELF_CHECKING = true;
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }]];
  static CONTROLS = [];
  static ARIA_LABEL = 'Exercise, illustrative numbers: a training case-control file whose exposure truly does nothing, 6 of 20 cases and 18 of 60 controls exposed, odds ratio 1.00. Four rows of choices set the control source, the interviewer, the source of the past and the matching; a live 2 by 2 table and the odds ratio recompute. At 2.00 or more, each changed choice opens flaw chips: selection, interviewer, recall, overmatching. Press Check for the worked cross-product and the mechanism behind each choice.';
  static OBJECTIVE = { prompt: { en: 'From a study whose exposure truly does nothing, print an odds ratio of 2.00 or more, then name the flaw behind each choice that built it.' } };

  async setup() {
    this._pick = { ...FAIR };
    this._tags = {};
    this._touched = false;
    this._won = false;
    this._fb = ''; this._fbState = '';
    await super.setup();
    this.render({ css: CSS, rootClass: 'spn-page', html: '' });
    bindPanel(this.root, {
      action: (name, v) => {
        if (name === 'check') this.onCheck();
        else if (name.startsWith('opt-')) this.onPick(name.slice(4), v);
        else if (name.startsWith('flaw-')) this.onTag(name.slice(5), v);
      },
    });
    this.paint();
  }

  onPick(row, opt) {
    if (this._pick[row] === opt) return;
    this._pick[row] = opt;
    this._touched = true;
    const changed = changedRows(this._pick);
    for (const r of Object.keys(this._tags)) if (!changed.includes(r)) delete this._tags[r];
    if (!this._won) { this._fb = ''; this._fbState = ''; }
    this.paint();
  }

  onTag(row, flaw) {
    this._tags[row] = flaw;
    if (!this._won) { this._fb = ''; this._fbState = ''; }
    this.paint();
  }

  onCheck() {
    const t = countsOf(this._pick), or = orOf(t), changed = changedRows(this._pick);
    const line = `Odds ratio = ${worked(t)}.`;
    if (!this._touched || !changed.length) {
      this._fb = `<b>Not yet.</b> The fair file reads ${worked(t)}. Change a choice.`; this._fbState = 'no';
    } else if (or < TARGET_OR) {
      const hint = this._pick.match === 'job' ? ' Matching on reactor work pins the ratio at 1.00: overmatching hides an effect, it cannot build one.' : ' The target is 2.00.';
      this._fb = `<b>Not yet.</b> ${line}${hint}`; this._fbState = 'no';
    } else {
      const wrong = changed.filter((r) => this._tags[r] !== ROW_FLAW[r]);
      if (wrong.length) {
        const missing = wrong.filter((r) => !this._tags[r]).length;
        this._fb = `<b>Not yet.</b> ${line} ${missing === wrong.length ? `Tag ${wrong.length === 1 ? 'the changed choice' : `all ${wrong.length} changed choices`} with a flaw.` : `${changed.length - wrong.length} of ${changed.length} flaw names are right; look again at ${ROWS.find((r) => r.id === wrong[0]).label.toLowerCase()}.`}`;
        this._fbState = 'no';
      } else {
        this._won = true;
        this._fb = `<b>Correct.</b> ${line} <span class="rig-why">${changed.map((r) => WHY[this._pick[r]]).join(' ')}</span> The exposure did nothing; the study built ${f2(or)}.`;
        this._fbState = 'ok';
        this.paint();
        this.requestCheck?.();
        return;
      }
    }
    this.paint();
  }

  rowsHtml(open) {
    return `<div class="rig-rows">${ROWS.map((r) => {
      const opts = chipsHtml(r.opts.map((o) => ({ label: o.label, action: `opt-${r.id}`, value: o.id, pressed: this._pick[r.id] === o.id })), { label: r.label, size: 'sm' });
      const flaw = open && !isFair(r.id, this._pick[r.id])
        ? `<span class="rig-flawk">Flaw</span>${chipsHtml(FLAWS.map((f) => ({ label: f.label, action: `flaw-${r.id}`, value: f.id, pressed: this._tags[r.id] === f.id, bare: true })), { label: `Flaw behind ${r.label}`, size: 'sm' })}`
        : '';
      return `<div class="rig-row${flaw ? ' rig-row--open' : ''}"><span class="spn-label">${r.label}</span>${opts}${flaw}</div>`;
    }).join('')}</div>`;
  }

  paint() {
    if (!this.root) return;
    const t = countsOf(this._pick), or = orOf(t), open = or >= TARGET_OR - 1e-9;
    const prompt = this._won
      ? promptHtml('Done. Try another way to break the file if you like.', { done: true })
      : open ? promptHtml('Now tag each changed choice with its flaw, then press Check')
        : promptHtml('Change choices until the odds ratio reads 2.00 or more');
    const read = readoutHtml({ key: 'or', label: 'Odds ratio, this file', value: f2(or), frac: { n: `${t.a} ${X} ${t.d}`, d: `${t.b} ${X} ${t.c}` },
      formula: `the truth is 1.00; target 2.00 or more`, tone: open ? 'annot' : 'label' });
    const table = `<div class="rig-table">${ruleTableHtml({
      caption: 'Training file, illustrative',
      cols: [{ label: 'Cases' }, { label: 'Controls' }],
      rows: [{ label: 'Reactor work', cells: [{ v: t.a, tag: 'a' }, { v: t.b, tag: 'b' }] }, { label: 'None', cells: [{ v: t.c, tag: 'c' }, { v: t.d, tag: 'd' }] }],
      total: { label: 'Total', cells: [CASES_N, CONTROLS_N] },
      label: 'Reactor work by cases and controls, this file',
    })}</div>`;
    const check = `<div class="rig-check">${buttonsHtml([{ label: 'Check', action: 'check', primary: true }])}<p class="rig-fb${this._fbState ? ` rig-fb--${this._fbState}` : ''}" aria-live="polite">${this._fb}</p></div>`;
    this.render({ html: `<div class="spn rig">${prompt}<div class="spn-split"><div class="rig-col">${this.rowsHtml(open)}</div><div class="rig-col">${read}${table}</div></div>${check}</div>` });
  }

  checkObjective() {
    if (this._won) return { ok: true };
    if (!this._touched) return null;
    return { ok: false };
  }

  resetChallenge() {
    super.resetChallenge();
    this._won = false;
    this._fb = ''; this._fbState = '';
    this.paint();
  }

  testState() {
    const t = countsOf(this._pick), changed = changedRows(this._pick);
    return { or: orOf(t), orText: f2(orOf(t)), touched: this._touched, open: orOf(t) >= TARGET_OR, changed: changed.length, tagsRight: changed.length > 0 && changed.every((r) => this._tags[r] === ROW_FLAW[r]), won: this._won };
  }
}
