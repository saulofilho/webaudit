export type SeverityLevel = 'critical' | 'warning' | 'good' | 'info';

export type AuditCategory = 'security' | 'seo' | 'best_practices' | 'performance_accessibility';

export interface AuditItem {
  id: string;
  title: string;
  category: AuditCategory;
  severity: SeverityLevel;
  score: number; // 0 to 100
  summary: string;
  impact?: string;
  details?: string;
  currentValue?: string;
  recommendedValue?: string;
  codeSnippet?: {
    language: string;
    title: string;
    code: string;
  };
  references?: Array<{ title: string; url: string }>;
}

export interface CategoryScore {
  category: AuditCategory;
  name: string;
  score: number;
  grade: string;
  color: string;
  passedCount: number;
  warningCount: number;
  criticalCount: number;
  totalCount: number;
  summary: string;
}

export interface MetaTagsData {
  title?: string;
  titleLength?: number;
  description?: string;
  descriptionLength?: number;
  canonical?: string;
  robots?: string;
  language?: string;
  charset?: string;
  viewport?: string;
  themeColor?: string;
  author?: string;
  keywords?: string;
  favicon?: string;
  openGraph: {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    siteName?: string;
    type?: string;
  };
  twitter: {
    card?: string;
    title?: string;
    description?: string;
    image?: string;
    site?: string;
    creator?: string;
  };
  structuredDataTypes: string[];
}

export interface SecurityHeaderCheck {
  header: string;
  status: 'present' | 'missing' | 'insecure';
  value?: string;
  recommended: string;
  importance: 'critical' | 'high' | 'medium';
  description: string;
  fixSnippet?: string;
}

export interface TechStackItem {
  category: string;
  name: string;
  confidence: number;
  version?: string;
  icon?: string;
}

export interface RawAuditData {
  url: string;
  finalUrl: string;
  protocol: string;
  statusCode: number;
  statusText: string;
  responseTimeMs: number;
  contentLengthBytes: number;
  contentType: string;
  serverHeader?: string;
  ipAddress?: string;
  tlsVersion?: string;
  h1Count: number;
  h2Count: number;
  h3Count: number;
  h1Sample?: string;
  imagesTotal: number;
  imagesMissingAlt: number;
  linksTotal: number;
  externalLinksWithoutRel: number;
  formsCount: number;
  formsWithoutHttps: number;
  scriptsCount: number;
  inlineScriptsCount: number;
  stylesCount: number;
  metaTags: MetaTagsData;
  securityHeaders: SecurityHeaderCheck[];
  allHeaders: Record<string, string>;
  techStack: TechStackItem[];
}

export interface AuditReport {
  id: string;
  targetUrl: string;
  analyzedAt: string;
  overallScore: number;
  overallGrade: string;
  aiExecutiveSummary: string;
  keyStrengths: string[];
  topPriorityFixes: string[];
  categories: {
    security: CategoryScore;
    seo: CategoryScore;
    best_practices: CategoryScore;
    performance_accessibility: CategoryScore;
  };
  items: AuditItem[];
  rawData: RawAuditData;
}

export interface SavedAuditSummary {
  id: string;
  targetUrl: string;
  analyzedAt: string;
  overallScore: number;
  overallGrade: string;
  securityScore: number;
  seoScore: number;
  bestPracticesScore: number;
  perfScore: number;
}

export type NavigationTab =
  | AuditCategory
  | 'all'
  | 'vitals'
  | 'config-gen'
  | 'ssl-dns'
  | 'accessibility'
  | 'privacy'
  | 'mobile'
  | 'headers'
  | 'social'
  | 'tech'
  | 'comparator'
  | 'trends';

export interface WhiteLabelSettings {
  agencyName: string;
  consultantName: string;
  clientName: string;
  logoUrl?: string;
  customNotes?: string;
  includeExecutiveRoi: boolean;
}

export interface WebhookConfig {
  webhookUrl: string;
  platform: 'slack' | 'discord' | 'generic';
  triggerMinScore: number;
  triggerOnCritical: boolean;
  triggerOnRegression: boolean;
}

export interface CriticalIssueSummary {
  rank: number;
  id: string;
  title: string;
  category: string;
  severity: string;
  score: number;
  businessImpact: string;
  technicalRootCause: string;
  urgency: 'Immediate' | 'High' | 'Medium';
  suggestedQuickAction: string;
}

export interface RoadmapPhase {
  phase: string;
  title: string;
  timeframe: string;
  actions: string[];
  expectedScoreBoost: string;
  estimatedEffort: string;
}

export interface ReportExecutiveSummaryResponse {
  targetUrl: string;
  analyzedAt: string;
  overallScore: number;
  overallGrade: string;
  strategicVerdict: string;
  executiveOverview: string;
  cLevelHighlights: string[];
  top3CriticalIssues: CriticalIssueSummary[];
  priorityRoadmap: RoadmapPhase[];
  roiAndBusinessRiskAnalysis: {
    conversionOpportunity: string;
    securityExposureRisk: string;
    seoVisibilityImpact: string;
  };
}

