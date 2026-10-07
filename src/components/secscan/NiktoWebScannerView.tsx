import React, { useState, useEffect } from 'react';
import {
  Globe,
  Server,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  ShieldAlert,
  Terminal,
  ExternalLink,
  Sparkles,
  Info
} from 'lucide-react';

interface NiktoScannerProps {
  targetUrl?: string;
  onRunAIFix?: (item: any) => void;
}

export function NiktoWebScannerView({ targetUrl, onRunAIFix }: NiktoScannerProps) {
  const [urlInput, setUrlInput] = useState(targetUrl || '');
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<any | null>(null);
  const [filter, setFilter] = useState<'all' | 'vulnerable' | 'safe'>('all');

  useEffect(() => {
    if (targetUrl) {
      setUrlInput(targetUrl);
      runScan(targetUrl);
    }
  }, [targetUrl]);

  const runScan = async (urlToScan?: string) => {
    setIsLoading(true);
    try {
      const resp = await fetch('/api/secscan/nikto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlToScan || urlInput })
      });
      const res = await resp.json();
      setData(res);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const results = data?.results || [];
  const filteredResults = results.filter((r: any) => {
    if (filter === 'vulnerable') return r.isVulnerable;
    if (filter === 'safe') return !r.isVulnerable;
    return true;
  });

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border border-rose-500/30 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-400/30 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5" /> SecScan Engine: Nikto Pro Web Scanner
              </span>
              <span className="text-xs text-slate-400">Verificação Ativa de Servidor</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Auditoria de Diretórios, Arquivos & Configuração de Servidor
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Testa a exposição de arquivos críticos (.env, .git, backups SQL, wp-config), métodos HTTP inseguros (TRACE, PUT, DELETE) e banners verbosos de servidor.
            </p>
          </div>

          {data && (
            <div className="flex items-center gap-4 bg-slate-900/80 border border-slate-700/60 rounded-xl px-5 py-3">
              <div className="text-center">
                <div className="text-xs text-slate-400 uppercase font-semibold">Postura Web</div>
                <div className={`text-2xl font-black ${data.securityScore > 80 ? 'text-emerald-400' : data.securityScore > 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {data.securityScore ?? 100}/100
                </div>
              </div>
              <div className="h-8 w-px bg-slate-700" />
              <div className="text-center">
                <div className="text-xs text-slate-400 uppercase font-semibold">Falhas</div>
                <div className="text-2xl font-black text-rose-400">{data.vulnerabilitiesCount || 0}</div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="mt-6 pt-5 border-t border-slate-800 flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="https://exemplo.com"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => runScan()}
            disabled={isLoading}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-rose-600/30 transition-all cursor-pointer"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldAlert className="w-4 h-4" />}
            {isLoading ? 'Executando Nikto...' : 'Disparar Varredura Nikto'}
          </button>
        </div>
      </div>

      {/* Server Profile Cards */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Banner do Servidor</span>
            <div className="text-base font-bold text-slate-900 dark:text-white font-mono mt-1 truncate">
              {data.serverBanner || 'Oculto'}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Métodos HTTP Permitidos</span>
            <div className="flex flex-wrap gap-1 mt-1">
              {data.supportedMethods?.map((m: string) => (
                <span
                  key={m}
                  className={`px-1.5 py-0.5 rounded text-xs font-mono font-bold ${
                    ['TRACE', 'PUT', 'DELETE'].includes(m)
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                      : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                  }`}
                >
                  {m}
                </span>
              ))}
            </div>
          </div>
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
            <span className="text-xs font-semibold text-slate-500 uppercase">Métodos Perigosos</span>
            <div className="text-base font-bold text-slate-900 dark:text-white mt-1">
              {data.dangerousMethodsFound?.length > 0 ? (
                <span className="text-rose-600 flex items-center gap-1">
                  <AlertTriangle className="w-4 h-4" /> {data.dangerousMethodsFound.join(', ')} Ativos!
                </span>
              ) : (
                <span className="text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" /> Nenhum perigoso
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Filter Selector */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filter === 'all'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Todos ({results.length})
        </button>
        <button
          onClick={() => setFilter('vulnerable')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filter === 'vulnerable'
              ? 'bg-rose-600 text-white'
              : 'text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30'
          }`}
        >
          Expostos / Vulneráveis ({results.filter((r: any) => r.isVulnerable).length})
        </button>
        <button
          onClick={() => setFilter('safe')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            filter === 'safe'
              ? 'bg-emerald-600 text-white'
              : 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
          }`}
        >
          Protegidos / Bloqueados ({results.filter((r: any) => !r.isVulnerable).length})
        </button>
      </div>

      {/* Results Table / List */}
      <div className="space-y-3">
        {filteredResults.map((probe: any, idx: number) => (
          <div
            key={idx}
            className={`border rounded-xl p-4 shadow-sm transition-all ${
              probe.isVulnerable
                ? 'bg-rose-50/60 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60'
                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  {probe.isVulnerable ? (
                    <span className="p-1 rounded-md bg-rose-500/20 text-rose-600 dark:text-rose-400">
                      <XCircle className="w-4 h-4" />
                    </span>
                  ) : (
                    <span className="p-1 rounded-md bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                    </span>
                  )}
                  <span className="font-mono text-sm font-bold text-slate-900 dark:text-white">
                    {probe.path}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    HTTP {probe.status}
                  </span>
                  <span className="text-xs text-slate-500">
                    {probe.category}
                  </span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                  {probe.description}
                </p>
                {probe.isVulnerable && (
                  <p className="text-xs text-rose-700 dark:text-rose-400 font-semibold mt-1">
                    <strong>Remediação:</strong> {probe.remediation}
                  </p>
                )}
              </div>

              {probe.isVulnerable && onRunAIFix && (
                <button
                  onClick={() => onRunAIFix({
                    id: `nikto-${probe.path}`,
                    title: probe.title,
                    category: 'security',
                    severity: probe.severity,
                    summary: `${probe.title}: Caminho ${probe.path} exposto com código ${probe.status}. ${probe.remediation}`
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
    </div>
  );
}
