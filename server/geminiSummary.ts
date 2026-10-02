import { GoogleGenAI, Type } from '@google/genai';
import { AuditReport, AuditItem } from '../src/types';

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

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function generateFallbackSummary(
  report: AuditReport,
  tone: 'executive' | 'technical' = 'executive'
): ReportExecutiveSummaryResponse {
  const hostname = new URL(report.targetUrl).hostname;
  const criticalItems = report.items
    .filter((i) => i.severity === 'critical')
    .sort((a, b) => a.score - b.score);
  const warningItems = report.items
    .filter((i) => i.severity === 'warning')
    .sort((a, b) => a.score - b.score);

  const topCandidates: AuditItem[] = [...criticalItems, ...warningItems].slice(0, 3);

  // If there are fewer than 3, pad with lowest score items
  if (topCandidates.length < 3) {
    const remaining = report.items
      .filter((i) => !topCandidates.some((c) => c.id === i.id))
      .sort((a, b) => a.score - b.score)
      .slice(0, 3 - topCandidates.length);
    topCandidates.push(...remaining);
  }

  const top3CriticalIssues: CriticalIssueSummary[] = topCandidates.map((item, idx) => {
    let urgency: 'Immediate' | 'High' | 'Medium' = 'High';
    if (idx === 0 || item.severity === 'critical') urgency = 'Immediate';
    else if (idx === 2) urgency = 'Medium';

    let businessImpact =
      item.impact ||
      'May cause organic traffic loss, funnel drop-off, or vulnerability to automated web attacks.';
    let technicalCause =
      item.summary ||
      'Essential security directives or web best practices were missing or incompletely configured.';

    if (item.id.includes('hsts') || item.id.includes('csp')) {
      businessImpact =
        'Vulnerability to cross-site scripting (XSS) and Man-in-the-Middle (MitM) attacks, putting user credentials at risk.';
      technicalCause = 'Missing HTTP Strict-Transport-Security or Content-Security-Policy headers on the web server.';
    } else if (item.category === 'seo') {
      businessImpact =
        'Algorithmic disadvantage on Google SERP, decreasing organic click-through rates and brand visibility.';
      technicalCause = 'Incomplete or missing essential metatags (title, description, or Schema.org JSON-LD).';
    } else if (item.category === 'performance_accessibility') {
      businessImpact =
        'Every additional second of load latency reduces conversion rates by up to 7% and spikes mobile bounce rates.';
      technicalCause = 'Render-blocking scripts and unoptimized initial asset delivery.';
    }

    return {
      rank: idx + 1,
      id: item.id,
      title: item.title,
      category: item.category,
      severity: item.severity,
      score: item.score,
      businessImpact,
      technicalRootCause: technicalCause,
      urgency,
      suggestedQuickAction:
        item.recommendedValue ||
        'Apply recommended configuration via edge server (Cloudflare / Vercel / Nginx) or HTML tags.',
    };
  });

  const strategicVerdict =
    report.overallScore >= 85
      ? 'Strong Web Health with Minor Optimization Needs'
      : report.overallScore >= 70
      ? 'Stable Performance with Priority Risk Bottlenecks'
      : 'High Risk: Immediate Remediation Required';

  const executiveOverview =
    tone === 'executive'
      ? `The technical audit on ${hostname} recorded a consolidated score of ${report.overallScore}/100 (Grade ${report.overallGrade}). The overall infrastructure demonstrates solid foundations, highlighted by ${
          report.keyStrengths?.[0] || 'server response stability'
        }. However, we detected ${
          criticalItems.length
        } critical severity issues that affect brand security, data compliance, and user conversion. Executing the 3-phase remediation plan below will elevate this domain to the excellence threshold with estimated gains of up to +${Math.min(
          20,
          100 - report.overallScore
        )} points.`
      : `In-depth diagnostic for ${hostname} consolidated an overall score of ${report.overallScore}/100. Observed server latency (TTFB) was ${report.rawData?.responseTimeMs || 0}ms with an initial DOM size of ${((report.rawData?.contentLengthBytes || 0) / 1024).toFixed(1)} KB. Top technical issues concentrate in missing defensive HTTP headers and render-blocking scripts. Resolving the 3 primary bottlenecks immediately frees the main thread and closes clickjacking and XSS attack vectors.`;

  return {
    targetUrl: report.targetUrl,
    analyzedAt: new Date().toISOString(),
    overallScore: report.overallScore,
    overallGrade: report.overallGrade,
    strategicVerdict,
    executiveOverview,
    cLevelHighlights: [
      `Consolidated Web Health Index at ${report.overallScore}/100 [Grade ${report.overallGrade}].`,
      `Security evaluated at ${report.categories.security.score}% with ${criticalItems.length} critical issue(s) requiring immediate action.`,
      `Opportunity to boost organic search ranking and conversion rate by addressing primary bottlenecks.`,
      `Estimated turnaround time for top 3 priority fixes: under 2 engineering hours.`,
    ],
    top3CriticalIssues,
    priorityRoadmap: [
      {
        phase: 'Phase 1: Immediate Fixes',
        title: 'Edge Hardening & Security Headers',
        timeframe: '0 to 24 hours',
        actions: [
          `Configure HSTS and CSP headers on the server/CDN to mitigate cyber threats.`,
          `Set X-Frame-Options or frame-ancestors to prevent clickjacking in iframes.`,
        ],
        expectedScoreBoost: '+8 to +12 pts',
        estimatedEffort: '15 to 30 min',
      },
      {
        phase: 'Phase 2: Structural Optimization',
        title: 'Search Visibility & Structured Data',
        timeframe: '1 to 3 days',
        actions: [
          `Deploy Schema.org JSON-LD to unlock Google Rich Results.`,
          `Refine meta description and OpenGraph tags to increase SERP and social CTR.`,
        ],
        expectedScoreBoost: '+5 to +8 pts',
        estimatedEffort: '1 to 2 hours',
      },
      {
        phase: 'Phase 3: Continuous Refinement',
        title: 'Speed Acceleration & Core Web Vitals',
        timeframe: '1 to 2 weeks',
        actions: [
          `Defer non-critical third-party scripts and convert images to WebP.`,
          `Set up automated webhook monitoring to prevent performance regressions.`,
        ],
        expectedScoreBoost: '+4 to +6 pts',
        estimatedEffort: '2 to 4 hours',
      },
    ],
    roiAndBusinessRiskAnalysis: {
      conversionOpportunity:
        'Sub-2.5s Largest Contentful Paint (LCP) and lower TTFB directly curb user bounce rates and lift conversions by up to +8.4%.',
      securityExposureRisk:
        'Absence of defensive security headers increases exposure to automated bot sweeps, XSS injections, and browser downgrades.',
      seoVisibilityImpact:
        'Optimizing canonical tags, schema markup, and heading semantics secures prominent visibility against competitors on Google SERP.',
    },
  };
}

export async function generateExecutiveSummary(
  report: AuditReport,
  tone: 'executive' | 'technical' = 'executive'
): Promise<ReportExecutiveSummaryResponse> {
  const ai = getAiClient();
  if (!ai) {
    return generateFallbackSummary(report, tone);
  }

  try {
    const hostname = new URL(report.targetUrl).hostname;
    const criticalItems = report.items.filter((i) => i.severity === 'critical');
    const warningItems = report.items.filter((i) => i.severity === 'warning');

    const topIssuesContext = [...criticalItems, ...warningItems]
      .slice(0, 6)
      .map(
        (it, idx) =>
          `Item ${idx + 1}: [${it.category.toUpperCase()}] ${it.title} (Severity: ${
            it.severity
          }, Score: ${it.score}/100) - Summary: ${it.summary} - Impact: ${it.impact || 'N/A'}`
      )
      .join('\n');

    const prompt = `
You are the Chief Technology Officer (CTO) and Principal Web Security & Performance Consultant at WebAudit PRO.
Your mission is to generate a comprehensive, executive-grade website audit summary in flawless, natural English.

AUDIT CONTEXT:
- Website: "${report.targetUrl}" (Domain: ${hostname})
- Overall Score: ${report.overallScore}/100 (Grade: ${report.overallGrade})
- Pillar Scores:
  * Security: ${report.categories?.security?.score ?? 0}% (Grade ${report.categories?.security?.grade ?? 'N/A'}, ${report.categories?.security?.criticalCount ?? 0} critical)
  * SEO & Search: ${report.categories?.seo?.score ?? 0}% (Grade ${report.categories?.seo?.grade ?? 'N/A'})
  * Best Practices: ${report.categories?.best_practices?.score ?? 0}% (Grade ${report.categories?.best_practices?.grade ?? 'N/A'})
  * Performance & Accessibility: ${report.categories?.performance_accessibility?.score ?? 0}% (Grade ${report.categories?.performance_accessibility?.grade ?? 'N/A'})
- Server TTFB Latency: ${report.rawData?.responseTimeMs ?? 0}ms
- Page DOM Size: ${(((report.rawData?.contentLengthBytes || 0) / 1024)).toFixed(1)} KB
- Total Images: ${report.rawData?.imagesTotal ?? 0} (${report.rawData?.imagesMissingAlt ?? 0} missing alt)
- Total Scripts: ${report.rawData?.scriptsCount ?? 0}
- Requested Tone: ${tone === 'executive' ? 'Executive / C-Level (focus on business risk, conversion, and ROI)' : 'Technical / Engineering (focus on architecture, code, and infra)'}

KEY DETECTED ISSUES:
${topIssuesContext}

STRENGTHS:
${(report.keyStrengths || ['Consistent server responsiveness']).join(', ')}

MANDATORY INSTRUCTIONS:
1. Identify and select the TOP 3 most critical issues from the audit. For each one, detail the BUSINESS IMPACT and TECHNICAL ROOT CAUSE.
2. Formulate a 3-phase PRIORITY REMEDIATION ROADMAP (Phase 1: 0-24h, Phase 2: 1-3 days, Phase 3: Continuous) with concrete actionable steps and expected score boosts.
3. Write a fluid, 2-paragraph executive overview (executiveOverview) analyzing site health and actionable next steps.
4. Output entirely in professional, high-impact English.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'You are a senior digital infrastructure, cybersecurity, and SEO consultant. Produce outputs in structured JSON with high analytical precision.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            strategicVerdict: {
              type: Type.STRING,
              description: '1-line strategic verdict (e.g. Critical Security Exposure, Stable Performance, etc).',
            },
            executiveOverview: {
              type: Type.STRING,
              description: 'In-depth natural language narrative of 2 solid paragraphs analyzing the website.',
            },
            cLevelHighlights: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 to 4 executive bullet points for leadership presentation.',
            },
            top3CriticalIssues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  rank: { type: Type.INTEGER, description: '1, 2 or 3' },
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  category: { type: Type.STRING },
                  severity: { type: Type.STRING },
                  score: { type: Type.NUMBER },
                  businessImpact: { type: Type.STRING, description: 'Concrete impact on business, revenue, or risk.' },
                  technicalRootCause: { type: Type.STRING, description: 'Precise technical root cause.' },
                  urgency: { type: Type.STRING, enum: ['Immediate', 'High', 'Medium'] },
                  suggestedQuickAction: { type: Type.STRING, description: 'Recommended quick remediation step.' },
                },
                required: ['rank', 'title', 'category', 'businessImpact', 'technicalRootCause', 'urgency'],
              },
            },
            priorityRoadmap: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  phase: { type: Type.STRING },
                  title: { type: Type.STRING },
                  timeframe: { type: Type.STRING },
                  actions: { type: Type.ARRAY, items: { type: Type.STRING } },
                  expectedScoreBoost: { type: Type.STRING },
                  estimatedEffort: { type: Type.STRING },
                },
                required: ['phase', 'title', 'timeframe', 'actions', 'expectedScoreBoost'],
              },
            },
            roiAndBusinessRiskAnalysis: {
              type: Type.OBJECT,
              properties: {
                conversionOpportunity: { type: Type.STRING },
                securityExposureRisk: { type: Type.STRING },
                seoVisibilityImpact: { type: Type.STRING },
              },
              required: ['conversionOpportunity', 'securityExposureRisk', 'seoVisibilityImpact'],
            },
          },
          required: [
            'strategicVerdict',
            'executiveOverview',
            'cLevelHighlights',
            'top3CriticalIssues',
            'priorityRoadmap',
            'roiAndBusinessRiskAnalysis',
          ],
        },
      },
    });

    const text = response.text?.trim() || '';
    const parsed = JSON.parse(text);

    return {
      targetUrl: report.targetUrl,
      analyzedAt: new Date().toISOString(),
      overallScore: report.overallScore,
      overallGrade: report.overallGrade,
      strategicVerdict: parsed.strategicVerdict || 'Audit Completed',
      executiveOverview: parsed.executiveOverview || '',
      cLevelHighlights: parsed.cLevelHighlights || [],
      top3CriticalIssues: (parsed.top3CriticalIssues || []).map((item: any, i: number) => ({
        ...item,
        rank: i + 1,
        id: item.id || `issue-${i + 1}`,
      })),
      priorityRoadmap: parsed.priorityRoadmap || [],
      roiAndBusinessRiskAnalysis: parsed.roiAndBusinessRiskAnalysis || {
        conversionOpportunity: '',
        securityExposureRisk: '',
        seoVisibilityImpact: '',
      },
    };
  } catch (err) {
    console.warn('Gemini Executive Summary failed, using intelligent fallback:', err);
    return generateFallbackSummary(report, tone);
  }
}
