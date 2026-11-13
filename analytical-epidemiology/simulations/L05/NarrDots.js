/**
 * NarrDots - narration focus helper for the L05 crowd scenes (spec W1 D29n; narration.md sec 8, 8a).
 * Course-local helper, not a scene. The engine lights an SVG part with a signature-colour glow; on a crowd dot
 * that glow reads as "has the disease" (blue = a case). So a lit dot keeps its own colour: the scene marks its
 * root with the lit ids while narrated (data-narr-on), and narrDotsCss(ids) turns the glow off on those dots.
 * Dimming is untouched. Narration off: no attribute, no rule matches (no pixel changes).
 *   narrOn(scene, f)     call from the scene's narrationFocus(f)
 *   narrDotsCss(ids, sel) css for the scene's css(): sel defaults to the crowd dot class
 */
export function narrOn(scene, f) {
  const r = scene?.root;
  if (!r) return;
  if (f?.narrated) r.setAttribute('data-narr-on', (f.on || []).join(' '));
  else r.removeAttribute('data-narr-on');
}

export const narrDotsCss = (ids, sel = '.scw-dot') =>
  `${ids.map((i) => `[data-narr-on~="${i}"] ${sel}[data-narr~="${i}"]`).join(',\n')} { filter: none !important; }\n`;
