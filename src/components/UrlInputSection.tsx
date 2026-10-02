import React, { useState, useEffect } from 'react';
import { Globe, ArrowRight, Shield, Search, Zap, CheckCircle2, Loader2, Sparkles, AlertTriangle, Terminal, Cpu } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface UrlInputSectionProps {
  onAnalyze: (url: string) => void;
  isLoading: boolean;
  error?: string | null;
  initialUrl?: string;
}

const PRESET_URLS = [
  { label: 'GitHub', url: 'https://github.com' },
  { label: 'Vercel', url: 'https://vercel.com' },
  { label: 'Wikipedia', url: 'https://wikipedia.org' },
  { label: 'Stripe', url: 'https://stripe.com' },
  { label: 'OpenAI', url: 'https://openai.com' },
  { label: 'HTTP Example', url: 'http://example.com' },
];

const AUDIT_STEPS = [
  'Verifying TCP Handshake & TLS/SSL Certificate...',
  'Inspecting Security Headers (HSTS, CSP, X-Frame-Options, X-Content-Type)...',
  'Analyzing HTML5 DOM, SEO Metatags, OpenGraph, and Accessibility...',
  'Examining Tech Stack, Compression, Images, and Assets...',
  'Processing Heuristic Diagnostics & Gemini Technical Recommendations...',
];

export const UrlInputSection: React.FC<UrlInputSectionProps> = ({
  onAnalyze,
  isLoading,
  error,
  initialUrl = '',
}) => {
  const [url, setUrl] = useState(initialUrl);
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  useEffect(() => {
    if (initialUrl) {
      setUrl(initialUrl);
    }
  }, [initialUrl]);

  useEffect(() => {
    if (!isLoading) {
      setActiveStepIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setActiveStepIndex((prev) => (prev < AUDIT_STEPS.length - 1 ? prev + 1 : prev));
    }, 1800);
    return () => clearInterval(interval);
  }, [isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    onAnalyze(url.trim());
  };

  const handleSelectPreset = (presetUrl: string) => {
    setUrl(presetUrl);
    onAnalyze(presetUrl);
  };

  return (
    <div className="w-full max-w-4xl mx-auto py-6 sm:py-10">
      {/* Header text */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 border-2 border-[#141414] bg-white px-3 py-1 text-xs font-mono font-bold text-[#141414] shadow-[2px_2px_0px_#141414] mb-4 uppercase">
          <Terminal className="h-3.5 w-3.5 text-[#141414]" />
          <span>WEBSITE TECHNICAL DIAGNOSTIC // REAL-TIME</span>
        </div>
        
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-mono font-black tracking-tight text-[#141414] uppercase">
          Security, SEO & <br className="hidden sm:inline" />
          Best Practices Audit
        </h1>

        <p className="mt-3 text-xs sm:text-sm font-mono text-[#141414]/80 max-w-2xl mx-auto">
          Enter any public URL to generate an in-depth web compliance audit, HTTP headers analysis, social metatags preview, and production-ready code fixes.
        </p>
      </div>

      {/* Main Input Form */}
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-2 bg-white border-2 border-[#141414] shadow-[4px_4px_0px_#141414]">
          <div className="relative flex-1 flex items-center pl-2">
            <span className="hidden sm:inline text-xs font-mono font-bold text-[#141414] bg-[#E4E3E0] px-2 py-1 border border-[#141414] mr-2">
              TARGET_URL:
            </span>
            <Globe className="h-4 w-4 text-[#141414] shrink-0 sm:hidden mr-1" />
            <input
              id="input-url"
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="e.g. github.com or https://mysite.com"
              disabled={isLoading}
              className="w-full bg-transparent px-2 py-2.5 text-xs sm:text-sm font-mono text-[#141414] placeholder-[#141414]/40 focus:outline-none disabled:opacity-50"
            />
          </div>

          <button
            id="btn-submit-analyze"
            type="submit"
            disabled={isLoading || !url.trim()}
            className="flex items-center justify-center gap-2 bg-[#141414] px-6 py-3 text-xs sm:text-sm font-mono font-black text-white hover:bg-black border border-[#141414] shadow-[2px_2px_0px_#888888] disabled:opacity-50 disabled:cursor-not-allowed transition-all shrink-0 cursor-pointer uppercase tracking-wider"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-white" />
                <span>PROCESSING...</span>
              </>
            ) : (
              <>
                <span>AUDIT NOW</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>

      {/* Preset Pills */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-1.5 text-xs font-mono">
        <span className="text-[#141414]/70 text-[11px] font-bold uppercase mr-1">TEST PRESETS:</span>
        {PRESET_URLS.map((preset) => (
          <button
            key={preset.url}
            id={`preset-btn-${preset.label.toLowerCase().replace(/\s+/g, '-')}`}
            type="button"
            onClick={() => handleSelectPreset(preset.url)}
            disabled={isLoading}
            className="border border-[#141414] bg-white px-2 py-0.5 text-[11px] font-mono font-bold text-[#141414] hover:bg-[#141414] hover:text-[#E4E3E0] shadow-[1px_1px_0px_#141414] disabled:opacity-50 transition-all cursor-pointer"
          >
            {preset.label}
          </button>
        ))}
      </div>

      {/* Error alert if any */}
      {error && (
        <div className="mt-6 border-2 border-[#141414] bg-white p-4 text-[#141414] shadow-[4px_4px_0px_#141414] flex items-start gap-3">
          <div className="bg-rose-600 text-white p-1 border border-[#141414] shrink-0">
            <AlertTriangle className="h-4 w-4" />
          </div>
          <div className="text-xs font-mono">
            <p className="font-bold uppercase text-rose-700">URL DIAGNOSTIC FAILED</p>
            <p className="mt-1 text-[#141414]">{error}</p>
            <p className="mt-2 text-[10px] text-[#141414]/70">
              Ensure the host responds to public connections and try again.
            </p>
          </div>
        </div>
      )}

      {/* Live Loading Progress Steps */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-6 overflow-hidden border-2 border-[#141414] bg-white p-5 shadow-[4px_4px_0px_#141414]"
          >
            <div className="flex items-center justify-between mb-3 border-b border-[#141414] pb-2">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center bg-[#141414] text-white">
                  <Cpu className="h-3.5 w-3.5 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-xs font-mono font-black text-[#141414] uppercase">DIAGNOSTIC PROBE EXECUTION</h4>
                  <p className="text-[10px] font-mono text-[#141414]/70">MULTI-VECTOR AUDIT IN PROGRESS</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold bg-[#141414] text-white px-2 py-0.5">
                {Math.round(((activeStepIndex + 1) / AUDIT_STEPS.length) * 100)}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-[#E4E3E0] h-2 border border-[#141414] mb-4">
              <div
                className="bg-[#141414] h-full transition-all duration-300"
                style={{ width: `${((activeStepIndex + 1) / AUDIT_STEPS.length) * 100}%` }}
              />
            </div>

            {/* Steps list */}
            <div className="space-y-1.5 font-mono text-xs">
              {AUDIT_STEPS.map((step, idx) => {
                const isDone = idx < activeStepIndex;
                const isCurrent = idx === activeStepIndex;
                return (
                  <div
                    key={idx}
                    className={`flex items-center gap-2 px-2 py-1 border transition-colors ${
                      isDone
                        ? 'bg-emerald-50 border-emerald-600 text-emerald-950 font-medium'
                        : isCurrent
                        ? 'bg-[#E4E3E0] border-[#141414] text-[#141414] font-bold'
                        : 'bg-white border-transparent text-[#141414]/40'
                    }`}
                  >
                    <span className="text-[10px] font-bold">
                      {isDone ? '[DONE]' : isCurrent ? '[RUN]' : '[WAIT]'}
                    </span>
                    <span className="text-[11px] truncate">{step}</span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
