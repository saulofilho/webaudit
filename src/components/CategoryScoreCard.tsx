import React, { useState } from 'react';
import { Shield, Search, CheckCircle2, Zap, ArrowUpRight, AlertCircle, Check, XCircle, HelpCircle } from 'lucide-react';
import { CategoryScore, AuditCategory } from '../types';

interface CategoryScoreCardProps {
  categoryKey: AuditCategory;
  scoreData: CategoryScore;
  isSelected: boolean;
  onSelect: () => void;
  previousScore?: number;
}

const CATEGORY_ICONS: Record<AuditCategory, React.ElementType> = {
  security: Shield,
  seo: Search,
  best_practices: CheckCircle2,
  performance_accessibility: Zap,
};

export const CategoryScoreCard: React.FC<CategoryScoreCardProps> = ({
  categoryKey,
  scoreData,
  isSelected,
  onSelect,
  previousScore,
}) => {
  const [showTooltip, setShowTooltip] = useState<boolean>(false);
  const Icon = CATEGORY_ICONS[categoryKey] || Shield;
  const diff = previousScore !== undefined ? scoreData.score - previousScore : 0;

  const getScoreBadgeColor = (score: number) => {
    if (score >= 90) return 'text-emerald-800 bg-emerald-100 border-emerald-700';
    if (score >= 75) return 'text-[#141414] bg-[#E4E3E0] border-[#141414]';
    if (score >= 60) return 'text-amber-800 bg-amber-100 border-amber-700';
    return 'text-rose-800 bg-rose-100 border-rose-700';
  };

  const getProgressColor = (score: number) => {
    if (score >= 90) return 'bg-emerald-600';
    if (score >= 75) return 'bg-[#141414]';
    if (score >= 60) return 'bg-amber-600';
    return 'bg-rose-600';
  };

  return (
    <div
      onClick={onSelect}
      className={`group relative flex flex-col justify-between p-4 border-2 transition-all cursor-pointer select-none ${
        isSelected
          ? 'bg-[#E4E3E0] border-[#141414] shadow-[4px_4px_0px_#141414] ring-2 ring-[#141414]'
          : 'bg-white border-[#141414] hover:bg-[#F2F1EF] shadow-[2px_2px_0px_#141414]'
      }`}
    >
      <div>
        {/* Header: Icon + Category Name + Score Badge */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-2">
            <div className={`flex h-8 w-8 items-center justify-center border ${
              isSelected ? 'bg-[#141414] text-white border-[#141414]' : 'bg-[#E4E3E0] text-[#141414] border-[#141414]'
            }`}>
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 relative">
                <h3 className="text-xs font-mono font-black text-[#141414] uppercase group-hover:underline">
                  {scoreData.name}
                </h3>

                {categoryKey === 'security' && (
                  <div
                    className="relative inline-flex items-center"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowTooltip((prev) => !prev);
                    }}
                  >
                    <button
                      type="button"
                      aria-label="Ver detalhes das métricas avaliadas em Segurança"
                      className="p-0.5 text-[#141414]/60 hover:text-[#141414] hover:bg-neutral-200 transition-colors cursor-pointer"
                    >
                      <HelpCircle className="h-3.5 w-3.5" />
                    </button>

                    {/* Explanatory Tooltip Popover */}
                    {showTooltip && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="absolute left-0 bottom-full mb-2 z-50 w-72 sm:w-80 border-2 border-[#141414] bg-[#141414] text-[#E4E3E0] p-3 shadow-[4px_4px_0px_#888888] font-mono text-[11px] select-text cursor-default pointer-events-auto"
                      >
                        <div className="flex items-center justify-between border-b border-neutral-700 pb-1.5 mb-2">
                          <span className="font-black text-amber-300 text-xs uppercase flex items-center gap-1.5">
                            <Shield className="h-3.5 w-3.5 text-amber-300" />
                            MÉTRICAS AVALIADAS EM SEGURANÇA
                          </span>
                        </div>

                        <p className="text-[10px] text-neutral-300 mb-2 leading-relaxed">
                          Verificações automáticas baseadas nas diretrizes defensivas <strong>OWASP Top 10</strong> e padrões <strong>IETF/NIST</strong>:
                        </p>

                        <ul className="space-y-1.5 text-[10px] text-neutral-200">
                          <li className="flex items-start gap-1.5">
                            <span className="text-emerald-400 font-bold shrink-0">•</span>
                            <span><strong>HTTPS & TLS:</strong> Validação de certificado e criptografia de tráfego ativa</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-emerald-400 font-bold shrink-0">•</span>
                            <span><strong>HSTS:</strong> Strict-Transport-Security (bloqueio contra ataques MitM & downgrade)</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-emerald-400 font-bold shrink-0">•</span>
                            <span><strong>CSP:</strong> Content-Security-Policy (mitigação de injeção de script XSS)</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-emerald-400 font-bold shrink-0">•</span>
                            <span><strong>X-Frame-Options:</strong> Bloqueio de sequestro de cliques (Clickjacking via iframe)</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-emerald-400 font-bold shrink-0">•</span>
                            <span><strong>X-Content-Type-Options:</strong> Prevenção contra ataques de MIME-sniffing</span>
                          </li>
                          <li className="flex items-start gap-1.5">
                            <span className="text-emerald-400 font-bold shrink-0">•</span>
                            <span><strong>Permissions & Referrer:</strong> Controle de vazamento de URLs e APIs de hardware</span>
                          </li>
                        </ul>

                        <div className="mt-2.5 pt-1.5 border-t border-neutral-800 text-[9px] text-neutral-400 flex items-center justify-between">
                          <span>PADRÕES: OWASP / NIST</span>
                          <span className="text-amber-400 font-bold">TOTAL: 6+ REQUISITOS</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <span className="text-[10px] font-mono text-[#141414]/70">
                GRADE [{scoreData.grade}]
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <div className={`flex items-baseline gap-0.5 border px-2 py-0.5 font-mono font-bold text-xs ${getScoreBadgeColor(scoreData.score)}`}>
              <span>{scoreData.score}</span>
              <span className="text-[9px] opacity-70">/100</span>
            </div>
            {previousScore !== undefined && diff !== 0 && (
              <span
                className={`border px-1 py-0.5 font-mono font-black text-[10px] ${
                  diff > 0
                    ? 'bg-emerald-100 text-emerald-950 border-emerald-700'
                    : 'bg-rose-100 text-rose-950 border-rose-700'
                }`}
                title={`Variação vs. auditoria anterior: ${diff > 0 ? `+${diff}` : diff} pts`}
              >
                {diff > 0 ? `+${diff}` : diff}
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-[#E4E3E0] h-2 border border-[#141414] mb-2.5">
          <div
            className={`h-full transition-all duration-500 ${getProgressColor(scoreData.score)}`}
            style={{ width: `${scoreData.score}%` }}
          />
        </div>

        {/* Summary counts */}
        <div className="flex items-center gap-2 font-mono text-[10px] text-[#141414]">
          <span className="flex items-center gap-0.5 text-emerald-800 font-bold">
            <Check className="h-3 w-3 text-emerald-700" />
            {scoreData.passedCount} OK
          </span>
          {scoreData.warningCount > 0 && (
            <span className="flex items-center gap-0.5 text-amber-800 font-bold">
              <AlertCircle className="h-3 w-3 text-amber-700" />
              {scoreData.warningCount} ALERTA
            </span>
          )}
          {scoreData.criticalCount > 0 && (
            <span className="flex items-center gap-0.5 text-rose-800 font-bold">
              <XCircle className="h-3 w-3 text-rose-700" />
              {scoreData.criticalCount} CRÍTICO
            </span>
          )}
        </div>
      </div>

      {/* Footer link */}
      <div className="mt-3 flex items-center justify-between text-[11px] font-mono font-bold text-[#141414] group-hover:opacity-80 pt-2 border-t border-[#141414]/20">
        <span>INSPECIONAR ITENS</span>
        <ArrowUpRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
      </div>
    </div>
  );
};
