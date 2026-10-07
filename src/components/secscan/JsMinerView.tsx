import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Database,
  AlertTriangle,
  FileCode,
  ShieldAlert,
  Search,
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Terminal,
  Layers,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';

interface JsMinerProps {
  targetUrl?: string;
  onRunAIFix?: (item: any) => void;
}

export function JsMinerView({ targetUrl, onRunAIFix }: JsMinerProps) {
  const [urlInput, setUrlInput] = useState(targetUrl || '');
  const [codeSnippet, setCodeSnippet] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'secrets' | 'buckets' | 'sinks' | 'endpoints'>('secrets');

  useEffect(() => {
    if (targetUrl) {
      setUrlInput(targetUrl);
      runScan(targetUrl, '');
    }
  }, [targetUrl]);

  const runScan = async (urlToScan?: string, snippetToScan?: string) => {
    setIsLoading(true);
    try {
      const resp = await fetch('/api/secscan/js-miner', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: urlToScan !== undefined ? urlToScan : urlInput,
          codeSnippet: snippetToScan !== undefined ? snippetToScan : codeSnippet,
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

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const secrets = data?.secretsFound || [];
  const buckets = data?.bucketsFound || [];
  const sinks = data?.sinksFound || [];
  const endpoints = data?.endpointsFound || [];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 flex items-center gap-1.5">
                <FileCode className="w-3.5 h-3.5" /> SecScan Engine: JS-Miner Pro
              </span>
              <span className="text-xs text-slate-400">Port do Burp Suite JS-Miner</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Mineração de JavaScript & Segredos Vazados
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Varre automaticamente bundles e scripts em busca de chaves de API expostas (AWS, Google, OpenAI, Stripe, JWT), buckets públicos (S3, GCP, Azure), rotas internas e DOM sinks inseguros.
            </p>
          </div>

          {data && (
            <div className="flex items-center gap-4 bg-slate-900/80 border border-slate-700/60 rounded-xl px-5 py-3">
              <div className="text-center">
                <div className="text-xs text-slate-400 uppercase font-semibold">Score JS</div>
                <div className={`text-2xl font-black ${data.securityScore > 80 ? 'text-emerald-400' : data.securityScore > 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                  {data.securityScore ?? 100}/100
                </div>
              </div>
              <div className="h-8 w-px bg-slate-700" />
              <div className="text-center">
                <div className="text-xs text-slate-400 uppercase font-semibold">Bundles</div>
                <div className="text-2xl font-black text-slate-200">{data.scannedBundlesCount || 1}</div>
              </div>
            </div>
          )}
        </div>

        {/* Input Controls */}
        <div className="mt-6 pt-5 border-t border-slate-800 flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="https://exemplo.com ou URL de bundle .js"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>
          <button
            onClick={() => runScan()}
            disabled={isLoading}
            className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all cursor-pointer"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {isLoading ? 'Minerando Scripts...' : 'Minerar Scripts JS'}
          </button>
        </div>
      </div>

      {/* Tabs Filter Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('secrets')}
          className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
            activeTab === 'secrets'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          Segredos & Chaves ({secrets.length})
        </button>
        <button
          onClick={() => setActiveTab('buckets')}
          className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
            activeTab === 'buckets'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Database className="w-4 h-4" />
          Cloud Buckets ({buckets.length})
        </button>
        <button
          onClick={() => setActiveTab('sinks')}
          className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
            activeTab === 'sinks'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          DOM Sinks Inseguros ({sinks.length})
        </button>
        <button
          onClick={() => setActiveTab('endpoints')}
          className={`px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors ${
            activeTab === 'endpoints'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Terminal className="w-4 h-4" />
          Rotas de API ({endpoints.length})
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === 'secrets' && (
        <div className="space-y-4">
          {secrets.length === 0 ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-8 text-center">
              <Check className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-emerald-900 dark:text-emerald-200">
                Nenhum segredo crítico vazado nos scripts públicos
              </h3>
              <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1 max-w-md mx-auto">
                Não foram detectadas chaves secretas AWS, OpenAI, GitHub ou Stripe nos scripts JS analisados.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {secrets.map((sec: any) => (
                <div
                  key={sec.id}
                  className="bg-white dark:bg-slate-900 border border-rose-300 dark:border-rose-900/50 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                          {sec.severity}
                        </span>
                        <h4 className="font-semibold text-slate-900 dark:text-white text-base">
                          {sec.name}
                        </h4>
                      </div>
                      <p className="text-xs text-slate-500 font-mono break-all">
                        Fonte: {sec.source} (Linha ~{sec.line})
                      </p>
                      <div className="mt-2 inline-flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 font-mono text-xs text-rose-600 dark:text-rose-400 font-bold">
                        <span>Valor: {sec.maskedValue}</span>
                        <button
                          onClick={() => handleCopy(sec.maskedValue, sec.id)}
                          className="hover:text-slate-900 dark:hover:text-white"
                          title="Copiar"
                        >
                          {copiedId === sec.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                        <strong>Remediação:</strong> {sec.remediation}
                      </p>
                    </div>

                    {onRunAIFix && (
                      <button
                        onClick={() => onRunAIFix({
                          id: sec.id,
                          title: `Vazamento de ${sec.name}`,
                          category: 'security',
                          severity: sec.severity,
                          summary: `Chave ${sec.name} exposta publicamente no bundle JS. ${sec.remediation}`
                        })}
                        className="px-3 py-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-indigo-100 transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" /> Correção IA
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'buckets' && (
        <div className="space-y-4">
          {buckets.length === 0 ? (
            <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl p-8 text-center">
              <Database className="w-10 h-10 text-slate-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">
                Nenhum Bucket Cloud detectado
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Não foram identificadas referências a buckets S3, GCS ou Azure Blob nos bundles analisados.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {buckets.map((b: any) => (
                <div
                  key={b.id}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                      {b.label}
                    </span>
                  </div>
                  <div className="font-mono text-sm text-slate-900 dark:text-white font-semibold truncate">
                    {b.bucketName}
                  </div>
                  <div className="text-xs text-slate-500 font-mono truncate mt-1">
                    {b.url}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs">
                    <button
                      onClick={() => handleCopy(b.url, b.id)}
                      className="text-indigo-600 dark:text-indigo-400 font-medium flex items-center gap-1 hover:underline"
                    >
                      {copiedId === b.id ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                      Copiar URL
                    </button>
                    <a
                      href={b.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1"
                    >
                      Testar Acesso <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'sinks' && (
        <div className="space-y-4">
          {sinks.length === 0 ? (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-8 text-center">
              <Check className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-emerald-900 dark:text-emerald-200">
                Nenhum DOM Sink perigoso encontrado
              </h3>
              <p className="text-sm text-emerald-700 dark:text-emerald-400 mt-1">
                Sem chamadas diretas a eval(), document.write() ou postMessage(*) nos scripts avaliados.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3">
              {sinks.map((s: any) => (
                <div
                  key={s.id}
                  className="bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-900/40 rounded-xl p-4 shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                        {s.severity.toUpperCase()}
                      </span>
                      <h4 className="font-semibold text-slate-900 dark:text-white text-base">
                        {s.name} ({s.occurrences}x)
                      </h4>
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
                    {s.description}
                  </p>
                  <p className="text-xs text-slate-500 font-mono mt-2 truncate">
                    Detectado em: {s.source}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'endpoints' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
          <h3 className="text-base font-bold text-slate-900 dark:text-white mb-3">
            Rotas Internas Descobertas no Código ({endpoints.length})
          </h3>
          {endpoints.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhuma rota de API extraída.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {endpoints.map((ep: string, idx: number) => (
                <div
                  key={idx}
                  className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg px-3 py-2 font-mono text-xs text-slate-700 dark:text-slate-300 truncate"
                  title={ep}
                >
                  {ep}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
