/**
 * ConfoundingSplitScene - analytical-epidemiology L02 s06 (slide 8) "smoking hides behind drinking; match on it, never on drinking".
 * Illustrative numbers (the slide says so). One dot = one person, and a dot means the same thing in every view:
 *   colour  blue = case (has oesophageal cancer), grey = control (no cancer)
 *   fill    FILLED = drinks alcohol, HOLLOW = does not drink
 *   spot    a small light spot with an ink rim on the dot's upper right corner = smokes (drawn on every smoker, in every view)
 * The legend says all three in words and stays visible. Column heads say who is in each column (the controls'
 * title changes when they are re-picked) and the share who drink ("60 of 100 drink"), plus the share who smoke.
 *   Beat 0 together: 100 cases, 60 drink, 55 smoke | 112 controls, 40 drink, 22 smoke.
 *   Beat 1 split:     button "Split by smoking": four labelled groups (Cases who smoke, Controls who smoke, Cases
 *                     who do not smoke, Controls who do not smoke), each with "k of n drink": 50 of 55 | 20 of 22
 *                     (91 | 91); 10 of 45 | 20 of 90 (22 | 22).
 *   Beat 2 match:     "Match controls on smoking" (head line: for each case, a control with the same smoking habit):
 *                     33 smoking controls walk in, 45 non-smoking controls leave; 100 controls, 55 smoke, 60 drink;
 *                     controls title "picked to match the cases on smoking", "before matching: 40 of 112".
 *   Beat 3 overmatch: "Instead, match on drinking" (head line: for each case, a control who drinks the same way): from
 *                     the first controls, 20 drinking controls walk in, 32 non-drinkers leave; groups become Cases /
 *                     Controls who drink (60 | 60) and who do not (40 | 40); red note "Wrong move".
 * Frozen beats: a cold landing (deep link, Previous, resume) shows the beat's finished picture; arriving by
 * Next shows the previous picture with the move waiting for the learner (or its narration cue).
 * Cues: crude, split, match, overmatch (each applies its beat's move, never counts as the learner's).
 * Completion: the button click that applies the move sends scene-interact-done (exploration waits use Done/Skip).
 * Narration focus ids: legend, legend-colour, legend-fill, legend-smoke, explain, ctl, cases, controls, ctitle,
 * drink, smoke, before, dots, smokers, nonsmokers, drank, nodrink, <band>-cases, <band>-controls, shares, note.
 */
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { SIM_CROWD_CSS, crowdLive, gridLayout, dotLook } from 'simulations/base/kit/SimCrowd.js';
import { withNarrationCues } from '../L01/NarrationCues.js';

// 100 cases: 55 smokers (50 drink), 45 non-smokers (10 drink).
const CASES = Array.from({ length: 100 }, (_, i) => {
  const smoker = i < 55;
  return { id: `k${i}`, ill: true, smoker, exposed: smoker ? i < 50 : i < 65 };
});
// 112 controls: 22 smokers (20 drink), 90 non-smokers (20 drink).
const CTRL = Array.from({ length: 112 }, (_, i) => {
  const smoker = i < 22;
  return { id: `c${i}`, ill: false, smoker, exposed: smoker ? i < 20 : i < 42 };
});
// 100 controls matched on smoking: 55 smokers (50 drink), 45 non-smokers (10 drink).
// Kept from the first controls where they fit (same id, the dot stays); m* are newly picked smoking controls.
const MATCHED = (() => {
  const c = (i) => CTRL[i];
  const m = (i, exposed) => ({ id: `m${i}`, ill: false, smoker: true, exposed });
  const out = [];
  for (let i = 0; i < 20; i++) out.push(c(i));
  for (let i = 0; i < 30; i++) out.push(m(i, true));
  out.push(c(20), c(21), m(30, false), m(31, false), m(32, false));
  for (let i = 22; i < 32; i++) out.push(c(i));
  for (let i = 42; i < 77; i++) out.push(c(i));
  return out;
})();
// 100 controls matched on drinking instead (picked from the first controls): 60 drink, 40 do not.
// The 40 drinkers stay, d* are 20 newly picked drinkers (10 smoke); 40 non-drinkers stay, the rest leave.
const OVER = (() => {
  const out = [];
  for (let i = 0; i < 20; i++) out.push(CTRL[i]);
  for (let i = 22; i < 42; i++) out.push(CTRL[i]);
  for (let i = 0; i < 20; i++) out.push({ id: `d${i}`, ill: false, smoker: i < 10, exposed: true });
  out.push(CTRL[20], CTRL[21]);
  for (let i = 42; i < 80; i++) out.push(CTRL[i]);
  return out;
})();

const VIEWS = ['crude', 'split', 'matched', 'over'];
const MAP = [0, 1, 2, 3].map((i) => [{ idx: i, dwellMs: null }]);
const BTN = [null,
  ['Split by smoking', 'Put them back together'],
  ['Match controls on smoking', 'Undo the matching'],
  ['Instead, match on drinking', 'Undo: back to matching on smoking'],
];
// One plain sentence per move: what the button does, shown before and after it is pressed.
const EXPLAIN = [
  'One dot is one person. Illustrative numbers.',
  'Splitting: compare smokers only with smokers, and non-smokers only with non-smokers.',
  'Matching on smoking: for each case, we pick a control who has the same smoking habit.',
  'Matching on drinking: for each case, we pick a control who drinks the same way.',
];
const ctrlOf = (view) => (view === 'matched' ? MATCHED : view === 'over' ? OVER : CTRL);
// Drinkers first, smokers first within them, so the spots and fills read as blocks.
const byExp = (a, b) => (b.exposed - a.exposed) || (b.smoker - a.smoker);
const pct = (k, n) => Math.round((100 * k) / n);
const drinkK = (list) => list.filter((p) => p.exposed).length;
const smokeK = (list) => list.filter((p) => p.smoker).length;
const SPOT = 0.5; // smoker spot radius, as a share of the dot radius

function swatch({ color, filled = true, spot = false }) {
  const s = dotLook({ ill: false, exposed: filled }, 6.5, { well: color });
  const sp = spot ? `<circle class="cs-spot" cx="5" cy="-5" r="3.3"/>` : '';
  return `<svg viewBox="-8 -8 16 16" aria-hidden="true"><circle r="${s.r.toFixed(2)}" style="fill:${s.color};stroke:${s.color};fill-opacity:${s.fo};stroke-width:${s.sw.toFixed(2)}"/>${sp}</svg>`;
}

export class ConfoundingSplitScene extends withNarrationCues(SvgScene) {
  static WIDTH = 680;
  static HEIGHT = 560;
  static PORTRAIT_WIDTH = 380;
  static PORTRAIT_HEIGHT = 840;
  static MIN_SCALE = 0.85;
  static SETTING = 'none';
  static BEAT_STEP_MAP = MAP;
  static CONTROLS = [];
  static CUES = ['crude', 'split', 'match', 'overmatch'];
  static ARIA_LABEL = 'Illustrative case-control study of alcohol and oesophageal cancer, one dot per person. Blue dots are cases with the cancer, grey dots are controls without it; a filled dot drinks alcohol, a hollow dot does not; a small spot on the corner of a dot means that person smokes. Together: 60 of 100 cases drink against 40 of 112 controls, and 55 of 100 cases smoke against 22 of 112 controls. Split by smoking: cases who smoke 50 of 55 drink, controls who smoke 20 of 22, both 91 per cent; cases who do not smoke 10 of 45, controls who do not smoke 20 of 90, both 22 per cent. Controls matched on smoking: for each case a control with the same smoking habit; 55 of 100 smoke in both groups and 60 of 100 drink in both, so smoking can no longer explain a difference. Controls matched on drinking instead: 60 of 100 drink in both groups because they were picked that way, so the study can no longer tell whether drinking matters.';

  enter(step) {
    const came = this._csLast === step - 1;
    this._csLast = step;
    this.csDone = !came;
    this.csFly = false;
  }

  viewOf(step, done) {
    if (step === 0) return 'crude';
    if (step === 1) return done ? 'split' : 'crude';
    if (step === 2) return done ? 'matched' : 'split';
    return done ? 'over' : 'matched';
  }

  geo(st) {
    const P = st.portrait, M = P ? 8 : 16, gut = P ? 18 : 40;
    const colW = (st.W - 2 * M - gut) / 2, c = P ? 10 : 20, s = colW / c;
    return { P, M, gut, colW, c, s, r: s * 0.35, xs: [M, M + colW + gut], TOP: P ? 150 : 120, HB: P ? 62 : 47, GAP: P ? 12 : 10, NOTE: P ? 156 : 94 };
  }

  // The whole picture of a view: dot positions plus the group and note geometry. Pure in (view, stage size).
  layoutOf(view, st) {
    const g = this.geo(st);
    const ctrl = ctrlOf(view);
    const lays = [], bands = [];
    const block = (list, col, y, key) => {
      const l = gridLayout(list, { x: g.xs[col], y, w: g.colW, h: 4000 }, { r: g.r, cols: g.c, align: 'top', key, sort: byExp });
      lays.push(l);
      return Math.ceil(list.length / g.c) * g.s;
    };
    let bottom;
    if (view === 'crude') {
      bottom = g.TOP + Math.max(block(CASES, 0, g.TOP, 'cases'), block(ctrl, 1, g.TOP, 'ctrl'));
    } else {
      const parts = view === 'over'
        ? [{ id: 'drank', who: 'who drink', f: (p) => p.exposed }, { id: 'nodrink', who: 'who do not drink', f: (p) => !p.exposed }]
        : [{ id: 'smokers', who: 'who smoke', f: (p) => p.smoker }, { id: 'nonsmokers', who: 'who do not smoke', f: (p) => !p.smoker }];
      let y = g.TOP;
      parts.forEach((pt, i) => {
        const a = CASES.filter(pt.f), b = ctrl.filter(pt.f);
        const dy = y + g.HB;
        const h = Math.max(block(a, 0, dy, `k${i}`), block(b, 1, dy, `c${i}`));
        bands.push({ ...pt, y, dy, h, cols: [a, b] });
        y = dy + h + g.GAP;
      });
      bottom = y - g.GAP;
    }
    const pos = new Map(), boxOf = new Map(), boxes = [];
    for (const l of lays) { for (const [k, v] of l.pos) pos.set(k, v); for (const [k, v] of l.boxOf) boxOf.set(k, v); boxes.push(...l.boxes); }
    return { lay: { kind: 'grid', r: g.r, step: g.s, pos, boxOf, boxes, rules: [] }, bands, bottom, people: [...CASES, ...ctrl], g };
  }

  stageHeight(st) {
    let h = 0;
    for (const v of VIEWS) {
      const L = this.layoutOf(v, st);
      h = Math.max(h, L.bottom + (v === 'matched' || v === 'over' ? L.g.NOTE : 0));
    }
    return Math.ceil(h + 6);
  }

  // Which focus ids a person's dot (and its smoker spot) carries in a view.
  narrOf(p, view) {
    const side = p.ill ? 'cases' : 'controls';
    if (view === 'crude') return `${side} dots`;
    const band = view === 'over' ? (p.exposed ? 'drank' : 'nodrink') : (p.smoker ? 'smokers' : 'nonsmokers');
    return `${side} dots ${band} ${band}-${side}`;
  }

  colHead(i, view, g) {
    const list = i ? ctrlOf(view) : CASES, n = list.length, k = drinkK(list), sk = smokeK(list);
    const word = i ? 'controls' : 'cases';
    const sub = i
      ? (view === 'matched' ? 'no cancer, picked to match the cases on smoking' : view === 'over' ? 'no cancer, picked to match the cases on drinking' : 'no cancer')
      : 'have cancer';
    const picked = i && (view === 'matched' || view === 'over');
    let h = `<div class="cs-colhead" style="left:${g.xs[i]}px;top:0;width:${g.colW}px">`
      + `<div class="cs-title" data-narr="${word}${i ? ' ctitle' : ''}"><b class="cs-who cs-who--${word}">${i ? 'Controls' : 'Cases'}</b>`
      + `<span class="cs-sub${picked ? (view === 'over' ? ' cs-sub--bad' : ' cs-sub--pick') : ''}">: ${sub}</span></div>`
      + `<div class="cs-read" data-narr="${word} drink"><span class="sim-numeral cs-num">${k}</span><span class="cs-unit"> of ${n} drink</span><span class="cs-pc">${pct(k, n)}%</span></div>`;
    if (picked) {
      h += view === 'matched'
        ? `<div class="cs-line cs-before" data-narr="controls before">before matching: 40 of 112 drank (36%)</div>`
        : '<div class="cs-line cs-forced" data-narr="controls before">equal to the cases on purpose</div>';
    }
    if (view !== 'over') h += `<div class="cs-line cs-smoke" data-narr="smoke">${sk} of ${n} smoke</div>`;
    return h + '</div>';
  }

  paint(st) {
    const step = this.stepIndex ?? 0, view = this.viewOf(step, this.csDone);
    const L = this.layoutOf(view, st), g = L.g;
    this.L = L;
    let svg = '', over = '';
    over += this.colHead(0, view, g) + this.colHead(1, view, g);
    if (view === 'matched' || view === 'over') {
      over += `<span class="cs-eq${view === 'over' ? ' cs-eq--bad' : ''}" data-narr="drink" style="left:${st.W / 2}px;top:${g.TOP - (g.P ? 108 : 92)}px">=</span>`;
    }
    for (const b of L.bands) {
      svg += `<line class="cs-rule" data-narr="${b.id}" x1="${g.M}" y1="${b.y.toFixed(1)}" x2="${st.W - g.M}" y2="${b.y.toFixed(1)}"/>`;
      b.cols.forEach((list, i) => {
        const side = i ? 'controls' : 'cases', k = drinkK(list), n = list.length;
        const share = view === 'over'
          ? `<span class="sim-numeral cs-gnum">${n}</span><span class="cs-gunit"> people</span>`
          : `<span class="sim-numeral cs-gnum">${k}</span><span class="cs-gunit"> of ${n} drink</span><span class="cs-pc cs-pc--g">${pct(k, n)}%</span>`;
        over += `<div class="cs-group" data-narr="${b.id} ${b.id}-${side} shares" style="left:${g.xs[i]}px;top:${(b.y + 5).toFixed(1)}px;width:${g.colW}px">`
          + `<div class="cs-gname cs-gname--${side}">${i ? 'Controls' : 'Cases'} ${b.who}</div><div class="cs-gread">${share}</div></div>`;
      });
      if (view !== 'over') over += `<span class="cs-eq cs-eq--sm" data-narr="${b.id} shares" style="left:${st.W / 2}px;top:${(b.y + (g.P ? 30 : 18)).toFixed(1)}px">=</span>`;
    }
    const noteTop = (L.bottom + 14).toFixed(1), noteW = st.W - 2 * g.M;
    if (view === 'matched') {
      over += `<p class="cs-note" data-narr="note" style="left:${g.M}px;top:${noteTop}px;width:${noteW}px"><b>A good use of matching</b>Now smokers are equally common among cases and controls, 55 of 100 each. So smoking can no longer explain a difference in drinking, and none is left.</p>`;
    }
    if (view === 'over') {
      over += `<p class="cs-note cs-note--bad" data-narr="note" style="left:${g.M}px;top:${noteTop}px;width:${noteW}px"><b>Wrong move: never match on the thing you are testing</b>Cases and controls now drink exactly alike, because we chose them that way. Even if alcohol did cause this cancer, we would still see 60 against 60.</p>`;
    }
    const lab = BTN[step];
    const ctl = lab
      ? `<button type="button" class="cs-btn${this.csDone ? ' cs-btn--on' : ''}${step === 3 && !this.csDone ? ' cs-btn--bad' : ''}" data-cs="toggle" data-narr="ctl" aria-pressed="${this.csDone ? 'true' : 'false'}">${lab[this.csDone ? 1 : 0]}</button>`
      : '';
    const explain = `<p class="cs-explain${step === 3 ? ' cs-explain--bad' : ''}" data-narr="explain">${EXPLAIN[step]}</p>`;
    const legend = '<div class="cs-legend" role="list" aria-label="How to read the dots">'
      + `<span class="cs-li" role="listitem" data-narr="legend legend-colour">${swatch({ color: 'var(--sim-annot)' })}has cancer (case)</span>`
      + `<span class="cs-li" role="listitem" data-narr="legend legend-colour">${swatch({ color: 'var(--sim-label-muted)' })}no cancer (control)</span>`
      + `<span class="cs-li" role="listitem" data-narr="legend legend-fill">${swatch({ color: 'var(--sim-label)' })}filled: drinks</span>`
      + `<span class="cs-li" role="listitem" data-narr="legend legend-fill">${swatch({ color: 'var(--sim-label)', filled: false })}hollow: does not drink</span>`
      + `<span class="cs-li" role="listitem" data-narr="legend legend-smoke">${swatch({ color: 'var(--sim-label-muted)', filled: false, spot: true })}corner spot: smokes</span>`
      + '</div>';
    return { svg, over, head: `<div class="cs-ctl">${ctl}${explain}</div>${legend}` };
  }

  animate(st) {
    const L = this.L;
    if (!L) return;
    const W = this.sv?.W ?? 680;
    const fresh = (p) => p.id[0] === 'm' || p.id[0] === 'd';
    crowdLive(this.live, 'cs', L.people, L.lay, { from: (p) => (this.csFly && fresh(p) ? { x: W - 6, y: L.lay.pos.get(p.id)?.y ?? 0 } : null), order: 'random', spread: 0.6 });
    const view = this.viewOf(this.stepIndex ?? 0, this.csDone);
    // Smoker spots ride on their dots: read each dot's live transform after the crowd pass.
    const sg = this.live.shape('cs|spots', 'g', { cls: 'cs-spots' });
    const r = L.g.r, off = r * 0.78, rs = Math.max(2.3, r * SPOT);
    for (const p of L.people) {
      const e = this.live.get(`cs|${p.id}`);
      const n = this.narrOf(p, view);
      if (e && e.getAttribute('data-narr') !== n) e.setAttribute('data-narr', n);
      if (!p.smoker || !e) continue;
      const m = /translate\(([-\d.]+)[ ,]+([-\d.]+)\)/.exec(e.getAttribute('transform') || '');
      if (!m) continue;
      const s = this.live.shape(`cs|${p.id}|spot`, 'circle', { parent: sg, cls: 'cs-spot' });
      this.live.attrs(s, { cx: (+m[1] + off).toFixed(1), cy: (+m[2] - off).toFixed(1), r: rs.toFixed(2), 'data-narr': `${n} smoke` });
    }
  }

  async setup() {
    await super.setup();
    this._csClick = (e) => {
      const b = e.target?.closest?.('[data-cs]');
      if (!b) return;
      this.setDone(!this.csDone);
      if (this.csDone) this.interactDone(['', 'split', 'match', 'overmatch'][this.stepIndex] || 'move');
    };
    this.root.addEventListener('click', this._csClick);
  }

  setDone(v) {
    if ((this.stepIndex ?? 0) === 0 || this.csDone === v) return;
    this.csDone = v;
    this.csFly = true;
    this.repaint();
  }

  applyCue(id) {
    const want = { split: 1, match: 2, overmatch: 3 }[id];
    if (want != null && want === this.stepIndex) this.setDone(true);
  }

  cueBase() { return { done: this.csDone }; }

  cueReset(base) { this.setDone(!!base?.done); }

  testState() {
    return { beat: this.stepIndex, view: this.viewOf(this.stepIndex ?? 0, this.csDone), done: this.csDone };
  }

  destroy() {
    this.root?.removeEventListener('click', this._csClick);
    super.destroy();
  }

  css() {
    return SIM_CROWD_CSS + `
.svs-head { flex-direction: column; align-items: stretch; gap: 6px; }
.cs-ctl { display: flex; align-items: center; flex-wrap: wrap; gap: 6px 14px; min-height: 44px; }
.cs-btn { min-height: 44px; padding: 6px 16px; border: 1.5px solid var(--sim-label); border-radius: var(--sim-radius-sm); background: var(--sim-annot-tint); color: var(--sim-label);
  font: 700 var(--sim-text-md)/1.2 var(--sim-font); cursor: pointer; }
.cs-btn:hover { background: color-mix(in oklab, var(--sim-annot) 22%, transparent); }
.cs-btn--bad { border-color: var(--sim-bad); color: var(--sim-bad); background: color-mix(in oklab, var(--sim-bad) 8%, transparent); }
.cs-btn--on { background: transparent; border-color: var(--sim-label-muted); color: var(--sim-label-muted); }
.cs-btn:focus-visible { outline: 2px solid var(--sim-annot); outline-offset: 2px; }
.cs-explain { flex: 1 1 260px; margin: 0; font: 600 var(--sim-text-md)/1.3 var(--sim-font); color: var(--sim-label); }
.cs-explain--bad { color: var(--sim-bad); }
.cs-legend { display: flex; flex-wrap: wrap; align-items: center; gap: 4px 12px; padding: 5px 8px; border: 1px solid var(--sim-border); border-radius: var(--sim-radius-sm);
  font: 500 var(--sim-text-sm)/1.2 var(--sim-font); color: var(--sim-label); }
.cs-li { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; }
.cs-li svg { width: 16px; height: 16px; flex: none; overflow: visible; }
.cs-spot { fill: var(--sim-bg-surface); stroke: var(--sim-label); stroke-width: 1.4; transition: opacity 0.3s ease; }
.cs-colhead { position: absolute; font: 500 var(--sim-text-md)/1.2 var(--sim-font); color: var(--sim-label); }
.cs-title { min-height: 2.4em; }
.cs-who { font-weight: 700; }
.cs-who--cases { color: var(--sim-annot); }
.cs-who--controls { color: var(--sim-label); }
.cs-sub { color: var(--sim-label-muted); }
.cs-sub--pick { color: var(--sim-annot); font-weight: 600; }
.cs-sub--bad { color: var(--sim-bad); font-weight: 600; }
.cs-read { margin-top: 2px; display: flex; align-items: baseline; white-space: nowrap; }
.cs-num { font-size: 36px; line-height: 1; font-variant-numeric: lining-nums tabular-nums; color: var(--sim-label); }
.cs-unit { margin-left: 4px; font: 600 var(--sim-text-md)/1 var(--sim-font); color: var(--sim-label); }
.cs-pc { margin-left: 8px; font: 500 var(--sim-text-md)/1 var(--sim-font); color: var(--sim-label-muted); font-variant-numeric: tabular-nums; }
.cs-line { margin-top: 3px; font: 500 var(--sim-text-sm)/1.2 var(--sim-font); color: var(--sim-label-muted); font-variant-numeric: tabular-nums; }
.cs-forced { color: var(--sim-bad); font-weight: 600; }
.cs-smoke { color: var(--sim-label); }
.cs-rule { stroke: var(--sim-label); stroke-width: 1; opacity: 0.55; }
.cs-group { position: absolute; }
.cs-gname { font: 700 var(--sim-text-sm)/1.15 var(--sim-font); color: var(--sim-label-muted); }
.cs-gname--cases { color: var(--sim-annot); }
.cs-gread { margin-top: 2px; display: flex; align-items: baseline; white-space: nowrap; }
.cs-gnum { font-size: 21px; line-height: 1; font-variant-numeric: lining-nums tabular-nums; color: var(--sim-label); }
.cs-gunit { margin-left: 4px; font: 600 var(--sim-text-sm)/1 var(--sim-font); color: var(--sim-label); }
.cs-pc--g { font-size: var(--sim-text-sm); }
.cs-eq { position: absolute; transform: translate(-50%, 0); font: 700 36px/1 var(--sim-font-numeral, var(--sim-font)); color: var(--sim-label); }
.cs-eq--sm { font-size: 24px; color: var(--sim-label-muted); }
.cs-eq--bad { color: var(--sim-bad); }
.cs-note { position: absolute; margin: 0; padding-top: 8px; border-top: 2px solid var(--sim-annot); font: 500 var(--sim-text-md)/1.35 var(--sim-font); color: var(--sim-label); }
.cs-note--bad { border-top-color: var(--sim-bad); }
.cs-note--bad b { color: var(--sim-bad); }
.cs-note b { display: block; }
.sim-dom-root--portrait .cs-num { font-size: 32px; }
.sim-dom-root--portrait .cs-title { min-height: 3.6em; }
.sim-dom-root--portrait .cs-unit, .sim-dom-root--portrait .cs-pc { font-size: 15px; }
.sim-dom-root--portrait .cs-pc { margin-left: 6px; }
.sim-dom-root--portrait .cs-gname { min-height: 2.3em; }
.sim-dom-root--portrait .cs-gnum { font-size: 20px; }
.sim-dom-root--portrait .cs-legend { gap: 4px 12px; }
`;
  }
}
