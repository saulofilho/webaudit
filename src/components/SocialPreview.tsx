import React, { useState } from 'react';
import { Globe, Share2, Smartphone, Monitor, Image as ImageIcon, Twitter, Facebook } from 'lucide-react';
import { MetaTagsData } from '../types';

interface SocialPreviewProps {
  meta: MetaTagsData;
  url: string;
}

export const SocialPreview: React.FC<SocialPreviewProps> = ({ meta, url }) => {
  const [serpDevice, setSerpDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [socialTab, setSocialTab] = useState<'google' | 'facebook' | 'twitter'>('google');

  const hostname = new URL(url).hostname;
  const title = meta.title || meta.openGraph.title || `${hostname} - No title set`;
  const description = meta.description || meta.openGraph.description || 'No meta description set for this page.';
  const image = meta.openGraph.image || meta.twitter.image || meta.favicon;

  const titleLength = title.length;
  const descLength = description.length;

  return (
    <div className="border-2 border-[#141414] bg-white p-5 sm:p-6 shadow-[4px_4px_0px_#141414] font-mono text-[#141414] space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b-2 border-[#141414]">
        <div>
          <h3 className="text-xs sm:text-sm font-black text-[#141414] flex items-center gap-2 uppercase">
            <Share2 className="h-4 w-4 text-[#141414]" />
            METADATA & SOCIAL SHARING PREVIEW
          </h3>
          <p className="text-[11px] text-[#141414]/70 mt-0.5">
            Visual inspection and character counts for Google SERP, Open Graph, and Twitter Cards.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex items-center gap-1 bg-[#E4E3E0] p-1 border border-[#141414] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setSocialTab('google')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold transition-all cursor-pointer uppercase ${
              socialTab === 'google' ? 'bg-[#141414] text-white' : 'text-[#141414] hover:bg-white'
            }`}
          >
            <Globe className="h-3.5 w-3.5" />
            <span>Google SERP</span>
          </button>

          <button
            type="button"
            onClick={() => setSocialTab('facebook')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold transition-all cursor-pointer uppercase ${
              socialTab === 'facebook' ? 'bg-[#141414] text-white' : 'text-[#141414] hover:bg-white'
            }`}
          >
            <Facebook className="h-3.5 w-3.5" />
            <span>Open Graph</span>
          </button>

          <button
            type="button"
            onClick={() => setSocialTab('twitter')}
            className={`flex items-center gap-1.5 px-3 py-1 text-xs font-bold transition-all cursor-pointer uppercase ${
              socialTab === 'twitter' ? 'bg-[#141414] text-white' : 'text-[#141414] hover:bg-white'
            }`}
          >
            <Twitter className="h-3.5 w-3.5" />
            <span>Twitter/X</span>
          </button>
        </div>
      </div>

      {/* Meta lengths meter */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Title Meter */}
        <div className="bg-[#E4E3E0]/50 p-3 border border-[#141414]">
          <div className="flex justify-between text-xs mb-1.5 font-mono">
            <span className="font-bold text-[#141414] text-[11px] uppercase">&lt;title&gt; LENGTH:</span>
            <span className={`font-bold ${
              titleLength >= 40 && titleLength <= 60 ? 'text-emerald-800' : 'text-amber-800'
            }`}>
              {titleLength} chars (ideal: 45-60)
            </span>
          </div>
          <div className="w-full bg-[#E4E3E0] h-2 border border-[#141414]">
            <div
              className={`h-full ${
                titleLength >= 40 && titleLength <= 60 ? 'bg-emerald-600' : (titleLength > 65 ? 'bg-rose-600' : 'bg-amber-600')
              }`}
              style={{ width: `${Math.min(100, (titleLength / 70) * 100)}%` }}
            />
          </div>
        </div>

        {/* Description Meter */}
        <div className="bg-[#E4E3E0]/50 p-3 border border-[#141414]">
          <div className="flex justify-between text-xs mb-1.5 font-mono">
            <span className="font-bold text-[#141414] text-[11px] uppercase">META DESCRIPTION LENGTH:</span>
            <span className={`font-bold ${
              descLength >= 120 && descLength <= 160 ? 'text-emerald-800' : 'text-amber-800'
            }`}>
              {descLength} chars (ideal: 120-160)
            </span>
          </div>
          <div className="w-full bg-[#E4E3E0] h-2 border border-[#141414]">
            <div
              className={`h-full ${
                descLength >= 120 && descLength <= 160 ? 'bg-emerald-600' : (descLength > 165 ? 'bg-rose-600' : 'bg-amber-600')
              }`}
              style={{ width: `${Math.min(100, (descLength / 180) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Previews */}
      {socialTab === 'google' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-[#141414]">GOOGLE SEARCH SNIPPET:</span>
            <div className="flex items-center gap-1 bg-[#E4E3E0] p-0.5 border border-[#141414] text-xs">
              <button
                type="button"
                onClick={() => setSerpDevice('desktop')}
                className={`p-1 ${serpDevice === 'desktop' ? 'bg-[#141414] text-white' : 'text-[#141414]'}`}
                title="Desktop"
              >
                <Monitor className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setSerpDevice('mobile')}
                className={`p-1 ${serpDevice === 'mobile' ? 'bg-[#141414] text-white' : 'text-[#141414]'}`}
                title="Mobile"
              >
                <Smartphone className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Google Card Simulation */}
          <div className={`p-4 border-2 border-[#141414] bg-[#202124] text-left shadow-[2px_2px_0px_#141414] ${
            serpDevice === 'mobile' ? 'max-w-sm mx-auto' : 'w-full'
          }`}>
            <div className="flex items-center gap-2 mb-1">
              <div className="h-5 w-5 bg-slate-700 flex items-center justify-center text-[10px] text-slate-300 font-bold overflow-hidden border border-slate-600">
                {meta.favicon ? <img src={meta.favicon} alt="" className="h-4 w-4" referrerPolicy="no-referrer" onError={(e) => (e.currentTarget.style.display = 'none')} /> : hostname[0]?.toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-[12px] text-[#dadce0] font-sans font-medium">{hostname}</span>
                <span className="text-[11px] text-[#bdc1c6] truncate max-w-xs">{url}</span>
              </div>
            </div>

            <h4 className="text-[17px] text-[#8ab4f8] hover:underline font-normal cursor-pointer font-sans leading-snug line-clamp-1 mt-1">
              {title}
            </h4>

            <p className="text-[13px] text-[#bdc1c6] font-sans leading-relaxed mt-1 line-clamp-2">
              {description}
            </p>
          </div>
        </div>
      )}

      {socialTab === 'facebook' && (
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase text-[#141414]">OPEN GRAPH CARD (WHATSAPP, FACEBOOK, LINKEDIN):</span>
          <div className="max-w-md mx-auto border-2 border-[#141414] bg-[#18191a] shadow-[4px_4px_0px_#141414] overflow-hidden">
            {image ? (
              <div className="h-48 w-full bg-slate-800 relative overflow-hidden flex items-center justify-center border-b border-[#333]">
                <img
                  src={image}
                  alt="OG Image Preview"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="h-36 w-full bg-[#242526] flex flex-col items-center justify-center text-slate-400 gap-1 border-b border-[#333]">
                <ImageIcon className="h-8 w-8 text-slate-500" />
                <span className="text-xs font-mono">NO OG:IMAGE FOUND</span>
              </div>
            )}

            <div className="p-4 bg-[#18191a] font-sans">
              <span className="text-[10px] text-[#b0b3b8] uppercase tracking-wider font-bold block mb-1 font-mono">
                {hostname}
              </span>
              <h4 className="text-sm font-bold text-[#e4e6eb] line-clamp-1 leading-snug">
                {title}
              </h4>
              <p className="text-xs text-[#b0b3b8] line-clamp-2 mt-1 leading-relaxed">
                {description}
              </p>
            </div>
          </div>
        </div>
      )}

      {socialTab === 'twitter' && (
        <div className="space-y-3">
          <span className="text-xs font-bold uppercase text-[#141414]">TWITTER / X CARD PREVIEW:</span>
          <div className="max-w-md mx-auto border-2 border-[#141414] bg-black shadow-[4px_4px_0px_#141414] overflow-hidden">
            {image ? (
              <div className="h-44 w-full bg-slate-900 relative overflow-hidden flex items-center justify-center border-b border-slate-800">
                <img
                  src={image}
                  alt="Twitter Card Preview"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="h-32 w-full bg-neutral-900 flex flex-col items-center justify-center text-slate-500 gap-1 border-b border-slate-800">
                <ImageIcon className="h-7 w-7" />
                <span className="text-xs font-mono">NO TWITTER:IMAGE FOUND</span>
              </div>
            )}

            <div className="p-3.5 bg-black font-sans">
              <span className="text-[10px] text-slate-400 block mb-0.5 font-mono">{hostname}</span>
              <h4 className="text-sm font-bold text-white line-clamp-1">{title}</h4>
              <p className="text-xs text-slate-400 line-clamp-2 mt-0.5">{description}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
