/**
 * HypothesisBoard - the claim panel shared by L01 s04 (HypothesisBuilderScene) and L01 s07
 * (HypothesisBuilderScene-plant). Rebuilt 2026-11-05 on the editorial panel parts (kit/SimPanel.js):
 * no card, no tray, no title pill. Top: a kicker, the count of parts and the claim as one large sentence
 * (each chosen part underlined in the signature colour, the newest one on a highlighter band). Under it a
 * prompt line, then one ruled row per part of a testable claim.
 *   MODE 'toggle' (s04): each row is a chip (part name over its words) beside the data it calls for; a tap
 *     adds the part to the claim or takes it back out. A part taken out leaves its data line struck: no
 *     longer measured.
 *   MODE 'choose' (s07): one part is open at a time. The open row is a tinted panel with two wording cards
 *     (radio ring, seeded left/right order); a decided row is one flat line with its record under it, a tick
 *     (a record can confirm it) or a cross ("cannot be measured"). Choosing opens the next undecided part.
 * Scene-applied mixin: class X extends withHypothesisBoard(withBeats(DomSimulation)). Data statics only:
 *   PARTS  [{ id, name, ask, field?, record?, options?: [{ key, label, record?, vague? }] }]
 *   MODE   'toggle' | 'choose'
 *   CASE   { kicker, count, caption? }
 *   STEPS  [{ start: { id: true | key }, live, ring: [ids], open?, prompt, promptLive? }]  one per beat
 *   compose(sel) -> [{ part, text } | { text } | { gap: id }]
 *   SEED   option-order seed (choose mode)
 * Colour: one meaning colour (--sim-annot) for the parts in the claim; verdicts --sim-good / --sim-bad,
 * always with a tick or a cross. No series tokens.
 */
import { esc } from 'simulations/base/SimUi.js';
import { SIM_PANEL_CSS, promptHtml, bindPanel } from 'simulations/base/kit/SimPanel.js';
import { mulberry32 } from 'simulations/base/kit/SimLook.js';

const TICK = '<svg class="cp-ic" viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8.5l3.2 3.2L13 4.8"/></svg>';
const CROSS = '<svg class="cp-ic" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 4l8 8M12 4l-8 8"/></svg>';

const CSS = SIM_PANEL_CSS + `
.cp { gap: 10px; }
.cp-head { display: flex; align-items: baseline; justify-content: space-between; gap: var(--sim-space-3); }
.cp-count { margin: 0; font-size: var(--sim-text-sm); color: var(--sim-label-muted); white-space: nowrap; font-variant-numeric: tabular-nums; }
.cp-count b { font-size: var(--sim-text-lg); color: var(--sim-annot); }
.cp-claim { margin: 0; padding: 2px 0 2px var(--sim-space-4); border-left: 3px solid var(--sim-annot);
  font-size: 17px; font-weight: 600; line-height: 1.5; color: var(--sim-label); }
.cp-frag { text-decoration: underline 2px color-mix(in oklab, var(--sim-annot) 70%, transparent); text-underline-offset: 0.24em; }
.cp-ic { width: 1em; height: 1em; vertical-align: -0.12em; fill: none; stroke: currentColor; stroke-width: 2.4; stroke-linecap: round; stroke-linejoin: round; }
.cp-frag.is-new { background: linear-gradient(transparent 12%, var(--sim-annot-tint) 12%, var(--sim-annot-tint) 96%, transparent 96%); }
.cp-frag.is-vague { color: var(--sim-label-muted); text-decoration: underline 2px wavy var(--sim-bad); }
.cp-gap { color: var(--sim-label-muted); font-weight: 400; font-style: italic; }
.cp-cap { margin: -6px 0 0; padding-left: calc(var(--sim-space-4) + 3px); }
.cp-rows { margin: 0; padding: 0; list-style: none; border-top: 1px solid var(--sim-label); }
.cp-colhead { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); gap: var(--sim-space-4); padding: 0 0 4px;
  font-size: var(--sim-text-sm); font-weight: 700; color: var(--sim-label-muted); border-bottom: 1px solid color-mix(in oklab, var(--sim-stroke) 45%, transparent); }
.cp-colhead--choose { grid-template-columns: 9.2em minmax(0, 1fr); padding-left: 6px; }
.cp-row { display: grid; grid-template-columns: minmax(0, 1.05fr) minmax(0, 1fr); align-items: center; gap: var(--sim-space-4);
  padding: 5px 0; border-bottom: 1px solid color-mix(in oklab, var(--sim-stroke) 45%, transparent); }
.cp-chip { width: 100%; flex-direction: row; align-items: center; }
.cp-chip__t { display: flex; flex-wrap: wrap; align-items: baseline; gap: 0 8px; min-width: 0; }
.cp-lab { font-size: 14px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--sim-label-muted); }
.spn-act[aria-pressed="true"] .cp-lab { color: var(--sim-annot); }
.cp-words { font-size: var(--sim-text-md); font-weight: 600; color: var(--sim-label); }
.cp-ask { font-weight: 400; font-style: italic; color: var(--sim-label-muted); }
.cp-ring { box-shadow: 0 0 0 2px var(--sim-bg-deep), 0 0 0 4px var(--sim-annot); }
.cp-rec { margin: 0; font-size: var(--sim-text-md); line-height: 1.35; color: var(--sim-label); }
.cp-rec--none { color: var(--sim-label-muted); }
.cp-rec--gone { color: var(--sim-label-muted); }
.cp-rec--gone s { text-decoration: line-through 2px var(--sim-bad); }
.cp-rec small { display: inline; margin-left: 8px; white-space: nowrap; font-size: var(--sim-text-sm); color: var(--sim-bad); font-weight: 700; }
.cp-rec.is-new { animation: spn-rise 0.24s ease-out both; }
/* choose mode */
.cp-line { display: grid; grid-template-columns: 9.2em minmax(0, 1fr) auto; align-items: center; gap: 2px var(--sim-space-3); width: 100%; margin: 0;
  padding: 6px 6px; border: 0; border-radius: var(--sim-radius-sm); background: transparent; text-align: left; cursor: pointer; color: var(--sim-label); }
.cp-line:hover:not(:disabled) { background: color-mix(in oklab, var(--sim-annot-tint) 45%, transparent); }
.cp-line:focus-visible { outline: 2px solid var(--sim-annot); outline-offset: 2px; }
.cp-line:disabled { cursor: default; }
.cp-line .cp-sub { font-size: var(--sim-text-md); color: var(--sim-label); }
.cp-line .cp-sub--bad { color: var(--sim-bad); font-weight: 700; }
.cp-line .cp-sub--wait { color: var(--sim-label-muted); font-style: italic; }
.cp-mark { font-size: var(--sim-text-lg); font-weight: 700; line-height: 1; }
.cp-mark--ok { color: var(--sim-good); }
.cp-mark--bad { color: var(--sim-bad); }
.cp-mark--open { color: var(--sim-label-muted); font-size: var(--sim-text-sm); font-weight: 600; }
.cp-row--choose { display: block; padding: 2px 0; }
.cp-row--open { padding: 8px 12px 10px; margin: 4px 0; border-bottom: 0; border-left: 3px solid var(--sim-annot); background: color-mix(in oklab, var(--sim-annot-tint) 60%, transparent); }
.cp-open-head { display: flex; align-items: baseline; justify-content: space-between; gap: var(--sim-space-3); margin-bottom: 6px; }
.cp-open-head .cp-lab { color: var(--sim-annot); }
.cp-open-head span:last-child { font-size: var(--sim-text-sm); color: var(--sim-label-muted); }
.cp-opts { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: var(--sim-space-3); }
.cp-opt { width: 100%; min-height: 46px; font-size: var(--sim-text-md); font-weight: 600; }
.cp-opt-rec { margin: 6px 0 0; font-size: var(--sim-text-sm); color: var(--sim-label); }
.cp-opt-rec b { font-weight: 700; }
.cp-opt-rec--bad b { color: var(--sim-bad); }
.cp-opt-rec--ok b { color: var(--sim-good); }
/* narration cue (spec D15): the part being named is lit, the others step back */
.cp-row { transition: opacity 0.3s ease, background-color 0.3s ease, box-shadow 0.3s ease; }
.cp--cued .cp-row:not(.cp-row--cue) { opacity: 0.62; }
.cp-row--cue .spn-act:disabled { opacity: 1; border-color: var(--sim-annot); background: var(--sim-bg-surface); }
.cp-row--cue { background: color-mix(in oklab, var(--sim-annot-tint) 70%, transparent); box-shadow: inset 3px 0 0 var(--sim-annot); }
.cp-row--cue .cp-chip { padding-left: var(--sim-space-3); }
.cp-row--cue .cp-lab { color: var(--sim-annot); }
.cp-frag.is-cue { background: linear-gradient(transparent 12%, var(--sim-annot-tint) 12%, var(--sim-annot-tint) 96%, transparent 96%); text-decoration-color: var(--sim-annot); }
.sim-dom-root--portrait .cp-row { grid-template-columns: minmax(0, 1fr); gap: 4px; padding: 8px 0; }
.sim-dom-root--portrait .cp-colhead { display: none; }
.sim-dom-root--portrait .cp-rec { padding-left: 4px; font-size: var(--sim-text-sm); }
.sim-dom-root--portrait .cp-opts { grid-template-columns: minmax(0, 1fr); }
.sim-dom-root--portrait .cp-line { grid-template-columns: minmax(0, 1fr) auto; }
.sim-dom-root--portrait .cp-line .cp-lab, .sim-dom-root--portrait .cp-line .cp-sub { grid-column: 1; }
.sim-dom-root--portrait .cp-mark { grid-row: 1 / span 2; grid-column: 2; }
`;

/** Seeded left/right order of each part's two options (choose mode), fixed per mount. */
function optionOrder(parts, seed) {
  const rnd = mulberry32(seed);
  const out = {};
  for (const p of parts) if (p.options) out[p.id] = rnd() < 0.5 ? [...p.options] : [...p.options].reverse();
  return out;
}

export function withHypothesisBoard(Base) {
  return class HypothesisBoardScene extends Base {
    static LAYOUT = 'fit';
    static SETTING = 'none';

    async setup() {
      const C = this.constructor;
      this._parts = C.PARTS;
      this._mode = C.MODE === 'choose' ? 'choose' : 'toggle';
      this._order = optionOrder(this._parts, C.SEED ?? 7);
      this._hb = { sel: {}, gone: new Set(), live: false, ring: [], open: null, fresh: null, touched: false, cue: null };
      await super.setup();
      this.render({ css: CSS, rootClass: 'spn-page', html: '' });
      bindPanel(this.root, { action: (name, v) => this._act(name, v) });
      this._paint();
    }

    // withBeats calls this on every beat; the beat's start state is fixed (a resumed lesson may land here).
    onStep(step) {
      const st = (this.constructor.STEPS || [])[step] || {};
      const hb = this._hb;
      hb.sel = {};
      for (const p of this._parts) hb.sel[p.id] = st.start?.[p.id] ?? (this._mode === 'choose' ? null : false);
      hb.gone = new Set();
      hb.live = !!st.live;
      hb.ring = st.ring || [];
      hb.fresh = null;
      hb.touched = false;
      hb.cue = null;
      hb.open = this._mode === 'choose' ? (st.open ?? (hb.live ? this._nextUndecided() : null)) : null;
      this._paint();
    }

    _nextUndecided(after) {
      const ids = this._parts.map((p) => p.id);
      const start = after ? ids.indexOf(after) + 1 : 0;
      for (let k = 0; k < ids.length; k++) {
        const id = ids[(start + k) % ids.length];
        if (!this._hb.sel[id]) return id;
      }
      return null;
    }

    _act(name, v) {
      const hb = this._hb;
      if (!hb.live) return;
      if (name === 'part' && this._mode === 'toggle') this.setPart(v, !hb.sel[v]);
      else if (name === 'open' && this._mode === 'choose') { hb.open = hb.open === v ? null : v; this._paint(); }
      else if (name === 'opt' && this._mode === 'choose') {
        const [id, key] = String(v).split(':');
        this.setPart(id, key);
      }
    }

    /** Toggle mode: value true / false. Choose mode: an option key. */
    setPart(id, value) {
      const hb = this._hb;
      if (!this._parts.some((p) => p.id === id)) return;
      hb.touched = true;
      if (this._mode === 'toggle') {
        hb.sel[id] = !!value;
        if (value) hb.gone.delete(id); else hb.gone.add(id);
        hb.fresh = value ? id : null;
      } else {
        const had = hb.sel[id];
        hb.sel[id] = value;
        hb.fresh = id;
        if (!had) hb.open = this._nextUndecided(id) ?? id;
      }
      hb.ring = hb.ring.filter((r) => r !== id);
      this._paint();
    }

    /** Narration cue: light one part's row and its words in the claim (null clears). */
    cuePart(id) {
      const hb = this._hb;
      if (!hb) return;
      const next = this._parts.some((p) => p.id === id) ? id : null;
      if (hb.cue === next) return;
      hb.cue = next;
      this._paint();
    }

    optionOf(id) {
      const p = this._parts.find((x) => x.id === id);
      const key = this._hb.sel[id];
      return p?.options?.find((o) => o.key === key) ?? null;
    }

    /** One entry per part in the claim: its record, or null when vague. */
    dataLines() {
      return this._parts.filter((p) => this._hb.sel[p.id]).map((p) => (this._mode === 'choose' ? (this.optionOf(p.id)?.vague ? null : this.optionOf(p.id)?.record) : p.record));
    }

    measured() { return this.dataLines().filter(Boolean).length; }

    claimText() {
      return this.constructor.compose(this._hb.sel).map((s) => s.text ?? `[${this._parts.find((p) => p.id === s.gap)?.ask ?? '...'}]`).join(' ').replace(/ ,/g, ',');
    }

    _claimHtml() {
      const hb = this._hb;
      const segs = this.constructor.compose(hb.sel);
      let out = '';
      segs.forEach((s, i) => {
        const sp = i === 0 || s.text === ',' ? '' : ' ';
        if (s.gap) { out += `${sp}<span class="cp-gap">[${esc(this._parts.find((p) => p.id === s.gap)?.ask ?? '...')}]</span>`; return; }
        if (!s.part) { out += `${sp}${esc(s.text)}`; return; }
        const vague = this._mode === 'choose' && this.optionOf(s.part)?.vague;
        const cls = ['cp-frag', vague ? 'is-vague' : '', hb.fresh === s.part ? 'is-new' : '', hb.cue === s.part ? 'is-cue' : ''].filter(Boolean).join(' ');
        out += `${sp}<span class="${cls}">${esc(s.text)}</span>`;
      });
      return out + '.';
    }

    _toggleRows() {
      const hb = this._hb;
      const rows = this._parts.map((p) => {
        const on = !!hb.sel[p.id];
        const ring = hb.ring.includes(p.id) ? ' cp-ring' : '';
        const words = on ? `<span class="cp-words">${esc(p.field)}</span>` : `<span class="cp-words cp-ask">add: ${esc(p.ask)}</span>`;
        const chip = `<button type="button" class="spn-act cp-chip${ring}" data-sflow-action="part" data-sflow-value="${esc(p.id)}" aria-pressed="${on}"${hb.live ? '' : ' disabled'}`
          + ` aria-label="${esc(p.name)}: ${esc(on ? p.field : 'not in the claim')}"><span class="cp-chip__t"><span class="cp-lab">${esc(p.name)}</span>${words}</span></button>`;
        let rec;
        if (on) rec = `<p class="cp-rec${hb.fresh === p.id ? ' is-new' : ''}">${esc(p.record)}</p>`;
        else if (hb.gone.has(p.id)) rec = `<p class="cp-rec cp-rec--gone"><s>${esc(p.record)}</s><small>${CROSS} no longer measured</small></p>`;
        else rec = '<p class="cp-rec cp-rec--none">-</p>';
        return `<li class="cp-row${hb.cue === p.id ? ' cp-row--cue' : ''}">${chip}${rec}</li>`;
      }).join('');
      return `<div class="cp-colhead" aria-hidden="true"><span>Part of the claim</span><span>Data you now need</span></div><ul class="cp-rows" style="border-top:0">${rows}</ul>`;
    }

    _chooseRows() {
      const hb = this._hb;
      const rows = this._parts.map((p) => {
        const opt = this.optionOf(p.id);
        if (hb.live && hb.open === p.id) {
          const cards = this._order[p.id].map((o) => {
            const on = hb.sel[p.id] === o.key;
            return `<button type="button" class="spn-act cp-opt" data-sflow-action="opt" data-sflow-value="${esc(p.id)}:${esc(o.key)}" aria-pressed="${on}">${esc(o.label)}</button>`;
          }).join('');
          const rec = opt ? (opt.vague
            ? `<p class="cp-opt-rec cp-opt-rec--bad"><b>${CROSS} Cannot be measured:</b> no record can confirm it.</p>`
            : `<p class="cp-opt-rec cp-opt-rec--ok"><b>${TICK} Record:</b> ${esc(opt.record)}</p>`)
            : '<p class="cp-opt-rec">Choose the wording a record could confirm.</p>';
          const ring = hb.ring.includes(p.id) ? ' cp-ring' : '';
          return `<li class="cp-row cp-row--choose cp-row--open${ring}" role="group" aria-label="${esc(p.name)}"><div class="cp-open-head"><span class="cp-lab">${esc(p.name)}</span><span>${esc(p.ask)}</span></div>`
            + `<div class="cp-opts">${cards}</div>${rec}</li>`;
        }
        const ring = hb.ring.includes(p.id) ? ' cp-ring' : '';
        let sub, mark;
        if (!opt) { sub = `<span class="cp-sub cp-sub--wait">${hb.live ? 'not chosen yet' : esc(p.ask)}</span>`; mark = hb.live ? '<span class="cp-mark cp-mark--open">Choose</span>' : ''; }
        else if (opt.vague) { sub = `<span class="cp-sub cp-sub--bad">Cannot be measured</span>`; mark = `<span class="cp-mark cp-mark--bad">${CROSS}</span>`; }
        else { sub = `<span class="cp-sub">${esc(opt.record)}</span>`; mark = `<span class="cp-mark cp-mark--ok">${TICK}</span>`; }
        return `<li class="cp-row cp-row--choose"><button type="button" class="cp-line${ring}" data-sflow-action="open" data-sflow-value="${esc(p.id)}"${hb.live ? '' : ' disabled'} aria-expanded="false"`
          + ` aria-label="${esc(p.name)}: ${esc(opt ? opt.label : 'not chosen yet')}. ${esc(opt ? (opt.vague ? 'Cannot be measured' : opt.record) : '')}">`
          + `<span class="cp-lab">${esc(p.name)}</span>${sub}${mark}</button></li>`;
      }).join('');
      return `<div class="cp-colhead cp-colhead--choose" aria-hidden="true"><span>Part</span><span>Record that could confirm it</span></div><ul class="cp-rows" style="border-top:0">${rows}</ul>`;
    }

    _paint() {
      if (!this.root || !this._hb) return;
      const C = this.constructor, hb = this._hb;
      const st = (C.STEPS || [])[this.stepIndex ?? 0] || {};
      const n = this._mode === 'choose' ? this.measured() : this._parts.filter((p) => hb.sel[p.id]).length;
      const allDone = n === this._parts.length;
      const promptText = hb.touched && st.promptAfter ? st.promptAfter : st.prompt;
      const prompt = promptText ? promptHtml(allDone && st.promptDone ? st.promptDone : promptText, { done: !hb.live || (allDone && !!st.promptDone) }) : '';
      const head = `<div class="cp-head"><p class="spn-kicker">${esc(C.CASE.kicker)}</p><p class="cp-count"><b>${n}</b> of ${this._parts.length} ${esc(C.CASE.count)}</p></div>`;
      const claim = `<p class="cp-claim" aria-live="polite">${this._claimHtml()}</p>${C.CASE.caption ? `<p class="spn-cap cp-cap">${esc(C.CASE.caption)}</p>` : ''}`;
      const rows = this._mode === 'choose' ? this._chooseRows() : this._toggleRows();
      this.render({ html: `<div class="spn cp cp--${this._mode}${hb.cue ? ' cp--cued' : ''}">${head}${claim}${prompt}${rows}</div>` });
      hb.fresh = null;
    }

    testState() {
      const hb = this._hb;
      const on = this._parts.filter((p) => hb.sel[p.id]).map((p) => p.id);
      return { step: this.stepIndex ?? 0, on, onCount: on.length, lines: this.dataLines().length, measured: this.measured(),
        claim: this.claimText(), open: hb.open, live: hb.live, gone: [...hb.gone], cue: hb.cue };
    }
  };
}
