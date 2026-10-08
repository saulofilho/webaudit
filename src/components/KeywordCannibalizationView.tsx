import React, { useState, useEffect, useMemo } from 'react';
import {
  GitMerge,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  ExternalLink,
  RefreshCw,
  Download,
  Copy,
  Check,
  Search,
  Globe,
  Sliders,
  ShieldCheck,
  TrendingUp,
  Award,
  Layers,
  ArrowRight,
  Info,
  Sparkles,
  Link2,
  Code,
  FileText,
  RotateCcw,
  Zap,
} from 'lucide-react';
import {
  AuditReport,
  CannibalizationAuditData,
  CannibalizationCluster,
  SeverityLevel,
} from '../types';

interface KeywordCannibalizationViewProps {
  report: AuditReport;
}

export const KeywordCannibalizationView: React.FC<KeywordCannibalizationViewProps> = ({ report }) => {
  const [data, setData] = useState<CannibalizationAuditData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [maxPages, setMaxPages] = useState<number>(15);
  const [search, setSearch] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [strategyFilter, setStrategyFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [simulatedResolvedIds, setSimulatedResolvedIds] = useState<Set<string>>(new Set());
  const [activeSnippetTab, setActiveSnippetTab] = useState<Record<string, 'canonical' | 'redirect' | 'title'>>({});

  const fetchCannibalization = async (pagesCount = maxPages) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/cannibalization-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: report.targetUrl, maxPages: pagesCount }),
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson.error || `HTTP ${res.status}`);
      }
      const json: CannibalizationAuditData = await res.json();
      setData(json);
      setSimulatedResolvedIds(new Set());
    } catch (err: any) {
      console.error('Failed to run cannibalization audit:', err);
      setError(err.message || 'Unable to scan internal links and titles for keyword cannibalization.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (report?.targetUrl) {
      fetchCannibalization(maxPages);
    }
  }, [report.targetUrl]);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const toggleSimulateResolved = (clusterId: string) => {
    setSimulatedResolvedIds((prev) => {
      const next = new Set(prev);
      if (next.has(clusterId)) {
        next.delete(clusterId);
      } else {
        next.add(clusterId);
      }
      return next;
    });
  };

  const handleResetSimulation = () => {
    setSimulatedResolvedIds(new Set());
  };

  // Filtered clusters
  const filteredClusters = useMemo(() => {
    if (!data?.clusters) return [];
    return data.clusters.filter((c) => {
      // Search
      const q = search.toLowerCase().trim();
      const matchesSearch =
        !q ||
        c.focusKeyword.toLowerCase().includes(q) ||
        c.conflictingPages.some((p) => p.url.toLowerCase().includes(q) || p.title.toLowerCase().includes(q)) ||
        c.conflictingAnchorTexts.some((a) => a.anchor.toLowerCase().includes(q));

      if (!matchesSearch) return false;

      // Severity
      if (severityFilter !== 'all' && c.severity !== severityFilter) {
        return false;
      }

      // Strategy
      if (strategyFilter !== 'all' && c.canonicalizationFix.strategy !== strategyFilter) {
        return false;
      }

      return true;
    });
  }, [data?.clusters, search, severityFilter, strategyFilter]);

  // Recalculated dynamic metrics based on simulation
  const dynamicMetrics = useMemo(() => {
    if (!data) {
      return {
        riskScore: 0,
        hygieneScore: 0,
        unresolvedCount: 0,
        resolvedCount: 0,
        equityGain: 0,
      };
    }

    const total = data.clusters.length;
    const resolved = simulatedResolvedIds.size;
    const unresolved = Math.max(0, total - resolved);

    // Compute simulated risk score: drops as items are resolved
    const fractionResolved = total > 0 ? resolved / total : 0;
    const simulatedRisk = Math.max(0, Math.round(data.cannibalizationRiskScore * (1 - fractionResolved * 0.9)));
    const simulatedHygiene = Math.min(100, Math.round(data.canonicalHygieneScore + fractionResolved * (100 - data.canonicalHygieneScore)));
    const simulatedEquity = Math.round(data.potentialEquityReclaimPercent * (fractionResolved || 1));

    return {
      riskScore: simulatedRisk,
      hygieneScore: simulatedHygiene,
      unresolvedCount: unresolved,
      resolvedCount: resolved,
      equityGain: simulatedEquity,
    };
  }, [data, simulatedResolvedIds]);

  const handleExportCSV = () => {
    if (!data?.clusters) return;
    const headers = [
      'Focus Keyword',
      'Severity',
      'Risk Score',
      'Similarity %',
      'Conflict Type',
      'Master Recommended URL',
      'Master Title',
      'Competing URL',
      'Competing Title',
      'Recommended Strategy',
      'Canonical Tag Snippet',
    ];

    const rows = data.clusters.map((c) => {
      const master = c.conflictingPages.find((p) => p.isMasterCandidate) || c.conflictingPages[0];
      const secondary = c.conflictingPages.find((p) => !p.isMasterCandidate) || c.conflictingPages[1] || master;
      return [
        `"${c.focusKeyword.replace(/"/g, '""')}"`,
        c.severity,
        c.riskScore,
        `${c.similarityScore}%`,
        c.conflictType,
        `"${master.url.replace(/"/g, '""')}"`,
        `"${master.title.replace(/"/g, '""')}"`,
        `"${secondary.url.replace(/"/g, '""')}"`,
        `"${secondary.title.replace(/"/g, '""')}"`,
        `"${c.canonicalizationFix.title.replace(/"/g, '""')}"`,
        `"${c.canonicalizationFix.recommendedCanonicalTag.replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cannibalization-audit-${new URL(report.targetUrl).hostname}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleExportJSON = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cannibalization-audit-${new URL(report.targetUrl).hostname}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 font-mono text-[#141414]">
      {/* Header Banner */}
      <div className="border-2 border-[#141414] bg-white p-5 sm:p-6 shadow-[4px_4px_0px_#141414]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 bg-amber-400 px-2.5 py-1 text-xs font-black uppercase text-[#141414] border border-[#141414]">
                <GitMerge className="h-3.5 w-3.5" />
                SEO INTERNAL AUDIT
              </span>
              <span className="bg-[#141414] px-2.5 py-1 text-xs font-bold text-white uppercase">
                KEYWORD CANNIBALIZATION & CANONICAL SIGNALS
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#141414]">
              Keyword Cannibalization & Canonicalization Engine
            </h2>
            <p className="text-xs sm:text-sm text-neutral-600 font-sans max-w-3xl">
              Cross-references internal anchor texts, page titles, and canonical tags across internal pages.
              Detects competing pages dividing search engine ranking power and prescribes actionable canonicalization,
              301 redirects, or semantic differentiation.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Max Pages selector */}
            <div className="flex items-center border border-[#141414] bg-[#E4E3E0] px-2 py-1 text-xs font-bold">
              <span className="mr-1.5 text-neutral-600">PAGES:</span>
              <select
                value={maxPages}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setMaxPages(val);
                  fetchCannibalization(val);
                }}
                disabled={isLoading}
                aria-label="Audit page depth selector"
                className="bg-transparent font-black cursor-pointer focus:outline-none"
              >
                <option value={10}>10 Pages</option>
                <option value={15}>15 Pages</option>
                <option value={25}>25 Pages</option>
              </select>
            </div>

            <button
              type="button"
              onClick={() => fetchCannibalization(maxPages)}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase border-2 border-[#141414] bg-emerald-400 hover:bg-emerald-300 text-[#141414] shadow-[2px_2px_0px_#141414] transition-all cursor-pointer active:translate-x-0.5 active:translate-y-0.5 disabled:opacity-50"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>{isLoading ? 'Scanning...' : 'Re-Scan Site'}</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={!data || isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase border border-[#141414] bg-white hover:bg-neutral-100 text-[#141414] transition-all cursor-pointer disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" />
              <span>CSV</span>
            </button>

            <button
              type="button"
              onClick={handleExportJSON}
              disabled={!data || isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase border border-[#141414] bg-white hover:bg-neutral-100 text-[#141414] transition-all cursor-pointer disabled:opacity-50"
            >
              <Code className="h-3.5 w-3.5" />
              <span>JSON</span>
            </button>
          </div>
        </div>

        {/* Target Site info strip */}
        <div className="mt-4 pt-3 border-t border-neutral-200 flex flex-wrap items-center justify-between text-xs text-neutral-600 gap-2 font-mono">
          <div className="flex items-center gap-2">
            <Globe className="h-3.5 w-3.5 text-blue-600" />
            <span className="font-bold text-[#141414]">{report.targetUrl}</span>
          </div>
          {data && (
            <div className="flex items-center gap-4">
              <span>Scanned Pages: <strong className="text-[#141414]">{data.pagesScannedCount}</strong></span>
              <span>Internal Links: <strong className="text-[#141414]">{data.internalLinksScannedCount}</strong></span>
              <span>Last Checked: {new Date(data.analyzedAt).toLocaleTimeString()}</span>
            </div>
          )}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="border-2 border-[#141414] bg-rose-100 p-4 text-rose-900 shadow-[3px_3px_0px_#141414]">
          <div className="flex items-center gap-2 font-bold text-sm">
            <AlertTriangle className="h-4 w-4 text-rose-700" />
            <span>Audit Alert: {error}</span>
          </div>
          <p className="text-xs mt-1 text-rose-800">
            Retrying using standard internal links extracted from the homepage.
          </p>
        </div>
      )}

      {/* Loading state */}
      {isLoading && !data && (
        <div className="border-2 border-[#141414] bg-white p-12 text-center shadow-[4px_4px_0px_#141414] space-y-4">
          <RefreshCw className="h-8 w-8 mx-auto animate-spin text-blue-600" />
          <div className="space-y-1">
            <h3 className="font-black text-lg uppercase tracking-tight">Scanning Internal Links & Titles...</h3>
            <p className="text-xs text-neutral-600 font-sans max-w-md mx-auto">
              Traversing internal link hierarchy, extracting page titles, heading tags, and canonical directives to identify competing URL clusters.
            </p>
          </div>
        </div>
      )}

      {/* Data Loaded View */}
      {data && (
        <>
          {/* KPI Dashboard Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Cannibalization Risk */}
            <div className="border-2 border-[#141414] bg-white p-4 shadow-[3px_3px_0px_#141414] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-neutral-500">Cannibalization Risk</span>
                <span
                  className={`px-2 py-0.5 text-[10px] font-black uppercase border border-[#141414] ${
                    dynamicMetrics.riskScore >= 70
                      ? 'bg-rose-500 text-white'
                      : dynamicMetrics.riskScore >= 35
                      ? 'bg-amber-400 text-[#141414]'
                      : 'bg-emerald-400 text-[#141414]'
                  }`}
                >
                  {dynamicMetrics.riskScore >= 70 ? 'High Risk' : dynamicMetrics.riskScore >= 35 ? 'Moderate' : 'Healthy'}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#141414]">{dynamicMetrics.riskScore}</span>
                <span className="text-xs text-neutral-500">/ 100</span>
              </div>
              <div className="w-full bg-neutral-200 h-2 border border-[#141414] overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    dynamicMetrics.riskScore >= 70
                      ? 'bg-rose-500'
                      : dynamicMetrics.riskScore >= 35
                      ? 'bg-amber-400'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(5, dynamicMetrics.riskScore))}%` }}
                />
              </div>
              <p className="text-[11px] text-neutral-600 font-sans">
                {dynamicMetrics.unresolvedCount} competing clusters currently dividing ranking power.
              </p>
            </div>

            {/* 2. Canonical Hygiene */}
            <div className="border-2 border-[#141414] bg-white p-4 shadow-[3px_3px_0px_#141414] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-neutral-500">Canonical Hygiene</span>
                <ShieldCheck className="h-4 w-4 text-blue-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#141414]">{dynamicMetrics.hygieneScore}%</span>
                <span className="text-xs text-neutral-500">Coverage</span>
              </div>
              <div className="w-full bg-neutral-200 h-2 border border-[#141414] overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(5, dynamicMetrics.hygieneScore))}%` }}
                />
              </div>
              <p className="text-[11px] text-neutral-600 font-sans">
                Pages declaring explicit rel="canonical" tags to prevent index pollution.
              </p>
            </div>

            {/* 3. Competing Clusters */}
            <div className="border-2 border-[#141414] bg-white p-4 shadow-[3px_3px_0px_#141414] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-neutral-500">Conflict Clusters</span>
                <GitMerge className="h-4 w-4 text-purple-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-[#141414]">{data.totalClustersDetected}</span>
                <span className="text-xs text-neutral-500">Topics</span>
              </div>
              <div className="flex items-center gap-2 text-[11px]">
                <span className="bg-rose-100 text-rose-900 border border-rose-900 px-1.5 py-0.2 font-bold">
                  {data.highRiskCount} Critical
                </span>
                <span className="bg-amber-100 text-amber-900 border border-amber-900 px-1.5 py-0.2 font-bold">
                  {data.moderateRiskCount} Warning
                </span>
              </div>
              <p className="text-[11px] text-neutral-600 font-sans">
                Shared title n-grams and colliding internal link anchor texts.
              </p>
            </div>

            {/* 4. Equity Recovery Potential */}
            <div className="border-2 border-[#141414] bg-white p-4 shadow-[3px_3px_0px_#141414] space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase text-neutral-500">Authority Reclaim</span>
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-700">+{data.potentialEquityReclaimPercent}%</span>
                <span className="text-xs text-neutral-500">Projected</span>
              </div>
              <div className="w-full bg-neutral-200 h-2 border border-[#141414] overflow-hidden">
                <div
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(15, data.potentialEquityReclaimPercent * 2))}%` }}
                />
              </div>
              <p className="text-[11px] text-neutral-600 font-sans">
                Estimated link juice boost upon consolidating secondary internal pages.
              </p>
            </div>
          </div>

          {/* Interactive Simulator Notice Bar */}
          <div className="border-2 border-[#141414] bg-[#F7F6F3] p-4 shadow-[3px_3px_0px_#141414] flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-[#141414] text-white">
                <Zap className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <span className="font-black text-xs uppercase text-[#141414]">
                  Interactive Canonicalization Simulator:
                </span>
                <span className="text-xs text-neutral-700 ml-1.5 font-sans">
                  Click <strong>"Simulate Fix"</strong> on any cluster below to project the immediate impact of consolidating canonical signals.
                </span>
              </div>
            </div>

            {simulatedResolvedIds.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="bg-emerald-100 text-emerald-900 border border-emerald-900 px-2 py-1 text-xs font-bold">
                  {simulatedResolvedIds.size} Resolved in Simulator
                </span>
                <button
                  type="button"
                  onClick={handleResetSimulation}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-bold uppercase bg-white border border-[#141414] hover:bg-neutral-100 cursor-pointer"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Reset</span>
                </button>
              </div>
            )}
          </div>

          {/* Filters & Search Toolbar */}
          <div className="border-2 border-[#141414] bg-white p-3.5 shadow-[3px_3px_0px_#141414] flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-neutral-400" />
                <input
                  type="text"
                  placeholder="Filter keywords, URLs, anchors..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-3 py-1 text-xs border border-[#141414] bg-neutral-50 focus:bg-white focus:outline-none w-56 sm:w-64 font-mono"
                />
              </div>

              {/* Severity filter buttons */}
              <div className="flex items-center gap-1">
                {(['all', 'critical', 'warning', 'info'] as const).map((sev) => (
                  <button
                    key={sev}
                    type="button"
                    onClick={() => setSeverityFilter(sev)}
                    className={`px-2.5 py-1 text-xs font-black uppercase transition-all cursor-pointer border border-[#141414] ${
                      severityFilter === sev
                        ? 'bg-[#141414] text-white'
                        : 'bg-white hover:bg-neutral-100 text-[#141414]'
                    }`}
                  >
                    {sev}
                  </button>
                ))}
              </div>

              {/* Strategy filter */}
              <div className="flex items-center border border-[#141414] bg-white px-2 py-1 text-xs">
                <span className="text-neutral-500 mr-1.5 uppercase font-bold text-[10px]">Fix:</span>
                <select
                  value={strategyFilter}
                  onChange={(e) => setStrategyFilter(e.target.value)}
                  className="bg-transparent font-bold cursor-pointer focus:outline-none text-xs"
                >
                  <option value="all">All Strategies</option>
                  <option value="canonical_tag_consolidation">Canonical Tag</option>
                  <option value="301_permanent_redirect">301 Redirect</option>
                  <option value="de_optimize_and_differentiate">Differentiate Title</option>
                </select>
              </div>
            </div>

            <span className="text-xs text-neutral-500 font-bold self-end md:self-auto">
              Showing {filteredClusters.length} of {data.clusters.length} clusters
            </span>
          </div>

          {/* Cannibalization Clusters Listing */}
          {filteredClusters.length === 0 ? (
            <div className="border-2 border-[#141414] bg-white p-8 text-center shadow-[3px_3px_0px_#141414] space-y-2">
              <CheckCircle2 className="h-8 w-8 mx-auto text-emerald-600" />
              <h3 className="font-black text-base uppercase">No Conflicting Clusters Found</h3>
              <p className="text-xs text-neutral-600 font-sans max-w-sm mx-auto">
                No keyword cannibalization or conflicting internal anchor texts match the active search and severity filters.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {filteredClusters.map((cluster) => {
                const isResolved = simulatedResolvedIds.has(cluster.id);
                const master = cluster.conflictingPages.find((p) => p.isMasterCandidate) || cluster.conflictingPages[0];
                const secondaryPages = cluster.conflictingPages.filter((p) => !p.isMasterCandidate);
                const currentTab = activeSnippetTab[cluster.id] || 'canonical';

                return (
                  <div
                    key={cluster.id}
                    className={`border-2 border-[#141414] bg-white shadow-[4px_4px_0px_#141414] transition-all ${
                      isResolved ? 'opacity-70 bg-neutral-50' : ''
                    }`}
                  >
                    {/* Cluster Header */}
                    <div className="p-4 sm:p-5 border-b-2 border-[#141414] bg-[#F7F6F3] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="bg-amber-300 border border-[#141414] px-2.5 py-0.5 text-xs font-black uppercase text-[#141414]">
                            FOCUS: {cluster.focusKeyword}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[11px] font-black uppercase border border-[#141414] ${
                              cluster.severity === 'critical'
                                ? 'bg-rose-600 text-white'
                                : cluster.severity === 'warning'
                                ? 'bg-amber-500 text-white'
                                : 'bg-blue-600 text-white'
                            }`}
                          >
                            {cluster.severity} ({cluster.riskScore}/100 Risk)
                          </span>
                          <span className="bg-white border border-[#141414] px-2 py-0.5 text-[11px] font-bold text-neutral-700">
                            {cluster.similarityScore}% Title/Topic Overlap
                          </span>
                          <span className="bg-purple-100 text-purple-900 border border-purple-900 px-2 py-0.5 text-[11px] font-bold uppercase">
                            {cluster.conflictType.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="text-xs text-neutral-600 font-sans">
                          {cluster.impactAnalysis}
                        </p>
                      </div>

                      {/* Simulate Resolution Button */}
                      <button
                        type="button"
                        onClick={() => toggleSimulateResolved(cluster.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase border-2 border-[#141414] shadow-[2px_2px_0px_#141414] transition-all cursor-pointer whitespace-nowrap active:translate-x-0.5 active:translate-y-0.5 ${
                          isResolved
                            ? 'bg-neutral-200 text-neutral-700 hover:bg-neutral-300'
                            : 'bg-emerald-400 hover:bg-emerald-300 text-[#141414]'
                        }`}
                      >
                        {isResolved ? (
                          <>
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span>Undo Simulation</span>
                          </>
                        ) : (
                          <>
                            <Zap className="h-3.5 w-3.5 text-amber-900" />
                            <span>Simulate Fix (+{cluster.canonicalizationFix.equityGainProjected})</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Conflicting Pages Side-by-Side Comparison */}
                    <div className="p-4 sm:p-5 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* 1. Recommended Master Page */}
                        <div className="border-2 border-emerald-600 bg-emerald-50/50 p-4 relative space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1.5 bg-emerald-600 text-white text-[10px] font-black px-2 py-0.5 uppercase">
                              <Award className="h-3 w-3" />
                              RECOMMENDED MASTER CANONICAL
                            </span>
                            <span className="text-[11px] font-bold text-emerald-800">
                              {master.inboundInternalLinksCount} Internal Inbound Links
                            </span>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold uppercase text-neutral-500">Page Title:</span>
                            <h4 className="font-black text-sm text-[#141414] break-words">
                              {master.title || '(No Title Set)'}
                            </h4>
                          </div>

                          <div>
                            <span className="text-[10px] font-bold uppercase text-neutral-500">Canonical URL Target:</span>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-blue-700 break-all">
                              <a
                                href={master.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:underline flex items-center gap-1"
                              >
                                {master.url}
                                <ExternalLink className="h-3 w-3 inline shrink-0" />
                              </a>
                            </div>
                          </div>

                          <div className="text-[11px] font-sans text-neutral-700 bg-white/70 p-2 border border-emerald-200">
                            <strong>Why this page is master:</strong> {master.masterReason || 'Higher authority signal and link equity retention.'}
                          </div>

                          <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                            <span className="font-bold text-neutral-600">Current Canonical:</span>
                            {master.hasCanonicalTag ? (
                              <span className="bg-emerald-200 text-emerald-900 px-1.5 py-0.5 text-[10px] font-mono border border-emerald-800">
                                Declared ({master.isSelfCanonical ? 'Self' : 'Cross'})
                              </span>
                            ) : (
                              <span className="bg-amber-200 text-amber-900 px-1.5 py-0.5 text-[10px] font-mono border border-amber-800">
                                Missing Tag
                              </span>
                            )}
                          </div>
                        </div>

                        {/* 2. Cannibalizing Secondary Page(s) */}
                        {secondaryPages.map((sec, secIdx) => (
                          <div key={secIdx} className="border-2 border-rose-500 bg-rose-50/40 p-4 space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="flex items-center gap-1.5 bg-rose-600 text-white text-[10px] font-black px-2 py-0.5 uppercase">
                                <AlertTriangle className="h-3 w-3" />
                                COMPETING SECONDARY PAGE #{secIdx + 1}
                              </span>
                              <span className="text-[11px] font-bold text-rose-800">
                                {sec.inboundInternalLinksCount} Internal Inbound Links
                              </span>
                            </div>

                            <div>
                              <span className="text-[10px] font-bold uppercase text-neutral-500">Competing Title:</span>
                              <h4 className="font-bold text-sm text-[#141414] break-words">
                                {sec.title || '(No Title Set)'}
                              </h4>
                            </div>

                            <div>
                              <span className="text-[10px] font-bold uppercase text-neutral-500">Conflicting URL:</span>
                              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-800 break-all">
                                <a
                                  href={sec.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="hover:underline flex items-center gap-1"
                                >
                                  {sec.url}
                                  <ExternalLink className="h-3 w-3 inline shrink-0" />
                                </a>
                              </div>
                            </div>

                            <div className="text-[11px] font-sans text-neutral-700 bg-white/70 p-2 border border-rose-200">
                              <strong>Primary SEO Hazard:</strong> Splits user click-throughs and confuses search ranking algorithms on search query <em>"{cluster.focusKeyword}"</em>.
                            </div>

                            <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                              <span className="font-bold text-neutral-600">Current Canonical:</span>
                              {sec.hasCanonicalTag ? (
                                <span className="bg-amber-200 text-amber-900 px-1.5 py-0.5 text-[10px] font-mono border border-amber-800">
                                  {sec.isSelfCanonical ? 'Self-Canonicalizing (Worsens Cannibalization)' : 'Cross-page'}
                                </span>
                              ) : (
                                <span className="bg-rose-200 text-rose-900 px-1.5 py-0.5 text-[10px] font-mono border border-rose-800">
                                  Missing Canonical Tag
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Internal Anchor Text Collision Details */}
                      {cluster.conflictingAnchorTexts.length > 0 && (
                        <div className="border border-[#141414] bg-neutral-50 p-3 space-y-1.5">
                          <div className="flex items-center gap-1.5 text-xs font-bold uppercase text-neutral-700">
                            <Link2 className="h-3.5 w-3.5 text-purple-600" />
                            <span>Conflicting Internal Link Anchor Texts Detected:</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {cluster.conflictingAnchorTexts.map((anchor, aIdx) => (
                              <span
                                key={aIdx}
                                className="bg-white border border-[#141414] px-2 py-0.5 text-xs text-[#141414] font-mono flex items-center gap-1"
                              >
                                <span className="font-black text-purple-700">"{anchor.anchor}"</span>
                                <span className="text-[10px] text-neutral-500">({anchor.occurrences} cross-links)</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Prescribed Canonicalization Improvements Section */}
                      <div className="border-2 border-[#141414] bg-amber-50/60 p-4 space-y-3">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-200 pb-2">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-amber-600" />
                            <h4 className="font-black text-sm uppercase text-[#141414]">
                              Prescribed Fix: {cluster.canonicalizationFix.title}
                            </h4>
                          </div>
                          <span className="bg-emerald-600 text-white px-2 py-0.5 text-xs font-black uppercase">
                            {cluster.canonicalizationFix.equityGainProjected}
                          </span>
                        </div>

                        <p className="text-xs text-neutral-800 font-sans leading-relaxed">
                          {cluster.canonicalizationFix.explanation}
                        </p>

                        {/* Code Snippets and Fix Implementation tabs */}
                        <div className="space-y-2">
                          <div className="flex items-center gap-1 border-b border-neutral-300">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveSnippetTab((prev) => ({ ...prev, [cluster.id]: 'canonical' }))
                              }
                              className={`px-3 py-1 text-xs font-bold uppercase cursor-pointer border-t border-x border-[#141414] ${
                                currentTab === 'canonical'
                                  ? 'bg-[#141414] text-white'
                                  : 'bg-white text-neutral-700 hover:bg-neutral-100'
                              }`}
                            >
                              Canonical Tag Snippet
                            </button>

                            {cluster.canonicalizationFix.redirectRuleSnippet && (
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveSnippetTab((prev) => ({ ...prev, [cluster.id]: 'redirect' }))
                                }
                                className={`px-3 py-1 text-xs font-bold uppercase cursor-pointer border-t border-x border-[#141414] ${
                                  currentTab === 'redirect'
                                    ? 'bg-[#141414] text-white'
                                    : 'bg-white text-neutral-700 hover:bg-neutral-100'
                                }`}
                              >
                                301 Redirect Rules
                              </button>
                            )}

                            {cluster.canonicalizationFix.suggestedDifferentiatedTitle && (
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveSnippetTab((prev) => ({ ...prev, [cluster.id]: 'title' }))
                                }
                                className={`px-3 py-1 text-xs font-bold uppercase cursor-pointer border-t border-x border-[#141414] ${
                                  currentTab === 'title'
                                    ? 'bg-[#141414] text-white'
                                    : 'bg-white text-neutral-700 hover:bg-neutral-100'
                                }`}
                              >
                                New Title Suggestion
                              </button>
                            )}
                          </div>

                          {/* Code View */}
                          {currentTab === 'canonical' && (
                            <div className="relative border border-[#141414] bg-[#141414] text-neutral-100 p-3 font-mono text-xs">
                              <pre className="overflow-x-auto whitespace-pre-wrap">
                                {`<!-- Add inside <head> of secondary page (${secondaryPages[0]?.url || 'secondary'}) -->\n${cluster.canonicalizationFix.recommendedCanonicalTag}`}
                              </pre>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopy(cluster.canonicalizationFix.recommendedCanonicalTag, `canon-${cluster.id}`)
                                }
                                className="absolute top-2 right-2 flex items-center gap-1 bg-white text-[#141414] px-2 py-1 text-[11px] font-bold border border-[#141414] hover:bg-neutral-200 cursor-pointer"
                              >
                                {copiedId === `canon-${cluster.id}` ? (
                                  <>
                                    <Check className="h-3 w-3 text-emerald-600" />
                                    <span>Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3" />
                                    <span>Copy Tag</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}

                          {currentTab === 'redirect' && cluster.canonicalizationFix.redirectRuleSnippet && (
                            <div className="relative border border-[#141414] bg-[#141414] text-neutral-100 p-3 font-mono text-xs">
                              <pre className="overflow-x-auto whitespace-pre-wrap">
                                {cluster.canonicalizationFix.redirectRuleSnippet}
                              </pre>
                              <button
                                type="button"
                                onClick={() =>
                                  handleCopy(cluster.canonicalizationFix.redirectRuleSnippet!, `redir-${cluster.id}`)
                                }
                                className="absolute top-2 right-2 flex items-center gap-1 bg-white text-[#141414] px-2 py-1 text-[11px] font-bold border border-[#141414] hover:bg-neutral-200 cursor-pointer"
                              >
                                {copiedId === `redir-${cluster.id}` ? (
                                  <>
                                    <Check className="h-3 w-3 text-emerald-600" />
                                    <span>Copied!</span>
                                  </>
                                ) : (
                                  <>
                                    <Copy className="h-3 w-3" />
                                    <span>Copy Rule</span>
                                  </>
                                )}
                              </button>
                            </div>
                          )}

                          {currentTab === 'title' && cluster.canonicalizationFix.suggestedDifferentiatedTitle && (
                            <div className="border border-[#141414] bg-white p-3 space-y-2">
                              <span className="text-[11px] font-bold uppercase text-neutral-500">
                                Suggested Differentiated Title for Secondary Page:
                              </span>
                              <div className="font-bold text-sm text-[#141414] bg-neutral-100 p-2 border border-neutral-300">
                                {cluster.canonicalizationFix.suggestedDifferentiatedTitle}
                              </div>
                              <p className="text-xs text-neutral-600 font-sans">
                                Modifying the title and H1 to target informational long-tail queries eliminates direct keyword collision while preserving page traffic.
                              </p>
                            </div>
                          )}
                        </div>

                        {/* Checklist steps */}
                        <div className="space-y-1.5 pt-1">
                          <span className="text-[10px] font-black uppercase text-neutral-600">
                            Resolution Action Steps:
                          </span>
                          <ul className="space-y-1 text-xs text-neutral-700 font-sans">
                            {cluster.canonicalizationFix.suggestedActionSteps.map((step, sIdx) => (
                              <li key={sIdx} className="flex items-start gap-2">
                                <ArrowRight className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                                <span>{step}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Canonicalization Best Practices & Guidelines */}
          <div className="border-2 border-[#141414] bg-white p-5 sm:p-6 shadow-[4px_4px_0px_#141414] space-y-4">
            <div className="flex items-center gap-2 border-b-2 border-[#141414] pb-3">
              <ShieldCheck className="h-5 w-5 text-blue-600" />
              <h3 className="font-black text-base uppercase text-[#141414]">
                Canonicalization Checklist & RFC 6596 SEO Architecture
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.bestPracticesChecklist.map((item, idx) => (
                <div
                  key={idx}
                  className="border border-[#141414] p-3 bg-neutral-50 flex items-start gap-3"
                >
                  {item.status === 'pass' ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : item.status === 'warning' ? (
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <div className="space-y-0.5">
                    <h5 className="font-black text-xs uppercase text-[#141414]">{item.rule}</h5>
                    <p className="text-xs text-neutral-600 font-sans">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Strategic Insights */}
            <div className="bg-amber-100/60 border border-amber-300 p-3.5 space-y-2">
              <span className="font-black text-xs uppercase text-amber-950 flex items-center gap-1.5">
                <Info className="h-4 w-4 text-amber-800" />
                Strategic SEO Insights & Takeaways:
              </span>
              <ul className="list-disc list-inside space-y-1 text-xs text-amber-900 font-sans">
                {data.summaryInsights.map((ins, iIdx) => (
                  <li key={iIdx}>{ins}</li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
