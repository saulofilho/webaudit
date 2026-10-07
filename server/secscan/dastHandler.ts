import { Request, Response } from 'express';

interface DastFuzzCheck {
  param: string;
  category: 'XSS' | 'SQLi' | 'Path Traversal' | 'Open Redirect' | 'SSRF';
  payload: string;
  reflected: boolean;
  status: number;
  anomalyDetected: boolean;
  notes: string;
}

export async function handleDastFuzz(req: Request, res: Response) {
  try {
    const { url, customParam } = req.body || {};
    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL alvo necessária para execução do DAST.' });
    }

    let parsed: URL;
    let target = url.trim();
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
      target = 'https://' + target;
    }
    try {
      parsed = new URL(target);
    } catch {
      return res.status(400).json({ error: 'URL inválida.' });
    }

    // Determine candidate parameter
    const testParam = customParam || 'q';

    // Test safe canary payloads
    const testPayloads = [
      {
        category: 'XSS' as const,
        payload: '<secscan_xss_canary_7142>',
        description: 'Testa se caracteres < e > são refletidos sem encoding HTML no corpo.'
      },
      {
        category: 'SQLi' as const,
        payload: "1' AND '1'='1",
        description: 'Testa se caracteres de aspa simples alteram o fluxo ou disparam erro de sintaxe SQL.'
      },
      {
        category: 'Path Traversal' as const,
        payload: '..%2f..%2fetc%2fpasswd',
        description: 'Testa sanitização contra sequências de travessia de diretório com codificação URL.'
      },
      {
        category: 'Open Redirect' as const,
        payload: 'https://security-defense-check.example.com',
        description: 'Testa se parâmetros de redirecionamento aceitam domínios externos arbitrários.'
      }
    ];

    const results: DastFuzzCheck[] = [];

    for (const test of testPayloads) {
      const fuzzUrl = new URL(target);
      fuzzUrl.searchParams.set(testParam, test.payload);

      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 4000);
        const resp = await fetch(fuzzUrl.toString(), {
          method: 'GET',
          signal: controller.signal,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) SecScan-DAST/2.5'
          }
        });
        clearTimeout(timer);

        const body = await resp.text();
        const reflected = body.includes(test.payload);
        const anomalyDetected = reflected || resp.status === 500;

        results.push({
          param: testParam,
          category: test.category,
          payload: test.payload,
          reflected,
          status: resp.status,
          anomalyDetected,
          notes: reflected
            ? `ATENÇÃO: Payload refletido sem sanitização no documento HTML! Risco elevado de ${test.category}.`
            : (resp.status === 500
              ? `Erro HTTP 500 gerado pela entrada do payload. Possível erro de banco ou exceção não tratada.`
              : `Payload devidamente neutralizado ou sanitizado pelo servidor.`)
        });
      } catch {
        results.push({
          param: testParam,
          category: test.category,
          payload: test.payload,
          reflected: false,
          status: 0,
          anomalyDetected: false,
          notes: 'Requisição bloqueada ou timeout (comportamento seguro).'
        });
      }
    }

    const vulnerabilities = results.filter(r => r.anomalyDetected);

    return res.json({
      targetUrl: target,
      testedParameter: testParam,
      totalTests: results.length,
      anomaliesCount: vulnerabilities.length,
      securityScore: vulnerabilities.length === 0 ? 100 : Math.max(30, 100 - (vulnerabilities.length * 35)),
      tests: results
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Falha ao executar fuzzer DAST.' });
  }
}
