import { Request, Response } from 'express';

interface NiktoProbeDef {
  path: string;
  category: string;
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  expectedStatus: number[]; // status codes that indicate vulnerability/exposure
  remediation: string;
}

const NIKTO_PROBES: NiktoProbeDef[] = [
  {
    path: '/.env',
    category: 'Sensitive Configuration',
    severity: 'critical',
    title: 'Exposed Environment Variables File (.env)',
    description: 'O arquivo .env está exposto na raiz do servidor web, revelando potenciais senhas de banco de dados, chaves de API e segredos criptográficos.',
    expectedStatus: [200],
    remediation: 'Bloqueie o acesso a arquivos que começam com ponto (.) nas regras do Nginx/Apache (ex: location ~ /\\. { deny all; }).'
  },
  {
    path: '/.git/HEAD',
    category: 'Version Control Leak',
    severity: 'critical',
    title: 'Exposed Git Repository Metadata (/.git/HEAD)',
    description: 'O diretório .git está publicamente acessível. Atacantes podem clonar o repositório completo com git-dumper e ler todo o histórico do código-fonte.',
    expectedStatus: [200],
    remediation: 'Configure o servidor para negar acesso imediato à pasta .git.'
  },
  {
    path: '/wp-config.php.bak',
    category: 'Backup Files',
    severity: 'critical',
    title: 'WordPress Configuration Backup Exposed',
    description: 'Arquivos de backup de configuração frequentemente são servidos em texto plano pelo servidor web sem passar pelo interpretador PHP.',
    expectedStatus: [200],
    remediation: 'Remova arquivos de backup da raiz do webroot.'
  },
  {
    path: '/.aws/credentials',
    category: 'Cloud Credentials',
    severity: 'critical',
    title: 'AWS Credentials File Leak',
    description: 'Arquivo de credenciais AWS descoberto publicamente.',
    expectedStatus: [200],
    remediation: 'Isole o diretório raiz e nunca versione ou copie diretórios de home de usuário para a raiz do servidor.'
  },
  {
    path: '/backup.sql',
    category: 'Database Backup Dump',
    severity: 'critical',
    title: 'Database SQL Dump File',
    description: 'Dump completo de banco de dados SQL acessível publicamente via HTTP.',
    expectedStatus: [200],
    remediation: 'Exclua imediatamente cópias de backup do document root e armazene backups em buckets S3 privados com criptografia KMS.'
  },
  {
    path: '/robots.txt',
    category: 'Information Disclosure',
    severity: 'info',
    title: 'Robots.txt Analysis',
    description: 'Arquivo robots.txt presente. Verificado para diretórios sensíveis listados em Disallow.',
    expectedStatus: [200],
    remediation: 'Evite expor caminhos confidenciais como /admin-secret/ no robots.txt, pois serve de índice para atacantes.'
  },
  {
    path: '/actuator/health',
    category: 'Spring Boot Actuator',
    severity: 'warning',
    title: 'Spring Boot Actuator Metrics Exposed',
    description: 'Endpoints do Spring Boot Actuator expostos sem autenticação mTLS ou bearer token.',
    expectedStatus: [200],
    remediation: 'Defina management.endpoints.web.exposure.include=health apenas e exija autenticação para outros endpoints.'
  },
  {
    path: '/phpinfo.php',
    category: 'Information Disclosure',
    severity: 'critical',
    title: 'PHP Info Debug Page Exposed',
    description: 'phpinfo() exibe versões do servidor, módulos, diretórios internos e variáveis de ambiente sensíveis.',
    expectedStatus: [200],
    remediation: 'Exclua qualquer arquivo contendo a chamada phpinfo() em ambiente de produção.'
  },
  {
    path: '/server-status',
    category: 'Apache Status Page',
    severity: 'warning',
    title: 'Apache server-status Module Accessible',
    description: 'Módulo mod_status do Apache aberto publicamente, revelando IPs de clientes atuais, URLs solicitadas e carga de CPU.',
    expectedStatus: [200],
    remediation: 'Restrinja o acesso ao server-status no Apache usando "Require local" ou "Require ip".'
  },
  {
    path: '/.well-known/security.txt',
    category: 'Security Best Practice',
    severity: 'info',
    title: 'RFC 9116 security.txt Vulnerability Disclosure',
    description: 'Arquivo RFC 9116 security.txt permite que pesquisadores de segurança relatem vulnerabilidades responsavelmente.',
    expectedStatus: [200],
    remediation: 'Crie /.well-known/security.txt com seu contato oficial de segurança para conformidade com a ISO 27001 e RFC 9116.'
  }
];

export async function handleNiktoScan(req: Request, res: Response) {
  try {
    const { url } = req.body || {};
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL do alvo é necessária para o scanner Nikto.' });
    }

    let parsed: URL;
    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }

    try {
      parsed = new URL(targetUrl);
    } catch {
      return res.status(400).json({ error: 'URL inválida.' });
    }

    const origin = parsed.origin;

    // Check HTTP Methods (OPTIONS, TRACE)
    let supportedMethods: string[] = ['GET', 'POST'];
    let dangerousMethodsFound: string[] = [];
    try {
      const optRes = await fetch(origin, {
        method: 'OPTIONS',
        headers: { 'User-Agent': 'SecScan-Nikto/2.4' }
      });
      const allowHeader = optRes.headers.get('allow') || optRes.headers.get('public') || '';
      if (allowHeader) {
        supportedMethods = allowHeader.split(',').map(s => s.trim().toUpperCase());
        dangerousMethodsFound = supportedMethods.filter(m => ['TRACE', 'PUT', 'DELETE', 'CONNECT'].includes(m));
      }
    } catch {
      // ignore
    }

    // Inspect server banner
    let serverBanner = 'Desconhecido';
    let poweredByBanner = '';
    try {
      const headRes = await fetch(origin, {
        method: 'HEAD',
        headers: { 'User-Agent': 'SecScan-Nikto/2.4' }
      });
      serverBanner = headRes.headers.get('server') || 'Oculto / Protegido';
      poweredByBanner = headRes.headers.get('x-powered-by') || '';
    } catch {
      // ignore
    }

    // Run probes concurrently with 4s timeout
    const probeResults = await Promise.all(
      NIKTO_PROBES.map(async (probe) => {
        const probeTarget = `${origin}${probe.path}`;
        try {
          const controller = new AbortController();
          const timer = setTimeout(() => controller.abort(), 4000);
          const r = await fetch(probeTarget, {
            method: 'GET',
            signal: controller.signal,
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SecScan-Nikto/2.4',
              'Accept': '*/*'
            }
          });
          clearTimeout(timer);

          const isExposed = probe.expectedStatus.includes(r.status);
          const contentType = r.headers.get('content-type') || '';

          // Discard false positives (e.g. single page applications returning 200 index.html for any 404 path)
          const isSpaFalsePositive = isExposed && contentType.includes('text/html') && probe.path.endsWith('.env');

          return {
            path: probe.path,
            title: probe.title,
            category: probe.category,
            severity: isSpaFalsePositive ? 'info' : (isExposed ? probe.severity : 'good'),
            status: r.status,
            statusText: r.statusText,
            isVulnerable: isExposed && !isSpaFalsePositive,
            description: probe.description,
            remediation: probe.remediation
          };
        } catch {
          return {
            path: probe.path,
            title: probe.title,
            category: probe.category,
            severity: 'good',
            status: 0,
            statusText: 'Bloqueado / Timeout',
            isVulnerable: false,
            description: probe.description,
            remediation: probe.remediation
          };
        }
      })
    );

    const vulnerableItems = probeResults.filter(p => p.isVulnerable);
    const securityScore = Math.max(20, 100 - (vulnerableItems.length * 20) - (dangerousMethodsFound.length * 15));

    return res.json({
      targetUrl: origin,
      serverBanner,
      poweredByBanner,
      supportedMethods,
      dangerousMethodsFound,
      probesTotal: probeResults.length,
      vulnerabilitiesCount: vulnerableItems.length,
      securityScore,
      results: probeResults
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Falha ao executar varredura Nikto.' });
  }
}
