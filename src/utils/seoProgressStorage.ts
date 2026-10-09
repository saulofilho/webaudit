// Utility for managing SEO Checklist state, milestone events, and progress timeline

export type SeoPillarId = 'robots' | 'sitemap' | 'metatags' | 'schema';

export interface ProgressTaskDef {
  id: string;
  pillar: SeoPillarId;
  pillarName: string;
  stepNumber: number;
  title: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  points: number;
  estimatedMinutes: number;
  recommendation: string;
}

export interface TimelineMilestoneEvent {
  id: string;
  taskId: string;
  taskTitle: string;
  pillar: SeoPillarId;
  pillarName: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  pointsAdded: number;
  scoreBefore: number;
  scoreAfter: number;
  timestamp: string; // ISO string
  type: 'baseline' | 'task_completed' | 'projected';
  notes?: string;
}

export const SEO_CHECKLIST_TASKS_DEF: ProgressTaskDef[] = [
  // robots.txt (17 pts)
  {
    id: 'task-robots-accessible',
    pillar: 'robots',
    pillarName: 'robots.txt Directives',
    stepNumber: 1,
    title: 'Crawl Directives & robots.txt Accessibility',
    priority: 'CRITICAL',
    points: 8,
    estimatedMinutes: 2,
    recommendation: 'Serve a plain UTF-8 text file at /robots.txt with User-agent: * and explicit Allow/Disallow directives.',
  },
  {
    id: 'task-robots-sitemap-decl',
    pillar: 'robots',
    pillarName: 'robots.txt Directives',
    stepNumber: 1,
    title: 'Sitemap Declaration Directive in robots.txt',
    priority: 'HIGH',
    points: 5,
    estimatedMinutes: 1,
    recommendation: 'Always append an absolute HTTPS Sitemap URL at the bottom of your robots.txt file.',
  },
  {
    id: 'task-robots-ai-bots',
    pillar: 'robots',
    pillarName: 'robots.txt Directives',
    stepNumber: 1,
    title: 'AI Crawler & Large Language Model Policy (GPTBot, CCBot)',
    priority: 'MEDIUM',
    points: 4,
    estimatedMinutes: 3,
    recommendation: 'Define explicit access policies for automated LLM scrapers (OpenAI GPTBot, Anthropic ClaudeBot, CommonCrawl CCBot).',
  },

  // sitemap.xml (19 pts)
  {
    id: 'task-sitemap-presence',
    pillar: 'sitemap',
    pillarName: 'XML Sitemap',
    stepNumber: 2,
    title: 'XML Sitemap Structure & Endpoint Availability',
    priority: 'CRITICAL',
    points: 9,
    estimatedMinutes: 4,
    recommendation: 'Maintain an automated /sitemap.xml using standard namespace xmlns="http://www.sitemaps.org/schemas/sitemap/0.9".',
  },
  {
    id: 'task-sitemap-lastmod',
    pillar: 'sitemap',
    pillarName: 'XML Sitemap',
    stepNumber: 2,
    title: 'Accurate <lastmod> Timestamps & Clean Canonical URLs',
    priority: 'HIGH',
    points: 5,
    estimatedMinutes: 2,
    recommendation: 'Include precise ISO 8601 timestamps (<lastmod>YYYY-MM-DD</lastmod>) updated only when substantive content changes.',
  },
  {
    id: 'task-sitemap-console-submit',
    pillar: 'sitemap',
    pillarName: 'XML Sitemap',
    stepNumber: 2,
    title: 'Google Search Console & Bing Webmaster Submission',
    priority: 'HIGH',
    points: 5,
    estimatedMinutes: 5,
    recommendation: 'Submit the sitemap URL directly into Google Search Console (Sitemaps section) to track coverage and indexing errors.',
  },

  // meta tags (44 pts)
  {
    id: 'task-meta-title',
    pillar: 'metatags',
    pillarName: 'Document Meta Tags',
    stepNumber: 3,
    title: 'HTML Title Tag Optimization (<title>)',
    priority: 'CRITICAL',
    points: 9,
    estimatedMinutes: 2,
    recommendation: 'Keep title between 30 and 60 characters. Place high-value target keywords early and end with your brand name.',
  },
  {
    id: 'task-meta-description',
    pillar: 'metatags',
    pillarName: 'Document Meta Tags',
    stepNumber: 3,
    title: 'Meta Description Tag (<meta name="description">)',
    priority: 'HIGH',
    points: 7,
    estimatedMinutes: 3,
    recommendation: 'Write a unique description between 120 and 160 characters with a clear call-to-action (CTA).',
  },
  {
    id: 'task-meta-canonical',
    pillar: 'metatags',
    pillarName: 'Document Meta Tags',
    stepNumber: 3,
    title: 'Self-Referencing Canonical URL (<link rel="canonical">)',
    priority: 'CRITICAL',
    points: 9,
    estimatedMinutes: 2,
    recommendation: 'Always specify an absolute canonical HTTPS tag pointing to the authoritative URL of the page.',
  },
  {
    id: 'task-meta-robots',
    pillar: 'metatags',
    pillarName: 'Document Meta Tags',
    stepNumber: 3,
    title: 'Document Robots Meta Directives (<meta name="robots">)',
    priority: 'CRITICAL',
    points: 8,
    estimatedMinutes: 1,
    recommendation: 'Deploy <meta name="robots" content="index, follow, max-image-preview:large" /> on all public pages.',
  },
  {
    id: 'task-meta-viewport',
    pillar: 'metatags',
    pillarName: 'Document Meta Tags',
    stepNumber: 3,
    title: 'Mobile Responsive Viewport Meta Tag',
    priority: 'HIGH',
    points: 6,
    estimatedMinutes: 1,
    recommendation: 'Declare <meta name="viewport" content="width=device-width, initial-scale=1.0" /> for Google Mobile-First Indexing.',
  },
  {
    id: 'task-meta-social-cards',
    pillar: 'metatags',
    pillarName: 'Document Meta Tags',
    stepNumber: 3,
    title: 'OpenGraph & Twitter Card Social Metadata',
    priority: 'MEDIUM',
    points: 5,
    estimatedMinutes: 4,
    recommendation: 'Provide og:title, og:description, og:image (1200x630px), og:url, and twitter:card="summary_large_image".',
  },

  // schema.org (20 pts)
  {
    id: 'task-schema-ldjson',
    pillar: 'schema',
    pillarName: 'Schema.org JSON-LD',
    stepNumber: 4,
    title: 'Structured Data Presence (JSON-LD Scripts)',
    priority: 'CRITICAL',
    points: 9,
    estimatedMinutes: 3,
    recommendation: 'Embed structured data using <script type="application/ld+json"> directly inside the HTML markup.',
  },
  {
    id: 'task-schema-rich-snippets',
    pillar: 'schema',
    pillarName: 'Schema.org JSON-LD',
    stepNumber: 4,
    title: 'Rich Snippets Eligibility (Entity Types & FAQ/Breadcrumb)',
    priority: 'HIGH',
    points: 6,
    estimatedMinutes: 5,
    recommendation: 'Implement specific schemas like WebApplication, Organization, LocalBusiness, FAQPage, or BreadcrumbList.',
  },
  {
    id: 'task-schema-syntax-validation',
    pillar: 'schema',
    pillarName: 'Schema.org JSON-LD',
    stepNumber: 4,
    title: 'JSON-LD Syntax & Property Hygiene Validation',
    priority: 'HIGH',
    points: 5,
    estimatedMinutes: 2,
    recommendation: 'Ensure valid JSON without trailing commas, unescaped characters, or undefined variables.',
  },
];

export const SEO_CHECKLIST_EVENT_NAME = 'seo-checklist-sync';

export function getChecklistStorageKey(hostname: string): string {
  return `seo_audit_checklist_${hostname}`;
}

export function getTimelineEventsStorageKey(hostname: string): string {
  return `seo_progress_timeline_${hostname}`;
}

export function loadChecklistOverrides(hostname: string): Record<string, boolean> {
  try {
    const raw = localStorage.getItem(getChecklistStorageKey(hostname));
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading checklist overrides', e);
  }
  return {};
}

export function saveChecklistOverrides(hostname: string, state: Record<string, boolean>): void {
  try {
    localStorage.setItem(getChecklistStorageKey(hostname), JSON.stringify(state));
    window.dispatchEvent(new CustomEvent(SEO_CHECKLIST_EVENT_NAME, { detail: { hostname, state } }));
  } catch (e) {
    console.warn('Error saving checklist overrides', e);
  }
}

export function loadTimelineEvents(hostname: string): TimelineMilestoneEvent[] {
  try {
    const raw = localStorage.getItem(getTimelineEventsStorageKey(hostname));
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn('Error reading timeline events', e);
  }
  return [];
}

export function saveTimelineEvents(hostname: string, events: TimelineMilestoneEvent[]): void {
  try {
    localStorage.setItem(getTimelineEventsStorageKey(hostname), JSON.stringify(events));
  } catch (e) {
    console.warn('Error saving timeline events', e);
  }
}
