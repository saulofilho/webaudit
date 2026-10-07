import React, { useState } from 'react';
import {
  ShieldAlert,
  Layers,
  ArrowRight,
  Sparkles,
  Lock,
  EyeOff,
  ServerOff,
  UserCheck,
  FileCheck2,
  AlertTriangle
} from 'lucide-react';

interface StrideThreat {
  category: 'Spoofing' | 'Tampering' | 'Repudiation' | 'Information Disclosure' | 'Denial of Service' | 'Elevation of Privilege';
  letter: string;
  color: string;
  title: string;
  scenario: string;
  impactScore: number; // 1-10
  mitigation: string;
}

const DEFAULT_STRIDE: StrideThreat[] = [
  {
    category: 'Spoofing',
    letter: 'S',
    color: 'rose',
    title: 'Falsificação de Identidade (Session Hijacking & Token Replay)',
    scenario: 'Atacante intercepta cookies sem atributos Secure/HttpOnly ou tokens JWT desprotegidos e personifica um usuário legítimo no sistema.',
    impactScore: 8.5,
    mitigation: 'Implementar mTLS, cookies com prefixo __Host-, SameSite=Strict e rotação de Refresh Tokens.'
  },
  {
    category: 'Tampering',
    letter: 'T',
    color: 'amber',
    title: 'Adulteração de Parâmetros e Payloads (MITM & Data Tampering)',
    scenario: 'Modificação de parâmetros de requisição no front-end para alterar preços de itens em checkout ou IDs de recursos (BOLA / IDOR).',
    impactScore: 9.0,
    mitigation: 'Assinatura digital HMAC em dados sensíveis e autorização server-side em cada entidade acessada.'
  },
  {
    category: 'Repudiation',
    letter: 'R',
    color: 'blue',
    title: 'Repúdio de Transações e Falta de Trilha de Auditoria',
    scenario: 'Usuário realiza alteração crítica ou exclusão de dados e não há logs imutáveis que comprovem a autoria da ação.',
    impactScore: 6.5,
    mitigation: 'Logs de auditoria centralizados com carimbo de tempo RFC 3161 enviados para SIEM com retenção WORM (Write Once, Read Many).'
  },
  {
    category: 'Information Disclosure',
    letter: 'I',
    color: 'purple',
    title: 'Vazamento de Informações Confidenciais (Stack Traces & .env)',
    scenario: 'Erros 500 do servidor exibem dumps do banco de dados, versões de bibliotecas e caminhos do sistema de arquivos.',
    impactScore: 7.8,
    mitigation: 'Desativar exibição de erros verbosos em produção, mascarar dados confidenciais e aplicar cabeçalhos CSP/HSTS.'
  },
  {
    category: 'Denial of Service',
    letter: 'D',
    color: 'orange',
    title: 'Negação de Serviço por Consumo de Recursos (DDoS & ReDoS)',
    scenario: 'Consultas pesadas de GraphQL sem limite de profundidade ou regex vulneráveis (ReDoS) travando a thread do Node.js.',
    impactScore: 8.0,
    mitigation: 'Rate limiting por IP/Token, Cloudflare WAF, paginação obrigatória e restrição de complexidade de queries.'
  },
  {
    category: 'Elevation of Privilege',
    letter: 'E',
    color: 'red',
    title: 'Elevação de Privilégio (Broken Object Level Authorization)',
    scenario: 'Usuário comum altera o parâmetro "role=admin" na requisição de atualização de perfil e obtém acesso ao painel de gerenciamento.',
    impactScore: 9.8,
    mitigation: 'Controle de acesso baseado em papéis (RBAC/ABAC) estritamente validado na camada de serviço do backend.'
  }
];

export function ThreatModelingView() {
  const [threats, setThreats] = useState<StrideThreat[]>(DEFAULT_STRIDE);
  const [selectedLetter, setSelectedLetter] = useState<string>('S');

  const activeThreat = threats.find(t => t.letter === selectedLetter) || threats[0];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-rose-950/40 to-slate-900 border border-rose-500/30 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-rose-500/20 text-rose-300 border border-rose-400/30 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5" /> SecScan Engine: STRIDE Modeler Pro
              </span>
              <span className="text-xs text-slate-400">Microsoft STRIDE Methodology</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Modelagem de Ameaças Arquitetural (STRIDE)
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Mapeamento sistemático dos vetores de ataque que impactam o ecossistema da aplicação: Spoofing, Tampering, Repudiation, Information Disclosure, DoS e Elevation of Privilege.
            </p>
          </div>
        </div>

        {/* STRIDE Hex Buttons */}
        <div className="mt-6 pt-5 border-t border-slate-800 grid grid-cols-6 gap-2">
          {threats.map((t) => (
            <button
              key={t.letter}
              onClick={() => setSelectedLetter(t.letter)}
              className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
                selectedLetter === t.letter
                  ? 'bg-rose-600 text-white border-rose-400 shadow-lg shadow-rose-600/30'
                  : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <div className="text-xl font-black font-mono">{t.letter}</div>
              <div className="text-[10px] uppercase font-bold truncate mt-0.5">{t.category}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Detail Analysis Card */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
          <div>
            <span className="text-xs font-bold font-mono text-rose-600 uppercase tracking-wider">
              CATEGORIA STRIDE: {activeThreat.category}
            </span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {activeThreat.title}
            </h3>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-800 px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 shrink-0">
            <div className="text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400">Impacto DREAD</div>
              <div className="text-2xl font-black text-rose-600 dark:text-rose-400">
                {activeThreat.impactScore}/10
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Cenário de Ameaça Real
            </h4>
            <p className="text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              {activeThreat.scenario}
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-1 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> Contramedida Arquitetural & Mitigação
            </h4>
            <p className="text-sm text-slate-800 dark:text-slate-200 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 rounded-xl border border-emerald-200 dark:border-emerald-800/40 font-medium">
              {activeThreat.mitigation}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
