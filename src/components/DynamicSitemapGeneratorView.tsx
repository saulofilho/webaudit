import React, { useState, useEffect, useMemo } from 'react';
import {
  FileCode,
  Download,
  Copy,
  Check,
  Plus,
  Trash2,
  ExternalLink,
  Sparkles,
  Rocket,
  ShieldCheck,
  Search,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Compass,
  ArrowRight,
  Globe,
  Sliders,
  Image as ImageIcon,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Share2,
  Layers,
  Zap,
} from 'lucide-react';
import { AuditReport, SitemapCrawlData } from '../types';

interface SitemapEntry {
  id: string;
  loc: string;
  priority: number;
  changefreq: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  lastmod: string;
  enabled: boolean;
  isRoot?: boolean;
  images?: Array<{ loc: string; title?: string }>;
}

interface DynamicSitemapGeneratorViewProps {
  report?: AuditReport | null;
  onOpenGoogleAccelerator?: () => void;
}

export const DynamicSitemapGeneratorView: React.FC<DynamicSitemapGeneratorViewProps> = ({
  report,
  onOpenGoogleAccelerator,
}) => {
  const [targetDomain, setTargetDomain] = useState<string>('');
  const [sitemapEntries, setSitemapEntries] = useState<SitemapEntry[]>([]);
  const [includeImages, setIncludeImages] = useState<boolean>(true);
  const [includeTrailingSlash, setIncludeTrailingSlash] = useState<boolean>(true);
  const [autoOptimized, setAutoOptimized] = useState<boolean>(false);
  const [copiedXml, setCopiedXml] = useState<boolean>(false);
  const [copiedRobots, setCopiedRobots] = useState<boolean>(false);
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);
  const [activeStepTab, setActiveStepTab] = useState<number>(1);
  const [newUrlInput, setNewUrlInput] = useState<string>('');
  const [newPriority, setNewPriority] = useState<number>(0.8);
  const [newFreq, setNewFreq] = useState<SitemapEntry['changefreq']>('weekly');
  const [isLoadingCrawl, setIsLoadingCrawl] = useState<boolean>(false);
  const [crawlError, setCrawlError] = useState<string | null>(null);

  // Initialize or update entries when report changes
  useEffect(() => {
    let origin = 'https://webauditpro.ai.studio';
    if (report?.targetUrl) {
      try {
        const u = new URL(report.targetUrl);
        origin = u.origin;
      } catch {
        origin = report.targetUrl.replace(/\/+$/, '');
      }
    } else if (typeof window !== 'undefined' && window.location.origin) {
      origin = window.location.origin;
    }
    setTargetDomain(origin);

    const today = new Date().toISOString().split('T')[0];

    // Seed default optimized entries based on report or site structure
    const initialPages: SitemapEntry[] = [
      {
        id: 'page-root',
        loc: `${origin}/`,
        priority: 1.0,
        changefreq: 'daily',
        lastmod: today,
        enabled: true,
        isRoot: true,
        images: [
          { loc: `${origin}/og-image.png`, title: 'WebAudit PRO - Diagnóstico Completo de Website' }
        ]
      },
      {
        id: 'page-vitals',
        loc: `${origin}/#vitals`,
        priority: 0.9,
        changefreq: 'weekly',
        lastmod: today,
        enabled: true,
      },
      {
        id: 'page-seo',
        loc: `${origin}/#seo`,
        priority: 0.9,
        changefreq: 'weekly',
        lastmod: today,
        enabled: true,
      },
      {
        id: 'page-security',
        loc: `${origin}/#security`,
        priority: 0.9,
        changefreq: 'weekly',
        lastmod: today,
        enabled: true,
      },
      {
        id: 'page-accessibility',
        loc: `${origin}/#accessibility`,
        priority: 0.8,
        changefreq: 'weekly',
        lastmod: today,
        enabled: true,
      },
      {
        id: 'page-compliance',
        loc: `${origin}/#compliance`,
        priority: 0.8,
        changefreq: 'monthly',
        lastmod: today,
        enabled: true,
      },
      {
        id: 'page-privacy',
        loc: `${origin}/#privacy`,
        priority: 0.7,
        changefreq: 'monthly',
        lastmod: today,
        enabled: true,
      },
    ];

    setSitemapEntries(initialPages);
  }, [report]);

  // Optionally fetch crawled links from server if available
  const handleFetchDiscoveredPages = async () => {
    if (!targetDomain) return;
    setIsLoadingCrawl(true);
    setCrawlError(null);
    try {
      const res = await fetch('/api/crawl-sitemap', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: targetDomain, maxPages: 12 }),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data: SitemapCrawlData = await res.json();
      const today = new Date().toISOString().split('T')[0];

      if (data.pages && data.pages.length > 0) {
        const discovered = data.pages.map((p, idx) => {
          let priority = 0.8;
          let changefreq: SitemapEntry['changefreq'] = 'weekly';
          const path = new URL(p.url, targetDomain).pathname;

          if (path === '/' || path === '') {
            priority = 1.0;
            changefreq = 'daily';
          } else if (path.includes('blog') || path.includes('post') || path.includes('artigo')) {
            priority = 0.7;
            changefreq = 'monthly';
          } else if (path.includes('term') || path.includes('privac') || path.includes('politica')) {
            priority = 0.5;
            changefreq = 'yearly';
          }

          return {
            id: `crawled-${idx}-${Date.now()}`,
            loc: p.url,
            priority,
            changefreq,
            lastmod: today,
            enabled: p.statusCode < 400,
            images: [],
          };
        });

        // Deduplicate with existing
        const existingLocs = new Set(sitemapEntries.map((e) => e.loc.toLowerCase().replace(/\/$/, '')));
        const toAdd = discovered.filter((d) => !existingLocs.has(d.loc.toLowerCase().replace(/\/$/, '')));
        setSitemapEntries((prev) => [...prev, ...toAdd]);
      }
    } catch (err: any) {
      setCrawlError(err.message || 'Erro ao sincronizar páginas rastreadas.');
    } finally {
      setIsLoadingCrawl(false);
    }
  };

  // Add custom URL
  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUrlInput.trim()) return;

    let fullLoc = newUrlInput.trim();
    if (!fullLoc.startsWith('http://') && !fullLoc.startsWith('https://')) {
      const prefix = targetDomain.endsWith('/') ? targetDomain : `${targetDomain}/`;
      fullLoc = `${prefix}${fullLoc.replace(/^\/+/, '')}`;
    }

    const today = new Date().toISOString().split('T')[0];
    const newEntry: SitemapEntry = {
      id: `manual-${Date.now()}`,
      loc: fullLoc,
      priority: Math.max(0.1, Math.min(1.0, Number(newPriority))),
      changefreq: newFreq,
      lastmod: today,
      enabled: true,
    };

    setSitemapEntries((prev) => [...prev, newEntry]);
    setNewUrlInput('');
  };

  const handleToggleEntry = (id: string) => {
    setSitemapEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, enabled: !e.enabled } : e))
    );
  };

  const handleRemoveEntry = (id: string) => {
    setSitemapEntries((prev) => prev.filter((e) => e.id !== id));
  };

  const handleUpdateEntry = (
    id: string,
    field: keyof SitemapEntry,
    val: any
  ) => {
    setSitemapEntries((prev) =>
      prev.map((e) => (e.id === id ? { ...e, [field]: val } : e))
    );
  };

  // 1-Click Google SEO Optimization
  const handleApplyAutoOptimization = () => {
    const today = new Date().toISOString().split('T')[0];
    setSitemapEntries((prev) =>
      prev.map((e) => {
        let p = e.priority;
        let f: SitemapEntry['changefreq'] = e.changefreq;
        try {
          const urlObj = new URL(e.loc);
          if (urlObj.pathname === '/' || urlObj.pathname === '') {
            p = 1.0;
            f = 'daily';
          } else if (
            urlObj.pathname.includes('preco') ||
            urlObj.pathname.includes('pricing') ||
            urlObj.pathname.includes('feature') ||
            urlObj.pathname.includes('recurso') ||
            urlObj.hash.includes('vitals') ||
            urlObj.hash.includes('security')
          ) {
            p = 0.9;
            f = 'weekly';
          } else if (urlObj.pathname.includes('blog') || urlObj.pathname.includes('noticia')) {
            p = 0.7;
            f = 'weekly';
          } else if (urlObj.pathname.includes('contato') || urlObj.pathname.includes('sobre')) {
            p = 0.8;
            f = 'monthly';
          } else if (urlObj.pathname.includes('term') || urlObj.pathname.includes('privac')) {
            p = 0.5;
            f = 'yearly';
          }
        } catch {
          // keep
        }
        return {
          ...e,
          priority: p,
          changefreq: f,
          lastmod: today,
          enabled: true,
        };
      })
    );
    setAutoOptimized(true);
    setTimeout(() => setAutoOptimized(false), 3000);
  };

  // Generate XML String
  const generatedXml = useMemo(() => {
    const enabledList = sitemapEntries.filter((e) => e.enabled);
    const hasImages =
      includeImages &&
      enabledList.some((e) => Array.isArray(e.images) && e.images.length > 0);

    const lines: string[] = [];
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');
    if (hasImages) {
      lines.push(
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">'
      );
    } else {
      lines.push('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    }

    for (const item of enabledList) {
      lines.push('  <url>');
      lines.push(`    <loc>${item.loc}</loc>`);
      if (item.lastmod) lines.push(`    <lastmod>${item.lastmod}</lastmod>`);
      if (item.changefreq) lines.push(`    <changefreq>${item.changefreq}</changefreq>`);
      if (item.priority !== undefined) {
        lines.push(`    <priority>${Number(item.priority).toFixed(1)}</priority>`);
      }

      if (includeImages && Array.isArray(item.images)) {
        for (const img of item.images) {
          if (img?.loc) {
            lines.push('    <image:image>');
            lines.push(`      <image:loc>${img.loc}</image:loc>`);
            if (img.title) {
              const safeTitle = img.title
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;');
              lines.push(`      <image:title>${safeTitle}</image:title>`);
            }
            lines.push('    </image:image>');
          }
        }
      }

      lines.push('  </url>');
    }

    lines.push('</urlset>');
    return lines.join('\n');
  }, [sitemapEntries, includeImages]);

  // Robots.txt Snippet
  const robotsTxtContent = useMemo(() => {
    const sitemapLoc = `${targetDomain.replace(/\/+$/, '')}/sitemap.xml`;
    return `# robots.txt otimizado para o Googlebot e acelerador de indexação
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/

# Localização canônica do Sitemap XML gerado
Sitemap: ${sitemapLoc}
`;
  }, [targetDomain]);

  // Sitemap Health & Indexation Score (0 - 100)
  const healthScore = useMemo(() => {
    let score = 70;
    const enabled = sitemapEntries.filter((e) => e.enabled);
    if (enabled.length >= 1) score += 10;
    if (enabled.some((e) => e.priority === 1.0)) score += 5;
    if (enabled.every((e) => e.lastmod && e.lastmod.length === 10)) score += 5;
    if (enabled.every((e) => e.loc.startsWith('https://'))) score += 5;
    if (includeImages) score += 5;
    return Math.min(100, score);
  }, [sitemapEntries, includeImages]);

  // Copy Handlers
  const handleCopyXml = () => {
    navigator.clipboard.writeText(generatedXml);
    setCopiedXml(true);
    setTimeout(() => setCopiedXml(false), 2000);
  };

  const handleCopyRobots = () => {
    navigator.clipboard.writeText(robotsTxtContent);
    setCopiedRobots(true);
    setTimeout(() => setCopiedRobots(false), 2000);
  };

  // Download Handlers
  const handleDownloadXml = () => {
    const blob = new Blob([generatedXml], { type: 'application/xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'sitemap.xml';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess('sitemap.xml baixado com sucesso!');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const handleDownloadRobots = () => {
    const blob = new Blob([robotsTxtContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'robots.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setDownloadSuccess('robots.txt baixado com sucesso!');
    setTimeout(() => setDownloadSuccess(null), 3000);
  };

  const sitemapUrl = `${targetDomain.replace(/\/+$/, '')}/sitemap.xml`;
  const gscUrl = 'https://search.google.com/search-console';

  return (
    <div className="space-y-6">
      {/* Top Banner Hero */}
      <div className="border-2 border-[#141414] bg-white p-5 shadow-[4px_4px_0px_#141414]">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b-2 border-[#141414]">
          <div className="flex items-start sm:items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center border-2 border-[#141414] bg-emerald-500 text-white shadow-[2px_2px_0px_#141414] shrink-0">
              <FileCode className="h-6 w-6 text-[#141414]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-black uppercase text-[#141414]">
                  Gerador de Sitemap XML Dinâmico & Acelerador GSC
                </h2>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-mono font-bold px-2 py-0.5 border border-emerald-500 uppercase flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Padrão Sitemaps.org 0.9 + Google Image
                </span>
              </div>
              <p className="text-xs font-mono text-[#141414]/70 mt-0.5">
                Gere, customize e baixe um sitemap.xml 100% otimizado para os rastreadores do Google, com guia interativo para envio no Google Search Console.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleApplyAutoOptimization}
              className="flex items-center gap-1.5 border-2 border-[#141414] bg-amber-400 hover:bg-amber-300 text-[#141414] px-3 py-2 text-xs font-mono font-black uppercase shadow-[2px_2px_0px_#141414] transition-all cursor-pointer"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#141414]" />
              <span>{autoOptimized ? 'Otimizado!' : 'Otimizar Prioridades'}</span>
            </button>

            <button
              onClick={handleDownloadXml}
              className="flex items-center gap-1.5 border-2 border-[#141414] bg-[#141414] hover:bg-black text-white px-3.5 py-2 text-xs font-mono font-black uppercase shadow-[2px_2px_0px_#888888] transition-all cursor-pointer"
            >
              <Download className="h-3.5 w-3.5 text-emerald-400" />
              <span>Baixar sitemap.xml</span>
            </button>

            {onOpenGoogleAccelerator && (
              <button
                onClick={onOpenGoogleAccelerator}
                className="flex items-center gap-1.5 border-2 border-[#141414] bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 text-xs font-mono font-black uppercase shadow-[2px_2px_0px_#141414] transition-all cursor-pointer"
              >
                <Rocket className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Acelerador Google #1</span>
              </button>
            )}
          </div>
        </div>

        {downloadSuccess && (
          <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-500 text-emerald-800 text-xs font-mono font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{downloadSuccess}</span>
          </div>
        )}

        {/* Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="border border-[#141414] bg-[#E4E3E0]/40 p-3">
            <span className="text-[10px] font-mono font-bold uppercase text-[#141414]/70">
              Score de Indexação
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black font-mono text-emerald-700">
                {healthScore}
              </span>
              <span className="text-xs font-mono text-[#141414]/60">/100</span>
            </div>
            <p className="text-[10px] text-emerald-700 font-mono mt-0.5">✓ Pronto para o Googlebot</p>
          </div>

          <div className="border border-[#141414] bg-white p-3">
            <span className="text-[10px] font-mono font-bold uppercase text-[#141414]/70">
              Total de URLs Habilitadas
            </span>
            <p className="text-2xl font-black font-mono text-[#141414] mt-1">
              {sitemapEntries.filter((e) => e.enabled).length}{' '}
              <span className="text-xs font-normal text-[#141414]/60">
                / {sitemapEntries.length}
              </span>
            </p>
            <p className="text-[10px] text-[#141414]/70 font-mono mt-0.5">Limite máx: 50.000 URLs</p>
          </div>

          <div className="border border-[#141414] bg-white p-3">
            <span className="text-[10px] font-mono font-bold uppercase text-[#141414]/70">
              Tamanho do Arquivo
            </span>
            <p className="text-2xl font-black font-mono text-[#141414] mt-1">
              {(new Blob([generatedXml]).size / 1024).toFixed(1)} <span className="text-xs">KB</span>
            </p>
            <p className="text-[10px] text-[#141414]/70 font-mono mt-0.5">Limite máx: 50MB</p>
          </div>

          <div className="border border-[#141414] bg-white p-3">
            <span className="text-[10px] font-mono font-bold uppercase text-[#141414]/70">
              Google Image Tags
            </span>
            <p className="text-2xl font-black font-mono text-indigo-700 mt-1">
              {includeImages ? 'Ativado' : 'Desativado'}
            </p>
            <p className="text-[10px] text-indigo-600 font-mono mt-0.5">Schema image-1.1</p>
          </div>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: URL List & Config (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Target Domain & Auto Crawl */}
          <div className="border-2 border-[#141414] bg-white p-4 shadow-[3px_3px_0px_#141414] space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <h3 className="font-mono font-black text-sm uppercase text-[#141414] flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-emerald-600" />
                Domínio Raiz do Sitemap
              </h3>
              <button
                type="button"
                onClick={handleFetchDiscoveredPages}
                disabled={isLoadingCrawl}
                className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-bold bg-[#E4E3E0] hover:bg-[#141414] hover:text-white border border-[#141414] transition-all cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingCrawl ? 'animate-spin' : ''}`} />
                <span>{isLoadingCrawl ? 'Rastreando...' : 'Descobrir Páginas do Site'}</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={targetDomain}
                onChange={(e) => setTargetDomain(e.target.value)}
                placeholder="https://seusite.com.br"
                className="flex-1 px-3 py-1.5 bg-neutral-50 border-2 border-[#141414] text-xs font-mono text-[#141414] focus:outline-none focus:bg-white"
              />
              <button
                type="button"
                onClick={() => {
                  const prefix = targetDomain.replace(/\/+$/, '');
                  setSitemapEntries((prev) =>
                    prev.map((e) => {
                      try {
                        const path = new URL(e.loc).pathname + new URL(e.loc).search + new URL(e.loc).hash;
                        return { ...e, loc: `${prefix}${path}` };
                      } catch {
                        return e;
                      }
                    })
                  );
                }}
                className="px-3 py-1.5 bg-[#141414] text-white border-2 border-[#141414] text-xs font-mono font-bold hover:bg-neutral-800 transition-all cursor-pointer whitespace-nowrap"
              >
                Atualizar URLs
              </button>
            </div>

            {crawlError && (
              <p className="text-[11px] font-mono text-red-600 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                {crawlError}
              </p>
            )}

            {/* Quick switches */}
            <div className="flex items-center gap-4 pt-2 border-t border-[#141414]/20 flex-wrap text-xs font-mono">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeImages}
                  onChange={(e) => setIncludeImages(e.target.checked)}
                  className="rounded border-[#141414] text-emerald-600 focus:ring-0"
                />
                <span className="font-bold">Incluir tags de Imagem (Google Image SEO)</span>
              </label>
            </div>
          </div>

          {/* Add New URL Form */}
          <div className="border-2 border-[#141414] bg-white p-4 shadow-[3px_3px_0px_#141414]">
            <h4 className="font-mono font-black text-xs uppercase text-[#141414] mb-2 flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              Adicionar Nova Página ao Sitemap
            </h4>

            <form onSubmit={handleAddUrl} className="space-y-3">
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newUrlInput}
                  onChange={(e) => setNewUrlInput(e.target.value)}
                  placeholder="/blog/novo-artigo ou https://seusite.com/servicos"
                  className="flex-1 px-3 py-1.5 bg-neutral-50 border-2 border-[#141414] text-xs font-mono focus:outline-none focus:bg-white"
                />
                <div className="flex items-center gap-2">
                  <select
                    value={newFreq}
                    onChange={(e) => setNewFreq(e.target.value as any)}
                    className="px-2 py-1.5 bg-white border-2 border-[#141414] text-xs font-mono font-bold"
                  >
                    <option value="daily">daily</option>
                    <option value="weekly">weekly</option>
                    <option value="monthly">monthly</option>
                    <option value="yearly">yearly</option>
                  </select>

                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(Number(e.target.value))}
                    className="px-2 py-1.5 bg-white border-2 border-[#141414] text-xs font-mono font-bold"
                  >
                    <option value={1.0}>1.0 (Home)</option>
                    <option value={0.9}>0.9 (Alta)</option>
                    <option value={0.8}>0.8 (Padrão)</option>
                    <option value={0.7}>0.7 (Artigos)</option>
                    <option value={0.5}>0.5 (Secundária)</option>
                  </select>

                  <button
                    type="submit"
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-[#141414] border-2 border-[#141414] text-xs font-mono font-black uppercase shadow-[1px_1px_0px_#141414] transition-all cursor-pointer whitespace-nowrap"
                  >
                    + Adicionar
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* URLs Table / List */}
          <div className="border-2 border-[#141414] bg-white shadow-[3px_3px_0px_#141414] overflow-hidden">
            <div className="bg-[#141414] text-white px-4 py-2 flex items-center justify-between text-xs font-mono font-bold">
              <span>URLs Configuradas no Sitemap ({sitemapEntries.length})</span>
              <span className="text-emerald-400">
                {sitemapEntries.filter((e) => e.enabled).length} ativas para exportação
              </span>
            </div>

            <div className="divide-y divide-[#141414]/20 max-h-[460px] overflow-y-auto">
              {sitemapEntries.map((item) => (
                <div
                  key={item.id}
                  className={`p-3 text-xs font-mono transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 ${
                    item.enabled ? 'bg-white' : 'bg-neutral-100 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2.5 flex-1 min-w-0">
                    <input
                      type="checkbox"
                      checked={item.enabled}
                      onChange={() => handleToggleEntry(item.id)}
                      className="rounded border-[#141414] text-emerald-600 focus:ring-0 cursor-pointer"
                      title={item.enabled ? 'Desmarcar para não incluir' : 'Marcar para incluir'}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`truncate font-bold ${
                            item.isRoot ? 'text-emerald-700' : 'text-[#141414]'
                          }`}
                          title={item.loc}
                        >
                          {item.loc}
                        </span>
                        {item.isRoot && (
                          <span className="bg-emerald-100 text-emerald-800 text-[9px] px-1.5 py-0.2 border border-emerald-500 font-black">
                            RAIZ
                          </span>
                        )}
                        {item.images && item.images.length > 0 && (
                          <span className="bg-indigo-50 text-indigo-700 text-[9px] px-1 py-0.2 border border-indigo-300 font-bold flex items-center gap-0.5">
                            <ImageIcon className="w-2.5 h-2.5" /> {item.images.length} img
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-[#141414]/60 mt-0.5">
                        lastmod: {item.lastmod}
                      </div>
                    </div>
                  </div>

                  {/* Actions & Selectors */}
                  <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                    <select
                      value={item.changefreq}
                      onChange={(e) =>
                        handleUpdateEntry(item.id, 'changefreq', e.target.value)
                      }
                      className="px-1.5 py-1 bg-white border border-[#141414] text-[11px] font-mono"
                    >
                      <option value="always">always</option>
                      <option value="hourly">hourly</option>
                      <option value="daily">daily</option>
                      <option value="weekly">weekly</option>
                      <option value="monthly">monthly</option>
                      <option value="yearly">yearly</option>
                    </select>

                    <select
                      value={item.priority}
                      onChange={(e) =>
                        handleUpdateEntry(item.id, 'priority', Number(e.target.value))
                      }
                      className="px-1.5 py-1 bg-white border border-[#141414] text-[11px] font-mono font-bold"
                    >
                      <option value={1.0}>1.0</option>
                      <option value={0.9}>0.9</option>
                      <option value={0.8}>0.8</option>
                      <option value={0.7}>0.7</option>
                      <option value={0.6}>0.6</option>
                      <option value={0.5}>0.5</option>
                    </select>

                    {!item.isRoot && (
                      <button
                        type="button"
                        onClick={() => handleRemoveEntry(item.id)}
                        className="p-1 text-neutral-400 hover:text-red-600 transition-colors cursor-pointer"
                        title="Remover URL"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: XML Preview, Robots & Downloads (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* XML Live Preview */}
          <div className="border-2 border-[#141414] bg-[#141414] text-white p-4 shadow-[3px_3px_0px_#141414]">
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-neutral-700">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-emerald-400" />
                <span className="font-mono font-black text-xs uppercase tracking-wider text-emerald-400">
                  Prévia do sitemap.xml
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCopyXml}
                  className="flex items-center gap-1 px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 text-white text-[11px] font-mono border border-neutral-600 transition-all cursor-pointer"
                >
                  {copiedXml ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedXml ? 'Copiado!' : 'Copiar'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadXml}
                  className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500 hover:bg-emerald-400 text-[#141414] text-[11px] font-mono font-bold transition-all cursor-pointer"
                >
                  <Download className="w-3 h-3" />
                  <span>Baixar</span>
                </button>
              </div>
            </div>

            <pre className="mt-3 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-[300px] leading-relaxed p-2 bg-black/50 border border-neutral-800 rounded">
              <code>{generatedXml}</code>
            </pre>
          </div>

          {/* robots.txt Reference & Download */}
          <div className="border-2 border-[#141414] bg-white p-4 shadow-[3px_3px_0px_#141414] space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h4 className="font-mono font-black text-xs uppercase text-[#141414] flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-indigo-600" />
                robots.txt com Diretiva Sitemap
              </h4>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyRobots}
                  className="px-2 py-1 bg-white hover:bg-neutral-100 border border-[#141414] text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  {copiedRobots ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedRobots ? 'Copiado' : 'Copiar'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownloadRobots}
                  className="px-2 py-1 bg-[#141414] hover:bg-black text-white text-[10px] font-mono font-bold transition-all cursor-pointer flex items-center gap-1"
                >
                  <Download className="w-3 h-3 text-emerald-400" />
                  <span>Baixar</span>
                </button>
              </div>
            </div>
            <pre className="text-[10px] font-mono bg-neutral-100 p-2.5 border border-[#141414]/30 text-[#141414] overflow-x-auto leading-relaxed">
              <code>{robotsTxtContent}</code>
            </pre>
            <p className="text-[10px] font-mono text-[#141414]/70">
              O Googlebot sempre consulta o <code>robots.txt</code> primeiro para descobrir a URL exata do sitemap.
            </p>
          </div>
        </div>
      </div>

      {/* STEP-BY-STEP GOOGLE SEARCH CONSOLE INSTRUCTIONS */}
      <div className="border-2 border-[#141414] bg-white p-5 shadow-[4px_4px_0px_#141414]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b-2 border-[#141414]">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center border-2 border-[#141414] bg-amber-400 text-[#141414] shadow-[2px_2px_0px_#141414]">
              <Rocket className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-black uppercase text-[#141414] font-mono">
                Como Enviar ao Google Search Console (GSC) & Acelerar a Indexação
              </h3>
              <p className="text-xs font-mono text-[#141414]/70">
                Siga este roteiro passo a passo para fazer o Google indexar seu site em poucas horas ou dias, em vez de meses.
              </p>
            </div>
          </div>

          <a
            href={gscUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 border-2 border-[#141414] bg-[#141414] text-white hover:bg-neutral-800 px-3.5 py-1.5 text-xs font-mono font-black uppercase shadow-[2px_2px_0px_#888888] transition-all cursor-pointer self-start sm:self-auto"
          >
            <span>Abrir Search Console</span>
            <ExternalLink className="w-3.5 h-3.5 text-amber-400" />
          </a>
        </div>

        {/* Step Navigation Pill Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-4">
          {[
            { step: 1, label: '1. Hospedar Sitemap', time: '2 min' },
            { step: 2, label: '2. Apontar no Robots', time: '1 min' },
            { step: 3, label: '3. Acessar o GSC', time: '1 min' },
            { step: 4, label: '4. Submeter Sitemap', time: '1 min' },
            { step: 5, label: '5. Pedir Indexação', time: '2 min' },
            { step: 6, label: '6. Diagnosticar Erros', time: 'Guia' },
          ].map((s) => (
            <button
              key={s.step}
              type="button"
              onClick={() => setActiveStepTab(s.step)}
              className={`p-2.5 text-left border-2 border-[#141414] transition-all cursor-pointer ${
                activeStepTab === s.step
                  ? 'bg-[#141414] text-white shadow-[2px_2px_0px_#888888]'
                  : 'bg-neutral-50 hover:bg-neutral-100 text-[#141414]'
              }`}
            >
              <div className="text-[10px] font-mono font-black uppercase text-amber-400">
                {s.time}
              </div>
              <div className="text-xs font-mono font-bold mt-0.5 leading-tight">{s.label}</div>
            </button>
          ))}
        </div>

        {/* Active Step Content */}
        <div className="mt-4 p-4 border-2 border-[#141414] bg-neutral-50">
          {activeStepTab === 1 && (
            <div className="space-y-3 font-mono text-xs text-[#141414]">
              <div className="flex items-center gap-2 text-sm font-black text-[#141414] uppercase">
                <span className="flex h-6 w-6 items-center justify-center bg-emerald-500 text-white rounded-full text-xs">
                  1
                </span>
                Hospedar o arquivo sitemap.xml na raiz do seu site
              </div>
              <p>
                O arquivo sitemap baixado deve ser servido exatamente no caminho raiz público do seu domínio:{' '}
                <strong className="bg-white px-1.5 py-0.5 border border-[#141414] text-indigo-700">
                  {sitemapUrl}
                </strong>
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                <div className="bg-white p-3 border border-[#141414]">
                  <strong className="block text-indigo-800 uppercase mb-1">Vercel / Next.js / Vite</strong>
                  <p className="text-[11px] text-neutral-600">
                    Coloque o arquivo dentro da pasta <code>/public/sitemap.xml</code> e faça o deploy. Ele será servido automaticamente na raiz.
                  </p>
                </div>
                <div className="bg-white p-3 border border-[#141414]">
                  <strong className="block text-indigo-800 uppercase mb-1">Nginx / Apache / Hospedagem</strong>
                  <p className="text-[11px] text-neutral-600">
                    Faça o upload do arquivo para a pasta <code>public_html/</code> ou <code>/var/www/html/sitemap.xml</code> via FTP ou SSH.
                  </p>
                </div>
                <div className="bg-white p-3 border border-[#141414]">
                  <strong className="block text-indigo-800 uppercase mb-1">Node.js / Express</strong>
                  <p className="text-[11px] text-neutral-600">
                    Utilize <code>res.sendFile(path.join(__dirname, 'public/sitemap.xml'))</code> com o header <code>Content-Type: application/xml</code>.
                  </p>
                </div>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleDownloadXml}
                  className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-[#141414] font-black uppercase border border-[#141414] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" /> Baixar sitemap.xml agora
                </button>
              </div>
            </div>
          )}

          {activeStepTab === 2 && (
            <div className="space-y-3 font-mono text-xs text-[#141414]">
              <div className="flex items-center gap-2 text-sm font-black text-[#141414] uppercase">
                <span className="flex h-6 w-6 items-center justify-center bg-indigo-500 text-white rounded-full text-xs">
                  2
                </span>
                Declarar a URL do Sitemap no arquivo robots.txt
              </div>
              <p>
                O Googlebot lê o <code>robots.txt</code> antes de qualquer outra página. Adicionar a diretiva <code>Sitemap:</code> garante que qualquer motor de busca (Google, Bing, Yahoo) descubra sua lista de páginas automaticamente.
              </p>
              <div className="bg-black text-emerald-400 p-3 border border-neutral-800 rounded">
                <code className="text-xs">{robotsTxtContent}</code>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleCopyRobots}
                  className="px-3 py-1.5 bg-white hover:bg-neutral-100 text-[#141414] font-bold border border-[#141414] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" /> Copiar robots.txt
                </button>
                <button
                  type="button"
                  onClick={handleDownloadRobots}
                  className="px-3 py-1.5 bg-[#141414] hover:bg-black text-white font-bold border border-[#141414] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" /> Baixar robots.txt
                </button>
              </div>
            </div>
          )}

          {activeStepTab === 3 && (
            <div className="space-y-3 font-mono text-xs text-[#141414]">
              <div className="flex items-center gap-2 text-sm font-black text-[#141414] uppercase">
                <span className="flex h-6 w-6 items-center justify-center bg-amber-500 text-white rounded-full text-xs">
                  3
                </span>
                Acessar o Google Search Console e Selecionar a Propriedade
              </div>
              <p>
                Acesse o Search Console oficial do Google. Se o seu site ainda não estiver cadastrado, adicione como <strong>Prefixo de URL</strong> (ex: <code>https://seusite.com.br</code>) ou como <strong>Domínio</strong> via registro DNS TXT.
              </p>
              <div className="bg-white p-3 border border-[#141414] space-y-2">
                <strong className="block text-indigo-700 uppercase">Validação Rápida via Tag HTML:</strong>
                <p className="text-[11px] text-neutral-600">
                  O Google fornece uma meta tag como <code>&lt;meta name="google-site-verification" content="..." /&gt;</code>. Insira-a no <code>&lt;head&gt;</code> do seu HTML para validação imediata.
                </p>
              </div>
              <div className="pt-1">
                <a
                  href="https://search.google.com/search-console"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase border border-[#141414] inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Abrir Google Search Console</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          )}

          {activeStepTab === 4 && (
            <div className="space-y-3 font-mono text-xs text-[#141414]">
              <div className="flex items-center gap-2 text-sm font-black text-[#141414] uppercase">
                <span className="flex h-6 w-6 items-center justify-center bg-emerald-600 text-white rounded-full text-xs">
                  4
                </span>
                Submeter o Sitemap no Menu "Indexação &gt; Sitemaps"
              </div>
              <ol className="list-decimal list-inside space-y-1.5 pl-1">
                <li>No menu lateral esquerdo do Search Console, clique em <strong>Indexação</strong> &gt; <strong>Sitemaps</strong>.</li>
                <li>No campo <em>"Adicionar novo sitemap"</em>, digite apenas: <code className="bg-white px-2 py-0.5 border border-[#141414] font-bold text-emerald-800">sitemap.xml</code></li>
                <li>Clique no botão azul <strong>ENVIAR</strong> (Submit).</li>
                <li>O Google processará o arquivo e exibirá o Status: <span className="bg-emerald-100 text-emerald-800 px-1 font-bold">Sucesso</span>.</li>
              </ol>
              <div className="p-3 bg-amber-50 border border-amber-300 text-amber-900 text-[11px]">
                💡 <strong>Dica Pro:</strong> Se o status inicial for "Não foi possível buscar", aguarde 5 a 10 minutos e clique em reenviar. O cache de validação do Googlebot pode demorar alguns instantes na primeira requisição.
              </div>
            </div>
          )}

          {activeStepTab === 5 && (
            <div className="space-y-3 font-mono text-xs text-[#141414]">
              <div className="flex items-center gap-2 text-sm font-black text-[#141414] uppercase">
                <span className="flex h-6 w-6 items-center justify-center bg-purple-600 text-white rounded-full text-xs">
                  5
                </span>
                Acelerar Indexação Imediata com "Inspeção de URL" (Dica de Ouro)
              </div>
              <p>
                Não espere dias pelo rastreamento passivo! Para páginas principais, lançamentos ou novidades:
              </p>
              <div className="bg-white p-3 border border-[#141414] space-y-2">
                <div className="flex items-center gap-2">
                  <span className="bg-purple-100 text-purple-900 px-1.5 py-0.5 text-[10px] font-black border border-purple-400">
                    AÇÃO PRIORITÁRIA
                  </span>
                  <span className="font-bold text-purple-900">Solicitar Indexação Prioritária</span>
                </div>
                <p className="text-[11px] text-neutral-700 leading-relaxed">
                  1. Cole a URL da sua home (ex: <code>{targetDomain}/</code>) na barra de busca superior do GSC (<em>"Inspecione qualquer URL em..."</em>).<br />
                  2. Aguarde a verificação em tempo real.<br />
                  3. Clique no botão <strong>"SOLICITAR INDEXAÇÃO"</strong> (Request Indexing).<br />
                  4. Isso coloca a URL na fila prioritária de rastreamento do Googlebot, indexando o conteúdo frequentemente em menos de 24 horas!
                </p>
              </div>
            </div>
          )}

          {activeStepTab === 6 && (
            <div className="space-y-3 font-mono text-xs text-[#141414]">
              <div className="flex items-center gap-2 text-sm font-black text-[#141414] uppercase">
                <span className="flex h-6 w-6 items-center justify-center bg-rose-600 text-white rounded-full text-xs">
                  6
                </span>
                Diagnóstico de Erros Comuns no Google Search Console
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div className="bg-white p-3 border border-[#141414]">
                  <strong className="text-rose-700 block mb-1">"Não foi possível buscar"</strong>
                  <p className="text-[11px] text-neutral-600">
                    Verifique se o arquivo sitemap.xml retorna HTTP 200 no navegador e se não há bloqueio de firewall (Cloudflare bot fight mode) contra o User-Agent Googlebot.
                  </p>
                </div>
                <div className="bg-white p-3 border border-[#141414]">
                  <strong className="text-rose-700 block mb-1">"O sitemap é HTML"</strong>
                  <p className="text-[11px] text-neutral-600">
                    O servidor está retornando sua página 404 em HTML ou sem o header <code>Content-Type: application/xml</code>. O sitemap gerado aqui resolve isso 100%.
                  </p>
                </div>
                <div className="bg-white p-3 border border-[#141414]">
                  <strong className="text-rose-700 block mb-1">"Rastreada, mas não indexada"</strong>
                  <p className="text-[11px] text-neutral-600">
                    Conteúdo muito raso ou duplicado. Enriqueça o texto, adicione tags semânticas (H1, H2, FAQ schema) e reenvie a inspeção de URL.
                  </p>
                </div>
                <div className="bg-white p-3 border border-[#141414]">
                  <strong className="text-rose-700 block mb-1">"URLs bloqueadas pelo robots.txt"</strong>
                  <p className="text-[11px] text-neutral-600">
                    Verifique se não há uma regra <code>Disallow: /</code> acidental no robots.txt da produção.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
