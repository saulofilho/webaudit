import { Request, Response } from 'express';

interface WafSignature {
  name: string;
  vendor: string;
  headers: string[];
  cookies: string[];
  description: string;
  bypassAdvisory: string;
}

const WAF_SIGNATURES: WafSignature[] = [
  {
    name: 'Cloudflare WAF',
    vendor: 'Cloudflare Inc.',
    headers: ['cf-ray', 'cf-cache-status', '__cfduid', 'cf-request-id', 'server: cloudflare'],
    cookies: ['__cf_bm', '__cfduid', 'cf_clearance'],
    description: 'Cloudflare protege a borda contra ataques DDoS, botnets, injeções SQL e explorações OWASP com Managed Rulesets.',
    bypassAdvisory: 'Certifique-se de que o IP de origem (Origin IP) não esteja vazado em registros DNS antigos ou no certificado SSL/TLS.'
  },
  {
    name: 'AWS WAF / CloudFront',
    vendor: 'Amazon Web Services',
    headers: ['x-amz-cf-id', 'x-amz-cf-pop', 'x-amzn-requestid'],
    cookies: ['aws-waf-token'],
    description: 'AWS Web Application Firewall integrado via CloudFront ou Application Load Balancer.',
    bypassAdvisory: 'Mantenha as regras gerenciadas (AWSManagedRulesCommonRuleSet) sempre ativadas e atualizadas.'
  },
  {
    name: 'Akamai Edge WAF / Kona Site Defender',
    vendor: 'Akamai Technologies',
    headers: ['x-akamai-transformed', 'akamai-grn', 'x-akamai-request-id'],
    cookies: ['ak_bmsc', 'bm_sv'],
    description: 'Akamai Kona Site Defender com inspeção adaptativa de requisições e mitigação de bots.',
    bypassAdvisory: 'Audite regras de rate limiting e endpoints de API que podem contornar a inspeção profunda de corpo.'
  },
  {
    name: 'Imperva Incapsula',
    vendor: 'Imperva',
    headers: ['x-iinfo', 'x-cdn: incapsula'],
    cookies: ['incap_ses', 'visid_incap'],
    description: 'Imperva WAF com inspeção de tráfego camada 7 e filtragem de reputação de IP.',
    bypassAdvisory: 'Proteja headers X-Forwarded-For para evitar spoofing de geolocalização.'
  },
  {
    name: 'Fastly Next-Gen WAF (Signal Sciences)',
    vendor: 'Fastly',
    headers: ['x-fastly-request-id', 'fastly-debug-digest'],
    cookies: [],
    description: 'Fastly Signal Sciences com detecção baseada em inteligência contextual e análise de anomalias.',
    bypassAdvisory: 'Configure thresholds de decisão em modo bloqueio estrito para rotas de autenticação.'
  },
  {
    name: 'Sucuri CloudProxy',
    vendor: 'GoDaddy / Sucuri',
    headers: ['x-sucuri-id', 'x-sucuri-cache', 'server: sucuri/cloudproxy'],
    cookies: ['sucuri_cloudproxy_uuid'],
    description: 'Firewall de aplicação web focado em plataformas CMS (WordPress, Joomla, Magento).',
    bypassAdvisory: 'Verifique se o acesso direto ao servidor Apache/Nginx original está bloqueado por firewall de rede (UFW/Security Group).'
  },
  {
    name: 'ModSecurity / OWASP CRS',
    vendor: 'Open-Source (Trustwave / OWASP)',
    headers: ['server: mod_security', 'x-mod-security'],
    cookies: [],
    description: 'WAF de código aberto baseado no OWASP Core Rule Set (CRS).',
    bypassAdvisory: 'Ajuste a pontuação de anomalia (Paranoia Level) para evitar bypasses com múltiplos encodings.'
  }
];

export async function handleWafScan(req: Request, res: Response) {
  try {
    const { url } = req.body || {};
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL do alvo é necessária para análise de WAF.' });
    }

    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    let detectedWafs: Array<{ name: string; vendor: string; matchedSignals: string[]; description: string; bypassAdvisory: string }> = [];
    let headersFound: Record<string, string> = {};
    let cookiesFound: string[] = [];

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);

    const r = await fetch(targetUrl, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SecScan-WafDetect/2.5',
        'Accept': 'text/html,application/xhtml+xml,*/*'
      }
    });
    clearTimeout(timer);

    r.headers.forEach((val, key) => {
      headersFound[key.toLowerCase()] = val;
    });

    const setCookie = r.headers.get('set-cookie');
    if (setCookie) {
      cookiesFound = setCookie.split(',').map(c => c.trim().split(';')[0]);
    }

    // Check signatures
    for (const waf of WAF_SIGNATURES) {
      const matchedSignals: string[] = [];

      for (const h of waf.headers) {
        if (h.includes(':')) {
          const [k, v] = h.split(':').map(s => s.trim().toLowerCase());
          if (headersFound[k] && headersFound[k].toLowerCase().includes(v)) {
            matchedSignals.push(`Header: ${k}: ${headersFound[k]}`);
          }
        } else {
          if (headersFound[h.toLowerCase()]) {
            matchedSignals.push(`Header: ${h} = ${headersFound[h.toLowerCase()]}`);
          }
        }
      }

      for (const cookieName of waf.cookies) {
        const found = cookiesFound.some(c => c.toLowerCase().includes(cookieName.toLowerCase()));
        if (found) {
          matchedSignals.push(`Cookie: ${cookieName}`);
        }
      }

      if (matchedSignals.length > 0) {
        detectedWafs.push({
          name: waf.name,
          vendor: waf.vendor,
          matchedSignals,
          description: waf.description,
          bypassAdvisory: waf.bypassAdvisory
        });
      }
    }

    const hasWaf = detectedWafs.length > 0;
    const postureScore = hasWaf ? 95 : 45;

    return res.json({
      targetUrl,
      hasWaf,
      detectedWafs,
      postureScore,
      inspectedHeadersCount: Object.keys(headersFound).length,
      recommendation: hasWaf
        ? 'Firewall ativo e detectado. Certifique-se de que o tráfego direto para o IP de origem esteja bloqueado para impedir bypass de CDN/WAF.'
        : 'Nenhum WAF de borda identificado nos cabeçalhos públicos. Recomendado ativar Cloudflare, AWS WAF ou Akamai para defesa contra ataques DDoS e injeções OWASP.'
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Falha ao identificar presença de WAF.' });
  }
}
