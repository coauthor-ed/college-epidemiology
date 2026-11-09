/**
 * CohortFrameScene - analytical-epidemiology L05 s03 (blk-l05-s03). Table 16 built out of people first.
 * Beat 0: two pools of well men, 200 exposed (the study cohort) and 400 unexposed (the control cohort),
 * one dot per 10 men, all neutral. Beat 1: a follow-up rule runs across the pools and the cases appear:
 * 2 of the 20 exposed dots (20 men) and 1 of the 40 unexposed dots (10 men) turn into cases. Beat 2: the
 * dots sort into the four cells of the 2x2 table, a 20, b 180, c 10, d 390, with the row totals 200 and 400
 * (the denominators a case-control table never had). Beat 3: the row heads are chips; selecting a row posts
 * its incidence as a worked step, 20 / 200 = 100 per 1,000 and 10 / 400 = 25 per 1,000; once both are read,
 * the relative risk lands as a stacked fraction, 100 / 25 = 4.00. Illustrative counts (the slide says so).
 * Cases are the focal group (signature colour); well men are neutral grey.
 * Built on the editorial panel parts (kit/SimPanel.js): rule table with row picking, calc steps, prompt.
 */
import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { withBeats } from 'simulations/base/DomBeats.js';
import { SIM_PANEL_CSS, ruleTableHtml, calcStepsHtml, promptHtml, takeawayHtml, countValue, overHtml, bindPanel } from 'simulations/base/kit/SimPanel.js';
import { rowFromCounts, fmtRatio } from './CohortFrame.js';

const MAP = [0, 1, 2, 3].map((i) => [{ idx: i, dwellMs: null }]);
const PER_DOT = 10;
const ROWS = [
  { key: 'exp', label: 'Exposed', pool: 'Exposed: the study cohort', ...rowFromCounts(20, 200), caseDots: [3, 14] },
  { key: 'unexp', label: 'Not exposed', pool: 'Not exposed: the control cohort', ...rowFromCounts(10, 400), caseDots: [27] },
];
const RR = ROWS[0].incidencePer1000 / ROWS[1].incidencePer1000; // 100 / 25 = 4.00
const RUN_S = 2.4;                                               // the follow-up rule runs this long

const CSS = SIM_PANEL_CSS + `
.cf { gap: var(--sim-space-3); }
.cf-pools { display: flex; flex-direction: column; gap: var(--sim-space-4); padding-top: var(--sim-space-2); }
.cf-pool { display: flex; flex-direction: column; gap: var(--sim-space-2); }
.cf-pool__head { display: flex; justify-content: space-between; align-items: baseline; gap: var(--sim-space-3); border-bottom: 1px solid var(--sim-label); padding-bottom: 4px; }
.cf-pool__n { font-variant-numeric: lining-nums tabular-nums; color: var(--sim-label-muted); font-size: var(--sim-text-sm); }
.cf-dots { display: flex; flex-wrap: wrap; gap: 7px; }
.cf-dot { width: 16px; height: 16px; border-radius: 50%; background: var(--sim-series-8); }
.cf-dot--case { background: var(--sim-annot); box-shadow: 0 0 0 3px var(--sim-annot-tint); }
.cf-run .cf-dot--case { animation: cf-turn 0.35s ease-out both; animation-delay: var(--at); }
@keyframes cf-turn { from { background: var(--sim-series-8); box-shadow: 0 0 0 0 var(--sim-annot-tint); } }
.cf-clock { display: flex; flex-direction: column; gap: 4px; }
.cf-clock__track { position: relative; height: 3px; background: var(--sim-track); }
.cf-clock__fill { position: absolute; inset: 0 auto 0 0; width: 0; background: var(--sim-annot); }
.cf-clock--done .cf-clock__fill { width: 100%; }
.cf-run .cf-clock__fill { animation: cf-sweep ${RUN_S}s linear both; }
@keyframes cf-sweep { from { width: 0; } to { width: 100%; } }
.cf-clock__t { display: flex; justify-content: space-between; font-size: var(--sim-text-sm); color: var(--sim-label-muted); }
.cf-key { display: flex; flex-wrap: wrap; gap: var(--sim-space-2) var(--sim-space-5); margin: 0; font-size: var(--sim-text-sm); color: var(--sim-label-muted); }
.cf-key span { display: inline-flex; align-items: center; gap: 8px; }
.cf-key i { display: inline-block; width: 12px; height: 12px; border-radius: 50%; background: var(--sim-series-8); }
.cf-key i.cf-key--case { background: var(--sim-annot); }
.cf-cell { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; }
.cf-cell .cf-dots { gap: 3px; justify-content: flex-end; max-width: 150px; }
.cf-cell .cf-dot { width: 8px; height: 8px; box-shadow: none; }
.cf-in .cf-cell .cf-dot { animation: cf-in 0.3s ease-out both; animation-delay: calc(var(--i) * 0.012s); }
@keyframes cf-in { from { opacity: 0; transform: scale(0.3); } }
.cf .spn-table td.cf-case { color: var(--sim-annot); font-weight: 700; }
.cf .spn-calc__row { grid-template-columns: 6.6em minmax(0, 1fr); padding-top: 9px; padding-bottom: 9px; }
.cf { --spn-fx-size: 24px; }
.cf-q { color: var(--sim-label-muted); }
.cf .spn-calc__row--now .spn-calc__g { display: block; }
.cf .spn-calc__row--done .spn-calc__g, .cf .spn-calc__row--todo .spn-calc__g { display: none; }
.sim-dom-root--portrait .cf .spn-calc__row { grid-template-columns: minmax(0, 1fr); }
.sim-dom-root--portrait .cf-cell .cf-dots { max-width: 96px; }
.sim-dom-root--portrait .cf .spn-table th, .sim-dom-root--portrait .cf .spn-table td { padding: 8px 8px; }
`;

export class CohortFrameScene extends withBeats(DomSimulation) {
  static WIDTH = 500;
  static HEIGHT = 530;
  static PORTRAIT_WIDTH = 360;
  static PORTRAIT_HEIGHT = 700;
  static LAYOUT = 'fit';
  static SETTING = 'none';
  static BEAT_STEP_MAP = MAP;
  static CONTROLS = [];
  static NOTES = ['Illustrative counts. One dot stands for 10 men.'];
  static ARIA_LABEL = 'Illustrative cohort, one dot for 10 men. 200 exposed men and 400 unexposed men, all free of the disease, are followed forward; 20 exposed men and 10 unexposed men become cases. The men sort into a 2 by 2 table: a 20, b 180, c 10, d 390, row totals 200 and 400. Select a row to read its incidence: 20 of 200 is 100 per 1,000, 10 of 400 is 25 per 1,000. The relative risk is 100 over 25, 4.00.';

  async setup() {
    this._reset();
    await super.setup();
    this.render({ css: CSS, rootClass: 'spn-page', html: '' });
    bindPanel(this.root, { action: (name, v) => this.act(name, v) });
    this.paint();
  }

  _reset() { this.sel = null; this.read = [false, false]; this._fresh = -1; this._rrFresh = false; }

  onStep(step) {
    this._reset();
    this._run = step === 1;
    this._sort = step === 2;
    this.paint();
  }

  act(name, v) {
    if (name !== 'pick' || (this.stepIndex ?? 0) < 3) return;
    const r = Number(v);
    if (r !== 0 && r !== 1) return;
    this.sel = r;
    if (!this.read[r]) {
      this.read[r] = true;
      this._fresh = r;
      if (this.read[0] && this.read[1]) this._rrFresh = true;
    }
    this._run = false; this._sort = false;
    this.paint();
  }

  dots(row, small) {
    const n = row.total / PER_DOT, cases = new Set(row.caseDots);
    return Array.from({ length: n }, (_, i) => {
      const isCase = cases.has(i);
      return { isCase, at: isCase ? (0.5 + (i / n) * (RUN_S - 0.8)) : 0, i };
    }).filter((d) => small == null || d.isCase === small);
  }

  dotsHtml(list, swept) {
    return `<span class="cf-dots" aria-hidden="true">${list.map((d) => `<i class="cf-dot${d.isCase && swept ? ' cf-dot--case' : ''}" style="--at:${d.at.toFixed(2)}s;--i:${d.i}"></i>`).join('')}</span>`;
  }

  poolsHtml(swept) {
    const pools = ROWS.map((r) => `<div class="cf-pool"><div class="cf-pool__head"><span class="spn-label">${r.pool}</span>`
      + `<span class="cf-pool__n">${r.total} men${swept ? `, ${r.cases} cases` : ''}</span></div>${this.dotsHtml(this.dots(r), swept)}</div>`).join('');
    const clock = `<div class="cf-clock${swept ? ' cf-clock--done' : ''}"><span class="cf-clock__track"><span class="cf-clock__fill"></span></span>`
      + `<span class="cf-clock__t"><span>Entry: nobody ill</span><span>Follow-up${swept ? ': outcomes known' : ''}</span></span></div>`;
    const key = `<p class="cf-key"><span><i></i>10 men, well</span>${swept ? '<span><i class="cf-key--case"></i>10 men who became cases</span>' : ''}</p>`;
    return `<div class="cf-pools">${pools}${clock}${key}</div>`;
  }

  tableHtml(pick) {
    const cell = (row, isCase, tag) => {
      const n = isCase ? row.cases : row.total - row.cases;
      if (pick) return { v: n, tag };
      return { html: `<span class="cf-cell"><span>${n}<sup>${tag}</sup></span>${this.dotsHtml(this.dots(row, isCase), true)}</span>` };
    };
    return ruleTableHtml({
      corner: 'After follow-up',
      cols: [{ label: 'Cases' }, { label: 'Stayed well' }, { label: 'Total' }],
      rows: ROWS.map((r, i) => ({ label: r.label, cells: [cell(r, true, i ? 'c' : 'a'), cell(r, false, i ? 'd' : 'b'), { v: r.total, tag: i ? 'c+d' : 'a+b' }] })),
      pick: pick ? 'row' : null,
      sel: pick && this.sel != null ? this.sel : null,
      label: 'Illustrative cohort: cases and men who stayed well, by exposure',
    });
  }

  stepsHtml() {
    const st = (i) => (!this.read[i] ? 'todo' : this.sel === i ? 'now' : 'done');
    const both = this.read[0] && this.read[1];
    const inc = (r, i) => ({
      label: r.label,
      parts: [{ html: `${overHtml(String(r.cases), String(r.total))} \u00d7 1,000` }, this.read[i] ? { v: `${r.incidencePer1000.toFixed(0)} per 1,000` } : { html: '<span class="cf-q">?</span>' }],
      state: st(i), fresh: this._fresh === i,
    });
    return calcStepsHtml([
      inc(ROWS[0], 0),
      inc(ROWS[1], 1),
      { label: 'Relative risk', parts: both ? ['RR', { n: '100', d: '25' }, { v: fmtRatio(RR, 2), key: 'rr' }] : ['RR', { n: 'incidence, exposed', d: 'incidence, not exposed' }],
        gloss: 'Exposed incidence over unexposed incidence.', state: both ? 'now' : 'todo', fresh: this._rrFresh },
    ], { label: 'Incidence in each row, then their ratio' });
  }

  paint() {
    if (!this.root) return;
    const s = this.stepIndex ?? 0;
    let html;
    if (s <= 1) {
      html = `<div class="spn cf${this._run ? ' cf-run' : ''}">${this.poolsHtml(s === 1)}</div>`;
    } else if (s === 2) {
      html = `<div class="spn cf${this._sort ? ' cf-in' : ''}">${this.tableHtml(false)}`
        + takeawayHtml('The row totals are the denominators:', '200 and 400 men, all followed from a disease-free start.') + '</div>';
    } else {
      const both = this.read[0] && this.read[1];
      const prompt = !this.read[0] && !this.read[1] ? promptHtml('Select the Exposed row')
        : !both ? promptHtml(this.read[0] ? 'Now select the Not exposed row' : 'Now select the Exposed row')
          : promptHtml('Both incidences read. Select a row to see its step again.', { done: true });
      html = `<div class="spn cf">${prompt}${this.tableHtml(true)}${this.stepsHtml()}</div>`;
    }
    this.render({ html });
    this._fresh = -1;
    if (this._rrFresh) { this._rrFresh = false; countValue(this.root, 'rr', RR, { from: 1, fmt: (v) => fmtRatio(v, 2), dur: 0.7 }); }
  }

  testState() {
    return { beat: this.stepIndex, read: [...this.read], sel: this.sel, rr: this.read[0] && this.read[1] ? fmtRatio(RR, 2) : '' };
  }
}
