import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Copy,
  Check,
  Terminal,
  Code2,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ShieldAlert,
  HelpCircle,
  RefreshCw,
  Send,
  ExternalLink,
  Layers,
  FileCode,
  Flame,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AuditItem, SeverityLevel, TechStackItem } from '../types';

interface AIFixStep {
  stepNumber: number;
  title: string;
  description: string;
  filePath?: string;
  code?: string;
  language?: string;
}

interface AICodeOption {
  platform: string;
  title: string;
  language: string;
  filePath?: string;
  code: string;
  explanation: string;
}

interface AIFixData {
  itemId: string;
  itemTitle: string;
  headline: string;
  severity: SeverityLevel;
  category: string;
  targetUrl?: string;
  problemAnalysis: string;
  estimatedTime: string;
  riskLevel: 'Baixo' | 'Médio' | 'Alto';
  riskDescription?: string;
  steps: AIFixStep[];
  codeImplementations: AICodeOption[];
  verificationCommand: string;
  verificationInstructions: string;
  proTips: string[];
  suggestedCommitMessage: string;
}

interface AIFixModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: AuditItem | null;
  targetUrl?: string;
  techStack?: TechStackItem[];
  isCompleted?: boolean;
  onToggleCompleted?: (id: string) => void;
}

const POPULAR_FRAMEWORKS = [
  'Auto-Detectado',
  'Nginx',
  'Apache (.htaccess)',
  'Node.js / Express',
  'Next.js (Vercel)',
  'HTML / Frontend',
  'WordPress / PHP',
  'Cloudflare Rules',
];

export const AIFixModal: React.FC<AIFixModalProps> = ({
  isOpen,
  onClose,
  item,
  targetUrl,
  techStack,
  isCompleted = false,
  onToggleCompleted,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fixData, setFixData] = useState<AIFixData | null>(null);
  const [selectedFramework, setSelectedFramework] = useState<string>('Auto-Detectado');
  const [activeCodeTab, setActiveCodeTab] = useState<number>(0);
  const [copiedCodeIdx, setCopiedCodeIdx] = useState<number | null>(null);
  const [copiedAll, setCopiedAll] = useState<boolean>(false);
  const [copiedCurl, setCopiedCurl] = useState<boolean>(false);
  const [copiedCommit, setCopiedCommit] = useState<boolean>(false);
  
  // Follow-up interaction
  const [userQuery, setUserQuery] = useState<string>('');
  const [isAsking, setIsAsking] = useState<boolean>(false);
  const [customResponses, setCustomResponses] = useState<Array<{ q: string; a: string }>>([]);

  const fetchFix = async (frameworkChoice?: string, customPrompt?: string) => {
    if (!item) return;
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/gemini/fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item,
          targetUrl,
          techStack,
          customFramework: frameworkChoice && frameworkChoice !== 'Auto-Detectado' ? frameworkChoice : undefined,
          userQuestion: customPrompt,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Falha ao se comunicar com o serviço de IA.');
      }

      const data: AIFixData = await res.json();
      setFixData(data);
      setActiveCodeTab(0);
    } catch (err: any) {
      console.error('Failed to fetch AI Fix:', err);
      setError(err.message || 'Ocorreu um erro ao carregar as instruções de correção.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && item) {
      setCustomResponses([]);
      setUserQuery('');
      setSelectedFramework('Auto-Detectado');
      fetchFix('Auto-Detectado');
    } else {
      setFixData(null);
      setError(null);
    }
  }, [isOpen, item?.id]);

  const handleFrameworkChange = (fw: string) => {
    setSelectedFramework(fw);
    fetchFix(fw);
  };

  const handleAskFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userQuery.trim() || isAsking || !item) return;

    const currentQ = userQuery.trim();
    setIsAsking(true);
    setUserQuery('');

    try {
      const res = await fetch('/api/gemini/fix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          item,
          targetUrl,
          techStack,
          customFramework: selectedFramework !== 'Auto-Detectado' ? selectedFramework : undefined,
          userQuestion: currentQ,
        }),
      });

      if (!res.ok) {
        throw new Error('Falha ao obter resposta de acompanhamento.');
      }

      const data: AIFixData = await res.json();
      setCustomResponses((prev) => [
        ...prev,
        {
          q: currentQ,
          a: data.headline + '\n\n' + data.problemAnalysis + '\n\n' + (data.codeImplementations[0]?.code || ''),
        },
      ]);
      // Also update main fix data if new code was returned
      if (data.codeImplementations && data.codeImplementations.length > 0) {
        setFixData(data);
      }
    } catch (err: any) {
      setCustomResponses((prev) => [
        ...prev,
        { q: currentQ, a: 'Desculpe, não foi possível processar a pergunta no momento.' },
      ]);
    } finally {
      setIsAsking(false);
    }
  };

  const handleCopy = (text: string, type: 'code' | 'all' | 'curl' | 'commit', idx?: number) => {
    navigator.clipboard.writeText(text);
    if (type === 'code' && idx !== undefined) {
      setCopiedCodeIdx(idx);
      setTimeout(() => setCopiedCodeIdx(null), 2000);
    } else if (type === 'all') {
      setCopiedAll(true);
      setTimeout(() => setCopiedAll(false), 2000);
    } else if (type === 'curl') {
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    } else if (type === 'commit') {
      setCopiedCommit(true);
      setTimeout(() => setCopiedCommit(false), 2000);
    }
  };

  const generateMarkdownReport = (): string => {
    if (!fixData) return '';
    let md = `# Guia de Correção Técnica: ${fixData.itemTitle}\n`;
    md += `**Website:** ${fixData.targetUrl || 'N/A'}\n`;
    md += `**Severidade:** ${fixData.severity.toUpperCase()} | **Categoria:** ${fixData.category} | **Tempo Estimado:** ${fixData.estimatedTime}\n`;
    md += `**Risco:** ${fixData.riskLevel} - ${fixData.riskDescription || ''}\n\n`;
    md += `## Diagnóstico do Problema\n${fixData.problemAnalysis}\n\n`;
    md += `## Passo a Passo de Implementação\n`;
    fixData.steps.forEach((s) => {
      md += `### Passo ${s.stepNumber}: ${s.title}\n${s.description}\n`;
      if (s.filePath) md += `*Arquivo:* \`${s.filePath}\`\n`;
      if (s.code) md += `\`\`\`${s.language || 'text'}\n${s.code}\n\`\`\`\n`;
      md += `\n`;
    });
    if (fixData.codeImplementations.length > 0) {
      md += `## Implementações por Plataforma\n`;
      fixData.codeImplementations.forEach((impl) => {
        md += `### ${impl.platform} - ${impl.title}\n`;
        if (impl.filePath) md += `*Arquivo:* \`${impl.filePath}\`\n`;
        md += `\`\`\`${impl.language}\n${impl.code}\n\`\`\`\n`;
        md += `${impl.explanation}\n\n`;
      });
    }
    md += `## Validação\n\`\`\`bash\n${fixData.verificationCommand}\n\`\`\`\n${fixData.verificationInstructions}\n\n`;
    md += `## Commit Sugerido\n\`\`\`bash\ngit commit -m "${fixData.suggestedCommitMessage}"\n\`\`\`\n`;
    return md;
  };

  if (!isOpen || !item) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="relative w-full max-w-4xl bg-white border-2 border-[#141414] shadow-[8px_8px_0px_#141414] my-auto max-h-[92vh] flex flex-col font-mono text-[#141414]"
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between p-3.5 sm:p-4 bg-[#141414] text-white border-b-2 border-[#141414] shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="p-1.5 bg-amber-400 text-[#141414] border border-white shrink-0">
                <Sparkles className="h-4 w-4 fill-current" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] sm:text-xs font-black tracking-widest text-amber-300 uppercase">
                    GEMINI 3.7 FLASH // SRE ASSISTANT
                  </span>
                  <span className="hidden sm:inline-block px-1.5 py-0.2 text-[9px] font-bold bg-white/20 text-white uppercase">
                    GUIA DE IMPLEMENTAÇÃO
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-black truncate uppercase text-white mt-0.5">
                  {item.title}
                </h3>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 ml-2">
              {onToggleCompleted && (
                <button
                  type="button"
                  onClick={() => onToggleCompleted(item.id)}
                  className={`hidden sm:flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold uppercase transition-all cursor-pointer border ${
                    isCompleted
                      ? 'bg-emerald-600 text-white border-emerald-400'
                      : 'bg-white/10 text-white hover:bg-white/20 border-white/40'
                  }`}
                  title="Marcar este item como resolvido"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{isCompleted ? 'RESOLVIDO' : 'MARCAR CORRIGIDO'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar modal de correção com IA"
                className="p-1 text-white hover:bg-rose-600 hover:text-white border border-white/30 transition-colors cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Context & Metas Sub-header */}
          <div className="p-3 bg-[#E4E3E0] border-b-2 border-[#141414] flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`px-2 py-0.5 font-bold uppercase border text-[10px] ${
                  item.severity === 'critical'
                    ? 'bg-rose-200 text-rose-900 border-rose-800'
                    : item.severity === 'warning'
                    ? 'bg-amber-200 text-amber-900 border-amber-800'
                    : item.severity === 'good'
                    ? 'bg-emerald-200 text-emerald-900 border-emerald-800'
                    : 'bg-blue-200 text-blue-900 border-blue-800'
                }`}
              >
                {item.severity === 'critical' ? 'CRÍTICO' : item.severity === 'warning' ? 'ALERTA' : 'INFO'}
              </span>

              <span className="px-2 py-0.5 bg-white border border-[#141414] text-[10px] font-bold uppercase text-[#141414]">
                CATEGORIA: {item.category.replace('_', ' ')}
              </span>

              {targetUrl && (
                <span className="hidden md:inline-flex items-center gap-1 px-2 py-0.5 bg-white border border-[#141414] text-[10px] text-[#141414] truncate max-w-xs">
                  <ExternalLink className="h-3 w-3 shrink-0" />
                  <span className="truncate">{targetUrl}</span>
                </span>
              )}
            </div>

            {fixData && (
              <div className="flex items-center gap-3 text-[11px]">
                <div className="flex items-center gap-1 text-[#141414]">
                  <Clock className="h-3.5 w-3.5 text-blue-700" />
                  <span>{fixData.estimatedTime}</span>
                </div>
                <div className="flex items-center gap-1 font-bold">
                  <ShieldAlert
                    className={`h-3.5 w-3.5 ${
                      fixData.riskLevel === 'Alto'
                        ? 'text-rose-700'
                        : fixData.riskLevel === 'Médio'
                        ? 'text-amber-700'
                        : 'text-emerald-700'
                    }`}
                  />
                  <span>RISCO: {fixData.riskLevel.toUpperCase()}</span>
                </div>
              </div>
            )}
          </div>

          {/* Platform / Framework Selector */}
          <div className="px-3.5 py-2 bg-white border-b-2 border-[#141414] overflow-x-auto shrink-0 flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-[#141414]/70 uppercase shrink-0 mr-1 flex items-center gap-1">
              <Layers className="h-3 w-3" /> STACK:
            </span>
            {POPULAR_FRAMEWORKS.map((fw) => (
              <button
                key={fw}
                type="button"
                disabled={loading}
                onClick={() => handleFrameworkChange(fw)}
                className={`px-2 py-0.8 text-[10px] font-bold uppercase transition-all whitespace-nowrap cursor-pointer border ${
                  selectedFramework === fw
                    ? 'bg-[#141414] text-white border-[#141414] shadow-[1px_1px_0px_#888]'
                    : 'bg-[#F2F1ED] text-[#141414] border-[#141414]/40 hover:border-[#141414] hover:bg-[#E4E3E0]'
                }`}
              >
                {fw}
              </button>
            ))}
          </div>

          {/* Modal Body - Scrollable */}
          <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
            {/* Loading State */}
            {loading && (
              <div className="py-12 flex flex-col items-center justify-center space-y-3 text-center border-2 border-dashed border-[#141414] bg-[#F2F1ED]/50 p-6">
                <RefreshCw className="h-7 w-7 animate-spin text-[#141414]" />
                <div>
                  <p className="font-bold text-sm uppercase">Sintetizando Correção Passo a Passo com Gemini 3.7 Flash...</p>
                  <p className="text-xs text-[#141414]/70 mt-1">
                    Analisando {item.title} para a stack {selectedFramework} e formulando instruções de engenharia.
                  </p>
                </div>
              </div>
            )}

            {/* Error State */}
            {error && !loading && (
              <div className="p-4 border-2 border-rose-800 bg-rose-50 text-rose-950 space-y-2">
                <div className="flex items-center gap-2 font-bold uppercase">
                  <AlertCircle className="h-4 w-4 text-rose-700" />
                  <span>Erro ao gerar guia de correção</span>
                </div>
                <p className="text-xs">{error}</p>
                <button
                  type="button"
                  onClick={() => fetchFix(selectedFramework)}
                  className="px-3 py-1 bg-rose-900 text-white font-bold uppercase text-[10px] hover:bg-rose-800 cursor-pointer"
                >
                  Tentar Novamente
                </button>
              </div>
            )}

            {/* Content Display */}
            {fixData && !loading && (
              <>
                {/* Executive Diagnosis Banner */}
                <div className="p-3.5 border-2 border-[#141414] bg-[#F2F1ED] shadow-[2px_2px_0px_#141414] space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="px-1.5 py-0.5 bg-[#141414] text-white text-[9px] font-bold uppercase">
                      DIAGNÓSTICO & IMPACTO
                    </span>
                    <span className="font-bold text-xs uppercase text-[#141414]">
                      {fixData.headline}
                    </span>
                  </div>
                  <p className="text-xs leading-relaxed text-[#141414]/90">
                    {fixData.problemAnalysis}
                  </p>
                  {fixData.riskDescription && (
                    <div className="pt-2 border-t border-[#141414]/20 flex items-start gap-1.5 text-[11px] text-[#141414]/80">
                      <AlertTriangle className="h-3.5 w-3.5 text-amber-700 shrink-0 mt-0.5" />
                      <span>
                        <strong>Aviso de Risco ({fixData.riskLevel}):</strong> {fixData.riskDescription}
                      </span>
                    </div>
                  )}
                </div>

                {/* Primary Code Implementations Carousel/Tabs */}
                {fixData.codeImplementations.length > 0 && (
                  <div className="border-2 border-[#141414] bg-[#141414] text-white shadow-[3px_3px_0px_#888888]">
                    {/* Implementation tabs */}
                    <div className="flex items-center justify-between px-3 py-1.5 bg-[#222222] border-b border-[#333333] overflow-x-auto">
                      <div className="flex items-center gap-1.5">
                        <Code2 className="h-4 w-4 text-amber-400" />
                        <span className="text-[11px] font-bold uppercase tracking-wider text-amber-300 mr-2">
                          CÓDIGO PRONTO:
                        </span>
                        {fixData.codeImplementations.map((impl, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setActiveCodeTab(idx)}
                            className={`px-2 py-0.5 text-[10px] font-bold uppercase transition-colors cursor-pointer border ${
                              activeCodeTab === idx
                                ? 'bg-white text-[#141414] border-white'
                                : 'bg-[#141414] text-[#A0A0A0] border-[#444] hover:text-white'
                            }`}
                          >
                            {impl.platform}
                          </button>
                        ))}
                      </div>

                      {/* Copy snippet button */}
                      <button
                        type="button"
                        onClick={() =>
                          handleCopy(
                            fixData.codeImplementations[activeCodeTab]?.code || '',
                            'code',
                            activeCodeTab
                          )
                        }
                        className="flex items-center gap-1 px-2 py-0.5 bg-[#333] hover:bg-[#555] text-white text-[10px] font-bold uppercase border border-[#666] transition-colors cursor-pointer shrink-0 ml-2"
                      >
                        {copiedCodeIdx === activeCodeTab ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-400">COPIADO</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>COPIAR CÓDIGO</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Active Code Content */}
                    {fixData.codeImplementations[activeCodeTab] && (
                      <div className="p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-2 text-[10px] text-[#A0A0A0] pb-1.5 border-b border-[#333]">
                          <span className="font-bold text-white">
                            {fixData.codeImplementations[activeCodeTab].title}
                          </span>
                          {fixData.codeImplementations[activeCodeTab].filePath && (
                            <span className="bg-[#222] px-2 py-0.5 border border-[#444] text-[#E4E3E0] font-mono">
                              Arquivo: {fixData.codeImplementations[activeCodeTab].filePath}
                            </span>
                          )}
                        </div>

                        <div className="overflow-x-auto bg-[#0a0a0a] p-3 border border-[#333]">
                          <pre className="font-mono text-xs text-emerald-400 leading-relaxed">
                            <code>{fixData.codeImplementations[activeCodeTab].code}</code>
                          </pre>
                        </div>

                        <p className="mt-2 text-[11px] text-[#A0A0A0] leading-normal">
                          {fixData.codeImplementations[activeCodeTab].explanation}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Step-by-Step Instructions */}
                <div className="space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#141414] text-white px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                      PASSO A PASSO GUIADO
                    </span>
                    <span className="text-xs text-[#141414]/60 font-bold uppercase">
                      ({fixData.steps.length} ETAPAS)
                    </span>
                  </div>

                  <div className="space-y-2">
                    {fixData.steps.map((step) => (
                      <div
                        key={step.stepNumber}
                        className="p-3 border-2 border-[#141414] bg-white shadow-[2px_2px_0px_#141414] space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 flex items-center justify-center bg-[#141414] text-white text-[10px] font-black shrink-0">
                              {step.stepNumber}
                            </span>
                            <h4 className="font-black text-xs uppercase text-[#141414]">
                              {step.title}
                            </h4>
                          </div>

                          {step.filePath && (
                            <span className="text-[10px] px-1.5 py-0.5 bg-[#E4E3E0] border border-[#141414] text-[#141414] truncate max-w-xs font-mono">
                              {step.filePath}
                            </span>
                          )}
                        </div>

                        <p className="text-xs text-[#141414]/80 leading-relaxed">
                          {step.description}
                        </p>

                        {step.code && (
                          <div className="bg-[#141414] p-2.5 border border-[#333] text-emerald-400 overflow-x-auto font-mono text-[11px] relative group">
                            <pre>
                              <code>{step.code}</code>
                            </pre>
                            <button
                              type="button"
                              onClick={() => handleCopy(step.code!, 'code', 100 + step.stepNumber)}
                              className="absolute right-2 top-2 px-1.5 py-0.5 bg-[#333] hover:bg-[#555] text-white text-[9px] font-bold uppercase border border-[#555] opacity-80 group-hover:opacity-100 transition-opacity cursor-pointer"
                            >
                              {copiedCodeIdx === 100 + step.stepNumber ? 'COPIADO' : 'COPIAR'}
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Verification Terminal Command */}
                {fixData.verificationCommand && (
                  <div className="border-2 border-[#141414] bg-[#F2F1ED] p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Terminal className="h-4 w-4 text-[#141414]" />
                        <span className="font-black text-xs uppercase tracking-wider text-[#141414]">
                          COMANDO DE VALIDAÇÃO (TERMINAL)
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopy(fixData.verificationCommand, 'curl')}
                        className="flex items-center gap-1 px-2 py-0.5 bg-[#141414] text-white hover:bg-[#333] text-[10px] font-bold uppercase cursor-pointer transition-colors"
                      >
                        {copiedCurl ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" />
                            <span className="text-emerald-400">COPIADO</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" />
                            <span>COPIAR COMANDO</span>
                          </>
                        )}
                      </button>
                    </div>

                    <div className="bg-[#141414] text-amber-300 p-2.5 font-mono text-xs overflow-x-auto border border-[#333]">
                      <code>{fixData.verificationCommand}</code>
                    </div>

                    <p className="text-[11px] text-[#141414]/75">
                      {fixData.verificationInstructions}
                    </p>
                  </div>
                )}

                {/* Git Commit Suggestion & Pro Tips */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Pro Tips */}
                  {fixData.proTips && fixData.proTips.length > 0 && (
                    <div className="p-3 border-2 border-[#141414] bg-white space-y-1.5">
                      <span className="font-bold text-[10px] uppercase text-[#141414] block">
                        DICAS DE ENGENHARIA:
                      </span>
                      <ul className="space-y-1 text-[11px] text-[#141414]/85 list-disc list-inside">
                        {fixData.proTips.map((tip, idx) => (
                          <li key={idx} className="leading-tight">
                            {tip}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Git Commit */}
                  {fixData.suggestedCommitMessage && (
                    <div className="p-3 border-2 border-[#141414] bg-white space-y-1.5 flex flex-col justify-between">
                      <div>
                        <span className="font-bold text-[10px] uppercase text-[#141414] block mb-1">
                          MENSAGEM DE COMMIT SUGERIDA:
                        </span>
                        <code className="text-[11px] bg-[#E4E3E0] p-1.5 border border-[#141414] block text-[#141414] break-all font-mono font-bold">
                          {fixData.suggestedCommitMessage}
                        </code>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopy(fixData.suggestedCommitMessage, 'commit')}
                        className="mt-2 self-start flex items-center gap-1 text-[10px] font-bold uppercase underline cursor-pointer text-[#141414] hover:text-emerald-700"
                      >
                        {copiedCommit ? 'Copiado para a área de transferência!' : 'Copiar mensagem de commit'}
                      </button>
                    </div>
                  )}
                </div>

                {/* Custom Follow-Up Q&A Thread */}
                {customResponses.length > 0 && (
                  <div className="space-y-2 pt-2 border-t-2 border-[#141414]">
                    <span className="text-[10px] font-bold uppercase text-[#141414]">
                      PERGUNTAS E RESPOSTAS ADICIONAIS:
                    </span>
                    {customResponses.map((item, idx) => (
                      <div key={idx} className="p-3 border-2 border-[#141414] bg-[#F2F1ED] space-y-1.5 text-xs">
                        <div className="font-bold text-[#141414] flex items-center gap-1.5">
                          <HelpCircle className="h-3.5 w-3.5 text-blue-700" />
                          <span>P: {item.q}</span>
                        </div>
                        <div className="text-[#141414]/90 whitespace-pre-wrap font-mono text-[11px] bg-white p-2 border border-[#141414]">
                          {item.a}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Interactive Question Input Box */}
                <form
                  onSubmit={handleAskFollowUp}
                  className="p-3 border-2 border-[#141414] bg-white shadow-[2px_2px_0px_#141414] space-y-2"
                >
                  <label htmlFor="ai-fix-question" className="block text-[10px] font-black uppercase text-[#141414]">
                    DÚVIDAS OU ADAPTAÇÃO PARA OUTRA FERRAMENTA? (PERGUNTE AO GEMINI):
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="ai-fix-question"
                      type="text"
                      value={userQuery}
                      onChange={(e) => setUserQuery(e.target.value)}
                      placeholder="Ex: Como aplico isso no Docker Compose? Ou no Caddyfile?"
                      disabled={isAsking}
                      className="flex-1 bg-[#E4E3E0] border border-[#141414] px-3 py-1.5 text-xs font-mono text-[#141414] placeholder-[#141414]/50 focus:outline-none focus:bg-white"
                    />
                    <button
                      type="submit"
                      disabled={isAsking || !userQuery.trim()}
                      className="flex items-center gap-1 px-3 py-1.5 bg-[#141414] text-white hover:bg-[#333] disabled:opacity-50 text-xs font-bold uppercase transition-colors cursor-pointer shrink-0"
                    >
                      {isAsking ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      <span>ENVIAR</span>
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>

          {/* Footer Action Bar */}
          <div className="p-3 sm:p-4 bg-[#E4E3E0] border-t-2 border-[#141414] flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2">
              {fixData && (
                <button
                  type="button"
                  onClick={() => handleCopy(generateMarkdownReport(), 'all')}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-[#141414] text-[#141414] text-xs font-bold uppercase hover:bg-[#F2F1ED] transition-colors cursor-pointer shadow-[1px_1px_0px_#141414]"
                >
                  {copiedAll ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-700" />
                      <span className="text-emerald-700">GUIA COPIADO (MARKDOWN)!</span>
                    </>
                  ) : (
                    <>
                      <FileCode className="h-3.5 w-3.5" />
                      <span>EXPORTAR GUIA COMPLETO (MD)</span>
                    </>
                  )}
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              {onToggleCompleted && (
                <button
                  type="button"
                  onClick={() => {
                    onToggleCompleted(item.id);
                  }}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs font-bold uppercase transition-all cursor-pointer border-2 border-[#141414] ${
                    isCompleted
                      ? 'bg-emerald-700 text-white'
                      : 'bg-white text-[#141414] hover:bg-emerald-100'
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{isCompleted ? 'ITEM RESOLVIDO' : 'MARCAR COMO CORRIGIDO'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 bg-[#141414] text-white border-2 border-[#141414] text-xs font-bold uppercase hover:bg-[#333] transition-colors cursor-pointer"
              >
                FECHAR
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
