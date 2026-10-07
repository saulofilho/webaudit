import React, { useState, useEffect } from 'react';
import {
  Radio,
  Search,
  ExternalLink,
  ShieldAlert,
  Flame,
  AlertTriangle,
  Globe,
  RefreshCw,
  Clock,
  Sparkles
} from 'lucide-react';

export function CyberThreatIntelHubView() {
  const [query, setQuery] = useState('');
  const [feeds, setFeeds] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchFeeds();
  }, []);

  const fetchFeeds = async (searchQuery?: string) => {
    setIsLoading(true);
    try {
      const q = searchQuery !== undefined ? searchQuery : query;
      const resp = await fetch(`/api/secscan/threat-intel?query=${encodeURIComponent(q)}`);
      const data = await resp.json();
      setFeeds(data.feeds || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-red-950/40 to-slate-900 border border-red-500/30 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-red-500/20 text-red-300 border border-red-400/30 flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5" /> SecScan Engine: Threat Intel Hub & KEV
              </span>
              <span className="text-xs text-slate-400">CISA Known Exploited Vulnerabilities</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Radar de Inteligência de Ameaças Cibernéticas & CVEs
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Monitoramento contínuo de vulnerabilidades ativamente exploradas no mundo selvagem (in the wild), correlação de ataques cibernéticos e vetores de ransomware conhecidos.
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="mt-6 pt-5 border-t border-slate-800 flex gap-3">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar CVE, fabricante, produto ou vulnerabilidade..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchFeeds()}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
          <button
            onClick={() => fetchFeeds()}
            disabled={isLoading}
            className="px-5 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition-all cursor-pointer"
          >
            {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            Consultar Radar
          </button>
        </div>
      </div>

      {/* CVE Feed Grid */}
      <div className="grid grid-cols-1 gap-4">
        {feeds.map((f, idx) => (
          <div
            key={idx}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <span className="font-mono text-base font-bold text-red-600 dark:text-red-400">
                  {f.cve}
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
                  CVSS {f.cvss} ({f.severity})
                </span>
                {f.knownRansomwareUse === 'Known' && (
                  <span className="px-2 py-0.5 rounded text-xs font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center gap-1">
                    <Flame className="w-3 h-3 text-purple-500" /> Usado por Ransomware
                  </span>
                )}
              </div>
              <span className="text-xs text-slate-400 font-mono">
                {f.source} • {f.dateAdded}
              </span>
            </div>

            <h3 className="font-semibold text-slate-900 dark:text-white text-base mt-2">
              {f.title}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Afeta: <strong>{f.vendor}</strong> ({f.product})
            </p>

            <div className="mt-3 p-3 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-300">
              <strong>Ação Exigida / Patch:</strong> {f.dueAction}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
