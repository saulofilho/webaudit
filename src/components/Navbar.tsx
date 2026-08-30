import React from 'react';
import { ShieldCheck, History, Download, Github, Sparkles, RefreshCw, Activity, Terminal } from 'lucide-react';

interface NavbarProps {
  onOpenHistory: () => void;
  onOpenExport: () => void;
  onOpenGitHubPages: () => void;
  onNewAudit: () => void;
  hasReport: boolean;
  isBackendActive: boolean;
  historyCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  onOpenHistory,
  onOpenExport,
  onOpenGitHubPages,
  onNewAudit,
  hasReport,
  isBackendActive,
  historyCount,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b-2 border-[#141414] bg-[#E4E3E0] text-[#141414]">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-3 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-2.5 cursor-pointer select-none" onClick={onNewAudit}>
          <div className="flex h-9 w-9 items-center justify-center bg-[#141414] text-[#E4E3E0] border border-[#141414] shadow-[2px_2px_0px_#141414]">
            <ShieldCheck className="h-5 w-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-black text-sm sm:text-base tracking-tight text-[#141414] uppercase">
                WebAudit<span className="bg-[#141414] text-[#E4E3E0] px-1 ml-0.5">PRO</span>
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 bg-white px-1.5 py-0.5 text-[10px] font-mono font-bold text-[#141414] border border-[#141414]">
                <Activity className="h-3 w-3 text-emerald-600 animate-pulse" />
                V3.7-DIAGNOSTIC
              </span>
            </div>
            <p className="hidden md:block text-[10px] font-mono uppercase tracking-wider text-[#141414]/70">
              SEC • SEO • BEST_PRACTICES • SPEED
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {/* GitHub Pages Modal trigger */}
          <button
            id="btn-gh-pages"
            onClick={onOpenGitHubPages}
            title="Instruções para GitHub Pages"
            className="flex items-center gap-1.5 border border-[#141414] bg-white px-2.5 py-1 text-xs font-mono font-bold text-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] shadow-[2px_2px_0px_#141414] transition-all cursor-pointer"
          >
            <Github className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">GH-PAGES</span>
          </button>

          {/* History */}
          <button
            id="btn-history"
            onClick={onOpenHistory}
            className="relative flex items-center gap-1.5 border border-[#141414] bg-white px-2.5 py-1 text-xs font-mono font-bold text-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] shadow-[2px_2px_0px_#141414] transition-all cursor-pointer"
          >
            <History className="h-3.5 w-3.5" />
            <span className="hidden md:inline">HISTÓRICO</span>
            {historyCount > 0 && (
              <span className="flex h-4 min-w-4 px-1 items-center justify-center bg-[#141414] text-[9px] font-mono font-bold text-white">
                {historyCount}
              </span>
            )}
          </button>

          {/* Export Report */}
          {hasReport && (
            <button
              id="btn-export-report"
              onClick={onOpenExport}
              className="flex items-center gap-1.5 border border-[#141414] bg-[#141414] px-3 py-1 text-xs font-mono font-bold text-[#E4E3E0] hover:bg-black transition-all shadow-[2px_2px_0px_#888888] cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>EXPORTAR</span>
            </button>
          )}

          {/* New Audit button if viewing report */}
          {hasReport && (
            <button
              id="btn-new-audit-nav"
              onClick={onNewAudit}
              className="flex items-center gap-1.5 border border-[#141414] bg-white px-3 py-1 text-xs font-mono font-bold text-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] shadow-[2px_2px_0px_#141414] transition-all cursor-pointer"
            >
              <RefreshCw className="h-3 w-3" />
              <span className="hidden sm:inline">NOVA ANÁLISE</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
