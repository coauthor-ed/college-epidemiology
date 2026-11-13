/**
 * ChanceOrRealScene - analytical-epidemiology L03 s04. A shuffle test the learner can see, on the
 * illustrative small study of the slide before (two controls per case): 20 cases, 14 smoked; 40
 * controls, 16 smoked; 60 people, 30 smokers.
 *   Step 1, the real study (beat 0): 60 dots in two labelled groups, cases (signature colour) and
 *     controls (grey); a filled dot smoked, a hollow one did not. Under them, the sum row:
 *     14 of 20 = 70%, 16 of 40 = 40%, gap 70 - 40 = 30 points. A number line below carries the
 *     real gap as a red rule at +30.
 *   Step 2, one shuffle (beat 1): the same 60 people are dealt at random into a group of 20 and a
 *     group of 40; each dot flies to its new group and takes that group's colour, and its fill (its
 *     smoking) goes with it. The shuffled sum row sits under the real one, worked the same way, and
 *     the shuffled gap drops as one dot onto the number line. Cue 'shuf' (narration) deals once.
 *   Step 3, many shuffles (beat 2 start): the scene shows the first 100 shuffles of its fixed deck
 *     (seed 55): a dot plot piling near 0, and exactly 3 dots on the red rule (gap 30), none beyond.
 *   Step 4: the count "3 of 100 shuffles gave a gap of 30 points or more" and its share, 0.03, the
 *     P value (exact one-sided value for this table: 0.027).
 * The deck is seeded, so shuffle n is always the same deal: the 100th shuffle always lands on 3.
 * Gap for x smokers dealt to the cases: x / 20 - (30 - x) / 40 = 7.5x - 75 points, so the dots sit
 * on a 7.5-point grid.
 * Narration focus (spec W1 D29n): data-narr ids people (the dot board), cases, controls, real (real
 * sum row), shuf (shuffled sum row), plot (number line, line inside it), line, count, pvalue,
 * buttons. Cue 'shuf' deals one shuffle in beat 1 (withNarrationCues: seekable; a scrub back to
 * before it restores the real study). Completion: none sent; the beat-1 wait is an exploration
 * (Done / Skip). Buttons: Shuffle once, Shuffle to 100 (then: 100 more), Reset.
 */
import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withBeats } from 'simulations/base/DomBeats.js';
import { withNarrationCues } from '../L01/NarrationCues.js';
import { SIM_PANEL_CSS, buttonsHtml, bindPanel } from 'simulations/base/kit/SimPanel.js';
import { mulberry32 } from 'simulations/base/kit/SimLook.js';
import { na } from './NarrTags.js';

const MAP = [0, 1, 2, 3].map((i) => [{ idx: i, dwellMs: null }]);
const SEED = 55;            // node: first deal x = 11 (gap 7.5); first 100 deals: 3 at x = 14 (gap 30), none above
const N = 60, N_CASES = 20, N_CTRL = 40, N_SMOKERS = 30;
const REAL_X = 14;          // smokers among the real cases
const REAL_GAP = 30;
const LO = -45, HI = 45;    // number line, points
const EXP = Array.from({ length: N }, (_, i) => (i < N_CASES ? i < REAL_X : i - N_CASES < N_SMOKERS - REAL_X));
const gapOf = (x) => 7.5 * x - 75;
const AT = (g) => ((Math.max(LO, Math.min(HI, g)) - LO) / (HI - LO)) * 100;
const pct = (v) => (Number.isInteger(v) ? `${v}%` : `${v.toFixed(1)}%`);
const pts = (g) => `${g < 0 ? '-' : ''}${Number.isInteger(Math.abs(g)) ? Math.abs(g) : Math.abs(g).toFixed(1)} pts`;

const CSS = SIM_PANEL_CSS + `
.cor { gap: var(--sim-space-2); --cor-p: 26px; --cor-dot: 17px; --cor-pad: 8px; --cor-gap: 16px; --cor-lab: 24px; }
.sim-dom-root--portrait .cor { --cor-p: 22px; --cor-dot: 15px; --cor-pad: 6px; --cor-gap: 12px; }
.cor-board { position: relative; margin: 0 auto; width: calc(13 * var(--cor-p) + 4 * var(--cor-pad) + var(--cor-gap)); height: calc(var(--cor-lab) + 5 * var(--cor-p) + 2 * var(--cor-pad)); }
.cor-grp { position: absolute; top: 0; height: 100%; box-sizing: border-box; border: 1.5px solid var(--cor-c); border-radius: 6px; transition: border-color 0.3s; }
.cor-grp--0 { left: 0; width: calc(5 * var(--cor-p) + 2 * var(--cor-pad)); --cor-c: var(--sim-annot); }
.cor-grp--1 { left: calc(5 * var(--cor-p) + 2 * var(--cor-pad) + var(--cor-gap)); width: calc(8 * var(--cor-p) + 2 * var(--cor-pad)); --cor-c: var(--sim-label-muted); }
.cor-grp b { display: block; height: var(--cor-lab); line-height: var(--cor-lab); padding: 0 var(--cor-pad); font: 700 14px/var(--cor-lab) var(--sim-font); color: var(--cor-c); white-space: nowrap; }
.cor-grp--1 b { color: var(--sim-label); }
.cor-p { position: absolute; width: var(--cor-dot); height: var(--cor-dot); box-sizing: border-box; border-radius: 50%; border: 2.5px solid var(--cor-c); background: var(--sim-bg-surface, transparent);
  left: calc(var(--g) * (5 * var(--cor-p) + 2 * var(--cor-pad) + var(--cor-gap)) + var(--cor-pad) + var(--c) * var(--cor-p) + (var(--cor-p) - var(--cor-dot)) / 2);
  top: calc(var(--cor-lab) + var(--cor-pad) + var(--r) * var(--cor-p) + (var(--cor-p) - var(--cor-dot)) / 2);
  transition: left 0.7s cubic-bezier(.5,0,.3,1) var(--d, 0s), top 0.7s cubic-bezier(.5,0,.3,1) var(--d, 0s), border-color 0.25s ease calc(var(--d, 0s) + 0.55s), background-color 0.25s ease calc(var(--d, 0s) + 0.55s); }
.cor-p[data-g="0"] { --cor-c: var(--sim-annot); }
.cor-p[data-g="1"] { --cor-c: var(--sim-label-muted); }
.cor-p.is-x { background: var(--cor-c); }
.cor-key { display: flex; gap: var(--sim-space-3); justify-content: center; margin: 0; font: 500 14px/1.2 var(--sim-font); color: var(--sim-label-muted); }
.cor-key i { display: inline-block; width: 11px; height: 11px; border-radius: 50%; border: 2px solid var(--sim-label); margin-right: 5px; vertical-align: -1px; box-sizing: border-box; }
.cor-key i.f { background: var(--sim-label); }
.cor-sums { width: 100%; border-collapse: collapse; font: 500 14px/1.2 var(--sim-font); color: var(--sim-label); font-variant-numeric: tabular-nums; }
.cor-sums th, .cor-sums td { padding: 3px 4px; text-align: right; white-space: nowrap; }
.cor-sums thead th:first-child { text-align: left; }
.cor-sums thead th { font-size: 14px; font-weight: 600; color: var(--sim-label-muted); border-bottom: 1px solid var(--sim-label); }
.cor-sums tbody th { text-align: left; font-weight: 600; }
.cor-sums td small { color: var(--sim-label-muted); font-size: 14px; margin-right: 6px; }
.cor-sums td b { font-weight: 700; }
.cor-sums .op { color: var(--sim-label-muted); padding: 0 1px; text-align: center; }
.cor-sums tr.real td.g b { color: var(--sim-bad); }
.cor-sums tr.shuf td { color: var(--sim-label); }
.cor-sums tr.shuf.is-empty td { color: var(--sim-label-muted); }
.cor-sums tr.shuf.is-new td { animation: cor-in 0.5s ease 0.75s both; }
@keyframes cor-in { from { background: var(--sim-annot-tint); } to { background: transparent; } }
.sim-dom-root--portrait .cor-sums { font-size: 14px; }
.sim-dom-root--portrait .cor-sums th, .sim-dom-root--portrait .cor-sums td { padding: 2px 2px; }
.sim-dom-root--portrait .cor-sums tbody th { white-space: normal; width: 4.2em; }
.sim-dom-root--portrait .cor-sums td small { display: block; margin: 0; font-size: 13px; }
.cor-plot { position: relative; height: 165px; margin: 0 6px; border-bottom: 1.5px solid var(--sim-label); }
.sim-dom-root--portrait .cor-plot { height: 175px; }
.cor-col { position: absolute; bottom: 0; transform: translateX(-50%); width: var(--cor-s); background-image: radial-gradient(circle at 50% 50%, var(--cor-dc) 0 45%, transparent 49%); background-size: var(--cor-s) var(--cor-s); background-repeat: repeat; background-position: left bottom; transition: height 0.25s ease; --cor-dc: var(--sim-label-muted); }
.cor-col.is-hit { --cor-dc: var(--sim-bad); }
.cor-drop { position: absolute; width: var(--cor-s); height: var(--cor-s); border-radius: 50%; transform: translateX(-50%); background: var(--sim-annot); animation: cor-fall 0.45s ease-in both; animation-delay: 0.8s; }
@keyframes cor-fall { from { top: -10px; opacity: 1; } to { top: var(--cor-to); opacity: 1; } }
.cor-line { position: absolute; top: -6px; bottom: -6px; width: 0; border-left: 2.5px solid var(--sim-bad); }
.cor-line span { position: absolute; top: -4px; right: 6px; font: 700 14px/1.1 var(--sim-font); color: var(--sim-bad); white-space: nowrap; }
.cor-ticks { position: relative; height: 16px; margin: 2px 6px 0; font: 500 14px/1 var(--sim-font); color: var(--sim-label-muted); }
.cor-ticks span { position: absolute; transform: translateX(-50%); }
.cor-ax { margin: 0; text-align: center; font: 500 14px/1.2 var(--sim-font); color: var(--sim-label-muted); }
.cor-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: var(--sim-space-3); align-items: center; border-top: 1px solid var(--sim-label); padding-top: var(--sim-space-2); }
.sim-dom-root--portrait .cor-row { grid-template-columns: minmax(0, 1fr); }
.sim-dom-root--portrait .cor-count b { font-size: 19px; }
.sim-dom-root--portrait .cor-pv { font-size: 14px; }
.sim-dom-root--portrait .cor-sums th, .sim-dom-root--portrait .cor-sums td { padding: 2px 1px; }
.cor-count { margin: 0; font: 500 15px/1.3 var(--sim-font); color: var(--sim-label); }
.cor-count b { font-size: 22px; color: var(--sim-bad); font-variant-numeric: tabular-nums; }
.cor-pv { margin: 0; padding: var(--sim-space-2) var(--sim-space-3); border-left: 3px solid var(--sim-annot); background: var(--sim-annot-tint); font: 500 15px/1.3 var(--sim-font); color: var(--sim-label); }
.cor-pv b { font-weight: 700; }
.cor-off { visibility: hidden; }
@media (prefers-reduced-motion: reduce) { .cor-p, .cor-col { transition: none; } .cor-drop { animation: none; display: none; } .cor-sums tr.shuf.is-new td { animation: none; } }
`;

export class ChanceOrRealScene extends withNarrationCues(withBeats(DomSimulation)) {
  static WIDTH = 560;
  static HEIGHT = 650;
  static PORTRAIT_WIDTH = 360;
  static PORTRAIT_HEIGHT = 900;
  static LAYOUT = 'fit';
  static SETTING = 'none';
  static BEAT_STEP_MAP = MAP;
  static CONTROLS = [];
  static CUES = ['shuf'];
  static ARIA_LABEL = 'A shuffle test on a small study of 60 people: 20 cases, 14 of whom smoked, and 40 controls, 16 of whom smoked. The real exposure rates are 70 and 40 per cent, a gap of 30 points. Each shuffle deals the same 60 people at random into a group of 20 and a group of 40, keeping each person\'s smoking, and works out the gap again. Each shuffled gap drops as a dot onto a number line with the real gap marked at 30. After 100 shuffles, 3 dots reach the real gap: a P value of about 0.03.';

  async setup() {
    this.resetDeck();
    await super.setup();
    this.render({ css: CSS, rootClass: 'spn-page', html: '' });
    bindPanel(this.root, { action: (name) => this.act(name) });
    this.paint();
  }

  resetDeck() {
    this.rnd = mulberry32(SEED);
    this.order = [...Array(N).keys()];          // order[slot] = person; slots 0..19 = cases
    this.dealt = null;                          // null = the real study on the board
    this.counts = new Map();                    // x -> number of shuffles
    this.deals = 0;
    this.last = null;                           // { x } of the last shuffle
    this.fresh = false;
  }

  dealOnce() {
    const o = this.order;
    for (let i = N - 1; i > 0; i--) { const j = Math.floor(this.rnd() * (i + 1)); const t = o[i]; o[i] = o[j]; o[j] = t; }
    let x = 0;
    for (let i = 0; i < N_CASES; i++) x += EXP[o[i]] ? 1 : 0;
    this.counts.set(x, (this.counts.get(x) || 0) + 1);
    this.deals += 1;
    this.last = { x };
    this.dealt = o.slice();
  }

  dealTo(n) { while (this.deals < n) this.dealOnce(); }

  hits() { let h = 0; for (const [x, n] of this.counts) if (gapOf(x) >= REAL_GAP) h += n; return h; }

  onStep(step) {
    if (step <= 1) this.resetDeck();
    else if (this.deals < 100) { this.resetDeck(); this.dealTo(100); }
    this.fresh = false;
    this.paint();
  }

  applyCue(id) {
    if (id !== 'shuf' || (this.stepIndex ?? 0) !== 1) return;
    if (this.deals === 0) { this.dealOnce(); this.fresh = true; this.paint(true); }
  }

  cueBase() { return null; }
  cueReset() { if ((this.stepIndex ?? 0) === 1) { this.resetDeck(); this.paint(true); } }

  act(name) {
    if ((this.stepIndex ?? 0) < 1) return;
    if (name === 'reset') { this.resetDeck(); this.paint(true); return; }
    if (name === 'shuffle') { this.dealOnce(); this.fresh = true; }
    else if (name === 'run') { this.dealTo(this.deals < 100 ? 100 : this.deals + 100); this.fresh = false; }
    else return;
    this.paint(true);
  }

  /** Slot -> (group, col, row): exposed people first within each group, so a group's rate reads at a glance. */
  layout() {
    const pos = new Array(N);
    const seat = (people, g, cols) => {
      const sorted = people.filter((p) => EXP[p]).concat(people.filter((p) => !EXP[p]));
      sorted.forEach((p, k) => { pos[p] = { g, c: k % cols, r: Math.floor(k / cols) }; });
    };
    const o = this.dealt ?? [...Array(N).keys()];
    seat(o.slice(0, N_CASES), 0, 5);
    seat(o.slice(N_CASES), 1, 8);
    return pos;
  }

  boardHtml() {
    const pos = this.layout();
    const dots = pos.map((q, p) => `<span class="cor-p${EXP[p] ? ' is-x' : ''}" data-g="${q.g}" data-p="${p}" style="--g:${q.g};--c:${q.c};--r:${q.r}"></span>`).join('');
    const sh = this.dealt != null;
    return `<div class="cor-board"${na('people')} role="img" aria-label="${sh ? `Shuffle ${this.deals}: ${this.last.x} smokers dealt into the group of 20` : 'The real study: 14 smokers among the 20 cases, 16 among the 40 controls'}">`
      + `<div class="cor-grp cor-grp--0"${na('cases')}><b>${sh ? 'As cases (20)' : 'Cases (20)'}</b></div>`
      + `<div class="cor-grp cor-grp--1"${na('controls')}><b>${sh ? 'As controls (40)' : 'Controls (40)'}</b></div>`
      + dots + '</div>';
  }

  sumRow(cls, label, x, narr) {
    if (x == null) return `<tr class="${cls} is-empty"${na(narr)}><th scope="row">${label}</th><td>-</td><td class="op"></td><td>-</td><td class="op"></td><td class="g">-</td></tr>`;
    const rc = (100 * x) / N_CASES, rk = (100 * (N_SMOKERS - x)) / N_CTRL, g = gapOf(x);
    return `<tr class="${cls}${cls === 'shuf' && this.fresh ? ' is-new' : ''}"${na(narr)}><th scope="row">${label}</th>`
      + `<td><small>${x} of 20</small><b>${pct(rc)}</b></td><td class="op">-</td>`
      + `<td><small>${N_SMOKERS - x} of 40</small><b>${pct(rk)}</b></td><td class="op">=</td>`
      + `<td class="g"><b>${pts(g)}</b></td></tr>`;
  }

  sumsHtml() {
    return '<table class="cor-sums" aria-label="Exposure rates and their gap, real and shuffled"><thead><tr><th>Who smoked</th><th>Cases</th><th></th><th>Controls</th><th></th><th>Gap</th></tr></thead><tbody>'
      + this.sumRow('real', 'Real study', REAL_X, 'real')
      + this.sumRow('shuf', this.deals ? `Shuffle ${this.deals}` : 'A shuffle', this.last?.x ?? null, 'shuf')
      + '</tbody></table>';
  }

  plotHtml() {
    // Dots stack two wide, so each dot can be about twice as big as a one-wide pile.
    const max = Math.max(1, ...this.counts.values());
    const h = this.root?.classList.contains('sim-dom-root--portrait') ? 175 : 165;
    const s = Math.max(3, Math.min(11, Math.floor((h - 4) / Math.ceil(max / 2))));
    const pile = (g, n, hit) => {
      const full = Math.floor(n / 2), odd = n % 2;
      return `<span class="cor-col${hit ? ' is-hit' : ''}" style="left:${AT(g)}%;height:${full * s}px;width:${2 * s}px;--cor-s:${s}px"></span>`
        + (odd ? `<span class="cor-col${hit ? ' is-hit' : ''}" style="left:calc(${AT(g)}% - ${s / 2}px);bottom:${full * s}px;height:${s}px;width:${s}px;--cor-s:${s}px"></span>` : '');
    };
    let cols = '';
    for (const [x, n] of [...this.counts].sort((p, q) => p[0] - q[0])) {
      const g = gapOf(x), fresh = this.fresh && this.last?.x === x;
      cols += pile(g, fresh ? n - 1 : n, g >= REAL_GAP);
      if (fresh) {
        const k = n - 1, dx = k % 2 ? s / 2 : -s / 2, top = h - (Math.floor(k / 2) + 1) * s;
        cols += `<span class="cor-drop" style="left:calc(${AT(g)}% + ${dx}px);--cor-s:${s}px;--cor-to:${top}px" aria-hidden="true"></span>`;
      }
    }
    const ticks = [-45, -30, -15, 0, 15, 30, 45].map((v) => `<span style="left:${AT(v)}%">${v > 0 ? '+' : ''}${v}</span>`).join('');
    return `<div${na('plot')}><div class="cor-plot" style="--cor-s:${s}px" role="img" aria-label="Dot plot of ${this.deals} shuffled gaps; ${this.hits()} at or beyond the real gap of 30 points">`
      + `${cols}<span class="cor-line" style="left:${AT(REAL_GAP)}%"${na('line')}><span>Real gap, 30</span></span></div>`
      + `<div class="cor-ticks" aria-hidden="true">${ticks}</div><p class="cor-ax">Gap in each shuffle, cases minus controls (percentage points)</p></div>`;
  }

  countHtml() {
    const h = this.hits(), n = this.deals;
    return n ? `<b>${h}</b> of ${n} shuffle${n === 1 ? '' : 's'} gave a gap of 30 points or more.` : 'No shuffles yet.';
  }

  btnsHtml() {
    const s = this.stepIndex ?? 0, n = this.deals;
    return buttonsHtml([
      { label: 'Shuffle once', action: 'shuffle', primary: true, disabled: s < 1 },
      { label: n < 100 ? 'Shuffle to 100' : '100 more', action: 'run', disabled: s < 1 },
      { label: 'Reset', action: 'reset', quiet: true, disabled: s < 1 || n === 0 },
    ]);
  }

  pvHtml() {
    const h = this.hits(), n = this.deals;
    const v = n ? (h / n).toFixed(n >= 1000 ? 3 : 2) : '0';
    return `Share by chance alone: <b>${h} / ${n} = ${v}</b>. That share is the <b>P value</b>.`;
  }

  /** Full render on a new beat; a shuffle patches in place so the dots fly (paint(true)). */
  paint(patch = false) {
    if (!this.root) return;
    const s = this.stepIndex ?? 0, n = this.deals;
    const board = this.root.querySelector('.cor-board');
    if (patch && board) {
      const pos = this.layout(), sh = this.dealt != null;
      board.querySelectorAll('.cor-p').forEach((el) => {
        const p = Number(el.dataset.p), q = pos[p];
        el.style.setProperty('--d', this.fresh ? `${((p * 37) % 60) * 0.006}s` : '0s');
        el.style.setProperty('--g', q.g); el.style.setProperty('--c', q.c); el.style.setProperty('--r', q.r);
        el.dataset.g = String(q.g);
      });
      board.setAttribute('aria-label', sh ? `Shuffle ${n}: ${this.last.x} smokers dealt into the group of 20` : 'The real study: 14 smokers among the 20 cases, 16 among the 40 controls');
      const labs = board.querySelectorAll('.cor-grp b');
      if (labs[0]) labs[0].textContent = sh ? 'As cases (20)' : 'Cases (20)';
      if (labs[1]) labs[1].textContent = sh ? 'As controls (40)' : 'Controls (40)';
      const set = (sel, html) => { const e = this.root.querySelector(sel); if (e) e.innerHTML = html; };
      set('[data-cor-sums]', this.sumsHtml());
      set('[data-cor-plot]', this.plotHtml());
      set('[data-cor-count]', this.countHtml());
      set('[data-cor-btns]', this.btnsHtml());
      set('[data-cor-pv]', this.pvHtml());
      this.root.querySelector('[data-cor-pv]')?.classList.toggle('cor-off', !(s >= 2 && n));
      this.fresh = false;
      return;
    }
    const key = '<p class="cor-key" aria-hidden="true"><span><i class="f"></i>smoked</span><span><i></i>did not smoke</span></p>';
    this.render({ html: `<div class="spn cor">${this.boardHtml()}${key}<div data-cor-sums${na('sums')}>${this.sumsHtml()}</div><div data-cor-plot>${this.plotHtml()}</div>`
      + `<div class="cor-row"><p class="cor-count" data-cor-count${na('count')} aria-live="polite">${this.countHtml()}</p><div data-cor-btns${na(s < 1 ? '-' : 'buttons')}>${this.btnsHtml()}</div></div>`
      + `<p class="cor-pv${s >= 2 && n ? '' : ' cor-off'}" data-cor-pv${na('pvalue')}>${this.pvHtml()}</p></div>` });
    this.fresh = false;
  }

  testState() {
    return { beat: this.stepIndex, deals: this.deals, hits: this.hits(), lastX: this.last?.x ?? null, lastGap: this.last ? gapOf(this.last.x) : null };
  }
}
