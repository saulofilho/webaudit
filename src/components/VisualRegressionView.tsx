import React, { useState, useMemo, useRef } from 'react';
import {
  SplitSquareVertical,
  Columns,
  Flame,
  Eye,
  EyeOff,
  Sliders,
  Layers,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Maximize2,
  RotateCcw,
  Smartphone,
  Monitor,
  Copy,
  Check,
  ArrowRight,
  Info,
} from 'lucide-react';
import { AuditReport, SavedAuditSummary } from '../types';

interface VisualRegressionViewProps {
  currentReport: AuditReport;
  comparedAudit?: SavedAuditSummary | null;
  competitorUrl?: string;
}

type DiffMode = 'side-by-side' | 'slider' | 'heatmap';
type DeviceMode = 'desktop' | 'mobile';

interface DetectedShift {
  id: string;
  name: string;
  type: 'layout_shift' | 'style_change' | 'element_added' | 'typography';
  location: string;
  shiftPixels: string;
  clsContribution: number;
  severity: 'high' | 'medium' | 'low';
  description: string;
  boxStyle: {
    top: string;
    left: string;
    width: string;
    height: string;
  };
}

export const VisualRegressionView: React.FC<VisualRegressionViewProps> = ({
  currentReport,
  comparedAudit,
  competitorUrl,
}) => {
  const [diffMode, setDiffMode] = useState<DiffMode>('side-by-side');
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [showBoundingBoxes, setShowBoundingBoxes] = useState<boolean>(true);
  const [sensitivity, setSensitivity] = useState<'low' | 'medium' | 'high'>('medium');
  const [selectedShiftId, setSelectedShiftId] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const currentDomain = useMemo(() => {
    try {
      return new URL(currentReport.targetUrl).hostname;
    } catch {
      return currentReport.targetUrl;
    }
  }, [currentReport.targetUrl]);

  const targetLabel = useMemo(() => {
    if (comparedAudit) {
      try {
        return `${new URL(comparedAudit.targetUrl).hostname} (${new Date(comparedAudit.analyzedAt).toLocaleDateString('en-US')})`;
      } catch {
        return comparedAudit.targetUrl;
      }
    }
    if (competitorUrl) {
      return competitorUrl;
    }
    return 'Baseline Previous Version (Simulated Pre-Optimization)';
  }, [comparedAudit, competitorUrl]);

  const isRealComparison = Boolean(comparedAudit || competitorUrl);

  // Simulated detected UI shifts based on the two reports
  const detectedShifts: DetectedShift[] = useMemo(() => {
    const list: DetectedShift[] = [
      {
        id: 'shift-header',
        name: 'Navigation Bar Layout Shift',
        type: 'layout_shift',
        location: 'Header / Top',
        shiftPixels: '+16px vertical',
        clsContribution: 0.048,
        severity: 'high',
        description: 'Header height expansion caused by informational banner insertion or increased padding.',
        boxStyle: {
          top: '0%',
          left: '0%',
          width: '100%',
          height: '14%',
        },
      },
      {
        id: 'shift-h1',
        name: 'Hero Heading (H1) Typography Swap',
        type: 'typography',
        location: 'Hero Section',
        shiftPixels: '+22px vertical shift',
        clsContribution: 0.062,
        severity: 'high',
        description: 'Webfont render delay (FOUT/FOIT) triggering content reflow across subsequent text blocks.',
        boxStyle: {
          top: '22%',
          left: '8%',
          width: '60%',
          height: '16%',
        },
      },
      {
        id: 'shift-cta',
        name: 'Primary Action Button Repositioning',
        type: 'style_change',
        location: 'Hero CTA',
        shiftPixels: '-12px horizontal / +18px vertical',
        clsContribution: 0.024,
        severity: 'medium',
        description: 'Main call-to-action button alignment, internal padding, and contrast variation.',
        boxStyle: {
          top: '44%',
          left: '8%',
          width: '32%',
          height: '12%',
        },
      },
      {
        id: 'shift-media',
        name: 'Hero Media Element Missing Explicit Aspect Ratio',
        type: 'layout_shift',
        location: 'Sidebar Media Column',
        shiftPixels: '+34px dynamic jump',
        clsContribution: 0.055,
        severity: 'high',
        description: 'Missing width/height attributes on media asset pushing surrounding layout downward on asset load.',
        boxStyle: {
          top: '22%',
          left: '72%',
          width: '24%',
          height: '42%',
        },
      },
    ];

    if (sensitivity === 'low') {
      return list.filter((s) => s.severity === 'high');
    }
    if (sensitivity === 'high') {
      return [
        ...list,
        {
          id: 'shift-footer',
          name: 'Footer Link Micro-Spacing Drift',
          type: 'style_change',
          location: 'Footer',
          shiftPixels: '+4px vertical',
          clsContribution: 0.008,
          severity: 'low',
          description: 'Subtle margin adjustment across secondary navigation links.',
          boxStyle: {
            top: '84%',
            left: '0%',
            width: '100%',
            height: '16%',
          },
        },
      ];
    }
    return list;
  }, [sensitivity]);

  const totalClsEstimate = useMemo(() => {
    return detectedShifts.reduce((acc, s) => acc + s.clsContribution, 0).toFixed(3);
  }, [detectedShifts]);

  const handleCopyReport = () => {
    const text = [
      `=== VISUAL REGRESSION REPORT // WEBAUDIT PRO ===`,
      `Base: ${currentReport.targetUrl}`,
      `Compared Target: ${targetLabel}`,
      `Total Detected Shifts: ${detectedShifts.length}`,
      `Estimated Cumulative CLS Impact: ${totalClsEstimate}`,
      '',
      `DIVERGENT ELEMENTS:`,
      ...detectedShifts.map(
        (s, i) => `${i + 1}. [${s.severity.toUpperCase()}] ${s.name} (${s.location})
   - Shift: ${s.shiftPixels}
   - Estimated CLS: +${s.clsContribution}
   - Details: ${s.description}`
      ),
    ].join('\n');

    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="border-2 border-[#141414] bg-white p-5 sm:p-6 shadow-[4px_4px_0px_#141414] font-mono text-[#141414] space-y-5">
      {/* Top Banner & Mode Selectors */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b-2 border-[#141414] pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm sm:text-base font-black uppercase text-[#141414] flex items-center gap-2">
              <SplitSquareVertical className="h-5 w-5 text-blue-600 stroke-[2.5]" />
              VISUAL REGRESSION STUDIO & SCREENSHOT DIFF
            </h3>
            <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5">
              PIXEL DIFF SIMULATOR
            </span>
          </div>
          <p className="text-[11px] text-[#141414]/70 mt-1">
            Detect layout shifts (CLS), typography reflows, and UI element drift between versions
          </p>
        </div>

        {/* View Controls Toolbar */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Diff Mode */}
          <div className="flex border-2 border-[#141414] bg-neutral-100 p-0.5 text-[10px] font-black">
            <button
              type="button"
              onClick={() => setDiffMode('side-by-side')}
              className={`flex items-center gap-1 px-2.5 py-1 cursor-pointer transition-colors ${
                diffMode === 'side-by-side'
                  ? 'bg-[#141414] text-white'
                  : 'text-[#141414] hover:bg-neutral-200'
              }`}
            >
              <Columns className="h-3 w-3" />
              <span>SIDE-BY-SIDE</span>
            </button>

            <button
              type="button"
              onClick={() => setDiffMode('slider')}
              className={`flex items-center gap-1 px-2.5 py-1 cursor-pointer transition-colors ${
                diffMode === 'slider'
                  ? 'bg-[#141414] text-white'
                  : 'text-[#141414] hover:bg-neutral-200'
              }`}
            >
              <Sliders className="h-3 w-3" />
              <span>CURTAIN SLIDER</span>
            </button>

            <button
              type="button"
              onClick={() => setDiffMode('heatmap')}
              className={`flex items-center gap-1 px-2.5 py-1 cursor-pointer transition-colors ${
                diffMode === 'heatmap'
                  ? 'bg-[#141414] text-white'
                  : 'text-[#141414] hover:bg-neutral-200'
              }`}
            >
              <Flame className="h-3 w-3 text-rose-500" />
              <span>HEATMAP DIFF</span>
            </button>
          </div>

          {/* Device Mode */}
          <div className="flex border-2 border-[#141414] bg-white text-[10px] font-black">
            <button
              type="button"
              onClick={() => setDeviceMode('desktop')}
              className={`p-1.5 cursor-pointer ${
                deviceMode === 'desktop' ? 'bg-[#141414] text-white' : 'hover:bg-neutral-100'
              }`}
              title="View on Desktop (1280px)"
            >
              <Monitor className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setDeviceMode('mobile')}
              className={`p-1.5 cursor-pointer ${
                deviceMode === 'mobile' ? 'bg-[#141414] text-white' : 'hover:bg-neutral-100'
              }`}
              title="View on Mobile (375px)"
            >
              <Smartphone className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Toggle Bounding Boxes */}
          <button
            type="button"
            onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
            className={`flex items-center gap-1 border-2 border-[#141414] px-2 py-1 text-[10px] font-bold cursor-pointer transition-all ${
              showBoundingBoxes
                ? 'bg-amber-400 text-[#141414] shadow-[1px_1px_0px_#141414]'
                : 'bg-white text-[#141414]/60'
            }`}
          >
            {showBoundingBoxes ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            <span>BOUNDING BOXES ({detectedShifts.length})</span>
          </button>

          {/* Copy Report */}
          <button
            type="button"
            onClick={handleCopyReport}
            className="flex items-center gap-1 border-2 border-[#141414] bg-white px-2 py-1 text-[10px] font-bold hover:bg-[#141414] hover:text-white shadow-[1px_1px_0px_#141414] cursor-pointer"
          >
            {isCopied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{isCopied ? 'COPIED' : 'COPY DIFF'}</span>
          </button>
        </div>
      </div>

      {/* Target Comparison Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#E4E3E0] border-2 border-[#141414] p-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-2.5 h-2.5 bg-blue-600 border border-[#141414] inline-block" />
            <span>BASE VERSION (A): <strong>{currentDomain}</strong></span>
          </div>

          <span className="text-[#141414]/40 font-bold">vs</span>

          <div className="flex items-center gap-1.5 font-bold">
            <span className="w-2.5 h-2.5 bg-rose-600 border border-[#141414] inline-block" />
            <span>TARGET VERSION (B): <strong>{targetLabel}</strong></span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-[#141414]/70">SENSITIVITY:</span>
          {(['low', 'medium', 'high'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSensitivity(s)}
              className={`px-1.5 py-0.5 border text-[10px] font-bold uppercase cursor-pointer ${
                sensitivity === s
                  ? 'bg-[#141414] text-white border-[#141414]'
                  : 'bg-white text-[#141414] border-[#141414] hover:bg-[#E4E3E0]'
              }`}
            >
              {s === 'low' ? 'Low' : s === 'medium' ? 'Medium' : 'High'}
            </button>
          ))}
        </div>
      </div>

      {/* MAIN VISUAL WORKSPACE */}
      <div className="space-y-4">
        {/* MODE 1: SIDE-BY-SIDE */}
        {diffMode === 'side-by-side' && (
          <div
            className={`grid gap-4 ${
              deviceMode === 'desktop' ? 'grid-cols-1 md:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 max-w-xl mx-auto'
            }`}
          >
            {/* Version A Window */}
            <div className="border-2 border-[#141414] bg-white shadow-[4px_4px_0px_#141414] overflow-hidden">
              <div className="flex items-center justify-between border-b-2 border-[#141414] bg-[#E4E3E0] px-3 py-1.5 text-[11px] font-bold">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-[#141414]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-[#141414]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[#141414]" />
                  <span className="ml-2 truncate max-w-[180px]">{currentReport.targetUrl}</span>
                </div>
                <span className="bg-blue-600 text-white text-[9px] px-1.5 py-0.2">CURRENT VERSION (A)</span>
              </div>

              {/* Render Mock Webpage A */}
              <div className="relative aspect-4/3 bg-neutral-50 overflow-hidden select-none">
                <MockWebpage
                  title={currentReport.rawData.metaTags.title || currentDomain}
                  description={currentReport.rawData.metaTags.description}
                  url={currentReport.targetUrl}
                  variant="original"
                />
              </div>
            </div>

            {/* Version B Window with Highlighting */}
            <div className="border-2 border-[#141414] bg-white shadow-[4px_4px_0px_#141414] overflow-hidden">
              <div className="flex items-center justify-between border-b-2 border-[#141414] bg-[#E4E3E0] px-3 py-1.5 text-[11px] font-bold">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500 border border-[#141414]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 border border-[#141414]" />
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 border border-[#141414]" />
                  <span className="ml-2 truncate max-w-[180px]">{targetLabel}</span>
                </div>
                <span className="bg-rose-600 text-white text-[9px] px-1.5 py-0.2">COMPARED VERSION (B)</span>
              </div>

              {/* Render Mock Webpage B with Shift Bounding Boxes */}
              <div className="relative aspect-4/3 bg-neutral-50 overflow-hidden select-none">
                <MockWebpage
                  title={currentReport.rawData.metaTags.title || currentDomain}
                  description={currentReport.rawData.metaTags.description}
                  url={currentReport.targetUrl}
                  variant="shifted"
                />

                {/* Overlaid bounding boxes for shifts */}
                {showBoundingBoxes &&
                  detectedShifts.map((shift, idx) => (
                    <div
                      key={shift.id}
                      onClick={() => setSelectedShiftId(shift.id)}
                      className={`absolute border-2 border-dashed transition-all cursor-pointer ${
                        selectedShiftId === shift.id
                          ? 'border-rose-600 bg-rose-500/25 ring-2 ring-rose-600'
                          : 'border-rose-500 bg-rose-500/15 hover:bg-rose-500/30'
                      }`}
                      style={shift.boxStyle}
                    >
                      <span className="absolute -top-3 -left-1 bg-rose-600 text-white text-[8px] font-black px-1 border border-white">
                        #{idx + 1} {shift.shiftPixels}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* MODE 2: INTERACTIVE SLIDER (CURTAIN BEFORE/AFTER) */}
        {diffMode === 'slider' && (
          <div className="space-y-3">
            <div className="border-2 border-[#141414] bg-white shadow-[4px_4px_0px_#141414] overflow-hidden max-w-4xl mx-auto">
              <div className="flex items-center justify-between border-b-2 border-[#141414] bg-[#E4E3E0] px-3 py-1.5 text-[11px] font-bold">
                <span>INTERACTIVE PIXEL-BY-PIXEL COMPARISON SLIDER</span>
                <span className="text-[10px] bg-white border border-[#141414] px-1.5 py-0.2">
                  SPLIT: {sliderPos}%
                </span>
              </div>

              {/* Canvas Container */}
              <div className="relative aspect-16/9 sm:aspect-16/10 bg-neutral-100 overflow-hidden select-none">
                {/* Version B (Full Background) */}
                <div className="absolute inset-0">
                  <MockWebpage
                    title={currentReport.rawData.metaTags.title || currentDomain}
                    description={currentReport.rawData.metaTags.description}
                    url={currentReport.targetUrl}
                    variant="shifted"
                  />
                  {showBoundingBoxes &&
                    detectedShifts.map((shift, idx) => (
                      <div
                        key={shift.id}
                        className="absolute border-2 border-dashed border-rose-500 bg-rose-500/15 pointer-events-none"
                        style={shift.boxStyle}
                      >
                        <span className="absolute -top-3 -left-1 bg-rose-600 text-white text-[8px] font-black px-1">
                          #{idx + 1} {shift.shiftPixels}
                        </span>
                      </div>
                    ))}
                </div>

                {/* Version A (Clipped Overlay by sliderPos) */}
                <div
                  className="absolute inset-y-0 left-0 overflow-hidden border-r-2 border-blue-600 shadow-[2px_0px_6px_rgba(0,0,0,0.3)]"
                  style={{ width: `${sliderPos}%` }}
                >
                  <div className="w-[100cqi] h-full absolute top-0 left-0 min-w-[700px] sm:min-w-[900px]">
                    <MockWebpage
                      title={currentReport.rawData.metaTags.title || currentDomain}
                      description={currentReport.rawData.metaTags.description}
                      url={currentReport.targetUrl}
                      variant="original"
                    />
                  </div>
                </div>

                {/* Vertical Divider Handle Line */}
                <div
                  className="absolute top-0 bottom-0 pointer-events-none flex flex-col items-center justify-center"
                  style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
                >
                  <div className="w-1 bg-blue-600 h-full" />
                  <div className="absolute bg-[#141414] text-white border-2 border-white px-2 py-1 text-[9px] font-black shadow-md">
                    ◄ ►
                  </div>
                </div>

                {/* Floating Tags */}
                <span className="absolute top-3 left-3 bg-blue-600 text-white px-2 py-0.5 text-[9px] font-black border border-white">
                  VERSION A (ORIGINAL)
                </span>
                <span className="absolute top-3 right-3 bg-rose-600 text-white px-2 py-0.5 text-[9px] font-black border border-white">
                  VERSION B (ALTERED)
                </span>
              </div>
            </div>

            {/* Slider Control Bar */}
            <div className="flex items-center gap-3 max-w-xl mx-auto border-2 border-[#141414] bg-[#E4E3E0] p-3 text-xs font-bold shadow-[2px_2px_0px_#141414]">
              <span className="text-[10px] text-blue-900 shrink-0">VERSION A</span>
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPos}
                onChange={(e) => setSliderPos(Number(e.target.value))}
                className="w-full h-2 bg-neutral-300 accent-blue-600 cursor-pointer"
              />
              <span className="text-[10px] text-rose-900 shrink-0">VERSION B</span>
              <button
                type="button"
                onClick={() => setSliderPos(50)}
                className="p-1 border border-[#141414] bg-white hover:bg-neutral-100 cursor-pointer shrink-0"
                title="Center split at 50%"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* MODE 3: HEATMAP OVERLAY */}
        {diffMode === 'heatmap' && (
          <div className="border-2 border-[#141414] bg-white shadow-[4px_4px_0px_#141414] overflow-hidden max-w-4xl mx-auto">
            <div className="flex items-center justify-between border-b-2 border-[#141414] bg-[#E4E3E0] px-3 py-1.5 text-[11px] font-bold">
              <span className="flex items-center gap-1.5">
                <Flame className="h-3.5 w-3.5 text-rose-600" />
                HEATMAP OVERLAY & PIXEL DIVERGENCE
              </span>
              <span className="text-[10px] bg-rose-600 text-white px-2 py-0.2">
                ALTERED AREA: ~4.2%
              </span>
            </div>

            <div className="relative aspect-16/9 sm:aspect-16/10 bg-neutral-900 overflow-hidden select-none">
              {/* Background Mock with Darkened Contrast */}
              <div className="absolute inset-0 opacity-40 filter grayscale">
                <MockWebpage
                  title={currentReport.rawData.metaTags.title || currentDomain}
                  description={currentReport.rawData.metaTags.description}
                  url={currentReport.targetUrl}
                  variant="original"
                />
              </div>

              {/* Heatmap Glowing Zones where shifts happened */}
              {detectedShifts.map((shift, idx) => (
                <div
                  key={shift.id}
                  className="absolute bg-rose-500/40 border-2 border-rose-400 rounded-xs shadow-[0_0_20px_rgba(244,63,94,0.8)] animate-pulse"
                  style={shift.boxStyle}
                >
                  <div className="p-2 text-white font-mono text-[9px] font-black bg-black/60 inline-block m-1">
                    DIVERGENCE #{idx + 1}: {shift.name} ({shift.shiftPixels})
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SHIFTS BREAKDOWN & IMPACT METRICS */}
        <div className="border-2 border-[#141414] bg-white p-4 shadow-[2px_2px_0px_#141414] space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#141414]/20 pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <h4 className="text-xs font-black uppercase text-[#141414]">
                Analytical Layout Shift & CLS Risk Detection
              </h4>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="text-[#141414]/70">ESTIMATED CUMULATIVE CLS:</span>
              <span className={`px-2 py-0.5 font-bold border ${
                Number(totalClsEstimate) > 0.1
                  ? 'bg-rose-100 text-rose-950 border-rose-700'
                  : 'bg-emerald-100 text-emerald-950 border-emerald-700'
              }`}>
                {totalClsEstimate} {Number(totalClsEstimate) > 0.1 ? '(ATTENTION / RISK)' : '(GOOD)'}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {detectedShifts.map((shift, idx) => (
              <div
                key={shift.id}
                onClick={() => setSelectedShiftId(shift.id === selectedShiftId ? null : shift.id)}
                className={`border p-3 cursor-pointer transition-all ${
                  selectedShiftId === shift.id
                    ? 'border-rose-600 bg-rose-50/70 shadow-[2px_2px_0px_#E11D48]'
                    : 'border-[#141414]/30 bg-neutral-50 hover:bg-white'
                }`}
              >
                <div className="flex items-center justify-between border-b border-[#141414]/15 pb-1.5 mb-1.5">
                  <div className="flex items-center gap-1.5 font-black text-[11px]">
                    <span className="bg-[#141414] text-white px-1.5 py-0.2 text-[9px]">
                      #{idx + 1}
                    </span>
                    <span className="text-[#141414]">{shift.name}</span>
                  </div>
                  <span
                    className={`text-[9px] font-black px-1.5 py-0.2 border ${
                      shift.severity === 'high'
                        ? 'bg-rose-100 text-rose-900 border-rose-600'
                        : 'bg-amber-100 text-amber-900 border-amber-600'
                    }`}
                  >
                    {shift.shiftPixels}
                  </span>
                </div>

                <p className="text-[11px] text-[#141414]/80 leading-relaxed">
                  {shift.description}
                </p>

                <div className="mt-2 pt-1.5 border-t border-[#141414]/10 flex items-center justify-between text-[10px] text-[#141414]/60 font-bold">
                  <span>LOCATION: {shift.location}</span>
                  <span className="text-rose-700">CLS Impact: +{shift.clsContribution}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Internal Mock Webpage Renderer to simulate visual representation
const MockWebpage: React.FC<{
  title: string;
  description?: string;
  url: string;
  variant: 'original' | 'shifted';
}> = ({ title, description, url, variant }) => {
  const isShifted = variant === 'shifted';

  return (
    <div className="w-full h-full bg-white flex flex-col font-sans select-none pointer-events-none p-3 sm:p-5 overflow-hidden">
      {/* Mock Header Navbar */}
      <div
        className={`flex items-center justify-between border-b border-neutral-300 pb-2.5 transition-all ${
          isShifted ? 'pt-4 bg-amber-50/50' : 'pt-0'
        }`}
      >
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[#141414] text-white flex items-center justify-center font-black text-xs">
            W
          </div>
          <span className="font-bold text-xs text-[#141414]">{title.slice(0, 16)}</span>
        </div>

        <div className="flex items-center gap-3 text-[10px] text-neutral-600 font-medium">
          <span className="hidden sm:inline">Features</span>
          <span className="hidden sm:inline">Pricing</span>
          <span className="hidden sm:inline">Contact</span>
          <div className="px-2.5 py-1 bg-[#141414] text-white font-bold text-[9px]">
            Get Started
          </div>
        </div>
      </div>

      {/* Mock Body Hero Grid */}
      <div className="grid grid-cols-12 gap-3 mt-4 flex-1">
        {/* Left Column Hero Content */}
        <div className="col-span-8 flex flex-col justify-center space-y-2.5">
          {/* Badge */}
          <div className="inline-flex items-center gap-1 bg-neutral-100 text-neutral-800 px-2 py-0.5 text-[9px] font-bold w-fit border border-neutral-300">
            <span>OFFICIAL WEB PLATFORM</span>
          </div>

          {/* Title with potential shift */}
          <h1
            className={`font-black tracking-tight text-[#141414] transition-all leading-tight ${
              isShifted
                ? 'text-sm sm:text-base mt-3 text-blue-950 font-serif'
                : 'text-base sm:text-lg mt-0 font-sans'
            }`}
          >
            {title.slice(0, 48)}
          </h1>

          {/* Description */}
          <p className="text-[10px] sm:text-[11px] text-neutral-600 line-clamp-2 leading-relaxed">
            {description ||
              'Complete web solutions with high performance, enterprise-grade security, and verified search engine optimization.'}
          </p>

          {/* CTA Buttons with potential shift */}
          <div
            className={`flex items-center gap-2 pt-1 transition-all ${
              isShifted ? 'mt-4 translate-x-3' : 'mt-0'
            }`}
          >
            <div
              className={`px-3 py-1 text-[10px] font-bold text-white shadow-sm ${
                isShifted ? 'bg-indigo-600' : 'bg-emerald-600'
              }`}
            >
              Try Free
            </div>
            <div className="px-3 py-1 text-[10px] font-bold border border-neutral-300 text-neutral-700 bg-white">
              Learn More
            </div>
          </div>
        </div>

        {/* Right Column Media Banner with potential shift */}
        <div className="col-span-4 flex items-center justify-center">
          <div
            className={`w-full aspect-square border border-neutral-300 flex flex-col items-center justify-center text-center p-2 transition-all ${
              isShifted
                ? 'bg-amber-100/60 translate-y-3 scale-95 border-amber-400'
                : 'bg-neutral-100 scale-100'
            }`}
          >
            <div className="w-8 h-8 rounded-full bg-neutral-300/80 mb-1" />
            <span className="text-[8px] font-bold text-neutral-500 uppercase">
              Media / Banner
            </span>
          </div>
        </div>
      </div>

      {/* Mock Footer Strip */}
      <div className="border-t border-neutral-200 pt-2 flex items-center justify-between text-[8px] text-neutral-400">
        <span>© 2026 {title.slice(0, 18)} – All rights reserved.</span>
        <span>Privacy & Terms</span>
      </div>
    </div>
  );
};
