import React, { useState, useEffect } from 'react';
import {
  FileText,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Download,
  Copy,
  Check,
  Search,
  ExternalLink,
  Layers,
  Clock,
  Compass,
  ArrowRight,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { AuditReport, SitemapCrawlData, CrawledPageItem } from '../types';
import { PageRankSimulator } from './PageRankSimulator';

interface SitemapCrawlerViewProps {
  report: AuditReport;
}

export const SitemapCrawlerView: React.FC<SitemapCrawlerViewProps> = ({ report }) => {
  const [data, setData] = useState<SitemapCrawlData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'issues' | 'slow' | 'duplicate'>('all');
  const [search, setSearch] = useState<string>('');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const fetchCrawl = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/crawl-sitemap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: report.targetUrl, maxPages: 12 }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}`);
      }
      const json: SitemapCrawlData = await res.json();
      setData(json);
    } catch (err: any) {
      console.error('Failed to crawl sitemap:', err);
      setError(err.message || 'Unable to crawl sitemap.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (report?.targetUrl) {
      fetchCrawl();
    }
  }, [report.targetUrl]);

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 1800);
  };

  const handleExportCsv = () => {
    if (!data) return;
    const headers = ['URL', 'Status', 'Load Time (ms)', 'Title', 'Meta Description', 'H1 Count', 'Canonical', 'Issues'];
    const rows = data.pages.map((p) => [
      `"${p.url}"`,
      p.statusCode,
      p.responseTimeMs,
      `"${(p.title || '').replace(/"/g, '""')}"`,
      `"${(p.metaDescription || '').replace(/"/g, '""')}"`,
      p.h1Count,
      `"${p.canonical || ''}"`,
      `"${p.issues.join('; ')}"`,
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `sitemap-crawl-${new URL(report.targetUrl).hostname}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredPages = (data?.pages || []).filter((p) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!p.url.toLowerCase().includes(q) && !(p.title || '').toLowerCase().includes(q)) {
        return false;
      }
    }
    if (filter === 'issues') return p.issues.length > 0;
    if (filter === 'slow') return p.responseTimeMs > 1200;
    if (filter === 'duplicate') return p.issues.some((iss) => iss.includes('Duplicate title'));
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="border-2 border-[#141414] bg-white p-5 shadow-[4px_4px_0px_#141414]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-[#141414]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center border-2 border-[#141414] bg-[#141414] text-white shadow-[2px_2px_0px_#888888]">
              <Compass className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase text-[#141414]">
                Multi-Page Sitemap & Cross-Page Health Crawler
              </h2>
              <p className="text-xs font-mono text-[#141414]/70">
                Discovers sitemap.xml, crawls top domain URLs, detects duplicate titles and missing meta tags.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchCrawl}
              disabled={isLoading}
              className="flex items-center gap-1.5 border-2 border-[#141414] bg-white px-3 py-1.5 text-xs font-mono font-black uppercase text-[#141414] hover:bg-[#141414] hover:text-white transition-all shadow-[2px_2px_0px_#141414] cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Crawling...' : 'Re-crawl Site'}</span>
            </button>
            {data && (
              <button
                onClick={handleExportCsv}
                className="flex items-center gap-1.5 border-2 border-[#141414] bg-[#141414] text-[#E4E3E0] px-3 py-1.5 text-xs font-mono font-black uppercase hover:bg-black transition-all shadow-[2px_2px_0px_#888888] cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Export CSV</span>
              </button>
            )}
          </div>
        </div>

        {/* Discovery Details */}
        {data && (
          <div className="mt-4 pt-3 border-t border-[#141414]/20 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="font-bold text-[#141414]">Sitemap Status:</span>
              {data.sitemapFound ? (
                <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100 px-2 py-0.5 border border-[#141414] font-bold">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Found: {data.sitemapUrl}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-amber-800 bg-amber-100 px-2 py-0.5 border border-[#141414] font-bold">
                  <AlertTriangle className="h-3.5 w-3.5" /> No sitemap.xml located (Crawled via internal page links)
                </span>
              )}
            </div>
            <div className="text-[#141414]/70">
              Avg Response Time: <strong className="text-[#141414]">{data.averageResponseTimeMs}ms</strong>
            </div>
          </div>
        )}

        {/* Metrics Grid */}
        {data && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
            <div className="border border-[#141414] bg-[#E4E3E0]/40 p-3">
              <span className="text-[10px] font-mono font-bold uppercase text-[#141414]/70">Site Crawl Score</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className={`text-2xl font-black font-mono ${data.healthScore >= 80 ? 'text-emerald-700' : data.healthScore >= 50 ? 'text-amber-700' : 'text-red-700'}`}>
                  {data.healthScore}
                </span>
                <span className="text-xs font-mono text-[#141414]/60">/100</span>
              </div>
            </div>

            <div className="border border-[#141414] bg-white p-3">
              <span className="text-[10px] font-mono font-bold uppercase text-[#141414]/70">Pages Crawled</span>
              <p className="text-2xl font-black font-mono text-[#141414] mt-1">
                {data.totalPagesCrawled} <span className="text-xs font-normal text-[#141414]/60">/ {data.totalPagesDiscovered}</span>
              </p>
            </div>

            <div className={`border border-[#141414] p-3 ${data.issuesSummary.duplicateTitles > 0 ? 'bg-amber-50 text-amber-900' : 'bg-white'}`}>
              <span className="text-[10px] font-mono font-bold uppercase text-[#141414]/70">Duplicate Titles</span>
              <p className={`text-2xl font-black font-mono mt-1 ${data.issuesSummary.duplicateTitles > 0 ? 'text-amber-700' : 'text-[#141414]'}`}>
                {data.issuesSummary.duplicateTitles}
              </p>
            </div>

            <div className={`border border-[#141414] p-3 ${data.issuesSummary.missingMetaDescriptions > 0 ? 'bg-amber-50 text-amber-900' : 'bg-white'}`}>
              <span className="text-[10px] font-mono font-bold uppercase text-[#141414]/70">Missing Descriptions</span>
              <p className={`text-2xl font-black font-mono mt-1 ${data.issuesSummary.missingMetaDescriptions > 0 ? 'text-amber-700' : 'text-[#141414]'}`}>
                {data.issuesSummary.missingMetaDescriptions}
              </p>
            </div>

            <div className={`border border-[#141414] p-3 ${data.issuesSummary.missingH1 > 0 ? 'bg-amber-50 text-amber-900' : 'bg-white'}`}>
              <span className="text-[10px] font-mono font-bold uppercase text-[#141414]/70">Missing / Multiple H1</span>
              <p className="text-2xl font-black font-mono text-[#141414] mt-1">
                {data.issuesSummary.missingH1 + data.issuesSummary.multipleH1}
              </p>
            </div>

            <div className={`border border-[#141414] p-3 ${data.issuesSummary.httpErrors > 0 ? 'bg-red-50 text-red-900' : 'bg-white'}`}>
              <span className="text-[10px] font-mono font-bold uppercase text-[#141414]/70">HTTP Errors</span>
              <p className={`text-2xl font-black font-mono mt-1 ${data.issuesSummary.httpErrors > 0 ? 'text-red-700' : 'text-[#141414]'}`}>
                {data.issuesSummary.httpErrors}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="border-2 border-[#141414] bg-white p-12 text-center shadow-[4px_4px_0px_#141414]">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-[#141414] mb-3" />
          <h3 className="font-mono font-black text-sm uppercase">Crawling Discovered Site Pages...</h3>
          <p className="text-xs font-mono text-[#141414]/70 mt-1">
            Analyzing indexability, heading hierarchies, title tags, and response latencies across pages.
          </p>
        </div>
      )}

      {error && (
        <div className="border-2 border-[#141414] bg-red-100 p-5 text-red-900 shadow-[4px_4px_0px_#141414]">
          <div className="flex items-center gap-2 font-mono font-black text-sm uppercase">
            <AlertTriangle className="h-4 w-4" />
            <span>Crawl Failure</span>
          </div>
          <p className="text-xs font-mono mt-1">{error}</p>
        </div>
      )}

      {/* PageRank & Domain Authority Simulator Section */}
      {data && (
        <PageRankSimulator sitemapData={data} onRefreshCrawl={fetchCrawl} />
      )}

      {/* Duplicate Titles Section */}
      {data && data.duplicateTitleGroups.length > 0 && (
        <div className="border-2 border-[#141414] bg-amber-50 p-4 shadow-[4px_4px_0px_#141414]">
          <div className="flex items-center gap-2 pb-2 border-b border-[#141414]/20">
            <AlertTriangle className="h-4 w-4 text-amber-700" />
            <h3 className="text-xs font-black uppercase text-amber-900 font-mono">
              Duplicate Title Conflict Warning ({data.duplicateTitleGroups.length} groups detected)
            </h3>
          </div>
          <div className="space-y-3 mt-3">
            {data.duplicateTitleGroups.map((group, idx) => (
              <div key={idx} className="bg-white border border-[#141414] p-3 text-xs font-mono">
                <div className="font-bold text-[#141414] mb-1">
                  &quot;{group.title}&quot;
                </div>
                <div className="text-[11px] text-[#141414]/70 space-y-0.5">
                  {group.urls.map((u, uIdx) => (
                    <div key={uIdx} className="flex items-center gap-1.5 truncate">
                      <ArrowRight className="h-3 w-3 shrink-0 text-amber-600" />
                      <a href={u} target="_blank" rel="noopener noreferrer" className="hover:underline truncate text-blue-700">
                        {u}
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pages Table */}
      {data && (
        <div className="border-2 border-[#141414] bg-white p-4 shadow-[4px_4px_0px_#141414] space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { id: 'all', label: `All Pages (${data.pages.length})` },
                { id: 'issues', label: `With Issues (${data.pages.filter((p) => p.issues.length > 0).length})` },
                { id: 'slow', label: `Slow (>1.2s) (${data.pages.filter((p) => p.responseTimeMs > 1200).length})` },
                { id: 'duplicate', label: `Duplicate Titles (${data.pages.filter((p) => p.issues.some((i) => i.includes('Duplicate'))).length})` },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setFilter(btn.id as any)}
                  className={`px-2.5 py-1 text-xs font-mono font-bold border border-[#141414] transition-all cursor-pointer ${
                    filter === btn.id
                      ? 'bg-[#141414] text-white shadow-[1px_1px_0px_#888888]'
                      : 'bg-white text-[#141414] hover:bg-[#E4E3E0]'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            <div className="relative min-w-[220px]">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#141414]/50" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search page URL or title..."
                className="w-full border border-[#141414] pl-8 pr-3 py-1.5 text-xs font-mono bg-white text-[#141414] focus:outline-none focus:ring-1 focus:ring-[#141414]"
              />
            </div>
          </div>

          <div className="overflow-x-auto border border-[#141414] mt-3">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-[#141414] text-[#E4E3E0] uppercase text-[11px]">
                  <th className="p-2.5 border-r border-[#333]">Status</th>
                  <th className="p-2.5 border-r border-[#333]">Page URL</th>
                  <th className="p-2.5 border-r border-[#333]">Title Tag</th>
                  <th className="p-2.5 border-r border-[#333]">Meta Description</th>
                  <th className="p-2.5 border-r border-[#333]">H1</th>
                  <th className="p-2.5 border-r border-[#333]">Issues Found</th>
                  <th className="p-2.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141414]/20 bg-white">
                {filteredPages.map((page, idx) => (
                  <tr key={idx} className="hover:bg-[#E4E3E0]/50 transition-colors">
                    <td className="p-2.5 border-r border-[#141414]/20 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black border border-[#141414] ${
                          page.statusCode >= 200 && page.statusCode < 300
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {page.statusCode} ({page.responseTimeMs}ms)
                      </span>
                    </td>

                    <td className="p-2.5 border-r border-[#141414]/20 max-w-[240px] truncate" title={page.url}>
                      <span className="font-bold text-[#141414]">{page.url}</span>
                    </td>

                    <td className="p-2.5 border-r border-[#141414]/20 max-w-[200px]" title={page.title || 'Missing'}>
                      {page.title ? (
                        <div>
                          <div className="truncate font-semibold">{page.title}</div>
                          <span className="text-[10px] text-[#141414]/60">({page.titleLength} chars)</span>
                        </div>
                      ) : (
                        <span className="text-red-600 font-bold">⚠️ Missing Title</span>
                      )}
                    </td>

                    <td className="p-2.5 border-r border-[#141414]/20 max-w-[220px]" title={page.metaDescription || 'Missing'}>
                      {page.metaDescription ? (
                        <div>
                          <div className="truncate text-[#141414]/80">{page.metaDescription}</div>
                          <span className="text-[10px] text-[#141414]/60">({page.metaDescLength} chars)</span>
                        </div>
                      ) : (
                        <span className="text-amber-700 font-bold">⚠️ Missing Description</span>
                      )}
                    </td>

                    <td className="p-2.5 border-r border-[#141414]/20 whitespace-nowrap">
                      {page.h1Count === 1 ? (
                        <span className="text-emerald-700 font-bold">✓ 1 H1</span>
                      ) : page.h1Count === 0 ? (
                        <span className="text-red-600 font-bold">✗ 0 H1</span>
                      ) : (
                        <span className="text-amber-700 font-bold">⚠️ {page.h1Count} H1s</span>
                      )}
                    </td>

                    <td className="p-2.5 border-r border-[#141414]/20">
                      {page.issues.length === 0 ? (
                        <span className="text-emerald-700 font-bold text-[11px]">✓ No issues</span>
                      ) : (
                        <div className="space-y-1">
                          {page.issues.map((iss, iIdx) => (
                            <span
                              key={iIdx}
                              className="inline-block bg-amber-100 text-amber-900 border border-[#141414] px-1.5 py-0.5 text-[9px] font-bold mr-1"
                            >
                              {iss}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="p-2.5 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleCopy(page.url)}
                          title="Copy page URL"
                          className="p-1 border border-[#141414] hover:bg-[#141414] hover:text-white transition-colors"
                        >
                          {copiedUrl === page.url ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                        </button>
                        <a
                          href={page.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="Open in new window"
                          className="p-1 border border-[#141414] hover:bg-[#141414] hover:text-white transition-colors"
                        >
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
