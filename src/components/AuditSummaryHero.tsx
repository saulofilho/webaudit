import React, { useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Sparkles,
  Clock,
  FileCode,
  CheckCircle,
  AlertTriangle,
  ExternalLink,
  RefreshCw,
  Printer,
  Download,
  Terminal,
  Cpu,
  ListTodo,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  ArrowRight,
  Search,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AuditReport, SavedAuditSummary } from '../types';
import { formatDate, formatShortDate, formatBytes } from '../utils/formatters';

interface AuditSummaryHeroProps {
  report: AuditReport;
  onReAnalyze: () => void;
  onExport: () => void;
  onOpenActionPlan?: () => void;
  onOpenSeoChecklist?: () => void;
  pendingActionCount?: number;
  previousAudit?: SavedAuditSummary | null;
  onViewTrends?: () => void;
}

export const AuditSummaryHero: React.FC<AuditSummaryHeroProps> = ({
  report,
  onReAnalyze,
  onExport,
  onOpenActionPlan,
  onOpenSeoChecklist,
  pendingActionCount = 0,
  previousAudit,
  onViewTrends,
}) => {
  const isHighscore = report.overallScore >= 90;

  useEffect(() => {
    if (isHighscore) {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#141414', '#10b981', '#06b6d4'],
      });
    }
  }, [report.id, isHighscore]);

  const evolution = useMemo(() => {
    if (!previousAudit) return null;

    const diff = report.overallScore - previousAudit.overallScore;
    const absDiff = Math.abs(diff);
    const sign = diff > 0 ? '+' : diff < 0 ? '-' : '';
    // Percentage points diff on 0-100 score scale (ex: '+5% desde 24/05')
    const formattedPercent = `${sign}${absDiff}%`;
    const formattedDate = formatShortDate(previousAudit.analyzedAt);

    // Pillar deltas
    const secDiff = report.categories.security.score - previousAudit.securityScore;
    const seoDiff = report.categories.seo.score - previousAudit.seoScore;
    const bpDiff = report.categories.best_practices.score - previousAudit.bestPracticesScore;
    const perfDiff = report.categories.performance_accessibility.score - previousAudit.perfScore;

    return {
      diff,
      absDiff,
      sign,
      formattedPercent,
      formattedDate,
      fullPreviousDate: formatDate(previousAudit.analyzedAt),
      previousScore: previousAudit.overallScore,
      previousGrade: previousAudit.overallGrade,
      currentScore: report.overallScore,
      currentGrade: report.overallGrade,
      secDiff,
      seoDiff,
      bpDiff,
      perfDiff,
    };
  }, [report, previousAudit]);

  const getPillarDiffColor = (diff: number) => {
    if (diff > 0) return 'text-emerald-700 font-black';
    if (diff < 0) return 'text-rose-700 font-black';
    return 'text-zinc-600 font-bold';
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'stroke-emerald-600';
    if (score >= 75) return 'stroke-[#141414]';
    if (score >= 60) return 'stroke-amber-600';
    return 'stroke-rose-600';
  };

  const getGradeBadgeClass = (grade: string) => {
    if (grade.startsWith('A')) return 'bg-emerald-600 text-white border-[#141414]';
    if (grade === 'B') return 'bg-[#141414] text-[#E4E3E0] border-[#141414]';
    if (grade === 'C') return 'bg-amber-600 text-white border-[#141414]';
    return 'bg-rose-600 text-white border-[#141414]';
  };

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (report.overallScore / 100) * circumference;
  const urlObj = new URL(report.targetUrl);

  return (
    <div className="w-full bg-white border-2 border-[#141414] p-5 sm:p-7 shadow-[4px_4px_0px_#141414] text-[#141414]">
      {/* Top Bar: URL, Status badges, and quick actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b-2 border-[#141414]">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5 font-mono text-xs">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 font-bold border ${
              report.targetUrl.startsWith('https://')
                ? 'bg-emerald-100 text-emerald-950 border-emerald-700'
                : 'bg-rose-100 text-rose-950 border-rose-700'
            }`}>
              {report.targetUrl.startsWith('https://') ? <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" /> : <ShieldAlert className="h-3.5 w-3.5 text-rose-700" />}
              {report.targetUrl.startsWith('https://') ? 'PROTOCOLO HTTPS VÁLIDO' : 'INSEGURO (HTTP SIMPLES)'}
            </span>

            <span className="text-[#141414]/70 bg-[#E4E3E0] px-2 py-0.5 border border-[#141414]">
              TIMESTAMP: <strong>{formatDate(report.analyzedAt)}</strong>
            </span>

            {/* Quick evolution badge in header bar */}
            {evolution && (
              <button
                type="button"
                onClick={onViewTrends}
                title={`Comparado com auditoria anterior de ${evolution.fullPreviousDate} (${evolution.previousScore} pts). Clique para ver histórico.`}
                className={`inline-flex items-center gap-1.5 px-2 py-0.5 font-bold border transition-transform hover:scale-102 cursor-pointer shadow-[1px_1px_0px_#141414] ${
                  evolution.diff > 0
                    ? 'bg-emerald-100 text-emerald-950 border-emerald-700'
                    : evolution.diff < 0
                    ? 'bg-rose-100 text-rose-950 border-rose-700'
                    : 'bg-[#E4E3E0] text-[#141414] border-[#141414]'
                }`}
              >
                {evolution.diff > 0 ? (
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-700 stroke-[2.5]" />
                ) : evolution.diff < 0 ? (
                  <TrendingDown className="h-3.5 w-3.5 text-rose-700 stroke-[2.5]" />
                ) : (
                  <Minus className="h-3.5 w-3.5 text-zinc-600 stroke-[2.5]" />
                )}
                <span>
                  EVOLUÇÃO: <strong>{evolution.formattedPercent} desde {evolution.formattedDate}</strong>
                </span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <h2 className="text-xl sm:text-2xl font-mono font-black text-[#141414] tracking-tight break-all uppercase">
              {urlObj.hostname}
            </h2>
            <a
              href={report.targetUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#141414] hover:opacity-70 p-1 border border-[#141414] bg-[#E4E3E0]"
              title="Abrir site original em nova aba"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
          <p className="text-xs font-mono text-[#141414]/70 mt-0.5 break-all">
            {report.targetUrl}
          </p>
        </div>

        {/* Quick info pills & action buttons */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          <div className="flex items-center gap-1.5 border border-[#141414] bg-[#E4E3E0] px-2.5 py-1 text-[#141414]">
            <Clock className="h-3.5 w-3.5 text-[#141414]" />
            <span>TTFB: <strong>{report.rawData.responseTimeMs}ms</strong></span>
          </div>

          <div className="flex items-center gap-1.5 border border-[#141414] bg-[#E4E3E0] px-2.5 py-1 text-[#141414]">
            <FileCode className="h-3.5 w-3.5 text-[#141414]" />
            <span>DOM: <strong>{formatBytes(report.rawData.contentLengthBytes)}</strong></span>
          </div>

          <button
            id="btn-reanalyze"
            onClick={onReAnalyze}
            className="flex items-center gap-1.5 border border-[#141414] bg-white px-3 py-1 font-bold text-[#141414] hover:bg-[#141414] hover:text-white shadow-[2px_2px_0px_#141414] transition-all cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span>RE-ANALISAR</span>
          </button>

          {onOpenActionPlan && (
            <button
              id="btn-hero-action-plan"
              onClick={onOpenActionPlan}
              className="flex items-center gap-1.5 border-2 border-[#141414] bg-amber-400 px-3 py-1 font-bold text-[#141414] hover:bg-amber-300 shadow-[2px_2px_0px_#141414] transition-all cursor-pointer"
            >
              <ListTodo className="h-3.5 w-3.5 stroke-[2.5]" />
              <span>PLANO DE AÇÃO</span>
              {pendingActionCount > 0 && (
                <span className="bg-[#141414] text-amber-300 text-[10px] px-1 py-0.2 font-black">
                  {pendingActionCount}
                </span>
              )}
            </button>
          )}

          {onOpenSeoChecklist && (
            <button
              id="btn-hero-seo-checklist"
              onClick={onOpenSeoChecklist}
              title="Abrir SEO Quick-Start Checklist com diagnóstico de meta tags e dados estruturados"
              className="flex items-center gap-1.5 border border-[#141414] bg-blue-50 hover:bg-blue-600 hover:text-white px-3 py-1 font-bold text-blue-900 shadow-[2px_2px_0px_#141414] transition-all cursor-pointer"
            >
              <Search className="h-3.5 w-3.5 text-blue-600 group-hover:text-white" />
              <span>CHECKLIST SEO</span>
            </button>
          )}

          <button
            id="btn-export-quick"
            onClick={onExport}
            className="flex items-center gap-1.5 border border-[#141414] bg-[#141414] px-3 py-1 font-bold text-white hover:bg-black shadow-[2px_2px_0px_#888888] transition-all cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>EXPORTAR</span>
          </button>
        </div>
      </div>

      {/* Main Score Grid: Overall Gauge + Score Evolution + AI Diagnosis */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-5 items-start">
        {/* Score Radial Column */}
        <div className="lg:col-span-4 flex flex-col items-center justify-center p-5 bg-[#E4E3E0] border-2 border-[#141414] shadow-[2px_2px_0px_#141414]">
          <div className="relative flex items-center justify-center">
            {/* SVG Circle Gauge */}
            <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-[#CCCCCC]"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                className={`${getScoreColor(report.overallScore)} transition-all duration-1000 ease-out`}
                strokeWidth="10"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="square"
                fill="transparent"
              />
            </svg>

            {/* Inner Score Number & Grade */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className="text-4xl font-mono font-black text-[#141414] tracking-tighter">
                {report.overallScore}
              </span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#141414]/70">
                / 100 PTS
              </span>
            </div>
          </div>

          <div className="mt-3 text-center w-full">
            <div className={`py-1 px-3 font-mono font-black text-xs uppercase border-2 shadow-[2px_2px_0px_#141414] ${getGradeBadgeClass(report.overallGrade)}`}>
              CLASSIFICAÇÃO GERAL: {report.overallGrade}
            </div>
            <p className="text-[11px] font-mono text-[#141414]/70 mt-1.5 uppercase">
              ÍNDICE PONDERADO DE SAÚDE WEB
            </p>
          </div>

          {/* Score de Evolução Card */}
          <div className="mt-3.5 w-full border-2 border-[#141414] bg-white p-3 shadow-[2px_2px_0px_#141414] text-left">
            <div className="flex items-center justify-between border-b border-[#141414]/20 pb-1.5 mb-2">
              <div className="flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5 text-[#141414]" />
                <span className="text-[11px] font-mono font-black uppercase text-[#141414] tracking-wider">
                  Score de Evolução
                </span>
              </div>
              <span className="text-[9px] font-mono text-[#141414]/60 uppercase font-bold">
                {evolution ? 'vs. anterior' : 'Ponto de Partida'}
              </span>
            </div>

            {evolution ? (
              <div className="space-y-2.5">
                {/* Main Highlight Row */}
                <div className="flex items-center justify-between gap-2">
                  <div
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-black border-2 shadow-[1px_1px_0px_#141414] ${
                      evolution.diff > 0
                        ? 'bg-emerald-100 text-emerald-950 border-emerald-700'
                        : evolution.diff < 0
                        ? 'bg-rose-100 text-rose-950 border-rose-700'
                        : 'bg-zinc-100 text-zinc-900 border-zinc-600'
                    }`}
                  >
                    {evolution.diff > 0 ? (
                      <TrendingUp className="h-4 w-4 text-emerald-700 stroke-[2.5]" />
                    ) : evolution.diff < 0 ? (
                      <TrendingDown className="h-4 w-4 text-rose-700 stroke-[2.5]" />
                    ) : (
                      <Minus className="h-4 w-4 text-zinc-600 stroke-[2.5]" />
                    )}
                    <span>{evolution.formattedPercent} desde {evolution.formattedDate}</span>
                  </div>

                  {/* Previous vs Current Score */}
                  <div className="text-right font-mono">
                    <div className="text-[11px] flex items-center justify-end gap-1">
                      <span className="text-[#141414]/60">{evolution.previousScore}</span>
                      <span className="text-[#141414]/40">➔</span>
                      <strong className="text-[#141414] text-xs">{evolution.currentScore}</strong>
                      <span className="text-[9px] text-[#141414]/60">pts</span>
                    </div>
                    <span className="text-[9px] text-[#141414]/60">
                      ({evolution.diff > 0 ? `+${evolution.diff}` : evolution.diff} pts)
                    </span>
                  </div>
                </div>

                {/* Pillar Breakdown */}
                <div className="pt-2 border-t border-[#141414]/15">
                  <div className="text-[9px] font-mono text-[#141414]/70 uppercase font-bold mb-1 flex items-center justify-between">
                    <span>Variação por Pilar:</span>
                    <span className="text-[8px] text-[#141414]/50">PTS</span>
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-[10px] font-mono text-center">
                    <div className="bg-[#E4E3E0] p-1 border border-[#141414]/30" title={`Segurança: ${evolution.secDiff > 0 ? '+' : ''}${evolution.secDiff} pts`}>
                      <div className="text-[8px] text-[#141414]/70 font-bold">SEG</div>
                      <div className={`font-black ${getPillarDiffColor(evolution.secDiff)}`}>
                        {evolution.secDiff > 0 ? `+${evolution.secDiff}` : evolution.secDiff}
                      </div>
                    </div>
                    <div className="bg-[#E4E3E0] p-1 border border-[#141414]/30" title={`SEO: ${evolution.seoDiff > 0 ? '+' : ''}${evolution.seoDiff} pts`}>
                      <div className="text-[8px] text-[#141414]/70 font-bold">SEO</div>
                      <div className={`font-black ${getPillarDiffColor(evolution.seoDiff)}`}>
                        {evolution.seoDiff > 0 ? `+${evolution.seoDiff}` : evolution.seoDiff}
                      </div>
                    </div>
                    <div className="bg-[#E4E3E0] p-1 border border-[#141414]/30" title={`Boas Práticas: ${evolution.bpDiff > 0 ? '+' : ''}${evolution.bpDiff} pts`}>
                      <div className="text-[8px] text-[#141414]/70 font-bold">PRÁT</div>
                      <div className={`font-black ${getPillarDiffColor(evolution.bpDiff)}`}>
                        {evolution.bpDiff > 0 ? `+${evolution.bpDiff}` : evolution.bpDiff}
                      </div>
                    </div>
                    <div className="bg-[#E4E3E0] p-1 border border-[#141414]/30" title={`Performance: ${evolution.perfDiff > 0 ? '+' : ''}${evolution.perfDiff} pts`}>
                      <div className="text-[8px] text-[#141414]/70 font-bold">PERF</div>
                      <div className={`font-black ${getPillarDiffColor(evolution.perfDiff)}`}>
                        {evolution.perfDiff > 0 ? `+${evolution.perfDiff}` : evolution.perfDiff}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer link to trends */}
                {onViewTrends && (
                  <button
                    type="button"
                    onClick={onViewTrends}
                    className="w-full flex items-center justify-center gap-1.5 pt-1.5 text-[10px] font-mono font-bold text-[#141414] hover:text-emerald-800 transition-colors border-t border-[#141414]/10 cursor-pointer"
                  >
                    <TrendingUp className="h-3 w-3" />
                    <span>HISTÓRICO & TENDÊNCIAS COMPLETAS</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="py-1 text-left font-mono">
                <div className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-neutral-100 border border-neutral-400 text-neutral-800 text-[10px] font-bold mb-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 inline-block" />
                  <span>LINHA DE BASE REGISTRADA</span>
                </div>
                <p className="text-[10px] text-[#141414]/70 leading-normal">
                  Esta é a 1ª auditoria para este domínio ({report.overallScore} pts). Re-audite após correções para comparar a evolução.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* AI Executive Summary Column */}
        <div className="lg:col-span-8 flex flex-col justify-between space-y-4">
          <div className="border border-[#141414] bg-[#E4E3E0] p-4">
            <div className="flex items-center gap-2 mb-1.5 border-b border-[#141414]/30 pb-1.5">
              <Sparkles className="h-4 w-4 text-[#141414]" />
              <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[#141414]">
                DIAGNÓSTICO EXECUTIVO // GEMINI 3.7 AI
              </h3>
            </div>
            <p className="text-xs sm:text-sm font-mono text-[#141414] leading-relaxed">
              {report.aiExecutiveSummary}
            </p>
          </div>

          {/* Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Key Strengths */}
            <div className="border border-[#141414] bg-white p-3 shadow-[2px_2px_0px_#141414]">
              <h4 className="flex items-center gap-1.5 text-xs font-mono font-bold text-emerald-800 uppercase tracking-wider mb-2 border-b border-emerald-800/30 pb-1">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-700" />
                Pontos Fortes Identificados
              </h4>
              <ul className="space-y-1 text-xs font-mono text-[#141414]">
                {report.keyStrengths.map((str, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-emerald-700 font-bold">•</span>
                    <span>{str}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Top Priority Fixes */}
            <div className="border border-[#141414] bg-white p-3 shadow-[2px_2px_0px_#141414]">
              <h4 className="flex items-center gap-1.5 text-xs font-mono font-bold text-amber-800 uppercase tracking-wider mb-2 border-b border-amber-800/30 pb-1">
                <AlertTriangle className="h-3.5 w-3.5 text-amber-700" />
                Ações Prioritárias Recomendadas
              </h4>
              <ul className="space-y-1 text-xs font-mono text-[#141414]">
                {report.topPriorityFixes.slice(0, 3).map((fix, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-amber-700 font-bold">•</span>
                    <span className="line-clamp-2">{fix}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
