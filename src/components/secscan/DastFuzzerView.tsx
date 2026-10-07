import React, { useState } from 'react';
import {
  Flame,
  Bug,
  ShieldAlert,
  Play,
  RefreshCw,
  CheckCircle2,
  AlertOctagon,
  Sparkles,
  Terminal,
  Activity
} from 'lucide-react';

interface DastFuzzerProps {
  targetUrl?: string;
  onRunAIFix?: (item: any) => void;
}

export function DastFuzzerView({ targetUrl, onRunAIFix }: DastFuzzerProps) {
  const [urlInput, setUrlInput] = useState(targetUrl || '');
  const [customParam, setCustomParam] = useState('q');
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<any | null>(null);

  const runFuzz = async () => {
    setIsLoading(true);
    try {
      const resp = await fetch('/api/secscan/dast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: urlInput || targetUrl,
          customParam: customParam || 'q'
        })
      });
      const res = await resp.json();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const tests = data?.tests || [];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-amber-950/40 to-slate-900 border border-amber-500/30 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-400/30 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5" /> SecScan Engine: DAST Fuzzer Pro
              </span>
              <span className="text-xs text-slate-400">Dynamic Application Security Testing</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Fuzzer DAST & Teste Dinâmico de Parâmetros
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Injeta canários seguros de XSS, SQLi, Path Traversal e Open Redirect nos parâmetros da URL para avaliar o tratamento de inputs, erros 500 e reflexão no DOM.
            </p>
          </div>

          {data && (
            <div className="flex items-center gap-4 bg-slate-900/80 border border-slate-700/60 rounded-xl px-5 py-3">
              <div className="text-center">
                <div className="text-xs text-slate-400 uppercase font-semibold">Score DAST</div>
                <div className={`text-2xl font-black ${data.securityScore > 80 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {data.securityScore ?? 100}/100
                </div>
              </div>
              <div className="h-8 w-px bg-slate-700" />
              <div className="text-center">
                <div className="text-xs text-slate-400 uppercase font-semibold">Anomalias</div>
                <div className="text-2xl font-black text-amber-400">{data.anomaliesCount || 0}</div>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800 flex flex-col md:flex-row gap-3">
          <input
            type="text"
            placeholder="https://exemplo.com/busca"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <div className="w-32">
            <input
              type="text"
              placeholder="Parâmetro (q, id...)"
              value={customParam}
              onChange={(e) => setCustomParam(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
            />
          </div>
          <button
            onClick={runFuzz}
            disabled={isLoading}
            className="px-5 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-600/30 transition-all cursor-pointer"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {isLoading ? 'Injetando Payloads...' : 'Executar Fuzzing DAST'}
          </button>
        </div>
      </div>

      {/* Tests Results */}
      {tests.length > 0 && (
        <div className="space-y-3">
          {tests.map((t: any, idx: number) => (
            <div
              key={idx}
              className={`border rounded-xl p-4 transition-all shadow-sm ${
                t.anomalyDetected
                  ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60'
                  : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {t.anomalyDetected ? (
                      <span className="p-1 rounded bg-rose-500/20 text-rose-600 dark:text-rose-400">
                        <AlertOctagon className="w-4 h-4" />
                      </span>
                    ) : (
                      <span className="p-1 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-4 h-4" />
                      </span>
                    )}
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      Teste de {t.category}
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      Parâmetro: ?{t.param}=
                    </span>
                    <span className="px-2 py-0.5 rounded text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-500">
                      HTTP {t.status}
                    </span>
                  </div>
                  <div className="mt-1 font-mono text-xs bg-slate-100 dark:bg-slate-800/80 px-2.5 py-1 rounded text-slate-800 dark:text-slate-200 inline-block">
                    Payload: {t.payload}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {t.notes}
                  </p>
                </div>

                {t.anomalyDetected && onRunAIFix && (
                  <button
                    onClick={() => onRunAIFix({
                      id: `dast-${t.category}`,
                      title: `Vulnerabilidade DAST: ${t.category}`,
                      category: 'security',
                      severity: 'critical',
                      summary: `Payload de ${t.category} injetado no parâmetro ${t.param} causou anomalia ou foi refletido sem sanitização. ${t.notes}`
                    })}
                    className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-rose-500 transition-colors shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Correção com IA
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
