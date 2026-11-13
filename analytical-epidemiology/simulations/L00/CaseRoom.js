/**
 * CaseRoom - the prologue's three calm pictures (les-00). Course-local base, not a scene: the thin files
 * CaseRoomScene-desk.js, -files.js and -method.js each pick one VIEW. Plain HTML cards on the SvgScene overlay,
 * casefile look (manila folders from the --sim-set-folder tokens). Nothing moves and nothing is tapped: the
 * pictures only carry narration focus tags (narration.md sec 8, 8a), so the scene has no cues and no signal.
 *   desk    data-narr: you, senior (two name cards), files (the stack of five closed files), live (the live case)
 *   files   data-narr: f1..f5 (one folder per lesson), live
 *   method  data-narr: claim, design, table, ratio, bias, verdict (the six steps), real, invented (two tags)
 * Narrated, s01 b1-b2 open on the owner image media/01-desk.jpg (block narrationCover); this scene takes over at show.live.
 */
import { SvgScene } from 'simulations/base/kit/SimSvg.js';
import { na } from '../L03/NarrTags.js';

const FILES = [
  { id: 'f1', no: 'File 1', name: 'Thalidomide', tool: 'a hunch becomes a testable claim' },
  { id: 'f2', no: 'File 2', name: 'DES and a rare cancer', tool: 'a fair group to compare with' },
  { id: 'f3', no: 'File 3', name: 'Smoking and lung cancer', tool: 'the table and its odds ratio' },
  { id: 'f4', no: 'File 4', name: 'The pill and blood clots', tool: 'bias can build a large ratio' },
  { id: 'f5', no: 'File 5', name: 'Doctors and miners', tool: 'follow people forward: the risk' },
];
const STEPS = [
  { id: 'claim', name: 'Claim', what: 'who, what, how much, how long' },
  { id: 'design', name: 'Study design', what: 'a study that can test it' },
  { id: 'table', name: 'Table', what: 'the counts, two by two' },
  { id: 'ratio', name: 'Ratio', what: 'how strongly they go together' },
  { id: 'bias', name: 'Bias', what: 'could the study have made it?' },
  { id: 'verdict', name: 'Verdict', what: 'your answer on the claim' },
];

const folder = (id, no, name, line, live = false) => `<div class="cr-folder${live ? ' cr-folder--live' : ''}"${na(id)}>`
  + `<span class="cr-tab">${no}</span><b class="cr-name">${name}</b><span class="cr-line">${line}</span></div>`;
const LIVE = (line) => folder('live', 'Live case', 'The plastics plant', line, true);

export class CaseRoomBase extends SvgScene {
  static CONTROLS = [];
  static SETTING = 'none';
  static VIEW = 'desk';

  stageHeight(st) {
    const v = this.constructor.VIEW;
    if (v === 'desk') return st.portrait ? 430 : 420;
    if (v === 'files') return st.portrait ? 470 : 470;
    return st.portrait ? 500 : 440;
  }

  paint(st) {
    const v = this.constructor.VIEW;
    let body = '';
    if (v === 'desk') {
      body = `<div class="cr-people">`
        + `<div class="cr-person"${na('you')}><span class="cr-kick">You</span><b class="cr-name">New investigator</b><span class="cr-line">learns the tools, works the live case</span></div>`
        + `<div class="cr-person"${na('senior')}><span class="cr-kick">Senior investigator</span><b class="cr-name">Your mentor</b><span class="cr-line">hands over the files, writes short notes</span></div>`
        + `</div><div class="cr-desk">`
        + `<div class="cr-stack"${na('files')}><i></i><i></i><i></i><i></i>${folder('', 'Closed files', 'Five old cases', 'real studies, already solved')}</div>`
        + LIVE('invented for practice, still open')
        + `</div>`;
    } else if (v === 'files') {
      body = `<div class="cr-grid">${FILES.map((f) => folder(f.id, f.no, f.name, f.tool)).join('')}${LIVE('each tool is used here next')}</div>`;
    } else {
      body = `<ol class="cr-steps">${STEPS.map((s, i) => `<li class="cr-step"${na(s.id)}><span class="cr-num">${i + 1}</span><b class="cr-name">${s.name}</b><span class="cr-line">${s.what}</span></li>`).join('')}</ol>`
        + `<div class="cr-tags"><span class="cr-tag"${na('real')}><b>Old files</b> real studies, published numbers</span>`
        + `<span class="cr-tag cr-tag--inv"${na('invented')}><b>Plastics plant</b> invented for practice</span></div>`;
    }
    return { svg: '', over: `<div class="cr cr--${v}${st.portrait ? ' cr--p' : ''}">${body}</div>` };
  }

  css() {
    return `
.sv-over .cr { position: absolute; inset: 0; display: flex; flex-direction: column; gap: 18px; justify-content: center; padding: 8px 4px; box-sizing: border-box; font-family: var(--sim-font); color: var(--sim-label); }
.cr-name { display: block; font: 700 18px/1.2 var(--sim-font); color: var(--sim-label); }
.cr-line { display: block; font: 500 16px/1.3 var(--sim-font); color: var(--sim-label-muted); }
.cr-kick, .cr-tab { font: 700 16px/1.2 var(--sim-font-mono, monospace); letter-spacing: 0.08em; text-transform: uppercase; color: var(--sim-annot); }
.cr-people { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.cr--p .cr-people { grid-template-columns: 1fr; gap: 10px; }
.cr-person { display: flex; flex-direction: column; gap: 4px; padding: 12px 16px; background: var(--sim-bg-surface); border: 1px solid var(--sim-border); border-left: 4px solid var(--sim-annot); }
.cr-desk { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; align-items: end; }
.cr--p .cr-desk { grid-template-columns: 1fr; gap: 12px; }
.cr-stack { position: relative; padding-top: 16px; }
.cr-stack > i { position: absolute; left: 0; right: 0; height: 40px; background: var(--sim-set-folder); border: 1px solid var(--sim-set-folder-edge); }
.cr-stack > i:nth-child(1) { top: 0; left: 16px; right: -16px; }
.cr-stack > i:nth-child(2) { top: 4px; left: 12px; right: -12px; }
.cr-stack > i:nth-child(3) { top: 8px; left: 8px; right: -8px; }
.cr-stack > i:nth-child(4) { top: 12px; left: 4px; right: -4px; }
.cr-stack .cr-folder { position: relative; }
.cr-folder { position: relative; display: flex; flex-direction: column; gap: 3px; padding: 10px 14px 12px; background: var(--sim-set-paper); border: 1px solid var(--sim-set-folder-edge); border-top: 6px solid var(--sim-set-folder); }
.cr-folder .cr-tab { align-self: flex-start; margin: -10px 0 4px -14px; padding: 2px 10px; background: var(--sim-set-folder); color: var(--sim-label); font-size: 16px; }
.cr-folder--live { border-top-color: var(--sim-annot); }
.cr-folder--live .cr-tab { background: var(--sim-annot); color: var(--sim-ink-on-annot, var(--sim-bg-deep)); }
.cr-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 14px; }
.cr--p .cr-grid { grid-template-columns: 1fr 1fr; gap: 8px; }
.cr--p .cr-grid .cr-folder { padding: 8px 12px 8px; gap: 1px; }
.sv-over .cr--p { justify-content: flex-start; gap: 12px; padding-top: 4px; }
.cr--p .cr-step { padding: 8px 10px; }
.cr-steps { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; counter-reset: none; }
.cr--p .cr-steps { grid-template-columns: 1fr 1fr; gap: 10px; }
.cr-step { display: flex; flex-direction: column; gap: 3px; padding: 10px 12px; background: var(--sim-bg-surface); border: 1px solid var(--sim-border); }
.cr-num { font: 400 28px/1 var(--sim-font-numeral); color: var(--sim-annot); }
.cr-tags { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.cr--p .cr-tags { grid-template-columns: 1fr; gap: 8px; }
.cr-tag { padding: 10px 14px; font: 500 16px/1.3 var(--sim-font); color: var(--sim-label); background: var(--sim-annot-tint); border: 1px solid var(--sim-annot); }
.cr-tag--inv { background: var(--sim-bg-surface); border-style: dashed; }
.cr-tag b { display: block; font-weight: 700; }
`;
  }
}
