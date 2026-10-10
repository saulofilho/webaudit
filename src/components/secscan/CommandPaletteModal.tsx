import React, { useState, useEffect } from 'react';
import {
  Search,
  FileCode,
  Server,
  Flame,
  Shield,
  Key,
  FileCheck2,
  Bot,
  Layers,
  Workflow,
  Radio,
  Globe,
  Sparkles,
  Command,
  X,
  Image as ImageIcon,
  GitMerge,
  FileSearch,
  MapPin,
  Eye,
  Lock,
  Leaf,
  Cookie,
  Smartphone,
  CheckCircle2,
  Zap,
  Gauge,
  Code2,
  ListTodo,
  Briefcase,
  Printer,
  Download,
  RotateCcw,
} from 'lucide-react';
import { NavigationTab } from '../../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: NavigationTab) => void;
  onOpenActionPlan?: () => void;
  onOpenProposal?: () => void;
  onOpenWhiteLabelPdf?: () => void;
  onOpenExport?: () => void;
  onNewAudit?: () => void;
}

interface CommandItem {
  id: string;
  tab?: NavigationTab;
  action?: () => void;
  title: string;
  category: 'Auditoria Web & SEO' | 'SecScan Pentest & Defesa' | 'Ações & Relatórios';
  icon: any;
  keywords: string;
  badge?: string;
}

export function CommandPaletteModal({
  isOpen,
  onClose,
  onSelectTab,
  onOpenActionPlan,
  onOpenProposal,
  onOpenWhiteLabelPdf,
  onOpenExport,
  onNewAudit,
}: CommandPaletteProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const commandItems: CommandItem[] = [
    // WebAudit Pro Suite
    { id: 'c-all', tab: 'all', title: 'Painel Geral de Auditoria 360° (Overview)', category: 'Auditoria Web & SEO', icon: Globe, keywords: 'geral resumo auditoria overview 360 nota score analise' },
    { id: 'c-vitals', tab: 'vitals', title: 'Core Web Vitals & Performance (LCP, INP, CLS)', category: 'Auditoria Web & SEO', icon: Gauge, keywords: 'core web vitals performance lcp inp cls velocidade ttfb pagespeed speed' },
    { id: 'c-image-audit', tab: 'image-audit', title: 'Auditoria de Imagens & Tags Alt (Remediador em Lote)', category: 'Auditoria Web & SEO', icon: ImageIcon, keywords: 'imagens alt tags acessibilidade fotos banner bulk remediacao' },
    { id: 'c-cannibalization', tab: 'cannibalization', title: 'Canibalização de Palavras-Chave & Canonical', category: 'Auditoria Web & SEO', icon: GitMerge, keywords: 'canibalizacao palavras chave canonical keywords conflitos duplicacao' },
    { id: 'c-content-gap', tab: 'content-gap', title: 'Content Gap Analysis & Comparativo de Concorrentes', category: 'Auditoria Web & SEO', icon: FileSearch, keywords: 'content gap concorrentes comparacao palavras lacunas artigos' },
    { id: 'c-local-seo', tab: 'local-seo', title: 'Auditoria de SEO Local & Consistência NAP', category: 'Auditoria Web & SEO', icon: MapPin, keywords: 'local seo nap google business perfil telefone endereco citacoes' },
    { id: 'c-serp', tab: 'serp', title: 'Simulador de Resultados SERP do Google & Snippet CTR', category: 'Auditoria Web & SEO', icon: Eye, keywords: 'serp google simulador snippet ctr preview busca ranking' },
    { id: 'c-heatmap', tab: 'heatmap', title: 'Heatmap de Densidade & Oportunidades SEO', category: 'Auditoria Web & SEO', icon: Layers, keywords: 'heatmap seo densidade palavras h1 h2 headings titulo' },
    { id: 'c-broken', tab: 'broken-links', title: 'Verificador de Links Quebrados & HTTP 404', category: 'Auditoria Web & SEO', icon: Globe, keywords: 'links quebrados broken 404 redirecionamentos 301 ancoras' },
    { id: 'c-sitemap', tab: 'sitemap', title: 'Crawler de Sitemap XML & Mapeamento de Páginas', category: 'Auditoria Web & SEO', icon: Globe, keywords: 'sitemap crawler paginas indexacao xml robots googlebot' },
    { id: 'c-ssl', tab: 'ssl-dns', title: 'Auditoria Profunda de SSL/TLS, DNS & Certificados', category: 'Auditoria Web & SEO', icon: Lock, keywords: 'ssl tls dns dnssec ciphers hsts certificado seguranca' },
    { id: 'c-wcag', tab: 'accessibility', title: 'Acessibilidade Digital WCAG 2.2 AAA & Leitores', category: 'Auditoria Web & SEO', icon: Globe, keywords: 'acessibilidade wcag aria contraste alt leitores tela deficientes' },
    { id: 'c-eco-scripts', tab: 'eco-scripts', title: 'Eco-Index, Emissões de CO2 & Scripts 3rd-Party', category: 'Auditoria Web & SEO', icon: Leaf, keywords: 'eco index co2 carbono verde scripts terceiros google analytics tags' },
    { id: 'c-privacy', tab: 'privacy', title: 'Privacidade de Dados, Cookies & Conformidade LGPD', category: 'Auditoria Web & SEO', icon: Cookie, keywords: 'privacidade cookies banner consentimento lgpd gdpr termos' },
    { id: 'c-mobile', tab: 'mobile', title: 'Simulador Mobile & Responsividade em Dispositivos', category: 'Auditoria Web & SEO', icon: Smartphone, keywords: 'mobile celular viewport responsivo iphone android simulador' },
    { id: 'c-config-gen', tab: 'config-gen', title: 'Gerador 1-Click de Configurações (Nginx, Apache, Cloudflare)', category: 'Auditoria Web & SEO', icon: Code2, keywords: 'config generator nginx apache cloudflare htaccess headers seguranca' },

    // SecScan Hardcore Pentest Suite
    { id: 'c-js-miner', tab: 'js-miner', title: 'JS Miner & Segredos Vazados (AWS, OpenAI, S3, JWT)', category: 'SecScan Pentest & Defesa', icon: FileCode, keywords: 'javascript bundle secrets chaves aws openai stripe s3 api chaves' },
    { id: 'c-nikto', tab: 'nikto', title: 'Nikto Web Scanner (Arquivos .env, .git, Métodos HTTP)', category: 'SecScan Pentest & Defesa', icon: Server, keywords: 'nikto web server env git backup sql trace put delete scanner' },
    { id: 'c-dast', tab: 'dast', title: 'DAST Parameter Fuzzer (XSS, SQLi, Path Traversal)', category: 'SecScan Pentest & Defesa', icon: Flame, keywords: 'dast fuzzer xss sqli lfi rce open redirect injection ataque' },
    { id: 'c-waf', tab: 'waf', title: 'Detector de WAF & Postura de Firewall (Cloudflare, AWS WAF)', category: 'SecScan Pentest & Defesa', icon: Shield, keywords: 'waf firewall cloudflare akamai imperva modsecurity protecao' },
    { id: 'c-ssrf', tab: 'ssrf', title: 'Validador de SSRF & Proteção de Metadados de Nuvem', category: 'SecScan Pentest & Defesa', icon: Globe, keywords: 'ssrf metadata 169.254 loopback private ip aws imds nuvem' },
    { id: 'c-jwt', tab: 'jwt', title: 'Auditor & Inspetor de Tokens JWT (alg none, força de chave)', category: 'SecScan Pentest & Defesa', icon: Key, keywords: 'jwt token inspector decode signature alg none claims autenticacao' },
    { id: 'c-compliance', tab: 'compliance', title: 'Hub de Conformidade (LGPD, ISO 27001, PCI-DSS, SOC 2)', category: 'SecScan Pentest & Defesa', icon: FileCheck2, keywords: 'compliance lgpd gdpr iso27001 pci soc2 anpd auditoria legal' },
    { id: 'c-llm', tab: 'llm-sec', title: 'Segurança de IA & OWASP Top 10 for LLMs', category: 'SecScan Pentest & Defesa', icon: Bot, keywords: 'llm ai artificial intelligence prompt injection owasp jailbreak modelo' },
    { id: 'c-stride', tab: 'stride', title: 'Modelagem de Ameaças Arquitetural (STRIDE & DREAD)', category: 'SecScan Pentest & Defesa', icon: Layers, keywords: 'stride threat model spoofing tampering dread architecture ameacas' },
    { id: 'c-soar', tab: 'soar', title: 'Playbooks SOAR de Resposta a Incidentes Cibernéticos', category: 'SecScan Pentest & Defesa', icon: Workflow, keywords: 'soar playbook incident response containment mitigacao ddos vazamento' },
    { id: 'c-threat-intel', tab: 'threat-intel', title: 'Radar de Threat Intelligence & CISA KEV Exploits', category: 'SecScan Pentest & Defesa', icon: Radio, keywords: 'threat intel cve cisa kev exploits zero-day ransomware alertas' },

    // Actions & Tools
    ...(onOpenActionPlan ? [{ id: 'a-plan', action: onOpenActionPlan, title: 'Abrir Plano de Ação & Checklist de Remediação', category: 'Ações & Relatórios' as const, icon: ListTodo, keywords: 'plano de acao checklist tarefas pendencias fixes correcoes' }] : []),
    ...(onOpenProposal ? [{ id: 'a-proposal', action: onOpenProposal, title: 'Gerar Proposta Comercial para Cliente (Agência)', category: 'Ações & Relatórios' as const, icon: Briefcase, keywords: 'proposta comercial cliente orcamento agencia contrato vendas' }] : []),
    ...(onOpenWhiteLabelPdf ? [{ id: 'a-pdf', action: onOpenWhiteLabelPdf, title: 'Exportar Relatório PDF White-Label Customizado', category: 'Ações & Relatórios' as const, icon: Printer, keywords: 'pdf white label relatorio impressao exportar marca cliente' }] : []),
    ...(onOpenExport ? [{ id: 'a-export', action: onOpenExport, title: 'Exportar Relatório Completo (JSON / CSV / MD)', category: 'Ações & Relatórios' as const, icon: Download, keywords: 'exportar json csv markdown download dados' }] : []),
    ...(onNewAudit ? [{ id: 'a-new', action: onNewAudit, title: 'Nova Auditoria (Analisar Outro Website)', category: 'Ações & Relatórios' as const, icon: RotateCcw, keywords: 'nova auditoria novo site analisar url limpar buscar' }] : []),
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onClose();
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = commandItems.filter((item) => {
    const q = searchTerm.toLowerCase().trim();
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.keywords.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  const handleSelect = (item: CommandItem) => {
    if (item.action) {
      item.action();
    } else if (item.tab) {
      onSelectTab(item.tab);
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-20 px-3 sm:px-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white border-2 border-[#141414] shadow-[8px_8px_0px_#141414] rounded-none w-full max-w-2xl overflow-hidden flex flex-col max-h-[80vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative border-b-2 border-[#141414] bg-[#E4E3E0] p-3.5 sm:p-4 flex items-center gap-3">
          <div className="p-1.5 bg-[#141414] text-white">
            <Command className="w-4 h-4" />
          </div>
          <input
            type="text"
            placeholder="Digite para buscar ferramentas: 'vitals', 'imagens', 'nikto', 'waf', 'jwt', 'seo'..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
            className="w-full bg-white border border-[#141414] px-3 py-2 text-xs sm:text-sm font-mono font-bold text-[#141414] placeholder-[#141414]/50 focus:outline-none shadow-[2px_2px_0px_#141414]"
          />
          <button
            onClick={onClose}
            className="p-1.5 border border-[#141414] bg-white hover:bg-[#141414] hover:text-white transition-colors cursor-pointer text-[#141414]"
            title="Fechar (Esc)"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 sm:p-3 space-y-1.5 divide-y divide-gray-100 max-h-[60vh]">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs font-mono text-gray-500">
              Nenhuma ferramenta encontrada para "{searchTerm}". Tente outra palavra-chave.
            </div>
          ) : (
            filtered.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.id}
                  onClick={() => handleSelect(cmd)}
                  className="w-full text-left px-3 py-2.5 hover:bg-[#141414] hover:text-white flex items-center gap-3 transition-colors cursor-pointer group border border-transparent hover:border-[#141414]"
                >
                  <div className="p-2 border border-[#141414] bg-white text-[#141414] group-hover:bg-amber-400 group-hover:text-[#141414] transition-colors shrink-0">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-mono font-black truncate text-[#141414] group-hover:text-white">
                      {cmd.title}
                    </div>
                    <div className="text-[10px] font-mono text-gray-500 group-hover:text-gray-300">
                      {cmd.category}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-bold border border-[#141414] bg-white text-[#141414] group-hover:bg-amber-400 px-2 py-0.5 shrink-0">
                    ACESSAR →
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts info */}
        <div className="bg-[#E4E3E0] p-3 border-t-2 border-[#141414] text-[11px] font-mono text-[#141414] flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-white border border-[#141414] font-bold text-[10px]">Esc</span>
            <span>Fechar</span>
            <span className="px-1.5 py-0.5 bg-white border border-[#141414] font-bold text-[10px] ml-2">⌘K / Ctrl+K</span>
            <span>Alternar</span>
          </div>
          <span className="font-bold text-[11px] text-indigo-700">WebAudit Pro + SecScan Pentest Command Suite</span>
        </div>
      </div>
    </div>
  );
}
