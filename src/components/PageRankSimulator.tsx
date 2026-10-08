import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Award,
  Link2,
  Share2,
  Globe,
  Sliders,
  Info,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  AuditReport,
  SitemapCrawlData,
  PageRankSimulationData,
  BacklinkAuditSummary,
  DiscoveredBacklinkItem,
} from '../types';

interface PageRankSimulatorProps {
  sitemapData?: SitemapCrawlData | null;
  targetUrl?: string;
  auditReport?: AuditReport;
  onRefreshCrawl?: () => void;
}

export const PageRankSimulator: React.FC<PageRankSimulatorProps> = ({
  sitemapData: initialSitemapData,
  targetUrl,
  auditReport,
  onRefreshCrawl,
}) => {
  const [internalCrawlData, setInternalCrawlData] = useState<SitemapCrawlData | null>(null);
  const [isLoadingCrawl, setIsLoadingCrawl] = useState<boolean>(false);
  const [crawlError, setCrawlError] = useState<string | null>(null);

  const effectiveUrl = targetUrl || auditReport?.targetUrl || initialSitemapData?.targetUrl || '';

  // If initialSitemapData is provided, use it; otherwise allow automatic loading or button click
  const sitemapData = initialSitemapData || internalCrawlData;

  const handleFetchCrawl = async () => {
    if (!effectiveUrl) return;
    setIsLoadingCrawl(true);
    setCrawlError(null);
    try {
      const res = await fetch('/api/crawl-sitemap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: effectiveUrl, maxPages: 12 }),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data: SitemapCrawlData = await res.json();
      setInternalCrawlData(data);
    } catch (err: any) {
      setCrawlError(err.message || 'Failed to crawl sitemap');
    } finally {
      setIsLoadingCrawl(false);
    }
  };

  // Auto-fetch if not provided and effectiveUrl exists
  useEffect(() => {
    if (!initialSitemapData && effectiveUrl && !internalCrawlData && !isLoadingCrawl) {
      handleFetchCrawl();
    }
  }, [effectiveUrl, initialSitemapData]);

  const simulation = sitemapData?.pageRankSimulation;
  const backlinkAudit = sitemapData?.backlinkAudit;

  // Interactive simulation overrides for what-if scenarios
  const [customBacklinksCount, setCustomBacklinksCount] = useState<number>(
    backlinkAudit?.totalLinksDiscovered || 28
  );
  const [customDoFollowPct, setCustomDoFollowPct] = useState<number>(
    backlinkAudit?.doFollowRatio || 85
  );
  const [customOrphanFixed, setCustomOrphanFixed] = useState<boolean>(true);
  const [customHasSitemap, setCustomHasSitemap] = useState<boolean>(
    sitemapData?.sitemapFound ?? true
  );
  const [activeSubTab, setActiveSubTab] = useState<
    'overview' | 'equity' | 'backlinks' | 'simulator'
  >('overview');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showFormulaDetails, setShowFormulaDetails] = useState<boolean>(false);

  // Sync custom controls when backlinkAudit loads
  useEffect(() => {
    if (backlinkAudit) {
      setCustomBacklinksCount(backlinkAudit.totalLinksDiscovered || 28);
      setCustomDoFollowPct(backlinkAudit.doFollowRatio || 85);
      if (sitemapData) setCustomHasSitemap(sitemapData.sitemapFound);
    }
  }, [backlinkAudit, sitemapData]);

  // Dynamic what-if calculations
  const calculateSimulatedDA = () => {
    if (!simulation) return 50;
    const baseHealth = sitemapData.healthScore || 85;
    const sitemapBonus = customHasSitemap ? 15 : 0;
    const densityBonus = Math.min(
      35,
      Math.round((customBacklinksCount / Math.max(1, sitemapData.pages.length)) * 3)
    );
    const doFollowBonus = (customDoFollowPct / 100) * 25;
    const orphanPenalty = customOrphanFixed ? 0 : 15;
    const healthFactor = (baseHealth / 100) * 25;

    const da = Math.round(
      sitemapBonus + densityBonus + doFollowBonus + healthFactor - orphanPenalty
    );
    return Math.min(99, Math.max(10, da));
  };

  const simulatedDA = calculateSimulatedDA();
  const simulatedPR = Math.round(((simulatedDA / 10) * 0.75 + 1.5) * 10) / 10;

  if (isLoadingCrawl) {
    return (
      <div className="border-2 border-[#141414] bg-white p-8 shadow-[3px_3px_0px_#141414] text-center font-mono">
        <div className="inline-block animate-spin text-2xl mb-2">⟳</div>
        <h4 className="font-black uppercase text-sm">Crawling Site &amp; Building PageRank Graph...</h4>
        <p className="text-xs text-[#141414]/70 mt-1">Analyzing sitemap and internal cross-link edges to estimate Domain Authority.</p>
      </div>
    );
  }

  if (!simulation || !backlinkAudit) {
    return (
      <div className="border-2 border-[#141414] bg-white p-6 shadow-[3px_3px_0px_#141414]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-800">
            <AlertTriangle className="h-5 w-5" />
            <h3 className="font-mono font-black uppercase text-sm">
              PageRank Simulation Ready
            </h3>
          </div>
          {effectiveUrl && (
            <button
              onClick={handleFetchCrawl}
              className="px-3 py-1 bg-[#141414] text-white text-xs font-mono font-black uppercase hover:bg-black cursor-pointer shadow-[2px_2px_0px_#888888]"
            >
              Run Crawl &amp; Calculate PageRank
            </button>
          )}
        </div>
        <p className="font-mono text-xs text-[#141414]/70 mt-2">
          {crawlError ? `Crawl note: ${crawlError}. Click the button above to retry.` : 'Click button above or run the sitemap crawl to construct the link graph and simulate PageRank.'}
        </p>
      </div>
    );
  }

  const filteredEquity = simulation.linkEquityDistribution.filter((item) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      item.pageUrl.toLowerCase().includes(q) ||
      (item.pageTitle || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="border-2 border-[#141414] bg-white shadow-[4px_4px_0px_#141414] overflow-hidden">
      {/* Top Banner Header */}
      <div className="bg-[#141414] text-white p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 border-b-2 border-[#141414]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center bg-amber-400 text-[#141414] border-2 border-white shadow-[2px_2px_0px_#ffffff]">
            <TrendingUp className="h-5 w-5 font-black" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black font-mono text-sm uppercase tracking-wider text-white">
                Google PageRank™ & Domain Authority Simulator
              </h3>
              <span className="bg-emerald-500 text-black text-[10px] font-mono font-black px-1.5 py-0.5 uppercase">
                Active Graph
              </span>
            </div>
            <p className="text-[11px] font-mono text-[#E4E3E0]/70">
              Deterministic PageRank simulation with damping factor d=0.85 &amp; backlink audit graph analysis
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFormulaDetails(!showFormulaDetails)}
            className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase bg-white/10 hover:bg-white/20 text-white px-2.5 py-1 border border-white/30 transition-all cursor-pointer"
          >
            <Info className="h-3.5 w-3.5 text-amber-300" />
            <span>Algorithm Specs</span>
            {showFormulaDetails ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Formula & Scientific Logic Panel */}
      {showFormulaDetails && (
        <div className="bg-[#E4E3E0]/60 p-4 border-b-2 border-[#141414] font-mono text-xs text-[#141414] space-y-2">
          <div className="flex items-center gap-2 font-black uppercase text-[11px] text-[#141414]">
            <Sparkles className="h-3.5 w-3.5 text-amber-700" />
            <span>PageRank &amp; Domain Authority Mathematical Foundation</span>
          </div>
          <p className="text-[11px] leading-relaxed text-[#141414]/80">
            <strong>PageRank Formula:</strong> <code className="bg-white px-1.5 py-0.5 border border-[#141414]/30">PR(A) = (1 - d)/N + d × Σ (PR(Ti) / C(Ti))</code>, where <code className="bg-white px-1 border border-[#141414]/30">d = 0.85</code> is the random surfer damping factor, <code className="bg-white px-1 border border-[#141414]/30">N</code> is total crawled nodes, and <code className="bg-white px-1 border border-[#141414]/30">C(Ti)</code> is out-degree link count.
          </p>
          <p className="text-[11px] leading-relaxed text-[#141414]/80">
            <strong>Estimated Domain Authority (DA 0-100):</strong> Synthesizes link equity distribution (25%), interlink density (25%), DoFollow trust ratio (20%), architectural crawl depth (15%), and technical site crawl penalties (15%).
          </p>
        </div>
      )}

      {/* Main KPI Badges Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x-2 divide-[#141414] border-b-2 border-[#141414] bg-white">
        {/* Estimated DA */}
        <div className="p-4 bg-amber-50/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase text-[#141414]/70">
              Estimated Domain Authority
            </span>
            <Award className="h-4 w-4 text-amber-700" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black font-mono text-[#141414]">
              {simulation.calculatedDomainAuthority}
            </span>
            <span className="text-xs font-mono text-[#141414]/60">/100</span>
          </div>
          <div className="mt-1 flex items-center gap-1.5">
            <span className="inline-block px-1.5 py-0.2 bg-amber-200 border border-[#141414] text-[9px] font-mono font-black uppercase text-[#141414]">
              {simulation.rankTier}
            </span>
          </div>
        </div>

        {/* Estimated PageRank (Logarithmic 0-10) */}
        <div className="p-4 bg-emerald-50/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase text-[#141414]/70">
              Estimated PageRank (PR)
            </span>
            <TrendingUp className="h-4 w-4 text-emerald-700" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black font-mono text-emerald-800">
              {simulation.estimatedPageRank.toFixed(1)}
            </span>
            <span className="text-xs font-mono text-[#141414]/60">/10.0 (Log scale)</span>
          </div>
          <p className="text-[10px] font-mono text-emerald-900/80 mt-1">
            d={simulation.dampingFactor} • {simulation.iterations} convergence rounds
          </p>
        </div>

        {/* Interlink Density & Backlinks */}
        <div className="p-4 bg-sky-50/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase text-[#141414]/70">
              Discovered Interlinks
            </span>
            <Link2 className="h-4 w-4 text-sky-700" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black font-mono text-[#141414]">
              {backlinkAudit.totalLinksDiscovered}
            </span>
            <span className="text-xs font-mono text-[#141414]/60">
              ({backlinkAudit.internalCrossLinks} internal)
            </span>
          </div>
          <p className="text-[10px] font-mono text-[#141414]/70 mt-1">
            {backlinkAudit.uniqueLinkingNodes} linking clusters • {backlinkAudit.doFollowRatio}% DoFollow
          </p>
        </div>

        {/* Crawl Confidence */}
        <div className="p-4 bg-purple-50/50">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono font-bold uppercase text-[#141414]/70">
              Simulation Confidence
            </span>
            <ShieldCheck className="h-4 w-4 text-purple-700" />
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-black font-mono text-purple-900">
              {simulation.confidenceScore}%
            </span>
            <span className="text-xs font-mono text-emerald-700 font-bold">High</span>
          </div>
          <p className="text-[10px] font-mono text-[#141414]/70 mt-1">
            Based on {sitemapData.totalPagesCrawled} audited page nodes
          </p>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[#E4E3E0]/40 border-b-2 border-[#141414]">
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            { id: 'overview', label: 'Authority Analysis & Scoring' },
            { id: 'equity', label: `PageRank Equity Flow (${simulation.linkEquityDistribution.length} pages)` },
            { id: 'backlinks', label: `Backlink Audit Graph (${backlinkAudit.backlinkItems.length})` },
            { id: 'simulator', label: 'Interactive "What-If" Predictor' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`px-3 py-1 text-xs font-mono font-black uppercase transition-all cursor-pointer border border-[#141414] ${
                activeSubTab === tab.id
                  ? 'bg-[#141414] text-white shadow-[2px_2px_0px_#888888]'
                  : 'bg-white text-[#141414] hover:bg-[#E4E3E0]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeSubTab === 'equity' && (
          <div className="w-full sm:w-auto">
            <input
              type="text"
              placeholder="Search page URL or title..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-60 px-2.5 py-1 text-xs font-mono border border-[#141414] bg-white focus:outline-none"
            />
          </div>
        )}
      </div>

      {/* Subtab 1: Authority Analysis */}
      {activeSubTab === 'overview' && (
        <div className="p-5 space-y-6">
          {/* Authority Pillar Breakdown */}
          <div>
            <h4 className="text-xs font-mono font-black uppercase text-[#141414] mb-3 flex items-center gap-2">
              <Layers className="h-4 w-4 text-[#141414]" />
              <span>Domain Authority Mathematical Scoring Breakdown (0-100)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              <div className="border border-[#141414] bg-white p-3">
                <div className="text-[10px] font-mono font-bold uppercase text-[#141414]/70">
                  Link Volume &amp; Density (25%)
                </div>
                <div className="text-xl font-mono font-black text-[#141414] mt-1">
                  {simulation.authorityBreakdown.linkQuantityScore} / 100
                </div>
                <div className="w-full bg-[#E4E3E0] h-1.5 mt-2 border border-[#141414]/20">
                  <div
                    className="bg-emerald-600 h-1.5"
                    style={{ width: `${simulation.authorityBreakdown.linkQuantityScore}%` }}
                  />
                </div>
              </div>

              <div className="border border-[#141414] bg-white p-3">
                <div className="text-[10px] font-mono font-bold uppercase text-[#141414]/70">
                  Equity Flow &amp; Interlinking (25%)
                </div>
                <div className="text-xl font-mono font-black text-[#141414] mt-1">
                  {simulation.authorityBreakdown.equityFlowScore} / 100
                </div>
                <div className="w-full bg-[#E4E3E0] h-1.5 mt-2 border border-[#141414]/20">
                  <div
                    className="bg-blue-600 h-1.5"
                    style={{ width: `${simulation.authorityBreakdown.equityFlowScore}%` }}
                  />
                </div>
              </div>

              <div className="border border-[#141414] bg-white p-3">
                <div className="text-[10px] font-mono font-bold uppercase text-[#141414]/70">
                  DoFollow Trust Quality (20%)
                </div>
                <div className="text-xl font-mono font-black text-[#141414] mt-1">
                  {simulation.authorityBreakdown.doFollowQualityScore} / 100
                </div>
                <div className="w-full bg-[#E4E3E0] h-1.5 mt-2 border border-[#141414]/20">
                  <div
                    className="bg-amber-600 h-1.5"
                    style={{ width: `${simulation.authorityBreakdown.doFollowQualityScore}%` }}
                  />
                </div>
              </div>

              <div className="border border-[#141414] bg-white p-3">
                <div className="text-[10px] font-mono font-bold uppercase text-[#141414]/70">
                  Architecture Depth (15%)
                </div>
                <div className="text-xl font-mono font-black text-[#141414] mt-1">
                  {simulation.authorityBreakdown.architectureDepthScore} / 100
                </div>
                <div className="w-full bg-[#E4E3E0] h-1.5 mt-2 border border-[#141414]/20">
                  <div
                    className="bg-purple-600 h-1.5"
                    style={{ width: `${simulation.authorityBreakdown.architectureDepthScore}%` }}
                  />
                </div>
              </div>

              <div className="border border-[#141414] bg-white p-3">
                <div className="text-[10px] font-mono font-bold uppercase text-red-800">
                  Technical Penalty Deductions
                </div>
                <div className="text-xl font-mono font-black text-red-700 mt-1">
                  -{simulation.authorityBreakdown.technicalHealthPenalty} pts
                </div>
                <div className="w-full bg-[#E4E3E0] h-1.5 mt-2 border border-[#141414]/20">
                  <div
                    className="bg-red-600 h-1.5"
                    style={{ width: `${Math.min(100, simulation.authorityBreakdown.technicalHealthPenalty * 2)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Key Insights & Strategic Action Points */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-[#141414] bg-[#E4E3E0]/30 p-4">
              <h5 className="font-mono font-black uppercase text-xs text-[#141414] mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-700" />
                <span>Crawler Graph Insights</span>
              </h5>
              <ul className="space-y-2 text-xs font-mono text-[#141414]/85">
                {simulation.insights.map((ins, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-emerald-700 font-bold shrink-0">►</span>
                    <span>{ins}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="border border-[#141414] bg-amber-50 p-4">
              <h5 className="font-mono font-black uppercase text-xs text-amber-950 mb-2 flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-700" />
                <span>PageRank Optimization Recommendations</span>
              </h5>
              <ul className="space-y-2 text-xs font-mono text-amber-950/85">
                {simulation.recommendations.map((rec, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-amber-700 font-bold shrink-0">⚡</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Anchor Text Distribution */}
          <div>
            <h5 className="text-xs font-mono font-black uppercase text-[#141414] mb-2">
              Top Anchor Text Distributions Detected During Crawl
            </h5>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {backlinkAudit.topAnchors.map((anc, idx) => (
                <div key={idx} className="border border-[#141414] bg-white p-2.5 font-mono">
                  <div className="truncate text-xs font-bold text-[#141414]" title={anc.anchor}>
                    &quot;{anc.anchor}&quot;
                  </div>
                  <div className="text-[10px] text-[#141414]/70 mt-1 flex justify-between">
                    <span>{anc.count} links</span>
                    <span className="font-bold">{anc.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Subtab 2: Link Equity Distribution Table */}
      {activeSubTab === 'equity' && (
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-[#141414]/70">
            <span>
              Showing {filteredEquity.length} discovered pages evaluated for PageRank link equity flow
            </span>
            <span className="text-[11px] font-bold">
              Scale: 0.0 - 10.0 (Logarithmic PageRank)
            </span>
          </div>

          <div className="overflow-x-auto border border-[#141414]">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-[#141414] text-[#E4E3E0] uppercase text-[11px]">
                  <th className="p-2.5 border-r border-[#333]">PageRank</th>
                  <th className="p-2.5 border-r border-[#333]">Page URL &amp; Title</th>
                  <th className="p-2.5 border-r border-[#333] text-center">Inbound</th>
                  <th className="p-2.5 border-r border-[#333] text-center">Outbound</th>
                  <th className="p-2.5 border-r border-[#333] text-center">Equity Share</th>
                  <th className="p-2.5 border-r border-[#333] text-center">Depth</th>
                  <th className="p-2.5 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141414]/20 bg-white">
                {filteredEquity.map((item, idx) => (
                  <tr key={idx} className="hover:bg-[#E4E3E0]/40 transition-colors">
                    <td className="p-2.5 border-r border-[#141414]/20 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`font-black text-sm px-2 py-0.5 border border-[#141414] ${
                            item.internalPageRank >= 6.5
                              ? 'bg-emerald-100 text-emerald-900'
                              : item.internalPageRank >= 4.0
                              ? 'bg-amber-100 text-amber-900'
                              : 'bg-rose-100 text-rose-900'
                          }`}
                        >
                          PR {item.internalPageRank.toFixed(1)}
                        </span>
                      </div>
                    </td>

                    <td className="p-2.5 border-r border-[#141414]/20 max-w-[280px]">
                      <div className="truncate font-bold text-[#141414]" title={item.pageUrl}>
                        {item.pageUrl}
                      </div>
                      {item.pageTitle && (
                        <div className="truncate text-[10px] text-[#141414]/60" title={item.pageTitle}>
                          {item.pageTitle}
                        </div>
                      )}
                    </td>

                    <td className="p-2.5 border-r border-[#141414]/20 text-center font-bold">
                      <span className={item.inboundLinkCount === 0 ? 'text-rose-600 font-black' : 'text-[#141414]'}>
                        {item.inboundLinkCount}
                      </span>
                    </td>

                    <td className="p-2.5 border-r border-[#141414]/20 text-center text-[#141414]/80">
                      {item.outboundLinkCount}
                    </td>

                    <td className="p-2.5 border-r border-[#141414]/20 text-center font-bold">
                      <div className="flex items-center justify-center gap-1">
                        <span>{item.rawEquityShare}%</span>
                      </div>
                    </td>

                    <td className="p-2.5 border-r border-[#141414]/20 text-center">
                      <span className="text-[11px] bg-[#E4E3E0] px-1.5 py-0.5 border border-[#141414]/40">
                        L{item.depthLevel}
                      </span>
                    </td>

                    <td className="p-2.5 text-center whitespace-nowrap">
                      {item.status === 'orphan_risk' ? (
                        <span className="bg-red-100 text-red-900 px-1.5 py-0.5 text-[10px] font-black border border-red-900 uppercase">
                          ⚠️ Orphan Risk
                        </span>
                      ) : item.status === 'high_authority' ? (
                        <span className="bg-emerald-100 text-emerald-900 px-1.5 py-0.5 text-[10px] font-black border border-emerald-900 uppercase">
                          ★ High Authority
                        </span>
                      ) : item.status === 'diluted' ? (
                        <span className="bg-amber-100 text-amber-900 px-1.5 py-0.5 text-[10px] font-black border border-amber-900 uppercase">
                          Diluted Equity
                        </span>
                      ) : (
                        <span className="bg-gray-100 text-gray-800 px-1.5 py-0.5 text-[10px] font-bold border border-gray-400 uppercase">
                          Balanced
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab 3: Discovered Backlink Items Graph */}
      {activeSubTab === 'backlinks' && (
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-[#141414]/70">
            <span>
              Sample of {backlinkAudit.backlinkItems.length} backlinks and internal cross-link edges detected by crawler
            </span>
            <span>
              DoFollow: <strong className="text-emerald-700">{backlinkAudit.doFollowRatio}%</strong>
            </span>
          </div>

          <div className="overflow-x-auto border border-[#141414]">
            <table className="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr className="bg-[#141414] text-[#E4E3E0] uppercase text-[11px]">
                  <th className="p-2.5 border-r border-[#333]">Source Page</th>
                  <th className="p-2.5 border-r border-[#333]">Target Destination</th>
                  <th className="p-2.5 border-r border-[#333]">Anchor Text</th>
                  <th className="p-2.5 border-r border-[#333] text-center">Type</th>
                  <th className="p-2.5 border-r border-[#333] text-center">Follow Status</th>
                  <th className="p-2.5 text-center">Equity Transfer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141414]/20 bg-white">
                {backlinkAudit.backlinkItems.map((bl) => (
                  <tr key={bl.id} className="hover:bg-[#E4E3E0]/30 transition-colors">
                    <td className="p-2.5 border-r border-[#141414]/20 max-w-[200px] truncate" title={bl.sourceUrl}>
                      <span className="text-[#141414] font-medium">{bl.sourceUrl}</span>
                    </td>

                    <td className="p-2.5 border-r border-[#141414]/20 max-w-[200px] truncate" title={bl.targetUrl}>
                      <span className="text-blue-700 font-bold">{bl.targetUrl}</span>
                    </td>

                    <td className="p-2.5 border-r border-[#141414]/20 max-w-[140px] truncate" title={bl.anchorText}>
                      &quot;{bl.anchorText}&quot;
                    </td>

                    <td className="p-2.5 border-r border-[#141414]/20 text-center whitespace-nowrap">
                      <span className="text-[10px] font-bold bg-[#E4E3E0] px-1.5 py-0.5 border border-[#141414]/30 uppercase">
                        {bl.linkType}
                      </span>
                    </td>

                    <td className="p-2.5 border-r border-[#141414]/20 text-center whitespace-nowrap">
                      {bl.isDoFollow ? (
                        <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 border border-emerald-800">
                          DoFollow (100%)
                        </span>
                      ) : (
                        <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 border border-amber-800">
                          NoFollow (Rel)
                        </span>
                      )}
                    </td>

                    <td className="p-2.5 text-center font-bold">
                      <span className={bl.equityScore >= 0.5 ? 'text-emerald-700' : 'text-amber-700'}>
                        {(bl.equityScore * 100).toFixed(0)}% juice
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Subtab 4: Interactive What-If Simulator */}
      {activeSubTab === 'simulator' && (
        <div className="p-5 space-y-6">
          <div className="bg-[#E4E3E0]/40 border border-[#141414] p-4 font-mono">
            <h4 className="text-xs font-black uppercase text-[#141414] flex items-center gap-2">
              <Sliders className="h-4 w-4 text-[#141414]" />
              <span>Interactive PageRank &amp; Domain Authority What-If Scenarios</span>
            </h4>
            <p className="text-xs text-[#141414]/70 mt-1">
              Adjust backlink parameters and architectural configurations to project their impact on estimated Domain Authority and PageRank before deploying code changes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Control Sliders */}
            <div className="space-y-4 font-mono">
              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>Simulated Total Backlinks / Internal Links:</span>
                  <span className="text-blue-700">{customBacklinksCount} links</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="150"
                  value={customBacklinksCount}
                  onChange={(e) => setCustomBacklinksCount(parseInt(e.target.value, 10))}
                  className="w-full accent-[#141414] cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#141414]/50">
                  <span>5 (Sparse)</span>
                  <span>50 (Moderate)</span>
                  <span>150 (Deep Network)</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold mb-1">
                  <span>DoFollow Link Retention Ratio:</span>
                  <span className="text-emerald-700">{customDoFollowPct}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={customDoFollowPct}
                  onChange={(e) => setCustomDoFollowPct(parseInt(e.target.value, 10))}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-[#141414]/50">
                  <span>20% (Strict NoFollow)</span>
                  <span>80% (Recommended)</span>
                  <span>100% (Full Trust)</span>
                </div>
              </div>

              <div className="border border-[#141414] p-3 space-y-2 bg-white">
                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customOrphanFixed}
                    onChange={(e) => setCustomOrphanFixed(e.target.checked)}
                    className="accent-[#141414]"
                  />
                  <span>All Orphan Pages Interlinked (0 unlinked dead-ends)</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={customHasSitemap}
                    onChange={(e) => setCustomHasSitemap(e.target.checked)}
                    className="accent-[#141414]"
                  />
                  <span>XML Sitemap Submitted &amp; Verified in Search Console</span>
                </label>
              </div>

              <button
                onClick={() => {
                  setCustomBacklinksCount(backlinkAudit.totalLinksDiscovered);
                  setCustomDoFollowPct(backlinkAudit.doFollowRatio);
                  setCustomOrphanFixed(true);
                  setCustomHasSitemap(sitemapData.sitemapFound);
                }}
                className="flex items-center gap-1.5 text-xs font-mono font-bold uppercase border border-[#141414] bg-white px-3 py-1.5 hover:bg-[#E4E3E0] cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>Reset to Discovered Crawl Values</span>
              </button>
            </div>

            {/* Simulated Prediction Card */}
            <div className="border-2 border-[#141414] bg-amber-50 p-5 font-mono flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase text-amber-900">
                  Projected Scenario Outcome
                </span>
                <div className="mt-2 flex items-baseline gap-3">
                  <span className="text-5xl font-black text-[#141414]">
                    {simulatedDA}
                  </span>
                  <span className="text-xs text-[#141414]/70">
                    / 100 Projected DA
                  </span>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <span className="text-xl font-black text-emerald-800">
                    PR {simulatedPR.toFixed(1)}
                  </span>
                  <span className="text-xs text-[#141414]/70">
                    Estimated PageRank Logarithmic Equivalent
                  </span>
                </div>

                <div className="mt-4 pt-4 border-t border-[#141414]/20 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span>Baseline Crawl DA:</span>
                    <strong>{simulation.calculatedDomainAuthority}</strong>
                  </div>
                  <div className="flex justify-between">
                    <span>Scenario Impact Delta:</span>
                    <strong
                      className={
                        simulatedDA >= simulation.calculatedDomainAuthority
                          ? 'text-emerald-700'
                          : 'text-rose-700'
                      }
                    >
                      {simulatedDA >= simulation.calculatedDomainAuthority ? '+' : ''}
                      {simulatedDA - simulation.calculatedDomainAuthority} pts
                    </strong>
                  </div>
                </div>
              </div>

              <div className="mt-4 bg-white border border-[#141414] p-3 text-[11px] text-[#141414]/80">
                <strong>Projected SEO Impact:</strong>{' '}
                {simulatedDA >= 70
                  ? 'Strong competitive advantage for high-volume organic search queries and featured snippet indexation.'
                  : simulatedDA >= 45
                  ? 'Viable ranking potential for targeted mid-tail and brand keywords.'
                  : 'Requires aggressive interlinking and sitemap crawl optimization before ranking for competitive keywords.'}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
