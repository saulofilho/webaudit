import { extractMetaTags, hasAltAttribute } from '../utils/htmlMeta';
import {
  AuditItem,
  AuditReport,
  CategoryScore,
  MetaTagsData,
  RawAuditData,
  SecurityHeaderCheck,
  SocialFootprintProfile,
  SocialFootprintSummary,
  TechStackItem,
} from '../types';

export function extractSocialFootprintClient(html: string): SocialFootprintSummary {
  const patterns: { platform: string; regex: RegExp; icon: string }[] = [
    { platform: 'Twitter / X', regex: /https?:\/\/(?:www\.)?(?:twitter\.com|x\.com)\/([a-zA-Z0-9_]{1,30})/gi, icon: 'Twitter' },
    { platform: 'LinkedIn', regex: /https?:\/\/(?:www\.)?linkedin\.com\/(?:company|in|school)\/([a-zA-Z0-9_\-%]+)/gi, icon: 'Linkedin' },
    { platform: 'GitHub', regex: /https?:\/\/(?:www\.)?github\.com\/([a-zA-Z0-9_\-]+)(?:\/[a-zA-Z0-9_\-]+)?/gi, icon: 'Github' },
    { platform: 'Facebook', regex: /https?:\/\/(?:www\.)?facebook\.com\/([a-zA-Z0-9.\-_]+)/gi, icon: 'Facebook' },
    { platform: 'Instagram', regex: /https?:\/\/(?:www\.)?instagram\.com\/([a-zA-Z0-9_.]+)/gi, icon: 'Instagram' },
    { platform: 'YouTube', regex: /https?:\/\/(?:www\.)?youtube\.com\/(?:@|channel\/|user\/|c\/)?([a-zA-Z0-9_\-]+)/gi, icon: 'Youtube' },
    { platform: 'TikTok', regex: /https?:\/\/(?:www\.)?tiktok\.com\/@([a-zA-Z0-9_.]+)/gi, icon: 'Video' },
    { platform: 'Discord', regex: /https?:\/\/(?:www\.)?(?:discord\.gg|discord\.com\/invite)\/([a-zA-Z0-9_\-]+)/gi, icon: 'MessageSquare' },
    { platform: 'Reddit', regex: /https?:\/\/(?:www\.)?reddit\.com\/(?:r|user)\/([a-zA-Z0-9_]+)/gi, icon: 'Globe' },
    { platform: 'Telegram', regex: /https?:\/\/(?:t\.me|telegram\.me)\/([a-zA-Z0-9_]+)/gi, icon: 'Send' },
    { platform: 'Threads', regex: /https?:\/\/(?:www\.)?threads\.net\/@([a-zA-Z0-9_.]+)/gi, icon: 'AtSign' },
    { platform: 'Pinterest', regex: /https?:\/\/(?:www\.)?pinterest\.com\/([a-zA-Z0-9_]+)/gi, icon: 'Pin' },
    { platform: 'Medium', regex: /https?:\/\/(?:[a-zA-Z0-9_\-]+\.)?medium\.com\/(?:@([a-zA-Z0-9_]+))?/gi, icon: 'FileText' },
    { platform: 'Substack', regex: /https?:\/\/([a-zA-Z0-9_\-]+)\.substack\.com/gi, icon: 'Mail' },
    { platform: 'Mastodon / Fediverse', regex: /https?:\/\/(?:mastodon\.social|fosstodon\.org|mstdn\.social)\/@([a-zA-Z0-9_]+)/gi, icon: 'Share2' },
  ];

  const profilesMap = new Map<string, SocialFootprintProfile>();
  const linkRegex = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let linkMatch;

  while ((linkMatch = linkRegex.exec(html)) !== null) {
    const attrs = linkMatch[1] || '';
    const hrefMatch = attrs.match(/\bhref\s*=\s*["']([^"']*)["']/i);
    if (!hrefMatch || !hrefMatch[1]) continue;

    const href = hrefMatch[1].trim();
    if (!href.startsWith('http://') && !href.startsWith('https://')) continue;

    const isSecure = href.startsWith('https://');
    const hasRelMe = /\brel\s*=\s*["'][^"']*\bme\b[^"']*["']/i.test(attrs);
    const hasNoopener = /\brel\s*=\s*["'][^"']*\bnoopener\b[^"']*["']/i.test(attrs);

    for (const pat of patterns) {
      pat.regex.lastIndex = 0;
      const m = pat.regex.exec(href);
      if (m) {
        const ignoredPaths = ['sharer', 'intent', 'share', 'login', 'signup', 'privacy', 'terms', 'policies', 'about', 'features', 'pricing'];
        const handle = m[1] ? m[1].replace(/\/$/, '') : undefined;
        if (handle && ignoredPaths.includes(handle.toLowerCase())) continue;

        const normalizedKey = `${pat.platform}:${href.toLowerCase().replace(/\/$/, '')}`;
        if (!profilesMap.has(normalizedKey)) {
          profilesMap.set(normalizedKey, {
            platform: pat.platform,
            url: href,
            handle: handle ? `@${handle.replace(/^@/, '')}` : undefined,
            icon: pat.icon,
            isSecureHttps: isSecure,
            hasRelMeOrNoopener: hasRelMe || hasNoopener,
            status: !isSecure ? 'unsecured' : (hasRelMe || hasNoopener ? 'verified' : 'detected'),
          });
        }
      }
    }
  }

  const profiles = Array.from(profilesMap.values());
  const platformsList = Array.from(new Set(profiles.map((p) => p.platform)));
  const totalProfiles = profiles.length;
  const platformsCount = platformsList.length;

  let socialReachGrade: 'High' | 'Moderate' | 'Limited' | 'None' = 'None';
  let score = 0;
  if (platformsCount >= 4) {
    socialReachGrade = 'High';
    score = 100;
  } else if (platformsCount >= 2) {
    socialReachGrade = 'Moderate';
    score = 80;
  } else if (platformsCount === 1) {
    socialReachGrade = 'Limited';
    score = 55;
  } else {
    socialReachGrade = 'None';
    score = 25;
  }

  return {
    totalProfilesFound: totalProfiles,
    platformsDetectedCount: platformsCount,
    profiles,
    platformsList,
    hasMajorSocialPresence: platformsCount >= 2,
    socialReachGrade,
    socialFootprintScore: score,
  };
}

function calculateGrade(score: number): string {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

export function detectTechnologiesClient(headers: Record<string, string>, html: string): TechStackItem[] {
  const stack: TechStackItem[] = [];
  const lowerHtml = html.toLowerCase();
  const lowerHeaders: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    lowerHeaders[k.toLowerCase()] = String(v).toLowerCase();
  }

  const server = lowerHeaders['server'] || '';
  if (server.includes('cloudflare') || lowerHeaders['cf-ray']) {
    stack.push({ category: 'CDN / Proxy', name: 'Cloudflare', confidence: 99 });
  }
  if (server.includes('nginx')) {
    stack.push({ category: 'Web Server', name: 'Nginx', confidence: 95 });
  }
  if (server.includes('apache')) {
    stack.push({ category: 'Web Server', name: 'Apache', confidence: 95 });
  }
  if (server.includes('vercel') || lowerHeaders['x-vercel-id']) {
    stack.push({ category: 'PaaS / Hosting', name: 'Vercel', confidence: 99 });
  }

  if (lowerHtml.includes('wp-content') || lowerHtml.includes('wp-includes') || lowerHtml.includes('wordpress')) {
    stack.push({ category: 'CMS', name: 'WordPress', confidence: 98 });
  }
  if (lowerHtml.includes('__next') || lowerHtml.includes('/_next/') || lowerHtml.includes('next.js')) {
    stack.push({ category: 'Frontend Framework', name: 'Next.js', confidence: 98 });
  } else if (lowerHtml.includes('react') || lowerHtml.includes('data-reactroot')) {
    stack.push({ category: 'JavaScript Library', name: 'React', confidence: 85 });
  }
  if (lowerHtml.includes('vue') || lowerHtml.includes('data-v-') || lowerHtml.includes('/_nuxt/')) {
    stack.push({ category: 'Frontend Framework', name: 'Vue.js / Nuxt', confidence: 90 });
  }
  if (lowerHtml.includes('tailwind')) {
    stack.push({ category: 'CSS Framework', name: 'Tailwind CSS', confidence: 85 });
  }
  if (lowerHtml.includes('bootstrap')) {
    stack.push({ category: 'CSS Framework', name: 'Bootstrap', confidence: 90 });
  }
  if (lowerHtml.includes('googletagmanager.com') || lowerHtml.includes('gtm.js')) {
    stack.push({ category: 'Tag Management', name: 'Google Tag Manager', confidence: 95 });
  }
  if (lowerHtml.includes('fonts.googleapis.com')) {
    stack.push({ category: 'Fonts', name: 'Google Fonts', confidence: 98 });
  }

  return stack;
}

export function parseMetaClient(html: string): MetaTagsData {
  return extractMetaTags(html);
}

export async function analyzeWebsiteClient(rawUrl: string): Promise<AuditReport> {
  let targetUrl = rawUrl.trim();
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl;
  }

  const startTime = Date.now();
  let html = '';
  let finalUrl = targetUrl;
  const allHeaders: Record<string, string> = {};

  // Try direct fetch or CORS proxy for GitHub Pages static mode
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
    const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    html = await res.text();
    finalUrl = targetUrl;
  } catch {
    // Second proxy fallback
    try {
      const proxyUrl2 = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
      const res = await fetch(proxyUrl2, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      html = await res.text();
      finalUrl = targetUrl;
    } catch (e2: any) {
      throw new Error(`Unable to fetch URL via client-side proxy (${targetUrl}): ${e2.message}`);
    }
  }

  const responseTimeMs = Date.now() - startTime;
  const isHttps = targetUrl.startsWith('https://');

  const metaTags = parseMetaClient(html);
  const techStack = detectTechnologiesClient(allHeaders, html);
  const socialFootprint = extractSocialFootprintClient(html);

  const h1Matches = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
  const imgMatches = [...html.matchAll(/<img\b([^>]*)>/gi)];
  let imagesMissingAlt = 0;
  for (const img of imgMatches) {
    const attrs = img[1] || '';
    if (!hasAltAttribute(attrs)) imagesMissingAlt++;
  }

  const linkMatches = [...html.matchAll(/<a\b([^>]*)>/gi)];
  // Static mode (no backend): the page is fetched through a public CORS proxy, so the
  // site's real HTTP response headers are not available. Header checks are reported as
  // "not checked" instead of guessed.
  const securityHeaders: SecurityHeaderCheck[] = [];

  const h1Count = h1Matches.length;
  const titleLen = metaTags.titleLength || 0;
  const descLen = metaTags.descriptionLength || 0;

  const items: AuditItem[] = [
    {
      id: 'sec-https',
      category: 'security',
      title: isHttps ? 'HTTPS & TLS Encryption Active' : 'Insecure HTTP Traffic',
      severity: isHttps ? 'good' : 'critical',
      score: isHttps ? 100 : 20,
      summary: isHttps ? 'The URL is served over HTTPS.' : 'The URL is served over plain HTTP.',
      impact: isHttps ? 'User privacy and data integrity preserved.' : 'Traffic can be read or modified in transit.',
    },
    {
      id: 'sec-headers-unchecked',
      category: 'security',
      title: 'Security Headers Not Checked (Static Mode)',
      severity: 'info',
      score: 50,
      summary:
        'This audit ran without the WebAudit server, through a public CORS proxy that does not expose the site\'s HTTP headers. HSTS, CSP, X-Frame-Options and other headers were not evaluated.',
      impact: 'Run the tool with its Node server to audit security headers.',
    },
    {
      id: 'seo-title',
      category: 'seo',
      title: !metaTags.title
        ? 'Missing <title> Tag'
        : titleLen < 30 || titleLen > 60
        ? `<title> Length Suboptimal (${titleLen} characters)`
        : `<title> Tag Optimized (${titleLen} characters)`,
      severity: !metaTags.title ? 'critical' : titleLen < 30 || titleLen > 60 ? 'warning' : 'good',
      score: !metaTags.title ? 0 : titleLen < 30 || titleLen > 60 ? 70 : 100,
      summary: metaTags.title ? `Title: "${metaTags.title}"` : 'No <title> element found.',
      impact: 'Crucial element for search engine ranking and SERP visibility.',
    },
    {
      id: 'seo-desc',
      category: 'seo',
      title: !metaTags.description
        ? 'Missing Meta Description'
        : descLen < 120 || descLen > 160
        ? `Meta Description Length Suboptimal (${descLen} characters)`
        : `Meta Description Optimized (${descLen} characters)`,
      severity: !metaTags.description ? 'warning' : descLen < 120 || descLen > 160 ? 'info' : 'good',
      score: !metaTags.description ? 40 : descLen < 120 || descLen > 160 ? 80 : 100,
      summary: metaTags.description ? `Description: "${metaTags.description}"` : 'No meta description found.',
      impact: 'Controls the snippet shown under the title in search results.',
    },
    {
      id: 'seo-h1',
      category: 'seo',
      title: h1Count === 1 ? 'Single Defined <h1> Heading' : h1Count === 0 ? 'Missing <h1> Heading' : `Multiple <h1> Headings (${h1Count})`,
      severity: h1Count === 1 ? 'good' : 'warning',
      score: h1Count === 1 ? 100 : 60,
      summary: h1Count > 0 ? `First H1: "${h1Matches[0].replace(/<[^>]+>/g, '').trim().slice(0, 120)}"` : 'No <h1> found in the HTML.',
      impact: 'Semantic signal for document content hierarchy.',
    },
    {
      id: 'bp-vp',
      category: 'best_practices',
      title: metaTags.viewport ? 'Responsive Meta Viewport' : 'Missing Meta Viewport',
      severity: metaTags.viewport ? 'good' : 'critical',
      score: metaTags.viewport ? 100 : 20,
      summary: metaTags.viewport ? `Viewport: "${metaTags.viewport}"` : 'No <meta name="viewport"> found.',
      impact: 'Controls scaling on smartphones and tablets.',
    },
    {
      id: 'bp-lang',
      category: 'best_practices',
      title: metaTags.language ? `Document Language Declared (lang="${metaTags.language}")` : 'Missing Document Language',
      severity: metaTags.language ? 'good' : 'warning',
      score: metaTags.language ? 100 : 60,
      summary: metaTags.language ? 'The <html> element declares its language.' : 'The <html> element has no lang attribute.',
      impact: 'Helps screen readers and search engines process the content correctly.',
    },
    {
      id: 'a11y-alt',
      category: 'performance_accessibility',
      title:
        imgMatches.length === 0
          ? 'No Images Found'
          : imagesMissingAlt === 0
          ? `All ${imgMatches.length} Images Have alt Attributes`
          : `${imagesMissingAlt} of ${imgMatches.length} Images Missing alt`,
      severity: imagesMissingAlt === 0 ? 'good' : 'warning',
      score: imgMatches.length === 0 ? 100 : Math.round(((imgMatches.length - imagesMissingAlt) / imgMatches.length) * 100),
      summary:
        imagesMissingAlt === 0
          ? 'Every <img> has an alt attribute (empty alt marks decorative images).'
          : `${imagesMissingAlt} <img> element(s) have no alt attribute.`,
      impact: 'Screen reader users cannot understand images without alternative text.',
    },
  ];

  const CATEGORY_META: Record<string, { name: string; color: string }> = {
    security: { name: 'Security', color: '#10b981' },
    seo: { name: 'SEO & Visibility', color: '#3b82f6' },
    best_practices: { name: 'Best Practices', color: '#8b5cf6' },
    performance_accessibility: { name: 'Performance & Accessibility', color: '#f59e0b' },
  };
  const categories: Record<string, CategoryScore> = {};
  for (const [key, meta] of Object.entries(CATEGORY_META)) {
    const catItems = items.filter((i) => i.category === key);
    const score = Math.round(catItems.reduce((acc, i) => acc + i.score, 0) / Math.max(1, catItems.length));
    const criticalCount = catItems.filter((i) => i.severity === 'critical').length;
    const warningCount = catItems.filter((i) => i.severity === 'warning').length;
    categories[key] = {
      category: key as any,
      name: meta.name,
      score,
      grade: calculateGrade(score),
      color: meta.color,
      passedCount: catItems.filter((i) => i.severity === 'good').length,
      warningCount,
      criticalCount,
      totalCount: catItems.length,
      summary:
        key === 'security'
          ? 'Static mode: only HTTPS was checked; HTTP headers are not available.'
          : criticalCount + warningCount === 0
          ? 'No issues found in the checks available in static mode.'
          : `${criticalCount} critical and ${warningCount} warning issue(s) found.`,
    };
  }

  const overallScore = Math.round(
    (categories.security.score + categories.seo.score + categories.best_practices.score + categories.performance_accessibility.score) / 4
  );

  const rawData: RawAuditData = {
    url: targetUrl,
    finalUrl,
    protocol: new URL(targetUrl).protocol,
    statusCode: 200,
    statusText: 'OK',
    responseTimeMs,
    contentLengthBytes: html.length,
    contentType: 'text/html',
    tlsVersion: isHttps ? 'HTTPS / TLS' : 'HTTP',
    h1Count,
    h2Count: 0,
    h3Count: 0,
    imagesTotal: imgMatches.length,
    imagesMissingAlt,
    linksTotal: linkMatches.length,
    externalLinksWithoutRel: 0,
    formsCount: 0,
    formsWithoutHttps: 0,
    scriptsCount: 0,
    inlineScriptsCount: 0,
    stylesCount: 0,
    metaTags,
    securityHeaders,
    allHeaders,
    techStack,
    socialFootprint,
  };

  return {
    id: `audit-${Date.now()}`,
    targetUrl,
    analyzedAt: new Date().toISOString(),
    overallScore,
    overallGrade: calculateGrade(overallScore),
    aiExecutiveSummary: `Limited static-mode audit for ${new URL(targetUrl).hostname} (no server: HTTP headers and response details were not checked). Score from available checks: ${overallScore}/100 (Grade ${calculateGrade(overallScore)}).`,
    keyStrengths: [
      isHttps ? 'Encrypted HTTPS active' : 'Site reachable online',
      metaTags.title ? 'Site title tag defined' : 'HTML document structure detected',
      metaTags.viewport ? 'Responsive meta viewport present' : 'Web navigation ready',
    ],
    topPriorityFixes: [
      ...items.filter((i) => i.severity === 'critical' || i.severity === 'warning').map((i) => `${i.title}: ${i.summary}`),
      'Run the audit with the WebAudit server to check HTTP security headers.',
    ].slice(0, 5),
    categories: categories as any,
    items,
    rawData,
  };
}
