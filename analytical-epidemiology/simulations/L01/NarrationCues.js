/**
 * NarrationCues - narration cue plumbing shared by the L01 scenes the narrated lesson drives
 * (HypothesisBuilderScene, DirectionOfInquiryScene). Course-local helper, not a scene.
 *
 * The engine (content-block narration contract, SimulationBase doc) fires onCue(id) once per beat at the
 * cue's word time, and, for a scene with static SEEKABLE = true, calls seek(beat, ms) at each beat start,
 * resume, scrub and about 8 times a second while the audio plays. A cue fires only once per beat, so a
 * replay of the same beat (back to its start) would leave the last cue's picture on screen. This mixin
 * keeps the scene consistent with the audio position instead:
 *   - each cue is logged with the beat time it arrived at (the last seek time seen);
 *   - when the time goes back (replay, scrub inside the beat) the scene drops its cue effects
 *     (cueReset(base)) and re-applies, in order, every logged cue at or before the new time;
 *   - as the time moves on again, logged cues are re-applied as their time comes round
 *     (the engine does not fire them a second time).
 * A new beat clears the log; the scene's own onStep restores that beat's start state as before.
 * Pause needs nothing: the picture stays where the audio stopped.
 *
 * Scene contract (all on the scene class):
 *   static CUES        array of the cue ids it understands; others are ignored
 *   applyCue(id, ms)   show the cue; ms = how long ago it was due (0 when live), so a sweep can start part-way
 *   cueBase()          optional: snapshot of the learner's state when the beat started (default null)
 *   cueReset(base)     drop all cue effects, back to that snapshot
 * Field names: all state in this._nc (never the base classes' reserved names).
 */

/** Seek steps back by more than this (ms) count as a jump back; smaller ones are timer jitter. */
const BACK_MS = 300;

export function withNarrationCues(Base) {
  return class NarrationCueScene extends Base {
    static SEEKABLE = true;

    _ncs() {
      if (!this._nc) this._nc = { beat: -1, log: [], applied: new Set(), lastMs: 0, base: null };
      return this._nc;
    }

    onCue(id) {
      if (!(this.constructor.CUES || []).includes(id)) return;
      const nc = this._ncs();
      if (!nc.log.some((c) => c.id === id)) nc.log.push({ id, ms: nc.lastMs });
      nc.applied.add(id);
      this.applyCue(id, 0);
    }

    seek(beat, ms) {
      const nc = this._ncs();
      const t = Number.isFinite(ms) ? ms : 0;
      if (beat !== nc.beat) {
        nc.beat = beat;
        nc.log = [];
        nc.applied = new Set();
        nc.lastMs = t;
        nc.base = this.cueBase?.() ?? null;
        return;
      }
      if (t < nc.lastMs - BACK_MS && nc.applied.size) {
        nc.applied = new Set();
        this.cueReset(nc.base);
      }
      nc.lastMs = t;
      for (const c of nc.log) {
        if (nc.applied.has(c.id) || c.ms > t) continue;
        nc.applied.add(c.id);
        this.applyCue(c.id, t - c.ms);
      }
    }

    /** Tells the narration that the learner did what the beat asked (await "interact"; spec D15). */
    interactDone(id) {
      const el = this.root || this.container;
      el?.dispatchEvent?.(new CustomEvent('scene-interact-done', { bubbles: true, composed: true, detail: { id } }));
    }
  };
}
