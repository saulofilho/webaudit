import { safeFetch } from './security/safeFetch';
import { URL } from 'url';
import {
  ContentGapAnalysisData,
  CompetitorContentProfile,
  KeywordGapItem,
} from '../src/types';

interface ScrapedContentInfo {
  url: string;
  domain: string;
  title: string;
  description: string;
  wordCount: number;
  readingTimeMin: number;
  headingCounts: {
    h1: number;
    h2: number;
    h3: number;
  };
  imageCount: number;
  textTokens: string[];
  frequencyMap: Map<string, number>;
}

const COMMON_STOP_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
  'from', 'up', 'about', 'into', 'over', 'after', 'beneath', 'under', 'above', 'is', 'are',
  'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'can',
  'could', 'should', 'would', 'will', 'my', 'your', 'our', 'their', 'his', 'her', 'its',
  'this', 'that', 'these', 'those', 'home', 'welcome', 'official', 'site', 'website', 'page',
  'online', 'free', 'new', 'best', 'top', 'all', 'more', 'com', 'org', 'net', 'io', 'click',
  'here', 'read', 'learn', 'view', 'get', 'contact', 'privacy', 'policy', 'terms', 'rights',
  'reserved', 'copyright', 'menu', 'search', 'navigation', 'footer', 'header', 'login', 'sign'
]);

function cleanDomain(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl.startsWith('http') ? rawUrl : `https://${rawUrl}`);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return rawUrl.replace(/^https?:\/\//, '').split('/')[0].replace(/^www\./, '');
  }
}

function extractTextTokens(html: string): { tokens: string[]; frequencyMap: Map<string, number>; wordCount: number } {
  // Strip script, style, comments
  let cleanHtml = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ')
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');

  // Strip all HTML tags
  const rawText = cleanHtml.replace(/<[^>]+>/g, ' ');

  const words = rawText
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 2 && !/^\d+$/.test(w));

  const wordCount = Math.max(words.length, 1);
  const frequencyMap = new Map<string, number>();

  // Single words
  for (const w of words) {
    if (!COMMON_STOP_WORDS.has(w) && w.length >= 3) {
      frequencyMap.set(w, (frequencyMap.get(w) || 0) + 1);
    }
  }

  // 2-word key phrases
  for (let i = 0; i < words.length - 1; i++) {
    const w1 = words[i];
    const w2 = words[i + 1];
    if ((!COMMON_STOP_WORDS.has(w1) || !COMMON_STOP_WORDS.has(w2)) && w1.length > 2 && w2.length > 2) {
      const phrase = `${w1} ${w2}`;
      frequencyMap.set(phrase, (frequencyMap.get(phrase) || 0) + 1);
    }
  }

  // 3-word key phrases
  for (let i = 0; i < words.length - 2; i++) {
    const w1 = words[i];
    const w2 = words[i + 1];
    const w3 = words[i + 2];
    if (!COMMON_STOP_WORDS.has(w1) && !COMMON_STOP_WORDS.has(w3) && w1.length > 2 && w3.length > 2) {
      const phrase = `${w1} ${w2} ${w3}`;
      frequencyMap.set(phrase, (frequencyMap.get(phrase) || 0) + 1);
    }
  }

  return { tokens: words, frequencyMap, wordCount };
}

function parseHtmlMetadata(html: string, url: string): ScrapedContentInfo {
  const domain = cleanDomain(url);

  // Title
  const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '').trim() : `${domain} Homepage`;

  // Meta Description
  const descMatch = html.match(/<meta\b[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i) ||
                    html.match(/<meta\b[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
  const description = descMatch ? descMatch[1].trim() : `Overview and organic content published on ${domain}.`;

  // Headings
  const h1Matches = html.match(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi) || [];
  const h2Matches = html.match(/<h2\b[^>]*>([\s\S]*?)<\/h2>/gi) || [];
  const h3Matches = html.match(/<h3\b[^>]*>([\s\S]*?)<\/h3>/gi) || [];

  // Images
  const imgMatches = html.match(/<img\b[^>]*>/gi) || [];

  const { tokens, frequencyMap, wordCount } = extractTextTokens(html);
  const readingTimeMin = Math.max(1, Math.ceil(wordCount / 220));

  return {
    url,
    domain,
    title,
    description,
    wordCount,
    readingTimeMin,
    headingCounts: {
      h1: Math.max(1, h1Matches.length),
      h2: h2Matches.length,
      h3: h3Matches.length,
    },
    imageCount: imgMatches.length,
    textTokens: tokens,
    frequencyMap,
  };
}

async function fetchPageWithTimeout(targetUrl: string, timeoutMs = 4000): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const normalized = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;
    const res = await safeFetch(normalized, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) return null;
    const text = await res.text();
    return text;
  } catch {
    return null;
  }
}

/** Raised for invalid input (e.g. no competitor URLs) so the route can answer 400. */
export class ContentGapInputError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ContentGapInputError';
  }
}

function capitalize(str: string): string {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export async function auditContentGap(
  targetUrl: string,
  options?: {
    competitorUrls?: string[];
    primaryQuery?: string;
  }
): Promise<ContentGapAnalysisData> {
  const normTargetUrl = targetUrl.startsWith('http') ? targetUrl : `https://${targetUrl}`;
  const targetDomain = cleanDomain(normTargetUrl);

  // 1. Fetch & parse Target URL
  const targetHtml = await fetchPageWithTimeout(normTargetUrl, 8000);
  if (!targetHtml) {
    throw new Error(`Could not load ${normTargetUrl} to analyze its content.`);
  }
  const targetContent: ScrapedContentInfo = parseHtmlMetadata(targetHtml, normTargetUrl);

  // Derive primary query/niche
  const nicheQuery = options?.primaryQuery ||
    targetContent.title.split(/[-|–—:]/)[0].trim().toLowerCase() ||
    targetDomain.split('.')[0];

  // 2. Competitors: only real pages the user picked. There is no SERP data source,
  // so competitors are never guessed or invented.
  const competitorUrls = (options?.competitorUrls || [])
    .map((u) => (typeof u === 'string' ? u.trim() : ''))
    .filter(Boolean)
    .slice(0, 3);
  if (competitorUrls.length === 0) {
    throw new ContentGapInputError(
      'Provide 1 to 3 competitor URLs (pages ranking for your target query) to run the content gap analysis.'
    );
  }

  // 3. Gather competitor profiles & keyword maps (pages that fail to load are skipped)
  const competitorProfiles: CompetitorContentProfile[] = [];
  const competitorFreqMaps: Map<string, number>[] = [];
  const failedCompetitors: string[] = [];

  const fetched = await Promise.all(
    competitorUrls.map(async (u) => {
      const url = u.startsWith('http') ? u : `https://${u}`;
      return { url, html: await fetchPageWithTimeout(url, 8000) };
    })
  );
  for (const { url, html } of fetched) {
    if (!html) {
      failedCompetitors.push(url);
      continue;
    }
    const parsed = parseHtmlMetadata(html, url);
    const position = competitorProfiles.length + 1;
    const topKws = Array.from(parsed.frequencyMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([k]) => k);
    competitorProfiles.push({
      id: `comp-${position}-${parsed.domain.replace(/[^a-z0-9]/gi, '_')}`,
      url: parsed.url,
      domain: parsed.domain,
      serpRank: position,
      title: parsed.title,
      description: parsed.description,
      wordCount: parsed.wordCount,
      readingTimeMin: parsed.readingTimeMin,
      headingCounts: parsed.headingCounts,
      imageCount: parsed.imageCount,
      domainAuthority: null,
      topKeywords: topKws,
    });
    competitorFreqMaps.push(parsed.frequencyMap);
  }
  if (competitorProfiles.length === 0) {
    throw new Error(`None of the competitor pages could be loaded: ${failedCompetitors.join(', ')}`);
  }
  const compCount = competitorProfiles.length;

  // 4. Keyword Gap Analysis & Scoring
  // Aggregate candidate keywords from competitors and target
  const candidateKeywordPool = new Map<string, {
    keyword: string;
    targetFreq: number;
    compFreqs: [number, number, number];
    compAvg: number;
  }>();

  // Add keywords from all competitors
  for (let cIdx = 0; cIdx < competitorFreqMaps.length; cIdx++) {
    const fMap = competitorFreqMaps[cIdx];
    for (const [kw, freq] of fMap.entries()) {
      if (kw.length < 3 || COMMON_STOP_WORDS.has(kw)) continue;
      if (!candidateKeywordPool.has(kw)) {
        candidateKeywordPool.set(kw, {
          keyword: kw,
          targetFreq: targetContent.frequencyMap.get(kw) || 0,
          compFreqs: [0, 0, 0],
          compAvg: 0,
        });
      }
      const item = candidateKeywordPool.get(kw)!;
      item.compFreqs[cIdx] = freq;
    }
  }

  // Add existing target keywords too so we see shared strengths
  for (const [kw, freq] of targetContent.frequencyMap.entries()) {
    if (kw.length < 3 || COMMON_STOP_WORDS.has(kw)) continue;
    if (!candidateKeywordPool.has(kw)) {
      candidateKeywordPool.set(kw, {
        keyword: kw,
        targetFreq: freq,
        compFreqs: [
          competitorFreqMaps[0]?.get(kw) || 0,
          competitorFreqMaps[1]?.get(kw) || 0,
          competitorFreqMaps[2]?.get(kw) || 0,
        ],
        compAvg: 0,
      });
    }
  }

  const keywordGaps: KeywordGapItem[] = [];

  for (const [kw, data] of candidateKeywordPool.entries()) {
    const compAvg = (data.compFreqs[0] + data.compFreqs[1] + data.compFreqs[2]) / compCount;
    data.compAvg = parseFloat(compAvg.toFixed(1));

    // Determine status
    let status: 'missing' | 'weak' | 'shared';
    if (data.targetFreq === 0 && compAvg >= 2) {
      status = 'missing';
    } else if (data.targetFreq > 0 && data.targetFreq < compAvg * 0.45) {
      status = 'weak';
    } else {
      status = 'shared';
    }

    // Search intent
    let intent: 'Informational' | 'Commercial' | 'Transactional' | 'Navigational' = 'Informational';
    if (kw.includes('pricing') || kw.includes('cost') || kw.includes('vs') || kw.includes('review') || kw.includes('compare')) {
      intent = 'Commercial';
    } else if (kw.includes('buy') || kw.includes('download') || kw.includes('order') || kw.includes('signup') || kw.includes('register')) {
      intent = 'Transactional';
    } else if (kw.includes('login') || kw.includes('portal') || kw.includes('official') || kw.includes(targetDomain)) {
      intent = 'Navigational';
    }

    // Relevance Score
    const relevanceScore = Math.min(98, Math.max(45, Math.round(compAvg * 5 + (kw.includes(nicheQuery) ? 35 : 15))));

    // Priority
    let priority: 'Critical' | 'High' | 'Medium' | 'Low' = 'Medium';
    if (status === 'missing' && compAvg >= 5) {
      priority = 'Critical';
    } else if (status === 'missing' || (status === 'weak' && compAvg >= 4)) {
      priority = 'High';
    } else if (status === 'shared') {
      priority = 'Low';
    }

    // Recommended Placement
    let recommendedPlacement: 'H2 Heading' | 'Intro Paragraph' | 'Body Copy' | 'FAQ Section' = 'Body Copy';
    if (priority === 'Critical') {
      recommendedPlacement = 'H2 Heading';
    } else if (intent === 'Commercial' || kw.includes('how') || kw.includes('what') || kw.includes('why')) {
      recommendedPlacement = 'FAQ Section';
    } else if (kw.includes(nicheQuery)) {
      recommendedPlacement = 'Intro Paragraph';
    }

    keywordGaps.push({
      id: `gap-${kw.replace(/[^a-z0-9]/gi, '_')}`,
      keyword: kw,
      // No keyword-volume data source is connected; never estimate these.
      searchVolume: null,
      difficulty: null,
      intent,
      relevanceScore,
      targetFrequency: data.targetFreq,
      competitorFrequencies: [data.compFreqs[0], data.compFreqs[1], data.compFreqs[2]],
      competitorAverageFrequency: data.compAvg,
      status,
      priority,
      recommendedPlacement,
    });
  }

  // Sort keyword gaps: Critical Missing first, then High Missing, then Weak, then Shared
  const priorityOrder = { Critical: 0, High: 1, Medium: 2, Low: 3 };
  keywordGaps.sort((a, b) => {
    if (a.status === 'missing' && b.status !== 'missing') return -1;
    if (b.status === 'missing' && a.status !== 'missing') return 1;
    const priDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
    if (priDiff !== 0) return priDiff;
    return b.competitorAverageFrequency - a.competitorAverageFrequency;
  });

  // Limit to top 35 most relevant keyword gaps for UI responsiveness
  const prioritizedGaps = keywordGaps.slice(0, 35);

  // 5. Benchmark Statistics & Deficits
  const compAvgWords = Math.round(
    competitorProfiles.reduce((acc, c) => acc + c.wordCount, 0) / Math.max(1, competitorProfiles.length)
  );
  const wordCountGap = targetContent.wordCount - compAvgWords; // negative if deficit
  const wordCountGapPercent = Math.round(((targetContent.wordCount - compAvgWords) / Math.max(1, compAvgWords)) * 100);

  const compAvgH2 = Math.round(
    competitorProfiles.reduce((acc, c) => acc + c.headingCounts.h2, 0) / Math.max(1, competitorProfiles.length)
  );

  const compAvgImages = Math.round(
    competitorProfiles.reduce((acc, c) => acc + c.imageCount, 0) / Math.max(1, competitorProfiles.length)
  );

  const missingCount = prioritizedGaps.filter((g) => g.status === 'missing').length;
  const weakCount = prioritizedGaps.filter((g) => g.status === 'weak').length;
  const sharedCount = prioritizedGaps.filter((g) => g.status === 'shared').length;

  // Content Quality Score calculation
  // Target score depends on length ratio, headings, and keyword coverage
  const lengthRatio = Math.min(1, targetContent.wordCount / Math.max(1, compAvgWords));
  const coverageRatio = (sharedCount + weakCount * 0.5) / Math.max(1, prioritizedGaps.length);
  const headingRatio = Math.min(1, targetContent.headingCounts.h2 / Math.max(1, compAvgH2));

  const targetContentScore = Math.min(95, Math.max(25, Math.round((lengthRatio * 40) + (coverageRatio * 40) + (headingRatio * 20))));
  // Same formula applied to each competitor, then averaged
  const scoreFor = (wordCount: number, h2: number, freqMap: Map<string, number>) => {
    const lr = Math.min(1, wordCount / Math.max(1, compAvgWords));
    const cov = prioritizedGaps.filter((g) => (freqMap.get(g.keyword) || 0) > 0).length / Math.max(1, prioritizedGaps.length);
    const hr = Math.min(1, h2 / Math.max(1, compAvgH2));
    return Math.min(95, Math.max(25, Math.round(lr * 40 + cov * 40 + hr * 20)));
  };
  const competitorAverageContentScore = Math.round(
    competitorProfiles.reduce((acc, c, i) => acc + scoreFor(c.wordCount, c.headingCounts.h2, competitorFreqMaps[i]), 0) / compCount
  );

  // 6. Action Plan synthesis
  const recommendedWordAddition = wordCountGap < 0 ? Math.abs(wordCountGap) + 200 : 350;
  const topMissing = prioritizedGaps
    .filter((g) => g.status === 'missing')
    .slice(0, 8)
    .map((g) => g.keyword);

  const suggestedHeadings = [
    `How to Implement ${capitalize(nicheQuery)}: Architecture & Step-by-Step Guide`,
    `Comparing ${capitalize(nicheQuery)} Against Industry Benchmarks & Alternatives`,
    `Security, High-Availability, and Enterprise Compliance Guidelines`,
    `Frequently Asked Questions About ${capitalize(nicheQuery)} Integration`,
  ];

  const quickWins = [
    wordCountGap < 0 ? `Add ${recommendedWordAddition.toLocaleString()} words of in-depth explanatory copy to close the ${Math.abs(wordCountGapPercent)}% content length gap against the selected competitors.` : `Content length already matches or exceeds the selected competitors (${compAvgWords.toLocaleString()} words on average).`,
    `Inject ${topMissing.length} critical missing keywords into strategic H2 subheadings and introductory paragraphs.`,
    `Add at least ${Math.max(2, compAvgH2 - targetContent.headingCounts.h2)} more H2 sections to match competitor topical structure.`,
    `Include an FAQ schema section targeting Commercial and Informational queries to capture Google People Also Ask (PAA) rich snippets.`,
  ];

  return {
    targetUrl: normTargetUrl,
    analyzedAt: new Date().toISOString(),
    primaryNicheQuery: nicheQuery,
    targetProfile: {
      url: targetContent.url,
      domain: targetContent.domain,
      title: targetContent.title,
      wordCount: targetContent.wordCount,
      readingTimeMin: targetContent.readingTimeMin,
      headingCounts: targetContent.headingCounts,
      imageCount: targetContent.imageCount,
    },
    competitors: competitorProfiles,
    failedCompetitorUrls: failedCompetitors,
    benchmarkStats: {
      competitorAverageWordCount: compAvgWords,
      wordCountGap,
      wordCountGapPercent,
      competitorAverageH2Count: compAvgH2,
      competitorAverageImages: compAvgImages,
      totalKeywordsAnalyzed: prioritizedGaps.length,
      missingKeywordsCount: missingCount,
      weakKeywordsCount: weakCount,
      sharedKeywordsCount: sharedCount,
      contentScore: targetContentScore,
      competitorAverageContentScore,
    },
    keywordGaps: prioritizedGaps,
    actionPlan: {
      recommendedWordAddition,
      topMissingKeywordsToInclude: topMissing,
      suggestedHeadings,
      quickWins,
    },
  };
}

