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
  riskLevel: 'Baixo' | 'Médio' | 'Alto';
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
  const techNames = techStack?.map((t) => t.name).join(', ') || 'Geral / Web Standard';
  const urlDomain = targetUrl ? new URL(targetUrl).hostname : 'seusite.com';

  // Base fallback implementations based on item category and title
  const isSecurity = item.category === 'security';
  const isSeo = item.category === 'seo';
  const isBestPractice = item.category === 'best_practices';

  let codeImplementations: AICodeOption[] = [];
  let verificationCmd = `curl -I -s -L "https://${urlDomain}"`;
  let steps: AIFixStep[] = [];
  let riskLevel: 'Baixo' | 'Médio' | 'Alto' = item.severity === 'critical' ? 'Médio' : 'Baixo';
  let riskDescription = 'Alterações de configuração em ambiente de produção devem ser testadas primeiro em staging.';

  if (item.codeSnippet) {
    codeImplementations.push({
      platform: 'Padrão / Recomendado',
      title: item.codeSnippet.title || 'Configuração Recomendada',
      language: item.codeSnippet.language || 'nginx',
      code: item.codeSnippet.code,
      explanation: 'Aplique esta diretiva diretamente no bloco de configuração do seu servidor ou aplicação.',
    });
  }

  // Security Headers Fallback
  if (item.id.startsWith('sec_h_') || item.title.toLowerCase().includes('header') || item.title.toLowerCase().includes('hsts') || item.title.toLowerCase().includes('csp')) {
    codeImplementations = [
      {
        platform: 'Nginx',
        title: 'Diretiva Nginx (nginx.conf)',
        language: 'nginx',
        filePath: '/etc/nginx/conf.d/default.conf',
        code: item.codeSnippet?.code || `add_header X-Frame-Options "SAMEORIGIN" always;\nadd_header X-Content-Type-Options "nosniff" always;\nadd_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;\nadd_header Referrer-Policy "strict-origin-when-cross-origin" always;`,
        explanation: 'Adicione no bloco server { ... } dentro da configuração do seu Nginx e recarregue o serviço.',
      },
      {
        platform: 'Apache',
        title: 'Diretiva Apache (.htaccess)',
        language: 'apache',
        filePath: '.htaccess',
        code: `<IfModule mod_headers.c>\n  Header always set X-Content-Type-Options "nosniff"\n  Header always set X-Frame-Options "SAMEORIGIN"\n  Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"\n  Header always set Referrer-Policy "strict-origin-when-cross-origin"\n</IfModule>`,
        explanation: 'Certifique-se de que o mod_headers está habilitado (a2enmod headers) e insira no arquivo .htaccess raiz.',
      },
      {
        platform: 'Node.js / Express',
        title: 'Middleware Express (Helmet)',
        language: 'typescript',
        filePath: 'server.ts / app.js',
        code: `import helmet from 'helmet';\nimport express from 'express';\n\nconst app = express();\n// Habilita automaticamente os principais security headers\napp.use(helmet());`,
        explanation: 'Instale a biblioteca helmet (`npm install helmet`) e aplique como primeiro middleware no Express.',
      },
      {
        platform: 'Next.js',
        title: 'Headers em next.config.js',
        language: 'javascript',
        filePath: 'next.config.js',
        code: `module.exports = {\n  async headers() {\n    return [\n      {\n        source: '/(.*)',\n        headers: [\n          { key: 'X-Content-Type-Options', value: 'nosniff' },\n          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },\n          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },\n        ],\n      },\n    ];\n  },\n};`,
        explanation: 'Configure a função headers() no next.config.js para que as rotas sirvam os cabeçalhos em produção.',
      },
    ];

    verificationCmd = `curl -I -s "https://${urlDomain}" | grep -i "${item.title.split(' ')[0]}"`;
    steps = [
      {
        stepNumber: 1,
        title: 'Identificar o servidor web ou gateway',
        description: `Seu ambiente possui as seguintes tecnologias detectadas: ${techNames}. Escolha a aba correspondente acima.`,
      },
      {
        stepNumber: 2,
        title: 'Inserir a configuração ou middleware',
        description: 'Abra o arquivo de configuração do seu servidor ou adicione o middleware no código fonte da aplicação.',
        code: item.codeSnippet?.code || codeImplementations[0].code,
        language: item.codeSnippet?.language || 'nginx',
      },
      {
        stepNumber: 3,
        title: 'Testar e Recarregar o Servidor',
        description: 'Execute `nginx -t` ou `apachectl configtest` antes de recarregar (`systemctl reload nginx`). Em seguida faça deploy.',
      },
      {
        stepNumber: 4,
        title: 'Validar a resposta HTTP',
        description: 'Execute o comando de verificação cURL no terminal para confirmar que o cabeçalho está presente.',
        code: verificationCmd,
        language: 'bash',
      },
    ];
  } else if (isSeo) {
    codeImplementations = [
      {
        platform: 'HTML / Frontend',
        title: 'Tags no <head> HTML',
        language: 'html',
        filePath: 'index.html / Layout.tsx',
        code: item.codeSnippet?.code || `<head>\n  <title>Título Descritivo e Otimizado | Sua Marca</title>\n  <meta name="description" content="Descrição clara e atraente com 120-155 caracteres." />\n  <link rel="canonical" href="https://${urlDomain}/" />\n  <meta name="robots" content="index, follow" />\n</head>`,
        explanation: 'Insira dentro da tag <head> do arquivo HTML principal ou no componente Head do seu framework.',
      },
      {
        platform: 'Next.js (App Router)',
        title: 'Metadata Object (layout.tsx)',
        language: 'typescript',
        filePath: 'app/layout.tsx',
        code: `import type { Metadata } from 'next';\n\nexport const metadata: Metadata = {\n  title: 'Título Otimizado para SEO | Marca',\n  description: 'Descrição precisa com palavras-chave estratégicas.',\n  alternates: {\n    canonical: 'https://${urlDomain}',\n  },\n  robots: {\n    index: true,\n    follow: true,\n  },\n};`,
        explanation: 'Exporte o objeto metadata no seu arquivo layout.tsx ou page.tsx para injeção automática no servidor.',
      },
    ];

    verificationCmd = `curl -s -L "https://${urlDomain}" | grep -i -E "(title|description|canonical|og:)"`;
    steps = [
      {
        stepNumber: 1,
        title: 'Localizar o arquivo de template HTML ou Layout',
        description: 'Abra o arquivo onde a tag `<head>` ou o componente de Metadata é gerenciado.',
      },
      {
        stepNumber: 2,
        title: 'Aplicar a tag recomendada',
        description: 'Preencha com o conteúdo adequado respeitando os limites de caracteres e hierarquia.',
        code: codeImplementations[0].code,
        language: 'html',
      },
      {
        stepNumber: 3,
        title: 'Verificar no navegador e ferramentas SEO',
        description: 'Inspecione o código-fonte gerado e teste com o Google Rich Results Test ou a aba Redes Sociais do Website Analyzer.',
      },
    ];
  } else {
    // General / Best practices / Performance
    codeImplementations = [
      {
        platform: 'Código Recomendado',
        title: 'Correção Direta',
        language: item.codeSnippet?.language || 'html',
        code: item.codeSnippet?.code || `<!-- Exemplo de correção recomendada -->\n<!-- ${item.summary} -->`,
        explanation: 'Implemente a recomendação de acordo com os padrões de acessibilidade e performance web.',
      },
    ];

    steps = [
      {
        stepNumber: 1,
        title: 'Analisar o elemento afetado',
        description: item.summary,
      },
      {
        stepNumber: 2,
        title: 'Implementar a correção no código',
        description: item.recommendedValue ? `Atualize para o valor recomendado: ${item.recommendedValue}` : 'Aplique o snippet de código fornecido.',
        code: item.codeSnippet?.code,
        language: item.codeSnippet?.language,
      },
      {
        stepNumber: 3,
        title: 'Reauditar o website',
        description: 'Execute uma nova auditoria para verificar se o score desta categoria aumentou.',
      },
    ];
  }

  return {
    itemId: item.id,
    itemTitle: item.title,
    headline: `Guia de correção passo a passo para: ${item.title}`,
    severity: item.severity,
    category: item.category,
    targetUrl,
    problemAnalysis: item.impact || item.summary || 'Este item requer ajuste para garantir conformidade com os padrões modernos da web.',
    estimatedTime: item.severity === 'critical' ? '5-10 minutos' : '2-5 minutos',
    riskLevel,
    riskDescription,
    steps,
    codeImplementations,
    verificationCommand: verificationCmd,
    verificationInstructions: 'Execute este comando no seu terminal ou inspecione as ferramentas de desenvolvedor (DevTools Network/Console) para certificar-se da aplicação correta.',
    proTips: [
      'Faça deploy em ambiente de staging antes de promover para produção.',
      'Mantenha controle de versão via Git com commits atômicos para cada correção.',
      'Utilize a aba Comparador ou Reauditar para validar a evolução do score.',
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
      : 'Não especificada / Web Padrão';

    const prompt = `
Você é um Engenheiro Sênior de Infraestrutura Web, Segurança e Performance (SRE/Architect).
Gere um guia de correção EXTREMAMENTE PRECISO, passo a passo, com códigos reais e comandos executáveis para resolver o seguinte problema de auditoria de website.

DADOS DA AUDITORIA:
- ID do Item: "${item.id}"
- Título do Problema: "${item.title}"
- Categoria: "${item.category}"
- Severidade: "${item.severity}"
- Pontuação Atual: ${item.score}/100
- Resumo do Problema: "${item.summary}"
- Impacto e Risco: "${item.impact || 'Não detalhado'}"
- Valor Atual Detectado: "${item.currentValue || 'Não configurado / Incorreto'}"
- Valor Recomendado: "${item.recommendedValue || 'Configuração recomendada segundo padrões W3C / OWASP / Google'}"
- Snippet existente sugerido: "${item.codeSnippet?.code || 'N/A'}"
- URL do Website Auditado: "${targetUrl || 'Website auditado'}"
- Tecnologias e Stack detectadas: "${techSummary}"
${customFramework ? `- Framework / Plataforma solicitada pelo usuário: "${customFramework}"` : ''}
${userQuestion ? `- Dúvida ou instrução específica do usuário: "${userQuestion}"` : ''}

INSTRUÇÕES OBRIGATÓRIAS:
1. Forneça instruções passo a passo (Step 1, Step 2, Step 3, etc.) práticas e diretas.
2. Forneça implementações de código completas e prontas para copiar e colar para as plataformas mais populares relevantes (por exemplo: Nginx, Apache, Node.js/Express Helmet, Next.js, HTML/React, WordPress .htaccess/PHP, Cloudflare Rules).
3. Especifique os caminhos dos arquivos comuns (ex: /etc/nginx/conf.d/site.conf, .htaccess, next.config.js, server.ts).
4. Forneça um comando cURL ou ferramenta de terminal executável para o desenvolvedor testar se a correção funcionou na URL "${targetUrl || 'https://exemplo.com'}".
5. Avalie o risco de quebra ("Baixo", "Médio", "Alto") e descreva cuidados (ex: CSP estrito pode quebrar scripts externos).
6. Responda em Português do Brasil com terminologia técnica impecável.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: prompt,
      config: {
        systemInstruction:
          'Você é um especialista em desenvolvimento web, DevSecOps e auditoria técnica de sites. Gere respostas estruturadas em JSON com precisão cirúrgica.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: {
              type: Type.STRING,
              description: 'Frase de efeito técnica sintetizando a solução.',
            },
            problemAnalysis: {
              type: Type.STRING,
              description: 'Análise técnica clara de porque esse problema ocorre e qual o risco.',
            },
            estimatedTime: {
              type: Type.STRING,
              description: 'Tempo estimado de implementação (ex: 3-5 minutos).',
            },
            riskLevel: {
              type: Type.STRING,
              enum: ['Baixo', 'Médio', 'Alto'],
              description: 'Nível de risco de regressão ou incompatibilidade.',
            },
            riskDescription: {
              type: Type.STRING,
              description: 'Descrição de eventuais cuidados, efeitos colaterais e como reverter se necessário.',
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
                  platform: { type: Type.STRING, description: 'Ex: Nginx, Apache, Node.js (Express), Next.js, HTML, WordPress' },
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
              description: 'Comando cURL ou bash para validar a correção.',
            },
            verificationInstructions: {
              type: Type.STRING,
              description: 'Como interpretar o resultado da verificação.',
            },
            proTips: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: '2 a 3 dicas profissionais avançadas.',
            },
            suggestedCommitMessage: {
              type: Type.STRING,
              description: 'Mensagem de commit convencional recomendada (ex: fix(security): add hsts header).',
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
      headline: parsed.headline || `Correção técnica para ${item.title}`,
      severity: item.severity,
      category: item.category,
      targetUrl,
      problemAnalysis: parsed.problemAnalysis || item.impact || item.summary,
      estimatedTime: parsed.estimatedTime || '5 minutos',
      riskLevel: parsed.riskLevel || (item.severity === 'critical' ? 'Médio' : 'Baixo'),
      riskDescription: parsed.riskDescription || 'Teste em ambiente controlado antes de publicar em produção.',
      steps: Array.isArray(parsed.steps) ? parsed.steps : [],
      codeImplementations: Array.isArray(parsed.codeImplementations) ? parsed.codeImplementations : [],
      verificationCommand: parsed.verificationCommand || `curl -I -s "https://${targetUrl ? new URL(targetUrl).hostname : 'seusite.com'}"`,
      verificationInstructions: parsed.verificationInstructions || 'Confirme se o cabeçalho ou tag esperada retorna 200 OK.',
      proTips: Array.isArray(parsed.proTips) ? parsed.proTips : [],
      suggestedCommitMessage: parsed.suggestedCommitMessage || `fix: resolve ${item.title.toLowerCase()}`,
    };
  } catch (err) {
    console.error('Error generating AI fix via Gemini:', err);
    return generateFallbackFix(item, targetUrl, techStack, customFramework);
  }
}
