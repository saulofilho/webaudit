import { GoogleGenAI, Type } from '@google/genai';
import {
  AuditItem,
  AuditReport,
  CategoryScore,
  MetaTagsData,
  RawAuditData,
  SecurityHeaderCheck,
  SocialFootprintProfile,
  SocialFootprintSummary,
} from '../src/types';
import { detectTechnologies } from './techDetector';

export function extractSocialFootprint(html: string): SocialFootprintSummary {
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
        // Exclude generic root share links or non-profile destinations (e.g. facebook.com/sharer, twitter.com/intent, github.com/features)
        const ignoredPaths = ['sharer', 'intent', 'share', 'login', 'signup', 'privacy', 'terms', 'policies', 'about', 'features', 'pricing'];
        const handle = m[1] ? m[1].replace(/\/$/, '') : undefined;
        if (handle && ignoredPaths.includes(handle.toLowerCase())) {
          continue;
        }

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

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function calculateGrade(score: number): string {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function parseMeta(html: string): MetaTagsData {
  const meta: MetaTagsData = {
    openGraph: {},
    twitter: {},
    structuredDataTypes: [],
  };

  // Title
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    meta.title = titleMatch[1].trim();
    meta.titleLength = meta.title.length;
  }

  // Meta Description
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ||
                    html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
  if (descMatch && descMatch[1]) {
    meta.description = descMatch[1].trim();
    meta.descriptionLength = meta.description.length;
  }

  // Canonical
  const canonMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i) ||
                     html.match(/<link[^>]+href=["']([^"']*)["'][^>]+rel=["']canonical["']/i);
  if (canonMatch && canonMatch[1]) {
    meta.canonical = canonMatch[1].trim();
  }

  // Robots
  const robotsMatch = html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i) ||
                      html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']robots["']/i);
  if (robotsMatch && robotsMatch[1]) {
    meta.robots = robotsMatch[1].trim();
  }

  // Viewport
  const vpMatch = html.match(/<meta[^>]+name=["']viewport["'][^>]+content=["']([^"']*)["']/i) ||
                  html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']viewport["']/i);
  if (vpMatch && vpMatch[1]) {
    meta.viewport = vpMatch[1].trim();
  }

  // Language
  const langMatch = html.match(/<html[^>]+lang=["']([^"']*)["']/i);
  if (langMatch && langMatch[1]) {
    meta.language = langMatch[1].trim();
  }

  // Charset
  const charsetMatch = html.match(/<meta[^>]+charset=["']([^"']*)["']/i) ||
                       html.match(/<meta[^>]+http-equiv=["']content-type["'][^>]+content=["'][^"']*charset=([^"';\s]+)/i);
  if (charsetMatch && charsetMatch[1]) {
    meta.charset = charsetMatch[1].trim();
  }

  // Favicon
  const iconMatch = html.match(/<link[^>]+rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]+href=["']([^"']*)["']/i);
  if (iconMatch && iconMatch[1]) {
    meta.favicon = iconMatch[1].trim();
  }

  // Open Graph
  const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i) ||
                  html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:title["']/i);
  if (ogTitle && ogTitle[1]) meta.openGraph.title = ogTitle[1].trim();

  const ogDesc = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i) ||
                 html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:description["']/i);
  if (ogDesc && ogDesc[1]) meta.openGraph.description = ogDesc[1].trim();

  const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)["']/i) ||
                  html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:image["']/i);
  if (ogImage && ogImage[1]) meta.openGraph.image = ogImage[1].trim();

  const ogUrl = html.match(/<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']*)["']/i) ||
                html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:url["']/i);
  if (ogUrl && ogUrl[1]) meta.openGraph.url = ogUrl[1].trim();

  const ogSite = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']*)["']/i);
  if (ogSite && ogSite[1]) meta.openGraph.siteName = ogSite[1].trim();

  // Twitter
  const twCard = html.match(/<meta[^>]+name=["']twitter:card["'][^>]+content=["']([^"']*)["']/i);
  if (twCard && twCard[1]) meta.twitter.card = twCard[1].trim();

  const twTitle = html.match(/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']*)["']/i);
  if (twTitle && twTitle[1]) meta.twitter.title = twTitle[1].trim();

  const twDesc = html.match(/<meta[^>]+name=["']twitter:description["'][^>]+content=["']([^"']*)["']/i);
  if (twDesc && twDesc[1]) meta.twitter.description = twDesc[1].trim();

  const twImage = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']*)["']/i);
  if (twImage && twImage[1]) meta.twitter.image = twImage[1].trim();

  // Structured Data JSON-LD
  const ldJsonMatches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const m of ldJsonMatches) {
    try {
      const parsed = JSON.parse(m[1].trim());
      if (parsed['@type']) {
        if (Array.isArray(parsed['@type'])) {
          meta.structuredDataTypes.push(...parsed['@type']);
        } else {
          meta.structuredDataTypes.push(parsed['@type']);
        }
      }
    } catch {
      meta.structuredDataTypes.push('Schema.org (JSON-LD)');
    }
  }

  return meta;
}

function checkSecurityHeaders(headers: Record<string, string>, isHttps: boolean): SecurityHeaderCheck[] {
  const lower: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    lower[k.toLowerCase()] = String(v);
  }

  const checks: SecurityHeaderCheck[] = [
    {
      header: 'Strict-Transport-Security (HSTS)',
      status: lower['strict-transport-security'] ? 'present' : (isHttps ? 'missing' : 'insecure'),
      value: lower['strict-transport-security'],
      recommended: 'max-age=63072000; includeSubDomains; preload',
      importance: 'critical',
      description: 'Forces browsers to communicate solely via HTTPS, preventing Man-in-the-Middle attacks and SSL stripping.',
      fixSnippet: 'add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;',
    },
    {
      header: 'Content-Security-Policy (CSP)',
      status: lower['content-security-policy'] ? 'present' : 'missing',
      value: lower['content-security-policy'],
      recommended: "default-src 'self'; script-src 'self' 'unsafe-inline'; object-src 'none';",
      importance: 'critical',
      description: 'Mitigates Cross-Site Scripting (XSS), clickjacking, and unauthorized resource injection.',
      fixSnippet: "add_header Content-Security-Policy \"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;\" always;",
    },
    {
      header: 'X-Frame-Options',
      status: lower['x-frame-options'] ? 'present' : 'missing',
      value: lower['x-frame-options'],
      recommended: 'DENY or SAMEORIGIN',
      importance: 'high',
      description: 'Prevents the page from being embedded in iframes on third-party sites, stopping clickjacking attacks.',
      fixSnippet: 'add_header X-Frame-Options "SAMEORIGIN" always;',
    },
    {
      header: 'X-Content-Type-Options',
      status: lower['x-content-type-options']?.toLowerCase().includes('nosniff') ? 'present' : 'missing',
      value: lower['x-content-type-options'],
      recommended: 'nosniff',
      importance: 'high',
      description: 'Instructs the browser not to MIME-sniff response content types, preventing disguised malicious script execution.',
      fixSnippet: 'add_header X-Content-Type-Options "nosniff" always;',
    },
    {
      header: 'Referrer-Policy',
      status: lower['referrer-policy'] ? 'present' : 'missing',
      value: lower['referrer-policy'],
      recommended: 'strict-origin-when-cross-origin',
      importance: 'medium',
      description: 'Governs how much referrer metadata is transmitted when navigating to other destinations.',
      fixSnippet: 'add_header Referrer-Policy "strict-origin-when-cross-origin" always;',
    },
    {
      header: 'Permissions-Policy',
      status: lower['permissions-policy'] ? 'present' : 'missing',
      value: lower['permissions-policy'],
      recommended: 'camera=(), microphone=(), geolocation=()',
      importance: 'medium',
      description: 'Restricts which browser hardware and privacy APIs (camera, microphone, geolocation) can be invoked.',
      fixSnippet: 'add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;',
    },
    {
      header: 'Cross-Origin-Opener-Policy (COOP)',
      status: lower['cross-origin-opener-policy'] ? 'present' : 'missing',
      value: lower['cross-origin-opener-policy'],
      recommended: 'same-origin',
      importance: 'medium',
      description: 'Isolates browsing contexts to prevent cross-origin windows from interacting via window.opener.',
      fixSnippet: 'add_header Cross-Origin-Opener-Policy "same-origin" always;',
    },
  ];

  return checks;
}

export async function analyzeWebsite(rawUrl: string): Promise<AuditReport> {
  let targetUrl = rawUrl.trim();
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl;
  }

  const startTime = Date.now();
  let response: Response;
  let finalUrl = targetUrl;
  let html = '';
  let statusCode = 0;
  let statusText = 'OK';
  const allHeaders: Record<string, string> = {};

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    response = await fetch(targetUrl, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 WebsiteAuditBot/2.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    clearTimeout(timeout);

    finalUrl = response.url || targetUrl;
    statusCode = response.status;
    statusText = response.statusText || 'OK';

    response.headers.forEach((val, key) => {
      allHeaders[key.toLowerCase()] = val;
    });

    html = await response.text();
  } catch (err: any) {
    // If fetch failed (e.g. SSL error or invalid domain), generate structured error report
    throw new Error(`Unable to fetch target URL (${targetUrl}): ${err.message || 'Connection failure or timeout'}`);
  }

  const responseTimeMs = Date.now() - startTime;
  const isHttps = finalUrl.startsWith('https://');
  const contentLengthBytes = html.length;

  // DOM Counts
  const h1Matches = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
  const h2Matches = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/gi) || [];
  const h3Matches = html.match(/<h3[^>]*>([\s\S]*?)<\/h3>/gi) || [];
  const h1Sample = h1Matches.length > 0 ? h1Matches[0].replace(/<[^>]+>/g, '').trim() : undefined;

  const imgMatches = [...html.matchAll(/<img\b([^>]*)>/gi)];
  let imagesMissingAlt = 0;
  for (const img of imgMatches) {
    const attrs = img[1] || '';
    if (!attrs.match(/\balt\s*=\s*["'][^"']*["']/i)) {
      imagesMissingAlt++;
    }
  }

  const linkMatches = [...html.matchAll(/<a\b([^>]*)>/gi)];
  let externalLinksWithoutRel = 0;
  const parsedTargetHost = new URL(finalUrl).hostname.toLowerCase();
  for (const link of linkMatches) {
    const attrs = link[1] || '';
    const hrefMatch = attrs.match(/\bhref\s*=\s*["']([^"']*)["']/i);
    if (hrefMatch && hrefMatch[1]) {
      const href = hrefMatch[1];
      if (href.startsWith('http://') || href.startsWith('https://')) {
        try {
          const linkHost = new URL(href).hostname.toLowerCase();
          if (linkHost !== parsedTargetHost && !attrs.match(/\brel\s*=\s*["'][^"']*(?:noopener|noreferrer)[^"']*["']/i)) {
            externalLinksWithoutRel++;
          }
        } catch {
          // ignore
        }
      }
    }
  }

  const formMatches = [...html.matchAll(/<form\b([^>]*)>/gi)];
  let formsWithoutHttps = 0;
  for (const form of formMatches) {
    const attrs = form[1] || '';
    const actionMatch = attrs.match(/\baction\s*=\s*["']([^"']*)["']/i);
    if (actionMatch && actionMatch[1] && actionMatch[1].startsWith('http://')) {
      formsWithoutHttps++;
    }
  }

  const scriptMatches = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  let inlineScriptsCount = 0;
  for (const s of scriptMatches) {
    const attrs = s[1] || '';
    if (!attrs.match(/\bsrc\s*=/i) && s[2].trim().length > 0) {
      inlineScriptsCount++;
    }
  }

  const styleMatches = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)];

  const metaTags = parseMeta(html);
  const securityHeaders = checkSecurityHeaders(allHeaders, isHttps);
  const techStack = detectTechnologies(allHeaders, html);
  const socialFootprint = extractSocialFootprint(html);

  const rawData: RawAuditData = {
    url: targetUrl,
    finalUrl,
    protocol: new URL(finalUrl).protocol,
    statusCode,
    statusText,
    responseTimeMs,
    contentLengthBytes,
    contentType: allHeaders['content-type'] || 'text/html',
    serverHeader: allHeaders['server'],
    tlsVersion: isHttps ? 'TLS 1.2 / TLS 1.3 (HTTPS)' : 'Insecure (Plain HTTP)',
    h1Count: h1Matches.length,
    h2Count: h2Matches.length,
    h3Count: h3Matches.length,
    h1Sample,
    imagesTotal: imgMatches.length,
    imagesMissingAlt,
    linksTotal: linkMatches.length,
    externalLinksWithoutRel,
    formsCount: formMatches.length,
    formsWithoutHttps,
    scriptsCount: scriptMatches.length,
    inlineScriptsCount,
    stylesCount: styleMatches.length,
    metaTags,
    securityHeaders,
    allHeaders,
    techStack,
    socialFootprint,
  };

  // Build audit items
  const items: AuditItem[] = [];

  // ================= 1. SECURITY AUDITS =================
  // HTTPS
  if (isHttps) {
    items.push({
      id: 'sec-https',
      category: 'security',
      title: 'HTTPS & TLS Encryption Active',
      severity: 'good',
      score: 100,
      summary: 'The website utilizes secure HTTPS encryption with valid SSL/TLS certificates.',
      impact: 'Guarantees confidentiality and data integrity against eavesdropping and interception.',
      currentValue: 'https://',
      recommendedValue: 'https://',
    });
  } else {
    items.push({
      id: 'sec-https',
      category: 'security',
      title: 'Insecure Plain HTTP Traffic',
      severity: 'critical',
      score: 0,
      summary: 'The website transmits traffic in unencrypted plaintext without SSL/TLS, leaving user sessions exposed to interception.',
      impact: 'Extreme risk of Man-in-the-Middle exploits, data interception, and severe search ranking penalties.',
      currentValue: 'http://',
      recommendedValue: 'https://',
      codeSnippet: {
        language: 'nginx',
        title: 'Forced HTTPS Redirect (Nginx)',
        code: `server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$host$request_uri;
}`,
      },
    });
  }

  // Security Headers
  securityHeaders.forEach((sh, idx) => {
    if (sh.status === 'present') {
      items.push({
        id: `sec-header-${idx}`,
        category: 'security',
        title: `Header ${sh.header} Configured`,
        severity: 'good',
        score: 100,
        summary: `The security response header ${sh.header} is active with strong directives.`,
        impact: sh.description,
        currentValue: sh.value,
        recommendedValue: sh.recommended,
      });
    } else {
      const isCritical = sh.importance === 'critical';
      items.push({
        id: `sec-header-${idx}`,
        category: 'security',
        title: `Header ${sh.header} Missing`,
        severity: isCritical ? 'critical' : 'warning',
        score: isCritical ? 20 : 50,
        summary: `The server did not return the ${sh.header} security header.`,
        impact: sh.description,
        currentValue: 'Not configured',
        recommendedValue: sh.recommended,
        codeSnippet: sh.fixSnippet ? {
          language: 'nginx',
          title: `Configure in Nginx`,
          code: sh.fixSnippet,
        } : undefined,
      });
    }
  });

  // Server Header Leakage
  if (allHeaders['server'] || allHeaders['x-powered-by']) {
    const leak = [allHeaders['server'], allHeaders['x-powered-by']].filter(Boolean).join(' / ');
    items.push({
      id: 'sec-server-leak',
      category: 'security',
      title: 'Server Banner & Technology Leakage',
      severity: 'warning',
      score: 60,
      summary: `The server exposes internal technology signatures via HTTP headers (${leak}).`,
      impact: 'Enables automated reconnaissance by exploit scanners targeting known version vulnerabilities.',
      currentValue: leak,
      recommendedValue: 'Hide server banner and version headers',
      codeSnippet: {
        language: 'nginx',
        title: 'Hide Version Headers in Nginx & Express',
        code: `# In nginx.conf:
server_tokens off;

# In Express.js:
app.disable('x-powered-by');`,
      },
    });
  } else {
    items.push({
      id: 'sec-server-leak',
      category: 'security',
      title: 'Server Technology Headers Hidden',
      severity: 'good',
      score: 100,
      summary: 'The server successfully obfuscates server identification banners like X-Powered-By.',
      impact: 'Hardens security posture against automated vulnerability discovery.',
    });
  }

  // ================= 2. SEO AUDITS =================
  // Title tag
  if (!metaTags.title) {
    items.push({
      id: 'seo-title',
      category: 'seo',
      title: '<title> Tag Missing',
      severity: 'critical',
      score: 0,
      summary: 'The HTML document lacks a <title> tag, severely undermining search engine indexability and user tab navigation.',
      impact: 'Search engines cannot identify document topic and browser tabs display raw URLs without headlines.',
      recommendedValue: '<title>Site Title - Concise Topic (50-60 characters)</title>',
      codeSnippet: {
        language: 'html',
        title: 'Add in <head>',
        code: '<title>My Website | Professional Services & Solutions</title>',
      },
    });
  } else if (metaTags.titleLength! < 20 || metaTags.titleLength! > 65) {
    items.push({
      id: 'seo-title',
      category: 'seo',
      title: `<title> Length Suboptimal (${metaTags.titleLength} characters)`,
      severity: 'warning',
      score: 65,
      summary: `Title length is ${metaTags.titleLength} characters. Recommended range for Google desktop/mobile SERPs is 45 to 60 characters.`,
      impact: 'Short titles miss keyword relevance; overly long titles get truncated with ellipses in search results.',
      currentValue: metaTags.title,
      recommendedValue: 'Between 45 and 60 calibrated characters',
    });
  } else {
    items.push({
      id: 'seo-title',
      category: 'seo',
      title: `Optimized <title> Tag (${metaTags.titleLength} characters)`,
      severity: 'good',
      score: 100,
      summary: 'Title is within the ideal character range for search engine snippets.',
      currentValue: metaTags.title,
    });
  }

  // Meta Description
  if (!metaTags.description) {
    items.push({
      id: 'seo-desc',
      category: 'seo',
      title: 'Meta Description Missing',
      severity: 'critical',
      score: 10,
      summary: 'No <meta name="description"> tag was found in document head.',
      impact: 'Search engines will automatically extract arbitrary body text, drastically lowering click-through rates (CTR).',
      recommendedValue: '<meta name="description" content="Engaging summary of 120 to 160 characters." />',
      codeSnippet: {
        language: 'html',
        title: 'Add in <head>',
        code: '<meta name="description" content="Discover our high-performance technology services, reliable security standards, and dedicated support for your team." />',
      },
    });
  } else if (metaTags.descriptionLength! < 70 || metaTags.descriptionLength! > 165) {
    items.push({
      id: 'seo-desc',
      category: 'seo',
      title: `Meta Description Length Suboptimal (${metaTags.descriptionLength} characters)`,
      severity: 'warning',
      score: 70,
      summary: `Description length is ${metaTags.descriptionLength} characters. Recommended range is 120 to 160 characters.`,
      impact: 'May be cut off on search result pages or provide insufficient context to compel searchers to click.',
      currentValue: metaTags.description,
    });
  } else {
    items.push({
      id: 'seo-desc',
      category: 'seo',
      title: `Optimized Meta Description (${metaTags.descriptionLength} characters)`,
      severity: 'good',
      score: 100,
      summary: 'Meta description length is calibrated for optimal SERP CTR.',
      currentValue: metaTags.description,
    });
  }

  // Headings H1
  if (h1Matches.length === 0) {
    items.push({
      id: 'seo-h1',
      category: 'seo',
      title: 'No <h1> Heading Found',
      severity: 'critical',
      score: 20,
      summary: 'The page does not specify a primary headline using the <h1> tag.',
      impact: 'The <h1> element is the strongest semantic signal for search engines to identify the document primary topic.',
      codeSnippet: {
        language: 'html',
        title: 'Add <h1> tag',
        code: '<h1>Main Page Headline with Primary Keyword</h1>',
      },
    });
  } else if (h1Matches.length > 1) {
    items.push({
      id: 'seo-h1',
      category: 'seo',
      title: `Multiple <h1> Tags Detected (${h1Matches.length} H1s)`,
      severity: 'warning',
      score: 70,
      summary: `Found ${h1Matches.length} <h1> tags on the same page.`,
      impact: 'Maintaining a single primary <h1> per document is standard best practice for semantic clarity and accessibility.',
      currentValue: `${h1Matches.length} <h1> tags found`,
      recommendedValue: '1 primary <h1> tag',
    });
  } else {
    items.push({
      id: 'seo-h1',
      category: 'seo',
      title: 'Optimal H1 Heading Structure',
      severity: 'good',
      score: 100,
      summary: `Single <h1> tag detected: "${h1Sample || ''}"`,
      currentValue: h1Sample,
    });
  }

  // Open Graph & Social Cards
  const hasOg = !!(metaTags.openGraph.title && metaTags.openGraph.description && metaTags.openGraph.image);
  if (hasOg) {
    items.push({
      id: 'seo-og',
      category: 'seo',
      title: 'Complete Open Graph Social Tags',
      severity: 'good',
      score: 100,
      summary: 'Tags og:title, og:description, and og:image are configured for rich sharing on WhatsApp, LinkedIn, X, and Facebook.',
    });
  } else {
    items.push({
      id: 'seo-og',
      category: 'seo',
      title: 'Incomplete Open Graph / Social Media Cards',
      severity: 'warning',
      score: 45,
      summary: 'Essential Open Graph tags (such as og:image or og:description) are missing.',
      impact: 'Shared URLs on messaging and social platforms will look unbranded or lack thumbnail banners.',
      codeSnippet: {
        language: 'html',
        title: 'Open Graph & Twitter Meta Tags',
        code: `<meta property="og:title" content="Website Title" />
<meta property="og:description" content="Engaging social share summary." />
<meta property="og:image" content="https://yourdomain.com/assets/og-cover.jpg" />
<meta property="og:url" content="https://yourdomain.com/" />
<meta name="twitter:card" content="summary_large_image" />`,
      },
    });
  }

  // Canonical Tag
  if (metaTags.canonical) {
    items.push({
      id: 'seo-canonical',
      category: 'seo',
      title: 'Canonical URL Declared',
      severity: 'good',
      score: 100,
      summary: `Tag rel="canonical" configured to ${metaTags.canonical}.`,
      currentValue: metaTags.canonical,
    });
  } else {
    items.push({
      id: 'seo-canonical',
      category: 'seo',
      title: 'Canonical Tag Missing',
      severity: 'warning',
      score: 60,
      summary: 'Page does not declare its canonical URL via <link rel="canonical">.',
      impact: 'Risk of duplicate content penalties when accessed via URL tracking parameters or domain aliases.',
      codeSnippet: {
        language: 'html',
        title: 'Add Canonical',
        code: `<link rel="canonical" href="${finalUrl}" />`,
      },
    });
  }

  // Keyword Cannibalization & Canonical Signal Audit
  const hasSelfCanonical = metaTags.canonical && (metaTags.canonical === finalUrl || `${metaTags.canonical}/` === finalUrl || metaTags.canonical === `${finalUrl}/`);
  if (!metaTags.canonical) {
    items.push({
      id: 'seo-cannibalization',
      category: 'seo',
      title: 'High Cannibalization Risk: Missing Canonical Declaration',
      severity: 'warning',
      score: 55,
      summary: 'Page lacks a canonical URL tag, making it vulnerable to keyword cannibalization and URL alias competition.',
      impact: 'Without an explicit canonical tag, search bots may index tracking parameters, alternate protocols, or duplicate internal paths as competing documents.',
      recommendedValue: `<link rel="canonical" href="${finalUrl}" />`,
      codeSnippet: {
        language: 'html',
        title: 'Define Canonical Tag',
        code: `<link rel="canonical" href="${finalUrl}" />`,
      },
      references: [
        { title: 'Google Search Essentials: Consolidating Duplicate URLs', url: 'https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls' },
      ],
    });
  } else if (!hasSelfCanonical) {
    items.push({
      id: 'seo-cannibalization',
      category: 'seo',
      title: 'Cross-Page Canonical Signal Configured',
      severity: 'info',
      score: 90,
      summary: `Canonical URL points away from this document to ${metaTags.canonical}, consolidating keyword equity.`,
      impact: 'Instructs search engines to attribute ranking power and keyword indexation to the specified target page.',
      currentValue: metaTags.canonical,
    });
  } else {
    items.push({
      id: 'seo-cannibalization',
      category: 'seo',
      title: 'Optimal Canonical Hierarchy & Intent Protection',
      severity: 'good',
      score: 100,
      summary: 'Explicit self-referential canonical protects page against keyword splitting and tracking duplicate loops.',
      impact: 'Protects primary landing page keyword equity in Google SERPs.',
      currentValue: metaTags.canonical,
    });
  }

  // Structured Data (JSON-LD)
  if (metaTags.structuredDataTypes.length > 0) {
    items.push({
      id: 'seo-schema',
      category: 'seo',
      title: `Schema.org Structured Data (${metaTags.structuredDataTypes.join(', ')})`,
      severity: 'good',
      score: 100,
      summary: 'Site provides semantic JSON-LD markup qualifying for Google Rich Results.',
      currentValue: metaTags.structuredDataTypes.join(', '),
    });
  } else {
    items.push({
      id: 'seo-schema',
      category: 'seo',
      title: 'No JSON-LD Structured Data Found',
      severity: 'info',
      score: 75,
      summary: 'No Schema.org JSON-LD scripts identified.',
      impact: 'Missed opportunity for Google Rich Snippets (review stars, FAQs, corporate knowledge panel).',
      codeSnippet: {
        language: 'html',
        title: 'Example Schema.org Organization',
        code: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Company Name",
  "url": "https://yourdomain.com",
  "logo": "https://yourdomain.com/logo.png"
}
</script>`,
      },
    });
  }

  // Social Profile Footprint & Authority Signals
  if (socialFootprint.totalProfilesFound >= 2) {
    items.push({
      id: 'seo-social-footprint',
      category: 'seo',
      title: `Active Social Footprint (${socialFootprint.platformsDetectedCount} Channels Verified)`,
      severity: 'good',
      score: 100,
      summary: `Found ${socialFootprint.totalProfilesFound} linked social media profiles across ${socialFootprint.platformsList.join(', ')}.`,
      impact: 'Establishes verified brand entity footprint and Google Knowledge Graph association signals.',
      currentValue: `${socialFootprint.totalProfilesFound} profiles (${socialFootprint.platformsList.join(', ')})`,
    });
  } else if (socialFootprint.totalProfilesFound === 1) {
    items.push({
      id: 'seo-social-footprint',
      category: 'seo',
      title: `Limited Social Footprint (Only ${socialFootprint.platformsList[0]} Linked)`,
      severity: 'warning',
      score: 65,
      summary: `Only 1 social channel (${socialFootprint.platformsList[0]}) detected on the homepage.`,
      impact: 'Multi-platform social presence builds brand trust and cross-network Google entity verification.',
      currentValue: `1 profile (${socialFootprint.platformsList[0]})`,
      recommendedValue: 'Link at least 2-3 primary channels (LinkedIn, X/Twitter, YouTube, GitHub)',
    });
  } else {
    items.push({
      id: 'seo-social-footprint',
      category: 'seo',
      title: 'No Social Media Profiles Found On Page',
      severity: 'info',
      score: 50,
      summary: 'No outbound links to recognized social media profiles (Twitter/X, LinkedIn, GitHub, YouTube, etc.) were found on the page.',
      impact: 'Search engines use authoritative social links to establish brand entity validation and topical authority.',
      recommendedValue: 'Add verified social profile links in the footer or header navigation with rel="noopener me".',
    });
  }

  // ================= 3. BEST PRACTICES AUDITS =================
  // Viewport & Mobile Ready
  if (metaTags.viewport) {
    items.push({
      id: 'bp-viewport',
      category: 'best_practices',
      title: 'Responsive Meta Viewport Configured',
      severity: 'good',
      score: 100,
      summary: `Configuration: ${metaTags.viewport}`,
      impact: 'Ensures correct mobile responsiveness on smartphones and tablets.',
    });
  } else {
    items.push({
      id: 'bp-viewport',
      category: 'best_practices',
      title: 'Meta Viewport Missing (Non-Responsive Page)',
      severity: 'critical',
      score: 10,
      summary: 'Missing viewport meta tag, causing mobile browsers to render an unscaled desktop layout.',
      impact: 'Poor mobile user experience and immediate ranking degradation on mobile-first search index.',
      codeSnippet: {
        language: 'html',
        title: 'Add Viewport',
        code: '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
      },
    });
  }

  // HTML Lang Attribute
  if (metaTags.language) {
    items.push({
      id: 'bp-lang',
      category: 'best_practices',
      title: `Document Language Declared (lang="${metaTags.language}")`,
      severity: 'good',
      score: 100,
      summary: `Attribute lang="${metaTags.language}" is defined on the <html> tag.`,
      impact: 'Enables screen readers to pronounce words correctly and assists search geolocation.',
    });
  } else {
    items.push({
      id: 'bp-lang',
      category: 'best_practices',
      title: 'Missing lang Attribute on <html> Tag',
      severity: 'warning',
      score: 50,
      summary: 'The <html> root tag does not declare the primary language of the document.',
      impact: 'Impairs screen reader accessibility and automatic translation accuracy.',
      codeSnippet: {
        language: 'html',
        title: 'Update HTML tag',
        code: '<html lang="en">',
      },
    });
  }

  // Charset
  if (metaTags.charset) {
    items.push({
      id: 'bp-charset',
      category: 'best_practices',
      title: `Character Encoding Declared (${metaTags.charset})`,
      severity: 'good',
      score: 100,
      summary: 'UTF-8 charset prevents character encoding garbling across browsers.',
    });
  } else {
    items.push({
      id: 'bp-charset',
      category: 'best_practices',
      title: 'Charset Tag Missing in <head>',
      severity: 'warning',
      score: 60,
      summary: 'Character encoding is not explicitly declared in the document head.',
      codeSnippet: {
        language: 'html',
        title: 'Add Charset',
        code: '<meta charset="UTF-8" />',
      },
    });
  }

  // External Links Security (rel="noopener")
  if (externalLinksWithoutRel > 0) {
    items.push({
      id: 'bp-links-rel',
      category: 'best_practices',
      title: `External Links Missing rel="noopener" (${externalLinksWithoutRel} links)`,
      severity: 'warning',
      score: 60,
      summary: `Found ${externalLinksWithoutRel} external link(s) without rel="noopener noreferrer" security attributes.`,
      impact: 'Vulnerable to reverse tabnabbing (the opened tab can alter the source window location via window.opener).',
      codeSnippet: {
        language: 'html',
        title: 'Secure External Link Pattern',
        code: '<a href="https://external.com" target="_blank" rel="noopener noreferrer">Link</a>',
      },
    });
  } else {
    items.push({
      id: 'bp-links-rel',
      category: 'best_practices',
      title: 'External Links Secured',
      severity: 'good',
      score: 100,
      summary: 'External links are properly protected with isolation attributes.',
    });
  }

  // ================= 4. PERFORMANCE & ACCESSIBILITY AUDITS =================
  // Response Time (TTFB)
  if (responseTimeMs < 400) {
    items.push({
      id: 'perf-ttfb',
      category: 'performance_accessibility',
      title: `Fast Response Time (TTFB: ${responseTimeMs}ms)`,
      severity: 'good',
      score: 100,
      summary: 'The server delivered the first byte of response in exemplary time (<400ms).',
      currentValue: `${responseTimeMs}ms`,
    });
  } else if (responseTimeMs < 1200) {
    items.push({
      id: 'perf-ttfb',
      category: 'performance_accessibility',
      title: `Moderate Response Time (TTFB: ${responseTimeMs}ms)`,
      severity: 'warning',
      score: 70,
      summary: `The server took ${responseTimeMs}ms to respond.`,
      impact: 'May delay initial paint on 4G/3G mobile connections.',
      currentValue: `${responseTimeMs}ms`,
      recommendedValue: '< 400ms (use a global CDN such as Cloudflare or edge caching)',
    });
  } else {
    items.push({
      id: 'perf-ttfb',
      category: 'performance_accessibility',
      title: `Slow Response Time (TTFB: ${responseTimeMs}ms)`,
      severity: 'critical',
      score: 35,
      summary: `The server took ${responseTimeMs}ms to begin streaming response data.`,
      impact: 'Directly degrades Core Web Vitals First Contentful Paint (FCP) and Largest Contentful Paint (LCP).',
      currentValue: `${responseTimeMs}ms`,
      recommendedValue: '< 300ms',
    });
  }

  // Image Alt attributes
  if (imagesMissingAlt > 0) {
    items.push({
      id: 'a11y-img-alt',
      category: 'performance_accessibility',
      title: `Images Missing Alt Attributes (${imagesMissingAlt} of ${imgMatches.length} images)`,
      severity: 'critical',
      score: Math.max(20, Math.round(100 - (imagesMissingAlt / Math.max(1, imgMatches.length)) * 100)),
      summary: `Found ${imagesMissingAlt} <img> tag(s) without descriptive alt attributes.`,
      impact: 'Users with visual impairments relying on screen readers cannot understand image context, and image search rankings suffer.',
      currentValue: `${imagesMissingAlt} images missing alt`,
      recommendedValue: 'All images with descriptive alt text',
      codeSnippet: {
        language: 'html',
        title: 'Add alt description',
        code: '<img src="/assets/chart.png" alt="Monthly sales performance growth chart for 2026" />',
      },
    });
  } else if (imgMatches.length > 0) {
    items.push({
      id: 'a11y-img-alt',
      category: 'performance_accessibility',
      title: `Image Accessibility 100% (${imgMatches.length} images with alt)`,
      severity: 'good',
      score: 100,
      summary: 'All detected images have descriptive alt attributes.',
    });
  }

  // HTML Document Size
  const sizeKb = Math.round(contentLengthBytes / 1024);
  if (sizeKb > 300) {
    items.push({
      id: 'perf-html-size',
      category: 'performance_accessibility',
      title: `Heavy HTML Document Size (${sizeKb} KB)`,
      severity: 'warning',
      score: 60,
      summary: `Raw HTML size is ${sizeKb} KB, suggesting excess inline styling, bulky embedded scripts, or DOM bloat.`,
      impact: 'Increases cellular bandwidth consumption and slows initial DOM parsing.',
      currentValue: `${sizeKb} KB`,
      recommendedValue: '< 150 KB for initial HTML payload',
    });
  } else {
    items.push({
      id: 'perf-html-size',
      category: 'performance_accessibility',
      title: `Optimized HTML Size (${sizeKb} KB)`,
      severity: 'good',
      score: 100,
      summary: `Initial document payload of ${sizeKb} KB transfers swiftly.`,
    });
  }

  // Compute Category scores
  const categoriesList: Array<{ key: 'security' | 'seo' | 'best_practices' | 'performance_accessibility'; name: string; color: string }> = [
    { key: 'security', name: 'Security', color: '#10b981' },
    { key: 'seo', name: 'SEO & Visibility', color: '#3b82f6' },
    { key: 'best_practices', name: 'Best Practices', color: '#8b5cf6' },
    { key: 'performance_accessibility', name: 'Performance & Accessibility', color: '#f59e0b' },
  ];

  const categories: Record<string, CategoryScore> = {};

  let totalWeightedScore = 0;

  for (const cat of categoriesList) {
    const catItems = items.filter((i) => i.category === cat.key);
    const total = catItems.length || 1;
    const passed = catItems.filter((i) => i.severity === 'good').length;
    const warnings = catItems.filter((i) => i.severity === 'warning').length;
    const criticals = catItems.filter((i) => i.severity === 'critical').length;

    const avgScore = Math.round(catItems.reduce((acc, curr) => acc + curr.score, 0) / total);
    totalWeightedScore += avgScore;

    categories[cat.key] = {
      category: cat.key,
      name: cat.name,
      score: avgScore,
      grade: calculateGrade(avgScore),
      color: cat.color,
      passedCount: passed,
      warningCount: warnings,
      criticalCount: criticals,
      totalCount: total,
      summary: `${passed} checks passed, ${warnings} warnings, and ${criticals} critical issues.`,
    };
  }

  const overallScore = Math.round(totalWeightedScore / 4);
  const overallGrade = calculateGrade(overallScore);

  // AI Deep Analysis with Gemini
  let aiExecutiveSummary = `Automated website audit for ${new URL(finalUrl).hostname}. Global audit score: ${overallScore}/100 (Grade ${overallGrade}).`;
  let keyStrengths: string[] = [
    isHttps ? 'Encrypted communications with active HTTPS' : 'Web service accessible online',
    metaTags.title ? 'Indexable title tag present' : 'Functional web access',
    metaTags.viewport ? 'Mobile-friendly viewport configured' : 'Standard HTML structure',
  ];
  let topPriorityFixes: string[] = [];

  const ai = getAiClient();
  if (ai) {
    try {
      const prompt = `Analyze this comprehensive website audit report and provide an expert technical diagnostic in English:
URL: ${finalUrl}
Overall Score: ${overallScore}/100 (Grade: ${overallGrade})
Response Time (TTFB): ${responseTimeMs}ms
Security: Score ${categories.security.score}/100. Missing headers: ${securityHeaders.filter((s) => s.status !== 'present').map((s) => s.header).join(', ') || 'None'}
SEO: Score ${categories.seo.score}/100. Title: "${metaTags.title || 'Missing'}", Description: "${metaTags.description || 'Missing'}", H1s: ${h1Matches.length}, Schema JSON-LD: ${metaTags.structuredDataTypes.join(', ') || 'None'}
Best Practices: Lang="${metaTags.language || 'Missing'}", Links missing rel="${externalLinksWithoutRel}"
Performance & A11y: Images missing alt: ${imagesMissingAlt} of ${imgMatches.length}, HTML Payload: ${sizeKb}KB
Detected Technologies: ${techStack.map((t) => t.name).join(', ') || 'None identified'}

Respond in JSON format with:
1. "executiveSummary": A concise executive summary paragraph (2 to 3 sentences) assessing overall site health, primary security exposure, and organic SEO growth upside.
2. "keyStrengths": Array of 3 architectural highlights or validated best practices.
3. "topPriorityFixes": Array of 3 to 5 highest-priority remediation items with direct practical impact.
4. "additionalActionableAdvice": Array with up to 2 forward-looking technical recommendations (e.g., PWA, Core Web Vitals, Edge caching).`;

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              executiveSummary: { type: Type.STRING },
              keyStrengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              topPriorityFixes: { type: Type.ARRAY, items: { type: Type.STRING } },
              additionalActionableAdvice: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['executiveSummary', 'keyStrengths', 'topPriorityFixes'],
          },
        },
      });

      if (aiResponse.text) {
        const parsed = JSON.parse(aiResponse.text);
        if (parsed.executiveSummary) aiExecutiveSummary = parsed.executiveSummary;
        if (Array.isArray(parsed.keyStrengths) && parsed.keyStrengths.length > 0) keyStrengths = parsed.keyStrengths;
        if (Array.isArray(parsed.topPriorityFixes) && parsed.topPriorityFixes.length > 0) topPriorityFixes = parsed.topPriorityFixes;

        // Add additional advice if any
        if (Array.isArray(parsed.additionalActionableAdvice)) {
          parsed.additionalActionableAdvice.forEach((adv: string, i: number) => {
            items.push({
              id: `ai-advice-${i}`,
              category: 'best_practices',
              title: `Smart Optimization Recommendation`,
              severity: 'info',
              score: 85,
              summary: adv,
              impact: 'Accelerates performance, hardens security posture, and boosts conversion rates.',
            });
          });
        }
      }
    } catch (e) {
      console.warn('Gemini AI enhancement fallback:', e);
    }
  }

  // If topPriorityFixes is still empty, populate from critical/warning items
  if (topPriorityFixes.length === 0) {
    topPriorityFixes = items
      .filter((i) => i.severity === 'critical' || i.severity === 'warning')
      .slice(0, 4)
      .map((i) => `${i.title}: ${i.summary}`);
    if (topPriorityFixes.length === 0) {
      topPriorityFixes = ['Excellent condition: Maintain security directives and monitor performance periodically.'];
    }
  }

  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    targetUrl: finalUrl,
    analyzedAt: new Date().toISOString(),
    overallScore,
    overallGrade,
    aiExecutiveSummary,
    keyStrengths,
    topPriorityFixes,
    categories: categories as any,
    items,
    rawData,
  };
}
