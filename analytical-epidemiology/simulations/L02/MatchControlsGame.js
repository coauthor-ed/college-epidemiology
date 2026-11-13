import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { withChallenge } from 'simulations/base/ChallengeMode.js';
import { SIM_CROWD_CSS, crowdLive, legendHtml } from 'simulations/base/kit/SimCrowd.js';

/**
 * MatchControlsGame - mini-game@1 on blk-l02-s09 (analytical-epidemiology L02), framed as an exercise.
 * (The file name is historical; nothing on screen or in ARIA calls it a game.)
 * Live case, illustrative: 20 patients with the tumour, 60 controls to choose from the plant's own
 * workforce. The learner sets three selection rules (toggle buttons); the 60 controls those rules pick are
 * re-picked in front of the student: men who no longer qualify fly out, the new picks fly in. One dot = one
 * man: blue = tumour in record, grey = no tumour; FILLED = cleaned tanks, HOLLOW = other work. The
 * patients' and controls' average ages stand as two ticks on an age scale. The scene owns its Check
 * (SELF_CHECKING): the feedback names each rule that is wrong, with the numbers that show why.
 *   Fair group: tumour-free (0 of 60), age-matched (average 50.0 against 49.9), NOT matched on job
 *   (9 of 60 cleaned tanks, 15 per cent, against 14 of 20 patients, 70 per cent - the s10 table).
 *   Matched on job: 42 of 60 cleaners, 70 per cent, the patients' own share - the exposure can no
 *   longer differ. Not age-matched: average 41.6, 14 of 60 aged 50 or over. Tumour not excluded: 3 of 60.
 * Plain look: rules, no burst, no timer, no score. The brief at the top carries the two ideas of the
 * removed text slide (fair = the only difference is the disease; a fair rule leaves the cleaned count free).
 * Built on kit/SimCrowd.js (people as dots) inside an SvgScene stage.
 */
const PAT = { n: 20, cleaned: 14, age: '49.9', over50: 10 };
const CTL = 60;
const RULES = [
  { key: 'free', label: 'Leave out men with the tumour in their record' },
  { key: 'age', label: 'Match each patient\u2019s age, within 5 years' },
  { key: 'job', label: 'Match each patient\u2019s job, tank cleaning or not' },
];
const BRIEF = 'Pick 60 fair controls for the 20 patients. Fair: the only difference is the disease. Watch the cleaned-tanks count: a fair rule leaves it free.';

/** The 60 controls the rules produce (illustrative counts). */
function groupOf(r) {
  return {
    tumour: r.free ? 0 : 3,
    age: r.age ? '50.0' : '41.6',
    over50: r.age ? 30 : 14,
    cleaned: r.job ? 42 : 9,
  };
}
const pct = (a, b) => Math.round((100 * a) / b);

const PATIENTS = Array.from({ length: PAT.n }, (_, i) => ({ id: `pt${i}`, ill: true, exposed: i < PAT.cleaned }));

/** The men the rules pick: cleaned first, then other work, then any with the tumour (ids stable per pool). */
function picked(r) {
  const g = groupOf(r), a = r.age ? 'm' : 'u', out = [];
  for (let i = 0; i < g.cleaned; i++) out.push({ id: `${a}x${i}`, ill: false, exposed: true });
  for (let i = 0; i < CTL - g.cleaned - g.tumour; i++) out.push({ id: `${a}o${i}`, ill: false, exposed: false });
  for (let i = 0; i < g.tumour; i++) out.push({ id: `${a}t${i}`, ill: true, exposed: false });
  return out;
}

export class MatchControlsGame extends withChallenge(SvgScene) {
  static WIDTH = 900;
  static HEIGHT = 560;
  static PORTRAIT_WIDTH = 380;
  static PORTRAIT_HEIGHT = 770;
  static MIN_SCALE = 0.85;
  static SETTING = 'none';
  static SELF_CHECKING = true;
  static BEAT_STEP_MAP = [[{ idx: 0, dwellMs: null }]];
  static CONTROLS = [];
  static ARIA_LABEL = 'Exercise, illustrative live case: pick 60 fair controls from the plant workforce for 20 patients with the tumour. Fair means the only difference is the disease. One dot per man: blue has the tumour in his record, grey does not; filled cleaned tanks. 14 of the 20 patients cleaned tanks; their average age is 49.9. Three rules can be switched on or off: leave out men with the tumour, match each patient\u2019s age, match each patient\u2019s job. Each change re-picks the controls: the men who no longer qualify leave and new men join, and the cleaned-tanks count, tumour records and average age change with them. Set the rules for a fair comparison, then press Check.';
  static OBJECTIVE = { prompt: { en: 'Set the rules for choosing 60 fair controls, then press Check.' } };

  async setup() {
    this.rules = { free: false, age: false, job: false };
    this.changed = false;
    this.won = false;
    this.fb = '';
    this.fbState = '';
    this.mcGone = null;
    this.mcFly = false;
    await super.setup();
    this.mcListen = (e) => this.onClick(e);
    this.root.addEventListener('click', this.mcListen);
  }

  stageHeight(st) { return st.portrait ? 600 + this.fbShift(st) : 480; }

  geo(st) {
    const P = st.portrait, M = P ? 12 : 16;
    if (P) {
      const step = (st.W - 2 * M) / 20;
      const patY = 132 + this.fbShift(st), ctlY = patY + step + 52;
      return { P, M, W: st.W, step, r: 6.8, cx: M, cw: st.W - 2 * M, patY, ctlY, ageY: ctlY + 3 * step + 4 };
    }
    const cx = 372, cw = st.W - M - cx, step = cw / 20;
    return { P, M, W: st.W, step, r: 8.6, cx, cw, patY: 52, ctlY: 52 + step + 64, ageY: 52 + step + 64 + 3 * step + 16 };
  }

  layout(g, list) {
    const pos = new Map(), boxOf = new Map();
    PATIENTS.forEach((p, i) => { pos.set(p.id, { x: g.cx + (i + 0.5) * g.step, y: g.patY }); boxOf.set(p.id, 'pat'); });
    list.forEach((p, i) => { pos.set(p.id, { x: g.cx + ((i % 20) + 0.5) * g.step, y: g.ctlY + Math.floor(i / 20) * g.step }); boxOf.set(p.id, 'ctl'); });
    for (const p of this.mcGone ?? []) { if (!pos.has(p.id)) { pos.set(p.id, this.exitOf(g)); boxOf.set(p.id, 'gone'); } }
    return { r: g.r, step: g.step, pos, boxOf, boxes: [], rules: [] };
  }

  // Portrait: the feedback takes the brief's place at the top; the rest moves down by its extra lines.
  fbShift(st) {
    if (!st.portrait || !this.fb) return 0;
    const chars = this.fb.replace(/<[^>]+>/g, '').length, lines = Math.ceil((chars * 8.4) / (st.W - 40));
    return Math.max(0, lines * 22.5 - 92);
  }

  exitOf(g) { return { x: g.W - g.M, y: g.ctlY + g.step }; }

  paint(st) {
    const g = this.geo(st), r = this.rules, grp = groupOf(r);
    this.g = g;
    this.mcList = picked(r);
    this.lay = this.layout(g, this.mcList);
    let over = '';
    const lx = g.cx;
    over += `<div class="mc-lab" style="left:${lx}px;top:${g.patY - g.step / 2 - (g.P ? 30 : 36)}px;width:${g.cw}px"><span><b class="mc-case">20 patients</b>${g.P ? '' : ' with the tumour'}</span><span class="mc-cnt"><b>${PAT.cleaned}</b> of 20 cleaned${g.P ? '' : ' tanks'}</span></div>`;
    const jobBad = r.job;
    over += `<div class="mc-lab" style="left:${lx}px;top:${g.ctlY - g.step / 2 - (g.P ? 30 : 36)}px;width:${g.cw}px"><span><b>60 controls</b>${grp.tumour ? ` <em class="mc-warn">${grp.tumour} ${g.P ? 'tumour' : 'with the tumour'}</em>` : ''}</span><span class="mc-cnt${jobBad ? ' mc-cnt--bad' : ''}"><b>${grp.cleaned}</b> of 60 cleaned${g.P ? '' : ' tanks'}</span></div>`;
    over += this.ageHtml(g, grp);
    over += this.leftHtml(g);
    const head = legendHtml({ show: ['ill', 'well', 'exposed', 'unexposed'], text: { ill: 'tumour in record', well: 'no tumour', exposed: 'cleaned tanks', unexposed: 'other work' } });
    return { svg: '', over, head };
  }

  ageHtml(g, grp) {
    const lo = 30, hi = 60, w = g.cw, X = (v) => ((Number(v) - lo) / (hi - lo)) * w, bad = !this.rules.age;
    return `<div class="mc-age" style="left:${g.cx}px;top:${g.ageY}px;width:${w}px">`
      + '<span class="mc-agelab">average age, years</span>'
      + `<span class="mc-axis"><i class="mc-tk mc-tk--case" style="left:${X(PAT.age)}px"></i><em class="mc-tl mc-tl--case" style="left:${X(PAT.age)}px">patients ${PAT.age}</em>`
      + `<i class="mc-tk${bad ? ' mc-tk--bad' : ''}" style="left:${X(grp.age)}px"></i><em class="mc-tl${bad ? ' mc-tl--bad' : ''}" style="left:${X(grp.age)}px">controls ${grp.age}</em>`
      + `<span class="mc-end" style="left:0">${lo}</span><span class="mc-end" style="left:${w}px">${hi}</span></span>`
      + `<span class="mc-over">aged 50 or over: patients ${PAT.over50} of 20, controls ${grp.over50} of 60</span></div>`;
  }

  leftHtml(g) {
    const P = g.P, x = g.M, w = P ? g.W - 2 * g.M : 332, r = this.rules;
    const ruleTop = P ? g.ageY + 90 : 0;
    let h = `<p class="mc-brief" style="left:${x}px;top:${P ? 0 : 0}px;width:${P ? w : w}px">${BRIEF}</p>`;
    if (P) h = `<p class="mc-brief${this.fb ? ` mc-brief--fb mc-brief--${this.fbState}` : ''}" style="left:${x}px;top:0;width:${w}px" aria-live="polite">${this.fb || BRIEF}</p>`;
    let btns = '';
    for (const x2 of RULES) btns += `<button type="button" class="mc-rule${r[x2.key] ? ' mc-rule--on' : ''}" data-rule="${x2.key}" aria-pressed="${r[x2.key]}"><i class="mc-box" aria-hidden="true"></i><span>${x2.label}</span></button>`;
    const prompt = this.won ? 'Done. You can keep changing the rules.' : 'Switch the rules on or off, then press Check.';
    h += `<div class="mc-rules" style="left:${x}px;top:${P ? ruleTop : 96}px;width:${w}px"><span class="mc-prompt${this.won ? ' mc-prompt--done' : ''}">${prompt}</span><span class="mc-btns" role="group" aria-label="Rules for choosing controls">${btns}</span>`
      + '<span class="mc-check"><button type="button" class="mc-go" data-check="1">Check</button></span>';
    const fb = `<span class="mc-fb${this.fbState ? ` mc-fb--${this.fbState}` : ''}" aria-live="polite">${this.fb}</span>`;
    if (P) return h + '</div>';
    return h + `</div><div class="mc-fbbox" style="left:${g.cx}px;top:${g.ageY + 128}px;width:${g.cw}px">${fb}</div>`;
  }

  animate() {
    if (!this.lay) return;
    const gone = (this.mcGone ?? []).filter((p) => this.lay.boxOf.get(p.id) === 'gone').map((p) => ({ ...p, dim: true }));
    const people = [...PATIENTS, ...this.mcList, ...gone];
    const ex = this.exitOf(this.g);
    crowdLive(this.live, 'mc', people, this.lay, { from: this.mcFly ? () => ex : undefined, order: 'row', spread: 0.6 });
  }

  onClick(e) {
    const b = e.target?.closest?.('[data-rule],[data-check]');
    if (!b) return;
    if (b.dataset.check) this.onCheck();
    else this.toggle(b.dataset.rule);
  }

  toggle(key) {
    if (!(key in this.rules)) return;
    const before = picked(this.rules);
    this.rules[key] = !this.rules[key];
    const now = new Set(picked(this.rules).map((p) => p.id));
    this.mcGone = before.filter((p) => !now.has(p.id));
    this.mcFly = true;
    this.changed = true;
    if (!this.won) { this.fb = ''; this.fbState = ''; }
    this.repaint();
    this.after(1.1, () => { this.mcGone = null; this.repaint(); });
  }

  fair() { return this.rules.free && this.rules.age && !this.rules.job; }

  /** Worked feedback: each rule that is wrong, with its numbers; when right, why the group is fair. */
  onCheck() {
    const g = groupOf(this.rules);
    if (this.fair()) {
      this.won = true;
      this.fb = `<b>Correct.</b> All 60 controls are free of the tumour, their average age is ${g.age} against the patients\u2019 ${PAT.age}, and the exposure is left free to differ: ${g.cleaned} of 60 cleaned tanks (${pct(g.cleaned, CTL)}%) against ${PAT.cleaned} of 20 patients (${pct(PAT.cleaned, PAT.n)}%).`;
      this.fbState = 'ok';
      this.repaint();
      this.requestCheck?.();
      return;
    }
    const why = [];
    if (this.rules.job) why.push(`Job: ${g.cleaned} of 60 controls cleaned tanks (${pct(g.cleaned, CTL)}%), the patients\u2019 own share, so the exposure can no longer differ.`);
    if (!this.rules.free) why.push(`Tumour: ${g.tumour} controls have it; controls must be free of the disease.`);
    if (!this.rules.age) why.push(`Age: ${g.age} years against ${PAT.age}; older men have worked longer, so match age.`);
    this.fb = `<b>Not yet.</b> ${why.join(' ')}`;
    this.fbState = 'no';
    this.repaint();
  }

  checkObjective() {
    if (!this.changed) return null;
    return this.won || this.fair() ? { ok: true } : { ok: false };
  }

  resetChallenge() {
    super.resetChallenge();
    this.won = false;
    this.fb = '';
    this.fbState = '';
    this.repaint();
  }

  testState() {
    return { rules: { ...this.rules }, won: this.won, group: groupOf(this.rules) };
  }

  destroy() {
    this.root?.removeEventListener('click', this.mcListen);
    super.destroy();
  }

  css() {
    return SIM_CROWD_CSS + `
.svs-head { justify-content: flex-start; }
.mc-brief { position: absolute; margin: 0; padding-left: 12px; border-left: 3px solid var(--sim-annot); font: 500 var(--sim-text-md)/1.4 var(--sim-font); color: var(--sim-label); }
.mc-lab { position: absolute; display: flex; justify-content: space-between; align-items: baseline; gap: 4px 12px; flex-wrap: wrap; font: 500 var(--sim-text-md)/1.2 var(--sim-font); color: var(--sim-label-muted); }
.mc-lab b { font-weight: 700; color: var(--sim-label); }
.mc-lab .mc-case { color: var(--sim-annot); }
.mc-cnt b { font: 400 30px/1 var(--sim-font-numeral, var(--sim-font)); font-variant-numeric: lining-nums tabular-nums; margin-right: 4px; }
.mc-cnt--bad b, .mc-warn { color: var(--sim-bad); }
.mc-warn { font-style: normal; font-weight: 700; }
.mc-age { position: absolute; display: flex; flex-direction: column; gap: 6px; font: 500 var(--sim-text-md)/1.2 var(--sim-font); color: var(--sim-label-muted); }
.mc-agelab { font-weight: 700; color: var(--sim-label); }
.mc-axis { position: relative; height: 44px; border-bottom: 1.5px solid var(--sim-label-muted); margin: 0 18px 18px 0; }
.mc-tk { position: absolute; bottom: -6px; width: 3px; height: 26px; margin-left: -1.5px; background: var(--sim-label-muted); transition: left 0.6s ease; }
.mc-tl { position: absolute; bottom: 14px; white-space: nowrap; font: 700 var(--sim-text-md)/1 var(--sim-font); font-style: normal; color: var(--sim-label); transform: translateX(-100%); padding-right: 4px; }
.mc-tk--case { background: var(--sim-annot); height: 36px; }
.mc-tl--case { color: var(--sim-annot); transform: none; bottom: 26px; padding-left: 6px; }
.mc-tk--bad { background: var(--sim-bad); }
.mc-tl--bad { color: var(--sim-bad); }
.mc-end { position: absolute; top: 48px; transform: translateX(-50%); font: 500 var(--sim-text-md)/1 var(--sim-font); color: var(--sim-label-muted); }
.mc-over { margin-top: 2px; }
.mc-rules { position: absolute; display: flex; flex-direction: column; gap: 10px; }
.mc-prompt { font: 700 var(--sim-text-md)/1.3 var(--sim-font); color: var(--sim-label); }
.mc-prompt--done { color: var(--sim-good); }
.mc-btns { display: flex; flex-direction: column; gap: 8px; }
.mc-rule { pointer-events: auto; display: flex; align-items: center; gap: 12px; min-height: 52px; padding: 6px 12px; box-sizing: border-box; text-align: left; border: 1.5px solid color-mix(in oklab, var(--sim-label) 45%, transparent); border-radius: var(--sim-radius-sm); background: var(--sim-bg-surface); color: var(--sim-label); font: 500 var(--sim-text-md)/1.25 var(--sim-font); cursor: pointer; }
.mc-box { flex: none; width: 20px; height: 20px; border: 2px solid var(--sim-label); border-radius: 4px; box-sizing: border-box; }
.mc-rule--on { border-color: var(--sim-annot); background: var(--sim-annot-tint); }
.mc-rule--on .mc-box { background: var(--sim-annot); border-color: var(--sim-annot); box-shadow: inset 0 0 0 3px var(--sim-bg-surface); }
.mc-check { display: flex; align-items: flex-start; gap: 12px; padding-top: 10px; border-top: 1px solid var(--sim-label); }
.mc-go { pointer-events: auto; flex: none; min-height: 48px; min-width: 96px; padding: 6px 18px; border: 0; border-radius: var(--sim-radius-sm); background: var(--sim-annot); color: var(--sim-bg-surface); font: 700 var(--sim-text-lg)/1 var(--sim-font); cursor: pointer; }
.mc-rule:focus-visible, .mc-go:focus-visible { outline: 2px solid var(--sim-annot); outline-offset: 2px; }
.mc-fbbox { position: absolute; }
.mc-brief--ok { border-left-color: var(--sim-good); }
.mc-brief--no { border-left-color: var(--sim-bad); }
.mc-brief--ok b:first-child { color: var(--sim-good); }
.mc-fb { display: block; font: 500 var(--sim-text-md)/1.35 var(--sim-font); color: var(--sim-label); }
.mc-fb b { font-weight: 700; }
.mc-fb--ok b:first-child { color: var(--sim-good); }
.sim-dom-root--portrait .mc-brief, .sim-dom-root--portrait .mc-lab, .sim-dom-root--portrait .mc-age, .sim-dom-root--portrait .mc-prompt, .sim-dom-root--portrait .mc-rule, .sim-dom-root--portrait .mc-fb, .sim-dom-root--portrait .mc-tl, .sim-dom-root--portrait .mc-end { font-size: 17px; }
.sim-dom-root--portrait .mc-rule { min-height: 48px; padding: 4px 10px; }
.sim-dom-root--portrait .mc-cnt b { font-size: 26px; }
.sim-dom-root--portrait .mc-brief { line-height: 1.3; }
.sim-dom-root--portrait .mc-over, .sim-dom-root--portrait .mc-prompt:not(.mc-prompt--done) { display: none; }
.sim-dom-root--portrait .mc-lab { flex-wrap: nowrap; white-space: nowrap; }
@media (prefers-reduced-motion: reduce) { .mc-tk { transition: none; } }
`;
  }
}
