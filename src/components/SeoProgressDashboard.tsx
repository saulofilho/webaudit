import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  Activity,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  Download,
  Copy,
  Check,
  Bot,
  Compass,
  FileText,
  Layers,
  ArrowRight,
  ShieldCheck,
  Award,
  Zap,
  SlidersHorizontal,
  ChevronRight,
  RotateCcw,
  Target,
  BarChart3,
  ListTodo,
} from 'lucide-react';
import { AuditReport, AuditItem, MetaTagsData } from '../types';
import {
  SEO_CHECKLIST_TASKS_DEF,
  ProgressTaskDef,
  TimelineMilestoneEvent,
  SeoPillarId,
  SEO_CHECKLIST_EVENT_NAME,
  loadChecklistOverrides,
  saveChecklistOverrides,
  loadTimelineEvents,
  saveTimelineEvents,
} from '../utils/seoProgressStorage';

interface SeoProgressDashboardProps {
  report: AuditReport;
  targetUrl?: string;
  onOpenChecklist?: () => void;
  onOpenAiFix?: (item: AuditItem) => void;
}

export const SeoProgressDashboard: React.FC<SeoProgressDashboardProps> = ({
  report,
  targetUrl: propUrl,
  onOpenChecklist,
  onOpenAiFix,
}) => {
  const targetUrl = propUrl || report?.targetUrl || 'https://example.com';

  const hostname = useMemo(() => {
    try {
      return new URL(targetUrl).hostname;
    } catch {
      return targetUrl;
    }
  }, [targetUrl]);

  const meta: MetaTagsData = report.rawData?.metaTags || {
    openGraph: {},
    twitter: {},
    structuredDataTypes: [],
  };

  // Baseline score from initial audit scan
  const baselineScore = useMemo(() => {
    return report.categories?.seo?.score ?? 60;
  }, [report]);

  // Local state for overrides and timeline logs
  const [manualChecks, setManualChecks] = useState<Record<string, boolean>>(() =>
    loadChecklistOverrides(hostname)
  );
  const [timelineEvents, setTimelineEvents] = useState<TimelineMilestoneEvent[]>(() =>
    loadTimelineEvents(hostname)
  );

  const [selectedPillarFilter, setSelectedPillarFilter] = useState<'all' | SeoPillarId>('all');
  const [filterMode, setFilterMode] = useState<'all' | 'completed' | 'projected'>('all');
  const [copiedReport, setCopiedReport] = useState<boolean>(false);
  const [showCelebration, setShowCelebration] = useState<boolean>(false);

  // Sync with checklist changes from other components / localStorage
  const refreshFromStorage = useCallback(() => {
    const updated = loadChecklistOverrides(hostname);
    setManualChecks(updated);
    const events = loadTimelineEvents(hostname);
    setTimelineEvents(events);
  }, [hostname]);

  useEffect(() => {
    refreshFromStorage();

    const handleSync = () => {
      refreshFromStorage();
    };

    window.addEventListener(SEO_CHECKLIST_EVENT_NAME, handleSync);
    window.addEventListener('storage', handleSync);

    return () => {
      window.removeEventListener(SEO_CHECKLIST_EVENT_NAME, handleSync);
      window.removeEventListener('storage', handleSync);
    };
  }, [refreshFromStorage]);

  // Evaluate initial automated pass status for each task based on scan data
  const initialAutoStatusMap = useMemo(() => {
    const titleLen = meta.titleLength || 0;
    const isTitleGood = titleLen >= 30 && titleLen <= 65;
    const descLen = meta.descriptionLength || 0;
    const isDescGood = descLen >= 120 && descLen <= 165;
    const hasCanonical = Boolean(meta.canonical && meta.canonical.startsWith('https://'));
    const robotsMeta = (meta.robots || '').toLowerCase();
    const isRobotsMetaGood = !robotsMeta.includes('noindex') && !robotsMeta.includes('nofollow');
    const hasViewport = Boolean(meta.viewport && meta.viewport.includes('width=device-width'));
    const hasSocial = Boolean(meta.openGraph?.image && meta.twitter?.card);
    const hasSchema = (meta.structuredDataTypes || []).length > 0;

    const items = report.items || [];
    const robotsItem = items.find((i) => i.id.includes('robots') || i.title.toLowerCase().includes('robots.txt'));
    const sitemapItem = items.find((i) => i.id.includes('sitemap') || i.title.toLowerCase().includes('sitemap'));

    const isRobotsGood = robotsItem ? robotsItem.severity === 'good' : true;
    const isSitemapGood = sitemapItem ? sitemapItem.severity === 'good' : true;

    return {
      'task-robots-accessible': isRobotsGood,
      'task-robots-sitemap-decl': isRobotsGood,
      'task-robots-ai-bots': true,
      'task-sitemap-presence': isSitemapGood,
      'task-sitemap-lastmod': isSitemapGood,
      'task-sitemap-console-submit': true,
      'task-meta-title': isTitleGood,
      'task-meta-description': isDescGood,
      'task-meta-canonical': hasCanonical,
      'task-meta-robots': isRobotsMetaGood,
      'task-meta-viewport': hasViewport,
      'task-meta-social-cards': hasSocial,
      'task-schema-ldjson': hasSchema,
      'task-schema-rich-snippets': hasSchema,
      'task-schema-syntax-validation': true,
    } as Record<string, boolean>;
  }, [meta, report.items]);

  // Determine effective status of each task
  const isTaskCompleted = useCallback(
    (taskId: string): boolean => {
      if (manualChecks[taskId] !== undefined) {
        return manualChecks[taskId];
      }
      return Boolean(initialAutoStatusMap[taskId]);
    },
    [manualChecks, initialAutoStatusMap]
  );

  // Calculate scores and progression
  const totalTasksCount = SEO_CHECKLIST_TASKS_DEF.length;

  const {
    completedTasks,
    pendingTasks,
    currentScore,
    scoreLift,
    remainingLift,
    pillarMetrics,
    estimatedMinutesSaved,
  } = useMemo(() => {
    let completedPts = 0;
    let totalPts = 0;
    let completedList: ProgressTaskDef[] = [];
    let pendingList: ProgressTaskDef[] = [];
    let timeSaved = 0;

    const pillars: Record<
      SeoPillarId,
      { total: number; completed: number; pointsTotal: number; pointsCompleted: number; name: string }
    > = {
      robots: { total: 0, completed: 0, pointsTotal: 0, pointsCompleted: 0, name: 'robots.txt' },
      sitemap: { total: 0, completed: 0, pointsTotal: 0, pointsCompleted: 0, name: 'sitemap.xml' },
      metatags: { total: 0, completed: 0, pointsTotal: 0, pointsCompleted: 0, name: 'Meta Tags' },
      schema: { total: 0, completed: 0, pointsTotal: 0, pointsCompleted: 0, name: 'Schema.org' },
    };

    SEO_CHECKLIST_TASKS_DEF.forEach((task) => {
      const isDone = isTaskCompleted(task.id);
      totalPts += task.points;
      pillars[task.pillar].total += 1;
      pillars[task.pillar].pointsTotal += task.points;

      if (isDone) {
        completedPts += task.points;
        completedList.push(task);
        pillars[task.pillar].completed += 1;
        pillars[task.pillar].pointsCompleted += task.points;
        timeSaved += task.estimatedMinutes;
      } else {
        pendingList.push(task);
      }
    });

    // Score progression formula:
    // Scale from baselineScore to 100 based on proportion of completed checklist points
    // When 100% of tasks are completed, score is 100.
    const progressRatio = totalPts > 0 ? completedPts / totalPts : 0;
    const computedScore = Math.min(100, Math.round(baselineScore + (100 - baselineScore) * progressRatio));
    const lift = Math.max(0, computedScore - baselineScore);
    const remaining = Math.max(0, 100 - computedScore);

    return {
      completedTasks: completedList,
      pendingTasks: pendingList,
      currentScore: computedScore,
      scoreLift: lift,
      remainingLift: remaining,
      pillarMetrics: pillars,
      estimatedMinutesSaved: timeSaved,
    };
  }, [isTaskCompleted, baselineScore]);

  // Construct Chronological Timeline Data & Chart Points
  const { chartTimelineData, chronologicalEvents } = useMemo(() => {
    const baseDate = new Date(report.analyzedAt || Date.now());

    // 1. Initial Baseline Scan milestone
    const events: TimelineMilestoneEvent[] = [
      {
        id: 'event-baseline',
        taskId: 'baseline-scan',
        taskTitle: 'Baseline Automated SEO Audit Completed',
        pillar: 'robots',
        pillarName: 'Initial Audit',
        priority: 'CRITICAL',
        pointsAdded: 0,
        scoreBefore: baselineScore,
        scoreAfter: baselineScore,
        timestamp: baseDate.toISOString(),
        type: 'baseline',
        notes: `Initial scan evaluated ${totalTasksCount} technical SEO parameters. Baseline Pillar Score established.`,
      },
    ];

    let runningScore = baselineScore;
    const remainingRange = 100 - baselineScore;
    const totalPtsSum = SEO_CHECKLIST_TASKS_DEF.reduce((acc, t) => acc + t.points, 0);

    // 2. Completed milestones
    completedTasks.forEach((task, index) => {
      // Calculate realistic point increment for this specific task
      const taskContribution = Math.round((task.points / totalPtsSum) * remainingRange);
      const prev = runningScore;
      runningScore = Math.min(100, runningScore + taskContribution);

      // Distribute timestamps progressively
      const eventTime = new Date(baseDate.getTime() + (index + 1) * 3 * 60 * 1000);

      events.push({
        id: `event-${task.id}`,
        taskId: task.id,
        taskTitle: task.title,
        pillar: task.pillar,
        pillarName: task.pillarName,
        priority: task.priority,
        pointsAdded: Math.max(1, runningScore - prev),
        scoreBefore: prev,
        scoreAfter: runningScore,
        timestamp: eventTime.toISOString(),
        type: 'task_completed',
        notes: task.recommendation,
      });
    });

    // 3. Projected milestones (Roadmap to 100)
    let projectedScore = runningScore;
    const projectedEvents: TimelineMilestoneEvent[] = [];

    pendingTasks.forEach((task, index) => {
      const taskContribution = Math.round((task.points / totalPtsSum) * remainingRange);
      const prev = projectedScore;
      projectedScore = Math.min(100, projectedScore + taskContribution);
      if (index === pendingTasks.length - 1) projectedScore = 100; // guarantee reaches 100

      const projectedTime = new Date(
        baseDate.getTime() + (completedTasks.length + index + 1) * 5 * 60 * 1000
      );

      projectedEvents.push({
        id: `proj-${task.id}`,
        taskId: task.id,
        taskTitle: task.title,
        pillar: task.pillar,
        pillarName: task.pillarName,
        priority: task.priority,
        pointsAdded: Math.max(1, projectedScore - prev),
        scoreBefore: prev,
        scoreAfter: projectedScore,
        timestamp: projectedTime.toISOString(),
        type: 'projected',
        notes: task.recommendation,
      });
    });

    // Recharts data format
    const chartPoints: Array<{
      stepIndex: number;
      label: string;
      milestone: string;
      actualScore: number | null;
      projectedScore: number | null;
      lift: number;
      pillar: string;
      timeFormatted: string;
      isCurrent: boolean;
      type: 'baseline' | 'task_completed' | 'projected';
    }> = [];

    // Add baseline
    chartPoints.push({
      stepIndex: 0,
      label: 'Initial Scan',
      milestone: 'Initial Scan',
      actualScore: baselineScore,
      projectedScore: baselineScore,
      lift: 0,
      pillar: 'Audit',
      timeFormatted: new Date(baseDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isCurrent: completedTasks.length === 0,
      type: 'baseline',
    });

    // Add completed tasks
    let stepCount = 1;
    events.slice(1).forEach((ev, i) => {
      const d = new Date(ev.timestamp);
      chartPoints.push({
        stepIndex: stepCount++,
        label: `#${i + 1} ${ev.taskTitle.split(' ')[0]}`,
        milestone: ev.taskTitle,
        actualScore: ev.scoreAfter,
        projectedScore: ev.scoreAfter,
        lift: ev.pointsAdded,
        pillar: ev.pillarName,
        timeFormatted: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isCurrent: i === events.length - 2 && pendingTasks.length > 0,
        type: 'task_completed',
      });
    });

    // Add projected tasks
    projectedEvents.forEach((proj, i) => {
      const d = new Date(proj.timestamp);
      chartPoints.push({
        stepIndex: stepCount++,
        label: `Projected #${i + 1}`,
        milestone: proj.taskTitle,
        actualScore: null, // no actual score yet
        projectedScore: proj.scoreAfter,
        lift: proj.pointsAdded,
        pillar: proj.pillarName,
        timeFormatted: d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isCurrent: false,
        type: 'projected',
      });
    });

    return {
      chartTimelineData: chartPoints,
      chronologicalEvents: [...events, ...projectedEvents],
    };
  }, [report.analyzedAt, baselineScore, completedTasks, pendingTasks, totalTasksCount]);

  // Handle toggling single task completion from dashboard
  const handleToggleTask = (taskId: string) => {
    const currentlyDone = isTaskCompleted(taskId);
    const updated = { ...manualChecks, [taskId]: !currentlyDone };
    setManualChecks(updated);
    saveChecklistOverrides(hostname, updated);

    if (!currentlyDone && currentScore >= 95) {
      setShowCelebration(true);
      setTimeout(() => setShowCelebration(false), 4000);
    }
  };

  // Quick Action: Complete next highest priority pending task
  const handleCompleteNextPriority = () => {
    if (pendingTasks.length === 0) return;
    const nextTask =
      pendingTasks.find((t) => t.priority === 'CRITICAL') ||
      pendingTasks.find((t) => t.priority === 'HIGH') ||
      pendingTasks[0];

    if (nextTask) {
      handleToggleTask(nextTask.id);
    }
  };

  // Mark all tasks completed (100% demo)
  const handleMarkAllDone = () => {
    const allDone: Record<string, boolean> = {};
    SEO_CHECKLIST_TASKS_DEF.forEach((t) => {
      allDone[t.id] = true;
    });
    setManualChecks(allDone);
    saveChecklistOverrides(hostname, allDone);
    setShowCelebration(true);
    setTimeout(() => setShowCelebration(false), 4500);
  };

  // Reset all to automated baseline
  const handleResetToBaseline = () => {
    setManualChecks({});
    try {
      localStorage.removeItem(`seo_audit_checklist_${hostname}`);
      localStorage.removeItem(`seo_progress_timeline_${hostname}`);
      window.dispatchEvent(
        new CustomEvent(SEO_CHECKLIST_EVENT_NAME, { detail: { hostname, state: {} } })
      );
    } catch (e) {
      console.warn('Failed reset', e);
    }
  };

  // Export progress timeline report in Markdown
  const handleExportMarkdown = () => {
    const lines = [
      `# SEO PROGRESS & SCORE TIMELINE REPORT`,
      `**Target Domain**: ${hostname} (${targetUrl})`,
      `**Generated At**: ${new Date().toLocaleString()}`,
      `**Baseline SEO Score**: ${baselineScore}/100`,
      `**Current Verified Score**: ${currentScore}/100 (+${scoreLift} pts)`,
      `**Completed Tasks**: ${completedTasks.length} / ${totalTasksCount} (${Math.round((completedTasks.length / totalTasksCount) * 100)}%)`,
      `**Estimated Engineering Time Invested**: ~${estimatedMinutesSaved} mins`,
      ``,
      `---`,
      `## 1. Pillar Score Breakdown`,
      `- **robots.txt Directives**: ${pillarMetrics.robots.completed}/${pillarMetrics.robots.total} tasks (${pillarMetrics.robots.pointsCompleted}/${pillarMetrics.robots.pointsTotal} pts)`,
      `- **XML Sitemap**: ${pillarMetrics.sitemap.completed}/${pillarMetrics.sitemap.total} tasks (${pillarMetrics.sitemap.pointsCompleted}/${pillarMetrics.sitemap.pointsTotal} pts)`,
      `- **Document Meta Tags**: ${pillarMetrics.metatags.completed}/${pillarMetrics.metatags.total} tasks (${pillarMetrics.metatags.pointsCompleted}/${pillarMetrics.metatags.pointsTotal} pts)`,
      `- **Schema.org JSON-LD**: ${pillarMetrics.schema.completed}/${pillarMetrics.schema.total} tasks (${pillarMetrics.schema.pointsCompleted}/${pillarMetrics.schema.pointsTotal} pts)`,
      ``,
      `---`,
      `## 2. Chronological Improvement Milestones`,
    ];

    chronologicalEvents.forEach((ev, i) => {
      const typeLabel = ev.type === 'baseline' ? '[BASELINE]' : ev.type === 'task_completed' ? '[VERIFIED]' : '[ROADMAP]';
      lines.push(
        `${i + 1}. **${typeLabel} ${ev.taskTitle}** (${ev.pillarName})`,
        `   - Priority: ${ev.priority} | Impact: +${ev.pointsAdded} pts | Score: ${ev.scoreBefore} → ${ev.scoreAfter}`,
        `   - Action: ${ev.notes || 'Verified according to technical SEO requirements.'}`
      );
    });

    const reportContent = lines.join('\n');
    navigator.clipboard.writeText(reportContent);
    setCopiedReport(true);
    setTimeout(() => setCopiedReport(false), 2500);
  };

  // Grade color
  const gradeColor =
    currentScore >= 90
      ? 'bg-emerald-400 text-neutral-900'
      : currentScore >= 75
      ? 'bg-blue-400 text-neutral-900'
      : currentScore >= 60
      ? 'bg-amber-400 text-neutral-900'
      : 'bg-red-400 text-neutral-900';

  const gradeLetter =
    currentScore >= 95
      ? 'A+'
      : currentScore >= 90
      ? 'A'
      : currentScore >= 80
      ? 'B'
      : currentScore >= 70
      ? 'C'
      : currentScore >= 60
      ? 'D'
      : 'F';

  // Filtered chronological events for display
  const filteredEvents = useMemo(() => {
    return chronologicalEvents.filter((ev) => {
      if (selectedPillarFilter !== 'all' && ev.pillar !== selectedPillarFilter && ev.type !== 'baseline') {
        return false;
      }
      if (filterMode === 'completed' && ev.type === 'projected') return false;
      if (filterMode === 'projected' && ev.type === 'task_completed') return false;
      return true;
    });
  }, [chronologicalEvents, selectedPillarFilter, filterMode]);

  // Milestone Achievements
  const achievements = useMemo(() => {
    return [
      {
        id: 'ach-first-step',
        title: 'Crawl Kickoff',
        desc: 'Completed at least 1 foundational checklist task',
        unlocked: completedTasks.length >= 1,
        icon: Zap,
      },
      {
        id: 'ach-robots',
        title: 'Crawl Budget Commander',
        desc: 'All robots.txt crawl directives fully configured',
        unlocked: pillarMetrics.robots.completed === pillarMetrics.robots.total && pillarMetrics.robots.total > 0,
        icon: Bot,
      },
      {
        id: 'ach-sitemap',
        title: 'Index Highway',
        desc: 'XML Sitemap endpoint and lastmod hygiene verified',
        unlocked: pillarMetrics.sitemap.completed === pillarMetrics.sitemap.total && pillarMetrics.sitemap.total > 0,
        icon: Compass,
      },
      {
        id: 'ach-meta',
        title: 'SERP Click Magnet',
        desc: 'All title, description, and canonical tags perfected',
        unlocked: pillarMetrics.metatags.completed === pillarMetrics.metatags.total && pillarMetrics.metatags.total > 0,
        icon: FileText,
      },
      {
        id: 'ach-schema',
        title: 'Rich Snippets Titan',
        desc: 'Valid Schema.org JSON-LD structured data embedded',
        unlocked: pillarMetrics.schema.completed === pillarMetrics.schema.total && pillarMetrics.schema.total > 0,
        icon: Layers,
      },
      {
        id: 'ach-titan',
        title: 'SEO Master (Score 90+)',
        desc: 'Pillar score achieved grade A organic visibility',
        unlocked: currentScore >= 90,
        icon: Award,
      },
    ];
  }, [completedTasks, pillarMetrics, currentScore]);

  return (
    <div className="border-2 border-[#141414] bg-[#f8f9fa] shadow-[4px_4px_0px_#141414] font-mono text-[#141414] overflow-hidden">
      {/* Top Banner Header */}
      <div className="bg-[#141414] text-white p-4 sm:p-5 border-b-2 border-[#141414]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-emerald-400 text-[#141414] px-2.5 py-0.5 text-xs font-black uppercase border border-[#141414] flex items-center gap-1.5">
                <Activity className="h-3.5 w-3.5" />
                TIMELINE ENGINE
              </span>
              <span className="bg-neutral-800 text-neutral-300 px-2 py-0.5 text-xs border border-neutral-700">
                HOST: {hostname}
              </span>
              {showCelebration && (
                <span className="bg-amber-300 text-[#141414] px-2 py-0.5 text-xs font-black uppercase animate-bounce flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  PERFECT SCORE UNLOCKED!
                </span>
              )}
            </div>
            <h3 className="text-lg sm:text-xl font-black uppercase tracking-tight text-white flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-400" />
              SEO Progress & Pillar Score Dashboard
            </h3>
            <p className="text-xs text-neutral-300 font-sans max-w-2xl">
              Visualizes the chronological progression of the <strong>SEO Pillar Score</strong> over time based on completed checklist tasks. Track impact deltas, crawl milestones, and projected roadmap to 100%.
            </p>
          </div>

          {/* Quick Action Toolbar */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto">
            <button
              type="button"
              onClick={refreshFromStorage}
              title="Re-sync with checklist localStorage"
              className="px-2.5 py-1.5 text-xs font-bold uppercase bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-600 cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Sync</span>
            </button>

            {pendingTasks.length > 0 && (
              <button
                type="button"
                onClick={handleCompleteNextPriority}
                title="Mark next highest priority task as completed"
                className="px-3 py-1.5 text-xs font-black uppercase bg-emerald-400 hover:bg-emerald-300 text-[#141414] border border-[#141414] shadow-[2px_2px_0px_#141414] cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <Zap className="h-3.5 w-3.5" />
                <span>Fix Next (+{pendingTasks[0]?.points || 8} pts)</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportMarkdown}
              className="px-2.5 py-1.5 text-xs font-bold uppercase bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-600 cursor-pointer flex items-center gap-1.5 transition-colors"
            >
              {copiedReport ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Download className="h-3.5 w-3.5" />}
              <span>{copiedReport ? 'Copied MD' : 'Export'}</span>
            </button>

            {onOpenChecklist && (
              <button
                type="button"
                onClick={onOpenChecklist}
                className="px-3 py-1.5 text-xs font-black uppercase bg-white hover:bg-neutral-100 text-[#141414] border border-[#141414] shadow-[2px_2px_0px_#141414] cursor-pointer flex items-center gap-1.5 transition-all"
              >
                <ListTodo className="h-3.5 w-3.5" />
                <span>Open Checklist</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hero KPI Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-white border-b-2 border-[#141414]">
        {/* Card 1: Current SEO Score */}
        <div className="border-2 border-[#141414] p-3.5 bg-neutral-50 shadow-[2px_2px_0px_#141414] relative overflow-hidden">
          <div className="text-[11px] font-bold uppercase text-neutral-500 mb-1 flex items-center justify-between">
            <span>Verified SEO Score</span>
            <span className={`px-1.5 py-0.2 text-[10px] font-black uppercase border border-[#141414] ${gradeColor}`}>
              GRADE {gradeLetter}
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-[#141414]">{currentScore}</span>
            <span className="text-xs text-neutral-500 font-bold">/ 100</span>
          </div>
          <div className="mt-2 flex items-center gap-1 text-[11px]">
            <span className="font-black text-emerald-700 bg-emerald-100 px-1 border border-emerald-400">
              +{scoreLift} PTS
            </span>
            <span className="text-neutral-500 text-[10px]">from initial scan</span>
          </div>
        </div>

        {/* Card 2: Initial Baseline Score */}
        <div className="border-2 border-[#141414] p-3.5 bg-neutral-50 shadow-[2px_2px_0px_#141414]">
          <div className="text-[11px] font-bold uppercase text-neutral-500 mb-1 flex items-center justify-between">
            <span>Baseline Scan</span>
            <span className="text-[10px] text-neutral-400 font-sans">Initial</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-neutral-700">{baselineScore}</span>
            <span className="text-xs text-neutral-500 font-bold">/ 100</span>
          </div>
          <div className="mt-2 text-[10px] text-neutral-500 truncate">
            {report.analyzedAt ? new Date(report.analyzedAt).toLocaleDateString() : 'Automated Run'}
          </div>
        </div>

        {/* Card 3: Checklist Tasks Progress */}
        <div className="border-2 border-[#141414] p-3.5 bg-neutral-50 shadow-[2px_2px_0px_#141414]">
          <div className="text-[11px] font-bold uppercase text-neutral-500 mb-1 flex items-center justify-between">
            <span>Checklist Tasks</span>
            <span className="text-[10px] font-bold text-neutral-600">
              {Math.round((completedTasks.length / totalTasksCount) * 100)}%
            </span>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl font-black text-[#141414]">{completedTasks.length}</span>
            <span className="text-xs text-neutral-500 font-bold">/ {totalTasksCount}</span>
          </div>
          <div className="mt-2 w-full bg-neutral-200 h-2 border border-[#141414] overflow-hidden">
            <div
              className="bg-emerald-500 h-full transition-all duration-500"
              style={{ width: `${(completedTasks.length / totalTasksCount) * 100}%` }}
            />
          </div>
        </div>

        {/* Card 4: Potential Score Remaining */}
        <div className="border-2 border-[#141414] p-3.5 bg-neutral-50 shadow-[2px_2px_0px_#141414]">
          <div className="text-[11px] font-bold uppercase text-neutral-500 mb-1 flex items-center justify-between">
            <span>Remaining Potential</span>
            <span className="text-[10px] text-neutral-400 font-sans">Target: 100</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-black text-amber-600">+{remainingLift}</span>
            <span className="text-xs text-neutral-500 font-bold">PTS</span>
          </div>
          <div className="mt-2 text-[10px] text-neutral-600 flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>~{estimatedMinutesSaved} min dev effort logged</span>
          </div>
        </div>
      </div>

      {/* Main Visual Timeline Chart Section */}
      <div className="p-4 sm:p-5 bg-white border-b-2 border-[#141414]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-[#141414]" />
              <h4 className="font-black text-sm uppercase text-[#141414]">
                Pillar Score Progression Timeline
              </h4>
            </div>
            <p className="text-xs text-neutral-500 font-sans">
              Visual curve tracking the SEO score rise from baseline through completed milestones to projected 100% target.
            </p>
          </div>

          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-emerald-500 border border-[#141414] inline-block" />
              <span className="text-neutral-700 font-bold">Verified Score</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-full bg-amber-400 border border-[#141414] inline-block" />
              <span className="text-neutral-700 font-bold">Projected Path</span>
            </div>
          </div>
        </div>

        {/* Recharts Area Chart */}
        <div className="h-64 sm:h-72 w-full border-2 border-[#141414] bg-neutral-50 p-2 sm:p-3 relative">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartTimelineData} margin={{ top: 15, right: 25, left: -10, bottom: 20 }}>
              <defs>
                <linearGradient id="seoScoreGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                </linearGradient>
                <linearGradient id="projectedGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="label"
                stroke="#141414"
                tick={{ fontSize: 10, fill: '#4b5563', fontFamily: 'monospace' }}
                interval={0}
                angle={-15}
                textAnchor="end"
                height={35}
              />
              <YAxis
                domain={[Math.max(0, Math.floor(baselineScore / 10) * 10 - 10), 100]}
                stroke="#141414"
                tick={{ fontSize: 11, fill: '#4b5563', fontFamily: 'monospace' }}
                tickFormatter={(val) => `${val}`}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="border-2 border-[#141414] bg-white p-2.5 shadow-[3px_3px_0px_#141414] font-mono text-xs max-w-xs">
                        <div className="font-black text-[#141414] border-b border-neutral-200 pb-1 mb-1.5 flex items-center justify-between">
                          <span>{data.milestone}</span>
                          <span
                            className={`px-1.5 py-0.5 text-[9px] uppercase font-black border border-[#141414] ${
                              data.type === 'task_completed'
                                ? 'bg-emerald-300'
                                : data.type === 'projected'
                                ? 'bg-amber-300'
                                : 'bg-neutral-200'
                            }`}
                          >
                            {data.type === 'projected' ? 'Roadmap' : data.type === 'baseline' ? 'Baseline' : 'Done'}
                          </span>
                        </div>
                        <div className="space-y-1 text-neutral-600">
                          <div className="flex justify-between">
                            <span>Pillar:</span>
                            <span className="font-bold text-[#141414]">{data.pillar}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Score:</span>
                            <span className="font-black text-emerald-600">
                              {data.actualScore !== null ? data.actualScore : `${data.projectedScore} (est.)`} / 100
                            </span>
                          </div>
                          {data.lift > 0 && (
                            <div className="flex justify-between">
                              <span>Impact Delta:</span>
                              <span className="font-bold text-emerald-700">+{data.lift} pts</span>
                            </div>
                          )}
                          <div className="flex justify-between text-[10px] text-neutral-400">
                            <span>Timestamp:</span>
                            <span>{data.timeFormatted}</span>
                          </div>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {/* Target 90+ reference line */}
              <ReferenceLine y={90} stroke="#10b981" strokeDasharray="3 3" label={{ value: 'Elite (90+)', position: 'insideTopRight', fill: '#059669', fontSize: 10, fontFamily: 'monospace' }} />
              <ReferenceLine y={baselineScore} stroke="#9ca3af" strokeDasharray="2 2" label={{ value: 'Baseline', position: 'insideBottomLeft', fill: '#6b7280', fontSize: 10, fontFamily: 'monospace' }} />

              {/* Area 1: Verified Actual Progression */}
              <Area
                type="monotone"
                dataKey="actualScore"
                stroke="#10b981"
                strokeWidth={3}
                fill="url(#seoScoreGradient)"
                activeDot={{ r: 6, fill: '#10b981', stroke: '#141414', strokeWidth: 2 }}
                connectNulls={false}
              />

              {/* Area 2: Projected Future Path */}
              <Area
                type="monotone"
                dataKey="projectedScore"
                stroke="#f59e0b"
                strokeWidth={2}
                strokeDasharray="4 4"
                fill="url(#projectedGradient)"
                activeDot={{ r: 5, fill: '#f59e0b', stroke: '#141414', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4 Pillar Breakdown Sub-Bars */}
      <div className="p-4 sm:p-5 bg-neutral-100 border-b-2 border-[#141414]">
        <div className="text-xs font-black uppercase text-neutral-600 mb-3 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Checklist Completion by Pillar Foundation
          </span>
          <span className="text-[10px] font-normal text-neutral-500 font-sans">
            Click any pillar to filter the timeline stream below
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Robots.txt */}
          <button
            type="button"
            onClick={() => setSelectedPillarFilter(selectedPillarFilter === 'robots' ? 'all' : 'robots')}
            className={`text-left p-3 border-2 border-[#141414] transition-all cursor-pointer ${
              selectedPillarFilter === 'robots' ? 'bg-amber-100 shadow-[3px_3px_0px_#141414]' : 'bg-white shadow-[2px_2px_0px_#141414] hover:bg-neutral-50'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs uppercase flex items-center gap-1.5">
                <Bot className="h-3.5 w-3.5 text-blue-600" />
                robots.txt
              </span>
              <span className="text-[11px] font-black text-neutral-700">
                {pillarMetrics.robots.completed}/{pillarMetrics.robots.total}
              </span>
            </div>
            <div className="w-full bg-neutral-200 h-2 border border-[#141414] overflow-hidden mb-1">
              <div
                className="bg-blue-500 h-full transition-all duration-300"
                style={{
                  width: `${pillarMetrics.robots.total > 0 ? (pillarMetrics.robots.completed / pillarMetrics.robots.total) * 100 : 0}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-neutral-500">
              <span>Weight: {pillarMetrics.robots.pointsTotal} pts</span>
              <span className="font-bold text-neutral-800">+{pillarMetrics.robots.pointsCompleted} pts</span>
            </div>
          </button>

          {/* Sitemap.xml */}
          <button
            type="button"
            onClick={() => setSelectedPillarFilter(selectedPillarFilter === 'sitemap' ? 'all' : 'sitemap')}
            className={`text-left p-3 border-2 border-[#141414] transition-all cursor-pointer ${
              selectedPillarFilter === 'sitemap' ? 'bg-amber-100 shadow-[3px_3px_0px_#141414]' : 'bg-white shadow-[2px_2px_0px_#141414] hover:bg-neutral-50'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs uppercase flex items-center gap-1.5">
                <Compass className="h-3.5 w-3.5 text-emerald-600" />
                sitemap.xml
              </span>
              <span className="text-[11px] font-black text-neutral-700">
                {pillarMetrics.sitemap.completed}/{pillarMetrics.sitemap.total}
              </span>
            </div>
            <div className="w-full bg-neutral-200 h-2 border border-[#141414] overflow-hidden mb-1">
              <div
                className="bg-emerald-500 h-full transition-all duration-300"
                style={{
                  width: `${pillarMetrics.sitemap.total > 0 ? (pillarMetrics.sitemap.completed / pillarMetrics.sitemap.total) * 100 : 0}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-neutral-500">
              <span>Weight: {pillarMetrics.sitemap.pointsTotal} pts</span>
              <span className="font-bold text-neutral-800">+{pillarMetrics.sitemap.pointsCompleted} pts</span>
            </div>
          </button>

          {/* Meta Tags */}
          <button
            type="button"
            onClick={() => setSelectedPillarFilter(selectedPillarFilter === 'metatags' ? 'all' : 'metatags')}
            className={`text-left p-3 border-2 border-[#141414] transition-all cursor-pointer ${
              selectedPillarFilter === 'metatags' ? 'bg-amber-100 shadow-[3px_3px_0px_#141414]' : 'bg-white shadow-[2px_2px_0px_#141414] hover:bg-neutral-50'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs uppercase flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-purple-600" />
                Meta Tags
              </span>
              <span className="text-[11px] font-black text-neutral-700">
                {pillarMetrics.metatags.completed}/{pillarMetrics.metatags.total}
              </span>
            </div>
            <div className="w-full bg-neutral-200 h-2 border border-[#141414] overflow-hidden mb-1">
              <div
                className="bg-purple-500 h-full transition-all duration-300"
                style={{
                  width: `${pillarMetrics.metatags.total > 0 ? (pillarMetrics.metatags.completed / pillarMetrics.metatags.total) * 100 : 0}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-neutral-500">
              <span>Weight: {pillarMetrics.metatags.pointsTotal} pts</span>
              <span className="font-bold text-neutral-800">+{pillarMetrics.metatags.pointsCompleted} pts</span>
            </div>
          </button>

          {/* Schema.org */}
          <button
            type="button"
            onClick={() => setSelectedPillarFilter(selectedPillarFilter === 'schema' ? 'all' : 'schema')}
            className={`text-left p-3 border-2 border-[#141414] transition-all cursor-pointer ${
              selectedPillarFilter === 'schema' ? 'bg-amber-100 shadow-[3px_3px_0px_#141414]' : 'bg-white shadow-[2px_2px_0px_#141414] hover:bg-neutral-50'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-bold text-xs uppercase flex items-center gap-1.5">
                <Layers className="h-3.5 w-3.5 text-amber-600" />
                Schema.org
              </span>
              <span className="text-[11px] font-black text-neutral-700">
                {pillarMetrics.schema.completed}/{pillarMetrics.schema.total}
              </span>
            </div>
            <div className="w-full bg-neutral-200 h-2 border border-[#141414] overflow-hidden mb-1">
              <div
                className="bg-amber-500 h-full transition-all duration-300"
                style={{
                  width: `${pillarMetrics.schema.total > 0 ? (pillarMetrics.schema.completed / pillarMetrics.schema.total) * 100 : 0}%`,
                }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-neutral-500">
              <span>Weight: {pillarMetrics.schema.pointsTotal} pts</span>
              <span className="font-bold text-neutral-800">+{pillarMetrics.schema.pointsCompleted} pts</span>
            </div>
          </button>
        </div>
      </div>

      {/* Unlockable Milestone Achievements */}
      <div className="p-4 sm:p-5 bg-white border-b-2 border-[#141414]">
        <div className="text-xs font-black uppercase text-neutral-600 mb-3 flex items-center gap-1.5">
          <Award className="h-4 w-4 text-amber-500" />
          <span>SEO Milestone Badges</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          {achievements.map((ach) => {
            const IconComp = ach.icon;
            return (
              <div
                key={ach.id}
                className={`p-2.5 border-2 border-[#141414] transition-all flex flex-col justify-between ${
                  ach.unlocked
                    ? 'bg-amber-50 shadow-[2px_2px_0px_#141414]'
                    : 'bg-neutral-100 opacity-60 border-dashed'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <IconComp className={`h-4 w-4 ${ach.unlocked ? 'text-amber-600' : 'text-neutral-400'}`} />
                    <span
                      className={`text-[9px] uppercase font-black px-1 border border-[#141414] ${
                        ach.unlocked ? 'bg-emerald-300 text-neutral-900' : 'bg-neutral-200 text-neutral-500'
                      }`}
                    >
                      {ach.unlocked ? 'UNLOCKED' : 'LOCKED'}
                    </span>
                  </div>
                  <h5 className="font-black text-xs text-[#141414] leading-tight mb-1">{ach.title}</h5>
                  <p className="text-[10px] text-neutral-500 font-sans leading-snug line-clamp-2">{ach.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive Chronological Timeline Stream */}
      <div className="p-4 sm:p-5 bg-neutral-50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="space-y-0.5">
            <h4 className="font-black text-sm uppercase text-[#141414] flex items-center gap-2">
              <Clock className="h-4 w-4 text-neutral-700" />
              Chronological SEO Improvement Feed
            </h4>
            <p className="text-xs text-neutral-500 font-sans">
              Log of each implemented fix with points impact and score delta. Click any pending task to mark as fixed.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <div className="flex items-center border border-[#141414] bg-white">
              <button
                type="button"
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 text-[11px] font-bold uppercase transition-colors cursor-pointer ${
                  filterMode === 'all' ? 'bg-[#141414] text-white' : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                All ({chronologicalEvents.length})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('completed')}
                className={`px-2.5 py-1 text-[11px] font-bold uppercase border-l border-[#141414] transition-colors cursor-pointer ${
                  filterMode === 'completed' ? 'bg-[#141414] text-white' : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                Done ({completedTasks.length + 1})
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('projected')}
                className={`px-2.5 py-1 text-[11px] font-bold uppercase border-l border-[#141414] transition-colors cursor-pointer ${
                  filterMode === 'projected' ? 'bg-[#141414] text-white' : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                Roadmap ({pendingTasks.length})
              </button>
            </div>

            {selectedPillarFilter !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedPillarFilter('all')}
                className="px-2 py-1 text-[11px] font-bold uppercase bg-amber-200 border border-[#141414] cursor-pointer hover:bg-amber-300"
              >
                Clear Pillar Filter: {selectedPillarFilter} ×
              </button>
            )}
          </div>
        </div>

        {/* Vertical Timeline Nodes */}
        <div className="relative border-l-2 border-[#141414] ml-3.5 sm:ml-4 pl-4 sm:pl-6 space-y-4 py-2">
          {filteredEvents.map((event, idx) => {
            const isBaseline = event.type === 'baseline';
            const isCompleted = event.type === 'task_completed';
            const isProjected = event.type === 'projected';

            return (
              <div key={event.id} className="relative group">
                {/* Node icon / connector */}
                <div
                  className={`absolute -left-[27px] sm:-left-[35px] top-1.5 h-6 w-6 sm:h-7 sm:w-7 rounded-full border-2 border-[#141414] flex items-center justify-center ${
                    isBaseline
                      ? 'bg-neutral-300 text-neutral-800'
                      : isCompleted
                      ? 'bg-emerald-400 text-neutral-900 shadow-[1px_1px_0px_#141414]'
                      : 'bg-white text-neutral-400 border-dashed'
                  }`}
                >
                  {isBaseline ? (
                    <Target className="h-3.5 w-3.5" />
                  ) : isCompleted ? (
                    <CheckCircle2 className="h-3.5 w-3.5" />
                  ) : (
                    <span className="text-[10px] font-black">{idx + 1}</span>
                  )}
                </div>

                {/* Event Card */}
                <div
                  className={`border-2 border-[#141414] p-3.5 transition-all ${
                    isBaseline
                      ? 'bg-neutral-100 shadow-[2px_2px_0px_#141414]'
                      : isCompleted
                      ? 'bg-white shadow-[3px_3px_0px_#141414]'
                      : 'bg-neutral-50/80 border-dashed opacity-85 hover:opacity-100 shadow-[1px_1px_0px_#141414]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2 py-0.5 text-[10px] font-black uppercase border border-[#141414] ${
                          isBaseline
                            ? 'bg-neutral-300 text-neutral-800'
                            : isCompleted
                            ? 'bg-emerald-300 text-neutral-900'
                            : 'bg-amber-200 text-neutral-800'
                        }`}
                      >
                        {isBaseline ? 'INITIAL SCAN' : isCompleted ? 'VERIFIED IMPROVEMENT' : 'ROADMAP TO 100'}
                      </span>

                      <span className="text-[10px] font-bold text-neutral-500 uppercase bg-neutral-200 px-1.5 py-0.5 border border-neutral-300">
                        {event.pillarName}
                      </span>

                      <span
                        className={`text-[9px] font-black uppercase px-1 py-0.2 border border-[#141414] ${
                          event.priority === 'CRITICAL'
                            ? 'bg-red-400 text-white'
                            : event.priority === 'HIGH'
                            ? 'bg-amber-400 text-neutral-900'
                            : 'bg-blue-300 text-neutral-900'
                        }`}
                      >
                        {event.priority}
                      </span>
                    </div>

                    {/* Score Progression Badge */}
                    <div className="flex items-center gap-2">
                      {event.pointsAdded > 0 && (
                        <span className="font-black text-xs text-emerald-700 bg-emerald-100 px-1.5 py-0.5 border border-emerald-400">
                          +{event.pointsAdded} PTS
                        </span>
                      )}
                      <span className="text-xs font-black bg-[#141414] text-white px-2 py-0.5 border border-[#141414]">
                        Score: {event.scoreBefore} → {event.scoreAfter}
                      </span>
                    </div>
                  </div>

                  <h5 className="font-black text-sm text-[#141414] mb-1">{event.taskTitle}</h5>
                  <p className="text-xs text-neutral-600 font-sans mb-3">{event.notes}</p>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-200 text-xs">
                    <span className="text-[10px] text-neutral-400 font-mono">
                      Timestamp: {new Date(event.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    <div className="flex items-center gap-2">
                      {!isBaseline && (
                        <button
                          type="button"
                          onClick={() => handleToggleTask(event.taskId)}
                          className={`px-2.5 py-1 text-xs font-black uppercase border border-[#141414] cursor-pointer transition-all flex items-center gap-1 ${
                            isCompleted
                              ? 'bg-neutral-200 hover:bg-neutral-300 text-neutral-800'
                              : 'bg-emerald-400 hover:bg-emerald-300 text-[#141414] shadow-[2px_2px_0px_#141414]'
                          }`}
                        >
                          {isCompleted ? (
                            <>
                              <RotateCcw className="h-3 w-3" />
                              <span>Mark Pending</span>
                            </>
                          ) : (
                            <>
                              <Check className="h-3 w-3" />
                              <span>Mark Completed (+{event.pointsAdded} pts)</span>
                            </>
                          )}
                        </button>
                      )}

                      {onOpenChecklist && (
                        <button
                          type="button"
                          onClick={onOpenChecklist}
                          className="px-2 py-1 text-[11px] font-bold uppercase text-neutral-700 hover:text-black flex items-center gap-0.5 cursor-pointer"
                        >
                          <span>View in Checklist</span>
                          <ChevronRight className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer Controls & Reset */}
      <div className="p-3 bg-neutral-200 border-t-2 border-[#141414] flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 text-neutral-600">
          <ShieldCheck className="h-4 w-4 text-emerald-600" />
          <span>Real-time bidirectional synchronization with SEO Checklist state in local storage.</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleMarkAllDone}
            className="px-2.5 py-1 text-xs font-bold uppercase bg-neutral-800 text-white hover:bg-black border border-[#141414] cursor-pointer"
          >
            Mark All Completed (100% Demo)
          </button>
          <button
            type="button"
            onClick={handleResetToBaseline}
            className="px-2.5 py-1 text-xs font-bold uppercase bg-white text-neutral-700 hover:bg-neutral-100 border border-[#141414] cursor-pointer"
          >
            Reset to Baseline Scan
          </button>
        </div>
      </div>
    </div>
  );
};
