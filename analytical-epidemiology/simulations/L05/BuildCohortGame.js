import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withChallenge } from 'simulations/base/ChallengeMode.js';
import { esc } from 'simulations/base/SimUi.js';
import { SIM_PANEL_CSS, binChipsHtml, fileCardHtml, cardGridHtml, checkListHtml, buttonsHtml, promptHtml, bindPanel } from 'simulations/base/kit/SimPanel.js';

/**
 * BuildCohortGame - mini-game@1 on blk-l05-s07 (analytical-epidemiology L05), framed as an exercise.
 * (The file name is historical; nothing on screen or in ARIA calls it a game.)
 * Live case (illustrative): 12 personnel files from the plant's records. The learner picks a
 * destination (Study cohort, Control cohort, Leave out) and taps files to place them; the criteria of
 * the picked destination sit under the chips, fixed before any file was opened. Check (scene-owned,
 * SELF_CHECKING) runs the four entry checks from the previous slide and names the first file that
 * breaks one, with the rule it breaks: disease-free at entry, same workforce, criteria applied alike,
 * criteria fixed beforehand (always met here: the criteria are printed and locked before the files).
 * Win = the bins match the key (tie level L2: each file lands right only through its rule).
 * Key: study 01 02 07 10 12; control 05 06 11; leave out 03 04 08 09 (the stub's deck, verbatim).
 * Study files (exposed, the focal group) carry the signature colour; control files are neutral.
 * Desk 860 x 470; portrait 380 x 470. Built on kit/SimPanel.js: prompt, bin chips, file cards (keys 1-3 place a
 * focused file), check list, buttons.
 */
const FILES = [
  { no: '01', job: 'Cleaner', years: 9 },
  { no: '02', job: 'Cleaner', years: 6 },
  { no: '03', job: 'Cleaner', years: 12, tumour: true },
  { no: '04', job: 'Cleaner', years: 2 },
  { no: '05', job: 'Maintenance fitter', sj: 'Fitter', own: true },
  { no: '06', job: 'Office clerk', sj: 'Clerk', own: true },
  { no: '07', job: 'Cleaner', years: 7 },
  { no: '08', job: 'Electrician', sj: 'Electrician', contractor: true },
  { no: '09', job: 'Storekeeper', sj: 'Storekeeper', own: true, tumour: true },
  { no: '10', job: 'Cleaner', years: 8 },
  { no: '11', job: 'Warehouse hand', sj: 'Warehouse', own: true },
  { no: '12', job: 'Cleaner', years: 5 },
];
const KEY = { '01': 'study', '02': 'study', '07': 'study', '10': 'study', '12': 'study', '05': 'control', '06': 'control', '11': 'control', '03': 'out', '04': 'out', '08': 'out', '09': 'out' };
const BINS = [
  { id: 'study', tone: 'annot', label: 'Study cohort', chip: 'Study', short: 'Study', prule: 'Study: 5+ yr reactor cleaning, well at entry, own staff.', rule: 'Study cohort: 5 or more years of reactor cleaning, free of the tumour at entry, from the plant\'s own workforce.' },
  { id: 'control', tone: 'label', label: 'Control cohort', chip: 'Control', short: 'Control', prule: 'Control: no reactor work, well at entry, own staff.', rule: 'Control cohort: no reactor work, free of the tumour at entry, from the plant\'s own workforce.' },
  { id: 'out', tone: 'muted', label: 'Leave out', chip: 'Leave out', short: 'Out', prule: 'Leave out: any file that fits neither cohort.', rule: 'Leave out: any file that fits neither cohort\'s criteria.' },
];
const binOf = (id) => BINS.find((b) => b.id === id);
const lines = (f) => [
  f.years != null ? `Reactor cleaning ${f.years} yr` : 'No reactor work',
  f.tumour ? 'Tumour at entry' : f.contractor ? 'Outside contractor' : f.own ? 'Plant\'s own staff' : '',
].filter(Boolean);
const fileAria = (f, place) => `File ${f.no}, ${f.job}, ${lines(f).join(', ')}. ${place ? `Placed: ${binOf(place).label}.` : 'Not placed.'}`;

const CSS = SIM_PANEL_CSS + `
.bc { gap: var(--sim-space-3); }
.bc-split { display: grid; grid-template-columns: 250px minmax(0, 1fr); gap: var(--sim-space-5); align-items: start; }
.bc-side { display: flex; flex-direction: column; gap: var(--sim-space-3); }
.bc-side .spn-btns { flex-direction: column; align-items: stretch; }
.bc-fb--main { display: none; }
.bc-rule { margin: 0; padding: var(--sim-space-2) var(--sim-space-3); border-left: 3px solid var(--sim-annot); background: var(--sim-surface-raised);
  font-size: var(--sim-text-sm); line-height: 1.45; color: var(--sim-label); }
.bc-fixed { margin: 0; font-size: var(--sim-text-sm); color: var(--sim-label-muted); }
.bc-main { display: flex; flex-direction: column; gap: var(--sim-space-3); }
.bc-check { display: grid; grid-template-columns: auto minmax(0, 1fr); gap: var(--sim-space-2) var(--sim-space-4); align-items: center; border-top: 1px solid var(--sim-label); padding-top: var(--sim-space-3); }
.bc-fb { margin: 0; min-height: 3.2em; font-size: var(--sim-text-sm); line-height: 1.4; color: var(--sim-label); }
.bc-fb b { font-weight: 700; }
.bc-fb--ok b:first-child { color: var(--sim-good); }
.bc-fb--bad b:first-child { color: var(--sim-bad); }
.sim-dom-root--portrait .bc-split { display: flex; flex-direction: column; gap: var(--sim-space-2); }
.sim-dom-root--portrait .bc-side { display: contents; }
.sim-dom-root--portrait .bc-side .spn-btns { flex-direction: row; flex-wrap: nowrap; }
.sim-dom-root--portrait .bc-fb--side { display: none; }
.sim-dom-root--portrait .bc-fb--main { display: block; }
.sim-dom-root--portrait .bc .spn-checks { display: none; }
.sim-dom-root--portrait .bc-check { align-items: start; gap: var(--sim-space-2) var(--sim-space-3); padding-top: var(--sim-space-2); }
.sim-dom-root--portrait .bc-check .bc-fb { grid-column: 2; min-height: 4.2em; font-size: 12px; line-height: 1.35; }
.sim-dom-root--portrait .bc-fixed { display: none; }
.sim-dom-root--portrait .bc-rule { padding: 4px 8px; font-size: 12.5px; line-height: 1.35; }
.sim-dom-root--portrait .bc .spn-prompt { font-size: 15px; }
.sim-dom-root--portrait .bc .bc-check .spn-btn { min-height: 36px; padding-top: 4px; padding-bottom: 4px; }
`;

export class BuildCohortGame extends withChallenge(DomSimulation) {
  static WIDTH = 860;
  static HEIGHT = 470;
  static PORTRAIT_WIDTH = 350;
  static PORTRAIT_HEIGHT = 470;
  static LAYOUT = 'fit';
  static SETTING = 'none';
  static SELF_CHECKING = true;
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }]];
  static CONTROLS = [];
  static OBJECTIVE = { prompt: { en: 'Sort 12 personnel files into a study and a control cohort that pass all four entry checks.' } };
  static ARIA_LABEL = 'Exercise, live case with illustrative files: twelve personnel files from the plant. Pick a destination, study cohort, control cohort or leave out, then select files to place them there. The criteria were fixed before any file was opened. Press Check to run the four entry checks: disease-free at entry, same workforce, criteria applied alike, criteria fixed beforehand.';

  async setup() {
    this._reset();
    await super.setup();
    this.render({ css: CSS, rootClass: 'spn-page', html: '' });
    bindPanel(this.root, { action: (name, v) => this.act(name, v), place: (no, bin) => this.place(no, bin) });
    this.paint();
  }

  _reset() { this._bin = 'study'; this._place = {}; this._fb = ''; this._fbState = ''; this._won = false; this._tests = null; }

  /** Keys 1-3 on a focused file: put it in that bin (and make that bin the active one). */
  place(no, bin) {
    if (!binOf(bin) || !FILES.some((f) => f.no === no)) return;
    this._bin = bin;
    this._place[no] = bin;
    if (!this._won) { this._fb = ''; this._fbState = ''; this._tests = null; }
    this.paint();
  }

  act(name, v) {
    if (name === 'bin' && binOf(v)) { this._bin = v; this.paint(); return; }
    if (name === 'file') {
      const f = FILES.find((x) => x.no === v);
      if (!f) return;
      this._place[f.no] = this._place[f.no] === this._bin ? undefined : this._bin;
      if (!this._won) { this._fb = ''; this._fbState = ''; this._tests = null; }
      this.paint();
      return;
    }
    if (name === 'check') this._onCheck();
  }

  /** The four entry checks over the current placement, with the first file that breaks each. */
  tests() {
    const inCohort = FILES.filter((f) => this._place[f.no] === 'study' || this._place[f.no] === 'control');
    const study = FILES.filter((f) => this._place[f.no] === 'study'), control = FILES.filter((f) => this._place[f.no] === 'control');
    const alikeBad = study.find((f) => !(f.years >= 5)) ?? control.find((f) => f.years != null);
    return [
      { label: 'Disease-free at entry', bad: inCohort.find((f) => f.tumour) },
      { label: 'Same workforce', bad: inCohort.find((f) => f.contractor) },
      { label: 'Applied alike', bad: alikeBad },
      { label: 'Fixed beforehand', bad: null },
    ];
  }

  _why(t) {
    const f = t.bad, where = binOf(this._place[f.no]).label.toLowerCase();
    if (t.label === 'Disease-free at entry') return `File ${f.no} already had the tumour on file at entry, so it cannot sit in the ${where}: a cohort counts only new cases.`;
    if (t.label === 'Same workforce') return `File ${f.no} is a contractor from an outside agency; both cohorts must come from the plant's own workforce.`;
    if (this._place[f.no] === 'study') return f.years == null ? `File ${f.no} has no reactor work, so it cannot be in the study cohort: the study cohort needs 5 or more years of reactor cleaning.` : `File ${f.no} has ${f.years} years of reactor cleaning, under the 5 the study cohort requires.`;
    return `File ${f.no} has reactor-cleaning years, so it cannot be a control: controls have no reactor work.`;
  }

  _onCheck() {
    const left = FILES.filter((f) => !this._place[f.no]);
    if (left.length) { this._tests = null; this._setFb(`<b>Not yet.</b> Place every file first: ${left.length} still ${left.length === 1 ? 'has' : 'have'} no destination.`, 'bad'); return; }
    const tests = this.tests();
    this._tests = tests;
    const broken = tests.find((t) => t.bad);
    if (broken) { this._setFb(`<b>Not yet.</b> ${this._why(broken)}`, 'bad'); return; }
    const miss = FILES.find((f) => this._place[f.no] !== KEY[f.no]);
    if (miss) {
      this._setFb(`<b>Not yet.</b> The four checks pass, but File ${miss.no} meets the ${binOf(KEY[miss.no]).label.toLowerCase()} criteria and was ${binOf(this._place[miss.no]).id === 'out' ? 'left out' : `put in the ${binOf(this._place[miss.no]).label.toLowerCase()}`}. Every eligible record enters.`, 'bad');
      return;
    }
    this._won = true;
    this._setFb('<b>Correct.</b> <span class="spn-land">Five reactor men and three other men enter, all well at entry and all the plant\'s own. Files 03 and 09 already had the tumour, 04 has only 2 years of cleaning, 08 is a contractor. The full records hold about 2,000 such reactor men and 8,000 other men (illustrative).</span><span class="spn-port">Five reactor men and three others enter. 03 and 09 had the tumour, 04 has 2 years, 08 is a contractor.</span>', 'ok');
    this.requestCheck?.();
  }

  _setFb(html, state) { this._fb = html; this._fbState = state; this.paint(); }

  paint() {
    if (!this.root) return;
    const bin = binOf(this._bin);
    const count = (id) => FILES.filter((f) => this._place[f.no] === id).length;
    const chips = binChipsHtml(BINS.map((b) => ({ id: b.id, label: b.chip, n: count(b.id) })), { active: this._bin, label: 'Destination for the next file', size: 'sm' });
    const prompt = promptHtml(this._won ? 'Done. You can keep re-sorting.' : 'Pick a destination, then tap files', { done: this._won });
    const rule = `<p class="bc-rule"><span class="spn-land">${esc(bin.rule)}</span><span class="spn-port">${esc(bin.prule)}</span></p>${this._fb ? '' : '<p class="bc-fixed">Criteria fixed before any file was opened.</p>'}`;
    const ids = BINS.map((b) => b.id);
    const grid = cardGridHtml(FILES.map((f) => {
      const p = this._place[f.no], l = lines(f);
      return fileCardHtml({
        id: f.no, title: `File ${f.no}`, aria: fileAria(f, p), bin: p ? binOf(p) : null,
        fields: [
          { text: `${f.job}${f.years != null ? `, ${f.years} yr` : ''}`, short: f.years != null ? `Cleaner, ${f.years} yr` : `${f.sj}, 0 yr` },
          { text: f.years != null ? 'reactor cleaning' : l[0], short: '', muted: f.years != null },
          l[1] ? { text: l[1], short: f.tumour ? 'Tumour' : f.contractor ? 'Contractor' : 'Own staff', strong: true } : null,
        ],
      }, { action: 'file', bins: ids });
    }), { cols: 4, portraitCols: 3, label: 'Personnel files, illustrative' });
    const tests = this._tests ? checkListHtml(this._tests.map((t) => ({ label: t.label, ok: !t.bad })), { cols: 2, label: 'Entry checks' }) : '';
    const fb = (k) => `<p class="bc-fb bc-fb--${k}${this._fbState ? ` bc-fb--${this._fbState}` : ''}" aria-live="polite">${this._fb}</p>`;
    const check = `<div class="bc-check">${buttonsHtml([{ label: 'Check', action: 'check', primary: true }])}${tests}${fb('main')}</div>`;
    this.render({ html: `<div class="spn bc"><div class="bc-split"><div class="bc-side">${prompt}${chips}${rule}${fb('side')}</div><div class="bc-main">${grid}${check}</div></div></div>` });
  }

  checkObjective() {
    if (FILES.some((f) => !this._place[f.no])) return null;
    return this._won || FILES.every((f) => this._place[f.no] === KEY[f.no]) ? { ok: true } : { ok: false };
  }

  resetChallenge() {
    super.resetChallenge();
    this._reset();
    this.paint();
  }

  testState() {
    return { place: { ...this._place }, bin: this._bin, won: this._won, placed: FILES.filter((f) => this._place[f.no]).length };
  }
}
