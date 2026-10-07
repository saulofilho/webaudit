import React, { useState, useEffect } from 'react';
import {
  Link2,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  RefreshCw,
  Download,
  Filter,
  ShieldAlert,
  ArrowRight,
  Copy,
  Check,
  Search,
  Globe,
} from 'lucide-react';
import { AuditReport, LinkCheckData, LinkAuditItem } from '../types';

interface BrokenLinksViewProps {
  report: AuditReport;
}

export const BrokenLinksView: React.FC<BrokenLinksViewProps> = ({ report }) => {
  const [data, setData] = useState<LinkCheckData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'broken' | 'redirects' | 'insecure' | 'missingRel' | 'internal' | 'external'>('all');
  const [search, setSearch] = useState<string>('');
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  const fetchLinks = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/check-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: report.targetUrl, maxLinks: 40 }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}`);
      }
      const json: LinkCheckData = await res.json();
      setData(json);
    } catch (err: any) {
      console.error('Failed to check links:', err);
      setError(err.message || 'Unable to scan page links.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (report?.targetUrl) {
      fetchLinks();
    }
  }, [report.targetUrl]);

  const handleCopy = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedUrl(url);
    setTimeout(() => setCopiedUrl(null), 1800);
  };

  const handleExportCsv = () => {
    if (!data) return;
    const headers = ['URL', 'Anchor Text', 'Type', 'Status', 'Response Time (ms)', 'Broken', 'Insecure', 'Missing Noopener', 'Redirect Target'];
    const rows = data.links.map((l) => [
      `"${l.url}"`,
      `"${l.text.replace(/"/g, '""')}"`,
      l.isInternal ? 'Internal' : 'External',
      l.status,
      l.responseTimeMs,
      l.isBroken ? 'YES' : 'NO',
      l.isInsecure ? 'YES' : 'NO',
      l.missingNoopener ? 'YES' : 'NO',
      l.redirectUrl ? `"${l.redirectUrl}"` : '',
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `links-audit-${new URL(report.targetUrl).hostname}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLinks = (data?.links || []).filter((l) => {
    if (search.trim()) {
      const q = search.toLowerCase();
      if (!l.url.toLowerCase().includes(q) && !l.text.toLowerCase().includes(q)) {
        return false;
      }
    }
    if (filter === 'broken') return l.isBroken;
    if (filter === 'redirects') return l.status >= 300 && l.status < 400;
    if (filter === 'insecure') return l.isInsecure;
    if (filter === 'missingRel') return l.missingNoopener;
    if (filter === 'internal') return l.isInternal;
    if (filter === 'external') return !l.isInternal;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="border-2 border-[#141414] bg-white p-5 shadow-[4px_4px_0px_#141414]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-[#141414]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center border-2 border-[#141414] bg-[#141414] text-white shadow-[2px_2px_0px_#888888]">
              <Link2 className="h-6 w-6 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase text-[#141414]">
                Link Health, 404 & Redirect Chain Inspector
              </h2>
              <p className="text-xs font-mono text-[#141414]/70">
                Live crawler inspecting HTTP status codes, crawl budget redirect waste, and anchor attributes.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={fetchLinks}
              disabled={isLoading}
              className="flex items-center gap-1.5 border-2 border-[#141414] bg-white px-3 py-1.5 text-xs font-mono font-black uppercase text-[#141414] hover:bg-[#141414] hover:text-white transition-all shadow-[2px_2px_0px_#141414] cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Scanning...' : 'Re-scan Links'}</span>
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

        {/* Metrics Grid */}
        {data && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-4">
            <div className="border border-[#141414] bg-[#E4E3E0]/40 p-3">
              <span className="text-[10px] font-mono font-bold uppercase text-[#141414]/70">Score Link Health</span>
              <div className="flex items-baseline gap-1 mt-1">
                <span className={`text-2xl font-black font-mono ${data.healthScore >= 80 ? 'text-emerald-700' : data.healthScore >= 50 ? 'text-amber-700' : 'text-red-700'}`}>
                  {data.healthScore}
                </span>
                <span className="text-xs font-mono text-[#141414]/60">/100</span>
              </div>
            </div>

            <div className="border border-[#141414] bg-white p-3">
              <span className="text-[10px] font-mono font-bold uppercase text-[#141414]/70">Total Checked</span>
              <p className="text-2xl font-black font-mono text-[#141414] mt-1">{data.totalChecked}</p>
            </div>

            <div className={`border border-[#141414] p-3 ${data.brokenCount > 0 ? 'bg-red-50 text-red-900' : 'bg-emerald-50 text-emerald-900'}`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase">Broken (404/500)</span>
                {data.brokenCount > 0 ? <XCircle className="h-4 w-4 text-red-600" /> : <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
              </div>
              <p className={`text-2xl font-black font-mono mt-1 ${data.brokenCount > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
                {data.brokenCount}
              </p>
            </div>

            <div className={`border border-[#141414] p-3 ${data.redirectsCount > 0 ? 'bg-amber-50 text-amber-900' : 'bg-white text-[#141414]'}`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase">Redirects (301/302)</span>
                <ArrowRight className="h-4 w-4 text-amber-600" />
              </div>
              <p className="text-2xl font-black font-mono mt-1 text-amber-700">{data.redirectsCount}</p>
            </div>

            <div className={`border border-[#141414] p-3 ${data.insecureCount > 0 ? 'bg-rose-50 text-rose-900' : 'bg-white text-[#141414]'}`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-bold uppercase">Insecure (HTTP)</span>
                <ShieldAlert className="h-4 w-4 text-rose-600" />
              </div>
              <p className="text-2xl font-black font-mono mt-1 text-rose-700">{data.insecureCount}</p>
            </div>

            <div className="border border-[#141414] bg-white p-3">
              <span className="text-[10px] font-mono font-bold uppercase text-[#141414]/70">Noopener Missing</span>
              <p className="text-2xl font-black font-mono mt-1 text-slate-800">{data.missingNoopenerCount}</p>
            </div>
          </div>
        )}
      </div>

      {/* Loading & Error States */}
      {isLoading && (
        <div className="border-2 border-[#141414] bg-white p-12 text-center shadow-[4px_4px_0px_#141414]">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-[#141414] mb-3" />
          <h3 className="font-mono font-black text-sm uppercase">Pinging Page Links Concurrently...</h3>
          <p className="text-xs font-mono text-[#141414]/70 mt-1">
            Validating HTTP headers, response times, SSL security, and redirect chains.
          </p>
        </div>
      )}

      {error && (
        <div className="border-2 border-[#141414] bg-red-100 p-5 text-red-900 shadow-[4px_4px_0px_#141414]">
          <div className="flex items-center gap-2 font-mono font-black text-sm uppercase">
            <AlertTriangle className="h-4 w-4" />
            <span>Inspection Error</span>
          </div>
          <p className="text-xs font-mono mt-1">{error}</p>
          <button
            onClick={fetchLinks}
            className="mt-3 border border-[#141414] bg-white px-3 py-1 text-xs font-mono font-bold text-[#141414] hover:bg-[#141414] hover:text-white"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Filter and Search Bar */}
      {data && (
        <div className="border-2 border-[#141414] bg-white p-4 shadow-[4px_4px_0px_#141414] space-y-3">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Filter buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-mono font-bold text-[#141414]/70 mr-1 flex items-center gap-1">
                <Filter className="h-3 w-3" /> Filters:
              </span>
              {[
                { id: 'all', label: `All (${data.links.length})` },
                { id: 'broken', label: `Broken (${data.brokenCount})`, badgeColor: 'bg-red-600 text-white' },
                { id: 'redirects', label: `Redirects (${data.redirectsCount})`, badgeColor: 'bg-amber-500 text-white' },
                { id: 'insecure', label: `Insecure HTTP (${data.insecureCount})`, badgeColor: 'bg-rose-600 text-white' },
                { id: 'missingRel', label: `Missing Rel (${data.missingNoopenerCount})` },
                { id: 'internal', label: `Internal (${data.internalCount})` },
                { id: 'external', label: `External (${data.externalCount})` },
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

            {/* Search */}
            <div className="relative min-w-[220px]">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#141414]/50" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter by anchor or URL..."
                className="w-full border border-[#141414] pl-8 pr-3 py-1.5 text-xs font-mono bg-white text-[#141414] focus:outline-none focus:ring-1 focus:ring-[#141414]"
              />
            </div>
          </div>

          {/* Links Table */}
          <div className="overflow-x-auto border border-[#141414] mt-3">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-[#141414] text-[#E4E3E0] uppercase text-[11px]">
                  <th className="p-2.5 border-r border-[#333]">Status</th>
                  <th className="p-2.5 border-r border-[#333]">Anchor Text</th>
                  <th className="p-2.5 border-r border-[#333]">Destination URL</th>
                  <th className="p-2.5 border-r border-[#333]">Type</th>
                  <th className="p-2.5 border-r border-[#333]">Latency</th>
                  <th className="p-2.5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141414]/20 bg-white">
                {filteredLinks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[#141414]/60">
                      No links matching the selected filter criteria.
                    </td>
                  </tr>
                ) : (
                  filteredLinks.map((item, idx) => (
                    <tr
                      key={idx}
                      className={`hover:bg-[#E4E3E0]/50 transition-colors ${
                        item.isBroken ? 'bg-red-50/60' : item.status >= 300 && item.status < 400 ? 'bg-amber-50/40' : ''
                      }`}
                    >
                      {/* Status Code */}
                      <td className="p-2.5 border-r border-[#141414]/20 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-black border border-[#141414] ${
                            item.status >= 200 && item.status < 300
                              ? 'bg-emerald-100 text-emerald-800'
                              : item.status >= 300 && item.status < 400
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {item.status || 'ERR'} {item.statusText}
                        </span>
                      </td>

                      {/* Anchor text */}
                      <td className="p-2.5 border-r border-[#141414]/20 max-w-[200px] truncate font-bold text-[#141414]">
                        {item.text}
                      </td>

                      {/* URL & Redirection */}
                      <td className="p-2.5 border-r border-[#141414]/20 max-w-[320px]">
                        <div className="truncate font-mono text-[11px] text-[#141414]" title={item.url}>
                          {item.url}
                        </div>
                        {item.redirectUrl && (
                          <div className="flex items-center gap-1 text-[10px] text-amber-700 font-bold mt-0.5 truncate" title={item.redirectUrl}>
                            <ArrowRight className="h-3 w-3 shrink-0" />
                            <span>Redirects to: {item.redirectUrl}</span>
                          </div>
                        )}
                        {item.isInsecure && (
                          <div className="text-[10px] text-rose-600 font-bold mt-0.5 flex items-center gap-1">
                            <ShieldAlert className="h-3 w-3 shrink-0" /> Insecure HTTP link on HTTPS domain
                          </div>
                        )}
                        {item.missingNoopener && (
                          <div className="text-[10px] text-orange-600 font-bold mt-0.5">
                            ⚠️ External link missing rel=&quot;noopener noreferrer&quot;
                          </div>
                        )}
                      </td>

                      {/* Internal / External */}
                      <td className="p-2.5 border-r border-[#141414]/20 whitespace-nowrap">
                        <span
                          className={`inline-block px-1.5 py-0.5 text-[9px] font-bold border border-[#141414] ${
                            item.isInternal ? 'bg-blue-100 text-blue-900' : 'bg-purple-100 text-purple-900'
                          }`}
                        >
                          {item.isInternal ? 'INTERNAL' : 'EXTERNAL'}
                        </span>
                      </td>

                      {/* Response Time */}
                      <td className="p-2.5 border-r border-[#141414]/20 whitespace-nowrap text-[#141414]">
                        {item.responseTimeMs}ms
                      </td>

                      {/* Actions */}
                      <td className="p-2.5 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleCopy(item.url)}
                            title="Copy link URL"
                            className="p-1 border border-[#141414] hover:bg-[#141414] hover:text-white transition-colors"
                          >
                            {copiedUrl === item.url ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                          </button>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open link in new tab"
                            className="p-1 border border-[#141414] hover:bg-[#141414] hover:text-white transition-colors"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
