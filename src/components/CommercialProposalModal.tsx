import React, { useState, useMemo } from 'react';
import {
  Briefcase,
  X,
  Download,
  Copy,
  Check,
  DollarSign,
  Clock,
  Printer,
  ShieldAlert,
  Sparkles,
  Layers,
  FileCheck2,
} from 'lucide-react';
import { AuditReport } from '../types';

interface CommercialProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: AuditReport;
}

export const CommercialProposalModal: React.FC<CommercialProposalModalProps> = ({
  isOpen,
  onClose,
  report,
}) => {
  const [agencyName, setAgencyName] = useState<string>('AuditTech Solutions');
  const [clientName, setClientName] = useState<string>(new URL(report.targetUrl).hostname);
  const [hourlyRate, setHourlyRate] = useState<number>(150);
  const [currency, setCurrency] = useState<string>('R$');
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [copied, setCopied] = useState<boolean>(false);

  // Group real issues by categories
  const criticalItems = report.items.filter((i) => i.severity === 'critical');
  const warningItems = report.items.filter((i) => i.severity === 'warning');

  // Estimate hours: Critical items take ~2.5h each, Warning items ~1h each, baseline testing 4h
  const securityIssues = report.items.filter((i) => i.category === 'security' && i.severity !== 'good');
  const seoIssues = report.items.filter((i) => i.category === 'seo' && i.severity !== 'good');
  const perfIssues = report.items.filter((i) => i.category === 'performance_accessibility' && i.severity !== 'good');
  const bpIssues = report.items.filter((i) => i.category === 'best_practices' && i.severity !== 'good');

  const secHours = Math.max(3, securityIssues.length * 2);
  const seoHours = Math.max(4, seoIssues.length * 2);
  const perfHours = Math.max(4, perfIssues.length * 2);
  const bpHours = Math.max(2, bpIssues.length * 1.5);

  const totalHours = secHours + seoHours + perfHours + bpHours;
  const subtotalPrice = totalHours * hourlyRate;
  const discountAmount = Math.round((subtotalPrice * discountPercent) / 100);
  const finalPrice = subtotalPrice - discountAmount;

  const handleCopyMarkdown = () => {
    const md = `# Proposta Comercial & Orçamento de Consultoria Web
**Prestador:** ${agencyName}
**Cliente:** ${clientName} (${report.targetUrl})
**Data:** ${new Date().toLocaleDateString('pt-BR')}

---

### Diagnóstico Inicial da Auditoria
- **Pontuação Atual:** ${report.overallScore}/100 (Nota ${report.overallGrade})
- **Problemas Críticos:** ${criticalItems.length}
- **Oportunidades de Otimização:** ${warningItems.length}

---

### Escopo de Trabalho & Horas Estimadas
1. **Segurança & Cabeçalhos HTTP (HSTS, CSP, TLS):** ${secHours} horas
2. **SEO Técnico & Estruturação Semântica:** ${seoHours} horas
3. **Core Web Vitals & Otimização de Performance:** ${perfHours} horas
4. **Boas Práticas, Acessibilidade & Conformidade:** ${bpHours} horas

- **Total de Horas:** ${totalHours} horas
- **Taxa Horária:** ${currency} ${hourlyRate}/hora
- **Investimento Total:** ${currency} ${finalPrice.toLocaleString()}

---
Proposta gerada via WebAudit Pro.`;

    navigator.clipboard.writeText(md);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative flex max-h-[90vh] w-full max-w-4xl flex-col border-2 border-[#141414] bg-white shadow-[8px_8px_0px_#141414]">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#141414] bg-[#141414] px-6 py-4 text-[#E4E3E0]">
          <div className="flex items-center gap-2">
            <Briefcase className="h-5 w-5 text-amber-400" />
            <h2 className="font-mono text-sm sm:text-base font-black uppercase tracking-tight">
              Modo Proposta Comercial / Orçamento para Clientes
            </h2>
          </div>
          <button
            onClick={onClose}
            className="border border-[#E4E3E0] p-1 text-[#E4E3E0] hover:bg-white hover:text-[#141414] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Customization Bar */}
          <div className="border-2 border-[#141414] bg-[#E4E3E0]/30 p-4">
            <h3 className="text-xs font-mono font-bold uppercase text-[#141414] mb-3">
              Parâmetros da Proposta de Serviço
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-[#141414]">Sua Agência / Nome</label>
                <input
                  type="text"
                  value={agencyName}
                  onChange={(e) => setAgencyName(e.target.value)}
                  className="w-full mt-1 border border-[#141414] bg-white px-2 py-1 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-[#141414]">Nome do Cliente</label>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  className="w-full mt-1 border border-[#141414] bg-white px-2 py-1 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-[#141414]">Valor Hora ({currency})</label>
                <div className="flex mt-1">
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="border border-[#141414] border-r-0 bg-white px-1.5 py-1 text-xs font-mono"
                  >
                    <option value="R$">R$</option>
                    <option value="$">$</option>
                    <option value="€">€</option>
                  </select>
                  <input
                    type="number"
                    value={hourlyRate}
                    onChange={(e) => setHourlyRate(Number(e.target.value))}
                    className="w-full border border-[#141414] bg-white px-2 py-1 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono font-bold uppercase text-[#141414]">Desconto (%)</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={discountPercent}
                  onChange={(e) => setDiscountPercent(Number(e.target.value))}
                  className="w-full mt-1 border border-[#141414] bg-white px-2 py-1 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          {/* Printable Proposal Preview */}
          <div className="border-2 border-[#141414] bg-white p-6 shadow-sm font-mono text-xs">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-4 border-b-2 border-[#141414] gap-2">
              <div>
                <span className="text-base font-black uppercase text-[#141414]">{agencyName}</span>
                <p className="text-[11px] text-[#141414]/70">Consultoria em Engenharia Web & Otimização SEO</p>
              </div>
              <div className="text-right">
                <span className="inline-block bg-[#141414] text-white px-2 py-0.5 font-bold uppercase text-[10px]">
                  PROPOSTA TÉCNICA
                </span>
                <p className="text-[10px] text-[#141414]/70 mt-0.5">Emitido em: {new Date().toLocaleDateString('pt-BR')}</p>
              </div>
            </div>

            {/* Client & Audit Diagnostic Card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 p-3 bg-[#E4E3E0]/30 border border-[#141414]">
              <div>
                <span className="font-bold text-[#141414]">Cliente / Domínio Auditado:</span>
                <p className="font-semibold text-blue-800 break-all">{report.targetUrl}</p>
                <p className="text-[#141414]/70 mt-1">
                  Nota Atual: <strong>{report.overallScore}/100</strong> (Classificação {report.overallGrade})
                </p>
              </div>
              <div className="text-right sm:text-left md:text-right">
                <span className="font-bold text-[#141414]">Diagnóstico de Risco:</span>
                <p className="text-red-700 font-bold">{criticalItems.length} Falhas Críticas de Segurança & SEO</p>
                <p className="text-amber-800 font-bold">{warningItems.length} Oportunidades de Performance</p>
              </div>
            </div>

            {/* Scope of Work Table */}
            <div className="mt-5">
              <h4 className="font-black uppercase text-[#141414] mb-2">Escopo dos Serviços de Remediação</h4>
              <table className="w-full border border-[#141414] border-collapse text-left">
                <thead>
                  <tr className="bg-[#141414] text-white uppercase text-[10px]">
                    <th className="p-2 border-r border-[#333]">Módulo de Entrega</th>
                    <th className="p-2 border-r border-[#333]">Entregáveis Principais</th>
                    <th className="p-2 border-r border-[#333] text-center">Horas</th>
                    <th className="p-2 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#141414]/20">
                  <tr>
                    <td className="p-2 font-bold border-r border-[#141414]/20">1. Blindagem de Segurança</td>
                    <td className="p-2 border-r border-[#141414]/20 text-[#141414]/80">
                      Implementação HSTS, CSP, cabeçalhos anti-clickjacking e SSL hardening.
                    </td>
                    <td className="p-2 text-center font-bold border-r border-[#141414]/20">{secHours}h</td>
                    <td className="p-2 text-right font-bold">{currency} {(secHours * hourlyRate).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold border-r border-[#141414]/20">2. SEO Técnico & Indexação</td>
                    <td className="p-2 border-r border-[#141414]/20 text-[#141414]/80">
                      Correção de meta tags, schema JSON-LD, sitemap, hierarquia de headings e canonicals.
                    </td>
                    <td className="p-2 text-center font-bold border-r border-[#141414]/20">{seoHours}h</td>
                    <td className="p-2 text-right font-bold">{currency} {(seoHours * hourlyRate).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold border-r border-[#141414]/20">3. Core Web Vitals & Velocidade</td>
                    <td className="p-2 border-r border-[#141414]/20 text-[#141414]/80">
                      Redução de LCP, eliminação de Cumulative Layout Shift (CLS) e compressão de assets.
                    </td>
                    <td className="p-2 text-center font-bold border-r border-[#141414]/20">{perfHours}h</td>
                    <td className="p-2 text-right font-bold">{currency} {(perfHours * hourlyRate).toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td className="p-2 font-bold border-r border-[#141414]/20">4. Acessibilidade & LGPD</td>
                    <td className="p-2 border-r border-[#141414]/20 text-[#141414]/80">
                      Ajuste de contraste WCAG, atributos alt e política de cookies conforme LGPD/GDPR.
                    </td>
                    <td className="p-2 text-center font-bold border-r border-[#141414]/20">{bpHours}h</td>
                    <td className="p-2 text-right font-bold">{currency} {(bpHours * hourlyRate).toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Total Calculation */}
            <div className="mt-4 flex flex-col items-end">
              <div className="w-full sm:w-72 border-2 border-[#141414] p-3 bg-white space-y-1.5">
                <div className="flex justify-between">
                  <span>Total Horas:</span>
                  <span className="font-bold">{totalHours} horas</span>
                </div>
                <div className="flex justify-between">
                  <span>Subtotal Bruto:</span>
                  <span>{currency} {subtotalPrice.toLocaleString()}</span>
                </div>
                {discountPercent > 0 && (
                  <div className="flex justify-between text-emerald-700">
                    <span>Desconto ({discountPercent}%):</span>
                    <span>-{currency} {discountAmount.toLocaleString()}</span>
                  </div>
                )}
                <div className="border-t border-[#141414] pt-1.5 flex justify-between text-sm font-black">
                  <span>Investimento Final:</span>
                  <span className="text-emerald-700">{currency} {finalPrice.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t-2 border-[#141414] bg-[#E4E3E0] px-6 py-4">
          <button
            onClick={onClose}
            className="border border-[#141414] bg-white px-4 py-2 text-xs font-mono font-bold text-[#141414] hover:bg-[#141414] hover:text-white transition-all cursor-pointer"
          >
            Fechar
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopyMarkdown}
              className="flex items-center gap-1.5 border border-[#141414] bg-white px-4 py-2 text-xs font-mono font-bold text-[#141414] hover:bg-[#141414] hover:text-white transition-all shadow-[2px_2px_0px_#141414] cursor-pointer"
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              <span>{copied ? 'Copiado!' : 'Copiar em Markdown'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 border-2 border-[#141414] bg-[#141414] px-4 py-2 text-xs font-mono font-bold text-white hover:bg-black transition-all shadow-[2px_2px_0px_#888888] cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>Imprimir / Salvar PDF</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
