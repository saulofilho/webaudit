import React, { useState } from 'react';
import { X, FileText, Download, Copy, Check, Printer, Share2, Code } from 'lucide-react';
import { AuditReport } from '../types';
import { generateMarkdownReport } from '../utils/exportReport';

interface ExportModalProps {
  report: AuditReport;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ report, isOpen, onClose }) => {
  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedJson, setCopiedJson] = useState(false);

  if (!isOpen) return null;

  const markdownContent = generateMarkdownReport(report);
  const jsonContent = JSON.stringify(report, null, 2);
  const hostname = new URL(report.targetUrl).hostname;

  const handleCopyMarkdown = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const handleDownloadMarkdown = () => {
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-${hostname}-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadJson = () => {
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-${hostname}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#141414]/70 backdrop-blur-xs font-mono">
      <div className="relative w-full max-w-2xl border-2 border-[#141414] bg-white p-6 shadow-[8px_8px_0px_#141414] space-y-5 text-[#141414]">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#141414] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center border border-[#141414] bg-[#141414] text-white">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#141414] uppercase">
                EXPORT AUDIT REPORT
              </h3>
              <p className="text-[11px] text-[#141414]/70">
                Select format for archiving, sharing, or documentation
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-[#141414] hover:bg-[#141414] hover:text-white p-1 border border-[#141414] transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Print / PDF Option */}
          <div className="flex flex-col justify-between border-2 border-[#141414] bg-[#E4E3E0]/30 p-4 shadow-[2px_2px_0px_#141414]">
            <div>
              <Printer className="h-5 w-5 text-[#141414] mb-2" />
              <h4 className="text-xs font-black text-[#141414] uppercase">PRINT / PDF</h4>
              <p className="text-[11px] text-[#141414]/70 mt-1">
                Generates print preview and structured PDF document.
              </p>
            </div>
            <button
              type="button"
              onClick={handlePrint}
              className="mt-4 flex items-center justify-center gap-1.5 border border-[#141414] bg-[#141414] text-white hover:bg-black py-2 px-3 text-xs font-bold uppercase transition-all shadow-[2px_2px_0px_#888888] cursor-pointer"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>PRINT PDF</span>
            </button>
          </div>

          {/* Markdown Option */}
          <div className="flex flex-col justify-between border-2 border-[#141414] bg-[#E4E3E0]/30 p-4 shadow-[2px_2px_0px_#141414]">
            <div>
              <FileText className="h-5 w-5 text-[#141414] mb-2" />
              <h4 className="text-xs font-black text-[#141414] uppercase">MARKDOWN (.MD)</h4>
              <p className="text-[11px] text-[#141414]/70 mt-1">
                Ideal for GitHub issues, PRs, and team docs.
              </p>
            </div>
            <div className="mt-4 flex flex-col gap-1.5">
              <button
                type="button"
                onClick={handleCopyMarkdown}
                className="flex items-center justify-center gap-1.5 border border-[#141414] bg-white hover:bg-[#E4E3E0] py-1.5 px-3 text-xs font-bold text-[#141414] uppercase transition-colors cursor-pointer"
              >
                {copiedMd ? <Check className="h-3.5 w-3.5 text-emerald-700" /> : <Copy className="h-3.5 w-3.5" />}
                <span>{copiedMd ? 'COPIED!' : 'COPY TEXT'}</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadMarkdown}
                className="flex items-center justify-center gap-1.5 border border-[#141414] bg-[#141414] text-white hover:bg-black py-1.5 px-3 text-xs font-bold uppercase transition-colors cursor-pointer shadow-[2px_2px_0px_#888888]"
              >
                <Download className="h-3.5 w-3.5" />
                <span>DOWNLOAD .MD</span>
              </button>
            </div>
          </div>

          {/* JSON Option */}
          <div className="flex flex-col justify-between border-2 border-[#141414] bg-[#E4E3E0]/30 p-4 shadow-[2px_2px_0px_#141414]">
            <div>
              <Code className="h-5 w-5 text-[#141414] mb-2" />
              <h4 className="text-xs font-black text-[#141414] uppercase">RAW JSON</h4>
              <p className="text-[11px] text-[#141414]/70 mt-1">
                Export raw audit data and headers for CI/CD automation.
              </p>
            </div>
            <button
              type="button"
              onClick={handleDownloadJson}
              className="mt-4 flex items-center justify-center gap-1.5 border border-[#141414] bg-[#141414] text-white hover:bg-black py-2 px-3 text-xs font-bold uppercase transition-all shadow-[2px_2px_0px_#888888] cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>DOWNLOAD .JSON</span>
            </button>
          </div>
        </div>

        {/* Preview Markdown Box */}
        <div className="border border-[#141414] bg-[#E4E3E0]/30 p-3.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-[#141414] block mb-1.5">
            MARKDOWN DOCUMENT PREVIEW:
          </span>
          <div className="max-h-32 overflow-y-auto border border-[#141414] bg-[#141414] p-2.5 font-mono text-[11px] text-[#E4E3E0]">
            <pre className="whitespace-pre-wrap">{markdownContent.slice(0, 450)}...</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
