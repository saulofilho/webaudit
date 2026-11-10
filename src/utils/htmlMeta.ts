import type { MetaTagsData } from '../types';

/**
 * Minimal HTML attribute/meta extraction shared by the server analyzer and the
 * static-mode client analyzer. Handles double-quoted, single-quoted and unquoted
 * attribute values (`lang=en`, `name=viewport`) and bare attributes (`alt`), in any order.
 */

const ATTR_RE = /([^\s"'<>\/=]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;

const ENTITY_MAP: Record<string, string> = {
  amp: '&',
  lt: '<',
  gt: '>',
  quot: '"',
  apos: "'",
  '#39': "'",
  nbsp: ' ',
};

export function decodeEntities(value: string): string {
  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, code: string) => {
    const lower = code.toLowerCase();
    if (lower in ENTITY_MAP) return ENTITY_MAP[lower];
    if (lower.startsWith('#x')) return String.fromCodePoint(parseInt(lower.slice(2), 16));
    if (lower.startsWith('#')) return String.fromCodePoint(parseInt(lower.slice(1), 10));
    return m;
  });
}

/** Parses the attribute part of a start tag into a lowercase-keyed map. Bare attributes map to ''. */
export function parseAttributes(attrString: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  ATTR_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = ATTR_RE.exec(attrString)) !== null) {
    const name = m[1].toLowerCase();
    if (name in attrs) continue; // first occurrence wins, as in browsers
    const raw = m[2] ?? m[3] ?? m[4] ?? '';
    attrs[name] = decodeEntities(raw);
  }
  return attrs;
}

/** Attributes of every start tag named `tagName` (comments are ignored). */
export function findTags(html: string, tagName: string): Record<string, string>[] {
  const withoutComments = html.replace(/<!--[\s\S]*?-->/g, '');
  const re = new RegExp(`<${tagName}\\b([^>]*)>`, 'gi');
  const out: Record<string, string>[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(withoutComments)) !== null) out.push(parseAttributes(m[1] || ''));
  return out;
}

export function extractMetaTags(html: string): MetaTagsData {
  const meta: MetaTagsData = { openGraph: {}, twitter: {}, structuredDataTypes: [] };
  const clean = html.replace(/<!--[\s\S]*?-->/g, '');

  const titleMatch = clean.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (titleMatch) {
    const title = decodeEntities(titleMatch[1].replace(/\s+/g, ' ').trim());
    if (title) {
      meta.title = title;
      meta.titleLength = title.length;
    }
  }

  const htmlTag = findTags(clean, 'html')[0];
  if (htmlTag?.lang) meta.language = htmlTag.lang.trim();

  const byName = new Map<string, string>();
  const byProperty = new Map<string, string>();
  for (const tag of findTags(clean, 'meta')) {
    if (tag.charset !== undefined && !meta.charset) meta.charset = tag.charset.trim() || undefined;
    const httpEquiv = tag['http-equiv']?.toLowerCase();
    if (httpEquiv === 'content-type' && !meta.charset) {
      const cs = (tag.content || '').match(/charset=([^;\s]+)/i);
      if (cs) meta.charset = cs[1];
    }
    const content = tag.content?.trim();
    if (content === undefined) continue;
    if (tag.name && !byName.has(tag.name.toLowerCase())) byName.set(tag.name.toLowerCase(), content);
    if (tag.property && !byProperty.has(tag.property.toLowerCase())) byProperty.set(tag.property.toLowerCase(), content);
  }
  const named = (n: string) => byName.get(n) || undefined;
  const og = (p: string) => byProperty.get(`og:${p}`) || undefined;
  // Twitter tags are specified with name=, but property= is common in the wild
  const tw = (p: string) => byName.get(`twitter:${p}`) || byProperty.get(`twitter:${p}`) || undefined;

  meta.description = named('description');
  if (meta.description) meta.descriptionLength = meta.description.length;
  meta.robots = named('robots');
  meta.viewport = named('viewport');
  meta.themeColor = named('theme-color');
  meta.author = named('author');
  meta.keywords = named('keywords');

  meta.openGraph = {
    title: og('title'),
    description: og('description'),
    image: og('image'),
    url: og('url'),
    siteName: og('site_name'),
    type: og('type'),
  };
  meta.twitter = {
    card: tw('card'),
    title: tw('title'),
    description: tw('description'),
    image: tw('image'),
    site: tw('site'),
    creator: tw('creator'),
  };

  for (const link of findTags(clean, 'link')) {
    const rel = (link.rel || '').toLowerCase().split(/\s+/);
    if (!meta.canonical && rel.includes('canonical') && link.href) meta.canonical = link.href.trim();
    if (!meta.favicon && (rel.includes('icon') || rel.includes('apple-touch-icon')) && link.href) {
      meta.favicon = link.href.trim();
    }
  }

  const ldRe = /<script\b([^>]*)>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = ldRe.exec(clean)) !== null) {
    if ((parseAttributes(m[1]).type || '').toLowerCase() !== 'application/ld+json') continue;
    try {
      const parsed = JSON.parse(m[2].trim());
      const nodes = Array.isArray(parsed) ? parsed : parsed['@graph'] ? parsed['@graph'] : [parsed];
      for (const node of nodes) {
        const t = node?.['@type'];
        if (Array.isArray(t)) meta.structuredDataTypes.push(...t.map(String));
        else if (t) meta.structuredDataTypes.push(String(t));
      }
    } catch {
      meta.structuredDataTypes.push('Schema.org (JSON-LD, invalid)');
    }
  }

  return meta;
}

/** True when an <img> attribute string has an alt attribute (bare `alt` counts as empty alt). */
export function hasAltAttribute(imgAttrString: string): boolean {
  return 'alt' in parseAttributes(imgAttrString);
}
