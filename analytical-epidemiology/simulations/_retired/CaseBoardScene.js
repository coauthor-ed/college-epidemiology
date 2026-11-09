/**
 * CaseBoardScene - the live case's evidence board (casefile setting, plain look).
 * ONE file for the whole course: the closing slide of each of L01-L05 mounts it with
 * data.stage 1-5; every mount is memory-less and draws its stage's board from scratch.
 *   Stage 1: the cluster card (20 men, 14 cleaned reactors) and an empty dashed frame
 *            where a comparison group should be; the senior's note opens on a tap.
 *   Stage 2: + the controls card and the filled 2x2 (cells 14, 9, 6, 51; margins 20, 60).
 *   Stage 3: + the odds-ratio card: 13.2, from (14 x 51) / (6 x 9).
 *   Stage 4: + the bias-checks card, and a NO INCIDENCE stamp on the odds-ratio card.
 *   Stage 5: + the cohort card (12 of 2,000 against 4 of 8,000; relative risk 12.0), the
 *            design table and the verdict card: vinyl chloride, CONFIRMED - the find.
 * Beats (the same three at every stage): 0 board, newest card closed; 1 the learner taps
 * it open (nothing opens until they tap); 2 the card stays open and an underline marks
 * its key reading. Tapping an older card enlarges it; tapping it again closes it.
 * Every number is derived from the cells and counts below, never typed twice. All
 * illustrative: a made-up plastics plant in an unnamed Indian city.
 */
import { SvgScene, chip } from 'simulations/base/kit/SimSvg.js';
import { dotsSvg } from 'simulations/base/kit/SimChart.js';
import { tableSpec, tableSvg, TABLE_CSS } from 'simulations/base/kit/SimTable.js';
import { annotations } from 'simulations/base/kit/SimAnnotate.js';
import { bindFlow } from 'simulations/base/kit/SimFlowDom.js';
import { mulberry32 } from 'simulations/base/kit/SimLook.js';
import { fmtNum } from 'simulations/base/kit/SimText.js';
import { esc } from 'simulations/base/SimUi.js';
import { fmtRatio, fmtPer1000, ratioBars } from '../L05/CohortFrame.js';

const CASES = { n: 20, exp: 14 };
const GRP = { n: 60, exp: 9 };
const CELLS = [[CASES.exp, GRP.exp], [CASES.n - CASES.exp, GRP.n - GRP.exp]]; // [[14,9],[6,51]]
const OR_WORKING = `(${CELLS[0][0]} x ${CELLS[1][1]}) / (${CELLS[1][0]} x ${CELLS[0][1]})`;
const OR_S = fmtRatio((CELLS[0][0] * CELLS[1][1]) / (CELLS[0][1] * CELLS[1][0]), 1); // '13.2'
const COH = { expCases: 12, expN: 2000, otherCases: 4, otherN: 8000 };
const RR_S = fmtRatio((COH.expCases / COH.expN) / (COH.otherCases / COH.otherN), 1); // '12.0'
const INC_EXP = fmtPer1000((COH.expCases / COH.expN) * 1000, 1);   // '6.0 per 1,000'
const INC_OTHER = fmtPer1000((COH.otherCases / COH.otherN) * 1000, 1); // '0.5 per 1,000'

const HERO_OF = { 1: 'frame', 2: 'table', 3: 'or', 4: 'checks', 5: 'verdict' };
const THUMBS_OF = {
  1: [{ id: 'cluster', wide: true }],
  2: [{ id: 'cluster' }, { id: 'controls' }],
  3: [{ id: 'cluster' }, { id: 'controls' }, { id: 'table' }],
  4: [{ id: 'cluster' }, { id: 'controls' }, { id: 'table' }, { id: 'or' }],
  5: [{ id: 'cluster' }, { id: 'controls' }, { id: 'table' }, { id: 'or' }, { id: 'checks' }, { id: 'design' }, { id: 'cohort', wide: true }],
};
const CARD_DEFS = {
  cluster: { kicker: 'Cluster: 20 men, rare liver tumour', short: 'Cluster', read: `${CASES.exp} of ${CASES.n}`, cap: `Cleaned reactors: ${CASES.exp} of ${CASES.n}` },
  controls: { kicker: 'Controls: same plant, matched on age', short: 'Controls', read: `${GRP.exp} of ${GRP.n}`, cap: `Cleaned reactors: ${GRP.exp} of ${GRP.n}` },
  table: { kicker: 'The table', short: 'TABLE', read: CELLS.map((r) => r.join(', ')).join(', ') },
  or: { kicker: 'Odds ratio', short: 'Odds', read: OR_S },
  checks: { kicker: 'Bias checks', short: 'Checks', read: '4 of 4 ticked' },
  cohort: { kicker: 'Cohort', read: `Relative risk ${RR_S}`, sub: `${COH.expCases} of ${fmtNum(COH.expN)}; ${COH.otherCases} of ${fmtNum(COH.otherN)}` },
  design: { kicker: 'Designs', short: 'Design', read: 'Case-control/cohort' },
  verdict: { kicker: 'Verdict', short: 'Verdict', read: 'Vinyl chloride', stamp: 'CONFIRMED' },
};
const CHECKS = ['Control source', 'Recall', 'Interviewer', 'Selection into the sample'];
const NOTES = {
  frame: `So might ${CASES.exp} of any ${CASES.n} men at that plant.`,
  or: 'A ratio this large can be built by the way the data were collected.',
  checks: "The factory's personnel records go back twenty years.",
};
const DESIGN = {
  cols: ['Case-control', 'Cohort'],
  rows: [['Starts from', 'disease', 'exposure'], ['Measures', 'odds ratio', 'incidence and relative risk'], ['Cost', 'quick and cheap', 'long and costly']],
};
const B2_LEDE = { 1: 'A count, and an empty frame beside it', 2: 'The table is in', 3: 'The association, measured', 4: 'Checks ticked; incidence still unknown', 5: 'Case closed' };

// k indices out of n, spread by a seeded shuffle, so a strip reads as people not a filled row.
function markedSet(n, k, seed) {
  const rnd = mulberry32(seed), idx = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; }
  return new Set(idx.slice(0, k));
}

export class CaseBoardScene extends SvgScene {
  static SETTING = 'casefile';
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }], [{ idx: 1, dwellMs: null }], [{ idx: 2, dwellMs: null }]];
  static ARIA_LABEL = 'A casefile evidence board for the live case, illustrative numbers. Each lesson pins one new card and keeps the earlier ones pinned. Tap the newest card to open it; tap an older card to enlarge it, and tap it again to close it.';
  static CONTROLS = [];
  static HEIGHT = 861;
  static PORTRAIT_HEIGHT = 1321;

  async setup() {
    this.stageNo = this._mountStage();
    this.open = null;        // null newest closed | 'new' newest opened | an older card's id
    this.found = false;      // the stage-5 find latches once
    this.frameDots = 0;      // the comparison frame never gains dots
    this.openedAt = -1e9;
    this.notes = annotations({ max: 3 });
    await super.setup();
    bindFlow(this.root, { action: (name, v) => this.act(name, v) });
  }

  // The mount's stage: the host config (this.config), or its .data bag. Falls back to 1.
  _mountStage() {
    const c = this.config || {};
    const v = Math.round(Number(c.stage ?? c.data?.stage ?? 1));
    return v >= 1 && v <= 5 ? v : 1;
  }

  // Test / robustness hook: draw stage n from scratch (a mount never changes stage mid-lesson).
  setStage(n) {
    const v = Math.round(Number(n));
    if (!(v >= 1 && v <= 5)) return this.stageNo;
    this.stageNo = v;
    this.open = null;
    this.found = false;
    this.openedAt = -1e9;
    this.notes.clear();
    this.repaint();
    return this.stageNo;
  }

  testState() {
    return { stage: this.stageNo, open: this.open, step: this.stepIndex, pins: this._thumbList().length + 1, found: this.found, frameDots: this.frameDots };
  }

  enter(step) {
    if (step === 0) this.open = null;              // nothing opens until the learner taps
    else if (step >= 2) this.open = 'new';         // beat 2 shows the opened newest card (a resumed mount lands settled)
    this.notes.clear();
  }

  act(name, v) {
    if (name !== 'open') return;
    const id = String(v);
    if (id !== 'new' && !THUMBS_OF[this.stageNo].some((t) => t.id === id)) return;
    if (this.open === id) { this.open = null; this.repaint(); return; }
    this.open = id;
    if (id === 'new') {
      this.openedAt = performance.now();
      if (this.stageNo === 5 && !this.found) {
        this.found = true;
        const g = this.geom(this.sv);
        this.celebrate(g.hx + g.hw / 2, g.hy + 230);
      }
    }
    this.repaint();
  }

  stageHeight(st) { return st.portrait ? 1174 : 734; }

  // The cards shown folded: the stage's older cards, minus any one now enlarged, plus the
  // newest card folded whenever something else is in the hero slot.
  _thumbList() {
    const list = THUMBS_OF[this.stageNo].filter((t) => t.id !== this.open).map((t) => ({ ...t }));
    if (this.open != null && this.open !== 'new') list.unshift({ id: HERO_OF[this.stageNo], isNew: true });
    return list;
  }

  geom(st) {
    const P = st.portrait, list = this._thumbList();
    const gap = 8, th = 70;
    if (P) {
      const hx = 8, hw = st.W - 16, hy = 12, hh = 420;
      return { P, list, hx, hy, hw, hh, tx: 8, ty: hy + hh + 14, tw: (hw - gap) / 2, th, gap, cols: 2, noteY: 0 };
    }
    const tx = 12, ty = 14, tw = 142, cols = 2;
    const hx = tx + cols * tw + gap + 12, hw = st.W - 12 - hx, hy = 14, hh = 398;
    return { P, list, hx, hy, hw, hh, tx, ty, tw, th, gap, cols, noteY: 0 };
  }

  // Fold positions: wide cards take a full row (landscape only); halves fill a 2-col grid.
  _thumbRects(g) {
    const out = []; let col = 0, y = g.ty;
    for (const t of g.list) {
      const wideRow = t.wide && !g.P;
      const w = wideRow ? g.cols * g.tw + g.gap : g.tw;
      const x = wideRow ? g.tx : g.tx + col * (g.tw + g.gap);
      out.push({ ...t, x, y, w, h: g.th });
      if (wideRow) { y += g.th + g.gap; col = 0; }
      else { col += 1; if (col >= g.cols) { col = 0; y += g.th + g.gap; } }
    }
    return out;
  }

  // Text width in stage px, for underline ranges under the words they name.
  textW(s, px) {
    this._mc ??= document.createElement('canvas').getContext('2d');
    const fam = getComputedStyle(this.root).getPropertyValue('--sim-font').trim() || 'sans-serif';
    this._mc.font = `700 ${px}px ${fam}`;
    return this._mc.measureText(s).width;
  }

  lede() {
    if (this.stepIndex === 2) return B2_LEDE[this.stageNo];
    if (this.open == null) return this.stepIndex === 0 ? 'The newest card is closed: tap it to open' : 'Nothing opens until you tap the new card';
    return 'Tap an older card to enlarge it; tap it again to close';
  }

  noteDue() {
    if (this.open !== 'new') return null;
    if (this.stageNo === 1) return NOTES.frame;
    if (this.stageNo === 3) return this.stepIndex >= 2 ? NOTES.or : null;
    if (this.stageNo === 4) return NOTES.checks;
    return null;
  }

  paint(st) {
    const g = this.geom(st), s = this.stepIndex, stage = this.stageNo, heroId = HERO_OF[stage];
    const fresh = performance.now() - this.openedAt < 450 && this.open != null;
    let svg = '', over = '';
    const surf = (x, y, w, h, extra = '') => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="3" class="cb-surf${extra}"/>`;
    const pin = (x, y) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3.5" class="cb-pin"/>`;

    // Pinned older cards: SVG surface + pin, transparent button on top.
    for (const t of this._thumbRects(g)) {
      const d = CARD_DEFS[t.id];
      svg += surf(t.x, t.y, t.w, t.h) + pin(t.x + t.w / 2, t.y + 2);
      // A wide stage-1 cluster thumb carries its dot strip; a wide stage-5 cohort card
      // carries the large reading the slide points at.
      let strip = '';
      if (t.id === 'cluster' && t.wide && !g.P) {
        const r = { x: t.x + t.w - 158, y: t.y + 8, w: 148, h: t.h - 16 };
        strip = dotsSvg(r, { n: CASES.n, cols: 10, hi: markedSet(CASES.n, CASES.exp, 7), tone: 8, hiTone: 2 }).svg;
      }
      svg += strip;
      const showSub = t.id === 'cohort' && t.wide && !g.P;
      // The NO INCIDENCE stamp hugs the odds-ratio thumb's bottom-right corner, inside
      // the card: the thumb is only 142 wide, and a stamp reaching to the right edge
      // overlapped the neighbouring thumb's text and the reading below it.
      const stamp = t.id === 'or' && stage >= 4
        ? '<span class="cb-stamp cb-stamp--sm cb-stamp--thumb">NO INCIDENCE</span>'
        : '';
      const newTag = t.isNew ? '<span class="cb-newtag">New</span>' : '';
      // The wide cluster thumb folds its long kicker so it cannot run into the dot strip;
      // the full label stays in the aria-label and on the opened card. Folded thumbs use a
      // short kicker; wrapped lines overflowed the 142x70 card (later lines covered the
      // reading below, and the NO INCIDENCE stamp sat across the odds-ratio reading).
      const label = t.id === 'cluster' && t.wide && !g.P ? 'Cluster: 20' : d.short ?? d.kicker;
      over += `<button type="button" class="cb-card${t.wide && !g.P ? ' cb-card--wide' : ''}" data-sflow-action="open" data-sflow-value="${t.id}"`
        + ` aria-label="${esc(d.kicker)}: ${esc(d.read)}. Tap to enlarge." style="left:${t.x}px;top:${t.y}px;width:${t.w}px;height:${t.h}px">`
        + `<i>${esc(label)}</i><b class="${t.id === 'or' && stage >= 4 ? 'cb-read--or' : ''}">${esc(d.read)}</b>${showSub ? `<em>${esc(d.sub)}</em>` : ''}${stamp}${newTag}</button>`;
    }

    // The hero slot: the newest card closed, the newest opened, or an enlarged older card.
    const heroOpenId = this.open === 'new' ? heroId : (this.open && this.open !== 'new' ? this.open : null);
    if (heroOpenId == null) {
      if (heroId === 'frame') {
        const fx = g.hx + 6, fy = g.hy + 6, fw = g.hw - 12, fh = g.hh - 12;
        svg += `<rect x="${fx}" y="${fy}" width="${fw}" height="${fh}" rx="4" class="cb-frame"/>` + pin(g.hx + g.hw / 2, g.hy + 2);
        over += `<span class="cb-q" style="left:${g.hx + g.hw / 2}px;top:${g.hy + g.hh / 2 - 30}px">?</span>`
          + `<span class="cb-framelab" style="left:${g.hx + g.hw / 2}px;top:${g.hy + g.hh / 2 + 16}px">Comparison group</span>`
          + `<span class="cb-newtag" style="left:${g.hx + g.hw - 64}px;top:${g.hy + 12}px">New</span>`
          + `<button type="button" class="cb-card cb-hero cb-hint" data-sflow-action="open" data-sflow-value="new"`
          + ` aria-label="The comparison group frame is empty. Tap to read the senior's note."`
          + ` style="left:${g.hx}px;top:${g.hy}px;width:${g.hw}px;height:${g.hh}px"><span class="cb-taphint">Tap to read the note</span></button>`;
      } else {
        const d = CARD_DEFS[heroId];
        const stamp = heroId === 'verdict' && d.stamp ? '<span class="cb-stamp cb-stamp--cele">CONFIRMED</span>' : '';
        const read = heroId === 'verdict' ? `<b>${esc(d.read)}</b>` : '';
        svg += surf(g.hx, g.hy, g.hw, g.hh) + pin(g.hx + g.hw / 2, g.hy + 2);
        over += `<button type="button" class="cb-card cb-hero cb-hint" data-sflow-action="open" data-sflow-value="new"`
          + ` aria-label="The newest card, ${esc(d.kicker)}. Tap to open."`
          + ` style="left:${g.hx}px;top:${g.hy}px;width:${g.hw}px;height:${g.hh}px"><i>${esc(d.kicker)}</i>${read}`
          + `<span class="cb-taphint">Tap to open</span><span class="cb-newtag">New</span>${stamp}</button>`;
      }
    } else {
      const fx = fresh ? ' cb-fresh' : '';
      svg += surf(g.hx, g.hy, g.hw, g.hh, fx);
      const body = this._heroBody(heroOpenId, g, s);
      svg += body.svg;
      over += `<div class="cb-open${fx}" style="left:${g.hx}px;top:${g.hy}px;width:${g.hw}px;height:${g.hh}px">${body.html}${body.over ?? ''}</div>`;
      if (this.open !== 'new') {
        over += `<button type="button" class="cb-card cb-hero" data-sflow-action="open" data-sflow-value="${heroOpenId}"`
          + ` aria-label="Close ${esc(CARD_DEFS[heroOpenId].kicker)}" style="left:${g.hx}px;top:${g.hy}px;width:${g.hw}px;height:${g.hh}px"></button>`;
      }
    }

    // The senior's note, when this stage's timing says so.
    const note = this.noteDue();
    if (note != null) {
      const ny = g.P ? this._noteY(g) : g.hy + g.hh - 88; // pinned to the opened card's foot, clear of its body and of the footer below
      over += `<span class="cb-senior" style="left:${g.hx}px;top:${ny}px;width:${g.P ? st.W - 16 : g.hw}px"><i>Senior's note</i>${esc(note)}</span>`;
    }

    // Beat 2: the underline under the stage's key reading (marks render via notes below).
    if (s === 2) this._underline(g);

    const head = '<span class="sl-kicker">Live case (illustrative)</span>' + chip(this.lede(), 0, 0, { tone: 'plain', static: true });
    const footY = g.P ? g.hy + g.hh + 8 : g.hy + g.hh + 10;
    over += `<span class="cb-foot" style="left:${st.W - 6}px;top:${footY}px">Illustrative numbers: a made-up plant</span>`;
    return { svg: this.notes.under() + svg + this.notes.svg(), over, head };
  }

  // The beat-2 brass underline, measured from the drawing, never guessed.
  _underline(g) {
    const find = (id) => this._thumbRects(g).find((t) => t.id === id);
    if (this.stageNo === 1) {
      const t = find('cluster');
      if (t) this.notes.underline({ x1: t.x + 12, x2: t.x + 12 + this.textW(`${CASES.exp} of ${CASES.n}`, 17), y: t.y + 54 }, { key: 'b2' });
    } else if (this.stageNo === 2 && this.open === 'new') {
      const T = this._tableSpec(g), c0 = T.cell(0, 0), c1 = T.cell(0, 1);
      this.notes.underline({ x1: c0.x, x2: c1.x + c1.w, y: c0.y + c0.h + 3 }, { key: 'b2' });
    } else if (this.stageNo === 3 && this.open === 'new') {
      this.notes.underline({ x1: g.hx + 16, x2: g.hx + 16 + this.textW(OR_S, 40), y: g.hy + 78 }, { key: 'b2' });
    } else if (this.stageNo === 4) {
      const t = find('or');
      if (t) {
        const x2 = t.x + t.w - 10;
        this.notes.underline({ x1: x2 - this.textW('NO INCIDENCE', 14) - 12, x2, y: t.y + t.h - 4 }, { key: 'b2' });
      }
    } else if (this.stageNo === 5) {
      const t = find('cohort');
      if (t) this.notes.underline({ x1: t.x + 12, x2: t.x + 12 + this.textW(`Relative risk ${RR_S}`, 17), y: t.y + 74 }, { key: 'b2' });
    }
  }

  _noteY(g) { return g.ty + Math.ceil(g.list.length / g.cols) * (g.th + g.gap) + 12; }

  _heroBody(id, g, s) {
    const px = (x) => (g.hx + x).toFixed(1), py = (y) => (g.hy + y).toFixed(1);
    let svg = '', html = '', over = '';
    const kick = (t, y) => { html += `<span class="cb-kick" style="left:16px;top:${y}px">${esc(t)}</span>`; };
    if (id === 'cluster' || id === 'controls') {
      const d = CARD_DEFS[id], n = id === 'cluster' ? CASES.n : GRP.n, k = id === 'cluster' ? CASES.exp : GRP.exp;
      kick(d.kicker, 14);
      const r = { x: g.hx + 16, y: g.hy + 46, w: g.hw - 32, h: id === 'cluster' ? 150 : 160 };
      svg += dotsSvg(r, { n, cols: id === 'cluster' ? 10 : 12, hi: markedSet(n, k, 7), tone: 8, hiTone: 2 }).svg;
      html += `<span class="cb-cap" style="left:16px;top:${r.y - g.hy + r.h + 16}px">${esc(d.cap)}</span>`;
    } else if (id === 'table') {
      kick('The table', 14);
      const T = this._tableSpec(g);
      const o = tableSvg(T, { band: s === 2 ? [{ row: 0, tone: 1 }] : [] });
      svg += o.svg;
      // tableSvg's over is in full-stage coordinates; this hero body lives in a
      // hero-local overlay div (left/top at the hero's origin), so shift it back or
      // every cell label lands a hero-width too far right, off the card.
      const rel = (html) => html.replace(/style="left:([\d.-]+)px;top:([\d.-]+)px/g,
        (_, lx, ty) => `style="left:${(Number(lx) - g.hx).toFixed(1)}px;top:${(Number(ty) - g.hy).toFixed(1)}px`);
      over += rel(o.over);
      let letters = '';
      for (const [ch, r, c] of [['a', 0, 0], ['b', 0, 1], ['c', 1, 0], ['d', 1, 1]]) {
        const cell = T.cell(r, c);
        letters += `<span class="cb-ab" style="left:${(cell.x - g.hx + cell.w - 16).toFixed(1)}px;top:${(cell.y - g.hy + 5).toFixed(1)}px">${ch}</span>`;
      }
      html += letters
        + `<span class="cb-sub" style="left:16px;top:306px">How strongly?</span>`
        + `<span class="cb-sub" style="left:16px;top:330px">The ${CASES.n} cases against the ${GRP.n} controls, one table</span>`;
    } else if (id === 'or') {
      kick('Odds ratio', 16);
      html += `<span class="cb-big" style="left:16px;top:36px">${esc(OR_S)}</span>`
        + `<span class="cb-line" style="left:16px;top:92px">${esc(OR_WORKING)}</span>`
        + `<span class="cb-sub" style="left:16px;top:118px">Cases' exposure odds over controls' exposure odds</span>`;
      // Same stamp line as the thumb, mirrored to the right so it never crosses the
      // 40 px reading on the left (the open-card stamp used to sit at mid-height, over it).
      if (this.stageNo >= 4) html += '<span class="cb-stamp cb-stamp--mid">NO INCIDENCE</span>';
    } else if (id === 'checks') {
      kick('Bias checks', 16);
      CHECKS.forEach((t, i) => {
        const y = 52 + i * 36;
        svg += `<path d="M ${px(18)} ${py(y + 8)} l 6 7 l 11 -14" class="cb-tick"/>`;
        html += `<span class="cb-tickline" style="left:44px;top:${y}px">${esc(t)}</span>`;
      });
      html += `<span class="cb-sub" style="left:16px;top:212px">Every check passed. What the study still cannot say is written on the odds-ratio card.</span>`;
    } else if (id === 'cohort') {
      kick('Cohort', 14);
      html += `<span class="cb-line" style="left:16px;top:40px">Reactor workers: ${esc(`${COH.expCases} of ${fmtNum(COH.expN)}`)}</span>`
        + `<span class="cb-sub" style="left:16px;top:62px">incidence ${esc(INC_EXP)}</span>`
        + `<span class="cb-line" style="left:16px;top:92px">Other workers: ${esc(`${COH.otherCases} of ${fmtNum(COH.otherN)}`)}</span>`
        + `<span class="cb-sub" style="left:16px;top:114px">incidence ${esc(INC_OTHER)}</span>`;
      const rect = { x: g.hx + 16, y: g.hy + 146, w: 190, h: 130 };
      const rb = ratioBars(rect, [{ key: 'exp', v: (COH.expCases / COH.expN) / (COH.otherCases / COH.otherN) }, { key: 'other', v: 1 }], { maxV: 12 });
      for (const b of rb.bars) {
        if (b.h > 0) svg += `<rect x="${b.x.toFixed(1)}" y="${b.y.toFixed(1)}" width="${b.w.toFixed(1)}" height="${b.h.toFixed(1)}" rx="2" class="cb-bar"/>`;
        html += `<span class="cb-sub" style="left:${(b.x - g.hx + b.w / 2).toFixed(1)}px;top:${rb.baseY - g.hy + 6}px;transform:translateX(-50%)">${b.key === 'exp' ? 'Reactor' : 'Other'}</span>`;
      }
      svg += `<line x1="${rect.x}" y1="${rb.baseY.toFixed(1)}" x2="${rect.x + rect.w}" y2="${rb.baseY.toFixed(1)}" class="cb-baseline"/>`
        + `<text x="${rect.x - 6}" y="${(rb.baseY + 4).toFixed(1)}" text-anchor="end" class="cb-svgsub">1.0</text>`;
      html += `<span class="cb-kick" style="left:${g.hw - 128}px;top:170px">Relative risk</span>`
        + `<span class="cb-big cb-big--rr" style="left:${g.hw - 128}px;top:192px">${esc(RR_S)}</span>`;
    } else if (id === 'verdict') {
      kick('The agent', 16);
      html += `<span class="cb-agent" style="left:16px;top:42px">Vinyl chloride</span>`
        + `<span class="cb-line" style="left:16px;top:96px">The gas from which PVC is made</span>`
        + `<span class="cb-sub" style="left:16px;top:122px">Confirmed behind the liver tumours: the case is closed</span>`
        ;

      // The CONFIRMED find marker is the kit stamp from celebrate() above; the closed
      // card's own stamp (paint) carries b0. No second stamp and no tick glyph here:
      // the tick rendered as a tofu box in the shoot browser (U+2713 missing there).
    } else if (id === 'design') {
      kick('Two designs', 16);
      let cells = '<span class="h"></span>' + DESIGN.cols.map((c) => `<span class="h">${esc(c)}</span>`).join('');
      for (const [k, a, b] of DESIGN.rows) cells += `<span class="k">${esc(k)}</span><span>${esc(a)}</span><span>${esc(b)}</span>`;
      html += `<div class="cb-grid" style="left:16px;top:44px;width:${g.hw - 32}px">${cells}</div>`;
    } else if (id === 'frame') {
      // Opened: the frame stays empty; the senior's note carries the beat (drawn by paint()).
      const fx = 6, fy = 6;
      svg += `<rect x="${px(fx)}" y="${py(fy)}" width="${g.hw - 12}" height="${g.hh - 12}" rx="4" class="cb-frame"/>`;
      html += `<span class="cb-q" style="left:${g.hw / 2}px;top:${g.hh / 2 - 30}px">?</span>`
        + `<span class="cb-framelab" style="left:${g.hw / 2}px;top:${g.hh / 2 + 16}px">Comparison group</span>`;
    }
    return { svg, html, over };
  }

  // The 2x2 spec, built for the hero's stage rect (shared by the open card and the underline).
  // The hero (hw 344 incl. the portrait full width) is too narrow for the six header labels the
  // spec lays out at 14px+ by default: 'Reactor cleaning' alone is 114 px, so the table ran off
  // the card's right edge (cell values dropped by the overlay clipping). Head labels shorten to
  // the words the beat itself says ('reactor cleaning' appears only in the thumb captions) and
  // the two margins drop to the row total only: column totals (80) repeat the 20 + 60 already on
  // the hero's own readings. Regained space goes to the header column.
  _tableSpec(g) {
    // Column totals are the stub's margins: a+c = 20 (the Cases column), b+d = 60 (the
    // Controls column). Row totals (14+9 = 23, 6+51 = 57) repeat neither the stub's
    // margins nor its numbers and read as cases beyond the 20 on the board.
    return tableSpec({ rect: { x: g.hx + 14, y: g.hy + 46, w: g.hw - 28, h: 246 }, rows: ['Cleaned reactors', 'Did not clean'], cols: ['Cases', 'Controls'], rowTitle: 'Cleaning', colTitle: 'Group', cells: CELLS, totals: 'cols', headW: 110, rowH: 50 });
  }

  css() {
    return TABLE_CSS + `
.svs-head { gap: var(--sim-space-3); }
.cb-surf { fill: var(--sim-bg-surface); stroke: color-mix(in srgb, var(--sim-label) 16%, transparent); filter: drop-shadow(0 5px 7px color-mix(in srgb, var(--sim-set-desk) 24%, transparent)); }
.cb-pin { fill: var(--sim-annot); }
.cb-frame { fill: color-mix(in srgb, var(--sim-annot) 4%, transparent); stroke: color-mix(in srgb, var(--sim-annot) 55%, var(--sim-stroke)); stroke-width: 1.6px; stroke-dasharray: 6 5; }
.cb-bar { fill: var(--sim-series-2); }
.cb-baseline { stroke: var(--sim-label-muted); stroke-width: 1px; stroke-dasharray: 4 4; }
.cb-svgsub { font: 600 14px var(--sim-font); fill: var(--sim-label-muted); }
.cb-tick { fill: none; stroke: var(--sim-annot); stroke-width: 2.5px; stroke-linecap: round; stroke-linejoin: round; }
.cb-card { position: absolute; box-sizing: border-box; margin: 0; padding: 8px 12px; text-align: left; cursor: pointer; background: transparent; border: 0; pointer-events: auto; font: 600 15px/1.2 var(--sim-font); color: var(--sim-label); }
.cb-card i { display: block; margin-bottom: 4px; font: 700 14px/1.15 var(--sim-font-mono, monospace); font-style: normal; letter-spacing: 0.04em; text-transform: uppercase; color: var(--sim-label-muted); }
.cb-card b { display: block; font: 700 17px/1.15 var(--sim-font); color: var(--sim-label); font-variant-numeric: tabular-nums; }
.cb-read--or { max-width: 92px; }
.cb-hero .cb-agent { z-index: 1; }
.cb-card em { display: block; margin-top: 3px; font: 500 14px/1.2 var(--sim-font); font-style: normal; color: var(--sim-label-muted); }
.cb-card:hover { transform: translateY(-2px); }
.cb-card:focus-visible { outline: 2px solid var(--sim-annot); outline-offset: 2px; }
.cb-hero .cb-taphint { position: absolute; left: 62px; bottom: 10px; transform: translateX(0); font: 700 14px/1 var(--sim-font-mono, monospace); letter-spacing: 0.06em; text-transform: uppercase; color: var(--sim-label-muted); }
.cb-hint { animation: cb-pulse 1.6s ease-in-out infinite; }
.cb-newtag { position: absolute; top: 6px; right: 8px; padding: 2px 7px; border: 1px solid color-mix(in srgb, var(--sim-annot) 45%, transparent); border-radius: 2px; font: 700 14px/1 var(--sim-font-mono, monospace); letter-spacing: 0.06em; text-transform: uppercase; color: var(--sim-annot); background: color-mix(in srgb, var(--sim-annot) 8%, var(--sim-bg-surface)); }
.cb-stamp { position: absolute; top: 50%; right: 12px; margin-top: -12px; padding: 4px 9px; border: 2px solid var(--sim-annot); border-radius: 2px; transform: rotate(-5deg); font: 700 14px/1 var(--sim-font-mono, monospace); letter-spacing: 0.05em; color: var(--sim-annot); background: color-mix(in srgb, var(--sim-annot) 6%, transparent); }
.cb-stamp--sm { top: auto; bottom: 7px; margin-top: 0; padding: 2px 6px; }
.cb-stamp--kick { top: 5px; bottom: auto; margin-top: 0; padding: 3px 7px; right: 2px; transform: translateY(14px) rotate(-5deg) scale(0.85); }
.cb-stamp--mid { top: auto; bottom: 18px; margin-top: 0; }
.cb-stamp--thumb { right: 6px; transform-origin: right center; transform: rotate(-4deg) scale(0.78); white-space: nowrap; }
.cb-open .cb-stamp--mid { bottom: 64px; }
.cb-stamp--cele { top: auto; bottom: 18px; margin-top: 0; }
.cb-open { position: absolute; }
.cb-kick { position: absolute; font: 700 14px/1.2 var(--sim-font-mono, monospace); letter-spacing: 0.04em; text-transform: uppercase; color: var(--sim-label-muted); }
.cb-big { position: absolute; font: 700 40px/1 var(--sim-font); color: var(--sim-annot); font-variant-numeric: tabular-nums; }
.cb-big--rr { font-size: 34px; }
.cb-line { position: absolute; font: 600 16px/1.3 var(--sim-font); color: var(--sim-label); font-variant-numeric: tabular-nums; }
.cb-sub { position: absolute; font: 500 14px/1.3 var(--sim-font); color: var(--sim-label-muted); }
.cb-cap { position: absolute; font: 700 18px/1.2 var(--sim-font); color: var(--sim-annot); font-variant-numeric: tabular-nums; }
.cb-agent { position: absolute; font: 700 30px/1 var(--sim-font); color: var(--sim-label); }
.cb-cele { position: absolute; right: 152px; bottom: 18px; margin-top: 0; font: 700 30px/1 var(--sim-font); color: var(--sim-annot); }
.cb-ab { position: absolute; font: 700 14px/1 var(--sim-font-mono, monospace); color: var(--sim-annot); pointer-events: none; }
.cb-q { position: absolute; transform: translate(-50%, 0); font: 700 34px/1 var(--sim-font); color: var(--sim-label-muted); }
.cb-framelab { position: absolute; transform: translate(-50%, 0); font: 700 14px/1 var(--sim-font-mono, monospace); letter-spacing: 0.06em; text-transform: uppercase; color: var(--sim-label-muted); white-space: nowrap; }
.cb-tickline { position: absolute; font: 600 15px/1.2 var(--sim-font); color: var(--sim-label); }
.cb-senior { position: absolute; box-sizing: border-box; padding: 8px 12px; border-left: 3px solid var(--sim-annot); background: var(--sim-bg-surface); font: 500 15px/1.45 var(--sim-font); color: var(--sim-label); }
.cb-senior i { display: block; margin-bottom: 3px; font: 700 14px/1 var(--sim-font-mono, monospace); font-style: normal; letter-spacing: 0.06em; text-transform: uppercase; color: var(--sim-label-muted); }
.cb-foot { position: absolute; transform: translate(-100%, -100%); font: 600 var(--sim-text-sm)/1 var(--sim-font); color: var(--sim-label-muted); white-space: nowrap; }
.cb-grid { position: absolute; box-sizing: border-box; display: grid; grid-template-columns: 92px 108px 108px; grid-auto-rows: minmax(30px, auto); column-gap: 6px; row-gap: 4px; font: 500 14px/1.25 var(--sim-font); color: var(--sim-label); }
.cb-grid .h { font: 700 14px/1.2 var(--sim-font-mono, monospace); text-transform: uppercase; letter-spacing: 0.03em; color: var(--sim-label-muted); }
.cb-grid .k { font: 700 14px/1.25 var(--sim-font); color: var(--sim-label); }
@keyframes cb-pulse { 50% { opacity: 0.55; } }
@keyframes cb-in { from { opacity: 0; transform: translateY(10px); } }
.cb-fresh { animation: cb-in 0.25s cubic-bezier(0.3, 0, 0.1, 1) backwards; }
@media (prefers-reduced-motion: reduce) { .cb-fresh, .cb-hint { animation: none; } .cb-card:hover { transform: none; } }
`;
  }
}
