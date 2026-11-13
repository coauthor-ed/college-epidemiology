/**
 * CohortTimelineScene - analytical-epidemiology L05 (blk-l05-s05). Where the study starts decides its name.
 * Three named cohort studies on dated axes (study chips switch them). Each axis carries the exposure as a
 * bracket and the outcomes as a band; the learner slides the "investigation starts" marker along the axis
 * (the kit dated axis, datedAxisHtml: its scrub handle sits on the base line under the marker). The name card
 * reads from where the marker sits relative to the outcome band:
 *   at or before the first outcome -> prospective cohort; inside the band (or anywhere after the start of
 *   an open-ended band) -> combination of retrospective and prospective; after the last outcome ->
 *   retrospective (historical) cohort.
 * The direction of inquiry, cause to effect, is pinned under every position.
 * Years per the stub: Boston babies born 1969-1975, outcomes to 1976, study 1978 (the textbook's 17,080);
 * Court-Brown and Doll: radiotherapy 1934-1954, assembled 1955 (the textbook's 13,352), outcomes open;
 * Doll's doctors: from 1951, outcomes open. Nothing computed beyond the label rule.
 * The marker and the name are the focal thing (signature colour); exposure and outcomes are neutral.
 * Built on the editorial panel parts (kit/SimPanel.js): chips, dated axis with scrub, prompt.
 */
import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withBeats } from 'simulations/base/DomBeats.js';
import { esc } from 'simulations/base/SimUi.js';
import { SIM_PANEL_CSS, chipsHtml, datedAxisHtml, setAxisScrub, promptHtml, bindPanel } from 'simulations/base/kit/SimPanel.js';
import { withNarrationCues } from '../L01/NarrationCues.js';
import { na, tagFirst } from '../L03/NarrTags.js';

const MAP = [0, 1, 2, 3].map((i) => [{ idx: i, dwellMs: null }]);

const NAME = {
  pros: { name: 'Prospective cohort', also: 'outcomes still ahead', why: 'Every outcome still lay ahead when the investigation started.' },
  comb: { name: 'Combination', also: 'retrospective, then prospective', why: 'Some outcomes were already on record; the rest were followed forward from the start.' },
  retro: { name: 'Retrospective cohort', also: 'also called historical', why: 'Every outcome had already happened; the records were read from cause to effect.' },
};

const TABS = {
  boston: {
    name: 'Boston babies', short: 'Boston', cap: 'Babies born at one hospital, 1969-1975 (the textbook: 17,080).',
    from: 1966, to: 1982, ticks: [1966, 1970, 1974, 1978, 1982],
    exposure: { from: 1969, to: 1975, label: 'Births, monitored or not' },
    outcome: { from: 1969, to: 1976, label: 'Neonatal deaths, to 1976' },
    rest: 1978,
  },
  court: {
    name: 'Court-Brown and Doll', short: 'Court-Brown', cap: 'Court-Brown and Doll: spine patients given radiotherapy (the textbook: 13,352).',
    from: 1930, to: 1975, ticks: [1930, 1945, 1960, 1975],
    exposure: { from: 1934, to: 1954, label: 'Radiotherapy, 1934-1954' },
    outcome: { from: 1934, to: null, label: 'Leukaemia and aplastic anaemia deaths' },
    rest: 1955,
  },
  dolls: {
    name: "Doll's doctors", short: "Doll's doctors", cap: 'British doctors from 1951; Framingham and the uranium miners ran the same way.',
    from: 1945, to: 1985, ticks: [1945, 1955, 1965, 1975, 1985],
    exposure: { from: 1951, to: 1951, label: 'Smoking recorded, 1951' },
    outcome: { from: 1951, to: null, label: 'Deaths, open-ended' },
    rest: 1951,
  },
};
const TAB_OF_BEAT = ['boston', 'boston', 'court', 'dolls'];
const PROMPT_OF_BEAT = [
  'Slide the start along the axis',
  'Slide the start to 1968, then back to 1978',
  'Slide the start before 1934, then back to 1955',
  'Try any start: can this study ever be retrospective?',
];

function kindAt(t, year) {
  const o = t.outcome;
  if (year <= o.from) return 'pros';
  if (o.to == null || year <= o.to) return 'comb';
  return 'retro';
}

const CSS = SIM_PANEL_CSS + `
.ct { gap: var(--sim-space-3); }
.ct .spn-axis__ticks { pointer-events: none; }
.ct-cap { margin: 0; font-size: var(--sim-text-sm); color: var(--sim-label-muted); }
.ct-name { display: flex; flex-direction: column; gap: 2px; border-top: 1px solid var(--sim-label); padding-top: var(--sim-space-3); }
.ct-name__n { margin: 0; display: flex; flex-wrap: wrap; align-items: baseline; gap: 0 var(--sim-space-3); font-family: var(--sim-font-numeral, var(--sim-font-display)); font-size: 34px; line-height: 1.15; color: var(--sim-annot); }
.ct-name__also { font-family: var(--sim-font); font-size: var(--sim-text-sm); color: var(--sim-label-muted); }
.ct-name__why { margin: 0; font-size: var(--sim-text-md); color: var(--sim-label); }
.ct-name.is-new .ct-name__n { animation: ct-in 0.25s ease-out both; }
@keyframes ct-in { from { opacity: 0; transform: translateY(4px); } }
.ct-dir { display: flex; align-items: center; gap: 10px; margin: 0; padding: 8px 12px; background: var(--sim-surface-raised); font-size: var(--sim-text-sm); font-weight: 700; color: var(--sim-label); }
.ct-dir svg { flex: none; }
.ct-dir svg line { stroke: var(--sim-label); stroke-width: 2; }
.ct-dir svg path { fill: var(--sim-label); }
.ct-dir span { font-weight: 400; color: var(--sim-label-muted); }
.sim-dom-root--portrait .ct-name__n { font-size: 30px; }
`;

const ARROW = '<svg width="44" height="12" viewBox="0 0 44 12" aria-hidden="true"><line x1="1" y1="6" x2="36" y2="6"/><path d="M34 1 L43 6 L34 11 Z"/></svg>';

export class CohortTimelineScene extends withNarrationCues(withBeats(DomSimulation)) {
  // Narration focus (spec W1 D29n): data-narr ids chips, cap, exposure / outcome (the two axis lanes), flag (the
  // investigation-starts marker), name, dir; the prompt line (repeats the narration) hidden while narrated.
  // Cues pros / retro (beat 2): the narration slides the Boston flag to 1968, then back to 1978, as it says so
  // (never counted as the learner's).
  static CUES = ['pros', 'retro'];
  static WIDTH = 480;
  static HEIGHT = 470;
  static PORTRAIT_WIDTH = 360;
  static PORTRAIT_HEIGHT = 600;
  static LAYOUT = 'fit';
  static SETTING = 'none';
  static BEAT_STEP_MAP = MAP;
  static CONTROLS = [];
  static ARIA_LABEL = 'Three cohort studies on dated axes: the Boston babies, Court-Brown and Doll, and Doll\'s doctors. Each axis shows the exposure years and the outcome years. A slider moves the year the investigation starts; the name of the design follows: before the outcomes, prospective; inside them, a combination of retrospective and prospective; after them, retrospective or historical. The direction of inquiry stays cause to effect at every position.';

  async setup() {
    this.tab = 'boston';
    this.year = TABS.boston.rest;
    this._kind = null;
    await super.setup();
    this.render({ css: CSS, rootClass: 'spn-page', html: '' });
    bindPanel(this.root, {
      action: (name, v) => { if (name === 'tab' && TABS[v]) { this.tab = v; this.year = TABS[v].rest; this.paint(); } },
      input: (name, v) => { if (name === 'start') this.onYear(v); },
    });
    this.paint();
  }

  onStep(step) {
    const t = TAB_OF_BEAT[step] ?? 'boston';
    if (t !== this.tab || step === 0) { this.tab = t; this.year = TABS[t].rest; }
    this.paint();
  }

  applyCue(id) {
    if (this.stepIndex !== 1 || this.tab !== 'boston') return;
    if (id === 'pros') this.setYear(1968);
    else if (id === 'retro') this.setYear(1978);
  }

  cueBase() { return null; }
  cueReset() { const t = TABS[TAB_OF_BEAT[this.stepIndex ?? 0] ?? 'boston']; this.tab = TAB_OF_BEAT[this.stepIndex ?? 0] ?? 'boston'; this.year = t.rest; this.paint(); }

  /** The flag to year y, as a drag would put it (marker, input, name). */
  setYear(y) {
    const t = TABS[this.tab];
    this.year = y;
    setAxisScrub(this.root, 'ct', y, { aria: this.aria(t, y) });
    if (kindAt(t, y) !== this._kind) this.paintName(true);
  }

  aria(t, y) { return `Investigation starts ${y}: ${NAME[kindAt(t, y)].name}`; }

  onYear(v) {
    const t = TABS[this.tab], y = Math.max(t.from, Math.min(t.to, Math.round(Number(v)) || t.rest));
    if (y === this.year) return;
    this.year = y;
    setAxisScrub(this.root, 'ct', y, { aria: this.aria(t, y) });
    if (kindAt(t, y) !== this._kind) this.paintName(true);
  }

  nameHtml(fresh) {
    const k = kindAt(TABS[this.tab], this.year), n = NAME[k];
    this._kind = k;
    return `<div class="ct-name${fresh ? ' is-new' : ''}"${na('name')} data-ct-name aria-live="polite"><p class="ct-name__n">${esc(n.name)} <span class="ct-name__also">${esc(n.also)}</span></p><p class="ct-name__why">${esc(n.why)}</p></div>`;
  }

  paintName(fresh) {
    const box = this.root.querySelector('[data-ct-name]');
    if (box) box.outerHTML = this.nameHtml(fresh);
  }

  axisHtml() {
    const t = TABS[this.tab], e = t.exposure, o = t.outcome;
    let lane = 0;
    const lanes = ['exposure', 'outcome'];
    return datedAxisHtml({
      key: 'ct', from: t.from, to: t.to, ticks: t.ticks,
      lanes: [
        { label: e.label, spans: [{ from: e.from, to: e.to, kind: 'bracket' }] },
        { label: o.label, spans: [{ from: o.from, to: o.to, kind: 'band' }] },
      ],
      scrub: { action: 'start', value: this.year, step: 1, label: 'Investigation starts', aria: this.aria(t, this.year) },
    }).replace(/<div class="spn-axis__lane">/g, (m) => `<div class="spn-axis__lane"${na(lanes[lane++])}>`)
      .replace('<span class="spn-axis__mark spn-axis__mark--scrub"', `<span class="spn-axis__mark spn-axis__mark--scrub"${na('flag')}`);
  }

  paint() {
    if (!this.root) return;
    const s = this.stepIndex ?? 0, t = TABS[this.tab];
    const chips = chipsHtml(Object.entries(TABS).map(([k, x]) => ({ label: x.short, action: 'tab', value: k, pressed: k === this.tab })), { label: 'Pick a study' });
    const dir = `<p class="ct-dir"${na('dir')}>Direction of inquiry ${ARROW} cause to effect <span>at every start</span></p>`;
    this.render({ html: `<div class="spn ct">${tagFirst(promptHtml(PROMPT_OF_BEAT[s] ?? PROMPT_OF_BEAT[0]), '-')}${tagFirst(chips, 'chips')}<p class="ct-cap"${na('cap')}>${esc(t.cap)}</p>${this.axisHtml()}${this.nameHtml(false)}${dir}</div>` });
  }

  testState() {
    return { beat: this.stepIndex, tab: this.tab, year: this.year, kind: kindAt(TABS[this.tab], this.year) };
  }
}
