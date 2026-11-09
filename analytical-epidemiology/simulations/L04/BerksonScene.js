/**
 * BerksonScene - L04 s05 "The hospital door can create an association" (illustrative numbers).
 * Rebuilt 2026-11-05 on the editorial panel parts (kit/SimPanel.js). A town of 2,000 in which the
 * exposure and the disease have no link (a 100, b 900, c 100, d 900; odds ratio 1.00) is drawn as a
 * door table: one row per cell, the town count, that group's chance of admission (a bar), and how many
 * pass through into the hospital. Three sliders set the admission chances: with the disease (pD),
 * among the exposed (pE), for other complaints (pC). Chances per cell (the stub's arithmetic, exact
 * expected counts, never a random draw): a = pD + pE - pD x pE (two routes in), b = pE, c = pD, d = pC.
 * "Draw the hospital sample" fills the hospital column and the hospital odds ratio counts up; at the
 * defaults (40, 20, 40 per cent): 52, 180, 40, 360, so (52 x 360) / (180 x 40) = 2.60 against the
 * town's 1.00. A slider moved after a draw dims the hospital column until the next draw.
 *   Beat 0 and 1: sliders live, hospital column empty until the press.
 *   Beat 2: a fresh mount posts the default sample; the take-away line names what built the ratio.
 * Row a (exposed with the disease, the one group with two routes in) is the focal row: signature colour.
 */
import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withBeats } from 'simulations/base/DomBeats.js';
import { SIM_PANEL_CSS, sliderHtml, ruleTableHtml, readoutHtml, setReadout, buttonsHtml, promptHtml, takeawayHtml, setText, bindPanel } from 'simulations/base/kit/SimPanel.js';
import { fmtNum } from 'simulations/base/kit/SimText.js';

const TOWN = { a: 100, b: 900, c: 100, d: 900 };
const DIALS = [
  { id: 'pD', min: 10, max: 60, step: 5, v: 40, lab: 'With the disease' },
  { id: 'pE', min: 10, max: 60, step: 5, v: 20, lab: 'Among the exposed' },
  { id: 'pC', min: 5, max: 60, step: 5, v: 40, lab: 'Other complaints' },
];
const ROWS = [
  { k: 'a', label: 'Exposed, diseased' },
  { k: 'b', label: 'Exposed, not diseased' },
  { k: 'c', label: 'Unexposed, diseased' },
  { k: 'd', label: 'Unexposed, not diseased' },
];
const X = '×';
const chancesOf = (p) => {
  const pD = p.pD / 100, pE = p.pE / 100, pC = p.pC / 100;
  return { a: pD + pE - pD * pE, b: pE, c: pD, d: pC };
};
const countsOf = (p) => {
  const ch = chancesOf(p);
  return { a: Math.round(TOWN.a * ch.a), b: Math.round(TOWN.b * ch.b), c: Math.round(TOWN.c * ch.c), d: Math.round(TOWN.d * ch.d) };
};
const orOf = (k) => (k.a * k.d) / (k.b * k.c);
const n = (v) => fmtNum(v, { indian: true });
const pct = (v) => `${Math.round(v * 100)}%`;
const MAP = [0, 1, 2].map((i) => [{ idx: i, dwellMs: null }]);

const CSS = SIM_PANEL_CSS + `
.bk { gap: 10px; }
.bk .spn-slider__ticks { display: none; }
.bk-dials { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: var(--sim-space-3); }
.sim-dom-root:not(.sim-dom-root--portrait) .bk-dials .spn-label { white-space: nowrap; }
.bk-dials .spn-slider__head { gap: 4px; }
.bk-dials .spn-slider__val { font-size: 20px; }
.bk .spn-table td, .bk .spn-table th { padding: 3px 8px; }
.bk .spn-table sup { font-size: 13px; }
.bk-foot .spn-take { padding: 6px 0; }
.bk .spn-table tbody th { white-space: nowrap; }
.bk-k { margin: 0 0 calc(-1 * var(--sim-space-2)); }
.bk .spn-table tbody th { font-weight: 600; }
.bk .spn-table tbody th sup { color: var(--sim-annot); font-weight: 700; margin-left: 2px; }
.bk-door { display: flex; align-items: center; justify-content: flex-end; gap: var(--sim-space-2); font-family: var(--sim-font); font-size: var(--sim-text-md); }
.bk-bar { position: relative; display: inline-block; width: 92px; height: 10px; background: var(--sim-track); border-radius: 2px; overflow: hidden; }
.bk-bar > i { position: absolute; inset: 0 auto 0 0; width: calc(var(--v) * 100%); background: var(--sim-label-muted); transition: width 0.3s ease; }
.bk-row-a .bk-bar > i { background: var(--sim-annot); }
.bk-row-a th, .bk-row-a .bk-door b { color: var(--sim-annot); }
.bk-door b { min-width: 2.6em; text-align: right; font-weight: 700; font-variant-numeric: tabular-nums; }
.bk-q { color: var(--sim-label-muted); }
.bk-stale { opacity: 0.4; }
.bk .spn-split { align-items: stretch; }
.bk .spn-read { gap: 2px; border-top: 1px solid var(--sim-label); padding-top: var(--sim-space-2); }
.bk .spn-read__n { font-size: 40px; }
.bk .spn-read__row { min-height: 0; }
.bk-foot { display: flex; align-items: center; justify-content: space-between; gap: var(--sim-space-3); }
.bk-foot .spn-cap, .bk-foot .spn-take { margin: 0; flex: 1 1 auto; }
.bk-foot .spn-btn { white-space: nowrap; }
.sim-dom-root--portrait .bk { gap: var(--sim-space-2); }
.sim-dom-root--portrait .bk-k { display: none; }
.sim-dom-root--portrait .bk-dials { gap: var(--sim-space-2); }
.sim-dom-root--portrait .bk-dials .spn-slider { gap: 0; }
.sim-dom-root--portrait .bk-dials .spn-slider__head { flex-direction: column; align-items: flex-start; gap: 2px; }
.sim-dom-root--portrait .bk-dials .spn-label { font-size: var(--sim-text-sm); line-height: 1.2; min-height: 2.4em; }
.sim-dom-root--portrait .bk-dials .spn-slider__val { font-size: 20px; }
.sim-dom-root--portrait .bk-bar { display: none; }
.sim-dom-root--portrait .bk .spn-table tbody th { white-space: normal; }
.sim-dom-root--portrait .bk .spn-split { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: var(--sim-space-3); }
.sim-dom-root--portrait .bk .spn-read__f { font-size: var(--sim-text-sm); }
.sim-dom-root--portrait .bk-foot .spn-cap, .sim-dom-root--portrait .bk-foot .spn-take { display: none; }
.sim-dom-root--portrait .bk .spn-table td, .sim-dom-root--portrait .bk .spn-table th { padding: 4px 5px; }
.sim-dom-root--portrait .bk .spn-table tbody th { font-size: var(--sim-text-sm); }
.sim-dom-root--portrait .bk .spn-read__n { font-size: 36px; }
.sim-dom-root--portrait .bk-foot { justify-content: flex-start; }
.sim-dom-root--portrait .bk .spn-slider__ticks { display: none; }
`;

export class BerksonScene extends withBeats(DomSimulation) {
  static WIDTH = 580;
  static HEIGHT = 546;
  static PORTRAIT_WIDTH = 360;
  static PORTRAIT_HEIGHT = 650;
  static LAYOUT = 'fit';
  static SETTING = 'none';
  static BEAT_STEP_MAP = MAP;
  static CONTROLS = [];
  static ARIA_LABEL = 'Illustrative: a town of 2,000 in which exposure and disease have no link. 100 exposed people have the disease and 900 do not; 100 unexposed people have it and 900 do not; the town odds ratio is 1.00. Three sliders set admission chances: with the disease, among the exposed, for other complaints. Exposed people with the disease have two routes in, so their chance is the highest. Draw the hospital sample: at the defaults 52, 180, 40 and 360 people are admitted, and the hospital odds ratio is 52 times 360 over 180 times 40, 2.60, while the town still reads 1.00.';

  async setup() {
    this._p = Object.fromEntries(DIALS.map((d) => [d.id, d.v]));
    this._drawn = null; this._stale = false; this._fresh = false;
    await super.setup();
    this.render({ css: CSS, rootClass: 'spn-page', html: '' });
    bindPanel(this.root, {
      input: (name, v) => this.onDial(name, v),
      action: (name) => { if (name === 'draw') this.draw(); },
    });
    this.paint();
  }

  onStep(step) {
    if (step === 2 && !this._drawn) { this._p = Object.fromEntries(DIALS.map((d) => [d.id, d.v])); this._drawn = countsOf(this._p); this._stale = false; }
    this.paint();
  }

  onDial(id, v) {
    const d = DIALS.find((x) => x.id === id);
    if (!d) return;
    const val = Math.max(d.min, Math.min(d.max, Math.round(Number(v) / d.step) * d.step));
    if (val === this._p[id]) return;
    this._p[id] = val;
    setText(this.root, `${id}-val`, `${val}%`);
    if (this._drawn) this._stale = true;
    const t = this.root.querySelector('[data-bk-table]');
    if (t) t.innerHTML = this.tableHtml();
    const pr = this.root.querySelector('[data-bk-prompt]');
    if (pr) pr.innerHTML = this.promptLine();
    const rd = this.root.querySelector('[data-bk-hosp]');
    if (rd) rd.classList.toggle('bk-stale', this._stale);
  }

  draw() {
    const from = this._drawn ? orOf(this._drawn) : 1;
    this._drawn = countsOf(this._p);
    this._stale = false;
    this.paint();
    setReadout(this.root, 'hosp', { value: orOf(this._drawn), from, fmt: (v) => v.toFixed(2), dur: 0.6 });
  }

  promptLine() {
    if (!this._drawn) return promptHtml('Set the three chances, then press Draw the hospital sample');
    if (this._stale) return promptHtml('Settings changed: draw the hospital sample again');
    return promptHtml('Move a slider and draw again to see which setting builds the ratio', { done: true });
  }

  tableHtml() {
    const ch = chancesOf(this._p), k = this._drawn, st = this._stale;
    const rows = ROWS.map((r) => ({
      label: r.label,
      cells: [
        { v: n(TOWN[r.k]), tag: r.k },
        { v: '', html: `<span class="bk-door"><span class="bk-bar"><i style="--v:${ch[r.k].toFixed(3)}"></i></span><b>${pct(ch[r.k])}</b></span>` },
        k ? { v: '', html: `<span class="${st ? 'bk-stale' : ''}">${n(k[r.k])}</span>` } : { v: '', html: '<span class="bk-q">?</span>' },
      ],
    }));
    const sum = k ? k.a + k.b + k.c + k.d : null;
    const html = ruleTableHtml({
      cols: [{ label: 'In town' }, { label: 'Chance admitted' }, { label: 'In hospital' }],
      rows,
      total: { label: 'Town and hospital', cells: [n(2000), '', sum != null ? n(sum) : '?'] },
      label: 'Town counts, admission chance and hospital counts for each of the four groups',
    });
    // Tint the focal row (a): the one group with two routes in.
    return html.replace('<tbody><tr>', '<tbody><tr class="bk-row-a">');
  }

  paint() {
    if (!this.root) return;
    const s = this.stepIndex ?? 0, k = this._drawn;
    const dials = `<p class="spn-kicker bk-k">Chance of admission (illustrative)</p><div class="bk-dials">${DIALS.map((d) => sliderHtml({ action: d.id, label: d.lab, min: d.min, max: d.max, step: d.step, value: this._p[d.id], valueText: `${this._p[d.id]}%`,
      ticks: [`${d.min}%`, `${d.max}%`], aria: `${this._p[d.id]} per cent` })).join('')}</div>`;
    const town = readoutHtml({ key: 'town', label: 'Town odds ratio', value: '1.00', formula: `(100 ${X} 900) / (900 ${X} 100)`, tone: 'label' });
    const hosp = k
      ? readoutHtml({ key: 'hosp', label: 'Hospital odds ratio', value: orOf(k).toFixed(2), formula: `(${k.a} ${X} ${k.d}) / (${k.b} ${X} ${k.c})`, tone: 'annot' })
      : readoutHtml({ key: 'hosp', label: 'Hospital odds ratio', value: '?', formula: 'press Draw to fill', tone: 'label-muted' });
    const btn = buttonsHtml([{ label: 'Draw the hospital sample', action: 'draw', primary: true }]);
    const take = s === 2 && k ? takeawayHtml('Nothing in the town changed; the door built the association.', 'No matching can undo it.') : '';
    const foot = `<div class="bk-foot">${take || '<p class="spn-cap">Exact expected counts, not a random draw: same settings, same sample.</p>'}${btn}</div>`;
    this.render({ html: `<div class="spn bk"><div data-bk-prompt>${this.promptLine()}</div>${dials}<div data-bk-table>${this.tableHtml()}</div>`
      + `<div class="spn-split">${town}<div data-bk-hosp class="${this._stale ? 'bk-stale' : ''}">${hosp}</div></div>${foot}</div>` });
  }

  testState() {
    const k = this._drawn;
    return { beat: this.stepIndex, ...this._p, drawn: !!k, hosp: k ? { ...k, or: orOf(k).toFixed(2) } : null, town: '1.00', stale: this._stale };
  }
}
