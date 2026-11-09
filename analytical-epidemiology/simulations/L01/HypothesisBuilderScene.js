import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withBeats } from 'simulations/base/DomBeats.js';
import { withHypothesisBoard } from './HypothesisBoard.js';
import { withNarrationCues } from './NarrationCues.js';

/**
 * HypothesisBuilderScene - L01 s04 (rebuilt 2026-11-05 on the editorial panel parts). The claim
 * "Cigarette smoking causes lung cancer" with two of its five parts in. Each part is a chip beside the data
 * it calls for; adding a part puts its words into the claim and its data line beside it. Taking a part back
 * out strikes its data line: no longer measured. Textbook smoking example (p.78).
 * Narrated (spec W1 D15): cues claim-1..claim-5 light the parts in PARTS order as the teacher names them
 * (population, cause, outcome, dose-response, time-response); replay and scrub re-derive the lit part from
 * the beat time (NarrationCues.js). Beat 2 sends scene-interact-done once all five parts are in; beat 3 once
 * a part has been taken back out.
 */
export class HypothesisBuilderScene extends withNarrationCues(withHypothesisBoard(withBeats(DomSimulation))) {
  static WIDTH = 580;
  static HEIGHT = 500;
  static PORTRAIT_WIDTH = 360;
  static PORTRAIT_HEIGHT = 760;
  static ARIA_LABEL = 'The claim that cigarette smoking causes lung cancer, with five parts (population, cause, outcome, dose-response, time-response). Each part is a chip beside the data it calls for. Adding a part adds its words to the claim and its data line; taking it out strikes the data line, no longer measured.';
  static CONTROLS = [];
  static BEAT_STEP_MAP = [
    [{ idx: 0, dwellMs: null }], // bare claim, locked
    [{ idx: 1, dwellMs: null }], // add the other three
    [{ idx: 2, dwellMs: null }], // all five in, take one back out
  ];

  static MODE = 'toggle';
  static CASE = { kicker: 'Working claim: smoking', count: 'parts in the claim' };
  static PARTS = [
    { id: 'population', name: 'Population', ask: 'who?', field: 'smokers', record: 'Who counts as a smoker' },
    { id: 'cause', name: 'Cause', ask: 'exposed to what?', field: 'cigarette smoking', record: 'Whether each person smokes cigarettes' },
    { id: 'outcome', name: 'Outcome', ask: 'which disease?', field: 'lung cancer', record: 'Whether each person has lung cancer' },
    { id: 'dose', name: 'Dose-response', ask: 'how much?', field: '30-40 a day; 10 per cent', record: 'Cigarettes smoked per day, and how many fall ill' },
    { id: 'time', name: 'Time-response', ask: 'how long?', field: 'after 20 years', record: 'Years of smoking' },
  ];
  static STEPS = [
    { start: { cause: true, outcome: true }, live: false, ring: [], prompt: 'The bare claim names two of the five parts' },
    { start: { cause: true, outcome: true }, live: true, ring: [], prompt: 'Tap a missing part to add it', promptDone: 'All five parts are in the claim' },
    { start: { population: true, cause: true, outcome: true, dose: true, time: true }, live: true, ring: ['time'], prompt: 'Tap a part to take it back out' },
  ];

  static CUES = ['claim-1', 'claim-2', 'claim-3', 'claim-4', 'claim-5'];

  applyCue(id) {
    const part = this.constructor.PARTS[Number(String(id).slice(6)) - 1];
    if (part) this.cuePart(part.id);
  }

  cueReset() { this.cuePart(null); }

  onStep(step) {
    this._ncSent = false;
    super.onStep(step);
  }

  setPart(id, value) {
    super.setPart(id, value);
    const step = this.stepIndex ?? 0, t = this.testState();
    if (this._ncSent) return;
    if ((step === 1 && t.onCount === this.constructor.PARTS.length) || (step === 2 && t.gone.length > 0)) {
      this._ncSent = true;
      this.interactDone(`b${step + 1}`);
    }
  }

  /** The stub's fixed template. A missing cause or outcome leaves a gap; the other parts leave nothing. */
  static compose(on) {
    const s = [];
    if (on.dose) s.push(on.cause ? { part: 'cause', text: 'Smoking' } : { gap: 'cause' }, { part: 'dose', text: '30-40 cigarettes a day' });
    else s.push(on.cause ? { part: 'cause', text: 'Cigarette smoking' } : { gap: 'cause' });
    s.push({ text: 'causes' });
    s.push(on.outcome ? { part: 'outcome', text: 'lung cancer' } : { gap: 'outcome' });
    if (on.population && on.dose) s.push({ part: 'dose', text: 'in 10 per cent' }, { part: 'population', text: 'of smokers' });
    else if (on.population) s.push({ part: 'population', text: 'in smokers' });
    else if (on.dose) s.push({ part: 'dose', text: 'in 10 per cent' });
    if (on.time) s.push({ part: 'time', text: 'after 20 years' });
    return s;
  }
}
