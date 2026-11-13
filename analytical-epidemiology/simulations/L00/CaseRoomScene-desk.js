/**
 * CaseRoomScene-desk - les-00 prologue picture (view 'desk'). Thin subclass of CaseRoom.js; see its header for
 * the data-narr ids. No cues, no learner action, no scene-interact-done.
 */
import { CaseRoomBase } from './CaseRoom.js';

export class CaseRoomSceneDesk extends CaseRoomBase {
  static VIEW = 'desk';
  static ARIA_LABEL = 'The prologue desk: two name cards, you as a new investigator and the senior investigator as your mentor; a stack of five closed files, real studies; and one open live case, the plastics plant, invented for practice.';
}
