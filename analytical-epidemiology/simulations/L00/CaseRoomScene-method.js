/**
 * CaseRoomScene-method - les-00 prologue picture (view 'method'). Thin subclass of CaseRoom.js; see its header for
 * the data-narr ids. No cues, no learner action, no scene-interact-done.
 */
import { CaseRoomBase } from './CaseRoom.js';

export class CaseRoomSceneMethod extends CaseRoomBase {
  static VIEW = 'method';
  static ARIA_LABEL = 'Six steps used on every file: claim, study design, table, ratio, bias, verdict. Two tags: the old files are real studies with published numbers; the plastics plant case is invented for practice.';
}
