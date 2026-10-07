import { URL } from 'url';

export interface LinkAuditResult {
  url: string;
  text: string;
  isInternal: boolean;
  status: number;
  statusText: string;
  responseTimeMs: number;
  redirectUrl?: string;
  isBroken: boolean;
  isInsecure: boolean;
  missingNoopener: boolean;
  error?: string;
}

export interface LinkCheckSummary {
  targetUrl: string;
  totalFound: number;
  totalChecked: number;
  internalCount: number;
  externalCount: number;
  brokenCount: number;
  redirectsCount: number;
  insecureCount: number;
  missingNoopenerCount: number;
  healthScore: number;
  links: LinkAuditResult[];
}

export interface PageCrawlItem {
  url: string;
  statusCode: number;
  responseTimeMs: number;
  title?: string;
  titleLength: number;
  metaDescription?: string;
  metaDescLength: number;
  h1?: string;
  h1Count: number;
  canonical?: string;
  isIndexable: boolean;
  issues: string[];
}

export interface SitemapCrawlSummary {
  targetUrl: string;
  sitemapFound: boolean;
  sitemapUrl?: string;
  totalPagesDiscovered: number;
  totalPagesCrawled: number;
  averageResponseTimeMs: number;
  healthScore: number;
  issuesSummary: {
    duplicateTitles: number;
    missingTitles: number;
    missingMetaDescriptions: number;
    missingH1: number;
    multipleH1: number;
    httpErrors: number;
    slowPages: number;
  };
  duplicateTitleGroups: { title: string; urls: string[] }[];
  pages: PageCrawlItem[];
}

// Helper to sanitize and resolve relative URLs
function resolveUrl(href: string, baseUrl: string): string | null {
  try {
    const trimmed = href.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('javascript:') || trimmed.startsWith('mailto:') || trimmed.startsWith('tel:')) {
      return null;
    }
    const resolved = new URL(trimmed, baseUrl);
    if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') {
      return null;
    }
    return resolved.toString();
  } catch {
    return null;
  }
}

/**
 * Checks links found on the target page for 404s, redirects, and security flaws
 */
export async function checkPageLinks(targetUrl: string, maxLinks = 40): Promise<LinkCheckSummary> {
  const baseObj = new URL(targetUrl);
  const baseHost = baseObj.hostname.toLowerCase();
  const isTargetHttps = baseObj.protocol === 'https:';

  // Fetch page HTML
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);
  let html = '';

  try {
    const res = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'WebAuditPro-LinkBot/3.0 (+https://webaudit.pro/bot)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    html = await res.text();
  } catch (err: any) {
    throw new Error(`Failed to load target website to check links: ${err.message}`);
  } finally {
    clearTimeout(timeoutId);
  }

  // Extract all <a ...> tags
  const linkRegex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  const rawLinks: { href: string; text: string; attrs: string }[] = [];
  const seenUrls = new Set<string>();

  let match;
  while ((match = linkRegex.exec(html)) !== null) {
    const attrs = match[1] || '';
    const textRaw = (match[2] || '').replace(/<[^>]+>/g, '').trim();
    const hrefMatch = attrs.match(/\bhref\s*=\s*["']([^"']*)["']/i);
    if (hrefMatch && hrefMatch[1]) {
      const resolved = resolveUrl(hrefMatch[1], targetUrl);
      if (resolved && !seenUrls.has(resolved)) {
        seenUrls.add(resolved);
        rawLinks.push({
          href: resolved,
          text: textRaw || '(No anchor text)',
          attrs,
        });
      }
    }
  }

  const linksToTest = rawLinks.slice(0, maxLinks);

  // Concurrently inspect links in batches of 8
  const batchSize = 8;
  const results: LinkAuditResult[] = [];

  for (let i = 0; i < linksToTest.length; i += batchSize) {
    const batch = linksToTest.slice(i, i + batchSize);
    const batchPromises = batch.map(async (item) => {
      let isInternal = false;
      let isTargetHost = false;
      try {
        const u = new URL(item.href);
        isTargetHost = u.hostname.toLowerCase() === baseHost || u.hostname.toLowerCase().endsWith('.' + baseHost);
        isInternal = isTargetHost;
      } catch {
        // ignore
      }

      const isInsecure = isTargetHttps && item.href.startsWith('http://');
      const hasRel = /rel\s*=\s*["'][^"']*(?:noopener|noreferrer)[^"']*["']/i.test(item.attrs);
      const missingNoopener = !isInternal && !hasRel;

      const linkStart = Date.now();
      let status = 0;
      let statusText = 'Network Error';
      let redirectUrl: string | undefined = undefined;
      let isBroken = false;
      let errorMsg: string | undefined = undefined;

      try {
        const linkCtrl = new AbortController();
        const linkTimeout = setTimeout(() => linkCtrl.abort(), 6000);

        // Try HEAD first, fall back to GET if 405 or fails
        let headRes: Response | null = null;
        try {
          headRes = await fetch(item.href, {
            method: 'HEAD',
            redirect: 'manual',
            signal: linkCtrl.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; WebAuditProBot/3.0)',
            },
          });
        } catch {
          // Fall back to GET below
        }

        let resp = headRes;
        if (!resp || resp.status === 405 || resp.status === 501) {
          resp = await fetch(item.href, {
            method: 'GET',
            redirect: 'manual',
            signal: linkCtrl.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; WebAuditProBot/3.0)',
            },
          });
        }

        clearTimeout(linkTimeout);

        status = resp.status;
        statusText = resp.statusText || `${status}`;

        if (status >= 300 && status < 400) {
          redirectUrl = resp.headers.get('location') || undefined;
        }

        if (status >= 400 || status === 0) {
          isBroken = true;
        }
      } catch (err: any) {
        status = 0;
        statusText = err.name === 'AbortError' ? 'Timeout (6s)' : 'Connection Failed';
        isBroken = true;
        errorMsg = err.message || 'Connection failure';
      }

      const responseTimeMs = Date.now() - linkStart;

      return {
        url: item.href,
        text: item.text.slice(0, 100),
        isInternal,
        status,
        statusText,
        responseTimeMs,
        redirectUrl,
        isBroken,
        isInsecure,
        missingNoopener,
        error: errorMsg,
      };
    });

    const batchResults = await Promise.all(batchPromises);
    results.push(...batchResults);
  }

  const internalCount = results.filter((r) => r.isInternal).length;
  const externalCount = results.filter((r) => !r.isInternal).length;
  const brokenCount = results.filter((r) => r.isBroken).length;
  const redirectsCount = results.filter((r) => r.status >= 300 && r.status < 400).length;
  const insecureCount = results.filter((r) => r.isInsecure).length;
  const missingNoopenerCount = results.filter((r) => r.missingNoopener).length;

  // Calculate health score: 100 minus penalties
  const brokenPenalty = brokenCount * 15;
  const redirectPenalty = redirectsCount * 3;
  const insecurePenalty = insecureCount * 5;
  const noopenerPenalty = Math.min(missingNoopenerCount * 2, 10);
  const healthScore = Math.max(0, Math.min(100, Math.round(100 - brokenPenalty - redirectPenalty - insecurePenalty - noopenerPenalty)));

  return {
    targetUrl,
    totalFound: seenUrls.size,
    totalChecked: results.length,
    internalCount,
    externalCount,
    brokenCount,
    redirectsCount,
    insecureCount,
    missingNoopenerCount,
    healthScore,
    links: results,
  };
}

/**
 * Crawls sitemap or auto-discovered internal URLs and assesses cross-page health
 */
export async function crawlSitemapAndPages(targetUrl: string, maxPages = 12): Promise<SitemapCrawlSummary> {
  const baseObj = new URL(targetUrl);
  const origin = baseObj.origin;
  const baseHost = baseObj.hostname.toLowerCase();

  let sitemapFound = false;
  let sitemapUrl: string | undefined = undefined;
  const discoveredUrls = new Set<string>();
  discoveredUrls.add(targetUrl);

  // Step 1: Check /sitemap.xml and /sitemap_index.xml
  const potentialSitemaps = [
    `${origin}/sitemap.xml`,
    `${origin}/sitemap_index.xml`,
    `${origin}/sitemap-index.xml`,
  ];

  for (const sUrl of potentialSitemaps) {
    try {
      const sCtrl = new AbortController();
      const sTimer = setTimeout(() => sCtrl.abort(), 5000);
      const res = await fetch(sUrl, {
        signal: sCtrl.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WebAuditProCrawler/3.0)' },
      });
      clearTimeout(sTimer);

      if (res.ok) {
        const xml = await res.text();
        const locMatches = [...xml.matchAll(/<loc>([^<]+)<\/loc>/gi)];
        if (locMatches.length > 0) {
          sitemapFound = true;
          sitemapUrl = sUrl;
          for (const m of locMatches) {
            const loc = resolveUrl(m[1].trim(), origin);
            if (loc) {
              const uObj = new URL(loc);
              if (uObj.hostname.toLowerCase() === baseHost) {
                discoveredUrls.add(loc);
              }
            }
          }
          break;
        }
      }
    } catch {
      // Continue to next probe
    }
  }

  // Step 2: If sitemap not found or has few URLs, crawl home page to extract internal links
  if (discoveredUrls.size < 5) {
    try {
      const hCtrl = new AbortController();
      const hTimer = setTimeout(() => hCtrl.abort(), 6000);
      const res = await fetch(targetUrl, {
        signal: hCtrl.signal,
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WebAuditProCrawler/3.0)' },
      });
      clearTimeout(hTimer);
      if (res.ok) {
        const html = await res.text();
        const linkMatches = [...html.matchAll(/<a\b[^>]*href=["']([^"']*)["']/gi)];
        for (const m of linkMatches) {
          const loc = resolveUrl(m[1], targetUrl);
          if (loc) {
            const uObj = new URL(loc);
            if (uObj.hostname.toLowerCase() === baseHost && !uObj.pathname.match(/\.(jpg|jpeg|png|gif|svg|pdf|css|js|webp)$/i)) {
              discoveredUrls.add(loc);
            }
          }
        }
      }
    } catch {
      // ignore
    }
  }

  const urlsToCrawl = Array.from(discoveredUrls).slice(0, maxPages);

  // Concurrently audit discovered pages (batches of 4)
  const crawledPages: PageCrawlItem[] = [];
  const batchSize = 4;

  for (let i = 0; i < urlsToCrawl.length; i += batchSize) {
    const batch = urlsToCrawl.slice(i, i + batchSize);
    const batchPromises = batch.map(async (pageUrl) => {
      const pStart = Date.now();
      const issues: string[] = [];
      let statusCode = 0;
      let title: string | undefined = undefined;
      let metaDescription: string | undefined = undefined;
      let h1: string | undefined = undefined;
      let h1Count = 0;
      let canonical: string | undefined = undefined;
      let isIndexable = true;

      try {
        const pCtrl = new AbortController();
        const pTimer = setTimeout(() => pCtrl.abort(), 7000);
        const res = await fetch(pageUrl, {
          signal: pCtrl.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; WebAuditProCrawler/3.0)',
            Accept: 'text/html',
          },
        });
        clearTimeout(pTimer);

        statusCode = res.status;
        if (!res.ok) {
          issues.push(`HTTP ${statusCode} response status`);
        }

        const html = await res.text();

        // Extract title
        const tMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
        if (tMatch && tMatch[1]) {
          title = tMatch[1].trim();
        } else {
          issues.push('Missing <title> tag');
        }

        // Extract meta description
        const dMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ||
                       html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
        if (dMatch && dMatch[1]) {
          metaDescription = dMatch[1].trim();
        } else {
          issues.push('Missing meta description');
        }

        // Extract H1
        const h1Matches = [...html.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/gi)];
        h1Count = h1Matches.length;
        if (h1Count === 0) {
          issues.push('Missing <h1> heading');
        } else if (h1Count > 1) {
          issues.push(`Multiple <h1> headings (${h1Count})`);
        }
        if (h1Matches[0]) {
          h1 = h1Matches[0][1].replace(/<[^>]+>/g, '').trim().slice(0, 100);
        }

        // Canonical
        const canMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i);
        if (canMatch && canMatch[1]) {
          canonical = canMatch[1].trim();
        }

        // Robots noindex
        if (html.match(/<meta[^>]+name=["']robots["'][^>]+content=["'][^"']*noindex[^"']*["']/i)) {
          isIndexable = false;
          issues.push('Robots noindex tag detected');
        }
      } catch (err: any) {
        statusCode = 0;
        issues.push(`Connection error: ${err.message || 'Timeout'}`);
      }

      const responseTimeMs = Date.now() - pStart;
      if (responseTimeMs > 1200) {
        issues.push(`Slow response time (${responseTimeMs}ms)`);
      }

      return {
        url: pageUrl,
        statusCode,
        responseTimeMs,
        title,
        titleLength: title ? title.length : 0,
        metaDescription,
        metaDescLength: metaDescription ? metaDescription.length : 0,
        h1,
        h1Count,
        canonical,
        isIndexable,
        issues,
      };
    });

    const res = await Promise.all(batchPromises);
    crawledPages.push(...res);
  }

  // Cross-page duplicate title detection
  const titleMap = new Map<string, string[]>();
  for (const page of crawledPages) {
    if (page.title) {
      const clean = page.title.toLowerCase().trim();
      const list = titleMap.get(clean) || [];
      list.push(page.url);
      titleMap.set(clean, list);
    }
  }

  const duplicateTitleGroups: { title: string; urls: string[] }[] = [];
  let duplicateTitlesCount = 0;
  for (const [titleStr, urls] of titleMap.entries()) {
    if (urls.length > 1) {
      duplicateTitlesCount += urls.length;
      duplicateTitleGroups.push({ title: titleStr, urls });
      // Add issue to pages
      for (const p of crawledPages) {
        if (urls.includes(p.url) && !p.issues.some((iss) => iss.includes('Duplicate title'))) {
          p.issues.push(`Duplicate title across ${urls.length} pages`);
        }
      }
    }
  }

  const missingTitles = crawledPages.filter((p) => !p.title).length;
  const missingMetaDescriptions = crawledPages.filter((p) => !p.metaDescription).length;
  const missingH1 = crawledPages.filter((p) => p.h1Count === 0).length;
  const multipleH1 = crawledPages.filter((p) => p.h1Count > 1).length;
  const httpErrors = crawledPages.filter((p) => p.statusCode >= 400 || p.statusCode === 0).length;
  const slowPages = crawledPages.filter((p) => p.responseTimeMs > 1200).length;

  const totalTime = crawledPages.reduce((acc, p) => acc + p.responseTimeMs, 0);
  const avgResponseTime = crawledPages.length ? Math.round(totalTime / crawledPages.length) : 0;

  // Calculate site-wide crawl score
  let penalty = 0;
  penalty += httpErrors * 25;
  penalty += missingTitles * 15;
  penalty += duplicateTitlesCount * 5;
  penalty += missingMetaDescriptions * 8;
  penalty += missingH1 * 8;
  penalty += slowPages * 4;

  const healthScore = Math.max(0, Math.min(100, Math.round(100 - penalty / Math.max(1, crawledPages.length / 5))));

  return {
    targetUrl,
    sitemapFound,
    sitemapUrl,
    totalPagesDiscovered: discoveredUrls.size,
    totalPagesCrawled: crawledPages.length,
    averageResponseTimeMs: avgResponseTime,
    healthScore,
    issuesSummary: {
      duplicateTitles: duplicateTitleGroups.length,
      missingTitles,
      missingMetaDescriptions,
      missingH1,
      multipleH1,
      httpErrors,
      slowPages,
    },
    duplicateTitleGroups,
    pages: crawledPages,
  };
}
