import React from 'react';
import { AlertOctagon, AlertTriangle, CheckCircle2, BarChart2 } from 'lucide-react';

interface SeverityDistributionBarProps {
  criticalCount: number;
  warningCount: number;
  goodCount: number;
  totalCount: number;
  activeFilter: string; // 'all' | 'critical' | 'warning' | 'good'
  onSelectFilter: (filter: 'all' | 'critical' | 'warning' | 'good') => void;
  categoryName?: string;
}

export const SeverityDistributionBar: React.FC<SeverityDistributionBarProps> = ({
  criticalCount,
  warningCount,
  goodCount,
  totalCount,
  activeFilter,
  onSelectFilter,
  categoryName,
}) => {
  if (totalCount === 0) {
    return null;
  }

  const criticalPct = (criticalCount / totalCount) * 100;
  const warningPct = (warningCount / totalCount) * 100;
  const goodPct = (goodCount / totalCount) * 100;

  // Format to 1 decimal if not an integer, or round
  const formatPct = (val: number) => {
    if (val === 0) return '0%';
    if (val === 100) return '100%';
    const rounded = Math.round(val);
    return `${rounded}%`;
  };

  return (
    <div
      id="severity-distribution-card"
      className="border-2 border-[#141414] bg-white p-3 sm:p-3.5 shadow-[2px_2px_0px_#141414] space-y-2.5 font-mono text-[#141414]"
    >
      {/* Top Header & Legend */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center bg-[#141414] text-white">
            <BarChart2 className="h-3.5 w-3.5" />
          </div>
          <div>
            <h4 className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-[#141414] flex items-center gap-1.5">
              <span>SEVERITY DISTRIBUTION</span>
              {categoryName && (
                <span className="bg-[#E4E3E0] px-1.5 py-0.2 text-[9px] font-bold text-[#141414] border border-[#141414]">
                  {categoryName}
                </span>
              )}
            </h4>
          </div>
        </div>

        {/* Legend / Filter Quick Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold">
          <button
            type="button"
            onClick={() => onSelectFilter(activeFilter === 'critical' ? 'all' : 'critical')}
            title="Filter by Critical"
            className={`flex items-center gap-1 px-1.5 py-0.5 border border-[#141414] transition-all cursor-pointer ${
              activeFilter === 'critical'
                ? 'bg-rose-700 text-white shadow-[1px_1px_0px_#141414]'
                : 'bg-rose-50 text-rose-900 hover:bg-rose-100'
            }`}
          >
            <span className="inline-block h-2 w-2 bg-rose-600 border border-[#141414]" />
            <span className="uppercase">CRITICAL:</span>
            <span className="font-black">{criticalCount}</span>
            <span className="opacity-80">({formatPct(criticalPct)})</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectFilter(activeFilter === 'warning' ? 'all' : 'warning')}
            title="Filter by Warnings"
            className={`flex items-center gap-1 px-1.5 py-0.5 border border-[#141414] transition-all cursor-pointer ${
              activeFilter === 'warning'
                ? 'bg-amber-500 text-[#141414] shadow-[1px_1px_0px_#141414]'
                : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
            }`}
          >
            <span className="inline-block h-2 w-2 bg-amber-400 border border-[#141414]" />
            <span className="uppercase">WARNINGS:</span>
            <span className="font-black">{warningCount}</span>
            <span className="opacity-80">({formatPct(warningPct)})</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectFilter(activeFilter === 'good' ? 'all' : 'good')}
            title="Filter by Passed"
            className={`flex items-center gap-1 px-1.5 py-0.5 border border-[#141414] transition-all cursor-pointer ${
              activeFilter === 'good'
                ? 'bg-emerald-700 text-white shadow-[1px_1px_0px_#141414]'
                : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
            }`}
          >
            <span className="inline-block h-2 w-2 bg-emerald-600 border border-[#141414]" />
            <span className="uppercase">PASSED:</span>
            <span className="font-black">{goodCount}</span>
            <span className="opacity-80">({formatPct(goodPct)})</span>
          </button>

          <span className="text-[10px] text-[#141414]/60 pl-1 font-mono">
            TOTAL: {totalCount}
          </span>
        </div>
      </div>

      {/* Horizontal Distribution Bar */}
      <div
        className="relative h-6 sm:h-7 w-full border-2 border-[#141414] bg-[#E4E3E0] overflow-hidden flex shadow-inner"
        role="progressbar"
        aria-label="Severity distribution"
      >
        {/* Critical Segment */}
        {criticalCount > 0 && (
          <button
            type="button"
            onClick={() => onSelectFilter(activeFilter === 'critical' ? 'all' : 'critical')}
            style={{ width: `${criticalPct}%` }}
            title={`Critical: ${criticalCount} (${formatPct(criticalPct)}) - Click to filter`}
            className={`relative h-full bg-rose-600 text-white font-mono text-[10px] font-black flex items-center justify-center overflow-hidden transition-all duration-300 cursor-pointer border-r-2 border-[#141414] last:border-r-0 hover:brightness-110 ${
              activeFilter === 'critical' ? 'ring-2 ring-inset ring-white' : ''
            }`}
          >
            <span className="truncate px-1 flex items-center gap-1">
              <AlertOctagon className="h-3 w-3 shrink-0" />
              {criticalPct >= 12 && (
                <span className="hidden xs:inline">CRITICAL</span>
              )}
              <span>{criticalCount}</span>
              {criticalPct >= 16 && (
                <span className="opacity-90 font-medium text-[9px]">
                  ({formatPct(criticalPct)})
                </span>
              )}
            </span>
          </button>
        )}

        {/* Warning Segment */}
        {warningCount > 0 && (
          <button
            type="button"
            onClick={() => onSelectFilter(activeFilter === 'warning' ? 'all' : 'warning')}
            style={{ width: `${warningPct}%` }}
            title={`Warnings: ${warningCount} (${formatPct(warningPct)}) - Click to filter`}
            className={`relative h-full bg-amber-400 text-[#141414] font-mono text-[10px] font-black flex items-center justify-center overflow-hidden transition-all duration-300 cursor-pointer border-r-2 border-[#141414] last:border-r-0 hover:brightness-105 ${
              activeFilter === 'warning' ? 'ring-2 ring-inset ring-[#141414]' : ''
            }`}
          >
            <span className="truncate px-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 shrink-0" />
              {warningPct >= 12 && (
                <span className="hidden xs:inline">WARNINGS</span>
              )}
              <span>{warningCount}</span>
              {warningPct >= 16 && (
                <span className="opacity-85 font-medium text-[9px]">
                  ({formatPct(warningPct)})
                </span>
              )}
            </span>
          </button>
        )}

        {/* Good Segment */}
        {goodCount > 0 && (
          <button
            type="button"
            onClick={() => onSelectFilter(activeFilter === 'good' ? 'all' : 'good')}
            style={{ width: `${goodPct}%` }}
            title={`Passed: ${goodCount} (${formatPct(goodPct)}) - Click to filter`}
            className={`relative h-full bg-emerald-600 text-white font-mono text-[10px] font-black flex items-center justify-center overflow-hidden transition-all duration-300 cursor-pointer hover:brightness-110 ${
              activeFilter === 'good' ? 'ring-2 ring-inset ring-white' : ''
            }`}
          >
            <span className="truncate px-1 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 shrink-0" />
              {goodPct >= 12 && (
                <span className="hidden xs:inline">PASSED</span>
              )}
              <span>{goodCount}</span>
              {goodPct >= 16 && (
                <span className="opacity-90 font-medium text-[9px]">
                  ({formatPct(goodPct)})
                </span>
              )}
            </span>
          </button>
        )}
      </div>

      {/* Subtext info */}
      <div className="flex items-center justify-between text-[9px] text-[#141414]/70 pt-0.5">
        <span>* Click any colored segment to filter audit items directly.</span>
        {activeFilter !== 'all' && (
          <button
            type="button"
            onClick={() => onSelectFilter('all')}
            className="text-[#141414] font-black underline uppercase hover:text-rose-700 cursor-pointer"
          >
            RESET FILTER ({activeFilter})
          </button>
        )}
      </div>
    </div>
  );
};
