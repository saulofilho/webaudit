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
  inboundInternalLinksCount?: number;
  outboundInternalLinksCount?: number;
  outboundExternalLinksCount?: number;
}

export interface DiscoveredBacklinkItem {
  id: string;
  sourceUrl: string;
  targetUrl: string;
  anchorText: string;
  linkType: 'internal' | 'external_referral' | 'nofollow' | 'ugc' | 'sponsored';
  isDoFollow: boolean;
  sourceEstimatedAuthority: number;
  trustWeight: number;
  equityScore: number;
  status: 'active' | 'redirected' | 'broken' | 'suspicious';
  detectedVia: 'crawler_html' | 'sitemap_cross_reference' | 'canonical_cluster';
}

export interface BacklinkAuditSummary {
  totalLinksDiscovered: number;
  internalCrossLinks: number;
  externalOutboundLinks: number;
  doFollowRatio: number;
  brokenLinksFound: number;
  uniqueLinkingNodes: number;
  topAnchors: { anchor: string; count: number; percentage: number }[];
  deepLinkRatio: number;
  backlinkItems: DiscoveredBacklinkItem[];
}

export interface PageRankSimulationData {
  calculatedDomainAuthority: number;
  estimatedPageRank: number;
  dampingFactor: number;
  iterations: number;
  confidenceScore: number;
  linkEquityDistribution: {
    pageUrl: string;
    pageTitle?: string;
    internalPageRank: number;
    rawEquityShare: number;
    inboundLinkCount: number;
    outboundLinkCount: number;
    depthLevel: number;
    status: 'high_authority' | 'moderate' | 'diluted' | 'orphan_risk';
  }[];
  authorityBreakdown: {
    linkQuantityScore: number;
    equityFlowScore: number;
    doFollowQualityScore: number;
    architectureDepthScore: number;
    technicalHealthPenalty: number;
  };
  rankTier: 'Pioneer (0-20)' | 'Emerging (21-40)' | 'Established (41-60)' | 'Authoritative (61-80)' | 'Industry Leader (81-100)';
  insights: string[];
  recommendations: string[];
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
  backlinkAudit?: BacklinkAuditSummary;
  pageRankSimulation?: PageRankSimulationData;
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
  const discoveredBacklinks: DiscoveredBacklinkItem[] = [];
  const internalLinkGraph = new Map<string, Set<string>>(); // source -> target URLs
  const inboundLinkCounts = new Map<string, number>();
  const outboundInternalCounts = new Map<string, number>();
  const outboundExternalCounts = new Map<string, number>();
  const anchorTextFrequency = new Map<string, number>();
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
      const pageLinks: { href: string; text: string; rel: string }[] = [];

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

        // Extract hyperlinks for backlink & PageRank graph
        const aRegex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
        let aMatch;
        let pageInternalCount = 0;
        let pageExternalCount = 0;

        while ((aMatch = aRegex.exec(html)) !== null) {
          const attrs = aMatch[1] || '';
          const aText = (aMatch[2] || '').replace(/<[^>]+>/g, '').trim();
          const hrefM = attrs.match(/\bhref\s*=\s*["']([^"']*)["']/i);
          const relM = attrs.match(/\brel\s*=\s*["']([^"']*)["']/i);
          const relVal = relM ? relM[1].toLowerCase() : '';

          if (hrefM && hrefM[1]) {
            const resolvedTarget = resolveUrl(hrefM[1], pageUrl);
            if (resolvedTarget) {
              const isNoFollow = relVal.includes('nofollow');
              const isUgc = relVal.includes('ugc');
              const isSponsored = relVal.includes('sponsored');

              let isInternalTarget = false;
              try {
                const targetObj = new URL(resolvedTarget);
                isInternalTarget = targetObj.hostname.toLowerCase() === baseHost || targetObj.hostname.toLowerCase().endsWith('.' + baseHost);
              } catch {
                // ignore
              }

              if (isInternalTarget) {
                pageInternalCount++;
                if (!internalLinkGraph.has(pageUrl)) {
                  internalLinkGraph.set(pageUrl, new Set());
                }
                internalLinkGraph.get(pageUrl)!.add(resolvedTarget);

                inboundLinkCounts.set(resolvedTarget, (inboundLinkCounts.get(resolvedTarget) || 0) + 1);
              } else {
                pageExternalCount++;
              }

              // Store top anchor text statistics
              const cleanAnchor = aText ? aText.slice(0, 40) : '(Empty Anchor)';
              anchorTextFrequency.set(cleanAnchor, (anchorTextFrequency.get(cleanAnchor) || 0) + 1);

              // Backlink sample record
              if (discoveredBacklinks.length < 50) {
                const linkType: 'internal' | 'external_referral' | 'nofollow' | 'ugc' | 'sponsored' = isNoFollow
                  ? 'nofollow'
                  : isUgc
                  ? 'ugc'
                  : isSponsored
                  ? 'sponsored'
                  : isInternalTarget
                  ? 'internal'
                  : 'external_referral';

                discoveredBacklinks.push({
                  id: `bl-${discoveredBacklinks.length + 1}-${Math.random().toString(36).slice(2, 6)}`,
                  sourceUrl: pageUrl,
                  targetUrl: resolvedTarget,
                  anchorText: cleanAnchor,
                  linkType,
                  isDoFollow: !isNoFollow,
                  sourceEstimatedAuthority: isInternalTarget ? 45 : 30,
                  trustWeight: isNoFollow ? 0.1 : 0.85,
                  equityScore: isNoFollow ? 0.05 : 0.75,
                  status: 'active',
                  detectedVia: 'crawler_html',
                });
              }
            }
          }
        }

        outboundInternalCounts.set(pageUrl, pageInternalCount);
        outboundExternalCounts.set(pageUrl, pageExternalCount);
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

  // Populate link counts onto crawledPages
  for (const p of crawledPages) {
    p.inboundInternalLinksCount = inboundLinkCounts.get(p.url) || 0;
    p.outboundInternalLinksCount = outboundInternalCounts.get(p.url) || 0;
    p.outboundExternalLinksCount = outboundExternalCounts.get(p.url) || 0;
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

  // Compute PageRank Simulation & Domain Authority from Backlink Audit
  const totalInternalCrossLinks = Array.from(outboundInternalCounts.values()).reduce((a, b) => a + b, 0);
  const totalExternalOutboundLinks = Array.from(outboundExternalCounts.values()).reduce((a, b) => a + b, 0);
  const totalDiscoveredLinks = totalInternalCrossLinks + totalExternalOutboundLinks;

  const doFollowCount = discoveredBacklinks.filter((b) => b.isDoFollow).length;
  const doFollowRatio = discoveredBacklinks.length > 0 ? Math.round((doFollowCount / discoveredBacklinks.length) * 100) : 85;

  // Top anchor texts
  const sortedAnchors = Array.from(anchorTextFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  const totalAnchorsSum = sortedAnchors.reduce((acc, curr) => acc + curr[1], 0) || 1;
  const topAnchors = sortedAnchors.map(([anchor, count]) => ({
    anchor,
    count,
    percentage: Math.round((count / totalAnchorsSum) * 100),
  }));

  // Deep link ratio (% links not pointing to homepage)
  const homePath = new URL(targetUrl).pathname;
  const subpageLinks = discoveredBacklinks.filter((b) => {
    try {
      const u = new URL(b.targetUrl);
      return u.pathname !== '/' && u.pathname !== homePath && u.pathname !== '';
    } catch {
      return false;
    }
  }).length;
  const deepLinkRatio = discoveredBacklinks.length > 0 ? Math.round((subpageLinks / discoveredBacklinks.length) * 100) : 60;

  // PageRank Iteration Algorithm (Damping = 0.85)
  const damping = 0.85;
  const N = Math.max(1, crawledPages.length);
  const pageRankScores = new Map<string, number>();

  // Initialize PR = 1 / N
  for (const page of crawledPages) {
    pageRankScores.set(page.url, 1.0 / N);
  }

  // Iterate 20 times for mathematical convergence
  const iterations = 20;
  for (let it = 0; it < iterations; it++) {
    const nextScores = new Map<string, number>();
    for (const page of crawledPages) {
      let incomingSum = 0;
      for (const [sourceUrl, targets] of internalLinkGraph.entries()) {
        if (targets.has(page.url)) {
          const sourcePR = pageRankScores.get(sourceUrl) || (1.0 / N);
          const outDegree = Math.max(1, targets.size);
          incomingSum += sourcePR / outDegree;
        }
      }
      const newPR = ((1.0 - damping) / N) + (damping * incomingSum);
      nextScores.set(page.url, newPR);
    }
    for (const [url, pr] of nextScores.entries()) {
      pageRankScores.set(url, pr);
    }
  }

  // Normalize PR to 0.0 - 10.0 scale and compute raw equity shares
  let maxPR = 0;
  for (const pr of pageRankScores.values()) {
    if (pr > maxPR) maxPR = pr;
  }
  maxPR = maxPR || 1.0;

  const totalPRSum = Array.from(pageRankScores.values()).reduce((a, b) => a + b, 0) || 1.0;

  const linkEquityDistribution = crawledPages.map((page) => {
    const rawPR = pageRankScores.get(page.url) || (1.0 / N);
    const scaledScore = Math.round(((rawPR / maxPR) * 10) * 10) / 10; // e.g. 7.4
    const equityShare = Math.round((rawPR / totalPRSum) * 1000) / 10;
    const inCount = inboundLinkCounts.get(page.url) || 0;
    const outCount = outboundInternalCounts.get(page.url) || 0;

    // Depth level estimation
    let depth = 0;
    try {
      const u = new URL(page.url);
      const segments = u.pathname.split('/').filter(Boolean);
      depth = segments.length;
    } catch {
      depth = 1;
    }

    let status: 'high_authority' | 'moderate' | 'diluted' | 'orphan_risk' = 'moderate';
    if (inCount === 0 && page.url !== targetUrl) {
      status = 'orphan_risk';
    } else if (scaledScore >= 6.5) {
      status = 'high_authority';
    } else if (scaledScore < 2.5 || outCount > 40) {
      status = 'diluted';
    }

    return {
      pageUrl: page.url,
      pageTitle: page.title,
      internalPageRank: Math.min(10, Math.max(0.5, scaledScore)),
      rawEquityShare: equityShare,
      inboundLinkCount: inCount,
      outboundLinkCount: outCount,
      depthLevel: depth,
      status,
    };
  });

  // Calculate Estimated Domain Authority (0 - 100)
  // Factors:
  // 1. Link volume & cross-linking density (25%)
  // 2. Link equity distribution & no orphan pages (25%)
  // 3. DoFollow authority ratio (20%)
  // 4. Site architecture depth & sitemap presence (15%)
  // 5. Technical crawl health penalty (15%)
  const density = Math.min(100, Math.round((totalInternalCrossLinks / Math.max(1, crawledPages.length)) * 12));
  const linkQuantityScore = Math.min(100, Math.max(20, density + (sitemapFound ? 20 : 0)));

  const orphanCount = linkEquityDistribution.filter((l) => l.status === 'orphan_risk').length;
  const orphanPenalty = orphanCount * 12;
  const equityFlowScore = Math.max(10, Math.min(100, Math.round(85 - orphanPenalty)));

  const doFollowQualityScore = Math.min(100, Math.max(25, doFollowRatio));

  const averageDepth = linkEquityDistribution.reduce((acc, c) => acc + c.depthLevel, 0) / Math.max(1, linkEquityDistribution.length);
  const architectureDepthScore = averageDepth <= 3 ? 90 : averageDepth <= 4 ? 70 : 45;

  const technicalHealthPenalty = Math.round((100 - healthScore) * 0.7);

  const rawDA = Math.round(
    linkQuantityScore * 0.25 +
    equityFlowScore * 0.25 +
    doFollowQualityScore * 0.20 +
    architectureDepthScore * 0.15 -
    technicalHealthPenalty * 0.15
  );
  const calculatedDomainAuthority = Math.max(8, Math.min(98, rawDA));

  // Estimated PageRank 0-10 on log scale based on DA and top internal page rank
  const avgPR = linkEquityDistribution.reduce((acc, c) => acc + c.internalPageRank, 0) / Math.max(1, linkEquityDistribution.length);
  const estimatedPageRank = Math.round(((calculatedDomainAuthority / 10) * 0.6 + avgPR * 0.4) * 10) / 10;

  let rankTier: 'Pioneer (0-20)' | 'Emerging (21-40)' | 'Established (41-60)' | 'Authoritative (61-80)' | 'Industry Leader (81-100)' = 'Established (41-60)';
  if (calculatedDomainAuthority >= 81) rankTier = 'Industry Leader (81-100)';
  else if (calculatedDomainAuthority >= 61) rankTier = 'Authoritative (61-80)';
  else if (calculatedDomainAuthority >= 41) rankTier = 'Established (41-60)';
  else if (calculatedDomainAuthority >= 21) rankTier = 'Emerging (21-40)';
  else rankTier = 'Pioneer (0-20)';

  const insights: string[] = [];
  if (sitemapFound) {
    insights.push(`Sitemap discovered at ${sitemapUrl || 'root'} accelerates search engine crawl discovery and link equity distribution.`);
  } else {
    insights.push('No XML sitemap found; search engine bots must rely entirely on internal DOM hyperlinks to discover subpages.');
  }
  if (orphanCount > 0) {
    insights.push(`Detected ${orphanCount} potential orphan page(s) with 0 discovered inbound internal links, severely limiting their PageRank potential.`);
  } else {
    insights.push('Healthy interlinking detected: 100% of discovered pages receive internal equity flow.');
  }
  if (doFollowRatio >= 80) {
    insights.push(`High DoFollow link retention ratio (${doFollowRatio}%) ensures strong equity preservation across internal pathways.`);
  }

  const recommendations: string[] = [];
  if (orphanCount > 0) {
    recommendations.push('Link orphan pages from key category hubs or footer navigation to pass authoritative PageRank.');
  }
  if (deepLinkRatio < 40) {
    recommendations.push('Increase contextual deep-linking from top-level landing pages to sub-level articles to distribute PageRank more evenly.');
  }
  if (!sitemapFound) {
    recommendations.push('Generate and submit a standard sitemap.xml to Google Search Console to maximize crawler indexation efficiency.');
  }
  if (doFollowRatio < 70) {
    recommendations.push('Review nofollow attributes on internal navigation links; internal links should normally be dofollow.');
  }

  const backlinkAudit: BacklinkAuditSummary = {
    totalLinksDiscovered: totalDiscoveredLinks,
    internalCrossLinks: totalInternalCrossLinks,
    externalOutboundLinks: totalExternalOutboundLinks,
    doFollowRatio,
    brokenLinksFound: httpErrors,
    uniqueLinkingNodes: internalLinkGraph.size,
    topAnchors,
    deepLinkRatio,
    backlinkItems: discoveredBacklinks,
  };

  const pageRankSimulation: PageRankSimulationData = {
    calculatedDomainAuthority,
    estimatedPageRank: Math.min(10.0, Math.max(1.0, estimatedPageRank)),
    dampingFactor: damping,
    iterations,
    confidenceScore: Math.min(95, Math.round(60 + crawledPages.length * 3)),
    linkEquityDistribution,
    authorityBreakdown: {
      linkQuantityScore,
      equityFlowScore,
      doFollowQualityScore,
      architectureDepthScore,
      technicalHealthPenalty,
    },
    rankTier,
    insights,
    recommendations,
  };

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
    backlinkAudit,
    pageRankSimulation,
  };
}
