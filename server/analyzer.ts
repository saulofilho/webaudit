import { GoogleGenAI, Type } from '@google/genai';
import { AuditItem, AuditReport, CategoryScore, MetaTagsData, RawAuditData, SecurityHeaderCheck } from '../src/types';
import { detectTechnologies } from './techDetector';

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

function calculateGrade(score: number): string {
  if (score >= 95) return 'A+';
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function parseMeta(html: string): MetaTagsData {
  const meta: MetaTagsData = {
    openGraph: {},
    twitter: {},
    structuredDataTypes: [],
  };

  // Title
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  if (titleMatch && titleMatch[1]) {
    meta.title = titleMatch[1].trim();
    meta.titleLength = meta.title.length;
  }

  // Meta Description
  const descMatch = html.match(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i) ||
                    html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i);
  if (descMatch && descMatch[1]) {
    meta.description = descMatch[1].trim();
    meta.descriptionLength = meta.description.length;
  }

  // Canonical
  const canonMatch = html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i) ||
                     html.match(/<link[^>]+href=["']([^"']*)["'][^>]+rel=["']canonical["']/i);
  if (canonMatch && canonMatch[1]) {
    meta.canonical = canonMatch[1].trim();
  }

  // Robots
  const robotsMatch = html.match(/<meta[^>]+name=["']robots["'][^>]+content=["']([^"']*)["']/i) ||
                      html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']robots["']/i);
  if (robotsMatch && robotsMatch[1]) {
    meta.robots = robotsMatch[1].trim();
  }

  // Viewport
  const vpMatch = html.match(/<meta[^>]+name=["']viewport["'][^>]+content=["']([^"']*)["']/i) ||
                  html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']viewport["']/i);
  if (vpMatch && vpMatch[1]) {
    meta.viewport = vpMatch[1].trim();
  }

  // Language
  const langMatch = html.match(/<html[^>]+lang=["']([^"']*)["']/i);
  if (langMatch && langMatch[1]) {
    meta.language = langMatch[1].trim();
  }

  // Charset
  const charsetMatch = html.match(/<meta[^>]+charset=["']([^"']*)["']/i) ||
                       html.match(/<meta[^>]+http-equiv=["']content-type["'][^>]+content=["'][^"']*charset=([^"';\s]+)/i);
  if (charsetMatch && charsetMatch[1]) {
    meta.charset = charsetMatch[1].trim();
  }

  // Favicon
  const iconMatch = html.match(/<link[^>]+rel=["'](?:icon|shortcut icon|apple-touch-icon)["'][^>]+href=["']([^"']*)["']/i);
  if (iconMatch && iconMatch[1]) {
    meta.favicon = iconMatch[1].trim();
  }

  // Open Graph
  const ogTitle = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i) ||
                  html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:title["']/i);
  if (ogTitle && ogTitle[1]) meta.openGraph.title = ogTitle[1].trim();

  const ogDesc = html.match(/<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i) ||
                 html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:description["']/i);
  if (ogDesc && ogDesc[1]) meta.openGraph.description = ogDesc[1].trim();

  const ogImage = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)["']/i) ||
                  html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:image["']/i);
  if (ogImage && ogImage[1]) meta.openGraph.image = ogImage[1].trim();

  const ogUrl = html.match(/<meta[^>]+property=["']og:url["'][^>]+content=["']([^"']*)["']/i) ||
                html.match(/<meta[^>]+content=["']([^"']*)["'][^>]+property=["']og:url["']/i);
  if (ogUrl && ogUrl[1]) meta.openGraph.url = ogUrl[1].trim();

  const ogSite = html.match(/<meta[^>]+property=["']og:site_name["'][^>]+content=["']([^"']*)["']/i);
  if (ogSite && ogSite[1]) meta.openGraph.siteName = ogSite[1].trim();

  // Twitter
  const twCard = html.match(/<meta[^>]+name=["']twitter:card["'][^>]+content=["']([^"']*)["']/i);
  if (twCard && twCard[1]) meta.twitter.card = twCard[1].trim();

  const twTitle = html.match(/<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']*)["']/i);
  if (twTitle && twTitle[1]) meta.twitter.title = twTitle[1].trim();

  const twDesc = html.match(/<meta[^>]+name=["']twitter:description["'][^>]+content=["']([^"']*)["']/i);
  if (twDesc && twDesc[1]) meta.twitter.description = twDesc[1].trim();

  const twImage = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']*)["']/i);
  if (twImage && twImage[1]) meta.twitter.image = twImage[1].trim();

  // Structured Data JSON-LD
  const ldJsonMatches = html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  for (const m of ldJsonMatches) {
    try {
      const parsed = JSON.parse(m[1].trim());
      if (parsed['@type']) {
        if (Array.isArray(parsed['@type'])) {
          meta.structuredDataTypes.push(...parsed['@type']);
        } else {
          meta.structuredDataTypes.push(parsed['@type']);
        }
      }
    } catch {
      meta.structuredDataTypes.push('Schema.org (JSON-LD)');
    }
  }

  return meta;
}

function checkSecurityHeaders(headers: Record<string, string>, isHttps: boolean): SecurityHeaderCheck[] {
  const lower: Record<string, string> = {};
  for (const [k, v] of Object.entries(headers)) {
    lower[k.toLowerCase()] = String(v);
  }

  const checks: SecurityHeaderCheck[] = [
    {
      header: 'Strict-Transport-Security (HSTS)',
      status: lower['strict-transport-security'] ? 'present' : (isHttps ? 'missing' : 'insecure'),
      value: lower['strict-transport-security'],
      recommended: 'max-age=63072000; includeSubDomains; preload',
      importance: 'critical',
      description: 'Força navegadores a se comunicarem apenas via HTTPS, prevenindo ataques Man-in-the-Middle e SSL stripping.',
      fixSnippet: 'add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload" always;',
    },
    {
      header: 'Content-Security-Policy (CSP)',
      status: lower['content-security-policy'] ? 'present' : 'missing',
      value: lower['content-security-policy'],
      recommended: "default-src 'self'; script-src 'self' 'unsafe-inline'; object-src 'none';",
      importance: 'critical',
      description: 'Bloqueia injeção de scripts maliciosos (XSS), clickjacking e execução de recursos não autorizados.',
      fixSnippet: "add_header Content-Security-Policy \"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:;\" always;",
    },
    {
      header: 'X-Frame-Options',
      status: lower['x-frame-options'] ? 'present' : 'missing',
      value: lower['x-frame-options'],
      recommended: 'DENY ou SAMEORIGIN',
      importance: 'high',
      description: 'Impede que o site seja embutido em iframes por páginas de terceiros, neutralizando ataques de Clickjacking.',
      fixSnippet: 'add_header X-Frame-Options "SAMEORIGIN" always;',
    },
    {
      header: 'X-Content-Type-Options',
      status: lower['x-content-type-options']?.toLowerCase().includes('nosniff') ? 'present' : 'missing',
      value: lower['x-content-type-options'],
      recommended: 'nosniff',
      importance: 'high',
      description: 'Instrui o navegador a não adivinhar (MIME-sniffing) o tipo de conteúdo, prevenindo execução disfarçada de arquivos maliciosos.',
      fixSnippet: 'add_header X-Content-Type-Options "nosniff" always;',
    },
    {
      header: 'Referrer-Policy',
      status: lower['referrer-policy'] ? 'present' : 'missing',
      value: lower['referrer-policy'],
      recommended: 'strict-origin-when-cross-origin',
      importance: 'medium',
      description: 'Controla a quantidade de informações de URL de referência (Referer) enviadas ao navegar para outros sites.',
      fixSnippet: 'add_header Referrer-Policy "strict-origin-when-cross-origin" always;',
    },
    {
      header: 'Permissions-Policy',
      status: lower['permissions-policy'] ? 'present' : 'missing',
      value: lower['permissions-policy'],
      recommended: 'camera=(), microphone=(), geolocation=()',
      importance: 'medium',
      description: 'Restringe quais APIs do navegador (câmera, microfone, geolocalização) podem ser utilizadas pela página ou por iframes.',
      fixSnippet: 'add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;',
    },
    {
      header: 'Cross-Origin-Opener-Policy (COOP)',
      status: lower['cross-origin-opener-policy'] ? 'present' : 'missing',
      value: lower['cross-origin-opener-policy'],
      recommended: 'same-origin',
      importance: 'medium',
      description: 'Isola o contexto de navegação contra janelas cross-origin que possam tentar interagir via window.opener.',
      fixSnippet: 'add_header Cross-Origin-Opener-Policy "same-origin" always;',
    },
  ];

  return checks;
}

export async function analyzeWebsite(rawUrl: string): Promise<AuditReport> {
  let targetUrl = rawUrl.trim();
  if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
    targetUrl = 'https://' + targetUrl;
  }

  const startTime = Date.now();
  let response: Response;
  let finalUrl = targetUrl;
  let html = '';
  let statusCode = 0;
  let statusText = 'OK';
  const allHeaders: Record<string, string> = {};

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    response = await fetch(targetUrl, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 WebsiteAuditBot/2.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      },
    });
    clearTimeout(timeout);

    finalUrl = response.url || targetUrl;
    statusCode = response.status;
    statusText = response.statusText || 'OK';

    response.headers.forEach((val, key) => {
      allHeaders[key.toLowerCase()] = val;
    });

    html = await response.text();
  } catch (err: any) {
    // If fetch failed (e.g. SSL error or invalid domain), generate structured error report
    throw new Error(`Não foi possível carregar a URL (${targetUrl}): ${err.message || 'Erro de conexão ou timeout'}`);
  }

  const responseTimeMs = Date.now() - startTime;
  const isHttps = finalUrl.startsWith('https://');
  const contentLengthBytes = html.length;

  // DOM Counts
  const h1Matches = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/gi) || [];
  const h2Matches = html.match(/<h2[^>]*>([\s\S]*?)<\/h2>/gi) || [];
  const h3Matches = html.match(/<h3[^>]*>([\s\S]*?)<\/h3>/gi) || [];
  const h1Sample = h1Matches.length > 0 ? h1Matches[0].replace(/<[^>]+>/g, '').trim() : undefined;

  const imgMatches = [...html.matchAll(/<img\b([^>]*)>/gi)];
  let imagesMissingAlt = 0;
  for (const img of imgMatches) {
    const attrs = img[1] || '';
    if (!attrs.match(/\balt\s*=\s*["'][^"']*["']/i)) {
      imagesMissingAlt++;
    }
  }

  const linkMatches = [...html.matchAll(/<a\b([^>]*)>/gi)];
  let externalLinksWithoutRel = 0;
  const parsedTargetHost = new URL(finalUrl).hostname.toLowerCase();
  for (const link of linkMatches) {
    const attrs = link[1] || '';
    const hrefMatch = attrs.match(/\bhref\s*=\s*["']([^"']*)["']/i);
    if (hrefMatch && hrefMatch[1]) {
      const href = hrefMatch[1];
      if (href.startsWith('http://') || href.startsWith('https://')) {
        try {
          const linkHost = new URL(href).hostname.toLowerCase();
          if (linkHost !== parsedTargetHost && !attrs.match(/\brel\s*=\s*["'][^"']*(?:noopener|noreferrer)[^"']*["']/i)) {
            externalLinksWithoutRel++;
          }
        } catch {
          // ignore
        }
      }
    }
  }

  const formMatches = [...html.matchAll(/<form\b([^>]*)>/gi)];
  let formsWithoutHttps = 0;
  for (const form of formMatches) {
    const attrs = form[1] || '';
    const actionMatch = attrs.match(/\baction\s*=\s*["']([^"']*)["']/i);
    if (actionMatch && actionMatch[1] && actionMatch[1].startsWith('http://')) {
      formsWithoutHttps++;
    }
  }

  const scriptMatches = [...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)];
  let inlineScriptsCount = 0;
  for (const s of scriptMatches) {
    const attrs = s[1] || '';
    if (!attrs.match(/\bsrc\s*=/i) && s[2].trim().length > 0) {
      inlineScriptsCount++;
    }
  }

  const styleMatches = [...html.matchAll(/<style\b[^>]*>([\s\S]*?)<\/style>/gi)];

  const metaTags = parseMeta(html);
  const securityHeaders = checkSecurityHeaders(allHeaders, isHttps);
  const techStack = detectTechnologies(allHeaders, html);

  const rawData: RawAuditData = {
    url: targetUrl,
    finalUrl,
    protocol: new URL(finalUrl).protocol,
    statusCode,
    statusText,
    responseTimeMs,
    contentLengthBytes,
    contentType: allHeaders['content-type'] || 'text/html',
    serverHeader: allHeaders['server'],
    tlsVersion: isHttps ? 'TLS 1.2 / TLS 1.3 (HTTPS)' : 'Inseguro (HTTP puro)',
    h1Count: h1Matches.length,
    h2Count: h2Matches.length,
    h3Count: h3Matches.length,
    h1Sample,
    imagesTotal: imgMatches.length,
    imagesMissingAlt,
    linksTotal: linkMatches.length,
    externalLinksWithoutRel,
    formsCount: formMatches.length,
    formsWithoutHttps,
    scriptsCount: scriptMatches.length,
    inlineScriptsCount,
    stylesCount: styleMatches.length,
    metaTags,
    securityHeaders,
    allHeaders,
    techStack,
  };

  // Build audit items
  const items: AuditItem[] = [];

  // ================= 1. SECURITY AUDITS =================
  // HTTPS
  if (isHttps) {
    items.push({
      id: 'sec-https',
      category: 'security',
      title: 'Criptografia HTTPS & TLS Ativa',
      severity: 'good',
      score: 100,
      summary: 'O website utiliza protocolo seguro HTTPS criptografado com certificado SSL/TLS.',
      impact: 'Protege a privacidade dos dados em trânsito e assegura autenticidade contra interceptações.',
      currentValue: 'https://',
      recommendedValue: 'https://',
    });
  } else {
    items.push({
      id: 'sec-https',
      category: 'security',
      title: 'Tráfego Inseguro em HTTP Puro',
      severity: 'critical',
      score: 0,
      summary: 'O website está trafegando em texto puro sem certificado SSL/TLS, permitindo que terceiros espionem ou adulterem o conteúdo.',
      impact: 'Risco altíssimo de interceptação de dados, ataques Man-in-the-Middle e penalização severa no Google.',
      currentValue: 'http://',
      recommendedValue: 'https://',
      codeSnippet: {
        language: 'nginx',
        title: 'Redirecionamento Forçado para HTTPS (Nginx)',
        code: `server {
    listen 80;
    server_name seu-dominio.com www.seu-dominio.com;
    return 301 https://$host$request_uri;
}`,
      },
    });
  }

  // Security Headers
  securityHeaders.forEach((sh, idx) => {
    if (sh.status === 'present') {
      items.push({
        id: `sec-header-${idx}`,
        category: 'security',
        title: `Cabeçalho ${sh.header} Configurado`,
        severity: 'good',
        score: 100,
        summary: `O cabeçalho de proteção ${sh.header} está ativo e transmitindo diretivas seguras.`,
        impact: sh.description,
        currentValue: sh.value,
        recommendedValue: sh.recommended,
      });
    } else {
      const isCritical = sh.importance === 'critical';
      items.push({
        id: `sec-header-${idx}`,
        category: 'security',
        title: `Cabeçalho ${sh.header} Ausente`,
        severity: isCritical ? 'critical' : 'warning',
        score: isCritical ? 20 : 50,
        summary: `O servidor não enviou o cabeçalho de segurança ${sh.header}.`,
        impact: sh.description,
        currentValue: 'Não configurado',
        recommendedValue: sh.recommended,
        codeSnippet: sh.fixSnippet ? {
          language: 'nginx',
          title: `Configurar no Nginx`,
          code: sh.fixSnippet,
        } : undefined,
      });
    }
  });

  // Server Header Leakage
  if (allHeaders['server'] || allHeaders['x-powered-by']) {
    const leak = [allHeaders['server'], allHeaders['x-powered-by']].filter(Boolean).join(' / ');
    items.push({
      id: 'sec-server-leak',
      category: 'security',
      title: 'Vazamento de Assinatura do Servidor (Server Banner)',
      severity: 'warning',
      score: 60,
      summary: `O servidor expõe tecnologias internas via cabeçalhos HTTP (${leak}).`,
      impact: 'Facilita reconhecimento automatizado por scanners de vulnerabilidades que buscam exploits conhecidos para versões específicas.',
      currentValue: leak,
      recommendedValue: 'Ocultar versão e banner do servidor',
      codeSnippet: {
        language: 'nginx',
        title: 'Ocultar versões no Nginx & Express',
        code: `# No nginx.conf:
server_tokens off;

# No Express.js:
app.disable('x-powered-by');`,
      },
    });
  } else {
    items.push({
      id: 'sec-server-leak',
      category: 'security',
      title: 'Cabeçalhos de Versão Ocultados',
      severity: 'good',
      score: 100,
      summary: 'O servidor não expõe cabeçalhos indiscretos como X-Powered-By com versões expostas.',
      impact: 'Dificulta reconhecimento automatizado de exploits por atacantes.',
    });
  }

  // ================= 2. SEO AUDITS =================
  // Title tag
  if (!metaTags.title) {
    items.push({
      id: 'seo-title',
      category: 'seo',
      title: 'Tag <title> Ausente',
      severity: 'critical',
      score: 0,
      summary: 'O documento HTML não possui tag <title>, o que prejudica drasticamente a indexação nos motores de busca.',
      impact: 'Mecanismos de busca não conseguem indexar o título e a aba do navegador fica sem identificação.',
      recommendedValue: '<title>Título do Site - Descrição Concisa (50-60 caracteres)</title>',
      codeSnippet: {
        language: 'html',
        title: 'Adicionar no <head>',
        code: '<title>Meu Website | Soluções e Serviços Especializados</title>',
      },
    });
  } else if (metaTags.titleLength! < 20 || metaTags.titleLength! > 65) {
    items.push({
      id: 'seo-title',
      category: 'seo',
      title: `Tamanho do <title> Fora do Ideal (${metaTags.titleLength} caracteres)`,
      severity: 'warning',
      score: 65,
      summary: `O título possui ${metaTags.titleLength} caracteres. O ideal recomendado pelo Google é entre 45 e 60 caracteres.`,
      impact: 'Títulos muito curtos perdem relevância de palavras-chave; títulos muito longos sofrem truncamento na página de resultados (SERP).',
      currentValue: metaTags.title,
      recommendedValue: 'Entre 45 e 60 caracteres bem calibrados',
    });
  } else {
    items.push({
      id: 'seo-title',
      category: 'seo',
      title: `Tag <title> Otimizada (${metaTags.titleLength} caracteres)`,
      severity: 'good',
      score: 100,
      summary: 'O título está com tamanho perfeito para exibição nos resultados de pesquisa.',
      currentValue: metaTags.title,
    });
  }

  // Meta Description
  if (!metaTags.description) {
    items.push({
      id: 'seo-desc',
      category: 'seo',
      title: 'Meta Description Ausente',
      severity: 'critical',
      score: 10,
      summary: 'Não foi encontrada uma meta tag de descrição na página.',
      impact: 'O Google terá que gerar resumos automáticos com textos aleatórios da página, reduzindo taxa de cliques (CTR).',
      recommendedValue: '<meta name="description" content="Resumo atrativo de 130 a 160 caracteres." />',
      codeSnippet: {
        language: 'html',
        title: 'Adicionar no <head>',
        code: '<meta name="description" content="Conheça nossos serviços de tecnologia com alto desempenho, segurança de ponta e suporte dedicado para sua empresa." />',
      },
    });
  } else if (metaTags.descriptionLength! < 70 || metaTags.descriptionLength! > 165) {
    items.push({
      id: 'seo-desc',
      category: 'seo',
      title: `Meta Description com Tamanho Não Ideal (${metaTags.descriptionLength} caracteres)`,
      severity: 'warning',
      score: 70,
      summary: `A descrição possui ${metaTags.descriptionLength} caracteres. O tamanho recomendado é entre 120 e 160 caracteres.`,
      impact: 'Pode ser truncada com reticências no Google ou não fornecer contexto suficiente.',
      currentValue: metaTags.description,
    });
  } else {
    items.push({
      id: 'seo-desc',
      category: 'seo',
      title: `Meta Description Otimizada (${metaTags.descriptionLength} caracteres)`,
      severity: 'good',
      score: 100,
      summary: 'A meta descrição possui comprimento ideal e chamativo para a SERP.',
      currentValue: metaTags.description,
    });
  }

  // Headings H1
  if (h1Matches.length === 0) {
    items.push({
      id: 'seo-h1',
      category: 'seo',
      title: 'Nenhum Cabeçalho <h1> Encontrado',
      severity: 'critical',
      score: 20,
      summary: 'A página não define um título principal com a tag <h1>.',
      impact: 'O H1 é o sinal semântico mais importante para o Google entender o tema central do documento.',
      codeSnippet: {
        language: 'html',
        title: 'Adicionar tag <h1>',
        code: '<h1>Título Principal da Página com Palavra-Chave</h1>',
      },
    });
  } else if (h1Matches.length > 1) {
    items.push({
      id: 'seo-h1',
      category: 'seo',
      title: `Múltiplas Tags <h1> Detectadas (${h1Matches.length} H1s)`,
      severity: 'warning',
      score: 70,
      summary: `Foram encontradas ${h1Matches.length} tags <h1> na mesma página.`,
      impact: 'Embora permitido no HTML5, ter um único <h1> bem definido por página é a prática mais recomendada para clareza da árvore semântica.',
      currentValue: `${h1Matches.length} tags <h1> encontradas`,
      recommendedValue: '1 tag <h1> primária',
    });
  } else {
    items.push({
      id: 'seo-h1',
      category: 'seo',
      title: 'Estrutura H1 Perfeita',
      severity: 'good',
      score: 100,
      summary: `Tag <h1> única identificada: "${h1Sample || ''}"`,
      currentValue: h1Sample,
    });
  }

  // Open Graph & Social Cards
  const hasOg = !!(metaTags.openGraph.title && metaTags.openGraph.description && metaTags.openGraph.image);
  if (hasOg) {
    items.push({
      id: 'seo-og',
      category: 'seo',
      title: 'Tags Open Graph Completas para Redes Sociais',
      severity: 'good',
      score: 100,
      summary: 'Tags og:title, og:description e og:image configuradas para compartilhamento no WhatsApp, LinkedIn e Facebook.',
    });
  } else {
    items.push({
      id: 'seo-og',
      category: 'seo',
      title: 'Tags Open Graph / Social Media Incompletas',
      severity: 'warning',
      score: 45,
      summary: 'Faltam tags Open Graph essenciais (como og:image ou og:description).',
      impact: 'Ao compartilhar o link no WhatsApp, LinkedIn, Telegram ou Twitter, o card ficará genérico ou sem imagem de capa.',
      codeSnippet: {
        language: 'html',
        title: 'Metatags Open Graph & Twitter',
        code: `<meta property="og:title" content="Título do Site" />
<meta property="og:description" content="Descrição chamativa para redes sociais." />
<meta property="og:image" content="https://seusite.com/assets/og-cover.jpg" />
<meta property="og:url" content="https://seusite.com/" />
<meta name="twitter:card" content="summary_large_image" />`,
      },
    });
  }

  // Canonical Tag
  if (metaTags.canonical) {
    items.push({
      id: 'seo-canonical',
      category: 'seo',
      title: 'URL Canônica Declarada',
      severity: 'good',
      score: 100,
      summary: `Tag rel="canonical" configurada para ${metaTags.canonical}.`,
      currentValue: metaTags.canonical,
    });
  } else {
    items.push({
      id: 'seo-canonical',
      category: 'seo',
      title: 'Tag Canonical Ausente',
      severity: 'warning',
      score: 60,
      summary: 'A página não declara sua URL canônica através de <link rel="canonical">.',
      impact: 'Risco de conteúdo duplicado se a página puder ser acessada por múltiplos parâmetros ou variações de protocolo/domínio.',
      codeSnippet: {
        language: 'html',
        title: 'Adicionar Canonical',
        code: `<link rel="canonical" href="${finalUrl}" />`,
      },
    });
  }

  // Structured Data (JSON-LD)
  if (metaTags.structuredDataTypes.length > 0) {
    items.push({
      id: 'seo-schema',
      category: 'seo',
      title: `Dados Estruturados Schema.org (${metaTags.structuredDataTypes.join(', ')})`,
      severity: 'good',
      score: 100,
      summary: 'O site fornece marcação semântica JSON-LD para Rich Snippets nos resultados de busca.',
      currentValue: metaTags.structuredDataTypes.join(', '),
    });
  } else {
    items.push({
      id: 'seo-schema',
      category: 'seo',
      title: 'Nenhum Dado Estruturado JSON-LD Encontrado',
      severity: 'info',
      score: 75,
      summary: 'Não foi identificada marcação Schema.org em JSON-LD.',
      impact: 'Oportunidade perdida de obter Rich Snippets (estrelas de avaliação, perguntas frequentes, cards de organização).',
      codeSnippet: {
        language: 'html',
        title: 'Exemplo Schema.org Organization',
        code: `<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Nome da Empresa",
  "url": "https://seusite.com",
  "logo": "https://seusite.com/logo.png"
}
</script>`,
      },
    });
  }

  // ================= 3. BEST PRACTICES AUDITS =================
  // Viewport & Mobile Ready
  if (metaTags.viewport) {
    items.push({
      id: 'bp-viewport',
      category: 'best_practices',
      title: 'Meta Viewport Responsivo Configurado',
      severity: 'good',
      score: 100,
      summary: `Configuração: ${metaTags.viewport}`,
      impact: 'Permite renderização responsiva adequada em smartphones e tablets.',
    });
  } else {
    items.push({
      id: 'bp-viewport',
      category: 'best_practices',
      title: 'Meta Viewport Ausente (Página Não Responsiva)',
      severity: 'critical',
      score: 10,
      summary: 'Falta a meta tag viewport, fazendo com que dispositivos móveis exibam layout desktop miniaturizado.',
      impact: 'Experiência desastrosa em dispositivos móveis e penalização imediata no ranking mobile-first.',
      codeSnippet: {
        language: 'html',
        title: 'Adicionar Viewport',
        code: '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
      },
    });
  }

  // HTML Lang Attribute
  if (metaTags.language) {
    items.push({
      id: 'bp-lang',
      category: 'best_practices',
      title: `Idioma do Documento Declarado (lang="${metaTags.language}")`,
      severity: 'good',
      score: 100,
      summary: `O atributo lang="${metaTags.language}" está configurado na tag <html>.`,
      impact: 'Ajuda leitores de tela a pronunciarem corretamente o conteúdo e auxilia na geolocalização de busca.',
    });
  } else {
    items.push({
      id: 'bp-lang',
      category: 'best_practices',
      title: 'Atributo lang Ausente na Tag <html>',
      severity: 'warning',
      score: 50,
      summary: 'A tag <html> não especifica o idioma principal da página.',
      impact: 'Dificulta a acessibilidade para leitores de tela e tradutores automáticos.',
      codeSnippet: {
        language: 'html',
        title: 'Corrigir tag HTML',
        code: '<html lang="pt-BR">',
      },
    });
  }

  // Charset
  if (metaTags.charset) {
    items.push({
      id: 'bp-charset',
      category: 'best_practices',
      title: `Codificação de Caracteres Declarada (${metaTags.charset})`,
      severity: 'good',
      score: 100,
      summary: 'O charset UTF-8 previne distorção de caracteres acentuados.',
    });
  } else {
    items.push({
      id: 'bp-charset',
      category: 'best_practices',
      title: 'Tag Charset Ausente no <head>',
      severity: 'warning',
      score: 60,
      summary: 'A codificação de caracteres não está explicitamente declarada.',
      codeSnippet: {
        language: 'html',
        title: 'Adicionar Charset',
        code: '<meta charset="UTF-8" />',
      },
    });
  }

  // External Links Security (rel="noopener")
  if (externalLinksWithoutRel > 0) {
    items.push({
      id: 'bp-links-rel',
      category: 'best_practices',
      title: `Links Externos Sem rel="noopener" (${externalLinksWithoutRel} links)`,
      severity: 'warning',
      score: 60,
      summary: `Existem ${externalLinksWithoutRel} links para sites externos sem atributos de proteção rel="noopener noreferrer".`,
      impact: 'Permite ataques de reverse tabnabbing (a página aberta pode manipular a página de origem via window.opener).',
      codeSnippet: {
        language: 'html',
        title: 'Exemplo Seguro de Link Externo',
        code: '<a href="https://externo.com" target="_blank" rel="noopener noreferrer">Link</a>',
      },
    });
  } else {
    items.push({
      id: 'bp-links-rel',
      category: 'best_practices',
      title: 'Links Externos Seguros',
      severity: 'good',
      score: 100,
      summary: 'Links externos estão devidamente isolados com atributos de segurança.',
    });
  }

  // ================= 4. PERFORMANCE & ACCESSIBILITY AUDITS =================
  // Response Time (TTFB)
  if (responseTimeMs < 400) {
    items.push({
      id: 'perf-ttfb',
      category: 'performance_accessibility',
      title: `Tempo de Resposta Rápido (TTFB: ${responseTimeMs}ms)`,
      severity: 'good',
      score: 100,
      summary: 'O servidor entregou o primeiro byte de resposta em tempo exemplar (<400ms).',
      currentValue: `${responseTimeMs}ms`,
    });
  } else if (responseTimeMs < 1200) {
    items.push({
      id: 'perf-ttfb',
      category: 'performance_accessibility',
      title: `Tempo de Resposta Médio (TTFB: ${responseTimeMs}ms)`,
      severity: 'warning',
      score: 70,
      summary: `O servidor levou ${responseTimeMs}ms para responder.`,
      impact: 'Pode atrasar o início da renderização em redes móveis 4G/3G.',
      currentValue: `${responseTimeMs}ms`,
      recommendedValue: '< 400ms (usar CDN como Cloudflare ou caching)',
    });
  } else {
    items.push({
      id: 'perf-ttfb',
      category: 'performance_accessibility',
      title: `Tempo de Resposta Lento (TTFB: ${responseTimeMs}ms)`,
      severity: 'critical',
      score: 35,
      summary: `O servidor demorou ${responseTimeMs}ms para responder.`,
      impact: 'Prejudica severamente o First Contentful Paint (FCP) e o Largest Contentful Paint (LCP) do Core Web Vitals.',
      currentValue: `${responseTimeMs}ms`,
      recommendedValue: '< 300ms',
    });
  }

  // Image Alt attributes
  if (imagesMissingAlt > 0) {
    items.push({
      id: 'a11y-img-alt',
      category: 'performance_accessibility',
      title: `Imagens Sem Atributo Alt (${imagesMissingAlt} de ${imgMatches.length} imagens)`,
      severity: 'critical',
      score: Math.max(20, Math.round(100 - (imagesMissingAlt / Math.max(1, imgMatches.length)) * 100)),
      summary: `Foram encontradas ${imagesMissingAlt} tags <img> sem descrição no atributo alt.`,
      impact: 'Usuários com deficiência visual usando leitores de tela não conseguirão entender as imagens, além de perder relevância no Google Imagens.',
      currentValue: `${imagesMissingAlt} imagens sem alt`,
      recommendedValue: 'Todas as imagens com alt descritivo',
      codeSnippet: {
        language: 'html',
        title: 'Adicionar descrição alt',
        code: '<img src="/assets/grafico.png" alt="Gráfico de crescimento mensal de vendas em 2026" />',
      },
    });
  } else if (imgMatches.length > 0) {
    items.push({
      id: 'a11y-img-alt',
      category: 'performance_accessibility',
      title: `Acessibilidade de Imagens 100% (${imgMatches.length} imagens com alt)`,
      severity: 'good',
      score: 100,
      summary: 'Todas as imagens contêm atributo alt preenchido.',
    });
  }

  // HTML Document Size
  const sizeKb = Math.round(contentLengthBytes / 1024);
  if (sizeKb > 300) {
    items.push({
      id: 'perf-html-size',
      category: 'performance_accessibility',
      title: `Documento HTML Muito Pesado (${sizeKb} KB)`,
      severity: 'warning',
      score: 60,
      summary: `O HTML bruto possui ${sizeKb} KB, o que indica excesso de inline styles, scripts pesados ou DOM inflado.`,
      impact: 'Aumenta consumo de dados móveis e tempo de parsing da árvore DOM.',
      currentValue: `${sizeKb} KB`,
      recommendedValue: '< 150 KB para o HTML inicial',
    });
  } else {
    items.push({
      id: 'perf-html-size',
      category: 'performance_accessibility',
      title: `Tamanho do HTML Otimizado (${sizeKb} KB)`,
      severity: 'good',
      score: 100,
      summary: `O payload inicial de ${sizeKb} KB é leve e rápido para transferir.`,
    });
  }

  // Compute Category scores
  const categoriesList: Array<{ key: 'security' | 'seo' | 'best_practices' | 'performance_accessibility'; name: string; color: string }> = [
    { key: 'security', name: 'Segurança', color: '#10b981' },
    { key: 'seo', name: 'SEO & Visibilidade', color: '#3b82f6' },
    { key: 'best_practices', name: 'Boas Práticas', color: '#8b5cf6' },
    { key: 'performance_accessibility', name: 'Performance & Acessibilidade', color: '#f59e0b' },
  ];

  const categories: Record<string, CategoryScore> = {};

  let totalWeightedScore = 0;

  for (const cat of categoriesList) {
    const catItems = items.filter((i) => i.category === cat.key);
    const total = catItems.length || 1;
    const passed = catItems.filter((i) => i.severity === 'good').length;
    const warnings = catItems.filter((i) => i.severity === 'warning').length;
    const criticals = catItems.filter((i) => i.severity === 'critical').length;

    const avgScore = Math.round(catItems.reduce((acc, curr) => acc + curr.score, 0) / total);
    totalWeightedScore += avgScore;

    categories[cat.key] = {
      category: cat.key,
      name: cat.name,
      score: avgScore,
      grade: calculateGrade(avgScore),
      color: cat.color,
      passedCount: passed,
      warningCount: warnings,
      criticalCount: criticals,
      totalCount: total,
      summary: `${passed} itens aprovados, ${warnings} alertas e ${criticals} falhas críticas.`,
    };
  }

  const overallScore = Math.round(totalWeightedScore / 4);
  const overallGrade = calculateGrade(overallScore);

  // AI Deep Analysis with Gemini
  let aiExecutiveSummary = `Auditoria automatizada do website ${new URL(finalUrl).hostname}. O site obteve pontuação geral de ${overallScore}/100 (Nota ${overallGrade}).`;
  let keyStrengths: string[] = [
    isHttps ? 'Comunicação criptografada com HTTPS ativo' : 'Serviço web acessível',
    metaTags.title ? 'Tag title indexável presente' : 'Acesso web funcional',
    metaTags.viewport ? 'Design mobile-friendly configurado' : 'Estrutura HTML padrão',
  ];
  let topPriorityFixes: string[] = [];

  const ai = getAiClient();
  if (ai) {
    try {
      const prompt = `Analise este relatório de auditoria de website e forneça um diagnóstico técnico em português do Brasil:
URL: ${finalUrl}
Score Geral: ${overallScore}/100 (Nota: ${overallGrade})
Tempo de resposta (TTFB): ${responseTimeMs}ms
Segurança: Score ${categories.security.score}/100. Cabeçalhos ausentes: ${securityHeaders.filter((s) => s.status !== 'present').map((s) => s.header).join(', ') || 'Nenhum'}
SEO: Score ${categories.seo.score}/100. Title: "${metaTags.title || 'Ausente'}", Description: "${metaTags.description || 'Ausente'}", H1s: ${h1Matches.length}, Schema JSON-LD: ${metaTags.structuredDataTypes.join(', ') || 'Nenhum'}
Boas Práticas: Lang="${metaTags.language || 'Ausente'}", Links sem rel="${externalLinksWithoutRel}"
Performance & A11y: Imagens sem alt: ${imagesMissingAlt} de ${imgMatches.length}, Tamanho HTML: ${sizeKb}KB
Tecnologias Detectadas: ${techStack.map((t) => t.name).join(', ') || 'Não identificadas'}

Responda em formato JSON com:
1. "executiveSummary": Um parágrafo executivo conciso (2 a 3 frases) avaliando a saúde geral do site, principais riscos de segurança e potencial de crescimento em SEO.
2. "keyStrengths": Array com 3 pontos fortes ou acertos da arquitetura do site.
3. "topPriorityFixes": Array com 3 a 5 ações de correção mais urgentes, com alto impacto prático.
4. "additionalActionableAdvice": Array com até 2 sugestões extras de inovação ou modernização técnica (ex: PWA, Web Vitals, Edge caching).`;

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-3.7-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              executiveSummary: { type: Type.STRING },
              keyStrengths: { type: Type.ARRAY, items: { type: Type.STRING } },
              topPriorityFixes: { type: Type.ARRAY, items: { type: Type.STRING } },
              additionalActionableAdvice: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['executiveSummary', 'keyStrengths', 'topPriorityFixes'],
          },
        },
      });

      if (aiResponse.text) {
        const parsed = JSON.parse(aiResponse.text);
        if (parsed.executiveSummary) aiExecutiveSummary = parsed.executiveSummary;
        if (Array.isArray(parsed.keyStrengths) && parsed.keyStrengths.length > 0) keyStrengths = parsed.keyStrengths;
        if (Array.isArray(parsed.topPriorityFixes) && parsed.topPriorityFixes.length > 0) topPriorityFixes = parsed.topPriorityFixes;

        // Add additional advice if any
        if (Array.isArray(parsed.additionalActionableAdvice)) {
          parsed.additionalActionableAdvice.forEach((adv: string, i: number) => {
            items.push({
              id: `ai-advice-${i}`,
              category: 'best_practices',
              title: `Recomendação de Otimização Inteligente`,
              severity: 'info',
              score: 85,
              summary: adv,
              impact: 'Acelera a performance, eleva a segurança e melhora os índices de conversão.',
            });
          });
        }
      }
    } catch (e) {
      console.warn('Gemini AI enhancement fallback:', e);
    }
  }

  // If topPriorityFixes is still empty, populate from critical/warning items
  if (topPriorityFixes.length === 0) {
    topPriorityFixes = items
      .filter((i) => i.severity === 'critical' || i.severity === 'warning')
      .slice(0, 4)
      .map((i) => `${i.title}: ${i.summary}`);
    if (topPriorityFixes.length === 0) {
      topPriorityFixes = ['Excelente estado: Mantenha as diretivas de segurança e monitore periodicamente.'];
    }
  }

  return {
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    targetUrl: finalUrl,
    analyzedAt: new Date().toISOString(),
    overallScore,
    overallGrade,
    aiExecutiveSummary,
    keyStrengths,
    topPriorityFixes,
    categories: categories as any,
    items,
    rawData,
  };
}
