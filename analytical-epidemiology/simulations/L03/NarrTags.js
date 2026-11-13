/**
 * NarrTags - narration focus tags for the L03 scenes (spec W1 D29n; narration.md sec 8, 8a).
 * Course-local helper, not a scene. Attributes only: inert with narration off (no pixel changes).
 *   na(n)             ' data-narr="n"' ('-' = data-narr-hide, '' = nothing)
 *   tagFirst(html, n) tag the first element of an html string
 *   tagEach(html, tag, ids) tag the k-th <tag ...> of an html string with ids[k] (missing: untouched)
 *   tagLive(live, key, people, idOf) tag a crowdLive scene's dots after crowdLive ran
 */
export const na = (n) => (!n ? '' : n === '-' ? ' data-narr-hide=""' : ` data-narr="${n}"`);

export const tagFirst = (html, n) => (n && html ? html.replace(/^(\s*<[\w-]+)/, `$1${na(n)}`) : html);

export function tagEach(html, tag, ids) {
  let i = 0;
  return html.replace(new RegExp(`<${tag}(?=[\\s>])`, 'g'), (m) => { const n = ids[i++]; return n ? m + na(n) : m; });
}

export function tagLive(live, key, people, idOf) {
  for (const p of people) {
    const e = live?.get?.(`${key}|${p.id}`), n = idOf(p);
    if (e && n && e.getAttribute('data-narr') !== n) e.setAttribute('data-narr', n);
  }
}
