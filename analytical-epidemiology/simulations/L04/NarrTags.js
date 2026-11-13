/**
 * NarrTags - narration focus tags for the L04 scenes (spec W1 D29n; narration.md sec 8, 8a).
 * Course-local helper, not a scene. Attributes only: inert with narration off (no pixel changes).
 *   na(n)             ' data-narr="n"' ('-' = data-narr-hide, '' = nothing)
 *   tagFirst(html, n) tag the first element of an html string
 *   tagTop(html, n)   tag every top-level element of an html or svg string (children untouched)
 *   tagEl(el, n)      tag one live element ('-' = hide, '' = untag)
 *   tagLive(live, key, people, idOf) tag a crowdLive scene's dots after crowdLive ran
 */
export const na = (n) => (!n ? '' : n === '-' ? ' data-narr-hide=""' : ` data-narr="${n}"`);

export const tagFirst = (html, n) => (n && html ? html.replace(/^(\s*<[\w-]+)/, `$1${na(n)}`) : html);

const VOID = new Set(['br', 'img', 'input', 'hr', 'wbr', 'meta', 'link', 'source', 'col', 'area', 'base', 'embed', 'track', 'param']);
export function tagTop(html, n) {
  if (!n || !html) return html;
  let depth = 0;
  return html.replace(/<(\/?)([\w-]+)((?:"[^"]*"|'[^']*'|[^'">])*)>/g, (m, close, name, rest) => {
    if (close) { depth--; return m; }
    const self = /\/\s*$/.test(rest) || VOID.has(name.toLowerCase());
    const out = depth === 0 ? `<${name}${na(n)}${rest}>` : m;
    if (!self) depth++;
    return out;
  });
}

export function tagEl(e, n) {
  if (!e) return;
  if (n === '-') {
    if (e.hasAttribute('data-narr')) e.removeAttribute('data-narr');
    if (!e.hasAttribute('data-narr-hide')) e.setAttribute('data-narr-hide', '');
    return;
  }
  if (e.hasAttribute('data-narr-hide')) e.removeAttribute('data-narr-hide');
  if (!n) { if (e.hasAttribute('data-narr')) e.removeAttribute('data-narr'); return; }
  if (e.getAttribute('data-narr') !== n) e.setAttribute('data-narr', n);
}

export function tagLive(live, key, people, idOf) {
  for (const p of people) tagEl(live?.get?.(`${key}|${p.id}`), idOf(p));
}
