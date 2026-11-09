/**
 * CaseControlFrameScene - analytical-epidemiology L02 s02 "start from the disease, look back for the
 * exposure". People before cells: a school picnic (illustrative), 20 people who fell ill and 60 who
 * stayed well, chosen by the investigator.
 *   Beat 0: two pools of dots, 20 cases (signature colour) and 60 controls (grey); no table yet.
 *   Beat 1: both groups are asked about the paneer salad; the pools empty and the people land in the
 *           four cells of a ruled 2x2 table (16, 12 / 4, 48), counts only, no letters.
 *   Beat 2: the letters a-d join the counts and the total row becomes the margins a+c = 20, b+d = 60.
 *   Beat 3: chips under the table select a cell or a margin; its people stay lit, the rest dim, and a
 *           reading line names what the selection holds.
 *   Beat 4: as beat 3, plus the take-away line.
 * No rate, no total of 80, no odds ratio: the group sizes are the investigator's choice.
 * Built on the editorial panel parts (kit/SimPanel.js): rule table, chips, prompt, take-away; the dots
 * follow the approved L03 OddsRatioBuildScene mount-2 pattern (pools fade out, cells fill in).
 */
import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withBeats } from 'simulations/base/DomBeats.js';
import { SIM_PANEL_CSS, ruleTableHtml, chipsHtml, promptHtml, takeawayHtml, bindPanel } from 'simulations/base/kit/SimPanel.js';
import { reducedMotion } from 'simulations/base/kit/SimAnim.js';
import { mulberry32 } from 'simulations/base/kit/SimLook.js';

const N = { a: 16, b: 12, c: 4, d: 48 };            // exposed cases, exposed controls, unexposed cases, unexposed controls
const SORT_LAG = 0.012;                              // s between people in the sort (80 people: about 1 s)
const MAP = [0, 1, 2, 3, 4].map((i) => [{ idx: i, dwellMs: null }]);

// 80 people in a seeded order, so the sort runs the same way every time.
const PEOPLE = (() => {
  const out = [];
  for (const [cell, n, isCase] of [['a', N.a, true], ['b', N.b, false], ['c', N.c, true], ['d', N.d, false]]) {
    for (let i = 0; i < n; i++) out.push({ cell, isCase });
  }
  const rnd = mulberry32(11);
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out.map((p, i) => ({ ...p, i }));
})();

// What a selection holds: the cells it lights and the reading line.
const PICKS = {
  a: { cells: ['a'], text: 'a = 16: fell ill and ate the salad.' },
  b: { cells: ['b'], text: 'b = 12: stayed well and ate the salad.' },
  c: { cells: ['c'], text: 'c = 4: fell ill and did not eat it.' },
  d: { cells: ['d'], text: 'd = 48: stayed well and did not eat it.' },
  ac: { cells: ['a', 'c'], text: 'a + c = 16 + 4 = 20: every case, the group the investigator started from.' },
  bd: { cells: ['b', 'd'], text: 'b + d = 12 + 48 = 60: every control, three for each case, by choice.' },
};
const POS = { a: [0, 0], b: [0, 1], c: [1, 0], d: [1, 1] };

const CSS = SIM_PANEL_CSS + `
.ccf { gap: var(--sim-space-3); }
.ccf .spn-table td { vertical-align: top; }
.ccf-cell { display: flex; flex-direction: column; align-items: flex-end; gap: 8px; }
.ccf-n { font-variant-numeric: lining-nums tabular-nums; }
.ccf-n i { font-style: normal; font-weight: 700; color: var(--sim-annot); margin-right: 0.3em; }
.ccf-dots { display: flex; flex-wrap: wrap; gap: 4px; justify-content: flex-end; max-width: 196px; min-height: 10px; }
.ccf-dot { width: 10px; height: 10px; border-radius: 50%; background: var(--sim-series-8); transition: opacity 0.25s ease; }
.ccf-dot--case { background: var(--sim-annot); }
.ccf-dim .ccf-dot { opacity: 0.18; }
.ccf-in { animation: ccf-in 0.35s ease-out both; animation-delay: calc(var(--i) * ${SORT_LAG}s); }
.ccf-out { animation: ccf-out 0.3s ease-in both; animation-delay: calc(var(--i) * ${SORT_LAG}s); }
@keyframes ccf-in { from { opacity: 0; transform: scale(0.2); } }
@keyframes ccf-out { to { opacity: 0.12; transform: scale(0.6); } }
.ccf-pools { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 2fr); gap: var(--sim-space-5); padding: var(--sim-space-3) 0; border-top: 1px solid var(--sim-label); border-bottom: 1px solid var(--sim-label); }
.ccf-pool { display: flex; flex-direction: column; gap: var(--sim-space-2); }
.ccf-pool .ccf-dots { justify-content: flex-start; max-width: none; gap: 6px; }
.ccf-pool .ccf-dot { width: 13px; height: 13px; }
.ccf-pool b { font-family: var(--sim-font-numeral, var(--sim-font-display)); font-weight: 400; font-size: 40px; line-height: 1; color: var(--sim-label); }
.ccf-pool--case b { color: var(--sim-annot); }
.ccf-key { display: flex; flex-wrap: wrap; gap: 4px var(--sim-space-4); margin: 0; font-size: var(--sim-text-sm); color: var(--sim-label-muted); }
.ccf-key i { display: inline-block; width: 10px; height: 10px; border-radius: 50%; margin-right: 6px; background: var(--sim-series-8); }
.ccf-key i.ccf-dot--case { background: var(--sim-annot); }
.ccf-read { margin: 0; min-height: 2.9em; padding-top: var(--sim-space-2); border-top: 1px solid var(--sim-label); font-size: var(--sim-text-md); line-height: 1.45; }
.ccf-read b { font-weight: 700; }
.ccf-read--wait { color: var(--sim-label-muted); }
.ccf-read .spn-prompt { margin: 0; }
.ccf .spn-btns { gap: var(--sim-space-2); }
.ccf .spn-act { min-width: 64px; justify-content: flex-start; font-variant-numeric: tabular-nums; }
.sim-dom-root--portrait .ccf-dots { max-width: 104px; gap: 3px; }
.sim-dom-root--portrait .ccf-dot { width: 9px; height: 9px; }
.sim-dom-root--portrait .ccf-pools { grid-template-columns: minmax(0, 1fr); gap: var(--sim-space-3); }
.sim-dom-root--portrait .ccf .spn-table th, .sim-dom-root--portrait .ccf .spn-table td { padding: 8px 8px; }
@media (prefers-reduced-motion: reduce) { .ccf-in, .ccf-out { animation: none; } }
`;

export class CaseControlFrameScene extends withBeats(DomSimulation) {
  static WIDTH = 540;
  static HEIGHT = 540;
  static PORTRAIT_WIDTH = 360;
  static PORTRAIT_HEIGHT = 650;
  static LAYOUT = 'fit';
  static SETTING = 'none';
  static BEAT_STEP_MAP = MAP;
  static CONTROLS = [];
  static ARIA_LABEL = 'A case-control frame, illustrative: a school picnic. Twenty people who fell ill and sixty who stayed well are shown as dots. Asked whether they ate the paneer salad, they sort into the four cells of a two by two table: a, 16 ill and exposed; b, 12 well and exposed; c, 4 ill and unexposed; d, 48 well and unexposed. The margins are a plus c, 20, the cases, and b plus d, 60, the controls. Chips under the table select a cell or a margin and light the people it holds.';

  async setup() {
    this.sel = null;
    this.sorting = false;
    this.prev = null;
    await super.setup();
    this.render({ css: CSS, rootClass: 'spn-page', html: '' });
    bindPanel(this.root, { action: (name, v) => this.act(name, v) });
    this.paint();
  }

  onStep(step) {
    this.sorting = step === 1 && (this.prev == null || this.prev === 0) && !reducedMotion();
    if (step < 3) this.sel = null;
    this.prev = step;
    this.paint();
    if (this.sorting) {
      clearTimeout(this._sortT);
      this._sortT = setTimeout(() => { this.sorting = false; if (this.stepIndex === 1) this.paint(); }, (0.4 + SORT_LAG * PEOPLE.length) * 1000 + 100);
    }
  }

  act(name, v) {
    if (name !== 'pick' || (this.stepIndex ?? 0) < 3 || !PICKS[v]) return;
    this.sel = this.sel === v ? null : v;
    this.paint();
  }

  dotsHtml(list, cls) {
    return `<span class="ccf-dots" aria-hidden="true">${list.map((p) => `<i class="ccf-dot${p.isCase ? ' ccf-dot--case' : ''}${cls ? ` ${cls}` : ''}" style="--i:${p.i}"></i>`).join('')}</span>`;
  }

  pools(cls) {
    return '<div class="ccf-pools">'
      + `<div class="ccf-pool ccf-pool--case"><span class="spn-label">Fell ill: the cases</span><b>20</b>${this.dotsHtml(PEOPLE.filter((p) => p.isCase), cls)}</div>`
      + `<div class="ccf-pool"><span class="spn-label">Stayed well: chosen as controls</span><b>60</b>${this.dotsHtml(PEOPLE.filter((p) => !p.isCase), cls)}</div>`
      + '</div>';
  }

  paint() {
    if (!this.root) return;
    const s = this.stepIndex ?? 0;
    const key = '<p class="ccf-key"><span><i class="ccf-dot--case"></i>a person who fell ill</span><span><i></i>a person who stayed well</span></p>';
    if (s === 0) {
      this.render({ html: `<div class="spn ccf">${this.pools('')}${key}<p class="ccf-read ccf-read--wait">Nobody has been asked about the food yet.</p></div>` });
      return;
    }
    const lit = this.sel ? PICKS[this.sel].cells : null;
    const cell = (k) => {
      const tag = s >= 2 ? `<i>${k}</i>` : '';
      const dim = lit && !lit.includes(k) ? ' ccf-dim' : '';
      return { v: '', html: `<span class="ccf-cell${dim}"><span class="ccf-n">${tag}${N[k]}</span>${this.dotsHtml(PEOPLE.filter((p) => p.cell === k), this.sorting ? 'ccf-in' : '')}</span>` };
    };
    const hi = lit && lit.length === 1 ? [POS[lit[0]]] : [];
    const band = this.sel === 'ac' ? { col: 0 } : this.sel === 'bd' ? { col: 1 } : {};
    const table = ruleTableHtml({
      corner: 'Exposure',
      cols: [{ label: 'Cases', sub: 'fell ill' }, { label: 'Controls', sub: 'stayed well' }],
      rows: [{ label: 'Ate the paneer salad', cells: [cell('a'), cell('b')] }, { label: 'Did not eat it', cells: [cell('c'), cell('d')] }],
      total: { label: s >= 2 ? 'Margins' : 'Total', cells: s >= 2 ? ['a + c = 20', 'b + d = 60'] : [20, 60] },
      hi, band,
      label: 'Picnic case-control table, illustrative: cells a 16, b 12, c 4, d 48; margins 20 and 60',
    });
    let top = '';
    let foot = '';
    if (s === 1) {
      top = this.sorting ? this.pools('ccf-out') : '';
      foot = `${key}<p class="ccf-read">The same question for both groups sorts the 80 people into four cells.</p>`;
    } else if (s === 2) {
      foot = `${key}<p class="ccf-read">The letters name counts you can already see. The margins are the two group totals.</p>`;
    } else {
      const chips = chipsHtml([
        { label: 'a', action: 'pick', value: 'a', pressed: this.sel === 'a' },
        { label: 'b', action: 'pick', value: 'b', pressed: this.sel === 'b' },
        { label: 'c', action: 'pick', value: 'c', pressed: this.sel === 'c' },
        { label: 'd', action: 'pick', value: 'd', pressed: this.sel === 'd' },
        { label: 'a + c', action: 'pick', value: 'ac', pressed: this.sel === 'ac' },
        { label: 'b + d', action: 'pick', value: 'bd', pressed: this.sel === 'bd' },
      ], { label: 'Cells and margins' });
      // The read slot carries the instruction until something is selected, then what the selection holds.
      const read = this.sel
        ? `<p class="ccf-read" aria-live="polite"><b>${PICKS[this.sel].text}</b> Select it again to clear.</p>`
        : `<div class="ccf-read" aria-live="polite">${promptHtml('Select a cell or a margin to light the people it holds.', { key: 'prompt' })}</div>`;
      foot = chips + read + (s >= 4 ? takeawayHtml('The two groups are chosen; only the exposure is measured.', '20 and 60 say nothing about how common the illness was.') : '');
    }
    this.render({ html: `<div class="spn ccf">${top}${table}${foot}</div>` });
  }

  testState() {
    return { beat: this.stepIndex, sel: this.sel, sorting: this.sorting, cells: { ...N } };
  }
}
