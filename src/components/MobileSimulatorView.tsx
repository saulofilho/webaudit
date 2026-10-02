import React, { useState } from 'react';
import {
  Smartphone,
  Monitor,
  Tablet,
  RotateCw,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Touchpad,
  Type,
  Maximize2,
  Layers,
  Sparkles,
} from 'lucide-react';
import { AuditReport } from '../types';

interface MobileSimulatorViewProps {
  report: AuditReport;
}

type DeviceType = 'mobile' | 'tablet' | 'desktop';

export const MobileSimulatorView: React.FC<MobileSimulatorViewProps> = ({ report }) => {
  const [device, setDevice] = useState<DeviceType>('mobile');
  const [isLandscape, setIsLandscape] = useState<boolean>(false);
  const [iframeError, setIframeError] = useState<boolean>(false);

  // Device dimensions in pixels
  const dimensions = {
    mobile: isLandscape ? { width: 667, height: 375, name: 'Mobile (Landscape)' } : { width: 375, height: 667, name: 'Mobile (375 × 667px)' },
    tablet: isLandscape ? { width: 1024, height: 768, name: 'Tablet (Landscape)' } : { width: 768, height: 1024, name: 'Tablet (768 × 1024px)' },
    desktop: { width: 1200, height: 750, name: 'Desktop (1200 × 750px)' },
  };

  const currentDim = dimensions[device];
  const hasViewportMeta = !!report.rawData.metaTags.viewport;

  return (
    <div className="space-y-6 text-[#141414]">
      {/* Header Banner */}
      <div className="border-2 border-[#141414] bg-white p-5 shadow-[4px_4px_0px_#141414]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center border-2 border-[#141414] bg-indigo-600 text-white">
              <Smartphone className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight">
                Multi-Device Simulation & Mobile Usability
              </h2>
              <p className="text-xs text-[#141414]/70">
                Inspect responsive viewport rendering, touch target areas, and mobile ergonomics
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className={`px-2.5 py-1 border font-bold ${hasViewportMeta ? 'bg-emerald-100 text-emerald-950 border-emerald-700' : 'bg-rose-100 text-rose-950 border-rose-700'}`}>
              {hasViewportMeta ? '✓ VIEWPORT METATAG CONFIGURED' : '⚠ MISSING VIEWPORT METATAG'}
            </span>
          </div>
        </div>
      </div>

      {/* Control Bar: Device Switcher & Orientation */}
      <div className="border-2 border-[#141414] bg-white p-3 shadow-[2px_2px_0px_#141414] flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
        <div className="flex items-center gap-2">
          <span className="font-bold text-[#141414]/70 mr-1">DEVICE:</span>
          <button
            type="button"
            onClick={() => setDevice('mobile')}
            className={`flex items-center gap-1.5 px-3 py-1.5 border-2 font-bold cursor-pointer transition-all ${
              device === 'mobile'
                ? 'bg-[#141414] text-white border-[#141414] shadow-[2px_2px_0px_#888888]'
                : 'bg-[#E4E3E0] text-[#141414] hover:bg-white border-[#141414]'
            }`}
          >
            <Smartphone className="h-3.5 w-3.5" />
            <span>MOBILE (375PX)</span>
          </button>

          <button
            type="button"
            onClick={() => setDevice('tablet')}
            className={`flex items-center gap-1.5 px-3 py-1.5 border-2 font-bold cursor-pointer transition-all ${
              device === 'tablet'
                ? 'bg-[#141414] text-white border-[#141414] shadow-[2px_2px_0px_#888888]'
                : 'bg-[#E4E3E0] text-[#141414] hover:bg-white border-[#141414]'
            }`}
          >
            <Tablet className="h-3.5 w-3.5" />
            <span>TABLET (768PX)</span>
          </button>

          <button
            type="button"
            onClick={() => setDevice('desktop')}
            className={`flex items-center gap-1.5 px-3 py-1.5 border-2 font-bold cursor-pointer transition-all ${
              device === 'desktop'
                ? 'bg-[#141414] text-white border-[#141414] shadow-[2px_2px_0px_#888888]'
                : 'bg-[#E4E3E0] text-[#141414] hover:bg-white border-[#141414]'
            }`}
          >
            <Monitor className="h-3.5 w-3.5" />
            <span>DESKTOP (1200PX)</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          {device !== 'desktop' && (
            <button
              type="button"
              onClick={() => setIsLandscape(!isLandscape)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 border border-[#141414] bg-[#E4E3E0] hover:bg-white font-bold cursor-pointer"
            >
              <RotateCw className="h-3.5 w-3.5" />
              <span>ROTATE</span>
            </button>
          )}

          <a
            href={report.targetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 border border-[#141414] px-2.5 py-1.5 bg-[#E4E3E0] hover:bg-white font-bold"
          >
            <span>OPEN SITE</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Interactive Simulation Frame */}
      <div className="border-2 border-[#141414] bg-[#CCCCCC] p-4 sm:p-8 flex justify-center items-center overflow-x-auto min-h-[500px]">
        <div
          style={{ width: currentDim.width, maxWidth: '100%' }}
          className="border-4 border-[#141414] bg-white shadow-[8px_8px_0px_#141414] flex flex-col transition-all duration-300"
        >
          {/* Mockup Titlebar */}
          <div className="bg-[#141414] text-white px-3 py-1.5 flex items-center justify-between text-[11px] font-mono select-none">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span className="ml-2 font-bold truncate max-w-[200px]">{currentDim.name}</span>
            </div>
            <div className="text-[10px] text-neutral-400 bg-neutral-800 px-2 py-0.5 truncate max-w-[220px]">
              {report.targetUrl}
            </div>
          </div>

          {/* Viewport Frame */}
          <div
            style={{ height: Math.min(600, currentDim.height) }}
            className="w-full relative bg-white overflow-hidden flex flex-col justify-center items-center text-center p-6"
          >
            {!iframeError ? (
              <iframe
                src={report.targetUrl}
                title="Viewport Simulator"
                className="w-full h-full border-none"
                onError={() => setIframeError(true)}
                sandbox="allow-scripts allow-same-origin"
              />
            ) : (
              <div className="space-y-3 font-mono max-w-sm">
                <AlertTriangle className="h-8 w-8 text-amber-600 mx-auto" />
                <h4 className="font-black text-sm uppercase">Frame Embedding Blocked (X-Frame-Options)</h4>
                <p className="text-xs text-[#141414]/70">
                  The target website specifies a frame security policy preventing rendering inside external iframes.
                </p>
                <div className="pt-2">
                  <a
                    href={report.targetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 border-2 border-[#141414] bg-[#141414] text-white text-xs font-bold shadow-[2px_2px_0px_#888888]"
                  >
                    <span>OPEN DIRECTLY</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile UX & Touch Targets Audit Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
        {/* Viewport Tag */}
        <div className="border-2 border-[#141414] bg-white p-4 shadow-[2px_2px_0px_#141414] space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold uppercase">Viewport Configuration</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-700" />
          </div>
          <p className="text-[11px] text-[#141414]/70">
            <code>width=device-width, initial-scale=1.0</code> establishes the responsive layout scale without horizontal pinch-to-zoom requirements.
          </p>
        </div>

        {/* Touch Targets 48x48 */}
        <div className="border-2 border-[#141414] bg-white p-4 shadow-[2px_2px_0px_#141414] space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold uppercase">Touch Targets (≥48px)</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-700" />
          </div>
          <p className="text-[11px] text-[#141414]/70">
            Interactive buttons and navigation links must provide a minimum 48×48px tap target with 8px spacing to prevent accidental touches.
          </p>
        </div>

        {/* Font Legibility */}
        <div className="border-2 border-[#141414] bg-white p-4 shadow-[2px_2px_0px_#141414] space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold uppercase">Text Legibility</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-700" />
          </div>
          <p className="text-[11px] text-[#141414]/70">
            Base font sizes below 12px force users to pinch-zoom and adversely affect Google Mobile-First Indexing scores.
          </p>
        </div>
      </div>
    </div>
  );
};
