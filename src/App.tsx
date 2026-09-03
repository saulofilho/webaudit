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
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AuditReport, AuditCategory, SeverityLevel, SavedAuditSummary, AuditItem } from './types';
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
import { analyzeWebsiteClient } from './services/clientAnalyzer';

const STORAGE_KEY = 'webaudit_history_v1';
const ACTION_PLAN_STORAGE_PREFIX = 'webaudit_actionplan_v1_';

export default function App() {
  const [currentReport, setCurrentReport] = useState<AuditReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<AuditCategory | 'all' | 'headers' | 'social' | 'tech' | 'comparator' | 'trends'>('all');
  const [severityFilter, setSeverityFilter] = useState<SeverityLevel | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [completedFixIds, setCompletedFixIds] = useState<Record<string, boolean>>({});

  // Modals & Panels
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isGitHubPagesOpen, setIsGitHubPagesOpen] = useState<boolean>(false);
  const [isActionPlanOpen, setIsActionPlanOpen] = useState<boolean>(false);
  const [selectedAiFixItem, setSelectedAiFixItem] = useState<AuditItem | null>(null);

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
      setError(err.message || 'Ocorreu um erro ao auditar o website. Verifique a URL informada.');
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
      activeTab !== 'headers' &&
      activeTab !== 'social' &&
      activeTab !== 'tech' &&
      activeTab !== 'comparator' &&
      activeTab !== 'trends'
    ) {
      if (item.category !== activeTab) return false;
    }
    // Severity filter
    if (severityFilter !== 'all' && item.severity !== severityFilter) return false;
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
      case 'security': return 'SEGURANÇA';
      case 'seo': return 'SEO';
      case 'best_practices': return 'BOAS PRÁTICAS';
      case 'performance_accessibility': return 'PERFORMANCE & ACESSIBILIDADE';
      default: return undefined;
    }
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] flex flex-col selection:bg-[#141414] selection:text-[#E4E3E0] font-mono">
      {/* Navigation Header */}
      <Navbar
        onOpenHistory={() => setIsHistoryOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenGitHubPages={() => setIsGitHubPagesOpen(true)}
        onOpenActionPlan={() => setIsActionPlanOpen(true)}
        pendingActionCount={pendingActionCount}
        onNewAudit={() => {
          setCurrentReport(null);
          setError(null);
        }}
        hasReport={!!currentReport}
        isBackendActive={isBackendActive}
        historyCount={savedAudits.length}
      />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* If no report yet, show Hero search */}
        {!currentReport && (
          <UrlInputSection
            onAnalyze={handleAnalyze}
            isLoading={isLoading}
            error={error}
          />
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
              pendingActionCount={pendingActionCount}
            />

            {/* 4 Core Pillars Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <CategoryScoreCard
                categoryKey="security"
                scoreData={currentReport.categories.security}
                isSelected={activeTab === 'security'}
                onSelect={() => setActiveTab('security')}
              />
              <CategoryScoreCard
                categoryKey="seo"
                scoreData={currentReport.categories.seo}
                isSelected={activeTab === 'seo'}
                onSelect={() => setActiveTab('seo')}
              />
              <CategoryScoreCard
                categoryKey="best_practices"
                scoreData={currentReport.categories.best_practices}
                isSelected={activeTab === 'best_practices'}
                onSelect={() => setActiveTab('best_practices')}
              />
              <CategoryScoreCard
                categoryKey="performance_accessibility"
                scoreData={currentReport.categories.performance_accessibility}
                isSelected={activeTab === 'performance_accessibility'}
                onSelect={() => setActiveTab('performance_accessibility')}
              />
            </div>

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
                  <span>TODOS OS ITENS ({currentReport.items.length})</span>
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
                  <span>SEGURANÇA</span>
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
                  <span>SEO & INDEXAÇÃO</span>
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
                  <span>BOAS PRÁTICAS</span>
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
                  <span>REDES & SERP</span>
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
                  <span>HEADERS HTTP</span>
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
                  <span>STACK</span>
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
                  <span>COMPARADOR</span>
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
                  <span>TENDÊNCIAS & HISTÓRICO</span>
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
              <SocialPreview meta={currentReport.rawData.metaTags} url={currentReport.targetUrl} />
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

            {/* Main Items View (All or filtered categories) */}
            {(activeTab === 'all' || activeTab === 'security' || activeTab === 'seo' || activeTab === 'best_practices' || activeTab === 'performance_accessibility') && (
              <div className="space-y-4">
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
                      TODOS ({scopeItems.length})
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
                      <span>CRÍTICOS</span>
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
                      <span>ALERTAS</span>
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
                      <span>APROVADOS</span>
                      <span className="bg-white/80 px-1 text-[10px] text-emerald-900 border border-emerald-900">{scopeGoodCount}</span>
                    </button>
                  </div>

                  {/* Search Input */}
                  <div className="relative">
                    <Search className="h-3.5 w-3.5 text-[#141414] absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="FILTRAR AUDITORIAS..."
                      className="w-full sm:w-60 bg-[#E4E3E0] border border-[#141414] pl-8 pr-2.5 py-1 text-xs font-mono text-[#141414] placeholder-[#141414]/50 focus:outline-none focus:bg-white"
                    />
                  </div>
                </div>

                {/* Items List */}
                <div id="audit-items-container" className="space-y-3">
                  {filteredItems.length === 0 ? (
                    <div className="text-center py-12 border-2 border-[#141414] bg-white text-[#141414]/70 text-xs shadow-[2px_2px_0px_#141414]">
                      <p>NENHUM ITEM ENCONTRADO COM OS FILTROS SELECIONADOS.</p>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTab('all');
                          setSeverityFilter('all');
                          setSearchTerm('');
                        }}
                        className="mt-2 text-[#141414] font-bold uppercase underline"
                      >
                        LIMPAR FILTROS
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
            <span className="text-[#141414]/70">SISTEMA DE DIAGNÓSTICO E AUDITORIA WEB</span>
          </div>

          <div className="flex items-center gap-4 text-[#141414]/80">
            <button
              onClick={() => setIsGitHubPagesOpen(true)}
              className="hover:underline uppercase font-bold cursor-pointer"
            >
              GUIA GITHUB PAGES
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
    </div>
  );
}
