import React, { useState, useMemo } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Sparkles,
  Copy,
  Check,
  Download,
  ListTodo,
  ExternalLink,
  RefreshCw,
  Search,
  Filter,
  CheckSquare,
  Square,
  ArrowRight,
  Code2,
  SlidersHorizontal,
  Flame,
  ShieldAlert,
  Zap,
  Clock,
  CheckCheck,
  FileCode2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { AuditItem, SeverityLevel, AuditCategory } from '../types';
import confetti from 'canvas-confetti';

interface ActionPlanDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: AuditItem[];
  completedFixIds: Record<string, boolean>;
  onToggleCompleted: (id: string) => void;
  onBatchSetCompleted: (ids: string[], completed: boolean) => void;
  onGetAiFix: (item: AuditItem) => void;
  targetUrl?: string;
  onReAudit?: (url: string) => void;
  onLocateItem?: (item: AuditItem) => void;
}

type FilterView = 'pending' | 'critical' | 'warning' | 'completed' | 'all';

export const ActionPlanDrawer: React.FC<ActionPlanDrawerProps> = ({
  isOpen,
  onClose,
  items,
  completedFixIds,
  onToggleCompleted,
  onBatchSetCompleted,
  onGetAiFix,
  targetUrl,
  onReAudit,
  onLocateItem,
}) => {
  const [filterView, setFilterView] = useState<FilterView>('pending');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedSnippetId, setCopiedSnippetId] = useState<string | null>(null);
  const [copiedMarkdown, setCopiedMarkdown] = useState<boolean>(false);
  const [showBulkWarningModal, setShowBulkWarningModal] = useState<boolean>(false);
  const [copiedBulkMarkdown, setCopiedBulkMarkdown] = useState<boolean>(false);
  const [copiedConsolidatedHtml, setCopiedConsolidatedHtml] = useState<boolean>(false);
  const [copiedConsolidatedServer, setCopiedConsolidatedServer] = useState<boolean>(false);

  // Remediation focuses on Critical and Warning items
  const actionItems = useMemo(() => {
    return items.filter(
      (item) => item.severity === 'critical' || item.severity === 'warning'
    );
  }, [items]);

  // Warning items for Bulk Fix session
  const warningItems = useMemo(() => {
    return actionItems.filter((i) => i.severity === 'warning');
  }, [actionItems]);

  // Consolidated HTML Snippets
  const consolidatedHtmlSnippet = useMemo(() => {
    const lines: string[] = ['<!-- Consolidated Warning Snippets (Paste into <head>) -->'];
    let hasHtmlSnippet = false;

    warningItems.forEach((w) => {
      if (w.codeSnippet?.code && (w.codeSnippet.language === 'html' || w.category === 'seo' || w.category === 'best_practices')) {
        hasHtmlSnippet = true;
        lines.push(`<!-- ${w.title} -->`);
        lines.push(w.codeSnippet.code.trim());
      } else if (w.id.includes('canonical')) {
        hasHtmlSnippet = true;
        lines.push(`<!-- Canonical Tag -->\n<link rel="canonical" href="${targetUrl || 'https://example.com'}" />`);
      } else if (w.id.includes('description')) {
        hasHtmlSnippet = true;
        lines.push(`<!-- Optimized Meta Description -->\n<meta name="description" content="Concise description between 120 and 160 characters with relevant keywords for search engagement." />`);
      } else if (w.id.includes('og-image')) {
        hasHtmlSnippet = true;
        lines.push(`<!-- OpenGraph Image -->\n<meta property="og:image" content="https://example.com/og-banner.jpg" />\n<meta property="og:image:width" content="1200" />\n<meta property="og:image:height" content="630" />`);
      } else if (w.id.includes('twitter-card')) {
        hasHtmlSnippet = true;
        lines.push(`<!-- Twitter Card -->\n<meta name="twitter:card" content="summary_large_image" />`);
      }
    });

    return hasHtmlSnippet ? lines.join('\n') : null;
  }, [warningItems, targetUrl]);

  // Consolidated Server Snippets
  const consolidatedServerSnippet = useMemo(() => {
    const lines: string[] = ['# Nginx / Server: Warning Headers & Directives'];
    let hasServerSnippet = false;

    warningItems.forEach((w) => {
      if (w.id.includes('content-type') || w.id.includes('nosniff')) {
        hasServerSnippet = true;
        lines.push('add_header X-Content-Type-Options "nosniff" always;');
      } else if (w.id.includes('referrer')) {
        hasServerSnippet = true;
        lines.push('add_header Referrer-Policy "strict-origin-when-cross-origin" always;');
      } else if (w.id.includes('server-header')) {
        hasServerSnippet = true;
        lines.push('server_tokens off; # Hide Nginx version signature');
      }
    });

    return hasServerSnippet ? lines.join('\n') : null;
  }, [warningItems]);

  const handleMarkAllWarningsCompleted = () => {
    const warningIds = warningItems.map((i) => i.id);
    if (warningIds.length > 0) {
      onBatchSetCompleted(warningIds, true);
      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#f59e0b', '#10b981', '#141414'],
        });
      } catch {
        // ignore
      }
    }
  };

  const exportBulkWarningMarkdown = () => {
    let md = `# ⚡ Single Session: Consolidated Fix for Non-Critical Warnings\n`;
    md += `**Target:** ${targetUrl || 'N/A'}\n`;
    md += `**Date:** ${new Date().toLocaleDateString('en-US')} ${new Date().toLocaleTimeString('en-US')}\n`;
    md += `**Estimated Time:** ~${Math.max(10, warningItems.length * 3)} min\n`;
    md += `**Total Warnings:** ${warningItems.length} tasks\n\n`;

    md += `## Quick Execution Checklist:\n`;
    warningItems.forEach((item, idx) => {
      const isDone = !!completedFixIds[item.id];
      md += `${idx + 1}. [${isDone ? 'x' : ' '}] **${item.title}** (${item.category.toUpperCase()})\n`;
      md += `   - *Problem:* ${item.summary}\n`;
      if (item.recommendedValue) {
        md += `   - *Recommendation:* \`${item.recommendedValue}\`\n`;
      }
      if (item.codeSnippet?.code) {
        md += `   - *Snippet:* \`${item.codeSnippet.code.replace(/\n/g, ' ')}\`\n`;
      }
    });

    if (consolidatedHtmlSnippet) {
      md += `\n## Consolidated HTML Block (<head>):\n\`\`\`html\n${consolidatedHtmlSnippet}\n\`\`\`\n`;
    }

    if (consolidatedServerSnippet) {
      md += `\n## Consolidated Server Directives Block:\n\`\`\`nginx\n${consolidatedServerSnippet}\n\`\`\`\n`;
    }

    navigator.clipboard.writeText(md);
    setCopiedBulkMarkdown(true);
    setTimeout(() => setCopiedBulkMarkdown(false), 2000);
  };

  // Counts
  const totalCount = actionItems.length;
  const criticalCount = actionItems.filter((i) => i.severity === 'critical').length;
  const warningCount = actionItems.filter((i) => i.severity === 'warning').length;

  const completedCount = useMemo(() => {
    return actionItems.filter((i) => !!completedFixIds[i.id]).length;
  }, [actionItems, completedFixIds]);

  const pendingCount = totalCount - completedCount;
  const pendingCriticalCount = actionItems.filter(
    (i) => i.severity === 'critical' && !completedFixIds[i.id]
  ).length;
  const pendingWarningCount = actionItems.filter(
    (i) => i.severity === 'warning' && !completedFixIds[i.id]
  ).length;

  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Filtered list
  const displayItems = useMemo(() => {
    return actionItems
      .filter((item) => {
        const isDone = !!completedFixIds[item.id];
        if (filterView === 'pending' && isDone) return false;
        if (filterView === 'completed' && !isDone) return false;
        if (filterView === 'critical' && item.severity !== 'critical') return false;
        if (filterView === 'warning' && item.severity !== 'warning') return false;

        if (selectedCategory !== 'all' && item.category !== selectedCategory) return false;

        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchTitle = item.title.toLowerCase().includes(q);
          const matchSummary = item.summary.toLowerCase().includes(q);
          const matchCat = item.category.toLowerCase().includes(q);
          if (!matchTitle && !matchSummary && !matchCat) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Uncompleted critical items first, then uncompleted warning items, then completed
        const aDone = !!completedFixIds[a.id];
        const bDone = !!completedFixIds[b.id];
        if (aDone !== bDone) return aDone ? 1 : -1;
        if (a.severity === 'critical' && b.severity !== 'critical') return -1;
        if (b.severity === 'critical' && a.severity !== 'critical') return 1;
        return a.score - b.score;
      });
  }, [actionItems, completedFixIds, filterView, selectedCategory, searchQuery]);

  const handleToggle = (id: string) => {
    const willBeCompleted = !completedFixIds[id];
    onToggleCompleted(id);

    // If reaching 100% completion, trigger celebratory confetti
    if (willBeCompleted && completedCount + 1 === totalCount && totalCount > 0) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#141414', '#059669', '#f59e0b', '#2563eb'],
        });
      } catch {
        // ignore
      }
    }
  };

  const handleMarkAllVisible = (completed: boolean) => {
    const ids = displayItems.map((i) => i.id);
    if (ids.length > 0) {
      onBatchSetCompleted(ids, completed);
      if (completed && ids.length === pendingCount) {
        try {
          confetti({
            particleCount: 80,
            spread: 60,
            origin: { y: 0.6 },
          });
        } catch {
          // ignore
        }
      }
    }
  };

  const handleCopySnippet = (item: AuditItem) => {
    if (!item.codeSnippet?.code) return;
    navigator.clipboard.writeText(item.codeSnippet.code);
    setCopiedSnippetId(item.id);
    setTimeout(() => setCopiedSnippetId(null), 2000);
  };

  const exportMarkdownChecklist = () => {
    const domain = targetUrl ? new URL(targetUrl).hostname : 'website';
    let md = `# Action Plan & Remediation Checklist\n`;
    md += `**Target:** ${targetUrl || 'N/A'}\n`;
    md += `**Date:** ${new Date().toLocaleDateString('en-US')} ${new Date().toLocaleTimeString('en-US')}\n`;
    md += `**Current Progress:** ${completedCount}/${totalCount} items resolved (${progressPercent}%)\n\n`;

    md += `## 1. Critical Blockers (${criticalCount} items)\n`;
    actionItems
      .filter((i) => i.severity === 'critical')
      .forEach((item) => {
        const check = completedFixIds[item.id] ? '[x]' : '[ ]';
        md += `- ${check} **${item.title}** [${item.category.toUpperCase()}]\n`;
        md += `  - *Problem:* ${item.summary}\n`;
        if (item.recommendedValue) {
          md += `  - *Recommendation:* \`${item.recommendedValue}\`\n`;
        }
        if (item.codeSnippet?.code) {
          md += `  - *Snippet:* \`${item.codeSnippet.code.replace(/\n/g, ' ')}\`\n`;
        }
      });

    md += `\n## 2. Warnings & Optimizations (${warningCount} items)\n`;
    actionItems
      .filter((i) => i.severity === 'warning')
      .forEach((item) => {
        const check = completedFixIds[item.id] ? '[x]' : '[ ]';
        md += `- ${check} **${item.title}** [${item.category.toUpperCase()}]\n`;
        md += `  - *Problem:* ${item.summary}\n`;
        if (item.recommendedValue) {
          md += `  - *Recommendation:* \`${item.recommendedValue}\`\n`;
        }
      });

    navigator.clipboard.writeText(md);
    setCopiedMarkdown(true);
    setTimeout(() => setCopiedMarkdown(false), 2200);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-[#141414]/50 backdrop-blur-[2px]"
          />

          {/* Drawer Panel */}
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed inset-y-0 right-0 z-50 w-full sm:w-[500px] md:w-[540px] bg-white border-l-2 border-[#141414] shadow-[-10px_0px_0px_#141414]/20 flex flex-col font-mono text-[#141414]"
            role="dialog"
            aria-label="Action Plan & Remediation Checklist"
          >
            {/* Header */}
            <div className="p-4 bg-[#141414] text-white border-b-2 border-[#141414] shrink-0">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 bg-amber-400 text-[#141414] border border-white">
                    <ListTodo className="h-4 w-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-white">
                        ACTION PLAN
                      </h2>
                      <span className="bg-white/20 text-white text-[9px] px-1.5 py-0.2 font-bold uppercase">
                        REMEDIATION
                      </span>
                    </div>
                    {targetUrl && (
                      <p className="text-[10px] text-white/70 truncate max-w-[280px] sm:max-w-[340px]">
                        {targetUrl}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  id="btn-close-action-plan"
                  onClick={onClose}
                  aria-label="Close Action Plan"
                  className="p-1 text-white hover:bg-rose-600 border border-white/30 transition-colors cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Progress Summary Strip */}
              <div className="mt-3 pt-3 border-t border-white/20 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold uppercase tracking-wider text-white/90 flex items-center gap-1.5">
                    <span>OVERALL PROGRESS:</span>
                    <span className="text-amber-300 font-black">{progressPercent}%</span>
                  </span>
                  <span className="text-[11px] text-white/80">
                    <strong className="text-emerald-400">{completedCount}</strong> of {totalCount} resolved
                  </span>
                </div>

                {/* Progress Bar */}
                <div className="h-2.5 w-full bg-white/20 border border-white/40 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-300 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-2 pt-1">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase border ${
                      pendingCriticalCount > 0
                        ? 'bg-rose-500 text-white border-rose-300'
                        : 'bg-emerald-800 text-emerald-100 border-emerald-600'
                    }`}
                  >
                    <AlertCircle className="h-3 w-3" />
                    <span>
                      {pendingCriticalCount > 0
                        ? `${pendingCriticalCount} CRITICAL PENDING`
                        : '0 CRITICAL'}
                    </span>
                  </span>

                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase border ${
                      pendingWarningCount > 0
                        ? 'bg-amber-400 text-[#141414] border-amber-600'
                        : 'bg-emerald-800 text-emerald-100 border-emerald-600'
                    }`}
                  >
                    <AlertTriangle className="h-3 w-3" />
                    <span>
                      {pendingWarningCount > 0
                        ? `${pendingWarningCount} WARNINGS PENDING`
                        : '0 WARNINGS'}
                    </span>
                  </span>
                </div>

                {/* Bulk Fix Quick Callout for Warnings */}
                {pendingWarningCount > 0 && (
                  <button
                    type="button"
                    id="btn-bulk-fix-warnings"
                    onClick={() => setShowBulkWarningModal(true)}
                    className="w-full mt-2.5 flex items-center justify-between p-2 bg-amber-400 hover:bg-amber-300 text-[#141414] border border-[#141414] shadow-[2px_2px_0px_#141414] transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-1.5 text-xs font-black uppercase">
                      <Zap className="h-4 w-4 fill-[#141414] text-[#141414]" />
                      <span>BULK FIX: {pendingWarningCount} NON-CRITICAL WARNINGS</span>
                    </div>
                    <span className="text-[10px] font-bold bg-[#141414] text-white px-2 py-0.5 uppercase flex items-center gap-1">
                      <span>SINGLE SESSION (~15 MIN)</span>
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </button>
                )}
              </div>
            </div>

            {/* Filter Navigation Bar */}
            <div className="bg-[#E4E3E0] border-b-2 border-[#141414] p-2 space-y-2 shrink-0">
              <div className="flex items-center gap-1 overflow-x-auto pb-0.5">
                <button
                  type="button"
                  onClick={() => setFilterView('pending')}
                  className={`px-2 py-1 text-[10px] font-bold uppercase transition-all whitespace-nowrap cursor-pointer border ${
                    filterView === 'pending'
                      ? 'bg-[#141414] text-white border-[#141414]'
                      : 'bg-white text-[#141414] border-[#141414]/40 hover:bg-[#F2F1ED]'
                  }`}
                >
                  PENDING ({pendingCount})
                </button>

                <button
                  type="button"
                  onClick={() => setFilterView('critical')}
                  className={`px-2 py-1 text-[10px] font-bold uppercase transition-all whitespace-nowrap cursor-pointer border ${
                    filterView === 'critical'
                      ? 'bg-rose-700 text-white border-rose-900'
                      : 'bg-white text-rose-800 border-rose-400 hover:bg-rose-50'
                  }`}
                >
                  CRITICAL ({criticalCount})
                </button>

                <button
                  type="button"
                  onClick={() => setFilterView('warning')}
                  className={`px-2 py-1 text-[10px] font-bold uppercase transition-all whitespace-nowrap cursor-pointer border ${
                    filterView === 'warning'
                      ? 'bg-amber-500 text-[#141414] border-amber-700'
                      : 'bg-white text-amber-900 border-amber-400 hover:bg-amber-50'
                  }`}
                >
                  WARNINGS ({warningCount})
                </button>

                <button
                  type="button"
                  onClick={() => setFilterView('completed')}
                  className={`px-2 py-1 text-[10px] font-bold uppercase transition-all whitespace-nowrap cursor-pointer border ${
                    filterView === 'completed'
                      ? 'bg-emerald-700 text-white border-emerald-900'
                      : 'bg-white text-emerald-800 border-emerald-400 hover:bg-emerald-50'
                  }`}
                >
                  RESOLVED ({completedCount})
                </button>

                <button
                  type="button"
                  onClick={() => setFilterView('all')}
                  className={`px-2 py-1 text-[10px] font-bold uppercase transition-all whitespace-nowrap cursor-pointer border ${
                    filterView === 'all'
                      ? 'bg-[#141414] text-white border-[#141414]'
                      : 'bg-white text-[#141414] border-[#141414]/40 hover:bg-[#F2F1ED]'
                  }`}
                >
                  ALL ({totalCount})
                </button>
              </div>

              {/* Search & Category Filter */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-[#141414]/60" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Filter by name, tag, or keyword..."
                    className="w-full bg-white border border-[#141414] pl-8 pr-2 py-1.5 text-xs placeholder-[#141414]/50 focus:outline-none focus:ring-1 focus:ring-[#141414]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-2 text-xs font-bold text-[#141414]/60 hover:text-[#141414]"
                    >
                      ×
                    </button>
                  )}
                </div>

                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-white border border-[#141414] px-2 py-1.5 text-xs font-bold uppercase focus:outline-none cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  <option value="security">Security</option>
                  <option value="seo">SEO</option>
                  <option value="best_practices">Best Practices</option>
                  <option value="performance_accessibility">Performance</option>
                </select>
              </div>
            </div>

            {/* Checklist Items Container - Scrollable */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 bg-[#F2F1ED]">
              {displayItems.length === 0 ? (
                <div className="py-12 px-4 text-center border-2 border-dashed border-[#141414] bg-white space-y-3">
                  <div className="w-10 h-10 mx-auto rounded-none bg-[#141414] text-white flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-black uppercase text-sm">
                      {filterView === 'pending'
                        ? 'No pending items matching this filter!'
                        : 'No items found'}
                    </h3>
                    <p className="text-xs text-[#141414]/70 mt-1 max-w-xs mx-auto">
                      {filterView === 'pending' && completedCount === totalCount && totalCount > 0
                        ? 'Congratulations! All critical issues and warnings have been marked as resolved.'
                        : 'Adjust filters or search query to view other items.'}
                    </p>
                  </div>
                  {onReAudit && targetUrl && (
                    <button
                      type="button"
                      onClick={() => onReAudit(targetUrl)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#141414] text-white text-xs font-bold uppercase hover:bg-[#333] transition-colors cursor-pointer border border-[#141414]"
                    >
                      <RefreshCw className="h-3 w-3" />
                      <span>RE-AUDIT WEBSITE NOW</span>
                    </button>
                  )}
                </div>
              ) : (
                displayItems.map((item, index) => {
                  const isDone = !!completedFixIds[item.id];
                  const isCritical = item.severity === 'critical';

                  return (
                    <div
                      key={item.id}
                      className={`border-2 p-3 transition-all ${
                        isDone
                          ? 'border-emerald-700 bg-emerald-50/40 opacity-85'
                          : isCritical
                          ? 'border-rose-700 bg-white shadow-[2px_2px_0px_#991b1b]'
                          : 'border-[#141414] bg-white shadow-[2px_2px_0px_#141414]'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        {/* Interactive Checkbox */}
                        <button
                          type="button"
                          id={`action-checkbox-${item.id}`}
                          onClick={() => handleToggle(item.id)}
                          aria-label={
                            isDone
                              ? `Mark ${item.title} as pending`
                              : `Mark ${item.title} as resolved`
                          }
                          className="mt-0.5 shrink-0 text-[#141414] hover:scale-110 transition-transform cursor-pointer"
                        >
                          {isDone ? (
                            <CheckSquare className="h-4.5 w-4.5 text-emerald-700 fill-emerald-100" />
                          ) : (
                            <Square className="h-4.5 w-4.5 text-[#141414]/70 hover:text-[#141414]" />
                          )}
                        </button>

                        <div className="min-w-0 flex-1 space-y-1">
                          {/* Tags row */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span
                              className={`px-1.5 py-0.2 text-[9px] font-bold uppercase border ${
                                isCritical
                                  ? 'bg-rose-100 text-rose-900 border-rose-700'
                                  : 'bg-amber-100 text-amber-900 border-amber-700'
                              }`}
                            >
                              {isCritical ? 'CRITICAL' : 'WARNING'}
                            </span>

                            <span className="px-1.5 py-0.2 text-[9px] font-bold uppercase bg-[#E4E3E0] border border-[#141414] text-[#141414]">
                              {item.category.replace('_', ' ')}
                            </span>

                            {isDone && (
                              <span className="text-[9px] font-bold uppercase text-emerald-800 flex items-center gap-0.5">
                                <Check className="h-3 w-3" /> RESOLVED
                              </span>
                            )}
                          </div>

                          {/* Title */}
                          <h4
                            className={`text-xs font-bold uppercase leading-tight ${
                              isDone ? 'line-through text-emerald-950' : 'text-[#141414]'
                            }`}
                          >
                            {item.title}
                          </h4>

                          {/* Summary */}
                          <p className="text-[11px] text-[#141414]/75 leading-relaxed">
                            {item.summary}
                          </p>

                          {/* Code Snippet Preview (if available) */}
                          {item.codeSnippet && !isDone && (
                            <div className="mt-1.5 p-1.5 bg-[#141414] text-emerald-400 font-mono text-[10px] overflow-x-auto flex items-center justify-between gap-2 border border-[#333]">
                              <code className="truncate max-w-[280px]">
                                {item.codeSnippet.code}
                              </code>
                              <button
                                type="button"
                                onClick={() => handleCopySnippet(item)}
                                className="px-1.5 py-0.5 bg-[#333] hover:bg-[#555] text-white text-[9px] font-bold uppercase transition-colors shrink-0 cursor-pointer"
                              >
                                {copiedSnippetId === item.id ? 'COPIED' : 'COPY'}
                              </button>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="pt-2 flex flex-wrap items-center justify-between gap-1.5 border-t border-[#141414]/15">
                            {/* Get AI Fix */}
                            <button
                              type="button"
                              id={`btn-drawer-ai-fix-${item.id}`}
                              onClick={() => onGetAiFix(item)}
                              className="flex items-center gap-1 px-2 py-1 bg-[#141414] text-white hover:bg-emerald-600 border border-[#141414] text-[10px] font-bold uppercase transition-all shadow-[1px_1px_0px_#141414] cursor-pointer"
                            >
                              <Sparkles className="h-3 w-3 text-amber-300 fill-amber-300" />
                              <span>GET AI FIX (STEP-BY-STEP)</span>
                            </button>

                            {/* Locate or detail link */}
                            {onLocateItem && (
                              <button
                                type="button"
                                onClick={() => {
                                  onLocateItem(item);
                                  onClose();
                                }}
                                className="flex items-center gap-1 text-[10px] font-bold uppercase text-[#141414] hover:underline cursor-pointer"
                              >
                                <span>VIEW IN REPORT</span>
                                <ArrowRight className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Batch Controls & Footer Bar */}
            <div className="p-3 bg-[#E4E3E0] border-t-2 border-[#141414] space-y-2 shrink-0">
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleMarkAllVisible(true)}
                    disabled={displayItems.length === 0}
                    className="px-2 py-1 bg-white border border-[#141414] hover:bg-emerald-50 text-[#141414] text-[10px] font-bold uppercase transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Mark Visible as Resolved
                  </button>

                  <button
                    type="button"
                    onClick={() => handleMarkAllVisible(false)}
                    disabled={displayItems.length === 0}
                    className="px-2 py-1 bg-white border border-[#141414] hover:bg-[#F2F1ED] text-[#141414] text-[10px] font-bold uppercase transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    Clear Visible Marks
                  </button>

                  {pendingWarningCount > 0 && (
                    <button
                      type="button"
                      id="btn-footer-bulk-fix"
                      onClick={() => setShowBulkWarningModal(true)}
                      className="px-2 py-1 bg-amber-400 border border-[#141414] hover:bg-amber-300 text-[#141414] text-[10px] font-black uppercase transition-colors shadow-[1px_1px_0px_#141414] cursor-pointer flex items-center gap-1"
                      title="Open consolidated Bulk Fix session for warnings"
                    >
                      <Zap className="h-3 w-3 fill-[#141414]" />
                      <span>Bulk Fix ({pendingWarningCount})</span>
                    </button>
                  )}
                </div>

                <button
                  type="button"
                  id="btn-export-action-plan-md"
                  onClick={exportMarkdownChecklist}
                  className="flex items-center gap-1 px-2.5 py-1 bg-[#141414] text-white hover:bg-[#333] border border-[#141414] text-[10px] font-bold uppercase transition-colors cursor-pointer"
                >
                  {copiedMarkdown ? (
                    <>
                      <Check className="h-3 w-3 text-emerald-400" />
                      <span className="text-emerald-400">CHECKLIST COPIED!</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-3 w-3" />
                      <span>EXPORT CHECKLIST (.MD)</span>
                    </>
                  )}
                </button>
              </div>

              {onReAudit && targetUrl && (
                <div className="pt-1 flex items-center justify-between text-[11px] text-[#141414]/80 border-t border-[#141414]/20">
                  <span>Finished infrastructure / code updates?</span>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onReAudit(targetUrl);
                    }}
                    className="font-bold uppercase text-[#141414] hover:text-emerald-700 underline cursor-pointer flex items-center gap-1"
                  >
                    <RefreshCw className="h-3 w-3" />
                    <span>Run new audit</span>
                  </button>
                </div>
              )}
            </div>
          </motion.aside>

          {/* Bulk Warning Fix Modal */}
          {showBulkWarningModal && (
            <div className="fixed inset-0 z-60 bg-[#141414]/75 backdrop-blur-[2px] flex items-center justify-center p-3 sm:p-5">
              <div
                className="w-full max-w-2xl bg-white border-2 border-[#141414] shadow-[8px_8px_0px_#141414] flex flex-col max-h-[90vh] font-mono text-[#141414]"
                role="dialog"
                aria-label="Bulk Fix: Consolidated Checklist for Non-Critical Warnings"
              >
                {/* Modal Header */}
                <div className="p-4 bg-amber-400 border-b-2 border-[#141414] flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-1.5 bg-[#141414] text-amber-300 border border-[#141414]">
                      <Zap className="h-5 w-5 fill-amber-300 text-amber-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm sm:text-base font-black uppercase text-[#141414]">
                          BULK FIX // NON-CRITICAL WARNINGS
                        </h3>
                        <span className="bg-[#141414] text-white text-[10px] px-1.5 py-0.2 font-black uppercase">
                          SINGLE SESSION
                        </span>
                      </div>
                      <p className="text-[11px] text-[#141414]/80 mt-0.5">
                        Batch-resolve {warningItems.length} medium-priority tasks in ~{Math.max(10, warningItems.length * 3)} min for rapid score recovery.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowBulkWarningModal(false)}
                    className="p-1 border border-[#141414] bg-white hover:bg-neutral-200 cursor-pointer"
                    aria-label="Close modal"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Efficiency Stats Ribbon */}
                <div className="bg-[#E4E3E0] border-b-2 border-[#141414] p-3 grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                  <div className="bg-white p-2 border border-[#141414]">
                    <span className="text-[10px] text-[#141414]/70 block font-bold">TOTAL WARNINGS:</span>
                    <strong className="text-sm font-black text-[#141414]">{warningItems.length} items</strong>
                  </div>
                  <div className="bg-white p-2 border border-[#141414]">
                    <span className="text-[10px] text-[#141414]/70 block font-bold">ESTIMATED TIME:</span>
                    <strong className="text-sm font-black text-amber-700">~{Math.max(10, warningItems.length * 3)} min</strong>
                  </div>
                  <div className="bg-white p-2 border border-[#141414]">
                    <span className="text-[10px] text-[#141414]/70 block font-bold">PROJECTED GAIN:</span>
                    <strong className="text-sm font-black text-emerald-700">+{warningItems.length * 3} to +{warningItems.length * 5} pts</strong>
                  </div>
                  <div className="bg-white p-2 border border-[#141414]">
                    <span className="text-[10px] text-[#141414]/70 block font-bold">COMPLETED:</span>
                    <strong className="text-sm font-black text-[#141414]">
                      {warningItems.filter(w => !!completedFixIds[w.id]).length}/{warningItems.length}
                    </strong>
                  </div>
                </div>

                {/* Modal Scrollable Body */}
                <div className="p-4 overflow-y-auto space-y-4 flex-1 bg-[#F2F1ED]">
                  {/* Strategy Tip Box */}
                  <div className="p-3 bg-white border-2 border-[#141414] shadow-[2px_2px_0px_#141414] text-xs space-y-1">
                    <span className="font-black uppercase text-[#141414] flex items-center gap-1.5 text-[11px]">
                      <Sparkles className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                      Batch Remediation Strategy
                    </span>
                    <p className="text-[#141414]/80 leading-relaxed text-[11px]">
                      By batching non-critical warnings into a single engineering session, you eliminate context switching and apply fixes across just 1 or 2 files (the HTML &lt;head&gt; and edge server configuration).
                    </p>
                  </div>

                  {/* Consolidated Snippets Section */}
                  {(consolidatedHtmlSnippet || consolidatedServerSnippet) && (
                    <div className="border-2 border-[#141414] bg-white p-3 shadow-[2px_2px_0px_#141414] space-y-3">
                      <div className="flex items-center justify-between border-b border-[#141414]/20 pb-2">
                        <span className="font-black text-xs uppercase flex items-center gap-1.5">
                          <FileCode2 className="h-4 w-4 text-[#141414]" />
                          Consolidated Code Blocks (Ready to Paste)
                        </span>
                      </div>

                      {consolidatedHtmlSnippet && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-blue-900 uppercase">1. Metadata Directives for &lt;head&gt; (HTML / index.html):</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(consolidatedHtmlSnippet);
                                setCopiedConsolidatedHtml(true);
                                setTimeout(() => setCopiedConsolidatedHtml(false), 2000);
                              }}
                              className="px-2 py-0.5 border border-[#141414] bg-[#E4E3E0] hover:bg-white text-[10px] font-bold uppercase cursor-pointer"
                            >
                              {copiedConsolidatedHtml ? 'COPIED!' : 'COPY HTML BLOCK'}
                            </button>
                          </div>
                          <pre className="p-2.5 bg-[#141414] text-amber-300 text-[10px] overflow-x-auto max-h-32 border border-[#141414]">
                            <code>{consolidatedHtmlSnippet}</code>
                          </pre>
                        </div>
                      )}

                      {consolidatedServerSnippet && (
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-[11px] font-bold">
                            <span className="text-emerald-900 uppercase">2. Edge & Server Directives (Nginx / Cloudflare):</span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(consolidatedServerSnippet);
                                setCopiedConsolidatedServer(true);
                                setTimeout(() => setCopiedConsolidatedServer(false), 2000);
                              }}
                              className="px-2 py-0.5 border border-[#141414] bg-[#E4E3E0] hover:bg-white text-[10px] font-bold uppercase cursor-pointer"
                            >
                              {copiedConsolidatedServer ? 'COPIED!' : 'COPY SERVER BLOCK'}
                            </button>
                          </div>
                          <pre className="p-2.5 bg-[#141414] text-emerald-300 text-[10px] overflow-x-auto max-h-32 border border-[#141414]">
                            <code>{consolidatedServerSnippet}</code>
                          </pre>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Tasks List */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-black uppercase text-[#141414] px-1">
                      <span>Session Non-Critical Tasks ({warningItems.length})</span>
                      <span className="text-[10px] font-normal text-[#141414]/70">Click checkbox to toggle</span>
                    </div>

                    <div className="space-y-2">
                      {warningItems.map((item, idx) => {
                        const isDone = !!completedFixIds[item.id];
                        return (
                          <div
                            key={item.id}
                            className={`p-3 border-2 transition-all flex items-start justify-between gap-3 ${
                              isDone
                                ? 'bg-emerald-50/60 border-emerald-700 opacity-80'
                                : 'bg-white border-[#141414] shadow-[2px_2px_0px_#141414]'
                            }`}
                          >
                            <div className="flex items-start gap-2.5 flex-1 min-w-0">
                              <button
                                type="button"
                                onClick={() => handleToggle(item.id)}
                                className="mt-0.5 shrink-0 text-[#141414] hover:scale-110 transition-transform cursor-pointer"
                              >
                                {isDone ? (
                                  <CheckSquare className="h-4.5 w-4.5 text-emerald-700 fill-emerald-100" />
                                ) : (
                                  <Square className="h-4.5 w-4.5 text-[#141414]/70 hover:text-[#141414]" />
                                )}
                              </button>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <span className="text-[9px] font-bold uppercase bg-amber-100 text-amber-950 border border-amber-500 px-1">
                                    {item.category.toUpperCase()}
                                  </span>
                                  <h4 className={`text-xs font-black truncate ${isDone ? 'line-through text-[#141414]/60' : 'text-[#141414]'}`}>
                                    {idx + 1}. {item.title}
                                  </h4>
                                </div>
                                <p className="text-[11px] text-[#141414]/70 mt-0.5 line-clamp-2">
                                  {item.recommendedValue || item.summary}
                                </p>
                              </div>
                            </div>

                            <div className="shrink-0 flex items-center gap-1.5">
                              {item.codeSnippet && (
                                <button
                                  type="button"
                                  onClick={() => handleCopySnippet(item)}
                                  className="p-1 border border-[#141414] bg-white hover:bg-neutral-100 text-[10px] font-bold cursor-pointer"
                                  title="Copy individual snippet"
                                >
                                  {copiedSnippetId === item.id ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() => {
                                  setShowBulkWarningModal(false);
                                  onGetAiFix(item);
                                }}
                                className="px-2 py-1 bg-amber-400 hover:bg-amber-300 border border-[#141414] text-[10px] font-black cursor-pointer uppercase flex items-center gap-1"
                              >
                                <Sparkles className="h-3 w-3" />
                                <span>AI</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Modal Footer Controls */}
                <div className="p-3 bg-[#E4E3E0] border-t-2 border-[#141414] flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <button
                    type="button"
                    onClick={exportBulkWarningMarkdown}
                    className="px-3 py-1.5 bg-white hover:bg-neutral-100 border-2 border-[#141414] text-xs font-black uppercase shadow-[2px_2px_0px_#141414] cursor-pointer flex items-center justify-center gap-1.5"
                  >
                    {copiedBulkMarkdown ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedBulkMarkdown ? 'CHECKLIST COPIED!' : 'COPY CHECKLIST (.MD)'}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleMarkAllWarningsCompleted}
                      className="px-3 py-1.5 bg-[#141414] hover:bg-black text-amber-300 border-2 border-[#141414] text-xs font-black uppercase shadow-[2px_2px_0px_#888888] cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <CheckCheck className="h-4 w-4" />
                      <span>MARK ALL AS RESOLVED</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </AnimatePresence>
  );
};
