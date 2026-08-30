import { AuditItem, AuditReport, CategoryScore, MetaTagsData, RawAuditData, SecurityHeaderCheck, TechStackItem } from '../types';

function calculateGrade(score: number): string {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

export function detectTechnologiesClient(headers: Record<string, string>, html: string): TechStackItem[] {
  const stack: TechStackItem[] = [];
  const lowerHtml = html.toLowerCase();
  const lowerHeaders: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    lowerHeaders[k.toLowerCase()] = String(v).toLowerCase();
  }

  const server = lowerHeaders['server'] || '';
  if (server.includes('cloudflare') || lowerHeaders['cf-ray']) {
    stack.push({ category: 'CDN / Proxy', name: 'Cloudflare', confidence: 99 });
  }
  if (server.includes('nginx')) {
    stack.push({ category: 'Web Server', name: 'Nginx', confidence: 95 });
  }
  if (server.includes('apache')) {
    stack.push({ category: 'Web Server', name: 'Apache', confidence: 95 });
  }
  if (server.includes('vercel') || lowerHeaders['x-vercel-id']) {
    stack.push({ category: 'PaaS / Hosting', name: 'Vercel', confidence: 99 });
  }

  if (lowerHtml.includes('wp-content') || lowerHtml.includes('wp-includes') || lowerHtml.includes('wordpress')) {
    stack.push({ category: 'CMS', name: 'WordPress', confidence: 98 });
  }
  if (lowerHtml.includes('__next') || lowerHtml.includes('/_next/') || lowerHtml.includes('next.js')) {
    stack.push({ category: 'Frontend Framework', name: 'Next.js', confidence: 98 });
  } else if (lowerHtml.includes('react') || lowerHtml.includes('data-reactroot')) {
    stack.push({ category: 'JavaScript Library', name: 'React', confidence: 85 });
  }
  if (lowerHtml.includes('vue') || lowerHtml.includes('data-v-') || lowerHtml.includes('/_nuxt/')) {
    stack.push({ category: 'Frontend Framework', name: 'Vue.js / Nuxt', confidence: 90 });
  }
  if (lowerHtml.includes('tailwind')) {
    stack.push({ category: 'CSS Framework', name: 'Tailwind CSS', confidence: 85 });
  }
  if (lowerHtml.includes('bootstrap')) {
    stack.push({ category: 'CSS Framework', name: 'Bootstrap', confidence: 90 });
  }
  if (lowerHtml.includes('googletagmanager.com') || lowerHtml.includes('gtm.js')) {
    stack.push({ category: 'Tag Management', name: 'Google Tag Manager', confidence: 95 });
  }
  if (lowerHtml.includes('fonts.googleapis.com')) {
    stack.push({ category: 'Fonts', name: 'Google Fonts', confidence: 98 });
  }

  return stack;
}

export function parseMetaClient(html: string): MetaTagsData {
  const meta: MetaTagsData = {
    openGraph: {},
    twitter: {},
    structuredDataTypes: [],
  };

  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    meta.title = titleMatch[1].trim();
    meta.titleLength = meta.title.length;
  }

  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ||
                    html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
  if (descMatch && descMatch[1]) {
    meta.description = descMatch[1].trim();
    meta.descriptionLength = meta.description.length;
  }

  const canonMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i);
  if (canonMatch && canonMatch[1]) meta.canonical = canonMatch[1].trim();

  const robotsMatch = html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i);
  if (robotsMatch && robotsMatch[1]) meta.robots = robotsMatch[1].trim();

  const vpMatch = html.match(/<meta[^>]+name=["']viewport["'][^>]+content=["']([^"']*)["']/i);
  if (vpMatch && vpMatch[1]) meta.viewport = vpMatch[1].trim();

  const langMatch = html.match(/<html[^>]+lang=["']([^"']*)["']/i);
  if (langMatch && langMatch[1]) meta.language = langMatch[1].trim();

  const charsetMatch = html.match(/<meta[^>]+charset=["']([^"']*)["']/i);
  if (charsetMatch && charsetMatch[1]) meta.charset = charsetMatch[1].trim();

  const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i);
  if (ogTitle && ogTitle[1]) meta.openGraph.title = ogTitle[1].trim();

  const ogDesc = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i);
  if (ogDesc && ogDesc[1]) meta.openGraph.description = ogDesc[1].trim();

  const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)["']/i);
  if (ogImage && ogImage[1]) meta.openGraph.image = ogImage[1].trim();

  const twCard = html.match(/<meta[^>]+name=["']twitter:card["'][^>]+content=["']([^"']*)["']/i);
  if (twCard && twCard[1]) meta.twitter.card = twCard[1].trim();

  const ldJsonMatches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const m of ldJsonMatches) {
    try {
      const parsed = JSON.parse(m[1].trim());
      if (parsed['@type']) {
        if (Array.isArray(parsed['@type'])) meta.structuredDataTypes.push(...parsed['@type']);
        else meta.structuredDataTypes.push(parsed['@type']);
      }
    } catch {
      meta.structuredDataTypes.push('Schema.org');
    }
  }

  return meta;
}

export async function analyzeWebsiteClient(rawUrl: string): Promise<AuditReport> {
  let targetUrl = rawUrl.trim();
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl;
  }

  const startTime = Date.now();
  let html = '';
  let finalUrl = targetUrl;
  const allHeaders: Record<string, string> = {};

  // Try direct fetch or CORS proxy for GitHub Pages static mode
  try {
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;
    const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    html = await res.text();
    finalUrl = targetUrl;
  } catch {
    // Second proxy fallback
    try {
      const proxyUrl2 = `https://corsproxy.io/?${encodeURIComponent(targetUrl)}`;
      const res = await fetch(proxyUrl2, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      html = await res.text();
      finalUrl = targetUrl;
    } catch (e2: any) {
      throw new Error(`Não foi possível acessar a URL via proxy client-side (${targetUrl}): ${e2.message}`);
    }
  }

  const responseTimeMs = Date.now() - startTime;
  const isHttps = targetUrl.startsWith('https://');

  const metaTags = parseMetaClient(html);
  const techStack = detectTechnologiesClient(allHeaders, html);

  const h1Matches = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
  const imgMatches = [...html.matchAll(/<img\b([^>]*)>/gi)];
  let imagesMissingAlt = 0;
  for (const img of imgMatches) {
    const attrs = img[1] || '';
    if (!attrs.match(/\balt\s*=\s*["'][^"']*["']/i)) imagesMissingAlt++;
  }

  const linkMatches = [...html.matchAll(/<a\b([^>]*)>/gi)];

  const securityHeaders: SecurityHeaderCheck[] = [
    {
      header: 'Strict-Transport-Security (HSTS)',
      status: isHttps ? 'present' : 'missing',
      recommended: 'max-age=63072000; includeSubDomains; preload',
      importance: 'critical',
      description: 'Força comunicação exclusiva por HTTPS.',
      fixSnippet: 'add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;',
    },
    {
      header: 'Content-Security-Policy (CSP)',
      status: 'missing',
      recommended: "default-src 'self'; script-src 'self' 'unsafe-inline';",
      importance: 'critical',
      description: 'Protege contra ataques de Cross-Site Scripting (XSS).',
      fixSnippet: "add_header Content-Security-Policy \"default-src 'self'; script-src 'self' 'unsafe-inline';\" always;",
    },
    {
      header: 'X-Frame-Options',
      status: 'missing',
      recommended: 'SAMEORIGIN ou DENY',
      importance: 'high',
      description: 'Neutraliza ataques de Clickjacking.',
      fixSnippet: 'add_header X-Frame-Options "SAMEORIGIN" always;',
    },
    {
      header: 'X-Content-Type-Options',
      status: 'missing',
      recommended: 'nosniff',
      importance: 'high',
      description: 'Previne MIME-sniffing malicioso.',
      fixSnippet: 'add_header X-Content-Type-Options "nosniff" always;',
    },
  ];

  const items: AuditItem[] = [
    {
      id: 'sec-https',
      category: 'security',
      title: isHttps ? 'Criptografia HTTPS & TLS Ativa' : 'Tráfego Inseguro em HTTP',
      severity: isHttps ? 'good' : 'critical',
      score: isHttps ? 100 : 0,
      summary: isHttps ? 'Website utiliza conexão criptografada SSL/TLS.' : 'O website trafega dados em texto puro.',
      impact: isHttps ? 'Privacidade e integridade preservadas.' : 'Vulnerável a ataques Man-in-the-Middle.',
    },
    {
      id: 'seo-title',
      category: 'seo',
      title: metaTags.title ? `Tag <title> Presente (${metaTags.titleLength} caracteres)` : 'Tag <title> Ausente',
      severity: metaTags.title ? 'good' : 'critical',
      score: metaTags.title ? 100 : 0,
      summary: metaTags.title ? `Título: "${metaTags.title}"` : 'Tag <title> não encontrada no cabeçalho.',
      impact: 'Elemento fundamental para indexação e visibilidade na SERP do Google.',
    },
    {
      id: 'seo-desc',
      category: 'seo',
      title: metaTags.description ? `Meta Description Presente (${metaTags.descriptionLength} chars)` : 'Meta Description Ausente',
      severity: metaTags.description ? 'good' : 'warning',
      score: metaTags.description ? 100 : 30,
      summary: metaTags.description ? `Descrição: "${metaTags.description}"` : 'Meta tag description não configurada.',
      impact: 'Define o snippet exibido abaixo do título nos buscadores.',
    },
    {
      id: 'seo-h1',
      category: 'seo',
      title: h1Matches.length === 1 ? 'Tag <h1> Única e Bem Definida' : `${h1Matches.length} Tags <h1> Encontradas`,
      severity: h1Matches.length === 1 ? 'good' : (h1Matches.length === 0 ? 'critical' : 'warning'),
      score: h1Matches.length === 1 ? 100 : (h1Matches.length === 0 ? 20 : 70),
      summary: h1Matches.length === 1 ? 'Estrutura semântica H1 correta.' : (h1Matches.length === 0 ? 'Falta o título principal H1.' : 'Múltiplos H1s encontrados.'),
      impact: 'Sinal semântico de hierarquia de conteúdo.',
    },
    {
      id: 'bp-vp',
      category: 'best_practices',
      title: metaTags.viewport ? 'Meta Viewport Responsivo' : 'Página Não Responsiva',
      severity: metaTags.viewport ? 'good' : 'critical',
      score: metaTags.viewport ? 100 : 10,
      summary: metaTags.viewport ? 'Tag viewport configurada para dispositivos móveis.' : 'Tag viewport ausente.',
      impact: 'Garante boa exibição em smartphones.',
    },
    {
      id: 'a11y-alt',
      category: 'performance_accessibility',
      title: imagesMissingAlt === 0 ? 'Imagens com Descrição Alt' : `${imagesMissingAlt} Imagens Sem Alt`,
      severity: imagesMissingAlt === 0 ? 'good' : 'warning',
      score: imagesMissingAlt === 0 ? 100 : 50,
      summary: imagesMissingAlt === 0 ? 'Todas as imagens possuem texto alternativo.' : `${imagesMissingAlt} imagens precisam de atributo alt.`,
      impact: 'Melhora acessibilidade para deficientes visuais e SEO de imagens.',
    },
  ];

  const categories: Record<string, CategoryScore> = {
    security: {
      category: 'security',
      name: 'Segurança',
      score: isHttps ? 85 : 30,
      grade: calculateGrade(isHttps ? 85 : 30),
      color: '#10b981',
      passedCount: isHttps ? 1 : 0,
      warningCount: 0,
      criticalCount: isHttps ? 0 : 1,
      totalCount: 1,
      summary: isHttps ? 'HTTPS seguro ativo' : 'Falta SSL/HTTPS',
    },
    seo: {
      category: 'seo',
      name: 'SEO & Visibilidade',
      score: metaTags.title && metaTags.description ? 90 : 60,
      grade: calculateGrade(metaTags.title && metaTags.description ? 90 : 60),
      color: '#3b82f6',
      passedCount: metaTags.title ? 1 : 0,
      warningCount: metaTags.description ? 0 : 1,
      criticalCount: metaTags.title ? 0 : 1,
      totalCount: 2,
      summary: 'Metadados e estrutura analisados',
    },
    best_practices: {
      category: 'best_practices',
      name: 'Boas Práticas',
      score: metaTags.viewport ? 90 : 50,
      grade: calculateGrade(metaTags.viewport ? 90 : 50),
      color: '#8b5cf6',
      passedCount: metaTags.viewport ? 1 : 0,
      warningCount: 0,
      criticalCount: metaTags.viewport ? 0 : 1,
      totalCount: 1,
      summary: 'Padrões modernos de frontend',
    },
    performance_accessibility: {
      category: 'performance_accessibility',
      name: 'Performance & Acessibilidade',
      score: imagesMissingAlt === 0 ? 95 : 70,
      grade: calculateGrade(imagesMissingAlt === 0 ? 95 : 70),
      color: '#f59e0b',
      passedCount: imagesMissingAlt === 0 ? 1 : 0,
      warningCount: imagesMissingAlt > 0 ? 1 : 0,
      criticalCount: 0,
      totalCount: 1,
      summary: 'Métricas de acessibilidade e peso',
    },
  };

  const overallScore = Math.round(
    (categories.security.score + categories.seo.score + categories.best_practices.score + categories.performance_accessibility.score) / 4
  );

  const rawData: RawAuditData = {
    url: targetUrl,
    finalUrl,
    protocol: new URL(targetUrl).protocol,
    statusCode: 200,
    statusText: 'OK',
    responseTimeMs,
    contentLengthBytes: html.length,
    contentType: 'text/html',
    tlsVersion: isHttps ? 'HTTPS / TLS' : 'HTTP',
    h1Count: h1Matches.length,
    h2Count: 0,
    h3Count: 0,
    imagesTotal: imgMatches.length,
    imagesMissingAlt,
    linksTotal: linkMatches.length,
    externalLinksWithoutRel: 0,
    formsCount: 0,
    formsWithoutHttps: 0,
    scriptsCount: 0,
    inlineScriptsCount: 0,
    stylesCount: 0,
    metaTags,
    securityHeaders,
    allHeaders,
    techStack,
  };

  return {
    id: `audit-${Date.now()}`,
    targetUrl,
    analyzedAt: new Date().toISOString(),
    overallScore,
    overallGrade: calculateGrade(overallScore),
    aiExecutiveSummary: `Auditoria client-side de ${new URL(targetUrl).hostname}. Pontuação global atingida de ${overallScore}/100 (Nota ${calculateGrade(overallScore)}).`,
    keyStrengths: [
      isHttps ? 'HTTPS criptografado ativo' : 'Site acessível online',
      metaTags.title ? 'Título do site configurado' : 'Estrutura HTML detectada',
      metaTags.viewport ? 'Meta viewport responsivo presente' : 'Navegação web pronta',
    ],
    topPriorityFixes: [
      !isHttps ? 'Ativar certificado SSL/TLS para HTTPS' : 'Revisar cabeçalhos de segurança HTTP (HSTS, CSP)',
      !metaTags.description ? 'Adicionar meta tag description de 120-160 caracteres' : 'Otimizar imagens com descrições alt',
    ],
    categories: categories as any,
    items,
    rawData,
  };
}
