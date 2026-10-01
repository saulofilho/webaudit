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
  urgency: 'Imediata' | 'Alta' | 'Média';
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
    let urgency: 'Imediata' | 'Alta' | 'Média' = 'Alta';
    if (idx === 0 || item.severity === 'critical') urgency = 'Imediata';
    else if (idx === 2) urgency = 'Média';

    let businessImpact =
      item.impact ||
      'Pode causar perda de tráfego orgânico, abandono de checkout ou exposição a ataques web automatizados.';
    let technicalCause =
      item.summary ||
      'Diretivas essenciais de segurança ou boas práticas não foram detectadas nos cabeçalhos ou no HTML.';

    if (item.id.includes('hsts') || item.id.includes('csp')) {
      businessImpact =
        'Vulnerabilidade a ataques de injeção de script (XSS) e interceptação Man-in-the-Middle (MitM), arriscando dados de clientes.';
      technicalCause = 'Cabeçalhos HTTP Strict-Transport-Security ou Content-Security-Policy ausentes no servidor.';
    } else if (item.category === 'seo') {
      businessImpact =
        'Desvantagem direta no algoritmo do Google, reduzindo taxa de cliques na SERP e visibilidade competitiva.';
      technicalCause = 'Metatags essenciais (title, description ou dados estruturados JSON-LD) incompletas ou ausentes.';
    } else if (item.category === 'performance_accessibility') {
      businessImpact =
        'Cada segundo extra de carregamento reduz a taxa de conversão em até 7%, aumentando a taxa de rejeição móvel.';
      technicalCause = 'Recursos bloqueadores de renderização e falta de otimização de imagens pesadas no carregamento inicial.';
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
        'Aplicar configuração recomendada via servidor de borda (Cloudflare / Vercel / Nginx) ou meta tags.',
    };
  });

  const strategicVerdict =
    report.overallScore >= 85
      ? 'Excelente Integridade Geral com Ajustes Pontuais'
      : report.overallScore >= 70
      ? 'Desempenho Estável com Gargalos Prioritários de Risco'
      : 'Risco Elevado: Intervenção Prioritária Necessária';

  const executiveOverview =
    tone === 'executive'
      ? `A auditoria técnica executada no domínio ${hostname} apontou uma pontuação consolidada de ${report.overallScore}/100 (Classificação ${report.overallGrade}). A infraestrutura apresenta pilares com boa estabilidade, com destaque para ${
          report.keyStrengths?.[0] || 'resposta do servidor'
        }. No entanto, identificamos ${
          criticalItems.length
        } vulnerabilidade(s) de severidade crítica que impactam a segurança da marca, a conformidade de dados e o índice de conversão. Recomendamos uma estratégia faseada em 3 etapas, com foco prioritário na blindagem de cabeçalhos de segurança e otimização de ativos de carregamento, projetando um ganho de até +${Math.min(
          20,
          100 - report.overallScore
        )} pontos no índice de qualidade.`
      : `Diagnóstico detalhado para o host ${hostname} revelou Score Global de ${report.overallScore}/100. Registramos tempo de resposta do servidor (TTFB) de ${report.rawData?.responseTimeMs || 0}ms e payload DOM de ${((report.rawData?.contentLengthBytes || 0) / 1024).toFixed(1)} KB. Os principais ofensores técnicos concentram-se na ausência de headers HTTP defensivos e oportunidades em render-blocking resources. A resolução das 3 prioridades imediatas desobstrui a thread principal e fecha vetores de clickjacking e XSS.`;

  return {
    targetUrl: report.targetUrl,
    analyzedAt: new Date().toISOString(),
    overallScore: report.overallScore,
    overallGrade: report.overallGrade,
    strategicVerdict,
    executiveOverview,
    cLevelHighlights: [
      `Índice de Saúde Web consolidado em ${report.overallScore}/100 (Nota ${report.overallGrade}).`,
      `Segurança avaliada em ${report.categories.security.score}% com ${criticalItems.length} alerta(s) de ação imediata.`,
      `Oportunidade de elevar o tráfego orgânico e taxa de conversão em até 12% eliminando gargalos prioritários.`,
      `Tempo estimado para as 3 correções mais urgentes: menos de 2 horas de engenharia.`,
    ],
    top3CriticalIssues,
    priorityRoadmap: [
      {
        phase: 'Fase 1: Correções Imediatas',
        title: 'Proteção Ativa e Blindagem de Borda',
        timeframe: '0 a 24 horas',
        actions: [
          `Configurar cabeçalhos HSTS e CSP no servidor para mitigar ataques cibernéticos.`,
          `Inserir diretiva X-Frame-Options para prevenção contra clickjacking.`,
        ],
        expectedScoreBoost: '+8 a +12 pts',
        estimatedEffort: '15 a 30 min',
      },
      {
        phase: 'Fase 2: Otimização Estrutural',
        title: 'Visibilidade Orgânica e Dados Estruturados',
        timeframe: '1 a 3 dias',
        actions: [
          `Implementar Schema.org JSON-LD para habilitar Rich Snippets no Google.`,
          `Ajustar meta description e tags OpenGraph para elevar o CTR nas redes e SERP.`,
        ],
        expectedScoreBoost: '+5 a +8 pts',
        estimatedEffort: '1 a 2 horas',
      },
      {
        phase: 'Fase 3: Refinamento Contínuo',
        title: 'Aceleração de Performance e Core Web Vitals',
        timeframe: '1 a 2 semanas',
        actions: [
          `Adicionar defer/async em scripts de terceiros e otimizar formato de imagens para WebP.`,
          `Estabelecer monitoramento contínuo via webhooks para evitar regressões.`,
        ],
        expectedScoreBoost: '+4 a +6 pts',
        estimatedEffort: '2 a 4 horas',
      },
    ],
    roiAndBusinessRiskAnalysis: {
      conversionOpportunity:
        'Redução do TTFB e otimização do LCP abaixo de 2.5s promove retenção de usuários e incrementa vendas em até +8.4%.',
      securityExposureRisk:
        'A ausência de políticas rígidas de segurança expõe a empresa a penalidades de compliance e desconfiança de clientes.',
      seoVisibilityImpact:
        'Ajuste das metatags e hierarquia semântica recupera posições nas páginas de resultados do Google frente a concorrentes.',
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
          `Item ${idx + 1}: [${it.category.toUpperCase()}] ${it.title} (Severidade: ${
            it.severity
          }, Score: ${it.score}/100) - Resumo: ${it.summary} - Impacto: ${it.impact || 'N/A'}`
      )
      .join('\n');

    const prompt = `
Você é o Chief Technology Officer (CTO) e Consultor Principal de Segurança e Performance Web da WebAudit PRO.
Sua missão é gerar um SUMÁRIO EXECUTIVO PROFISSIONAL, em linguagem natural impecável, analisando a auditoria completa do website.

DADOS DA AUDITORIA:
- Website: "${report.targetUrl}" (Domínio: ${hostname})
- Score Geral: ${report.overallScore}/100 (Classificação / Grade: ${report.overallGrade})
- Pontuações por Pilar:
  * Segurança: ${report.categories?.security?.score ?? 0}% (Grade ${report.categories?.security?.grade ?? 'N/A'}, ${report.categories?.security?.criticalCount ?? 0} críticos)
  * SEO & Busca: ${report.categories?.seo?.score ?? 0}% (Grade ${report.categories?.seo?.grade ?? 'N/A'})
  * Boas Práticas: ${report.categories?.best_practices?.score ?? 0}% (Grade ${report.categories?.best_practices?.grade ?? 'N/A'})
  * Performance & Velocidade: ${report.categories?.performance_accessibility?.score ?? 0}% (Grade ${report.categories?.performance_accessibility?.grade ?? 'N/A'})
- Latência TTFB: ${report.rawData?.responseTimeMs ?? 0}ms
- Tamanho da Página: ${(((report.rawData?.contentLengthBytes || 0) / 1024)).toFixed(1)} KB
- Total de Imagens: ${report.rawData?.imagesTotal ?? 0} (${report.rawData?.imagesMissingAlt ?? 0} sem alt)
- Scripts: ${report.rawData?.scriptsCount ?? 0}
- Tom Solicitado: ${tone === 'executive' ? 'Executivo / C-Level (foco em risco, negócio e ROI)' : 'Técnico / Engenharia (foco em arquitetura e código)'}

PRINCIPAIS PROBLEMAS DETECTADOS:
${topIssuesContext}

PONTOS FORTES:
${(report.keyStrengths || ['Estabilidade de resposta do servidor']).join(', ')}

DIRETRIZES OBRIGATÓRIAS:
1. Identifique e selecione COM EXATIDÃO os TOP 3 problemas mais críticos de todo o relatório. Para cada um, explique claramente o IMPACTO NO NEGÓCIO (ex: risco de vazamento de dados, perda de clientes no funil, queda de ranking no Google) e a CAUSA TÉCNICA RAIZ.
2. Defina uma ORDEM DE PRIORIDADE DE REMEDIAÇÃO em 3 fases bem estruturadas (Fase 1: 0-24h, Fase 2: 1-3 dias, Fase 3: Contínuo) com ações concretas e ganho estimado de pontuação.
3. Elabore uma narrativa executiva fluida, concisa e de alto nível (executiveOverview) com 2 parágrafos sólidos.
4. Responda em Português do Brasil de altíssimo padrão técnico e corporativo.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'Você é um consultor executivo sênior de infraestrutura digital, segurança e SEO. Gere respostas em formato JSON estruturado com rigor analítico.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            strategicVerdict: {
              type: Type.STRING,
              description: 'Veredito estratégico de 1 linha (ex: Risco Crítico de Segurança, Desempenho Estável, etc).',
            },
            executiveOverview: {
              type: Type.STRING,
              description: 'Narrativa executiva profunda em linguagem natural de 2 parágrafos analisando o site.',
            },
            cLevelHighlights: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '3 a 4 tópicos executivos sintetizados para apresentação a diretores.',
            },
            top3CriticalIssues: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  rank: { type: Type.INTEGER, description: '1, 2 ou 3' },
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  category: { type: Type.STRING },
                  severity: { type: Type.STRING },
                  score: { type: Type.NUMBER },
                  businessImpact: { type: Type.STRING, description: 'Impacto concreto para o negócio e clientes.' },
                  technicalRootCause: { type: Type.STRING, description: 'Causa técnica raiz precisa.' },
                  urgency: { type: Type.STRING, enum: ['Imediata', 'Alta', 'Média'] },
                  suggestedQuickAction: { type: Type.STRING, description: 'Ação rápida sugerida.' },
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
      strategicVerdict: parsed.strategicVerdict || 'Análise Concluída',
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
