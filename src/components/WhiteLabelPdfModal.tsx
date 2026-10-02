import React, { useState } from 'react';
import {
  X,
  Printer,
  Download,
  Building2,
  User,
  FileText,
  Sparkles,
  Shield,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { AuditReport, WhiteLabelSettings } from '../types';
import { formatDate } from '../utils/formatters';

interface WhiteLabelPdfModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: AuditReport;
}

export const WhiteLabelPdfModal: React.FC<WhiteLabelPdfModalProps> = ({
  isOpen,
  onClose,
  report,
}) => {
  const [settings, setSettings] = useState<WhiteLabelSettings>({
    agencyName: 'Studio Web Security & Performance',
    consultantName: 'Senior Web Audit Specialist',
    clientName: new URL(report.targetUrl).hostname.toUpperCase(),
    customNotes: 'Technical and executive report covering security, SEO, best practices, and performance audit.',
    includeExecutiveRoi: true,
  });

  if (!isOpen) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#141414]/75 backdrop-blur-xs font-mono">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col border-2 border-[#141414] bg-white shadow-[8px_8px_0px_#141414] text-[#141414]">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b-2 border-[#141414] p-4 bg-[#E4E3E0] shrink-0">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-[#141414]" />
            <div>
              <h3 className="text-sm font-black uppercase">
                Client White-Label PDF Report
              </h3>
              <p className="text-[11px] text-[#141414]/70">
                Customize with your brand, client details, and executive summary before exporting
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="flex items-center gap-1.5 border-2 border-[#141414] bg-[#141414] text-white px-3 py-1 font-bold text-xs hover:bg-neutral-800 shadow-[2px_2px_0px_#888888] cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>PRINT / SAVE PDF</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="border border-[#141414] p-1 bg-white hover:bg-neutral-200 cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Modal Body: Settings on Top, Preview Below */}
        <div className="overflow-y-auto p-5 space-y-6 flex-1 text-xs">
          {/* Settings Grid */}
          <div className="border-2 border-[#141414] bg-[#E4E3E0] p-4 shadow-[2px_2px_0px_#141414] grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="font-bold block mb-1">Your Company / Agency:</label>
              <input
                type="text"
                value={settings.agencyName}
                onChange={(e) => setSettings({ ...settings, agencyName: e.target.value })}
                className="w-full bg-white border border-[#141414] p-1.5 font-bold"
              />
            </div>

            <div>
              <label className="font-bold block mb-1">Auditor / Consultant:</label>
              <input
                type="text"
                value={settings.consultantName}
                onChange={(e) => setSettings({ ...settings, consultantName: e.target.value })}
                className="w-full bg-white border border-[#141414] p-1.5 font-bold"
              />
            </div>

            <div>
              <label className="font-bold block mb-1">Client Name:</label>
              <input
                type="text"
                value={settings.clientName}
                onChange={(e) => setSettings({ ...settings, clientName: e.target.value })}
                className="w-full bg-white border border-[#141414] p-1.5 font-bold"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="flex items-center gap-2 cursor-pointer font-bold select-none">
                <input
                  type="checkbox"
                  checked={settings.includeExecutiveRoi}
                  onChange={(e) => setSettings({ ...settings, includeExecutiveRoi: e.target.checked })}
                  className="accent-[#141414] w-4 h-4 cursor-pointer"
                />
                <span>Include Executive Business Impact & ROI Section for Decision Makers</span>
              </label>
            </div>
          </div>

          {/* Printable White-Label Document Preview */}
          <div id="white-label-print-area" className="border-2 border-[#141414] bg-white p-6 sm:p-8 shadow-[4px_4px_0px_#141414] space-y-6">
            {/* Header with Agency Branding */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b-4 border-[#141414] pb-5">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#141414]/60">
                  TECHNICAL WEB AUDIT REPORT
                </span>
                <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-[#141414] mt-0.5">
                  {settings.agencyName || 'AUDIT AGENCY'}
                </h1>
                <div className="text-xs text-[#141414]/80 mt-1">
                  Responsible Consultant: <strong>{settings.consultantName}</strong>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xs font-bold text-[#141414]/70">PREPARED FOR:</div>
                <div className="text-base font-black text-[#141414] uppercase">{settings.clientName}</div>
                <div className="text-[11px] text-[#141414]/70 mt-0.5">{formatDate(report.analyzedAt)}</div>
              </div>
            </div>

            {/* Score Overview Row */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div className="border-2 border-[#141414] p-4 bg-[#E4E3E0] text-center">
                <span className="text-[10px] font-bold uppercase block text-[#141414]/70">Overall Score</span>
                <div className="text-4xl font-black text-[#141414] mt-1">{report.overallScore}/100</div>
                <span className="inline-block mt-2 px-2 py-0.5 bg-[#141414] text-white text-[10px] font-bold">
                  GRADE [{report.overallGrade}]
                </span>
              </div>

              <div className="border border-[#141414] p-3 text-center">
                <span className="text-[10px] font-bold uppercase block text-[#141414]/70">Security</span>
                <div className="text-2xl font-black text-emerald-800 mt-1">{report.categories.security.score}%</div>
                <span className="text-[10px] text-[#141414]/60 block mt-1">Grade {report.categories.security.grade}</span>
              </div>

              <div className="border border-[#141414] p-3 text-center">
                <span className="text-[10px] font-bold uppercase block text-[#141414]/70">SEO & Search</span>
                <div className="text-2xl font-black text-blue-800 mt-1">{report.categories.seo.score}%</div>
                <span className="text-[10px] text-[#141414]/60 block mt-1">Grade {report.categories.seo.grade}</span>
              </div>

              <div className="border border-[#141414] p-3 text-center">
                <span className="text-[10px] font-bold uppercase block text-[#141414]/70">Performance</span>
                <div className="text-2xl font-black text-amber-800 mt-1">{report.categories.performance_accessibility.score}%</div>
                <span className="text-[10px] text-[#141414]/60 block mt-1">Grade {report.categories.performance_accessibility.grade}</span>
              </div>
            </div>

            {/* Executive ROI & Business Impact Section */}
            {settings.includeExecutiveRoi && (
              <div className="border-2 border-[#141414] bg-[#E4E3E0]/40 p-4 space-y-2">
                <h4 className="font-black text-xs uppercase flex items-center gap-1.5 border-b border-[#141414]/20 pb-1.5">
                  <TrendingUp className="h-4 w-4 text-[#141414]" />
                  Executive Decision Maker Summary (Business Impact & ROI)
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] pt-1">
                  <div className="border border-[#141414] bg-white p-2.5">
                    <strong className="block text-[#141414] mb-1">Reputation & Brand Protection</strong>
                    <p className="text-[#141414]/70">
                      Implementation of HSTS and CSP mitigates 98% of script injection and clickjacking attack vectors, ensuring enterprise data breach protection.
                    </p>
                  </div>
                  <div className="border border-[#141414] bg-white p-2.5">
                    <strong className="block text-[#141414] mb-1">Conversion Rate Lift</strong>
                    <p className="text-[#141414]/70">
                      Keeping TTFB and LCP below 2.5s boosts e-commerce conversion rates by up to +8.4% according to Google and Deloitte benchmarks.
                    </p>
                  </div>
                  <div className="border border-[#141414] bg-white p-2.5">
                    <strong className="block text-[#141414] mb-1">Compliance & Risk Mitigation</strong>
                    <p className="text-[#141414]/70">
                      Full adherence to privacy guidelines, encrypted transmission, and ADA/WCAG accessibility mitigates regulatory exposure and litigation risk.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* AI Diagnosis */}
            <div className="border border-[#141414] bg-[#E4E3E0] p-4">
              <h4 className="font-black text-xs uppercase mb-1.5">Executive Technical Diagnosis:</h4>
              <p className="text-xs leading-relaxed text-[#141414]">
                {report.aiExecutiveSummary}
              </p>
            </div>

            {/* Key Priority Fixes */}
            <div>
              <h4 className="font-black text-xs uppercase mb-2">Top Priority Recommended Actions:</h4>
              <div className="space-y-1.5">
                {report.topPriorityFixes.slice(0, 4).map((fix, idx) => (
                  <div key={idx} className="border border-[#141414] p-2 bg-neutral-50 flex items-start gap-2">
                    <span className="font-bold text-[#141414]">{idx + 1}.</span>
                    <span>{fix}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
