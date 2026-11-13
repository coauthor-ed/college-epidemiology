import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withBeats } from 'simulations/base/DomBeats.js';
import { withHypothesisBoard } from './HypothesisBoard.js';
import { withNarrationCues } from './NarrationCues.js';

/**
 * HypothesisBuilderScene-plant - L01 s07 (rebuilt 2026-11-05 on the editorial panel parts). The claim for
 * the illustrative plastics-plant case, in choose mode: one part is open at a time as a tinted panel with
 * two wording cards (seeded left/right order). A precise wording names the record that could confirm it
 * (tick); a vague one reads "Cannot be measured" (cross). Decided parts fold to one flat line each, so the
 * open choice and the decided lines never look alike. Thin subclass: data, plus narration cues.
 * Narrated (spec W1 D15, Q-41): beat 2 cue pick-1 makes the first choice (the precise population) as the teacher
 * explains it, then the learner chooses the other four; once all five have a wording the scene sends
 * scene-interact-done (b2). Beat 3 cue vague-cause / vague-time choose the vague wording in sync, so "Cannot be
 * measured" shows as it is said; cue precise puts both precise wordings back as the precise claim is read.
 * Cue choices never send the signal; a jump back restores the beat's start picture (NarrationCues.js).
 */
const seg = (sel, id, words) => (sel[id] ? { part: id, text: words[sel[id]] } : { gap: id });

export class HypothesisBuilderScenePlant extends withNarrationCues(withHypothesisBoard(withBeats(DomSimulation))) {
  static WIDTH = 580;
  static HEIGHT = 520;
  static PORTRAIT_WIDTH = 360;
  static PORTRAIT_HEIGHT = 860;
  static ARIA_LABEL = 'A claim for the illustrative plastics-plant case: five parts, each with a precise and a vague wording. One part is open at a time. A precise wording names the record that could confirm it; a vague one reads cannot be measured.';
  static CONTROLS = [];
  static BEAT_STEP_MAP = [
    [{ idx: 0, dwellMs: null }], // the case opens, choices locked
    [{ idx: 1, dwellMs: null }], // choose each part
    [{ idx: 2, dwellMs: null }], // all precise; try the vague cause or time
  ];

  static MODE = 'choose';
  static SEED = 7;
  static CASE = { kicker: 'Plastics plant (illustrative)', count: 'parts measurable' };
  static PARTS = [
    { id: 'population', name: 'Population', ask: 'who?', options: [
      { key: 'p', label: 'Among men who worked at the plant', record: 'Plant employment records' },
      { key: 'v', label: 'Among people', vague: true }] },
    { id: 'cause', name: 'Cause', ask: 'exposed to what?', options: [
      { key: 'p', label: 'tank cleaning', record: 'Which men cleaned tanks' },
      { key: 'v', label: 'exposure to chemicals', vague: true }] },
    { id: 'outcome', name: 'Outcome', ask: 'which disease?', options: [
      { key: 'p', label: 'causes this liver tumour', record: 'Hospital diagnosis of the tumour' },
      { key: 'v', label: 'causes liver problems', vague: true }] },
    { id: 'dose', name: 'Dose-response', ask: 'how much?', options: [
      { key: 'p', label: 'at least 5 years, more years giving more risk', record: 'Years of tank cleaning' },
      { key: 'v', label: 'a lot of it', vague: true }] },
    { id: 'time', name: 'Time-response', ask: 'how long?', options: [
      { key: 'p', label: 'appearing 10 or more years after first exposure', record: 'Year cleaning began and date of diagnosis' },
      { key: 'v', label: 'eventually', vague: true }] },
  ];
  static STEPS = [
    { start: {}, live: false, ring: [], prompt: 'Write the claim before you collect anything' },
    { start: {}, live: true, ring: [], prompt: 'Choose a wording for the open part', promptDone: 'Every part can be measured' },
    { start: { population: 'p', cause: 'p', outcome: 'p', dose: 'p', time: 'p' }, live: true, ring: ['time'], open: 'cause',
      prompt: 'Try the vague wording for cause, then for time' },
  ];

  static CUES = ['pick-1', 'vague-cause', 'vague-time', 'precise'];

  applyCue(id) {
    const step = this.stepIndex ?? 0, hb = this._hb;
    if (!hb) return;
    const plan = step === 1 && id === 'pick-1' ? [['population', 'p']]
      : step === 2 && id === 'vague-cause' ? [['cause', 'v']]
        : step === 2 && id === 'vague-time' ? [['time', 'v']]
          : step === 2 && id === 'precise' ? [['cause', 'p'], ['time', 'p']] : null;
    if (!plan) return;
    this._cueMove = true;
    for (const [part, key] of plan) this.setPart(part, key);
    this._cueMove = false;
    const last = plan[plan.length - 1][0];
    if (step === 2) { hb.open = last; this._paint(); }
    this.cuePart(last);
  }

  cueBase() {
    const hb = this._hb;
    return hb ? { sel: { ...hb.sel }, open: hb.open, ring: [...hb.ring], touched: hb.touched } : null;
  }

  cueReset(base) {
    const hb = this._hb;
    if (!hb) return;
    if (base) { hb.sel = { ...base.sel }; hb.open = base.open; hb.ring = [...base.ring]; hb.touched = base.touched; hb.fresh = null; }
    hb.cue = null;
    this._paint();
  }

  onStep(step) {
    this._ncSent = false;
    super.onStep(step);
  }

  setPart(id, value) {
    super.setPart(id, value);
    if (this._ncSent || this._cueMove || (this.stepIndex ?? 0) !== 1) return;
    if (this.testState().onCount === this.constructor.PARTS.length) { this._ncSent = true; this.interactDone('b2'); }
  }

  /** Fixed template: "<population>, <dose lead><cause> <outcome>, <dose tail>, <time>". */
  static compose(sel) {
    const s = [seg(sel, 'population', { p: 'Among men who worked at the plant', v: 'Among people' }), { text: ',' }];
    if (sel.dose === 'p') s.push({ part: 'dose', text: 'at least 5 years of' });
    s.push(seg(sel, 'cause', { p: 'tank cleaning', v: 'exposure to chemicals' }));
    s.push(seg(sel, 'outcome', { p: 'causes this liver tumour', v: 'causes liver problems' }), { text: ',' });
    s.push(seg(sel, 'dose', { p: 'with more years giving more risk', v: 'from a lot of it' }), { text: ',' });
    s.push(seg(sel, 'time', { p: 'appearing 10 or more years after first exposure', v: 'eventually' }));
    return s;
  }
}
