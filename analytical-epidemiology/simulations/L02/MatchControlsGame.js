import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withChallenge } from 'simulations/base/ChallengeMode.js';
import { SIM_PANEL_CSS, ruleTableHtml, chipsHtml, buttonsHtml, promptHtml, bindPanel } from 'simulations/base/kit/SimPanel.js';

/**
 * MatchControlsGame - mini-game@1 on blk-l02-s09 (analytical-epidemiology L02), framed as an exercise.
 * (The file name is historical; nothing on screen or in ARIA calls it a game.)
 * Live case, illustrative: 20 patients with the tumour, 60 controls to choose from the plant's own
 * workforce. The learner sets three selection rules (chips with a picked state); the 60 controls drawn
 * under those rules redraw at once beside the 20 patients - a dot row each, signature colour for the men
 * who cleaned reactors - with a ruled table of what the group now holds. The scene owns its Check
 * (SELF_CHECKING): the feedback names each rule that is wrong, with the numbers that show why.
 *   Fair group: tumour-free (0 of 60), age-matched (average 50.0 against 49.9), NOT matched on job
 *   (9 of 60 cleaned reactors, 15 per cent, against 14 of 20 patients, 70 per cent - the s10 table).
 *   Matched on job: 42 of 60 cleaners, 70 per cent, the patients' own share - the exposure can no
 *   longer differ. Not age-matched: average 41.6, 14 of 60 aged 50 or over. Tumour not excluded: 3 of 60.
 * Plain look: rules, no burst, no timer, no score. Desk 900 x 440; portrait 360 x 640 (the table gives way to
 * one average-age line in portrait: the dot rows already carry the tumour rings and the cleaners' counts).
 * Built on the editorial panel parts (kit/SimPanel.js): prompt, chips, rule table, buttons.
 */
const PAT = { n: 20, cleaned: 14, age: '49.9', over50: 10 };
const CTL = 60;
const RULES = [
  { key: 'free', label: 'Leave out men with the tumour in their record' },
  { key: 'age', label: 'Match each patient’s age, within 5 years' },
  { key: 'job', label: 'Match each patient’s job, reactor work or not' },
];

/** The 60 controls the rules produce (illustrative counts). */
function groupOf(r) {
  return {
    tumour: r.free ? 0 : 3,
    age: r.age ? '50.0' : '41.6',
    over50: r.age ? 30 : 14,
    cleaned: r.job ? 42 : 9,
  };
}
const pct = (a, b) => Math.round((100 * a) / b);

const CSS = SIM_PANEL_CSS + `
.mc { gap: var(--sim-space-3); }
.mc .spn-split { grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr); gap: var(--sim-space-5); }
.mc-col { display: flex; flex-direction: column; gap: var(--sim-space-3); }
.mc-rules { display: flex; flex-direction: column; gap: var(--sim-space-2); }
.mc-rules .spn-btns { flex-direction: column; align-items: stretch; }
.mc-rules .spn-act { width: 100%; font-size: var(--sim-text-md); }
.mc-check { display: flex; align-items: flex-start; gap: var(--sim-space-3); border-top: 1px solid var(--sim-label); padding-top: var(--sim-space-3); }
.mc-fb { margin: 0; flex: 1 1 0; min-height: 4.4em; font-size: var(--sim-text-md); line-height: 1.35; color: var(--sim-label); }
.mc-fb b { font-weight: 700; }
.mc-fb--ok b:first-child { color: var(--sim-good); }
.mc-grp { display: flex; flex-direction: column; gap: 6px; }
.mc-grp p { margin: 0; display: flex; justify-content: space-between; gap: var(--sim-space-3); font-size: var(--sim-text-sm); }
.mc-grp p b { font-weight: 700; font-size: var(--sim-text-md); font-variant-numeric: tabular-nums; }
.mc-dots { display: grid; grid-template-columns: repeat(20, 11px); gap: 4px; }
.mc-dot { width: 11px; height: 11px; border-radius: 50%; background: var(--sim-series-8); transition: background-color 0.2s ease; transition-delay: calc(var(--k) * 5ms); }
.mc-dot--x { background: var(--sim-annot); }
.mc-dot--t { background: transparent; box-shadow: inset 0 0 0 2px var(--sim-label); }
.mc-key { display: flex; flex-wrap: wrap; gap: 2px var(--sim-space-4); margin: 0; font-size: var(--sim-text-sm); color: var(--sim-label-muted); }
.mc-key i { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 6px; background: var(--sim-annot); vertical-align: -1px; }
.mc-key i.mc-dot--t { background: transparent; box-shadow: inset 0 0 0 2px var(--sim-label); }
.mc .spn-table th, .mc .spn-table td { padding-top: 6px; padding-bottom: 6px; }
.mc .spn-table td { white-space: nowrap; }
.mc-warn { color: var(--sim-bad); font-weight: 700; }
.sim-dom-root--portrait .mc { gap: var(--sim-space-2); }
.sim-dom-root--portrait .mc .spn-split { grid-template-columns: minmax(0, 1fr); gap: var(--sim-space-3); }
.sim-dom-root--portrait .mc .spn-table caption { display: none; }
.sim-dom-root--portrait .mc-rules .spn-act { min-height: 36px; padding: 4px 10px; font-size: var(--sim-text-sm); }
.sim-dom-root--portrait .mc-dots { grid-template-columns: repeat(20, 10px); gap: 3px; }
.sim-dom-root--portrait .mc-dot { width: 10px; height: 10px; }
.sim-dom-root--portrait .mc .spn-table th, .sim-dom-root--portrait .mc .spn-table td { padding: 4px 6px; }
.mc-age { display: none; margin: 0; font-size: var(--sim-text-sm); }
.mc-age b { font-weight: 700; font-variant-numeric: tabular-nums; }
.sim-dom-root--portrait .mc .spn-table { display: none; }
.sim-dom-root--portrait .mc-age { display: block; }
.sim-dom-root--portrait .mc-fb { font-size: var(--sim-text-sm); min-height: 4.2em; }
.sim-dom-root--portrait .mc-check { padding-top: var(--sim-space-2); }
@media (prefers-reduced-motion: reduce) { .mc-dot { transition: none; } }
`;

export class MatchControlsGame extends withChallenge(DomSimulation) {
  static WIDTH = 900;
  static HEIGHT = 440;
  static PORTRAIT_WIDTH = 360;
  static PORTRAIT_HEIGHT = 640;
  static LAYOUT = 'fit';
  static SETTING = 'none';
  static SELF_CHECKING = true;
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }]];
  static CONTROLS = [];
  static ARIA_LABEL = 'Exercise, illustrative live case: choose the rules for picking 60 controls from the plant workforce for 20 patients with the tumour. Three rules can be switched on or off: leave out men with the tumour, match each patient’s age, match each patient’s job. The controls redraw beside the patients with a table of tumour records, average age and how many cleaned reactors. Set the rules for a fair comparison, then press Check.';
  static OBJECTIVE = { prompt: { en: 'Set the rules for choosing 60 fair controls, then press Check.' } };

  async setup() {
    this.rules = { free: false, age: false, job: false };
    this.changed = false;
    this.won = false;
    this.fb = '';
    this.fbState = '';
    await super.setup();
    this.render({ css: CSS, rootClass: 'spn-page', html: '' });
    bindPanel(this.root, {
      action: (name, v) => {
        if (name === 'rule') this.toggle(v);
        else if (name === 'check') this.onCheck();
      },
    });
    this.paint();
  }

  toggle(key) {
    if (!(key in this.rules)) return;
    this.rules[key] = !this.rules[key];
    this.changed = true;
    if (!this.won) { this.fb = ''; this.fbState = ''; }
    this.paint();
  }

  fair() { return this.rules.free && this.rules.age && !this.rules.job; }

  /** Worked feedback: each rule that is wrong, with its numbers; when right, why the group is fair. */
  onCheck() {
    const g = groupOf(this.rules);
    if (this.fair()) {
      this.won = true;
      this.fb = `<b>Correct.</b> All 60 controls are free of the tumour, their average age is ${g.age} against the patients’ ${PAT.age}, and the exposure is left free to differ: ${g.cleaned} of 60 cleaned reactors (${pct(g.cleaned, CTL)}%) against ${PAT.cleaned} of 20 patients (${pct(PAT.cleaned, PAT.n)}%).`;
      this.fbState = 'ok';
      this.paint();
      this.requestCheck?.();
      return;
    }
    const why = [];
    if (this.rules.job) why.push(`Job: ${g.cleaned} of 60 controls cleaned reactors (${pct(g.cleaned, CTL)}%), the patients’ own share, so the exposure can no longer differ.`);
    if (!this.rules.free) why.push(`Tumour: ${g.tumour} controls have it; controls must be free of the disease.`);
    if (!this.rules.age) why.push(`Age: ${g.age} years against ${PAT.age}; older men have worked longer, so match age.`);
    this.fb = `<b>Not yet.</b> ${why.join(' ')}`;
    this.fbState = 'no';
    this.paint();
  }

  dots(n, x, t) {
    let s = '';
    for (let k = 0; k < n; k++) {
      const cls = k < t ? ' mc-dot--t' : k < t + x ? ' mc-dot--x' : '';
      s += `<i class="mc-dot${cls}" style="--k:${k}"></i>`;
    }
    return `<span class="mc-dots" aria-hidden="true">${s}</span>`;
  }

  paint() {
    if (!this.root) return;
    const r = this.rules, g = groupOf(r);
    const prompt = promptHtml(this.won ? 'Done. You can keep changing the rules.' : 'Switch the rules on or off, then press Check.', { key: 'prompt', done: this.won });
    const chips = chipsHtml(RULES.map((x) => ({ label: x.label, action: 'rule', value: x.key, pressed: r[x.key] })), { label: 'Rules for choosing controls' });
    const left = `<div class="mc-col">${prompt}<div class="mc-rules"><span class="spn-label">Rules for choosing the 60 controls</span>${chips}</div>`
      + `<div class="mc-check">${buttonsHtml([{ label: 'Check', action: 'check', primary: true }])}<p class="mc-fb${this.fbState ? ` mc-fb--${this.fbState}` : ''}" aria-live="polite">${this.fb}</p></div></div>`;
    const warn = (bad, text) => (bad ? { v: '', html: `<span class="mc-warn">${text}</span>` } : text);
    const table = ruleTableHtml({
      corner: 'Illustrative',
      cols: [{ label: 'Patients', sub: '(20)' }, { label: 'Controls', sub: '(60)' }],
      rows: [
        { label: 'Tumour in record', cells: ['20 of 20', warn(g.tumour > 0, `${g.tumour} of 60`)] },
        { label: 'Average age', cells: [`${PAT.age} yr`, warn(!r.age, `${g.age} yr`)] },
        { label: 'Aged 50 or over', cells: [`${PAT.over50} of 20`, `${g.over50} of 60`] },
        { label: 'Cleaned reactors', cells: [`${PAT.cleaned} of 20`, warn(r.job, `${g.cleaned} of 60`)] },
      ],
      band: { row: 3 },
      label: 'Patients and the controls the rules produce',
    });
    const right = '<div class="mc-col">'
      + `<div class="mc-grp"><p><span>Patients</span><span><b>${PAT.cleaned}</b> of 20 cleaned reactors</span></p>${this.dots(PAT.n, PAT.cleaned, 0)}</div>`
      + `<div class="mc-grp"><p><span>Controls</span><span><b>${g.cleaned}</b> of 60 cleaned reactors</span></p>${this.dots(CTL, g.cleaned, g.tumour)}</div>`
      + '<p class="mc-key"><span><i></i>cleaned reactors</span><span><i class="mc-dot--t"></i>tumour in record</span></p>'
      + `<p class="mc-age">Average age: patients <b>${PAT.age}</b>, controls ${!r.age ? `<span class="mc-warn">${g.age}</span>` : `<b>${g.age}</b>`} years</p>`
      + table + '</div>';
    this.render({ html: `<div class="spn mc"><div class="spn-split">${left}${right}</div></div>` });
  }

  checkObjective() {
    if (!this.changed) return null;
    return this.won || this.fair() ? { ok: true } : { ok: false };
  }

  resetChallenge() {
    super.resetChallenge();
    this.won = false;
    this.fb = '';
    this.fbState = '';
    this.paint();
  }

  testState() {
    return { rules: { ...this.rules }, won: this.won, group: groupOf(this.rules) };
  }
}
