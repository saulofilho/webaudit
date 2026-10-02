import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles,
  RefreshCw,
  Copy,
  Check,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Clock,
  Layers,
  FileText,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Target,
  Wrench,
  Zap,
} from 'lucide-react';
import {
  AuditReport,
  AuditItem,
  ReportExecutiveSummaryResponse,
  CriticalIssueSummary,
  RoadmapPhase,
} from '../types';

interface ReportSummaryPanelProps {
  report: AuditReport;
  onOpenAiFix?: (item: AuditItem) => void;
  onOpenActionPlan?: () => void;
}

export const ReportSummaryPanel: React.FC<ReportSummaryPanelProps> = ({
  report,
  onOpenAiFix,
  onOpenActionPlan,
}) => {
  const [tone, setTone] = useState<'executive' | 'technical'>('executive');
  const [summaryData, setSummaryData] = useState<ReportExecutiveSummaryResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch or generate executive summary using server Gemini API
  const fetchExecutiveSummary = useCallback(
    async (selectedTone: 'executive' | 'technical' = tone) => {
      setIsLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/gemini/summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            report,
            tone: selectedTone,
          }),
        });

        if (!res.ok) {
          throw new Error(`Failed to contact server (${res.status})`);
        }

        const data: ReportExecutiveSummaryResponse = await res.json();
        setSummaryData(data);
      } catch (err: any) {
        console.warn('Error fetching /api/gemini/summary, using fallback:', err);
        // Local deterministic fallback
        const fallback = generateClientFallback(report, selectedTone);
        setSummaryData(fallback);
      } finally {
        setIsLoading(false);
      }
    },
    [report, tone]
  );

  // Fetch automatically on mount or when report changes
  useEffect(() => {
    fetchExecutiveSummary(tone);
  }, [report.id, report.targetUrl]);

  // Handle tone change
  const handleToneChange = (newTone: 'executive' | 'technical') => {
    setTone(newTone);
    fetchExecutiveSummary(newTone);
  };

  const handleCopySummary = () => {
    if (!summaryData) return;

    const issuesText = summaryData.top3CriticalIssues
      .map(
        (iss) =>
          `${iss.rank}. [${iss.urgency.toUpperCase()}] ${iss.title}\n   - Impact: ${iss.businessImpact}\n   - Root Cause: ${iss.technicalRootCause}\n   - Suggested Fix: ${iss.suggestedQuickAction}`
      )
      .join('\n\n');

    const roadmapText = summaryData.priorityRoadmap
      .map(
        (r) =>
          `* ${r.phase} (${r.timeframe}) - Expected Boost: ${r.expectedScoreBoost}\n  ${r.actions.map((a) => `  - ${a}`).join('\n')}`
      )
      .join('\n');

    const fullText = [
      `=== STRATEGIC AUDIT EXECUTIVE SUMMARY // WEBAUDIT PRO ===`,
      `Website: ${summaryData.targetUrl}`,
      `Overall Score: ${summaryData.overallScore}/100 [Grade ${summaryData.overallGrade}]`,
      `Strategic Verdict: ${summaryData.strategicVerdict}`,
      '',
      `EXECUTIVE OVERVIEW:`,
      summaryData.executiveOverview,
      '',
      `C-LEVEL HIGHLIGHTS:`,
      summaryData.cLevelHighlights.map((h) => `• ${h}`).join('\n'),
      '',
      `TOP 3 CRITICAL ISSUES:`,
      issuesText,
      '',
      `PRIORITY REMEDIATION ROADMAP:`,
      roadmapText,
      '',
      `ROI & RISK ANALYSIS:`,
      `• Conversion: ${summaryData.roiAndBusinessRiskAnalysis.conversionOpportunity}`,
      `• Security: ${summaryData.roiAndBusinessRiskAnalysis.securityExposureRisk}`,
      `• SEO: ${summaryData.roiAndBusinessRiskAnalysis.seoVisibilityImpact}`,
    ].join('\n');

    navigator.clipboard.writeText(fullText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleFindAndOpenFix = (issue: CriticalIssueSummary) => {
    if (!onOpenAiFix) return;
    // Find matching item in audit report
    const match =
      report.items.find((i) => i.id === issue.id) ||
      report.items.find(
        (i) => i.title.toLowerCase().includes(issue.title.toLowerCase()) || issue.title.toLowerCase().includes(i.title.toLowerCase())
      ) ||
      report.items.find((i) => i.category === issue.category && i.severity === 'critical') ||
      report.items[0];

    if (match) {
      onOpenAiFix(match);
    }
  };

  return (
    <div className="w-full border-2 border-[#141414] bg-white shadow-[6px_6px_0px_#141414] text-[#141414] font-mono transition-all">
      {/* Panel Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#141414] p-4 bg-[#E4E3E0]">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center border-2 border-[#141414] bg-amber-400 text-[#141414] shadow-[2px_2px_0px_#141414] shrink-0">
            <Sparkles className="h-5 w-5 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm sm:text-base font-black uppercase tracking-tight text-[#141414]">
                Strategic Executive Summary
              </h2>
              <span className="inline-flex items-center gap-1 bg-[#141414] text-amber-300 text-[10px] px-2 py-0.5 font-black border border-[#141414]">
                GEMINI 3.8 FLASH
              </span>
              {summaryData?.strategicVerdict && (
                <span className="hidden md:inline-flex bg-white text-[#141414] border border-[#141414] text-[10px] px-2 py-0.5 font-bold">
                  {summaryData.strategicVerdict.toUpperCase()}
                </span>
              )}
            </div>
            <p className="text-[11px] text-[#141414]/70 mt-0.5">
              Natural language analysis highlighting the Top 3 critical issues and recommended remediation roadmap
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Tone Selector */}
          <div className="flex border border-[#141414] bg-white text-[10px] font-bold">
            <button
              type="button"
              onClick={() => handleToneChange('executive')}
              className={`px-2 py-1 cursor-pointer transition-colors ${
                tone === 'executive'
                  ? 'bg-[#141414] text-white'
                  : 'text-[#141414] hover:bg-neutral-100'
              }`}
            >
              C-LEVEL
            </button>
            <button
              type="button"
              onClick={() => handleToneChange('technical')}
              className={`px-2 py-1 cursor-pointer transition-colors ${
                tone === 'technical'
                  ? 'bg-[#141414] text-white'
                  : 'text-[#141414] hover:bg-neutral-100'
              }`}
            >
              TECHNICAL
            </button>
          </div>

          {/* Regenerate Button */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => fetchExecutiveSummary(tone)}
            title="Regenerate executive summary with Gemini AI"
            className="flex items-center gap-1.5 border border-[#141414] bg-white px-2.5 py-1 text-xs font-bold hover:bg-[#141414] hover:text-white shadow-[2px_2px_0px_#141414] transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isLoading ? 'GENERATING...' : 'REGENERATE'}</span>
          </button>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 border border-[#141414] bg-white px-2.5 py-1 text-xs font-bold hover:bg-[#141414] hover:text-white shadow-[2px_2px_0px_#141414] transition-all cursor-pointer"
          >
            {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="hidden md:inline">{isCopied ? 'COPIED!' : 'COPY'}</span>
          </button>

          {/* Collapse/Expand Toggle */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="border border-[#141414] p-1 bg-white hover:bg-neutral-200 cursor-pointer"
            title={isCollapsed ? 'Expand panel' : 'Collapse panel'}
          >
            {isCollapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Main Body */}
      {!isCollapsed && (
        <div className="p-5 sm:p-6 space-y-6">
          {/* Loading Skeleton */}
          {isLoading && !summaryData && (
            <div className="py-12 text-center space-y-3">
              <Sparkles className="h-8 w-8 text-amber-500 animate-spin mx-auto" />
              <p className="text-xs font-bold text-[#141414]/80 uppercase">
                Gemini 3.8 Flash is synthesizing audit findings and computing priorities...
              </p>
            </div>
          )}

          {/* Natural Language Narrative Overview */}
          {summaryData && (
            <div className="space-y-6">
              {/* Executive Overview Narrative Box */}
              <div className="border-2 border-[#141414] bg-[#E4E3E0]/40 p-4 sm:p-5 shadow-[2px_2px_0px_#141414] space-y-3">
                <div className="flex items-center justify-between border-b border-[#141414]/20 pb-2">
                  <span className="text-xs font-black uppercase flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-[#141414]" />
                    Executive Diagnostic Overview ({tone === 'executive' ? 'Business & ROI Focus' : 'Architecture & Infra Focus'})
                  </span>
                  <span className="text-[10px] font-bold bg-[#141414] text-white px-2 py-0.5">
                    OVERALL SCORE: {summaryData.overallScore}/100 [{summaryData.overallGrade}]
                  </span>
                </div>

                <p className="text-xs sm:text-sm leading-relaxed text-[#141414] whitespace-pre-line font-mono">
                  {summaryData.executiveOverview}
                </p>

                {/* C-Level Bullet Highlights */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 pt-2 border-t border-[#141414]/20">
                  {summaryData.cLevelHighlights.map((hl, idx) => (
                    <div
                      key={idx}
                      className="border border-[#141414] bg-white p-2.5 text-[11px] font-bold text-[#141414] shadow-[1px_1px_0px_#141414]"
                    >
                      <span className="text-amber-600 block mb-1">▪ KEY TAKEAWAY {idx + 1}</span>
                      <p className="font-mono text-[#141414]/80 leading-normal">{hl}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* TOP 3 MOST CRITICAL ISSUES */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b-2 border-[#141414] pb-2">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-rose-600 stroke-[2.5]" />
                    <h3 className="text-sm font-black uppercase text-[#141414]">
                      Top 3 Most Critical Issues Identified
                    </h3>
                  </div>
                  <span className="text-[10px] font-black bg-rose-100 text-rose-950 border border-rose-800 px-2 py-0.5">
                    PRIORITY ACTION
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  {summaryData.top3CriticalIssues.map((issue) => (
                    <div
                      key={issue.rank}
                      className="border-2 border-[#141414] bg-white p-4 shadow-[4px_4px_0px_#141414] flex flex-col justify-between space-y-3 relative overflow-hidden"
                    >
                      {/* Top Rank Badge */}
                      <div className="flex items-center justify-between border-b border-[#141414]/20 pb-2">
                        <span className="inline-flex items-center gap-1 bg-[#141414] text-white px-2 py-0.5 text-[10px] font-black">
                          #{issue.rank} HIGHEST IMPACT
                        </span>
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.2 border uppercase ${
                            issue.urgency === 'Immediate' || issue.urgency === 'Imediata'
                              ? 'bg-rose-100 text-rose-950 border-rose-700'
                              : 'bg-amber-100 text-amber-950 border-amber-700'
                          }`}
                        >
                          URGENCY: {issue.urgency}
                        </span>
                      </div>

                      {/* Title & Category */}
                      <div>
                        <span className="text-[10px] font-bold text-[#141414]/60 uppercase block">
                          PILLAR: {issue.category.toUpperCase()}
                        </span>
                        <h4 className="font-black text-xs sm:text-sm text-[#141414] mt-0.5 leading-snug">
                          {issue.title}
                        </h4>
                      </div>

                      {/* Business Impact */}
                      <div className="border border-[#141414] bg-rose-50/60 p-2.5 text-[11px] space-y-1">
                        <strong className="text-rose-900 font-bold block text-[10px] uppercase flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          Business Impact & Risk:
                        </strong>
                        <p className="text-rose-950/90 leading-relaxed">
                          {issue.businessImpact}
                        </p>
                      </div>

                      {/* Technical Root Cause */}
                      <div className="border border-[#141414] bg-[#E4E3E0] p-2.5 text-[11px] space-y-1">
                        <strong className="text-[#141414] font-bold block text-[10px] uppercase flex items-center gap-1">
                          <Wrench className="h-3 w-3" />
                          Technical Root Cause:
                        </strong>
                        <p className="text-[#141414]/80 leading-relaxed font-mono">
                          {issue.technicalRootCause}
                        </p>
                      </div>

                      {/* Suggested Quick Action & Fix Trigger */}
                      <div className="pt-2 border-t border-[#141414]/20 flex flex-col gap-2">
                        <div className="text-[10px] text-[#141414]/70">
                          <strong>Suggested fix:</strong> {issue.suggestedQuickAction}
                        </div>

                        {onOpenAiFix && (
                          <button
                            type="button"
                            onClick={() => handleFindAndOpenFix(issue)}
                            className="w-full flex items-center justify-center gap-1.5 border-2 border-[#141414] bg-amber-400 hover:bg-amber-300 py-1.5 font-black text-xs text-[#141414] shadow-[2px_2px_0px_#141414] transition-all cursor-pointer"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>VIEW AI FIX GUIDE</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* PRIORITY REMEDIATION ROADMAP */}
              <div className="space-y-3">
                <div className="flex items-center justify-between border-b-2 border-[#141414] pb-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-emerald-700 stroke-[2.5]" />
                    <h3 className="text-sm font-black uppercase text-[#141414]">
                      Recommended Priority Remediation Roadmap
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold bg-[#E4E3E0] px-2 py-0.5 border border-[#141414]">
                    3 IMPLEMENTATION PHASES
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {summaryData.priorityRoadmap.map((phase, idx) => (
                    <div
                      key={idx}
                      className="border-2 border-[#141414] bg-white p-4 shadow-[4px_4px_0px_#141414] flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between border-b border-[#141414]/20 pb-1.5 mb-2">
                          <span className="text-[10px] font-black uppercase bg-[#141414] text-white px-2 py-0.5">
                            {phase.phase}
                          </span>
                          <span className="text-[10px] font-bold text-[#141414]/70">
                            {phase.timeframe}
                          </span>
                        </div>

                        <h4 className="font-black text-xs uppercase text-[#141414] mb-2">
                          {phase.title}
                        </h4>

                        <ul className="space-y-1.5 text-xs text-[#141414]/85">
                          {phase.actions.map((act, aIdx) => (
                            <li key={aIdx} className="flex items-start gap-1.5">
                              <span className="text-emerald-700 font-bold shrink-0">✓</span>
                              <span className="leading-snug">{act}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="border-t border-[#141414]/20 pt-2 flex items-center justify-between text-[11px] font-bold">
                        <span className="text-[#141414]/70">Expected Boost:</span>
                        <span className="text-emerald-800 bg-emerald-100 border border-emerald-700 px-2 py-0.5">
                          {phase.expectedScoreBoost}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* ROI & Business Risk Analysis */}
              <div className="border-2 border-[#141414] bg-white p-4 shadow-[2px_2px_0px_#141414] grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div className="border border-[#141414] p-3 bg-neutral-50 space-y-1">
                  <span className="font-bold text-[10px] uppercase text-emerald-800 block">
                    1. Conversion Opportunity:
                  </span>
                  <p className="text-[11px] text-[#141414]/80 leading-relaxed">
                    {summaryData.roiAndBusinessRiskAnalysis.conversionOpportunity}
                  </p>
                </div>

                <div className="border border-[#141414] p-3 bg-neutral-50 space-y-1">
                  <span className="font-bold text-[10px] uppercase text-rose-800 block">
                    2. Security Exposure Risk:
                  </span>
                  <p className="text-[11px] text-[#141414]/80 leading-relaxed">
                    {summaryData.roiAndBusinessRiskAnalysis.securityExposureRisk}
                  </p>
                </div>

                <div className="border border-[#141414] p-3 bg-neutral-50 space-y-1">
                  <span className="font-bold text-[10px] uppercase text-blue-800 block">
                    3. Organic Search Visibility (SEO):
                  </span>
                  <p className="text-[11px] text-[#141414]/80 leading-relaxed">
                    {summaryData.roiAndBusinessRiskAnalysis.seoVisibilityImpact}
                  </p>
                </div>
              </div>

              {/* Action Plan Drawer Shortcut */}
              {onOpenActionPlan && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-[#141414] bg-[#E4E3E0] p-3 text-xs">
                  <div className="flex items-center gap-2">
                    <Zap className="h-4 w-4 text-[#141414]" />
                    <span className="font-bold">
                      Want to track resolution of all issues in an interactive checklist?
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenActionPlan}
                    className="flex items-center justify-center gap-1.5 border border-[#141414] bg-[#141414] text-white px-3 py-1 font-bold hover:bg-neutral-800 shadow-[2px_2px_0px_#888888] cursor-pointer shrink-0"
                  >
                    <span>OPEN FULL CHECKLIST</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Helper for local client fallback
function generateClientFallback(
  report: AuditReport,
  tone: 'executive' | 'technical'
): ReportExecutiveSummaryResponse {
  const hostname = new URL(report.targetUrl).hostname;
  const criticalItems = report.items
    .filter((i) => i.severity === 'critical')
    .sort((a, b) => a.score - b.score);
  const warningItems = report.items
    .filter((i) => i.severity === 'warning')
    .sort((a, b) => a.score - b.score);

  const topCandidates = [...criticalItems, ...warningItems].slice(0, 3);
  if (topCandidates.length < 3) {
    const remaining = report.items
      .filter((i) => !topCandidates.some((c) => c.id === i.id))
      .sort((a, b) => a.score - b.score)
      .slice(0, 3 - topCandidates.length);
    topCandidates.push(...remaining);
  }

  const top3CriticalIssues: CriticalIssueSummary[] = topCandidates.map((item, idx) => ({
    rank: idx + 1,
    id: item.id,
    title: item.title,
    category: item.category,
    severity: item.severity,
    score: item.score,
    businessImpact:
      item.impact ||
      'May introduce cybersecurity vulnerabilities, Google search ranking penalties, or visitor drop-off.',
    technicalRootCause: item.summary || 'Recommended directive was missing or incompletely configured in headers/DOM.',
    urgency: idx === 0 ? 'Immediate' : idx === 1 ? 'High' : 'Medium',
    suggestedQuickAction: item.recommendedValue || 'Adjust response headers or recommended HTML meta tags.',
  }));

  return {
    targetUrl: report.targetUrl,
    analyzedAt: new Date().toISOString(),
    overallScore: report.overallScore,
    overallGrade: report.overallGrade,
    strategicVerdict:
      report.overallScore >= 80 ? 'Strong Baseline with Targeted Fixes' : 'Immediate Remediation Action Required',
    executiveOverview:
      tone === 'executive'
        ? `The technical audit on ${hostname} achieved an overall score of ${report.overallScore}/100 (Grade ${report.overallGrade}). The infrastructure demonstrates solid core responsiveness, but we identified high-impact vulnerabilities in security and performance that compromise conversion rates and brand reputation. Following the priority roadmap below allows reaching the excellence tier with few development hours.`
        : `Technical probe on host ${hostname} recorded an overall score of ${report.overallScore}/100. Measured server response latency (TTFB) was ${report.rawData.responseTimeMs}ms. The primary technical offenders concentrate in missing security headers and potential initial DOM bottlenecks. We recommend a 3-phase execution for edge hardening and main thread liberation.`,
    cLevelHighlights: [
      `Consolidated score at ${report.overallScore}/100 [Grade ${report.overallGrade}].`,
      `${criticalItems.length} critical severity issue(s) require intervention.`,
      `Improvement potential of up to +${Math.min(18, 100 - report.overallScore)} points on overall quality index.`,
      `Estimated implementation turnaround time: under 2 engineering hours.`,
    ],
    top3CriticalIssues,
    priorityRoadmap: [
      {
        phase: 'Phase 1: Immediate Fixes',
        title: 'Edge Hardening & Security Headers',
        timeframe: '0 to 24 hours',
        actions: ['Configure HSTS and Content-Security-Policy', 'Apply clickjacking protection (X-Frame-Options)'],
        expectedScoreBoost: '+8 to +12 pts',
        estimatedEffort: '15 to 30 min',
      },
      {
        phase: 'Phase 2: Structural Optimization',
        title: 'Search Visibility & Structured Data',
        timeframe: '1 to 3 days',
        actions: ['Add Schema.org JSON-LD structured data', 'Optimize title and meta description for SERP CTR'],
        expectedScoreBoost: '+5 to +8 pts',
        estimatedEffort: '1 to 2 hours',
      },
      {
        phase: 'Phase 3: Continuous Refinement',
        title: 'Performance & Monitoring',
        timeframe: '1 to 2 weeks',
        actions: ['Convert images to WebP and apply lazy loading', 'Configure continuous monitoring webhooks'],
        expectedScoreBoost: '+4 to +6 pts',
        estimatedEffort: '2 to 4 hours',
      },
    ],
    roiAndBusinessRiskAnalysis: {
      conversionOpportunity:
        'Faster initial page rendering curbs visitor drop-off and boosts commercial conversion rates.',
      securityExposureRisk:
        'Missing defensive headers widens the attack surface for automated web exploits and script injections.',
      seoVisibilityImpact:
        'Fixing meta tags and structured data secures richer presentation and higher click-through on Google.',
    },
  };
}
