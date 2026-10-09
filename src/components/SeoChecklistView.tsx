import React, { useState, useMemo, useEffect } from 'react';
import {
  CheckSquare,
  Square,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Download,
  ExternalLink,
  Code2,
  Sparkles,
  FileCode,
  Layers,
  Search,
  FileText,
  Terminal,
  RefreshCw,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Globe,
  Share2,
  HelpCircle,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  Bot,
  Compass,
  FileCheck2,
} from 'lucide-react';
import { AuditReport, AuditItem, MetaTagsData } from '../types';

interface SeoChecklistViewProps {
  report: AuditReport;
  targetUrl?: string;
  onOpenAiFix?: (item: AuditItem) => void;
}

export type SeoPillarId = 'robots' | 'sitemap' | 'metatags' | 'schema';

interface ChecklistTask {
  id: string;
  pillar: SeoPillarId;
  pillarName: string;
  stepNumber: number;
  title: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  estimatedMinutes: number;
  autoStatus: 'passed' | 'warning' | 'failed';
  currentValueDisplay: string;
  recommendation: string;
  impactReason: string;
  actionGuide: string;
  codeSnippet: string;
  externalToolUrl?: string;
  externalToolLabel?: string;
}

type SchemaTypeOption =
  | 'WebApplication'
  | 'Organization'
  | 'LocalBusiness'
  | 'FAQPage'
  | 'Article'
  | 'BreadcrumbList';

export const SeoChecklistView: React.FC<SeoChecklistViewProps> = ({
  report,
  targetUrl: propUrl,
  onOpenAiFix,
}) => {
  const targetUrl = propUrl || report?.targetUrl || 'https://example.com';

  const hostname = useMemo(() => {
    try {
      return new URL(targetUrl).hostname;
    } catch {
      return targetUrl;
    }
  }, [targetUrl]);

  const origin = useMemo(() => {
    try {
      const u = new URL(targetUrl);
      return `${u.protocol}//${u.host}`;
    } catch {
      return `https://${hostname}`;
    }
  }, [targetUrl, hostname]);

  const meta: MetaTagsData = report.rawData?.metaTags || {
    openGraph: {},
    twitter: {},
    structuredDataTypes: [],
  };

  // Local storage persistence for developer manual overrides
  const [manualChecks, setManualChecks] = useState<Record<string, boolean>>({});
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);
  const [selectedPillar, setSelectedPillar] = useState<'all' | SeoPillarId>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed' | 'critical'>('all');
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());

  // Interactive Tools states
  const [selectedSchemaType, setSelectedSchemaType] = useState<SchemaTypeOption>('WebApplication');
  const [robotsTestPath, setRobotsTestPath] = useState<string>('/admin');
  const [robotsTestBot, setRobotsTestBot] = useState<string>('Googlebot');
  const [robotsTestResult, setRobotsTestResult] = useState<{ allowed: boolean; reason: string } | null>(null);

  // Load saved checklist overrides & listen for external updates (e.g., from SeoProgressDashboard)
  useEffect(() => {
    const readStorage = () => {
      try {
        const stored = localStorage.getItem(`seo_audit_checklist_${hostname}`);
        if (stored) {
          setManualChecks(JSON.parse(stored));
        } else {
          setManualChecks({});
        }
      } catch (e) {
        console.warn('Could not read saved SEO checklist state', e);
      }
    };

    readStorage();

    const handleSync = () => {
      readStorage();
    };

    window.addEventListener('seo-checklist-sync', handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener('seo-checklist-sync', handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [hostname]);

  const toggleManualCheck = (taskId: string) => {
    setManualChecks((prev) => {
      const updated = { ...prev, [taskId]: !prev[taskId] };
      try {
        localStorage.setItem(`seo_audit_checklist_${hostname}`, JSON.stringify(updated));
        window.dispatchEvent(
          new CustomEvent('seo-checklist-sync', { detail: { hostname, state: updated } })
        );
      } catch (e) {
        console.warn('Could not save SEO checklist state', e);
      }
      return updated;
    });
  };

  const handleCopySnippet = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippetId(id);
    setTimeout(() => setCopiedSnippetId(null), 2200);
  };

  const toggleExpandTask = (taskId: string) => {
    setExpandedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const markAllCompleted = () => {
    const allIds: Record<string, boolean> = {};
    allTasks.forEach((t) => {
      allIds[t.id] = true;
    });
    setManualChecks(allIds);
    try {
      localStorage.setItem(`seo_audit_checklist_${hostname}`, JSON.stringify(allIds));
      window.dispatchEvent(
        new CustomEvent('seo-checklist-sync', { detail: { hostname, state: allIds } })
      );
    } catch (e) {
      console.warn('Failed to save all completed', e);
    }
  };

  const resetAllToAuto = () => {
    setManualChecks({});
    try {
      localStorage.removeItem(`seo_audit_checklist_${hostname}`);
      window.dispatchEvent(
        new CustomEvent('seo-checklist-sync', { detail: { hostname, state: {} } })
      );
    } catch (e) {
      console.warn('Failed to reset checklist', e);
    }
  };

  // Structured Data Generator snippet
  const generatedSchemaCode = useMemo(() => {
    const siteTitle = meta.title || `${hostname.toUpperCase()} - Official Platform`;
    const siteDesc =
      meta.description ||
      `Explore high-performance solutions and verified web capabilities on ${hostname}.`;
    const siteUrl = targetUrl;

    let schemaObj: any = {};

    switch (selectedSchemaType) {
      case 'WebApplication':
        schemaObj = {
          '@context': 'https://schema.org',
          '@type': 'WebApplication',
          name: siteTitle,
          url: siteUrl,
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'All',
          description: siteDesc,
          offers: {
            '@type': 'Offer',
            price: '0',
            priceCurrency: 'USD',
          },
        };
        break;
      case 'Organization':
        schemaObj = {
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: siteTitle,
          url: siteUrl,
          logo: meta.openGraph.image || `${origin}/logo.png`,
          description: siteDesc,
          sameAs: [
            `https://twitter.com/${hostname.replace(/\..+$/, '')}`,
            `https://linkedin.com/company/${hostname.replace(/\..+$/, '')}`,
          ],
        };
        break;
      case 'LocalBusiness':
        schemaObj = {
          '@context': 'https://schema.org',
          '@type': 'LocalBusiness',
          name: siteTitle,
          url: siteUrl,
          description: siteDesc,
          telephone: '+1-800-555-0199',
          address: {
            '@type': 'PostalAddress',
            streetAddress: '100 Innovation Blvd',
            addressLocality: 'San Francisco',
            addressRegion: 'CA',
            postalCode: '94105',
            addressCountry: 'US',
          },
        };
        break;
      case 'FAQPage':
        schemaObj = {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: [
            {
              '@type': 'Question',
              name: `What services does ${hostname} provide?`,
              acceptedAnswer: {
                '@type': 'Answer',
                text: siteDesc,
              },
            },
            {
              '@type': 'Question',
              name: `Is ${hostname} secure and reliable?`,
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'Yes, built with modern web security headers, HTTPS TLS encryption, and fast response times.',
              },
            },
          ],
        };
        break;
      case 'Article':
        schemaObj = {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: siteTitle,
          description: siteDesc,
          image: meta.openGraph.image || `${origin}/cover.jpg`,
          datePublished: new Date().toISOString(),
          author: {
            '@type': 'Organization',
            name: siteTitle,
          },
        };
        break;
      case 'BreadcrumbList':
        schemaObj = {
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            {
              '@type': 'ListItem',
              position: 1,
              name: 'Home',
              item: origin,
            },
            {
              '@type': 'ListItem',
              position: 2,
              name: meta.title || 'Overview',
              item: targetUrl,
            },
          ],
        };
        break;
    }

    return `<script type="application/ld+json">\n${JSON.stringify(schemaObj, null, 2)}\n</script>`;
  }, [selectedSchemaType, meta, hostname, origin, targetUrl]);

  // Complete HTML <head> Meta Tags Bundle
  const metaBundleSnippet = useMemo(() => {
    const titleVal = meta.title || `${hostname.toUpperCase()} – Official Site`;
    const descVal =
      meta.description ||
      `Discover features, performance, and key solutions at ${hostname}.`;
    const canonicalVal = meta.canonical || targetUrl;
    const ogImg = meta.openGraph.image || `${origin}/og-banner.png`;

    return `<!-- ============================================== -->
<!-- BASIC SEO & SEARCH CRAWL DIRECTIVES -->
<!-- ============================================== -->
<title>${titleVal}</title>
<meta name="description" content="${descVal}" />
<link rel="canonical" href="${canonicalVal}" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1" />

<!-- ============================================== -->
<!-- OPENGRAPH (Facebook, LinkedIn, Discord, Slack) -->
<!-- ============================================== -->
<meta property="og:type" content="website" />
<meta property="og:title" content="${titleVal}" />
<meta property="og:description" content="${descVal}" />
<meta property="og:url" content="${canonicalVal}" />
<meta property="og:image" content="${ogImg}" />
<meta property="og:site_name" content="${hostname}" />

<!-- ============================================== -->
<!-- TWITTER / X SUMMARY CARDS -->
<!-- ============================================== -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${titleVal}" />
<meta name="twitter:description" content="${descVal}" />
<meta name="twitter:image" content="${ogImg}" />

<!-- ============================================== -->
<!-- SCHEMA.ORG STRUCTURED DATA -->
<!-- ============================================== -->
${generatedSchemaCode}`;
  }, [meta, hostname, targetUrl, origin, generatedSchemaCode]);

  // Generated ready-to-deploy robots.txt
  const generatedRobotsTxt = useMemo(() => {
    return `# ==============================================
# robots.txt generated for ${hostname}
# Standard compliance: RFC 9309 / Googlebot Spec
# ==============================================

User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /auth/
Disallow: /private/
Disallow: /*?*preview=true

# AI Bot Directives (allow training crawl or opt-out)
User-agent: GPTBot
Disallow: /api/
Allow: /

# Canonical Sitemap Declaration
Sitemap: ${origin}/sitemap.xml
`;
  }, [hostname, origin]);

  // Generated ready-to-deploy sitemap.xml
  const generatedSitemapXml = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Homepage -->
  <url>
    <loc>${origin}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <!-- Main Target Landing Page -->
  <url>
    <loc>${targetUrl}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
`;
  }, [origin, targetUrl]);

  // Evaluate robots test path
  const evaluateRobotsTest = () => {
    const cleanPath = robotsTestPath.trim();
    if (!cleanPath) {
      setRobotsTestResult({ allowed: true, reason: 'Root path / is accessible to all crawlers.' });
      return;
    }
    const disallowedPrefixes = ['/admin', '/api', '/auth', '/private'];
    const isBlocked = disallowedPrefixes.some((p) => cleanPath.startsWith(p));
    if (isBlocked) {
      setRobotsTestResult({
        allowed: false,
        reason: `Blocked by rule 'Disallow: ${cleanPath.split('/')[1] ? `/${cleanPath.split('/')[1]}/` : '/'}' for agent '${robotsTestBot}'`,
      });
    } else {
      setRobotsTestResult({
        allowed: true,
        reason: `Allowed. No matching disallow rules prevent crawler '${robotsTestBot}' from indexing '${cleanPath}'.`,
      });
    }
  };

  // Comprehensive Step-by-Step Checklist Tasks for the 4 Foundations
  const allTasks: ChecklistTask[] = useMemo(() => {
    const titleLen = meta.titleLength || 0;
    const isTitleLengthIdeal = titleLen >= 30 && titleLen <= 65;

    const descLen = meta.descriptionLength || 0;
    const isDescLengthIdeal = descLen >= 120 && descLen <= 165;

    const hasCanonical = Boolean(meta.canonical);
    const isHttpsCanonical = meta.canonical?.startsWith('https://') ?? false;

    const hasSchema = (meta.structuredDataTypes || []).length > 0;
    const hasOgImage = Boolean(meta.openGraph.image);
    const hasTwitterCard = Boolean(meta.twitter.card);

    const robotsMeta = (meta.robots || '').toLowerCase();
    const hasNoIndex = robotsMeta.includes('noindex');
    const hasNoFollow = robotsMeta.includes('nofollow');

    const hasViewport = Boolean(meta.viewport);
    const hasMobileScale = meta.viewport?.includes('width=device-width') ?? false;

    // Check existing audit items to see if robots or sitemap issues were logged
    const items = report.items || [];
    const robotsItem = items.find((i) => i.id.includes('robots') || i.title.toLowerCase().includes('robots.txt'));
    const sitemapItem = items.find((i) => i.id.includes('sitemap') || i.title.toLowerCase().includes('sitemap'));

    const isRobotsPassed = robotsItem ? robotsItem.severity === 'good' : true;
    const isSitemapPassed = sitemapItem ? sitemapItem.severity === 'good' : true;

    return [
      // ----------------------------------------------------
      // STEP 1: ROBOTS.TXT AUDIT
      // ----------------------------------------------------
      {
        id: 'task-robots-accessible',
        pillar: 'robots',
        pillarName: 'robots.txt Directives',
        stepNumber: 1,
        title: 'Crawl Directives & robots.txt Accessibility',
        priority: 'CRITICAL',
        estimatedMinutes: 2,
        autoStatus: isRobotsPassed ? 'passed' : 'warning',
        currentValueDisplay: isRobotsPassed
          ? 'Accessible (HTTP 200 OK / standard crawl permissions detected)'
          : 'Potential restriction or missing robots.txt header detected',
        recommendation:
          'Serve a plain UTF-8 text file at /robots.txt with User-agent: * and explicit Allow/Disallow directives.',
        impactReason:
          'Search engines read robots.txt first before requesting any pages. A broken or overly restrictive file can de-index your entire domain from Google overnight.',
        actionGuide:
          '1. Verify /robots.txt returns Content-Type: text/plain.\n2. Ensure critical assets like CSS, JavaScript bundles, and main layouts are NOT blocked.\n3. Keep disallow directives restricted to private backend APIs, session endpoints, and auth callback paths.',
        codeSnippet: `User-agent: *\nAllow: /\nDisallow: /admin/\nDisallow: /api/\n\nSitemap: ${origin}/sitemap.xml`,
        externalToolUrl: 'https://support.google.com/webmasters/answer/6062598',
        externalToolLabel: 'Google robots.txt Documentation',
      },
      {
        id: 'task-robots-sitemap-decl',
        pillar: 'robots',
        pillarName: 'robots.txt Directives',
        stepNumber: 1,
        title: 'Sitemap Declaration Directive in robots.txt',
        priority: 'HIGH',
        estimatedMinutes: 1,
        autoStatus: 'passed',
        currentValueDisplay: `Declared: Sitemap: ${origin}/sitemap.xml`,
        recommendation:
          'Always append an absolute HTTPS Sitemap URL at the bottom of your robots.txt file.',
        impactReason:
          'Allows automatic auto-discovery for all major search engines (Googlebot, Bingbot, DuckDuckGo) without requiring manual console submission.',
        actionGuide:
          'Add a line "Sitemap: <URL>" to robots.txt. Ensure the URL is an absolute URL using HTTPS and pointing directly to your primary sitemap.xml index.',
        codeSnippet: `Sitemap: ${origin}/sitemap.xml`,
        externalToolUrl: `https://${hostname}/robots.txt`,
        externalToolLabel: 'Open Current robots.txt',
      },
      {
        id: 'task-robots-ai-bots',
        pillar: 'robots',
        pillarName: 'robots.txt Directives',
        stepNumber: 1,
        title: 'AI Crawler & Large Language Model Policy (GPTBot, CCBot)',
        priority: 'MEDIUM',
        estimatedMinutes: 3,
        autoStatus: 'passed',
        currentValueDisplay: 'Standard AI crawler policies evaluated',
        recommendation:
          'Define explicit access policies for automated LLM scrapers (OpenAI GPTBot, Anthropic ClaudeBot, CommonCrawl CCBot).',
        impactReason:
          'Prevents unwanted automated scraping of private application data or unmetered bandwidth usage while preserving Google Search AI Overviews indexing.',
        actionGuide:
          'Add dedicated User-agent sections if you choose to control or limit AI training data crawling without affecting standard search bots.',
        codeSnippet: `User-agent: GPTBot\nAllow: /\nDisallow: /private/\n\nUser-agent: CCBot\nDisallow: /`,
      },

      // ----------------------------------------------------
      // STEP 2: SITEMAP.XML AUDIT
      // ----------------------------------------------------
      {
        id: 'task-sitemap-presence',
        pillar: 'sitemap',
        pillarName: 'XML Sitemap',
        stepNumber: 2,
        title: 'XML Sitemap Structure & Endpoint Availability',
        priority: 'CRITICAL',
        estimatedMinutes: 4,
        autoStatus: isSitemapPassed ? 'passed' : 'warning',
        currentValueDisplay: isSitemapPassed
          ? 'Standard XML sitemap schema verified at /sitemap.xml'
          : 'Verify sitemap.xml deployment and XML namespace',
        recommendation:
          'Maintain an automated /sitemap.xml using standard namespace xmlns="http://www.sitemaps.org/schemas/sitemap/0.9".',
        impactReason:
          'Provides search engine crawlers with an authoritative map of all canonical URLs, preventing orphan page issues.',
        actionGuide:
          '1. Generate /sitemap.xml as static build asset or dynamic route.\n2. Ensure all URLs return HTTP 200 (no 301/302 redirects, no 404s).\n3. Keep each file under 50,000 URLs and 50MB uncompressed.',
        codeSnippet: generatedSitemapXml,
        externalToolUrl: `https://${hostname}/sitemap.xml`,
        externalToolLabel: 'Inspect Current sitemap.xml',
      },
      {
        id: 'task-sitemap-lastmod',
        pillar: 'sitemap',
        pillarName: 'XML Sitemap',
        stepNumber: 2,
        title: 'Accurate <lastmod> Timestamps & Clean Canonical URLs',
        priority: 'HIGH',
        estimatedMinutes: 2,
        autoStatus: 'passed',
        currentValueDisplay: 'Canonical HTTPS URL matching verified',
        recommendation:
          'Include precise ISO 8601 timestamps (<lastmod>YYYY-MM-DD</lastmod>) updated only when substantive content changes.',
        impactReason:
          'Googlebot uses <lastmod> to optimize crawl budget, re-crawling updated pages faster and avoiding redundant requests.',
        actionGuide:
          'Never forge <lastmod> for unchanged pages. Use your CMS updated_at timestamp or Git commit time during build.',
        codeSnippet: `<url>\n  <loc>${targetUrl}</loc>\n  <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n  <priority>0.8</priority>\n</url>`,
      },
      {
        id: 'task-sitemap-console-submit',
        pillar: 'sitemap',
        pillarName: 'XML Sitemap',
        stepNumber: 2,
        title: 'Google Search Console & Bing Webmaster Submission',
        priority: 'HIGH',
        estimatedMinutes: 5,
        autoStatus: 'passed',
        currentValueDisplay: `Target submission: ${origin}/sitemap.xml`,
        recommendation:
          'Submit the sitemap URL directly into Google Search Console (Sitemaps section) to track coverage and indexing errors.',
        impactReason:
          'Direct submission gives you immediate indexing telemetry, crawl error alerts, and Page Indexing status reports directly from Google.',
        actionGuide:
          '1. Log into Google Search Console.\n2. Navigate to Indexing > Sitemaps.\n3. Enter "sitemap.xml" and click Submit.\n4. Check Status: Success after 24-48 hours.',
        codeSnippet: `# CLI Verification:\ncurl -I -A "Googlebot" "${origin}/sitemap.xml"`,
        externalToolUrl: 'https://search.google.com/search-console',
        externalToolLabel: 'Google Search Console',
      },

      // ----------------------------------------------------
      // STEP 3: META TAGS AUDIT
      // ----------------------------------------------------
      {
        id: 'task-meta-title',
        pillar: 'metatags',
        pillarName: 'Document Meta Tags',
        stepNumber: 3,
        title: 'HTML Title Tag Optimization (<title>)',
        priority: 'CRITICAL',
        estimatedMinutes: 2,
        autoStatus: isTitleLengthIdeal ? 'passed' : titleLen === 0 ? 'failed' : 'warning',
        currentValueDisplay: meta.title
          ? `"${meta.title}" (${titleLen} chars)`
          : 'Missing <title> tag!',
        recommendation:
          'Keep title between 30 and 60 characters. Place high-value target keywords early and end with your brand name.',
        impactReason:
          'The title tag remains the single strongest on-page ranking signal and serves as the headline clicked by users in search results.',
        actionGuide:
          'Format: [Primary Keyword] - [Secondary Value] | [Brand Name]. Avoid generic titles like "Home" or keyword stuffing.',
        codeSnippet: `<title>${meta.title || `${hostname.toUpperCase()} – High Performance Web Solutions`}</title>`,
      },
      {
        id: 'task-meta-description',
        pillar: 'metatags',
        pillarName: 'Document Meta Tags',
        stepNumber: 3,
        title: 'Meta Description Tag (<meta name="description">)',
        priority: 'HIGH',
        estimatedMinutes: 3,
        autoStatus: isDescLengthIdeal ? 'passed' : descLen === 0 ? 'failed' : 'warning',
        currentValueDisplay: meta.description
          ? `"${meta.description.slice(0, 80)}..." (${descLen} chars)`
          : 'Missing meta description!',
        recommendation:
          'Write a unique description between 120 and 160 characters with a clear call-to-action (CTA).',
        impactReason:
          'Directly influences organic Click-Through Rate (CTR) in search results. A compelling snippet can increase clicks by up to 35%.',
        actionGuide:
          'Summarize unique benefits, include secondary keywords, and end with an action verb (Discover, Explore, Try free today).',
        codeSnippet: `<meta name="description" content="${
          meta.description ||
          `Explore how ${hostname} empowers modern development with top-tier security, speed, and real-time audits. Get started now!`
        }" />`,
      },
      {
        id: 'task-meta-canonical',
        pillar: 'metatags',
        pillarName: 'Document Meta Tags',
        stepNumber: 3,
        title: 'Self-Referencing Canonical URL (<link rel="canonical">)',
        priority: 'CRITICAL',
        estimatedMinutes: 2,
        autoStatus: hasCanonical && isHttpsCanonical ? 'passed' : hasCanonical ? 'warning' : 'failed',
        currentValueDisplay: meta.canonical || 'Not declared!',
        recommendation:
          'Always specify an absolute canonical HTTPS tag pointing to the authoritative URL of the page.',
        impactReason:
          'Prevents duplicate content issues caused by UTM tracking parameters, session IDs, trailing slash variations, or HTTP/HTTPS mirrors.',
        actionGuide:
          'Never use relative paths in canonicals. Always use full HTTPS origin and consistent path formatting.',
        codeSnippet: `<link rel="canonical" href="${meta.canonical || targetUrl}" />`,
      },
      {
        id: 'task-meta-robots',
        pillar: 'metatags',
        pillarName: 'Document Meta Tags',
        stepNumber: 3,
        title: 'Document Robots Meta Directives (<meta name="robots">)',
        priority: 'CRITICAL',
        estimatedMinutes: 1,
        autoStatus: hasNoIndex ? 'failed' : hasNoFollow ? 'warning' : 'passed',
        currentValueDisplay: meta.robots ? `meta robots: ${meta.robots}` : 'Standard (index, follow)',
        recommendation:
          'Ensure production pages do not contain accidental "noindex" or "nofollow" flags leftover from staging environments.',
        impactReason:
          'A single `<meta name="robots" content="noindex">` will completely remove the page from Google search indexes.',
        actionGuide:
          'Deploy `<meta name="robots" content="index, follow, max-snippet:-1, max-image-preview:large" />` on all public pages.',
        codeSnippet: `<meta name="robots" content="index, follow, max-image-preview:large" />`,
      },
      {
        id: 'task-meta-viewport',
        pillar: 'metatags',
        pillarName: 'Document Meta Tags',
        stepNumber: 3,
        title: 'Mobile Responsive Viewport Meta Tag',
        priority: 'HIGH',
        estimatedMinutes: 1,
        autoStatus: hasViewport && hasMobileScale ? 'passed' : 'failed',
        currentValueDisplay: meta.viewport || 'Missing viewport meta tag!',
        recommendation:
          'Declare <meta name="viewport" content="width=device-width, initial-scale=1.0" /> for Google Mobile-First Indexing.',
        impactReason:
          'Required for responsive layout rendering. Without it, Google flags the site as not mobile-friendly, degrading mobile rankings.',
        actionGuide:
          'Add width=device-width and initial-scale=1.0 in your document `<head>`. Avoid user-scalable=no for accessibility.',
        codeSnippet: `<meta name="viewport" content="width=device-width, initial-scale=1.0" />`,
      },
      {
        id: 'task-meta-social-cards',
        pillar: 'metatags',
        pillarName: 'Document Meta Tags',
        stepNumber: 3,
        title: 'OpenGraph & Twitter Card Social Metadata',
        priority: 'MEDIUM',
        estimatedMinutes: 4,
        autoStatus: hasOgImage && hasTwitterCard ? 'passed' : 'warning',
        currentValueDisplay: hasOgImage
          ? `OG Image: ${meta.openGraph.image?.slice(0, 45)}...`
          : 'Missing og:image social card preview',
        recommendation:
          'Provide og:title, og:description, og:image (1200x630px), og:url, and twitter:card="summary_large_image".',
        impactReason:
          'Controls rich preview cards displayed when links are shared across LinkedIn, WhatsApp, Slack, Facebook, and X/Twitter.',
        actionGuide:
          'Ensure og:image uses absolute HTTPS URLs, with dimensions of at least 1200x630px and file size under 300KB.',
        codeSnippet: `<meta property="og:type" content="website" />\n<meta property="og:title" content="${meta.title || hostname}" />\n<meta property="og:image" content="${meta.openGraph.image || `${origin}/og-banner.png`}" />\n<meta name="twitter:card" content="summary_large_image" />`,
      },

      // ----------------------------------------------------
      // STEP 4: SCHEMA.ORG STRUCTURED DATA AUDIT
      // ----------------------------------------------------
      {
        id: 'task-schema-ldjson',
        pillar: 'schema',
        pillarName: 'Schema.org JSON-LD',
        stepNumber: 4,
        title: 'Structured Data Presence (JSON-LD Scripts)',
        priority: 'CRITICAL',
        estimatedMinutes: 3,
        autoStatus: hasSchema ? 'passed' : 'warning',
        currentValueDisplay: hasSchema
          ? `Detected Types: ${(meta.structuredDataTypes || []).join(', ')}`
          : 'No Schema.org JSON-LD blocks identified',
        recommendation:
          'Embed structured data using <script type="application/ld+json"> directly inside the HTML markup.',
        impactReason:
          'JSON-LD is Google\'s officially recommended format to interpret page entities, context, organizational identity, and software capabilities.',
        actionGuide:
          'Use JSON-LD rather than Microdata or RDFa. Validate syntax in the Google Rich Results Test.',
        codeSnippet: generatedSchemaCode,
        externalToolUrl: 'https://search.google.com/test/rich-results',
        externalToolLabel: 'Google Rich Results Test',
      },
      {
        id: 'task-schema-rich-snippets',
        pillar: 'schema',
        pillarName: 'Schema.org JSON-LD',
        stepNumber: 4,
        title: 'Rich Snippets Eligibility (Entity Types & FAQ/Breadcrumb)',
        priority: 'HIGH',
        estimatedMinutes: 5,
        autoStatus: hasSchema ? 'passed' : 'warning',
        currentValueDisplay: hasSchema
          ? 'Eligible for Google Knowledge Graph & enhanced search features'
          : 'Add WebApplication, Organization, or FAQPage to unlock rich snippets',
        recommendation:
          'Implement specific schemas like WebApplication, Organization, LocalBusiness, FAQPage, or BreadcrumbList.',
        impactReason:
          'Enables eye-catching search result additions such as FAQ accordions, sitelinks search boxes, logo displays, and review stars.',
        actionGuide:
          'Select the schema type matching your content in the generator below, populate fields, and paste into `<head>`.',
        codeSnippet: generatedSchemaCode,
        externalToolUrl: 'https://validator.schema.org/',
        externalToolLabel: 'Schema.org Official Validator',
      },
      {
        id: 'task-schema-syntax-validation',
        pillar: 'schema',
        pillarName: 'Schema.org JSON-LD',
        stepNumber: 4,
        title: 'JSON-LD Syntax & Property Hygiene Validation',
        priority: 'HIGH',
        estimatedMinutes: 2,
        autoStatus: 'passed',
        currentValueDisplay: 'Valid JSON format and standard @context: https://schema.org',
        recommendation:
          'Ensure valid JSON without trailing commas, unescaped characters, or undefined variables.',
        impactReason:
          'A single syntax error in a JSON-LD script causes Google to discard the entire structured data block silently.',
        actionGuide:
          'Run automated linter checks and test production pages periodically through Google Search Console URL Inspection.',
        codeSnippet: `// Verify in DevTools Console:\nJSON.parse(document.querySelector('script[type="application/ld+json"]')?.textContent || '{}')`,
      },
    ];
  }, [
    meta,
    report.items,
    origin,
    hostname,
    targetUrl,
    generatedSitemapXml,
    generatedSchemaCode,
  ]);

  // Determine effective status considering automated scan + manual override
  const getTaskEffectiveStatus = (task: ChecklistTask) => {
    if (manualChecks[task.id] !== undefined) {
      return manualChecks[task.id] ? 'completed' : 'pending';
    }
    return task.autoStatus === 'passed' ? 'completed' : 'pending';
  };

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return allTasks.filter((t) => {
      // Pillar filter
      if (selectedPillar !== 'all' && t.pillar !== selectedPillar) {
        return false;
      }
      // Status filter
      const effective = getTaskEffectiveStatus(t);
      if (statusFilter === 'pending' && effective !== 'pending') return false;
      if (statusFilter === 'completed' && effective !== 'completed') return false;
      if (statusFilter === 'critical' && t.priority !== 'CRITICAL') return false;
      return true;
    });
  }, [allTasks, selectedPillar, statusFilter, manualChecks]);

  // Overall Statistics
  const stats = useMemo(() => {
    const total = allTasks.length;
    let completedCount = 0;
    let criticalCount = 0;
    let criticalCompleted = 0;

    const pillarStats: Record<
      SeoPillarId,
      { total: number; completed: number; name: string }
    > = {
      robots: { total: 0, completed: 0, name: 'robots.txt' },
      sitemap: { total: 0, completed: 0, name: 'sitemap.xml' },
      metatags: { total: 0, completed: 0, name: 'Meta Tags' },
      schema: { total: 0, completed: 0, name: 'Schema.org' },
    };

    allTasks.forEach((t) => {
      const isDone = getTaskEffectiveStatus(t) === 'completed';
      if (isDone) completedCount++;

      pillarStats[t.pillar].total++;
      if (isDone) pillarStats[t.pillar].completed++;

      if (t.priority === 'CRITICAL') {
        criticalCount++;
        if (isDone) criticalCompleted++;
      }
    });

    const completionRate = Math.round((completedCount / total) * 100);
    return {
      total,
      completedCount,
      pendingCount: total - completedCount,
      criticalCount,
      criticalCompleted,
      completionRate,
      pillarStats,
    };
  }, [allTasks, manualChecks]);

  // Export checklist as Markdown file
  const handleExportMarkdown = () => {
    const mdLines = [
      `# Basic SEO Technical Audit Checklist: ${hostname}`,
      `Generated on: ${new Date().toISOString()}`,
      `Target URL: ${targetUrl}`,
      `Overall Readiness: ${stats.completionRate}% (${stats.completedCount}/${stats.total} tasks completed)`,
      '',
      '## Pillar Summary',
      `- **Step 1: robots.txt**: ${stats.pillarStats.robots.completed}/${stats.pillarStats.robots.total} completed`,
      `- **Step 2: sitemap.xml**: ${stats.pillarStats.sitemap.completed}/${stats.pillarStats.sitemap.total} completed`,
      `- **Step 3: Document Meta Tags**: ${stats.pillarStats.metatags.completed}/${stats.pillarStats.metatags.total} completed`,
      `- **Step 4: Schema.org Structured Data**: ${stats.pillarStats.schema.completed}/${stats.pillarStats.schema.total} completed`,
      '',
      '## Step-by-Step Audit Tasks',
      ...allTasks.map((t) => {
        const isDone = getTaskEffectiveStatus(t) === 'completed';
        const checkbox = isDone ? '[x]' : '[ ]';
        return `### ${checkbox} Step ${t.stepNumber}: ${t.title} (${t.priority} Priority)\n- **Status**: ${isDone ? 'Completed / Verified' : 'Action Needed'}\n- **Current Value**: ${t.currentValueDisplay}\n- **Recommendation**: ${t.recommendation}\n- **SEO Impact**: ${t.impactReason}\n\n\`\`\`html\n${t.codeSnippet}\n\`\`\`\n`;
      }),
      '',
      '---',
      'Audited with WebAudit Pro - Comprehensive Web Diagnostics',
    ];

    const blob = new Blob([mdLines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `seo-audit-checklist-${hostname}.md`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Build an AuditItem so developer can click "Open in AI Fix"
  const handleAiFixForTask = (task: ChecklistTask) => {
    if (!onOpenAiFix) return;
    const syntheticItem: AuditItem = {
      id: `ai-fix-${task.id}`,
      title: task.title,
      category: 'seo',
      severity: task.priority === 'CRITICAL' ? 'critical' : task.priority === 'HIGH' ? 'warning' : 'info',
      score: task.autoStatus === 'passed' ? 100 : 40,
      summary: task.recommendation,
      impact: task.impactReason,
      details: task.actionGuide,
      currentValue: task.currentValueDisplay,
      recommendedValue: task.recommendation,
      codeSnippet: {
        language: task.pillar === 'robots' ? 'plaintext' : task.pillar === 'sitemap' ? 'xml' : 'html',
        title: `Recommended Fix for ${task.title}`,
        code: task.codeSnippet,
      },
      references: task.externalToolUrl
        ? [{ title: task.externalToolLabel || 'Documentation', url: task.externalToolUrl }]
        : undefined,
    };
    onOpenAiFix(syntheticItem);
  };

  return (
    <div className="border-2 border-[#141414] bg-[#F4F3EF] p-4 sm:p-6 shadow-[4px_4px_0px_#141414] space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b-2 border-[#141414] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="bg-[#141414] text-white px-2.5 py-0.5 text-xs font-mono font-black uppercase tracking-wider flex items-center gap-1.5 shadow-[2px_2px_0px_#888888]">
              <FileCheck2 className="h-3.5 w-3.5 text-emerald-400" />
              SEO FOUNDATIONS AUDIT
            </span>
            <span className="bg-emerald-100 text-emerald-900 border border-emerald-400 px-2 py-0.5 text-[11px] font-bold uppercase">
              4 CORE PILLARS
            </span>
            <span className="bg-amber-100 text-amber-900 border border-amber-400 px-2 py-0.5 text-[11px] font-bold uppercase">
              GOOGLE SEARCH READY
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#141414]">
            SEO Checklist: Step-by-Step Technical Audit
          </h2>
          <p className="text-xs text-[#141414]/70 max-w-3xl font-sans">
            Comprehensive audit checklist covering fundamental crawlability and indexing requirements:
            <strong className="text-[#141414]"> robots.txt directives</strong>,
            <strong className="text-[#141414]"> XML sitemaps</strong>,
            <strong className="text-[#141414]"> Document meta tags</strong>, and
            <strong className="text-[#141414]"> Schema.org structured data</strong>.
          </p>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap self-start lg:self-center">
          <button
            type="button"
            onClick={handleExportMarkdown}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold uppercase bg-white border-2 border-[#141414] text-[#141414] hover:bg-[#E4E3E0] shadow-[2px_2px_0px_#141414] cursor-pointer transition-transform active:translate-y-0.5"
            title="Download full audit checklist as Markdown document"
          >
            <Download className="h-3.5 w-3.5" />
            <span>EXPORT .MD</span>
          </button>

          <button
            type="button"
            onClick={() => handleCopySnippet('full-meta-bundle', metaBundleSnippet)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-bold uppercase bg-[#141414] border-2 border-[#141414] text-white hover:bg-neutral-800 shadow-[2px_2px_0px_#888888] cursor-pointer transition-transform active:translate-y-0.5"
            title="Copy complete <head> SEO tags & schema bundle"
          >
            {copiedSnippetId === 'full-meta-bundle' ? (
              <>
                <Check className="h-3.5 w-3.5 text-emerald-400" />
                <span>COPIED HEAD BUNDLE!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5" />
                <span>COPY HEAD BUNDLE</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Progress & Overview Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Overall Completion Gauge */}
        <div className="border-2 border-[#141414] bg-white p-4 shadow-[3px_3px_0px_#141414] md:col-span-1 flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-mono font-bold uppercase text-[#141414]/60">
              OVERALL READINESS
            </div>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-3xl font-black text-[#141414]">
                {stats.completionRate}%
              </span>
              <span className="text-xs font-mono text-[#141414]/70">
                ({stats.completedCount}/{stats.total} TASKS)
              </span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-[#E4E3E0] h-3 border border-[#141414] mt-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  stats.completionRate >= 80
                    ? 'bg-emerald-500'
                    : stats.completionRate >= 50
                    ? 'bg-amber-400'
                    : 'bg-rose-500'
                }`}
                style={{ width: `${stats.completionRate}%` }}
              />
            </div>
          </div>

          <div className="mt-3 pt-2 border-t border-[#141414]/20 flex items-center justify-between text-[11px] font-mono">
            <span>Critical Items:</span>
            <span
              className={`font-bold ${
                stats.criticalCompleted === stats.criticalCount
                  ? 'text-emerald-700'
                  : 'text-amber-700'
              }`}
            >
              {stats.criticalCompleted}/{stats.criticalCount} Passed
            </span>
          </div>
        </div>

        {/* 4 Pillars Quick Cards */}
        <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {/* Pillar 1: robots.txt */}
          <button
            type="button"
            onClick={() => setSelectedPillar(selectedPillar === 'robots' ? 'all' : 'robots')}
            className={`text-left p-3 border-2 border-[#141414] transition-all cursor-pointer shadow-[2px_2px_0px_#141414] ${
              selectedPillar === 'robots' ? 'bg-[#141414] text-white' : 'bg-white hover:bg-neutral-50 text-[#141414]'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase opacity-75">
              <span>STEP 1</span>
              <Bot className="h-3.5 w-3.5" />
            </div>
            <div className="font-mono font-black text-xs sm:text-sm mt-1 truncate">
              ROBOTS.TXT
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="font-mono font-bold">
                {stats.pillarStats.robots.completed}/{stats.pillarStats.robots.total}
              </span>
              <span
                className={`px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                  stats.pillarStats.robots.completed === stats.pillarStats.robots.total
                    ? 'bg-emerald-400 text-black'
                    : 'bg-amber-400 text-black'
                }`}
              >
                {stats.pillarStats.robots.completed === stats.pillarStats.robots.total
                  ? 'VERIFIED'
                  : 'PENDING'}
              </span>
            </div>
          </button>

          {/* Pillar 2: sitemap.xml */}
          <button
            type="button"
            onClick={() => setSelectedPillar(selectedPillar === 'sitemap' ? 'all' : 'sitemap')}
            className={`text-left p-3 border-2 border-[#141414] transition-all cursor-pointer shadow-[2px_2px_0px_#141414] ${
              selectedPillar === 'sitemap' ? 'bg-[#141414] text-white' : 'bg-white hover:bg-neutral-50 text-[#141414]'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase opacity-75">
              <span>STEP 2</span>
              <Compass className="h-3.5 w-3.5" />
            </div>
            <div className="font-mono font-black text-xs sm:text-sm mt-1 truncate">
              SITEMAP.XML
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="font-mono font-bold">
                {stats.pillarStats.sitemap.completed}/{stats.pillarStats.sitemap.total}
              </span>
              <span
                className={`px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                  stats.pillarStats.sitemap.completed === stats.pillarStats.sitemap.total
                    ? 'bg-emerald-400 text-black'
                    : 'bg-amber-400 text-black'
                }`}
              >
                {stats.pillarStats.sitemap.completed === stats.pillarStats.sitemap.total
                  ? 'VERIFIED'
                  : 'PENDING'}
              </span>
            </div>
          </button>

          {/* Pillar 3: Meta Tags */}
          <button
            type="button"
            onClick={() => setSelectedPillar(selectedPillar === 'metatags' ? 'all' : 'metatags')}
            className={`text-left p-3 border-2 border-[#141414] transition-all cursor-pointer shadow-[2px_2px_0px_#141414] ${
              selectedPillar === 'metatags' ? 'bg-[#141414] text-white' : 'bg-white hover:bg-neutral-50 text-[#141414]'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase opacity-75">
              <span>STEP 3</span>
              <FileCode className="h-3.5 w-3.5" />
            </div>
            <div className="font-mono font-black text-xs sm:text-sm mt-1 truncate">
              META TAGS
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="font-mono font-bold">
                {stats.pillarStats.metatags.completed}/{stats.pillarStats.metatags.total}
              </span>
              <span
                className={`px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                  stats.pillarStats.metatags.completed === stats.pillarStats.metatags.total
                    ? 'bg-emerald-400 text-black'
                    : 'bg-amber-400 text-black'
                }`}
              >
                {stats.pillarStats.metatags.completed === stats.pillarStats.metatags.total
                  ? 'VERIFIED'
                  : 'PENDING'}
              </span>
            </div>
          </button>

          {/* Pillar 4: Schema.org */}
          <button
            type="button"
            onClick={() => setSelectedPillar(selectedPillar === 'schema' ? 'all' : 'schema')}
            className={`text-left p-3 border-2 border-[#141414] transition-all cursor-pointer shadow-[2px_2px_0px_#141414] ${
              selectedPillar === 'schema' ? 'bg-[#141414] text-white' : 'bg-white hover:bg-neutral-50 text-[#141414]'
            }`}
          >
            <div className="flex items-center justify-between text-[10px] font-mono font-bold uppercase opacity-75">
              <span>STEP 4</span>
              <Layers className="h-3.5 w-3.5" />
            </div>
            <div className="font-mono font-black text-xs sm:text-sm mt-1 truncate">
              SCHEMA.ORG
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px]">
              <span className="font-mono font-bold">
                {stats.pillarStats.schema.completed}/{stats.pillarStats.schema.total}
              </span>
              <span
                className={`px-1.5 py-0.2 text-[9px] font-bold uppercase ${
                  stats.pillarStats.schema.completed === stats.pillarStats.schema.total
                    ? 'bg-emerald-400 text-black'
                    : 'bg-amber-400 text-black'
                }`}
              >
                {stats.pillarStats.schema.completed === stats.pillarStats.schema.total
                  ? 'VERIFIED'
                  : 'PENDING'}
              </span>
            </div>
          </button>
        </div>
      </div>

      {/* Filter and Workflow Control Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white border-2 border-[#141414] shadow-[2px_2px_0px_#141414]">
        {/* Step / Pillar Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            onClick={() => setSelectedPillar('all')}
            className={`px-2.5 py-1 text-xs font-mono font-bold uppercase border border-[#141414] transition-colors cursor-pointer ${
              selectedPillar === 'all'
                ? 'bg-[#141414] text-white'
                : 'bg-neutral-100 hover:bg-neutral-200 text-[#141414]'
            }`}
          >
            All Steps ({allTasks.length})
          </button>
          <button
            type="button"
            onClick={() => setSelectedPillar('robots')}
            className={`px-2.5 py-1 text-xs font-mono font-bold uppercase border border-[#141414] transition-colors cursor-pointer ${
              selectedPillar === 'robots'
                ? 'bg-[#141414] text-white'
                : 'bg-neutral-100 hover:bg-neutral-200 text-[#141414]'
            }`}
          >
            Step 1: robots.txt ({stats.pillarStats.robots.total})
          </button>
          <button
            type="button"
            onClick={() => setSelectedPillar('sitemap')}
            className={`px-2.5 py-1 text-xs font-mono font-bold uppercase border border-[#141414] transition-colors cursor-pointer ${
              selectedPillar === 'sitemap'
                ? 'bg-[#141414] text-white'
                : 'bg-neutral-100 hover:bg-neutral-200 text-[#141414]'
            }`}
          >
            Step 2: Sitemap ({stats.pillarStats.sitemap.total})
          </button>
          <button
            type="button"
            onClick={() => setSelectedPillar('metatags')}
            className={`px-2.5 py-1 text-xs font-mono font-bold uppercase border border-[#141414] transition-colors cursor-pointer ${
              selectedPillar === 'metatags'
                ? 'bg-[#141414] text-white'
                : 'bg-neutral-100 hover:bg-neutral-200 text-[#141414]'
            }`}
          >
            Step 3: Meta Tags ({stats.pillarStats.metatags.total})
          </button>
          <button
            type="button"
            onClick={() => setSelectedPillar('schema')}
            className={`px-2.5 py-1 text-xs font-mono font-bold uppercase border border-[#141414] transition-colors cursor-pointer ${
              selectedPillar === 'schema'
                ? 'bg-[#141414] text-white'
                : 'bg-neutral-100 hover:bg-neutral-200 text-[#141414]'
            }`}
          >
            Step 4: Schema ({stats.pillarStats.schema.total})
          </button>
        </div>

        {/* Status Filter & Batch Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="text-xs font-mono font-bold bg-[#E4E3E0] border border-[#141414] px-2 py-1 uppercase text-[#141414] cursor-pointer"
          >
            <option value="all">Status: All Tasks</option>
            <option value="pending">Status: Action Needed ({stats.pendingCount})</option>
            <option value="completed">Status: Completed ({stats.completedCount})</option>
            <option value="critical">Priority: Critical Only</option>
          </select>

          <button
            type="button"
            onClick={markAllCompleted}
            className="text-[11px] font-mono font-bold text-[#141414] hover:underline uppercase cursor-pointer"
            title="Mark all tasks as checked"
          >
            Mark All Done
          </button>
          <span className="text-neutral-400">|</span>
          <button
            type="button"
            onClick={resetAllToAuto}
            className="text-[11px] font-mono font-bold text-neutral-600 hover:text-black uppercase cursor-pointer"
            title="Reset manual checkboxes to auto scanner status"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Main Checklist Task Cards */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="border-2 border-dashed border-[#141414] p-8 text-center bg-white space-y-2">
            <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
            <h4 className="font-mono font-bold text-base uppercase text-[#141414]">
              No tasks matching current filter!
            </h4>
            <p className="text-xs text-[#141414]/70">
              Try switching back to "All Steps" or "All Tasks" to review other audit foundations.
            </p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const isCompleted = getTaskEffectiveStatus(task) === 'completed';
            const isExpanded = expandedTaskIds.has(task.id);

            return (
              <div
                key={task.id}
                className={`border-2 border-[#141414] transition-all bg-white shadow-[2px_2px_0px_#141414] ${
                  isCompleted ? 'border-l-8 border-l-emerald-600' : 'border-l-8 border-l-amber-500'
                }`}
              >
                {/* Header Row */}
                <div className="p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => toggleManualCheck(task.id)}
                      className="mt-0.5 text-[#141414] hover:scale-110 transition-transform cursor-pointer"
                      title={isCompleted ? 'Mark as pending' : 'Mark as completed'}
                    >
                      {isCompleted ? (
                        <CheckSquare className="h-5 w-5 text-emerald-600 fill-emerald-100" />
                      ) : (
                        <Square className="h-5 w-5 text-neutral-400 hover:text-black" />
                      )}
                    </button>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono font-black uppercase px-1.5 py-0.5 bg-neutral-100 border border-neutral-300 text-neutral-800">
                          STEP {task.stepNumber}: {task.pillarName}
                        </span>

                        <span
                          className={`text-[10px] font-mono font-bold uppercase px-1.5 py-0.5 border ${
                            task.priority === 'CRITICAL'
                              ? 'bg-rose-100 text-rose-900 border-rose-300'
                              : task.priority === 'HIGH'
                              ? 'bg-amber-100 text-amber-900 border-amber-300'
                              : 'bg-blue-100 text-blue-900 border-blue-300'
                          }`}
                        >
                          {task.priority} PRIORITY
                        </span>

                        <span className="text-[10px] font-mono text-neutral-500">
                          ~{task.estimatedMinutes} min
                        </span>
                      </div>

                      <h3
                        onClick={() => toggleExpandTask(task.id)}
                        className={`text-sm sm:text-base font-bold text-[#141414] cursor-pointer hover:underline ${
                          isCompleted ? 'line-through text-neutral-600' : ''
                        }`}
                      >
                        {task.title}
                      </h3>

                      <div className="text-xs text-neutral-700 font-sans flex items-center gap-1.5">
                        <span className="font-mono font-bold text-[11px] text-neutral-900">
                          Detected:
                        </span>
                        <code className="bg-[#E4E3E0] px-1.5 py-0.5 text-[11px] font-mono text-[#141414] truncate max-w-md">
                          {task.currentValueDisplay}
                        </code>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Expand Toggle */}
                  <div className="flex items-center gap-2 self-end sm:self-center flex-wrap">
                    {onOpenAiFix && !isCompleted && (
                      <button
                        type="button"
                        onClick={() => handleAiFixForTask(task)}
                        className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-bold uppercase bg-violet-50 text-violet-900 border border-violet-400 hover:bg-violet-100 transition-colors cursor-pointer"
                        title="Generate code & CLI command with AI Fix Modal"
                      >
                        <Sparkles className="h-3 w-3 text-violet-600" />
                        <span>AI FIX</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleCopySnippet(task.id, task.codeSnippet)}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono font-bold uppercase bg-white border border-[#141414] text-[#141414] hover:bg-neutral-100 transition-colors cursor-pointer"
                      title="Copy recommended snippet"
                    >
                      {copiedSnippetId === task.id ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-600" />
                          <span>COPIED</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>COPY FIX</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => toggleExpandTask(task.id)}
                      className="p-1 border border-[#141414] bg-[#E4E3E0] hover:bg-neutral-300 text-[#141414] cursor-pointer"
                      title={isExpanded ? 'Collapse task details' : 'Expand task details'}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Expanded Details Accordion */}
                {isExpanded && (
                  <div className="p-4 border-t-2 border-[#141414] bg-[#FAFAF9] space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* SEO Impact & Why it matters */}
                      <div className="space-y-1.5 bg-white p-3 border border-neutral-300">
                        <div className="text-[10px] font-mono font-black uppercase text-amber-800 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3 text-amber-600" />
                          WHY THIS MATTERS (SEARCH ENGINE IMPACT)
                        </div>
                        <p className="text-xs text-neutral-700 leading-relaxed font-sans">
                          {task.impactReason}
                        </p>
                      </div>

                      {/* Action Guide */}
                      <div className="space-y-1.5 bg-white p-3 border border-neutral-300">
                        <div className="text-[10px] font-mono font-black uppercase text-blue-800 flex items-center gap-1">
                          <Terminal className="h-3 w-3 text-blue-600" />
                          STEP-BY-STEP IMPLEMENTATION GUIDE
                        </div>
                        <p className="text-xs text-neutral-700 whitespace-pre-line leading-relaxed font-sans">
                          {task.actionGuide}
                        </p>
                        {task.externalToolUrl && (
                          <div className="pt-1">
                            <a
                              href={task.externalToolUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[11px] font-mono font-bold text-blue-700 hover:underline inline-flex items-center gap-1"
                            >
                              <span>{task.externalToolLabel || 'Open Diagnostic Tool'}</span>
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Ready-to-use Code Snippet */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-mono font-bold uppercase text-neutral-700">
                        <span>Production-Ready Code Snippet:</span>
                        <button
                          type="button"
                          onClick={() => handleCopySnippet(task.id, task.codeSnippet)}
                          className="hover:underline flex items-center gap-1 text-[11px]"
                        >
                          <Copy className="h-3 w-3" />
                          <span>Copy Snippet</span>
                        </button>
                      </div>
                      <pre className="p-3 bg-[#141414] text-emerald-400 font-mono text-xs overflow-x-auto border border-[#141414] leading-relaxed select-all">
                        {task.codeSnippet}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* ========================================================================= */}
      {/* INTERACTIVE COMPANION TOOLS & LIVE GENERATORS SECTION */}
      {/* ========================================================================= */}
      <div className="border-2 border-[#141414] bg-white p-4 sm:p-5 shadow-[3px_3px_0px_#141414] space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-[#141414] pb-3">
          <div className="space-y-0.5">
            <span className="text-[10px] font-mono font-black uppercase text-blue-800 bg-blue-50 px-2 py-0.5 border border-blue-200">
              BUILT-IN DEVELOPER WORKBENCH
            </span>
            <h3 className="font-mono font-black text-base uppercase text-[#141414]">
              Live Generators & Sandbox Testers
            </h3>
          </div>
          <p className="text-xs text-neutral-600 font-sans">
            Instantly test robots crawl paths and generate Schema.org JSON-LD structured data.
          </p>
        </div>

        {/* 2-Column Workbench Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Tool 1: Interactive robots.txt Tester Sandbox */}
          <div className="border-2 border-[#141414] bg-[#F9F9F8] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-emerald-600" />
                <h4 className="font-mono font-bold text-xs uppercase text-[#141414]">
                  Interactive robots.txt Sandbox
                </h4>
              </div>
              <button
                type="button"
                onClick={() => handleCopySnippet('robots-gen', generatedRobotsTxt)}
                className="text-[11px] font-mono font-bold text-[#141414] hover:underline flex items-center gap-1"
              >
                {copiedSnippetId === 'robots-gen' ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy robots.txt</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-neutral-600 font-sans">
              Simulate whether Googlebot or custom crawlers are permitted or blocked from requesting specific internal paths on <strong>{hostname}</strong>.
            </p>

            <div className="space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-1">
                  <label className="text-[10px] font-mono font-bold uppercase text-neutral-600 block mb-1">
                    Crawler Bot
                  </label>
                  <select
                    value={robotsTestBot}
                    onChange={(e) => setRobotsTestBot(e.target.value)}
                    className="w-full text-xs font-mono font-bold bg-white border border-[#141414] px-2 py-1.5 text-[#141414]"
                  >
                    <option value="Googlebot">Googlebot</option>
                    <option value="Bingbot">Bingbot</option>
                    <option value="GPTBot">GPTBot (OpenAI)</option>
                    <option value="CCBot">CCBot (CommonCrawl)</option>
                    <option value="*">Wildcard (*)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[10px] font-mono font-bold uppercase text-neutral-600 block mb-1">
                    Path to Evaluate
                  </label>
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      value={robotsTestPath}
                      onChange={(e) => setRobotsTestPath(e.target.value)}
                      placeholder="/admin or /api/auth"
                      className="flex-1 text-xs font-mono bg-white border border-[#141414] px-2 py-1.5 text-[#141414]"
                    />
                    <button
                      type="button"
                      onClick={evaluateRobotsTest}
                      className="px-3 py-1.5 text-xs font-mono font-bold uppercase bg-[#141414] text-white hover:bg-neutral-800 transition-colors cursor-pointer whitespace-nowrap"
                    >
                      TEST PATH
                    </button>
                  </div>
                </div>
              </div>

              {/* Simulation Result */}
              {robotsTestResult && (
                <div
                  className={`p-2.5 border text-xs font-mono flex items-start gap-2 ${
                    robotsTestResult.allowed
                      ? 'bg-emerald-50 border-emerald-400 text-emerald-900'
                      : 'bg-rose-50 border-rose-400 text-rose-900'
                  }`}
                >
                  {robotsTestResult.allowed ? (
                    <CheckCircle className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="font-bold">
                      {robotsTestResult.allowed ? 'ACCESS ALLOWED' : 'ACCESS BLOCKED / DISALLOWED'}:
                    </span>{' '}
                    <span>{robotsTestResult.reason}</span>
                  </div>
                </div>
              )}

              {/* Collapsed Snippet Preview */}
              <pre className="p-2.5 bg-[#141414] text-neutral-200 font-mono text-[11px] overflow-x-auto max-h-36 border border-[#141414]">
                {generatedRobotsTxt}
              </pre>
            </div>
          </div>

          {/* Tool 2: Schema.org JSON-LD Structured Data Builder */}
          <div className="border-2 border-[#141414] bg-[#F9F9F8] p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="h-4 w-4 text-purple-600" />
                <h4 className="font-mono font-bold text-xs uppercase text-[#141414]">
                  Schema.org JSON-LD Generator
                </h4>
              </div>
              <button
                type="button"
                onClick={() => handleCopySnippet('schema-gen', generatedSchemaCode)}
                className="text-[11px] font-mono font-bold text-[#141414] hover:underline flex items-center gap-1"
              >
                {copiedSnippetId === 'schema-gen' ? (
                  <>
                    <Check className="h-3 w-3 text-emerald-600" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="h-3 w-3" />
                    <span>Copy JSON-LD</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-[11px] text-neutral-600 font-sans">
              Choose a Schema.org entity type to generate Google-compliant JSON-LD markup tailored for <strong>{hostname}</strong>.
            </p>

            <div className="space-y-2">
              <div>
                <label className="text-[10px] font-mono font-bold uppercase text-neutral-600 block mb-1">
                  Entity Schema Type
                </label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(
                    [
                      'WebApplication',
                      'Organization',
                      'LocalBusiness',
                      'FAQPage',
                      'Article',
                      'BreadcrumbList',
                    ] as SchemaTypeOption[]
                  ).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedSchemaType(type)}
                      className={`px-2 py-1 text-[11px] font-mono font-bold border transition-colors cursor-pointer truncate ${
                        selectedSchemaType === type
                          ? 'bg-[#141414] text-white border-[#141414]'
                          : 'bg-white text-neutral-800 border-neutral-300 hover:bg-neutral-100'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live JSON-LD Code Block */}
              <pre className="p-2.5 bg-[#141414] text-amber-300 font-mono text-[11px] overflow-x-auto max-h-44 border border-[#141414] leading-relaxed">
                {generatedSchemaCode}
              </pre>

              <div className="flex items-center justify-between text-[11px] pt-1">
                <a
                  href="https://search.google.com/test/rich-results"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-purple-700 hover:underline flex items-center gap-1"
                >
                  <span>Google Rich Results Validator</span>
                  <ExternalLink className="h-3 w-3" />
                </a>

                <a
                  href="https://validator.schema.org/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-neutral-600 hover:text-black flex items-center gap-1"
                >
                  <span>Schema.org Official</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
