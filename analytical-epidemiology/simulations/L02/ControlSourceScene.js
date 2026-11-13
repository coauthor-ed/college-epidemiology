/**
 * ControlSourceScene - analytical-epidemiology L02 s05 "the controls must be like the cases". Illustrative
 * study of smoking and heart attack. One dot = one man: blue = case (heart attack), grey = control;
 * FILLED = smokes, HOLLOW = does not. 100 cases, 60 smoke, never change; 100 controls beside them.
 *   Beat 0 answer:  controls are men with bladder cancer: 60 of 100 smoke; the gap reads 0 points;
 *                   "bladder cancer is itself linked to smoking".
 *   Beat 1 sources: four source cards (hospital patients, relatives, neighbours, general population; landscape: tabs);
 *                   a tap opens its one weakness (slide text) and lights it. No numbers for any source.
 *                   Rest: hospital patients open. Cue sources opens all four in turn.
 *   Beat 2 refill:  toggle general population / men with bladder cancer: the control crowd re-fills in a
 *                   visible sweep, 40 vs 60 of 100; bars and the gap count with it, 20 -> 0 points.
 *                   Rest: general population (20 points). Cue refill -> bladder cancer.
 *   Beat 3 number:  controls per case 1-5; precision compared with unlimited controls = k / (k + 1):
 *                   50, 67, 75, 80, 83 per cent. Rest: 4. Standard efficiency formula, said in a caption.
 */
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { SIM_CROWD_CSS, crowdLive, legendHtml } from 'simulations/base/kit/SimCrowd.js';
import { withNarrationCues } from '../L01/NarrationCues.js';

const CASE_N = 60;
const CASES = Array.from({ length: 100 }, (_, i) => ({ id: `h${i}`, ill: true, i, exposed: i < CASE_N }));
const CTRL = Array.from({ length: 100 }, (_, i) => ({ id: `q${i}`, ill: false, i }));
const SRC = { pop: { n: 40, name: 'general population' }, blad: { n: 60, name: 'men with bladder cancer' } };
const CARDS = [
  { name: 'Hospital patients', weak: 'Easy to reach, but their own illnesses may share the exposure.' },
  { name: 'Relatives', weak: 'Willing, but they share the cases\u2019 genes.' },
  { name: 'Neighbours', weak: 'They share the cases\u2019 streets, water and air.' },
  { name: 'General population', weak: 'A random sample from a defined area: the cleanest source, and the slowest to assemble.' },
];
const SWEEP_S = 1.1;
// Narration focus (spec W1 D29n): data-narr ids on the parts; inert with narration off.
const hideTag = (html) => html.replace(/^<(\w+)/, '<$1 data-narr-hide=""');
const tagEl = (e, n) => { if (e && e.getAttribute('data-narr') !== n) e.setAttribute('data-narr', n); };
const MAP = [0, 1, 2, 3].map((i) => [{ idx: i, dwellMs: null }]);

export class ControlSourceScene extends withNarrationCues(SvgScene) {
  static WIDTH = 680;
  static HEIGHT = 560;
  static PORTRAIT_WIDTH = 380;
  static PORTRAIT_HEIGHT = 640;
  static MIN_SCALE = 0.85;
  static SETTING = 'none';
  static BEAT_STEP_MAP = MAP;
  static CONTROLS = [];
  // show.src1..4: the narration's own focus cues (engine shows the card at its word); the scene opens that card
  // then. Narrated, the script drives the cards word by word; the 0.7 s 'sources' sweep is for other cue use.
  static CUES = ['answer', 'sources', 'refill', 'number', 'show.src1', 'show.src2', 'show.src3', 'show.src4'];
  static ARIA_LABEL = 'Illustrative study of smoking and heart attack, one dot per man. 100 cases in blue, 60 of them smoke, shown filled. 100 controls in grey beside them. Controls drawn from men with bladder cancer: 60 of 100 smoke, the gap is 0 points, because bladder cancer is itself linked to smoking. Four sources of controls, each with a weakness: hospital patients, their illnesses may share the exposure; relatives share genes; neighbours share streets, water and air; the general population is the cleanest and slowest. A toggle re-fills the controls: general population, 40 of 100 smoke, a gap of 20 points; men with bladder cancer, 60 of 100, a gap of 0 points; the cases do not change. Controls per case 1 to 5: precision compared with unlimited controls 50, 67, 75, 80 and 83 per cent; the gain after four is small.';

  enter(step) {
    this.csSrc = step === 2 ? 'pop' : 'blad';
    this.csPrev = this.csSrc;
    this.csOpen = new Set(step === 1 ? [0] : []);
    this.csAct = step === 1 ? 0 : null;
    this.csK = 4;
  }

  geo(st) {
    const P = st.portrait, M = P ? 12 : 16;
    if (P) {
      const step = 15.6, gw = 10 * step;
      return { P, M, W: st.W, step, r: 6.2, gx: [M, st.W - M - gw], gy: 108, gw, gh: 10 * step, low: 108 + 10 * step + 12 };
    }
    const step = 20, gw = 10 * step;
    return { P, M, W: st.W, step, r: 7.4, gx: [M, st.W - M - gw], gy: 68, gw, gh: 10 * step, low: 68 + 10 * step + 30 };
  }

  stageHeight(st) { return st.portrait ? 552 : 480; }

  layout(g) {
    const pos = new Map(), boxOf = new Map();
    [CASES, CTRL].forEach((list, k) => list.forEach((p) => {
      const c = p.i % 10, row = 9 - Math.floor(p.i / 10);
      pos.set(p.id, { x: g.gx[k] + (c + 0.5) * g.step, y: g.gy + (row + 0.5) * g.step });
      boxOf.set(p.id, k ? 'ctrl' : 'cases');
    }));
    return { r: g.r, step: g.step, pos, boxOf, boxes: [], rules: [] };
  }

  // How many controls smoke at clock t (a sweep from csPrev to csSrc runs for SWEEP_S after a toggle).
  ctrlN(t) {
    const a = SRC[this.csPrev].n, b = SRC[this.csSrc].n;
    if (a === b || !this.isPlaying?.()) return b;
    return Math.round(a + (b - a) * Math.min(1, Math.max(0, t / SWEEP_S)));
  }

  paint(st) {
    const g = this.geo(st), s = this.stepIndex ?? 0;
    this.lay = this.layout(g);
    this.g = g;
    const src = SRC[this.csSrc];
    let over = '';
    const top = g.P ? 34 : 18, w = g.gw;
    over += `<div class="cs-lab cs-lab--case" data-narr="cases" style="left:${g.gx[0]}px;top:${top}px;width:${w}px"><b>cases</b><span>${g.P ? (s === 2 ? 'heart attack, unchanged' : 'heart attack') : '100 men with a heart attack'}</span></div>`;
    over += `<div class="cs-lab" data-narr="controls" style="left:${g.gx[1]}px;top:${top}px;width:${w}px"><b>controls</b><span>${s === 1 ? 'from which source?' : g.P && this.csSrc === 'blad' ? 'bladder cancer' : src.name}</span></div>`;
    if (s === 2 && !g.P) over += `<div class="cs-note" data-narr="cases" style="left:${g.gx[0]}px;top:${g.gy + g.gh + 4}px;width:${w}px">cases unchanged</div>`;
    if (s === 0) over += `<div class="cs-note cs-note--why" data-narr="why" style="left:${g.P ? g.M : g.gx[1] - 40}px;top:${g.P ? g.low + 96 : g.gy + g.gh + 4}px;width:${g.P ? g.W - 2 * g.M : w + 40}px">bladder cancer is itself linked to smoking</div>`;
    if (s === 1) over += this.cardsHtml(g);
    if (s === 2) over += this.toggleHtml(g);
    if (s === 3) over += this.numberHtml(g);
    const head = hideTag(legendHtml({ show: ['ill', 'well', 'exposed', 'unexposed'], text: { ill: 'case', well: 'control', exposed: 'smokes', unexposed: 'does not' } }));
    return { svg: '', over, head };
  }

  cardsHtml(g) {
    const y = g.P ? g.low : g.low + 6, w = g.W - 2 * g.M;
    if (!g.P) {
      // Landscape: four source tabs in one row, the lit one's weakness in one shared panel below (fits 560).
      let t = `<div class="cs-cards cs-cards--tabs" style="left:${g.M}px;top:${y}px;width:${w}px" role="group" aria-label="sources of controls">`;
      CARDS.forEach((c, i) => {
        const open = this.csOpen.has(i), act = this.csAct === i;
        t += `<button type="button" class="cs-card cs-tab${open ? ' cs-card--open' : ''}${act ? ' cs-card--act' : ''}" data-card="${i}" data-narr="src${i + 1}" aria-pressed="${act}"><b>${c.name}</b></button>`;
      });
      const a = this.csAct;
      t += `<div class="cs-weak${a == null ? ' cs-weak--idle' : ''}" data-narr="${a == null ? 'srcnone' : `src${a + 1}`}" aria-live="polite">${a == null ? 'tap a source: its weakness' : `<b>${CARDS[a].name}:</b> ${CARDS[a].weak}`}</div>`;
      return t + '</div>';
    }
    let h = `<div class="cs-cards" style="left:${g.M}px;top:${y}px;width:${w}px" role="group" aria-label="sources of controls">`;
    CARDS.forEach((c, i) => {
      // Narrated, every card is open from the start (each stays hidden until its show. cue), so a card never
      // grows at its word and the engine's scroll-to-lit measures its full height.
      const open = this.csOpen.has(i) || !!this.csNarr, act = this.csAct === i;
      h += `<button type="button" class="cs-card${open ? ' cs-card--open' : ''}${act ? ' cs-card--act' : ''}" data-card="${i}" data-narr="src${i + 1}" aria-expanded="${open}">`
        + `<b>${c.name}</b><span>${open ? c.weak : 'tap: its weakness'}</span></button>`;
    });
    return h + '</div>';
  }

  toggleHtml(g) {
    const y = g.P ? g.low + 96 : g.low + 10, w = g.W - 2 * g.M;
    let b = '';
    for (const k of ['pop', 'blad']) b += `<button type="button" class="cs-tog${this.csSrc === k ? ' cs-tog--on' : ''}" data-src="${k}" aria-pressed="${this.csSrc === k}">${SRC[k].name}</button>`;
    return `<div class="cs-togrow" data-narr="toggle" style="left:${g.M}px;top:${y}px;width:${w}px"><span class="cs-toglab">draw the controls from</span><span class="cs-togs">${b}</span></div>`;
  }

  numberHtml(g) {
    const y = g.low, w = g.W - 2 * g.M, k = this.csK, eff = Math.round((100 * k) / (k + 1));
    let btns = '';
    for (let n = 1; n <= 5; n++) btns += `<button type="button" class="cs-k${n === k ? ' cs-k--on' : ''}" data-k="${n}" aria-pressed="${n === k}">${n}</button>`;
    let ticks = '';
    for (let n = 1; n <= 5; n++) { const v = (100 * n) / (n + 1); ticks += `<i class="cs-tick" style="left:${v}%"></i><em class="cs-tl${n === k ? ' cs-tl--on' : ''}" style="left:${v}%">${n}</em>`; }
    return `<div class="cs-num" style="left:${g.M}px;top:${y}px;width:${w}px">`
      + '<span class="cs-top">' + `<span class="cs-steprow" data-narr="stepper"><span class="cs-toglab">controls per case</span><span class="cs-ks" role="group" aria-label="controls per case">${btns}</span></span>`
      + `<span class="cs-effrow" data-narr="eff"><span class="cs-eff sim-numeral">${eff}<small> per cent</small></span><span class="cs-efflab">precision compared with unlimited controls</span></span></span>`
      + `<span class="cs-track" data-narr="eff" aria-hidden="true"><span class="cs-fill" style="width:${eff}%"></span>${ticks}</span>`
      + '<span class="cs-foot"><span class="cs-gain" data-narr="gain">the gain after four is small</span>'
      + '<span class="cs-cap" data-narr-hide="">efficiency of k controls per case: k / (k + 1)</span></span></div>';
  }

  animate(st, t) {
    if (!this.lay) return;
    const s = this.stepIndex ?? 0, n = this.ctrlN(t ?? 0), dimAll = s === 1 || s === 3;
    const people = [
      ...CASES.map((p) => ({ ...p, dim: dimAll })),
      ...CTRL.map((p) => ({ ...p, exposed: p.i < n, dim: dimAll })),
    ];
    crowdLive(this.live, 'cs', people, this.lay, {});
    for (const p of people) tagEl(this.live.get(`cs|${p.id}`), p.ill ? 'cases' : 'controls');
    if (!(this.g.P && (s === 1 || s === 3))) this.barsLive(n, s);
  }

  // Bars and the gap on the live layer, so they count with the sweep (heights transition in CSS).
  barsLive(n, s) {
    const g = this.g, L = this.live, gap = CASE_N - n, quiet = s === 1 || s === 3;
    const box = L.el('cs|bars', { cls: `cs-bars${quiet ? ' cs-bars--quiet' : ''}${g.P ? ' cs-bars--row' : ''}` });
    const part = (key, cls, parent, html) => L.el(key, { cls, parent, html });
    if (g.P) {
      L.css(box, { left: `${g.M}px`, top: `${g.low}px`, width: `${g.W - 2 * g.M}px`, height: '84px' });
      const bar = (key, v, cls, row) => {
        const e = part(key, `cs-hbar ${cls}`, box);
        L.css(e, { top: `${row * 40}px`, width: '210px' });
        L.css(part(`${key}|f`, 'cs-hfill', e), { width: `${(v * 1.3).toFixed(1)}px` });
        part(`${key}|t`, 'cs-hnum', e, `${v} of 100`);
      };
      bar('cs|b1', CASE_N, 'cs-hbar--case', 0);
      bar('cs|b2', n, '', 1);
    } else {
      const x0 = g.gx[0] + g.gw, x1 = g.gx[1], H = g.gh, mid = (x1 - x0) / 2, bw = 34;
      L.css(box, { left: `${x0}px`, top: `${g.gy}px`, width: `${x1 - x0}px`, height: `${H}px` });
      const bar = (key, v, cls, x) => {
        const e = part(key, `cs-vbar ${cls}`, box);
        L.css(e, { left: `${x - bw / 2}px`, width: `${bw}px`, height: `${H}px` });
        L.css(part(`${key}|f`, 'cs-vfill', e), { height: `${0.78 * v}%` });
        L.css(part(`${key}|t`, 'cs-vnum', e, `${v}`), { bottom: `calc(${0.78 * v}% + 4px)` });
      };
      bar('cs|b1', CASE_N, 'cs-vbar--case', mid - 34);
      bar('cs|b2', n, '', mid + 34);
      L.css(part('cs|lvl', 'cs-lvl', box), { left: `${mid - 34 - bw / 2}px`, width: `${68 + bw + 10}px`, bottom: `${0.78 * CASE_N}%` });
      L.css(part('cs|brk', 'cs-brk', box), { left: `${mid + 34 + bw / 2 + 6}px`, bottom: `${0.78 * n}%`, height: `${0.78 * (CASE_N - n)}%`, display: n === CASE_N ? 'none' : null });
    }
    const gp = part('cs|gap', `cs-gap${quiet ? ' cs-gap--quiet' : ''}`, box);
    L.css(gp, g.P ? { left: '216px', top: '2px' } : { left: '50%', top: '-6px' });
    part('cs|gapn', 'sim-numeral', gp, String(gap));
    part('cs|gapw', 'cs-gapw', gp, gap === 1 ? 'point' : 'points');
    tagEl(L.get('cs|b1'), 'cases bars'); tagEl(L.get('cs|b2'), 'controls bars');
    for (const k of ['cs|lvl', 'cs|brk', 'cs|gap']) tagEl(L.get(k), 'gap bars');
  }

  async setup() {
    await super.setup();
    this.csListen = (e) => this.onClick(e);
    this.root.addEventListener('click', this.csListen);
  }

  onClick(e) {
    const b = e.target?.closest?.('[data-card],[data-src],[data-k]');
    if (!b) return;
    const s = this.stepIndex;
    if (b.dataset.card != null && s === 1) { const i = Number(b.dataset.card); this.csOpen.add(i); this.csAct = i; this.interactDone('sources'); this.repaint(); }
    else if (b.dataset.src && s === 2) { this.setSrc(b.dataset.src); this.interactDone('refill'); }
    else if (b.dataset.k && s === 3) { this.csK = Number(b.dataset.k); this.interactDone('number'); this.repaint(); }
  }

  setSrc(k) {
    if (!SRC[k] || k === this.csSrc) return;
    const was = SRC[this.csSrc].n;
    this.csPrev = this.csSrc;
    this.csSrc = k;
    this.repaint();
    if (was !== SRC[k].n) this.play(SWEEP_S + 0.2);
  }

  applyCue(id) {
    const s = this.stepIndex;
    if (id === 'sources' && s === 1) {
      CARDS.forEach((_, i) => this.after(i * 0.7, () => { this.csOpen.add(i); this.csAct = i; this.repaint(); }));
    } else if (/^show\.src[1-4]$/.test(id) && s === 1) {
      const i = Number(id.slice(-1)) - 1;
      this.csOpen.add(i); this.csAct = i; this.repaint();
    } else if (id === 'refill' && s === 2) this.setSrc('blad');
    else if (id === 'number' && s === 3) { this.csK = 4; this.repaint(); }
  }

  /** Narration focus contract (content-block): only the narrated flag is kept; the engine holds and dims the tagged parts. */
  narrationFocus(f) {
    const n = !!f?.narrated;
    if (n === !!this.csNarr) return;
    this.csNarr = n;
    if (this.stepIndex === 1 && this.g) this.repaint();
  }

  cueBase() { return { src: this.csSrc, open: [...this.csOpen], act: this.csAct, k: this.csK }; }

  cueReset(b) {
    this.csSrc = b?.src ?? this.csSrc;
    this.csPrev = this.csSrc;
    this.csOpen = new Set(b?.open ?? []);
    this.csAct = b?.act ?? null;
    this.csK = b?.k ?? 4;
    this.repaint();
  }

  testState() {
    const n = SRC[this.csSrc].n;
    return { beat: this.stepIndex, source: this.csSrc, controlsSmoke: n, gap: CASE_N - n, open: [...this.csOpen].sort(), perCase: this.csK, precision: Math.round((100 * this.csK) / (this.csK + 1)) };
  }

  destroy() {
    this.root?.removeEventListener('click', this.csListen);
    super.destroy();
  }

  css() {
    return SIM_CROWD_CSS + `
.svs-head { justify-content: flex-start; }
.cs-lab { position: absolute; display: flex; flex-direction: column; gap: 2px; font: 500 var(--sim-text-md)/1.25 var(--sim-font); color: var(--sim-label-muted); }
.cs-lab b { font: 700 var(--sim-text-lg)/1.2 var(--sim-font); color: var(--sim-label); }
.cs-lab--case b { color: var(--sim-annot); }
.cs-note { position: absolute; font: 600 var(--sim-text-md)/1.3 var(--sim-font); color: var(--sim-label-muted); }
.cs-note--why { color: var(--sim-label); font-style: italic; }
.cs-bars { position: absolute; transition: opacity 0.3s ease; }
.cs-bars--quiet { opacity: 0.3; }
.cs-vbar { position: absolute; bottom: 0; }
.cs-vfill { position: absolute; left: 0; right: 0; bottom: 0; background: var(--sim-label-muted); transition: height 0.25s linear; }
.cs-vbar--case .cs-vfill { background: var(--sim-annot); }
.cs-vnum { position: absolute; left: -10px; right: -10px; text-align: center; font: 700 var(--sim-text-lg)/1 var(--sim-font); color: var(--sim-label); transition: bottom 0.25s linear; }
.cs-vbar--case .cs-vnum { color: var(--sim-annot); }
.cs-vbar::after { content: ''; position: absolute; left: -14px; right: -14px; bottom: -1px; height: 1px; background: var(--sim-label); }
.cs-gap { position: absolute; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; white-space: nowrap; }
.cs-gap .sim-numeral { font: 400 64px/1.1 var(--sim-font-numeral, var(--sim-font)); font-variant-numeric: lining-nums tabular-nums; color: var(--sim-label); }
.cs-gapw { font: 600 var(--sim-text-md)/1.2 var(--sim-font); color: var(--sim-label-muted); }
.cs-bars--row .cs-gap { transform: none; align-items: flex-start; }
.cs-hbar { position: absolute; left: 0; height: 32px; display: flex; align-items: center; }
.cs-hfill { position: absolute; left: 0; top: 4px; bottom: 4px; background: var(--sim-label-muted); transition: width 0.25s linear; }
.cs-hbar--case .cs-hfill { background: var(--sim-annot); }
.cs-hnum { white-space: nowrap; position: absolute; left: 140px; font: 700 17px/1 var(--sim-font); color: var(--sim-label); font-variant-numeric: tabular-nums; }
.cs-hbar::before { content: ''; position: absolute; left: 0; right: 0; top: 50%; border-top: 1px dashed color-mix(in oklab, var(--sim-label) 30%, transparent); }
.cs-cards { position: absolute; display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 10px; }
.cs-card { pointer-events: auto; display: flex; flex-direction: column; gap: 4px; min-height: 80px; padding: 10px 12px; box-sizing: border-box; text-align: left; border: 1.5px solid var(--sim-label); border-radius: var(--sim-radius-sm); background: var(--sim-bg-surface); color: var(--sim-label-muted); font: 500 var(--sim-text-md)/1.3 var(--sim-font); cursor: pointer; }
.cs-card b { font-weight: 700; color: var(--sim-label); }
.cs-cards--tabs { grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px; }
.cs-tab { min-height: 56px; padding: 6px 10px; justify-content: center; }
.cs-weak { grid-column: 1 / -1; min-height: 52px; padding: 8px 12px 8px 14px; box-sizing: border-box; border-left: 5px solid var(--sim-annot); background: var(--sim-annot-tint); font: 500 var(--sim-text-md)/1.35 var(--sim-font); color: var(--sim-label); }
.cs-weak b { font-weight: 700; }
.cs-weak--idle { border-left-color: var(--sim-label-muted); background: none; color: var(--sim-label-muted); font-style: italic; }
.cs-foot { display: flex; flex-wrap: wrap; align-items: baseline; gap: 4px 16px; }
.cs-card--open { border-color: color-mix(in oklab, var(--sim-label) 35%, transparent); color: var(--sim-label); }
.cs-card--act { border: 1.5px solid var(--sim-annot); border-left-width: 5px; background: var(--sim-annot-tint); }
.cs-card:focus-visible, .cs-tog:focus-visible, .cs-k:focus-visible { outline: 2px solid var(--sim-annot); outline-offset: 2px; }
.cs-togrow, .cs-num { position: absolute; display: flex; flex-direction: column; gap: 8px; }
.cs-toglab { font: 700 var(--sim-text-md)/1.2 var(--sim-font); color: var(--sim-label); }
.cs-togs { display: flex; gap: 8px; flex-wrap: wrap; }
.cs-tog { pointer-events: auto; min-height: 48px; padding: 6px 16px; border-radius: var(--sim-radius-sm); border: 1.5px solid var(--sim-label); background: var(--sim-bg-surface); color: var(--sim-label); font: 600 var(--sim-text-md)/1.2 var(--sim-font); cursor: pointer; }
.cs-tog--on, .cs-k--on { background: var(--sim-annot); border-color: var(--sim-annot); color: var(--sim-bg-surface); }
.cs-num .cs-top { display: flex; align-items: flex-end; justify-content: space-between; gap: 8px 18px; flex-wrap: wrap; }
.cs-steprow { display: flex; flex-direction: column; align-items: flex-start; align-items: center; gap: 12px; flex-wrap: wrap; }
.cs-ks { display: flex; gap: 6px; }
.cs-k { pointer-events: auto; width: 48px; height: 48px; border-radius: var(--sim-radius-sm); border: 1.5px solid var(--sim-label); background: var(--sim-bg-surface); color: var(--sim-label); font: 700 var(--sim-text-xl)/1 var(--sim-font); cursor: pointer; }
.cs-effrow { display: flex; flex-direction: row; align-items: center; gap: 14px; flex-wrap: wrap; }
.cs-eff { font: 400 72px/1 var(--sim-font-numeral, var(--sim-font)); color: var(--sim-annot); font-variant-numeric: lining-nums tabular-nums; }
.cs-eff small { font-size: 26px; color: var(--sim-label-muted); }
.cs-efflab { font: 600 var(--sim-text-md)/1.3 var(--sim-font); color: var(--sim-label); max-width: 150px; }
.cs-track { position: relative; height: 18px; margin: 4px 0 24px; background: color-mix(in oklab, var(--sim-label) 10%, transparent); }
.cs-fill { position: absolute; left: 0; top: 0; bottom: 0; background: var(--sim-annot); transition: width 0.4s ease; }
.cs-tick { position: absolute; top: -4px; bottom: -4px; width: 2px; margin-left: -1px; background: var(--sim-label); }
.cs-tl { position: absolute; top: 26px; transform: translateX(-50%); font: 600 var(--sim-text-md)/1 var(--sim-font); font-style: normal; color: var(--sim-label); }
.cs-lvl { position: absolute; height: 0; border-top: 1.5px dashed var(--sim-annot); }
.cs-brk { position: absolute; width: 8px; border: 2px solid var(--sim-label); border-left: 0; transition: height 0.25s linear, bottom 0.25s linear; }
.cs-tl--on { color: var(--sim-annot); font-weight: 800; }
.cs-gain { font: 700 var(--sim-text-md)/1.3 var(--sim-font); color: var(--sim-label); }
.cs-cap { font: 500 var(--sim-text-md)/1.35 var(--sim-font); color: var(--sim-label-muted); font-style: italic; }
.sim-dom-root--portrait .cs-lab, .sim-dom-root--portrait .cs-note, .sim-dom-root--portrait .cs-card, .sim-dom-root--portrait .cs-toglab, .sim-dom-root--portrait .cs-tog, .sim-dom-root--portrait .cs-gain, .sim-dom-root--portrait .cs-cap, .sim-dom-root--portrait .cs-efflab, .sim-dom-root--portrait .cs-gapw { font-size: 17px; }
.sim-dom-root--portrait .cs-card { padding: 8px 10px; min-height: 72px; }
.sim-dom-root--portrait .cs-eff { font-size: 60px; }
.sim-dom-root--portrait .cs-gap .sim-numeral { font-size: 56px; }
@media (prefers-reduced-motion: reduce) { .cs-vfill, .cs-hfill, .cs-fill, .cs-vnum { transition: none; } }
`;
  }
}
