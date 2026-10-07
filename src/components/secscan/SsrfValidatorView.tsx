import React, { useState } from 'react';
import {
  Globe,
  Server,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Copy,
  Check,
  ShieldCheck,
  Code2,
  Terminal,
  Info
} from 'lucide-react';

export function SsrfValidatorView() {
  const [testUrl, setTestUrl] = useState('http://169.254.169.254/latest/meta-data/');
  const [evaluation, setEvaluation] = useState<any | null>(null);
  const [copied, setCopied] = useState(false);

  const evaluateSsrf = (urlStr: string) => {
    try {
      const parsed = new URL(urlStr);
      const host = parsed.hostname.toLowerCase();

      let isDangerous = false;
      let reason = '';
      let vector = 'Público';

      // Check cloud metadata
      if (host === '169.254.169.254' || host.includes('metadata.google') || host === 'instance-data') {
        isDangerous = true;
        vector = 'Cloud Metadata Service (AWS/GCP/Azure/OpenStack)';
        reason = 'Endereço link-local de metadados da nuvem. Pode vazar IAM tokens, credenciais de instância e certificados de cluster.';
      }
      // Check localhost
      else if (host === 'localhost' || host === '127.0.0.1' || host === '0.0.0.0' || host === '::1' || host === '127.0.0.2') {
        isDangerous = true;
        vector = 'Loopback Localhost';
        reason = 'Acesso ao loopback interno da máquina/container, expondo portas administrativas locais (ex: Redis 6379, MySQL 3306).';
      }
      // Check RFC 1918 private subnets
      else if (
        host.startsWith('10.') ||
        host.startsWith('192.168.') ||
        /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)
      ) {
        isDangerous = true;
        vector = 'RFC1918 Private Subnet';
        reason = 'Faixa de rede privada interna da infraestrutura corporativa.';
      }
      // Check alternative encodings (e.g., 2130706433 = 127.0.0.1, hex 0x7f000001)
      else if (/^\d+$/.test(host) || /^0x[0-9a-fA-F]+$/.test(host)) {
        isDangerous = true;
        vector = 'Decimal / Hex IP Obfuscation';
        reason = 'IP codificado em notação decimal ou hexadecimal para burlar filtros ingênuos de string.';
      }

      setEvaluation({
        url: urlStr,
        host,
        protocol: parsed.protocol,
        isDangerous,
        vector,
        reason: reason || 'URL aparenta apontar para a internet pública, sem colisão imediata com metadados ou loopback.',
        status: isDangerous ? 'BLOCKED' : 'ALLOWED'
      });
    } catch {
      setEvaluation({
        url: urlStr,
        isDangerous: true,
        vector: 'Invalid URL Format',
        reason: 'A string fornecida não é uma URL HTTP/HTTPS válida.',
        status: 'BLOCKED'
      });
    }
  };

  const handleCopySnippet = (snippet: string) => {
    navigator.clipboard.writeText(snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const safeClientCode = `// Padrão Seguro Anti-SSRF em Node.js / Express
import dns from 'dns/promises';
import ipaddr from 'ipaddr.js';

export async function safeFetch(targetUrl: string) {
  const url = new URL(targetUrl);
  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Protocolo proibido');
  }

  // 1. Resolução segura de DNS para evitar DNS Rebinding
  const addresses = await dns.resolve4(url.hostname);
  for (const ip of addresses) {
    const parsed = ipaddr.parse(ip);
    // 2. Bloquear metadados, loopback e RFC1918
    if (parsed.range() !== 'unicast') {
      throw new Error(\`IP privado ou restrito detectado: \${ip}\`);
    }
  }

  // 3. Executar fetch com timeout e sem seguir redirects cegamente
  return fetch(url.toString(), { redirect: 'error' });
}`;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-purple-500/30 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-400/30 flex items-center gap-1.5">
                <Server className="w-3.5 h-3.5" /> SecScan Engine: SSRF Validator Pro
              </span>
              <span className="text-xs text-slate-400">Server-Side Request Forgery Defense</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Validador & Proteção Anti-SSRF
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Avalie se endpoints que recebem URLs de clientes possuem salvaguardas contra o sequestro de credenciais de metadados da nuvem (AWS IMDSv1/v2, GCP) e IPs privados.
            </p>
          </div>
        </div>

        {/* Input Bar */}
        <div className="mt-6 pt-5 border-t border-slate-800 flex flex-col md:flex-row gap-3">
          <input
            type="text"
            placeholder="http://169.254.169.254/latest/meta-data/"
            value={testUrl}
            onChange={(e) => setTestUrl(e.target.value)}
            className="flex-1 bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            onClick={() => evaluateSsrf(testUrl)}
            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-purple-600/30 transition-all cursor-pointer"
          >
            <ShieldCheck className="w-4 h-4" />
            Validar Vetor SSRF
          </button>
        </div>

        {/* Presets */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400">Exemplos de ataque:</span>
          {[
            'http://169.254.169.254/latest/meta-data/iam/security-credentials/',
            'http://localhost:6379',
            'http://127.0.0.1:8080/actuator',
            'http://2130706433',
            'http://metadata.google.internal/computeMetadata/v1/'
          ].map((preset, idx) => (
            <button
              key={idx}
              onClick={() => {
                setTestUrl(preset);
                evaluateSsrf(preset);
              }}
              className="text-xs bg-slate-800/60 hover:bg-slate-700 px-2.5 py-1 rounded-md text-slate-300 font-mono transition-colors"
            >
              {preset.slice(0, 32)}...
            </button>
          ))}
        </div>
      </div>

      {/* Evaluation Output */}
      {evaluation && (
        <div
          className={`border rounded-xl p-5 shadow-sm ${
            evaluation.isDangerous
              ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-300 dark:border-rose-900/60'
              : 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/50'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {evaluation.isDangerous ? (
                  <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase bg-rose-600 text-white">
                    VETOR PERIGOSO DETECTADO (BLOQUEAR)
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded text-xs font-bold uppercase bg-emerald-600 text-white">
                    URL PÚBLICA APARENTE
                  </span>
                )}
                <span className="font-semibold text-slate-900 dark:text-white text-sm">
                  Categoria: {evaluation.vector}
                </span>
              </div>
              <p className="text-sm text-slate-700 dark:text-slate-300 mt-2">
                {evaluation.reason}
              </p>
              <div className="mt-2 text-xs font-mono text-slate-500">
                Alvo: {evaluation.url}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remediation Guide & Secure Code Pattern */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Code2 className="w-5 h-5 text-purple-600" /> Código de Defesa: Safe HTTP Client Anti-SSRF
          </h3>
          <button
            onClick={() => handleCopySnippet(safeClientCode)}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            Copiar Implementação
          </button>
        </div>
        <p className="text-xs text-slate-500">
          Utilize resolução de DNS pré-requisição com validação de unicast para impedir ataques SSRF com DNS Rebinding e evasões de regex.
        </p>
        <pre className="bg-slate-950 text-slate-200 p-4 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800">
          {safeClientCode}
        </pre>
      </div>
    </div>
  );
}
