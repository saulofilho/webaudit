import { Request, Response } from 'express';

// Secret detection signatures
const SECRET_SIGNATURES = [
  {
    name: 'AWS Access Key ID',
    regex: /(?:A3T[A-Z0-9]|AKIA|AGPA|AIDA|AROA|AIPA|ANPA|ANVA|ASIA)[A-Z0-9]{16}/g,
    category: 'AWS_KEY',
    severity: 'critical',
    remediation: 'Revogue imediatamente a chave no AWS IAM Console e utilize IAM Roles ou AWS Secrets Manager.'
  },
  {
    name: 'OpenAI API Secret Key',
    regex: /sk-[a-zA-Z0-9_-]{20,64}/g,
    category: 'AI_SECRET',
    severity: 'critical',
    remediation: 'Substitua por proxy de backend seguro e revogue a chave na plataforma OpenAI.'
  },
  {
    name: 'Google Gemini / Maps API Key',
    regex: /AIza[0-9A-Za-z\\-_]{35}/g,
    category: 'GOOGLE_API_KEY',
    severity: 'warning',
    remediation: 'Restrinja a chave por HTTP Referrer no Google Cloud Console ou migre chamadas para o backend.'
  },
  {
    name: 'GitHub Personal Access Token',
    regex: /gh[pous]_[A-Za-z0-9_]{36,255}/g,
    category: 'GITHUB_TOKEN',
    severity: 'critical',
    remediation: 'Revogue o token no GitHub Developer Settings e use GitHub Secrets ou Fine-Grained Tokens.'
  },
  {
    name: 'Stripe Live Secret Key',
    regex: /sk_live_[0-9a-zA-Z]{24,99}/g,
    category: 'STRIPE_SECRET',
    severity: 'critical',
    remediation: 'URGENTE: Chave de produção Stripe exposta. Transações financeiras vulneráveis. Revogue no Dashboard Stripe.'
  },
  {
    name: 'Stripe Publishable Key (Auditoria)',
    regex: /pk_live_[0-9a-zA-Z]{24,99}/g,
    category: 'STRIPE_PK',
    severity: 'info',
    remediation: 'Chave pública aceitável em front-end, verifique se não há chamadas com restricted keys.'
  },
  {
    name: 'Slack Bot / User OAuth Token',
    regex: /xox[baprs]-[0-9]{10,13}-[0-9]{10,13}[a-zA-Z0-9-]*/g,
    category: 'SLACK_TOKEN',
    severity: 'critical',
    remediation: 'Revogue o token no painel de apps do Slack.'
  },
  {
    name: 'Supabase Anon / Service Role Key',
    regex: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g,
    category: 'SUPABASE_OR_JWT',
    severity: 'warning',
    remediation: 'Valide se este JWT é uma chave pública anon ou service_role com permissões administrativas elevadas.'
  },
  {
    name: 'RSA / SSH Private Key Block',
    regex: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
    category: 'PRIVATE_KEY',
    severity: 'critical',
    remediation: 'Chave privada criptográfica exposta publicamente. Substitua e rotacione o par de chaves imediatamente.'
  }
];

// Cloud Storage Bucket Patterns
const BUCKET_PATTERNS = [
  {
    provider: 'AWS_S3',
    regex: /(?:https?:\/\/)?([a-zA-Z0-9.\-_]{3,63})\.s3(?:[.-][a-zA-Z0-9\-]+)?\.amazonaws\.com/gi,
    label: 'Amazon S3 Bucket',
  },
  {
    provider: 'GOOGLE_STORAGE',
    regex: /(?:https?:\/\/)?storage\.googleapis\.com\/([a-zA-Z0-9.\-_]{3,63})/gi,
    label: 'Google Cloud Storage Bucket',
  },
  {
    provider: 'AZURE_BLOB',
    regex: /(?:https?:\/\/)?([a-zA-Z0-9]{3,24})\.blob\.core\.windows\.net\/([a-zA-Z0-9\-_]{3,63})/gi,
    label: 'Azure Blob Storage Container',
  },
  {
    provider: 'FIREBASE_STORAGE',
    regex: /(?:https?:\/\/)?firebasestorage\.googleapis\.com\/v0\/b\/([a-zA-Z0-9.\-_]+)/gi,
    label: 'Firebase Storage Bucket',
  }
];

// Dangerous DOM Sinks
const DANGEROUS_SINKS = [
  {
    pattern: /\beval\s*\(/g,
    name: 'eval() Execution',
    severity: 'critical',
    description: 'Execução dinâmica de código via eval(). Vulnerável a DOM-based Cross-Site Scripting (DOM XSS).'
  },
  {
    pattern: /\.innerHTML\s*=/g,
    name: 'Unsafe .innerHTML Assignment',
    severity: 'warning',
    description: 'Atribuição direta de HTML sem sanitização via DOMPurify. Possível injeção de tags <script> ou atributos on*.'
  },
  {
    pattern: /document\.write(?:ln)?\s*\(/g,
    name: 'document.write() Sink',
    severity: 'warning',
    description: 'Prática obsoleta e insegura que bloqueia renderização e facilita injeção de payloads HTML arbitrários.'
  },
  {
    pattern: /window\.postMessage\s*\([^,]+,\s*['"]\*['"]\)/g,
    name: 'postMessage Wildcard TargetOrigin (*)',
    severity: 'critical',
    description: 'Envio de mensagens entre janelas/iframes com targetOrigin "*", permitindo interceptação por domínios maliciosos.'
  }
];

export async function handleJsMiner(req: Request, res: Response) {
  try {
    const { url, codeSnippet } = req.body || {};

    let scriptContents: Array<{ source: string; content: string }> = [];

    if (codeSnippet && typeof codeSnippet === 'string') {
      scriptContents.push({ source: 'snippet-input.js', content: codeSnippet });
    }

    if (url && typeof url === 'string') {
      let targetUrl = url.trim();
      if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
        targetUrl = 'https://' + targetUrl;
      }

      // Fetch page HTML
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 9000);
      try {
        const response = await fetch(targetUrl, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SecScan-JsMiner/3.0',
            'Accept': 'text/html,application/xhtml+xml,*/*',
          }
        });
        clearTimeout(timeout);

        if (response.ok) {
          const html = await response.text();

          // Extract inline scripts
          const inlineMatches = html.match(/<script\b[^>]*>([\s\S]*?)<\/script>/gi) || [];
          inlineMatches.forEach((s, idx) => {
            const code = s.replace(/<script\b[^>]*>/i, '').replace(/<\/script>/i, '').trim();
            if (code.length > 20) {
              scriptContents.push({ source: `inline-script-${idx + 1}.js`, content: code });
            }
          });

          // Extract external script URLs
          const srcMatches = Array.from(html.matchAll(/<script[^>]+src=["']([^"']+)["']/gi));
          const scriptUrls = srcMatches
            .map(m => m[1])
            .filter(src => src && !src.startsWith('data:') && !src.startsWith('blob:'))
            .slice(0, 8); // Scan up to 8 top scripts for performance

          // Fetch script bundles concurrently
          await Promise.all(
            scriptUrls.map(async (src) => {
              try {
                const resolvedUrl = new URL(src, targetUrl).toString();
                const scriptController = new AbortController();
                const scriptTimeout = setTimeout(() => scriptController.abort(), 4000);
                const scriptRes = await fetch(resolvedUrl, {
                  signal: scriptController.signal,
                  headers: { 'User-Agent': 'SecScan-JsMiner/3.0' }
                });
                clearTimeout(scriptTimeout);
                if (scriptRes.ok) {
                  const scriptText = await scriptRes.text();
                  if (scriptText && scriptText.length > 50) {
                    scriptContents.push({
                      source: resolvedUrl,
                      content: scriptText.slice(0, 300000) // inspect first 300kb
                    });
                  }
                }
              } catch {
                // ignore failed single bundle fetch
              }
            })
          );
        }
      } catch (err: any) {
        clearTimeout(timeout);
        // continue if partial data was gathered
      }
    }

    if (scriptContents.length === 0) {
      // Provide a helpful scan result with instructions
      return res.json({
        targetUrl: url || 'Código fornecido',
        scannedBundlesCount: 0,
        secretsFound: [],
        bucketsFound: [],
        sinksFound: [],
        endpointsFound: [],
        sourceMapsFound: [],
        summary: 'Nenhum script pôde ser baixado ou o site bloqueou a requisição direta. Cole o código JavaScript manualmente para análise imediata.'
      });
    }

    const secretsFound: any[] = [];
    const bucketsFound: any[] = [];
    const sinksFound: any[] = [];
    const endpointsFound: Set<string> = new Set();
    const sourceMapsFound: string[] = [];

    for (const item of scriptContents) {
      const { source, content } = item;

      // 1. Secrets detection
      for (const sig of SECRET_SIGNATURES) {
        const matches = Array.from(content.matchAll(sig.regex));
        for (const match of matches) {
          const raw = match[0];
          // mask key
          const masked = raw.length > 8 ? raw.slice(0, 4) + '...' + raw.slice(-4) : '***MASKED***';
          const lineIndex = content.slice(0, match.index).split('\n').length;
          secretsFound.push({
            id: `secret-${Math.random().toString(36).slice(2, 9)}`,
            name: sig.name,
            category: sig.category,
            severity: sig.severity,
            source,
            line: lineIndex,
            maskedValue: masked,
            remediation: sig.remediation
          });
        }
      }

      // 2. Buckets detection
      for (const bPattern of BUCKET_PATTERNS) {
        const matches = Array.from(content.matchAll(bPattern.regex));
        for (const match of matches) {
          const fullMatch = match[0];
          const bucketName = match[1] || fullMatch;
          bucketsFound.push({
            id: `bucket-${Math.random().toString(36).slice(2, 9)}`,
            provider: bPattern.provider,
            label: bPattern.label,
            bucketName,
            url: fullMatch.startsWith('http') ? fullMatch : `https://${fullMatch}`,
            source
          });
        }
      }

      // 3. Dangerous DOM Sinks
      for (const sink of DANGEROUS_SINKS) {
        const matches = Array.from(content.matchAll(sink.pattern));
        if (matches.length > 0) {
          sinksFound.push({
            id: `sink-${Math.random().toString(36).slice(2, 9)}`,
            name: sink.name,
            severity: sink.severity,
            occurrences: matches.length,
            description: sink.description,
            source
          });
        }
      }

      // 4. Source Maps
      const sourceMapMatches = content.match(/\/\/#\s*sourceMappingURL=([^\s]+)/g);
      if (sourceMapMatches) {
        sourceMapMatches.forEach(sm => {
          const clean = sm.replace(/\/\/#\s*sourceMappingURL=/, '').trim();
          sourceMapsFound.push(clean);
        });
      }

      // 5. Internal API endpoints
      const endpointRegex = /["'](\/(?:api|v[1-9]|rest|auth|admin|graphql|users|webhook|internal)\/[a-zA-Z0-9_\-\/]+)["']/g;
      const endpointMatches = Array.from(content.matchAll(endpointRegex));
      endpointMatches.forEach(m => {
        if (m[1] && m[1].length < 80) endpointsFound.add(m[1]);
      });
    }

    return res.json({
      targetUrl: url || 'Snippet JS',
      scannedBundlesCount: scriptContents.length,
      secretsFound,
      bucketsFound,
      sinksFound,
      endpointsFound: Array.from(endpointsFound).slice(0, 40),
      sourceMapsFound: Array.from(new Set(sourceMapsFound)),
      securityScore: Math.max(10, 100 - (secretsFound.length * 25) - (sinksFound.length * 10) - (bucketsFound.length * 5))
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Falha ao processar mineração JS.' });
  }
}
