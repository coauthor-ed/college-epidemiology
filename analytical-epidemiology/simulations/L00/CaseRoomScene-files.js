/**
 * CaseRoomScene-files - les-00 prologue picture (view 'files'). Thin subclass of CaseRoom.js; see its header for
 * the data-narr ids. No cues, no learner action, no scene-interact-done.
 */
import { CaseRoomBase } from './CaseRoom.js';

export class CaseRoomSceneFiles extends CaseRoomBase {
  static VIEW = 'files';
  static ARIA_LABEL = 'The five case files of the course, one per lesson, each with the tool it teaches: thalidomide, a testable claim; DES and a rare cancer, a fair comparison group; smoking and lung cancer, the table and odds ratio; the pill and blood clots, bias; doctors and miners, following people forward to measure risk. A sixth folder is the live plastics plant case.';
}
