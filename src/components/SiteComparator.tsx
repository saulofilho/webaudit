import React, { useState } from 'react';
import { ArrowLeftRight, Check, X, TrendingUp, TrendingDown, Minus, Shield, Search, Zap, CheckCircle2, SplitSquareVertical, Sparkles } from 'lucide-react';
import { AuditReport, SavedAuditSummary } from '../types';
import { VisualRegressionView } from './VisualRegressionView';

interface SiteComparatorProps {
  currentReport: AuditReport;
  savedAudits: SavedAuditSummary[];
  onLoadAudit: (id: string) => void;
  onCompareWithUrl: (url: string) => void;
}

export const SiteComparator: React.FC<SiteComparatorProps> = ({
  currentReport,
  savedAudits,
  onLoadAudit,
  onCompareWithUrl,
}) => {
  const [competitorUrl, setCompetitorUrl] = useState('');
  const [selectedAuditId, setSelectedAuditId] = useState<string>('');
  const [showVisualRegression, setShowVisualRegression] = useState<boolean>(true);

  const otherAudits = savedAudits.filter((a) => a.id !== currentReport.id);

  const selectedAudit = savedAudits.find((a) => a.id === selectedAuditId);

  const handleStartComparison = (e: React.FormEvent) => {
    e.preventDefault();
    if (!competitorUrl.trim()) return;
    onCompareWithUrl(competitorUrl.trim());
  };

  const renderDelta = (current: number, previous: number) => {
    const diff = current - previous;
    if (diff > 0) {
      return (
        <span className="flex items-center text-xs font-mono font-bold text-emerald-800 bg-emerald-100 px-1 border border-emerald-700">
          <TrendingUp className="h-3 w-3 mr-0.5" />
          +{diff} PTS
        </span>
      );
    }
    if (diff < 0) {
      return (
        <span className="flex items-center text-xs font-mono font-bold text-rose-800 bg-rose-100 px-1 border border-rose-700">
          <TrendingDown className="h-3 w-3 mr-0.5" />
          {diff} PTS
        </span>
      );
    }
    return (
      <span className="flex items-center text-xs font-mono font-bold text-[#141414]/60 bg-[#E4E3E0] px-1 border border-[#141414]/40">
        <Minus className="h-3 w-3 mr-0.5" />
        0 PTS
      </span>
    );
  };

  return (
    <div className="border-2 border-[#141414] bg-white p-5 sm:p-6 shadow-[4px_4px_0px_#141414] font-mono text-[#141414] space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b-2 border-[#141414]">
        <div>
          <h3 className="text-xs sm:text-sm font-black text-[#141414] flex items-center gap-2 uppercase">
            <ArrowLeftRight className="h-4 w-4 text-[#141414]" />
            COMPARADOR DE DESEMPENHO & BENCHMARK
          </h3>
          <p className="text-[11px] text-[#141414]/70">
            Compare o relatório ativo com registros do histórico ou audite um domínio concorrente.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowVisualRegression(!showVisualRegression)}
            id="btn-toggle-visual-regression"
            className={`flex items-center gap-2 border-2 border-[#141414] px-3 py-1.5 text-xs font-black uppercase transition-all shadow-[2px_2px_0px_#141414] cursor-pointer ${
              showVisualRegression
                ? 'bg-blue-600 text-white'
                : 'bg-white text-[#141414] hover:bg-[#E4E3E0]'
            }`}
          >
            <SplitSquareVertical className="h-4 w-4" />
            <span>REGRESSÃO VISUAL (DIFF)</span>
            <span
              className={`text-[9px] px-1.5 py-0.2 font-black border ${
                showVisualRegression
                  ? 'bg-white text-blue-900 border-white'
                  : 'bg-blue-600 text-white border-blue-800'
              }`}
            >
              {showVisualRegression ? 'ATIVO' : 'ATIVAR'}
            </span>
          </button>
        </div>
      </div>

      {/* Select comparison mode */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Compare with Saved Audit */}
        <div className="border-2 border-[#141414] bg-[#E4E3E0]/30 p-4 space-y-3 shadow-[2px_2px_0px_#141414]">
          <h4 className="text-xs font-black uppercase tracking-wider text-[#141414] border-b border-[#141414] pb-1">
            1. COMPARAR COM HISTÓRICO LOCAL
          </h4>
          {otherAudits.length === 0 ? (
            <p className="text-xs text-[#141414]/60">
              Nenhuma outra análise salva no histórico para comparar no momento.
            </p>
          ) : (
            <div className="space-y-2">
              <select
                value={selectedAuditId}
                onChange={(e) => setSelectedAuditId(e.target.value)}
                className="w-full bg-white border-2 border-[#141414] px-2.5 py-1.5 text-xs font-mono text-[#141414] focus:outline-none"
              >
                <option value="">Selecione uma análise do histórico...</option>
                {otherAudits.map((a) => (
                  <option key={a.id} value={a.id}>
                    {new URL(a.targetUrl).hostname} — Score: {a.overallScore}/100 ({a.overallGrade})
                  </option>
                ))}
              </select>

              {selectedAudit && (
                <div className="mt-3 pt-3 border-t-2 border-[#141414] space-y-2 text-xs">
                  <div className="flex justify-between items-center bg-white p-2 border border-[#141414]">
                    <span className="text-[#141414]/70 font-bold">SCORE GERAL:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#141414]">{currentReport.overallScore} vs {selectedAudit.overallScore}</span>
                      {renderDelta(currentReport.overallScore, selectedAudit.overallScore)}
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-white p-2 border border-[#141414]">
                    <span className="text-[#141414]/70 font-bold">SEGURANÇA:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#141414]">{currentReport.categories.security.score} vs {selectedAudit.securityScore}</span>
                      {renderDelta(currentReport.categories.security.score, selectedAudit.securityScore)}
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-white p-2 border border-[#141414]">
                    <span className="text-[#141414]/70 font-bold">SEO:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#141414]">{currentReport.categories.seo.score} vs {selectedAudit.seoScore}</span>
                      {renderDelta(currentReport.categories.seo.score, selectedAudit.seoScore)}
                    </div>
                  </div>

                  <div className="flex justify-between items-center bg-white p-2 border border-[#141414]">
                    <span className="text-[#141414]/70 font-bold">BOAS PRÁTICAS:</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#141414]">{currentReport.categories.best_practices.score} vs {selectedAudit.bestPracticesScore}</span>
                      {renderDelta(currentReport.categories.best_practices.score, selectedAudit.bestPracticesScore)}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Compare with Competitor / New URL */}
        <div className="border-2 border-[#141414] bg-[#E4E3E0]/30 p-4 space-y-3 shadow-[2px_2px_0px_#141414]">
          <h4 className="text-xs font-black uppercase tracking-wider text-[#141414] border-b border-[#141414] pb-1">
            2. AUDITAR CONCORRENTE DIRETO
          </h4>
          <p className="text-xs text-[#141414]/70">
            Insira o domínio de referência ou concorrente para executar nova análise:
          </p>
          <form onSubmit={handleStartComparison} className="space-y-2">
            <input
              type="text"
              value={competitorUrl}
              onChange={(e) => setCompetitorUrl(e.target.value)}
              placeholder="ex: concorrente.com.br"
              className="w-full bg-white border-2 border-[#141414] px-2.5 py-1.5 text-xs font-mono text-[#141414] placeholder-[#141414]/40 focus:outline-none"
            />
            <button
              type="submit"
              disabled={!competitorUrl.trim()}
              className="w-full bg-[#141414] text-white hover:bg-black font-black py-2 border border-[#141414] text-xs uppercase transition-all shadow-[2px_2px_0px_#888888] disabled:opacity-50 cursor-pointer"
            >
              EXECUTAR BENCHMARK
            </button>
          </form>
        </div>
      </div>

      {/* Visual Regression Diff Studio */}
      {showVisualRegression && (
        <div className="pt-2">
          <VisualRegressionView
            currentReport={currentReport}
            comparedAudit={selectedAudit}
            competitorUrl={competitorUrl}
          />
        </div>
      )}
    </div>
  );
};
