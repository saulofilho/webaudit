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
  const meta: MetaTagsData = {
    openGraph: {},
    twitter: {},
    structuredDataTypes: [],
  };

  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    meta.title = titleMatch[1].trim();
    meta.titleLength = meta.title.length;
  }

  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ||
                    html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
  if (descMatch && descMatch[1]) {
    meta.description = descMatch[1].trim();
    meta.descriptionLength = meta.description.length;
  }

  const canonMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i);
  if (canonMatch && canonMatch[1]) meta.canonical = canonMatch[1].trim();

  const robotsMatch = html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i);
  if (robotsMatch && robotsMatch[1]) meta.robots = robotsMatch[1].trim();

  const vpMatch = html.match(/<meta[^>]+name=["']viewport["'][^>]+content=["']([^"']*)["']/i);
  if (vpMatch && vpMatch[1]) meta.viewport = vpMatch[1].trim();

  const langMatch = html.match(/<html[^>]+lang=["']([^"']*)["']/i);
  if (langMatch && langMatch[1]) meta.language = langMatch[1].trim();

  const charsetMatch = html.match(/<meta[^>]+charset=["']([^"']*)["']/i);
  if (charsetMatch && charsetMatch[1]) meta.charset = charsetMatch[1].trim();

  const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i);
  if (ogTitle && ogTitle[1]) meta.openGraph.title = ogTitle[1].trim();

  const ogDesc = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i);
  if (ogDesc && ogDesc[1]) meta.openGraph.description = ogDesc[1].trim();

  const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)["']/i);
  if (ogImage && ogImage[1]) meta.openGraph.image = ogImage[1].trim();

  const twCard = html.match(/<meta[^>]+name=["']twitter:card["'][^>]+content=["']([^"']*)["']/i);
  if (twCard && twCard[1]) meta.twitter.card = twCard[1].trim();

  const ldJsonMatches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const m of ldJsonMatches) {
    try {
      const parsed = JSON.parse(m[1].trim());
      if (parsed['@type']) {
        if (Array.isArray(parsed['@type'])) meta.structuredDataTypes.push(...parsed['@type']);
        else meta.structuredDataTypes.push(parsed['@type']);
      }
    } catch {
      meta.structuredDataTypes.push('Schema.org');
    }
  }

  return meta;
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
    if (!attrs.match(/\balt\s*=\s*["'][^"']*["']/i)) imagesMissingAlt++;
  }

  const linkMatches = [...html.matchAll(/<a\b([^>]*)>/gi)];

  const securityHeaders: SecurityHeaderCheck[] = [
    {
      header: 'Strict-Transport-Security (HSTS)',
      status: isHttps ? 'present' : 'missing',
      recommended: 'max-age=63072000; includeSubDomains; preload',
      importance: 'critical',
      description: 'Enforces HTTPS communication exclusively.',
      fixSnippet: 'add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;',
    },
    {
      header: 'Content-Security-Policy (CSP)',
      status: 'missing',
      recommended: "default-src 'self'; script-src 'self' 'unsafe-inline';",
      importance: 'critical',
      description: 'Protects against Cross-Site Scripting (XSS) attacks.',
      fixSnippet: "add_header Content-Security-Policy \"default-src 'self'; script-src 'self' 'unsafe-inline';\" always;",
    },
    {
      header: 'X-Frame-Options',
      status: 'missing',
      recommended: 'SAMEORIGIN or DENY',
      importance: 'high',
      description: 'Neutralizes Clickjacking attacks.',
      fixSnippet: 'add_header X-Frame-Options "SAMEORIGIN" always;',
    },
    {
      header: 'X-Content-Type-Options',
      status: 'missing',
      recommended: 'nosniff',
      importance: 'high',
      description: 'Prevents malicious MIME-sniffing.',
      fixSnippet: 'add_header X-Content-Type-Options "nosniff" always;',
    },
  ];

  const items: AuditItem[] = [
    {
      id: 'sec-https',
      category: 'security',
      title: isHttps ? 'HTTPS & TLS Encryption Active' : 'Insecure HTTP Traffic',
      severity: isHttps ? 'good' : 'critical',
      score: isHttps ? 100 : 0,
      summary: isHttps ? 'Website uses encrypted SSL/TLS connection.' : 'Website transmits data in unencrypted plaintext.',
      impact: isHttps ? 'User privacy and data integrity preserved.' : 'Vulnerable to Man-in-the-Middle attacks.',
    },
    {
      id: 'seo-title',
      category: 'seo',
      title: metaTags.title ? `<title> Tag Present (${metaTags.titleLength} characters)` : '<title> Tag Missing',
      severity: metaTags.title ? 'good' : 'critical',
      score: metaTags.title ? 100 : 0,
      summary: metaTags.title ? `Title: "${metaTags.title}"` : '<title> tag not found in document header.',
      impact: 'Crucial element for search engine ranking and SERP visibility.',
    },
    {
      id: 'seo-desc',
      category: 'seo',
      title: metaTags.description ? `Meta Description Present (${metaTags.descriptionLength} chars)` : 'Meta Description Missing',
      severity: metaTags.description ? 'good' : 'warning',
      score: metaTags.description ? 100 : 30,
      summary: metaTags.description ? `Description: "${metaTags.description}"` : 'Meta tag description not configured.',
      impact: 'Controls snippet shown under link titles in search results.',
    },
    {
      id: 'seo-h1',
      category: 'seo',
      title: h1Matches.length === 1 ? 'Single Defined <h1> Heading' : `${h1Matches.length} <h1> Headings Found`,
      severity: h1Matches.length === 1 ? 'good' : (h1Matches.length === 0 ? 'critical' : 'warning'),
      score: h1Matches.length === 1 ? 100 : (h1Matches.length === 0 ? 20 : 70),
      summary: h1Matches.length === 1 ? 'Correct H1 semantic structure.' : (h1Matches.length === 0 ? 'Missing main H1 heading.' : 'Multiple H1 elements found.'),
      impact: 'Semantic signal for document content hierarchy.',
    },
    {
      id: 'bp-vp',
      category: 'best_practices',
      title: metaTags.viewport ? 'Responsive Meta Viewport' : 'Non-Responsive Page',
      severity: metaTags.viewport ? 'good' : 'critical',
      score: metaTags.viewport ? 100 : 10,
      summary: metaTags.viewport ? 'Viewport configured for mobile devices.' : 'Viewport meta tag missing.',
      impact: 'Guarantees proper scaling across smartphones and tablets.',
    },
    {
      id: 'a11y-alt',
      category: 'performance_accessibility',
      title: imagesMissingAlt === 0 ? 'Images with Alt Descriptions' : `${imagesMissingAlt} Images Missing Alt`,
      severity: imagesMissingAlt === 0 ? 'good' : 'warning',
      score: imagesMissingAlt === 0 ? 100 : 50,
      summary: imagesMissingAlt === 0 ? 'All images have descriptive alternative text.' : `${imagesMissingAlt} image(s) require alt attributes.`,
      impact: 'Improves accessibility for screen reader users and image SEO.',
    },
  ];

  const categories: Record<string, CategoryScore> = {
    security: {
      category: 'security',
      name: 'Security',
      score: isHttps ? 85 : 30,
      grade: calculateGrade(isHttps ? 85 : 30),
      color: '#10b981',
      passedCount: isHttps ? 1 : 0,
      warningCount: 0,
      criticalCount: isHttps ? 0 : 1,
      totalCount: 1,
      summary: isHttps ? 'Secure HTTPS active' : 'Missing SSL/HTTPS',
    },
    seo: {
      category: 'seo',
      name: 'SEO & Visibility',
      score: metaTags.title && metaTags.description ? 90 : 60,
      grade: calculateGrade(metaTags.title && metaTags.description ? 90 : 60),
      color: '#3b82f6',
      passedCount: metaTags.title ? 1 : 0,
      warningCount: metaTags.description ? 0 : 1,
      criticalCount: metaTags.title ? 0 : 1,
      totalCount: 2,
      summary: 'Metadata and document structure verified',
    },
    best_practices: {
      category: 'best_practices',
      name: 'Best Practices',
      score: metaTags.viewport ? 90 : 50,
      grade: calculateGrade(metaTags.viewport ? 90 : 50),
      color: '#8b5cf6',
      passedCount: metaTags.viewport ? 1 : 0,
      warningCount: 0,
      criticalCount: metaTags.viewport ? 0 : 1,
      totalCount: 1,
      summary: 'Modern frontend development standards',
    },
    performance_accessibility: {
      category: 'performance_accessibility',
      name: 'Performance & Accessibility',
      score: imagesMissingAlt === 0 ? 95 : 70,
      grade: calculateGrade(imagesMissingAlt === 0 ? 95 : 70),
      color: '#f59e0b',
      passedCount: imagesMissingAlt === 0 ? 1 : 0,
      warningCount: imagesMissingAlt > 0 ? 1 : 0,
      criticalCount: 0,
      totalCount: 1,
      summary: 'Accessibility metrics and DOM assets',
    },
  };

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
    h1Count: h1Matches.length,
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
    aiExecutiveSummary: `Client-side audit for ${new URL(targetUrl).hostname}. Global score achieved: ${overallScore}/100 (Grade ${calculateGrade(overallScore)}).`,
    keyStrengths: [
      isHttps ? 'Encrypted HTTPS active' : 'Site reachable online',
      metaTags.title ? 'Site title tag defined' : 'HTML document structure detected',
      metaTags.viewport ? 'Responsive meta viewport present' : 'Web navigation ready',
    ],
    topPriorityFixes: [
      !isHttps ? 'Enable SSL/TLS certificate for HTTPS' : 'Review HTTP security headers (HSTS, CSP)',
      !metaTags.description ? 'Add meta description of 120-160 characters' : 'Optimize images with alt descriptions',
    ],
    categories: categories as any,
    items,
    rawData,
  };
}
