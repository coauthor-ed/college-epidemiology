/**
 * InquiryStagesScene - analytical-epidemiology L01 s02 (Fig 1.2, "The 1961 file at each stage"). Replaces the
 * engine steps figure, which sat in a side column and left half the stage empty when narrated (owner, Q-90).
 * Three stage cards on one rail, each with a small picture and the 1961 file's own entry slip:
 *   1 Size of the problem  count cases by time, place and person   bars, the last year jumps
 *   2 Pattern and clues    where and when the cases fall            a 1958-1961 line: the drug on sale, cases after
 *   3 Hypothesis           size and clue put together as a claim    the claim slip: thalidomide -> malformed births?
 * Under the rail a band: descriptive study (stages 1-2) hands over at the hypothesis to the analytical study.
 * Beat-synced (one step per beat): beat 0 fills stage 1, beat 1 stage 2, beat 2 stage 3 and the band. A stage not
 * yet reached stands as its frame (number and title) with an empty dashed slip, so the rail reads from the start.
 * Narration focus (data-narr, no cue code): size, clues (whole cards), s3 (stage 3 frame), hyp (stage 3 filling),
 * after (the analytical band). Script cues: b1 focus.size; b2 focus.clues; b3 focus.size+clues, show.hyp, show.after.
 * No learner action, no scene-interact-done.
 */
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { na } from '../L03/NarrTags.js';

const STAGES = [
  { id: 'size', title: 'Size of the problem', how: 'Count cases by time, place and person.', entry: 'Many more malformed births than before' },
  { id: 'clues', title: 'Pattern and clues', how: 'Look at where and when the cases fall.', entry: 'A new sleeping drug, on sale since 1958' },
  { id: 'hyp', title: 'Hypothesis', how: 'Put the size and the clue together as a claim.', entry: 'Thalidomide might be the cause' },
];

// Malformed births, an illustrative shape only (no counts are claimed): flat, then the 1961 jump.
const BARS = [{ y: '58', h: 0.16 }, { y: '59', h: 0.18 }, { y: '60', h: 0.3 }, { y: '61', h: 0.92 }];
// Cases on the 1958-1961 line (x 0..1): none before the drug, then more each year.
const DOTS = [0.42, 0.5, 0.56, 0.6, 0.66, 0.7, 0.73, 0.77, 0.8, 0.83, 0.86, 0.88, 0.91, 0.93, 0.95, 0.97];

function picSize() {
  const w = 160, h = 92, bw = 26, gap = 12, x0 = (w - (4 * bw + 3 * gap)) / 2, base = 74;
  let s = `<line class="is-axis" x1="6" y1="${base}" x2="${w - 6}" y2="${base}"/>`;
  BARS.forEach((b, i) => {
    const x = x0 + i * (bw + gap), bh = Math.round(b.h * 62);
    s += `<rect class="is-bar${i === 3 ? ' is-bar--hot' : ''}" style="--d:${i * 90}ms" x="${x}" y="${base - bh}" width="${bw}" height="${bh}" rx="2"/>`
      + `<text class="is-tick" x="${x + bw / 2}" y="${base + 15}">'${b.y}</text>`;
  });
  return `<svg class="is-pic" viewBox="0 0 ${w} ${h}" aria-hidden="true">${s}</svg>`;
}

function picClues() {
  const w = 160, h = 92, L = 12, R = w - 12, y = 58;
  const X = (t) => L + t * (R - L);
  let s = `<line class="is-axis" x1="${L}" y1="${y}" x2="${R}" y2="${y}"/>`;
  ['58', '59', '60', '61'].forEach((t, i) => { const x = X(i / 3); s += `<line class="is-axis" x1="${x}" y1="${y - 3}" x2="${x}" y2="${y + 3}"/><text class="is-tick" x="${x}" y="${y + 17}">'${t}</text>`; });
  // the drug goes on sale: a capsule on the line, and a rule along the years it was sold
  s += `<rect class="is-sold" x="${X(0)}" y="${y - 30}" width="${X(1) - X(0)}" height="4" rx="2"/>`;
  s += `<g class="is-cap" transform="translate(${X(0) + 2} ${y - 28}) rotate(-30)"><rect x="-11" y="-5" width="22" height="10" rx="5"/><rect class="is-cap-half" x="0" y="-5" width="11" height="10" rx="0"/><rect x="-11" y="-5" width="22" height="10" rx="5" class="is-cap-rim"/></g>`;
  DOTS.forEach((t, i) => { const row = i % 3; s += `<circle class="is-dot" style="--d:${120 + i * 45}ms" cx="${X(t).toFixed(1)}" cy="${y - 8 - row * 7}" r="3"/>`; });
  return `<svg class="is-pic" viewBox="0 0 ${w} ${h}" aria-hidden="true">${s}</svg>`;
}

function picHyp() {
  return `<div class="is-claim"><span class="is-chip">Thalidomide</span><span class="is-arrow" aria-hidden="true"><svg viewBox="0 0 40 14"><path d="M2 7h32M28 2l6 5-6 5"/></svg><b>?</b></span><span class="is-chip is-chip--out">Malformed births</span></div>`;
}

const PICS = [picSize, picClues, picHyp];
const MAP = [0, 1, 2].map((i) => [{ idx: i, dwellMs: null }]);

export class InquiryStagesScene extends SvgScene {
  static WIDTH = 680;
  static HEIGHT = 440;
  static PORTRAIT_WIDTH = 380;
  static PORTRAIT_HEIGHT = 700;
  static MIN_SCALE = 0.85;
  static SETTING = 'none';
  static CONTROLS = [];
  static BEAT_STEP_MAP = MAP;
  static ARIA_LABEL = 'The 1961 file at each stage. Stage 1, size of the problem: count cases by time, place and person; in 1961, many more malformed births than before, the last bar jumps. Stage 2, pattern and clues: look at where and when the cases fall; a new sleeping drug, thalidomide, on sale since 1958, and the cases come after it. Stage 3, hypothesis: put the size and the clue together as a claim; thalidomide might be the cause. Underneath, the descriptive study ends at the hypothesis, and the analytical study starts there and tests it.';

  stageHeight(st) { return st.portrait ? 640 : 400; }

  enter(step) {
    // A forward step plays its fill once; a jump back or a cold landing shows it at rest.
    this.isFresh = this.isLast === step - 1 ? step : -1;
    this.isLast = step;
  }

  card(i, s) {
    const g = STAGES[i], on = i <= s, fresh = this.isFresh === i;
    const tag = i === 2 ? na('s3') : na(g.id);
    const fillTag = i === 2 ? na('hyp') : '';
    const body = on
      ? `<div class="is-fill${fresh ? ' is-fill--in' : ''}"${fillTag}><div class="is-well">${PICS[i]()}</div>`
        + `<p class="is-slip"><small>In 1961</small>${g.entry}</p></div>`
      : `<div class="is-fill is-fill--empty"><div class="is-well is-well--empty"><span>?</span></div><p class="is-slip is-slip--empty"><small>In 1961</small><i></i><i></i></p></div>`;
    return `<section class="is-card${on ? ' is-card--on' : ''}${i === s ? ' is-card--now' : ''}"${tag}>`
      + `<header class="is-hd"><span class="is-num">${i + 1}</span><span class="is-ttl"><b>${g.title}</b><span class="is-how">${g.how}</span></span></header>`
      + body + '</section>';
  }

  paint(st) {
    const s = this.stepIndex ?? 0, P = st.portrait;
    const arrow = '<span class="is-go" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12h13M13 6l6 6-6 6"/></svg></span>';
    const rail = `<div class="is-rail">${this.card(0, s)}${arrow}${this.card(1, s)}${arrow}${this.card(2, s)}</div>`;
    const band = s >= 2
      ? `<div class="is-band${this.isFresh === 2 ? ' is-band--in' : ''}"><span class="is-desc">Descriptive study<small>ends at the hypothesis</small></span>`
        + `<span class="is-ana"${na('after')}><b>Analytical study</b><small>starts here and tests it</small></span></div>`
      : `<div class="is-band is-band--wait"><span class="is-desc">Descriptive study<small>size, then clues</small></span><span class="is-ana is-ana--wait"><b>Analytical study</b><small>not yet</small></span></div>`;
    return { svg: '', over: `<div class="is${P ? ' is--p' : ''}" data-step="${s}">${rail}${band}</div>` };
  }

  css() {
    return `
.sv-over .is { position: absolute; inset: 0; display: flex; flex-direction: column; justify-content: center; gap: 16px; padding: 4px 2px; box-sizing: border-box; font-family: var(--sim-font); color: var(--sim-label); }
.is-rail { display: grid; grid-template-columns: minmax(0, 1fr) 26px minmax(0, 1fr) 26px minmax(0, 1fr); align-items: stretch; }
.is--p .is-rail { grid-template-columns: 1fr; grid-auto-rows: auto; gap: 0; }
.is-go { display: flex; align-items: center; justify-content: center; color: var(--sim-label-muted); }
.is-go svg { width: 22px; height: 22px; fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.is--p .is-go { height: 20px; }
.is--p .is-go svg { transform: rotate(90deg); width: 18px; height: 18px; }
.is-card { display: flex; flex-direction: column; gap: 10px; padding: 12px 12px 12px; background: var(--sim-bg-surface); border: 1px solid var(--sim-border); border-top: 3px solid var(--sim-border); transition: border-color 240ms ease-out; min-width: 0; }
.is-card--on { border-top-color: var(--sim-annot); }
.is--p .is-card { display: grid; grid-template-columns: 128px 1fr; grid-template-areas: "hd hd" "well slip"; gap: 6px 12px; padding: 10px 12px; }
.is--p .is-hd { grid-area: hd; }
.is--p .is-fill { display: contents; }
.is--p .is-well { grid-area: well; }
.is--p .is-slip { grid-area: slip; align-self: center; }
.is-hd { display: flex; gap: 10px; align-items: flex-start; }
.is-num { font: 400 30px/0.95 var(--sim-font-numeral); color: var(--sim-label-muted); min-width: 18px; }
.is-card--on .is-num { color: var(--sim-annot); }
.is-ttl { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
.is-ttl b { font: 700 17px/1.2 var(--sim-font); color: var(--sim-label); }
.is-how { font: 500 14px/1.3 var(--sim-font); color: var(--sim-label-muted); }
.is-fill { display: flex; flex-direction: column; gap: 10px; flex: 1; }
.is-well { display: flex; align-items: center; justify-content: center; height: 98px; background: var(--sim-set-paper); border: 1px solid var(--sim-set-folder-edge); }
.is--p .is-well { height: 84px; }
.is-well--empty { border-style: dashed; background: transparent; }
.is-well--empty span { font: 400 28px/1 var(--sim-font-numeral); color: var(--sim-border); }
.is-pic { width: 100%; max-width: 168px; height: 100%; overflow: visible; }
.is-axis { stroke: var(--sim-label-muted); stroke-width: 1.2; fill: none; }
.is-tick { font: 600 12px var(--sim-font); fill: var(--sim-label-muted); text-anchor: middle; }
.is-bar { fill: color-mix(in srgb, var(--sim-label-muted) 45%, transparent); transform-box: fill-box; transform-origin: 50% 100%; }
.is-bar--hot { fill: var(--sim-annot); }
.is-sold { fill: var(--sim-annot-tint); stroke: var(--sim-annot); stroke-width: 0.8; }
.is-cap rect { fill: var(--sim-bg-surface); stroke: var(--sim-annot); stroke-width: 1.4; }
.is-cap .is-cap-half { fill: var(--sim-annot); stroke: none; }
.is-cap .is-cap-rim { fill: none; }
.is-dot { fill: var(--sim-label); transform-box: fill-box; transform-origin: center; }
.is-claim { display: flex; flex-direction: column; align-items: center; gap: 2px; }
.is-chip { padding: 3px 10px; font: 700 14px/1.25 var(--sim-font); color: var(--sim-label); background: var(--sim-annot-tint); border: 1px solid var(--sim-annot); border-radius: 4px; }
.is-chip--out { background: var(--sim-bg-surface); border-color: var(--sim-label-muted); }
.is-arrow { display: flex; align-items: center; gap: 4px; color: var(--sim-annot); }
.is-arrow svg { width: 34px; height: 14px; transform: rotate(90deg); fill: none; stroke: currentColor; stroke-width: 2; stroke-linecap: round; stroke-linejoin: round; }
.is-arrow b { font: 700 18px/1 var(--sim-font-numeral); }
.is-slip { position: relative; margin: 0; padding: 8px 10px 9px; background: var(--sim-set-paper); border: 1px solid var(--sim-set-folder-edge); border-left: 4px solid var(--sim-set-folder); font: 600 15px/1.3 var(--sim-font); color: var(--sim-label); min-height: 58px; box-sizing: border-box; }
.is-slip small { display: block; margin-bottom: 2px; font: 700 12px/1.2 var(--sim-font); letter-spacing: 0.08em; text-transform: uppercase; color: var(--sim-annot); }
.is-slip--empty { background: transparent; border-style: dashed; border-left-style: solid; border-left-color: var(--sim-border); }
.is-slip--empty small { color: var(--sim-label-muted); }
.is-slip--empty i { display: block; height: 6px; margin-top: 7px; width: 82%; background: color-mix(in srgb, var(--sim-label-muted) 18%, transparent); }
.is-slip--empty i + i { width: 56%; }
.is-band { display: grid; grid-template-columns: 2fr 1fr; align-items: stretch; border-top: 1px solid var(--sim-label-muted); }
.is--p .is-band { grid-template-columns: 1fr 1fr; }
.is-band > span { display: flex; flex-direction: column; gap: 1px; padding: 8px 12px; font: 700 15px/1.2 var(--sim-font); }
.is-band small { font: 500 13px/1.25 var(--sim-font); color: var(--sim-label-muted); }
.is-desc { color: var(--sim-label-muted); border-right: 2px solid var(--sim-annot); text-align: right; }
.is-ana { color: var(--sim-label); background: var(--sim-annot-tint); }
.is-ana b { color: var(--sim-annot); }
.is-ana--wait { background: transparent; }
.is-ana--wait b { color: var(--sim-label-muted); }
.is-band--wait .is-desc { border-right-color: var(--sim-border); }
.is-fill--in .is-slip { animation: is-rise 420ms ease-out both 360ms; }
.is-fill--in .is-well { animation: is-fade 260ms ease-out both; }
.is-fill--in .is-bar { animation: is-grow 520ms cubic-bezier(.3,.7,.3,1) both; animation-delay: calc(140ms + var(--d)); }
.is-fill--in .is-dot { animation: is-pop 260ms ease-out both; animation-delay: var(--d); }
.is-fill--in .is-claim > * { animation: is-rise 360ms ease-out both; }
.is-fill--in .is-claim > :nth-child(2) { animation-delay: 220ms; }
.is-fill--in .is-claim > :nth-child(3) { animation-delay: 440ms; }
.is-band--in .is-ana { animation: is-wipe 520ms ease-out both 300ms; }
@keyframes is-fade { from { opacity: 0; } to { opacity: 1; } }
@keyframes is-rise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: none; } }
@keyframes is-grow { from { transform: scaleY(0); } to { transform: scaleY(1); } }
@keyframes is-pop { from { opacity: 0; transform: scale(0.2); } to { opacity: 1; transform: scale(1); } }
@keyframes is-wipe { from { opacity: 0; clip-path: inset(0 100% 0 0); } to { opacity: 1; clip-path: inset(0 0 0 0); } }
@media (prefers-reduced-motion: reduce) { .is-fill--in *, .is-band--in * { animation: none !important; } }
`;
  }
}
