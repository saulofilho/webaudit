import zlib from 'node:zlib';
import { safeFetch } from './security/safeFetch';

/** Sitemaps also list nested sitemaps, feeds and media; only HTML pages should be crawled as pages. */
export function isLikelyHtmlPage(url: string): boolean {
  try {
    return !/\.(xml|gz|pdf|jpe?g|png|gif|webp|svg|avif|ico|css|js|json|txt|zip|mp4|mp3|woff2?)$/i.test(
      new URL(url).pathname
    );
  } catch {
    return false;
  }
}

async function fetchSitemapXml(url: string, timeoutMs: number): Promise<string | null> {
  try {
    const res = await safeFetch(url, {
      timeoutMs,
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WebAuditProCrawler/3.0)' },
    });
    if (!res.ok) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    // .xml.gz files are gzip bytes served without Content-Encoding
    if (buf[0] === 0x1f && buf[1] === 0x8b) {
      return zlib.gunzipSync(buf, { maxOutputLength: 20 * 1024 * 1024 }).toString('utf-8');
    }
    return buf.toString('utf-8');
  } catch {
    return null;
  }
}

/**
 * Reads a sitemap and returns page URLs. Follows a sitemap index into up to
 * `maxChildSitemaps` child sitemaps (one level deep). Returns null when the URL
 * is not a readable sitemap.
 */
export async function loadSitemapPageUrls(
  sitemapUrl: string,
  { maxUrls = 200, maxChildSitemaps = 3, timeoutMs = 5000 } = {}
): Promise<string[] | null> {
  const xml = await fetchSitemapXml(sitemapUrl, timeoutMs);
  if (!xml || !/<(urlset|sitemapindex)\b/i.test(xml)) return null;

  const locs = [...xml.matchAll(/<loc>\s*([^<\s]+)\s*<\/loc>/gi)].map((m) => m[1].replace(/&amp;/g, '&'));

  if (/<sitemapindex\b/i.test(xml)) {
    const pages: string[] = [];
    for (const child of locs.slice(0, maxChildSitemaps)) {
      const childPages = await loadSitemapPageUrls(child, { maxUrls, maxChildSitemaps: 0, timeoutMs });
      if (childPages) pages.push(...childPages);
      if (pages.length >= maxUrls) break;
    }
    return pages.slice(0, maxUrls);
  }

  return locs.filter(isLikelyHtmlPage).slice(0, maxUrls);
}
