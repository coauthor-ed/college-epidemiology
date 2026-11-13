/**
 * CaseWindowScene - who counts as a case, and from where (the live case: men with a rare liver tumour).
 * One dot = one man. Blue = has the tumour (a case); FILLED = exposed, HOLLOW = not exposed (or not yet asked,
 * when the legend says so); dashed grey = died (a ghost of the patient).
 *   beat 1 (cue define)            the case definition stamps on; men pass the door; one not confirmed is turned away
 *   beat 2 (cues window, survivors) a surgeon's clinic, illustrative: 40 patients over 12 years, 20 exposed; 24 died
 *                                  (16 exposed, 8 not). Toggle: in the clinic today (16, 4 exposed) vs newly diagnosed
 *                                  in the last 5 years (16, 8 exposed, the dead included); all who developed it 20 of 40
 *   beat 3 (cue source)            20 cases across the city; source: one surgeon's list 11 of 20 / two city hospitals
 *                                  20 of 20 / registry (dashed ring: covers everyone, may not exist for a rare tumour)
 * Every beat lands at rest on its finished picture; toggles and cues move the dots.
 */
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { SIM_CROWD_CSS, crowdLive, gridLayout, swarmLayout, scatterLayout, legendHtml, countOf } from 'simulations/base/kit/SimCrowd.js';
import { flowChoiceHtml, bindFlow } from 'simulations/base/kit/SimFlowDom.js';
import { withNarrationCues } from '../L01/NarrationCues.js';

// Beat 1: eight men at the door; one is not confirmed by histology.
// Narrated, the men are shown at cue define, as they walk in (the script speaks of the live case's twenty
// before that); the "7 cases" count is never spoken and would contradict "twenty", so it is hidden while narrated.
const DOOR = Array.from({ length: 8 }, (_, i) => ({ id: `d${i}`, ill: i !== 5, exposed: false, mark: i === 5 ? 'cross' : null }));

// Beat 2: 40 patients, year of diagnosis 1..12 (12 = this year). Exposed die sooner.
const CLINIC = (() => {
  const out = [];
  for (let i = 0; i < 12; i++) out.push({ id: `eE${i}`, ill: true, exposed: true, yr: 1 + (i % 7), died: i !== 5 });
  for (let i = 0; i < 12; i++) out.push({ id: `eU${i}`, ill: true, exposed: false, yr: 1 + ((i + 3) % 7), died: ![0, 2, 5, 8, 10].includes(i) });
  for (let i = 0; i < 8; i++) out.push({ id: `rE${i}`, ill: true, exposed: true, yr: 8 + (i % 5), died: ![3, 4, 7].includes(i) });
  for (let i = 0; i < 8; i++) out.push({ id: `rU${i}`, ill: true, exposed: false, yr: 8 + ((i + 2) % 5), died: i === 3 });
  return out;
})();
const inToday = (p) => !p.died;
const inWindow = (p) => p.yr >= 8;

// Beat 3: 20 men with the tumour across the city; the surgeon at hospital A sees 11 of them.
const CITY = Array.from({ length: 20 }, (_, i) => ({ id: `c${i}`, ill: true, exposed: false }));

// Narration focus (spec W1 D29n): n = a data-narr id, '-' = data-narr-hide; inert with narration off.
const na = (n) => (!n ? '' : n === '-' ? ' data-narr-hide=""' : ` data-narr="${n}"`);
const hideTag = (html) => html.replace(/^<(\w+)/, '<$1 data-narr-hide=""');
const narrTag = (html, n) => html.replace(/^<(\w+)/, `<$1 data-narr="${n}"`);
const lab = (x, y, html, cls = '', n = '') => `<span class="cw-lab ${cls}"${na(n)} style="left:${x.toFixed(1)}px;top:${y.toFixed(1)}px">${html}</span>`;
const exposedFirst = (a, b) => (b.exposed - a.exposed) || String(a.id).localeCompare(String(b.id));

class CaseWindowBase extends SvgScene {}

export class CaseWindowScene extends withNarrationCues(CaseWindowBase) {
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }], [{ idx: 2, dwellMs: null }]];
  static ARIA_LABEL = 'Choosing cases: a written case definition at the door, newly diagnosed patients versus the survivors still in a clinic, and the source of cases across a city.';
  static CONTROLS = [];
  static SETTING = 'none';
  static HEIGHT = 612;
  static PORTRAIT_HEIGHT = 660;
  static CUES = ['define', 'window', 'survivors', 'source'];

  async setup() {
    this.cws = { view: 'today', src: 'surgeon', gen: 0, stamp: true, walk: false, move: false };
    await super.setup();
    bindFlow(this.root, {
      action: (name, value) => {
        if (name === 'view') { this.cws.view = value; this.cws.move = true; this.repaint(); this.interactDone?.('view'); }
        if (name === 'src') { this.cws.src = value; this.cws.move = true; this.repaint(); this.interactDone?.('src'); }
      },
    });
  }

  enter(step) {
    const c = this.cws;
    c.view = 'today'; c.src = 'surgeon'; c.stamp = step === 0; c.walk = false; c.move = true; c.gen++;
    this.after(2.5, () => { c.stamp = false; });
  }

  stageHeight(st) { return st.portrait ? [480, 480, 430][this.stepIndex ?? 0] : [440, 450, 450][this.stepIndex ?? 0]; }

  repaint() {
    super.repaint();
    if (this.cws?.move && this.sv) { this.cws.move = false; this.play(this.stepIndex === 0 ? 3.6 : 2.6); }
  }

  applyCue(id) {
    const c = this.cws, k = this.stepIndex;
    if (id === 'define' && k === 0) { c.stamp = true; c.walk = true; c.gen++; c.move = true; this.repaint(); this.after(2.5, () => { c.stamp = false; c.walk = false; }); }
    else if (id === 'window' && k === 1) { c.view = 'newly'; c.move = true; this.repaint(); }
    else if (id === 'survivors' && k === 1) { c.view = 'today'; c.move = true; this.repaint(); }
    else if (id === 'source' && k === 2) { c.src = 'two'; c.move = true; this.repaint(); }
  }

  cueBase() { return null; }
  cueReset() { const c = this.cws; c.view = 'today'; c.src = 'surgeon'; c.move = true; this.repaint(); }

  paint(st) {
    const k = this.stepIndex;
    if (k === 0) return this.paintDefine(st);
    if (k === 1) return this.paintClinic(st);
    return this.paintSource(st);
  }

  // Beat 1 ---------------------------------------------------------------
  paintDefine(st) {
    const P = st.portrait, W = st.W, H = st.H, c = this.cws, pos = new Map();
    const r = P ? 12 : 15, step = r * 2 + 12;
    let svg = '', over = '';
    // The hero: the written definition, then the door it guards.
    const cardH = P ? 168 : 128;
    over += `<div class="cw-card${P ? ' cw-card-p' : ''}${c.stamp ? ' cw-stamp' : ''}" data-narr="card" style="left:${W / 2}px;top:4px;width:${W - (P ? 8 : 40)}px;height:${cardH}px">
<div class="cw-card-k">Case definition, written before the study</div>
<div class="cw-card-t">Case = histology-confirmed liver tumour; men; stage written down</div></div>`;
    const top = cardH + 22, bot = H - 10;
    if (P) {
      // Portrait: outside above, the wall across, the study below.
      const wallY = top + 92, dA = W / 2 - 46, dB = W / 2 + 46;
      svg += `<rect class="cw-room" data-narr="room" x="6" y="${wallY}" width="${W - 12}" height="${bot - wallY}"/>`;
      svg += `<line class="cw-wall" data-narr="door" x1="6" y1="${wallY}" x2="${dA}" y2="${wallY}"/><line class="cw-wall" data-narr="door" x1="${dB}" y1="${wallY}" x2="${W - 6}" y2="${wallY}"/>`;
      svg += `<path class="cw-jamb" data-narr="door" d="M${dA} ${wallY - 14} V${wallY + 14} M${dB} ${wallY - 14} V${wallY + 14}"/>`;
      over += lab(W / 2, wallY + 26, 'the door: checked against the card', 'cw-door-lab', 'door');
      over += lab(16, top + 6, 'outside', 'cw-muted cw-left', 'door');
      const cols = 4, ix0 = W / 2 - ((cols - 1) * step) / 2, iy0 = wallY + 74;
      DOOR.filter((p) => p.ill).forEach((p, i) => pos.set(p.id, { x: ix0 + (i % cols) * step + (i >= cols ? step / 2 : 0), y: iy0 + Math.floor(i / cols) * step }));
      pos.set('d5', { x: 44, y: top + 50 });
      over += lab(70, top + 50, 'not confirmed by histology:<br>turned away', 'cw-out cw-left', 'away');
      over += lab(W / 2, iy0 + 2 * step + 6, 'in the study: 7 cases meet the definition', 'cw-in', '-');
      this.q = { x: (i) => 30 + i * ((W - 60) / 7), y: top + 50 };
    } else {
      const wallX = W * 0.4, dA = (top + bot) / 2 - 48, dB = (top + bot) / 2 + 48;
      svg += `<rect class="cw-room" data-narr="room" x="${wallX}" y="${top}" width="${W - 6 - wallX}" height="${bot - top}"/>`;
      svg += `<line class="cw-wall" data-narr="door" x1="${wallX}" y1="${top}" x2="${wallX}" y2="${dA}"/><line class="cw-wall" data-narr="door" x1="${wallX}" y1="${dB}" x2="${wallX}" y2="${bot}"/>`;
      svg += `<path class="cw-jamb" data-narr="door" d="M${wallX - 14} ${dA} H${wallX + 14} M${wallX - 14} ${dB} H${wallX + 14}"/>`;
      over += lab(wallX - 12, dA - 22, 'the door: checked<br>against the card', 'cw-door-lab cw-right', 'door');
      over += lab(16, top + 14, 'outside', 'cw-muted cw-left', 'door');
      over += lab(wallX + 16, top + 14, 'the study', 'cw-room-lab cw-left', 'door');
      const cols = 4, ix0 = wallX + (W - 6 - wallX) / 2 - ((cols - 1) * step) / 2, iy0 = (top + bot) / 2 - step / 2 - 14;
      DOOR.filter((p) => p.ill).forEach((p, i) => pos.set(p.id, { x: ix0 + (i % cols) * step + (i >= cols ? step / 2 : 0), y: iy0 + Math.floor(i / cols) * step }));
      over += lab(ix0 + 1.5 * step, iy0 + 2 * step + 4, 'in the study: 7 cases<br>meet the definition', 'cw-in', '-');
      pos.set('d5', { x: wallX - 120, y: (top + bot) / 2 + 70 });
      over += lab(wallX - 120, (top + bot) / 2 + 118, 'not confirmed by<br>histology: turned away', 'cw-out', 'away');
      this.q = { x: (i) => 30 + i * ((wallX - 60) / 7), y: (top + bot) / 2 };
    }
    if (c.walk) over += lab(16, P ? top + 26 : top + 40, 'arriving', 'cw-muted cw-left', 'door');
    this.lay = { r, pos, boxOf: new Map(), boxes: [], rules: [] };
    const q = this.q;
    this.from = c.walk ? (p) => ({ x: q.x(Number(p.id.slice(1))), y: q.y }) : null;
    this.flyOpt = { order: 'row', spread: 1.6, delay: c.walk ? 0.6 : 0 };
    this.key = `d${c.gen}`;
    this.people = DOOR;
    const legend = hideTag(legendHtml({ items: [{ label: 'case, exposure not yet asked', color: 'var(--sim-annot)', filled: false }, { label: 'no confirmed tumour', color: 'var(--sim-label-muted)', filled: false }] }));
    return { svg, over, head: legend };
  }

  // Beat 2 ---------------------------------------------------------------
  paintClinic(st) {
    const P = st.portrait, W = st.W, c = this.cws, today = c.view === 'today';
    const sRect = { x: 24, y: P ? 40 : 34, w: W - 48, h: P ? 140 : 128 };
    const sw = swarmLayout(CLINIC, sRect, { value: (p) => p.yr, min: 0.5, max: 12.5, side: 'up', maxR: P ? 7 : 8.5 });
    const ax = sw.axis, X = ax.toX;
    const sample = CLINIC.filter(today ? inToday : inWindow);
    const bRect = P ? { x: 24, y: 266, w: W - 48, h: 60 } : { x: 24, y: 262, w: W * 0.46, h: 120 };
    const bl = gridLayout(sample, bRect, { cols: 8, sort: exposedFirst, align: 'top', maxR: P ? 8 : 9 });
    const pos = new Map(sw.pos);
    for (const [id, q] of bl.pos) pos.set(id, q);
    this.lay = { r: Math.min(sw.r, bl.r), pos, boxOf: new Map(), boxes: [], rules: [] };
    this.people = CLINIC.map((p) => {
      const inS = today ? inToday(p) : inWindow(p);
      if (inS) return { ...p, lit: false };
      return { ...p, ghost: p.died, dim: !p.died || !today };
    });
    this.from = null; this.key = `k${c.gen}`; this.flyOpt = { order: 'x', spread: 0.9 };
    let svg = '', over = '';
    // The time line, the 5-year window.
    const wx0 = X(7.5), wx1 = X(12.5), y = ax.y;
    svg += `<rect class="cw-window${today ? '' : ' on'}" data-narr="window" x="${wx0}" y="${sRect.y - 8}" width="${wx1 - wx0}" height="${y - sRect.y + 8}"/>`;
    svg += `<line class="cw-axis" data-narr="years" x1="${X(0.5)}" y1="${y}" x2="${X(12.5)}" y2="${y}"/>`;
    for (let i = 1; i <= 12; i++) svg += `<line class="cw-tick" data-narr="years" x1="${X(i)}" y1="${y}" x2="${X(i)}" y2="${y + 6}"/>`;
    over += lab(X(0.5), y + 20, '12 years ago', 'cw-muted cw-left', 'years');
    over += lab(X(12.5), y + 20, 'today', 'cw-muted cw-right', 'years');
    over += lab((wx0 + wx1) / 2, P ? sRect.y + 8 : sRect.y - 22, 'last 5 years', `cw-win-lab${today ? '' : ' on'}`, 'window');
    over += lab(24, sRect.y - 22, 'diagnosed, by year', 'cw-muted cw-left' + (P ? ' cw-hide' : ''), 'years');
    // The sample, and its share.
    const label = today ? 'In the clinic today' : 'Newly diagnosed, last 5 years';
    over += lab(bRect.x, bRect.y - 22, label, 'cw-sec cw-left', 'sample');
    svg += `<line class="cw-rule" x1="${bRect.x}" y1="${bRect.y - 42}" x2="${W - 24}" y2="${bRect.y - 42}"/>`;
    const rx = P ? 24 : W * 0.56, ry = P ? 336 : 262;
    const big = (on, k, n, d, id) => `<div class="cw-read${on ? ' on' : ''}" data-narr="${id}"><span class="cw-read-k">${k}</span><b class="sim-numeral cw-read-n">${n} of ${d}</b><span class="cw-read-s">exposed</span></div>`;
    over += `<div class="cw-reads${P ? ' p' : ''}" style="left:${rx}px;top:${ry}px;width:${P ? W - 48 : W * 0.44 - 24}px">
${big(today, 'today', countOf(CLINIC, (p) => inToday(p) && p.exposed), countOf(CLINIC, inToday), 'today')}${big(!today, 'newly diagnosed', countOf(CLINIC, (p) => inWindow(p) && p.exposed), countOf(CLINIC, inWindow), 'newly')}
<div class="cw-all" data-narr="all">all who developed it: <b>${countOf(CLINIC, (p) => p.exposed)} of ${CLINIC.length}</b> exposed</div></div>`;
    over += P ? lab(24, sRect.y - 22, 'a surgeon\'s clinic, illustrative numbers', 'cw-cap cw-left', '-') : lab(W / 2, st.H - 12, 'a surgeon\'s clinic, illustrative numbers', 'cw-cap', '-');
    const head = narrTag(flowChoiceHtml({ action: 'view', value: c.view, label: 'Which patients', options: [{ value: 'today', label: 'Who is in the clinic today' }, { value: 'newly', label: 'Everyone newly diagnosed in the last 5 years' }] }), 'toggle')
      + hideTag(legendHtml({ items: [{ label: 'exposed', color: 'var(--sim-annot)', filled: true }, { label: 'not exposed', color: 'var(--sim-annot)', filled: false }, { label: 'died', ghost: true }] }));
    return { svg, over, head };
  }

  // Beat 3 ---------------------------------------------------------------
  paintSource(st) {
    const P = st.portrait, W = st.W, c = this.cws;
    const city = P ? { x: 20, y: 34, w: W - 40, h: 230 } : { x: 24, y: 30, w: W - 48, h: 230 };
    const sc = scatterLayout(CITY, { x: city.x + 26, y: city.y + 30, w: city.w - 52, h: city.h - 60 }, { seed: 7, density: 0.55, maxR: P ? 8 : 9 });
    const hA = { x: city.x + city.w * 0.3, y: city.y + city.h * 0.42 }, hB = { x: city.x + city.w * 0.72, y: city.y + city.h * 0.6 };
    // The surgeon (hospital A) sees the 11 nearest.
    const d2 = (id) => { const q = sc.pos.get(id); return (q.x - hA.x) ** 2 + (q.y - hA.y) ** 2; };
    const near = new Set([...CITY].sort((a, b) => d2(a.id) - d2(b.id)).slice(0, 11).map((p) => p.id));
    const caught = c.src === 'surgeon' ? CITY.filter((p) => near.has(p.id)) : CITY;
    const tRect = P ? { x: 24, y: city.y + city.h + 58, w: W * 0.5, h: 70 } : { x: 24, y: city.y + city.h + 62, w: W * 0.5, h: 96 };
    const tl = gridLayout(caught, tRect, { cols: P ? 6 : 10, align: 'top', maxR: P ? 8 : 9, sort: (a, b) => Number(a.id.slice(1)) - Number(b.id.slice(1)) });
    const pos = new Map(sc.pos);
    for (const [id, q] of tl.pos) pos.set(id, q);
    this.lay = { r: Math.min(sc.r, tl.r), pos, boxOf: new Map(), boxes: [], rules: [] };
    this.people = CITY.map((p) => (caught.includes(p) ? p : { ...p, ghost: true }));
    this.from = null; this.key = `s${c.gen}`; this.flyOpt = { order: 'random', spread: 0.8 };
    let svg = '', over = '';
    const cx = city.x + city.w / 2, cy = city.y + city.h / 2;
    svg += `<path class="cw-city" data-narr="city" d="M${city.x + 30} ${city.y + 12} Q${cx} ${city.y - 6} ${city.x + city.w - 24} ${city.y + 18} Q${city.x + city.w + 6} ${cy} ${city.x + city.w - 18} ${city.y + city.h - 10} Q${cx} ${city.y + city.h + 8} ${city.x + 20} ${city.y + city.h - 16} Q${city.x - 8} ${cy} ${city.x + 30} ${city.y + 12} Z"/>`;
    if (c.src === 'registry') svg += `<ellipse class="cw-registry" data-narr="registry" cx="${cx}" cy="${cy}" rx="${city.w / 2 + 6}" ry="${city.h / 2 + 10}"/>`;
    const hosp = (h, name, on, id) => {
      svg += `<g class="cw-hosp${on ? ' on' : ''}" data-narr="${id}"><rect x="${h.x - 15}" y="${h.y - 15}" width="30" height="30" rx="3"/><path d="M${h.x} ${h.y - 8} V${h.y + 8} M${h.x - 8} ${h.y} H${h.x + 8}"/></g>`;
      over += lab(h.x, h.y + 28, name, `cw-hosp-lab${on ? ' on' : ''}`, id);
    };
    hosp(hA, c.src === 'surgeon' ? 'Hospital A: one surgeon' : 'Hospital A', c.src !== 'registry', 'hospA');
    hosp(hB, 'Hospital B', c.src === 'two', 'hospB');
    over += lab(city.x + 10, city.y + 4, 'the city', 'cw-muted cw-left', 'city');
    if (c.src === 'surgeon') over += lab(city.x + city.w - 10, city.y + city.h - 22, 'dashed: missed, went elsewhere', 'cw-muted cw-right', 'missed');
    if (c.src === 'registry') over += lab(cx, city.y + city.h - 26, 'registry: covers everyone, but may not exist for a rare tumour', 'cw-reg-lab', 'registry');
    svg += `<line class="cw-rule" x1="24" y1="${tRect.y - 34}" x2="${W - 24}" y2="${tRect.y - 34}"/>`;
    over += lab(tRect.x, tRect.y - 16, 'your case series', 'cw-sec cw-left', 'series');
    const n = caught.length, rx = P ? tRect.x + tRect.w + 14 : W * 0.6;
    over += `<div class="cw-src-read${P ? ' p' : ''}" data-narr="series" style="left:${rx}px;top:${tRect.y - 14}px"><b class="sim-numeral cw-read-n">${n} of 20</b><span class="cw-read-s">cases found</span></div>`;
    const head = narrTag(flowChoiceHtml({ action: 'src', value: c.src, label: 'Source of cases', options: [{ value: 'surgeon', label: 'One surgeon\'s list' }, { value: 'two', label: 'Two city hospitals' }, { value: 'registry', label: 'Registry' }] }), 'toggle')
      + hideTag(legendHtml({ items: [{ label: 'man with the tumour, exposure not yet asked', color: 'var(--sim-annot)', filled: false }] }));
    return { svg, over, head };
  }

  animate() {
    crowdLive(this.live, this.key, this.people, this.lay, { from: this.from, ...this.flyOpt });
    const k = this.stepIndex;
    for (const p of this.people) {
      const e = this.live.get(`${this.key}|${p.id}`);
      const n = k === 0 ? (p.id === 'd5' ? 'away' : 'men') : k === 1 ? (p.ghost || p.dim ? 'years' : 'sample') : (p.ghost ? 'missed' : 'series');
      if (e && e.getAttribute('data-narr') !== n) e.setAttribute('data-narr', n);
    }
    // The cross over the turned-away man (beat 1) lives in the crowd's marks group.
    const mg = this.live.get(`${this.key}|marks`);
    if (mg && k === 0 && mg.getAttribute('data-narr') !== 'away') mg.setAttribute('data-narr', 'away');
  }

  css() {
    return SIM_CROWD_CSS + `
.svs-head { gap: 10px 16px; }
.svs-head .scw-legend { font-size: 16px; flex-wrap: wrap; justify-content: center; }
.sflow-choice { max-width: 100%; flex-wrap: wrap; }
.sflow-choice__opt { min-height: 44px; font-size: 16px; white-space: normal; flex: 1 1 auto; }
.cw-lab { position: absolute; transform: translate(-50%, -50%); white-space: nowrap; font: 600 16px/1.2 var(--sim-font); color: var(--sim-label); }
.cw-left { transform: translate(0, -50%); }
.cw-left-top { transform: translate(0, 0); }
.cw-right { transform: translate(-100%, -50%); }
.cw-muted { color: var(--sim-label-muted); font-weight: 500; }
.cw-hide { display: none; }
.cw-in { text-align: center; font-size: 18px; font-weight: 700; color: var(--sim-annot); line-height: 1.2; }
.cw-out { font-size: 16px; font-weight: 600; color: var(--sim-label-muted); line-height: 1.2; }
.cw-sec { font-size: 18px; font-weight: 700; }
.cw-cap { font-size: 16px; font-style: italic; font-weight: 500; color: var(--sim-label-muted); }
.cw-card { position: absolute; transform: translate(-50%, 0); box-sizing: border-box; padding: 14px 20px; display: flex; flex-direction: column; justify-content: center; border-top: 3px solid var(--sim-annot); border-bottom: 1px solid var(--sim-label-muted); background: var(--sim-annot-tint); text-align: left; }
.cw-card-k { font: 700 14px/1.2 var(--sim-font); letter-spacing: 0.06em; text-transform: uppercase; color: var(--sim-annot); }
.cw-card-t { font: 400 30px/1.22 var(--sim-font-numeral); color: var(--sim-label); margin-top: 4px; }
.cw-card-p .cw-card-t { font-size: 24px; }
.cw-stamp { animation: cw-stamp 0.45s cubic-bezier(.2,.9,.3,1.2) both; }
@keyframes cw-stamp { from { opacity: 0; transform: translate(-50%, 0) scale(1.25) rotate(-2deg); } to { opacity: 1; transform: translate(-50%, 0) scale(1); } }
.cw-win-lab { font-weight: 700; color: var(--sim-label-muted); }
.cw-win-lab.on { color: var(--sim-annot); }
.cw-reads { position: absolute; display: grid; grid-template-columns: 1fr 1fr; gap: 6px 18px; }
.cw-read { display: flex; flex-direction: column; opacity: 0.55; transition: opacity 0.4s ease; }
.cw-read.on { opacity: 1; }
.cw-read-k { font: 700 16px/1.2 var(--sim-font); color: var(--sim-label); }
.cw-read-n { font: 400 40px/1.1 var(--sim-font-numeral); color: var(--sim-label); white-space: nowrap; }
.cw-read.on .cw-read-n { color: var(--sim-annot); }
.cw-read-s { font: 500 16px/1.2 var(--sim-font); color: var(--sim-label-muted); }
.cw-all { grid-column: 1 / -1; font: 500 16px/1.3 var(--sim-font); color: var(--sim-label-muted); border-top: 1px solid var(--sim-label-muted); padding-top: 6px; }
.cw-all b { color: var(--sim-label); }
.cw-src-read { position: absolute; display: flex; flex-direction: column; }
.cw-src-read .cw-read-n { color: var(--sim-annot); font-size: 42px; }
.cw-src-read.p .cw-read-n { font-size: 34px; }
.cw-hosp-lab { font-size: 16px; font-weight: 600; color: var(--sim-label-muted); }
.cw-hosp-lab.on { color: var(--sim-accent); font-weight: 700; }
.cw-reg-lab { font-size: 16px; font-weight: 700; color: var(--sim-accent); white-space: normal; width: 300px; text-align: center; }
svg .cw-room { fill: var(--sim-annot-tint); fill-opacity: 0.55; stroke: none; }
.cw-door-lab { font-size: 16px; font-weight: 700; color: var(--sim-label); line-height: 1.2; }
.cw-room-lab { font-size: 17px; font-weight: 700; color: var(--sim-annot); }
svg .cw-jamb { stroke: var(--sim-label); stroke-width: 5; stroke-linecap: round; }
svg .cw-wall { stroke: var(--sim-label); stroke-width: 6; stroke-linecap: round; }
svg .cw-axis { stroke: var(--sim-label); stroke-width: 1.6; }
svg .cw-tick { stroke: var(--sim-label-muted); stroke-width: 1.2; }
svg .cw-rule { stroke: var(--sim-label-muted); stroke-width: 1; stroke-opacity: 0.6; }
svg .cw-window { fill: var(--sim-annot-tint); stroke: none; opacity: 0.35; transition: opacity 0.4s ease; }
svg .cw-window.on { opacity: 1; stroke: var(--sim-annot); stroke-width: 1.5; stroke-dasharray: 5 4; }
svg .cw-city { fill: var(--sim-bg-surface); stroke: var(--sim-label-muted); stroke-width: 1.6; }
svg .cw-registry { fill: none; stroke: var(--sim-accent); stroke-width: 2.5; stroke-dasharray: 9 6; }
svg .cw-hosp rect { fill: var(--sim-bg-deep); stroke: var(--sim-label-muted); stroke-width: 2; }
svg .cw-hosp path { stroke: var(--sim-label-muted); stroke-width: 3; stroke-linecap: round; }
svg .cw-hosp.on rect { stroke: var(--sim-accent); }
svg .cw-hosp.on path { stroke: var(--sim-accent); }
`;
  }
}
