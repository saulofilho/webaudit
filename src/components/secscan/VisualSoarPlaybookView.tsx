import React, { useState } from 'react';
import {
  Workflow,
  CheckCircle2,
  Clock,
  Play,
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  FileText
} from 'lucide-react';

interface PlaybookStep {
  id: string;
  name: string;
  role: string;
  action: string;
  automated: boolean;
  completed: boolean;
}

interface SoarPlaybook {
  id: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH';
  description: string;
  trigger: string;
  steps: PlaybookStep[];
}

const PLAYBOOKS: SoarPlaybook[] = [
  {
    id: 'pb-leaked-key',
    title: 'Resposta a Chave de API / Segredo Vazado (AWS / Stripe / OpenAI)',
    severity: 'CRITICAL',
    trigger: 'Alerta gerado pelo JS-Miner ou GitHub Secret Scanning.',
    description: 'Protocolo de contenção imediata, revogação, auditoria de acesso recente e emissão de novos segredos no cofre.',
    steps: [
      { id: 's1', name: 'Revogação Imediata', role: 'Security Ops', action: 'Invalide a credencial no painel do provedor (AWS IAM, Stripe, OpenAI).', automated: true, completed: false },
      { id: 's2', name: 'Varredura de Logs (CloudTrail / SIEM)', role: 'SOC Analyst', action: 'Investigue o tráfego das últimas 72 horas gerado com a chave para detectar criação de recursos ou exfiltração.', automated: false, completed: false },
      { id: 's3', name: 'Rotação & Deploy em Cofre', role: 'DevOps / SRE', action: 'Gere uma nova chave e injete via Secrets Manager / Vault com reinicialização do pod.', automated: true, completed: false },
      { id: 's4', name: 'Comunicação & Post-Mortem', role: 'Incident Commander', action: 'Registrar incidente e notificar DPO se houve acesso a dados pessoais sensíveis.', automated: false, completed: false }
    ]
  },
  {
    id: 'pb-ddos-l7',
    title: 'Mitigação de Ataque DDoS de Aplicação (Camada 7)',
    severity: 'HIGH',
    trigger: 'Aumento repentino de 500% em requisições HTTP e latência anormal.',
    description: 'Ativação de defesas de borda, desafio JavaScript / Turnstile no WAF e isolamento de rotas consumidoras.',
    steps: [
      { id: 's1', name: 'Ativação do Modo Under Attack no WAF', role: 'WAF / CDN Admin', action: 'Forçar desafio Managed Challenge / CAPTCHA em todas as rotas públicas.', automated: true, completed: false },
      { id: 's2', name: 'Filtragem por GeoIP e ASN', role: 'Network Sec', action: 'Bloquear ASNs de data centers não residenciais e países de tráfego anômalo.', automated: true, completed: false },
      { id: 's3', name: 'Ativação de Rate Limiting Agressivo', role: 'Infra / SRE', action: 'Reduzir threshold de requisições por IP de 100/min para 20/min.', automated: true, completed: false },
      { id: 's4', name: 'Normalização & Monitoramento', role: 'NOC / SOC', action: 'Verificar queda na latência dos servidores de origem antes de desativar os desafios.', automated: false, completed: false }
    ]
  }
];

export function VisualSoarPlaybookView() {
  const [selectedPb, setSelectedPb] = useState<SoarPlaybook>(PLAYBOOKS[0]);
  const [steps, setSteps] = useState<PlaybookStep[]>(PLAYBOOKS[0].steps);

  const toggleStep = (stepId: string) => {
    setSteps(prev =>
      prev.map(s => (s.id === stepId ? { ...s, completed: !s.completed } : s))
    );
  };

  const handleSelectPlaybook = (pb: SoarPlaybook) => {
    setSelectedPb(pb);
    setSteps(pb.steps);
  };

  const completedCount = steps.filter(s => s.completed).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-sky-950/40 to-slate-900 border border-sky-500/30 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-sky-500/20 text-sky-300 border border-sky-400/30 flex items-center gap-1.5">
                <Workflow className="w-3.5 h-3.5" /> SecScan Engine: Visual SOAR Playbooks
              </span>
              <span className="text-xs text-slate-400">Security Orchestration, Automation & Response</span>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Playbooks Automatizados de Resposta a Incidentes
            </h2>
            <p className="text-sm text-slate-300 max-w-2xl mt-1">
              Guia interativo de contenção, erradicação e recuperação de incidentes cibernéticos críticos com automações pré-configuradas e rastreamento de SLA.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-900/80 border border-slate-700/60 rounded-xl px-5 py-3">
            <div className="text-center">
              <div className="text-xs text-slate-400 uppercase font-semibold">Progresso</div>
              <div className="text-2xl font-black text-sky-400">{progressPercent}%</div>
            </div>
            <div className="h-8 w-px bg-slate-700" />
            <div className="text-center">
              <div className="text-xs text-slate-400 uppercase font-semibold">Etapas</div>
              <div className="text-2xl font-black text-slate-200">
                {completedCount}/{steps.length}
              </div>
            </div>
          </div>
        </div>

        {/* Playbook Selector Pills */}
        <div className="mt-6 pt-5 border-t border-slate-800 flex flex-wrap gap-2">
          {PLAYBOOKS.map(pb => (
            <button
              key={pb.id}
              onClick={() => handleSelectPlaybook(pb)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedPb.id === pb.id
                  ? 'bg-sky-600 text-white shadow-lg shadow-sky-600/30'
                  : 'bg-slate-800/80 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {pb.title.split('(')[0].trim()}
            </button>
          ))}
        </div>
      </div>

      {/* Main Playbook Workflow */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-sky-600 dark:text-sky-400">
            INCIDENT RESPONSE WORKFLOW
          </span>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
            {selectedPb.title}
          </h3>
          <p className="text-xs text-slate-500 mt-1">{selectedPb.description}</p>
          <div className="mt-2 text-xs font-mono text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
            <strong>Gatilho do Incidente:</strong> {selectedPb.trigger}
          </div>
        </div>

        {/* Steps List */}
        <div className="space-y-3">
          {steps.map((st, idx) => (
            <div
              key={st.id}
              className={`border rounded-xl p-4 transition-all flex items-start gap-4 ${
                st.completed
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800/50'
                  : 'bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700'
              }`}
            >
              <button
                onClick={() => toggleStep(st.id)}
                className={`mt-0.5 p-1 rounded-lg border transition-colors cursor-pointer ${
                  st.completed
                    ? 'bg-emerald-600 border-emerald-600 text-white'
                    : 'border-slate-300 dark:border-slate-600 text-transparent hover:border-sky-500'
                }`}
              >
                <CheckCircle2 className="w-5 h-5" />
              </button>

              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-slate-400">
                    Passo {idx + 1}
                  </span>
                  <h4
                    className={`font-semibold text-sm ${
                      st.completed ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'
                    }`}
                  >
                    {st.name}
                  </h4>
                  {st.automated && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300">
                      Automatizável
                    </span>
                  )}
                  <span className="text-xs text-slate-500">({st.role})</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">{st.action}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
