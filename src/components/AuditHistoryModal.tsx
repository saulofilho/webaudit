import React, { useState } from 'react';
import { X, History, Trash2, ArrowRight, Calendar, Activity, ListFilter } from 'lucide-react';
import { SavedAuditSummary } from '../types';
import { formatDate } from '../utils/formatters';
import { HistoricalTrendsChart } from './HistoricalTrendsChart';

interface AuditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedAudits: SavedAuditSummary[];
  currentUrl?: string;
  onSelectAudit: (id: string) => void;
  onClearHistory: () => void;
  onReaudit?: (url: string) => void;
}

export const AuditHistoryModal: React.FC<AuditHistoryModalProps> = ({
  isOpen,
  onClose,
  savedAudits,
  currentUrl,
  onSelectAudit,
  onClearHistory,
  onReaudit,
}) => {
  const [modalTab, setModalTab] = useState<'list' | 'trends'>('trends');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#141414]/70 backdrop-blur-xs font-mono">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col border-2 border-[#141414] bg-white p-5 sm:p-6 shadow-[8px_8px_0px_#141414] space-y-4 text-[#141414]">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#141414] pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center border border-[#141414] bg-[#141414] text-white">
              <History className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#141414] uppercase">
                HISTÓRICO & TENDÊNCIAS DE AUDITORIA ({savedAudits.length})
              </h3>
              <p className="text-[11px] text-[#141414]/70">
                Acompanhe o histórico de execuções e evolução de métricas ao longo do tempo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-[#E4E3E0] p-0.5 border border-[#141414]">
              <button
                type="button"
                onClick={() => setModalTab('trends')}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-black uppercase transition-all cursor-pointer ${
                  modalTab === 'trends'
                    ? 'bg-[#141414] text-white shadow-[1px_1px_0px_#888888]'
                    : 'text-[#141414] hover:bg-white'
                }`}
              >
                <Activity className="h-3 w-3" />
                <span>GRÁFICO</span>
              </button>

              <button
                type="button"
                onClick={() => setModalTab('list')}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-black uppercase transition-all cursor-pointer ${
                  modalTab === 'list'
                    ? 'bg-[#141414] text-white shadow-[1px_1px_0px_#888888]'
                    : 'text-[#141414] hover:bg-white'
                }`}
              >
                <ListFilter className="h-3 w-3" />
                <span>LISTA ({savedAudits.length})</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="text-[#141414] hover:bg-[#141414] hover:text-white p-1 border border-[#141414] transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content view based on active tab */}
        <div className="flex-1 overflow-y-auto pr-1">
          {modalTab === 'trends' ? (
            <HistoricalTrendsChart
              savedAudits={savedAudits}
              currentUrl={currentUrl}
              onSelectAudit={(id) => {
                onSelectAudit(id);
                onClose();
              }}
              onReaudit={(url) => {
                if (onReaudit) {
                  onReaudit(url);
                  onClose();
                }
              }}
            />
          ) : (
            <div className="space-y-2.5">
              {savedAudits.length === 0 ? (
                <div className="text-center py-12 text-[#141414]/60 text-xs">
                  <p>Nenhuma auditoria realizada ainda nesta sessão.</p>
                  <p className="mt-1">Execute uma análise informando uma URL para listar o histórico aqui.</p>
                </div>
              ) : (
                savedAudits.map((item) => {
                  let hostname = item.targetUrl;
                  try {
                    hostname = new URL(item.targetUrl).hostname;
                  } catch {
                    // ignore
                  }
                  return (
                    <div
                      key={item.id}
                      onClick={() => {
                        onSelectAudit(item.id);
                        onClose();
                      }}
                      className="group flex items-center justify-between gap-3 p-3 border-2 border-[#141414] bg-[#E4E3E0]/30 hover:bg-[#E4E3E0] shadow-[2px_2px_0px_#141414] transition-all cursor-pointer"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5">
                          <h4 className="text-xs font-black text-[#141414] uppercase truncate">
                            {hostname}
                          </h4>
                          <span
                            className={`px-1.5 py-0.2 text-[10px] font-bold border border-[#141414] ${
                              item.overallScore >= 90
                                ? 'bg-emerald-200 text-emerald-950'
                                : item.overallScore >= 70
                                ? 'bg-blue-200 text-blue-950'
                                : item.overallScore >= 50
                                ? 'bg-amber-200 text-amber-950'
                                : 'bg-rose-200 text-rose-950'
                            }`}
                          >
                            SCORE {item.overallScore} ({item.overallGrade})
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-[10px] text-[#141414]/70">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {formatDate(item.analyzedAt)}
                          </span>
                          <span>•</span>
                          <span>SEC: {item.securityScore}%</span>
                          <span>•</span>
                          <span>SEO: {item.seoScore}%</span>
                          <span>•</span>
                          <span>PERF: {item.perfScore}%</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="flex h-7 w-7 items-center justify-center border border-[#141414] bg-white group-hover:bg-[#141414] group-hover:text-white transition-colors shrink-0"
                        title="Carregar relatório"
                      >
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        {savedAudits.length > 0 && (
          <div className="pt-3 border-t-2 border-[#141414] flex justify-between items-center shrink-0">
            <button
              type="button"
              onClick={onClearHistory}
              className="flex items-center gap-1 text-[11px] font-bold uppercase text-rose-800 hover:underline transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>LIMPAR HISTÓRICO</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="text-xs font-bold uppercase text-[#141414] px-3 py-1 bg-[#E4E3E0] hover:bg-white border border-[#141414] cursor-pointer"
            >
              FECHAR
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
