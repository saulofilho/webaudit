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
  X
} from 'lucide-react';
import { NavigationTab } from '../../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: NavigationTab) => void;
}

interface CommandItem {
  id: string;
  tab: NavigationTab;
  title: string;
  category: 'SecScan Pentest & Defesa' | 'Auditoria Web & SEO';
  icon: any;
  keywords: string;
}

const COMMAND_ITEMS: CommandItem[] = [
  // SecScan Suite
  { id: 'c-js-miner', tab: 'js-miner', title: 'JS Miner & Segredos Vazados (AWS, OpenAI, S3, JWT)', category: 'SecScan Pentest & Defesa', icon: FileCode, keywords: 'javascript bundle secrets chaves aws openai stripe s3 api' },
  { id: 'c-nikto', tab: 'nikto', title: 'Nikto Web Scanner (Arquivos .env, .git, Métodos HTTP)', category: 'SecScan Pentest & Defesa', icon: Server, keywords: 'nikto web server env git backup sql trace put delete' },
  { id: 'c-dast', tab: 'dast', title: 'DAST Parameter Fuzzer (XSS, SQLi, Path Traversal)', category: 'SecScan Pentest & Defesa', icon: Flame, keywords: 'dast fuzzer xss sqli lfi rce open redirect injection' },
  { id: 'c-waf', tab: 'waf', title: 'Detector de WAF & Postura de Firewall (Cloudflare, AWS WAF)', category: 'SecScan Pentest & Defesa', icon: Shield, keywords: 'waf firewall cloudflare akamai imperva modsecurity' },
  { id: 'c-ssrf', tab: 'ssrf', title: 'Validador de SSRF & Proteção de Metadados de Nuvem', category: 'SecScan Pentest & Defesa', icon: Globe, keywords: 'ssrf metadata 169.254 loopback private ip aws imds' },
  { id: 'c-jwt', tab: 'jwt', title: 'Auditor & Inspetor de Tokens JWT (alg none, força de chave)', category: 'SecScan Pentest & Defesa', icon: Key, keywords: 'jwt token inspector decode signature alg none claims' },
  { id: 'c-compliance', tab: 'compliance', title: 'Hub de Conformidade (LGPD, ISO 27001, PCI-DSS, SOC 2)', category: 'SecScan Pentest & Defesa', icon: FileCheck2, keywords: 'compliance lgpd gdpr iso27001 pci soc2 anpd auditoria' },
  { id: 'c-llm', tab: 'llm-sec', title: 'Segurança de IA & OWASP Top 10 for LLMs', category: 'SecScan Pentest & Defesa', icon: Bot, keywords: 'llm ai artificial intelligence prompt injection owasp jailbreak' },
  { id: 'c-stride', tab: 'stride', title: 'Modelagem de Ameaças Arquitetural (STRIDE)', category: 'SecScan Pentest & Defesa', icon: Layers, keywords: 'stride threat model spoofing tampering dread architecture' },
  { id: 'c-soar', tab: 'soar', title: 'Playbooks SOAR de Resposta a Incidentes Cibernéticos', category: 'SecScan Pentest & Defesa', icon: Workflow, keywords: 'soar playbook incident response containment mitigação ddos vazamento' },
  { id: 'c-threat-intel', tab: 'threat-intel', title: 'Radar de Threat Intelligence & CISA KEV Exploits', category: 'SecScan Pentest & Defesa', icon: Radio, keywords: 'threat intel cve cisa kev exploits zero-day ransomware' },

  // WebAudit Pro Suite
  { id: 'c-all', tab: 'all', title: 'Painel Geral de Auditoria 360°', category: 'Auditoria Web & SEO', icon: Globe, keywords: 'geral resumo auditoria overview 360' },
  { id: 'c-vitals', tab: 'vitals', title: 'Core Web Vitals & Performance (LCP, INP, CLS)', category: 'Auditoria Web & SEO', icon: Sparkles, keywords: 'core web vitals performance lcp inp cls velocidade' },
  { id: 'c-heatmap', tab: 'heatmap', title: 'Heatmap de Densidade & Oportunidades SEO', category: 'Auditoria Web & SEO', icon: Layers, keywords: 'heatmap seo densidade palavras h1 h2' },
  { id: 'c-broken', tab: 'broken-links', title: 'Verificador de Links Quebrados & HTTP 404', category: 'Auditoria Web & SEO', icon: Globe, keywords: 'links quebrados broken 404 redirecionamentos' },
  { id: 'c-sitemap', tab: 'sitemap', title: 'Crawler de Sitemap & Mapeamento de Páginas', category: 'Auditoria Web & SEO', icon: Globe, keywords: 'sitemap crawler paginas indexação' },
  { id: 'c-ssl', tab: 'ssl-dns', title: 'Auditoria Profunda de SSL/TLS, DNS & Certificados', category: 'Auditoria Web & SEO', icon: Shield, keywords: 'ssl tls dns dnssec ciphers hsts certificado' },
  { id: 'c-wcag', tab: 'accessibility', title: 'Acessibilidade Digital WCAG 2.2 AAA', category: 'Auditoria Web & SEO', icon: Globe, keywords: 'acessibilidade wcag aria contraste alt leitores tela' }
];

export function CommandPaletteModal({ isOpen, onClose, onSelectTab }: CommandPaletteProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else onClose(); // parent handles toggle
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filtered = COMMAND_ITEMS.filter(item => {
    const q = searchTerm.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      item.keywords.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  const handleSelect = (tab: NavigationTab) => {
    onSelectTab(tab);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 px-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[75vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="relative border-b border-slate-200 dark:border-slate-800 p-4 flex items-center gap-3">
          <Search className="w-5 h-5 text-indigo-500 shrink-0" />
          <input
            type="text"
            placeholder="Navegue rapidamente: 'nikto', 'chaves', 'waf', 'jwt', 'lgpd', 'seo'..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            autoFocus
            className="w-full bg-transparent text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none"
          />
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 space-y-1 divide-y divide-slate-100 dark:divide-slate-800/50">
          {filtered.length === 0 ? (
            <div className="py-8 text-center text-sm text-slate-500">
              Nenhuma ferramenta encontrada para "{searchTerm}".
            </div>
          ) : (
            filtered.map((cmd) => {
              const Icon = cmd.icon;
              return (
                <button
                  key={cmd.id}
                  onClick={() => handleSelect(cmd.tab)}
                  className="w-full text-left px-3 py-2.5 rounded-xl hover:bg-indigo-50/70 dark:hover:bg-indigo-950/30 flex items-center gap-3.5 transition-colors cursor-pointer group"
                >
                  <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">
                      {cmd.title}
                    </div>
                    <div className="text-[10px] text-slate-500">
                      {cmd.category}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-medium text-slate-400 border border-slate-200 dark:border-slate-700 px-1.5 py-0.5 rounded">
                    Ir
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer shortcuts info */}
        <div className="bg-slate-50 dark:bg-slate-950/60 p-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-slate-200 dark:bg-slate-800 font-mono text-[10px]">Esc</span>
            <span>para fechar</span>
          </div>
          <span className="text-[11px] font-semibold text-indigo-500">SecScan + WebAudit Pro Command Bar</span>
        </div>
      </div>
    </div>
  );
}
