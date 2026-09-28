import React, { useState, useMemo } from 'react';
import {
  X,
  Bell,
  Send,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Code,
  Terminal,
  ExternalLink,
  Sparkles,
} from 'lucide-react';
import { AuditReport, WebhookConfig } from '../types';

interface WebhookAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: AuditReport;
}

export const WebhookAlertModal: React.FC<WebhookAlertModalProps> = ({
  isOpen,
  onClose,
  report,
}) => {
  const [config, setConfig] = useState<WebhookConfig>({
    webhookUrl: '',
    platform: 'slack',
    triggerMinScore: 80,
    triggerOnCritical: true,
    triggerOnRegression: true,
  });

  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendStatus, setSendStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Formatted JSON payload depending on platform
  const payloadData = useMemo(() => {
    const hostname = new URL(report.targetUrl).hostname;
    const isUnderMinScore = report.overallScore < config.triggerMinScore;
    const criticalCount = report.items.filter((i) => i.severity === 'critical').length;

    if (config.platform === 'slack') {
      return {
        text: `🚨 Alerta WebAudit: ${hostname} recebeu nota ${report.overallScore}/100`,
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: `🚨 Relatório de Auditoria: ${hostname}`,
            },
          },
          {
            type: 'section',
            fields: [
              { type: 'mrkdwn', text: `*Score Geral:*\n${report.overallScore}/100 (Grade ${report.overallGrade})` },
              { type: 'mrkdwn', text: `*Falhas Críticas:*\n${criticalCount} itens` },
              { type: 'mrkdwn', text: `*Segurança:*\n${report.categories.security.score}%` },
              { type: 'mrkdwn', text: `*Performance:*\n${report.categories.performance_accessibility.score}%` },
            ],
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*Resumo da IA:*\n>${report.aiExecutiveSummary.slice(0, 180)}...`,
            },
          },
          {
            type: 'actions',
            elements: [
              {
                type: 'button',
                text: { type: 'plain_text', text: 'Ver Auditoria Completa' },
                url: report.targetUrl,
              },
            ],
          },
        ],
      };
    }

    if (config.platform === 'discord') {
      return {
        username: 'WebAudit Bot',
        avatar_url: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png',
        embeds: [
          {
            title: `🛡️ Auditoria Web Concluída: ${hostname}`,
            url: report.targetUrl,
            color: report.overallScore >= 80 ? 3066993 : 15158332,
            fields: [
              { name: 'Pontuação Geral', value: `${report.overallScore}/100 (Nota ${report.overallGrade})`, inline: true },
              { name: 'Falhas Críticas', value: `${criticalCount} críticas`, inline: true },
              { name: 'Segurança', value: `${report.categories.security.score}%`, inline: true },
              { name: 'Diagnóstico IA', value: report.aiExecutiveSummary.slice(0, 200) + '...' },
            ],
            footer: { text: `WebAudit Engine • ${new Date().toLocaleDateString('pt-BR')}` },
          },
        ],
      };
    }

    // Generic JSON
    return {
      event: 'audit.completed',
      timestamp: new Date().toISOString(),
      targetUrl: report.targetUrl,
      overallScore: report.overallScore,
      overallGrade: report.overallGrade,
      categories: {
        security: report.categories.security.score,
        seo: report.categories.seo.score,
        bestPractices: report.categories.best_practices.score,
        performance: report.categories.performance_accessibility.score,
      },
      criticalIssuesCount: criticalCount,
      topPriorityFixes: report.topPriorityFixes,
    };
  }, [report, config]);

  const jsonString = useMemo(() => JSON.stringify(payloadData, null, 2), [payloadData]);

  const curlCommand = useMemo(() => {
    const url = config.webhookUrl || 'https://hooks.slack.com/services/...';
    return `curl -X POST -H "Content-Type: application/json" -d '${JSON.stringify(payloadData)}' "${url}"`;
  }, [config.webhookUrl, payloadData]);

  if (!isOpen) return null;

  const handleTestSend = async () => {
    if (!config.webhookUrl.trim()) {
      setSendStatus({ type: 'error', message: 'Por favor, informe a URL do Webhook do Slack ou Discord.' });
      return;
    }

    setIsSending(true);
    setSendStatus(null);

    try {
      // Direct POST or mock fallback
      await fetch(config.webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payloadData),
        mode: 'no-cors', // In case webhook doesn't support CORS directly from browser
      });

      setSendStatus({
        type: 'success',
        message: 'Disparo de teste efetuado com sucesso! Verifique o canal no seu Slack ou Discord.',
      });
    } catch (err: any) {
      setSendStatus({
        type: 'error',
        message: `Erro ao disparar webhook: ${err.message || 'Falha de rede'}. O comando cURL pode ser usado em pipelines.`,
      });
    } finally {
      setIsSending(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedType(id);
    setTimeout(() => setCopiedType(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#141414]/75 backdrop-blur-xs font-mono">
      <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col border-2 border-[#141414] bg-white shadow-[8px_8px_0px_#141414] text-[#141414]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b-2 border-[#141414] p-4 bg-[#E4E3E0] shrink-0">
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-[#141414]" />
            <div>
              <h3 className="text-sm font-black uppercase">
                Monitoramento Contínuo & Webhooks (Slack / Discord)
              </h3>
              <p className="text-[11px] text-[#141414]/70">
                Configure notificações automáticas em tempo real para regressões de score e falhas críticas
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="border border-[#141414] p-1 bg-white hover:bg-neutral-200 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="overflow-y-auto p-5 space-y-5 flex-1 text-xs">
          {/* Webhook Configuration Card */}
          <div className="border-2 border-[#141414] bg-[#E4E3E0] p-4 shadow-[2px_2px_0px_#141414] space-y-3">
            <div>
              <label className="font-bold block mb-1">URL do Webhook Receptor:</label>
              <input
                type="url"
                placeholder="https://hooks.slack.com/services/... ou https://discord.com/api/webhooks/..."
                value={config.webhookUrl}
                onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
                className="w-full bg-white border border-[#141414] p-2 font-mono text-xs"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-bold block mb-1">Formato do Payload:</label>
                <div className="flex items-center gap-2">
                  {(['slack', 'discord', 'generic'] as const).map((plat) => (
                    <button
                      key={plat}
                      type="button"
                      onClick={() => setConfig({ ...config, platform: plat })}
                      className={`flex-1 py-1.5 px-2 border uppercase font-bold text-center cursor-pointer transition-all ${
                        config.platform === plat
                          ? 'bg-[#141414] text-white border-[#141414]'
                          : 'bg-white text-[#141414] border-[#141414] hover:bg-neutral-100'
                      }`}
                    >
                      {plat === 'generic' ? 'JSON PURO' : plat.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">Disparar Alerta Se Score Menor Que:</label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={config.triggerMinScore}
                    onChange={(e) => setConfig({ ...config, triggerMinScore: Number(e.target.value) })}
                    className="w-20 bg-white border border-[#141414] p-1.5 font-bold"
                  />
                  <span className="text-[11px] text-[#141414]/70">/ 100 pontos</span>
                </div>
              </div>
            </div>

            {/* Trigger switches */}
            <div className="pt-2 border-t border-[#141414]/20 flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer font-bold select-none">
                <input
                  type="checkbox"
                  checked={config.triggerOnCritical}
                  onChange={(e) => setConfig({ ...config, triggerOnCritical: e.target.checked })}
                  className="accent-[#141414] w-4 h-4 cursor-pointer"
                />
                <span>Alertar se houver falha de segurança crítica</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-bold select-none">
                <input
                  type="checkbox"
                  checked={config.triggerOnRegression}
                  onChange={(e) => setConfig({ ...config, triggerOnRegression: e.target.checked })}
                  className="accent-[#141414] w-4 h-4 cursor-pointer"
                />
                <span>Alertar em caso de regressão de nota vs. anterior</span>
              </label>
            </div>
          </div>

          {/* Test Status feedback */}
          {sendStatus && (
            <div
              className={`p-3 border-2 flex items-start gap-2 ${
                sendStatus.type === 'success'
                  ? 'bg-emerald-100 text-emerald-950 border-emerald-700'
                  : 'bg-rose-100 text-rose-950 border-rose-700'
              }`}
            >
              {sendStatus.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-rose-700 shrink-0 mt-0.5" />
              )}
              <span>{sendStatus.message}</span>
            </div>
          )}

          {/* Payload Preview & Copy Options */}
          <div className="border-2 border-[#141414] bg-[#141414] text-[#E4E3E0] shadow-[4px_4px_0px_#141414]">
            <div className="flex items-center justify-between border-b border-[#333333] px-4 py-2 bg-[#1C1C1C]">
              <div className="flex items-center gap-2">
                <Code className="h-4 w-4 text-neutral-400" />
                <span className="font-bold text-white">Payload Formatado ({config.platform.toUpperCase()})</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => copyToClipboard(jsonString, 'json')}
                  className="flex items-center gap-1 border border-neutral-600 px-2 py-0.5 text-[10px] text-neutral-300 hover:text-white cursor-pointer"
                >
                  {copiedType === 'json' ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedType === 'json' ? 'COPIADO' : 'COPIAR JSON'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => copyToClipboard(curlCommand, 'curl')}
                  className="flex items-center gap-1 border border-neutral-600 px-2 py-0.5 text-[10px] text-neutral-300 hover:text-white cursor-pointer"
                >
                  {copiedType === 'curl' ? <Check className="h-3 w-3 text-emerald-400" /> : <Terminal className="h-3 w-3" />}
                  <span>{copiedType === 'curl' ? 'COPIADO' : 'COPIAR CURL'}</span>
                </button>
              </div>
            </div>

            <pre className="p-4 font-mono text-[11px] overflow-x-auto max-h-56 leading-relaxed selection:bg-amber-400 selection:text-black">
              <code>{jsonString}</code>
            </pre>
          </div>

          {/* CI/CD Integration Guide */}
          <div className="border border-[#141414] p-3 bg-neutral-50 text-[11px] space-y-1">
            <span className="font-bold block uppercase text-[#141414]">Como usar em Pipelines CI/CD (GitHub Actions):</span>
            <p className="text-[#141414]/70">
              Adicione a chamada cURL acima no seu workflow após o comando <code>npm run build && npm run deploy</code> para alertar o time instantaneamente no Slack sempre que uma nova versão entrar no ar.
            </p>
          </div>
        </div>

        {/* Modal Footer Actions */}
        <div className="flex items-center justify-between border-t-2 border-[#141414] p-4 bg-[#E4E3E0] shrink-0">
          <span className="text-[11px] text-[#141414]/70">
            Pronto para testar o envio com as regras configuradas
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="border border-[#141414] bg-white px-3 py-1.5 font-bold hover:bg-neutral-100 cursor-pointer"
            >
              FECHAR
            </button>

            <button
              type="button"
              disabled={isSending}
              onClick={handleTestSend}
              className="flex items-center gap-1.5 border-2 border-[#141414] bg-[#141414] text-white px-4 py-1.5 font-bold hover:bg-neutral-800 shadow-[2px_2px_0px_#888888] cursor-pointer disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              <span>{isSending ? 'DISPARANDO...' : 'TESTAR DISPARO DE ALERTA'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
