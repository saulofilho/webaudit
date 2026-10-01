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
          throw new Error(`Falha ao contactar servidor (${res.status})`);
        }

        const data: ReportExecutiveSummaryResponse = await res.json();
        setSummaryData(data);
      } catch (err: any) {
        console.warn('Erro ao chamar /api/gemini/summary:', err);
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
          `${iss.rank}. [${iss.urgency.toUpperCase()}] ${iss.title}\n   - Impacto: ${iss.businessImpact}\n   - Causa Técnica: ${iss.technicalRootCause}\n   - Ação Rápida: ${iss.suggestedQuickAction}`
      )
      .join('\n\n');

    const roadmapText = summaryData.priorityRoadmap
      .map(
        (r) =>
          `* ${r.phase} (${r.timeframe}) - Ganho Estimado: ${r.expectedScoreBoost}\n  ${r.actions.map((a) => `  - ${a}`).join('\n')}`
      )
      .join('\n');

    const fullText = [
      `=== SUMÁRIO EXECUTIVO DA AUDITORIA // WEBAUDIT PRO ===`,
      `Website: ${summaryData.targetUrl}`,
      `Score Geral: ${summaryData.overallScore}/100 [Grade ${summaryData.overallGrade}]`,
      `Veredito Estratégico: ${summaryData.strategicVerdict}`,
      '',
      `VISÃO GERAL:`,
      summaryData.executiveOverview,
      '',
      `DESTAQUES C-LEVEL:`,
      summaryData.cLevelHighlights.map((h) => `• ${h}`).join('\n'),
      '',
      `TOP 3 PROBLEMAS MAIS CRÍTICOS:`,
      issuesText,
      '',
      `ORDEM DE PRIORIDADE DE REMEDIAÇÃO:`,
      roadmapText,
      '',
      `ANÁLISE DE ROI & RISCO:`,
      `• Conversão: ${summaryData.roiAndBusinessRiskAnalysis.conversionOpportunity}`,
      `• Segurança: ${summaryData.roiAndBusinessRiskAnalysis.securityExposureRisk}`,
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
                Sumário Executivo Estratégico
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
              Análise em linguagem natural com destaque para os Top 3 problemas críticos e ordem de remediação recomendada
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
              TÉCNICO
            </button>
          </div>

          {/* Regenerate Button */}
          <button
            type="button"
            disabled={isLoading}
            onClick={() => fetchExecutiveSummary(tone)}
            title="Regenerar sumário executivo com Gemini AI"
            className="flex items-center gap-1.5 border border-[#141414] bg-white px-2.5 py-1 text-xs font-bold hover:bg-[#141414] hover:text-white shadow-[2px_2px_0px_#141414] transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">{isLoading ? 'GERANDO...' : 'REGENERAR'}</span>
          </button>

          {/* Copy Button */}
          <button
            type="button"
            onClick={handleCopySummary}
            className="flex items-center gap-1.5 border border-[#141414] bg-white px-2.5 py-1 text-xs font-bold hover:bg-[#141414] hover:text-white shadow-[2px_2px_0px_#141414] transition-all cursor-pointer"
          >
            {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            <span className="hidden md:inline">{isCopied ? 'COPIADO!' : 'COPIAR'}</span>
          </button>

          {/* Collapse/Expand Toggle */}
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="border border-[#141414] p-1 bg-white hover:bg-neutral-200 cursor-pointer"
            title={isCollapsed ? 'Expandir painel' : 'Recolher painel'}
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
                O Gemini 3.8 Flash está sintetizando os dados da auditoria e calculando a priorização...
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
                    Visão Geral do Diagnóstico Executivo ({tone === 'executive' ? 'Foco em Negócio & ROI' : 'Foco em Arquitetura & Infraestrutura'})
                  </span>
                  <span className="text-[10px] font-bold bg-[#141414] text-white px-2 py-0.5">
                    SCORE GERAL: {summaryData.overallScore}/100 [{summaryData.overallGrade}]
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
                      <span className="text-amber-600 block mb-1">▪ PONTO-CHAVE {idx + 1}</span>
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
                      Top 3 Problemas Mais Críticos Identificados
                    </h3>
                  </div>
                  <span className="text-[10px] font-black bg-rose-100 text-rose-950 border border-rose-800 px-2 py-0.5">
                    AÇÃO PRIORITÁRIA
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
                          #{issue.rank} MAIOR IMPACTO
                        </span>
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.2 border uppercase ${
                            issue.urgency === 'Imediata'
                              ? 'bg-rose-100 text-rose-950 border-rose-700'
                              : 'bg-amber-100 text-amber-950 border-amber-700'
                          }`}
                        >
                          URGÊNCIA: {issue.urgency}
                        </span>
                      </div>

                      {/* Title & Category */}
                      <div>
                        <span className="text-[10px] font-bold text-[#141414]/60 uppercase block">
                          PILAR: {issue.category.toUpperCase()}
                        </span>
                        <h4 className="font-black text-xs sm:text-sm text-[#141414] mt-0.5 leading-snug">
                          {issue.title}
                        </h4>
                      </div>

                      {/* Business Impact */}
                      <div className="border border-[#141414] bg-rose-50/60 p-2.5 text-[11px] space-y-1">
                        <strong className="text-rose-900 font-bold block text-[10px] uppercase flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          Impacto no Negócio / Risco:
                        </strong>
                        <p className="text-rose-950/90 leading-relaxed">
                          {issue.businessImpact}
                        </p>
                      </div>

                      {/* Technical Root Cause */}
                      <div className="border border-[#141414] bg-[#E4E3E0] p-2.5 text-[11px] space-y-1">
                        <strong className="text-[#141414] font-bold block text-[10px] uppercase flex items-center gap-1">
                          <Wrench className="h-3 w-3" />
                          Causa Técnica Raiz:
                        </strong>
                        <p className="text-[#141414]/80 leading-relaxed font-mono">
                          {issue.technicalRootCause}
                        </p>
                      </div>

                      {/* Suggested Quick Action & Fix Trigger */}
                      <div className="pt-2 border-t border-[#141414]/20 flex flex-col gap-2">
                        <div className="text-[10px] text-[#141414]/70">
                          <strong>Solução sugerida:</strong> {issue.suggestedQuickAction}
                        </div>

                        {onOpenAiFix && (
                          <button
                            type="button"
                            onClick={() => handleFindAndOpenFix(issue)}
                            className="w-full flex items-center justify-center gap-1.5 border-2 border-[#141414] bg-amber-400 hover:bg-amber-300 py-1.5 font-black text-xs text-[#141414] shadow-[2px_2px_0px_#141414] transition-all cursor-pointer"
                          >
                            <Sparkles className="h-3.5 w-3.5" />
                            <span>VER GUIA DE CORREÇÃO COM IA</span>
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
                      Ordem de Prioridade Recomendada para Correção
                    </h3>
                  </div>
                  <span className="text-[10px] font-bold bg-[#E4E3E0] px-2 py-0.5 border border-[#141414]">
                    3 FASES DE IMPLEMENTAÇÃO
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
                        <span className="text-[#141414]/70">Ganho Estimado:</span>
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
                    1. Oportunidade de Conversão:
                  </span>
                  <p className="text-[11px] text-[#141414]/80 leading-relaxed">
                    {summaryData.roiAndBusinessRiskAnalysis.conversionOpportunity}
                  </p>
                </div>

                <div className="border border-[#141414] p-3 bg-neutral-50 space-y-1">
                  <span className="font-bold text-[10px] uppercase text-rose-800 block">
                    2. Risco de Exposição de Segurança:
                  </span>
                  <p className="text-[11px] text-[#141414]/80 leading-relaxed">
                    {summaryData.roiAndBusinessRiskAnalysis.securityExposureRisk}
                  </p>
                </div>

                <div className="border border-[#141414] p-3 bg-neutral-50 space-y-1">
                  <span className="font-bold text-[10px] uppercase text-blue-800 block">
                    3. Visibilidade Orgânica (SEO):
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
                      Deseja acompanhar a resolução de todas as pendências em um checklist interativo?
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenActionPlan}
                    className="flex items-center justify-center gap-1.5 border border-[#141414] bg-[#141414] text-white px-3 py-1 font-bold hover:bg-neutral-800 shadow-[2px_2px_0px_#888888] cursor-pointer shrink-0"
                  >
                    <span>ABRIR CHECKLIST COMPLETO</span>
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
      'Pode causar vulnerabilidade cibernética, penalização no ranking do Google ou abandono de visitantes.',
    technicalRootCause: item.summary || 'Diretiva recomendada não encontrada ou configurada de modo incompleto.',
    urgency: idx === 0 ? 'Imediata' : idx === 1 ? 'Alta' : 'Média',
    suggestedQuickAction: item.recommendedValue || 'Ajustar cabeçalhos de resposta ou meta tags recomendadas.',
  }));

  return {
    targetUrl: report.targetUrl,
    analyzedAt: new Date().toISOString(),
    overallScore: report.overallScore,
    overallGrade: report.overallGrade,
    strategicVerdict:
      report.overallScore >= 80 ? 'Boa Postura com Ajustes Pontuais' : 'Ações Imediatas de Remediação Necessárias',
    executiveOverview:
      tone === 'executive'
        ? `A auditoria no domínio ${hostname} alcançou nota global de ${report.overallScore}/100 (Grade ${report.overallGrade}). A infraestrutura apresenta estabilidade consistente, mas detectamos vulnerabilidades de alto impacto em segurança e velocidade que comprometem as taxas de conversão e a reputação da marca. Seguir o roteiro prioritário abaixo permite atingir a faixa de excelência com poucas horas de esforço de desenvolvimento.`
        : `O scan técnico no host ${hostname} consolidou pontuação de ${report.overallScore}/100. A latência TTFB aferida foi de ${report.rawData.responseTimeMs}ms. Os três ofensores mais críticos concentram-se em cabeçalhos ausentes e potenciais gargalos no DOM inicial. Recomendamos a execução em 3 etapas para blindagem de borda e liberação da thread principal.`,
    cLevelHighlights: [
      `Score consolidado em ${report.overallScore}/100 [Classificação ${report.overallGrade}].`,
      `${criticalItems.length} problema(s) com severidade crítica necessitam intervenção.`,
      `Potencial de melhoria de até +${Math.min(18, 100 - report.overallScore)} pontos no índice de qualidade.`,
      `Tempo estimado de implementação das principais correções: menos de 2 horas.`,
    ],
    top3CriticalIssues,
    priorityRoadmap: [
      {
        phase: 'Fase 1: Correções Imediatas',
        title: 'Blindagem de Segurança e Headers',
        timeframe: '0 a 24 horas',
        actions: ['Configurar HSTS e Content-Security-Policy', 'Aplicar proteção contra clickjacking (X-Frame-Options)'],
        expectedScoreBoost: '+8 a +12 pts',
        estimatedEffort: '15 a 30 min',
      },
      {
        phase: 'Fase 2: Otimização Estrutural',
        title: 'SEO On-Page e Metadados',
        timeframe: '1 a 3 dias',
        actions: ['Adicionar dados estruturados JSON-LD', 'Otimizar title e meta description para CTR'],
        expectedScoreBoost: '+5 a +8 pts',
        estimatedEffort: '1 a 2 horas',
      },
      {
        phase: 'Fase 3: Refinamento Contínuo',
        title: 'Performance e Monitoramento',
        timeframe: '1 a 2 semanas',
        actions: ['Converter imagens para WebP e aplicar lazy loading', 'Configurar webhooks de monitoramento contínuo'],
        expectedScoreBoost: '+4 a +6 pts',
        estimatedEffort: '2 a 4 horas',
      },
    ],
    roiAndBusinessRiskAnalysis: {
      conversionOpportunity:
        'A aceleração da resposta inicial da página reduz o abandono do usuário e impulsiona a conversão comercial.',
      securityExposureRisk:
        'A falta de cabeçalhos de segurança eleva a superfície de ataques automatizados contra o site.',
      seoVisibilityImpact:
        'A correção de títulos e dados estruturados garante maior destaque visual nos resultados do Google.',
    },
  };
}
