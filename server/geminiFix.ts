import { GoogleGenAI, Type } from '@google/genai';
import { AuditItem, TechStackItem } from '../src/types';

export interface AIFixStep {
  stepNumber: number;
  title: string;
  description: string;
  filePath?: string;
  code?: string;
  language?: string;
}

export interface AICodeOption {
  platform: string;
  title: string;
  language: string;
  filePath?: string;
  code: string;
  explanation: string;
}

export interface AIFixResponse {
  itemId: string;
  itemTitle: string;
  headline: string;
  severity: string;
  category: string;
  targetUrl?: string;
  problemAnalysis: string;
  estimatedTime: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  riskDescription?: string;
  steps: AIFixStep[];
  codeImplementations: AICodeOption[];
  verificationCommand: string;
  verificationInstructions: string;
  proTips: string[];
  suggestedCommitMessage: string;
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

function generateFallbackFix(
  item: AuditItem,
  targetUrl?: string,
  techStack?: TechStackItem[],
  customFramework?: string
): AIFixResponse {
  const techNames = techStack?.map((t) => t.name).join(', ') || 'General / Web Standard';
  const urlDomain = targetUrl ? new URL(targetUrl).hostname : 'yoursite.com';

  // Base fallback implementations based on item category and title
  const isSecurity = item.category === 'security';
  const isSeo = item.category === 'seo';
  const isBestPractice = item.category === 'best_practices';

  let codeImplementations: AICodeOption[] = [];
  let verificationCmd = `curl -I -s -L "https://${urlDomain}"`;
  let steps: AIFixStep[] = [];
  let riskLevel: 'Low' | 'Medium' | 'High' = item.severity === 'critical' ? 'Medium' : 'Low';
  let riskDescription = 'Configuration updates in production should first be validated in a staging environment.';

  if (item.codeSnippet) {
    codeImplementations.push({
      platform: 'Standard / Recommended',
      title: item.codeSnippet.title || 'Recommended Configuration',
      language: item.codeSnippet.language || 'nginx',
      code: item.codeSnippet.code,
      explanation: 'Apply this directive directly into your server block or application configuration file.',
    });
  }

  // Security Headers Fallback
  if (item.id.startsWith('sec_h_') || item.title.toLowerCase().includes('header') || item.title.toLowerCase().includes('hsts') || item.title.toLowerCase().includes('csp')) {
    codeImplementations = [
      {
        platform: 'Nginx',
        title: 'Nginx Directive (nginx.conf)',
        language: 'nginx',
        filePath: '/etc/nginx/conf.d/default.conf',
        code: item.codeSnippet?.code || `add_header X-Frame-Options "SAMEORIGIN" always;\nadd_header X-Content-Type-Options "nosniff" always;\nadd_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;\nadd_header Referrer-Policy "strict-origin-when-cross-origin" always;`,
        explanation: 'Add within the server { ... } block in your Nginx configuration and reload the service.',
      },
      {
        platform: 'Apache',
        title: 'Apache Directive (.htaccess)',
        language: 'apache',
        filePath: '.htaccess',
        code: `<IfModule mod_headers.c>\n  Header always set X-Content-Type-Options "nosniff"\n  Header always set X-Frame-Options "SAMEORIGIN"\n  Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"\n  Header always set Referrer-Policy "strict-origin-when-cross-origin"\n</IfModule>`,
        explanation: 'Verify that mod_headers is enabled (a2enmod headers) and insert into your root .htaccess file.',
      },
      {
        platform: 'Node.js / Express',
        title: 'Express Middleware (Helmet)',
        language: 'typescript',
        filePath: 'server.ts / app.js',
        code: `import helmet from 'helmet';\nimport express from 'express';\n\nconst app = express();\n// Automatically sets standard HTTP security headers\napp.use(helmet());`,
        explanation: 'Install the helmet package (`npm install helmet`) and register as the top middleware in Express.',
      },
      {
        platform: 'Next.js',
        title: 'Headers in next.config.js',
        language: 'javascript',
        filePath: 'next.config.js',
        code: `module.exports = {\n  async headers() {\n    return [\n      {\n        source: '/(.*)',\n        headers: [\n          { key: 'X-Content-Type-Options', value: 'nosniff' },\n          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },\n          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },\n        ],\n      },\n    ];\n  },\n};`,
        explanation: 'Define the headers() function in next.config.js so routes automatically serve headers in production.',
      },
    ];

    verificationCmd = `curl -I -s "https://${urlDomain}" | grep -i "${item.title.split(' ')[0]}"`;
    steps = [
      {
        stepNumber: 1,
        title: 'Identify your web server or edge gateway',
        description: `Your environment includes the following detected technologies: ${techNames}. Select the corresponding tab above.`,
      },
      {
        stepNumber: 2,
        title: 'Apply configuration or middleware',
        description: 'Open your web server configuration file or add middleware to your application source code.',
        code: item.codeSnippet?.code || codeImplementations[0].code,
        language: item.codeSnippet?.language || 'nginx',
      },
      {
        stepNumber: 3,
        title: 'Test and Reload Server',
        description: 'Execute `nginx -t` or `apachectl configtest` before reloading (`systemctl reload nginx`). Then deploy.',
      },
      {
        stepNumber: 4,
        title: 'Validate HTTP Response',
        description: 'Run the cURL verification command in your terminal to confirm the header is present.',
        code: verificationCmd,
        language: 'bash',
      },
    ];
  } else if (isSeo) {
    codeImplementations = [
      {
        platform: 'HTML / Frontend',
        title: 'Tags in HTML <head>',
        language: 'html',
        filePath: 'index.html / Layout.tsx',
        code: item.codeSnippet?.code || `<head>\n  <title>Descriptive & Optimized Title | Your Brand</title>\n  <meta name="description" content="Clear, engaging description between 120-155 characters." />\n  <link rel="canonical" href="https://${urlDomain}/" />\n  <meta name="robots" content="index, follow" />\n</head>`,
        explanation: 'Insert inside the <head> tag of your main HTML file or framework Head component.',
      },
      {
        platform: 'Next.js (App Router)',
        title: 'Metadata Object (layout.tsx)',
        language: 'typescript',
        filePath: 'app/layout.tsx',
        code: `import type { Metadata } from 'next';\n\nexport const metadata: Metadata = {\n  title: 'Optimized SEO Title | Brand',\n  description: 'Accurate description with targeted keywords.',\n  alternates: {\n    canonical: 'https://${urlDomain}',\n  },\n  robots: {\n    index: true,\n    follow: true,\n  },\n};`,
        explanation: 'Export the metadata object in layout.tsx or page.tsx for automated server-side tag generation.',
      },
    ];

    verificationCmd = `curl -s -L "https://${urlDomain}" | grep -i -E "(title|description|canonical|og:)"`;
    steps = [
      {
        stepNumber: 1,
        title: 'Locate HTML template or Layout file',
        description: 'Open the document where the `<head>` tag or Metadata component is declared.',
      },
      {
        stepNumber: 2,
        title: 'Apply recommended tag',
        description: 'Populate with appropriate content respecting character constraints and hierarchy.',
        code: codeImplementations[0].code,
        language: 'html',
      },
      {
        stepNumber: 3,
        title: 'Verify in browser and SEO tools',
        description: 'Inspect the generated source code and test with the Google Rich Results Test or Social Preview tab.',
      },
    ];
  } else {
    // General / Best practices / Performance
    codeImplementations = [
      {
        platform: 'Recommended Code',
        title: 'Direct Remediation',
        language: item.codeSnippet?.language || 'html',
        code: item.codeSnippet?.code || `<!-- Recommended remediation example -->\n<!-- ${item.summary} -->`,
        explanation: 'Implement this recommendation according to modern web accessibility and performance standards.',
      },
    ];

    steps = [
      {
        stepNumber: 1,
        title: 'Analyze affected element',
        description: item.summary,
      },
      {
        stepNumber: 2,
        title: 'Implement code fix',
        description: item.recommendedValue ? `Update to the recommended value: ${item.recommendedValue}` : 'Apply the provided code snippet.',
        code: item.codeSnippet?.code,
        language: item.codeSnippet?.language,
      },
      {
        stepNumber: 3,
        title: 'Re-audit website',
        description: 'Execute a new audit scan to confirm the category score improved.',
      },
    ];
  }

  return {
    itemId: item.id,
    itemTitle: item.title,
    headline: `Step-by-step remediation guide for: ${item.title}`,
    severity: item.severity,
    category: item.category,
    targetUrl,
    problemAnalysis: item.impact || item.summary || 'This item requires remediation to satisfy modern web standards.',
    estimatedTime: item.severity === 'critical' ? '5-10 minutes' : '2-5 minutes',
    riskLevel,
    riskDescription,
    steps,
    codeImplementations,
    verificationCommand: verificationCmd,
    verificationInstructions: 'Run this command in your terminal or inspect browser DevTools Network/Console to confirm proper execution.',
    proTips: [
      'Deploy in a staging environment before promoting to production.',
      'Maintain Git version control with atomic commits for each fix.',
      'Use the Compare or Re-Audit tools to validate score improvement.',
    ],
    suggestedCommitMessage: `fix(${item.category}): resolve ${item.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
  };
}

export async function generateAIFix(
  item: AuditItem,
  targetUrl?: string,
  techStack?: TechStackItem[],
  customFramework?: string,
  userQuestion?: string
): Promise<AIFixResponse> {
  const ai = getAiClient();
  if (!ai) {
    return generateFallbackFix(item, targetUrl, techStack, customFramework);
  }

  try {
    const techSummary = techStack && techStack.length > 0
      ? techStack.map((t) => `${t.name} (${t.category})`).join(', ')
      : 'Unspecified / Standard Web';

    const prompt = `
You are a Principal Web Infrastructure, Security, and Performance Engineer (SRE/Architect).
Generate an EXTREMELY PRECISE, step-by-step remediation guide with real copy-paste code snippets and executable CLI commands to resolve the following website audit finding.

AUDIT DATA:
- Item ID: "${item.id}"
- Issue Title: "${item.title}"
- Category: "${item.category}"
- Severity: "${item.severity}"
- Current Score: ${item.score}/100
- Problem Summary: "${item.summary}"
- Impact & Risk: "${item.impact || 'Not detailed'}"
- Current Detected Value: "${item.currentValue || 'Not configured / Incorrect'}"
- Recommended Target: "${item.recommendedValue || 'Recommended according to W3C / OWASP / Google standards'}"
- Suggested Existing Snippet: "${item.codeSnippet?.code || 'N/A'}"
- Target URL: "${targetUrl || 'Audited website'}"
- Detected Stack & Technologies: "${techSummary}"
${customFramework ? `- Requested Framework / Platform: "${customFramework}"` : ''}
${userQuestion ? `- Specific User Question / Follow-up: "${userQuestion}"` : ''}

MANDATORY INSTRUCTIONS:
1. Provide practical, direct step-by-step instructions (Step 1, Step 2, Step 3, etc.).
2. Provide complete, ready-to-use code implementations for the relevant popular stacks (e.g., Nginx, Apache, Node.js/Express Helmet, Next.js, HTML/React, WordPress .htaccess/PHP, Cloudflare Rules).
3. Specify exact standard file paths (e.g., /etc/nginx/conf.d/site.conf, .htaccess, next.config.js, server.ts).
4. Provide an executable cURL command or terminal tool for the developer to verify the fix on "${targetUrl || 'https://example.com'}".
5. Evaluate regression risk ("Low", "Medium", "High") and specify safety precautions.
6. Respond in English with pristine technical terminology.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'You are an expert in web development, DevSecOps, and technical website audits. Generate structured JSON responses with surgical accuracy in English.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: {
              type: Type.STRING,
              description: 'Concise technical summary headline of the fix.',
            },
            problemAnalysis: {
              type: Type.STRING,
              description: 'Clear technical analysis of why this problem occurs and associated risks.',
            },
            estimatedTime: {
              type: Type.STRING,
              description: 'Estimated implementation time (e.g. 3-5 minutes).',
            },
            riskLevel: {
              type: Type.STRING,
              enum: ['Low', 'Medium', 'High'],
              description: 'Risk level of regression or breaking changes.',
            },
            riskDescription: {
              type: Type.STRING,
              description: 'Caution notes, potential side effects, and rollback strategy.',
            },
            steps: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  stepNumber: { type: Type.INTEGER },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  filePath: { type: Type.STRING },
                  code: { type: Type.STRING },
                  language: { type: Type.STRING },
                },
                required: ['stepNumber', 'title', 'description'],
              },
            },
            codeImplementations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  platform: { type: Type.STRING, description: 'E.g., Nginx, Apache, Node.js (Express), Next.js, HTML, WordPress' },
                  title: { type: Type.STRING },
                  language: { type: Type.STRING },
                  filePath: { type: Type.STRING },
                  code: { type: Type.STRING },
                  explanation: { type: Type.STRING },
                },
                required: ['platform', 'title', 'language', 'code', 'explanation'],
              },
            },
            verificationCommand: {
              type: Type.STRING,
              description: 'cURL or bash command to validate fix.',
            },
            verificationInstructions: {
              type: Type.STRING,
              description: 'How to interpret the verification command output.',
            },
            proTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2 to 3 advanced professional tips.',
            },
            suggestedCommitMessage: {
              type: Type.STRING,
              description: 'Conventional commit message (e.g. fix(security): add hsts header).',
            },
          },
          required: [
            'headline',
            'problemAnalysis',
            'estimatedTime',
            'riskLevel',
            'steps',
            'codeImplementations',
            'verificationCommand',
            'verificationInstructions',
            'proTips',
            'suggestedCommitMessage',
          ],
        },
      },
    });

    const text = response.text?.trim();
    if (!text) {
      return generateFallbackFix(item, targetUrl, techStack, customFramework);
    }

    const parsed = JSON.parse(text);
    return {
      itemId: item.id,
      itemTitle: item.title,
      headline: parsed.headline || `Technical fix for ${item.title}`,
      severity: item.severity,
      category: item.category,
      targetUrl,
      problemAnalysis: parsed.problemAnalysis || item.impact || item.summary,
      estimatedTime: parsed.estimatedTime || '5 minutes',
      riskLevel: parsed.riskLevel || (item.severity === 'critical' ? 'Medium' : 'Low'),
      riskDescription: parsed.riskDescription || 'Test in a controlled staging environment before deploying to production.',
      steps: Array.isArray(parsed.steps) ? parsed.steps : [],
      codeImplementations: Array.isArray(parsed.codeImplementations) ? parsed.codeImplementations : [],
      verificationCommand: parsed.verificationCommand || `curl -I -s "https://${targetUrl ? new URL(targetUrl).hostname : 'yoursite.com'}"`,
      verificationInstructions: parsed.verificationInstructions || 'Confirm that the expected header or tag returns 200 OK.',
      proTips: Array.isArray(parsed.proTips) ? parsed.proTips : [],
      suggestedCommitMessage: parsed.suggestedCommitMessage || `fix: resolve ${item.title.toLowerCase()}`,
    };
  } catch (err) {
    console.error('Error generating AI fix via Gemini:', err);
    return generateFallbackFix(item, targetUrl, techStack, customFramework);
  }
}
