import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { withChallenge } from 'simulations/base/ChallengeMode.js';
import { SIM_CROWD_CSS, crowdLive, legendHtml } from 'simulations/base/kit/SimCrowd.js';

/**
 * RigTheStudyGame - mini-game@1 on blk-l04-s07 (analytical-epidemiology L04), framed as an exercise.
 * (The file name is historical; nothing on screen or in ARIA calls it a game.) Illustrative numbers.
 * A training file of 20 cases and 60 controls in which the exposure (tank cleaning) truly does nothing:
 * 6 of 20 cases and 18 of 60 controls exposed, odds ratio (6 x 42) / (18 x 14) = 1.00. Four rows of
 * choice chips run the study badly or well; the people and the odds ratio recompute with each choice.
 * Once the reading is 2.00 or more, every changed row opens a line of flaw chips (selection,
 * interviewer, recall, overmatching). Check gives the worked cross-product and, per changed choice, the
 * mechanism; it passes only when the reading is 2.00 or more and every flaw is named right. Model
 * (unchanged from the stub):
 *   a = 6 + 2 if the interviewer knows + 2 if the past comes from memory;
 *   b = 18 (same workforce) | 6 (office staff) | 27 (cases' relatives); matching on tank cleaning: b = 3a;
 *   c = 20 - a, d = 60 - b; OR = ad / bc.
 * Reskinned 2026-11-11 on SimCrowd (one dot = one person; blue = case, grey = control; filled = tank
 * cleaning, hollow = none): a change to a case's recorded past re-fills case dots in place; a change of control
 * source or of matching sends the old 60 controls out and a new 60 in (they are different people), with
 * their own exposed share filled. Teaching, choices, labels, numbers, tags and Check logic unchanged.
 */
const CASES_N = 20;
const CONTROLS_N = 60;
const TARGET_OR = 2.0;
const X = '&times;';
const FAIR = { source: 'workforce', interviewer: 'blind', past: 'records', match: 'age' };
const ROWS = [
  { id: 'source', label: 'Control source', opts: [
    { id: 'workforce', label: 'Same workforce' },
    { id: 'office', label: 'Office staff' },
    { id: 'relatives', label: "Cases' relatives" },
  ] },
  { id: 'interviewer', label: 'The interviewer', opts: [
    { id: 'blind', label: 'Kept in the dark' },
    { id: 'knows', label: 'Knows, on the ward' },
  ] },
  { id: 'past', label: 'The past', opts: [
    { id: 'records', label: 'Employment records' },
    { id: 'memory', label: "Men's memory" },
  ] },
  { id: 'match', label: 'Matching', opts: [
    { id: 'age', label: 'On age' },
    { id: 'job', label: 'On tank cleaning' },
    { id: 'none', label: 'None' },
  ] },
];
const FLAWS = [
  { id: 'selection', label: 'Selection' },
  { id: 'interviewer', label: 'Interviewer' },
  { id: 'recall', label: 'Recall' },
  { id: 'overmatching', label: 'Overmatching' },
];
const ROW_FLAW = { source: 'selection', interviewer: 'interviewer', past: 'recall', match: 'overmatching' };
const CONTROL_B = { workforce: 18, office: 6, relatives: 27 };
// Why each changed choice moves the table (worked feedback).
const WHY = {
  office: 'Office staff: selection bias. They never cleaned a tank, so only 6 of 60 controls are exposed instead of 18.',
  relatives: "Cases' relatives: selection bias. In this file 27 of 60 such controls are exposed, so this choice pushes the ratio down, not up.",
  knows: 'Knows, on the ward: interviewer bias. Probing the cases harder records 2 more exposed cases.',
  memory: "Men's memory: recall bias. Cases search their past harder: 2 more exposed cases.",
  job: 'On tank cleaning: overmatching. The controls are made as exposed as the cases (b = 3a), which pins the ratio at 1.00.',
};
const BRIEF = 'A training file, not the live case: the exposure truly does nothing. Run it badly on purpose: make it print an odds ratio of 2.00 or more, then tag each choice with the flaw it injects.';
const isFair = (row, opt) => opt === FAIR[row] || (row === 'match' && opt === 'none');

function countsOf(pick) {
  const a = 6 + (pick.interviewer === 'knows' ? 2 : 0) + (pick.past === 'memory' ? 2 : 0);
  const b = pick.match === 'job' ? a * 3 : CONTROL_B[pick.source];
  return { a, b, c: CASES_N - a, d: CONTROLS_N - b };
}
const orOf = (t) => (t.a * t.d) / (t.b * t.c);
const f2 = (v) => v.toFixed(2);
const changedRows = (pick) => ROWS.map((r) => r.id).filter((id) => !isFair(id, pick[id]));
const worked = (t) => `(${t.a} ${X} ${t.d}) / (${t.b} ${X} ${t.c}) = ${t.a * t.d} / ${t.b * t.c} = ${f2(orOf(t))}`;
// Who the 60 controls are: a new source or matching on tank cleaning means 60 different men.
const ctrlSet = (pick) => (pick.match === 'job' ? `j${pick.source[0]}` : pick.source[0]);
const casesOf = (t) => Array.from({ length: CASES_N }, (_, i) => ({ id: `k${i}`, ill: true, exposed: i < t.a }));
const ctrlsOf = (pick, t) => Array.from({ length: CONTROLS_N }, (_, i) => ({ id: `${ctrlSet(pick)}${i}`, ill: false, exposed: i < t.b }));

export class RigTheStudyGame extends withChallenge(SvgScene) {
  static WIDTH = 900;
  static HEIGHT = 450;
  static PORTRAIT_WIDTH = 380;
  static PORTRAIT_HEIGHT = 985;
  static MIN_SCALE = 0.85;
  static SETTING = 'none';
  static SELF_CHECKING = true;
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }]];
  static CONTROLS = [];
  static ARIA_LABEL = 'Exercise, illustrative numbers: a training case-control file whose exposure truly does nothing. One dot per man: 20 cases in blue, 6 of them filled for tank cleaning; 60 controls in grey, 18 filled; 30 per cent on both sides, odds ratio 1.00. Four rows of choices set the control source, the interviewer, the source of the past and the matching; the men re-fill or are replaced and the odds ratio recomputes. At 2.00 or more, each changed choice opens flaw chips: selection, interviewer, recall, overmatching. Press Check for the worked cross-product and the mechanism behind each choice.';
  static OBJECTIVE = { prompt: { en: 'From a study whose exposure truly does nothing, print an odds ratio of 2.00 or more, then name the flaw behind each choice that built it.' } };

  async setup() {
    this._pick = { ...FAIR };
    this._tags = {};
    this._touched = false;
    this._won = false;
    this._fb = ''; this._fbState = '';
    this.rgGone = null; this.rgFly = false;
    await super.setup();
    this.rgListen = (e) => this.onClick(e);
    this.root.addEventListener('click', this.rgListen);
  }

  // Lines of wrapped text at about px per character, for the stage height (portrait stacks everything).
  linesOf(html, w, px) { const n = String(html).replace(/<[^>]+>/g, '').length; return n ? Math.ceil((n * px) / w) : 0; }

  geo(st) {
    const P = st.portrait, W = st.W, t = countsOf(this._pick), open = orOf(t) >= TARGET_OR - 1e-9;
    const nOpen = open ? changedRows(this._pick).length : 0;
    if (P) {
      const briefH = 16 + this.linesOf(BRIEF, W, 7.0) * 20;
      const orY = briefH + 6, caseLab = orY + 84, step = (W - 8) / 12, r = Math.min(8.6, step * 0.33);
      const caseY = caseLab + 30 + step / 2, ctrlLab = caseY + step * 1.5 + 12, ctrlY = ctrlLab + 30 + step / 2;
      const panelY = ctrlY + 4.5 * step + 10;
      const panelH = 24 + 4 * 72 + nOpen * 44 + 64 + 12 + this.linesOf(this._fb, W, 7.4) * 20;
      return { P, W, step, r, cols: [10, 12], cx: 4, cw: W - 8, briefH, orY, caseLab, caseY, ctrlLab, ctrlY, panelX: 0, panelY, panelW: W, H: panelY + panelH };
    }
    // Desktop (the mini-game host sizes the board from a height budget, so the frame is wide and short):
    // the brief (or, once checked, the feedback) across the top; three columns under it: choices,
    // the people, and the reading with Check.
    // One fixed height for every state (the host frames the board at its static aspect): the top band holds the
    // brief, then the feedback (up to 4 lines); the choices column has room for three open flaw lines.
    const topH = 82, y0 = topH + 4;
    const panelW = 452, cx = panelW + 18, cw = 210, step = cw / 10, r = Math.min(7.4, step * 0.34);
    const caseLab = y0, caseY = caseLab + 46 + step / 2, ctrlLab = caseY + step * 1.5 + 8, ctrlY = ctrlLab + 46 + step / 2;
    const sideX = cx + cw + 18;
    const leftH = 4 * 44 + 3 * 36 + 6;
    return { P, W, step, r, cols: [10, 10], cx, cw, topH, orY: y0, caseLab, caseY, ctrlLab, ctrlY, sideX, sideW: W - sideX, panelX: 0, panelY: y0, panelW, H: y0 + Math.max(leftH, ctrlY + 5.5 * step - y0 + 4, 250) };
  }

  stageHeight(st) { return Math.ceil(this.geo(st).H); }

  exitOf(g) { return { x: g.W + 20, y: g.ctrlY + g.step }; }

  layout(g, cases, ctrls) {
    const pos = new Map(), boxOf = new Map();
    const cx0 = g.cx + g.step / 2;
    cases.forEach((p, i) => { pos.set(p.id, { x: cx0 + (i % g.cols[0]) * g.step, y: g.caseY + Math.floor(i / g.cols[0]) * g.step }); boxOf.set(p.id, 'k'); });
    ctrls.forEach((p, i) => { pos.set(p.id, { x: cx0 + (i % g.cols[1]) * g.step, y: g.ctrlY + Math.floor(i / g.cols[1]) * g.step }); boxOf.set(p.id, 'c'); });
    for (const p of this.rgGone ?? []) { if (!pos.has(p.id)) { pos.set(p.id, this.exitOf(g)); boxOf.set(p.id, 'gone'); } }
    return { r: g.r, step: g.step, pos, boxOf, boxes: [], rules: [] };
  }

  paint(st) {
    const g = this.geo(st), t = countsOf(this._pick), or = orOf(t), open = or >= TARGET_OR - 1e-9;
    this.g = g;
    this.rgCases = casesOf(t); this.rgCtrls = ctrlsOf(this._pick, t);
    this.lay = this.layout(g, this.rgCases, this.rgCtrls);
    let over = '';
    const fbTop = !g.P && this._fb;
    over += fbTop ? `<p class="rg-brief rg-fb rg-fb--top${this._fbState ? ` rg-fb--${this._fbState}` : ''}" aria-live="polite" style="left:0;top:0;width:${g.W}px">${this._fb}</p>`
      : `<p class="rg-brief" style="left:0;top:0;width:${g.W}px">${BRIEF}</p>`;
    // The reading: the odds ratio is the biggest thing on the board.
    const orHtml = `<div class="rg-or${open ? ' rg-or--open' : ''}"${g.P ? ` style="left:${g.cx}px;top:${g.orY}px;width:${g.cw}px"` : ''}><span class="rg-orn"><small>OR</small>${f2(or)}</span>`
      + `<span class="rg-ors"><span class="rg-frac">(${t.a} ${X} ${t.d}) / (${t.b} ${X} ${t.c})</span><span>truth 1.00; target 2.00 or more</span></span></div>`;
    if (g.P) over += orHtml;
    else over += `<div class="rg-side" style="left:${g.sideX}px;top:${g.orY}px;width:${g.sideW}px">${orHtml}${this.promptHtml(open)}<button type="button" class="rg-go" data-check="1">Check</button></div>`;
    over += `<span class="rg-lab rg-lab--case" style="left:${g.cx}px;top:${g.caseLab}px">20 cases<em><b>${t.a}</b> of 20 cleaned tanks</em></span>`;
    over += `<span class="rg-lab" style="left:${g.cx}px;top:${g.ctrlLab}px">60 controls<em><b>${t.b}</b> of 60 cleaned tanks</em></span>`;
    over += this.panelHtml(g, open);
    const head = legendHtml({ show: ['ill', 'well', 'exposed', 'unexposed'], text: { ill: 'case', well: 'control', exposed: 'tank cleaning', unexposed: 'none' } });
    return { svg: '', over, head };
  }

  promptHtml(open) {
    const prompt = this._won ? 'Done. Try another way to break the file if you like.'
      : open ? 'Now tag each changed choice with its flaw, then press Check' : 'Change choices until the odds ratio reads 2.00 or more';
    return `<p class="rg-prompt${this._won ? ' rg-prompt--done' : ''}">${prompt}</p>`;
  }

  panelHtml(g, open) {
    let h = `<div class="rg-panel" style="left:${g.panelX}px;top:${g.panelY}px;width:${g.panelW}px">`;
    if (g.P) h += this.promptHtml(open);
    for (const r of ROWS) {
      const opts = r.opts.map((o) => `<button type="button" class="rg-chip${this._pick[r.id] === o.id ? ' rg-chip--on' : ''}" data-row="${r.id}" data-opt="${o.id}" aria-pressed="${this._pick[r.id] === o.id}">${o.label}</button>`).join('');
      const flaw = open && !isFair(r.id, this._pick[r.id])
        ? `<span class="rg-flaws" role="group" aria-label="Flaw behind ${r.label}"><em>Flaw</em>${FLAWS.map((f) => `<button type="button" class="rg-flaw${this._tags[r.id] === f.id ? ' rg-flaw--on' : ''}" data-tag="${r.id}" data-flaw="${f.id}" aria-pressed="${this._tags[r.id] === f.id}">${f.label}</button>`).join('')}</span>`
        : '';
      h += `<div class="rg-row"><span class="rg-rl">${r.label}</span><span class="rg-opts" role="group" aria-label="${r.label}">${opts}</span>${flaw}</div>`;
    }
    if (g.P) h += '<div class="rg-check"><button type="button" class="rg-go" data-check="1">Check</button></div>';
    if (g.P) h += `<p class="rg-fb${this._fbState ? ` rg-fb--${this._fbState}` : ''}" aria-live="polite">${this._fb}</p>`;
    return h + '</div>';
  }

  animate() {
    if (!this.lay) return;
    const gone = (this.rgGone ?? []).filter((p) => this.lay.boxOf.get(p.id) === 'gone').map((p) => ({ ...p, dim: true }));
    const ex = this.exitOf(this.g);
    crowdLive(this.live, 'rg', [...this.rgCases, ...this.rgCtrls, ...gone], this.lay, { from: this.rgFly ? () => ex : undefined, order: 'row', spread: 0.6 });
  }

  onClick(e) {
    const b = e.target?.closest?.('[data-opt],[data-flaw],[data-check]');
    if (!b) return;
    if (b.dataset.check) this.onCheck();
    else if (b.dataset.flaw) this.onTag(b.dataset.tag, b.dataset.flaw);
    else this.onPick(b.dataset.row, b.dataset.opt);
  }

  onPick(row, opt) {
    if (this._pick[row] === opt) return;
    const before = ctrlsOf(this._pick, countsOf(this._pick));
    this._pick[row] = opt;
    this._touched = true;
    const changed = changedRows(this._pick);
    for (const r of Object.keys(this._tags)) if (!changed.includes(r)) delete this._tags[r];
    if (!this._won) { this._fb = ''; this._fbState = ''; }
    const nowSet = ctrlSet(this._pick);
    if (before[0].id.slice(0, -1) !== nowSet) {
      this.rgGone = before; this.rgFly = true;
      this.after(1.1, () => { this.rgGone = null; this.repaint(); });
    }
    this.repaint();
  }

  onTag(row, flaw) {
    this._tags[row] = flaw;
    if (!this._won) { this._fb = ''; this._fbState = ''; }
    this.repaint();
  }

  onCheck() {
    const t = countsOf(this._pick), or = orOf(t), changed = changedRows(this._pick);
    const line = `Odds ratio = ${worked(t)}.`;
    if (!this._touched || !changed.length) {
      this._fb = `<b>Not yet.</b> The fair file reads ${worked(t)}. Change a choice.`; this._fbState = 'no';
    } else if (or < TARGET_OR) {
      const hint = this._pick.match === 'job' ? ' Matching on tank cleaning pins the ratio at 1.00: overmatching hides an effect, it cannot build one.' : ' The target is 2.00.';
      this._fb = `<b>Not yet.</b> ${line}${hint}`; this._fbState = 'no';
    } else {
      const wrong = changed.filter((r) => this._tags[r] !== ROW_FLAW[r]);
      if (wrong.length) {
        const missing = wrong.filter((r) => !this._tags[r]).length;
        this._fb = `<b>Not yet.</b> ${line} ${missing === wrong.length ? `Tag ${wrong.length === 1 ? 'the changed choice' : `all ${wrong.length} changed choices`} with a flaw.` : `${changed.length - wrong.length} of ${changed.length} flaw names are right; look again at ${ROWS.find((r) => r.id === wrong[0]).label.toLowerCase()}.`}`;
        this._fbState = 'no';
      } else {
        this._won = true;
        this._fb = `<b>Correct.</b> ${line} ${changed.map((r) => WHY[this._pick[r]]).join(' ')} The exposure did nothing; the study built ${f2(or)}.`;
        this._fbState = 'ok';
        this.repaint();
        this.requestCheck?.();
        return;
      }
    }
    this.repaint();
  }

  checkObjective() {
    if (this._won) return { ok: true };
    if (!this._touched) return null;
    return { ok: false };
  }

  resetChallenge() {
    super.resetChallenge();
    this._won = false;
    this._fb = ''; this._fbState = '';
    this.repaint();
  }

  testState() {
    const t = countsOf(this._pick), changed = changedRows(this._pick);
    return { or: orOf(t), orText: f2(orOf(t)), a: t.a, b: t.b, touched: this._touched, open: orOf(t) >= TARGET_OR, changed: changed.length, tagsRight: changed.length > 0 && changed.every((r) => this._tags[r] === ROW_FLAW[r]), won: this._won };
  }

  destroy() {
    this.root?.removeEventListener('click', this.rgListen);
    super.destroy();
  }

  css() {
    return SIM_CROWD_CSS + `
.svs-head { justify-content: flex-start; }
.rg-brief { position: absolute; margin: 0; padding: 6px 0 6px 12px; border-left: 3px solid var(--sim-label); font: 500 var(--sim-text-md)/1.3 var(--sim-font); color: var(--sim-label); box-sizing: border-box; }
.rg-or { position: absolute; box-sizing: border-box; display: flex; flex-wrap: wrap; align-items: flex-end; gap: 2px 14px; padding-bottom: 6px; border-bottom: 1px solid var(--sim-label); }
.rg-orn { display: flex; align-items: baseline; gap: 6px; font: 400 60px/1 var(--sim-font-numeral, var(--sim-font)); font-variant-numeric: lining-nums tabular-nums; color: var(--sim-label); transition: color 0.3s ease; }
.rg-orn small { font: 700 var(--sim-text-sm)/1 var(--sim-font); color: var(--sim-label-muted); letter-spacing: 0.06em; }
.rg-or--open .rg-orn { color: var(--sim-annot); }
.rg-ors { display: flex; flex-direction: column; gap: 2px; font: 500 var(--sim-text-sm)/1.3 var(--sim-font); color: var(--sim-label-muted); }
.rg-frac { font: 600 var(--sim-text-md)/1.2 var(--sim-font); color: var(--sim-label); font-variant-numeric: tabular-nums; }
.rg-lab { position: absolute; display: flex; gap: 10px; align-items: baseline; font: 700 15px/1.2 var(--sim-font); color: var(--sim-label); white-space: nowrap; }
.rg-lab em { font-style: normal; font-weight: 500; font-size: var(--sim-text-sm); color: var(--sim-label-muted); }
.rg-lab em b { font-weight: 700; color: var(--sim-label); }
.rg-lab--case { color: var(--sim-annot); }
.rg-tab { position: absolute; display: grid; grid-template-columns: auto auto auto; gap: 2px 18px; font: 500 var(--sim-text-sm)/1.35 var(--sim-font); color: var(--sim-label); }
.rg-th { color: var(--sim-label-muted); text-align: right; }
.rg-rh { color: var(--sim-label-muted); }
.rg-td { text-align: right; font-variant-numeric: tabular-nums; font-weight: 700; border-top: 1px solid color-mix(in oklab, var(--sim-label) 30%, transparent); }
.rg-td i { margin-right: 6px; font-weight: 400; color: var(--sim-annot); }
.rg-fb { position: absolute; margin: 0; font: 500 var(--sim-text-sm)/1.4 var(--sim-font); color: var(--sim-label); }
.rg-panel .rg-fb { position: static; margin-top: 8px; }
.rg-fb--ok b:first-child { color: var(--sim-good); }
.rg-fb--no b:first-child { color: var(--sim-bad); }
.rg-panel { position: absolute; pointer-events: auto; display: flex; flex-direction: column; gap: 0; }
.rg-prompt { margin: 0 0 6px; font: 700 var(--sim-text-sm)/1.3 var(--sim-font); color: var(--sim-annot); }
.rg-prompt--done { color: var(--sim-good); }
.rg-row { display: grid; grid-template-columns: minmax(0, 1fr); align-items: center; gap: 4px; padding: 5px 0; border-top: 1px solid color-mix(in oklab, var(--sim-label) 25%, transparent); }
.rg-rl { font: 700 var(--sim-text-sm)/1.2 var(--sim-font); color: var(--sim-label); }
.rg-opts, .rg-flaws { display: flex; flex-wrap: wrap; gap: 4px; }
.rg-flaws { align-items: center; padding-left: 8px; border-left: 2px solid var(--sim-annot); }
.rg-flaws em { font: 700 var(--sim-text-sm)/1 var(--sim-font); font-style: normal; color: var(--sim-annot); margin-right: 4px; }
.rg-chip, .rg-flaw { min-height: 40px; padding: 0 10px; border: 1px solid color-mix(in oklab, var(--sim-label) 35%, transparent); border-radius: var(--sim-radius-sm); background: var(--sim-bg-surface); color: var(--sim-label); font: 600 var(--sim-text-sm)/1.1 var(--sim-font); cursor: pointer; }
.rg-flaw { min-height: 36px; padding: 0 8px; }
.rg-chip--on { border: 2px solid var(--sim-label); background: var(--sim-annot-tint); font-weight: 700; }
.rg-flaw--on { border: 2px solid var(--sim-annot); color: var(--sim-annot); font-weight: 700; }
.rg-chip:focus-visible, .rg-flaw:focus-visible, .rg-go:focus-visible { outline: 2px solid var(--sim-annot); outline-offset: 2px; }
.rg-check { padding-top: 10px; border-top: 1px solid var(--sim-label); }
.rg-go { min-height: 46px; padding: 0 26px; border: 1.5px solid var(--sim-annot); border-radius: var(--sim-radius-sm); background: var(--sim-annot); color: var(--sim-bg-surface); font: 700 var(--sim-text-md)/1 var(--sim-font); cursor: pointer; }
.rg-opts { flex-wrap: nowrap; }
.rg-chip { padding: 0 7px; white-space: nowrap; }
.rg-side { position: absolute; display: flex; flex-direction: column; align-items: flex-start; gap: 10px; pointer-events: auto; }
.rg-side .rg-or { position: static; width: 100%; }
.rg-side .rg-prompt { margin: 0; }
.rg-fb--top { font-size: 14px; line-height: 1.32; padding-top: 2px; padding-bottom: 2px; }
.sim-dom-root:not(.sim-dom-root--portrait) .rg-row { grid-template-columns: 6.2em minmax(0, 1fr); gap: 4px 6px; padding: 4px 0; }
.sim-dom-root:not(.sim-dom-root--portrait) .rg-flaws { grid-column: 2; }
.sim-dom-root:not(.sim-dom-root--portrait) .rg-lab { flex-direction: column; gap: 2px; }
.sim-dom-root:not(.sim-dom-root--portrait) .rg-chip { padding: 0 6px; }
.sim-dom-root:not(.sim-dom-root--portrait) .rg-row { padding: 2px 0; }
.sim-dom-root:not(.sim-dom-root--portrait) .rg-chip { min-height: 38px; }
.sim-dom-root:not(.sim-dom-root--portrait) .rg-flaws { gap: 3px; padding-left: 6px; flex-wrap: nowrap; }
.sim-dom-root:not(.sim-dom-root--portrait) .rg-flaw { min-height: 32px; padding: 0 5px; }
.sim-dom-root:not(.sim-dom-root--portrait) .rg-side, .sim-dom-root:not(.sim-dom-root--portrait) .rg-lab { --sim-text-sm: 15px; }
.rg-flaws em { display: none; }
.rg-flaw { padding: 0 6px; white-space: nowrap; }
.sim-dom-root--portrait .rg-orn { font-size: 50px; }
.sim-dom-root--portrait .rg-brief { font-size: 14px; }
.sim-dom-root--portrait .rg-flaw { padding: 0 5px; font-size: 13px; }
.sim-dom-root--portrait .rg-or { flex-wrap: nowrap; }
.sim-dom-root--portrait .rg-flaws { gap: 3px; padding-left: 6px; }
`;
  }
}
