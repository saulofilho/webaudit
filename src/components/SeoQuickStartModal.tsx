import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Search,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Copy,
  Check,
  Code2,
  Sparkles,
  ExternalLink,
  Share2,
  FileCode,
  Layers,
  ArrowRight,
  Filter,
  CheckSquare,
  Square,
  RefreshCw,
  Terminal,
} from 'lucide-react';
import { AuditReport } from '../types';

interface SeoQuickStartModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: AuditReport;
}

type SchemaType = 'WebApplication' | 'Organization' | 'LocalBusiness' | 'Article' | 'FAQPage';

export const SeoQuickStartModal: React.FC<SeoQuickStartModalProps> = ({
  isOpen,
  onClose,
  report,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'pending' | 'completed'>('all');
  const [selectedSchemaType, setSelectedSchemaType] = useState<SchemaType>('WebApplication');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [customCompletedIds, setCustomCompletedIds] = useState<Record<string, boolean>>({});

  const meta = report.rawData.metaTags;
  const hostname = useMemo(() => {
    try {
      return new URL(report.targetUrl).hostname;
    } catch {
      return report.targetUrl;
    }
  }, [report.targetUrl]);

  // Load custom checklist checks from localStorage for this domain
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`webaudit_seo_checklist_${hostname}`);
      if (saved) {
        setCustomCompletedIds(JSON.parse(saved));
      }
    } catch (e) {
      console.warn('Failed to load SEO checklist storage', e);
    }
  }, [hostname]);

  const toggleCheck = (id: string) => {
    setCustomCompletedIds((prev) => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(`webaudit_seo_checklist_${hostname}`, JSON.stringify(next));
      } catch (e) {
        console.warn('Failed to save SEO checklist storage', e);
      }
      return next;
    });
  };

  // Structured Data (JSON-LD) Generator
  const schemaCode = useMemo(() => {
    const siteTitle = meta.title || `${hostname.toUpperCase()} - Web Platform`;
    const siteDesc =
      meta.description ||
      `Comprehensive solutions and high-performance services on ${hostname}.`;
    const siteUrl = report.targetUrl;

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
          logo: meta.openGraph.image || `${siteUrl}/logo.png`,
          description: siteDesc,
          sameAs: [
            'https://twitter.com/your-brand',
            'https://linkedin.com/company/your-brand',
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
            streetAddress: '100 Main Street',
            addressLocality: 'New York',
            addressRegion: 'NY',
            postalCode: '10001',
            addressCountry: 'US',
          },
        };
        break;

      case 'Article':
        schemaObj = {
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: siteTitle,
          description: siteDesc,
          image: meta.openGraph.image || `${siteUrl}/cover.jpg`,
          datePublished: new Date().toISOString(),
          author: {
            '@type': 'Person',
            name: 'Editorial Team',
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
              name: `How does ${hostname} work?`,
              acceptedAnswer: {
                '@type': 'Answer',
                text: siteDesc,
              },
            },
            {
              '@type': 'Question',
              name: 'What are the main benefits and guarantees?',
              acceptedAnswer: {
                '@type': 'Answer',
                text: 'High-speed performance, verified data security standards, and dedicated 24/7 customer support.',
              },
            },
          ],
        };
        break;
    }

    return `<script type="application/ld+json">\n${JSON.stringify(schemaObj, null, 2)}\n</script>`;
  }, [selectedSchemaType, meta, hostname, report.targetUrl]);

  // Complete HTML Meta Tags Bundle Snippet
  const completeMetaBundle = useMemo(() => {
    const titleVal = meta.title || `${hostname.toUpperCase()} – Official & Secure`;
    const descVal =
      meta.description ||
      `Access ${hostname}. Discover modern solutions, features, and high-performance web resources.`;
    const canonicalVal = meta.canonical || report.targetUrl;
    const ogImg = meta.openGraph.image || `${report.targetUrl}/og-image.jpg`;

    return `<!-- Basic SEO & Google Search Indexing -->
<title>${titleVal}</title>
<meta name="description" content="${descVal}" />
<link rel="canonical" href="${canonicalVal}" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<meta name="robots" content="index, follow" />

<!-- OpenGraph (Facebook, LinkedIn, Discord, Slack) -->
<meta property="og:type" content="website" />
<meta property="og:title" content="${titleVal}" />
<meta property="og:description" content="${descVal}" />
<meta property="og:url" content="${canonicalVal}" />
<meta property="og:image" content="${ogImg}" />
<meta property="og:site_name" content="${hostname}" />

<!-- Twitter / X Cards -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${titleVal}" />
<meta name="twitter:description" content="${descVal}" />
<meta name="twitter:image" content="${ogImg}" />

${schemaCode}`;
  }, [meta, hostname, report.targetUrl, schemaCode]);

  // Checklist Items with automated heuristic evaluation
  const checklistItems = useMemo(() => {
    const titleLen = meta.titleLength || 0;
    const isTitleGood = titleLen >= 30 && titleLen <= 65;

    const descLen = meta.descriptionLength || 0;
    const isDescGood = descLen >= 120 && descLen <= 165;

    const hasCanonical = !!meta.canonical;
    const hasSchema = (meta.structuredDataTypes || []).length > 0;
    const hasOgImage = !!meta.openGraph.image;
    const hasTwitter = !!meta.twitter.card;
    const h1Count = report.rawData.h1Count;
    const isH1Good = h1Count === 1;
    const missingAlt = report.rawData.imagesMissingAlt;
    const isAltGood = missingAlt === 0;

    return [
      {
        id: 'seo-title',
        title: 'Title Tag Optimization (<title>)',
        priority: 'CRITICAL',
        timeEst: '2 min',
        autoPassed: isTitleGood,
        impact: 'Primary relevance factor in Google algorithms and the primary clickable headline in search engine results.',
        current: meta.title
          ? `"${meta.title}" (${titleLen} characters)`
          : 'No <title> tag found!',
        guideline:
          'Keep between 30 and 60 characters. Include brand name and primary target keyword without keyword stuffing.',
        codeSnippet: `<title>${meta.title || `${hostname.toUpperCase()} – High Performance Solutions`}</title>`,
      },
      {
        id: 'seo-description',
        title: 'Compelling Meta Description (<meta name="description">)',
        priority: 'HIGH IMPACT',
        timeEst: '3 min',
        autoPassed: isDescGood,
        impact: 'Determines click-through rate (CTR) on SERPs. An engaging description earns up to 30% more organic traffic.',
        current: meta.description
          ? `"${meta.description.slice(0, 90)}..." (${descLen} characters)`
          : 'Meta description missing!',
        guideline:
          'Write between 120 and 160 characters with a clear call-to-action (CTA) and direct user value proposition.',
        codeSnippet: `<meta name="description" content="${
          meta.description ||
          `Discover how ${hostname} transforms your online workflow with speed, security, and precision. Explore now!`
        }" />`,
      },
      {
        id: 'seo-canonical',
        title: 'Canonical URL Tag (<link rel="canonical">)',
        priority: 'HIGH IMPACT',
        timeEst: '1 min',
        autoPassed: hasCanonical,
        impact: 'Prevents duplicate content cannibalization caused by tracking parameters (?utm_, ?ref=) and HTTP/HTTPS variations.',
        current: meta.canonical || 'Not declared!',
        guideline: 'Always specify the definitive canonical HTTPS URL for the current document.',
        codeSnippet: `<link rel="canonical" href="${meta.canonical || report.targetUrl}" />`,
      },
      {
        id: 'seo-schema',
        title: 'Schema.org Structured Data (JSON-LD)',
        priority: 'HIGH IMPACT',
        timeEst: '5 min',
        autoPassed: hasSchema,
        impact: 'Enables Rich Snippets (review stars, FAQs, sitelinks searchbox, and company logos) in Google search results.',
        current: hasSchema
          ? `Detected: ${(meta.structuredDataTypes || []).join(', ')}`
          : 'No Schema.org JSON-LD scripts identified!',
        guideline:
          'Use standardized types such as WebApplication, Organization, or LocalBusiness in a <script type="application/ld+json"> tag.',
        codeSnippet: schemaCode,
      },
      {
        id: 'seo-opengraph',
        title: 'OpenGraph & Twitter Social Cards',
        priority: 'MEDIUM IMPACT',
        timeEst: '4 min',
        autoPassed: hasOgImage && hasTwitter,
        impact: 'Ensures links shared on WhatsApp, Slack, LinkedIn, and X/Twitter display rich preview banners, titles, and summaries.',
        current: hasOgImage ? `OG Image: ${meta.openGraph.image}` : 'og:image missing!',
        guideline:
          'Provide a featured banner with 1200x630px resolution (1.91:1 ratio) under 300KB for near-instant rendering.',
        codeSnippet: `<meta property="og:image" content="${meta.openGraph.image || `${report.targetUrl}/og-image.jpg`}" />\n<meta name="twitter:card" content="summary_large_image" />`,
      },
      {
        id: 'seo-h1',
        title: 'Primary Heading Hierarchy (Single H1)',
        priority: 'HIGH IMPACT',
        timeEst: '2 min',
        autoPassed: isH1Good,
        impact: 'The H1 tag grounds the page core topic for Googlebot and accessible screen reader users.',
        current: `${h1Count} H1 tag(s) detected`,
        guideline: 'Maintain exactly one <h1> tag per page, followed by clear <h2> and <h3> hierarchical sections.',
        codeSnippet: `<h1>${report.rawData.h1Sample || meta.title || 'Main Page Heading'}</h1>`,
      },
      {
        id: 'seo-images-alt',
        title: 'Descriptive Alt Attributes on Images',
        priority: 'MEDIUM IMPACT',
        timeEst: '5 min',
        autoPassed: isAltGood,
        impact: 'Enables ranking in Google Image Search and ensures compliance with WCAG accessibility guidelines.',
        current:
          missingAlt === 0
            ? 'All images have alt text'
            : `${missingAlt} image(s) missing alt text`,
        guideline:
          'Succinctly describe image visual context. Avoid generic words like "image" or "photo".',
        codeSnippet: `<img src="/image.webp" alt="Clear descriptive summary of the visual element" width="600" height="400" />`,
      },
      {
        id: 'seo-indexing',
        title: 'Indexing Directives & Sitemap (robots / sitemap.xml)',
        priority: 'CRITICAL',
        timeEst: '3 min',
        autoPassed: !meta.robots?.includes('noindex'),
        impact: 'Prevents accidental indexation blocks after deployments and facilitates crawler site discovery.',
        current: meta.robots ? `Meta robots: ${meta.robots}` : 'Standard (index, follow)',
        guideline:
          'Verify production does not leak "noindex". Submit your sitemap.xml directly into Google Search Console.',
        codeSnippet: `User-agent: *\nAllow: /\nSitemap: ${report.targetUrl.replace(/\/$/, '')}/sitemap.xml`,
      },
    ];
  }, [meta, report.rawData, hostname, report.targetUrl, schemaCode]);

  // Overall completed count considering both auto-passed and manually checked
  const stats = useMemo(() => {
    let completed = 0;
    checklistItems.forEach((item) => {
      const isDone = item.autoPassed || !!customCompletedIds[item.id];
      if (isDone) completed++;
    });
    const total = checklistItems.length;
    const percentage = Math.round((completed / total) * 100);
    return { completed, total, percentage };
  }, [checklistItems, customCompletedIds]);

  const filteredItems = useMemo(() => {
    return checklistItems.filter((item) => {
      const isDone = item.autoPassed || !!customCompletedIds[item.id];
      if (filterMode === 'pending') return !isDone;
      if (filterMode === 'completed') return isDone;
      return true;
    });
  }, [checklistItems, customCompletedIds, filterMode]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyMarkdownChecklist = () => {
    const md = [
      `# SEO Quick-Start Checklist – ${hostname}`,
      `Date: ${new Date().toLocaleDateString('en-US')}`,
      `Progress: ${stats.completed}/${stats.total} (${stats.percentage}%)`,
      '',
      ...checklistItems.map((item) => {
        const isDone = item.autoPassed || !!customCompletedIds[item.id];
        return `- [${isDone ? 'x' : ' '}] **${item.title}** [${item.priority}] (${item.timeEst})\n  ${item.guideline}`;
      }),
    ].join('\n');

    handleCopy(md, 'markdown-checklist');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-[#141414]/75 backdrop-blur-xs font-mono">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col border-2 border-[#141414] bg-white shadow-[8px_8px_0px_#141414] text-[#141414]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b-2 border-[#141414] p-4 bg-[#E4E3E0] shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center border-2 border-[#141414] bg-blue-600 text-white">
              <Search className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black uppercase tracking-tight">
                  SEO Quick-Start Checklist
                </h3>
                <span className="bg-blue-100 text-blue-950 border border-blue-800 px-2 py-0.5 text-[10px] font-black">
                  SEO SCORE: {report.categories.seo.score}/100
                </span>
              </div>
              <p className="text-[11px] text-[#141414]/70">
                Essential and high-impact actions for meta tags, indexing, and structured data on Google
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyMarkdownChecklist}
              className="hidden sm:flex items-center gap-1.5 border border-[#141414] bg-white px-2.5 py-1 text-xs font-bold hover:bg-[#141414] hover:text-white shadow-[2px_2px_0px_#141414] transition-all cursor-pointer"
              title="Copy checklist in Markdown format"
            >
              {copiedId === 'markdown-checklist' ? (
                <Check className="h-3.5 w-3.5 text-emerald-600" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              <span>{copiedId === 'markdown-checklist' ? 'COPIED!' : 'COPY AS MD'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="border border-[#141414] p-1.5 bg-white hover:bg-neutral-200 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Progress & Quick Stats Banner */}
        <div className="border-b-2 border-[#141414] bg-neutral-50 p-4 space-y-2.5 shrink-0">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              CHECKLIST PROGRESS: <strong>{stats.completed} of {stats.total} items completed</strong>
            </span>
            <span className="text-sm font-black text-[#141414]">
              {stats.percentage}% COMPLETE
            </span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 border-2 border-[#141414] bg-[#E4E3E0]">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${stats.percentage}%` }}
            />
          </div>

          {/* Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-bold text-[#141414]/70 mr-1">VIEW:</span>
              {(['all', 'pending', 'completed'] as const).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setFilterMode(mode)}
                  className={`px-2.5 py-0.5 border text-[11px] font-bold cursor-pointer transition-all ${
                    filterMode === mode
                      ? 'bg-[#141414] text-white border-[#141414]'
                      : 'bg-white text-[#141414] border-[#141414] hover:bg-[#E4E3E0]'
                  }`}
                >
                  {mode === 'all' ? 'ALL ITEMS' : mode === 'pending' ? 'PENDING' : 'COMPLETED'}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => handleCopy(completeMetaBundle, 'meta-bundle')}
              className="flex items-center gap-1.5 border border-[#141414] bg-amber-400 px-2.5 py-1 text-[11px] font-black text-[#141414] hover:bg-amber-300 shadow-[2px_2px_0px_#141414] cursor-pointer"
            >
              {copiedId === 'meta-bundle' ? (
                <Check className="h-3.5 w-3.5 text-emerald-800" />
              ) : (
                <Code2 className="h-3.5 w-3.5" />
              )}
              <span>
                {copiedId === 'meta-bundle'
                  ? 'FULL BUNDLE COPIED!'
                  : 'COPY COMPLETE <HEAD> BUNDLE'}
              </span>
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-5 flex-1 text-xs">
          {/* Checklist Items List */}
          <div className="space-y-4">
            {filteredItems.map((item) => {
              const isChecked = item.autoPassed || !!customCompletedIds[item.id];

              return (
                <div
                  key={item.id}
                  className={`border-2 border-[#141414] p-4 transition-all shadow-[2px_2px_0px_#141414] ${
                    isChecked ? 'bg-white' : 'bg-neutral-50'
                  }`}
                >
                  {/* Item Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#141414]/20 pb-3">
                    <div className="flex items-start gap-2.5">
                      <button
                        type="button"
                        onClick={() => toggleCheck(item.id)}
                        className="mt-0.5 cursor-pointer text-[#141414] hover:opacity-70"
                        title={isChecked ? 'Mark as pending' : 'Mark as completed'}
                      >
                        {isChecked ? (
                          <CheckSquare className="h-5 w-5 text-emerald-700 stroke-[2.5]" />
                        ) : (
                          <Square className="h-5 w-5 text-neutral-400" />
                        )}
                      </button>

                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h4
                            className={`font-black text-sm uppercase ${
                              isChecked ? 'line-through text-[#141414]/60' : 'text-[#141414]'
                            }`}
                          >
                            {item.title}
                          </h4>
                          <span
                            className={`text-[9px] font-black px-1.5 py-0.2 border ${
                              item.priority === 'CRITICAL'
                                ? 'bg-rose-100 text-rose-950 border-rose-700'
                                : item.priority === 'HIGH IMPACT'
                                ? 'bg-amber-100 text-amber-950 border-amber-700'
                                : 'bg-blue-100 text-blue-950 border-blue-700'
                            }`}
                          >
                            {item.priority}
                          </span>
                          <span className="text-[10px] text-[#141414]/60">~{item.timeEst}</span>
                        </div>

                        <p className="text-[11px] text-[#141414]/80 mt-1">
                          {item.impact}
                        </p>
                      </div>
                    </div>

                    <div className="sm:text-right shrink-0">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black border ${
                          item.autoPassed
                            ? 'bg-emerald-100 text-emerald-950 border-emerald-700'
                            : isChecked
                            ? 'bg-neutral-100 text-[#141414] border-[#141414]'
                            : 'bg-rose-100 text-rose-950 border-rose-700'
                        }`}
                      >
                        {item.autoPassed ? (
                          <>
                            <CheckCircle2 className="h-3 w-3 text-emerald-700" />
                            AUDIT PASSED
                          </>
                        ) : isChecked ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-700" />
                            MARKED AS DONE
                          </>
                        ) : (
                          <>
                            <AlertTriangle className="h-3 w-3 text-rose-700" />
                            PENDING / ACTION REQUIRED
                          </>
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Item Body: Diagnosis + Action + Snippet */}
                  <div className="pt-3 space-y-2.5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                      <div className="border border-[#141414]/20 bg-[#E4E3E0] p-2">
                        <span className="font-bold block text-[10px] text-[#141414]/70 uppercase">
                          Current Audited State:
                        </span>
                        <div className="font-mono mt-0.5 truncate text-[#141414]">
                          {item.current}
                        </div>
                      </div>

                      <div className="border border-[#141414]/20 bg-white p-2">
                        <span className="font-bold block text-[10px] text-[#141414]/70 uppercase">
                          Actionable Guideline:
                        </span>
                        <div className="mt-0.5 text-[#141414]/90">
                          {item.guideline}
                        </div>
                      </div>
                    </div>

                    {/* Code Snippet Box */}
                    <div className="border border-[#141414] bg-[#141414] text-[#E4E3E0]">
                      <div className="flex items-center justify-between border-b border-neutral-700 px-3 py-1.5 bg-[#1C1C1C] text-[10px]">
                        <span className="font-bold text-neutral-300">Ready-to-use HTML Snippet</span>
                        <button
                          type="button"
                          onClick={() => handleCopy(item.codeSnippet, item.id)}
                          className="flex items-center gap-1 text-neutral-300 hover:text-white cursor-pointer"
                        >
                          {copiedId === item.id ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                          <span>{copiedId === item.id ? 'COPIED' : 'COPY'}</span>
                        </button>
                      </div>
                      <pre className="p-2.5 font-mono text-[11px] overflow-x-auto leading-relaxed selection:bg-amber-400 selection:text-black">
                        <code>{item.codeSnippet}</code>
                      </pre>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Structured Data (JSON-LD) Deep Dive Section */}
          <div className="border-2 border-[#141414] bg-white p-5 shadow-[4px_4px_0px_#141414] space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#141414] pb-3">
              <div className="flex items-center gap-2">
                <FileCode className="h-5 w-5 text-blue-600" />
                <div>
                  <h3 className="text-sm font-black uppercase">
                    Interactive Schema.org Structured Data Generator
                  </h3>
                  <p className="text-[11px] text-[#141414]/70">
                    Generate semantic markup compatible with Google Rich Results and enhanced snippets
                  </p>
                </div>
              </div>

              <a
                href="https://search.google.com/test/rich-results"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 border border-[#141414] bg-[#E4E3E0] px-2.5 py-1 text-xs font-bold hover:bg-white"
              >
                <span>GOOGLE RICH RESULTS TEST</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>

            {/* Schema Type Buttons */}
            <div>
              <span className="text-[10px] font-bold uppercase text-[#141414]/70 block mb-1.5">
                SELECT PRIMARY WEBSITE ENTITY:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {(
                  [
                    'WebApplication',
                    'Organization',
                    'LocalBusiness',
                    'Article',
                    'FAQPage',
                  ] as SchemaType[]
                ).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setSelectedSchemaType(type)}
                    className={`py-2 px-2 border-2 text-center font-bold text-xs cursor-pointer transition-all ${
                      selectedSchemaType === type
                        ? 'bg-[#141414] text-white border-[#141414] shadow-[2px_2px_0px_#888888]'
                        : 'bg-[#E4E3E0] text-[#141414] border-[#141414] hover:bg-white'
                    }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* Schema Code Output */}
            <div className="border-2 border-[#141414] bg-[#141414] text-[#E4E3E0]">
              <div className="flex items-center justify-between border-b border-neutral-700 px-3 py-2 bg-[#1C1C1C]">
                <span className="text-[11px] font-bold text-white">
                  schema.org ({selectedSchemaType}) – JSON-LD
                </span>
                <button
                  type="button"
                  onClick={() => handleCopy(schemaCode, 'schema-generator')}
                  className="flex items-center gap-1 border border-neutral-600 px-2 py-0.5 text-[10px] text-neutral-300 hover:text-white cursor-pointer"
                >
                  {copiedId === 'schema-generator' ? (
                    <Check className="h-3 w-3 text-emerald-400" />
                  ) : (
                    <Copy className="h-3 w-3" />
                  )}
                  <span>{copiedId === 'schema-generator' ? 'COPIED!' : 'COPY JSON-LD'}</span>
                </button>
              </div>
              <pre className="p-3.5 font-mono text-[11px] overflow-x-auto max-h-52 leading-relaxed selection:bg-amber-400 selection:text-black">
                <code>{schemaCode}</code>
              </pre>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t-2 border-[#141414] p-4 bg-[#E4E3E0] shrink-0 text-xs">
          <div className="text-[11px] text-[#141414]/70">
            Ready to apply inside <strong>index.html</strong> or your project's root document.
          </div>

          <button
            type="button"
            onClick={onClose}
            className="border-2 border-[#141414] bg-[#141414] text-white px-5 py-1.5 font-bold hover:bg-neutral-800 shadow-[2px_2px_0px_#888888] cursor-pointer"
          >
            DONE & CLOSE
          </button>
        </div>
      </div>
    </div>
  );
};
