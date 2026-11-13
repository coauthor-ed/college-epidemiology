/**
 * LenzBackScene - L01 s06, the 1961 file read backward (thalidomide). One dot = one mother.
 * Blue = mother of an affected baby (a case); grey = mother of a normal baby (a control).
 * FILLED = took thalidomide in early pregnancy; HOLLOW = did not (beat 1: not asked yet, the legend says so).
 *   step 0 (cue mothers)   46 mothers of affected babies walk in, hollow; the question waits beside them
 *   step 1 (cue took)      learner taps "Ask: which drugs in early pregnancy?": each mother answers, 41 fill,
 *                          5 stay hollow, then they sort into "took" and "did not"; 41 of 46 lands large
 *   step 2 (cue textbook)  the textbook's 300 mothers of normal babies arrive, all hollow, in a dashed outline
 *                          labelled "the textbook's figure"
 *   step 3 (cue table)     the 300 drop into the "did not take it" row: 41 | 0 over 5 | 300, the table as people
 *   step 4 (cue backward)  the time line under the crowd: pills 1958-61, then births; the inquiry arrow runs
 *                          BACK from the babies to the pills: "case-control: effect to cause"
 *   step 5 (cue check)     the textbook's 300 are marked as not in the accounts of Lenz's enquiry; a second
 *                          panel: Weicker et al. 1962, 34 of 50 against 2 of 90, one dot = one mother
 *   step 6 (cue sources)   the two sources tag their panels
 *   step 7 (cue firstcol)  the controls fade out (a toggle brings them back): "41 of 46: compared with what?";
 *                          shown again, the card goes and the 300 control mothers read plainly. Each press of the
 *                          toggle sends scene-interact-done; the beat is exploration (Done/Skip), so it never moves on.
 * Every step lands at rest on its finished picture; cues and the chips replay the move (NarrationCues.js).
 */
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { SIM_CROWD_CSS, crowdLive, legendHtml } from 'simulations/base/kit/SimCrowd.js';
import { flowChipHtml, bindFlow } from 'simulations/base/kit/SimFlowDom.js';
import { withNarrationCues } from './NarrationCues.js';

// 46 cases, 41 took the drug (the 5 who did not are spread through the unsorted crowd); 300 controls, none took it.
const CASES = Array.from({ length: 46 }, (_, i) => ({ id: `c${i}`, ill: true, ex: (i * 9) % 46 < 41 }));
const CTRL = Array.from({ length: 300 }, (_, i) => ({ id: `k${i}`, ill: false, ex: false }));
// Weicker et al. 1962: 34 of 50 case mothers, 2 of 90 control mothers took the drug.
const WCASE = Array.from({ length: 50 }, (_, i) => ({ id: `w${i}`, ill: true, ex: i < 34 }));
const WCTRL = Array.from({ length: 90 }, (_, i) => ({ id: `v${i}`, ill: false, ex: i < 2 }));
const TOOK = CASES.filter((p) => p.ex), NOT = CASES.filter((p) => !p.ex);
const ASK_MS = 1600;

// Narration focus (spec W1 D29n): n = a data-narr id, '-' = data-narr-hide; inert with narration off.
// Ids: cases, ask, pay (41 of 46), ctrl (+ textbook tag), table (both groups + rule + 0), timeline, backward (arrow),
// check (the note), weicker / wcase / wctrl, sources, what (41 of 46: compared with what?), cover (the chip).
// The legend and the ask replay chip are never spoken: hidden while narrated.
const na = (n) => (!n ? '' : n === '-' ? ' data-narr-hide=""' : ` data-narr="${n}"`);
const hideTag = (html) => html.replace(/^<(\w+)/, '<$1 data-narr-hide=""');
const narrTag = (html, n) => html.replace(/^<(\w+)/, `<$1 data-narr="${n}"`);
const lab = (x, y, html, cls = '', n = '') => `<span class="lb-lab ${cls}"${na(n)} style="left:${x.toFixed(1)}px;top:${y.toFixed(1)}px">${html}</span>`;
const fx = (v) => v.toFixed(1);

function mkLay(r, step) { return { r, step, pos: new Map(), boxOf: new Map(), boxes: [], rules: [] }; }
function place(lay, list, x, y, cols, step, key = 'all') {
  list.forEach((p, i) => { lay.pos.set(p.id, { x: x + step * (i % cols + 0.5), y: y + step * (Math.floor(i / cols) + 0.5) }); lay.boxOf.set(p.id, key); });
  return Math.ceil(list.length / cols) * step;
}

class LenzBackBase extends SvgScene {}

export class LenzBackScene extends withNarrationCues(LenzBackBase) {
  static BEAT_STEP_MAP = [0, 1, 2, 3, 4, 5, 6, 7].map((i) => [{ idx: i, dwellMs: null }]);
  static ARIA_LABEL = 'The 1961 thalidomide file as people. 46 mothers of babies with malformations are asked which drugs they took in early pregnancy: 41 took thalidomide, 5 did not. The textbook adds 300 mothers of normal babies, none of whom took it. A time line shows the study looking back from the babies to the pills: case-control, effect to cause. A second study, Weicker 1962, found 34 of 50 against 2 of 90. Without the controls, 41 of 46 has nothing to be compared with.';
  static CONTROLS = [];
  static SETTING = 'none';
  static HEIGHT = 560;
  static PORTRAIT_HEIGHT = 700;
  static CUES = ['mothers', 'took', 'textbook', 'table', 'backward', 'check', 'sources', 'firstcol'];

  async setup() {
    this.lz = { gen: 0, came: null, last: null, walk: false, phase: 'rest', answered: 46, hide: true, draw: false };
    await super.setup();
    bindFlow(this.root, { action: (name) => {
      if (name === 'ask') { if (this.lz.phase === 'ask') return; this.runAsk(); this.interactDone?.('ask'); }
      else if (name === 'cover') { this.lz.hide = !this.lz.hide; this.repaint(); this.interactDone?.('cover'); }
    } });
  }

  enter(step) {
    const s = this.lz;
    s.came = s.last != null && Math.abs(s.last - step) === 1 ? s.last : null;
    s.last = step;
    s.gen++;
    s.walk = false; s.phase = 'rest'; s.answered = 46; s.hide = true;
    s.draw = step === 4 || step === 7;
    if (step === 1 && s.came === 0) this.runAsk(true);
  }

  runAsk(fromEnter = false) {
    if (this.stepIndex !== 1 && !fromEnter) return;
    const s = this.lz;
    s.phase = 'ask'; s.answered = 0;
    if (!fromEnter) this.repaint();
    const n = 8;
    for (let i = 1; i <= n; i++) this.after((0.35 + (ASK_MS / 1000) * i / n), () => { s.answered = Math.round((46 * i) / n); this.repaint(); });
    this.after(0.35 + ASK_MS / 1000 + 0.5, () => { s.phase = 'rest'; this.repaint(); });
  }

  applyCue(id) {
    const s = this.lz, k = this.stepIndex;
    if (this.constructor.CUES[k] !== id) return;
    if (k === 0) { s.gen++; s.walk = true; s.came = null; this.repaint(); return; }
    if (k === 1) { this.runAsk(); return; }
    s.gen++; s.came = k - 1; s.draw = true; s.hide = true; this.repaint();
  }

  cueBase() { return null; }
  cueReset() { const s = this.lz; s.phase = 'rest'; s.answered = 46; s.walk = false; s.hide = true; this.repaint(); }

  /** The geometry for a step: pure in (step, stage). */
  geo(k, st) {
    const P = st.portrait, W = st.W;
    const g = { P, W };
    if (!P) {
      g.cases = k <= 1 ? { x: 20, cols: 9, step: 26, head: 18 } : { x: 20, cols: 10, step: 22, head: 18 };
      g.rowY = k <= 1 ? [60, 230] : [60, 210];                      // block tops of the took row and the did-not row
      g.ctrl = { x: 262, w: W - 20 - 262, cols: 30, y2: 60, y3: 222 };
      g.ctrl.step = g.ctrl.w / g.ctrl.cols;
      g.pay = { x: 262, y: 60, w: W - 20 - 262, h: k <= 1 ? 220 : 290 };
      g.tl = { y: k <= 1 ? 296 : 366, x0: 74, x1: W - 30 };
      g.wk = { y: 368 };
      g.H = (k === 5 || k === 6) ? 492 : (k <= 1 ? 388 : 458);
    } else {
      const step = (W - 32) / 12;
      g.cases = { x: 16, cols: 12, step, head: 18 };
      g.rowY = [62, 62 + 4 * step + 34];
      const cy = g.rowY[1] + step + 46;
      const small = k === 5 || k === 6;
      g.ctrl = { x: 16, w: W - 32, cols: small ? 30 : 25, y2: cy, y3: cy };
      g.ctrl.step = g.ctrl.w / g.ctrl.cols;
      const ch = Math.ceil(300 / g.ctrl.cols) * g.ctrl.step;
      g.pay = { x: 16, y: cy - 30, w: W - 32, h: 170 };
      const low = k <= 1 ? g.pay.y + g.pay.h + 10 : cy + ch + 40;
      g.tl = { y: low, x0: 58, x1: W - 20 };
      g.wk = { y: low - 4 };
      g.H = (k === 5 || k === 6) ? low + 150 : (k === 7 ? low : low + 92);
    }
    return g;
  }

  stageHeight(st) { return this.geo(this.stepIndex ?? 0, st).H; }

  /** Where every crowd stands at step k (phase: the ask replay of step 1). */
  laysFor(k, st, phase = 'rest') {
    const g = this.geo(k, st), c = g.cases, out = {};
    const cr = c.step * 0.36;
    out.cases = mkLay(cr, c.step);
    if (k === 0 || (k === 1 && phase === 'ask')) place(out.cases, CASES, c.x, g.rowY[0], c.cols, c.step);
    else { place(out.cases, TOOK, c.x, g.rowY[0], c.cols, c.step, 'took'); place(out.cases, NOT, c.x, g.rowY[1], c.cols, c.step, 'not'); }
    if (k >= 2) {
      const t = g.ctrl;
      out.ctrl = mkLay(Math.min(t.step * 0.36, 6.5), t.step);
      const y = g.P ? t.y3 : (k === 2 ? t.y2 : t.y3);
      out.ctrlBox = { x: t.x, y, w: t.w, h: place(out.ctrl, CTRL, t.x, y, t.cols, t.step, 'ctrl') };
    }
    if (k === 5 || k === 6) {
      const y0 = g.wk.y;
      if (!g.P) {
        const st1 = 13.4, w1 = 13 * st1, x2 = 20 + w1 + 150;
        out.wc = mkLay(st1 * 0.36, st1); place(out.wc, WCASE, 20, y0 + 66, 13, st1);
        out.wk = mkLay(st1 * 0.36, st1); place(out.wk, WCTRL, x2, y0 + 66, 23, st1);
        out.wkBox = [{ x: 20, y: y0 + 66, w: w1 }, { x: x2, y: y0 + 66, w: 23 * st1 }];
      } else {
        const st1 = (g.W - 32) / 25;
        out.wc = mkLay(st1 * 0.36, st1); const h1 = place(out.wc, WCASE, 16, y0 + 62, 25, st1);
        out.wk = mkLay(st1 * 0.36, st1); place(out.wk, WCTRL, 16, y0 + 62 + h1 + 40, 25, st1);
        out.wkBox = [{ x: 16, y: y0 + 62, w: g.W - 32 }, { x: 16, y: y0 + 62 + h1 + 40, w: g.W - 32 }];
      }
    }
    return out;
  }

  timelineSvg(g, lit, draw) {
    const t = g.tl, X = (yr) => t.x0 + ((yr - 1957) * (t.x1 - t.x0)) / 6, ay = t.y + 58;
    // Spoken only in the step that lights it (4); elsewhere it steps aside while narrated.
    const tn = lit ? 'timeline' : '-';
    let svg = `<g class="lb-tl${lit ? ' on' : ''}"${na(tn)}>`;
    svg += `<line class="lb-axis" x1="${fx(t.x0 - 8)}" y1="${ay}" x2="${fx(t.x1 + 4)}" y2="${ay}"/>`;
    svg += `<path class="lb-axhead" d="M${fx(t.x1 + 10)} ${ay} l-9 -5 v10 z"/>`;
    let over = '';
    for (let yr = 1957; yr <= 1962; yr++) { svg += `<line class="lb-tick" x1="${fx(X(yr))}" y1="${ay}" x2="${fx(X(yr))}" y2="${ay + 6}"/>`; over += lab(X(yr), ay + 18, String(yr), 'lb-yr', tn); }
    over += lab(t.x0 - 12, ay, 'time', 'lb-time', tn);
    // The pills on sale 1958 to the end of 1961; the affected babies born after them.
    const pY = t.y + 18, bY = t.y + 34;
    svg += `<rect class="lb-pills" x="${fx(X(1958))}" y="${pY}" width="${fx(X(1962) - X(1958))}" height="12"/>`;
    svg += `<rect class="lb-births" x="${fx(X(1958.8))}" y="${bY}" width="${fx(X(1962.6) - X(1958.8))}" height="12"/>`;
    over += lab(X(1958) - 6, pY + 6, 'pills', 'lb-band', tn);
    over += lab(X(1958.8) - 6, bY + 6, 'births', 'lb-band lb-band--b', tn);
    if (lit) {
      // The inquiry arrow: from the babies BACK to the pills, against time.
      const xa = X(1961.9), xb = X(1959.2), yA = t.y + 2;
      svg += `<path class="lb-arrow${draw ? ' sv-draw' : ''}"${na('backward')} style="--len:420;--dur:1.1s" d="M${fx(xa)} ${bY} C ${fx(xa)} ${yA - 14}, ${fx(xb)} ${yA - 14}, ${fx(xb)} ${pY - 2}"/>`;
      svg += `<path class="lb-arrowhead${draw ? ' lb-late' : ''}"${na('backward')} d="M${fx(xb)} ${pY - 1} l-6 -11 h12 z"/>`;
      if (g.P) over += lab((xa + xb) / 2, yA - 22, 'case-control: effect to cause', `lb-inq${draw ? ' lb-late' : ''}`, 'backward');
      else over += lab(xb - 14, t.y + 2, 'case-control: effect to cause', `lb-inq lb-r${draw ? ' lb-late' : ''}`, 'backward');
    }
    return { svg: svg + '</g>', over };
  }

  paint(st) {
    const k = this.stepIndex, s = this.lz, g = this.geo(k, st), P = g.P, W = st.W;
    const L = this.laysFor(k, st, k === 1 ? s.phase : 'rest');
    const asked = k === 0 ? 0 : (k === 1 && s.phase === 'ask' ? s.answered : 46);
    const fade = k === 7 && s.hide;
    this.people = {
      cases: CASES.map((p, i) => ({ ...p, exposed: i < asked ? p.ex : false, dim: k === 2 || k === 4, lit: false })),
      ctrl: CTRL.map((p) => ({ ...p, exposed: false, dim: k === 4 || k === 5 || fade })),
      wc: WCASE.map((p) => ({ ...p, exposed: p.ex })), wk: WCTRL.map((p) => ({ ...p, exposed: p.ex })),
    };
    this.lays = L;
    // Where the dots come from: the previous step's places when the learner stepped in, else at rest.
    const prev = s.came != null ? this.laysFor(s.came, st) : null;
    this.from = {
      cases: s.walk ? (p) => ({ x: -20, y: (L.cases.pos.get(p.id)?.y ?? 100) }) : prev?.cases ?? null,
      ctrl: s.came != null ? (prev?.ctrl ?? ((p) => ({ x: W + 20, y: L.ctrl.pos.get(p.id).y }))) : null,
      wc: s.came === 4 ? (p) => ({ x: L.wc.pos.get(p.id).x, y: L.wc.pos.get(p.id).y + 50 }) : null,
    };
    s.walk = false;
    let svg = '', over = '';
    const c = g.cases;
    // Column heads.
    over += lab(c.x, c.head, P ? '46 mothers of affected babies' : 'Mothers of affected babies', 'lb-head lb-l', 'cases table');
    // Rows: took / did not (after the answers), each with its count.
    const sorted = !(k === 0 || (k === 1 && s.phase === 'ask'));
    if (sorted) {
      over += lab(c.x, g.rowY[0] - 14, `<b class="lb-n">41</b> took thalidomide`, 'lb-row lb-l', 'cases table');
      over += lab(c.x, g.rowY[1] - 14, `<b class="lb-n">5</b> did not`, 'lb-row lb-l', 'cases table');
    }
    if (k <= 1) {
      // The payoff side: the question, then 41 of 46 large.
      const p = g.pay, cx = p.x + p.w / 2;
      if (k === 0 || s.phase === 'ask') {
        over += `<span class="lb-lab lb-ask" data-narr="ask" style="left:${fx(cx)}px;top:${fx(p.y + p.h * 0.36)}px;width:${fx(p.w)}px">Which drugs did you take<br>in early pregnancy?</span>`;
        over += lab(cx, p.y + p.h * 0.36 + (P ? 58 : 64), 'the investigators ask each mother', 'lb-sub', 'ask');
      } else {
        over += `<div class="lb-pay" data-narr="pay" style="left:${fx(cx)}px;top:${fx(p.y + p.h * 0.42)}px"><b class="sim-numeral lb-big">41 of 46</b><span>took thalidomide in early pregnancy</span></div>`;
      }
    }
    if (L.ctrl) {
      const b = L.ctrlBox, pad = 8;
      svg += `<rect class="lb-dash${k === 5 ? ' on' : ''}"${na('ctrl table')} x="${fx(b.x - pad)}" y="${fx(b.y - pad)}" width="${fx(b.w + 2 * pad)}" height="${fx(b.h + 2 * pad)}" rx="6"/>`;
      if (!P) over += lab(g.ctrl.x, c.head, 'Mothers of normal babies', `lb-head lb-l${fade ? ' lb-fade' : ''}`, 'ctrl table');
      if (P) over += lab(b.x + b.w + pad, b.y + b.h + pad + 4, "the textbook's figure", `lb-tag lb-tag--b${fade ? ' lb-fade' : ''}`, 'ctrl textbook');
      else over += lab(b.x + b.w + pad, b.y - pad - 2, "the textbook's figure", `lb-tag${fade ? ' lb-fade' : ''}`, 'ctrl textbook');
      if (k === 5) over += `<div class="lb-pay lb-pay--q lb-note" data-narr="check" style="left:${fx(b.x + b.w / 2)}px;top:${fx(b.y + b.h / 2)}px"><span>the textbook's figure:</span><span>not in the accounts of Lenz's enquiry</span></div>`;
      if (P) over += lab(b.x, b.y - pad - 18, k >= 3 && k !== 5 && k !== 6 ? '<b class="lb-n">300</b> did not take it, <b class="lb-n">0</b> took it' : '<b class="lb-n">300</b> mothers of normal babies', `lb-row lb-l${k === 3 ? ' lb-on' : ''}${fade ? ' lb-fade' : ''}`, 'ctrl table');
      else if (k >= 3) {
        over += lab(g.ctrl.x, g.rowY[0] - 14, '<b class="lb-n">0</b> took it', `lb-row lb-l${fade ? ' lb-fade' : ''}`, 'ctrl table');
        over += lab(g.ctrl.x, g.rowY[1] - 14, '<b class="lb-n">300</b> did not', `lb-row lb-l${fade ? ' lb-fade' : ''}`, 'ctrl table');
        if (k === 3 || k === 4) over += lab(g.ctrl.x + g.ctrl.w / 2, g.rowY[0] + 52, '0', `lb-zero${k === 3 ? ' on' : ''}`, 'ctrl table');
        svg += `<line class="lb-rule"${na('table')} x1="16" y1="${g.rowY[1] - 30}" x2="${W - 16}" y2="${g.rowY[1] - 30}"/>`;
      } else over += lab(g.ctrl.x, g.rowY[0] - 14, '<b class="lb-n">300</b> mothers, 0 took it', 'lb-row lb-l', 'ctrl table');
    }
    // The question card covers the control box only while the controls are hidden; shown, the 300 read plainly.
    if (k === 7 && s.hide) {
      const b = L.ctrlBox;
      over += `<div class="lb-pay lb-pay--q" data-narr="what" style="left:${fx(b.x + b.w / 2)}px;top:${fx(b.y + b.h / 2)}px"><b class="sim-numeral lb-big">41 of 46</b><span>compared with what?</span></div>`;
    }
    if (k === 5 || k === 6) {
      const y0 = g.wk.y, bx = L.wkBox;
      svg += `<line class="lb-rule lb-rule--k"${na('weicker')} x1="16" y1="${y0}" x2="${W - 16}" y2="${y0}"/>`;
      over += lab(16, y0 + 16, k === 6 ? 'source: Weicker et al. 1962, as summarised' : (P ? 'Weicker et al., 1962: with controls' : 'Weicker et al., 1962: a study with controls'), k === 6 ? 'lb-src lb-l' : 'lb-head lb-l', k === 6 ? 'sources' : 'weicker');
      over += lab(bx[0].x, bx[0].y - 16, '<b class="sim-numeral lb-mid lb-a">34 of 50</b> case mothers took it', 'lb-row lb-l', 'weicker wcase');
      over += lab(bx[1].x, bx[1].y - 16, '<b class="sim-numeral lb-mid">2 of 90</b> control mothers', 'lb-row lb-l', 'weicker wctrl');
      if (k === 6) {
        over += lab(W - 16, c.head, 'source: Lenz 1962', 'lb-src lb-r', 'sources');
      }
    }
    if (k <= 4 || (k === 7 && !P)) {
      const t = this.timelineSvg(g, k === 4, s.draw && k === 4);
      svg += t.svg; over += t.over;
    }
    // Head: the legend, and the move this step offers.
    const legend = legendHtml({ items: [
      { label: 'case', color: 'var(--sim-annot)', filled: true },
      { label: 'control', color: 'var(--sim-label-muted)', filled: true },
      { label: 'filled: took the drug', color: 'var(--sim-label)', filled: true },
      { label: k === 0 ? 'hollow: not asked yet' : 'hollow: did not', color: 'var(--sim-label)', filled: false },
    ] });
    let head = hideTag(legend);
    // The answers are already in at rest, so the chip offers the replay it performs; while the mothers
    // answer it is disabled, so a press never cuts the asking off halfway.
    if (k === 1) {
      const asking = s.phase === 'ask';
      const chip = flowChipHtml({ label: asking ? 'Asking each mother' : 'Ask them again', action: 'ask', icon: 'replay' });
      head = hideTag(asking ? chip.replace('<button ', '<button disabled ') : chip) + hideTag(legend);
    }
    if (k === 7) head = narrTag(flowChipHtml({ label: s.hide ? 'Show the controls' : 'Hide the controls', action: 'cover' }), 'cover') + hideTag(legend);
    return { svg, over, head };
  }

  animate() {
    const s = this.lz, L = this.lays, P = this.people, F = this.from, G = s.gen;
    crowdLive(this.live, `c${G}`, P.cases, L.cases, { from: F.cases, order: 'random', spread: 0.9, dimOpacity: 0.4 });
    if (L.ctrl) crowdLive(this.live, `k${G}`, P.ctrl, L.ctrl, { from: F.ctrl, order: 'random', spread: 1.0, dimOpacity: this.stepIndex === 7 ? 0.12 : 0.35 });
    if (L.wc) {
      crowdLive(this.live, `w${G}`, P.wc, L.wc, { from: F.wc, order: 'random', spread: 0.5 });
      crowdLive(this.live, `v${G}`, P.wk, L.wk, { from: F.wc ? (p) => ({ x: L.wk.pos.get(p.id).x, y: L.wk.pos.get(p.id).y + 50 }) : null, order: 'random', spread: 0.6, delay: 0.2 });
    }
    // Narration focus: each crowd is one tagged group (its dots are not tagged on their own).
    for (const [key, n] of [[`c${G}`, 'cases table'], [`k${G}`, 'ctrl table'], [`w${G}`, 'weicker wcase'], [`v${G}`, 'weicker wctrl']]) {
      const e = this.live.get(key);
      if (e && e.getAttribute('data-narr') !== n) e.setAttribute('data-narr', n);
    }
  }

  css() {
    return SIM_CROWD_CSS + `
.svs-head { gap: 8px 16px; flex-wrap: wrap; justify-content: center; }
.svs-head .scw-legend { font-size: 16px; justify-content: center; gap: 4px 14px; }
.sflow-chip { min-height: 44px; font-size: 17px; }
.sflow-chip:disabled { opacity: 0.55; cursor: default; pointer-events: none; }
.lb-lab { position: absolute; transform: translate(-50%, -50%); white-space: nowrap; font: 600 17px/1.2 var(--sim-font); color: var(--sim-label); transition: opacity 0.5s ease; }
.lb-l { transform: translate(0, -50%); }
.lb-r { transform: translate(-100%, -50%); }
.lb-head { font-size: 18px; font-weight: 700; }
.lb-row { font-weight: 600; color: var(--sim-label-muted); }
.lb-row .lb-n { font: 400 26px/1 var(--sim-font-numeral); color: var(--sim-label); margin-right: 4px; }
.lb-on { color: var(--sim-label); }
.lb-muted { font-weight: 500; }
.lb-fade { opacity: 0.25; }
.lb-ask { font: 400 28px/1.2 var(--sim-font-numeral); text-align: center; white-space: normal; color: var(--sim-label); }
.lb-sub { font-size: 17px; font-weight: 500; color: var(--sim-label-muted); }
.lb-pay { position: absolute; transform: translate(-50%, -50%); display: flex; flex-direction: column; align-items: center; gap: 10px; white-space: nowrap; font: 600 18px/1.2 var(--sim-font); color: var(--sim-label); animation: lb-in 0.6s ease both; }
.lb-big { font: 400 84px/1 var(--sim-font-numeral); color: var(--sim-annot); }
.lb-pay--q { padding: 14px 22px; background: color-mix(in srgb, var(--sim-bg-surface) 88%, transparent); }
.lb-pay--q .lb-big { font-size: 72px; }
.lb-pay--q span { font: 400 30px/1.1 var(--sim-font-numeral); }
.lb-note span { font: 600 18px/1.3 var(--sim-font); color: var(--sim-label); white-space: normal; text-align: center; }
.lb-note span:first-child { font-weight: 700; }
.lb-mid { font: 400 32px/1 var(--sim-font-numeral); color: var(--sim-label); margin-right: 6px; }
.lb-mid.lb-a { color: var(--sim-annot); }
.lb-tag { transform: translate(-100%, -100%); font: italic 500 16px/1.2 var(--sim-font); color: var(--sim-label-muted); background: var(--sim-bg-surface); padding: 0 6px; }
.lb-tag--b { transform: translate(-100%, 0); }
.lb-tag.on { color: var(--sim-label); font-weight: 700; }
.lb-zero { font: 400 72px/1 var(--sim-font-numeral); color: var(--sim-label-muted); }
.lb-zero.on { color: var(--sim-label); animation: lb-in 0.6s ease 0.8s both; }
.lb-src { font: italic 500 16px/1.2 var(--sim-font); color: var(--sim-label); background: var(--sim-annot-tint); padding: 2px 8px; animation: lb-in 0.5s ease both; }
.lb-yr { transform: translate(-50%, 0); font-size: 16px; font-weight: 500; color: var(--sim-label-muted); }
.lb-time { transform: translate(-100%, -50%); font-size: 16px; font-weight: 600; color: var(--sim-label-muted); }
.lb-band { transform: translate(-100%, -50%); font-size: 16px; font-weight: 600; color: var(--sim-label-muted); }
.lb-band--b { color: var(--sim-annot); }
.lb-inq { font: 700 18px/1.2 var(--sim-font); color: var(--sim-annot); background: var(--sim-bg-surface); padding: 0 6px; }
.lb-late { animation: lb-in 0.4s ease 1s both; }
@keyframes lb-in { from { opacity: 0; } to { opacity: 1; } }
svg .lb-axis, svg .lb-tick { stroke: var(--sim-label-muted); stroke-width: 1.5; }
svg .lb-axhead { fill: var(--sim-label-muted); }
svg .lb-pills { fill: var(--sim-label-muted); opacity: 0.55; }
svg .lb-births { fill: var(--sim-annot); opacity: 0.55; }
svg .lb-tl.on .lb-pills, svg .lb-tl.on .lb-births { opacity: 0.9; }
svg .lb-arrow { fill: none; stroke: var(--sim-annot); stroke-width: 3; stroke-linecap: round; }
svg .lb-arrowhead { fill: var(--sim-annot); }
svg .lb-dash { fill: none; stroke: var(--sim-label-muted); stroke-width: 1.5; stroke-dasharray: 6 5; }
svg .lb-dash.on { stroke: var(--sim-label); stroke-width: 2; }
svg .lb-rule { stroke: var(--sim-label-muted); stroke-width: 1; opacity: 0.5; }
svg .lb-rule--k { opacity: 0.8; stroke-width: 1.5; }
`;
  }
}
