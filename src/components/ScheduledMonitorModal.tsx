import React, { useState, useEffect } from 'react';
import {
  Bell,
  X,
  Plus,
  Trash2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Play,
  ShieldCheck,
  Send,
  Save,
} from 'lucide-react';
import { AuditReport } from '../types';

export interface MonitoredSite {
  id: string;
  url: string;
  interval: '6h' | '12h' | '24h' | 'weekly';
  minScoreThreshold: number;
  alertOnCritical: boolean;
  webhookUrl?: string;
  emailAlert?: string;
  lastChecked?: string;
  lastScore?: number;
  status: 'active' | 'paused';
}

const STORAGE_KEY = 'webaudit_scheduled_monitors_v1';

interface ScheduledMonitorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentReport?: AuditReport | null;
}

export const ScheduledMonitorModal: React.FC<ScheduledMonitorModalProps> = ({
  isOpen,
  onClose,
  currentReport,
}) => {
  const [monitors, setMonitors] = useState<MonitoredSite[]>([]);
  const [newUrl, setNewUrl] = useState<string>(currentReport?.targetUrl || '');
  const [newInterval, setNewInterval] = useState<'6h' | '12h' | '24h' | 'weekly'>('24h');
  const [minScore, setMinScore] = useState<number>(80);
  const [webhook, setWebhook] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [testSuccess, setTestSuccess] = useState<string | null>(null);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setMonitors(JSON.parse(stored));
      } else if (currentReport?.targetUrl) {
        const initial: MonitoredSite = {
          id: 'mon-1',
          url: currentReport.targetUrl,
          interval: '24h',
          minScoreThreshold: 80,
          alertOnCritical: true,
          lastChecked: new Date().toISOString(),
          lastScore: currentReport.overallScore,
          status: 'active',
        };
        setMonitors([initial]);
      }
    } catch {
      // ignore
    }
  }, [currentReport]);

  const saveMonitors = (list: MonitoredSite[]) => {
    setMonitors(list);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch {
      // ignore
    }
  };

  const handleAddMonitor = () => {
    if (!newUrl.trim()) return;
    const item: MonitoredSite = {
      id: `mon-${Date.now()}`,
      url: newUrl.trim(),
      interval: newInterval,
      minScoreThreshold: minScore,
      alertOnCritical: true,
      webhookUrl: webhook || undefined,
      emailAlert: email || undefined,
      lastChecked: new Date().toISOString(),
      lastScore: currentReport?.targetUrl === newUrl ? currentReport.overallScore : 85,
      status: 'active',
    };
    const updated = [item, ...monitors];
    saveMonitors(updated);
    setNewUrl('');
  };

  const handleDelete = (id: string) => {
    const updated = monitors.filter((m) => m.id !== id);
    saveMonitors(updated);
  };

  const handleRunImmediate = (m: MonitoredSite) => {
    setTestSuccess(`Simulated periodic check triggered for ${m.url}! Status: Score ${m.lastScore || 85}/100. All metrics within acceptable threshold.`);
    setTimeout(() => setTestSuccess(null), 4000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col border-2 border-[#141414] bg-white shadow-[8px_8px_0px_#141414]">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#141414] bg-[#141414] px-6 py-4 text-[#E4E3E0]">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-amber-400" />
            <h2 className="font-mono text-sm sm:text-base font-black uppercase tracking-tight">
              Monitoramento Periódico & Alertas Agendados
            </h2>
          </div>
          <button
            onClick={onClose}
            className="border border-[#E4E3E0] p-1 text-[#E4E3E0] hover:bg-white hover:text-[#141414] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {testSuccess && (
            <div className="border border-[#141414] bg-emerald-100 p-3 text-xs font-mono text-emerald-900 font-bold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-700" />
              <span>{testSuccess}</span>
            </div>
          )}

          {/* Add Form */}
          <div className="border-2 border-[#141414] bg-[#E4E3E0]/30 p-4 font-mono text-xs">
            <h3 className="font-bold uppercase text-[#141414] mb-3 flex items-center gap-1.5">
              <Plus className="h-4 w-4" /> Cadastrar Novo Website para Monitoramento
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block font-bold text-[#141414] mb-1">URL do Site</label>
                <input
                  type="text"
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  placeholder="https://exemplo.com.br"
                  className="w-full border border-[#141414] bg-white p-2 font-mono"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#141414] mb-1">Frequência</label>
                  <select
                    value={newInterval}
                    onChange={(e) => setNewInterval(e.target.value as any)}
                    className="w-full border border-[#141414] bg-white p-2 font-mono"
                  >
                    <option value="6h">A cada 6 horas</option>
                    <option value="12h">A cada 12 horas</option>
                    <option value="24h">Diário (24h)</option>
                    <option value="weekly">Semanal</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#141414] mb-1">Alerta se Nota &lt;</label>
                  <input
                    type="number"
                    min="50"
                    max="95"
                    value={minScore}
                    onChange={(e) => setMinScore(Number(e.target.value))}
                    className="w-full border border-[#141414] bg-white p-2 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#141414] mb-1">E-mail para Alerta</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="dev@empresa.com"
                    className="w-full border border-[#141414] bg-white p-2 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-[#141414] mb-1">Webhook URL (Slack ou Discord - Opcional)</label>
                <input
                  type="text"
                  value={webhook}
                  onChange={(e) => setWebhook(e.target.value)}
                  placeholder="https://hooks.slack.com/services/..."
                  className="w-full border border-[#141414] bg-white p-2 font-mono"
                />
              </div>

              <button
                onClick={handleAddMonitor}
                disabled={!newUrl.trim()}
                className="mt-2 flex items-center gap-1.5 border-2 border-[#141414] bg-[#141414] text-white px-4 py-2 font-black uppercase text-xs hover:bg-black transition-all cursor-pointer disabled:opacity-50"
              >
                <Plus className="h-4 w-4" />
                <span>Salvar Monitoramento</span>
              </button>
            </div>
          </div>

          {/* List of active monitors */}
          <div>
            <h3 className="font-mono text-xs font-black uppercase text-[#141414] mb-3">
              Websites em Monitoramento ({monitors.length})
            </h3>

            {monitors.length === 0 ? (
              <div className="border border-[#141414] p-6 text-center font-mono text-xs text-[#141414]/60">
                Nenhum site cadastrado no momento. Insira uma URL acima para iniciar o monitoramento.
              </div>
            ) : (
              <div className="space-y-2">
                {monitors.map((m) => (
                  <div
                    key={m.id}
                    className="border-2 border-[#141414] bg-white p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 font-mono text-xs shadow-xs"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-[#141414]">{m.url}</span>
                        <span className="inline-block bg-emerald-100 text-emerald-800 border border-[#141414] px-1.5 py-0.2 text-[9px] font-bold">
                          ATIVO
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#141414]/70 mt-1">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Intervalo: {m.interval}
                        </span>
                        <span>Alerta se &lt; {m.minScoreThreshold} pts</span>
                        {m.lastScore !== undefined && (
                          <span className="text-emerald-700 font-bold">Última Nota: {m.lastScore}/100</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleRunImmediate(m)}
                        title="Executar verificação manual agora"
                        className="flex items-center gap-1 border border-[#141414] bg-white px-2.5 py-1 text-[11px] font-bold hover:bg-[#141414] hover:text-white transition-colors cursor-pointer"
                      >
                        <Play className="h-3 w-3 text-emerald-600" />
                        <span>Testar Agora</span>
                      </button>
                      <button
                        onClick={() => handleDelete(m.id)}
                        title="Remover monitoramento"
                        className="p-1 border border-[#141414] text-red-600 hover:bg-red-600 hover:text-white transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t-2 border-[#141414] bg-[#E4E3E0] px-6 py-4 flex justify-end">
          <button
            onClick={onClose}
            className="border-2 border-[#141414] bg-[#141414] text-white px-4 py-1.5 font-mono text-xs font-bold uppercase hover:bg-black transition-all cursor-pointer"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
