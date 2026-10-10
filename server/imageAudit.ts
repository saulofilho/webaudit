import { URL } from 'url';
import fs from 'fs';
import path from 'path';
import { ImageAuditItem, ImageAuditSummary, ImageAltStatus } from '../src/types';

function cleanFileName(src: string): string {
  try {
    const urlObj = new URL(src.startsWith('http') ? src : `https://example.com/${src.replace(/^\//, '')}`);
    const pathname = urlObj.pathname;
    const parts = pathname.split('/').filter(Boolean);
    const last = parts[parts.length - 1] || 'image';
    return decodeURIComponent(last.split('?')[0].split('#')[0]);
  } catch {
    return 'image';
  }
}

function detectFormat(src: string): ImageAuditItem['format'] {
  const lower = src.toLowerCase().split('?')[0].split('#')[0];
  if (lower.endsWith('.webp')) return 'webp';
  if (lower.endsWith('.png')) return 'png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'jpeg';
  if (lower.endsWith('.svg')) return 'svg';
  if (lower.endsWith('.avif')) return 'avif';
  if (lower.endsWith('.gif')) return 'gif';
  return 'unknown';
}

function generateSmartAltSuggestion(
  filename: string,
  contextRole: ImageAuditItem['contextRole'],
  parentTextContext: string,
  pageTitle: string
): string {
  // Strip extension
  let baseName = filename.replace(/\.(webp|png|jpe?g|svg|avif|gif)$/i, '');
  // Remove hash/uuid chunks (e.g., -a8f7c9e, _1280x720, -v2)
  baseName = baseName
    .replace(/[-_][a-f0-9]{6,}/gi, '')
    .replace(/[-_]\d+x\d+/gi, '')
    .replace(/[-_]v\d+/gi, '')
    .replace(/[-_]/g, ' ')
    .trim();

  // If role is brand logo
  if (contextRole === 'brand_logo') {
    const brandName = pageTitle ? pageTitle.split(/[-|–:]/)[0].trim() : 'Company';
    return `${brandName} official logo`;
  }

  // If role is avatar
  if (contextRole === 'avatar') {
    if (baseName && !/avatar|user|profile|photo/i.test(baseName)) {
      return `Profile photo of ${baseName.replace(/\b\w/g, (c) => c.toUpperCase())}`;
    }
    return `User profile avatar`;
  }

  // If role is icon
  if (contextRole === 'icon' || contextRole === 'decorative') {
    return ''; // Suggest marking as decorative (alt="")
  }

  // If role is linked CTA
  if (contextRole === 'linked_cta' && parentTextContext) {
    return `Navigate to ${parentTextContext.slice(0, 50).trim()}`;
  }

  // If clean baseName is meaningful
  if (baseName.length >= 4 && !/^(img|image|picture|dsc|screenshot|photo|asset|graphic)\d*$/i.test(baseName)) {
    // Capitalize first letter
    const humanized = baseName.charAt(0).toUpperCase() + baseName.slice(1);
    return `${humanized}`;
  }

  // Fallback using surrounding context or page title
  if (parentTextContext && parentTextContext.length > 5) {
    return parentTextContext.slice(0, 65).trim();
  }

  if (pageTitle) {
    const cleanTitle = pageTitle.split(/[-|–]/)[0].trim();
    return `Illustration for ${cleanTitle}`;
  }

  return 'Visual representation of page content';
}

function evaluateAltQuality(
  altAttr: string | null,
  hasAltAttr: boolean,
  contextRole: ImageAuditItem['contextRole'],
  isInsideLinkWithoutText: boolean
): {
  status: ImageAltStatus;
  issues: string[];
  wcagCriteria: string[];
} {
  const issues: string[] = [];
  const wcagCriteria: string[] = [];

  // 1. Missing alt attribute altogether
  if (!hasAltAttr || altAttr === null) {
    issues.push('Missing "alt" attribute entirely. Screen readers will read the raw image URL.');
    wcagCriteria.push('WCAG 2.1 - 1.1.1 Non-Text Content (Level A)');
    if (isInsideLinkWithoutText) {
      issues.push('Enclosed in interactive <a> tag with no accessible link text.');
      wcagCriteria.push('WCAG 2.1 - 2.4.4 Link Purpose (In Context) (Level A)');
      wcagCriteria.push('WCAG 2.1 - 4.1.2 Name, Role, Value (Level A)');
    }
    return { status: 'missing', issues, wcagCriteria };
  }

  const trimmed = altAttr.trim();

  // 2. Empty alt=""
  if (trimmed === '') {
    if (isInsideLinkWithoutText) {
      issues.push('Image is the only content inside a link, but alt="" leaves the link with NO accessible name.');
      wcagCriteria.push('WCAG 2.1 - 2.4.4 Link Purpose (In Context)');
      wcagCriteria.push('WCAG 2.1 - 4.1.2 Name, Role, Value');
      return { status: 'low_quality', issues, wcagCriteria };
    }
    // Decorative image is valid WCAG compliance if intentional
    return { status: 'empty', issues: ['Explicitly marked empty (decorative image).'], wcagCriteria: [] };
  }

  // 3. Low quality checks
  const lower = trimmed.toLowerCase();
  const filenamePattern = /\.(png|jpe?g|webp|svg|gif|avif)$/i;
  const genericPlaceholders = /^(image|img|photo|picture|pic|graphic|banner|logo|icon|placeholder|dsc_\d+|screenshot)\b/i;
  const redundantPrefixes = /^(image of|picture of|photo of|graphic of|an image showing|a photo of)/i;

  if (filenamePattern.test(trimmed)) {
    issues.push('Alt text contains raw file extension ("' + trimmed + '").');
    wcagCriteria.push('WCAG 2.1 - 1.1.1 Non-Text Content');
  }

  if (genericPlaceholders.test(trimmed) && trimmed.length < 15) {
    issues.push('Generic placeholder alt text ("' + trimmed + '") provides zero descriptive value.');
    wcagCriteria.push('WCAG 2.1 - 1.1.1 Non-Text Content');
  }

  if (redundantPrefixes.test(lower)) {
    issues.push('Redundant prefix detected ("' + trimmed.split(' ')[0] + ' ' + trimmed.split(' ')[1] + '..."). Screen readers already announce "graphic/image".');
  }

  if (trimmed.length > 150) {
    issues.push(`Overly verbose alt text (${trimmed.length} chars). Keep concise, under 100 characters.`);
  }

  if (issues.length > 0) {
    return { status: 'low_quality', issues, wcagCriteria };
  }

  return { status: 'compliant', issues: [], wcagCriteria: [] };
}

function parseImagesFromHtml(html: string, pageUrl: string, pageTitle: string): ImageAuditItem[] {
  const items: ImageAuditItem[] = [];
  const imgRegex = /<img\b([^>]*)>/gi;
  let match: RegExpExecArray | null;

  let counter = 0;
  while ((match = imgRegex.exec(html)) !== null) {
    counter++;
    const fullTag = match[0];
    const attrs = match[1];

    // Extract src or data-src
    const srcMatch = attrs.match(/\bsrc\s*=\s*["']([^"']*)["']/i) ||
                     attrs.match(/\bdata-src\s*=\s*["']([^"']*)["']/i) ||
                     attrs.match(/\bsrcset\s*=\s*["']([^"'\s,]+)/i);

    const rawSrc = srcMatch ? srcMatch[1].trim() : '';
    if (!rawSrc || rawSrc.startsWith('data:image/svg+xml;base64,PHN2Zy')) {
      // Skip inline micro data SVGs or empty
      if (!rawSrc) continue;
    }

    let absoluteUrl = rawSrc;
    try {
      absoluteUrl = new URL(rawSrc, pageUrl).href;
    } catch {
      absoluteUrl = rawSrc;
    }

    // Extract alt attribute
    const hasAltAttr = /\balt\s*=/i.test(attrs);
    let altValue: string | null = null;
    if (hasAltAttr) {
      const altMatch = attrs.match(/\balt\s*=\s*["']([^"']*)["']/i);
      altValue = altMatch ? altMatch[1] : '';
    }

    // Extract dimensions
    const widthMatch = attrs.match(/\bwidth\s*=\s*["']?(\d+)["']?/i);
    const heightMatch = attrs.match(/\bheight\s*=\s*["']?(\d+)["']?/i);
    const width = widthMatch ? parseInt(widthMatch[1], 10) : undefined;
    const height = heightMatch ? parseInt(heightMatch[1], 10) : undefined;

    // Loading attribute
    const loadingMatch = attrs.match(/\bloading\s*=\s*["'](lazy|eager)["']/i);
    const loadingAttr = loadingMatch ? (loadingMatch[1].toLowerCase() as 'lazy' | 'eager') : 'auto';

    // Context analysis
    const tagIndex = match.index;
    const preContext = html.slice(Math.max(0, tagIndex - 350), tagIndex);
    const postContext = html.slice(tagIndex + fullTag.length, tagIndex + fullTag.length + 350);

    const isInsideLink = /<a\b[^>]*>(?:(?!<\/a>)[\s\S])*$/i.test(preContext);
    let isInsideLinkWithoutText = false;
    let parentTextContext = '';

    if (isInsideLink) {
      // Check link text around image
      const linkMatch = preContext.match(/<a\b([^>]*)>([\s\S]*)$/i);
      const postLinkMatch = postContext.match(/^([\s\S]*?)<\/a>/i);
      const combinedLinkContent = (linkMatch ? linkMatch[2] : '') + (postLinkMatch ? postLinkMatch[1] : '');
      const strippedText = combinedLinkContent.replace(/<[^>]+>/g, '').trim();
      parentTextContext = strippedText;
      if (strippedText.length === 0) {
        isInsideLinkWithoutText = true;
      }
    }

    // Context role determination
    let contextRole: ImageAuditItem['contextRole'] = 'article';
    const filename = cleanFileName(absoluteUrl);
    const lowerFilename = filename.toLowerCase();

    if (/logo|brand|trademark/i.test(attrs) || /logo|brand/i.test(lowerFilename) || /<header\b/i.test(preContext)) {
      contextRole = 'brand_logo';
    } else if (/avatar|user|author|profile|testimonial/i.test(attrs) || /avatar|user|author/i.test(lowerFilename)) {
      contextRole = 'avatar';
    } else if (/icon|badge|bullet|arrow|chevron|caret/i.test(attrs) || /icon|badge/i.test(lowerFilename) || (width && height && width <= 32 && height <= 32)) {
      contextRole = 'icon';
    } else if (isInsideLink) {
      contextRole = 'linked_cta';
    } else if (counter <= 2 && (/hero|banner|cover|masthead/i.test(attrs) || /hero|banner|cover/i.test(lowerFilename) || (width && width >= 800))) {
      contextRole = 'hero';
    } else if (/<figure\b/i.test(preContext)) {
      contextRole = 'figure';
    }

    // Check surrounding heading if empty parent text
    if (!parentTextContext) {
      const headingMatch = preContext.match(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i) ||
                           postContext.match(/<h[1-4][^>]*>([\s\S]*?)<\/h[1-4]>/i);
      if (headingMatch && headingMatch[1]) {
        parentTextContext = headingMatch[1].replace(/<[^>]+>/g, '').trim();
      }
    }

    const { status, issues, wcagCriteria } = evaluateAltQuality(
      altValue,
      hasAltAttr,
      contextRole,
      isInsideLinkWithoutText
    );

    const isDecorative = (hasAltAttr && altValue === '') || contextRole === 'icon';

    const suggestedAlt = isDecorative
      ? ''
      : generateSmartAltSuggestion(filename, contextRole, parentTextContext, pageTitle);

    // Remediation snippet
    const safeSuggested = suggestedAlt.replace(/"/g, '&quot;');
    const remediationSnippet = `<img src="${rawSrc}" alt="${safeSuggested}"${loadingAttr !== 'auto' ? ` loading="${loadingAttr}"` : ''} />`;

    items.push({
      id: `img-${counter}-${Date.now().toString(36)}`,
      url: absoluteUrl,
      pageUrl,
      alt: altValue,
      status,
      suggestedAlt,
      remediatedAlt: suggestedAlt,
      isDecorative,
      format: detectFormat(absoluteUrl),
      contextRole,
      parentTag: isInsideLink ? 'a' : /<figure\b/i.test(preContext) ? 'figure' : 'div',
      parentTextContext: parentTextContext.slice(0, 100),
      filename,
      dimensions: width || height ? { width, height } : undefined,
      loadingAttr,
      issues,
      wcagCriteriaViolated: wcagCriteria,
      remediationSnippet,
    });
  }

  return items;
}

export async function auditImages(
  targetUrl: string,
  sampleHtml?: string,
  crawlAdditionalPages: boolean = true
): Promise<ImageAuditSummary> {
  let primaryHtml = sampleHtml || '';
  let finalTargetUrl = targetUrl.trim();
  if (!finalTargetUrl.startsWith('http://') && !finalTargetUrl.startsWith('https://')) {
    finalTargetUrl = 'https://' + finalTargetUrl;
  }

  let pageTitle = '';
  const discoveredInternalPages: string[] = [];

  // Fetch target URL if sampleHtml not provided
  const isSelfAudit =
    finalTargetUrl.includes('webauditpro') ||
    finalTargetUrl.includes('localhost') ||
    finalTargetUrl.includes('127.0.0.1') ||
    finalTargetUrl.includes('.run.app');

  if (isSelfAudit && !primaryHtml) {
    try {
      const idx = path.join(process.cwd(), 'index.html');
      if (fs.existsSync(idx)) {
        primaryHtml = fs.readFileSync(idx, 'utf-8');
      }
    } catch {
      // fallback
    }
  }

  if (!primaryHtml) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);
      const res = await fetch(finalTargetUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) WebAuditBot/ImageAudit/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/*,*/*;q=0.8',
        },
      });
      clearTimeout(timeout);
      primaryHtml = await res.text();
      finalTargetUrl = res.url || finalTargetUrl;
    } catch (err: any) {
      console.warn('Could not fetch main HTML for image audit:', err.message);
      primaryHtml = `<html><head><title>Audited Site</title></head><body><p>Site could not be fetched directly.</p></body></html>`;
    }
  }

  const titleMatch = primaryHtml.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    pageTitle = titleMatch[1].trim();
  }

  // Find up to 3 internal pages to inspect for multi-page scanning
  const parsedHost = new URL(finalTargetUrl).hostname;
  const linkMatches = [...primaryHtml.matchAll(/<a\b[^>]*\bhref=["']([^"']*)["']/gi)];
  for (const m of linkMatches) {
    const rawHref = m[1];
    if (rawHref && !rawHref.startsWith('#') && !rawHref.startsWith('javascript:')) {
      try {
        const resolved = new URL(rawHref, finalTargetUrl);
        if (resolved.hostname === parsedHost && !discoveredInternalPages.includes(resolved.href) && resolved.href !== finalTargetUrl) {
          discoveredInternalPages.push(resolved.href);
          if (discoveredInternalPages.length >= 3) break;
        }
      } catch {
        // ignore
      }
    }
  }

  let allImages: ImageAuditItem[] = parseImagesFromHtml(primaryHtml, finalTargetUrl, pageTitle);

  // If enabled, fetch up to 2 additional pages for comprehensive audit across pages
  let pagesAnalyzedCount = 1;
  if (crawlAdditionalPages && discoveredInternalPages.length > 0) {
    const pagesToFetch = discoveredInternalPages.slice(0, 2);
    for (const subPage of pagesToFetch) {
      try {
        const ctrl = new AbortController();
        const tId = setTimeout(() => ctrl.abort(), 6000);
        const subRes = await fetch(subPage, {
          signal: ctrl.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) WebAuditBot/ImageAudit/1.0',
          },
        });
        clearTimeout(tId);
        if (subRes.ok) {
          const subHtml = await subRes.text();
          const subTitle = (subHtml.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1] || '').trim();
          const subImages = parseImagesFromHtml(subHtml, subPage, subTitle || pageTitle);
          allImages.push(...subImages);
          pagesAnalyzedCount++;
        }
      } catch {
        // ignore subpage errors
      }
    }
  }

  // Deduplicate by URL and page
  const seenKeys = new Set<string>();
  allImages = allImages.filter((img) => {
    const key = `${img.url}::${img.pageUrl}`;
    if (seenKeys.has(key)) return false;
    seenKeys.add(key);
    return true;
  });

  // Calculate statistics
  const totalImages = allImages.length;
  const missingAltCount = allImages.filter((i) => i.status === 'missing').length;
  const emptyAltCount = allImages.filter((i) => i.status === 'empty').length;
  const lowQualityCount = allImages.filter((i) => i.status === 'low_quality').length;
  const compliantCount = allImages.filter((i) => i.status === 'compliant').length;

  // Format distribution
  const formatDistribution: Record<string, number> = {};
  for (const img of allImages) {
    formatDistribution[img.format] = (formatDistribution[img.format] || 0) + 1;
  }

  // Score calculation
  let wcag111Score = 100;
  if (totalImages > 0) {
    const defectPenalty = (missingAltCount * 25 + lowQualityCount * 12) / totalImages;
    wcag111Score = Math.max(0, Math.min(100, Math.round(100 - defectPenalty)));
  }

  let wcagGrade: ImageAuditSummary['wcagGrade'] = 'F';
  if (wcag111Score >= 95) wcagGrade = 'A+';
  else if (wcag111Score >= 90) wcagGrade = 'A';
  else if (wcag111Score >= 80) wcagGrade = 'B';
  else if (wcag111Score >= 70) wcagGrade = 'C';
  else if (wcag111Score >= 60) wcagGrade = 'D';

  const quickWins: string[] = [];
  if (missingAltCount > 0) {
    quickWins.push(`Add descriptive alt attributes to ${missingAltCount} images to eliminate critical WCAG 1.1.1 violations.`);
  }
  const linkedImagesWithoutText = allImages.filter((i) => i.contextRole === 'linked_cta' && (i.status === 'missing' || i.status === 'empty')).length;
  if (linkedImagesWithoutText > 0) {
    quickWins.push(`Provide accessible alt text for ${linkedImagesWithoutText} clickable thumbnail links that currently have no accessible name.`);
  }
  if (lowQualityCount > 0) {
    quickWins.push(`Replace ${lowQualityCount} generic placeholders and file extensions with context-aware descriptions.`);
  }
  if (formatDistribution['png'] || formatDistribution['jpeg']) {
    quickWins.push('Convert legacy PNG/JPEG imagery to modern WebP or AVIF formats for enhanced performance and faster LCP load times.');
  }

  return {
    targetUrl: finalTargetUrl,
    totalImages,
    missingAltCount,
    emptyAltCount,
    lowQualityCount,
    compliantCount,
    wcag111Score,
    wcagGrade,
    pagesAnalyzedCount,
    formatDistribution,
    images: allImages,
    quickWins,
  };
}
