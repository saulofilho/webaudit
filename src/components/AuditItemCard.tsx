import React, { useState } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, ChevronDown, ChevronUp, Copy, Check, Terminal, Code2, Sparkles } from 'lucide-react';
import { AuditItem, SeverityLevel } from '../types';

interface AuditItemCardProps {
  item: AuditItem;
  onGetAiFix?: (item: AuditItem) => void;
  isCompleted?: boolean;
  onToggleCompleted?: (id: string) => void;
}

const SEVERITY_CONFIG: Record<SeverityLevel, { label: string; icon: React.ElementType; badgeClass: string; borderClass: string; iconColor: string }> = {
  critical: {
    label: 'CRITICAL',
    icon: AlertCircle,
    badgeClass: 'bg-rose-100 text-rose-900 border-rose-700',
    borderClass: 'border-[#141414] hover:shadow-[3px_3px_0px_#e11d48]',
    iconColor: 'text-rose-700',
  },
  warning: {
    label: 'WARNING',
    icon: AlertTriangle,
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-700',
    borderClass: 'border-[#141414] hover:shadow-[3px_3px_0px_#d97706]',
    iconColor: 'text-amber-700',
  },
  good: {
    label: 'PASSED',
    icon: CheckCircle2,
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-700',
    borderClass: 'border-[#141414] hover:shadow-[3px_3px_0px_#059669]',
    iconColor: 'text-emerald-700',
  },
  info: {
    label: 'OPPORTUNITY',
    icon: Info,
    badgeClass: 'bg-blue-100 text-blue-900 border-blue-700',
    borderClass: 'border-[#141414] hover:shadow-[3px_3px_0px_#2563eb]',
    iconColor: 'text-blue-700',
  },
};

export const AuditItemCard: React.FC<AuditItemCardProps> = ({
  item,
  onGetAiFix,
  isCompleted = false,
  onToggleCompleted,
}) => {
  const [isExpanded, setIsExpanded] = useState(item.severity === 'critical' || item.severity === 'warning');
  const [copied, setCopied] = useState(false);

  const config = SEVERITY_CONFIG[item.severity];
  const Icon = config.icon;

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAiFixClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onGetAiFix) {
      onGetAiFix(item);
    }
  };

  return (
    <div
      className={`border-2 bg-white p-3.5 sm:p-4 transition-all shadow-[2px_2px_0px_#141414] ${
        isCompleted ? 'border-emerald-700 bg-emerald-50/20' : config.borderClass
      }`}
    >
      {/* Header row */}
      <div
        className="flex items-start justify-between gap-3 cursor-pointer select-none"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-2.5 min-w-0">
          <div className="mt-0.5 shrink-0">
            {isCompleted ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-700" />
            ) : (
              <Icon className={`h-4 w-4 ${config.iconColor}`} />
            )}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className={`inline-flex items-center gap-1 border px-2 py-0.2 text-[10px] font-mono font-bold ${config.badgeClass}`}>
                {config.label}
              </span>

              {isCompleted && (
                <span className="inline-flex items-center gap-1 border border-emerald-800 bg-emerald-100 text-emerald-900 px-1.5 py-0.2 text-[9px] font-mono font-bold">
                  ✓ RESOLVED
                </span>
              )}

              <h4
                className={`text-xs sm:text-sm font-mono font-bold uppercase ${
                  isCompleted ? 'text-emerald-950 line-through' : 'text-[#141414]'
                }`}
              >
                {item.title}
              </h4>
            </div>

            <p className="text-xs font-mono text-[#141414]/80">
              {item.summary}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
          {/* Quick AI Fix Button on Header */}
          {onGetAiFix && (
            <button
              type="button"
              id={`btn-ai-fix-${item.id}`}
              onClick={handleAiFixClick}
              title="Get step-by-step AI generated fix instructions"
              className="flex items-center gap-1 px-2 py-1 text-[10px] sm:text-xs font-mono font-bold uppercase bg-[#141414] text-white hover:bg-emerald-600 border border-[#141414] shadow-[1px_1px_0px_#141414] transition-all cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-amber-300 fill-amber-300 shrink-0" />
              <span className="hidden xs:inline sm:inline">GET AI FIX</span>
              <span className="inline xs:hidden sm:hidden">AI FIX</span>
            </button>
          )}

          <button
            type="button"
            aria-label={isExpanded ? 'Collapse details' : 'Expand details'}
            className="text-[#141414] p-1 border border-[#141414] bg-[#E4E3E0] hover:bg-[#141414] hover:text-white transition-colors shrink-0"
          >
            {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="mt-3.5 pt-3 border-t-2 border-[#141414] space-y-3 font-mono text-xs">
          {/* Impact section */}
          {item.impact && (
            <div className="bg-[#E4E3E0] p-3 border border-[#141414]">
              <span className="font-bold text-[#141414] block mb-1 text-[11px] uppercase tracking-wider">
                [TECHNICAL IMPACT & RISK]:
              </span>
              <p className="text-[#141414] text-xs leading-relaxed">
                {item.impact}
              </p>
            </div>
          )}

          {/* Current vs Recommended values */}
          {(item.currentValue || item.recommendedValue) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              {item.currentValue && (
                <div className="bg-white p-2 border border-[#141414]">
                  <span className="text-[#141414]/60 font-bold text-[10px] uppercase block mb-0.5">DETECTED CURRENT VALUE:</span>
                  <code className="text-[#141414] font-mono break-all text-xs font-semibold">{item.currentValue}</code>
                </div>
              )}
              {item.recommendedValue && (
                <div className="bg-emerald-50 p-2 border border-emerald-700">
                  <span className="text-emerald-900 font-bold text-[10px] uppercase block mb-0.5">RECOMMENDATION:</span>
                  <code className="text-emerald-950 font-mono break-all text-xs font-semibold">{item.recommendedValue}</code>
                </div>
              )}
            </div>
          )}

          {/* Actionable Code Snippet */}
          {item.codeSnippet && (
            <div className="border-2 border-[#141414] bg-[#141414] shadow-[2px_2px_0px_#888888]">
              <div className="flex items-center justify-between px-3 py-1.5 bg-[#222222] border-b border-[#333333]">
                <div className="flex items-center gap-2">
                  <Code2 className="h-3.5 w-3.5 text-[#E4E3E0]" />
                  <span className="text-[11px] font-mono font-bold text-[#E4E3E0] uppercase">
                    {item.codeSnippet.title}
                  </span>
                  <span className="bg-[#141414] text-[#A0A0A0] border border-[#444] px-1 py-0.2 text-[9px] uppercase font-mono">
                    {item.codeSnippet.language}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyCode(item.codeSnippet!.code)}
                  className="flex items-center gap-1 text-[10px] font-mono font-bold text-[#E4E3E0] hover:text-white bg-[#141414] border border-[#555] hover:border-[#888] px-2 py-0.5 transition-colors cursor-pointer uppercase"
                >
                  {copied ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span className="text-emerald-400">COPIED</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3 w-3" />
                      <span>COPY CODE</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-3 overflow-x-auto bg-[#141414]">
                <pre className="font-mono text-xs text-[#E4E3E0] leading-relaxed">
                  <code>{item.codeSnippet.code}</code>
                </pre>
              </div>
            </div>
          )}

          {/* Action Row: Expanded AI Fix Banner */}
          <div className="pt-2 flex flex-wrap items-center justify-between gap-2 border-t border-[#141414]/20">
            {onGetAiFix && (
              <button
                type="button"
                onClick={handleAiFixClick}
                className="flex items-center gap-2 px-3 py-1.5 bg-[#141414] text-white hover:bg-emerald-600 border border-[#141414] shadow-[2px_2px_0px_#888] text-xs font-bold uppercase transition-all cursor-pointer"
              >
                <Sparkles className="h-4 w-4 text-amber-300 fill-amber-300 animate-pulse" />
                <span>GENERATE STEP-BY-STEP AI FIX GUIDE</span>
              </button>
            )}

            {onToggleCompleted && (
              <button
                type="button"
                onClick={() => onToggleCompleted(item.id)}
                className={`flex items-center gap-1 px-2.5 py-1 text-xs font-bold uppercase border transition-colors cursor-pointer ${
                  isCompleted
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-700 hover:bg-emerald-200'
                    : 'bg-white text-[#141414] border-[#141414] hover:bg-[#E4E3E0]'
                }`}
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>{isCompleted ? 'RESOLVED' : 'MARK AS RESOLVED'}</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
