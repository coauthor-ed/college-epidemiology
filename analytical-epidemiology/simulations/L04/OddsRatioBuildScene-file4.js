/**
 * OddsRatioBuildScene-file4 - L04 s01, cold-case file 4 (Vessey and Doll, BMJ 1969, Table 15).
 * One dot = one woman. Blue = a woman with a clot (case); grey = a comparable woman without (control).
 * FILLED = had used oral contraceptives; HOLLOW = never used, or not asked yet (beat 1, the legend says so).
 *   beat 1 (cue patients)        84 women with clots and 168 comparable women as two crowds, nobody sorted yet
 *   beat 2 (cues sort, products) learner taps "Sort by pill use": each woman fills (used) or stays hollow, then
 *                                flies into the 2 x 2: a = 42, b = 23, c = 42, d = 145; margins 84 and 168 and
 *                                the letters come last. Then the learner enters a x d and b x c; nothing lands
 *                                until both are right: 42 x 145 = 6090, 42 x 23 = 966
 *   beat 3 (cue ratio)           6090 / 966 = 6.30 lands large; "relative risk 6.3:1" corrected to "odds ratio"
 * Every beat lands at rest on its finished picture (beat 2 from beat 1 waits for the tap or the cue).
 * Focus ids added for Q-90: cell-a..cell-d, ad / bc (the diagonals), mar-ac / mar-bd (one column total).
 * Completion: scene-interact-done only when both products are right and Check is pressed (beat 2, closed).
 */
import { SvgScene, backdropSvg } from 'simulations/base/kit/SimSvg.js';
import { applyToneInks } from 'simulations/base/kit/SimLookDom.js';
import { SIM_CROWD_CSS, crowdLive, groupsLayout, cellsLayout, rulesSvg, legendHtml, countOf } from 'simulations/base/kit/SimCrowd.js';
import { SIM_PANEL_CSS, entryHtml, bindPanel } from 'simulations/base/kit/SimPanel.js';
import { flowChipHtml } from 'simulations/base/kit/SimFlowDom.js';
import { mulberry32 } from 'simulations/base/kit/SimLook.js';
import { withNarrationCues } from '../L01/NarrationCues.js';
import { na, tagTop, tagEl, tagLive } from './NarrTags.js';

const X = '\u00d7';
// Narration focus per cell (one cell's dots, count and letter) and its diagonal: cell-a..d plus ad / bc.
const CELLID = { a: 'cell-a ad', b: 'cell-b bc', c: 'cell-c bc', d: 'cell-d ad' };
const BOXL = { r0c0: 'a', r0c1: 'b', r1c0: 'c', r1c1: 'd' };
// 84 cases (42 used the pill), 168 controls (23 used it), in a seeded order so the answers fall the same way each time.
const WOMEN = (() => {
  const rnd = mulberry32(11);
  const mk = (n, used, ill, pre) => {
    const ids = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
    const on = new Set(ids.slice(0, used));
    return Array.from({ length: n }, (_, i) => ({ id: `${pre}${i}`, ill, ex: on.has(i), q: i / n }));
  };
  return [...mk(84, 42, true, 'c'), ...mk(168, 23, false, 'k')];
})();
const A = countOf(WOMEN, (p) => p.ill && p.ex), B = countOf(WOMEN, (p) => !p.ill && p.ex);
const C = countOf(WOMEN, (p) => p.ill && !p.ex), D = countOf(WOMEN, (p) => !p.ill && !p.ex);
const AD = A * D, BC = B * C, OR = AD / BC;        // 6090, 966, 6.30
const ASK_STEPS = 6;
const ORDER = [...WOMEN].sort((p, q) => p.q - q.q);  // cases and controls answer together

const lab = (x, y, html, cls = '', n = '') => `<span${na(n)} class="o4-lab ${cls}" style="left:${x.toFixed(1)}px;top:${y.toFixed(1)}px">${html}</span>`;

class OddsRatioFile4Base extends SvgScene {}

export class OddsRatioBuildSceneFile4 extends withNarrationCues(OddsRatioFile4Base) {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }], [{ idx: 2, dwellMs: null }]];
  static ARIA_LABEL = 'Cold-case file 4, Vessey and Doll 1969. 84 women with clots and 168 comparable women sort by pill use into a 2 by 2 table: a = 42, b = 23, c = 42, d = 145. You enter the cross-products, 42 times 145 is 6090 and 42 times 23 is 966, and the ratio 6090 over 966 is 6.30, printed as relative risk but an odds ratio.';
  static CONTROLS = [];
  static SETTING = 'none';
  static HEIGHT = 560;
  static PORTRAIT_HEIGHT = 700;
  static CUES = ['patients', 'sort', 'products', 'ratio'];

  async setup() {
    this.o4 = { sorted: false, answered: 0, asking: false, late: false, walk: false, diag: false, grow: false, gen: 0, came: null, last: null,
      v1: '', v2: '', bad1: false, bad2: false, hint: '', checked: false, self: false, keepHead: false, headHtml: null };
    await super.setup();
    bindPanel(this.root, {
      action: (name) => {
        if (name === 'sort') this.runSort(); // not a completion: beat 2's task ends on a correct Check (closed)
        if (name === 'check') this.checkProds();
      },
      input: (name, v) => {
        const s = String(v).replace(/[^\d]/g, '').slice(0, 5);
        if (name === 'p1') this.o4.v1 = s;
        if (name === 'p2') this.o4.v2 = s;
      },
    });
  }

  enter(step) {
    const t = this.o4;
    t.came = t.last != null && Math.abs(t.last - step) === 1 ? t.last : null;
    t.last = step;
    t.gen++;
    t.asking = false; t.late = false; t.walk = false; t.grow = false;
    if (step === 0) { t.sorted = false; t.answered = 0; t.checked = false; t.self = false; t.v1 = ''; t.v2 = ''; t.hint = ''; t.bad1 = false; t.bad2 = false; t.diag = false; }
    if (step === 1) { t.sorted = !t.narr || t.checked; t.answered = t.sorted ? 252 : 0; if (t.came === 0 && !t.narr) this.after(0.05, () => { if (!t.narr) this.runSort(); }); t.diag = t.checked; if (!t.checked) { t.hint = ''; t.bad1 = false; t.bad2 = false; } }
    if (step === 2) { t.sorted = true; t.answered = 252; t.diag = true; t.grow = true; if (!t.checked) { t.checked = true; t.self = true; } this.after(2, () => { t.grow = false; }); }
  }

  stageHeight(st) {
    const k = this.stepIndex ?? 0;
    if (!st.portrait) return k === 1 ? 436 : 470;
    return [470, 498, 660][k];
  }

  runSort() {
    if (this.stepIndex !== 1) return;
    const t = this.o4, tok = (t.sortTok = (t.sortTok ?? 0) + 1);
    t.sorted = false; t.asking = true; t.answered = 0; t.late = true;
    this.repaint();
    for (let i = 1; i <= ASK_STEPS; i++) this.after(0.22 * i, () => { if (tok !== t.sortTok) return; t.answered = Math.round((252 * i) / ASK_STEPS); this.repaint(); });
    this.after(0.22 * ASK_STEPS + 0.6, () => { if (tok !== t.sortTok) return; t.asking = false; t.sorted = true; this.repaint(); this.after(4, () => { t.late = false; }); });
  }

  checkProds() {
    const t = this.o4;
    if (this.stepIndex !== 1 || t.checked || !t.sorted) return;
    if (!t.v1 || !t.v2) { t.hint = 'Enter both products, then Check.'; t.bad1 = !t.v1; t.bad2 = !t.v2; this.repaint(); return; }
    const n1 = Number(t.v1), n2 = Number(t.v2), ok1 = n1 === AD, ok2 = n2 === BC;
    t.bad1 = !ok1; t.bad2 = !ok2;
    if (ok1 && ok2) {
      t.checked = true; t.hint = ''; t.diag = true; t.grow = true;
      this.repaint();
      this.after(0.9, () => this.celebrate({ stamp: 'CHECKED' }));
      this.after(2, () => { t.grow = false; });
      this.interactDone?.('products');
      return;
    }
    if (n1 === BC && n2 === AD) t.hint = 'Swapped: a x d is the diagonal 42 and 145.';
    else if (n1 === A + D || n2 === B + C) t.hint = `Multiply, do not add: a ${X} d = 42 ${X} 145.`;
    else t.hint = `Multiply the diagonals: a ${X} d = 42 ${X} 145, b ${X} c = 23 ${X} 42.`;
    this.repaint();
  }

  applyCue(id) {
    const t = this.o4, k = this.stepIndex;
    if (id === 'patients' && k === 0) { t.gen++; t.walk = true; this.repaint(); }
    else if (id === 'sort' && k === 1 && !t.sorted && !t.asking) this.runSort();
    else if (id === 'products' && k === 1 && t.sorted) { t.diag = true; this.repaint(); }
    else if (id === 'ratio' && k === 2) { t.grow = true; this.repaint(); this.after(2, () => { t.grow = false; }); }
  }

  cueBase() { return null; }
  cueReset() {
    const t = this.o4;
    if (this.stepIndex === 1) { t.diag = t.checked; if (t.narr && !t.checked) { t.sortTok = (t.sortTok ?? 0) + 1; t.sorted = false; t.asking = false; t.late = false; t.answered = 0; } }
    this.repaint();
  }

  // Narrated (spec W1 D29n): beat 2 opens on the two crowds and sorts at the sort cue, not at the beat start.
  narrationFocus(st) {
    const t = this.o4;
    if (!t) return;
    const was = t.narr;
    t.narr = !!st?.narrated;
    if (t.narr && !was && this.stepIndex === 1 && !t.checked && (t.asking || t.sorted) && !this._nc?.applied?.has('sort')) {
      t.sortTok = (t.sortTok ?? 0) + 1;
      t.sorted = false; t.asking = false; t.answered = 0; t.late = false; this.repaint();
    }
    // "and the four cells fill": the women move into the cells at those words, not when the asking timer ends.
    if (t.narr && this.stepIndex === 1 && t.asking && (st?.on ?? []).includes('cells')) {
      const tok = (t.sortTok = (t.sortTok ?? 0) + 1);
      t.asking = false; t.sorted = true; t.answered = 252; this.repaint();
      this.after(4, () => { if (tok === t.sortTok) t.late = false; });
    }
  }

  // Overridden only so an unchanged head (the entry fields) is not rebuilt under the learner's typing.
  repaint() {
    if (!this.sv) return;
    this.sv.measure();
    const out = this.paint(this.sv) ?? {};
    const h = out.head ?? '';
    if (h !== this.o4.headHtml) { this._head.innerHTML = h; this.o4.headHtml = h; }
    this.sv.render(out.svg ?? '', out.over ?? '', backdropSvg(this.sv, { seed: 3 + this.stepIndex, floorY: out.floor }));
    applyToneInks(this.root);
    if (typeof this.animate === 'function') { this.live.reset(); this._liveFrame(); }
    this.relayout();
  }

  groupsOf(st) {
    const P = st.portrait, W = st.W;
    if (P) {
      // Portrait: two stacked blocks with one dot size and one column count (they compare like bars), each as tall as it needs.
      const cols = 17, step = (W - 28) / cols, r = Math.min(9, step * 0.37), pos = new Map(), boxOf = new Map();
      const cas = WOMEN.filter((p) => p.ill), con = WOMEN.filter((p) => !p.ill);
      const yA = 66, yB = yA + Math.ceil(cas.length / cols) * step + 58;
      const put = (list, y0, key) => list.forEach((p, i) => { pos.set(p.id, { x: 14 + step * (i % cols + 0.5), y: y0 + step * (Math.floor(i / cols) + 0.5) }); boxOf.set(p.id, key); });
      put(cas, yA, true); put(con, yB, false);
      return { r, step, pos, boxOf, rules: [], boxes: [], heads: [[W / 2, yA - 20, '84 women with clots'], [W / 2, yB - 20, '168 comparable women, no clot']] };
    }
    const rect = P ? { x: 14, y: 40, w: W - 28, h: st.H - 84 } : { x: 18, y: 48, w: W - 36, h: st.H - 96 };
    return groupsLayout(WOMEN, rect, {
      groups: [{ key: true, label: '84 women with clots' }, { key: false, label: '168 comparable women, no clot' }],
      groupOf: (p) => p.ill, dir: P ? 'col' : 'row', gutter: P ? 46 : 40, align: 'top', padTop: 30, maxR: 9, gap: 0.42,
    });
  }

  tableOf(st) {
    const P = st.portrait, W = st.W, k = this.stepIndex;
    const rect = P
      ? (k === 2 ? { x: 44, y: 46, w: W - 44 - 10, h: 280 } : { x: 44, y: 46, w: W - 44 - 10, h: 362 })
      : { x: 132, y: 50, w: 356, h: k === 1 ? 332 : 362 };
    return cellsLayout(WOMEN, rect, { row: (p) => (p.ex ? 0 : 1), col: (p) => (p.ill ? 0 : 1), padTop: 30, gutter: 16, minR: 3.6, maxR: 9, gap: 0.3 });
  }

  legend(k) {
    if (k === 0 || (k === 1 && !this.o4.sorted && !this.o4.asking)) {
      return legendHtml({ items: [{ label: 'woman with a clot', color: 'var(--sim-annot)', filled: false }, { label: 'without', color: 'var(--sim-label-muted)', filled: false }, { label: 'hollow: not asked yet', color: 'var(--sim-label)', filled: false }] });
    }
    return legendHtml({ items: [{ label: 'with a clot', color: 'var(--sim-annot)', filled: true }, { label: 'without', color: 'var(--sim-label-muted)', filled: true }, { label: 'filled: used the pill', color: 'var(--sim-label)', filled: true }, { label: 'hollow: never', color: 'var(--sim-label)', filled: false }] });
  }

  entry() {
    const t = this.o4, st = (bad) => (t.checked ? 'ok' : bad ? 'bad' : null);
    return entryHtml({
      action: 'check', cta: t.checked ? false : 'Check',
      fields: [
        { name: 'p1', label: `a${X}d =`, value: t.checked ? String(AD) : t.v1, locked: t.checked, state: st(t.bad1), aria: 'Product of a and d, 42 times 145' },
        { name: 'p2', label: `b${X}c =`, value: t.checked ? String(BC) : t.v2, locked: t.checked, state: st(t.bad2), aria: 'Product of b and c, 23 times 42' },
      ],
      state: t.checked ? 'ok' : t.hint ? 'bad' : null,
      feedback: t.checked ? `42 ${X} 145 = 6090; 42 ${X} 23 = 966.` : t.hint || 'Work both out, then Check.',
    });
  }

  paint(st) {
    const k = this.stepIndex, t = this.o4, P = st.portrait, W = st.W, H = st.H;
    let svg = '', over = '';
    const answered = new Set(ORDER.slice(0, t.answered).map((p) => p.id));
    const tableNow = k === 2 || (k === 1 && t.sorted);
    const legendY = H - 22;
    if (!tableNow) {
      this.lay = this.groupsOf(st);
      this.people = WOMEN.map((p) => ({ ...p, exposed: answered.has(p.id) ? p.ex : false }));
      this.from = k === 0 && t.walk ? (p) => ({ x: p.ill ? 10 : W - 10, y: P ? (p.ill ? 90 : 360) : 220 }) : null;
      this.flyOpt = { order: 'random', spread: 1.3, labels: P ? null : { place: 'above', count: 'none' } };
      (this.lay.heads ?? []).forEach(([x, y, h], i) => { over += lab(x, y, h, 'o4-head2', i ? 'controls' : 'cases'); });
      t.walk = false;
      over += `<div class="o4-legend"${na('-')} style="top:${legendY}px">${this.legend(k)}</div>`;
      over += lab(W - 14, P ? 22 : 24, 'Vessey and Doll, 1969', 'o4-src', '-');
      const head = k === 1
        ? `<div class="spn o4-head"${na('entry')}>${flowChipHtml({ label: 'Sort by pill use', action: 'sort', icon: 'replay' })}</div>`
        : '';
      return { svg, over, head };
    }
    const lay = this.tableOf(st);
    this.lay = lay;
    const diag = t.diag;
    this.people = WOMEN.map((p) => ({ ...p, exposed: p.ex, dim: k === 2 && false }));
    this.from = k === 1 && t.late ? this.groupsOf(st) : null;
    this.flyOpt = { order: 'random', spread: 1.0, labels: { place: 'above', count: t.late ? 'landed' : 'final', big: !P || k === 1, text: (b, cnt) => `<span class="sim-numeral o4-cnt">${cnt}</span>` } };
    svg += tagTop(rulesSvg(lay), 'cells');
    const ar = lay.boxes.map((b) => b.area);
    const late = t.late ? ' o4-late' : '';
    const letters = ['a', 'b', 'c', 'd'];
    lay.boxes.forEach((b, i) => { over += lab(b.area.x + 4, b.area.y + 4, letters[i], `o4-letter${late}`, `cells ${CELLID[letters[i]]}`); });
    over += lab(ar[0].x + ar[0].w / 2, ar[0].y - 18, P ? 'clots' : 'with clots', 'o4-col', 'cases');
    over += lab(ar[1].x + ar[1].w / 2, ar[1].y - 18, 'without', 'o4-col', 'controls');
    if (P) {
      over += lab(24, ar[0].y + ar[0].h / 2, 'used the pill', 'o4-rot', 'pill');
      over += lab(24, ar[2].y + ar[2].h / 2, 'never used', 'o4-rot', 'pill');
    } else {
      over += lab(ar[0].x - 14, ar[0].y + ar[0].h / 2, 'used<br>the pill', 'o4-row', 'pill');
      over += lab(ar[2].x - 14, ar[2].y + ar[2].h / 2, 'never<br>used', 'o4-row', 'pill');
    }
    const my = ar[2].y + ar[2].h + 16;
    over += lab(ar[2].x + ar[2].w / 2, my, `a + c = ${A + C}`, `o4-margin${late}`, 'margins mar-ac');
    over += lab(ar[3].x + ar[3].w / 2, my, `b + d = ${B + D}`, `o4-margin${late}`, 'margins mar-bd');
    if (diag) {
      const cx = (a) => a.x + a.w / 2, cy = (a) => a.y + a.h / 2 + 12;
      svg += `<line${na('frac')} class="o4-diag o4-diag--ad" x1="${cx(ar[0])}" y1="${cy(ar[0])}" x2="${cx(ar[3])}" y2="${cy(ar[3])}"/>`;
      svg += `<line${na('frac')} class="o4-diag o4-diag--bc" x1="${cx(ar[1])}" y1="${cy(ar[1])}" x2="${cx(ar[2])}" y2="${cy(ar[2])}"/>`;
    }
    // The work column: right of the table (landscape) or under it (portrait).
    const g = t.grow ? ' o4-grow' : '';
    if (k === 1) {
      const prod = (x, y, w, top, n, cls) => `<div${na('prods')} class="o4-prod ${cls}${t.checked ? g : ''}" style="left:${x}px;top:${y}px;width:${w}px"><span>${top}</span><b class="sim-numeral">${t.checked ? n : '?'}</b></div>`;
      if (!P) {
        const x = 512, w = W - x - 10;
        over += prod(x, 70, w, `a ${X} d<br>42 ${X} 145`, AD, 'ad') + prod(x, 210, w, `b ${X} c<br>42 ${X} 23`, BC, 'bc');
        over += `<p${na('prods')} class="o4-say o4-say--m" style="left:${x}px;top:350px;width:${w}px">${t.checked ? 'Both products check. The ratio is next.' : 'The ratio waits for both products.'}</p>`;
      }
      over += `<div class="o4-legend"${na('-')} style="top:${legendY}px">${this.legend(k)}</div>`;
      const head = `<div class="spn o4-head"${na('entry')}>${flowChipHtml({ label: 'Sort by pill use', action: 'sort', icon: 'replay' })}${this.entry()}</div>`;
      return { svg, over, head };
    }
    // Beat 3: the ratio, large, and the printed label corrected.
    const pay = (x, y, w) => `<div class="o4-pay${g}" style="left:${x}px;top:${y}px;width:${w}px">`
      + `<span${na('frac')} class="o4-frac sim-numeral"><span>${AD}</span><span>${BC}</span></span>`
      + `<b${na('ratio')} class="sim-numeral o4-big">${OR.toFixed(2)}</b>`
      + `<p${na('print')} class="o4-print">Printed in 1969: <del>relative risk</del> <ins>odds ratio</ins> 6.3:1</p></div>`;
    over += P ? pay(14, ar[2].y + ar[2].h + 36, W - 28) : pay(496, 70, W - 496 - 2);
    over += `<div class="o4-legend"${na('-')} style="top:${legendY}px">${this.legend(k)}</div>`;
    return { svg, over, head: '' };
  }

  animate() {
    const key = `w${this.o4.gen}`;
    crowdLive(this.live, key, this.people, this.lay, { from: this.from, ...this.flyOpt });
    const inCells = (this.lay?.boxes ?? []).some((b) => typeof b.key !== 'boolean'); // sorted: the women ARE the cells
    tagLive(this.live, key, this.people, (p) => (p.ill ? 'cases' : 'controls') + (inCells ? ` cells ${CELLID[p.ex ? (p.ill ? 'a' : 'b') : (p.ill ? 'c' : 'd')]}` : ''));
    for (const b of this.lay?.boxes ?? []) tagEl(this.live.get?.(`${key}|lab|${b.key}`), typeof b.key !== 'boolean' ? `cells ${CELLID[BOXL[b.key]] ?? ''}`.trim() : (b.key ? 'cases' : 'controls'));
  }

  testState() {
    const t = this.o4;
    return { stage: this.stepIndex, a: A, b: B, c: C, d: D, sorted: t.sorted, landed: t.checked, ad: t.checked ? AD : 0, bc: t.checked ? BC : 0, ratio: this.stepIndex === 2 ? OR.toFixed(2) : '' };
  }

  css() {
    return SIM_CROWD_CSS + SIM_PANEL_CSS + `
/* Narrated focus: group labels light by brightness, not by a ring each (spec W1 D29n). */
.o4-letter[data-narr], .o4-col[data-narr], .o4-row[data-narr], .o4-rot[data-narr], .o4-margin[data-narr], .o4-head2[data-narr], .scw-lab[data-narr] { outline: none !important; }
.svs-head { min-height: 0; }
.o4-head { flex-direction: row; flex-wrap: wrap; align-items: center; justify-content: center; gap: 8px 16px; width: 100%; }
.o4-head .spn-entry { align-items: center; gap: 2px; }
.o4-head .spn-entry__row { justify-content: center; gap: 6px 12px; }
.o4-head .spn-field { font-size: 16px; font-weight: 600; }
.o4-head .spn-field input { width: 4.2em; min-height: 44px; font-size: 20px; }
.o4-head .spn-field b { min-width: 3em; font-size: 20px; }
.o4-head .spn-fb { font-size: 15px; text-align: center; margin: 0; }
.sflow-chip { min-height: 44px; font-size: 16px; }
.scw-lab { font-size: 17px; }
.o4-cnt { font: 400 26px/1 var(--sim-font-numeral); color: var(--sim-label); }
.o4-lab { position: absolute; transform: translate(-50%, -50%); white-space: nowrap; font: 600 16px/1.2 var(--sim-font); color: var(--sim-label); }
.o4-src { transform: translate(-100%, -50%); font-style: italic; font-weight: 500; color: var(--sim-label-muted); }
.o4-head2 { font-size: 17px; font-weight: 700; }
.o4-col { font-size: 18px; font-weight: 700; transform: translate(-50%, -100%); }
.o4-row { font-size: 17px; font-weight: 700; transform: translate(-100%, -50%); text-align: right; line-height: 1.15; }
/* Vertical by writing-mode, not a 90 degree rotate (a rotate measures as near-zero text size). */
.o4-rot { font-size: 16px; font-weight: 700; writing-mode: vertical-rl; transform: translate(-50%, -50%) rotate(180deg); }
.o4-letter { transform: none; font: italic 600 18px/1 var(--sim-font-numeral, var(--sim-font)); color: var(--sim-annot); }
.o4-margin { font-size: 16px; font-weight: 600; color: var(--sim-label-muted); }
.o4-late { animation: o4-in 0.5s ease 1.3s both; }
@keyframes o4-in { from { opacity: 0; } to { opacity: 1; } }
.o4-legend { position: absolute; left: 0; right: 0; display: flex; justify-content: center; transform: translateY(-50%); }
.o4-legend .scw-legend { font-size: 15px; justify-content: center; gap: 4px 12px; }
.o4-say { position: absolute; margin: 0; font: 700 18px/1.25 var(--sim-font); color: var(--sim-label); border-bottom: 1px solid var(--sim-label); padding-bottom: 6px; }
.o4-say--m { font-weight: 500; font-size: 16px; color: var(--sim-label-muted); border: 0; }
.o4-prod { position: absolute; display: flex; flex-direction: column; gap: 6px; border-top: 1px solid var(--sim-label); padding-top: 8px; font: 600 16px/1.2 var(--sim-font); color: var(--sim-label-muted); }
.o4-prod b { font: 400 50px/1 var(--sim-font-numeral); color: var(--sim-label-muted); opacity: 0.6; }
.o4-prod.ad b { color: var(--sim-annot); opacity: 1; }
.o4-prod.bc b { color: var(--sim-label); opacity: 1; }
.o4-pay { position: absolute; display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; }
.o4-frac { display: inline-grid; justify-items: center; font: 400 30px/1.15 var(--sim-font-numeral); color: var(--sim-label); }
.o4-frac span:first-child { padding: 0 0.2em 0.06em; border-bottom: 1.5px solid currentColor; color: var(--sim-annot); }
.o4-big { font: 400 86px/0.95 var(--sim-font-numeral); color: var(--sim-annot); letter-spacing: -0.01em; }
.o4-print ins, .o4-print del { display: inline-block; }
.o4-print { margin: 0; font: 600 16px/1.7 var(--sim-font); color: var(--sim-label); border-top: 1px solid var(--sim-label); padding-top: 8px; }
.o4-print del { color: var(--sim-label-muted); text-decoration-thickness: 2px; }
.o4-print ins { text-decoration: none; color: var(--sim-annot); font-weight: 700; background: var(--sim-annot-tint); padding: 1px 6px; }
.o4-grow { animation: o4-pop 0.7s cubic-bezier(.3,.8,.3,1) both; }
@keyframes o4-pop { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: none; } }
svg .o4-diag { stroke-width: 2.5; stroke-dasharray: 6 5; stroke-linecap: round; opacity: 0.85; }
svg .o4-diag--ad { stroke: var(--sim-annot); }
svg .o4-diag--bc { stroke: var(--sim-label); }
.sim-dom-root--portrait .o4-big { font-size: 72px; }
.sim-dom-root--portrait .o4-head { gap: 6px; }
.sim-dom-root--portrait .o4-head .spn-entry__row { flex-wrap: nowrap; gap: 8px; }
.sim-dom-root--portrait .o4-head .spn-field { gap: 4px; }
.sim-dom-root--portrait .o4-head .spn-field input { width: 3.3em; padding: 4px 4px; }
.sim-dom-root--portrait .o4-head .spn-btn { padding: 8px 10px; }
@media (prefers-reduced-motion: reduce) { .o4-late, .o4-grow { animation: none; } }
`;
  }
}
