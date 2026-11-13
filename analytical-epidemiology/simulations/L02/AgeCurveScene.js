/**
 * AgeCurveScene - cold-case file 2, the eight young women (DES, Boston 1966-1969). One dot = one woman.
 *   beat 1 (cue women-in)       eight cases arrive one at a time on a 1966-1969 strip labelled Boston; "8" large
 *   beat 2 (cues curve-draw, drop)  the usual age pattern draws on (illustrative shape); the eight drop onto the
 *                               age axis over a 15-22 bracket, on the flat part; the steep part after 50 is named
 *   beat 3 (cues follow, back)  learner taps "Follow 10,000 young women forward": 100 dots (1 dot = 100 women)
 *                               ride a 0-20 year counter; at 20 years one tiny blue mark, "about 1 case, perhaps
 *                               none"; then a reverse arrow from the eight: "start from the eight, look back"
 * Every beat lands at rest on its finished picture; cues and the button replay the move.
 */
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { SIM_CROWD_CSS, crowdLive, crowdSvg, legendHtml } from 'simulations/base/kit/SimCrowd.js';
import { flowChipHtml, bindFlow } from 'simulations/base/kit/SimFlowDom.js';
import { withNarrationCues } from '../L01/NarrationCues.js';

const CURVE = [[0, 0], [10, 0], [20, 0.3], [30, 0.7], [40, 2], [50, 7], [60, 18], [70, 30], [80, 36], [90, 38]];
const WOMEN = Array.from({ length: 8 }, (_, i) => ({ id: `w${i}`, ill: true, exposed: false }));
// Spread along the strip (no year per woman: the strip is labelled, not the dots).
const STRIP_AT = [0.07, 0.2, 0.31, 0.45, 0.56, 0.69, 0.81, 0.93];
const COHORT = Array.from({ length: 100 }, (_, i) => ({ id: `c${i}`, ill: false, exposed: false }));
const MARKED = 64;
const FWD_S = 3;

function smoothPath(pts) {
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}
// Narration focus (spec W1 D29n): n = a data-narr id, '-' = data-narr-hide; inert with narration off.
const na = (n) => (!n ? '' : n === '-' ? ' data-narr-hide=""' : ` data-narr="${n}"`);
const hideTag = (html) => html.replace(/^<(\w+)/, '<$1 data-narr-hide=""');
const narrTag = (html, n) => html.replace(/^<(\w+)/, `<$1 data-narr="${n}"`);
const lab = (x, y, html, cls = '', n = '') => `<span class="ac-lab ${cls}"${na(n)} style="left:${x.toFixed(1)}px;top:${y.toFixed(1)}px">${html}</span>`;

class AgeCurveBase extends SvgScene {}

export class AgeCurveScene extends withNarrationCues(AgeCurveBase) {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }], [{ idx: 2, dwellMs: null }]];
  static ARIA_LABEL = 'Eight young women with a cancer of later life, Boston 1966 to 1969, placed on the usual age curve of the cancer, then compared with following 10,000 young women forward for 20 years.';
  static CONTROLS = [];
  static SETTING = 'none';
  static HEIGHT = 570;
  static PORTRAIT_HEIGHT = 650;
  static CUES = ['women-in', 'curve-draw', 'drop', 'follow', 'back'];

  async setup() {
    this.acs = { gen: 0, came: null, last: null, arrive: false, draw: false, arrow: false, fwd: false };
    await super.setup();
    bindFlow(this.root, { action: (name) => { if (name === 'follow') this.runForward(true); } });
  }

  enter(step) {
    const a = this.acs;
    a.came = a.last != null && Math.abs(a.last - step) === 1 ? a.last : null;
    a.last = step;
    a.fwd = false;
    a.arrive = false;   // the arrival plays on the women-in cue; a landing is at rest
    a.draw = step === 1 && a.came === 0;
    a.arrow = step === 2 && a.came === 1;
    this.after(2.6, () => { a.draw = false; a.arrow = false; a.arrive = false; });
  }

  repaint() {
    super.repaint();
    if (this.from && this.sv && !this.isPlaying?.()) this.play(this.arriveNow ? 3.6 : 2.4);
  }

  stageHeight(st) { return st.portrait ? 510 : 452; }

  geo(st) {
    const P = st.portrait, W = st.W, H = st.H;
    const sx0 = P ? 16 : 86, sx1 = W - 16, sy = P ? 46 : 26;
    const x0 = P ? 46 : 60, x1 = W - (P ? 10 : 18), y0 = P ? 132 : 104, y1 = H - (P ? 112 : 100);
    return { P, W, H, sx0, sx1, sy, x0, x1, y0, y1, X: (a) => x0 + (a / 90) * (x1 - x0), Y: (v) => y1 - (v / 40) * (y1 - y0) };
  }

  /** Where the eight sit at step k: a pure function of (k, stage). */
  layoutOf(k, st) {
    const g = this.geo(st), pos = new Map(), r = g.P ? 7.5 : 9;
    if (k === 0) WOMEN.forEach((p, i) => pos.set(p.id, { x: g.sx0 + STRIP_AT[i] * (g.sx1 - g.sx0), y: g.sy }));
    else if (k === 1) {
      // A rug UNDER the age axis in the 15-22 band: ages only, never a rate.
      const cols = g.P ? 2 : 4, rr = g.P ? 4 : 5, ages = g.P ? [16.5, 20.5] : [15.5, 17.5, 19.5, 21.5];
      WOMEN.forEach((p, i) => pos.set(p.id, { x: g.X(ages[i % cols]), y: g.y1 + 10 + rr + Math.floor(i / cols) * (rr * 2 + 3) }));
      return { r: rr, step: rr * 2, pos, boxOf: new Map(), boxes: [], rules: [] };
    } else {
      const f = this.fwdGeo(st), step = r * 2 + 8, x1 = g.W - 24;
      WOMEN.forEach((p, i) => pos.set(p.id, { x: x1 - (7 - i) * step, y: f.backY }));
    }
    return { r, step: r * 2, pos, boxOf: new Map(), boxes: [], rules: [] };
  }

  fwdGeo(st) {
    const P = st.portrait, W = st.W;
    const r = 5.5, step = P ? 14 : 13, gw = step * 10;
    const gy = 72, tx0 = 16 + gw / 2, tx1 = W - 16 - gw / 2, ty = gy + gw + 16;
    return { r, step, gw, gy, tx0, tx1, ty, backY: P ? 440 : 398 };
  }

  /** byLearner: the button press; a narration cue replays the move but never counts as the learner's. */
  runForward(byLearner = false) {
    if (this.stepIndex !== 2) return;
    this.acs.fwd = true;
    this.repaint();
    this.play(FWD_S + 0.3);
    this.after(FWD_S + 0.4, () => { this.acs.fwd = false; this.acs.arrow = true; this.repaint(); this.after(1.2, () => { this.acs.arrow = false; }); });
    if (byLearner) this.interactDone?.('follow');
  }

  applyCue(id) {
    const a = this.acs, k = this.stepIndex;
    if (id === 'women-in' && k === 0) { a.gen++; a.arrive = true; this.repaint(); }
    else if (id === 'curve-draw' && k === 1) { a.draw = true; this.repaint(); this.after(2.6, () => { a.draw = false; }); }
    else if (id === 'drop' && k === 1) { a.gen++; a.dropFrom = true; this.repaint(); a.dropFrom = false; }
    else if (id === 'follow' && k === 2) this.runForward();
    else if (id === 'back' && k === 2) { a.arrow = true; this.repaint(); this.after(1.2, () => { a.arrow = false; }); }
  }

  cueBase() { return null; }
  cueReset() { this.acs.fwd = false; this.repaint(); }

  paint(st) {
    const k = this.stepIndex, g = this.geo(st), a = this.acs;
    this.lay = this.layoutOf(k, st);
    if (a.arrive && k === 0) this.from = (p) => ({ x: g.sx0 + STRIP_AT[Number(p.id.slice(1))] * (g.sx1 - g.sx0), y: g.sy - 46 });
    else if (a.dropFrom && k === 1) this.from = this.layoutOf(0, st);
    else this.from = a.came != null ? this.layoutOf(a.came, st) : null;
    this.arriveNow = a.arrive && k === 0;
    const legend = hideTag(legendHtml({ items: [{ label: 'a young woman with this cancer', color: 'var(--sim-annot)', filled: false }] }));
    if (k === 2) return this.paintForward(st, g, legend);
    let svg = '', over = '';
    // The calendar strip: Boston, 1966-1969.
    const dim = k === 1 ? ' ac-dim' : '';
    svg += `<g class="ac-strip${dim}" data-narr="strip"><line class="ac-rule-strong" x1="${g.sx0}" y1="${g.sy}" x2="${g.sx1}" y2="${g.sy}"/>`;
    for (let y = 0; y <= 4; y++) { const x = g.sx0 + (y / 4) * (g.sx1 - g.sx0); svg += `<line class="ac-rule" x1="${x}" y1="${g.sy - 8}" x2="${x}" y2="${g.sy + 8}"/>`; }
    svg += '</g>';
    for (let y = 0; y < 4; y++) over += lab(g.sx0 + ((y + 0.5) / 4) * (g.sx1 - g.sx0), g.sy + 26, String(1966 + y), `ac-tick${dim}`, 'strip');
    over += g.P ? lab(16, g.sy - 34, 'Boston, 1966-1969', `ac-strip-lab ac-left${dim}`, 'strip') : lab(g.sx0 - 14, g.sy, 'Boston', `ac-strip-lab ac-right${dim}`, 'strip');
    if (k === 0) {
      const cx = g.W / 2, cy = g.P ? 200 : 180;
      over += `<div class="ac-big" data-narr="eight" style="left:${cx}px;top:${cy}px"><b class="sim-numeral ac-num">8</b><span class="ac-big-t">young women</span></div>`;
      over += lab(cx, cy + (g.P ? 108 : 104), 'the oldest of them 22', 'ac-sub', 'oldest');
      over += lab(cx, cy + (g.P ? 136 : 132), 'adenocarcinoma of the vagina', 'ac-sub2', 'cancer');
      over += lab(cx, cy + (g.P ? 164 : 158), '7 of the 8 treated at one hospital', 'ac-sub2', 'hospital');
      return { svg, over, head: legend };
    }
    // Beat 2: the age curve and the eight on it.
    const { X, Y } = g;
    svg += `<line class="ac-axis" x1="${g.x0}" y1="${g.y1}" x2="${g.x1}" y2="${g.y1}"/><line class="ac-axis" x1="${g.x0}" y1="${g.y1}" x2="${g.x0}" y2="${g.y0 - 6}"/>`;
    for (const v of [10, 20, 30, 40]) svg += `<line class="ac-grid" x1="${g.x0}" y1="${Y(v)}" x2="${g.x1}" y2="${Y(v)}"/>`;
    for (const v of [0, 10, 20, 30, 40]) over += lab(g.x0 - 8, Y(v), String(v), 'ac-tick ac-right');
    const ty = g.y1 + (g.P ? 62 : 46);
    for (let t = 0; t <= 90; t += g.P ? 20 : 10) over += lab(X(t), ty, String(t), 'ac-tick');
    over += lab(g.x1, ty + 22, 'age at diagnosis, years', 'ac-axlab ac-rightedge');
    over += lab(g.x0 - (g.P ? 30 : 40), g.y0 - 26, 'new cases per 100,000 a year', 'ac-axlab ac-left');
    const pts = CURVE.map(([x, v]) => [X(x), Y(v)]);
    const draw = a.draw ? ' sv-draw' : '';
    // The steep part (50-90) as a quiet area, the flat part (0-40) lit under the eight.
    const steep = pts.slice(5);
    svg += `<path class="ac-steep-area" data-narr="steep" d="${smoothPath(steep)} L${X(90)} ${g.y1} L${X(50)} ${g.y1} Z"/>`;
    svg += `<rect class="ac-flat-band" data-narr="flat" x="${X(0)}" y="${g.y1 - 22}" width="${X(40) - X(0)}" height="22"/>`;
    svg += `<path class="ac-curve${draw}" data-narr="curve" style="--len:1400;--dur:1.6s" d="${smoothPath(pts)}"/>`;
    svg += `<path class="ac-curve-flat${draw}" data-narr="flat" style="--len:600;--dur:0.7s" d="${smoothPath(pts.slice(0, 5))}"/>`;
    over += lab(X(g.P ? 58 : 56), Y(g.P ? 28 : 30), 'where this cancer<br>usually appears', 'ac-note ac-right', 'steep');
    if (!g.P) over += lab(X(80), Y(20) + 4, 'usual<br>pattern', 'ac-curve-lab', 'curve');
    over += lab(X(26), g.y1 - 36, 'almost flat before 40', 'ac-flat-lab' + (g.P ? ' ac-hide-p' : ''), 'flat');
    // Bracket on the axis, 15-22, with a leader up to the eight.
    const b0 = X(15), b1 = X(22), lay = this.lay, ys = [...lay.pos.values()].map((p) => p.y);
    const rugB = Math.max(...ys) + lay.r + 3;
    svg += `<rect class="ac-rug" data-narr="women" x="${b0}" y="${g.y1}" width="${b1 - b0}" height="${rugB - g.y1}"/>`;
    over += lab(b1 + (g.P ? 10 : 14), (g.y1 + rugB) / 2 + 2, '8 women, ages 15-22', 'ac-eight ac-left', 'women');
    over += lab(g.W / 2, g.H - 12, 'usual pattern: illustrative shape, not measured data', 'ac-cap', '-');
    return { svg, over, head: legend };
  }

  paintForward(st, g, legend) {
    const f = this.fwdGeo(st), P = g.P, W = g.W, a = this.acs;
    let svg = '', over = '';
    // Forward: 100 dots, 1 dot = 100 women, on a 0-20 year line.
    over += lab(16, 18, 'Forward: follow 10,000 young women', 'ac-sec ac-left', 'forward');
    svg += `<line class="ac-axis" data-narr="forward" x1="${f.tx0}" y1="${f.ty}" x2="${f.tx1}" y2="${f.ty}"/>`;
    for (let yr = 0; yr <= 20; yr += 5) {
      const x = f.tx0 + (yr / 20) * (f.tx1 - f.tx0);
      svg += `<line class="ac-rule" data-narr="forward" x1="${x}" y1="${f.ty - 6}" x2="${x}" y2="${f.ty + 6}"/>`;
      over += lab(x, f.ty + 20, String(yr), 'ac-tick', 'forward');
    }
    over += lab(f.tx1 + f.gw / 2, f.ty + 44, 'years followed', 'ac-axlab ac-rightedge', 'forward');
    const pos = new Map(), r = f.r;
    COHORT.forEach((p, i) => pos.set(p.id, { x: -f.gw / 2 + f.step * (i % 10 + 0.5), y: f.gy + f.step * (Math.floor(i / 10) + 0.5) }));
    const lay = { r, pos };
    const m = pos.get(`c${MARKED}`);
    svg += `<g class="ac-fwd" data-narr="forward" transform="translate(${f.tx1} 0)">${crowdSvg(COHORT, lay)}<circle class="ac-mark" cx="${m.x}" cy="${m.y}" r="${(r * 0.55).toFixed(2)}"/></g>`;
    over += lab(16, f.ty + 44, '1 dot = 100 women', 'ac-cap ac-left', 'forward');
    const msgY = P ? f.ty + 70 : f.ty + 66;
    over += `<div class="ac-msg${P ? '' : ' ac-msg--row'}" data-narr="result" style="left:${W / 2}px;top:${msgY}px"><b class="sim-numeral ac-msg-n">about 1 case,</b><span>perhaps none, in 20 years</span></div>`;
    over += `<div class="ac-counter" data-narr="forward" style="left:${f.tx1}px;top:${f.gy - 4}px"><b class="sim-numeral ac-yr">20</b> years</div>`;
    // Backward: start from the eight, look back.
    const ys = f.backY, step = this.lay.r * 2 + 8, xL = W - 24 - 7 * step - this.lay.r - 10, ax0 = P ? 28 : 120;
    svg += `<line class="ac-rule" data-narr="back" x1="16" y1="${ys - 58}" x2="${W - 16}" y2="${ys - 58}"/>`;
    over += lab(16, ys - 38, P ? 'Backward: start from the eight' : 'Backward: start from the eight, look back', 'ac-sec ac-left', 'back');
    const draw = a.arrow ? ' sv-draw' : '';
    svg += `<path class="ac-back${draw}" data-narr="back" style="--len:600;--dur:0.9s" d="M${xL} ${ys} L${ax0} ${ys}"/><path class="ac-back-head" data-narr="back" d="M${ax0 + 12} ${ys - 9} L${ax0} ${ys} L${ax0 + 12} ${ys + 9}"/>`;
    over += lab(P ? 16 : ax0, ys + 30, P ? 'look back to their mothers\' pregnancies,<br>on record' : 'their mothers\' pregnancies, on record', 'ac-note ac-left', 'record');
    if (!P) over += lab(W - 24 - 3.5 * step, ys + 30, '8 women', 'ac-eight', 'women');
    const head = `${narrTag(flowChipHtml({ label: 'Follow 10,000 young women forward', action: 'follow', icon: 'replay' }), 'ctl')}${legend}`;
    return { svg, over, head };
  }

  animate(st, t) {
    const k = this.stepIndex;
    const spread = this.arriveNow ? 2.4 : undefined;
    crowdLive(this.live, `w${this.acs.gen}`, WOMEN, this.lay, { from: this.from, order: 'x', spread, delay: this.arriveNow ? 0.2 : 0 });
    const wg = this.live.get(`w${this.acs.gen}`);
    if (wg && wg.getAttribute('data-narr') !== 'women') wg.setAttribute('data-narr', 'women');
    if (k !== 2) return;
    const f = this.fwdGeo(st), root = this.root;
    const p = this.acs.fwd ? Math.min(1, (t ?? 0) / FWD_S) : 1;
    const e = root.querySelector('.ac-fwd'), yr = root.querySelector('.ac-yr'), mk = root.querySelector('.ac-mark'), msg = root.querySelector('.ac-msg');
    const ease = p < 1 ? p * p * (3 - 2 * p) : 1;
    if (e) e.setAttribute('transform', `translate(${(f.tx0 + ease * (f.tx1 - f.tx0)).toFixed(1)} 0)`);
    if (yr) yr.textContent = String(Math.round(ease * 20));
    if (mk) mk.style.opacity = p >= 1 ? '1' : '0';
    if (msg) msg.style.opacity = p >= 1 ? '1' : '0';
  }

  css() {
    return SIM_CROWD_CSS + `
.svs-head { gap: 10px 16px; }
.ac-lab { position: absolute; transform: translate(-50%, -50%); white-space: nowrap; font: 600 16px/1.2 var(--sim-font); color: var(--sim-label); }
.ac-left { transform: translate(0, -50%); }
.ac-right { transform: translate(-100%, -50%); text-align: right; }
.ac-rightedge { transform: translate(-100%, -50%); }
.ac-tick { color: var(--sim-label-muted); font-weight: 500; font-variant-numeric: tabular-nums; }
.ac-dim { opacity: 0.35; }
.ac-strip-lab { font-weight: 700; font-size: 18px; color: var(--sim-label); }
.ac-big { position: absolute; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; color: var(--sim-annot); }
.ac-big .ac-num { color: var(--sim-annot); margin-bottom: 14px; font: 400 128px/1 var(--sim-font-numeral); }
.ac-big-t { font: 400 30px/1.2 var(--sim-font-numeral); color: var(--sim-label); }
.ac-sub { font-size: 20px; font-weight: 600; }
.ac-sub2 { font-size: 17px; font-weight: 500; color: var(--sim-label-muted); }
.ac-axlab { font-size: 16px; font-weight: 600; color: var(--sim-label-muted); }
.ac-note { font-size: 17px; font-weight: 700; color: var(--sim-accent); line-height: 1.15; }
.ac-curve-lab { font-size: 16px; font-weight: 600; color: var(--sim-label-muted); line-height: 1.1; transform: translate(0, -50%); }
.ac-flat-lab { font-size: 16px; font-weight: 600; color: var(--sim-annot); }
.ac-eight { font-size: 18px; font-weight: 700; color: var(--sim-annot); line-height: 1.15; }
.ac-cap { font-size: 16px; font-weight: 500; font-style: italic; color: var(--sim-label-muted); }
.ac-sec { font-size: 18px; font-weight: 700; color: var(--sim-label); }
.ac-msg { position: absolute; transform: translate(-50%, 0); width: max-content; display: flex; flex-direction: column; align-items: center; font: 600 18px/1.25 var(--sim-font); color: var(--sim-label); transition: opacity 0.5s ease; text-align: center; }
.ac-msg--row { flex-direction: row; align-items: baseline; gap: 10px; }
.ac-msg-n { font: 400 34px/1.1 var(--sim-font-numeral); color: var(--sim-annot); }
.ac-counter { position: absolute; transform: translate(-50%, -100%); font: 600 18px/1 var(--sim-font); color: var(--sim-label-muted); white-space: nowrap; }
.ac-yr { font: 400 34px/1 var(--sim-font-numeral); color: var(--sim-label); font-variant-numeric: tabular-nums; }
.ac-hide-p { display: none; }
svg .ac-rule { stroke: var(--sim-label-muted); stroke-width: 1.4; }
svg .ac-rule-strong { stroke: var(--sim-label); stroke-width: 2.4; stroke-linecap: round; }
svg .ac-axis { stroke: var(--sim-label); stroke-width: 1.6; }
svg .ac-grid { stroke: var(--sim-label-muted); stroke-width: 1; stroke-opacity: 0.3; }
svg .ac-curve { fill: none; stroke: var(--sim-accent); stroke-width: 3.5; stroke-linecap: round; }
svg .ac-curve-flat { fill: none; stroke: var(--sim-annot); stroke-width: 7; stroke-linecap: round; stroke-opacity: 0.85; }
svg .ac-steep-area { fill: var(--sim-accent); fill-opacity: 0.1; stroke: none; }
svg .ac-flat-band { fill: var(--sim-annot-tint); stroke: none; }
svg .ac-rug { fill: var(--sim-annot-tint); stroke: var(--sim-annot); stroke-width: 1.2; }
svg .ac-bracket { fill: none; stroke: var(--sim-annot); stroke-width: 3; stroke-linejoin: round; }
svg .ac-leader { stroke: var(--sim-annot); stroke-width: 1.6; stroke-dasharray: 3 4; }
svg .ac-mark { fill: var(--sim-annot); transition: opacity 0.4s ease; }
svg .ac-back { fill: none; stroke: var(--sim-annot); stroke-width: 3; stroke-linecap: round; }
svg .ac-back-head { fill: none; stroke: var(--sim-annot); stroke-width: 3; stroke-linecap: round; stroke-linejoin: round; }
.svs-head .scw-legend { font-size: 16px; }
`;
  }
}
