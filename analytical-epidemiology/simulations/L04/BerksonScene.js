/**
 * BerksonScene - analytical-epidemiology L04 s05, the lesson payoff (illustrative numbers). Rebuilt
 * 2026-11-11 on SimCrowd (people as dots). A town of 2,000 in which the exposure and the disease have no
 * link: a 100, b 900, c 100, d 900 (odds ratio 1.00), drawn at 1 dot = 10 people as its own 2 x 2. Three
 * steppers set the admission chances (the old scene's dials, same defaults): with the disease pD 40,
 * among the exposed pE 20, other complaints pC 40. Chance per cell (exact expected counts, never a random
 * draw): a = pD + pE - pD x pE (two routes in), b = pE, c = pD, d = pC. "Open the hospital door": dots
 * leave the town cells, pass the drawn door and land in the hospital 2 x 2 at 1 dot = 4 people; at the
 * defaults 52, 180, 40, 360 (13, 45, 10, 90 dots, exact), odds ratio (52 x 360) / (180 x 40) = 2.60
 * against the town's 1.00. The town keeps all its dots: nothing in the town changes.
 *   Beat 0 town:  the town, its 2 x 2 and OR 1.00; steppers live (each cell shows its chance of admission).
 *   Beat 1 door, built: came from beat 0, the door waits for the learner (or the door cue); a cold landing
 *                 shows the default hospital at rest. OR 2.60 is the largest thing on screen.
 *   Beat 2 nomatch: the default hospital at rest; "Match on age" re-sorts the patients inside each cell
 *                 and the counts and OR stay 52, 180, 40, 360 and 2.60.
 * Dot grammar: blue = has the disease, grey = does not; filled = exposed, hollow = not exposed.
 */
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { SIM_CROWD_CSS, crowdLive, legendHtml } from 'simulations/base/kit/SimCrowd.js';
import { withNarrationCues } from '../L01/NarrationCues.js';
import { na, tagTop, tagEl } from './NarrTags.js';

const TOWN = { a: 100, b: 900, c: 100, d: 900 };
const CELL = { a: { ill: true, exposed: true }, b: { ill: false, exposed: true }, c: { ill: true, exposed: false }, d: { ill: false, exposed: false } };
const KEYS = ['a', 'b', 'c', 'd'];
const TOWN_K = 10, HOSP_K = 4;
const DIALS = [
  { id: 'pD', min: 10, max: 60, step: 5, v: 40, lab: 'With the disease', short: 'Disease' },
  { id: 'pE', min: 10, max: 40, step: 5, v: 20, lab: 'If exposed', short: 'Exposed' },
  { id: 'pC', min: 5, max: 40, step: 5, v: 40, lab: 'Other complaints', short: 'Other' },
];
const DEF = Object.fromEntries(DIALS.map((d) => [d.id, d.v]));
const chancesOf = (p) => {
  const pD = p.pD / 100, pE = p.pE / 100, pC = p.pC / 100;
  return { a: pD + pE - pD * pE, b: pE, c: pD, d: pC };
};
const countsOf = (p) => {
  const ch = chancesOf(p);
  return Object.fromEntries(KEYS.map((k) => [k, Math.round(TOWN[k] * ch[k])]));
};
const orOf = (k) => (k.a * k.d) / (k.b * k.c);
const fmt = (v) => v.toLocaleString('en-IN');
const hash = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return ((h >>> 0) % 1000) / 1000; };
const cellOf = (p) => (p.exposed ? (p.ill ? 'a' : 'b') : (p.ill ? 'c' : 'd'));

const TOWN_P = [];
for (const k of KEYS) for (let i = 0; i < TOWN[k] / TOWN_K; i++) TOWN_P.push({ id: `t${k}${i}`, ...CELL[k] });
const TOWN_BY = Object.fromEntries(KEYS.map((k) => [k, TOWN_P.filter((p) => cellOf(p) === k)]));

function hospPeople(counts) {
  const out = [];
  for (const k of KEYS) {
    const n = Math.round(counts[k] / HOSP_K), src = TOWN_BY[k];
    for (let i = 0; i < n; i++) out.push({ id: `h${k}${i}`, ...CELL[k], src: src[Math.floor(hash(`s${k}${i}`) * src.length)].id, age: hash(`age${k}${i}`) });
  }
  return out;
}

// The 2 x 2 as four dot blocks: the disease column is narrow (it holds few people), one dot size for all
// four cells and both tables, so blocks compare like bars. areas: [a, b, c, d] rects; padTop for the label.
function cellsAt(people, areas, r, sort) {
  const step = 2 * r + 2.6, pos = new Map(), boxOf = new Map();
  const boxes = KEYS.map((k, i) => ({ key: k, letter: k, area: areas[i], n: 0 }));
  KEYS.forEach((k, i) => {
    let list = people.filter((p) => cellOf(p) === k);
    if (sort) list = list.slice().sort(sort);
    const A = areas[i], cols = Math.max(1, Math.floor((A.w - 8) / step));
    list.forEach((p, j) => { pos.set(p.id, { x: A.x + 4 + step / 2 + (j % cols) * step, y: A.y + 26 + step / 2 + Math.floor(j / cols) * step }); boxOf.set(p.id, k); });
    boxes[i].n = list.length;
  });
  return { kind: 'cells', r, step, pos, boxOf, boxes, rules: [] };
}

const MAP = [0, 1, 2].map((i) => [{ idx: i, dwellMs: null }]);
const X = '&times;';

export class BerksonScene extends withNarrationCues(SvgScene) {
  static WIDTH = 680;
  static HEIGHT = 594;
  static PORTRAIT_WIDTH = 380;
  static PORTRAIT_HEIGHT = 674;
  static MIN_SCALE = 0.85;
  static SETTING = 'none';
  static BEAT_STEP_MAP = MAP;
  static CONTROLS = [];
  static CUES = ['town', 'door', 'built', 'nomatch'];
  static ARIA_LABEL = 'Illustrative: a town of 2,000 in which exposure and disease have no link, drawn at one dot for 10 people. 100 exposed people have the disease and 900 do not; 100 unexposed people have it and 900 do not; the town odds ratio is 1.00. Three steppers set the chance of admission: with the disease 40 per cent, among the exposed 20 per cent, other complaints 40 per cent. Exposed people with the disease have two routes in, 52 per cent. Open the hospital door: dots pass the door into the hospital table at one dot for 4 people: 52 exposed with the disease, 180 exposed without, 40 unexposed with it, 360 unexposed without. Hospital odds ratio 52 times 360 over 180 times 40, 2.60, while the town still reads 1.00. Matching on age re-sorts the patients and leaves 2.60 unchanged: the selection built it.';

  async setup() {
    this.bkP = { ...DEF };
    this.bkDrawn = null; this.bkPhase = 'shut'; this.bkWalk = false; this.bkFly = false;
    this.bkMatch = false; this.bkDraw = 0; this.bkCheered = false; this.bkBuilt = false;
    await super.setup();
    this.bkClick = (e) => this.onClick(e);
    this.root.addEventListener('click', this.bkClick);
  }

  enter(step) {
    const came = this.bkLast === step - 1;
    this.bkLast = step;
    this.bkP = { ...DEF };
    this.bkMatch = false; this.bkWalk = false; this.bkFly = false; this.bkLabD = false; this.bkBuilt = false;
    if (step === 0 || (step === 1 && came)) { this.bkDrawn = null; this.bkPhase = 'shut'; }
    else { this.bkDrawn = countsOf(DEF); this.bkPhase = 'in'; this.bkDraw++; this.bkBuilt = true; }
  }

  geo(st) {
    const P = st.portrait, W = st.W;
    if (P) {
      const RH = 24, BW = W - RH, CH = 86, G = 8, r = 4.6;
      const tTitle = 0, tCols = 46, tCells = 68, tBot = tCells + 2 * CH + G;
      const wallY = tBot + 26, hTitle = tBot + 54, hCells = hTitle + 46, hBot = hCells + 2 * CH + G;
      const ctrlY = hBot + 10;
      return { P, W, RH, BW, CH, G, r, tx: RH, hx: RH, tTitle, tCols, tCells, hTitle, hCols: null, hCells, wallY, gap: [RH + 10, RH + 92], ctrlY, capY: ctrlY, H: ctrlY + 58 };
    }
    const RH = 86, DW = 66, BW = (W - RH - DW) / 2, CH = 136, G = 12, r = 5.2;
    const tTitle = 0, tCols = 70, tCells = 96, bot = tCells + 2 * CH + G, wallX = RH + BW + DW / 2;
    const ctrlY = bot + 46, capY = ctrlY + 64;
    return { P, W, RH, BW, CH, G, r, DW, tx: RH, hx: RH + BW + DW, tTitle, tCols, tCells, hTitle: tTitle, hCols: tCols, hCells: tCells, wallX, gap: [tCells + CH - 34, tCells + CH + G + 34], ctrlY, capY, H: capY + 34 };
  }

  stageHeight(st) { return Math.ceil(this.geo(st).H); }

  areas(g, which) {
    const x = which === 'town' ? g.tx : g.hx, y = which === 'town' ? g.tCells : g.hCells;
    const w0 = Math.round((g.BW - g.G) * 0.28), w1 = g.BW - g.G - w0;
    return [[0, 0], [0, 1], [1, 0], [1, 1]].map(([i, j]) => ({ x: x + (j ? w0 + g.G : 0), y: y + i * (g.CH + g.G), w: j ? w1 : w0, h: g.CH }));
  }

  doorPt(g, p) {
    const u = hash(`d${p.id}`);
    return g.P ? { x: g.gap[0] + 8 + u * (g.gap[1] - g.gap[0] - 16), y: g.wallY } : { x: g.wallX, y: g.gap[0] + 8 + u * (g.gap[1] - g.gap[0] - 16) };
  }

  paint(st) {
    const g = this.geo(st), s = this.stepIndex ?? 0, P = g.P, k = this.bkDrawn, open = this.bkPhase !== 'shut';
    this.g = g;
    this.townLay = cellsAt(TOWN_P, this.areas(g, 'town'), g.r);
    this.hosp = k ? hospPeople(k) : [];
    const sortAge = this.bkMatch ? (a, b) => a.age - b.age : undefined;
    this.hospLay = k ? cellsAt(this.hosp, this.areas(g, 'hosp'), g.r, sortAge) : null;
    const ch = chancesOf(this.bkP);
    let svg = '', over = '';
    // Row heads (one set: the rows line up across both tables).
    const rows = P ? [g.tCells, g.hCells] : [g.tCells];
    for (const y0 of rows) {
      const rn = P ? (y0 === g.tCells ? 'town' : 'hosp') : 'town hosp';
      over += `<span${na(rn)} class="bk-rh" style="left:0;top:${y0 + 26}px;width:${g.RH - 8}px;height:${g.CH - 26}px">Exposed</span>`;
      over += `<span${na(rn)} class="bk-rh" style="left:0;top:${y0 + g.CH + g.G + 26}px;width:${g.RH - 8}px;height:${g.CH - 26}px">Not exposed</span>`;
    }
    for (const [x0, y0] of [[g.tx, g.tCols], ...(g.hCols != null ? [[g.hx, g.hCols]] : [])]) {
      const [a0, b0] = this.areas(g, 'town');
      const cn = x0 === g.tx ? 'town' : 'hosp';
      over += `<span${na(cn)} class="bk-ch bk-ch--ill" style="left:${x0}px;top:${y0}px;width:${a0.w}px">Disease</span><span${na(cn)} class="bk-ch" style="left:${x0 + b0.x - a0.x}px;top:${y0}px;width:${b0.w}px">No disease</span>`;
    }
    // Cell frames and labels.
    this.townLay.boxes.forEach((b, i) => {
      const key = KEYS[i], narrow = !CELL[key].ill ? false : true, tag = `${Math.round(ch[key] * 100)}% in`;
      svg += `<rect${na('town')} class="bk-cell" x="${b.area.x}" y="${b.area.y}" width="${b.area.w}" height="${b.area.h}"/>`;
      over += `<span${na('town')} class="bk-cl${key === 'a' ? ' bk-cl--a' : ''}" style="left:${b.area.x + 6}px;top:${b.area.y + 3}px;width:${b.area.w - 12}px"><i>${key}</i><b>${fmt(TOWN[key])}</b>${narrow ? '' : `<em${na('rates')}>${tag}</em>`}</span>`;
      if (narrow) {
        const last = this.townLay.pos.get(`t${key}${TOWN[key] / TOWN_K - 1}`);
        over += `<span${na('rates')} class="bk-tag${key === 'a' ? ' bk-tag--a' : ''}" style="left:${b.area.x + 6}px;top:${last.y + g.r + 8}px">${tag}</span>`;
      }
    });
    const hb = this.hospLay?.boxes ?? cellsAt([], this.areas(g, 'hosp'), g.r).boxes;
    hb.forEach((b, i) => {
      const key = KEYS[i];
      svg += `<rect${na('hosp')} class="bk-cell bk-cell--h" x="${b.area.x}" y="${b.area.y}" width="${b.area.w}" height="${b.area.h}"/>`;
      over += `<span${na('hosp')} class="bk-cl${key === 'a' ? ' bk-cl--a' : ''}${k && open ? ' bk-in' : ''}" style="left:${b.area.x + 6}px;top:${b.area.y + 3}px;width:${b.area.w - 12}px;--d:${this.bkLabD ? 1.6 : 0}s"><i>${key}</i><b>${k && open ? fmt(k[key]) : '?'}</b></span>`;
    });
    // Titles with the two odds ratios.
    over += `<div${na('town')} class="bk-title" style="left:${g.tx}px;top:${g.tTitle}px;width:${g.BW}px"><span class="bk-name">Town of 2,000<small>1 dot = 10 people</small></span><span${na('townor')} class="bk-or bk-or--town"><small>OR</small>1.00</span></div>`;
    const hOr = k && open ? `<span${na('hospor')} class="bk-or bk-or--hosp bk-in" style="--d:${this.bkLabD ? 1.7 : 0}s"><small>OR</small>${orOf(k).toFixed(2)}</span>` : '<span data-narr="hospor" class="bk-or bk-or--wait"><small>OR</small>?</span>';
    const exact = !k || KEYS.every((q) => k[q] % HOSP_K === 0);
    const sum = k ? KEYS.reduce((t, q) => t + k[q], 0) : 0;
    over += `<div${na('hosp')} class="bk-title" style="left:${g.hx}px;top:${g.hTitle}px;width:${g.BW}px"><span class="bk-name">Hospital${k && open ? ` ${fmt(sum)}` : ''}<small>1 dot = ${exact ? '' : 'about '}4 people</small></span>${hOr}</div>`;
    // The wall and its door.
    const lw = open ? 'bk-leaf bk-leaf--open' : 'bk-leaf';
    const svg0 = svg.length, over0 = over.length;
    if (P) {
      svg += `<line class="bk-wall" x1="0" y1="${g.wallY}" x2="${g.gap[0]}" y2="${g.wallY}"/><line class="bk-wall" x1="${g.gap[1]}" y1="${g.wallY}" x2="${g.W}" y2="${g.wallY}"/>`;
      svg += open ? `<line class="${lw}" x1="${g.gap[0]}" y1="${g.wallY}" x2="${g.gap[0] + 14}" y2="${g.wallY + 24}"/>` : `<line class="${lw}" x1="${g.gap[0]}" y1="${g.wallY}" x2="${g.gap[1]}" y2="${g.wallY}"/>`;
    } else {
      const top = g.tCells - 6, bot = g.tCells + 2 * g.CH + g.G;
      svg += `<line class="bk-wall" x1="${g.wallX}" y1="${top}" x2="${g.wallX}" y2="${g.gap[0]}"/><line class="bk-wall" x1="${g.wallX}" y1="${g.gap[1]}" x2="${g.wallX}" y2="${bot}"/>`;
      svg += open ? `<line class="${lw}" x1="${g.wallX}" y1="${g.gap[0]}" x2="${g.wallX + 24}" y2="${g.gap[0] - 40}"/>` : `<line class="${lw}" x1="${g.wallX}" y1="${g.gap[0]}" x2="${g.wallX}" y2="${g.gap[1]}"/>`;
      over += `<span class="bk-wl bk-wl--v" style="left:${g.wallX - g.DW / 2 - 10}px;top:${bot + 6}px;width:${g.DW + 20}px">hospital door</span>`;
    }
    svg = svg.slice(0, svg0) + tagTop(svg.slice(svg0), 'door'); over = over.slice(0, over0) + tagTop(over.slice(over0), 'door');
    over += this.controlsHtml(g, s);
    over += this.captionHtml(g, s);
    const head = legendHtml({ show: ['ill', 'well', 'exposed', 'unexposed'], text: { ill: 'disease', well: 'no disease', exposed: 'exposed', unexposed: 'not exposed' } });
    return { svg, over, head: tagTop(head, '-') };
  }

  controlsHtml(g, s) {
    const P = g.P, k = this.bkDrawn, open = this.bkPhase !== 'shut';
    const n = DIALS.length, gapX = 8, sw = P ? (g.W - 2 * gapX) / 3 : 124;
    let h = '';
    if (!(P && s === 2)) DIALS.forEach((d, i) => {
      const v = this.bkP[d.id];
      h += `<div${na('rates')} class="bk-step" style="left:${i * (sw + gapX)}px;top:${g.ctrlY}px;width:${sw}px"><span class="bk-sl">${P ? d.short : d.lab}</span>`
        + `<span class="bk-sr"><button type="button" class="bk-pm" data-dial="${d.id}" data-d="-1" aria-label="${d.lab}: lower"${v <= d.min ? ' disabled' : ''}>&minus;</button>`
        + `<b>${v}%</b><button type="button" class="bk-pm" data-dial="${d.id}" data-d="1" aria-label="${d.lab}: higher"${v >= d.max ? ' disabled' : ''}>+</button></span></div>`;
    });
    if (n && !P) h += `<span${na('rates')} class="bk-kick" style="left:0;top:${g.ctrlY - 18}px">Chance of admission</span>`;
    // The one big move: the door (beat 1 on), then the age toggle (beat 2).
    const bx = P ? g.gap[1] + 14 : 3 * (sw + gapX) + 8, by = P ? g.wallY - 22 : g.ctrlY + 2, bw = P ? g.W - bx : g.W - bx;
    if (s === 2 && k && open) {
      h += `<button type="button"${na('match')} class="bk-btn${this.bkMatch ? ' bk-btn--on' : ''}" data-match="1" aria-pressed="${this.bkMatch}" style="left:${bx}px;top:${by}px;width:${bw}px"><i class="bk-box" aria-hidden="true"></i>Match on age</button>`;
    } else if (s >= 1 && !(open && k)) {
      const lab = this.bkDrawnOnce ? 'Open the door again' : 'Open the hospital door';
      h += `<button type="button"${na('-')} class="bk-btn bk-btn--go" data-door="1" style="left:${bx}px;top:${by}px;width:${bw}px">${lab}</button>`;
    } else if (!P) {
      h += `<span${na('rates')} class="bk-note" style="left:${bx}px;top:${by}px;width:${bw}px">Each group enters hospital at its own rate.</span>`;
    }
    return h;
  }

  captionHtml(g, s) {
    let t = '';
    if (g.P && s !== 2) return '';
    if (s === 0) t = g.P ? 'Each group enters hospital at its own rate.' : 'In the town the disease is 1 in 10 among the exposed and among the unexposed.';
    else if (s === 1) t = this.bkDrawn && this.bkPhase !== 'shut' ? '<b>Nothing in the town changed; the door built the association.</b>' : 'Open the door and watch who comes in.';
    else t = this.bkMatch ? '<b>Matched on age: still 2.60.</b> The selection built it; matching cannot undo it.' : 'No third feature is at work here. Try matching on age.';
    return `<p${na(s === 2 ? 'nothird' : '-')} class="bk-cap" style="left:0;top:${g.capY}px;width:${g.W}px">${t}</p>`;
  }

  animate() {
    const g = this.g;
    if (!g || !this.townLay) return;
    crowdLive(this.live, 'town', TOWN_P, this.townLay, {});
    tagEl(this.live.get('town'), 'town');
    if (!this.bkDrawn || this.bkPhase === 'shut' || !this.hospLay) return;
    const key = `h${this.bkDraw}`;
    if (this.bkWalk) {
      const pos = new Map(), boxOf = new Map();
      for (const p of this.hosp) { pos.set(p.id, this.doorPt(g, p)); boxOf.set(p.id, 'door'); }
      const lay = { kind: 'pts', r: this.hospLay.r, step: this.hospLay.step, pos, boxOf, boxes: [], rules: [] };
      crowdLive(this.live, `w${this.bkDraw}`, this.hosp, lay, { from: (p) => this.townLay.pos.get(p.src), order: 'random', spread: 0.7 });
      tagEl(this.live.get(`w${this.bkDraw}`), 'door');
    }
    crowdLive(this.live, key, this.hosp, this.hospLay, { from: this.bkFly ? (p) => this.doorPt(g, p) : undefined, delay: this.bkFly ? 0.75 : 0, spread: this.bkFly ? 0.8 : undefined, order: 'random' });
    tagEl(this.live.get(key), 'hosp');
  }

  onClick(e) {
    const b = e.target?.closest?.('[data-dial],[data-door],[data-match]');
    if (!b || b.disabled) return;
    if (b.dataset.dial) this.onDial(b.dataset.dial, Number(b.dataset.d));
    else if (b.dataset.door) this.openDoor(true);
    else if (b.dataset.match) this.setMatch(!this.bkMatch, true);
  }

  onDial(id, dir) {
    const d = DIALS.find((x) => x.id === id);
    if (!d) return;
    const v = Math.max(d.min, Math.min(d.max, this.bkP[id] + dir * d.step));
    if (v === this.bkP[id]) return;
    this.bkP[id] = v;
    if (this.bkDrawn) { this.bkDrawn = null; this.bkPhase = 'shut'; this.bkMatch = false; this.bkBuilt = false; }
    this.repaint();
  }

  openDoor(byLearner) {
    if ((this.stepIndex ?? 0) < 1 || (this.bkDrawn && this.bkPhase !== 'shut')) return;
    this.bkDrawn = countsOf(this.bkP);
    this.bkDraw++;
    this.bkPhase = 'in'; this.bkWalk = true; this.bkFly = true; this.bkLabD = true; this.bkDrawnOnce = true;
    this.repaint();
    this.after(1.7, () => { this.bkWalk = false; this.bkLabD = false; this.repaint(); });
    this.after(2.2, () => {
      this.bkBuilt = true;
      if (byLearner && !this.bkCheered) {
        this.bkCheered = true;
        const g = this.g;
        this.celebrate(g.hx + g.BW - 50, g.hTitle + 26, { stamp: 'BUILT' });
      }
    });
    if (byLearner) this.root?.dispatchEvent(new CustomEvent('scene-interact-done', { bubbles: true, composed: true }));
  }

  setMatch(on, byLearner) {
    if (!this.bkDrawn || this.bkPhase === 'shut') return;
    this.bkMatch = on;
    this.repaint();
    if (byLearner) this.root?.dispatchEvent(new CustomEvent('scene-interact-done', { bubbles: true, composed: true }));
  }

  applyCue(id) {
    if (id === 'door') this.openDoor(false);
    else if (id === 'built') {
      if (!this.bkDrawn || this.bkPhase === 'shut') { this.bkDrawn = countsOf(this.bkP); this.bkDraw++; this.bkPhase = 'in'; this.bkFly = false; this.bkWalk = false; }
      this.bkBuilt = true; this.repaint();
    } else if (id === 'nomatch') this.setMatch(true, false);
  }

  cueBase() { return { p: { ...this.bkP }, drawn: this.bkDrawn, phase: this.bkPhase, match: this.bkMatch }; }

  cueReset(b) {
    this.bkP = { ...(b?.p ?? DEF) };
    this.bkDrawn = b?.drawn ?? null; this.bkPhase = b?.phase ?? 'shut'; this.bkMatch = !!b?.match;
    this.bkWalk = false; this.bkFly = false;
    this.repaint();
  }

  testState() {
    const k = this.bkDrawn;
    return { beat: this.stepIndex, ...this.bkP, phase: this.bkPhase, match: this.bkMatch, hosp: k ? { ...k, or: orOf(k).toFixed(2), dots: this.hosp.length } : null, townDots: TOWN_P.length, town: '1.00' };
  }

  destroy() {
    this.root?.removeEventListener('click', this.bkClick);
    super.destroy();
  }

  css() {
    return SIM_CROWD_CSS + `
/* Narrated focus: group labels light by brightness, not by a ring each (spec W1 D29n). */
.bk-cl[data-narr], .bk-cl em[data-narr], .bk-rh[data-narr], .bk-ch[data-narr], .bk-tag[data-narr], .bk-wl[data-narr], .bk-kick[data-narr], .bk-step[data-narr], .bk-note[data-narr], .bk-title[data-narr] { outline: none !important; }
.svs-head { justify-content: flex-start; }
.bk-cell { fill: none; stroke: var(--sim-label); stroke-opacity: 0.18; stroke-width: 1; }
.bk-cell--h { stroke-opacity: 0.28; }
.bk-wall { stroke: var(--sim-label); stroke-width: 3; stroke-linecap: square; }
.bk-leaf { stroke: var(--sim-annot); stroke-width: 4; stroke-linecap: round; transition: all 0.4s ease; }
.bk-wl { position: absolute; font: 600 var(--sim-text-sm)/1.2 var(--sim-font); color: var(--sim-label-muted); letter-spacing: 0.04em; }
.bk-wl--v { text-align: center; }
.bk-rh { position: absolute; display: flex; align-items: center; font: 700 15px/1.2 var(--sim-font); color: var(--sim-label); }
.sim-dom-root--portrait .bk-rh { writing-mode: vertical-rl; transform: rotate(180deg); justify-content: center; white-space: nowrap; }
.bk-tag { position: absolute; font: 600 var(--sim-text-sm)/1.2 var(--sim-font); color: var(--sim-label-muted); white-space: nowrap; }
.bk-tag--a { color: var(--sim-annot); }
.bk-ch { position: absolute; text-align: center; font: 700 15px/1.2 var(--sim-font); color: var(--sim-label-muted); }
.bk-ch--ill { color: var(--sim-annot); }
.bk-cl { position: absolute; display: flex; align-items: baseline; gap: 6px; font: 500 15px/1.2 var(--sim-font); color: var(--sim-label); white-space: nowrap; }
.bk-cl i { font-style: italic; color: var(--sim-label-muted); }
.bk-cl b { font-weight: 700; font-variant-numeric: tabular-nums; }
.bk-cl em { margin-left: auto; font-style: normal; font-size: var(--sim-text-sm); color: var(--sim-label-muted); }
.bk-cl--a b, .bk-cl--a em { color: var(--sim-annot); }
.bk-title { position: absolute; box-sizing: border-box; height: 64px; display: flex; align-items: flex-end; justify-content: space-between; gap: 8px; border-bottom: 1px solid var(--sim-label); padding-bottom: 4px; }
.bk-name { display: flex; flex-direction: column; font: 700 var(--sim-text-md)/1.2 var(--sim-font); color: var(--sim-label); }
.bk-name small { font-weight: 500; font-size: var(--sim-text-sm); color: var(--sim-label-muted); }
.bk-or { display: flex; align-items: baseline; gap: 6px; font: 400 40px/1 var(--sim-font-numeral, var(--sim-font)); font-variant-numeric: lining-nums tabular-nums; color: var(--sim-label); }
.bk-or small { font: 700 var(--sim-text-sm)/1 var(--sim-font); color: var(--sim-label-muted); letter-spacing: 0.06em; }
.bk-or--hosp { font-size: 62px; color: var(--sim-annot); }
.bk-or--wait { color: var(--sim-label-muted); }
.bk-in { animation: bk-in 0.5s ease-out both; animation-delay: var(--d, 0s); }
@keyframes bk-in { from { opacity: 0; transform: translateY(8px); } }
.bk-kick { position: absolute; font: 700 var(--sim-text-sm)/1 var(--sim-font); color: var(--sim-label-muted); letter-spacing: 0.06em; text-transform: uppercase; }
.bk-step { position: absolute; display: flex; flex-direction: column; gap: 2px; pointer-events: auto; }
.bk-sl { font: 600 var(--sim-text-sm)/1.2 var(--sim-font); color: var(--sim-label); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.bk-sr { display: flex; align-items: center; justify-content: space-between; border: 1px solid color-mix(in oklab, var(--sim-label) 35%, transparent); border-radius: var(--sim-radius-sm); background: var(--sim-bg-surface); }
.bk-sr b { font: 400 22px/1 var(--sim-font-numeral, var(--sim-font)); font-variant-numeric: tabular-nums; color: var(--sim-label); }
.bk-pm { width: 42px; height: 42px; border: 0; background: transparent; color: var(--sim-annot); font: 700 22px/1 var(--sim-font); cursor: pointer; }
.bk-pm:disabled { color: var(--sim-label-muted); opacity: 0.4; cursor: default; }
.bk-pm:focus-visible, .bk-btn:focus-visible { outline: 2px solid var(--sim-annot); outline-offset: 2px; }
.bk-btn { position: absolute; pointer-events: auto; min-height: 46px; display: flex; align-items: center; justify-content: center; gap: 10px; padding: 0 12px;
  border: 1.5px solid var(--sim-label); border-radius: var(--sim-radius-sm); background: var(--sim-bg-surface); color: var(--sim-label); font: 700 var(--sim-text-md)/1.15 var(--sim-font); cursor: pointer; }
.bk-btn--go { background: var(--sim-annot); border-color: var(--sim-annot); color: var(--sim-bg-surface); }
.bk-btn:disabled { background: var(--sim-bg-surface); border-color: color-mix(in oklab, var(--sim-label) 30%, transparent); color: var(--sim-label-muted); cursor: default; }
.bk-box { width: 18px; height: 18px; border: 2px solid var(--sim-label); border-radius: 3px; box-sizing: border-box; }
.bk-btn--on .bk-box { background: var(--sim-annot); border-color: var(--sim-annot); }
.bk-note { position: absolute; display: flex; align-items: center; min-height: 46px; font: 500 var(--sim-text-sm)/1.3 var(--sim-font); color: var(--sim-label-muted); }
.bk-cap { position: absolute; margin: 0; font: 500 var(--sim-text-md)/1.35 var(--sim-font); color: var(--sim-label-muted); }
.bk-cap b { color: var(--sim-label); }
.sim-dom-root--portrait .bk-or { font-size: 32px; }
.sim-dom-root--portrait .bk-title { height: 44px; }
.sim-dom-root--portrait .bk-or--hosp { font-size: 46px; }
.sim-dom-root--portrait .bk-rh, .sim-dom-root--portrait .bk-ch, .sim-dom-root--portrait .bk-cl { font-size: 14px; }
.sim-dom-root--portrait .bk-btn { font-size: var(--sim-text-sm); }
.sim-dom-root--portrait .bk-pm { width: 34px; }
.sim-dom-root--portrait .bk-sr b { font-size: 19px; }
@media (prefers-reduced-motion: reduce) { .bk-in { animation: none; } .bk-leaf { transition: none; } }
`;
  }
}
