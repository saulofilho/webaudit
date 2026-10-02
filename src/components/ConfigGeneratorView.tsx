import React, { useState, useMemo } from 'react';
import {
  Shield,
  FileCode,
  Copy,
  Check,
  Download,
  Terminal,
  Settings2,
  ExternalLink,
  Sparkles,
  Server,
  Layers,
} from 'lucide-react';
import { AuditReport } from '../types';

interface ConfigGeneratorViewProps {
  report: AuditReport;
}

type Platform = 'vercel' | 'cloudflare' | 'netlify' | 'nginx' | 'apache' | 'nextjs' | 'express';

export const ConfigGeneratorView: React.FC<ConfigGeneratorViewProps> = ({ report }) => {
  const [platform, setPlatform] = useState<Platform>('vercel');
  const [copied, setCopied] = useState<boolean>(false);
  const [enableHstsSubdomains, setEnableHstsSubdomains] = useState<boolean>(true);
  const [enableStrictCsp, setEnableStrictCsp] = useState<boolean>(true);
  const [frameOptions, setFrameOptions] = useState<'SAMEORIGIN' | 'DENY'>('SAMEORIGIN');

  // Identify missing headers from current audit
  const missingHeaders = useMemo(() => {
    return report.rawData.securityHeaders.filter((h) => h.status === 'missing' || h.status === 'insecure');
  }, [report.rawData.securityHeaders]);

  const configData = useMemo(() => {
    const hstsVal = enableHstsSubdomains
      ? 'max-age=63072000; includeSubDomains; preload'
      : 'max-age=31536000';

    const cspVal = enableStrictCsp
      ? "default-src 'self'; script-src 'self' 'unsafe-inline' https:; style-src 'self' 'unsafe-inline' https:; img-src 'self' data: https:; font-src 'self' https: data:; connect-src 'self' https:; frame-ancestors 'self';"
      : "default-src 'self' https:; img-src 'self' data: https:;";

    const headersList = [
      { key: 'Strict-Transport-Security', val: hstsVal },
      { key: 'X-Content-Type-Options', val: 'nosniff' },
      { key: 'X-Frame-Options', val: frameOptions },
      { key: 'Referrer-Policy', val: 'strict-origin-when-cross-origin' },
      { key: 'Permissions-Policy', val: 'camera=(), microphone=(), geolocation=(), payment=()' },
      { key: 'Content-Security-Policy', val: cspVal },
    ];

    let code = '';
    let fileName = '';

    switch (platform) {
      case 'vercel':
        fileName = 'vercel.json';
        code = JSON.stringify(
          {
            headers: [
              {
                source: '/(.*)',
                headers: headersList.map((h) => ({ key: h.key, value: h.val })),
              },
            ],
          },
          null,
          2
        );
        break;

      case 'cloudflare':
        fileName = '_headers';
        code = `/*\n${headersList.map((h) => `  ${h.key}: ${h.val}`).join('\n')}\n`;
        break;

      case 'netlify':
        fileName = 'netlify.toml';
        code = `[[headers]]\n  for = "/*"\n  [headers.values]\n${headersList
          .map((h) => `    ${h.key} = "${h.val}"`)
          .join('\n')}\n`;
        break;

      case 'nginx':
        fileName = 'nginx.conf';
        code = `# WebAudit Security Directives for server {} block\n${headersList
          .map((h) => `add_header ${h.key} "${h.val}" always;`)
          .join('\n')}\n`;
        break;

      case 'apache':
        fileName = '.htaccess';
        code = `<IfModule mod_headers.c>\n${headersList
          .map((h) => `  Header set ${h.key} "${h.val}"`)
          .join('\n')}\n</IfModule>\n`;
        break;

      case 'nextjs':
        fileName = 'next.config.js';
        code = `/** @type {import('next').NextConfig} */\nconst nextConfig = {\n  async headers() {\n    return [\n      {\n        source: '/:path*',\n        headers: [\n${headersList
          .map((h) => `          { key: '${h.key}', value: '${h.val}' },`)
          .join('\n')}\n        ],\n      },\n    ];\n  },\n};\n\nmodule.exports = nextConfig;\n`;
        break;

      case 'express':
        fileName = 'securityMiddleware.ts';
        code = `import { Request, Response, NextFunction } from 'express';\n\nexport function applySecurityHeaders(req: Request, res: Response, next: NextFunction) {\n${headersList
          .map((h) => `  res.setHeader('${h.key}', '${h.val}');`)
          .join('\n')}\n  next();\n}\n`;
        break;
    }

    return { code, fileName, headersList };
  }, [platform, enableHstsSubdomains, enableStrictCsp, frameOptions]);

  const handleCopy = () => {
    navigator.clipboard.writeText(configData.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([configData.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = configData.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 text-[#141414]">
      {/* Header Banner */}
      <div className="border-2 border-[#141414] bg-white p-5 shadow-[4px_4px_0px_#141414]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center border-2 border-[#141414] bg-[#141414] text-white">
              <Shield className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight">
                Production-Ready Security Config Generator (1-Click Fix)
              </h2>
              <p className="text-xs text-[#141414]/70">
                Generate production config files addressing all missing HTTP security headers on your server
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="border border-[#141414] bg-rose-100 text-rose-950 px-2.5 py-1 font-bold">
              {missingHeaders.length} MISSING HEADERS ON TARGET
            </span>
          </div>
        </div>
      </div>

      {/* Platform Selector Buttons */}
      <div className="border-2 border-[#141414] bg-white p-3 shadow-[2px_2px_0px_#141414]">
        <div className="text-[11px] font-mono font-bold uppercase mb-2 text-[#141414]/70">
          SELECT YOUR HOSTING / PRODUCTION PLATFORM:
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 font-mono text-xs">
          {[
            { id: 'vercel', name: 'Vercel', file: 'vercel.json' },
            { id: 'cloudflare', name: 'Cloudflare', file: '_headers' },
            { id: 'netlify', name: 'Netlify', file: 'netlify.toml' },
            { id: 'nginx', name: 'Nginx', file: 'nginx.conf' },
            { id: 'apache', name: 'Apache', file: '.htaccess' },
            { id: 'nextjs', name: 'Next.js', file: 'next.config.js' },
            { id: 'express', name: 'Express / Node', file: 'middleware.ts' },
          ].map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setPlatform(item.id as Platform)}
              className={`p-2.5 text-center border-2 transition-all cursor-pointer font-bold ${
                platform === item.id
                  ? 'bg-[#141414] text-white border-[#141414] shadow-[2px_2px_0px_#888888]'
                  : 'bg-[#E4E3E0] text-[#141414] border-[#141414] hover:bg-white'
              }`}
            >
              <div className="truncate">{item.name}</div>
              <div className="text-[9px] opacity-70 truncate mt-0.5">{item.file}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Customization Options Bar */}
      <div className="border-2 border-[#141414] bg-[#E4E3E0] p-4 shadow-[2px_2px_0px_#141414] flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer font-bold select-none">
            <input
              type="checkbox"
              checked={enableHstsSubdomains}
              onChange={(e) => setEnableHstsSubdomains(e.target.checked)}
              className="accent-[#141414] w-4 h-4 cursor-pointer"
            />
            <span>HSTS with Subdomains + Preload (63072000s)</span>
          </label>

          <label className="flex items-center gap-2 cursor-pointer font-bold select-none">
            <input
              type="checkbox"
              checked={enableStrictCsp}
              onChange={(e) => setEnableStrictCsp(e.target.checked)}
              className="accent-[#141414] w-4 h-4 cursor-pointer"
            />
            <span>Strict CSP (Content Security Policy)</span>
          </label>

          <div className="flex items-center gap-2 font-bold">
            <span>X-Frame-Options:</span>
            <select
              value={frameOptions}
              onChange={(e) => setFrameOptions(e.target.value as any)}
              className="bg-white border border-[#141414] px-2 py-0.5 text-xs font-bold"
            >
              <option value="SAMEORIGIN">SAMEORIGIN (Recommended)</option>
              <option value="DENY">DENY (Strict)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1.5 border-2 border-[#141414] bg-white px-3 py-1.5 font-bold hover:bg-[#141414] hover:text-white shadow-[2px_2px_0px_#141414] transition-all cursor-pointer"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'COPIED!' : 'COPY CODE'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 border-2 border-[#141414] bg-[#141414] text-white px-3 py-1.5 font-bold hover:bg-neutral-800 shadow-[2px_2px_0px_#888888] transition-all cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" />
            <span>DOWNLOAD {configData.fileName.toUpperCase()}</span>
          </button>
        </div>
      </div>

      {/* Code Editor Window */}
      <div className="border-2 border-[#141414] bg-[#141414] text-[#E4E3E0] shadow-[6px_6px_0px_#141414]">
        {/* Editor Titlebar */}
        <div className="flex items-center justify-between border-b border-[#333333] px-4 py-2.5 bg-[#1C1C1C]">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
            <span className="font-mono text-xs font-bold text-white ml-2">
              {configData.fileName}
            </span>
          </div>

          <span className="font-mono text-[10px] text-neutral-400">
            READY FOR COMMIT / DEPLOY
          </span>
        </div>

        {/* Code Content */}
        <pre className="p-4 sm:p-5 font-mono text-xs overflow-x-auto leading-relaxed selection:bg-amber-400 selection:text-black">
          <code>{configData.code}</code>
        </pre>
      </div>

      {/* Instructions on where to place the file */}
      <div className="border-2 border-[#141414] bg-white p-5 shadow-[4px_4px_0px_#141414]">
        <h4 className="text-xs font-mono font-black uppercase mb-2 flex items-center gap-1.5">
          <Terminal className="h-4 w-4" />
          How to apply in your project:
        </h4>
        <div className="text-xs font-mono space-y-1 text-[#141414]/80">
          {platform === 'vercel' && (
            <p>
              Save as <strong>vercel.json</strong> at the root of your Git repository and deploy to Vercel. Headers are applied instantly at the Edge.
            </p>
          )}
          {platform === 'cloudflare' && (
            <p>
              Save as <strong>_headers</strong> inside your build output folder (e.g., <code>dist/_headers</code> or <code>public/_headers</code>) for Cloudflare Pages.
            </p>
          )}
          {platform === 'netlify' && (
            <p>
              Add the snippet above to your existing <strong>netlify.toml</strong> or create it at your project root.
            </p>
          )}
          {platform === 'nginx' && (
            <p>
              Paste the <code>add_header</code> lines inside the <code>server {'{ ... }'}</code> block of your <strong>/etc/nginx/sites-available/default</strong> config and run <code>sudo nginx -t && sudo systemctl reload nginx</code>.
            </p>
          )}
          {platform === 'apache' && (
            <p>
              Insert the snippet into your <strong>.htaccess</strong> file in the public root folder and ensure <code>mod_headers</code> is enabled.
            </p>
          )}
          {platform === 'nextjs' && (
            <p>
              Paste the <code>headers()</code> async function into your <strong>next.config.js</strong> or <strong>next.config.mjs</strong> and rebuild the application.
            </p>
          )}
          {platform === 'express' && (
            <p>
              Import the middleware function and register before route definitions via <code>app.use(applySecurityHeaders)</code>.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
