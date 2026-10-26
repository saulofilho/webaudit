import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Bell,
  BellRing,
  Mail,
  Send,
  AlertTriangle,
  TrendingDown,
  TrendingUp,
  ShieldAlert,
  CheckCircle2,
  Calendar,
  Clock,
  Users,
  Target,
  Sliders,
  Sparkles,
  RefreshCw,
  Trash2,
  Plus,
  ExternalLink,
  ChevronRight,
  Eye,
  Settings,
  HelpCircle,
  FileText,
  Copy,
  Check,
  Zap,
} from 'lucide-react';
import {
  AuditReport,
  WeeklyCompetitorAlertConfig,
  CompetitorAlertDispatchLog,
  AlertDayOfWeek,
} from '../types';

interface WeeklyCompetitorAlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  report?: AuditReport | null;
  targetDomain?: string;
  competitors?: string[];
}

const STORAGE_KEY = 'webaudit_competitor_alerts_v1';
const LOG_STORAGE_KEY = 'webaudit_competitor_alert_logs_v1';

export const WeeklyCompetitorAlertModal: React.FC<WeeklyCompetitorAlertModalProps> = ({
  isOpen,
  onClose,
  report,
  targetDomain: propDomain,
  competitors: propCompetitors,
}) => {
  // Extract initial domain
  const domain = useMemo(() => {
    if (propDomain) return propDomain;
    if (report?.targetUrl) {
      try {
        return new URL(report.targetUrl).hostname.replace(/^www\./, '');
      } catch {
        return report.targetUrl.replace(/^https?:\/\//, '').split('/')[0] || 'example.com';
      }
    }
    return 'example.com';
  }, [propDomain, report]);

  // Default competitors
  const defaultCompetitors = useMemo(() => {
    if (propCompetitors && propCompetitors.length > 0) return propCompetitors;
    const root = domain.split('.')[0] || 'domain';
    return [`top-${root}.io`, `authority-${root}.com`, `apex-${root}.org`];
  }, [propCompetitors, domain]);

  // Tab state
  const [activeTab, setActiveTab] = useState<'config' | 'preview' | 'monitors'>('config');

  // Form State
  const [targetUrlInput, setTargetUrlInput] = useState<string>(domain);
  const [competitorsList, setCompetitorsList] = useState<string[]>(defaultCompetitors);
  const [newCompetitorInput, setNewCompetitorInput] = useState<string>('');
  
  // Recipients
  const [recipients, setRecipients] = useState<string[]>(['saulosilvaf@gmail.com']);
  const [newRecipientInput, setNewRecipientInput] = useState<string>('');

  // Triggers & Thresholds
  const [visibilityDropThreshold, setVisibilityDropThreshold] = useState<number>(5); // 5% drop
  const [competitorSurgeThreshold, setCompetitorSurgeThreshold] = useState<number>(3); // 3% surge
  const [top3DropCount, setTop3DropCount] = useState<number>(2); // 2 keywords dropped
  const [top10DropCount, setTop10DropCount] = useState<number>(4); // 4 keywords dropped
  const [alertOnPage1Exit, setAlertOnPage1Exit] = useState<boolean>(true);
  const [alertOnNetNegativeDrift, setAlertOnNetNegativeDrift] = useState<boolean>(true);

  // Delivery & Schedule
  const [dispatchDay, setDispatchDay] = useState<AlertDayOfWeek>('monday');
  const [dispatchTime, setDispatchTime] = useState<string>('08:00');
  const [webhookUrl, setWebhookUrl] = useState<string>('');

  // Enrichment features
  const [includeAiRootCause, setIncludeAiRootCause] = useState<boolean>(true);
  const [includePdfAttachment, setIncludePdfAttachment] = useState<boolean>(true);
  const [includeCompetitorGaps, setIncludeCompetitorGaps] = useState<boolean>(true);

  // UI state
  const [isSendingTest, setIsSendingTest] = useState<boolean>(false);
  const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'info' | 'error'; text: string } | null>(null);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Saved alerts list & logs
  const [savedAlerts, setSavedAlerts] = useState<WeeklyCompetitorAlertConfig[]>([]);
  const [dispatchLogs, setDispatchLogs] = useState<CompetitorAlertDispatchLog[]>([]);

  // Sync initial values on open or domain change
  useEffect(() => {
    if (isOpen) {
      setTargetUrlInput(domain);
      setCompetitorsList(defaultCompetitors);
      
      // Load saved configurations
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const list: WeeklyCompetitorAlertConfig[] = JSON.parse(stored);
          setSavedAlerts(list);
          const existing = list.find((a) => a.domain.toLowerCase() === domain.toLowerCase());
          if (existing) {
            setCompetitorsList(existing.competitors);
            setRecipients(existing.recipients.length > 0 ? existing.recipients : ['saulosilvaf@gmail.com']);
            setVisibilityDropThreshold(existing.visibilityDropThresholdPercent);
            setCompetitorSurgeThreshold(existing.competitorSurgeThresholdPercent);
            setTop3DropCount(existing.top3RankDropCount);
            setTop10DropCount(existing.top10RankDropCount);
            setAlertOnPage1Exit(existing.alertOnPage1Exit);
            setAlertOnNetNegativeDrift(existing.alertOnNetNegativeDrift);
            setDispatchDay(existing.dispatchDay);
            setDispatchTime(existing.dispatchTimeUtc);
            setIncludeAiRootCause(existing.includeAiRootCauseAnalysis);
            setIncludePdfAttachment(existing.includePdfAttachmentLink);
            setIncludeCompetitorGaps(existing.includeCompetitorGaps);
            setWebhookUrl(existing.webhookUrl || '');
          }
        } else {
          // Initialize default rule
          const initialRule: WeeklyCompetitorAlertConfig = {
            id: `alert-${Date.now()}`,
            domain,
            competitors: defaultCompetitors,
            enabled: true,
            recipients: ['saulosilvaf@gmail.com'],
            dispatchDay: 'monday',
            dispatchTimeUtc: '08:00',
            visibilityDropThresholdPercent: 5,
            competitorSurgeThresholdPercent: 3,
            top3RankDropCount: 2,
            top10RankDropCount: 4,
            alertOnPage1Exit: true,
            alertOnNetNegativeDrift: true,
            includeAiRootCauseAnalysis: true,
            includePdfAttachmentLink: true,
            includeCompetitorGaps: true,
            createdAt: new Date().toISOString(),
            lastEvaluatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            lastAlertSentAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'active',
          };
          setSavedAlerts([initialRule]);
          localStorage.setItem(STORAGE_KEY, JSON.stringify([initialRule]));
        }
      } catch {
        // ignore
      }

      // Load logs
      try {
        const storedLogs = localStorage.getItem(LOG_STORAGE_KEY);
        if (storedLogs) {
          setDispatchLogs(JSON.parse(storedLogs));
        } else {
          const sampleLogs: CompetitorAlertDispatchLog[] = [
            {
              id: 'log-1',
              timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
              domain,
              recipients: ['saulosilvaf@gmail.com'],
              triggerReason: 'Search Visibility dropped -6.8% while top 3 competitors surged +2.4%',
              visibilityChange: -6.8,
              competitorAvgChange: +2.4,
              top3Drops: 3,
              top10Drops: 5,
              status: 'delivered',
            },
            {
              id: 'log-2',
              timestamp: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
              domain,
              recipients: ['saulosilvaf@gmail.com'],
              triggerReason: 'Routine weekly check: Stable ranking variance (no threshold crossed)',
              visibilityChange: +1.2,
              competitorAvgChange: +0.8,
              top3Drops: 0,
              top10Drops: 1,
              status: 'simulated',
            },
          ];
          setDispatchLogs(sampleLogs);
          localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(sampleLogs));
        }
      } catch {
        // ignore
      }
    }
  }, [isOpen, domain, defaultCompetitors]);

  if (!isOpen) return null;

  // Add competitor
  const handleAddCompetitor = () => {
    const clean = newCompetitorInput.trim().replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    if (!clean) return;
    if (competitorsList.includes(clean)) {
      setFeedbackMessage({ type: 'error', text: 'Competitor is already in the tracking list.' });
      return;
    }
    setCompetitorsList([...competitorsList, clean]);
    setNewCompetitorInput('');
  };

  const handleRemoveCompetitor = (c: string) => {
    if (competitorsList.length <= 1) {
      setFeedbackMessage({ type: 'error', text: 'You must track at least 1 competitor.' });
      return;
    }
    setCompetitorsList(competitorsList.filter((item) => item !== c));
  };

  // Add recipient
  const handleAddRecipient = () => {
    const email = newRecipientInput.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) return;
    if (!emailRegex.test(email)) {
      setFeedbackMessage({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }
    if (recipients.includes(email)) {
      setFeedbackMessage({ type: 'error', text: 'Email is already in the recipients list.' });
      return;
    }
    setRecipients([...recipients, email]);
    setNewRecipientInput('');
  };

  const handleRemoveRecipient = (email: string) => {
    if (recipients.length <= 1) {
      setFeedbackMessage({ type: 'error', text: 'At least one notification email is required.' });
      return;
    }
    setRecipients(recipients.filter((r) => r !== email));
  };

  // Save Alert Configuration
  const handleSaveConfig = () => {
    const config: WeeklyCompetitorAlertConfig = {
      id: `alert-${targetUrlInput.replace(/[^a-zA-Z0-9]/g, '-')}`,
      domain: targetUrlInput,
      competitors: competitorsList,
      enabled: true,
      recipients: recipients.length > 0 ? recipients : ['saulosilvaf@gmail.com'],
      dispatchDay,
      dispatchTimeUtc: dispatchTime,
      visibilityDropThresholdPercent: visibilityDropThreshold,
      competitorSurgeThresholdPercent: competitorSurgeThreshold,
      top3RankDropCount: top3DropCount,
      top10RankDropCount: top10DropCount,
      alertOnPage1Exit,
      alertOnNetNegativeDrift,
      includeAiRootCauseAnalysis: includeAiRootCause,
      includePdfAttachmentLink: includePdfAttachment,
      includeCompetitorGaps: includeCompetitorGaps,
      webhookUrl: webhookUrl.trim() || undefined,
      createdAt: new Date().toISOString(),
      lastEvaluatedAt: new Date().toISOString(),
      status: 'active',
    };

    const updated = [config, ...savedAlerts.filter((a) => a.domain.toLowerCase() !== targetUrlInput.toLowerCase())];
    setSavedAlerts(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    setFeedbackMessage({
      type: 'success',
      text: `Alert monitor successfully configured for ${targetUrlInput}! Weekly audits will run every ${dispatchDay.toUpperCase()} at ${dispatchTime} UTC.`,
    });
    setTimeout(() => setFeedbackMessage(null), 5000);
  };

  // Trigger Instant Test Email Dispatch Simulation
  const handleSendTestAlert = () => {
    setIsSendingTest(true);
    setFeedbackMessage(null);

    setTimeout(() => {
      setIsSendingTest(false);
      const newLog: CompetitorAlertDispatchLog = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        domain: targetUrlInput,
        recipients,
        triggerReason: `[TEST TRIGGER] Simulated drop: -${visibilityDropThreshold + 2.4}% Visibility drop vs Top 3 Competitors`,
        visibilityChange: -(visibilityDropThreshold + 2.4),
        competitorAvgChange: +competitorSurgeThreshold + 0.6,
        top3Drops: top3DropCount + 1,
        top10Drops: top10DropCount + 2,
        status: 'delivered',
      };

      const updatedLogs = [newLog, ...dispatchLogs];
      setDispatchLogs(updatedLogs);
      try {
        localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(updatedLogs));
      } catch {
        // ignore
      }

      setFeedbackMessage({
        type: 'success',
        text: `Test Alert successfully delivered to: ${recipients.join(', ')}! Check the "Live Email Preview" tab to review the exact HTML email content.`,
      });
      setActiveTab('preview');
    }, 1200);
  };

  // Toggle rule status
  const handleToggleRuleStatus = (id: string) => {
    const updated = savedAlerts.map((a) => {
      if (a.id === id) {
        return {
          ...a,
          enabled: !a.enabled,
          status: (a.enabled ? 'paused' : 'active') as 'active' | 'paused',
        };
      }
      return a;
    });
    setSavedAlerts(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const handleDeleteRule = (id: string) => {
    const updated = savedAlerts.filter((a) => a.id !== id);
    setSavedAlerts(updated);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-[#E4E3E0] border-4 border-[#141414] shadow-[8px_8px_0px_#141414] font-mono text-[#141414] overflow-hidden"
        role="dialog"
        aria-labelledby="alert-modal-title"
      >
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 bg-[#141414] text-white flex items-center justify-between border-b-2 border-[#141414] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500 text-white border-2 border-white shadow-[2px_2px_0px_white]">
              <BellRing className="h-5 w-5 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="px-1.5 py-0.5 text-[9px] font-black uppercase bg-rose-500 text-white tracking-widest">
                  AUTOMATED INTELLIGENCE
                </span>
                <span className="px-1.5 py-0.5 text-[9px] font-black uppercase bg-amber-400 text-[#141414] tracking-widest">
                  WEEKLY SERP CRAWLER
                </span>
              </div>
              <h2 id="alert-modal-title" className="text-base sm:text-lg font-black uppercase tracking-tight flex items-center gap-2 mt-0.5">
                Automated Weekly Competitor Drop Email Alerts
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
            className="p-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white border border-neutral-600 cursor-pointer transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white border-b-2 border-[#141414] px-4 flex items-center justify-between overflow-x-auto shrink-0">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('config')}
              className={`py-3 px-3 sm:px-4 text-xs font-black uppercase border-b-4 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'config'
                  ? 'border-[#141414] text-[#141414] bg-neutral-100'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Sliders className="h-4 w-4 text-indigo-600" />
              <span>Configure Drop Rules</span>
            </button>

            <button
              onClick={() => setActiveTab('preview')}
              className={`py-3 px-3 sm:px-4 text-xs font-black uppercase border-b-4 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'preview'
                  ? 'border-[#141414] text-[#141414] bg-neutral-100'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Eye className="h-4 w-4 text-emerald-600" />
              <span>Live Email Preview</span>
              <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 border border-emerald-400 text-[9px] font-bold">
                HTML
              </span>
            </button>

            <button
              onClick={() => setActiveTab('monitors')}
              className={`py-3 px-3 sm:px-4 text-xs font-black uppercase border-b-4 transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'monitors'
                  ? 'border-[#141414] text-[#141414] bg-neutral-100'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900'
              }`}
            >
              <Calendar className="h-4 w-4 text-amber-600" />
              <span>Active Monitors & Logs</span>
              <span className="px-1.5 py-0.2 bg-amber-100 text-amber-800 border border-amber-400 text-[9px] font-bold">
                {savedAlerts.length}
              </span>
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 text-[11px] text-neutral-500 font-sans">
            <Clock className="h-3.5 w-3.5" />
            <span>Weekly CRON: Every {dispatchDay.toUpperCase()} 08:00 UTC</span>
          </div>
        </div>

        {/* Feedback message banner */}
        {feedbackMessage && (
          <div
            className={`p-3 text-xs font-bold border-b-2 border-[#141414] flex items-center justify-between ${
              feedbackMessage.type === 'success'
                ? 'bg-emerald-100 text-emerald-900'
                : feedbackMessage.type === 'error'
                ? 'bg-rose-100 text-rose-900'
                : 'bg-indigo-100 text-indigo-900'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedbackMessage.type === 'success' ? (
                <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-rose-700 shrink-0" />
              )}
              <span>{feedbackMessage.text}</span>
            </div>
            <button
              onClick={() => setFeedbackMessage(null)}
              className="text-xs uppercase underline cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Tab 1: Alert Configuration */}
        {activeTab === 'config' && (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-white">
            {/* Context callout */}
            <div className="p-3.5 bg-neutral-50 border-2 border-[#141414] shadow-[2px_2px_0px_#141414] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black uppercase text-[#141414]">Monitored Target Domain</span>
                  <span className="px-1.5 py-0.2 bg-emerald-200 text-emerald-900 border border-emerald-500 text-[10px] font-black">
                    LIVE
                  </span>
                </div>
                <div className="text-sm font-black text-indigo-600 font-mono flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-[#141414]" />
                  <span>{targetUrlInput}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleSendTestAlert}
                  disabled={isSendingTest}
                  className="px-3 py-1.5 text-xs font-black uppercase bg-rose-500 hover:bg-rose-400 text-white border-2 border-[#141414] shadow-[2px_2px_0px_#141414] cursor-pointer flex items-center gap-1.5 transition-transform active:translate-y-0.5"
                >
                  <Send className={`h-3.5 w-3.5 ${isSendingTest ? 'animate-spin' : ''}`} />
                  <span>{isSendingTest ? 'Simulating Dispatch...' : 'Send Test Alert'}</span>
                </button>
              </div>
            </div>

            {/* Tracked Competitors List */}
            <div className="border-2 border-[#141414] p-4 bg-amber-50/40 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase text-[#141414] flex items-center gap-1.5">
                    <Users className="h-4 w-4 text-amber-600" />
                    Tracked Competitor Domains ({competitorsList.length})
                  </h3>
                  <p className="text-[11px] text-neutral-600 font-sans mt-0.5">
                    The alert compares your domain's Search Visibility & Keyword Rank Distribution against the average of these competitors.
                  </p>
                </div>
              </div>

              {/* Chips */}
              <div className="flex flex-wrap items-center gap-2">
                {competitorsList.map((comp, idx) => (
                  <div
                    key={comp}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-[#141414] text-xs font-bold text-[#141414] shadow-[1px_1px_0px_#141414]"
                  >
                    <span className="text-[10px] text-neutral-400">#{idx + 1}</span>
                    <span>{comp}</span>
                    <button
                      type="button"
                      onClick={() => handleRemoveCompetitor(comp)}
                      title="Remove competitor"
                      className="text-neutral-400 hover:text-rose-600 cursor-pointer ml-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Add Competitor input */}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={newCompetitorInput}
                  onChange={(e) => setNewCompetitorInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCompetitor();
                    }
                  }}
                  placeholder="e.g. competitor-leader.com"
                  className="flex-1 bg-white border-2 border-[#141414] px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
                <button
                  type="button"
                  onClick={handleAddCompetitor}
                  className="px-3 py-1.5 text-xs font-black uppercase bg-[#141414] text-white hover:bg-neutral-800 border-2 border-[#141414] cursor-pointer flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>

            {/* Drop Sensitivity & Triggers Grid */}
            <div className="space-y-4">
              <div className="border-b-2 border-[#141414] pb-2 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase text-[#141414] flex items-center gap-1.5">
                    <ShieldAlert className="h-4 w-4 text-rose-500" />
                    Drop Sensitivity & Alert Thresholds
                  </h3>
                  <p className="text-[11px] text-neutral-600 font-sans">
                    Configure the exact drop conditions that trigger an automated weekly email alert.
                  </p>
                </div>
                <span className="text-[10px] font-bold uppercase bg-rose-100 text-rose-800 px-2 py-0.5 border border-rose-300">
                  Critical Safeguards
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Search Visibility Drop Threshold */}
                <div className="p-4 bg-neutral-50 border-2 border-[#141414] shadow-[2px_2px_0px_#141414] space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-black uppercase text-[#141414] flex items-center gap-1">
                        <TrendingDown className="h-3.5 w-3.5 text-rose-600" />
                        Search Visibility Drop Threshold
                      </div>
                      <p className="text-[11px] text-neutral-600 font-sans mt-0.5">
                        Trigger alert if your organic visibility % falls by this margin within a 7-day crawl window.
                      </p>
                    </div>
                    <div className="px-2 py-1 bg-rose-500 text-white font-mono font-black text-sm border border-[#141414]">
                      ≥ {visibilityDropThreshold}%
                    </div>
                  </div>

                  <input
                    type="range"
                    min="2"
                    max="20"
                    step="1"
                    value={visibilityDropThreshold}
                    onChange={(e) => setVisibilityDropThreshold(Number(e.target.value))}
                    className="w-full accent-rose-600 cursor-pointer"
                  />

                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500">
                    <span>2% (High Sensitivity)</span>
                    <span>5% (Recommended)</span>
                    <span>15%+ (Severe Drop)</span>
                  </div>

                  <div className="flex gap-1.5 pt-1">
                    {[3, 5, 8, 10, 15].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setVisibilityDropThreshold(pct)}
                        className={`flex-1 py-1 text-[10px] font-bold border ${
                          visibilityDropThreshold === pct
                            ? 'bg-[#141414] text-white border-[#141414]'
                            : 'bg-white hover:bg-neutral-100 text-[#141414] border-neutral-300'
                        }`}
                      >
                        {pct}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Competitor Surge Divergence */}
                <div className="p-4 bg-neutral-50 border-2 border-[#141414] shadow-[2px_2px_0px_#141414] space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-xs font-black uppercase text-[#141414] flex items-center gap-1">
                        <TrendingUp className="h-3.5 w-3.5 text-amber-600" />
                        Competitor Surge Margin
                      </div>
                      <p className="text-[11px] text-neutral-600 font-sans mt-0.5">
                        Trigger alert if competitors average visibility increases while your domain drops or remains stagnant.
                      </p>
                    </div>
                    <div className="px-2 py-1 bg-amber-400 text-[#141414] font-mono font-black text-sm border border-[#141414]">
                      + {competitorSurgeThreshold}%
                    </div>
                  </div>

                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={competitorSurgeThreshold}
                    onChange={(e) => setCompetitorSurgeThreshold(Number(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />

                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-500">
                    <span>+1% (Immediate gap)</span>
                    <span>+3% (Standard)</span>
                    <span>+5%+ (Market share shift)</span>
                  </div>

                  <div className="flex gap-1.5 pt-1">
                    {[2, 3, 5, 7].map((pct) => (
                      <button
                        key={pct}
                        type="button"
                        onClick={() => setCompetitorSurgeThreshold(pct)}
                        className={`flex-1 py-1 text-[10px] font-bold border ${
                          competitorSurgeThreshold === pct
                            ? 'bg-[#141414] text-white border-[#141414]'
                            : 'bg-white hover:bg-neutral-100 text-[#141414] border-neutral-300'
                        }`}
                      >
                        +{pct}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Keyword Rank Drop Thresholds */}
                <div className="p-4 bg-neutral-50 border-2 border-[#141414] shadow-[2px_2px_0px_#141414] space-y-3">
                  <div className="text-xs font-black uppercase text-[#141414] flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-indigo-600" />
                    Top 1–3 Positions Drop Threshold
                  </div>
                  <p className="text-[11px] text-neutral-600 font-sans">
                    Alert if this many elite commercial keywords drop out of positions 1 through 3 to lower ranks.
                  </p>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold">Lost Top 1-3 keywords:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setTop3DropCount(Math.max(1, top3DropCount - 1))}
                        className="w-7 h-7 bg-white hover:bg-neutral-200 border border-[#141414] font-black text-sm cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-3 py-1 bg-white border border-[#141414] font-black text-sm">
                        ≥ {top3DropCount}
                      </span>
                      <button
                        type="button"
                        onClick={() => setTop3DropCount(top3DropCount + 1)}
                        className="w-7 h-7 bg-white hover:bg-neutral-200 border border-[#141414] font-black text-sm cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* Top 4-10 (Page 1) Drop Threshold */}
                <div className="p-4 bg-neutral-50 border-2 border-[#141414] shadow-[2px_2px_0px_#141414] space-y-3">
                  <div className="text-xs font-black uppercase text-[#141414] flex items-center gap-1.5">
                    <Target className="h-3.5 w-3.5 text-indigo-600" />
                    Top 4–10 (Page 1) Drop Threshold
                  </div>
                  <p className="text-[11px] text-neutral-600 font-sans">
                    Alert if this many Page 1 rankings slip off the first page of Google SERPs (positions 11+).
                  </p>

                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-bold">Lost Page 1 keywords:</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setTop10DropCount(Math.max(1, top10DropCount - 1))}
                        className="w-7 h-7 bg-white hover:bg-neutral-200 border border-[#141414] font-black text-sm cursor-pointer"
                      >
                        -
                      </button>
                      <span className="px-3 py-1 bg-white border border-[#141414] font-black text-sm">
                        ≥ {top10DropCount}
                      </span>
                      <button
                        type="button"
                        onClick={() => setTop10DropCount(top10DropCount + 1)}
                        className="w-7 h-7 bg-white hover:bg-neutral-200 border border-[#141414] font-black text-sm cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Checkbox triggers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <label className="flex items-start gap-2.5 p-3 bg-neutral-50 border border-neutral-300 hover:border-[#141414] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alertOnPage1Exit}
                    onChange={(e) => setAlertOnPage1Exit(e.target.checked)}
                    className="mt-0.5 accent-rose-600 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-black uppercase block">Alert on High-Priority Page 1 Exit</span>
                    <span className="text-[11px] text-neutral-600 font-sans block">
                      Dispatches immediate high-priority warning if any starred keyword loses Page 1 status.
                    </span>
                  </div>
                </label>

                <label className="flex items-start gap-2.5 p-3 bg-neutral-50 border border-neutral-300 hover:border-[#141414] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={alertOnNetNegativeDrift}
                    onChange={(e) => setAlertOnNetNegativeDrift(e.target.checked)}
                    className="mt-0.5 accent-rose-600 cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-black uppercase block">Alert on Net Downward Drift</span>
                    <span className="text-[11px] text-neutral-600 font-sans block">
                      Trigger if total weekly ranking drops outnumber gains by a 2:1 ratio.
                    </span>
                  </div>
                </label>
              </div>
            </div>

            {/* Email Recipients & Schedule */}
            <div className="space-y-4 pt-2">
              <div className="border-b-2 border-[#141414] pb-2">
                <h3 className="text-xs font-black uppercase text-[#141414] flex items-center gap-1.5">
                  <Mail className="h-4 w-4 text-emerald-600" />
                  Email Recipients & Notification Schedule
                </h3>
                <p className="text-[11px] text-neutral-600 font-sans">
                  Choose who receives the alert and which day automated weekly audits take place.
                </p>
              </div>

              {/* Email Chips */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-[#141414] block">
                  Alert Recipients ({recipients.length})
                </label>
                <div className="flex flex-wrap items-center gap-2">
                  {recipients.map((email) => (
                    <div
                      key={email}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50 border-2 border-indigo-600 text-indigo-900 text-xs font-bold font-mono shadow-[1px_1px_0px_#141414]"
                    >
                      <Mail className="h-3 w-3 text-indigo-600" />
                      <span>{email}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveRecipient(email)}
                        className="text-indigo-400 hover:text-rose-600 cursor-pointer ml-1"
                        title="Remove recipient"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="email"
                    value={newRecipientInput}
                    onChange={(e) => setNewRecipientInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddRecipient();
                      }
                    }}
                    placeholder="Add team email (e.g. seo-lead@company.com)"
                    className="flex-1 bg-white border-2 border-[#141414] px-3 py-1.5 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <button
                    type="button"
                    onClick={handleAddRecipient}
                    className="px-3 py-1.5 text-xs font-black uppercase bg-[#141414] text-white hover:bg-neutral-800 border-2 border-[#141414] cursor-pointer flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add Email</span>
                  </button>
                </div>
              </div>

              {/* Schedule Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                <div className="p-3 bg-neutral-50 border border-neutral-300 space-y-1.5">
                  <label className="text-xs font-bold uppercase text-[#141414] block flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-indigo-600" />
                    Audit Day of Week
                  </label>
                  <select
                    value={dispatchDay}
                    onChange={(e) => setDispatchDay(e.target.value as AlertDayOfWeek)}
                    className="w-full bg-white border-2 border-[#141414] px-2.5 py-1.5 text-xs font-bold uppercase cursor-pointer"
                  >
                    <option value="monday">Every Monday (Recommended for Weekly Sprint)</option>
                    <option value="tuesday">Every Tuesday</option>
                    <option value="wednesday">Every Wednesday</option>
                    <option value="thursday">Every Thursday</option>
                    <option value="friday">Every Friday (End of Week Digest)</option>
                    <option value="saturday">Every Saturday</option>
                    <option value="sunday">Every Sunday</option>
                  </select>
                </div>

                <div className="p-3 bg-neutral-50 border border-neutral-300 space-y-1.5">
                  <label className="text-xs font-bold uppercase text-[#141414] block flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-indigo-600" />
                    Dispatch Time (UTC)
                  </label>
                  <select
                    value={dispatchTime}
                    onChange={(e) => setDispatchTime(e.target.value)}
                    className="w-full bg-white border-2 border-[#141414] px-2.5 py-1.5 text-xs font-bold cursor-pointer"
                  >
                    <option value="06:00">06:00 AM UTC (Early Morning)</option>
                    <option value="08:00">08:00 AM UTC (Standard Start of Business)</option>
                    <option value="12:00">12:00 PM UTC (Midday)</option>
                    <option value="18:00">18:00 PM UTC (End of Day)</option>
                  </select>
                </div>
              </div>

              {/* Optional Webhook */}
              <div className="p-3 bg-neutral-50 border border-neutral-300 space-y-1.5">
                <label className="text-xs font-bold uppercase text-[#141414] flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5 text-amber-600" />
                    Optional Team Webhook (Slack / Discord / Teams)
                  </span>
                  <span className="text-[10px] text-neutral-500 font-normal">Optional</span>
                </label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://hooks.slack.com/services/..."
                  className="w-full bg-white border-2 border-[#141414] px-3 py-1.5 text-xs font-mono focus:outline-none"
                />
              </div>

              {/* Digest Features Toggles */}
              <div className="p-3.5 bg-neutral-100 border-2 border-[#141414] space-y-2">
                <span className="text-xs font-black uppercase text-[#141414] block">
                  Email Content Inclusions
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeAiRootCause}
                      onChange={(e) => setIncludeAiRootCause(e.target.checked)}
                      className="accent-[#141414]"
                    />
                    <span>AI Root-Cause Analysis</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includeCompetitorGaps}
                      onChange={(e) => setIncludeCompetitorGaps(e.target.checked)}
                      className="accent-[#141414]"
                    />
                    <span>Competitor Gap Matrix</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs font-bold cursor-pointer">
                    <input
                      type="checkbox"
                      checked={includePdfAttachment}
                      onChange={(e) => setIncludePdfAttachment(e.target.checked)}
                      className="accent-[#141414]"
                    />
                    <span>PDF Executive Report</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Bottom Actions Bar */}
            <div className="pt-4 border-t-2 border-[#141414] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-neutral-600 font-sans">
                Next automated check scheduled for:{' '}
                <strong className="text-[#141414] font-mono font-bold">
                  Next {dispatchDay.toUpperCase()} at {dispatchTime} UTC
                </strong>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={handleSendTestAlert}
                  disabled={isSendingTest}
                  className="flex-1 sm:flex-none px-3.5 py-2 text-xs font-black uppercase bg-white hover:bg-neutral-100 text-[#141414] border-2 border-[#141414] shadow-[2px_2px_0px_#141414] cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5 text-rose-600" />
                  <span>Send Test Alert</span>
                </button>

                <button
                  type="button"
                  onClick={handleSaveConfig}
                  className="flex-1 sm:flex-none px-5 py-2 text-xs font-black uppercase bg-emerald-400 hover:bg-emerald-300 text-[#141414] border-2 border-[#141414] shadow-[2px_2px_0px_#141414] cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="h-4 w-4" />
                  <span>Save Alert Rules</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Live Email Alert Preview */}
        {activeTab === 'preview' && (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-4 flex-1 bg-neutral-200">
            {/* Top Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-white border-2 border-[#141414] shadow-[2px_2px_0px_#141414] text-xs">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-rose-500 text-white font-black uppercase text-[10px]">
                  PREVIEW MODE
                </span>
                <span className="text-neutral-600 font-sans">
                  Simulating alert dispatch to:{' '}
                  <strong className="text-[#141414] font-mono">{recipients[0] || 'saulosilvaf@gmail.com'}</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `[URGENT SEO ALERT] Significant Visibility Drop Detected for ${targetUrlInput} vs Top 3 Competitors`
                    );
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="px-2.5 py-1 text-[11px] font-bold uppercase bg-neutral-100 hover:bg-neutral-200 border border-[#141414] cursor-pointer flex items-center gap-1"
                >
                  {copiedLink ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3" />}
                  <span>{copiedLink ? 'Copied' : 'Copy Subject'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleSendTestAlert}
                  disabled={isSendingTest}
                  className="px-3 py-1 text-[11px] font-black uppercase bg-rose-500 hover:bg-rose-400 text-white border border-[#141414] cursor-pointer flex items-center gap-1"
                >
                  <Send className="h-3 w-3" />
                  <span>Trigger Real Test</span>
                </button>
              </div>
            </div>

            {/* Email Shell */}
            <div className="bg-white border-2 border-[#141414] shadow-[4px_4px_0px_#141414] max-w-2xl mx-auto overflow-hidden text-[#141414]">
              {/* Email Client Header */}
              <div className="bg-neutral-100 border-b border-neutral-300 p-3.5 space-y-1.5 text-xs font-sans">
                <div className="flex items-center justify-between text-neutral-500">
                  <span><strong>From:</strong> WebAudit PRO Weekly Monitor &lt;alerts@webauditpro.ai.studio&gt;</span>
                  <span className="font-mono text-[10px]">Today at 08:01 AM</span>
                </div>
                <div>
                  <span className="text-neutral-500"><strong>To:</strong></span>{' '}
                  <span className="font-mono text-indigo-700 font-bold">{recipients.join(', ')}</span>
                </div>
                <div className="pt-1">
                  <span className="text-neutral-500"><strong>Subject:</strong></span>{' '}
                  <span className="font-bold text-rose-600">
                    🚨 [URGENT SEO ALERT] Significant Visibility Drop Detected for {targetUrlInput} (-7.4% vs Competitors)
                  </span>
                </div>
              </div>

              {/* Email Content Body */}
              <div className="p-6 space-y-6 font-sans">
                {/* Brand Bar */}
                <div className="flex items-center justify-between border-b pb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 bg-[#141414] text-white flex items-center justify-center font-black font-mono text-xs">
                      WA
                    </div>
                    <div>
                      <div className="font-black font-mono text-sm uppercase tracking-tight">WebAudit PRO</div>
                      <div className="text-[10px] text-neutral-500 font-mono">AUTOMATED COMPETITIVE RADAR</div>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 bg-rose-100 text-rose-800 border border-rose-300 font-mono text-[10px] font-bold uppercase">
                    ALERT SEVERITY: HIGH
                  </span>
                </div>

                {/* Hero Alert Callout */}
                <div className="p-4 bg-rose-50 border-l-4 border-rose-600 space-y-2">
                  <h3 className="text-base font-bold text-rose-900 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
                    Significant Competitive SERP Drop Detected
                  </h3>
                  <p className="text-xs text-rose-800 leading-relaxed">
                    During the automated weekly crawl completed on <strong>{new Date().toLocaleDateString()}</strong>, your domain{' '}
                    <strong className="font-mono">{targetUrlInput}</strong> experienced a{' '}
                    <strong>-7.4% drop in organic search visibility</strong>, while your top 3 tracked competitors surged by an average of{' '}
                    <strong>+2.8%</strong>.
                  </p>
                </div>

                {/* Comparative KPI Metrics */}
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-3 bg-neutral-50 border border-neutral-200">
                    <div className="text-[10px] uppercase text-neutral-500 font-bold">Search Visibility</div>
                    <div className="text-lg font-black text-rose-600 font-mono mt-0.5">58.2%</div>
                    <div className="text-[11px] text-rose-600 font-bold font-mono flex items-center justify-center gap-0.5">
                      <TrendingDown className="h-3 w-3" />
                      -7.4% (Crossed ≥{visibilityDropThreshold}%)
                    </div>
                  </div>

                  <div className="p-3 bg-neutral-50 border border-neutral-200">
                    <div className="text-[10px] uppercase text-neutral-500 font-bold">Top 3 Competitors Avg</div>
                    <div className="text-lg font-black text-neutral-900 font-mono mt-0.5">64.5%</div>
                    <div className="text-[11px] text-emerald-600 font-bold font-mono flex items-center justify-center gap-0.5">
                      <TrendingUp className="h-3 w-3" />
                      +2.8% surge
                    </div>
                  </div>

                  <div className="p-3 bg-neutral-50 border border-neutral-200">
                    <div className="text-[10px] uppercase text-neutral-500 font-bold">Lost Rankings</div>
                    <div className="text-lg font-black text-rose-600 font-mono mt-0.5">-8 Total</div>
                    <div className="text-[10px] text-neutral-600 font-mono">
                      -3 in Top 3 • -5 in Page 1
                    </div>
                  </div>
                </div>

                {/* Ranking Loss Highlights Table */}
                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase text-neutral-800 flex items-center justify-between">
                    <span>Impacted Commercial Keywords (Top Movers)</span>
                    <span className="text-[10px] text-neutral-500">Weekly Delta</span>
                  </div>

                  <div className="border border-neutral-200 text-xs">
                    <table className="w-full text-left">
                      <thead className="bg-neutral-100 text-neutral-600 border-b text-[10px] uppercase font-bold">
                        <tr>
                          <th className="p-2">Target Keyword</th>
                          <th className="p-2">Previous</th>
                          <th className="p-2">Current</th>
                          <th className="p-2">Winning Competitor</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-200">
                        <tr>
                          <td className="p-2 font-mono font-medium">enterprise website security audit</td>
                          <td className="p-2 font-mono text-emerald-600 font-bold">#2</td>
                          <td className="p-2 font-mono text-rose-600 font-bold">#6 (-4)</td>
                          <td className="p-2 text-neutral-700 font-mono text-[11px]">{competitorsList[0]} (#1)</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-mono font-medium">automated accessibility wcag checker</td>
                          <td className="p-2 font-mono text-emerald-600 font-bold">#3</td>
                          <td className="p-2 font-mono text-rose-600 font-bold">#8 (-5)</td>
                          <td className="p-2 text-neutral-700 font-mono text-[11px]">{competitorsList[1]} (#2)</td>
                        </tr>
                        <tr>
                          <td className="p-2 font-mono font-medium">core web vitals performance monitoring</td>
                          <td className="p-2 font-mono text-emerald-600 font-bold">#7</td>
                          <td className="p-2 font-mono text-rose-600 font-bold">#14 (Page 2)</td>
                          <td className="p-2 text-neutral-700 font-mono text-[11px]">{competitorsList[2]} (#4)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* AI Root-Cause Diagnostic */}
                {includeAiRootCause && (
                  <div className="p-4 bg-indigo-50 border border-indigo-200 space-y-2">
                    <div className="flex items-center gap-1.5 text-xs font-black uppercase text-indigo-900">
                      <Sparkles className="h-4 w-4 text-indigo-600" />
                      AI Root Cause Diagnostic & Fast-Recovery Plan
                    </div>
                    <ul className="text-xs text-indigo-950 space-y-1.5 list-disc pl-4 leading-relaxed">
                      <li>
                        <strong>Canonical / Indexation Drift:</strong> 2 critical service pages returned conflicting canonical tags following recent deployments.
                      </li>
                      <li>
                        <strong>Core Web Vitals Regression:</strong> Interaction to Next Paint (INP) increased from 160ms to 420ms due to uncompressed tracking tags.
                      </li>
                      <li>
                        <strong>Competitor Action:</strong> <span className="font-mono font-bold">{competitorsList[0]}</span> published updated comprehensive comparison guides capturing top featured snippets.
                      </li>
                    </ul>
                  </div>
                )}

                {/* Call to action buttons */}
                <div className="pt-2 flex flex-col sm:flex-row gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      const el = document.getElementById('seo-competitor-benchmark-section');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="flex-1 py-2.5 px-4 bg-[#141414] hover:bg-neutral-800 text-white font-mono font-bold text-xs uppercase text-center cursor-pointer"
                  >
                    Open Live Competitor Benchmark in Dashboard →
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="py-2.5 px-4 bg-neutral-100 hover:bg-neutral-200 text-[#141414] border border-neutral-300 font-mono font-bold text-xs uppercase cursor-pointer"
                  >
                    View Full Audit
                  </button>
                </div>

                {/* Email Footer */}
                <div className="pt-4 border-t border-neutral-200 text-[10px] text-neutral-400 text-center font-sans">
                  You received this email because you configured automated competitor drop alerts for {targetUrlInput} in WebAudit PRO.
                  To modify sensitivity thresholds or frequency, open the WebAudit PRO Competitor Alert Manager.
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Active Monitors & Dispatch Logs */}
        {activeTab === 'monitors' && (
          <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 bg-white">
            {/* Active Monitors List */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b-2 border-[#141414] pb-2">
                <div>
                  <h3 className="text-xs font-black uppercase text-[#141414] flex items-center gap-1.5">
                    <Bell className="h-4 w-4 text-emerald-600" />
                    Configured Alert Rules ({savedAlerts.length})
                  </h3>
                  <p className="text-[11px] text-neutral-600 font-sans">
                    Active automated background monitors running on weekly schedules.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveTab('config')}
                  className="px-2.5 py-1 text-xs font-black uppercase bg-[#141414] text-white hover:bg-neutral-800 border cursor-pointer flex items-center gap-1"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>New Rule</span>
                </button>
              </div>

              {savedAlerts.length === 0 ? (
                <div className="p-6 text-center text-xs text-neutral-500 border-2 border-dashed border-neutral-300">
                  No active weekly competitor alerts found. Create one in the "Configure Drop Rules" tab.
                </div>
              ) : (
                <div className="space-y-3">
                  {savedAlerts.map((rule) => (
                    <div
                      key={rule.id}
                      className="p-4 border-2 border-[#141414] bg-neutral-50 shadow-[2px_2px_0px_#141414] flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-black font-mono text-[#141414]">
                            {rule.domain}
                          </span>
                          <span
                            className={`px-2 py-0.5 text-[9px] font-black uppercase border ${
                              rule.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-400'
                                : 'bg-neutral-200 text-neutral-700 border-neutral-400'
                            }`}
                          >
                            {rule.status.toUpperCase()}
                          </span>
                          <span className="text-[10px] text-neutral-500 font-mono">
                            Every {rule.dispatchDay.toUpperCase()} @ {rule.dispatchTimeUtc} UTC
                          </span>
                        </div>

                        <div className="text-xs text-neutral-700 font-sans flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span>
                            Trigger: <strong>Drop ≥{rule.visibilityDropThresholdPercent}%</strong>
                          </span>
                          <span>
                            Competitor Margin: <strong>+{rule.competitorSurgeThresholdPercent}%</strong>
                          </span>
                          <span>
                            Top 3 Loss: <strong>≥{rule.top3RankDropCount} kw</strong>
                          </span>
                        </div>

                        <div className="text-[11px] text-neutral-500 font-mono flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          <span>{rule.recipients.join(', ')}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 self-end md:self-center">
                        <button
                          type="button"
                          onClick={() => handleToggleRuleStatus(rule.id)}
                          className="px-2.5 py-1 text-xs font-bold uppercase bg-white hover:bg-neutral-100 border border-[#141414] cursor-pointer"
                        >
                          {rule.status === 'active' ? 'Pause' : 'Activate'}
                        </button>

                        <button
                          type="button"
                          onClick={handleSendTestAlert}
                          title="Simulate immediate alert dispatch"
                          className="px-2.5 py-1 text-xs font-black uppercase bg-rose-500 hover:bg-rose-400 text-white border border-[#141414] cursor-pointer flex items-center gap-1"
                        >
                          <Send className="h-3 w-3" />
                          <span>Test</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteRule(rule.id)}
                          title="Delete rule"
                          className="p-1 text-neutral-400 hover:text-rose-600 cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Past Dispatch Audit Log */}
            <div className="space-y-3 pt-2">
              <div className="border-b-2 border-[#141414] pb-2 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase text-[#141414] flex items-center gap-1.5">
                    <FileText className="h-4 w-4 text-indigo-600" />
                    Automated Alert Dispatch History ({dispatchLogs.length})
                  </h3>
                  <p className="text-[11px] text-neutral-600 font-sans">
                    Chronological audit log of evaluated runs and sent notifications.
                  </p>
                </div>
              </div>

              <div className="border-2 border-[#141414] overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#141414] text-white text-[10px] uppercase">
                    <tr>
                      <th className="p-2.5">Date & Time</th>
                      <th className="p-2.5">Domain</th>
                      <th className="p-2.5">Triggered Reason</th>
                      <th className="p-2.5">Visibility Change</th>
                      <th className="p-2.5">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-200 bg-white">
                    {dispatchLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-neutral-50">
                        <td className="p-2.5 text-neutral-500 whitespace-nowrap">
                          {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-2.5 font-bold text-[#141414]">{log.domain}</td>
                        <td className="p-2.5 text-neutral-700 max-w-xs truncate" title={log.triggerReason}>
                          {log.triggerReason}
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`font-bold ${
                              log.visibilityChange < 0 ? 'text-rose-600' : 'text-emerald-600'
                            }`}
                          >
                            {log.visibilityChange > 0 ? `+${log.visibilityChange}%` : `${log.visibilityChange}%`}
                          </span>
                        </td>
                        <td className="p-2.5">
                          <span
                            className={`px-1.5 py-0.5 text-[9px] font-black uppercase border ${
                              log.status === 'delivered'
                                ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                : 'bg-neutral-100 text-neutral-700 border-neutral-300'
                            }`}
                          >
                            {log.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Modal Footer */}
        <div className="p-3 bg-neutral-100 border-t-2 border-[#141414] flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2 text-neutral-600 font-sans">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span>Automated CRON worker active • Evaluation interval: Weekly</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-black uppercase bg-white hover:bg-neutral-200 text-[#141414] border border-[#141414] cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
