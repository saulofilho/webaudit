import React, { useState, useMemo } from 'react';
import {
  Flame,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Eye,
  FileCode,
  Layers,
  ArrowRight,
  Filter,
  Compass,
  Code2,
  ExternalLink,
  Target,
  Maximize2,
  Sparkles,
} from 'lucide-react';
import { AuditReport, AuditItem } from '../types';

interface SeoHeatmapViewProps {
  report: AuditReport;
  onOpenFixModal?: (item: AuditItem) => void;
  onOpenActionPlan?: () => void;
}

export type HeatmapViewMode = 'wireframe' | 'serp' | 'dom-tree';
export type QualityFilter = 'all' | 'critical' | 'warning' | 'optimal';

export interface HeatmapZone {
  id: string;
  name: string;
  domSelector: string;
  score: number;
  status: 'optimal' | 'warning' | 'critical';
  impactSummary: string;
  detectedMetrics: { label: string; value: string; pass: boolean }[];
  issues: string[];
  recommendations: string[];
  snippet?: string;
  priority: 'High' | 'Medium' | 'Low';
  weightPercent: number;
}

export const SeoHeatmapView: React.FC<SeoHeatmapViewProps> = ({
  report,
  onOpenFixModal,
  onOpenActionPlan,
}) => {
  const [selectedZoneId, setSelectedZoneId] = useState<string>('zone-meta');
  const [viewMode, setViewMode] = useState<HeatmapViewMode>('wireframe');
  const [qualityFilter, setQualityFilter] = useState<QualityFilter>('all');
  const [copiedZoneId, setCopiedZoneId] = useState<string | null>(null);

  const meta = report.rawData.metaTags;
  const isHttps = report.rawData.protocol === 'https:' || report.targetUrl.startsWith('https://');

  const hostname = useMemo(() => {
    try {
      return new URL(report.targetUrl).hostname;
    } catch {
      return report.targetUrl;
    }
  }, [report.targetUrl]);

  // Compute 7 architectural SEO zones
  const zones: HeatmapZone[] = useMemo(() => {
    // 1. Meta & Document Head
    let metaScore = 0;
    const metaIssues: string[] = [];
    const metaRecs: string[] = [];
    const metaMetrics = [];

    if (meta.title) {
      const len = meta.titleLength || 0;
      if (len >= 30 && len <= 65) {
        metaScore += 40;
        metaMetrics.push({ label: 'Title Tag', value: `"${meta.title}" (${len} chars)`, pass: true });
      } else {
        metaScore += 25;
        metaMetrics.push({ label: 'Title Tag', value: `Length Suboptimal (${len} chars)`, pass: false });
        metaIssues.push(`Title tag length (${len} chars) outside optimal 30-65 chars range.`);
        metaRecs.push('Adjust title tag to be between 30 and 60 characters with primary brand keywords.');
      }
    } else {
      metaIssues.push('Missing <title> tag in document head.');
      metaRecs.push('Add unique, keyword-rich <title> tag immediately.');
      metaMetrics.push({ label: 'Title Tag', value: 'Missing', pass: false });
    }

    if (meta.description) {
      const len = meta.descriptionLength || 0;
      if (len >= 120 && len <= 165) {
        metaScore += 35;
        metaMetrics.push({ label: 'Meta Description', value: `Optimal (${len} chars)`, pass: true });
      } else {
        metaScore += 20;
        metaMetrics.push({ label: 'Meta Description', value: `Suboptimal (${len} chars)`, pass: false });
        metaIssues.push(`Meta description length (${len} chars) outside ideal 120-160 range.`);
        metaRecs.push('Write a compelling 130-160 character description with a clear call-to-action.');
      }
    } else {
      metaIssues.push('Missing <meta name="description"> tag.');
      metaRecs.push('Add an explicit meta description to prevent search engines from extracting arbitrary text.');
      metaMetrics.push({ label: 'Meta Description', value: 'Missing', pass: false });
    }

    if (meta.viewport) {
      metaScore += 15;
      metaMetrics.push({ label: 'Viewport', value: 'Mobile-Ready', pass: true });
    } else {
      metaIssues.push('Missing viewport tag prevents mobile indexing.');
      metaRecs.push('Add <meta name="viewport" content="width=device-width, initial-scale=1.0" />.');
      metaMetrics.push({ label: 'Viewport', value: 'Missing', pass: false });
    }

    if (meta.canonical) {
      metaScore += 10;
      metaMetrics.push({ label: 'Canonical URL', value: meta.canonical, pass: true });
    } else {
      metaIssues.push('No canonical URL declared; risk of duplicate URL cannibalization.');
      metaRecs.push('Specify <link rel="canonical" href="..." /> pointing to the authoritative HTTPS version.');
      metaMetrics.push({ label: 'Canonical URL', value: 'Missing', pass: false });
    }

    const metaStatus: 'optimal' | 'warning' | 'critical' =
      metaScore >= 85 ? 'optimal' : metaScore >= 60 ? 'warning' : 'critical';

    // 2. Social & Structured Data Layer
    let socialScore = 0;
    const socialIssues: string[] = [];
    const socialRecs: string[] = [];
    const socialMetrics = [];

    const hasOgTitle = !!meta.openGraph.title;
    const hasOgDesc = !!meta.openGraph.description;
    const hasOgImg = !!meta.openGraph.image;

    if (hasOgTitle && hasOgDesc && hasOgImg) {
      socialScore += 45;
      socialMetrics.push({ label: 'OpenGraph', value: 'Complete (Title, Desc, Image)', pass: true });
    } else if (hasOgTitle || hasOgDesc) {
      socialScore += 20;
      socialMetrics.push({ label: 'OpenGraph', value: 'Partial / Incomplete', pass: false });
      socialIssues.push('Missing og:image or og:description for rich link previews.');
      socialRecs.push('Define og:title, og:description, and 1200x630px og:image.');
    } else {
      socialIssues.push('Missing all OpenGraph tags (links appear unbranded on social networks).');
      socialRecs.push('Add basic OpenGraph protocol tags to boost click-through rates.');
      socialMetrics.push({ label: 'OpenGraph', value: 'Missing', pass: false });
    }

    if (meta.twitter.card) {
      socialScore += 25;
      socialMetrics.push({ label: 'Twitter Card', value: meta.twitter.card, pass: true });
    } else {
      socialIssues.push('Missing twitter:card meta tags.');
      socialRecs.push('Add <meta name="twitter:card" content="summary_large_image" />.');
      socialMetrics.push({ label: 'Twitter Card', value: 'Missing', pass: false });
    }

    const structuredCount = meta.structuredDataTypes?.length || 0;
    if (structuredCount > 0) {
      socialScore += 30;
      socialMetrics.push({ label: 'JSON-LD Schema', value: meta.structuredDataTypes.join(', '), pass: true });
    } else {
      socialIssues.push('No Schema.org JSON-LD found (ineligible for Google Rich Snippets).');
      socialRecs.push('Implement WebApplication, Organization, or FAQPage Schema.org structured data.');
      socialMetrics.push({ label: 'JSON-LD Schema', value: 'None detected', pass: false });
    }

    const socialStatus: 'optimal' | 'warning' | 'critical' =
      socialScore >= 80 ? 'optimal' : socialScore >= 50 ? 'warning' : 'critical';

    // 3. Above-the-fold & Heading H1 Zone
    let h1Score = 100;
    const h1Issues: string[] = [];
    const h1Recs: string[] = [];
    const h1Metrics = [];
    const h1Count = report.rawData.h1Count;

    if (h1Count === 1) {
      h1Metrics.push({ label: 'H1 Count', value: `Exactly 1 (${report.rawData.h1Sample || 'Valid'})`, pass: true });
    } else if (h1Count === 0) {
      h1Score = 20;
      h1Issues.push('No primary <h1> headline found in the DOM.');
      h1Recs.push('Add exactly one <h1> containing primary target keywords above the fold.');
      h1Metrics.push({ label: 'H1 Count', value: '0 (Critical Missing)', pass: false });
    } else {
      h1Score = 65;
      h1Issues.push(`Multiple <h1> tags (${h1Count}) found on page.`);
      h1Recs.push('Consolidate to a single <h1> and convert secondary headers to <h2>.');
      h1Metrics.push({ label: 'H1 Count', value: `${h1Count} (Multiple Detected)`, pass: false });
    }

    const h1Status: 'optimal' | 'warning' | 'critical' =
      h1Score >= 85 ? 'optimal' : h1Score >= 60 ? 'warning' : 'critical';

    // 4. Content Architecture & Subheadings
    let contentScore = 0;
    const contentIssues: string[] = [];
    const contentRecs: string[] = [];
    const contentMetrics = [];

    const h2Count = report.rawData.h2Count;
    const h3Count = report.rawData.h3Count;

    if (h2Count >= 1) {
      contentScore += 45;
      contentMetrics.push({ label: 'H2 Sections', value: `${h2Count} tag(s)`, pass: true });
    } else {
      contentIssues.push('No <h2> tags found for secondary document sections.');
      contentRecs.push('Structure content sections using descriptive <h2> headings.');
      contentMetrics.push({ label: 'H2 Sections', value: '0 found', pass: false });
    }

    if (h3Count >= 1) {
      contentScore += 25;
      contentMetrics.push({ label: 'H3 Sub-items', value: `${h3Count} tag(s)`, pass: true });
    } else {
      contentScore += 15;
      contentMetrics.push({ label: 'H3 Sub-items', value: '0 found (Optional)', pass: true });
    }

    if (meta.language) {
      contentScore += 30;
      contentMetrics.push({ label: 'HTML Lang', value: `lang="${meta.language}"`, pass: true });
    } else {
      contentIssues.push('Missing lang attribute on <html> element.');
      contentRecs.push('Add lang="en" to help screen readers and geo-search targeting.');
      contentMetrics.push({ label: 'HTML Lang', value: 'Missing', pass: false });
    }

    const contentStatus: 'optimal' | 'warning' | 'critical' =
      contentScore >= 80 ? 'optimal' : contentScore >= 55 ? 'warning' : 'critical';

    // 5. Media & Image Assets Layer
    let mediaScore = 100;
    const mediaIssues: string[] = [];
    const mediaRecs: string[] = [];
    const mediaMetrics = [];
    const imgTotal = report.rawData.imagesTotal;
    const imgMissing = report.rawData.imagesMissingAlt;

    if (imgTotal === 0) {
      mediaMetrics.push({ label: 'Images Total', value: '0 images detected', pass: true });
      mediaMetrics.push({ label: 'Alt Attribute Coverage', value: '100%', pass: true });
    } else {
      const altPercent = Math.round(((imgTotal - imgMissing) / imgTotal) * 100);
      mediaScore = altPercent;
      mediaMetrics.push({ label: 'Images Total', value: `${imgTotal} image(s)`, pass: true });
      mediaMetrics.push({
        label: 'Alt Attribute Coverage',
        value: `${altPercent}% (${imgMissing} missing)`,
        pass: imgMissing === 0,
      });

      if (imgMissing > 0) {
        mediaIssues.push(`${imgMissing} image(s) lack descriptive alt attributes.`);
        mediaRecs.push('Add alt="..." attributes describing visual context for accessibility and Google Image search.');
      }
    }

    const mediaStatus: 'optimal' | 'warning' | 'critical' =
      mediaScore >= 85 ? 'optimal' : mediaScore >= 60 ? 'warning' : 'critical';

    // 6. Hyperlink & Crawl Graph Layer
    let linkScore = 100;
    const linkIssues: string[] = [];
    const linkRecs: string[] = [];
    const linkMetrics = [];
    const linksTotal = report.rawData.linksTotal;
    const linksWithoutRel = report.rawData.externalLinksWithoutRel;

    linkMetrics.push({ label: 'Total Links', value: `${linksTotal} link(s)`, pass: true });

    if (linksWithoutRel > 0) {
      linkScore = Math.max(30, 100 - linksWithoutRel * 15);
      linkIssues.push(`${linksWithoutRel} external link(s) lack rel="noopener noreferrer".`);
      linkRecs.push('Add rel="noopener noreferrer" to external links opening in new tabs.');
      linkMetrics.push({
        label: 'External Links Security',
        value: `${linksWithoutRel} unprotected`,
        pass: false,
      });
    } else {
      linkMetrics.push({ label: 'External Links Security', value: 'Properly Isolated', pass: true });
    }

    const linkStatus: 'optimal' | 'warning' | 'critical' =
      linkScore >= 85 ? 'optimal' : linkScore >= 60 ? 'warning' : 'critical';

    // 7. Security & Transport Context
    let secScore = 0;
    const secIssues: string[] = [];
    const secRecs: string[] = [];
    const secMetrics = [];

    if (isHttps) {
      secScore += 65;
      secMetrics.push({ label: 'Protocol', value: 'HTTPS Encrypted (TLS)', pass: true });
    } else {
      secIssues.push('Site transmits via plain HTTP without TLS encryption.');
      secRecs.push('Enforce HTTPS and install a trusted SSL/TLS certificate.');
      secMetrics.push({ label: 'Protocol', value: 'Insecure HTTP', pass: false });
    }

    const formsWithoutHttps = report.rawData.formsWithoutHttps;
    if (formsWithoutHttps === 0) {
      secScore += 35;
      secMetrics.push({ label: 'Form Actions', value: 'Secure HTTPS', pass: true });
    } else {
      secIssues.push(`${formsWithoutHttps} form(s) post data over insecure HTTP.`);
      secRecs.push('Change all form action URLs to HTTPS endpoints.');
      secMetrics.push({ label: 'Form Actions', value: `${formsWithoutHttps} Insecure`, pass: false });
    }

    const secStatus: 'optimal' | 'warning' | 'critical' =
      secScore >= 85 ? 'optimal' : secScore >= 60 ? 'warning' : 'critical';

    return [
      {
        id: 'zone-meta',
        name: 'Document Metadata & Head Tag',
        domSelector: '<head> / <title>, <meta>',
        score: metaScore,
        status: metaStatus,
        impactSummary: 'Dictates search snippet presentation, mobile viewport scalability, and canonical deduplication.',
        detectedMetrics: metaMetrics,
        issues: metaIssues,
        recommendations: metaRecs,
        snippet: `<head>\n  <title>${meta.title || `${hostname.toUpperCase()} - Official Platform`}</title>\n  <meta name="description" content="${meta.description || 'Comprehensive solutions and services.'}" />\n  <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n  <link rel="canonical" href="${meta.canonical || report.targetUrl}" />\n</head>`,
        priority: 'High',
        weightPercent: 25,
      },
      {
        id: 'zone-social',
        name: 'Social Cards & Structured Data Layer',
        domSelector: '<meta property="og:*">, <script type="application/ld+json">',
        score: socialScore,
        status: socialStatus,
        impactSummary: 'Powers Google Rich Snippets, Knowledge Panels, and rich social preview cards across messaging platforms.',
        detectedMetrics: socialMetrics,
        issues: socialIssues,
        recommendations: socialRecs,
        snippet: `<meta property="og:title" content="${meta.title || hostname}" />\n<meta property="og:description" content="${meta.description || 'Official website.'}" />\n<meta property="og:image" content="${meta.openGraph.image || `${report.targetUrl}/og-image.jpg`}" />\n<meta name="twitter:card" content="summary_large_image" />`,
        priority: 'High',
        weightPercent: 20,
      },
      {
        id: 'zone-h1',
        name: 'Above-The-Fold & Primary H1 Zone',
        domSelector: '<header> / <h1 role="heading">',
        score: h1Score,
        status: h1Status,
        impactSummary: 'Strongest on-page semantic ranking signal. Contextualizes the core keyword theme for crawler bots.',
        detectedMetrics: h1Metrics,
        issues: h1Issues,
        recommendations: h1Recs,
        snippet: `<h1>${report.rawData.h1Sample || meta.title || 'Primary Page Headline'}</h1>`,
        priority: 'High',
        weightPercent: 20,
      },
      {
        id: 'zone-content',
        name: 'Section Hierarchy & Structural Outlines',
        domSelector: '<h2>, <h3>, <section>, <article>',
        score: contentScore,
        status: contentStatus,
        impactSummary: 'Organizes multi-topic content hierarchies for semantic readability, passage ranking, and screen readers.',
        detectedMetrics: contentMetrics,
        issues: contentIssues,
        recommendations: contentRecs,
        snippet: `<h2>Key Solution Overview</h2>\n<p>Contextual body copy...</p>\n<h3>Detailed Implementation Step</h3>`,
        priority: 'Medium',
        weightPercent: 15,
      },
      {
        id: 'zone-media',
        name: 'Rich Media & Image Asset Layer',
        domSelector: '<img alt="...">, <picture>, <svg>',
        score: mediaScore,
        status: mediaStatus,
        impactSummary: 'Drives Google Image Search traffic and fulfills WCAG non-text content accessibility standards.',
        detectedMetrics: mediaMetrics,
        issues: mediaIssues,
        recommendations: mediaRecs,
        snippet: `<img src="/assets/diagram.webp" alt="High-level architecture schema overview" width="800" height="450" loading="lazy" />`,
        priority: 'Medium',
        weightPercent: 10,
      },
      {
        id: 'zone-links',
        name: 'Hyperlink Graph & Anchor Equity',
        domSelector: '<a href="..." rel="noopener">',
        score: linkScore,
        status: linkStatus,
        impactSummary: 'Protects PageRank authority flow, prevents tabnabbing vulnerabilities, and aids crawler discovery.',
        detectedMetrics: linkMetrics,
        issues: linkIssues,
        recommendations: linkRecs,
        snippet: `<a href="https://partner.com" target="_blank" rel="noopener noreferrer">Partner Resource</a>`,
        priority: 'Low',
        weightPercent: 5,
      },
      {
        id: 'zone-security',
        name: 'Transport Protocol & Security Guardrails',
        domSelector: 'https://, <form action="https://...">',
        score: secScore,
        status: secStatus,
        impactSummary: 'Essential baseline ranking factor. HTTPS is required by Google for ranking trust and user safety.',
        detectedMetrics: secMetrics,
        issues: secIssues,
        recommendations: secRecs,
        snippet: `# Nginx forced HTTPS directive\nreturn 301 https://$host$request_uri;`,
        priority: 'High',
        weightPercent: 5,
      },
    ];
  }, [meta, report.rawData, report.targetUrl, hostname, isHttps]);

  // Selected Zone Object
  const selectedZone = useMemo(() => {
    return zones.find((z) => z.id === selectedZoneId) || zones[0];
  }, [zones, selectedZoneId]);

  // Overall Weighted Architecture Score
  const overallArchitectureScore = useMemo(() => {
    let totalWeighted = 0;
    let totalWeight = 0;
    zones.forEach((z) => {
      totalWeighted += z.score * z.weightPercent;
      totalWeight += z.weightPercent;
    });
    return Math.round(totalWeighted / totalWeight);
  }, [zones]);

  const optimalCount = useMemo(() => zones.filter((z) => z.status === 'optimal').length, [zones]);
  const warningCount = useMemo(() => zones.filter((z) => z.status === 'warning').length, [zones]);
  const criticalCount = useMemo(() => zones.filter((z) => z.status === 'critical').length, [zones]);

  // Filtered zones for list/cards
  const filteredZones = useMemo(() => {
    if (qualityFilter === 'all') return zones;
    return zones.filter((z) => z.status === qualityFilter);
  }, [zones, qualityFilter]);

  const handleCopySnippet = (snippet: string, id: string) => {
    navigator.clipboard.writeText(snippet);
    setCopiedZoneId(id);
    setTimeout(() => setCopiedZoneId(null), 2000);
  };

  const getHeatmapColor = (status: 'optimal' | 'warning' | 'critical', type: 'bg' | 'border' | 'badge' | 'glow') => {
    switch (status) {
      case 'optimal':
        if (type === 'bg') return 'bg-emerald-500';
        if (type === 'border') return 'border-emerald-700';
        if (type === 'badge') return 'bg-emerald-100 text-emerald-950 border-emerald-700';
        return 'shadow-[0_0_12px_rgba(16,185,129,0.35)]';
      case 'warning':
        if (type === 'bg') return 'bg-amber-400';
        if (type === 'border') return 'border-amber-600';
        if (type === 'badge') return 'bg-amber-100 text-amber-950 border-amber-700';
        return 'shadow-[0_0_12px_rgba(245,158,11,0.35)]';
      case 'critical':
        if (type === 'bg') return 'bg-rose-500';
        if (type === 'border') return 'border-rose-700';
        if (type === 'badge') return 'bg-rose-100 text-rose-950 border-rose-700';
        return 'shadow-[0_0_12px_rgba(244,63,94,0.45)]';
    }
  };

  return (
    <div className="space-y-6 font-mono text-[#141414]">
      {/* Header Banner */}
      <div className="border-2 border-[#141414] bg-white p-5 shadow-[4px_4px_0px_#141414]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center border-2 border-[#141414] bg-amber-400 shadow-[2px_2px_0px_#141414] shrink-0">
              <Flame className="h-6 w-6 text-[#141414]" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base sm:text-lg font-black uppercase tracking-tight">
                  SEO Structural Heatmap
                </h2>
                <span className="bg-neutral-100 text-[#141414] border border-[#141414] px-2 py-0.5 text-[10px] font-black">
                  7 ANATOMICAL ZONES
                </span>
              </div>
              <p className="text-xs text-[#141414]/70 mt-0.5">
                Visualizing document architecture, crawler rendering paths, and high vs. low SEO quality zones
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenActionPlan && (
              <button
                type="button"
                onClick={onOpenActionPlan}
                className="flex items-center gap-1.5 border-2 border-[#141414] bg-[#E4E3E0] px-3 py-1.5 text-xs font-black hover:bg-white transition-all shadow-[2px_2px_0px_#141414] cursor-pointer"
              >
                <span>OPEN ACTION PLAN</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Heatmap KPI Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t-2 border-[#141414]">
          <div className="border border-[#141414] bg-[#E4E3E0]/40 p-3">
            <span className="text-[10px] uppercase font-bold text-[#141414]/70 block">
              SEO Architecture Score
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black">{overallArchitectureScore}</span>
              <span className="text-xs font-bold text-[#141414]/60">/100</span>
            </div>
          </div>

          <div className="border border-[#141414] bg-emerald-50/70 p-3">
            <span className="text-[10px] uppercase font-bold text-emerald-950 block">
              High Quality Zones
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-emerald-700">{optimalCount}</span>
              <span className="text-xs font-bold text-emerald-900/60">of 7 zones</span>
            </div>
          </div>

          <div className="border border-[#141414] bg-amber-50/70 p-3">
            <span className="text-[10px] uppercase font-bold text-amber-950 block">
              Needs Attention
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-amber-600">{warningCount}</span>
              <span className="text-xs font-bold text-amber-900/60">moderate</span>
            </div>
          </div>

          <div className="border border-[#141414] bg-rose-50/70 p-3">
            <span className="text-[10px] uppercase font-bold text-rose-950 block">
              Critical Low Quality
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-rose-700">{criticalCount}</span>
              <span className="text-xs font-bold text-rose-900/60">urgent</span>
            </div>
          </div>
        </div>
      </div>

      {/* Control Toolbar: View Modes & Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 border-2 border-[#141414] bg-white shadow-[2px_2px_0px_#141414]">
        {/* View Mode Selector */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold text-[#141414]/70 mr-1 uppercase">MODE:</span>
          {(
            [
              { id: 'wireframe', label: 'PAGE WIREFRAME', icon: Layers },
              { id: 'serp', label: 'SERP SIMULATION', icon: Eye },
              { id: 'dom-tree', label: 'DOM HIERARCHY', icon: FileCode },
            ] as const
          ).map((mode) => {
            const Icon = mode.icon;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setViewMode(mode.id)}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold border transition-all cursor-pointer ${
                  viewMode === mode.id
                    ? 'bg-[#141414] text-white border-[#141414]'
                    : 'bg-white text-[#141414] border-[#141414] hover:bg-[#E4E3E0]'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* Quality Filter */}
        <div className="flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5 text-[#141414]/60 mr-0.5" />
          <span className="text-[11px] font-bold text-[#141414]/70 mr-1 uppercase">SHOW:</span>
          {(
            [
              { id: 'all', label: 'ALL (7)' },
              { id: 'critical', label: `CRITICAL (${criticalCount})` },
              { id: 'warning', label: `WARNING (${warningCount})` },
              { id: 'optimal', label: `OPTIMAL (${optimalCount})` },
            ] as const
          ).map((filt) => (
            <button
              key={filt.id}
              type="button"
              onClick={() => setQualityFilter(filt.id)}
              className={`px-2 py-0.5 text-[11px] font-bold border transition-all cursor-pointer ${
                qualityFilter === filt.id
                  ? 'bg-[#141414] text-white border-[#141414]'
                  : 'bg-white text-[#141414] border-[#141414] hover:bg-[#E4E3E0]'
              }`}
            >
              {filt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Interactive Visualization + Zone Deep Dive Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Heatmap Visualization (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="border-2 border-[#141414] bg-white p-4 shadow-[4px_4px_0px_#141414]">
            {/* Legend & Thermal Scale Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-[#141414] pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4 text-[#141414]" />
                <span className="text-xs font-black uppercase">
                  {viewMode === 'wireframe'
                    ? 'Interactive Page Architecture Blueprint'
                    : viewMode === 'serp'
                    ? 'Googlebot Indexing & SERP Snippet Heatmap'
                    : 'DOM Heading & Semantic Tree Heatmap'}
                </span>
              </div>

              {/* Thermal Legend */}
              <div className="flex items-center gap-2 text-[10px] font-bold">
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-emerald-500 border border-emerald-800" />
                  HIGH (85-100)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-amber-400 border border-amber-700" />
                  MODERATE (60-84)
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2.5 h-2.5 bg-rose-500 border border-rose-800" />
                  LOW (0-59)
                </span>
              </div>
            </div>

            {/* VIEW 1: WIREFRAME PAGE BLUEPRINT HEATMAP */}
            {viewMode === 'wireframe' && (
              <div className="space-y-3">
                <p className="text-[11px] text-[#141414]/70 mb-2">
                  Click on any anatomical page section below to inspect quality signals, crawler risks, and code fixes.
                </p>

                {/* Wireframe Mockup Container */}
                <div className="border-2 border-[#141414] bg-neutral-100 p-3 sm:p-4 space-y-2.5 rounded-none">
                  {/* Browser Bar Simulation */}
                  <div className="border border-[#141414] bg-white px-3 py-1.5 flex items-center justify-between text-[10px] mb-2">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-400" />
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span className="w-2 h-2 rounded-full bg-emerald-400" />
                      <span className="text-[#141414]/50 ml-1">https://{hostname}</span>
                    </div>
                    <span className="font-bold text-[9px] uppercase bg-neutral-200 px-1">DOM ROOT</span>
                  </div>

                  {/* 1. Document Head & Metadata Strip */}
                  <div
                    onClick={() => setSelectedZoneId('zone-meta')}
                    className={`border-2 p-3 cursor-pointer transition-all ${
                      selectedZoneId === 'zone-meta'
                        ? 'border-[#141414] ring-2 ring-[#141414] bg-white'
                        : 'border-[#141414]/40 bg-white hover:border-[#141414]'
                    } ${getHeatmapColor(zones[0].status, 'glow')}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-3 h-3 border border-[#141414] ${getHeatmapColor(
                            zones[0].status,
                            'bg'
                          )}`}
                        />
                        <span className="text-xs font-black uppercase">{zones[0].name}</span>
                      </div>
                      <span className={`text-[10px] font-black px-1.5 py-0.2 border ${getHeatmapColor(zones[0].status, 'badge')}`}>
                        {zones[0].score}/100 • {zones[0].status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#141414]/70 mt-1 truncate">
                      {zones[0].domSelector} • {meta.title ? `"${meta.title}"` : 'No title tag found'}
                    </div>
                  </div>

                  {/* 2. Social Meta & Structured Data Strip */}
                  <div
                    onClick={() => setSelectedZoneId('zone-social')}
                    className={`border-2 p-3 cursor-pointer transition-all ${
                      selectedZoneId === 'zone-social'
                        ? 'border-[#141414] ring-2 ring-[#141414] bg-white'
                        : 'border-[#141414]/40 bg-white hover:border-[#141414]'
                    } ${getHeatmapColor(zones[1].status, 'glow')}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-3 h-3 border border-[#141414] ${getHeatmapColor(
                            zones[1].status,
                            'bg'
                          )}`}
                        />
                        <span className="text-xs font-black uppercase">{zones[1].name}</span>
                      </div>
                      <span className={`text-[10px] font-black px-1.5 py-0.2 border ${getHeatmapColor(zones[1].status, 'badge')}`}>
                        {zones[1].score}/100 • {zones[1].status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#141414]/70 mt-1 truncate">
                      OpenGraph & Twitter Card • {meta.structuredDataTypes?.length ? `${meta.structuredDataTypes.join(', ')}` : 'No JSON-LD'}
                    </div>
                  </div>

                  {/* 3. Header & Above-The-Fold H1 */}
                  <div
                    onClick={() => setSelectedZoneId('zone-h1')}
                    className={`border-2 p-3.5 cursor-pointer transition-all ${
                      selectedZoneId === 'zone-h1'
                        ? 'border-[#141414] ring-2 ring-[#141414] bg-white'
                        : 'border-[#141414]/40 bg-white hover:border-[#141414]'
                    } ${getHeatmapColor(zones[2].status, 'glow')}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-3 h-3 border border-[#141414] ${getHeatmapColor(
                            zones[2].status,
                            'bg'
                          )}`}
                        />
                        <span className="text-xs font-black uppercase">{zones[2].name}</span>
                      </div>
                      <span className={`text-[10px] font-black px-1.5 py-0.2 border ${getHeatmapColor(zones[2].status, 'badge')}`}>
                        {zones[2].score}/100 • {zones[2].status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-[11px] font-bold mt-1 text-[#141414]">
                      {report.rawData.h1Sample || '<h1> Primary Headline Area'}
                    </div>
                  </div>

                  {/* 4 & 5. Content Grid: Content Hierarchy + Rich Media Layer */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {/* Content Architecture */}
                    <div
                      onClick={() => setSelectedZoneId('zone-content')}
                      className={`border-2 p-3 cursor-pointer transition-all ${
                        selectedZoneId === 'zone-content'
                          ? 'border-[#141414] ring-2 ring-[#141414] bg-white'
                          : 'border-[#141414]/40 bg-white hover:border-[#141414]'
                      } ${getHeatmapColor(zones[3].status, 'glow')}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2.5 h-2.5 border border-[#141414] ${getHeatmapColor(
                              zones[3].status,
                              'bg'
                            )}`}
                          />
                          <span className="text-[11px] font-black uppercase">Subheadings & Body</span>
                        </div>
                        <span className={`text-[9px] font-bold px-1 border ${getHeatmapColor(zones[3].status, 'badge')}`}>
                          {zones[3].score}%
                        </span>
                      </div>
                      <div className="text-[10px] text-[#141414]/70 mt-1">
                        {report.rawData.h2Count} H2s • {report.rawData.h3Count} H3s • Lang: {meta.language || 'None'}
                      </div>
                    </div>

                    {/* Rich Media Layer */}
                    <div
                      onClick={() => setSelectedZoneId('zone-media')}
                      className={`border-2 p-3 cursor-pointer transition-all ${
                        selectedZoneId === 'zone-media'
                          ? 'border-[#141414] ring-2 ring-[#141414] bg-white'
                          : 'border-[#141414]/40 bg-white hover:border-[#141414]'
                      } ${getHeatmapColor(zones[4].status, 'glow')}`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-2.5 h-2.5 border border-[#141414] ${getHeatmapColor(
                              zones[4].status,
                              'bg'
                            )}`}
                          />
                          <span className="text-[11px] font-black uppercase">Media & Image Assets</span>
                        </div>
                        <span className={`text-[9px] font-bold px-1 border ${getHeatmapColor(zones[4].status, 'badge')}`}>
                          {zones[4].score}%
                        </span>
                      </div>
                      <div className="text-[10px] text-[#141414]/70 mt-1">
                        {report.rawData.imagesTotal} Images ({report.rawData.imagesMissingAlt} missing alt)
                      </div>
                    </div>
                  </div>

                  {/* 6. Links & Anchor Graph */}
                  <div
                    onClick={() => setSelectedZoneId('zone-links')}
                    className={`border-2 p-3 cursor-pointer transition-all ${
                      selectedZoneId === 'zone-links'
                        ? 'border-[#141414] ring-2 ring-[#141414] bg-white'
                        : 'border-[#141414]/40 bg-white hover:border-[#141414]'
                    } ${getHeatmapColor(zones[5].status, 'glow')}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-3 h-3 border border-[#141414] ${getHeatmapColor(
                            zones[5].status,
                            'bg'
                          )}`}
                        />
                        <span className="text-xs font-black uppercase">{zones[5].name}</span>
                      </div>
                      <span className={`text-[10px] font-black px-1.5 py-0.2 border ${getHeatmapColor(zones[5].status, 'badge')}`}>
                        {zones[5].score}/100 • {zones[5].status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#141414]/70 mt-1">
                      {report.rawData.linksTotal} total links ({report.rawData.externalLinksWithoutRel} external missing noopener)
                    </div>
                  </div>

                  {/* 7. Security & Transport Protocol Footer */}
                  <div
                    onClick={() => setSelectedZoneId('zone-security')}
                    className={`border-2 p-3 cursor-pointer transition-all ${
                      selectedZoneId === 'zone-security'
                        ? 'border-[#141414] ring-2 ring-[#141414] bg-white'
                        : 'border-[#141414]/40 bg-white hover:border-[#141414]'
                    } ${getHeatmapColor(zones[6].status, 'glow')}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-3 h-3 border border-[#141414] ${getHeatmapColor(
                            zones[6].status,
                            'bg'
                          )}`}
                        />
                        <span className="text-xs font-black uppercase">{zones[6].name}</span>
                      </div>
                      <span className={`text-[10px] font-black px-1.5 py-0.2 border ${getHeatmapColor(zones[6].status, 'badge')}`}>
                        {zones[6].score}/100 • {zones[6].status.toUpperCase()}
                      </span>
                    </div>
                    <div className="text-[10px] text-[#141414]/70 mt-1">
                      {isHttps ? 'HTTPS Active (Google Verified)' : 'Insecure HTTP (Ranking Penalty)'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 2: SERP & CRAWLER SNIPPET SIMULATION HEATMAP */}
            {viewMode === 'serp' && (
              <div className="space-y-4">
                <p className="text-[11px] text-[#141414]/70">
                  Heatmap analysis of how Google Search indexers parse and generate snippets from your document:
                </p>

                {/* Google SERP Snippet Preview Box with Heatmap Overlays */}
                <div className="border-2 border-[#141414] bg-white p-4 space-y-2">
                  <div className="flex items-center gap-2 text-[10px] text-[#141414]/60">
                    <span className="bg-emerald-100 text-emerald-950 px-1 font-bold">HTTPS</span>
                    <span>https://{hostname}</span>
                  </div>

                  {/* Title Element */}
                  <div
                    onClick={() => setSelectedZoneId('zone-meta')}
                    className="cursor-pointer border-2 border-dashed border-blue-500/80 p-2 hover:bg-blue-50/50 transition-colors"
                  >
                    <div className="flex items-center justify-between text-[10px] text-blue-700 font-bold mb-0.5">
                      <span>SERP HEADLINE (&lt;title&gt;)</span>
                      <span className="bg-blue-100 px-1">{meta.titleLength || 0} / 60 chars</span>
                    </div>
                    <div className="text-sm sm:text-base font-bold text-blue-700 hover:underline">
                      {meta.title || `${hostname} - No title tag defined`}
                    </div>
                  </div>

                  {/* Description Element */}
                  <div
                    onClick={() => setSelectedZoneId('zone-meta')}
                    className="cursor-pointer border-2 border-dashed border-amber-500/80 p-2 hover:bg-amber-50/50 transition-colors"
                  >
                    <div className="flex items-center justify-between text-[10px] text-amber-800 font-bold mb-0.5">
                      <span>SERP SNIPPET (&lt;meta name="description"&gt;)</span>
                      <span className="bg-amber-100 px-1">{meta.descriptionLength || 0} / 160 chars</span>
                    </div>
                    <p className="text-xs text-neutral-600 leading-relaxed">
                      {meta.description || 'No meta description found. Search engines will generate automated fallbacks.'}
                    </p>
                  </div>

                  {/* Rich Snippet Preview */}
                  <div
                    onClick={() => setSelectedZoneId('zone-social')}
                    className="cursor-pointer border-2 border-dashed border-emerald-600/80 p-2 hover:bg-emerald-50/50 transition-colors"
                  >
                    <div className="flex items-center justify-between text-[10px] text-emerald-800 font-bold mb-1">
                      <span>RICH RESULTS & SCHEMA ENTITIES</span>
                      <span className="bg-emerald-100 px-1">JSON-LD</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 text-[10px]">
                      {meta.structuredDataTypes?.length ? (
                        meta.structuredDataTypes.map((t) => (
                          <span key={t} className="bg-emerald-100 text-emerald-950 px-1.5 py-0.5 border border-emerald-700 font-bold">
                            ✓ {t}
                          </span>
                        ))
                      ) : (
                        <span className="text-rose-700 font-bold">
                          ⚠ No structured data detected. Add WebApplication or Organization schema.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 3: DOM HEADING & SEMANTIC TREE HEATMAP */}
            {viewMode === 'dom-tree' && (
              <div className="space-y-3 text-xs">
                <p className="text-[11px] text-[#141414]/70 mb-2">
                  Structural outline of heading tags (H1 → H2 → H3) with thermal validation flags:
                </p>

                <div className="border border-[#141414] bg-neutral-50 p-4 space-y-3 font-mono">
                  {/* H1 Node */}
                  <div
                    onClick={() => setSelectedZoneId('zone-h1')}
                    className="border-l-4 border-l-blue-600 pl-3 py-1 cursor-pointer bg-white border border-[#141414] p-2 hover:shadow-xs"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-blue-700">1. PRIMARY HEADING &lt;h1&gt;</span>
                      <span
                        className={`font-black px-1.5 py-0.2 border ${
                          report.rawData.h1Count === 1
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-600'
                            : 'bg-rose-100 text-rose-900 border-rose-600'
                        }`}
                      >
                        {report.rawData.h1Count === 1 ? 'PASS (1 H1)' : `${report.rawData.h1Count} DETECTED`}
                      </span>
                    </div>
                    <div className="font-bold text-xs mt-1 text-[#141414]">
                      {report.rawData.h1Sample ? `"${report.rawData.h1Sample}"` : 'Missing <h1> tag'}
                    </div>
                  </div>

                  {/* H2 Node */}
                  <div
                    onClick={() => setSelectedZoneId('zone-content')}
                    className="ml-4 border-l-4 border-l-amber-500 pl-3 py-1 cursor-pointer bg-white border border-[#141414] p-2 hover:shadow-xs"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-amber-800">2. SECTION TOPICS &lt;h2&gt;</span>
                      <span className="font-bold bg-amber-100 text-amber-900 px-1 border border-amber-600">
                        {report.rawData.h2Count} FOUND
                      </span>
                    </div>
                    <div className="text-[11px] text-[#141414]/80 mt-1">
                      {report.rawData.h2Count > 0
                        ? `${report.rawData.h2Count} secondary sections divide main topic hierarchy.`
                        : 'No <h2> headings detected. Document lacks semantic sections.'}
                    </div>
                  </div>

                  {/* H3 Node */}
                  <div
                    onClick={() => setSelectedZoneId('zone-content')}
                    className="ml-8 border-l-4 border-l-neutral-400 pl-3 py-1 cursor-pointer bg-white border border-[#141414] p-2 hover:shadow-xs"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="font-bold text-neutral-700">3. SUB-ELEMENTS &lt;h3&gt;</span>
                      <span className="font-bold bg-neutral-200 px-1 border border-neutral-400">
                        {report.rawData.h3Count} FOUND
                      </span>
                    </div>
                    <div className="text-[11px] text-[#141414]/80 mt-1">
                      {report.rawData.h3Count > 0
                        ? `${report.rawData.h3Count} granular sub-topics mapped.`
                        : '0 sub-headings.'}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Zone Deep Dive Inspector (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="border-2 border-[#141414] bg-white p-5 shadow-[4px_4px_0px_#141414] space-y-4">
            {/* Zone Header */}
            <div className="border-b-2 border-[#141414] pb-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase text-[#141414]/70">
                  INSPECTOR PANEL • {selectedZone.domSelector}
                </span>
                <span
                  className={`text-[10px] font-black px-2 py-0.5 border ${getHeatmapColor(
                    selectedZone.status,
                    'badge'
                  )}`}
                >
                  {selectedZone.score}/100 • {selectedZone.status.toUpperCase()}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-black uppercase mt-1">
                {selectedZone.name}
              </h3>
              <p className="text-[11px] text-[#141414]/80 mt-1">
                {selectedZone.impactSummary}
              </p>
            </div>

            {/* Detected Metrics Grid */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-black uppercase text-[#141414] block">
                Audited Elements in this Zone:
              </span>
              <div className="space-y-1.5">
                {selectedZone.detectedMetrics.map((met, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-2 border border-[#141414]/20 bg-neutral-50 p-2 text-xs"
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      {met.pass ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                      )}
                      <span className="font-bold text-[#141414] truncate">{met.label}</span>
                    </div>
                    <span className="font-mono text-[11px] text-right truncate text-[#141414]/80">
                      {met.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Identified Issues */}
            {selectedZone.issues.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-black uppercase text-rose-700 flex items-center gap-1">
                  <XCircle className="h-3.5 w-3.5" />
                  Detected Degradations ({selectedZone.issues.length}):
                </span>
                <div className="space-y-1">
                  {selectedZone.issues.map((iss, idx) => (
                    <div
                      key={idx}
                      className="border-l-2 border-rose-600 bg-rose-50/50 p-2 text-[11px] text-rose-950 font-medium"
                    >
                      {iss}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actionable Recommendations */}
            {selectedZone.recommendations.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-black uppercase text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Recommended Fixes:
                </span>
                <div className="space-y-1">
                  {selectedZone.recommendations.map((rec, idx) => (
                    <div
                      key={idx}
                      className="border-l-2 border-emerald-600 bg-emerald-50/50 p-2 text-[11px] text-emerald-950"
                    >
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ready-to-use HTML Snippet */}
            {selectedZone.snippet && (
              <div className="pt-2">
                <div className="border border-[#141414] bg-[#141414] text-[#E4E3E0]">
                  <div className="flex items-center justify-between border-b border-neutral-700 px-3 py-1.5 bg-[#1C1C1C] text-[10px]">
                    <span className="font-bold text-neutral-300">Ready-to-Paste Code Snippet</span>
                    <button
                      type="button"
                      onClick={() => handleCopySnippet(selectedZone.snippet!, selectedZone.id)}
                      className="flex items-center gap-1 text-neutral-300 hover:text-white cursor-pointer"
                    >
                      {copiedZoneId === selectedZone.id ? (
                        <Check className="h-3 w-3 text-emerald-400" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                      <span>{copiedZoneId === selectedZone.id ? 'COPIED' : 'COPY'}</span>
                    </button>
                  </div>
                  <pre className="p-3 font-mono text-[11px] overflow-x-auto leading-relaxed max-h-44 selection:bg-amber-400 selection:text-black">
                    <code>{selectedZone.snippet}</code>
                  </pre>
                </div>
              </div>
            )}

            {/* Direct Remediation Shortcut */}
            {onOpenActionPlan && (
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onOpenActionPlan}
                  className="w-full flex items-center justify-center gap-2 border-2 border-[#141414] bg-amber-400 py-2 text-xs font-black uppercase hover:bg-amber-300 shadow-[2px_2px_0px_#141414] cursor-pointer transition-all"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>APPLY THIS FIX IN ACTION PLAN</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
