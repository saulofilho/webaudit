import React, { useState } from 'react';
import {
  Search,
  Smartphone,
  Monitor,
  Copy,
  Check,
  RotateCcw,
  Sparkles,
  AlertTriangle,
  Globe,
  Star,
  Calendar,
} from 'lucide-react';
import { AuditReport } from '../types';

interface SerpSimulatorViewProps {
  report: AuditReport;
}

export const SerpSimulatorView: React.FC<SerpSimulatorViewProps> = ({ report }) => {
  const initialTitle = report.rawData?.metaTags?.title || report.items.find((i) => i.id === 'seo-title')?.title || 'Website Title';
  const initialDesc =
    report.rawData?.metaTags?.description ||
    report.items.find((i) => i.id === 'seo-description')?.summary ||
    'Website description snippet in search engine results.';

  const urlObj = new URL(report.targetUrl);
  const hostname = urlObj.hostname;
  const initialSlug = urlObj.pathname.length > 1 ? urlObj.pathname : '/';

  const [title, setTitle] = useState<string>(initialTitle);
  const [description, setDescription] = useState<string>(initialDesc);
  const [slug, setSlug] = useState<string>(initialSlug);
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [includeDate, setIncludeDate] = useState<boolean>(true);
  const [includeRating, setIncludeRating] = useState<boolean>(true);
  const [copied, setCopied] = useState<boolean>(false);

  // Estimation: Average char width ~10px in Google SERP font (Arial 20px for title)
  const maxTitlePixels = device === 'desktop' ? 600 : 580;
  const maxDescPixels = device === 'desktop' ? 960 : 680;

  const titlePixelEstimate = Math.round(title.length * 9.8);
  const descPixelEstimate = Math.round(description.length * 5.8);

  const titlePercent = Math.min(100, Math.round((titlePixelEstimate / maxTitlePixels) * 100));
  const descPercent = Math.min(100, Math.round((descPixelEstimate / maxDescPixels) * 100));

  const isTitleTruncated = titlePixelEstimate > maxTitlePixels;
  const isDescTruncated = descPixelEstimate > maxDescPixels;

  const displayedTitle = isTitleTruncated ? title.slice(0, Math.floor(maxTitlePixels / 9.8)) + ' ...' : title;
  const displayedDesc = isDescTruncated ? description.slice(0, Math.floor(maxDescPixels / 5.8)) + ' ...' : description;

  const handleReset = () => {
    setTitle(initialTitle);
    setDescription(initialDesc);
    setSlug(initialSlug);
  };

  const handleCopyTags = () => {
    const htmlSnippet = `<title>${title}</title>\n<meta name="description" content="${description}" />`;
    navigator.clipboard.writeText(htmlSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="border-2 border-[#141414] bg-white p-5 shadow-[4px_4px_0px_#141414]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b-2 border-[#141414]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center border-2 border-[#141414] bg-[#141414] text-white shadow-[2px_2px_0px_#888888]">
              <Search className="h-6 w-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-lg font-black uppercase text-[#141414]">
                Interactive Google SERP Snippet Simulator
              </h2>
              <p className="text-xs font-mono text-[#141414]/70">
                Live pixel-width testing & real-time optimization for Google Desktop and Mobile search results.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex border-2 border-[#141414] bg-white">
              <button
                onClick={() => setDevice('desktop')}
                className={`flex items-center gap-1 px-3 py-1 text-xs font-mono font-bold uppercase transition-colors cursor-pointer ${
                  device === 'desktop' ? 'bg-[#141414] text-white' : 'text-[#141414] hover:bg-[#E4E3E0]'
                }`}
              >
                <Monitor className="h-3.5 w-3.5" />
                <span>Desktop</span>
              </button>
              <button
                onClick={() => setDevice('mobile')}
                className={`flex items-center gap-1 px-3 py-1 text-xs font-mono font-bold uppercase transition-colors cursor-pointer border-l-2 border-[#141414] ${
                  device === 'mobile' ? 'bg-[#141414] text-white' : 'text-[#141414] hover:bg-[#E4E3E0]'
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span>Mobile</span>
              </button>
            </div>

            <button
              onClick={handleCopyTags}
              className="flex items-center gap-1.5 border-2 border-[#141414] bg-[#141414] text-white px-3 py-1.5 text-xs font-mono font-black uppercase hover:bg-black transition-all shadow-[2px_2px_0px_#888888] cursor-pointer"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied HTML!' : 'Copy Meta Tags'}</span>
            </button>
          </div>
        </div>

        {/* Live SERP Mockup Box */}
        <div className="mt-5 p-6 bg-[#F8F9FA] border-2 border-[#141414] shadow-[inset_2px_2px_0px_rgba(0,0,0,0.05)]">
          <div className="text-[10px] font-mono font-bold text-[#141414]/50 uppercase mb-3 flex items-center justify-between">
            <span>Google Search Engine Result Page Preview ({device.toUpperCase()})</span>
            <span className="flex items-center gap-1 text-blue-700">
              <Globe className="h-3 w-3" /> https://www.google.com/search?q={encodeURIComponent(hostname)}
            </span>
          </div>

          <div
            className={`bg-white border border-slate-300 p-5 rounded-lg shadow-sm transition-all ${
              device === 'mobile' ? 'max-w-[420px] mx-auto rounded-xl border-slate-400' : 'max-w-[700px]'
            }`}
          >
            {/* Header: Favicon + Domain URL + Breadcrumbs */}
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-6 h-6 rounded-full bg-[#141414] flex items-center justify-center text-[10px] text-white font-bold shrink-0">
                {hostname.charAt(0).toUpperCase()}
              </div>
              <div className="leading-tight truncate">
                <span className="text-xs text-[#202124] font-medium block truncate">{hostname}</span>
                <span className="text-[11px] text-[#4d5156] truncate block">
                  https://{hostname}{slug !== '/' ? slug : ''}
                </span>
              </div>
            </div>

            {/* Clickable Blue Title */}
            <div className="mt-1">
              <h3 className="text-[20px] leading-[1.3] text-[#1a0dab] hover:underline cursor-pointer font-normal font-sans tracking-normal break-words">
                {displayedTitle}
              </h3>
            </div>

            {/* Star Rating Rich Snippet */}
            {includeRating && (
              <div className="flex items-center gap-1.5 text-xs text-[#4d5156] mt-1.5 font-sans">
                <div className="flex items-center text-[#e37400]">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-current" />
                  ))}
                </div>
                <span className="font-semibold text-[#3c4043]">4.9</span>
                <span className="text-[#70757a]">(142 reviews)</span>
              </div>
            )}

            {/* Snippet Description */}
            <p className="text-[14px] leading-[1.58] text-[#4d5156] mt-1.5 font-sans break-words">
              {includeDate && <span className="text-[#70757a] font-normal mr-1.5">Oct 7, 2026 —</span>}
              {displayedDesc}
            </p>
          </div>
        </div>

        {/* Truncation & Pixel Width Analytics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-5">
          {/* Title Gauge */}
          <div className="border border-[#141414] p-3.5 bg-white">
            <div className="flex items-center justify-between text-xs font-mono font-bold mb-1.5">
              <span>Title Length: {title.length} chars (~{titlePixelEstimate}px)</span>
              <span className={isTitleTruncated ? 'text-red-600' : 'text-emerald-700'}>
                Max {maxTitlePixels}px ({titlePercent}%)
              </span>
            </div>
            <div className="w-full bg-[#E4E3E0] h-2.5 border border-[#141414] overflow-hidden">
              <div
                className={`h-full transition-all ${
                  titlePercent > 100 ? 'bg-red-600' : titlePercent > 85 ? 'bg-emerald-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(100, titlePercent)}%` }}
              />
            </div>
            <div className="text-[11px] font-mono mt-1.5">
              {isTitleTruncated ? (
                <span className="text-red-700 font-bold flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Truncation detected! Google will cut this with (...)
                </span>
              ) : title.length < 30 ? (
                <span className="text-amber-700 font-bold">⚠️ Title is short (aim for 50-60 characters)</span>
              ) : (
                <span className="text-emerald-700 font-bold">✓ Optimal title length for Google</span>
              )}
            </div>
          </div>

          {/* Description Gauge */}
          <div className="border border-[#141414] p-3.5 bg-white">
            <div className="flex items-center justify-between text-xs font-mono font-bold mb-1.5">
              <span>Description: {description.length} chars (~{descPixelEstimate}px)</span>
              <span className={isDescTruncated ? 'text-red-600' : 'text-emerald-700'}>
                Max {maxDescPixels}px ({descPercent}%)
              </span>
            </div>
            <div className="w-full bg-[#E4E3E0] h-2.5 border border-[#141414] overflow-hidden">
              <div
                className={`h-full transition-all ${
                  descPercent > 100 ? 'bg-red-600' : descPercent > 80 ? 'bg-emerald-500' : 'bg-blue-500'
                }`}
                style={{ width: `${Math.min(100, descPercent)}%` }}
              />
            </div>
            <div className="text-[11px] font-mono mt-1.5">
              {isDescTruncated ? (
                <span className="text-red-700 font-bold flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" /> Description too long. It will be truncated in search results.
                </span>
              ) : description.length < 70 ? (
                <span className="text-amber-700 font-bold">⚠️ Description is short (aim for 120-155 characters)</span>
              ) : (
                <span className="text-emerald-700 font-bold">✓ Ideal description length</span>
              )}
            </div>
          </div>
        </div>

        {/* Real-time Inputs Section */}
        <div className="mt-5 border-t-2 border-[#141414] pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase text-[#141414] font-mono">
              Live Snippet Editor
            </h3>
            <div className="flex items-center gap-4 text-xs font-mono">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeRating}
                  onChange={(e) => setIncludeRating(e.target.checked)}
                  className="rounded border-[#141414]"
                />
                <span>Simulate Rich Snippet Stars</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeDate}
                  onChange={(e) => setIncludeDate(e.target.checked)}
                  className="rounded border-[#141414]"
                />
                <span>Simulate Publication Date</span>
              </label>
              <button
                onClick={handleReset}
                className="flex items-center gap-1 text-[#141414] hover:underline"
              >
                <RotateCcw className="h-3 w-3" /> Reset to Original
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-mono font-bold text-[#141414] mb-1">
                Page Title Tag (&lt;title&gt;)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border-2 border-[#141414] p-2 text-xs font-mono bg-white text-[#141414] focus:outline-none focus:ring-1 focus:ring-[#141414]"
                placeholder="Enter title tag..."
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-[#141414] mb-1">
                Meta Description (&lt;meta name=&quot;description&quot; ...&gt;)
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full border-2 border-[#141414] p-2 text-xs font-mono bg-white text-[#141414] focus:outline-none focus:ring-1 focus:ring-[#141414]"
                placeholder="Enter meta description..."
              />
            </div>

            <div>
              <label className="block text-xs font-mono font-bold text-[#141414] mb-1">
                URL Path / Slug
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="w-full border-2 border-[#141414] p-2 text-xs font-mono bg-white text-[#141414] focus:outline-none focus:ring-1 focus:ring-[#141414]"
                placeholder="/blog/seo-guide"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
