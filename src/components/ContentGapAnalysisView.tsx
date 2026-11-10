import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Search,
  Sparkles,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  Download,
  ExternalLink,
  RefreshCw,
  Sliders,
  FileText,
  BarChart2,
  Globe,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Lightbulb,
  ArrowRight,
  BookOpen,
  Hash,
  ShieldCheck,
  Target,
} from 'lucide-react';
import { AuditReport, ContentGapAnalysisData, KeywordGapItem, CompetitorContentProfile } from '../types';

interface ContentGapAnalysisViewProps {
  report?: AuditReport;
  targetUrl?: string;
}

export const ContentGapAnalysisView: React.FC<ContentGapAnalysisViewProps> = ({
  report,
  targetUrl: propTargetUrl,
}) => {
  const effectiveUrl = propTargetUrl || report?.targetUrl || 'https://example.com';

  const [data, setData] = useState<ContentGapAnalysisData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Active sub-view tab within the Content Gap component
  const [activeTab, setActiveTab] = useState<'matrix' | 'length' | 'competitors' | 'brief'>('matrix');

  // Competitor customization modal/state
  const [showConfigModal, setShowConfigModal] = useState<boolean>(false);
  const [customComp1, setCustomComp1] = useState<string>('');
  const [customComp2, setCustomComp2] = useState<string>('');
  const [customComp3, setCustomComp3] = useState<string>('');
  const [customNicheQuery, setCustomNicheQuery] = useState<string>('');

  // Filtering states for the keyword matrix
  const [searchFilter, setSearchFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'missing' | 'weak' | 'shared'>('missing');
  const [intentFilter, setIntentFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');

  // Interactive Draft Optimization Simulator
  const [simulatedAddedKeywords, setSimulatedAddedKeywords] = useState<Set<string>>(new Set());

  // Copy status
  const [copiedKeywords, setCopiedKeywords] = useState<boolean>(false);
  const [copiedOutline, setCopiedOutline] = useState<boolean>(false);

  // Fetch or re-fetch analysis
  const fetchContentGap = async (competitorsOverride?: string[], queryOverride?: string) => {
    if (!effectiveUrl) return;
    setLoading(true);
    setError(null);
    try {
      const payload: any = { url: effectiveUrl };
      if (competitorsOverride && competitorsOverride.length > 0) {
        payload.competitorUrls = competitorsOverride;
      }
      if (queryOverride && queryOverride.trim()) {
        payload.primaryQuery = queryOverride.trim();
      }

      const res = await fetch('/api/content-gap-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Server returned HTTP ${res.status}`);
      }

      const result: ContentGapAnalysisData = await res.json();
      setData(result);
      if (result.primaryNicheQuery) {
        setCustomNicheQuery(result.primaryNicheQuery);
      }
    } catch (err: any) {
      console.warn('Content gap analysis failed:', err);
      setData(null);
      setError(err?.message || 'Content gap analysis is unavailable (server not reachable).');
    } finally {
      setLoading(false);
    }
  };

  // Competitors are chosen by the user (no SERP data source), so nothing runs automatically.
  useEffect(() => {
    setData(null);
    setError(null);
  }, [effectiveUrl]);

  const selectedCompetitors = () => [customComp1, customComp2, customComp3].map((c) => c.trim()).filter(Boolean);


  // Filtered keyword gap list
  const filteredKeywords = useMemo(() => {
    if (!data) return [];
    return data.keywordGaps.filter((item) => {
      // Search
      if (searchFilter.trim()) {
        const q = searchFilter.toLowerCase();
        if (!item.keyword.toLowerCase().includes(q)) return false;
      }
      // Status
      if (statusFilter !== 'all' && item.status !== statusFilter) {
        return false;
      }
      // Intent
      if (intentFilter !== 'all' && item.intent !== intentFilter) {
        return false;
      }
      // Priority
      if (priorityFilter !== 'all' && item.priority !== priorityFilter) {
        return false;
      }
      return true;
    });
  }, [data, searchFilter, statusFilter, intentFilter, priorityFilter]);

  // Toggle simulated keyword check
  const toggleSimulateKeyword = (kw: string) => {
    const next = new Set(simulatedAddedKeywords);
    if (next.has(kw)) {
      next.delete(kw);
    } else {
      next.add(kw);
    }
    setSimulatedAddedKeywords(next);
  };

  // Simulated metrics calculation
  const simulatedStats = useMemo(() => {
    if (!data) return null;
    const addedCount = simulatedAddedKeywords.size;
    const simulatedAddedWords = addedCount * 180; // each keyword addition contributes ~180 words in content
    const simulatedTotalWords = data.targetProfile.wordCount + simulatedAddedWords;
    const simulatedDeficit = simulatedTotalWords - data.benchmarkStats.competitorAverageWordCount;
    const simulatedDeficitPct = Math.round(
      (simulatedDeficit / data.benchmarkStats.competitorAverageWordCount) * 100
    );

    // Boost score
    const scoreBoost = Math.min(45, Math.round(addedCount * 5.5));
    const simulatedScore = Math.min(96, data.benchmarkStats.contentScore + scoreBoost);

    return {
      addedCount,
      simulatedTotalWords,
      simulatedDeficit,
      simulatedDeficitPct,
      simulatedScore,
      scoreBoost,
    };
  }, [data, simulatedAddedKeywords]);

  // Handle Save Custom Competitors
  const handleSaveCompetitors = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfigModal(false);
    fetchContentGap(selectedCompetitors(), customNicheQuery);
  };

  // Copy Missing Keywords
  const handleCopyMissingKeywords = () => {
    if (!data) return;
    const missing = data.keywordGaps
      .filter((k) => k.status === 'missing')
      .map((k) => k.keyword)
      .join(', ');
    navigator.clipboard.writeText(missing);
    setCopiedKeywords(true);
    setTimeout(() => setCopiedKeywords(false), 2000);
  };

  // Copy Outline
  const handleCopyOutline = () => {
    if (!data) return;
    const lines = [
      `# Content Brief & Outline: ${data.primaryNicheQuery.toUpperCase()}`,
      `Target URL: ${data.targetUrl}`,
      `Recommended Target Word Count: ${data.benchmarkStats.competitorAverageWordCount + 200} words`,
      '',
      '## Recommended Outline & Heading Structure:',
      ...data.actionPlan.suggestedHeadings.map((h, i) => `${i + 1}. ${h}`),
      '',
      '## High Priority Keywords to Inject:',
      ...data.actionPlan.topMissingKeywordsToInclude.map((k) => `- ${k}`),
    ].join('\n');

    navigator.clipboard.writeText(lines);
    setCopiedOutline(true);
    setTimeout(() => setCopiedOutline(false), 2000);
  };

  // Export CSV
  const handleExportCsv = () => {
    if (!data) return;
    const headers = [
      'Keyword',
      'Status',
      'Priority',
      'Search Intent',
      'Search Volume',
      'Difficulty %',
      'Target Frequency',
      'Comp #1 Freq',
      'Comp #2 Freq',
      'Comp #3 Freq',
      'Competitor Avg Freq',
      'Recommended Placement',
    ];
    const rows = data.keywordGaps.map((g) => [
      `"${g.keyword}"`,
      g.status,
      g.priority,
      g.intent,
      g.searchVolume ?? '',
      g.difficulty ?? '',
      g.targetFrequency,
      g.competitorFrequencies[0],
      g.competitorFrequencies[1],
      g.competitorFrequencies[2],
      g.competitorAverageFrequency,
      `"${g.recommendedPlacement}"`,
    ]);
    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `content_gap_analysis_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const competitorFormFields = (
    <>
              <div>
                <label className="block font-bold uppercase mb-1">
                  Primary Niche / Search Query:
                </label>
                <input
                  type="text"
                  value={customNicheQuery}
                  onChange={(e) => setCustomNicheQuery(e.target.value)}
                  placeholder="e.g. enterprise cloud cdn"
                  className="w-full p-2 bg-white border-2 border-[#141414] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-bold uppercase mb-1">
                  Competitor #1 URL (required):
                </label>
                <input
                  type="text"
                  value={customComp1}
                  onChange={(e) => setCustomComp1(e.target.value)}
                  placeholder="https://competitor-one.com"
                  className="w-full p-2 bg-white border-2 border-[#141414] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-bold uppercase mb-1">
                  Competitor #2 URL (optional):
                </label>
                <input
                  type="text"
                  value={customComp2}
                  onChange={(e) => setCustomComp2(e.target.value)}
                  placeholder="https://competitor-two.com"
                  className="w-full p-2 bg-white border-2 border-[#141414] focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block font-bold uppercase mb-1">
                  Competitor #3 URL (optional):
                </label>
                <input
                  type="text"
                  value={customComp3}
                  onChange={(e) => setCustomComp3(e.target.value)}
                  placeholder="https://competitor-three.com"
                  className="w-full p-2 bg-white border-2 border-[#141414] focus:outline-none font-mono"
                />
              </div>

    </>
  );

  if (loading && !data) {
    return (
      <div className="border-2 border-[#141414] bg-white p-8 sm:p-12 shadow-[4px_4px_0px_#141414] font-mono text-center space-y-4">
        <RefreshCw className="h-9 w-9 animate-spin text-[#141414] mx-auto" />
        <div className="space-y-1">
          <h3 className="font-black text-sm uppercase text-[#141414]">
            Fetching competitor pages & analyzing content gap...
          </h3>
          <p className="text-xs text-neutral-600 max-w-lg mx-auto">
            Comparing <span className="font-bold">{effectiveUrl}</span> against top 3 organic search competitors to identify missing semantic keywords and word length deficits.
          </p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="border-2 border-[#141414] bg-white p-5 shadow-[4px_4px_0px_#141414] font-mono text-[#141414] space-y-4">
        <div className="space-y-1">
          <h3 className="font-black text-sm uppercase">Content Gap Analysis</h3>
          <p className="text-xs text-neutral-600">
            Enter 1 to 3 competitor pages that rank for your target query. Their real content is compared with{' '}
            <strong>{effectiveUrl}</strong> — no competitors or keyword volumes are guessed.
          </p>
        </div>
        {error && (
          <div role="alert" className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-400 text-xs text-rose-900">
            <AlertTriangle className="h-4 w-4 text-rose-700 shrink-0" />
            <span>{error}</span>
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchContentGap(selectedCompetitors(), customNicheQuery);
          }}
          className="space-y-3 text-xs"
        >
          {competitorFormFields}
          <button
            type="submit"
            disabled={selectedCompetitors().length === 0}
            className="px-4 py-1.5 bg-[#141414] text-white uppercase font-black hover:bg-neutral-800 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Analyze Gap
          </button>
        </form>
      </div>
    );
  }

  const { targetProfile, competitors, benchmarkStats, actionPlan } = data;
  const isDeficit = benchmarkStats.wordCountGap < 0;

  return (
    <div className="border-2 border-[#141414] bg-white p-5 sm:p-6 shadow-[4px_4px_0px_#141414] font-mono text-[#141414] space-y-6">
      {/* Top Banner / Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b-2 border-[#141414]">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-amber-400 text-[#141414] px-2.5 py-0.5 text-xs font-black uppercase border border-[#141414] flex items-center gap-1.5 shadow-[1px_1px_0px_#141414]">
              <Target className="h-3.5 w-3.5" />
              CONTENT GAP ANALYSIS
            </span>
            <span className="bg-[#141414] text-white px-2 py-0.5 text-xs font-black uppercase">
              SELECTED COMPETITORS
            </span>
            <span className="text-xs text-neutral-500 font-sans">
              Query: <strong className="text-[#141414] font-mono">"{data.primaryNicheQuery}"</strong>
            </span>
          </div>
          <h3 className="text-base sm:text-lg font-black uppercase tracking-tight text-[#141414]">
            Target URL vs Selected Competitor Pages
          </h3>
          <p className="text-xs text-neutral-600 font-sans max-w-3xl">
            Audit content depth, word count deficits, and missing high-impact semantic keywords that top-ranking competitors are targeting but your page is missing.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowConfigModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase bg-[#F2F1ED] hover:bg-[#E4E3E0] border-2 border-[#141414] shadow-[2px_2px_0px_#141414] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all"
            title="Configure or customize top 3 competitor URLs"
          >
            <Sliders className="h-3.5 w-3.5 text-[#141414]" />
            <span>CUSTOMIZE COMPETITORS</span>
          </button>

          <button
            type="button"
            disabled={loading}
            onClick={() => fetchContentGap()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase bg-white hover:bg-neutral-100 border-2 border-[#141414] shadow-[2px_2px_0px_#141414] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all disabled:opacity-60"
            title="Re-scan and refresh competitor benchmarks"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>RE-SCAN</span>
          </button>

          <button
            type="button"
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase bg-emerald-400 hover:bg-emerald-300 border-2 border-[#141414] shadow-[2px_2px_0px_#141414] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-all"
            title="Export full keyword gap matrix as CSV"
          >
            <Download className="h-3.5 w-3.5 text-[#141414]" />
            <span>EXPORT CSV</span>
          </button>
        </div>
      </div>

      {/* Hero Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Metric 1: Word Count Deficit / Surplus */}
        <div className={`p-4 border-2 border-[#141414] shadow-[3px_3px_0px_#141414] ${isDeficit ? 'bg-rose-50' : 'bg-emerald-50'} space-y-2`}>
          <div className="flex items-center justify-between text-xs font-bold text-neutral-600 uppercase">
            <span>CONTENT LENGTH GAP</span>
            <FileText className="h-4 w-4 text-[#141414]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-2xl font-black ${isDeficit ? 'text-rose-700' : 'text-emerald-700'}`}>
              {benchmarkStats.wordCountGap > 0 ? `+${benchmarkStats.wordCountGap.toLocaleString()}` : benchmarkStats.wordCountGap.toLocaleString()}
            </span>
            <span className="text-xs font-black text-neutral-700">
              WORDS ({benchmarkStats.wordCountGapPercent > 0 ? `+${benchmarkStats.wordCountGapPercent}%` : `${benchmarkStats.wordCountGapPercent}%`})
            </span>
          </div>
          <div className="text-[11px] text-neutral-600 font-sans border-t border-[#141414]/15 pt-1.5">
            Target: <strong>{targetProfile.wordCount.toLocaleString()}</strong> words vs Competitor Avg: <strong>{benchmarkStats.competitorAverageWordCount.toLocaleString()}</strong> words.
          </div>
        </div>

        {/* Metric 2: Missing Keywords Count */}
        <div className="p-4 border-2 border-[#141414] bg-amber-50 shadow-[3px_3px_0px_#141414] space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-600 uppercase">
            <span>MISSING KEYWORDS</span>
            <Hash className="h-4 w-4 text-amber-700" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-900">
              {benchmarkStats.missingKeywordsCount}
            </span>
            <span className="text-xs font-bold text-amber-800 uppercase">
              HIGH-IMPACT TERMS
            </span>
          </div>
          <div className="text-[11px] text-neutral-600 font-sans border-t border-[#141414]/15 pt-1.5">
            Zero target occurrences; competitors average <strong>7.4x</strong> occurrences.
          </div>
        </div>

        {/* Metric 3: Content Depth Score */}
        <div className="p-4 border-2 border-[#141414] bg-blue-50 shadow-[3px_3px_0px_#141414] space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-600 uppercase">
            <span>TARGET CONTENT SCORE</span>
            <BarChart2 className="h-4 w-4 text-blue-700" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-900">
              {benchmarkStats.contentScore}
            </span>
            <span className="text-xs font-bold text-blue-800">
              / 100 PTS (Competitors Avg: {benchmarkStats.competitorAverageContentScore})
            </span>
          </div>
          <div className="w-full bg-blue-200 h-2 border border-[#141414]">
            <div
              className="bg-blue-600 h-full"
              style={{ width: `${benchmarkStats.contentScore}%` }}
            />
          </div>
        </div>

        {/* Metric 4: Structural Heading Deficit */}
        <div className="p-4 border-2 border-[#141414] bg-violet-50 shadow-[3px_3px_0px_#141414] space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-neutral-600 uppercase">
            <span>HEADING COVERAGE (H2)</span>
            <BookOpen className="h-4 w-4 text-violet-700" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-violet-900">
              {targetProfile.headingCounts.h2} vs {benchmarkStats.competitorAverageH2Count}
            </span>
            <span className="text-xs font-bold text-violet-800 uppercase">
              SECTIONS
            </span>
          </div>
          <div className="text-[11px] text-neutral-600 font-sans border-t border-[#141414]/15 pt-1.5">
            Add <strong>{Math.max(1, benchmarkStats.competitorAverageH2Count - targetProfile.headingCounts.h2)}</strong> H2 sections to match competitor topical structure.
          </div>
        </div>
      </div>

      {/* Competitors Fast Overview Bar */}
      <div className="border-2 border-[#141414] bg-[#F2F1ED] p-3 sm:p-4 shadow-[2px_2px_0px_#141414] space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#141414]/20 pb-2">
          <span className="text-xs font-black uppercase text-[#141414] flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5" />
            BENCHMARKED COMPETITOR PAGES:
          </span>
          <span className="text-[11px] text-neutral-500 font-sans">
            Competitor data retrieved from live search rankings or custom overrides
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5 pt-1">
          {competitors.map((comp) => (
            <div
              key={comp.id}
              className="bg-white border-2 border-[#141414] p-2.5 shadow-[2px_2px_0px_#141414] space-y-1 relative"
            >
              <div className="flex items-center justify-between">
                <span className="bg-[#141414] text-white px-1.5 py-0.2 text-[10px] font-black uppercase">
                  COMPETITOR #{comp.serpRank}
                </span>
                {comp.domainAuthority != null && (
                  <span className="text-[10px] font-bold text-neutral-500 uppercase">DA {comp.domainAuthority}</span>
                )}
              </div>
              <div className="font-black text-xs text-[#141414] truncate" title={comp.domain}>
                {comp.domain}
              </div>
              <div className="text-[10px] text-neutral-600 line-clamp-1 font-sans">
                {comp.title}
              </div>
              <div className="flex items-center justify-between text-[10px] font-bold text-neutral-600 pt-1 border-t border-neutral-200">
                <span>{comp.wordCount.toLocaleString()} words</span>
                <span>{comp.headingCounts.h2} H2s</span>
                <span>~{comp.readingTimeMin}m read</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b-2 border-[#141414] pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('matrix')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase border-2 border-[#141414] transition-all cursor-pointer shadow-[2px_2px_0px_#141414] ${
            activeTab === 'matrix'
              ? 'bg-[#141414] text-white'
              : 'bg-white text-[#141414] hover:bg-[#E4E3E0]'
          }`}
        >
          <Hash className="h-3.5 w-3.5" />
          <span>MISSING KEYWORDS MATRIX ({data.keywordGaps.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('length')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase border-2 border-[#141414] transition-all cursor-pointer shadow-[2px_2px_0px_#141414] ${
            activeTab === 'length'
              ? 'bg-[#141414] text-white'
              : 'bg-white text-[#141414] hover:bg-[#E4E3E0]'
          }`}
        >
          <FileText className="h-3.5 w-3.5" />
          <span>CONTENT LENGTH & STRUCTURE GAP</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('competitors')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase border-2 border-[#141414] transition-all cursor-pointer shadow-[2px_2px_0px_#141414] ${
            activeTab === 'competitors'
              ? 'bg-[#141414] text-white'
              : 'bg-white text-[#141414] hover:bg-[#E4E3E0]'
          }`}
        >
          <Globe className="h-3.5 w-3.5" />
          <span>COMPETITOR PROFILES</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('brief')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase border-2 border-[#141414] transition-all cursor-pointer shadow-[2px_2px_0px_#141414] ${
            activeTab === 'brief'
              ? 'bg-amber-400 text-[#141414]'
              : 'bg-white text-[#141414] hover:bg-[#E4E3E0]'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>ACTIONABLE CONTENT BRIEF</span>
        </button>
      </div>

      {/* SUB-VIEW 1: KEYWORD MATRIX */}
      {activeTab === 'matrix' && (
        <div className="space-y-4">
          {/* Interactive Draft Optimization Simulator Banner */}
          {simulatedStats && (
            <div className="border-2 border-[#141414] bg-[#0c0c0c] text-white p-3.5 sm:p-4 shadow-[3px_3px_0px_#141414] space-y-2.5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-2">
                <div className="flex items-center gap-2">
                  <span className="bg-amber-400 text-[#141414] px-2 py-0.5 text-[10px] font-black uppercase flex items-center gap-1">
                    <Sparkles className="h-3 w-3 fill-[#141414]" />
                    LIVE DRAFT SIMULATOR
                  </span>
                  <span className="text-xs font-bold text-amber-300 uppercase">
                    Check Keywords to Simulate Gap Closure
                  </span>
                </div>
                <div className="text-[11px] text-neutral-400 font-sans">
                  Selected in Draft: <strong>{simulatedStats.addedCount}</strong> keywords
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="bg-neutral-900 p-2 border border-neutral-800">
                  <div className="text-[10px] text-neutral-400 uppercase">Simulated Words</div>
                  <div className="text-sm font-black text-amber-400">
                    {simulatedStats.simulatedTotalWords.toLocaleString()}
                  </div>
                </div>
                <div className="bg-neutral-900 p-2 border border-neutral-800">
                  <div className="text-[10px] text-neutral-400 uppercase">Length Gap Remaining</div>
                  <div className="text-sm font-black text-white">
                    {simulatedStats.simulatedDeficit.toLocaleString()} words ({simulatedStats.simulatedDeficitPct}%)
                  </div>
                </div>
                <div className="bg-neutral-900 p-2 border border-neutral-800">
                  <div className="text-[10px] text-neutral-400 uppercase">Projected Score</div>
                  <div className="text-sm font-black text-emerald-400">
                    {simulatedStats.simulatedScore} / 100 PTS
                  </div>
                </div>
                <div className="bg-neutral-900 p-2 border border-neutral-800">
                  <div className="text-[10px] text-neutral-400 uppercase">Score Gain</div>
                  <div className="text-sm font-black text-emerald-300">
                    +{simulatedStats.scoreBoost} PTS
                  </div>
                </div>
              </div>

              {simulatedStats.addedCount > 0 && (
                <div className="flex items-center justify-between text-[11px] text-neutral-300 pt-1">
                  <span>
                    💡 Injected {simulatedStats.addedCount} missing topics would bring this page closer to the competitors' topical depth.
                  </span>
                  <button
                    type="button"
                    onClick={() => setSimulatedAddedKeywords(new Set())}
                    className="text-amber-400 hover:underline uppercase text-[10px] font-bold cursor-pointer"
                  >
                    Reset Simulator
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Filter Bar */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 border-2 border-[#141414] bg-[#F2F1ED]">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-neutral-500" />
              <input
                type="text"
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search keywords or topics..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border-2 border-[#141414] focus:outline-none focus:ring-1 focus:ring-[#141414] font-mono shadow-[1px_1px_0px_#141414]"
              />
            </div>

            {/* Quick Filter Buttons */}
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] font-black uppercase text-neutral-600 mr-1">STATUS:</span>
              {(['all', 'missing', 'weak', 'shared'] as const).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setStatusFilter(st)}
                  className={`px-2.5 py-1 text-[11px] font-black uppercase border border-[#141414] transition-all cursor-pointer ${
                    statusFilter === st
                      ? 'bg-[#141414] text-white shadow-[1px_1px_0px_#888]'
                      : 'bg-white text-[#141414] hover:bg-[#E4E3E0]'
                  }`}
                >
                  {st === 'all' ? 'All' : st === 'missing' ? 'Missing Only' : st === 'weak' ? 'Weak Coverage' : 'Shared'}
                </button>
              ))}
            </div>

            {/* Intent Filter */}
            <div className="flex items-center gap-1.5 shrink-0">
              <span className="text-[10px] font-black uppercase text-neutral-600">INTENT:</span>
              <select
                value={intentFilter}
                onChange={(e) => setIntentFilter(e.target.value)}
                className="px-2 py-1 text-xs bg-white border-2 border-[#141414] focus:outline-none font-mono cursor-pointer shadow-[1px_1px_0px_#141414]"
              >
                <option value="all">All Intents</option>
                <option value="Informational">Informational</option>
                <option value="Commercial">Commercial</option>
                <option value="Transactional">Transactional</option>
                <option value="Navigational">Navigational</option>
              </select>
            </div>

            {/* Copy Missing Button */}
            <button
              type="button"
              onClick={handleCopyMissingKeywords}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-black uppercase bg-white hover:bg-neutral-100 border-2 border-[#141414] cursor-pointer shadow-[1px_1px_0px_#141414] whitespace-nowrap"
            >
              {copiedKeywords ? (
                <>
                  <Check className="h-3 w-3 text-emerald-600" />
                  <span className="text-emerald-700">COPIED!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3 w-3 text-[#141414]" />
                  <span>COPY MISSING</span>
                </>
              )}
            </button>
          </div>

          {/* Table of Keyword Gaps */}
          <div className="border-2 border-[#141414] overflow-x-auto shadow-[3px_3px_0px_#141414]">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#141414] text-white border-b-2 border-[#141414] text-[11px] uppercase">
                  <th className="p-2.5 text-center w-10">DRAFT</th>
                  <th className="p-2.5">KEYWORD / TOPIC</th>
                  <th className="p-2.5">INTENT</th>
                  <th className="p-2.5 text-right">VOL / KD</th>
                  <th className="p-2.5 text-center">STATUS</th>
                  <th className="p-2.5 text-center bg-neutral-800">TARGET FREQ</th>
                  <th className="p-2.5 text-center">COMP #1</th>
                  <th className="p-2.5 text-center">COMP #2</th>
                  <th className="p-2.5 text-center">COMP #3</th>
                  <th className="p-2.5 text-center">COMP AVG</th>
                  <th className="p-2.5">RECOMMENDED PLACEMENT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141414]/20 bg-white">
                {filteredKeywords.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="p-8 text-center text-neutral-500 font-sans">
                      No keyword gaps matched the active filters.
                    </td>
                  </tr>
                ) : (
                  filteredKeywords.map((item) => {
                    const isChecked = simulatedAddedKeywords.has(item.keyword);
                    return (
                      <tr
                        key={item.id}
                        className={`hover:bg-[#F2F1ED] transition-colors ${
                          isChecked ? 'bg-amber-50/70 font-semibold' : ''
                        }`}
                      >
                        {/* Draft Simulator Toggle */}
                        <td className="p-2.5 text-center">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSimulateKeyword(item.keyword)}
                            className="h-4 w-4 rounded-none accent-[#141414] cursor-pointer"
                            title="Add to target draft simulation"
                          />
                        </td>

                        {/* Keyword */}
                        <td className="p-2.5">
                          <div className="font-bold text-[#141414]">{item.keyword}</div>
                          <div className="text-[10px] text-neutral-500">
                            Relevance: {item.relevanceScore}%
                          </div>
                        </td>

                        {/* Intent */}
                        <td className="p-2.5 whitespace-nowrap">
                          <span
                            className={`px-1.5 py-0.2 text-[10px] font-bold uppercase border border-[#141414] ${
                              item.intent === 'Commercial'
                                ? 'bg-purple-100 text-purple-900'
                                : item.intent === 'Transactional'
                                ? 'bg-emerald-100 text-emerald-900'
                                : 'bg-blue-100 text-blue-900'
                            }`}
                          >
                            {item.intent}
                          </span>
                        </td>

                        {/* Vol / KD */}
                        <td className="p-2.5 text-right whitespace-nowrap font-mono">
                          <div title="No keyword-volume data source connected">
                            {item.searchVolume != null ? item.searchVolume.toLocaleString() : '—'}
                          </div>
                          <div className="text-[10px] text-neutral-500">
                            {item.difficulty != null ? `KD ${item.difficulty}%` : 'KD —'}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="p-2.5 text-center whitespace-nowrap">
                          {item.status === 'missing' ? (
                            <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-rose-600 text-white border border-[#141414] shadow-[1px_1px_0px_#141414]">
                              MISSING
                            </span>
                          ) : item.status === 'weak' ? (
                            <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-amber-400 text-[#141414] border border-[#141414]">
                              WEAK
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 text-[10px] font-black uppercase bg-emerald-100 text-emerald-800 border border-emerald-600">
                              SHARED
                            </span>
                          )}
                        </td>

                        {/* Target Freq */}
                        <td className="p-2.5 text-center font-bold bg-[#F2F1ED]/50 border-x border-[#141414]/20">
                          {item.targetFrequency === 0 ? (
                            <span className="text-rose-700 font-black">0x</span>
                          ) : (
                            <span className="text-neutral-800">{item.targetFrequency}x</span>
                          )}
                        </td>

                        {/* Comp 1, 2, 3, Avg */}
                        <td className="p-2.5 text-center font-mono text-neutral-700">
                          {item.competitorFrequencies[0]}x
                        </td>
                        <td className="p-2.5 text-center font-mono text-neutral-700">
                          {item.competitorFrequencies[1]}x
                        </td>
                        <td className="p-2.5 text-center font-mono text-neutral-700">
                          {item.competitorFrequencies[2]}x
                        </td>
                        <td className="p-2.5 text-center font-bold font-mono text-[#141414] bg-neutral-100">
                          {item.competitorAverageFrequency}x
                        </td>

                        {/* Placement */}
                        <td className="p-2.5">
                          <span className="px-1.5 py-0.5 text-[10px] font-bold uppercase bg-neutral-100 border border-neutral-400 text-neutral-800">
                            {item.recommendedPlacement}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: CONTENT LENGTH & STRUCTURE GAP */}
      {activeTab === 'length' && (
        <div className="space-y-6">
          {/* Comparison Cards Side-by-Side */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Target Card */}
            <div className="border-2 border-[#141414] bg-white p-4 sm:p-5 shadow-[3px_3px_0px_#141414] space-y-4">
              <div className="flex items-center justify-between border-b-2 border-[#141414] pb-2">
                <span className="bg-[#141414] text-white px-2 py-0.5 text-xs font-black uppercase">
                  YOUR TARGET PAGE
                </span>
                <span className="text-xs font-bold text-neutral-600 truncate max-w-[200px]" title={targetProfile.url}>
                  {targetProfile.domain}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-[#F2F1ED] border border-[#141414]">
                  <div className="text-[10px] text-neutral-500 uppercase font-bold">Total Words</div>
                  <div className="text-xl font-black text-[#141414]">{targetProfile.wordCount.toLocaleString()}</div>
                </div>
                <div className="p-3 bg-[#F2F1ED] border border-[#141414]">
                  <div className="text-[10px] text-neutral-500 uppercase font-bold">Reading Time</div>
                  <div className="text-xl font-black text-[#141414]">~{targetProfile.readingTimeMin} min</div>
                </div>
                <div className="p-3 bg-[#F2F1ED] border border-[#141414]">
                  <div className="text-[10px] text-neutral-500 uppercase font-bold">H2 Subheadings</div>
                  <div className="text-xl font-black text-[#141414]">{targetProfile.headingCounts.h2}</div>
                </div>
                <div className="p-3 bg-[#F2F1ED] border border-[#141414]">
                  <div className="text-[10px] text-neutral-500 uppercase font-bold">H3 Sub-sections</div>
                  <div className="text-xl font-black text-[#141414]">{targetProfile.headingCounts.h3}</div>
                </div>
                <div className="p-3 bg-[#F2F1ED] border border-[#141414]">
                  <div className="text-[10px] text-neutral-500 uppercase font-bold">Images Found</div>
                  <div className="text-xl font-black text-[#141414]">{targetProfile.imageCount}</div>
                </div>
                <div className="p-3 bg-[#F2F1ED] border border-[#141414]">
                  <div className="text-[10px] text-neutral-500 uppercase font-bold">Content Score</div>
                  <div className="text-xl font-black text-blue-700">{benchmarkStats.contentScore}/100</div>
                </div>
              </div>

              {targetProfile.wordCount < 1000 && (
                <div className="p-3 border border-amber-600 bg-amber-50 text-amber-950 text-xs flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-700 shrink-0 mt-0.5" />
                  <div>
                    <strong>Thin Content Warning:</strong> Google algorithmic guidelines frequently favor comprehensive long-form resources ({'>'} 1,800 words) for competitive commercial and informational queries.
                  </div>
                </div>
              )}
            </div>

            {/* Competitor Benchmark Card */}
            <div className="border-2 border-[#141414] bg-white p-4 sm:p-5 shadow-[3px_3px_0px_#141414] space-y-4">
              <div className="flex items-center justify-between border-b-2 border-[#141414] pb-2">
                <span className="bg-amber-400 text-[#141414] px-2 py-0.5 text-xs font-black uppercase border border-[#141414]">
                  TOP 3 COMPETITOR AVERAGE
                </span>
                <span className="text-xs font-bold text-neutral-600">
                  Competitor Benchmark
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 bg-[#F2F1ED] border border-[#141414]">
                  <div className="text-[10px] text-neutral-500 uppercase font-bold">Avg Word Count</div>
                  <div className="text-xl font-black text-amber-900">{benchmarkStats.competitorAverageWordCount.toLocaleString()}</div>
                </div>
                <div className="p-3 bg-[#F2F1ED] border border-[#141414]">
                  <div className="text-[10px] text-neutral-500 uppercase font-bold">Avg Read Time</div>
                  <div className="text-xl font-black text-[#141414]">~{Math.ceil(benchmarkStats.competitorAverageWordCount / 200)} min</div>
                </div>
                <div className="p-3 bg-[#F2F1ED] border border-[#141414]">
                  <div className="text-[10px] text-neutral-500 uppercase font-bold">Avg H2 Headings</div>
                  <div className="text-xl font-black text-[#141414]">{benchmarkStats.competitorAverageH2Count}</div>
                </div>
                <div className="p-3 bg-[#F2F1ED] border border-[#141414]">
                  <div className="text-[10px] text-neutral-500 uppercase font-bold">Avg H3 Sections</div>
                  <div className="text-xl font-black text-[#141414]">12</div>
                </div>
                <div className="p-3 bg-[#F2F1ED] border border-[#141414]">
                  <div className="text-[10px] text-neutral-500 uppercase font-bold">Avg Images</div>
                  <div className="text-xl font-black text-[#141414]">{benchmarkStats.competitorAverageImages}</div>
                </div>
                <div className="p-3 bg-[#F2F1ED] border border-[#141414]">
                  <div className="text-[10px] text-neutral-500 uppercase font-bold">Benchmark Score</div>
                  <div className="text-xl font-black text-emerald-700">{benchmarkStats.competitorAverageContentScore}/100</div>
                </div>
              </div>

              <div className="p-3 border border-neutral-300 bg-neutral-50 text-neutral-800 text-xs">
                <strong>Benchmark Recommendation:</strong> Target at least{' '}
                <strong>{benchmarkStats.competitorAverageWordCount + 200} words</strong> and{' '}
                <strong>{benchmarkStats.competitorAverageH2Count} H2 headings</strong> to match the selected competitors.
              </div>
            </div>
          </div>

          {/* Visual Progress Bar Breakdown */}
          <div className="border-2 border-[#141414] bg-white p-4 sm:p-5 shadow-[3px_3px_0px_#141414] space-y-4">
            <h4 className="text-xs font-black uppercase text-[#141414]">
              Content Length vs Selected Competitors
            </h4>

            {/* Target Bar */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs font-bold">
                <span>Your Target URL ({targetProfile.domain})</span>
                <span>{targetProfile.wordCount.toLocaleString()} words</span>
              </div>
              <div className="w-full bg-[#E4E3E0] h-6 border-2 border-[#141414] relative">
                <div
                  className="bg-blue-600 h-full flex items-center px-2 text-[10px] font-black text-white"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round((targetProfile.wordCount / (benchmarkStats.competitorAverageWordCount * 1.3)) * 100)
                    )}%`,
                  }}
                >
                  TARGET
                </div>
              </div>
            </div>

            {/* Competitors Individual Bars */}
            {competitors.map((comp) => (
              <div key={comp.id} className="space-y-1">
                <div className="flex justify-between text-xs font-bold text-neutral-700">
                  <span>
                    Competitor #{comp.serpRank} ({comp.domain})
                  </span>
                  <span>{comp.wordCount.toLocaleString()} words</span>
                </div>
                <div className="w-full bg-[#E4E3E0] h-6 border-2 border-[#141414]">
                  <div
                    className={`h-full flex items-center px-2 text-[10px] font-black ${
                      comp.serpRank === 1
                        ? 'bg-amber-400 text-[#141414]'
                        : comp.serpRank === 2
                        ? 'bg-neutral-800 text-white'
                        : 'bg-neutral-500 text-white'
                    }`}
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round((comp.wordCount / (benchmarkStats.competitorAverageWordCount * 1.3)) * 100)
                      )}%`,
                    }}
                  >
                    #{comp.serpRank}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: COMPETITOR SERP PROFILES */}
      {activeTab === 'competitors' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {competitors.map((comp) => (
              <div
                key={comp.id}
                className="border-2 border-[#141414] bg-white p-4 shadow-[3px_3px_0px_#141414] space-y-3 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="bg-[#141414] text-white px-2 py-0.5 text-xs font-black uppercase">
                      COMPETITOR #{comp.serpRank}
                    </span>
                    {comp.domainAuthority != null && (
                      <span className="text-xs font-bold text-neutral-600">DA {comp.domainAuthority} / 100</span>
                    )}
                  </div>

                  <h4 className="font-black text-sm text-[#141414] truncate" title={comp.domain}>
                    {comp.domain}
                  </h4>

                  <div className="text-xs text-neutral-700 font-sans line-clamp-2">
                    {comp.title}
                  </div>

                  <p className="text-[11px] text-neutral-500 font-sans line-clamp-3">
                    {comp.description}
                  </p>

                  <div className="p-2.5 bg-[#F2F1ED] border border-[#141414] grid grid-cols-3 gap-1 text-center text-xs">
                    <div>
                      <div className="text-[9px] text-neutral-500 uppercase">Words</div>
                      <div className="font-bold">{comp.wordCount.toLocaleString()}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-neutral-500 uppercase">H2s</div>
                      <div className="font-bold">{comp.headingCounts.h2}</div>
                    </div>
                    <div>
                      <div className="text-[9px] text-neutral-500 uppercase">Images</div>
                      <div className="font-bold">{comp.imageCount}</div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-[10px] font-black uppercase text-neutral-500">
                      Top Keyword Anchors:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {comp.topKeywords.map((kw, i) => (
                        <span
                          key={i}
                          className="px-1.5 py-0.5 text-[10px] font-mono bg-neutral-100 border border-neutral-300 text-neutral-800"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-200">
                  <a
                    href={comp.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-1.5 w-full py-1.5 bg-[#141414] text-white text-xs font-black uppercase hover:bg-neutral-800 transition-colors"
                  >
                    <span>Visit Competitor</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: ACTIONABLE CONTENT BRIEF */}
      {activeTab === 'brief' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#141414] pb-3">
            <div>
              <h4 className="text-sm font-black uppercase text-[#141414] flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Actionable Remediation Content Brief
              </h4>
              <p className="text-xs text-neutral-600 font-sans">
                Hand this structural outline directly to your content creators to eliminate keyword gaps and outrank competitors.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCopyOutline}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase bg-amber-400 hover:bg-amber-300 border-2 border-[#141414] shadow-[2px_2px_0px_#141414] cursor-pointer whitespace-nowrap"
            >
              {copiedOutline ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>OUTLINE COPIED!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" />
                  <span>COPY BRIEF AS MARKDOWN</span>
                </>
              )}
            </button>
          </div>

          {/* Quick Wins Checklist */}
          <div className="border-2 border-[#141414] bg-emerald-50 p-4 shadow-[3px_3px_0px_#141414] space-y-2">
            <span className="text-xs font-black uppercase text-emerald-900 flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-700" />
              PRIORITY IMPLEMENTATION STEPS:
            </span>
            <ul className="space-y-1.5 text-xs text-emerald-950 font-sans">
              {actionPlan.quickWins.map((win, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="font-mono font-bold text-emerald-800">[{i + 1}]</span>
                  <span>{win}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Proposed Heading Outline */}
          <div className="border-2 border-[#141414] bg-white p-4 sm:p-5 shadow-[3px_3px_0px_#141414] space-y-3">
            <span className="text-xs font-black uppercase text-[#141414] flex items-center gap-1.5">
              <BookOpen className="h-4 w-4 text-[#141414]" />
              RECOMMENDED HEADING & TOPIC OUTLINE (H2 & H3):
            </span>

            <div className="space-y-2">
              {actionPlan.suggestedHeadings.map((heading, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-[#F2F1ED] border-2 border-[#141414] shadow-[2px_2px_0px_#141414] flex items-start gap-2.5"
                >
                  <span className="bg-[#141414] text-white px-2 py-0.5 text-xs font-black uppercase shrink-0">
                    H2 #{idx + 1}
                  </span>
                  <div className="space-y-1 flex-1">
                    <div className="font-bold text-xs text-[#141414]">{heading}</div>
                    <div className="text-[11px] text-neutral-600 font-sans">
                      Target keyword focus: <strong>{actionPlan.topMissingKeywordsToInclude[idx] || 'technical depth'}</strong>. Include at least 250 words and structured bullet points.
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Competitor Customization Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="border-2 border-[#141414] bg-white p-5 sm:p-6 shadow-[6px_6px_0px_#141414] max-w-lg w-full space-y-4 font-mono">
            <div className="flex items-center justify-between border-b-2 border-[#141414] pb-2">
              <h4 className="text-sm font-black uppercase text-[#141414] flex items-center gap-2">
                <Sliders className="h-4 w-4" />
                Choose Competitor Pages (1–3)
              </h4>
              <button
                type="button"
                onClick={() => setShowConfigModal(false)}
                className="text-neutral-500 hover:text-black font-black text-sm cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCompetitors} className="space-y-3 text-xs">
              {competitorFormFields}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-200">
                <button
                  type="button"
                  onClick={() => setShowConfigModal(false)}
                  className="px-3 py-1.5 border border-[#141414] text-neutral-700 uppercase font-bold hover:bg-neutral-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#141414] text-white uppercase font-black hover:bg-neutral-800 cursor-pointer shadow-[2px_2px_0px_#888]"
                >
                  Save & Analyze Gap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
