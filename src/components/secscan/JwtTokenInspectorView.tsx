import React, { useState } from 'react';
import {
  Key,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Copy,
  Check,
  RefreshCw,
  Lock,
  Unlock,
  Sparkles,
  Info
} from 'lucide-react';

const SAMPLE_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkFkbWluIFVzZXIiLCJyb2xlIjoiYWRtaW4iLCJpYXQiOjE1MTYyMzkwMjIsImV4cCI6MTk5OTk5OTk5OX0.4flgLq69uY9u1yLpQ_fX45jZ02K6bA_oY3yT9rJ6y_Y';

export function JwtTokenInspectorView() {
  const [tokenInput, setTokenInput] = useState(SAMPLE_JWT);
  const [secretKey, setSecretKey] = useState('secret');
  const [decodedHeader, setDecodedHeader] = useState<any | null>(null);
  const [decodedPayload, setDecodedPayload] = useState<any | null>(null);
  const [signatureRaw, setSignatureRaw] = useState('');
  const [vulnerabilities, setVulnerabilities] = useState<string[]>([]);
  const [copiedPart, setCopiedPart] = useState<string | null>(null);

  const decodeJwt = (jwt: string) => {
    try {
      const parts = jwt.trim().split('.');
      if (parts.length < 2) {
        alert('Formato JWT inválido (esperado header.payload.signature)');
        return;
      }

      const parseBase64Url = (str: string) => {
        let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4) {
          base64 += '=';
        }
        return JSON.parse(decodeURIComponent(escape(atob(base64))));
      };

      const header = parseBase64Url(parts[0]);
      const payload = parseBase64Url(parts[1]);
      const signature = parts[2] || '';

      setDecodedHeader(header);
      setDecodedPayload(payload);
      setSignatureRaw(signature);

      // Audit token
      const vulns: string[] = [];

      // Check algorithm none
      if (!header.alg || header.alg.toLowerCase() === 'none') {
        vulns.push('Vulnerabilidade Crítica: Algoritmo "none" configurado! O token não possui assinatura digital e pode ser falsificado por qualquer usuário.');
      }

      // Check algorithm RS256 confusion or symmetric
      if (header.alg === 'HS256') {
        vulns.push('Aviso de Algoritmo Simétrico (HS256): Certifique-se de que o segredo não seja adivinhável por força bruta e não compartilhe com o cliente.');
      }

      // Check expiration
      if (!payload.exp) {
        vulns.push('Ausência de Expiração (exp claim): Token perpétuo! Sem data de validade, um token interceptado nunca expira.');
      } else {
        const now = Math.floor(Date.now() / 1000);
        if (payload.exp < now) {
          vulns.push(`Token Expirado: A data de expiração (${new Date(payload.exp * 1000).toLocaleString()}) já passou.`);
        }
      }

      // Check sensitive data in payload
      const strPayload = JSON.stringify(payload).toLowerCase();
      if (strPayload.includes('password') || strPayload.includes('senha') || strPayload.includes('credit_card')) {
        vulns.push('Dados Sensíveis no Payload: JWT é apenas codificado em Base64, NÃO criptografado! Qualquer um pode ler senhas e cartões no payload.');
      }

      setVulnerabilities(vulns);
    } catch (e: any) {
      alert(`Falha ao decodificar JWT: ${e.message}`);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPart(id);
    setTimeout(() => setCopiedPart(null), 2000);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-teal-950/40 to-slate-900 border border-teal-500/30 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-400/30 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" /> SecScan Engine: JWT Inspector Pro
              </span>
              <span className="text-xs text-slate-400">JSON Web Token Security Auditor</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Auditor & Analisador de Segurança JWT
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Decodifique e audite tokens JWT contra exploração do algoritmo "none", confusão de chave pública/privada (RS256 vs HS256), ausência de tempo de expiração e dados confidenciais expostos.
            </p>
          </div>
        </div>

        {/* Input */}
        <div className="mt-6 pt-5 border-t border-slate-800 space-y-3">
          <textarea
            rows={3}
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="Cole aqui o token JWT (header.payload.signature)..."
            className="w-full bg-slate-800/80 border border-slate-700 rounded-xl p-3 font-mono text-xs text-teal-300 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-teal-500"
          />
          <div className="flex justify-end gap-3">
            <button
              onClick={() => decodeJwt(tokenInput)}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-teal-600/30 transition-all cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              Decodificar & Auditar Token
            </button>
          </div>
        </div>
      </div>

      {/* Vulnerabilities Alert */}
      {vulnerabilities.length > 0 && (
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-300 dark:border-rose-900/60 rounded-xl p-5 space-y-2">
          <h3 className="font-bold text-rose-800 dark:text-rose-200 text-sm flex items-center gap-2">
            <ShieldAlert className="w-4 h-4" /> Problemas de Segurança Detectados no Token ({vulnerabilities.length}):
          </h3>
          <ul className="space-y-1.5 list-disc list-inside text-xs text-rose-700 dark:text-rose-300">
            {vulnerabilities.map((v, i) => (
              <li key={i}>{v}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Decoded Blocks */}
      {decodedHeader && decodedPayload && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Header */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                HEADER: ALGORITMO & TIPO
              </span>
              <button
                onClick={() => handleCopy(JSON.stringify(decodedHeader, null, 2), 'header')}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1"
              >
                {copiedPart === 'header' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                Copiar
              </button>
            </div>
            <pre className="bg-slate-950 text-rose-400 p-4 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800">
              {JSON.stringify(decodedHeader, null, 2)}
            </pre>
          </div>

          {/* Payload */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                PAYLOAD: CLAIMS & DADOS DO USUÁRIO
              </span>
              <button
                onClick={() => handleCopy(JSON.stringify(decodedPayload, null, 2), 'payload')}
                className="text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white flex items-center gap-1"
              >
                {copiedPart === 'payload' ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                Copiar
              </button>
            </div>
            <pre className="bg-slate-950 text-purple-400 p-4 rounded-xl font-mono text-xs overflow-x-auto border border-slate-800">
              {JSON.stringify(decodedPayload, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}
