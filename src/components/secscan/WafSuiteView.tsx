import React, { useState, useEffect } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Search,
  RefreshCw,
  Layers,
  Lock,
  Sparkles,
  Info,
  Server
} from 'lucide-react';

interface WafSuiteProps {
  targetUrl?: string;
  onRunAIFix?: (item: any) => void;
}

export function WafSuiteView({ targetUrl, onRunAIFix }: WafSuiteProps) {
  const [urlInput, setUrlInput] = useState(targetUrl || '');
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<any | null>(null);

  useEffect(() => {
    if (targetUrl) {
      setUrlInput(targetUrl);
      runScan(targetUrl);
    }
  }, [targetUrl]);

  const runScan = async (urlToScan?: string) => {
    setIsLoading(true);
    try {
      const resp = await fetch('/api/secscan/waf', {
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

  const detectedWafs = data?.detectedWafs || [];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-blue-500/30 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-400/30 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5" /> SecScan Engine: WAF Suite Pro
              </span>
              <span className="text-xs text-slate-400">Web Application Firewall Fingerprint</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Detector de WAF & Postura de Firewall de Borda
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Identifica assinaturas de Cloudflare, AWS WAF, Akamai, Imperva, Fastly e ModSecurity, recomendando blindagem de IP de origem e mitigação de bypasses.
            </p>
          </div>

          {data && (
            <div className="flex items-center gap-4 bg-slate-900/80 border border-slate-700/60 rounded-xl px-5 py-3">
              <div className="text-center">
                <div className="text-xs text-slate-400 uppercase font-semibold">Postura WAF</div>
                <div className={`text-2xl font-black ${data.hasWaf ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {data.postureScore}/100
                </div>
              </div>
              <div className="h-8 w-px bg-slate-700" />
              <div className="text-center">
                <div className="text-xs text-slate-400 uppercase font-semibold">WAF Detectado</div>
                <div className="text-sm font-bold text-slate-200 mt-1">
                  {data.hasWaf ? detectedWafs[0]?.name : 'Nenhum'}
                </div>
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
              placeholder="https://exemplo.com"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={() => runScan()}
            disabled={isLoading}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition-all cursor-pointer"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
            {isLoading ? 'Detectando...' : 'Identificar WAF'}
          </button>
        </div>
      </div>

      {/* Results */}
      {data && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Info className="w-4 h-4 text-blue-500" /> Diagnóstico do Firewall
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {data.recommendation}
            </p>
          </div>

          {detectedWafs.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {detectedWafs.map((w: any, idx: number) => (
                <div
                  key={idx}
                  className="bg-white dark:bg-slate-900 border border-emerald-300 dark:border-emerald-800/50 rounded-xl p-5 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                          <ShieldCheck className="w-5 h-5" />
                        </span>
                        <div>
                          <h4 className="font-bold text-lg text-slate-900 dark:text-white">{w.name}</h4>
                          <span className="text-xs text-slate-500">{w.vendor}</span>
                        </div>
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-300 mt-3">{w.description}</p>
                      <div className="mt-3">
                        <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Sinais & Headers Identificados:
                        </span>
                        <div className="flex flex-wrap gap-1.5 mt-1">
                          {w.matchedSignals.map((sig: string, sIdx: number) => (
                            <span
                              key={sIdx}
                              className="px-2 py-0.5 rounded text-xs font-mono bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                            >
                              {sig}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 rounded-lg text-xs text-amber-800 dark:text-amber-300">
                        <strong>Recomendação anti-bypass:</strong> {w.bypassAdvisory}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 rounded-xl p-6 text-center">
              <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto mb-3" />
              <h3 className="font-semibold text-amber-900 dark:text-amber-200 text-base">
                Nenhum WAF de borda ativo identificado
              </h3>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-1 max-w-md mx-auto">
                Recomendamos fortemente colocar a aplicação atrás de Cloudflare, AWS WAF ou Fastly para evitar ataques de força bruta, DoS e exploits L7.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
