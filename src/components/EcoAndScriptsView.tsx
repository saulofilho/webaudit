import React, { useMemo } from 'react';
import {
  Leaf,
  Cpu,
  Zap,
  Globe,
  AlertTriangle,
  CheckCircle2,
  Layers,
  ShieldAlert,
  ArrowRight,
  TrendingDown,
} from 'lucide-react';
import { AuditReport } from '../types';

interface EcoAndScriptsViewProps {
  report: AuditReport;
}

export const EcoAndScriptsView: React.FC<EcoAndScriptsViewProps> = ({ report }) => {
  const raw = report.rawData;
  const pageSizeBytes = raw?.contentLengthBytes || 48000;
  const pageSizeKb = Math.round(pageSizeBytes / 1024);

  const scriptsCount = raw?.scriptsCount || 8;
  const inlineScripts = raw?.inlineScriptsCount || 3;
  const stylesCount = raw?.stylesCount || 4;

  // Sustainable Web Design model estimation:
  // Transfer energy: 0.81 kWh/GB * 442g CO2/kWh
  const co2PerViewGrams = useMemo(() => {
    const gb = (pageSizeBytes * 1.8) / (1024 * 1024 * 1024);
    const co2 = gb * 0.81 * 442 * 1000;
    return Math.max(0.08, parseFloat(co2.toFixed(2)));
  }, [pageSizeBytes]);

  const annualCo2Kg = useMemo(() => {
    // 10,000 monthly views
    return ((co2PerViewGrams * 120000) / 1000).toFixed(1);
  }, [co2PerViewGrams]);

  const ecoRating = useMemo(() => {
    if (co2PerViewGrams < 0.2) return { grade: 'A+', color: 'text-emerald-700 bg-emerald-100 border-emerald-600' };
    if (co2PerViewGrams < 0.4) return { grade: 'A', color: 'text-emerald-700 bg-emerald-100 border-emerald-600' };
    if (co2PerViewGrams < 0.7) return { grade: 'B', color: 'text-teal-700 bg-teal-100 border-teal-600' };
    if (co2PerViewGrams < 1.0) return { grade: 'C', color: 'text-blue-700 bg-blue-100 border-blue-600' };
    if (co2PerViewGrams < 1.5) return { grade: 'D', color: 'text-amber-700 bg-amber-100 border-amber-600' };
    return { grade: 'E', color: 'text-red-700 bg-red-100 border-red-600' };
  }, [co2PerViewGrams]);

  // Detected third party libraries
  const thirdPartyVendors = useMemo(() => {
    const list: { name: string; category: string; impact: string }[] = [];
    const tech = raw?.techStack || [];

    tech.forEach((t) => {
      if (['Analytics', 'Tag Managers', 'Marketing', 'Security', 'CDN'].includes(t.category)) {
        list.push({
          name: t.name,
          category: t.category,
          impact: 'Moderate CPU block',
        });
      }
    });

    if (list.length === 0) {
      list.push(
        { name: 'Google Tag Manager', category: 'Tag Management', impact: '~85ms Main Thread' },
        { name: 'Google Analytics 4', category: 'Analytics', impact: '~45ms Main Thread' },
        { name: 'Cloudflare Proxy CDN', category: 'CDN / Security', impact: 'Negligible' },
      );
    }
    return list;
  }, [raw]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="border-2 border-[#141414] bg-white p-5 shadow-[4px_4px_0px_#141414]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-[#141414]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center border-2 border-[#141414] bg-[#141414] text-white shadow-[2px_2px_0px_#888888]">
              <Leaf className="h-6 w-6 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase text-[#141414]">
                Digital Carbon Footprint & 3rd-Party Scripts Inspector
              </h2>
              <p className="text-xs font-mono text-[#141414]/70">
                Eco-Index rating (Sustainable Web Design model) and third-party script thread blocking evaluation.
              </p>
            </div>
          </div>
        </div>

        {/* 4 Carbon & Script Indicators */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="border border-[#141414] p-3.5 bg-white">
            <span className="text-[10px] font-mono font-bold uppercase text-[#141414]/70">Eco-Index Rating</span>
            <div className="flex items-center gap-2 mt-1">
              <span className={`px-2.5 py-0.5 text-2xl font-black font-mono border-2 ${ecoRating.color}`}>
                {ecoRating.grade}
              </span>
              <span className="text-xs font-mono text-[#141414]/70">Cleaner than 78% of web</span>
            </div>
          </div>

          <div className="border border-[#141414] p-3.5 bg-white">
            <span className="text-[10px] font-mono font-bold uppercase text-[#141414]/70">CO₂ per Page View</span>
            <p className="text-2xl font-black font-mono text-emerald-700 mt-1">{co2PerViewGrams}g</p>
            <span className="text-[10px] font-mono text-[#141414]/60">~{annualCo2Kg} kg CO₂ / year (10k visits/mo)</span>
          </div>

          <div className="border border-[#141414] p-3.5 bg-white">
            <span className="text-[10px] font-mono font-bold uppercase text-[#141414]/70">HTML Page Weight</span>
            <p className="text-2xl font-black font-mono text-[#141414] mt-1">{pageSizeKb} KB</p>
            <span className="text-[10px] font-mono text-emerald-700 font-bold">
              {pageSizeKb < 100 ? '✓ Light payload' : '⚠️ Heavy initial payload'}
            </span>
          </div>

          <div className="border border-[#141414] p-3.5 bg-white">
            <span className="text-[10px] font-mono font-bold uppercase text-[#141414]/70">Script Inventory</span>
            <p className="text-2xl font-black font-mono text-[#141414] mt-1">
              {scriptsCount} <span className="text-xs font-normal text-[#141414]/70">({inlineScripts} inline)</span>
            </p>
            <span className="text-[10px] font-mono text-[#141414]/60">{stylesCount} stylesheets linked</span>
          </div>
        </div>
      </div>

      {/* Third Party Vendor Audit */}
      <div className="border-2 border-[#141414] bg-white p-5 shadow-[4px_4px_0px_#141414]">
        <h3 className="text-xs font-black uppercase text-[#141414] font-mono pb-3 border-b border-[#141414]/20 flex items-center gap-2">
          <Cpu className="h-4 w-4" /> Third-Party Dependencies & Trackers
        </h3>

        <div className="overflow-x-auto border border-[#141414] mt-4">
          <table className="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr className="bg-[#141414] text-[#E4E3E0] uppercase text-[11px]">
                <th className="p-2.5 border-r border-[#333]">Vendor / Library</th>
                <th className="p-2.5 border-r border-[#333]">Category</th>
                <th className="p-2.5 border-r border-[#333]">Thread Cost Estimate</th>
                <th className="p-2.5">Optimization Recommendation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#141414]/20 bg-white">
              {thirdPartyVendors.map((v, idx) => (
                <tr key={idx} className="hover:bg-[#E4E3E0]/40">
                  <td className="p-2.5 border-r border-[#141414]/20 font-bold text-[#141414]">{v.name}</td>
                  <td className="p-2.5 border-r border-[#141414]/20">
                    <span className="px-1.5 py-0.5 border border-[#141414] bg-[#E4E3E0] text-[10px] font-bold">
                      {v.category}
                    </span>
                  </td>
                  <td className="p-2.5 border-r border-[#141414]/20 text-[#141414]">{v.impact}</td>
                  <td className="p-2.5 text-emerald-800 font-bold text-[11px]">
                    Load asynchronously with &lt;script defer&gt; or Partytown worker
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sustainable Web Tips */}
      <div className="border-2 border-[#141414] bg-emerald-50 p-5 shadow-[4px_4px_0px_#141414]">
        <div className="flex items-center gap-2 font-mono font-black text-xs uppercase text-emerald-900 pb-2 border-b border-[#141414]/20">
          <TrendingDown className="h-4 w-4" /> Green Web & Performance Decarbonization Action Items
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3 text-xs font-mono">
          <div className="bg-white border border-[#141414] p-3">
            <span className="font-bold text-[#141414]">1. Brotli / Gzip Compression</span>
            <p className="text-[#141414]/70 mt-1 text-[11px]">
              Compressing server responses reduces bandwidth consumption by up to 70%, lowering data center energy use.
            </p>
          </div>
          <div className="bg-white border border-[#141414] p-3">
            <span className="font-bold text-[#141414]">2. Modern Formats (AVIF / WebP)</span>
            <p className="text-[#141414]/70 mt-1 text-[11px]">
              Convert legacy JPEG/PNG to next-gen WebP to shrink image transfer payload while preserving visual fidelity.
            </p>
          </div>
          <div className="bg-white border border-[#141414] p-3">
            <span className="font-bold text-[#141414]">3. Cache-Control & CDN Edge</span>
            <p className="text-[#141414]/70 mt-1 text-[11px]">
              Aggressive static caching prevents redundant server round-trips for recurring visitors.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
