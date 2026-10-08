import React, { useState, useEffect, useMemo } from 'react';
import {
  Shield,
  Search,
  CheckCircle2,
  Zap,
  Share2,
  Terminal,
  Layers,
  ArrowLeftRight,
  Filter,
  CheckSquare,
  Sparkles,
  ArrowUp,
  Globe,
  SlidersHorizontal,
  FileCheck2,
  Activity,
  TrendingUp,
  Gauge,
  Code2,
  Lock,
  Eye,
  Cookie,
  Smartphone,
  Printer,
  Bell,
  Flame,
  Link2,
  Compass,
  AlignLeft,
  Leaf,
  Briefcase,
  FileCode,
  Server,
  Key,
  Bot,
  Workflow,
  Radio,
  GitMerge,
  ArrowRight,
  Target,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import {
  AuditReport,
  AuditCategory,
  SeverityLevel,
  SavedAuditSummary,
  AuditItem,
  NavigationTab,
} from './types';
import { Language, translations } from './i18n/translations';
import { Navbar } from './components/Navbar';
import { UrlInputSection } from './components/UrlInputSection';
import { AuditSummaryHero } from './components/AuditSummaryHero';
import { CategoryScoreCard } from './components/CategoryScoreCard';
import { AuditItemCard } from './components/AuditItemCard';
import { SocialPreview } from './components/SocialPreview';
import { HeadersInspector } from './components/HeadersInspector';
import { TechStackView } from './components/TechStackView';
import { SiteComparator } from './components/SiteComparator';
import { HistoricalTrendsChart } from './components/HistoricalTrendsChart';
import { ExportModal } from './components/ExportModal';
import { GitHubPagesModal } from './components/GitHubPagesModal';
import { AuditHistoryModal } from './components/AuditHistoryModal';
import { AIFixModal } from './components/AIFixModal';
import { ActionPlanDrawer } from './components/ActionPlanDrawer';
import { ActionPlanFloatingButton } from './components/ActionPlanFloatingButton';
import { SeverityDistributionBar } from './components/SeverityDistributionBar';
import { CoreWebVitalsView } from './components/CoreWebVitalsView';
import { ConfigGeneratorView } from './components/ConfigGeneratorView';
import { SslDnsSecurityView } from './components/SslDnsSecurityView';
import { AccessibilityWcagView } from './components/AccessibilityWcagView';
import { PrivacyComplianceView } from './components/PrivacyComplianceView';
import { MobileSimulatorView } from './components/MobileSimulatorView';
import { SeoHeatmapView } from './components/SeoHeatmapView';
import { BrokenLinksView } from './components/BrokenLinksView';
import { SitemapCrawlerView } from './components/SitemapCrawlerView';
import { PageRankSimulator } from './components/PageRankSimulator';
import { KeywordCannibalizationView } from './components/KeywordCannibalizationView';
import { ContentGapAnalysisView } from './components/ContentGapAnalysisView';
import { SerpSimulatorView } from './components/SerpSimulatorView';
import { ContentSemanticsView } from './components/ContentSemanticsView';
import { EcoAndScriptsView } from './components/EcoAndScriptsView';
import { CommercialProposalModal } from './components/CommercialProposalModal';
import { ScheduledMonitorModal } from './components/ScheduledMonitorModal';
import { WhiteLabelPdfModal } from './components/WhiteLabelPdfModal';
import { WebhookAlertModal } from './components/WebhookAlertModal';
import { SeoQuickStartModal } from './components/SeoQuickStartModal';
import { ReportSummaryPanel } from './components/ReportSummaryPanel';
import { analyzeWebsiteClient } from './services/clientAnalyzer';
import { JsMinerView } from './components/secscan/JsMinerView';
import { NiktoWebScannerView } from './components/secscan/NiktoWebScannerView';
import { DastFuzzerView } from './components/secscan/DastFuzzerView';
import { WafSuiteView } from './components/secscan/WafSuiteView';
import { SsrfValidatorView } from './components/secscan/SsrfValidatorView';
import { JwtTokenInspectorView } from './components/secscan/JwtTokenInspectorView';
import { ComplianceAuditView } from './components/secscan/ComplianceAuditView';
import { LlmSecurityView } from './components/secscan/LlmSecurityView';
import { ThreatModelingView } from './components/secscan/ThreatModelingView';
import { VisualSoarPlaybookView } from './components/secscan/VisualSoarPlaybookView';
import { CyberThreatIntelHubView } from './components/secscan/CyberThreatIntelHubView';
import { CommandPaletteModal } from './components/secscan/CommandPaletteModal';

const STORAGE_KEY = 'webaudit_history_v1';
const ACTION_PLAN_STORAGE_PREFIX = 'webaudit_actionplan_v1_';

export default function App() {
  const [currentReport, setCurrentReport] = useState<AuditReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<NavigationTab>('all');
  const [severityFilter, setSeverityFilter] = useState<SeverityLevel | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [completedFixIds, setCompletedFixIds] = useState<Record<string, boolean>>({});
  const [isQuickWinsOnly, setIsQuickWinsOnly] = useState<boolean>(false);

  // Internationalization language state
  const [language, setLanguage] = useState<Language>(() => {
    try {
      return (localStorage.getItem('webaudit_lang_v1') as Language) || 'pt';
    } catch {
      return 'pt';
    }
  });

  const handleToggleLanguage = () => {
    const next: Language = language === 'pt' ? 'en' : 'pt';
    setLanguage(next);
    try {
      localStorage.setItem('webaudit_lang_v1', next);
    } catch {
      // ignore
    }
  };

  const t = translations[language];

  // Modals & Panels
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isGitHubPagesOpen, setIsGitHubPagesOpen] = useState<boolean>(false);
  const [isActionPlanOpen, setIsActionPlanOpen] = useState<boolean>(false);
  const [isWhiteLabelOpen, setIsWhiteLabelOpen] = useState<boolean>(false);
  const [isWebhooksOpen, setIsWebhooksOpen] = useState<boolean>(false);
  const [isSeoChecklistOpen, setIsSeoChecklistOpen] = useState<boolean>(false);
  const [isProposalOpen, setIsProposalOpen] = useState<boolean>(false);
  const [isMonitorOpen, setIsMonitorOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [selectedAiFixItem, setSelectedAiFixItem] = useState<AuditItem | null>(null);

  // Keyboard shortcut listener for Cmd+K / Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Saved Audits History
  const [savedAudits, setSavedAudits] = useState<SavedAuditSummary[]>([]);
  const [isBackendActive, setIsBackendActive] = useState<boolean>(true);

  // Load history from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSavedAudits(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  // Sync Action Plan progress for current report from localStorage
  useEffect(() => {
    if (!currentReport?.targetUrl) {
      setCompletedFixIds({});
      return;
    }
    try {
      const key = `${ACTION_PLAN_STORAGE_PREFIX}${currentReport.targetUrl}`;
      const saved = localStorage.getItem(key);
      if (saved) {
        setCompletedFixIds(JSON.parse(saved));
      } else {
        setCompletedFixIds({});
      }
    } catch {
      setCompletedFixIds({});
    }
  }, [currentReport?.targetUrl]);

  const saveReportToHistory = (report: AuditReport) => {
    const summary: SavedAuditSummary = {
      id: report.id,
      targetUrl: report.targetUrl,
      analyzedAt: report.analyzedAt,
      overallScore: report.overallScore,
      overallGrade: report.overallGrade,
      securityScore: report.categories.security.score,
      seoScore: report.categories.seo.score,
      bestPracticesScore: report.categories.best_practices.score,
      perfScore: report.categories.performance_accessibility.score,
    };

    setSavedAudits((prev) => {
      // Keep multiple historical runs per URL so time-series trends can be visualized
      const filtered = prev.filter((item) => item.id !== report.id);
      const updated = [summary, ...filtered].slice(0, 50);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const handleClearHistory = () => {
    setSavedAudits([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const handleAnalyze = async (urlToAnalyze: string) => {
    setIsLoading(true);
    setError(null);

    try {
      let report: AuditReport;

      // Try server API first
      try {
        const response = await fetch('/api/analyze', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: urlToAnalyze }),
        });

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(errData.error || `HTTP ${response.status}`);
        }

        report = await response.json();
        setIsBackendActive(true);
      } catch (backendErr: any) {
        // If running in static GitHub Pages or server endpoint unavailable, run client-side analyzer
        console.warn('Backend API unavailable, falling back to client-side analyzer:', backendErr);
        setIsBackendActive(false);
        report = await analyzeWebsiteClient(urlToAnalyze);
      }

      setCurrentReport(report);
      saveReportToHistory(report);
      setActiveTab('all');
      setSeverityFilter('all');
      setSearchTerm('');
    } catch (err: any) {
      console.error('Analysis failed:', err);
      setError(err.message || 'An error occurred while auditing the website. Please verify the URL.');
    } finally {
      setIsLoading(false);
    }
  };

  const saveCompletedFixes = (updated: Record<string, boolean>) => {
    setCompletedFixIds(updated);
    if (currentReport?.targetUrl) {
      try {
        localStorage.setItem(
          `${ACTION_PLAN_STORAGE_PREFIX}${currentReport.targetUrl}`,
          JSON.stringify(updated)
        );
      } catch {
        // ignore
      }
    }
  };

  const toggleFixCompleted = (id: string) => {
    const updated = {
      ...completedFixIds,
      [id]: !completedFixIds[id],
    };
    saveCompletedFixes(updated);
  };

  const batchSetCompleted = (ids: string[], completed: boolean) => {
    const updated = { ...completedFixIds };
    ids.forEach((id) => {
      updated[id] = completed;
    });
    saveCompletedFixes(updated);
  };

  // Locate an item from the Action Plan directly into the main view
  const handleLocateItem = (item: AuditItem) => {
    setActiveTab(item.category);
    setSeverityFilter('all');
    setSearchTerm(item.title);
    setTimeout(() => {
      const containerEl = document.getElementById('audit-items-container');
      if (containerEl) {
        containerEl.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  // Calculate pending action items count for badges
  const pendingActionCount = useMemo(() => {
    if (!currentReport) return 0;
    return currentReport.items.filter(
      (item) =>
        (item.severity === 'critical' || item.severity === 'warning') &&
        !completedFixIds[item.id]
    ).length;
  }, [currentReport, completedFixIds]);

  // Filter items
  const filteredItems = currentReport?.items.filter((item) => {
    // Category filter
    if (
      activeTab !== 'all' &&
      activeTab !== 'heatmap' &&
      activeTab !== 'serp-simulator' &&
      activeTab !== 'content-semantics' &&
      activeTab !== 'broken-links' &&
      activeTab !== 'sitemap' &&
      activeTab !== 'eco-scripts' &&
      activeTab !== 'headers' &&
      activeTab !== 'social' &&
      activeTab !== 'tech' &&
      activeTab !== 'comparator' &&
      activeTab !== 'trends' &&
      activeTab !== 'vitals' &&
      activeTab !== 'config-gen' &&
      activeTab !== 'ssl-dns' &&
      activeTab !== 'accessibility' &&
      activeTab !== 'privacy' &&
      activeTab !== 'mobile'
    ) {
      if (item.category !== activeTab) return false;
    }
    // Severity filter
    if (severityFilter !== 'all' && item.severity !== severityFilter) return false;

    // Quick wins filter (High impact, ready code snippet or direct fix)
    if (isQuickWinsOnly) {
      const isHighImpact = item.severity === 'critical' || item.severity === 'warning';
      const isQuickFix =
        !!item.codeSnippet ||
        ['seo-title', 'seo-viewport', 'seo-h1', 'seo-images-alt', 'sec-hsts', 'sec-x-frame', 'sec-x-content-type', 'bp-viewport', 'bp-compression', 'bp-charset', 'perf-gzip', 'perf-minify'].includes(item.id);
      if (!isHighImpact || !isQuickFix) return false;
    }
    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        item.title.toLowerCase().includes(term) ||
        item.summary.toLowerCase().includes(term) ||
        (item.impact && item.impact.toLowerCase().includes(term)) ||
        (item.codeSnippet && item.codeSnippet.code.toLowerCase().includes(term))
      );
    }
    return true;
  }) || [];

  const criticalCount = currentReport?.items.filter((i) => i.severity === 'critical').length || 0;
  const warningCount = currentReport?.items.filter((i) => i.severity === 'warning').length || 0;
  const goodCount = currentReport?.items.filter((i) => i.severity === 'good').length || 0;

  // Active category scope for distribution bar and pills
  const scopeItems = useMemo(() => {
    if (!currentReport) return [];
    if (activeTab === 'all') return currentReport.items;
    return currentReport.items.filter((i) => i.category === activeTab);
  }, [currentReport, activeTab]);

  const scopeCriticalCount = useMemo(() => scopeItems.filter((i) => i.severity === 'critical').length, [scopeItems]);
  const scopeWarningCount = useMemo(() => scopeItems.filter((i) => i.severity === 'warning').length, [scopeItems]);
  const scopeGoodCount = useMemo(() => scopeItems.filter((i) => i.severity === 'good').length, [scopeItems]);

  const categoryLabel = useMemo(() => {
    switch (activeTab) {
      case 'security': return 'SECURITY';
      case 'seo': return 'SEO';
      case 'best_practices': return 'BEST PRACTICES';
      case 'performance_accessibility': return 'PERFORMANCE & ACCESSIBILITY';
      default: return undefined;
    }
  }, [activeTab]);

  // Find the immediately preceding audit for current URL to compute Score Evolution
  const previousAudit = useMemo(() => {
    if (!currentReport) return null;
    const currentUrlNorm = currentReport.targetUrl.trim().toLowerCase();

    const matching = savedAudits.filter((audit) => {
      // Exclude the current report instance
      if (audit.id === currentReport.id) return false;
      const urlNorm = audit.targetUrl.trim().toLowerCase();
      const isSameUrl =
        urlNorm === currentUrlNorm ||
        urlNorm.replace(/\/$/, '') === currentUrlNorm.replace(/\/$/, '');
      if (!isSameUrl) return false;

      // Must be an older or equal timestamp
      const auditTime = new Date(audit.analyzedAt).getTime();
      const currentTime = new Date(currentReport.analyzedAt).getTime();
      return isNaN(auditTime) || isNaN(currentTime) ? true : auditTime <= currentTime;
    });

    if (matching.length === 0) return null;

    // Sort descending by analyzedAt to get the latest prior audit
    matching.sort(
      (a, b) => new Date(b.analyzedAt).getTime() - new Date(a.analyzedAt).getTime()
    );

    return matching[0] || null;
  }, [currentReport, savedAudits]);

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] flex flex-col selection:bg-[#141414] selection:text-[#E4E3E0] font-mono">
      {/* Navigation Header */}
      <Navbar
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenGitHubPages={() => setIsGitHubPagesOpen(true)}
        onOpenActionPlan={() => setIsActionPlanOpen(true)}
        onOpenWhiteLabelPdf={() => setIsWhiteLabelOpen(true)}
        onOpenWebhooks={() => setIsWebhooksOpen(true)}
        onOpenSeoChecklist={() => setIsSeoChecklistOpen(true)}
        onOpenProposal={() => setIsProposalOpen(true)}
        onOpenMonitor={() => setIsMonitorOpen(true)}
        pendingActionCount={pendingActionCount}
        onNewAudit={() => {
          setCurrentReport(null);
          setError(null);
        }}
        hasReport={!!currentReport}
        isBackendActive={isBackendActive}
        historyCount={savedAudits.length}
        language={language}
        onToggleLanguage={handleToggleLanguage}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* If no report yet, show Hero search or direct standalone tool */}
        {!currentReport && activeTab !== 'all' && (
          <div className="space-y-4">
            <button
              onClick={() => setActiveTab('all')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-[#141414] text-xs font-black uppercase shadow-[2px_2px_0px_#141414] hover:bg-[#141414] hover:text-white transition-all cursor-pointer"
            >
              ← Voltar à Análise Geral de Website
            </button>

            {activeTab === 'js-miner' && (
              <JsMinerView onRunAIFix={(item) => setSelectedAiFixItem(item)} />
            )}
            {activeTab === 'nikto' && (
              <NiktoWebScannerView onRunAIFix={(item) => setSelectedAiFixItem(item)} />
            )}
            {activeTab === 'dast' && (
              <DastFuzzerView onRunAIFix={(item) => setSelectedAiFixItem(item)} />
            )}
            {activeTab === 'waf' && (
              <WafSuiteView onRunAIFix={(item) => setSelectedAiFixItem(item)} />
            )}
            {activeTab === 'ssrf' && (
              <SsrfValidatorView />
            )}
            {activeTab === 'jwt' && (
              <JwtTokenInspectorView />
            )}
            {activeTab === 'compliance' && (
              <ComplianceAuditView />
            )}
            {activeTab === 'llm-sec' && (
              <LlmSecurityView />
            )}
            {activeTab === 'stride' && (
              <ThreatModelingView />
            )}
            {activeTab === 'soar' && (
              <VisualSoarPlaybookView />
            )}
            {activeTab === 'threat-intel' && (
              <CyberThreatIntelHubView />
            )}
          </div>
        )}

        {!currentReport && activeTab === 'all' && (
          <div className="space-y-6">
            <UrlInputSection
              onAnalyze={handleAnalyze}
              isLoading={isLoading}
              error={error}
            />

            {/* SecScan Pro Quick Toolkit Launch Bar */}
            <div className="border-2 border-[#141414] bg-white p-5 shadow-[4px_4px_0px_#141414] space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b-2 border-[#141414] pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1 bg-[#141414] text-white">
                    <Shield className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="font-mono font-black text-sm uppercase tracking-tight text-[#141414]">
                      SecScan DevSecOps & Hardcore Pentest Suite
                    </h3>
                    <p className="text-[11px] text-[#141414]/70">
                      Módulos independentes e ativos de auditoria de segurança cibernética
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsCommandPaletteOpen(true)}
                  className="px-2.5 py-1 text-xs font-mono font-bold border border-[#141414] bg-indigo-50 hover:bg-indigo-100 text-indigo-900 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Terminal className="h-3.5 w-3.5" />
                  <span>Paleta de Ferramentas (⌘K)</span>
                </button>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                {[
                  { tab: 'js-miner' as NavigationTab, name: 'JS MINER', icon: FileCode, desc: 'Segredos & Buckets', color: 'hover:bg-indigo-50 border-indigo-300' },
                  { tab: 'nikto' as NavigationTab, name: 'NIKTO SCANNER', icon: Server, desc: 'Pastas & Métodos', color: 'hover:bg-rose-50 border-rose-300' },
                  { tab: 'dast' as NavigationTab, name: 'DAST FUZZER', icon: Flame, desc: 'XSS, SQLi & LFI', color: 'hover:bg-amber-50 border-amber-300' },
                  { tab: 'waf' as NavigationTab, name: 'WAF SUITE', icon: Shield, desc: 'Detecção de Firewall', color: 'hover:bg-blue-50 border-blue-300' },
                  { tab: 'ssrf' as NavigationTab, name: 'SSRF DEFENSE', icon: Globe, desc: 'Metadata & Loopback', color: 'hover:bg-purple-50 border-purple-300' },
                  { tab: 'jwt' as NavigationTab, name: 'JWT INSPECTOR', icon: Key, desc: 'Decode & Alg None', color: 'hover:bg-teal-50 border-teal-300' },
                  { tab: 'compliance' as NavigationTab, name: 'COMPLIANCE', icon: FileCheck2, desc: 'LGPD, ISO & PCI', color: 'hover:bg-emerald-50 border-emerald-300' },
                  { tab: 'llm-sec' as NavigationTab, name: 'LLM SECURITY', icon: Bot, desc: 'OWASP Top 10 AI', color: 'hover:bg-violet-50 border-violet-300' },
                  { tab: 'stride' as NavigationTab, name: 'STRIDE MODEL', icon: Layers, desc: 'Threat Modeling', color: 'hover:bg-red-50 border-red-300' },
                  { tab: 'soar' as NavigationTab, name: 'SOAR PLAYBOOKS', icon: Workflow, desc: 'Resposta a Incidentes', color: 'hover:bg-sky-50 border-sky-300' },
                  { tab: 'threat-intel' as NavigationTab, name: 'THREAT INTEL', icon: Radio, desc: 'CISA KEV & CVEs', color: 'hover:bg-rose-50 border-rose-300' },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.tab}
                      onClick={() => setActiveTab(item.tab)}
                      className={`text-left p-2.5 border-2 border-[#141414] bg-white transition-all cursor-pointer shadow-[2px_2px_0px_#141414] hover:translate-x-[1px] hover:translate-y-[1px] ${item.color}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Icon className="h-4 w-4" />
                        <span className="text-[9px] font-bold uppercase opacity-60">ABRIR</span>
                      </div>
                      <div className="font-mono font-bold text-xs truncate text-[#141414]">{item.name}</div>
                      <div className="text-[10px] text-[#141414]/70 truncate">{item.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* If report is ready, show comprehensive dashboard */}
        {currentReport && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Hero Report Summary */}
            <AuditSummaryHero
              report={currentReport}
              onReAnalyze={() => handleAnalyze(currentReport.targetUrl)}
              onExport={() => setIsExportOpen(true)}
              onOpenActionPlan={() => setIsActionPlanOpen(true)}
              onOpenSeoChecklist={() => setIsSeoChecklistOpen(true)}
              pendingActionCount={pendingActionCount}
              previousAudit={previousAudit}
              onViewTrends={() => setActiveTab('trends')}
            />

            {/* 4 Core Pillars Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <CategoryScoreCard
                categoryKey="security"
                scoreData={currentReport.categories.security}
                isSelected={activeTab === 'security'}
                onSelect={() => setActiveTab('security')}
                previousScore={previousAudit?.securityScore}
              />
              <CategoryScoreCard
                categoryKey="seo"
                scoreData={currentReport.categories.seo}
                isSelected={activeTab === 'seo'}
                onSelect={() => setActiveTab('seo')}
                previousScore={previousAudit?.seoScore}
              />
              <CategoryScoreCard
                categoryKey="best_practices"
                scoreData={currentReport.categories.best_practices}
                isSelected={activeTab === 'best_practices'}
                onSelect={() => setActiveTab('best_practices')}
                previousScore={previousAudit?.bestPracticesScore}
              />
              <CategoryScoreCard
                categoryKey="performance_accessibility"
                scoreData={currentReport.categories.performance_accessibility}
                isSelected={activeTab === 'performance_accessibility'}
                onSelect={() => setActiveTab('performance_accessibility')}
                previousScore={previousAudit?.perfScore}
              />
            </div>

            {/* AI Executive Summary Panel */}
            <ReportSummaryPanel
              report={currentReport}
              onOpenAiFix={(item) => setSelectedAiFixItem(item)}
              onOpenActionPlan={() => setIsActionPlanOpen(true)}
            />

            {/* Navigation Tabs Bar */}
            <div className="border-b-2 border-[#141414] pb-2">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <button
                  type="button"
                  id="tab-all"
                  onClick={() => setActiveTab('all')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase transition-all cursor-pointer border-2 border-[#141414] ${
                    activeTab === 'all'
                      ? 'bg-[#141414] text-white shadow-[2px_2px_0px_#888888]'
                      : 'bg-white text-[#141414] hover:bg-[#E4E3E0]'
                  }`}
                >
                  <FileCheck2 className="h-3.5 w-3.5" />
                  <span>ALL ITEMS ({currentReport.items.length})</span>
                </button>

                <button
                  type="button"
                  id="tab-security"
                  onClick={() => setActiveTab('security')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase transition-all cursor-pointer border-2 border-[#141414] ${
                    activeTab === 'security'
                      ? 'bg-[#141414] text-white shadow-[2px_2px_0px_#888888]'
                      : 'bg-white text-[#141414] hover:bg-[#E4E3E0]'
                  }`}
                >
                  <Shield className="h-3.5 w-3.5 text-emerald-600" />
                  <span>SECURITY</span>
                </button>

                <button
                  type="button"
                  id="tab-seo"
                  onClick={() => setActiveTab('seo')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase transition-all cursor-pointer border-2 border-[#141414] ${
                    activeTab === 'seo'
                      ? 'bg-[#141414] text-white shadow-[2px_2px_0px_#888888]'
                      : 'bg-white text-[#141414] hover:bg-[#E4E3E0]'
                  }`}
                >
                  <Search className="h-3.5 w-3.5 text-blue-600" />
                  <span>SEO & INDEXING</span>
                </button>

                {/* Feature: SEO Heatmap */}
                <button
                  type="button"
                  id="tab-heatmap"
                  onClick={() => setActiveTab('heatmap')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase transition-all cursor-pointer border-2 border-[#141414] ${
                    activeTab === 'heatmap'
                      ? 'bg-[#141414] text-white shadow-[2px_2px_0px_#888888]'
                      : 'bg-white text-[#141414] hover:bg-[#E4E3E0]'
                  }`}
                >
                  <Flame className="h-3.5 w-3.5 text-amber-500" />
                  <span>{t.tabs.heatmap}</span>
                </button>

                {/* Feature: Google SERP Simulator */}
                <button
                  type="button"
                  id="tab-serp-sim"
                  onClick={() => setActiveTab('serp-simulator')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase transition-all cursor-pointer border-2 border-[#141414] ${
                    activeTab === 'serp-simulator'
                      ? 'bg-[#141414] text-white shadow-[2px_2px_0px_#888888]'
                      : 'bg-white text-[#141414] hover:bg-[#E4E3E0]'
                  }`}
                >
                  <Search className="h-3.5 w-3.5 text-blue-500" />
                  <span>{t.tabs.serpSimulator}</span>
                </button>

                {/* Feature: Content Semantics & TF-IDF */}
                <button
                  type="button"
                  id="tab-content-semantics"
                  onClick={() => setActiveTab('content-semantics')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase transition-all cursor-pointer border-2 border-[#141414] ${
                    activeTab === 'content-semantics'
                      ? 'bg-[#141414] text-white shadow-[2px_2px_0px_#888888]'
                      : 'bg-white text-[#141414] hover:bg-[#E4E3E0]'
                  }`}
                >
                  <AlignLeft className="h-3.5 w-3.5 text-purple-500" />
                  <span>{t.tabs.contentSemantics}</span>
                </button>

                {/* Feature: Broken Links Checker */}
                <button
                  type="button"
                  id="tab-broken-links"
                  onClick={() => setActiveTab('broken-links')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase transition-all cursor-pointer border-2 border-[#141414] ${
                    activeTab === 'broken-links'
                      ? 'bg-[#141414] text-white shadow-[2px_2px_0px_#888888]'
                      : 'bg-white text-[#141414] hover:bg-[#E4E3E0]'
                  }`}
                >
                  <Link2 className="h-3.5 w-3.5 text-amber-500" />
                  <span>{t.tabs.brokenLinks}</span>
                </button>

                {/* Feature: Multi-Page Sitemap Crawler */}
                <button
                  type="button"
                  id="tab-sitemap"
                  onClick={() => setActiveTab('sitemap')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase transition-all cursor-pointer border-2 border-[#141414] ${
                    activeTab === 'sitemap'
                      ? 'bg-[#141414] text-white shadow-[2px_2px_0px_#888888]'
                      : 'bg-white text-[#141414] hover:bg-[#E4E3E0]'
                  }`}
                >
                  <Compass className="h-3.5 w-3.5 text-emerald-500" />
                  <span>{t.tabs.sitemapCrawler}</span>
                </button>

                {/* Feature: Keyword Cannibalization & Canonical Audit */}
                <button
                  type="button"
                  id="tab-cannibalization"
                  onClick={() => setActiveTab('cannibalization')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase transition-all cursor-pointer border-2 border-[#141414] ${
                    activeTab === 'cannibalization'
                      ? 'bg-[#141414] text-white shadow-[2px_2px_0px_#888888]'
                      : 'bg-white text-[#141414] hover:bg-[#E4E3E0]'
                  }`}
                >
                  <GitMerge className="h-3.5 w-3.5 text-amber-500" />
                  <span>{t.tabs.cannibalization}</span>
                </button>

                {/* Feature: Eco-Index & 3rd-Party Scripts */}
                <button
                  type="button"
                  id="tab-eco-scripts"
                  onClick={() => setActiveTab('eco-scripts')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase transition-all cursor-pointer border-2 border-[#141414] ${
                    activeTab === 'eco-scripts'
                      ? 'bg-[#141414] text-white shadow-[2px_2px_0px_#888888]'
                      : 'bg-white text-[#141414] hover:bg-[#E4E3E0]'
                  }`}
                >
                  <Leaf className="h-3.5 w-3.5 text-teal-600" />
                  <span>{t.tabs.ecoScripts}</span>
                </button>

                <button
                  type="button"
                  id="tab-best-practices"
                  onClick={() => setActiveTab('best_practices')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase transition-all cursor-pointer border-2 border-[#141414] ${
                    activeTab === 'best_practices'
                      ? 'bg-[#141414] text-white shadow-[2px_2px_0px_#888888]'
                      : 'bg-white text-[#141414] hover:bg-[#E4E3E0]'
                  }`}
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-purple-600" />
                  <span>BEST PRACTICES</span>
                </button>

                <button
                  type="button"
                  id="tab-perf"
                  onClick={() => setActiveTab('performance_accessibility')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase transition-all cursor-pointer border-2 border-[#141414] ${
                    activeTab === 'performance_accessibility'
                      ? 'bg-[#141414] text-white shadow-[2px_2px_0px_#888888]'
                      : 'bg-white text-[#141414] hover:bg-[#E4E3E0]'
                  }`}
                >
                  <Zap className="h-3.5 w-3.5 text-amber-600" />
                  <span>PERFORMANCE</span>
                </button>

                {/* Feature 1: Core Web Vitals */}
                <button
                  type="button"
                  id="tab-vitals"
                  onClick={() => setActiveTab('vitals')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase transition-all cursor-pointer border-2 border-[#141414] ${
                    activeTab === 'vitals'
                      ? 'bg-[#141414] text-white shadow-[2px_2px_0px_#888888]'
                      : 'bg-white text-[#141414] hover:bg-[#E4E3E0]'
                  }`}
                >
                  <Gauge className="h-3.5 w-3.5 text-amber-500" />
                  <span>CORE WEB VITALS</span>
                </button>

                {/* Feature 2: 1-Click Config Generator */}
                <button
                  type="button"
                  id="tab-config-gen"
                  onClick={() => setActiveTab('config-gen')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase transition-all cursor-pointer border-2 border-[#141414] ${
                    activeTab === 'config-gen'
                      ? 'bg-[#141414] text-white shadow-[2px_2px_0px_#888888]'
                      : 'bg-white text-[#141414] hover:bg-[#E4E3E0]'
                  }`}
                >
                  <Code2 className="h-3.5 w-3.5 text-emerald-600" />
                  <span>CONFIG GENERATOR</span>
                </button>

                {/* Feature 3: SSL, DNS & Email Security */}
                <button
                  type="button"
                  id="tab-ssl-dns"
                  onClick={() => setActiveTab('ssl-dns')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase transition-all cursor-pointer border-2 border-[#141414] ${
                    activeTab === 'ssl-dns'
                      ? 'bg-[#141414] text-white shadow-[2px_2px_0px_#888888]'
                      : 'bg-white text-[#141414] hover:bg-[#E4E3E0]'
                  }`}
                >
                  <Lock className="h-3.5 w-3.5 text-blue-600" />
                  <span>SSL & DNS / EMAIL</span>
                </button>

                {/* Feature 4: WCAG 2.1 Accessibility */}
                <button
                  type="button"
                  id="tab-accessibility"
                  onClick={() => setActiveTab('accessibility')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase transition-all cursor-pointer border-2 border-[#141414] ${
                    activeTab === 'accessibility'
                      ? 'bg-[#141414] text-white shadow-[2px_2px_0px_#888888]'
                      : 'bg-white text-[#141414] hover:bg-[#E4E3E0]'
                  }`}
                >
                  <Eye className="h-3.5 w-3.5 text-purple-600" />
                  <span>WCAG ACCESSIBILITY</span>
                </button>

                {/* Feature 5: Privacy & Compliance */}
                <button
                  type="button"
                  id="tab-privacy"
                  onClick={() => setActiveTab('privacy')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase transition-all cursor-pointer border-2 border-[#141414] ${
                    activeTab === 'privacy'
                      ? 'bg-[#141414] text-white shadow-[2px_2px_0px_#888888]'
                      : 'bg-white text-[#141414] hover:bg-[#E4E3E0]'
                  }`}
                >
                  <Cookie className="h-3.5 w-3.5 text-cyan-600" />
                  <span>PRIVACY & COMPLIANCE</span>
                </button>

                {/* Feature 6: Mobile Simulator */}
                <button
                  type="button"
                  id="tab-mobile"
                  onClick={() => setActiveTab('mobile')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase transition-all cursor-pointer border-2 border-[#141414] ${
                    activeTab === 'mobile'
                      ? 'bg-[#141414] text-white shadow-[2px_2px_0px_#888888]'
                      : 'bg-white text-[#141414] hover:bg-[#E4E3E0]'
                  }`}
                >
                  <Smartphone className="h-3.5 w-3.5 text-indigo-600" />
                  <span>MOBILE SIMULATOR</span>
                </button>

                <button
                  type="button"
                  id="tab-social"
                  onClick={() => setActiveTab('social')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase transition-all cursor-pointer border-2 border-[#141414] ${
                    activeTab === 'social'
                      ? 'bg-[#141414] text-white shadow-[2px_2px_0px_#888888]'
                      : 'bg-white text-[#141414] hover:bg-[#E4E3E0]'
                  }`}
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>SOCIAL & SERP</span>
                </button>

                <button
                  type="button"
                  id="tab-headers"
                  onClick={() => setActiveTab('headers')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase transition-all cursor-pointer border-2 border-[#141414] ${
                    activeTab === 'headers'
                      ? 'bg-[#141414] text-white shadow-[2px_2px_0px_#888888]'
                      : 'bg-white text-[#141414] hover:bg-[#E4E3E0]'
                  }`}
                >
                  <Terminal className="h-3.5 w-3.5" />
                  <span>HTTP HEADERS</span>
                </button>

                <button
                  type="button"
                  id="tab-tech"
                  onClick={() => setActiveTab('tech')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase transition-all cursor-pointer border-2 border-[#141414] ${
                    activeTab === 'tech'
                      ? 'bg-[#141414] text-white shadow-[2px_2px_0px_#888888]'
                      : 'bg-white text-[#141414] hover:bg-[#E4E3E0]'
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>TECH STACK</span>
                </button>

                <button
                  type="button"
                  id="tab-comparator"
                  onClick={() => setActiveTab('comparator')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase transition-all cursor-pointer border-2 border-[#141414] ${
                    activeTab === 'comparator'
                      ? 'bg-[#141414] text-white shadow-[2px_2px_0px_#888888]'
                      : 'bg-white text-[#141414] hover:bg-[#E4E3E0]'
                  }`}
                >
                  <ArrowLeftRight className="h-3.5 w-3.5" />
                  <span>SITE COMPARATOR</span>
                </button>

                <button
                  type="button"
                  id="tab-trends"
                  onClick={() => setActiveTab('trends')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase transition-all cursor-pointer border-2 border-[#141414] ${
                    activeTab === 'trends'
                      ? 'bg-[#141414] text-white shadow-[2px_2px_0px_#888888]'
                      : 'bg-white text-[#141414] hover:bg-[#E4E3E0]'
                  }`}
                >
                  <Activity className="h-3.5 w-3.5 text-emerald-600" />
                  <span>TRENDS & HISTORY</span>
                </button>

                {/* SECSCAN SUITE DIVIDER */}
                <div className="h-6 w-0.5 bg-[#141414] mx-1 self-center" />

                {/* SecScan: JS Miner */}
                <button
                  type="button"
                  id="tab-js-miner"
                  onClick={() => setActiveTab('js-miner')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase transition-all cursor-pointer border-2 border-[#141414] ${
                    activeTab === 'js-miner'
                      ? 'bg-indigo-600 text-white shadow-[2px_2px_0px_#141414]'
                      : 'bg-indigo-50 text-indigo-900 hover:bg-indigo-100'
                  }`}
                >
                  <FileCode className="h-3.5 w-3.5" />
                  <span>{t.tabs.jsMiner}</span>
                </button>

                {/* SecScan: Nikto Scanner */}
                <button
                  type="button"
                  id="tab-nikto"
                  onClick={() => setActiveTab('nikto')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase transition-all cursor-pointer border-2 border-[#141414] ${
                    activeTab === 'nikto'
                      ? 'bg-rose-600 text-white shadow-[2px_2px_0px_#141414]'
                      : 'bg-rose-50 text-rose-900 hover:bg-rose-100'
                  }`}
                >
                  <Server className="h-3.5 w-3.5" />
                  <span>{t.tabs.nikto}</span>
                </button>

                {/* SecScan: DAST Fuzzer */}
                <button
                  type="button"
                  id="tab-dast"
                  onClick={() => setActiveTab('dast')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase transition-all cursor-pointer border-2 border-[#141414] ${
                    activeTab === 'dast'
                      ? 'bg-amber-600 text-white shadow-[2px_2px_0px_#141414]'
                      : 'bg-amber-50 text-amber-900 hover:bg-amber-100'
                  }`}
                >
                  <Flame className="h-3.5 w-3.5" />
                  <span>{t.tabs.dast}</span>
                </button>

                {/* SecScan: WAF Suite */}
                <button
                  type="button"
                  id="tab-waf"
                  onClick={() => setActiveTab('waf')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase transition-all cursor-pointer border-2 border-[#141414] ${
                    activeTab === 'waf'
                      ? 'bg-blue-600 text-white shadow-[2px_2px_0px_#141414]'
                      : 'bg-blue-50 text-blue-900 hover:bg-blue-100'
                  }`}
                >
                  <Shield className="h-3.5 w-3.5" />
                  <span>{t.tabs.waf}</span>
                </button>

                {/* SecScan: SSRF Validator */}
                <button
                  type="button"
                  id="tab-ssrf"
                  onClick={() => setActiveTab('ssrf')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase transition-all cursor-pointer border-2 border-[#141414] ${
                    activeTab === 'ssrf'
                      ? 'bg-purple-600 text-white shadow-[2px_2px_0px_#141414]'
                      : 'bg-purple-50 text-purple-900 hover:bg-purple-100'
                  }`}
                >
                  <Globe className="h-3.5 w-3.5" />
                  <span>{t.tabs.ssrf}</span>
                </button>

                {/* SecScan: JWT Inspector */}
                <button
                  type="button"
                  id="tab-jwt"
                  onClick={() => setActiveTab('jwt')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase transition-all cursor-pointer border-2 border-[#141414] ${
                    activeTab === 'jwt'
                      ? 'bg-teal-600 text-white shadow-[2px_2px_0px_#141414]'
                      : 'bg-teal-50 text-teal-900 hover:bg-teal-100'
                  }`}
                >
                  <Key className="h-3.5 w-3.5" />
                  <span>{t.tabs.jwt}</span>
                </button>

                {/* SecScan: Compliance Hub */}
                <button
                  type="button"
                  id="tab-compliance"
                  onClick={() => setActiveTab('compliance')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase transition-all cursor-pointer border-2 border-[#141414] ${
                    activeTab === 'compliance'
                      ? 'bg-emerald-600 text-white shadow-[2px_2px_0px_#141414]'
                      : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100'
                  }`}
                >
                  <FileCheck2 className="h-3.5 w-3.5" />
                  <span>{t.tabs.compliance}</span>
                </button>

                {/* SecScan: LLM Security */}
                <button
                  type="button"
                  id="tab-llm-sec"
                  onClick={() => setActiveTab('llm-sec')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase transition-all cursor-pointer border-2 border-[#141414] ${
                    activeTab === 'llm-sec'
                      ? 'bg-violet-600 text-white shadow-[2px_2px_0px_#141414]'
                      : 'bg-violet-50 text-violet-900 hover:bg-violet-100'
                  }`}
                >
                  <Bot className="h-3.5 w-3.5" />
                  <span>{t.tabs.llmSec}</span>
                </button>

                {/* SecScan: STRIDE Threat Model */}
                <button
                  type="button"
                  id="tab-stride"
                  onClick={() => setActiveTab('stride')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase transition-all cursor-pointer border-2 border-[#141414] ${
                    activeTab === 'stride'
                      ? 'bg-rose-700 text-white shadow-[2px_2px_0px_#141414]'
                      : 'bg-rose-50 text-rose-950 hover:bg-rose-100'
                  }`}
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>{t.tabs.stride}</span>
                </button>

                {/* SecScan: SOAR Playbooks */}
                <button
                  type="button"
                  id="tab-soar"
                  onClick={() => setActiveTab('soar')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase transition-all cursor-pointer border-2 border-[#141414] ${
                    activeTab === 'soar'
                      ? 'bg-sky-600 text-white shadow-[2px_2px_0px_#141414]'
                      : 'bg-sky-50 text-sky-900 hover:bg-sky-100'
                  }`}
                >
                  <Workflow className="h-3.5 w-3.5" />
                  <span>{t.tabs.soar}</span>
                </button>

                {/* SecScan: Threat Intel & KEV */}
                <button
                  type="button"
                  id="tab-threat-intel"
                  onClick={() => setActiveTab('threat-intel')}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-black uppercase transition-all cursor-pointer border-2 border-[#141414] ${
                    activeTab === 'threat-intel'
                      ? 'bg-red-600 text-white shadow-[2px_2px_0px_#141414]'
                      : 'bg-red-50 text-red-900 hover:bg-red-100'
                  }`}
                >
                  <Radio className="h-3.5 w-3.5" />
                  <span>{t.tabs.threatIntel}</span>
                </button>
              </div>
            </div>

            {/* Tab Specific Views */}
            {activeTab === 'trends' && (
              <HistoricalTrendsChart
                savedAudits={savedAudits}
                currentUrl={currentReport.targetUrl}
                onSelectAudit={(id) => {
                  const item = savedAudits.find((a) => a.id === id);
                  if (item) handleAnalyze(item.targetUrl);
                }}
                onReaudit={(url) => handleAnalyze(url)}
              />
            )}

            {activeTab === 'social' && (
              <SocialPreview
                meta={currentReport.rawData.metaTags}
                url={currentReport.targetUrl}
                socialFootprint={currentReport.rawData.socialFootprint}
              />
            )}

            {activeTab === 'headers' && (
              <HeadersInspector
                securityHeaders={currentReport.rawData.securityHeaders}
                allHeaders={currentReport.rawData.allHeaders}
                statusCode={currentReport.rawData.statusCode}
                statusText={currentReport.rawData.statusText}
                responseTimeMs={currentReport.rawData.responseTimeMs}
                tlsVersion={currentReport.rawData.tlsVersion}
              />
            )}

            {activeTab === 'tech' && (
              <TechStackView
                techStack={currentReport.rawData.techStack}
                serverHeader={currentReport.rawData.serverHeader}
              />
            )}

            {activeTab === 'comparator' && (
              <SiteComparator
                currentReport={currentReport}
                savedAudits={savedAudits}
                onLoadAudit={(id) => {
                  const item = savedAudits.find((a) => a.id === id);
                  if (item) handleAnalyze(item.targetUrl);
                }}
                onCompareWithUrl={(url) => handleAnalyze(url)}
              />
            )}

            {activeTab === 'heatmap' && (
              <SeoHeatmapView
                report={currentReport}
                onOpenFixModal={(item) => setSelectedAiFixItem(item)}
                onOpenActionPlan={() => setIsActionPlanOpen(true)}
              />
            )}

            {activeTab === 'serp-simulator' && (
              <SerpSimulatorView report={currentReport} />
            )}

            {activeTab === 'content-semantics' && (
              <ContentSemanticsView report={currentReport} />
            )}

            {activeTab === 'broken-links' && (
              <BrokenLinksView report={currentReport} />
            )}

            {activeTab === 'sitemap' && (
              <SitemapCrawlerView report={currentReport} />
            )}

            {activeTab === 'cannibalization' && currentReport && (
              <KeywordCannibalizationView report={currentReport} />
            )}

            {activeTab === 'eco-scripts' && (
              <EcoAndScriptsView report={currentReport} />
            )}

            {activeTab === 'vitals' && (
              <CoreWebVitalsView report={currentReport} onOpenActionPlan={() => setIsActionPlanOpen(true)} />
            )}

            {activeTab === 'config-gen' && (
              <ConfigGeneratorView report={currentReport} />
            )}

            {activeTab === 'ssl-dns' && (
              <SslDnsSecurityView report={currentReport} />
            )}

            {activeTab === 'accessibility' && (
              <AccessibilityWcagView report={currentReport} />
            )}

            {activeTab === 'privacy' && (
              <PrivacyComplianceView report={currentReport} />
            )}

            {activeTab === 'mobile' && (
              <MobileSimulatorView report={currentReport} />
            )}

            {/* SecScan Views */}
            {activeTab === 'js-miner' && (
              <JsMinerView
                targetUrl={currentReport?.targetUrl}
                onRunAIFix={(item) => setSelectedAiFixItem(item)}
              />
            )}

            {activeTab === 'nikto' && (
              <NiktoWebScannerView
                targetUrl={currentReport?.targetUrl}
                onRunAIFix={(item) => setSelectedAiFixItem(item)}
              />
            )}

            {activeTab === 'dast' && (
              <DastFuzzerView
                targetUrl={currentReport?.targetUrl}
                onRunAIFix={(item) => setSelectedAiFixItem(item)}
              />
            )}

            {activeTab === 'waf' && (
              <WafSuiteView
                targetUrl={currentReport?.targetUrl}
                onRunAIFix={(item) => setSelectedAiFixItem(item)}
              />
            )}

            {activeTab === 'ssrf' && (
              <SsrfValidatorView />
            )}

            {activeTab === 'jwt' && (
              <JwtTokenInspectorView />
            )}

            {activeTab === 'compliance' && (
              <ComplianceAuditView report={currentReport} />
            )}

            {activeTab === 'llm-sec' && (
              <LlmSecurityView />
            )}

            {activeTab === 'stride' && (
              <ThreatModelingView />
            )}

            {activeTab === 'soar' && (
              <VisualSoarPlaybookView />
            )}

            {activeTab === 'threat-intel' && (
              <CyberThreatIntelHubView />
            )}

            {/* Main Items View (All or filtered categories) */}
            {(activeTab === 'all' || activeTab === 'security' || activeTab === 'seo' || activeTab === 'best_practices' || activeTab === 'performance_accessibility') && (
              <div className="space-y-4">
                {/* Advanced SEO Tooling: Content Gap Analysis, Page Rank Simulator, and Cannibalization */}
                {activeTab === 'seo' && currentReport && (
                  <div className="mb-4 space-y-4">
                    {/* Content Gap Analysis: Target URL vs Top 3 Competitors in Search Results */}
                    <ContentGapAnalysisView report={currentReport} targetUrl={currentReport.targetUrl} />

                    {/* PageRank Simulator */}
                    <PageRankSimulator auditReport={currentReport} targetUrl={currentReport.targetUrl} />

                    <div className="border-2 border-[#141414] bg-white p-4 sm:p-5 shadow-[3px_3px_0px_#141414] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="bg-amber-400 text-[#141414] px-2 py-0.5 text-xs font-black uppercase border border-[#141414] flex items-center gap-1">
                            <GitMerge className="h-3 w-3" />
                            NEW MODULE
                          </span>
                          <h4 className="font-black text-sm uppercase text-[#141414]">
                            Keyword Cannibalization & Canonicalization Audit
                          </h4>
                        </div>
                        <p className="text-xs text-neutral-600 font-sans">
                          Scan internal links and page titles to detect competing pages targeting duplicate keywords, and resolve indexing conflicts with 301 redirects and master canonical tags.
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setActiveTab('cannibalization')}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-black uppercase bg-[#141414] text-white hover:bg-neutral-800 transition-all cursor-pointer whitespace-nowrap border-2 border-[#141414] shadow-[2px_2px_0px_#888888]"
                      >
                        <span>Open Cannibalization Audit</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Horizontal Severity Distribution Bar Chart */}
                <SeverityDistributionBar
                  criticalCount={scopeCriticalCount}
                  warningCount={scopeWarningCount}
                  goodCount={scopeGoodCount}
                  totalCount={scopeItems.length}
                  activeFilter={severityFilter}
                  onSelectFilter={(filter) => setSeverityFilter(filter)}
                  categoryName={categoryLabel}
                />

                {/* Filters Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 border-2 border-[#141414] bg-white shadow-[2px_2px_0px_#141414]">
                  {/* Severity Pills */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setSeverityFilter('all')}
                      className={`px-2.5 py-1 text-xs font-black uppercase transition-all cursor-pointer border border-[#141414] ${
                        severityFilter === 'all'
                          ? 'bg-[#141414] text-white'
                          : 'bg-[#E4E3E0] text-[#141414] hover:bg-white'
                      }`}
                    >
                      ALL ({scopeItems.length})
                    </button>

                    <button
                      type="button"
                      onClick={() => setSeverityFilter('critical')}
                      className={`flex items-center gap-1 px-2.5 py-1 text-xs font-black uppercase transition-all cursor-pointer border border-[#141414] ${
                        severityFilter === 'critical'
                          ? 'bg-rose-700 text-white'
                          : 'bg-rose-100 text-rose-900 hover:bg-rose-200'
                      }`}
                    >
                      <span>CRITICAL</span>
                      <span className="bg-white/80 px-1 text-[10px] text-rose-900 border border-rose-900">{scopeCriticalCount}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSeverityFilter('warning')}
                      className={`flex items-center gap-1 px-2.5 py-1 text-xs font-black uppercase transition-all cursor-pointer border border-[#141414] ${
                        severityFilter === 'warning'
                          ? 'bg-amber-600 text-white'
                          : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                      }`}
                    >
                      <span>WARNINGS</span>
                      <span className="bg-white/80 px-1 text-[10px] text-amber-900 border border-amber-900">{scopeWarningCount}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setSeverityFilter('good')}
                      className={`flex items-center gap-1 px-2.5 py-1 text-xs font-black uppercase transition-all cursor-pointer border border-[#141414] ${
                        severityFilter === 'good'
                          ? 'bg-emerald-700 text-white'
                          : 'bg-emerald-100 text-emerald-900 hover:bg-emerald-200'
                      }`}
                    >
                      <span>PASSED</span>
                      <span className="bg-white/80 px-1 text-[10px] text-emerald-900 border border-emerald-900">{scopeGoodCount}</span>
                    </button>

                    {/* Quick Wins Filter Button */}
                    <button
                      type="button"
                      onClick={() => setIsQuickWinsOnly(!isQuickWinsOnly)}
                      className={`flex items-center gap-1 px-2.5 py-1 text-xs font-black uppercase transition-all cursor-pointer border-2 border-[#141414] ${
                        isQuickWinsOnly
                          ? 'bg-amber-400 text-[#141414] shadow-[2px_2px_0px_#141414]'
                          : 'bg-white text-[#141414] hover:bg-amber-100'
                      }`}
                    >
                      <Sparkles className="h-3.5 w-3.5 text-amber-700" />
                      <span>{t.quickWinsFilter}</span>
                    </button>
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 text-[#141414] absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="SEARCH AUDIT ITEMS..."
                      className="w-full sm:w-60 bg-[#E4E3E0] border border-[#141414] pl-8 pr-2.5 py-1 text-xs font-mono text-[#141414] placeholder-[#141414]/50 focus:outline-none focus:bg-white"
                    />
                  </div>
                </div>

                {/* Items List */}
                <div id="audit-items-container" className="space-y-3">
                  {filteredItems.length === 0 ? (
                    <div className="text-center py-12 border-2 border-[#141414] bg-white text-[#141414]/70 text-xs shadow-[2px_2px_0px_#141414]">
                      <p>NO ITEMS FOUND MATCHING THE SELECTED FILTERS.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('all');
                          setSeverityFilter('all');
                          setSearchTerm('');
                        }}
                        className="mt-2 text-[#141414] font-bold uppercase underline"
                      >
                        CLEAR FILTERS
                      </button>
                    </div>
                  ) : (
                    filteredItems.map((item) => (
                      <AuditItemCard
                        key={item.id}
                        item={item}
                        isCompleted={!!completedFixIds[item.id]}
                        onToggleCompleted={toggleFixCompleted}
                        onGetAiFix={(fixItem) => setSelectedAiFixItem(fixItem)}
                      />
                    ))
                  )}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t-2 border-[#141414] bg-white py-6 text-center text-xs font-mono text-[#141414]">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-black text-[#141414] uppercase">WEBAUDIT PRO</span>
            <span>•</span>
            <span className="text-[#141414]/70">PROFESSIONAL WEB AUDIT & DIAGNOSTICS SUITE</span>
          </div>

          <div className="flex items-center gap-4 text-[#141414]/80">
            <button
              onClick={() => setIsGitHubPagesOpen(true)}
              className="hover:underline uppercase font-bold cursor-pointer"
            >
              GITHUB PAGES GUIDE
            </button>
            <span>•</span>
            <span className="uppercase text-[11px]">STANDALONE / CI/CD READY</span>
          </div>
        </div>
      </footer>

      {/* Persistent Floating Action Plan Button */}
      {currentReport && (
        <ActionPlanFloatingButton
          items={currentReport.items}
          completedFixIds={completedFixIds}
          onClick={() => setIsActionPlanOpen(true)}
          isOpen={isActionPlanOpen}
        />
      )}

      {/* Action Plan Remediation Drawer */}
      {currentReport && (
        <ActionPlanDrawer
          isOpen={isActionPlanOpen}
          onClose={() => setIsActionPlanOpen(false)}
          items={currentReport.items}
          completedFixIds={completedFixIds}
          onToggleCompleted={toggleFixCompleted}
          onBatchSetCompleted={batchSetCompleted}
          onGetAiFix={(fixItem) => setSelectedAiFixItem(fixItem)}
          targetUrl={currentReport.targetUrl}
          onReAudit={(url) => handleAnalyze(url)}
          onLocateItem={handleLocateItem}
        />
      )}

      {/* Modals */}
      {currentReport && (
        <ExportModal
          report={currentReport}
          isOpen={isExportOpen}
          onClose={() => setIsExportOpen(false)}
        />
      )}

      {currentReport && (
        <WhiteLabelPdfModal
          report={currentReport}
          isOpen={isWhiteLabelOpen}
          onClose={() => setIsWhiteLabelOpen(false)}
        />
      )}

      {currentReport && (
        <WebhookAlertModal
          report={currentReport}
          isOpen={isWebhooksOpen}
          onClose={() => setIsWebhooksOpen(false)}
        />
      )}

      {currentReport && (
        <SeoQuickStartModal
          report={currentReport}
          isOpen={isSeoChecklistOpen}
          onClose={() => setIsSeoChecklistOpen(false)}
        />
      )}

      {currentReport && (
        <CommercialProposalModal
          report={currentReport}
          isOpen={isProposalOpen}
          onClose={() => setIsProposalOpen(false)}
        />
      )}

      <ScheduledMonitorModal
        isOpen={isMonitorOpen}
        onClose={() => setIsMonitorOpen(false)}
        currentReport={currentReport}
      />

      <GitHubPagesModal
        isOpen={isGitHubPagesOpen}
        onClose={() => setIsGitHubPagesOpen(false)}
      />

      <AuditHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        savedAudits={savedAudits}
        currentUrl={currentReport?.targetUrl}
        onSelectAudit={(id) => {
          const found = savedAudits.find((a) => a.id === id);
          if (found) handleAnalyze(found.targetUrl);
        }}
        onClearHistory={handleClearHistory}
        onReaudit={(url) => handleAnalyze(url)}
      />

      {selectedAiFixItem && (
        <AIFixModal
          item={selectedAiFixItem}
          isOpen={!!selectedAiFixItem}
          onClose={() => setSelectedAiFixItem(null)}
          targetUrl={currentReport?.targetUrl}
          techStack={currentReport?.rawData?.techStack}
          isCompleted={!!completedFixIds[selectedAiFixItem.id]}
          onToggleCompleted={toggleFixCompleted}
        />
      )}

      {/* Global Command Palette Modal (Cmd+K / Ctrl+K) */}
      <CommandPaletteModal
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTab={(tab) => {
          setActiveTab(tab);
        }}
      />
    </div>
  );
}
