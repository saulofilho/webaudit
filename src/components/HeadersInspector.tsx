import React, { useState } from 'react';
import { Terminal, Shield, Check, X, AlertTriangle, Search, Copy, CheckCheck } from 'lucide-react';
import { SecurityHeaderCheck } from '../types';

interface HeadersInspectorProps {
  securityHeaders: SecurityHeaderCheck[];
  allHeaders: Record<string, string>;
  statusCode: number;
  statusText: string;
  responseTimeMs: number;
  tlsVersion?: string;
}

export const HeadersInspector: React.FC<HeadersInspectorProps> = ({
  securityHeaders,
  allHeaders,
  statusCode,
  statusText,
  responseTimeMs,
  tlsVersion,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const headerEntries = Object.entries(allHeaders).filter(([k, v]) =>
    k.toLowerCase().includes(searchTerm.toLowerCase()) || String(v).toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 font-mono text-xs text-[#141414]">
      {/* Response Overview Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3 border-2 border-[#141414] shadow-[2px_2px_0px_#141414]">
          <span className="text-[10px] text-[#141414]/70 font-bold block mb-1 uppercase">STATUS HTTP</span>
          <div className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 border border-[#141414] ${statusCode >= 200 && statusCode < 300 ? 'bg-emerald-600' : 'bg-amber-600'}`} />
            <span className="text-sm sm:text-base font-black text-[#141414]">{statusCode} {statusText}</span>
          </div>
        </div>

        <div className="bg-white p-3 border-2 border-[#141414] shadow-[2px_2px_0px_#141414]">
          <span className="text-[10px] text-[#141414]/70 font-bold block mb-1 uppercase">LATÊNCIA (TTFB)</span>
          <span className="text-sm sm:text-base font-black text-[#141414]">{responseTimeMs} ms</span>
        </div>

        <div className="bg-white p-3 border-2 border-[#141414] shadow-[2px_2px_0px_#141414]">
          <span className="text-[10px] text-[#141414]/70 font-bold block mb-1 uppercase">CRIPTOGRAFIA</span>
          <span className="text-xs font-bold text-emerald-800 truncate block">{tlsVersion || 'HTTPS / TLS'}</span>
        </div>

        <div className="bg-white p-3 border-2 border-[#141414] shadow-[2px_2px_0px_#141414]">
          <span className="text-[10px] text-[#141414]/70 font-bold block mb-1 uppercase">TOTAL DE HEADERS</span>
          <span className="text-sm sm:text-base font-black text-[#141414]">{Object.keys(allHeaders).length}</span>
        </div>
      </div>

      {/* Security Headers Matrix */}
      <div className="border-2 border-[#141414] bg-white p-4 sm:p-5 shadow-[4px_4px_0px_#141414]">
        <div className="flex items-center gap-2 mb-4 border-b-2 border-[#141414] pb-2">
          <Shield className="h-4 w-4 text-[#141414]" />
          <h3 className="text-xs sm:text-sm font-black text-[#141414] uppercase tracking-wider">
            AUDITORIA DE CABEÇALHOS DE PROTEÇÃO (SECURITY HEADERS)
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-[#141414]">
            <thead>
              <tr className="bg-[#E4E3E0] border-b border-[#141414] text-[#141414] font-bold">
                <th className="p-2.5 font-black uppercase">Cabeçalho</th>
                <th className="p-2.5 font-black uppercase">Status</th>
                <th className="p-2.5 font-black uppercase">Valor Detectado</th>
                <th className="p-2.5 font-black uppercase">Recomendação Técnica</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#141414]/30">
              {securityHeaders.map((sh, idx) => (
                <tr key={idx} className="hover:bg-[#E4E3E0]/40 transition-colors">
                  <td className="p-2.5 font-bold text-[#141414] pr-3 whitespace-nowrap">
                    {sh.header}
                  </td>
                  <td className="p-2.5 pr-3 whitespace-nowrap">
                    {sh.status === 'present' ? (
                      <span className="inline-flex items-center gap-1 bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-950 border border-emerald-700">
                        <Check className="h-3 w-3" /> CONFIGURADO
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-950 border border-rose-700">
                        <X className="h-3 w-3" /> AUSENTE
                      </span>
                    )}
                  </td>
                  <td className="p-2.5 text-[#141414]/80 pr-3 max-w-xs truncate">
                    {sh.value || <span className="text-[#141414]/40 italic">Não enviado</span>}
                  </td>
                  <td className="p-2.5 text-[#141414] font-semibold max-w-xs truncate">
                    {sh.recommended}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Raw HTTP Headers Inspector */}
      <div className="border-2 border-[#141414] bg-white p-4 sm:p-5 shadow-[4px_4px_0px_#141414]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 border-b-2 border-[#141414] pb-2">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-[#141414]" />
            <h3 className="text-xs sm:text-sm font-black text-[#141414] uppercase tracking-wider">
              TODOS OS CABEÇALHOS HTTP RECEBIDOS ({Object.keys(allHeaders).length})
            </h3>
          </div>

          <div className="relative">
            <Search className="h-3.5 w-3.5 text-[#141414] absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filtrar headers..."
              className="bg-[#E4E3E0] border border-[#141414] pl-8 pr-3 py-1 text-xs text-[#141414] placeholder-[#141414]/50 focus:outline-none focus:bg-white w-48 font-mono"
            />
          </div>
        </div>

        <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
          {headerEntries.length === 0 ? (
            <p className="text-xs text-[#141414]/60 py-4 text-center">Nenhum cabeçalho corresponde ao filtro.</p>
          ) : (
            headerEntries.map(([key, value]) => (
              <div
                key={key}
                className="flex items-center justify-between gap-3 p-2 bg-[#E4E3E0]/40 border border-[#141414] hover:bg-[#E4E3E0] transition-colors text-xs"
              >
                <div className="flex-1 truncate">
                  <span className="text-[#141414] font-black">{key}: </span>
                  <span className="text-[#141414]/90 break-all">{value}</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopy(`${key}: ${value}`, key)}
                  className="text-[#141414] hover:bg-[#141414] hover:text-white p-1 border border-[#141414] transition-colors shrink-0 bg-white"
                  title="Copiar cabeçalho"
                >
                  {copiedKey === key ? <CheckCheck className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
