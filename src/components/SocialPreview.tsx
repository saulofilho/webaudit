import React, { useState } from 'react';
import {
  Globe,
  Share2,
  Smartphone,
  Monitor,
  Image as ImageIcon,
  Twitter,
  Facebook,
  Linkedin,
  Github,
  Instagram,
  Youtube,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Send,
  AtSign,
  Mail,
  Video,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { MetaTagsData, SocialFootprintSummary } from '../types';

interface SocialPreviewProps {
  meta: MetaTagsData;
  url: string;
  socialFootprint?: SocialFootprintSummary;
}

export const SocialPreview: React.FC<SocialPreviewProps> = ({ meta, url, socialFootprint }) => {
  const [serpDevice, setSerpDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [socialTab, setSocialTab] = useState<'google' | 'facebook' | 'twitter'>('google');
  const [copiedProfileUrl, setCopiedProfileUrl] = useState<string | null>(null);

  const hostname = new URL(url).hostname;
  const title = meta.title || meta.openGraph.title || `${hostname} - No title set`;
  const description = meta.description || meta.openGraph.description || 'No meta description set for this page.';
  const image = meta.openGraph.image || meta.twitter.image || meta.favicon;

  const titleLength = title.length;
  const descLength = description.length;

  const handleCopyProfile = (profileUrl: string) => {
    navigator.clipboard.writeText(profileUrl);
    setCopiedProfileUrl(profileUrl);
    setTimeout(() => setCopiedProfileUrl(null), 1800);
  };

  const getPlatformIcon = (platform: string) => {
    const p = platform.toLowerCase();
    if (p.includes('twitter') || p.includes('x')) return <Twitter className="h-4 w-4 text-sky-500" />;
    if (p.includes('linkedin')) return <Linkedin className="h-4 w-4 text-blue-600" />;
    if (p.includes('github')) return <Github className="h-4 w-4 text-[#141414]" />;
    if (p.includes('facebook')) return <Facebook className="h-4 w-4 text-blue-700" />;
    if (p.includes('instagram')) return <Instagram className="h-4 w-4 text-pink-600" />;
    if (p.includes('youtube')) return <Youtube className="h-4 w-4 text-red-600" />;
    if (p.includes('tiktok')) return <Video className="h-4 w-4 text-cyan-600" />;
    if (p.includes('discord')) return <MessageSquare className="h-4 w-4 text-indigo-500" />;
    if (p.includes('telegram')) return <Send className="h-4 w-4 text-sky-400" />;
    if (p.includes('threads')) return <AtSign className="h-4 w-4 text-neutral-800" />;
    if (p.includes('substack')) return <Mail className="h-4 w-4 text-orange-600" />;
    return <Share2 className="h-4 w-4 text-amber-600" />;
  };

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

      {/* NEW METRIC PANEL: Active Social Media Profile Footprint Analysis */}
      <div className="border-t-2 border-[#141414] pt-5 mt-6">
        <div className="bg-[#141414] text-white p-4 border-2 border-[#141414] flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-[3px_3px_0px_#888888]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center bg-blue-500 text-white border-2 border-white">
              <Share2 className="h-5 w-5 font-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black uppercase text-white tracking-wide">
                  Active Social Footprint &amp; Profile Link Scanner
                </h4>
                <span className="bg-emerald-400 text-[#141414] text-[9px] font-black px-1.5 py-0.5 uppercase border border-white">
                  Homepage Audit
                </span>
              </div>
              <p className="text-[11px] text-[#E4E3E0]/70">
                Detects verified brand channels, social profile links, and cross-platform presence signals.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="text-right">
              <span className="text-[10px] uppercase text-[#E4E3E0]/70 block">Social Reach Grade</span>
              <span className="text-base font-black text-emerald-400">
                {socialFootprint?.socialReachGrade || (socialFootprint?.totalProfilesFound ? 'Moderate' : 'None')}
              </span>
            </div>
            <div className="border-l border-white/20 pl-3 text-right">
              <span className="text-[10px] uppercase text-[#E4E3E0]/70 block">Footprint Score</span>
              <span className="text-base font-black text-amber-300">
                {socialFootprint?.socialFootprintScore ?? (socialFootprint?.totalProfilesFound ? 80 : 25)} / 100
              </span>
            </div>
          </div>
        </div>

        {/* Footprint Key Metrics Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="border border-[#141414] bg-white p-3">
            <span className="text-[10px] font-bold uppercase text-[#141414]/70 block">Active Profiles Found</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-black text-[#141414]">
                {socialFootprint?.totalProfilesFound || 0}
              </span>
              <span className="text-xs text-[#141414]/60">linked channels</span>
            </div>
          </div>

          <div className="border border-[#141414] bg-white p-3">
            <span className="text-[10px] font-bold uppercase text-[#141414]/70 block">Unique Platforms</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-black text-blue-700">
                {socialFootprint?.platformsDetectedCount || 0}
              </span>
              <span className="text-xs text-[#141414]/60">networks</span>
            </div>
          </div>

          <div className="border border-[#141414] bg-white p-3">
            <span className="text-[10px] font-bold uppercase text-[#141414]/70 block">SSL Security (HTTPS)</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-black text-emerald-700">
                {socialFootprint?.profiles.filter((p) => p.isSecureHttps).length || 0}
              </span>
              <span className="text-xs text-[#141414]/60">
                / {socialFootprint?.totalProfilesFound || 0} encrypted
              </span>
            </div>
          </div>

          <div className="border border-[#141414] bg-white p-3">
            <span className="text-[10px] font-bold uppercase text-[#141414]/70 block">Noopener / Me Verification</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-black text-purple-700">
                {socialFootprint?.profiles.filter((p) => p.hasRelMeOrNoopener).length || 0}
              </span>
              <span className="text-xs text-[#141414]/60">proper rel attributes</span>
            </div>
          </div>
        </div>

        {/* Profiles Grid / List */}
        {socialFootprint && socialFootprint.profiles.length > 0 ? (
          <div className="mt-4 border border-[#141414] bg-white p-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#141414]/20 mb-3">
              <h5 className="text-xs font-black uppercase text-[#141414] flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Detected Active Profiles ({socialFootprint.profiles.length})</span>
              </h5>
              <span className="text-[11px] text-[#141414]/70">
                Platforms: {socialFootprint.platformsList.join(', ')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {socialFootprint.profiles.map((profile, idx) => (
                <div
                  key={idx}
                  className="border border-[#141414] bg-[#E4E3E0]/30 p-3 hover:bg-[#E4E3E0]/60 transition-colors flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-white border border-[#141414] shadow-[1px_1px_0px_#141414]">
                          {getPlatformIcon(profile.platform)}
                        </div>
                        <div>
                          <span className="text-xs font-black text-[#141414] block leading-tight">
                            {profile.platform}
                          </span>
                          {profile.handle && (
                            <span className="text-[11px] font-bold text-blue-700 block">
                              {profile.handle}
                            </span>
                          )}
                        </div>
                      </div>

                      <span
                        className={`text-[9px] font-black px-1.5 py-0.5 border ${
                          profile.status === 'verified'
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-800'
                            : profile.status === 'detected'
                            ? 'bg-blue-100 text-blue-900 border-blue-800'
                            : 'bg-amber-100 text-amber-900 border-amber-800'
                        }`}
                      >
                        {profile.status.toUpperCase()}
                      </span>
                    </div>

                    <p className="text-[11px] text-[#141414]/80 truncate font-mono mt-1" title={profile.url}>
                      {profile.url}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2.5 mt-2 border-t border-[#141414]/10 text-[10px]">
                    <span className={profile.isSecureHttps ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                      {profile.isSecureHttps ? '✓ HTTPS' : '⚠️ Plain HTTP'}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyProfile(profile.url)}
                        className="text-[#141414] hover:underline font-bold cursor-pointer"
                      >
                        {copiedProfileUrl === profile.url ? 'Copied!' : 'Copy'}
                      </button>
                      <span>•</span>
                      <a
                        href={profile.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-0.5 text-blue-700 hover:underline font-bold"
                      >
                        Visit <ExternalLink className="h-3 w-3" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-4 border-2 border-dashed border-[#141414]/40 bg-amber-50/50 p-6 text-center">
            <AlertTriangle className="h-6 w-6 text-amber-600 mx-auto mb-2" />
            <h5 className="text-xs font-black uppercase text-[#141414]">No Social Profile Links Detected On Homepage</h5>
            <p className="text-[11px] text-[#141414]/70 mt-1 max-w-lg mx-auto">
              No outbound links to recognized social profiles (Twitter/X, LinkedIn, GitHub, YouTube, Instagram, etc.) were found on the homepage. Linking active official channels strengthens brand authenticity, Knowledge Graph entities, and organic audience engagement.
            </p>
          </div>
        )}

        {/* Guidance and SEO Strategy Note */}
        <div className="mt-3 p-3 bg-white border border-[#141414] text-[11px] text-[#141414]/80 flex items-start gap-2">
          <Sparkles className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
          <p>
            <strong>Why Social Footprint Matters:</strong> Search engine crawlers (Googlebot, Bingbot) scan homepage anchor tags for external social channels. Adding links with <code className="bg-[#E4E3E0] px-1 py-0.5 border border-[#141414]/20">rel=&quot;me noopener&quot;</code> corroborates company identity, powers Google Knowledge Panels, and provides referral trust flow.
          </p>
        </div>
      </div>
    </div>
  );
};
