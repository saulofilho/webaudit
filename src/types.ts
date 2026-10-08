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

export interface SocialFootprintProfile {
  platform: string;
  url: string;
  handle?: string;
  icon: string; // lucide icon identifier or name
  isSecureHttps: boolean;
  hasRelMeOrNoopener: boolean;
  status: 'verified' | 'detected' | 'unsecured';
}

export interface SocialFootprintSummary {
  totalProfilesFound: number;
  platformsDetectedCount: number;
  profiles: SocialFootprintProfile[];
  platformsList: string[];
  hasMajorSocialPresence: boolean;
  socialReachGrade: 'High' | 'Moderate' | 'Limited' | 'None';
  socialFootprintScore: number; // 0-100
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
  socialFootprint?: SocialFootprintSummary;
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
  | 'heatmap'
  | 'serp-simulator'
  | 'content-semantics'
  | 'broken-links'
  | 'sitemap'
  | 'eco-scripts'
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
  | 'trends'
  | 'js-miner'
  | 'nikto'
  | 'dast'
  | 'waf'
  | 'ssrf'
  | 'jwt'
  | 'compliance'
  | 'llm-sec'
  | 'stride'
  | 'soar'
  | 'threat-intel';

export interface LinkAuditItem {
  url: string;
  text: string;
  isInternal: boolean;
  status: number;
  statusText: string;
  responseTimeMs: number;
  redirectUrl?: string;
  isBroken: boolean;
  isInsecure: boolean;
  missingNoopener: boolean;
  error?: string;
}

export interface LinkCheckData {
  targetUrl: string;
  totalFound: number;
  totalChecked: number;
  internalCount: number;
  externalCount: number;
  brokenCount: number;
  redirectsCount: number;
  insecureCount: number;
  missingNoopenerCount: number;
  healthScore: number;
  links: LinkAuditItem[];
}

export interface CrawledPageItem {
  url: string;
  statusCode: number;
  responseTimeMs: number;
  title?: string;
  titleLength: number;
  metaDescription?: string;
  metaDescLength: number;
  h1?: string;
  h1Count: number;
  canonical?: string;
  isIndexable: boolean;
  issues: string[];
  inboundInternalLinksCount?: number;
  outboundInternalLinksCount?: number;
  outboundExternalLinksCount?: number;
}

export interface DiscoveredBacklinkItem {
  id: string;
  sourceUrl: string;
  targetUrl: string;
  anchorText: string;
  linkType: 'internal' | 'external_referral' | 'nofollow' | 'ugc' | 'sponsored';
  isDoFollow: boolean;
  sourceEstimatedAuthority: number; // 0-100
  trustWeight: number; // 0.0 - 1.0
  equityScore: number; // Calculated link juice transfer
  status: 'active' | 'redirected' | 'broken' | 'suspicious';
  detectedVia: 'crawler_html' | 'sitemap_cross_reference' | 'canonical_cluster';
}

export interface BacklinkAuditSummary {
  totalLinksDiscovered: number;
  internalCrossLinks: number;
  externalOutboundLinks: number;
  doFollowRatio: number; // percentage 0-100
  brokenLinksFound: number;
  uniqueLinkingNodes: number;
  topAnchors: { anchor: string; count: number; percentage: number }[];
  deepLinkRatio: number; // % links pointing to subpages vs homepage
  backlinkItems: DiscoveredBacklinkItem[];
}

export interface PageRankSimulationData {
  calculatedDomainAuthority: number; // 0-100
  estimatedPageRank: number; // 0.0 to 10.0 (logarithmic scale)
  dampingFactor: number; // standard 0.85
  iterations: number;
  confidenceScore: number; // 0-100
  linkEquityDistribution: {
    pageUrl: string;
    pageTitle?: string;
    internalPageRank: number; // 0-10
    rawEquityShare: number; // 0-100%
    inboundLinkCount: number;
    outboundLinkCount: number;
    depthLevel: number;
    status: 'high_authority' | 'moderate' | 'diluted' | 'orphan_risk';
  }[];
  authorityBreakdown: {
    linkQuantityScore: number; // 0-100
    equityFlowScore: number; // 0-100
    doFollowQualityScore: number; // 0-100
    architectureDepthScore: number; // 0-100
    technicalHealthPenalty: number; // 0-100
  };
  rankTier: 'Pioneer (0-20)' | 'Emerging (21-40)' | 'Established (41-60)' | 'Authoritative (61-80)' | 'Industry Leader (81-100)';
  insights: string[];
  recommendations: string[];
}

export interface SitemapCrawlData {
  targetUrl: string;
  sitemapFound: boolean;
  sitemapUrl?: string;
  totalPagesDiscovered: number;
  totalPagesCrawled: number;
  averageResponseTimeMs: number;
  healthScore: number;
  issuesSummary: {
    duplicateTitles: number;
    missingTitles: number;
    missingMetaDescriptions: number;
    missingH1: number;
    multipleH1: number;
    httpErrors: number;
    slowPages: number;
  };
  duplicateTitleGroups: { title: string; urls: string[] }[];
  pages: CrawledPageItem[];
  backlinkAudit?: BacklinkAuditSummary;
  pageRankSimulation?: PageRankSimulationData;
}

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

