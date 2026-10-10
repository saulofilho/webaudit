export type Language = 'pt' | 'en';

export interface TranslationDictionary {
  appName: string;
  tagline: string;
  auditTitle: string;
  auditPlaceholder: string;
  auditButton: string;
  auditingButton: string;
  history: string;
  actionPlan: string;
  export: string;
  newAudit: string;
  commercialProposal: string;
  scheduledMonitor: string;
  quickWinsFilter: string;
  tabs: {
    all: string;
    security: string;
    seo: string;
    bestPractices: string;
    performance: string;
    heatmap: string;
    serpSimulator: string;
    contentSemantics: string;
    brokenLinks: string;
    sitemapCrawler: string;
    cannibalization: string;
    ecoScripts: string;
    vitals: string;
    configGen: string;
    sslDns: string;
    accessibility: string;
    privacy: string;
    mobile: string;
    headers: string;
    social: string;
    tech: string;
    comparator: string;
    trends: string;
    jsMiner: string;
    nikto: string;
    dast: string;
    waf: string;
    ssrf: string;
    jwt: string;
    compliance: string;
    llmSec: string;
    stride: string;
    soar: string;
    threatIntel: string;
    imageAudit: string;
  };
  severity: {
    all: string;
    critical: string;
    warning: string;
    good: string;
  };
  scoreLabels: {
    overall: string;
    grade: string;
    status: string;
  };
}

export const translations: Record<Language, TranslationDictionary> = {
  pt: {
    appName: 'WebAudit PRO',
    tagline: 'SEGURANÇA • SEO • BOAS PRÁTICAS • PERFORMANCE',
    auditTitle: 'AUDITORIA COMPLETA DE WEBSITE & SEO',
    auditPlaceholder: 'Insira qualquer URL (ex: https://exemplo.com.br)',
    auditButton: 'ANALISAR SITE',
    auditingButton: 'AUDITANDO...',
    history: 'HISTÓRICO',
    actionPlan: 'PLANO DE AÇÃO',
    export: 'EXPORTAR',
    newAudit: 'NOVA AUDITORIA',
    commercialProposal: 'PROPOSTA COMERCIAL',
    scheduledMonitor: 'MONITORAMENTO',
    quickWinsFilter: '⚡ VITÓRIAS RÁPIDAS',
    tabs: {
      all: 'TODOS OS ITENS',
      security: 'SEGURANÇA',
      seo: 'SEO TÉCNICO',
      bestPractices: 'BOAS PRÁTICAS',
      performance: 'PERFORMANCE',
      heatmap: 'MAPA DE CALOR SEO',
      serpSimulator: 'SIMULADOR SERP',
      contentSemantics: 'CONTEÚDO & TF-IDF',
      brokenLinks: 'LINKS QUEBRADOS',
      sitemapCrawler: 'CRAWLER SITEMAP',
      cannibalization: 'CANIBALIZAÇÃO SEO',
      ecoScripts: 'ECO-INDEX & SCRIPTS',
      vitals: 'CORE WEB VITALS',
      configGen: 'GERADOR CONFIG',
      sslDns: 'SSL & DNS',
      accessibility: 'ACESSIBILIDADE WCAG',
      privacy: 'PRIVACIDADE & LGPD',
      mobile: 'SIMULADOR MOBILE',
      headers: 'CABEÇALHOS HTTP',
      social: 'PRÉVIAS SOCIAIS',
      tech: 'TECNOLOGIAS',
      comparator: 'COMPARAR SITES',
      trends: 'TENDÊNCIAS',
      jsMiner: 'JS MINER & SEGREDOS',
      nikto: 'NIKTO WEB SCANNER',
      dast: 'DAST FUZZER',
      waf: 'WAF & FIREWALL',
      ssrf: 'SSRF VALIDATOR',
      jwt: 'JWT INSPECTOR',
      compliance: 'COMPLIANCE (LGPD/ISO)',
      llmSec: 'SEGURANÇA IA & LLM',
      stride: 'STRIDE THREAT MODEL',
      soar: 'PLAYBOOKS SOAR',
      threatIntel: 'THREAT INTEL & KEV',
      imageAudit: 'AUDITORIA DE IMAGENS & ALT',
    },
    severity: {
      all: 'TODOS',
      critical: 'CRÍTICO',
      warning: 'AVISO',
      good: 'APROVADO',
    },
    scoreLabels: {
      overall: 'PONTUAÇÃO GERAL',
      grade: 'NOTA',
      status: 'DIAGNÓSTICO',
    },
  },
  en: {
    appName: 'WebAudit PRO',
    tagline: 'SECURITY • SEO • BEST_PRACTICES • SPEED',
    auditTitle: 'COMPREHENSIVE WEBSITE & SEO AUDIT',
    auditPlaceholder: 'Enter any website URL (e.g. https://example.com)',
    auditButton: 'ANALYZE SITE',
    auditingButton: 'AUDITING...',
    history: 'HISTORY',
    actionPlan: 'ACTION PLAN',
    export: 'EXPORT',
    newAudit: 'NEW AUDIT',
    commercialProposal: 'CLIENT PROPOSAL',
    scheduledMonitor: 'MONITORING',
    quickWinsFilter: '⚡ QUICK WINS',
    tabs: {
      all: 'ALL AUDITS',
      security: 'SECURITY',
      seo: 'SEO AUDITS',
      bestPractices: 'BEST PRACTICES',
      performance: 'PERFORMANCE',
      heatmap: 'SEO HEATMAP',
      serpSimulator: 'SERP SIMULATOR',
      contentSemantics: 'CONTENT & TF-IDF',
      brokenLinks: 'BROKEN LINKS',
      sitemapCrawler: 'SITEMAP CRAWLER',
      cannibalization: 'KEYWORD CANNIBALIZATION',
      ecoScripts: 'ECO & 3RD-PARTY',
      vitals: 'CORE WEB VITALS',
      configGen: '1-CLICK CONFIGS',
      sslDns: 'SSL & DNS',
      accessibility: 'ACCESSIBILITY WCAG',
      privacy: 'PRIVACY & COOKIES',
      mobile: 'MOBILE SIMULATOR',
      headers: 'HTTP HEADERS',
      social: 'SOCIAL PREVIEW',
      tech: 'TECH STACK',
      comparator: 'SITE COMPARATOR',
      trends: 'HISTORICAL TRENDS',
      jsMiner: 'JS MINER & SECRETS',
      nikto: 'NIKTO WEB SCANNER',
      dast: 'DAST FUZZER',
      waf: 'WAF & FIREWALL',
      ssrf: 'SSRF VALIDATOR',
      jwt: 'JWT INSPECTOR',
      compliance: 'COMPLIANCE (LGPD/ISO)',
      llmSec: 'LLM & AI SECURITY',
      stride: 'STRIDE THREAT MODEL',
      soar: 'SOAR PLAYBOOKS',
      threatIntel: 'THREAT INTEL & KEV',
      imageAudit: 'IMAGE ACCESSIBILITY AUDIT',
    },
    severity: {
      all: 'ALL',
      critical: 'CRITICAL',
      warning: 'WARNING',
      good: 'PASSED',
    },
    scoreLabels: {
      overall: 'OVERALL SCORE',
      grade: 'GRADE',
      status: 'DIAGNOSTIC',
    },
  },
};
