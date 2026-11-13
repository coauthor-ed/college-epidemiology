/**
 * ThalidomideTimelineScene - L01 s01, cold-case file 1 (rebuilt 2026-11-05 on the editorial panel parts).
 * A strip of three dated entries (1958 sale, 1961 congress, 1961 suspect) as chips; the open entry reads
 * below the strip with its status. Opening the congress entry fills a births register (five columns,
 * 1957-1961, illustrative pattern) in which the 1961 column jumps and is marked in the signature colour.
 * The switch "Before 1961 the defect was: rare | always common" redraws the same 1961 births over an
 * always-common background: no jump, nothing to notice. Grey columns are the background; the one
 * signature colour marks the jump. No frame loop: the columns grow by a CSS transition.
 *   Beat 0: strip live, nothing open, register empty.  Beat 1: 1958 open.
 *   Beat 2: congress open, the register fills (rare).  Beat 3: suspect open; the register stays as left.
 * Narrated (spec W1 D15, Q-41): in beat 2 the teacher points and flips the switch in sync. Cue bars rings the
 * register (the jump); cue common flips the switch to always common with the same transition a tap gives;
 * cue rare flips it back. The switch stays ringed after a flip, so the hand-over ("now you try") points at it.
 * Cue flips never count as the learner's: the prompt still asks the learner to try. Replay and scrub re-derive
 * the picture from the beat time (NarrationCues.js). In beat 2 the task is finished when the learner has
 * flipped it themselves to always common and back to rare (both pictures seen): then scene-interact-done
 * (detail.id b3); the narration dwells on "Got it" before going on (spec W1 Q-41).
 */
import { DomSimulation } from 'simulations/base/DomSimulation.js';
import { esc } from 'simulations/base/SimUi.js';
import { SIM_PANEL_CSS, columnsHtml, setColumns, promptHtml, chipsHtml, emHtml, bindPanel } from 'simulations/base/kit/SimPanel.js';
import { withNarrationCues } from './NarrationCues.js';

const ENTRIES = [
  { id: 'sold', year: '1958', tab: 'A drug goes on sale', title: 'Thalidomide goes on sale in Britain',
    body: 'Sold as a sleeping drug, thought safe because it was not a barbiturate. Nothing yet links it to pregnancy.', status: 'no concern' },
  { id: 'congress', year: '1961', tab: 'A cluster is reported', title: 'Many malformed births are reported',
    body: 'At a congress of gynaecologists, doctors report many babies born with a malformation that used to be rare.', status: 'cluster reported' },
  { id: 'suspect', year: '1961', tab: 'A suspect is named', title: 'Thalidomide is suspected',
    body: 'Someone suggests the drug might be responsible: a suspicion from mothers\' histories, not a finding.', status: 'suspect named, not proven' },
];
const OPEN_AT = [null, 'sold', 'congress', 'suspect'];
const YEARS = [1957, 1958, 1959, 1960, 1961];
const PATTERNS = { rare: [1, 1, 1, 2, 8], common: [8, 8, 8, 8, 8] };   // relative heights, illustrative
const TOP = 8;
// Narration focus (spec W1 D29n): n = a data-narr id, '-' = data-narr-hide; inert with narration off.
const na = (n) => (!n ? '' : n === '-' ? ' data-narr-hide=""' : ` data-narr="${n}"`);
const hideTag = (html) => html.replace(/^<(\w+)/, '<$1 data-narr-hide=""');

const CSS = SIM_PANEL_CSS + `
.tl { gap: 10px; }
.tl-tabs { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px; }
.tl-tab { flex-direction: row; align-items: flex-start; width: 100%; min-height: 54px; padding: 8px 10px; }
.tl-tab::before { margin-top: 3px; }
.tl-tab__t { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
.tl-tab__y { font-size: var(--sim-text-sm); font-weight: 600; color: var(--sim-label-muted); font-variant-numeric: tabular-nums; }
.tl-tab[aria-pressed="true"] .tl-tab__y { color: var(--sim-annot); }
.tl-tab__n { font-size: var(--sim-text-md); font-weight: 700; line-height: 1.25; }
.tl-entry { display: flex; flex-direction: column; gap: 4px; min-height: 96px; padding: 2px 0 2px var(--sim-space-4); border-left: 3px solid var(--sim-annot); }
.tl-entry--empty { border-left-color: var(--sim-track); justify-content: center; color: var(--sim-label-muted); }
.tl-entry__t { margin: 0; font-size: var(--sim-text-lg); font-weight: 700; line-height: 1.3; color: var(--sim-label); }
.tl-entry__b { margin: 0; font-size: var(--sim-text-md); line-height: 1.45; color: var(--sim-label); }
.tl-status { margin: 2px 0 0; font-size: var(--sim-text-md); color: var(--sim-label-muted); }
.tl-status b { color: var(--sim-annot); font-weight: 700; }
.tl-reg { display: flex; flex-direction: column; gap: 6px; padding-top: 10px; border-top: 1px solid var(--sim-label); }
.tl-reghead { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px 12px; min-height: 40px; }
.tl-sw { display: flex; align-items: center; flex-wrap: wrap; gap: 6px 10px; }
.tl-sw .spn-btns { gap: 6px; }
.tl .spn-cols { height: 104px; padding-top: 6px; gap: 16px; }
.tl .spn-cols__x { gap: 16px; }
.tl .spn-col__n { display: none; }
.tl .spn-col.is-new .spn-col__bar { background: var(--sim-annot); }
.tl-plot { position: relative; }
.tl-empty { position: absolute; inset: 0 0 26px; display: flex; align-items: center; justify-content: center; padding: 0 24px; text-align: center;
  font-size: var(--sim-text-sm); color: var(--sim-label-muted); border: 1.5px dashed var(--sim-track); }
.tl-plot, .tl-sw .spn-btns { border-radius: 4px; outline: 2px solid transparent; outline-offset: 4px; transition: outline-color 0.25s ease; }
.tl-plot.is-cue, .tl-sw .spn-btns.is-cue { outline-color: var(--sim-annot); }
.tl-read { margin: 0; min-height: 1.45em; font-size: var(--sim-text-md); color: var(--sim-label); }
.sim-dom-root--portrait .tl-tabs { grid-template-columns: minmax(0, 1fr); gap: 6px; }
.sim-dom-root--portrait .tl-tab { min-height: 44px; align-items: center; }
.sim-dom-root--portrait .tl-tab::before { margin-top: 0; }
.sim-dom-root--portrait .tl-tab__t { flex-direction: row; align-items: baseline; gap: 8px; }
`;

export class ThalidomideTimelineScene extends withNarrationCues(DomSimulation) {
  static SETTING = 'none';
  static LAYOUT = 'fit';
  static WIDTH = 560;
  static HEIGHT = 510;
  static PORTRAIT_WIDTH = 360;
  static PORTRAIT_HEIGHT = 700;
  static CONTROLS = [];
  static BEAT_STEP_MAP = [
    [{ idx: 0, dwellMs: null }], // strip live, nothing open, register empty
    [{ idx: 1, dwellMs: null }], // 1958 entry
    [{ idx: 2, dwellMs: null }], // 1961 congress, register fills
    [{ idx: 3, dwellMs: null }], // 1961 suspect
  ];
  static ARIA_LABEL = 'Case file 1, 1958 to 1961: three dated entries to open one at a time. The 1961 congress entry fills an illustrative births register for 1957 to 1961, where the 1961 column jumps. A switch redraws it as if the defect had always been common: the same 1961 births no longer stand out.';

  async setup() {
    this._open = null;
    this._seen = new Set();
    this._mode = 'rare';
    this._reg = false;
    this._flipped = false;
    this._focus = null;    // narration pointer: null | 'bars' | 'switch'
    this._tried = new Set();   // modes the learner set themselves in beat 2
    this._ncSent = false;
    await super.setup();
    this.render({ css: CSS, rootClass: 'spn-page', html: '' });
    bindPanel(this.root, { action: (name, v) => this._act(name, v) });
    this._paint(false);
  }

  // DomSimulation calls this after every beat change (stepIndex already set).
  onStep(step) {
    this._focus = null;
    this._tried = new Set();
    this._ncSent = false;
    this._open = OPEN_AT[step] ?? null;
    if (this._open) this._seen.add(this._open);
    let grow = false;
    if (step < 2) { this._mode = 'rare'; this._reg = false; this._flipped = false; this._seen = new Set(this._open ? [this._open] : []); }
    else if (!this._reg) { this._reg = true; grow = true; }
    this._paint(grow);
  }

  _act(name, v) {
    if (name === 'entry') {
      if (!ENTRIES.some((e) => e.id === v)) return;
      this._open = v;
      this._seen.add(v);
      let grow = false;
      if (v === 'congress' && !this._reg) { this._reg = true; grow = true; }
      this._paint(grow);
    } else if (name === 'mode') {
      if (!PATTERNS[v] || !this._reg || v === this._mode) return;
      this._mode = v;
      this._flipped = true;
      this._paint(false, true);
      // finished = the learner has made both pictures themselves, ending on rare (the jump back in view)
      if ((this.stepIndex ?? 0) === 2 && !this._ncSent) {
        this._tried.add(v);
        if (v === 'rare' && this._tried.has('common')) { this._ncSent = true; this.interactDone('b3'); }
      }
    }
  }

  // ---- narration cues (NarrationCues.js) ----
  static CUES = ['bars', 'common', 'rare'];

  cueBase() { return { mode: this._mode }; }

  cueReset(base) {
    this._focus = null;
    if (base && PATTERNS[base.mode] && base.mode !== this._mode && this._reg) { this._mode = base.mode; this._paint(false, true); }
    this._applyFocus();
  }

  /** A cue is the teacher's hand: it points (bars) or flips the switch with the same transition a tap gives. */
  applyCue(id) {
    if (!this._reg) return;
    if (id === 'bars') { this._focus = 'bars'; this._applyFocus(); this._showRegister(); return; }
    const mode = id === 'common' ? 'common' : id === 'rare' ? 'rare' : null;
    if (!mode) return;
    this._focus = 'switch';
    if (mode !== this._mode) { this._mode = mode; this._paint(false, true); }
    this._applyFocus();
    this._showRegister();
  }

  /** A teacher points where the learner can see: on a phone the register may sit below the fold. */
  _showRegister() {
    const reg = this.root?.querySelector('.tl-reg');
    if (!reg || typeof reg.scrollIntoView !== 'function') return;
    const r = reg.getBoundingClientRect();
    if (r.top >= 0 && r.bottom <= window.innerHeight) return;
    const still = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    reg.scrollIntoView({ block: 'nearest', behavior: still ? 'auto' : 'smooth' });
  }

  _applyFocus() {
    if (!this.root) return;
    this.root.querySelector('.tl-plot')?.classList.toggle('is-cue', this._focus === 'bars');
    this.root.querySelector('.tl-sw .spn-btns')?.classList.toggle('is-cue', this._focus === 'switch');
  }


  _bins(zero) {
    const h = this._reg && !zero ? PATTERNS[this._mode] : YEARS.map(() => 0);
    return YEARS.map((y, i) => ({ label: String(y), n: h[i] }));
  }

  _paint(grow, patch) {
    if (!this.root) return;
    const hot = this._reg && this._mode === 'rare' ? 4 : -1;
    if (patch && this.root.querySelector('[data-spn-cols="reg"]')) {
      // The switch: regrow the same columns in place (the CSS transition is the motion), patch the text.
      setColumns(this.root, 'reg', this._bins(), TOP, hot);
      this.root.querySelectorAll('[data-sflow-action="mode"]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.sflowValue === this._mode)));
      const r = this.root.querySelector('.tl-read');
      if (r) r.innerHTML = this._readHtml();
      const pr = this.root.querySelector('.spn-prompt');
      if (pr) pr.outerHTML = hideTag(this._promptHtml());
      this._applyFocus();
      return;
    }
    const e = ENTRIES.find((x) => x.id === this._open) ?? null;
    const prompt = hideTag(this._promptHtml());
    const step = this.stepIndex ?? 0;
    const tabs = `<div class="tl-tabs" role="group" aria-label="Dated entries">${ENTRIES.map((x) => `<button type="button" class="spn-act tl-tab" data-sflow-action="entry" data-sflow-value="${x.id}"${na(`tabs ${x.id}`)} aria-pressed="${x.id === this._open}">`
      + `<span class="tl-tab__t"><span class="tl-tab__y">${x.year}</span><span class="tl-tab__n">${esc(x.tab)}</span></span></button>`).join('')}</div>`;
    const entry = e
      ? `<div class="tl-entry"${na(e.id)}><p class="tl-entry__t">${esc(e.title)}</p><p class="tl-entry__b">${esc(e.body)}</p>`
        + `<p class="tl-status">Status: <b>${esc(e.status)}</b></p></div>`
      : `<div class="tl-entry tl-entry--empty"${na('-')}><p class="tl-entry__b" style="color:inherit">No entry open. The file starts in 1958.</p></div>`;
    const sw = this._reg
      ? `<div class="tl-sw"${na('switch')}><span class="spn-label">Before 1961 the defect was</span>${chipsHtml([
        { label: 'rare', action: 'mode', value: 'rare', pressed: this._mode === 'rare' },
        { label: 'always common', action: 'mode', value: 'common', pressed: this._mode === 'common' }], { label: 'Before 1961 the defect was' })}</div>`
      : '<span class="spn-label">Births register</span>';
    const empty = this._reg ? '' : '<div class="tl-empty">The register fills when the 1961 congress entry is open.</div>';
    // The register is spoken only in beat 2 (index 2); before and after it steps aside.
    const reg = `<section class="tl-reg"${step === 2 ? '' : na('-')} aria-label="Births register, illustrative pattern"><div class="tl-reghead">${sw}</div>`
      + `<div class="tl-plot"${na('bars')}>${columnsHtml({ key: 'reg', bins: this._bins(grow), max: TOP, tone: 'series-8', label: 'Malformed births per year, 1957 to 1961, illustrative pattern' })}${empty}</div>`
      + `<p class="tl-read"${na('-')} aria-live="polite">${this._readHtml()}</p><p class="spn-cap"${na('-')}>Malformed births per year (illustrative pattern, no scale).</p></section>`;
    this.render({ html: `<div class="spn tl">${prompt}${tabs}${entry}${reg}</div>` });
    if (this._reg) {
      if (grow) requestAnimationFrame(() => requestAnimationFrame(() => setColumns(this.root, 'reg', this._bins(), TOP, hot)));
      else setColumns(this.root, 'reg', this._bins(), TOP, hot);
    }
    this._applyFocus();
  }

  _promptHtml() {
    const all = this._seen.size === ENTRIES.length;
    if (this._reg && !this._flipped) return promptHtml('Now try the switch: always common');
    if (this._reg && (this.stepIndex ?? 0) === 2) return promptHtml('Switch back and forth to compare', { done: true });
    if (!all) return promptHtml('Select each date to open its entry');
    return promptHtml(this._reg ? 'Switch back and forth to compare' : 'All three entries opened', { done: true });
  }

  _readHtml() {
    if (!this._reg) return '';
    return this._mode === 'rare'
      ? `${emHtml('Rare, then common:')} the 1961 column stands out.`
      : `${emHtml('Always common:')} the same 1961 births add nothing to notice.`;
  }

  _heights() { return this._reg ? PATTERNS[this._mode].map((v) => (v / TOP) * 100) : YEARS.map(() => 0); }

  testState() {
    return {
      stage: this.stepIndex,
      open: this._open,
      mode: this._mode,
      order: ENTRIES.map((x) => x.id).join(','),
      heights: this._heights(),
      clusters: this._reg && this._mode === 'rare' ? 1 : 0,
      status: ENTRIES.find((x) => x.id === this._open)?.status ?? 'no concern',
    };
  }
}
