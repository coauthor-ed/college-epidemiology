import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withBeats } from 'simulations/base/DomBeats.js';
import { esc } from 'simulations/base/SimUi.js';
import { SIM_PANEL_CSS, sentenceHtml, pullQuoteHtml, editHtml, promptHtml, bindPanel } from 'simulations/base/kit/SimPanel.js';
import { withNarrationCues } from '../L01/NarrationCues.js';
import { na, tagFirst } from './NarrTags.js';
import { narrOn } from '../L05/NarrDots.js';

/**
 * SlipSpotterScene - blk-l03-s06 (analytical-epidemiology L03).
 * The textbook's sentence (paraphrased) as word chips under a prompt: "Tap the word you would change".
 * A tap on any other word names what it is (no verdict words, no penalty). A tap on "risk" strikes it,
 * and the corrected sentence lands as a pull quote: "a risk" struck, "an odds ratio" inserted in the
 * signature colour, the number 8.1 kept. Two short sentences under it say why (beats 0-1: what 8.1
 * divides and why no risk can be read; beat 2: why it is still a fair estimate). 8.1 is the only number.
 * Built on the editorial panel parts (kit/SimPanel.js): promptHtml, sentenceHtml, pullQuoteHtml, editHtml.
 */
const WORDS = [
  { w: 'The' },
  { w: 'textbook' },
  { w: 'reports' },
  { w: 'that' },
  { w: 'smokers', tag: 'names the exposure' },
  { w: 'had' },
  { w: 'a' },
  { w: 'risk', risk: true, fix: '' },
  { w: 'of' },
  { w: 'lung cancer', tag: 'names the outcome' },
  { w: '8.1', tag: 'is the number, and it is right' },
  { w: 'times' },
  { w: 'that' },
  { w: 'of' },
  { w: 'non-smokers', tag: 'names the comparison group' },
];
const RISK_IDX = WORDS.findIndex((x) => x.risk);
const NUM_IDX = WORDS.findIndex((x) => x.w === '8.1');
// The sentence group, with its risk and 8.1 chips tagged inside (a lit part inside its group).
const tagSentence = (html) => tagFirst(html, 'sentence')
  .replace(`data-sflow-value="${RISK_IDX}"`, `data-sflow-value="${RISK_IDX}"${na('risk')}`)
  .replace(`data-sflow-value="${NUM_IDX}"`, `data-sflow-value="${NUM_IDX}"${na('num')}`);
const FILLER_TAG = 'is a linking word';

const CORRECTED = `The textbook should report that smokers had ${editHtml('a risk', 'an odds ratio')} of 8.1 for lung cancer, compared with non-smokers.`;
const WHY = [
  '8.1 is the odds of smoking among the cases divided by the odds among the controls.',
  'Nobody counted who fell ill, so the table holds no risk to compare.',
];
const WHY_RARE = [
  '8.1 is the odds of smoking among the cases divided by the odds among the controls.',
  'Lung cancer was rare in these men, so 8.1 is still a fair estimate of the relative risk.',
];

const BEAT_STEP_MAP = [
  [{ idx: 0, dwellMs: null }], // sentence + prompt; taps live
  [{ idx: 1, dwellMs: null }], // same; a tap names the word, "risk" brings the correction
  [{ idx: 2, dwellMs: null }], // the correction is on screen; the why line turns to the rare disease
];

const CSS = SIM_PANEL_CSS + `
.slp { gap: var(--sim-space-4); }
.slp-head { display: flex; flex-direction: column; gap: var(--sim-space-2); }
.slp-tag { margin: 0; min-height: 1.5em; font-size: var(--sim-text-md); color: var(--sim-label-muted); }
.slp-tag b { color: var(--sim-label); font-weight: 700; }
.slp-fix { display: flex; flex-direction: column; gap: var(--sim-space-3); padding-top: var(--sim-space-3); border-top: 1px solid var(--sim-label); animation: slp-in 0.24s ease-out both; }
.slp-why { margin: 0; font-size: var(--sim-text-md); line-height: 1.5; color: var(--sim-label); }
@keyframes slp-in { from { opacity: 0; transform: translateY(6px); } }
@media (prefers-reduced-motion: reduce) { .slp-fix { animation: none; } }
/* Narrated: a why sentence is inline text that wraps, so a lit one is marked like a highlighter (tint behind
   each line), not outlined (an outline breaks into pieces round a wrapped span). Narration off: no match. */
#sim-canvas-host[data-narr-focus] .slp-why > [data-narr] { outline: none !important; }
[data-narr-on~="why1"] .slp-why > [data-narr~="why1"], [data-narr-on~="why2"] .slp-why > [data-narr~="why2"] {
  background: var(--sim-annot-tint); box-shadow: 0 0 0 3px var(--sim-annot-tint); -webkit-box-decoration-break: clone; box-decoration-break: clone; }
`;

export class SlipSpotterScene extends withNarrationCues(withBeats(DomSimulation)) {
  static WIDTH = 720;
  static HEIGHT = 440;
  static PORTRAIT_WIDTH = 360;
  static PORTRAIT_HEIGHT = 640;
  static LAYOUT = 'fit';
  static SETTING = 'none';
  static BEAT_STEP_MAP = BEAT_STEP_MAP;
  static ARIA_LABEL = 'The textbook sentence, paraphrased, as word chips: smokers had a risk of lung cancer 8.1 times that of non-smokers. Tapping a word names what it is; tapping risk strikes it and shows the corrected sentence, smokers had an odds ratio of 8.1 for lung cancer, compared with non-smokers.';
  static CONTROLS = [];
  // Narration focus (spec W1 D29n): data-narr ids sentence (with risk and num chips inside), quote, why1, why2;
  // the prompt line (repeats the narration) hidden while narrated. show.quote opens the correction at its word
  // when the learner skipped the tap (a cue move, never counted as the learner's).
  static CUES = ['show.quote'];

  async setup() {
    this._step = 0;
    this._picked = null;
    this._open = false;
    this._fresh = false;
    await super.setup();
    this.render({ css: CSS, rootClass: 'spn-page', html: '' });
    bindPanel(this.root, { action: (name, v) => { if (name === 'word') this._pick(Number(v)); } });
    this._sync();
  }

  /** Narration focus contract (content-block): the lit ids go on the root (NarrDots.narrOn), for the why highlight. */
  narrationFocus(f) { narrOn(this, f); }

  // withBeats clamps the beat, sets this.stepIndex and root.dataset.step, then calls onStep(step, beat, count).
  onStep(step) {
    this._step = step;
    if (step === 0) { this._picked = null; this._open = false; }
    if (step === 2 && !this._open) { this._picked = RISK_IDX; this._open = true; this._fresh = true; }
    this._sync();
  }

  applyCue(id) {
    if (id === 'show.quote' && this._step >= 1 && !this._open) { this._picked = RISK_IDX; this._open = true; this._fresh = false; this._sync(); }
  }

  cueBase() { return { picked: this._picked, open: this._open }; }
  cueReset(b) { if (b) { this._picked = b.picked; this._open = b.open; } this._fresh = false; this._sync(); }

  _pick(i) {
    const x = WORDS[i];
    if (!x) return;
    this._picked = i;
    if (x.risk && !this._open) { this._open = true; this._fresh = true; }
    this._sync();
  }

  _sync() {
    if (!this.root) return;
    const x = this._picked == null ? null : WORDS[this._picked];
    const onRisk = !!x?.risk;
    const prompt = this._open && onRisk
      ? promptHtml('"risk" is the word to change', { done: true })
      : promptHtml('Tap the word you would change');
    const tag = x && !onRisk ? `<b>"${esc(x.w)}"</b> ${esc(x.tag ?? FILLER_TAG)}. Try another word.` : '';
    const sentence = tagSentence(sentenceHtml({ words: WORDS, picked: this._picked, showFix: true, end: '.', label: "The textbook's sentence, paraphrased" }));
    const why = this._step === 2 ? WHY_RARE : WHY;
    const fix = this._open
      ? `<div class="slp-fix"${this._fresh ? '' : ' style="animation:none"'}>${tagFirst(pullQuoteHtml(CORRECTED, { label: 'The sentence, corrected' }), 'quote')}<p class="slp-why"><span${na('why1')}>${esc(why[0])}</span> <span${na('why2')}>${esc(why[1])}</span></p></div>`
      : '';
    this._fresh = false;
    this.render({ html: `<div class="spn slp"><div class="slp-head"><p class="spn-label"${na('sentence')}>The textbook's sentence, paraphrased</p>${tagFirst(prompt, '-')}</div>`
      + `${sentence}<p class="slp-tag" aria-live="polite">${tag}</p>${fix}</div>` });
  }

  testState() {
    return { step: this._step, picked: this._picked, open: this._open };
  }
}
