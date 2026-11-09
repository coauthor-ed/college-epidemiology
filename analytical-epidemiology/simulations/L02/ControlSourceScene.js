/**
 * ControlSourceScene - analytical-epidemiology L02 s05 "the wrong controls hide a real effect".
 * Illustrative: a study of smoking and heart attack. The cases are fixed, 60 of 100 smoke. The learner
 * selects one of four control sources; the controls' 10 x 10 grid refills to that source's smoking
 * share, the gap to the cases counts to its new value, and the source's catch is named beside it.
 *   Beat 0: the cases' grid (60 of 100), the controls' grid empty; source chips shown but not live.
 *   Beat 1: chips live: hospital patients 60, relatives 45, neighbours 35, general population 40.
 *   Beat 2: the two extremes of the slide: each source tried keeps its gap on its chip, so general
 *           population (gap 20) and hospital patients (gap 0) can be read together.
 *   Beat 3: the take-away on number of sources.
 * Shares and a gap in percentage points only: the odds ratio is not met until L03.
 * Built on the editorial panel parts (kit/SimPanel.js): prompt, chips, readout, take-away.
 */
import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withBeats } from 'simulations/base/DomBeats.js';
import { SIM_PANEL_CSS, chipsHtml, promptHtml, readoutHtml, setReadout, takeawayHtml, bindPanel } from 'simulations/base/kit/SimPanel.js';

const CASES = 60;
const SOURCES = [
  { id: 'hosp', name: 'Hospital patients', share: 60, catch: 'Other illnesses share the exposure: these controls have bladder cancer, which is linked to smoking.' },
  { id: 'rel', name: 'Relatives', share: 45, catch: 'Siblings share genes, so they are unsuitable when the disease runs in families.' },
  { id: 'nb', name: 'Neighbours', share: 35, catch: 'Same street, same water and air, so a local exposure cannot show.' },
  { id: 'pop', name: 'General population', share: 40, catch: 'A random sample: the fairest comparison, and the hardest to assemble.' },
];
const byId = (id) => SOURCES.find((s) => s.id === id);
const MAP = [0, 1, 2, 3].map((i) => [{ idx: i, dwellMs: null }]);

const CSS = SIM_PANEL_CSS + `
.cs { gap: 10px; }
.cs-grids { display: grid; grid-template-columns: auto auto minmax(0, 1fr); gap: var(--sim-space-5); align-items: end; padding-top: var(--sim-space-3); border-top: 1px solid var(--sim-label); }
.cs-grp { display: flex; flex-direction: column; gap: var(--sim-space-2); }
.cs-grp p { margin: 0; font-size: var(--sim-text-md); font-variant-numeric: tabular-nums; }
.cs-grp p b { font-weight: 700; }
.cs-waf { display: grid; grid-template-columns: repeat(10, 11px); gap: 3px; }
.cs-waf i { width: 11px; height: 11px; border-radius: 2px; background: var(--sim-track); transition: background-color 0.18s ease; transition-delay: calc(var(--k) * 6ms); }
.cs-waf--case i.on { background: var(--sim-annot); }
.cs-waf--ctl i.on { background: var(--sim-series-8); }
.cs-waf--empty i { background: transparent; box-shadow: inset 0 0 0 1px var(--sim-track); }
.cs .spn-read { gap: var(--sim-space-1); }
.cs .spn-read__n { font-size: 48px; }
.cs-catch { margin: 0; min-height: 3em; font-size: var(--sim-text-md); line-height: 1.45; }
.cs-catch b { font-weight: 700; }
.cs-catch--wait { color: var(--sim-label-muted); }
.cs-note { margin: 0; font-size: var(--sim-text-sm); color: var(--sim-label-muted); }
.sim-dom-root--portrait .cs-grids { grid-template-columns: auto auto; gap: var(--sim-space-4); }
.sim-dom-root--portrait .cs-grids > .spn-read { grid-column: 1 / -1; }
.sim-dom-root--portrait .cs-grids > .spn-read { flex-direction: row; flex-wrap: wrap; align-items: baseline; column-gap: var(--sim-space-3); }
.sim-dom-root--portrait .cs .spn-read__n { font-size: 40px; }
.sim-dom-root--portrait .cs-waf { grid-template-columns: repeat(10, 11px); gap: 3px; }
.sim-dom-root--portrait .cs-waf i { width: 11px; height: 11px; }
@media (prefers-reduced-motion: reduce) { .cs-waf i { transition: none; } }
`;

export class ControlSourceScene extends withBeats(DomSimulation) {
  static WIDTH = 540;
  static HEIGHT = 550;
  static PORTRAIT_WIDTH = 360;
  static PORTRAIT_HEIGHT = 790;
  static LAYOUT = 'fit';
  static SETTING = 'none';
  static BEAT_STEP_MAP = MAP;
  static CONTROLS = [];
  static ARIA_LABEL = 'Illustrative study of smoking and heart attack. Sixty of 100 cases smoke. Select a control source: hospital patients with bladder cancer, 60 of 100 smoke, gap 0 points; relatives, 45, gap 15; neighbours, 35, gap 25; general population, 40, gap 20. Each source names its catch. The cases never change; only the controls do.';

  async setup() {
    this.src = null;
    this.tried = [];
    this.fromShare = null;
    await super.setup();
    this.render({ css: CSS, rootClass: 'spn-page', html: '' });
    bindPanel(this.root, { action: (name, v) => this.act(name, v) });
    this.paint();
  }

  onStep(step) {
    if (step === 0) { this.src = null; this.tried = []; }
    this.fromShare = null;
    this.paint();
  }

  act(name, v) {
    if (name !== 'src' || (this.stepIndex ?? 0) < 1 || !byId(v)) return;
    const was = this.src ? byId(this.src).share : null;
    this.fromShare = was ?? 0;
    this.src = v;
    if (!this.tried.includes(v)) this.tried.push(v);
    this.paint();
    this.fillTo(byId(v).share);
    const gap = CASES - byId(v).share;
    setReadout(this.root, 'gap', { value: gap, from: was == null ? 0 : CASES - was, fmt: (x) => String(Math.round(x)), dur: 0.45 });
  }

  // The controls' grid is painted at the old share, then refilled to the new one (a CSS transition, staggered).
  fillTo(n) {
    const cells = this.root?.querySelectorAll('.cs-waf--ctl i');
    if (!cells?.length) return;
    requestAnimationFrame(() => requestAnimationFrame(() => cells.forEach((el, k) => el.classList.toggle('on', k < n))));
  }

  waffle(n, cls, empty) {
    let s = '';
    for (let k = 0; k < 100; k++) s += `<i class="${k < n ? 'on' : ''}" style="--k:${k < n ? k : 100 - k}"></i>`;
    return `<span class="cs-waf ${cls}${empty ? ' cs-waf--empty' : ''}" aria-hidden="true">${s}</span>`;
  }

  paint() {
    if (!this.root) return;
    const s = this.stepIndex ?? 0, live = s >= 1, cur = this.src ? byId(this.src) : null;
    const prompt = s === 0
      ? '<p class="cs-note">The cases are fixed. Only the controls will change.</p>'
      : s === 2 && !(this.tried.includes('pop') && this.tried.includes('hosp'))
        ? promptHtml('Select General population, then Hospital patients.', { key: 'prompt' })
        : promptHtml(cur ? 'Select another source to switch the controls.' : 'Select a control source.', { key: 'prompt', done: !!cur && s >= 2 });
    // A source already tried keeps its gap on its chip, so two sources can be read together.
    const chips = chipsHtml(SOURCES.map((x) => ({ label: this.tried.includes(x.id) ? `${x.name} · gap ${CASES - x.share}` : x.name, action: 'src', value: x.id, pressed: this.src === x.id, disabled: !live })), { label: 'Control source, with the gap for each source tried' });
    const gap = cur ? CASES - cur.share : null;
    const grids = '<div class="cs-grids">'
      + `<div class="cs-grp"><span class="spn-label">Cases (illustrative)</span>${this.waffle(CASES, 'cs-waf--case')}<p><b>60</b> of 100 smoke</p></div>`
      + `<div class="cs-grp"><span class="spn-label">${cur ? `Controls: ${cur.name.toLowerCase()}` : 'Controls'}</span>${this.waffle(cur ? (this.fromShare ?? cur.share) : 0, 'cs-waf--ctl', !cur)}<p>${cur ? `<b>${cur.share}</b> of 100 smoke` : 'none chosen yet'}</p></div>`
      + readoutHtml({ key: 'gap', label: 'Gap, points', value: gap == null ? '–' : String(gap), formula: cur ? `60 − ${cur.share} = <b>${gap}</b>` : 'cases minus controls', size: 'sm' })
      + '</div>';
    const catchLine = cur
      ? `<p class="cs-catch" aria-live="polite"><b>The catch:</b> ${cur.catch}</p>`
      : `<p class="cs-catch cs-catch--wait" aria-live="polite">${live ? 'Each source has its own catch.' : 'Controls must be free of the disease and like the cases in everything else.'}</p>`;
    const take = s >= 3 ? takeawayHtml('Same cases, different controls, a different answer.', 'Controls from more than one source guard against the bias any one source brings.') : '';
    this.render({ html: `<div class="spn cs">${prompt}${chips}${grids}${catchLine}${take}</div>` });
  }

  testState() {
    const cur = this.src ? byId(this.src) : null;
    return { beat: this.stepIndex, src: this.src, share: cur ? cur.share : null, gap: cur ? CASES - cur.share : null, tried: [...this.tried] };
  }
}
