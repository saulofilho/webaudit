# 🚀 Website Analyzer & Audit Tool (WebAudit Pro)

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-3.7_Flash-8e24aa.svg)](https://deepmind.google/technologies/gemini/)
[![GitHub Pages](https://img.shields.io/badge/Deploy-GitHub_Pages-success.svg)](https://pages.github.com/)

> **Ferramenta profissional para análise e auditoria profunda de websites.** Insira qualquer URL e obtenha um diagnóstico detalhado cobrindo **Segurança, SEO, Boas Práticas, Performance e Acessibilidade**, com pontuações em tempo real, detecção de stack tecnológico, simulador de redes sociais e soluções de código prontas para copiar.

---

## ✨ Principais Funcionalidades

### 1. 🛡️ Auditoria de Segurança (Security Audit)
- **HTTPS & TLS Handshake**: Verificação de criptografia e integridade da conexão.
- **Cabeçalhos de Proteção HTTP**:
  - `Strict-Transport-Security` (HSTS)
  - `Content-Security-Policy` (CSP)
  - `X-Frame-Options` (Prevenção contra Clickjacking)
  - `X-Content-Type-Options` (Proteção contra MIME-sniffing)
  - `Referrer-Policy` e `Permissions-Policy`
  - `Cross-Origin-Opener-Policy` (COOP)
- **Vazamento de Assinatura do Servidor**: Detecção de cabeçalhos expostos como `Server` e `X-Powered-By`.

### 2. 🔍 SEO & Visibilidade nos Motores de Busca
- Calibração de caracteres da tag `<title>` (45 a 60 caracteres ideais).
- Análise de tamanho e atratividade da `<meta name="description">` (120 a 160 caracteres).
- Verificação de URL Canônica (`<link rel="canonical">`) para evitar conteúdo duplicado.
- Hierarquia e unicidade de cabeçalhos semânticos (`<h1>`, `<h2>`, `<h3>`).
- Detecção de dados estruturados **Schema.org** (`application/ld+json`).
- **Simulador de SERP do Google**: Pré-visualização exata em modo Desktop e Mobile.

### 3. 📱 Simulador de Redes Sociais (Open Graph & Twitter Cards)
- Validação de tags `og:title`, `og:description`, `og:image` e `og:url`.
- Visualização ao vivo do card de compartilhamento para **WhatsApp, LinkedIn, Facebook e Twitter/X**.

### 4. ✨ Boas Práticas & Acessibilidade
- Meta tag `viewport` para responsividade mobile-first.
- Atributo `lang` na tag `<html>` para leitores de tela e acessibilidade internacional.
- Cobertura de atributos `alt` em 100% das imagens.
- Proteção de links externos com `rel="noopener noreferrer"`.
- Tamanho e peso do payload HTML inicial.

### 5. 🤖 Diagnóstico Inteligente com Gemini 3.7 AI
- Resumo executivo da saúde geral da arquitetura web.
- Identificação automática dos pontos fortes e vulnerabilidades críticas.
- **Soluções de Código Prontas**: Trechos de configuração para **Nginx, Apache (.htaccess), Cloudflare e HTML5**.

### 6. 🌐 Inspetor de Cabeçalhos HTTP & Stack Tecnológico
- Lista completa e filtrável de todos os cabeçalhos HTTP recebidos.
- Medição de latência (TTFB - Time to First Byte) em milissegundos.
- Identificação de servidores (Nginx, Cloudflare, Apache, Caddy, Vercel), CMS (WordPress, Shopify) e frameworks (Next.js, React, Vue, Tailwind).

### 7. 🔄 Comparador de Websites & Histórico
- Salva relatórios automaticamente no `localStorage`.
- Comparação lado a lado entre análises anteriores (evolução antes/depois de correções) ou contra concorrentes.

### 8. 📥 Exportação de Relatórios
- **PDF / Impressão**: Layout estilizado pronto para apresentação a clientes.
- **Markdown (.md)**: Pronto para colar em Issues do GitHub ou Pull Requests.
- **JSON (.json)**: Dados estruturados para pipelines de CI/CD.

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- Node.js 20+ instalado
- npm ou pnpm

### Passo a Passo

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
   cd SEU_REPOSITORIO
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente (Opcional):**
   Crie um arquivo `.env` na raiz (baseado em `.env.example`):
   ```env
   GEMINI_API_KEY="SUA_CHAVE_GEMINI_AQUI"
   ```

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse a aplicação em [http://localhost:3000](http://localhost:3000).

---

## 🌐 Deploy no GitHub Pages (Versão Estática)

Esta aplicação foi desenvolvida com suporte híbrido: ela roda com o backend Express localmente/em containers e também suporta **GitHub Pages** através do motor client-side com CORS proxy.

### Configurando o Deploy Automático via GitHub Actions:

1. Suba o código para seu repositório no GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: Website Analyzer & Audit Tool"
   git branch -M main
   git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git
   git push -u origin main
   ```

2. O workflow `.github/workflows/deploy.yml` já está incluso no projeto!

3. No GitHub, abra o seu repositório:
   - Vá em **Settings** > **Pages**
   - Em **Build and deployment** > **Source**, selecione: **GitHub Actions**
   
4. Pronto! O GitHub Pages fará o build estático e publicará o site na URL `https://SEU_USUARIO.github.io/SEU_REPOSITORIO/`.

---

## 📁 Estrutura do Projeto

```
├── .github/
│   └── workflows/
│       └── deploy.yml          # Workflow de deploy para GitHub Pages
├── server/
│   ├── analyzer.ts             # Motor de auditoria com regras e Gemini AI
│   └── techDetector.ts         # Identificador de stack tecnológico
├── src/
│   ├── components/
│   │   ├── Navbar.tsx          # Cabeçalho com ações e status
│   │   ├── UrlInputSection.tsx # Barra de entrada de URL com etapas animadas
│   │   ├── AuditSummaryHero.tsx# Score gauge, nota e diagnóstico de IA
│   │   ├── CategoryScoreCard.tsx# Cards das 4 categorias principais
│   │   ├── AuditItemCard.tsx   # Item de auditoria com trechos de código
│   │   ├── SocialPreview.tsx   # Simulador Google SERP, Facebook, Twitter
│   │   ├── HeadersInspector.tsx# Inspetor de headers HTTP brutos
│   │   ├── TechStackView.tsx   # Visualizador de tecnologias detectadas
│   │   ├── SiteComparator.tsx  # Comparador de sites e histórico
│   │   ├── ExportModal.tsx     # Modal de exportação (PDF/MD/JSON)
│   │   ├── GitHubPagesModal.tsx# Modal de instruções do GitHub Pages
│   │   └── AuditHistoryModal.tsx# Modal do histórico local
│   ├── services/
│   │   └── clientAnalyzer.ts   # Motor de auditoria fallback para GitHub Pages
│   ├── utils/
│   │   ├── exportReport.ts     # Formatador de Markdown e relatórios
│   │   └── formatters.ts       # Formatadores de data e bytes
│   ├── types.ts                # Modelos TypeScript da auditoria
│   ├── App.tsx                 # Componente principal e orquestrador
│   ├── main.tsx                # Entrada React
│   └── index.css               # Estilização com Tailwind CSS
├── server.ts                   # Servidor Express com Vite middleware
├── vite.config.ts              # Configuração do Vite com base relativa
└── package.json                # Dependências e scripts
```

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Motion (Framer Motion), Lucide Icons, Canvas Confetti.
- **Backend / API**: Node.js, Express.js, `@google/genai` (Gemini 3.7 Flash).
- **Build & Bundler**: Vite 6, esbuild, tsx.
- **CI/CD**: GitHub Actions & GitHub Pages.

---

## 📄 Licença

Distribuído sob a licença **Apache-2.0**. Consulte o arquivo de licença para mais detalhes.
