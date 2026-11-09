/**
 * DesLineupScene - analytical-epidemiology L02 s07 "seven of eight mothers took one drug". Table 14 of
 * the source (Herbst, Ulfelder and Poskanzer, NEJM 1971): 8 cases, 32 birth-record controls (4 per
 * case), four maternal-history suspects. The rows start closed; the learner selects a row head to open
 * it, and its two values land beside each other as one large comparison with the study's own mark.
 *   Beat 0: the lineup closed, rows shown but not live.
 *   Beat 1: rows live: maternal age 26.1 vs 29.3, smoking 7 vs 21, antenatal X-rays 1 vs 4, all n.s.
 *   Beat 2: the oestrogen (DES) row: 7 vs none, P < 0.00001; once open, the take-away lands.
 * Numbers exactly as Table 14 prints them (a dash for the controls' DES count, shown as "none").
 * Built on the editorial panel parts (kit/SimPanel.js): rule table with row picking, prompt, take-away.
 */
import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withBeats } from 'simulations/base/DomBeats.js';
import { SIM_PANEL_CSS, ruleTableHtml, promptHtml, takeawayHtml, bindPanel } from 'simulations/base/kit/SimPanel.js';

const ROWS = [
  { label: 'Maternal age', a: '26.1', b: '29.3', mark: 'n.s.', big: ['26.1', '29.3'], unit: 'years, average', note: 'The mothers of the cases were a little younger. The study marks the difference not significant.' },
  { label: 'Maternal smoking', a: '7', b: '21', mark: 'n.s.', frac: [['7', '8'], ['21', '32']], note: 'Most mothers in both groups smoked. Not significant.' },
  { label: 'Antenatal X-rays', a: '1', b: '4', mark: 'n.s.', frac: [['1', '8'], ['4', '32']], note: 'One in eight on both sides. Not significant.' },
  { label: 'Oestrogen (DES)', a: '7', b: 'none', mark: 'P < 0.00001', frac: [['7', '8'], ['0', '32']], note: 'Seven of the eight case mothers took DES in early pregnancy; none of the 32 control mothers did.', des: true },
];
const MAP = [0, 1, 2].map((i) => [{ idx: i, dwellMs: null }]);

const CSS = SIM_PANEL_CSS + `
.dl { gap: var(--sim-space-3); }
.dl .spn-table th, .dl .spn-table td { padding-top: 3px; padding-bottom: 3px; }
.dl .spn-table tbody th { width: 46%; }
.dl .spn-pick { width: 100%; justify-content: flex-start; }
.dl-shut { color: var(--sim-label-muted); letter-spacing: 0.2em; }
.dl-mark--sig { font-weight: 700; color: var(--sim-annot); }
.dl-cmp { display: flex; flex-direction: column; gap: var(--sim-space-2); min-height: 116px; padding-top: var(--sim-space-3); border-top: 1px solid var(--sim-label); }
.dl-cmp.dl-cmp--quiet { min-height: 0; }
.dl-cmp__row { display: flex; flex-wrap: wrap; align-items: center; gap: var(--sim-space-2) var(--sim-space-4); }
.dl-side { display: flex; align-items: center; gap: var(--sim-space-3); }
.dl-side > span:first-child { font-size: var(--sim-text-sm); font-weight: 700; }
.dl-big { font-family: var(--sim-font-numeral, var(--sim-font-display)); font-size: 40px; line-height: 1.1; font-variant-numeric: lining-nums tabular-nums; color: var(--sim-label); }
.dl-big--case { color: var(--sim-annot); }
.dl-vs { font-size: var(--sim-text-md); color: var(--sim-label-muted); }
.dl-of { font-size: var(--sim-text-md); color: var(--sim-label-muted); font-variant-numeric: tabular-nums; }
.dl-cmp p { margin: 0; font-size: var(--sim-text-md); line-height: 1.45; }
.dl-wait { color: var(--sim-label-muted); }
.dl-src { margin: 0; font-size: var(--sim-text-sm); color: var(--sim-label-muted); }
.dl-in { animation: dl-in 0.28s ease-out both; }
@keyframes dl-in { from { opacity: 0; transform: translateY(6px); } }
.sim-dom-root--portrait .dl .spn-table th, .sim-dom-root--portrait .dl .spn-table td { padding: 7px 4px; }
.sim-dom-root--portrait .dl .spn-table tbody th { width: 30%; }
.sim-dom-root--portrait .dl .spn-table tbody th .spn-pick { padding-left: 5px; padding-right: 5px; }
.sim-dom-root--portrait .dl .spn-table .spn-sub { display: block; white-space: normal; }.sim-dom-root--portrait .dl-big { font-size: 34px; }
@media (prefers-reduced-motion: reduce) { .dl-in { animation: none; } }
`;

export class DesLineupScene extends withBeats(DomSimulation) {
  static WIDTH = 540;
  static HEIGHT = 530;
  static PORTRAIT_WIDTH = 360;
  static PORTRAIT_HEIGHT = 720;
  static LAYOUT = 'fit';
  static SETTING = 'none';
  static BEAT_STEP_MAP = MAP;
  static CONTROLS = [];
  static ARIA_LABEL = 'Table 14, the DES study: 8 cases and 32 birth-record controls, four per case. Select a row to open it. Maternal age 26.1 years in cases against 29.3 in controls, not significant. Maternal smoking 7 against 21, not significant. Antenatal X-rays 1 against 4, not significant. Oestrogen, DES, exposure 7 of 8 cases against none of 32 controls, P less than 0.00001.';

  async setup() {
    this.sel = null;
    this.seen = new Set();
    this.fresh = false;
    await super.setup();
    this.render({ css: CSS, rootClass: 'spn-page', html: '' });
    bindPanel(this.root, { action: (name, v) => this.act(name, v) });
    this.paint();
  }

  onStep(step) {
    if (step === 0) { this.sel = null; this.seen = new Set(); }
    this.fresh = false;
    this.paint();
  }

  act(name, v) {
    if (name !== 'pick' || (this.stepIndex ?? 0) < 1) return;
    const i = Number(v);
    if (!ROWS[i]) return;
    this.sel = i;
    this.seen.add(i);
    this.fresh = true;
    this.paint();
  }

  // quiet: the take-away is showing, so the row's note is left out (the panel keeps its height).
  cmpHtml(r, quiet) {
    const val = (k, isCase) => (r.big
      ? `<span class="dl-big${isCase ? ' dl-big--case' : ''}">${r.big[k]}</span>`
      : `<span><span class="dl-big${isCase ? ' dl-big--case' : ''}">${r.frac[k][0]}</span><span class="dl-of"> of ${r.frac[k][1]}</span></span>`);
    return `<div class="dl-cmp${quiet ? ' dl-cmp--quiet' : ''}${this.fresh ? ' dl-in' : ''}" aria-live="polite"><span class="spn-kicker">${r.label}</span>`
      + `<div class="dl-cmp__row"><span class="dl-side"><span>Cases</span>${val(0, true)}</span><span class="dl-vs">against</span><span class="dl-side"><span>Controls</span>${val(1, false)}</span>`
      + `<span class="${r.des ? 'dl-mark--sig' : 'dl-vs'}">${r.mark}</span></div>`
      + (quiet ? '' : `<p>${r.big ? `${r.unit}. ` : ''}${r.note}</p>`) + '</div>';
  }

  paint() {
    if (!this.root) return;
    const s = this.stepIndex ?? 0, live = s >= 1;
    const open = (i) => this.seen.has(i);
    const table = ruleTableHtml({
      caption: 'Maternal history from the birth records (Herbst, Ulfelder and Poskanzer, NEJM 1971, Table 14)',
      corner: 'Suspect',
      cols: [{ label: 'Cases', sub: '(8)' }, { label: 'Controls', sub: '(32)' }, { label: 'Significance', sub: 'n.s.: not significant' }],
      rows: ROWS.map((r, i) => ({
        label: r.label,
        cells: open(i)
          ? [r.a, r.b, { v: '', html: `<span class="${r.des ? 'dl-mark--sig' : ''}">${r.mark}</span>` }]
          : [0, 1, 2].map(() => ({ v: '', html: '<span class="dl-shut" aria-label="not opened">· · ·</span>' })),
      })),
      pick: live ? 'row' : null,
      sel: live && this.sel != null ? this.sel : null,
      label: 'Table 14: maternal history of 8 cases and 32 controls',
    });
    const left = ROWS.map((r, i) => i).filter((i) => !open(i));
    let prompt;
    if (!live) prompt = '<p class="dl-src">Four suspects from the birth records. Each row is still closed.</p>';
    else if (left.length) prompt = promptHtml(this.seen.size ? `Select another row: ${left.length} still closed.` : 'Select a row head to open that suspect.', { key: 'prompt' });
    else prompt = promptHtml('All four suspects open.', { key: 'prompt', done: true });
    const take = s >= 2 && open(3) ? takeawayHtml('Only one suspect separates the two groups.', 'Fair controls let three suspects fall away and leave the cause standing.') : '';
    const cmp = this.sel != null
      ? this.cmpHtml(ROWS[this.sel], !!take)
      : `<div class="dl-cmp"><p class="dl-wait">${live ? 'Open a suspect to compare the cases with their controls.' : 'Cases: the 8 young women. Controls: 4 girls per case, born in the same hospital at about the same time.'}</p></div>`;
    this.render({ html: `<div class="spn dl">${prompt}${table}${cmp}${take}</div>` });
    this.fresh = false;
  }

  testState() {
    return { beat: this.stepIndex, sel: this.sel, open: [...this.seen].sort() };
  }
}
