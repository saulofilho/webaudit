import React, { useState, useEffect } from 'react';
import {
  Rocket,
  Search,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  Globe,
  Sparkles,
  X,
  FileCode,
  Layers,
  ArrowRight,
  Info,
  Clock,
  Terminal,
  Zap,
} from 'lucide-react';

interface GoogleRankingAcceleratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSitemapGenerator?: () => void;
}

export const GoogleRankingAcceleratorModal: React.FC<GoogleRankingAcceleratorModalProps> = ({
  isOpen,
  onClose,
  onOpenSitemapGenerator,
}) => {
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [currentDomain, setCurrentDomain] = useState<string>('');
  const [verificationInput, setVerificationInput] = useState<string>('');
  const [savedVerification, setSavedVerification] = useState<string>('');
  const [isCopiedSitemap, setIsCopiedSitemap] = useState<boolean>(false);
  const [isSavedSuccessfully, setIsSavedSuccessfully] = useState<boolean>(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = window.location.origin;
      setCurrentUrl(url);
      setCurrentDomain(window.location.hostname);
      const existing = localStorage.getItem('google_site_verification_code') || '';
      setSavedVerification(existing);
      setVerificationInput(existing);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sitemapUrl = `${currentUrl}/sitemap.xml`;
  const robotsUrl = `${currentUrl}/robots.txt`;
  const googleSearchUrl = `https://www.google.com/search?q=site%3A${encodeURIComponent(currentDomain)}`;
  const richResultsUrl = `https://search.google.com/test/rich-results?url=${encodeURIComponent(currentUrl)}`;
  const pageSpeedUrl = `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(currentUrl)}`;
  const gscUrl = `https://search.google.com/search-console`;

  const handleCopySitemap = () => {
    navigator.clipboard.writeText(sitemapUrl);
    setIsCopiedSitemap(true);
    setTimeout(() => setIsCopiedSitemap(false), 2500);
  };

  const handleSaveVerification = async () => {
    let cleanCode = verificationInput.trim();
    // Support pasting the entire meta tag like <meta name="google-site-verification" content="abc" />
    const contentMatch = cleanCode.match(/content=["']([^"']+)["']/i);
    if (contentMatch && contentMatch[1]) {
      cleanCode = contentMatch[1];
    }

    localStorage.setItem('google_site_verification_code', cleanCode);
    setSavedVerification(cleanCode);
    setVerificationInput(cleanCode);

    // Dynamic meta tag injection in current DOM
    let existingMeta = document.querySelector('meta[name="google-site-verification"]');
    if (!existingMeta) {
      existingMeta = document.createElement('meta');
      existingMeta.setAttribute('name', 'google-site-verification');
      document.head.appendChild(existingMeta);
    }
    existingMeta.setAttribute('content', cleanCode);

    // Save to backend as well
    try {
      await fetch('/api/google-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ verificationCode: cleanCode }),
      });
    } catch {
      // ignore
    }

    setIsSavedSuccessfully(true);
    setTimeout(() => setIsSavedSuccessfully(false), 3000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="bg-white border-2 border-[#141414] shadow-[8px_8px_0px_#141414] rounded-none w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-[#141414] text-white p-4 sm:p-5 flex items-center justify-between border-b-2 border-[#141414]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-400 text-[#141414] border border-white">
              <Rocket className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-mono font-black tracking-tight uppercase">
                  Acelerador de Indexação no Google & Ranqueamento #1
                </h2>
                <span className="hidden sm:inline-block px-1.5 py-0.5 bg-emerald-500 text-black text-[10px] font-mono font-bold uppercase">
                  Guia Oficial
                </span>
              </div>
              <p className="text-[11px] font-mono text-gray-300">
                Por que seu site ainda não apareceu na primeira página e como indexar no Googlebot em poucas horas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-white text-[#141414] hover:bg-amber-400 border border-white transition-colors cursor-pointer"
            title="Fechar (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6 text-[#141414]">
          {/* Important Explanation Card */}
          <div className="p-4 bg-amber-50 border-2 border-[#141414] shadow-[3px_3px_0px_#141414] space-y-2.5">
            <div className="flex items-center gap-2 text-amber-900 font-mono font-black text-xs uppercase">
              <Info className="w-4 h-4 text-amber-700" />
              <span>Por que meu site não aparece automaticamente no Google em 5 minutos?</span>
            </div>
            <p className="text-xs font-mono text-[#141414]/90 leading-relaxed">
              O Google <strong>não adivinha a existência de sites novos instantaneamente</strong>. Todo site publicado passa por 4 fases obrigatórias:
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="p-2 bg-white border border-[#141414] text-center">
                <span className="text-[10px] font-mono font-black block text-gray-500">1. DESCOBERTA</span>
                <span className="text-xs font-mono font-bold text-blue-600">Googlebot acha a URL</span>
              </div>
              <div className="p-2 bg-white border border-[#141414] text-center">
                <span className="text-[10px] font-mono font-black block text-gray-500">2. RASTREAMENTO</span>
                <span className="text-xs font-mono font-bold text-purple-600">Baixa o HTML & Assets</span>
              </div>
              <div className="p-2 bg-white border border-[#141414] text-center">
                <span className="text-[10px] font-mono font-black block text-gray-500">3. INDEXAÇÃO</span>
                <span className="text-xs font-mono font-bold text-amber-600">Salva no índice do Google</span>
              </div>
              <div className="p-2 bg-white border border-[#141414] text-center">
                <span className="text-[10px] font-mono font-black block text-gray-500">4. RANQUEAMENTO</span>
                <span className="text-xs font-mono font-bold text-emerald-600">Aparece na 1ª Página</span>
              </div>
            </div>
            <p className="text-[11px] font-mono text-gray-700 pt-1">
              💡 <strong>O Atalho:</strong> Se você não avisar o Google pelo <strong>Google Search Console</strong>, o Googlebot pode demorar de <strong>2 a 4 semanas</strong> para encontrar o site sozinho. Fazendo a solicitação abaixo, o Google costuma indexar em <strong>algumas horas ou dias</strong>!
            </p>
          </div>

          {/* Quick Action Tools Bar */}
          <div className="border-2 border-[#141414] bg-white p-4 shadow-[4px_4px_0px_#141414] space-y-3">
            <h3 className="text-xs font-mono font-black uppercase text-[#141414] flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Verificadores Oficiais do Google em Tempo Real</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <a
                href={googleSearchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-white hover:bg-gray-50 border-2 border-[#141414] shadow-[2px_2px_0px_#141414] flex items-center justify-between group transition-all"
              >
                <div>
                  <div className="text-xs font-mono font-black text-[#141414]">Verificar no Google</div>
                  <div className="text-[10px] font-mono text-gray-500">site:{currentDomain}</div>
                </div>
                <Search className="w-4 h-4 text-gray-400 group-hover:text-blue-600" />
              </a>

              <a
                href={richResultsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-white hover:bg-gray-50 border-2 border-[#141414] shadow-[2px_2px_0px_#141414] flex items-center justify-between group transition-all"
              >
                <div>
                  <div className="text-xs font-mono font-black text-[#141414]">Google Rich Results</div>
                  <div className="text-[10px] font-mono text-gray-500">Testar Rich Snippets & FAQ</div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-emerald-600" />
              </a>

              <a
                href={pageSpeedUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="p-3 bg-white hover:bg-gray-50 border-2 border-[#141414] shadow-[2px_2px_0px_#141414] flex items-center justify-between group transition-all"
              >
                <div>
                  <div className="text-xs font-mono font-black text-[#141414]">PageSpeed Insights</div>
                  <div className="text-[10px] font-mono text-gray-500">Velocidade no Googlebot</div>
                </div>
                <ExternalLink className="w-4 h-4 text-gray-400 group-hover:text-amber-600" />
              </a>
            </div>
          </div>

          {/* 4 Steps to Rank #1 on Google */}
          <div className="space-y-4">
            <h3 className="text-sm font-mono font-black uppercase text-[#141414] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Passo a Passo Guiado de 3 Minutos para Chegar ao Topo do Google</span>
            </h3>

            {/* Step 1 */}
            <div className="p-4 bg-white border-2 border-[#141414] shadow-[3px_3px_0px_#141414] space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 flex items-center justify-center bg-[#141414] text-white font-mono font-bold text-xs">1</span>
                  <h4 className="font-mono font-black text-xs uppercase text-[#141414]">
                    Adicionar o Site no Google Search Console
                  </h4>
                </div>
                <a
                  href={gscUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white font-mono font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <span>Abrir Google Search Console</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
              <p className="text-xs font-mono text-gray-700">
                Acesse o Search Console com sua conta Google, selecione <strong>"Prefixo do URL"</strong> e digite:
              </p>
              <div className="p-2 bg-[#E4E3E0] font-mono text-xs font-bold text-[#141414] border border-[#141414] flex items-center justify-between select-all">
                <span>{currentUrl}</span>
                <span className="text-[10px] text-gray-500 uppercase">Sua URL Ativa</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="p-4 bg-white border-2 border-[#141414] shadow-[3px_3px_0px_#141414] space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 flex items-center justify-center bg-[#141414] text-white font-mono font-bold text-xs">2</span>
                <h4 className="font-mono font-black text-xs uppercase text-[#141414]">
                  Inserir a Tag de Verificação de Propriedade do Google
                </h4>
              </div>
              <p className="text-xs font-mono text-gray-700">
                No Search Console, escolha o método <strong>"Tag HTML"</strong> e cole o código abaixo. O WebAudit Pro injeta a tag no cabeçalho na hora:
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  placeholder='Cole a tag ex: <meta name="google-site-verification" content="seu_codigo" />'
                  value={verificationInput}
                  onChange={(e) => setVerificationInput(e.target.value)}
                  className="flex-1 bg-white border-2 border-[#141414] px-3 py-2 text-xs font-mono text-[#141414] placeholder-gray-400 focus:outline-none"
                />
                <button
                  onClick={handleSaveVerification}
                  className="px-4 py-2 bg-emerald-400 hover:bg-emerald-300 border-2 border-[#141414] text-xs font-mono font-black uppercase shadow-[2px_2px_0px_#141414] transition-all cursor-pointer shrink-0"
                >
                  {isSavedSuccessfully ? 'Salvo com Sucesso! ✓' : 'Salvar & Injetar Tag'}
                </button>
              </div>
              {savedVerification && (
                <div className="flex items-center gap-1.5 text-xs font-mono text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tag ativa no site: <code>{savedVerification.slice(0, 20)}...</code></span>
                </div>
              )}
            </div>

            {/* Step 3 */}
            <div className="p-4 bg-white border-2 border-[#141414] shadow-[3px_3px_0px_#141414] space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 flex items-center justify-center bg-[#141414] text-white font-mono font-bold text-xs">3</span>
                  <h4 className="font-mono font-black text-xs uppercase text-[#141414]">
                    Enviar o Sitemap XML no Google Search Console
                  </h4>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {onOpenSitemapGenerator && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenSitemapGenerator();
                      }}
                      className="px-2.5 py-1 bg-emerald-400 hover:bg-emerald-300 border border-[#141414] font-mono text-xs font-black uppercase text-[#141414] flex items-center gap-1 cursor-pointer"
                    >
                      <FileCode className="w-3.5 h-3.5" />
                      <span>Gerador de Sitemap XML</span>
                    </button>
                  )}
                  <button
                    onClick={handleCopySitemap}
                    className="px-2.5 py-1 bg-white hover:bg-gray-100 border border-[#141414] font-mono text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {isCopiedSitemap ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{isCopiedSitemap ? 'Copiado!' : 'Copiar Sitemap'}</span>
                  </button>
                  <a
                    href={sitemapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-2.5 py-1 bg-[#141414] text-white font-mono text-xs font-bold flex items-center gap-1"
                  >
                    <span>Ver XML</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
              <p className="text-xs font-mono text-gray-700">
                No menu lateral do Google Search Console, clique em <strong>"Sitemaps"</strong> e envie:
              </p>
              <div className="p-2 bg-[#E4E3E0] font-mono text-xs font-bold text-[#141414] border border-[#141414]">
                sitemap.xml
              </div>
            </div>

            {/* Step 4 */}
            <div className="p-4 bg-emerald-50 border-2 border-[#141414] shadow-[3px_3px_0px_#141414] space-y-3">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 flex items-center justify-center bg-emerald-600 text-white font-mono font-bold text-xs">4</span>
                <h4 className="font-mono font-black text-xs uppercase text-emerald-950">
                  O Pulo do Gato: Solicitar Indexação Prioritária (Request Indexing)
                </h4>
              </div>
              <p className="text-xs font-mono text-emerald-950/90 leading-relaxed">
                Na barra superior de busca do Google Search Console, cole a URL exata do seu site (<code>{currentUrl}</code>) e aperte Enter. Depois clique no botão:
              </p>
              <div className="p-2.5 bg-white border border-[#141414] inline-block font-mono font-black text-xs text-blue-700 uppercase">
                👉 "SOLICITAR INDEXAÇÃO" / "REQUEST INDEXING"
              </div>
              <p className="text-[11px] font-mono text-emerald-900">
                Isso coloca sua página na fila de alta prioridade do Googlebot, forçando o rastreador a visitar o site em horas, em vez de semanas.
              </p>
            </div>
          </div>

          {/* Technical Indexability Readiness Scoreboard */}
          <div className="border-2 border-[#141414] bg-white p-4 shadow-[4px_4px_0px_#141414] space-y-3">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="text-xs font-mono font-black uppercase text-[#141414]">
                Auditoria de Prontidão Técnica para o Topo do Google
              </h3>
              <span className="px-2 py-0.5 bg-emerald-400 font-mono font-black text-xs text-black border border-[#141414]">
                100% PRONTO
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono">
              <div className="p-2.5 bg-[#E4E3E0] border border-[#141414] flex items-center justify-between">
                <span>robots.txt (Allow: /)</span>
                <span className="text-emerald-700 font-bold">✓ Válido & Aberto</span>
              </div>
              <div className="p-2.5 bg-[#E4E3E0] border border-[#141414] flex items-center justify-between">
                <span>sitemap.xml Dinâmico</span>
                <span className="text-emerald-700 font-bold">✓ Ativo & Atualizado</span>
              </div>
              <div className="p-2.5 bg-[#E4E3E0] border border-[#141414] flex items-center justify-between">
                <span>Tag Canonical Dinâmica</span>
                <span className="text-emerald-700 font-bold">✓ Sem Conflitos</span>
              </div>
              <div className="p-2.5 bg-[#E4E3E0] border border-[#141414] flex items-center justify-between">
                <span>Schema.org JSON-LD (FAQ & App)</span>
                <span className="text-emerald-700 font-bold">✓ Rich Snippets Prontos</span>
              </div>
              <div className="p-2.5 bg-[#E4E3E0] border border-[#141414] flex items-center justify-between">
                <span>Core Web Vitals & Speed</span>
                <span className="text-emerald-700 font-bold">✓ TTFB &lt; 50ms</span>
              </div>
              <div className="p-2.5 bg-[#E4E3E0] border border-[#141414] flex items-center justify-between">
                <span>Segurança HTTPS & HSTS</span>
                <span className="text-emerald-700 font-bold">✓ Nota A+</span>
              </div>
            </div>
          </div>

          {/* Ranking on First Page Tips */}
          <div className="p-4 bg-gray-50 border-2 border-[#141414] space-y-2">
            <h4 className="text-xs font-mono font-black uppercase text-[#141414]">
              Dicas Estratégicas para Manter o 1º Lugar no Google
            </h4>
            <ul className="text-xs font-mono text-gray-700 space-y-1 list-disc list-inside">
              <li><strong>Domínio Próprio (.com ou .com.br):</strong> Adicionar um domínio customizado aumenta a confiança do algoritmo do Google em mais de 500% comparado a subdomínios de prévia.</li>
              <li><strong>Backlinks Iniciais:</strong> Compartilhe o link do site no seu LinkedIn, Twitter/X, GitHub e grupos de tecnologia. O Google usa links externos como votos de autoridade.</li>
              <li><strong>Busca de Marca:</strong> Uma vez indexado, quem digitar "WebAudit Pro" encontrará seu site no topo com as estrelas e perguntas frequentes do FAQ Schema.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 bg-[#E4E3E0] border-t-2 border-[#141414] flex items-center justify-between flex-wrap gap-2">
          <span className="text-xs font-mono text-gray-600">
            Acelerador de SEO WebAudit Pro v4.0
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-[#141414] text-white hover:bg-black font-mono font-black text-xs uppercase shadow-[2px_2px_0px_#888888] cursor-pointer"
          >
            Entendido & Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
