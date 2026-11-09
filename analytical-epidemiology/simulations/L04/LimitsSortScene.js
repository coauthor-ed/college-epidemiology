/**
 * LimitsSortScene - analytical-epidemiology L04 (blk-l04-s08).
 * The method chapter's Table 13 turned into thirteen cards to file on the
 * earlier case files: seven strengths land on the DES file (cold case 2),
 * one limit on the recall question, one on the hospital door, four on the
 * live case's odds-ratio card (OR 13.2). Drag a card onto a file, or tap
 * the card then the file; a wrong drop slides back to the tray with one
 * line of direction. When all thirteen sit right, the files show their
 * counts and the ring lands on the "Cannot measure incidence" card.
 * No score anywhere (stub). Lite profile: no clock, no rAF of the scene's
 * own - the only motion is simPick's settle spring (drop and slide-back)
 * and the completion ring.
 */
import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withBeats } from 'simulations/base/DomBeats.js';
import { esc } from 'simulations/base/SimUi.js';
import { simPick } from 'simulations/base/kit/SimPick.js';
import { iconSvg } from 'simulations/base/kit/SimIcons.js';
import { annotateDom } from 'simulations/base/kit/SimAnnotate.js';
import { SIM_LOOK_DOM_CSS } from 'simulations/base/kit/SimLookDom.js';
import { mulberry32 } from 'simulations/base/kit/SimLook.js';

// [slide blk-l04-s08] 13 cards = 7 strengths + 6 limits; home = the file that showed it.
const CARDS = [
  ['s-rare', 'A rare disease, no years of waiting', 'des'],
  ['s-few', 'A handful of subjects', 'des'],
  ['s-fast', 'An answer within months', 'des'],
  ['s-cheap', 'Low cost', 'des'],
  ['s-multi', 'Several causes examined at once', 'des'],
  ['s-nofu', 'No follow-up to lose anyone', 'des'],
  ['s-ethics', 'Little done to participants', 'des'],
  ['l-memory', 'From memory or old records', 'recall'],
  ['l-compare', 'Comparison group hard to choose', 'door'],
  ['o-inc', 'Cannot measure incidence', 'odds'],
  ['o-conf', 'Cannot separate cause from its companions', 'odds'],
  ['o-tx', 'Not the design for evaluating treatment', 'odds'],
  ['o-rep', 'Who it stands for is uncertain', 'odds'],
].map(([id, text, home]) => ({ id, text, home }));
const BY_ID = Object.fromEntries(CARDS.map((c) => [c.id, c]));

// [stub] the four pinned case files from the earlier lessons, with their fill caps.
const FILES = [
  ['des', 'The DES file', 'cold case 2, a rare disease', 7],
  ['recall', 'The recall question', 'how the exposure is known', 1],
  ['door', 'The hospital door', 'who the comparison is', 1],
  ['odds', 'Your odds-ratio card', 'the live case, OR 13.2', 4],
];
const CAPS = { des: 7, recall: 1, door: 1, odds: 4 };
const FILE_NAME = { des: 'the DES file', recall: 'the recall question', door: 'the hospital door', odds: 'the odds-ratio card' };
const HINTS = ['Thirteen cards, four files.', 'Wrong drops slide back.', 'Seven strengths, six limits.'];
const WRONG_LINE = 'That file never showed this - try another.';

const tileHtml = (id) => `<div class="lss__card" data-item="${id}">${esc(BY_ID[id].text)}</div>`;
const chipHtml = (c) => `<div class="lss__chip" data-item="${c.id}">${iconSvg('check', 'var(--sim-good)')}<span>${esc(c.text)}</span></div>`;

const HTML = `<div class="lss">
  <div class="lss__head">
    <span class="sl-kicker">THE METHOD CHAPTER &middot; TABLE 13</span>
    <span class="lss__tray-n" data-tray-n>13 to place</span>
  </div>
  <p class="lss__how">Drag a card onto a file, or tap the card and then the file.</p>
  <p class="lss__hint" data-hint>${esc(HINTS[0])}</p>
  <div class="lss__tray" data-tray></div>
  <p class="lss__msg" data-msg data-kind="" aria-live="polite"></p>
  <div class="lss__files">${FILES.map(([id, name, sub, cap]) => `
    <div class="sim-card sim-card--dashed lss__file" data-target="${id}" data-file="${id}">
      <div class="lss__fhead"><div class="lss__fname">${esc(name)}</div><div class="lss__n"><span data-count="${id}">0/${cap}</span></div></div>
      <div class="lss__fsub">${esc(sub)}</div>
      <div class="lss__chips" data-chips="${id}"></div>
    </div>`).join('')}</div>
</div>`;

const CSS = SIM_LOOK_DOM_CSS + `
.lss { position: relative; display: flex; flex-direction: column; gap: var(--sim-space-1); padding: 0 var(--sim-space-1) var(--sim-space-2); }
.lss__head { display: flex; align-items: baseline; justify-content: space-between; gap: var(--sim-space-3); padding-top: calc(var(--sim-space-3) + 6px); }
.lss__tray-n { font: 700 var(--sim-text-sm)/1 var(--sim-font-mono, monospace); color: var(--sim-accent); white-space: nowrap; }
.lss__how, .lss__hint { margin: 0; font: 500 var(--sim-text-sm)/1.25 var(--sim-font); color: var(--sim-label); }
.lss__head + .lss__how { margin-top: var(--sim-space-1); }
.lss__how + .lss__hint { margin-top: var(--sim-space-0); }
.lss__tray { display: flex; flex-wrap: wrap; gap: var(--sim-space-2); align-content: start; min-height: 0; padding-bottom: var(--sim-space-1); }
.lss__card { flex: 1 1 160px; min-width: 0; background: var(--sim-bg-cell); border: 2px solid var(--sim-stroke); border-radius: var(--sim-radius-md); padding: var(--sim-space-1); font: 600 var(--sim-text-sm)/1.25 var(--sim-font); color: var(--sim-label); box-shadow: var(--sim-lift); overflow-wrap: break-word; }
.lss__msg { min-height: 0; margin: 0; font: 600 var(--sim-text-sm)/1.2 var(--sim-font); color: var(--sim-error); }
.lss__msg:empty { min-height: 0; }
.lss__msg[data-kind="ok"] { color: var(--sim-good); }
.lss__files { display: flex; flex-wrap: wrap; gap: var(--sim-space-1); align-items: flex-start; }
.lss__file { flex: 1 1 240px; min-width: 0; display: flex; flex-direction: column; gap: 0; min-height: 0; padding: 2px var(--sim-space-1); }
.lss__file.sim-pick--over { border-color: var(--sim-accent); border-style: solid; }
.lss__fhead { display: flex; align-items: baseline; justify-content: space-between; gap: var(--sim-space-1); }
.lss__fname { font: 700 var(--sim-text-md)/1.1 var(--sim-font); overflow-wrap: break-word; }
.lss__fsub { font: 500 var(--sim-text-sm)/1.1 var(--sim-font-mono, monospace); color: var(--sim-label-muted); margin-bottom: 5px; }
.lss__n { font: 700 var(--sim-text-md)/1 var(--sim-font-mono, monospace); color: var(--sim-accent); white-space: nowrap; }
.lss__chips { display: flex; flex-direction: column; gap: 0; margin-top: 6px; }
.lss__file[data-file="des"] .lss__chips, .lss__file[data-file="odds"] .lss__chips { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 2px; }
.lss__file[data-file="recall"] .lss__chips, .lss__file[data-file="door"] .lss__chips { display: grid; grid-template-columns: minmax(0, 1fr); }
.lss__chip { min-width: 0; background: var(--sim-bg-cell); border: 2px solid var(--sim-stroke); border-left: 4px solid var(--sim-good); border-radius: var(--sim-radius-sm); padding: 0 5px; font: 600 var(--sim-text-sm)/1.2 var(--sim-font); display: flex; align-items: flex-start; gap: var(--sim-space-1); } .lss__chip > span { min-width: 0; overflow-wrap: break-word; }
.lss__chip .sim-icon { width: 12px; height: 12px; flex: none; margin-top: 0; }
.sim-dom-root--portrait .lss__file { flex-basis: 100%; }
.sim-dom-root--portrait .lss { gap: var(--sim-space-1); }
`;

export class LimitsSortScene extends withBeats(DomSimulation) {
  static WIDTH = 700;
  static HEIGHT = 540;
  static PORTRAIT_WIDTH = 380;
  static PORTRAIT_HEIGHT = 1400;
  static MIN_SCALE = 1.2;
  static SETTING = 'casefile';
  static BEAT_STEP_MAP = [
    [{ idx: 0, dwellMs: null }], // the desk, nothing sorted
    [{ idx: 1, dwellMs: null }], // the learner sorts; wrong drops slide back
    [{ idx: 2, dwellMs: null }], // the balance: counts and the incidence ring
  ];
  static NOTES = [
    'Table 13 on the desk, turned into cards. The DES file and the odds-ratio card are the earlier files.',
    'A wrong drop slides back to the tray; the tray count falls only on a correct drop.',
    'Seven strengths made the method the first tool for rare diseases; six limits ride on the files.',
  ];
  static ARIA_LABEL =
    "Thirteen cards carrying the case-control study's strengths and limits above four case files: the DES file, " +
    'the recall question, the hospital door and the odds-ratio card. Drag a card onto a file, or tap the card ' +
    'then the file; a wrong drop slides back to the tray.';
  static CONTROLS = [];

  async setup() {
    // Seeded shuffle (look-base: deterministic). Everything paint()/render() read is
    // set before super.setup().
    const rnd = mulberry32(7);
    this.order = CARDS.map((c) => c.id);
    for (let i = this.order.length - 1; i > 0; i--) {
      const j = Math.floor(rnd() * (i + 1));
      [this.order[i], this.order[j]] = [this.order[j], this.order[i]];
    }
    this.where = {}; // card id -> file id; wrong drops never enter (they slide back)
    this._rang = false;
    await super.setup();
    this.render({ css: CSS, html: HTML });
    this._trayN = this.root.querySelector('[data-tray-n]');
    this._hint = this.root.querySelector('[data-hint]');
    this._msg = this.root.querySelector('[data-msg]');
    this._notes = annotateDom(this.root, { scene: this });
    this.pick = simPick(this.root, {
      items: '[data-item]',
      targets: '[data-target]',
      track: true,
      settle: 'spring', // recipe b1: dropped cards glide; a wrong drop glides home
      countText: (n, id) => `${n}/${CAPS[id]}`,
      announce: () => {}, // one announcement channel: the scene's own line
      onDrop: (id, file) => this._drop(id, file),
    });
    this.paint();
    this.onStep(this.stepIndex);
  }

  _drop(id, file) {
    if (BY_ID[id].home !== file) {
      // simPick recorded the drop and repainted counts before onDrop; undo both.
      this.pick.unplace(id);
      delete this.where[id]; // a refiled card that lands wrong goes back to the tray
      this._msg.dataset.kind = 'no';
      this._msg.textContent = WRONG_LINE;
      this.paint(); // the card re-renders in the tray; the spring glides it home
      return;
    }
    this.where[id] = file;
    this._msg.dataset.kind = 'ok';
    this._msg.textContent = `Filed on ${FILE_NAME[file]}.`;
    this.paint();
  }

  paint() {
    const tray = this.root.querySelector('[data-tray]');
    if (tray) tray.innerHTML = this.order.filter((id) => !this.where[id]).map(tileHtml).join('');
    for (const [id] of FILES) {
      const chips = this.root.querySelector(`[data-chips="${id}"]`);
      if (chips) chips.innerHTML = CARDS.filter((c) => this.where[c.id] === id).map(chipHtml).join('');
    }
    const left = CARDS.length - Object.keys(this.where).length;
    if (this._trayN) this._trayN.textContent = left ? `${left} to place` : 'tray empty';
    if (left === 0) {
      if (this._msg) {
        this._msg.dataset.kind = 'ok';
        this._msg.textContent = 'All thirteen filed.'; // the balance, never a score
      }
      this._notes.clear();
      const inc = this.root.querySelector('[data-item="o-inc"]');
      if (inc) {
        this._notes.ring(inc); // recipe b2: the one limit no case-control file escapes
        this._rang = true;
      }
    } else if (this._rang) {
      this._notes.clear();
      this._rang = false;
    }
    this.pick?.refresh();
  }

  // withBeats clamps the beat, sets stepIndex and dataset.step, then calls onStep.
  onStep(step) {
    if (this._hint) this._hint.textContent = HINTS[step] ?? HINTS[0];
  }

  testState() {
    const counts = { des: 0, recall: 0, door: 0, odds: 0 };
    for (const f of Object.values(this.where)) counts[f] += 1;
    const left = CARDS.length - Object.keys(this.where).length;
    return { step: this.stepIndex, tray: left, counts, done: left === 0 && this._rang, hi: this._rang ? 'o-inc' : null };
  }

  destroy() {
    this.pick?.destroy?.();
    this._notes?.destroy?.();
    super.destroy();
  }
}
