/**
 * CohortFrameScene - blk-l05-s03: a cohort table built out of people (illustrative numbers). One dot = one man.
 * Blue = became a case; grey = stayed well; FILLED = exposed, HOLLOW = not exposed.
 *   beat 1 (cue dayone)  200 exposed men (the study cohort) above 400 unexposed men (the control cohort),
 *                        all grey: nobody ill on day one
 *   beat 2 (cue years)   the years run (learner: "Let the years run"): 20 exposed and 10 unexposed men turn blue
 *   beat 3 (cue table)   the men sort into Table 16 (learner: "Sort into the table"): rows exposed / unexposed,
 *                        columns cases / stayed well: a 20, b 180, c 10, d 390; letters and the margins
 *                        a+b = 200, c+d = 400 come last
 *   beat 4 (cue rr)      the learner taps each row to post its incidence: 20/200 = 100 per 1,000,
 *                        10/400 = 25 per 1,000, then RR = 100 / 25 = 4.00, large. A cold landing shows both posted.
 * Every beat lands at rest on its finished picture; controls and cues replay the move.
 */
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { SIM_CROWD_CSS, crowdLive, legendHtml, countOf } from 'simulations/base/kit/SimCrowd.js';
import { flowChipHtml, bindFlow } from 'simulations/base/kit/SimFlowDom.js';
import { withNarrationCues } from '../L01/NarrationCues.js';
import { na, tagFirst, tagLive } from '../L03/NarrTags.js';
import { narrOn, narrDotsCss } from './NarrDots.js';

const YEARS = 10;   // a follow-up clock for the run (the slide names no length; no year is printed as data)
const MEN = [
  ...Array.from({ length: 200 }, (_, i) => ({ id: `e${i}`, exposed: true, onset: i % 10 === 3 ? 1 + ((i * 7) % YEARS) : null })),
  ...Array.from({ length: 400 }, (_, i) => ({ id: `u${i}`, exposed: false, onset: i % 40 === 17 ? 1 + ((i * 3) % YEARS) : null })),
];
const A = countOf(MEN, (p) => p.exposed && p.onset != null), B = 200 - A;
const C = countOf(MEN, (p) => !p.exposed && p.onset != null), D = 400 - C;
const I1 = (1000 * A) / (A + B), I0 = (1000 * C) / (C + D), RR = I1 / I0;   // 100, 25, 4.00
const fmt = (n) => n.toLocaleString('en-US');

const span = (x, y, html, cls, n = '') => `<span class="cf-lab ${cls}"${na(n)} style="left:${x.toFixed(1)}px;top:${y.toFixed(1)}px">${html}</span>`;
const newLay = (r, step) => ({ r, step, pos: new Map(), boxOf: new Map(), boxes: [], rules: [] });
function grid(lay, list, x0, y0, cols, step, box) {
  list.forEach((p, i) => { lay.pos.set(p.id, { x: x0 + step * (i % cols + 0.5), y: y0 + step * (Math.floor(i / cols) + 0.5) }); lay.boxOf.set(p.id, box); });
  return Math.ceil(list.length / cols) * step;
}

class CohortFrameBase extends SvgScene {}

export class CohortFrameScene extends withNarrationCues(CohortFrameBase) {
  static BEAT_STEP_MAP = [0, 1, 2, 3].map((i) => [{ idx: i, dwellMs: null }]);
  static ARIA_LABEL = 'A cohort table built from people, one dot per man: 200 exposed men and 400 unexposed men, nobody ill. Over the years 20 exposed and 10 unexposed men become cases. They sort into a 2 by 2 table, a 20, b 180, c 10, d 390, margins 200 and 400. Incidence 20 of 200 is 100 per 1,000; 10 of 400 is 25 per 1,000; relative risk 4.00.';
  static CONTROLS = [];
  static SETTING = 'none';
  static HEIGHT = 610;
  static PORTRAIT_HEIGHT = 790;
  // Narration focus (spec W1 D29n): data-narr ids exposed / unexposed (head and dots, beats 1-2), clock, cap,
  // erow / urow (row name, cell labels and dots, beats 3-4), cell-a..d (one cell's label and dots), margins
  // (mar-ab / mar-cd: one row's margin), read0, read1, rr, chips (beat 4 row chips);
  // legend, the run and sort chips and the later caption hidden while narrated. Narrated, beat 4 posts its rows at
  // show.read0 / show.read1 (the narration's words), not on the scene's own timer.
  static CUES = ['dayone', 'years', 'table', 'rr', 'show.read0', 'show.read1'];

  /** Narration focus contract (content-block): only the narrated flag is kept; the engine dims and holds the tagged parts. */
  narrationFocus(f) { this.cfNarr = !!f?.narrated; narrOn(this, f); }

  async setup() {
    this.cfs = { year: YEARS, gen: 0, came: null, last: null, from: null, late: false, posted: [true, true], land: [false, false] };
    await super.setup();
    bindFlow(this.root, {
      action: (name, value) => {
        if (name === 'years') { this.runYears(); this.interactDone?.('years'); }
        else if (name === 'sort') { this.runSort(); this.interactDone?.('table'); }
        else if (name === 'row') { this.post(Number(value)); }
      },
    });
  }

  enter(step) {
    const s = this.cfs;
    s.came = s.prevShown != null && s.prevShown === step - 1 ? s.prevShown : null;   // setup's own enter(0) is not history
    s.last = step;
    s.gen++;
    s.year = step === 0 ? 0 : YEARS;
    s.from = null; s.late = false; s.land = [false, false];
    s.posted = [true, true];
    if (step === 2 && s.came === 1) { s.from = 'groups'; s.late = true; }
    if (step === 3 && s.came === 2 && this.cfNarr) s.posted = [false, false];
    else if (step === 3 && s.came === 2) {
      // Rest is both posted; stepping forward from the table posts the rows by themselves (taps replay).
      s.from = 'table';
      this.after(0.6, () => { s.posted = [false, false]; this.repaint(); });
      this.after(1.6, () => { s.posted = [true, false]; s.land = [true, false]; this.repaint(); });
      this.after(2.6, () => { s.posted = [true, true]; s.land = [false, true]; this.repaint(); });
      this.after(3.8, () => { s.land = [false, false]; });
    }
    this.after(3.5, () => { s.late = false; s.from = null; });
  }

  onBeatChange(beat, count) {
    const s = this.cfs;
    s.prevShown = s.shown ?? null;
    super.onBeatChange(beat, count);
    s.shown = this.stepIndex;
  }

  stageHeight(st) {
    const k = this.stepIndex ?? 0;
    if (st.portrait) return [616, 616, 650, 662][k];
    return [410, 410, 480, 500][k];
  }

  runYears() {
    const s = this.cfs, g = ++s.gen;
    s.year = 0;
    this.repaint();
    for (let y = 1; y <= YEARS; y++) this.after(0.42 * y, () => { if (s.gen !== g) return; s.year = y; this.repaint(); });
  }

  runSort() {
    const s = this.cfs;
    s.gen++; s.from = 'groups'; s.late = true;
    this.repaint();
    this.after(3.5, () => { s.late = false; s.from = null; });
  }

  post(i) {
    const s = this.cfs;
    if (this.stepIndex !== 3) return;
    const was = s.posted[0] && s.posted[1];
    if (was) s.posted = [false, false];   // both up already: a tap starts the reading again
    s.posted[i] = true; s.land[i] = true;
    this.repaint();
    this.after(1.2, () => { s.land[i] = false; });
    if (s.posted[0] && s.posted[1]) { this.interactDone?.('rr'); if (!s.cheered) { s.cheered = true; this.after(0.9, () => this.celebrate()); } }
  }

  applyCue(id) {
    const s = this.cfs, k = this.stepIndex;
    if (id === 'dayone' && k === 0) { s.gen++; s.year = 0; this.repaint(); }
    else if (id === 'years' && k === 1) this.runYears();
    else if (id === 'table' && k === 2) this.runSort();
    else if ((id === 'show.read0' || id === 'show.read1') && k === 3) {
      const i = id === 'show.read0' ? 0 : 1;
      if (!s.posted[i]) { s.posted[i] = true; s.land[i] = true; this.repaint(); this.after(1.2, () => { s.land[i] = false; }); }
    }
    else if (id === 'rr' && k === 3 && !(s.posted[0] && s.posted[1])) { s.posted = [true, true]; s.land = [true, true]; this.repaint(); this.after(1.2, () => { s.land = [false, false]; }); }
  }

  cueBase() { return { posted: [...this.cfs.posted] }; }
  cueReset(base) {
    const s = this.cfs, k = this.stepIndex;
    s.gen++; s.year = k === 0 ? 0 : YEARS; s.from = null; s.late = false;
    if (base) s.posted = [...base.posted];
    this.repaint();
  }

  /** Beats 1-2: the two cohorts as row bands, one dot size for both. */
  groupsOf(st) {
    const P = st.portrait, W = st.W;
    const cols = P ? 24 : 40, step = Math.min(P ? 14 : 15.5, (W - 32) / cols), r = step * 0.36;
    const lay = newLay(r, step), x0 = (W - cols * step) / 2;
    const yE = P ? 140 : 92;
    const hE = grid(lay, MEN.filter((p) => p.exposed), x0, yE, cols, step, 'E');
    const yU = yE + hE + (P ? 62 : 44);
    grid(lay, MEN.filter((p) => !p.exposed), x0, yU, cols, step, 'U');
    lay.heads = [[x0, yE - 10, 'E'], [x0, yU - 10, 'U']];
    return lay;
  }

  /** Beats 3-4: Table 16 built from the same men. */
  tableOf(st, compact) {
    const P = st.portrait, W = st.W;
    const lab = 28;   // room for the cell label above its dots
    if (P) {
      const cc = 3, wc = compact ? 22 : 19, gut = 14, step = Math.min(compact ? 11.5 : 14.5, (W - 32 - gut) / (cc + wc));
      const lay = newLay(step * 0.36, step), x0 = (W - (cc + wc) * step - gut) / 2, xw = x0 + cc * step + gut;
      const top = 8;
      const h1 = Math.max(Math.ceil(A / cc), Math.ceil(B / wc)) * step;
      const h2 = Math.max(Math.ceil(C / cc), Math.ceil(D / wc)) * step;
      const y1 = top + 30 + 26 + lab, y2 = y1 + h1 + 14 + 26 + lab;
      const pick = (ex, ill) => MEN.filter((p) => p.exposed === ex && (p.onset != null) === ill);
      grid(lay, pick(true, true), x0, y1, cc, step, 'a'); grid(lay, pick(true, false), xw, y1, wc, step, 'b');
      grid(lay, pick(false, true), x0, y2, cc, step, 'c'); grid(lay, pick(false, false), xw, y2, wc, step, 'd');
      lay.g = { P, x0, xw, cc, wc, gut, step, top, y1, y2, h1, h2, lab, right: xw + wc * step, bottom: y2 + h2 };
      return lay;
    }
    const head = 150, cc = 4, wc = 26, gut = 24, step = compact ? 12.5 : 15;
    const lay = newLay(step * 0.36, step), x0 = 20 + head, xw = x0 + cc * step + gut;
    const top = 8;
    const h1 = Math.max(Math.ceil(A / cc), Math.ceil(B / wc)) * step;
    const h2 = Math.max(Math.ceil(C / cc), Math.ceil(D / wc)) * step;
    const y1 = top + 30 + lab, y2 = y1 + h1 + 16 + lab;
    const pick = (ex, ill) => MEN.filter((p) => p.exposed === ex && (p.onset != null) === ill);
    grid(lay, pick(true, true), x0, y1, cc, step, 'a'); grid(lay, pick(true, false), xw, y1, wc, step, 'b');
    grid(lay, pick(false, true), x0, y2, cc, step, 'c'); grid(lay, pick(false, false), xw, y2, wc, step, 'd');
    lay.g = { P, x0, xw, cc, wc, gut, step, top, y1, y2, h1, h2, lab, right: xw + wc * step, bottom: y2 + h2 };
    return lay;
  }

  paint(st) {
    const k = this.stepIndex, s = this.cfs, P = st.portrait, W = st.W;
    let svg = '', over = '';
    const legend = legendHtml({ text: { ill: 'case', well: 'stayed well', exposed: 'exposed', unexposed: 'not exposed' } });
    const ill = (p) => p.onset != null && p.onset <= s.year;
    if (k <= 1) {
      const lay = this.groupsOf(st);
      this.lay = lay; this.from = null;
      this.people = MEN.map((p) => ({ ...p, ill: ill(p) }));
      const nE = countOf(this.people, (p) => p.exposed && p.ill), nU = countOf(this.people, (p) => !p.exposed && p.ill);
      const [[xE, yE], [xU, yU]] = lay.heads;
      const cnt = (n) => (k === 1 || n > 0 ? `<b class="cf-cnt">${n} ${n === 1 ? 'case' : 'cases'}</b>` : '');
      over += span(xE, yE, `<b>200 exposed men</b> <span class="cf-sub">the study cohort</span>${cnt(nE)}`, 'cf-head', 'exposed');
      over += span(xU, yU, `<b>400 unexposed men</b> <span class="cf-sub">the control cohort</span>${cnt(nU)}`, 'cf-head', 'unexposed');
      const clock = s.year === 0
        ? `<b class="sim-numeral cf-yr">Day one</b><span>nobody ill: nothing to count</span>`
        : `<b class="sim-numeral cf-yr">${s.year === YEARS ? 'Years later' : `Year ${s.year}`}</b><span>same conditions, same period</span>`;
      over += `<div class="cf-clock${P ? ' cf-clockp' : ''}"${na('clock')} style="left:${lay.heads[0][0]}px;top:6px">${clock}</div>`;
      over += span(W / 2, st.H - 24, 'one dot = one man', 'cf-cap', k === 0 ? 'cap' : '-');
      const head = (k === 1 ? tagFirst(flowChipHtml({ label: 'Let the years run', action: 'years', icon: 'replay' }), '-') : '') + tagFirst(legend, '-');
      return { svg, over, head };
    }
    const compact = k === 3;
    const lay = this.tableOf(st, compact);
    this.lay = lay;
    this.from = s.from === 'groups' ? this.groupsOf(st) : (s.from === 'table' ? this.tableOf(st, false) : null);
    const g = lay.g;
    const both = s.posted[0] && s.posted[1];
    this.people = MEN.map((p) => ({ ...p, ill: p.onset != null, lit: k === 3 && ((p.exposed && s.posted[0] && !both) || (!p.exposed && s.posted[1] && !both)) }));
    const late = s.late ? ' cf-late' : '';
    // The cross and the heads.
    const xr = g.x0 + g.cc * g.step + g.gut / 2;
    const yr = g.y1 + g.h1 + 8;
    if (P) svg += `<line class="cf-rule" x1="${xr}" y1="${g.y1 - g.lab}" x2="${xr}" y2="${g.y1 + g.h1}"/><line class="cf-rule" x1="${xr}" y1="${g.y2 - g.lab}" x2="${xr}" y2="${g.bottom + 6}"/>`;
    else svg += `<line class="cf-rule" x1="${xr}" y1="${g.top + 4}" x2="${xr}" y2="${g.bottom + 6}"/>`;
    svg += `<line class="cf-rule" x1="${P ? g.x0 - 6 : 20}" y1="${yr}" x2="${g.right + 4}" y2="${yr}"/>`;
    over += span(g.x0 + (g.cc * g.step) / 2, g.top + 8, 'cases', 'cf-col cf-ill');
    over += span(g.xw + (g.wc * g.step) / 2, g.top + 8, 'stayed well', 'cf-col');
    const rows = [
      { y: g.y1, name: 'exposed', m: `a+b = ${A + B}` },
      { y: g.y2, name: 'unexposed', m: `c+d = ${C + D}` },
    ];
    rows.forEach((r, i) => {
      const rn = i === 0 ? 'erow' : 'urow';
      if (P) over += span(g.x0 - 6, r.y - g.lab - 26, `<b${na(rn)}>${r.name}</b><span class="cf-m${late}"${na(`margins mar-${i ? 'cd' : 'ab'}`)}>${r.m}</span>`, 'cf-rowp');
      else over += span(g.x0 - 18, r.y - g.lab + 4, `<b${na(rn)}>${r.name}</b><span class="cf-m${late}"${na(`margins mar-${i ? 'cd' : 'ab'}`)}>${r.m}</span>`, 'cf-row');
    });
    const cells = [['a', A, g.x0, g.y1], ['b', B, g.xw, g.y1], ['c', C, g.x0, g.y2], ['d', D, g.xw, g.y2]];
    for (const [L, n, x, y] of cells) over += span(x, y - g.lab + 4, `<i class="cf-let${late}">${L}</i><b class="cf-n">${n}</b>`, 'cf-cell', `${L < 'c' ? 'erow' : 'urow'} cell-${L}`);
    if (k === 2) {
      over += span(W / 2, st.H - 24, 'one dot = one man', 'cf-cap', '-');
      return { svg, over, head: tagFirst(flowChipHtml({ label: 'Sort into the table', action: 'sort', icon: 'replay' }), '-') + tagFirst(legend, '-') };
    }
    // Beat 4: each row's incidence, then the ratio.
    const ry = g.bottom + (P ? 20 : 22);
    const line = (i, y) => {
      const on = s.posted[i], land = s.land[i] ? ' cf-land' : '';
      const [f, v] = i === 0 ? [`a/(a+b) = ${A}/${fmt(A + B)}`, I1] : [`c/(c+d) = ${C}/${fmt(C + D)}`, I0];
      const body = on ? `<span>${f} =</span><b class="sim-numeral cf-inc${land}">${fmt(Math.round(v))}</b><span>per 1,000</span>` : `<span class="cf-wait">${f} = ?</span>`;
      return `<div class="cf-read${on ? ' on' : ''}"${na(`read${i}`)} style="left:${P ? 16 : 20}px;top:${y}px">${P ? '' : `<b class="cf-rn">${i === 0 ? 'exposed' : 'unexposed'}</b>`}${body}</div>`;
    };
    over += line(0, ry) + line(1, ry + (P ? 42 : 44));
    const both2 = s.posted[0] && s.posted[1];
    const rrX = P ? 16 : W - 196, rrY = P ? ry + 84 : ry - 6;
    over += `<div class="cf-rr${P ? ' cf-rrp' : ''}${both2 ? ' on' : ''}${both2 && (s.land[0] || s.land[1]) ? ' cf-land' : ''}"${na('rr')} style="left:${rrX}px;top:${rrY}px">`
      + (both2 ? `<span>RR = ${fmt(I1)} / ${fmt(I0)} =</span><b class="sim-numeral cf-big">${RR.toFixed(2)}</b>` : `<span>RR = ? : post both rows</span>`) + '</div>';
    const head = tagFirst(flowChipHtml({ label: 'Exposed row', action: 'row', value: '0', icon: '' }), 'chips')
      + tagFirst(flowChipHtml({ label: 'Unexposed row', action: 'row', value: '1', icon: '' }), 'chips') + tagFirst(legend, '-');
    return { svg, over, head };
  }

  animate() {
    const s = this.cfs;
    crowdLive(this.live, `cf${s.gen}`, this.people, this.lay, { from: this.from, order: 'random', spread: this.from ? 1.6 : 0 });
    const k = this.stepIndex;
    tagLive(this.live, `cf${s.gen}`, this.people, (p) => (k <= 1 ? (p.exposed ? 'exposed' : 'unexposed') : `${p.exposed ? 'erow' : 'urow'} cell-${p.exposed ? (p.ill ? 'a' : 'b') : (p.ill ? 'c' : 'd')}`));
  }

  css() {
    return SIM_CROWD_CSS + narrDotsCss(['exposed', 'unexposed', 'erow', 'urow', 'cell-a', 'cell-b', 'cell-c', 'cell-d']) + `
.svs-head { gap: 10px 14px; }
.svs-head .scw-legend { font-size: 16px; justify-content: center; }
.sflow-chip { min-height: 44px; font-size: 16px; }
.cf-lab { position: absolute; white-space: nowrap; font: 600 16px/1.2 var(--sim-font); color: var(--sim-label); }
.cf-head { transform: translate(0, -100%); display: flex; align-items: baseline; gap: 8px; flex-wrap: wrap; font-size: 17px; }
.cf-sub { font-weight: 500; color: var(--sim-label-muted); }
.cf-cnt { color: var(--sim-annot); font-weight: 800; }
.cf-clock { position: absolute; display: flex; align-items: baseline; gap: 12px; flex-wrap: wrap; white-space: nowrap; font: 600 16px/1.2 var(--sim-font); color: var(--sim-label-muted); }
.cf-clockp { flex-direction: column; gap: 4px; }
.cf-yr { font: 400 36px/1 var(--sim-font-numeral); color: var(--sim-label); }
.cf-cap { transform: translate(-50%, 0); font: italic 500 16px/1.2 var(--sim-font); color: var(--sim-label-muted); }
.cf-col { transform: translate(-50%, 0); font-size: 18px; font-weight: 800; }
.cf-ill { color: var(--sim-annot); }
.cf-row { transform: translate(-100%, 0); display: flex; flex-direction: column; align-items: flex-end; gap: 4px; font-size: 18px; }
.cf-rowp { display: flex; align-items: baseline; gap: 12px; font-size: 18px; }
.cf-m { font: 600 16px/1.2 var(--sim-font); color: var(--sim-label-muted); }
.cf-cell { display: flex; align-items: baseline; gap: 6px; }
.cf-let { font: italic 700 20px/1 var(--sim-font-numeral, var(--sim-font)); color: var(--sim-annot); }
.cf-n { font: 700 18px/1 var(--sim-font); color: var(--sim-label); font-variant-numeric: tabular-nums; }
.cf-late { animation: cf-in 0.5s ease 2.6s both; }
@keyframes cf-in { from { opacity: 0; } to { opacity: 1; } }
.cf-read { position: absolute; display: flex; align-items: baseline; gap: 8px; white-space: nowrap; font: 600 16px/1.2 var(--sim-font); color: var(--sim-label-muted); }
.cf-read.on { color: var(--sim-label); }
.cf-rn { min-width: 92px; font-weight: 800; color: var(--sim-label); }
.cf-inc { font: 400 32px/1 var(--sim-font-numeral); color: var(--sim-annot); }
.cf-wait { font-style: italic; }
.cf-rr { position: absolute; display: flex; flex-direction: column; gap: 2px; white-space: nowrap; font: 600 16px/1.2 var(--sim-font); color: var(--sim-label-muted); }
.cf-rr.on { color: var(--sim-label); }
.cf-big { font: 400 72px/1 var(--sim-font-numeral); color: var(--sim-annot); }
.cf-rrp { flex-direction: row; align-items: baseline; gap: 12px; }
.cf-land { animation: cf-land 0.8s cubic-bezier(.2,.8,.3,1) both; }
@keyframes cf-land { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
svg .cf-rule { stroke: var(--sim-label-muted); stroke-width: 1.5; opacity: 0.6; }
`;
  }
}
