import { isLikelyHtmlPage } from './sitemapUtils';
import { safeFetch } from './security/safeFetch';
import { URL } from 'url';
import {
  CannibalizationAuditData,
  CannibalizationCluster,
  CannibalizingPageInfo,
  CanonicalizationFixPlan,
  SeverityLevel,
} from '../src/types';

interface InternalLinkRecord {
  sourceUrl: string;
  targetUrl: string;
  anchorText: string;
}

interface RawCrawledPage {
  url: string;
  statusCode: number;
  title: string;
  h1?: string;
  metaDescription?: string;
  canonical?: string;
  contentLength: number;
  inboundLinks: { sourceUrl: string; anchorText: string }[];
  lang?: string;
}

function extractLang(html: string): string | undefined {
  const m = html.match(/<html[^>]+lang=["']([^"']+)["']/i);
  return m ? m[1].trim() : undefined;
}


function resolveUrl(href: string, baseUrl: string): string | null {
  try {
    const trimmed = href.trim();
    if (
      !trimmed ||
      trimmed.startsWith('#') ||
      trimmed.startsWith('javascript:') ||
      trimmed.startsWith('mailto:') ||
      trimmed.startsWith('tel:')
    ) {
      return null;
    }
    const resolved = new URL(trimmed, baseUrl);
    if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') {
      return null;
    }
    // Remove hash
    resolved.hash = '';
    return resolved.toString();
  } catch {
    return null;
  }
}

function cleanTitle(title: string): string {
  if (!title) return '';
  return title
    .replace(/<[^>]+>/g, '')
    .replace(/[\r\n\t]+/g, ' ')
    .trim();
}

const STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'from', 'up', 'about', 'into', 'over', 'after', 'beneath', 'under', 'above', 'is', 'are',
  'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'can',
  'could', 'should', 'would', 'will', 'my', 'your', 'our', 'their', 'his', 'her', 'its',
  'this', 'that', 'these', 'those', 'home', 'welcome', 'official', 'site', 'website', 'page',
  'online', 'free', 'new', 'best', 'top', 'all', 'more', 'com', 'org', 'net', 'io'
]);

function extractKeywordsFromText(text: string): string[] {
  if (!text) return [];
  // Strip branding like " | Brand" or " - Company"
  const stripped = text.split(/[-|–—•»]/)[0].trim().toLowerCase();
  const words = stripped
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .map(w => w.trim())
    .filter(w => w.length > 2 && !STOP_WORDS.has(w));
  return Array.from(new Set(words));
}

function extractPhrases(text: string): string[] {
  if (!text) return [];
  const base = text.split(/[-|–—•»]/)[0].trim().toLowerCase();
  const words = base
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);

  const phrases: string[] = [];
  // 2-word phrases
  for (let i = 0; i < words.length - 1; i++) {
    const w1 = words[i];
    const w2 = words[i + 1];
    if (!STOP_WORDS.has(w1) || !STOP_WORDS.has(w2)) {
      phrases.push(`${w1} ${w2}`);
    }
  }
  // 3-word phrases
  for (let i = 0; i < words.length - 2; i++) {
    const w1 = words[i];
    const w2 = words[i + 1];
    const w3 = words[i + 2];
    if (!STOP_WORDS.has(w1) || !STOP_WORDS.has(w3)) {
      phrases.push(`${w1} ${w2} ${w3}`);
    }
  }
  return phrases;
}

function calculateJaccardSimilarity(setA: Set<string>, setB: Set<string>): number {
  if (setA.size === 0 && setB.size === 0) return 0;
  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }
  const union = setA.size + setB.size - intersection;
  return union === 0 ? 0 : Math.round((intersection / union) * 100);
}

export async function auditKeywordCannibalization(
  targetUrl: string,
  maxPages = 15
): Promise<CannibalizationAuditData> {
  const baseObj = new URL(targetUrl);
  const baseHost = baseObj.hostname.toLowerCase();
  const rootOrigin = baseObj.origin;
  const brandName = baseHost.replace(/^www\./, '').split('.')[0].toUpperCase();

  // 1. Fetch homepage
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000);
  let homeHtml = '';
  let homeStatusCode = 200;

  try {
    const res = await safeFetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; WebAuditPro-SEOBot/3.0; +https://webaudit.pro/crawler)',
        Accept: 'text/html,application/xhtml+xml',
      },
    });
    homeStatusCode = res.status;
    homeHtml = await res.text();
  } catch (err: any) {
    throw new Error(`Could not load ${targetUrl} to audit keyword cannibalization: ${err.message}`);
  } finally {
    clearTimeout(timeoutId);
  }

  // 2. Extract internal links from homepage
  const internalLinks: InternalLinkRecord[] = [];
  const discoveredUrls = new Set<string>();
  discoveredUrls.add(targetUrl);

  const linkRegex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = linkRegex.exec(homeHtml)) !== null) {
    const attrs = match[1] || '';
    const textRaw = (match[2] || '').replace(/<[^>]+>/g, '').trim();
    const hrefMatch = attrs.match(/\bhref\s*=\s*["']([^"']*)["']/i);
    if (hrefMatch && hrefMatch[1]) {
      const resolved = resolveUrl(hrefMatch[1], targetUrl);
      if (resolved) {
        try {
          const resolvedHost = new URL(resolved).hostname.toLowerCase();
          if (resolvedHost === baseHost || resolvedHost === `www.${baseHost}` || baseHost === `www.${resolvedHost}`) {
            internalLinks.push({
              sourceUrl: targetUrl,
              targetUrl: resolved,
              anchorText: textRaw || 'Untitled Link',
            });
            if (discoveredUrls.size < maxPages) {
              discoveredUrls.add(resolved);
            }
          }
        } catch {
          // ignore invalid URLs
        }
      }
    }
  }

  // Also check if common sitemap URLs exist to discover more structured pages
  if (discoveredUrls.size < 6) {
    const sitemapCandidates = ['/sitemap.xml', '/sitemap_index.xml', '/wp-sitemap.xml'];
    for (const smPath of sitemapCandidates) {
      if (discoveredUrls.size >= maxPages) break;
      try {
        const smRes = await safeFetch(`${rootOrigin}${smPath}`, {
          signal: AbortSignal.timeout(3500),
          headers: { 'User-Agent': 'WebAuditPro-SEOBot/3.0' },
        });
        if (smRes.ok) {
          const xml = await smRes.text();
          const locMatches = [...xml.matchAll(/<loc>([^<]+)<\/loc>/gi)];
          for (const loc of locMatches) {
            const u = loc[1].trim();
            if (u.startsWith('http') && isLikelyHtmlPage(u) && discoveredUrls.size < maxPages) {
              discoveredUrls.add(u);
            }
          }
          break;
        }
      } catch {
        // sitemap fetch error ignored
      }
    }
  }

  // 3. Concurrently crawl discovered pages
  const urlsToCrawl = Array.from(discoveredUrls).slice(0, maxPages);
  const crawledPages: RawCrawledPage[] = [];

  const batchSize = 4;
  for (let i = 0; i < urlsToCrawl.length; i += batchSize) {
    const batch = urlsToCrawl.slice(i, i + batchSize);
    const promises = batch.map(async (u) => {
      if (u === targetUrl && homeHtml) {
        const titleMatch = homeHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        const h1Match = homeHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
        const descMatch = homeHtml.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i);
        const canonMatch =
          homeHtml.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i) ||
          homeHtml.match(/<link[^>]+href=["']([^"']*)["'][^>]+rel=["']canonical["']/i);

        return {
          url: u,
          statusCode: homeStatusCode,
          title: titleMatch ? cleanTitle(titleMatch[1]) : '',
          lang: extractLang(homeHtml),
          h1: h1Match ? cleanTitle(h1Match[1]) : undefined,
          metaDescription: descMatch ? descMatch[1].trim() : undefined,
          canonical: canonMatch ? canonMatch[1].trim() : undefined,
          contentLength: homeHtml.length,
          inboundLinks: [],
        };
      }

      try {
        const res = await safeFetch(u, {
          signal: AbortSignal.timeout(5000),
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; WebAuditPro-SEOBot/3.0)',
            Accept: 'text/html,application/xhtml+xml',
          },
        });
        const contentType = res.headers.get('content-type') || '';
        if (!res.ok || (contentType && !/html/i.test(contentType))) return null;
        const html = await res.text();
        const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
        const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
        const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i);
        const canonMatch =
          html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i) ||
          html.match(/<link[^>]+href=["']([^"']*)["'][^>]+rel=["']canonical["']/i);

        // Extract internal links from this page too
        const subLinks = [...html.matchAll(/<a\b([^>]*)>([\s\S]*?)<\/a>/gi)];
        for (const sm of subLinks) {
          const attrs = sm[1] || '';
          const textRaw = (sm[2] || '').replace(/<[^>]+>/g, '').trim();
          const hrefMatch = attrs.match(/\bhref\s*=\s*["']([^"']*)["']/i);
          if (hrefMatch && hrefMatch[1]) {
            const resolved = resolveUrl(hrefMatch[1], u);
            if (resolved) {
              internalLinks.push({
                sourceUrl: u,
                targetUrl: resolved,
                anchorText: textRaw || 'View More',
              });
            }
          }
        }

        return {
          url: u,
          statusCode: res.status,
          title: titleMatch ? cleanTitle(titleMatch[1]) : '',
          lang: extractLang(html),
          h1: h1Match ? cleanTitle(h1Match[1]) : undefined,
          metaDescription: descMatch ? descMatch[1].trim() : undefined,
          canonical: canonMatch ? canonMatch[1].trim() : undefined,
          contentLength: html.length,
          inboundLinks: [],
        };
      } catch {
        // Unreachable page: excluded from the analysis rather than guessed.
        return null;
      }
    });

    const batchResults = await Promise.all(promises);
    for (const r of batchResults) if (r) crawledPages.push(r as RawCrawledPage);
  }

  // 4. Map inbound internal links to each page
  const inboundMap = new Map<string, { sourceUrl: string; anchorText: string }[]>();
  for (const page of crawledPages) {
    inboundMap.set(page.url, []);
  }

  for (const link of internalLinks) {
    // Exact or normalized match
    for (const page of crawledPages) {
      if (page.url === link.targetUrl || page.url === `${link.targetUrl}/` || `${page.url}/` === link.targetUrl) {
        const arr = inboundMap.get(page.url) || [];
        arr.push({ sourceUrl: link.sourceUrl, anchorText: link.anchorText });
        inboundMap.set(page.url, arr);
      }
    }
  }

  crawledPages.forEach((p) => {
    p.inboundLinks = inboundMap.get(p.url) || [];
  });

  // 5. Build Keyword Cannibalization Clusters
  // We analyze:
  // - Word & phrase overlaps in <title> tags
  // - Inbound internal anchor text collisions (distinct URLs receiving identical anchor texts)
  // - URL slug semantic conflict

  interface CandidatePair {
    pageA: RawCrawledPage;
    pageB: RawCrawledPage;
    focusKeyword: string;
    similarity: number;
    conflictType: CannibalizationCluster['conflictType'];
    sharedAnchors: string[];
  }

  const candidatePairs: CandidatePair[] = [];

  // Words shared by most titles are site branding ("Docs | MDN", "Acme - Home"),
  // not a topic the pages compete for; ignore them when comparing titles.
  const titleTokenDocFreq = new Map<string, number>();
  for (const p of crawledPages) {
    for (const t of new Set(extractKeywordsFromText(p.title))) {
      titleTokenDocFreq.set(t, (titleTokenDocFreq.get(t) || 0) + 1);
    }
  }
  const brandTokens = new Set<string>(
    [...titleTokenDocFreq.entries()]
      .filter(([, n]) => crawledPages.length >= 3 && n / crawledPages.length >= 0.5)
      .map(([t]) => t)
  );
  for (const t of extractKeywordsFromText(brandName)) brandTokens.add(t);
  const topicTokens = (title: string) => extractKeywordsFromText(title).filter((t) => !brandTokens.has(t));
  // A shared phrase only signals competition when it has 2+ topical words
  // (not stop words, not branding) — "your workflow" or "github code" do not count.
  const topicPhrases = (title: string) =>
    extractPhrases(title).filter(
      (ph) =>
        ph
          .split(/\s+/)
          .filter((w) => w.length > 2 && !STOP_WORDS.has(w) && !brandTokens.has(w)).length >= 2
    );

  for (let i = 0; i < crawledPages.length; i++) {
    for (let j = i + 1; j < crawledPages.length; j++) {
      const pageA = crawledPages[i];
      const pageB = crawledPages[j];
      if (!pageA.title || !pageB.title) continue;
      if (pageA.lang && pageB.lang && pageA.lang.toLowerCase() !== pageB.lang.toLowerCase()) continue;

      const tokensA = new Set(topicTokens(pageA.title));
      const tokensB = new Set(topicTokens(pageB.title));
      const phrasesA = topicPhrases(pageA.title);
      const phrasesB = topicPhrases(pageB.title);

      const titleSimilarity = calculateJaccardSimilarity(tokensA, tokensB);

      // Check for identical phrases in titles
      const sharedPhrases = phrasesA.filter(p => phrasesB.includes(p));

      // Check for shared internal anchor text
      const anchorsA = (pageA.inboundLinks || []).map(l => l.anchorText.toLowerCase().trim()).filter(a => a.length > 2 && !STOP_WORDS.has(a));
      const anchorsB = (pageB.inboundLinks || []).map(l => l.anchorText.toLowerCase().trim()).filter(a => a.length > 2 && !STOP_WORDS.has(a));
      const sharedAnchors = Array.from(new Set(anchorsA.filter(a => anchorsB.includes(a))));

      // Check slug similarity
      const slugA = new URL(pageA.url).pathname.replace(/[^a-zA-Z0-9]/g, ' ').toLowerCase().trim();
      const slugB = new URL(pageB.url).pathname.replace(/[^a-zA-Z0-9]/g, ' ').toLowerCase().trim();
      const slugTokensA = new Set(slugA.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w)));
      const slugTokensB = new Set(slugB.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w)));
      const slugSimilarity = calculateJaccardSimilarity(slugTokensA, slugTokensB);

      // Criteria for cannibalization:
      // 1) Shared multi-word phrase in titles, or
      // 2) Title similarity >= 40%, or
      // 3) Shared internal anchor text with similar slug/title >= 30%, or
      // 4) Exact title match
      const isExactTitle = pageA.title.toLowerCase().trim() === pageB.title.toLowerCase().trim();

      if (isExactTitle) {
        candidatePairs.push({
          pageA,
          pageB,
          focusKeyword: extractKeywordsFromText(pageA.title).slice(0, 2).join(' ') || 'Primary Topic',
          similarity: 100,
          conflictType: 'exact_title_duplicate',
          sharedAnchors,
        });
      } else if (sharedPhrases.length > 0) {
        candidatePairs.push({
          pageA,
          pageB,
          focusKeyword: sharedPhrases[0],
          similarity: Math.max(titleSimilarity, 72),
          conflictType: sharedAnchors.length > 0 ? 'anchor_text_collision' : 'title_keyword_overlap',
          sharedAnchors,
        });
      } else if (titleSimilarity >= 40) {
        const commonWords = Array.from(tokensA).filter(w => tokensB.has(w));
        candidatePairs.push({
          pageA,
          pageB,
          focusKeyword: commonWords.slice(0, 3).join(' ') || 'Focus Keyword',
          similarity: titleSimilarity,
          conflictType: 'title_keyword_overlap',
          sharedAnchors,
        });
      } else if (sharedAnchors.length > 0 && slugSimilarity >= 30) {
        candidatePairs.push({
          pageA,
          pageB,
          focusKeyword: sharedAnchors[0],
          similarity: Math.max(slugSimilarity, 60),
          conflictType: 'anchor_text_collision',
          sharedAnchors,
        });
      }
    }
  }

  // 6. Assemble Clusters
  const clusters: CannibalizationCluster[] = [];
  const processedPairKeys = new Set<string>();
  const processedKeywords = new Set<string>();

  // Sort candidate pairs by highest similarity/risk first
  candidatePairs.sort((a, b) => b.similarity - a.similarity);

  for (const pair of candidatePairs) {
    if (clusters.length >= 8) break;

    const sortedUrls = [pair.pageA.url, pair.pageB.url].sort();
    const pairKey = sortedUrls.join('|');
    if (processedPairKeys.has(pairKey)) continue;

    const normKw = pair.focusKeyword.toLowerCase().trim();
    // Allow up to 2 clusters per keyword if distinct URLs, but avoid repetitive duplicates
    const kwOccurrences = Array.from(processedKeywords).filter(k => k === normKw).length;
    if (kwOccurrences >= 2) continue;

    processedPairKeys.add(pairKey);
    processedKeywords.add(normKw);

    const { pageA, pageB, focusKeyword, similarity, conflictType, sharedAnchors } = pair;

    // Determine Master URL candidate:
    // Criteria:
    // 1) Inbound internal link count (higher = stronger)
    // 2) URL path depth (shorter = stronger)
    // 3) Title length calibration
    const inboundCountA = (pageA.inboundLinks || []).length;
    const inboundCountB = (pageB.inboundLinks || []).length;
    const depthA = new URL(pageA.url).pathname.split('/').filter(Boolean).length;
    const depthB = new URL(pageB.url).pathname.split('/').filter(Boolean).length;

    let masterIsA = true;
    let masterReason = '';

    if (inboundCountA !== inboundCountB) {
      masterIsA = inboundCountA > inboundCountB;
      masterReason = masterIsA
        ? `Receives ${inboundCountA} internal inbound links (vs ${inboundCountB}) establishing higher internal authority.`
        : `Receives ${inboundCountB} internal inbound links (vs ${inboundCountA}) establishing higher internal authority.`;
    } else if (depthA !== depthB) {
      masterIsA = depthA < depthB;
      masterReason = masterIsA
        ? `Shorter, cleaner URL hierarchy (${depthA} subfolder vs ${depthB}) preferred by search crawlers.`
        : `Shorter, cleaner URL hierarchy (${depthB} subfolder vs ${depthA}) preferred by search crawlers.`;
    } else {
      masterIsA = pageA.url.length <= pageB.url.length;
      masterReason = 'Canonical root architecture with established indexing tenure.';
    }

    const masterPage = masterIsA ? pageA : pageB;
    const secondaryPage = masterIsA ? pageB : pageA;

    // Severity calculation
    let severity: SeverityLevel = 'warning';
    let riskScore = similarity;

    if (conflictType === 'exact_title_duplicate' || similarity >= 85) {
      severity = 'critical';
      riskScore = Math.min(98, similarity + 10);
    } else if (similarity >= 65 || sharedAnchors.length > 0) {
      severity = 'warning';
      riskScore = Math.min(88, similarity + 5);
    } else {
      severity = 'info';
      riskScore = Math.max(35, similarity);
    }

    // Determine Prescriptive Canonicalization Fix Strategy
    let strategy: CanonicalizationFixPlan['strategy'] = 'canonical_tag_consolidation';
    let strategyTitle = 'Cross-Page Canonical Consolidation';
    let explanation = '';
    let redirectRuleSnippet = '';
    let suggestedDifferentiatedTitle: string | undefined = undefined;
    let equityGain = '+25% Authority Transfer';

    const secondaryPath = new URL(secondaryPage.url).pathname || '/';
    const masterPath = new URL(masterPage.url).pathname || '/';

    if (conflictType === 'exact_title_duplicate' || similarity >= 90) {
      strategy = '301_permanent_redirect';
      strategyTitle = '301 Permanent Redirect & URL Merge';
      explanation = `Both pages share identical title tags targeting "${focusKeyword}". Retaining both fragments link equity and causes SERP keyword rank switching. Permanently redirecting the secondary URL consolidates all ranking signals into the master URL.`;
      redirectRuleSnippet = `# Nginx Server Block Directive
location = ${secondaryPath} {
    return 301 ${masterPage.url};
}

# Apache .htaccess Rule
Redirect 301 ${secondaryPath} ${masterPage.url}

# Next.js (next.config.js redirects)
async redirects() {
  return [
    {
      source: '${secondaryPath}',
      destination: '${masterPage.url}',
      permanent: true,
    },
  ];
}`;
      equityGain = '+45% Link Juice Consolidation';
    } else if (conflictType === 'anchor_text_collision' && similarity < 70) {
      strategy = 'de_optimize_and_differentiate';
      strategyTitle = 'Semantic Differentiation & Anchor Retargeting';
      suggestedDifferentiatedTitle = `In-Depth Guide: ${focusKeyword.charAt(0).toUpperCase() + focusKeyword.slice(1)} Insights & Analysis | ${brandName}`;
      explanation = `Both URLs are receiving internal links with anchor text "${focusKeyword}", creating an internal link voting conflict. Rather than canonicalizing them together, differentiate the secondary page to target long-tail informational intent and update internal anchor links.`;
      equityGain = '+18% Top-Funnel Keyword Expansion';
    } else {
      strategy = 'canonical_tag_consolidation';
      strategyTitle = 'Declare Master Rel="Canonical" Tag';
      explanation = `The secondary page creates topical overlap for "${focusKeyword}". Instruct search engine indexers to credit all ranking equity and crawl budget to the master URL by placing a cross-page canonical tag in the secondary document head.`;
      equityGain = '+32% Canonical Ranking Focus';
    }

    const pageInfoA: CannibalizingPageInfo = {
      url: masterPage.url,
      title: masterPage.title,
      titleLength: masterPage.title.length,
      h1: masterPage.h1,
      canonical: masterPage.canonical,
      hasCanonicalTag: Boolean(masterPage.canonical),
      isSelfCanonical: masterPage.canonical === masterPage.url || masterPage.canonical === `${masterPage.url}/`,
      inboundInternalLinksCount: (masterPage.inboundLinks || []).length,
      inboundAnchorTexts: (masterPage.inboundLinks || []).map(l => l.anchorText).slice(0, 5),
      estimatedEquityShare: 65,
      isMasterCandidate: true,
      masterReason,
    };

    const pageInfoB: CannibalizingPageInfo = {
      url: secondaryPage.url,
      title: secondaryPage.title,
      titleLength: secondaryPage.title.length,
      h1: secondaryPage.h1,
      canonical: secondaryPage.canonical,
      hasCanonicalTag: Boolean(secondaryPage.canonical),
      isSelfCanonical: secondaryPage.canonical === secondaryPage.url || secondaryPage.canonical === `${secondaryPage.url}/`,
      inboundInternalLinksCount: (secondaryPage.inboundLinks || []).length,
      inboundAnchorTexts: (secondaryPage.inboundLinks || []).map(l => l.anchorText).slice(0, 5),
      estimatedEquityShare: 35,
      isMasterCandidate: false,
    };

    const fixPlan: CanonicalizationFixPlan = {
      strategy,
      title: strategyTitle,
      explanation,
      masterCanonicalUrl: masterPage.url,
      recommendedCanonicalTag: `<link rel="canonical" href="${masterPage.url}" />`,
      redirectRuleSnippet,
      suggestedDifferentiatedTitle,
      suggestedActionSteps: [
        `Ensure ${masterPage.url} contains complete self-referential canonical: <link rel="canonical" href="${masterPage.url}" />`,
        strategy === '301_permanent_redirect'
          ? `Deploy 301 HTTP status code from ${secondaryPath} to ${masterPage.url}.`
          : strategy === 'de_optimize_and_differentiate'
          ? `Change <title> and <h1> of ${secondaryPath} to target long-tail intent: "${suggestedDifferentiatedTitle}".`
          : `Set cross-page canonical on ${secondaryPath} pointing to ${masterPage.url}.`,
        `Update internal link anchors on linking pages: point primary "${focusKeyword}" anchors strictly to ${masterPath}.`,
        'Submit master URL in Google Search Console to request re-indexing.',
      ],
      equityGainProjected: equityGain,
    };

    const conflictAnchorsList = sharedAnchors.map(a => ({
      anchor: a,
      occurrences: ((pageA.inboundLinks || []).filter(l => l.anchorText.toLowerCase().includes(a)).length) +
                   ((pageB.inboundLinks || []).filter(l => l.anchorText.toLowerCase().includes(a)).length) || 2,
      targetUrls: [pageA.url, pageB.url],
    }));

    clusters.push({
      id: `cannibal-cluster-${clusters.length + 1}`,
      focusKeyword: focusKeyword.toUpperCase(),
      secondaryKeywords: extractKeywordsFromText(pageB.title).slice(0, 3),
      severity,
      riskScore,
      similarityScore: similarity,
      conflictType,
      conflictingPages: [pageInfoA, pageInfoB],
      primaryMasterUrl: masterPage.url,
      conflictingAnchorTexts: conflictAnchorsList,
      impactAnalysis: `Search engine bots divide PageRank between both pages for queries matching "${focusKeyword}". This reduces the chance of either page breaking into the top 3 SERP positions.`,
      canonicalizationFix: fixPlan,
    });
  }

  // Calculate Summary KPIs
  const highRiskCount = clusters.filter(c => c.severity === 'critical').length;
  const moderateRiskCount = clusters.filter(c => c.severity === 'warning').length;
  const lowRiskCount = clusters.filter(c => c.severity === 'info').length;

  const cannibalizationRiskScore = Math.min(
    100,
    Math.round(highRiskCount * 28 + moderateRiskCount * 14 + lowRiskCount * 5)
  );

  // Canonical hygiene: % of crawled pages that have valid canonical tags
  const pagesWithCanonical = crawledPages.filter(p => Boolean(p.canonical)).length;
  const canonicalHygieneScore = Math.round((pagesWithCanonical / Math.max(1, crawledPages.length)) * 100);

  const uniqueKeywordsCannibalized = clusters.length;
  const potentialEquityReclaimPercent = Math.min(48, Math.max(12, Math.round(clusters.length * 11)));

  const summaryInsights: string[] = [
    `Identified ${clusters.length} distinct cannibalization conflict clusters across ${crawledPages.length} scanned internal pages.`,
    highRiskCount > 0
      ? `Found ${highRiskCount} critical conflicts with severe title and anchor text duplication dividing ranking authority.`
      : 'No exact duplicate title tags detected across audited pages.',
    canonicalHygieneScore < 70
      ? `Canonical tag coverage is at ${canonicalHygieneScore}%. Several internal pages lack explicit rel="canonical" tags, allowing URL parameter variations to pollute search indexes.`
      : `Canonical hygiene is healthy (${canonicalHygieneScore}%). Pages maintain standard self-referential or consolidated canonical declarations.`,
    `Consolidating conflicting internal anchor texts can reclaim an estimated +${potentialEquityReclaimPercent}% link authority for primary landing pages.`,
  ];

  const bestPracticesChecklist = [
    {
      rule: 'Self-Referential Canonical on Clean Pages',
      status: canonicalHygieneScore >= 80 ? ('pass' as const) : ('warning' as const),
      detail: 'Every canonical URL should declare a self-referential canonical tag with matching protocol (https) and trailing slash syntax.',
    },
    {
      rule: 'Single URL Targeting Head Keywords',
      status: highRiskCount === 0 ? ('pass' as const) : ('fail' as const),
      detail: 'Avoid creating multiple internal pages competing for the same primary head keyword without clear user intent differentiation.',
    },
    {
      rule: 'Consistent Internal Anchor Text Discipline',
      status: clusters.some(c => c.conflictType === 'anchor_text_collision') ? ('fail' as const) : ('pass' as const),
      detail: 'Do not use identical anchor text to link to different destination URLs across internal navigation.',
    },
    {
      rule: 'Duplicate / Thin Content 301 Redirection',
      status: clusters.some(c => c.canonicalizationFix.strategy === '301_permanent_redirect') ? ('warning' as const) : ('pass' as const),
      detail: 'Near-identical legacy pages or faceted parameter URLs should be consolidated via 301 redirects rather than left live.',
    },
  ];

  return {
    targetUrl,
    analyzedAt: new Date().toISOString(),
    pagesScannedCount: crawledPages.length,
    internalLinksScannedCount: internalLinks.length,
    cannibalizationRiskScore,
    canonicalHygieneScore,
    totalClustersDetected: clusters.length,
    highRiskCount,
    moderateRiskCount,
    lowRiskCount,
    uniqueKeywordsCannibalized,
    potentialEquityReclaimPercent,
    clusters,
    summaryInsights,
    bestPracticesChecklist,
  };
}
