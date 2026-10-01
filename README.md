# 🚀 WebAudit Pro — Ferramenta Profissional de Análise e Auditoria de Websites

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8.svg)](https://tailwindcss.com/)
[![Gemini AI](https://img.shields.io/badge/Gemini_AI-3.8_Flash-8e24aa.svg)](https://deepmind.google/technologies/gemini/)
[![Vite](https://img.shields.io/badge/Vite-6.2-646cff.svg)](https://vitejs.dev/)
[![License](https://img.shields.io/badge/License-Apache_2.0-green.svg)](LICENSE)

> **WebAudit Pro** é uma plataforma completa e de alta densidade para auditoria técnica profunda de websites. Avalie qualquer domínio em tempo real cobrindo **Segurança, SEO, Boas Práticas, Performance, Acessibilidade e Privacidade**, com relatórios executivos gerados por inteligência artificial, diff visual de regressão e guias de remediação com códigos prontos para copiar.

---

## ✨ Principais Funcionalidades

### 1. 🤖 Sumário Executivo Estratégico com IA (Gemini 3.8 Flash)
- **Narrativa em Linguagem Natural**: Análise holística da saúde do website gerada pela API do Gemini.
- **Top 3 Problemas Mais Críticos**: Mapeamento dos principais ofensores com:
  - Impacto direto no negócio (risco de vazamento de dados, abandono de conversão, perda de ranking na busca).
  - Causa técnica raiz precisa.
  - Acesso direto com 1 clique ao **Guia de Correção com IA**.
- **Ordem de Prioridade Recomendada (Remediation Roadmap)**:
  - *Fase 1: Correções Imediatas (0–24h)* — Blindagem de borda e headers defensivos.
  - *Fase 2: Otimização Estrutural (1–3 dias)* — Dados estruturados Schema.org e metatags.
  - *Fase 3: Refinamento Contínuo (1–2 semanas)* — Core Web Vitals e monitoramento.
- **Alternador de Tom**: Visão **Executivo / C-Level** (foco em risco e ROI) vs. **Técnico / Engenharia** (foco em infraestrutura e código).
- **Exportação & Cópia Rápida**: Transferência do briefing executivo formatado para área de transferência.

### 2. 👁️ Estúdio de Regressão Visual & Diff de Screenshots (Site Comparator)
- **Comparação Visual Avançada**: Identifique deslocamentos de interface entre o site atual e versões anteriores do histórico ou concorrentes.
- **3 Modos Interativos de Diff**:
  - **Lado a Lado (Side-by-Side)**: Telas com marcações delimitadoras (*bounding boxes*) de elementos deslocados.
  - **Slider Cortina (Curtain Before/After)**: Controle deslizante interativo (0% a 100%) para inspeção pixel a pixel de reflows.
  - **Diferença Térmica (Heatmap Overlay)**: Sobreposição de mapa de calor destacando zonas com divergência visual.
- **Detecção Analítica de Layout Shifts (CLS)**:
  - Variações na altura da barra de navegação/header.
  - Troca de fontes com atraso de renderização (FOUT/FOIT).
  - Reposicionamento de botões de conversão e elementos de mídia.
  - Cálculo de impacto cumulativo no score de **CLS**.
- **Controles de Viewport**: Alternância rápida entre **Desktop (1280px)** e **Mobile (375px)** com ajuste de sensibilidade de pixel.

### 3. 🛡️ Auditoria Completa de Segurança Web (OWASP & NIST)
- **Tooltip Explicativa no Card de Segurança**: Ícone de interrogação com detalhamento das métricas avaliadas:
  - Validação de certificado HTTPS e criptografia TLS.
  - `Strict-Transport-Security` (HSTS) contra SSL-stripping e MitM.
  - `Content-Security-Policy` (CSP) contra injeções de script XSS.
  - `X-Frame-Options` para prevenção de Clickjacking.
  - `X-Content-Type-Options: nosniff` contra MIME-sniffing.
  - `Referrer-Policy` e `Permissions-Policy` (câmera, microfone, geolocalização).
- Detecção de vazamento de assinaturas do servidor (`Server`, `X-Powered-By`).

### 4. ⚡ SEO Quick-Start Checklist & Gerador Schema.org
- **Checklist Interativo**: Itens categorizados por prioridade e tempo estimado de execução (2 a 5 min).
- **Gerador JSON-LD**: Geração de dados estruturados para Google Rich Results nos formatos:
  - `WebApplication`, `Organization`, `LocalBusiness`, `Article` e `FAQPage`.
- **Exportação Produtiva**: Copie o pacote completo de meta tags para o `<head>` ou exporte o checklist em Markdown para Jira/GitHub Issues.

### 5. 🛠️ Guia de Correção Inteligente com IA (AIFixModal)
- Passo a passo detalhado para resolução de qualquer item reprovado ou com alerta.
- Snippets de configuração prontos para **Nginx, Apache (.htaccess), Node.js (Helmet), Next.js, Cloudflare Rules e HTML5**.
- Comandos cURL executáveis para validar a resolução diretamente pelo terminal.

### 6. 📱 Simulador de Redes Sociais & Prévia Google SERP
- Validação completa de tags **Open Graph** (`og:title`, `og:description`, `og:image`, `og:url`) e **Twitter Cards**.
- Pré-visualização exata de como os links aparecem no **WhatsApp, LinkedIn, Facebook e Twitter/X**.
- Simulador do resultado de busca no Google para Desktop e Mobile.

### 7. ♿ Acessibilidade WCAG 2.1 & Conformidade de Privacidade
- Auditoria de atributos `alt` em imagens e cobertura de metatag `viewport`.
- Atributos semânticos `lang`, charset UTF-8 e Doctype HTML5.
- Diagnóstico de conformidade de cookies e políticas de privacidade (LGPD/GDPR).

### 8. 🌐 Inspetor de Headers HTTP & Detecção de Stack Tecnológico
- Inspeção de todos os cabeçalhos HTTP retornados pelo servidor.
- Medição precisa de latência TTFB (Time to First Byte).
- Detecção automática de CMS (WordPress, Shopify), servidores (Nginx, Cloudflare, Vercel) e frameworks (React, Next.js, Vue, Tailwind).

### 9. 📋 Plano de Ação Interativo (Action Plan Drawer)
- Gaveta lateral acessível via botão flutuante para acompanhamento de tarefas pendentes e concluídas com persistência local.

### 10. 📄 White-Label PDF & Alertas via Webhooks
- Exportação de relatório em PDF com branding customizado (nome da agência, consultor, cliente e logotipo).
- Integração com Webhooks para envio automático de alertas para **Slack, Discord ou sistemas internos**.

---

## 🏗️ Arquitetura do Projeto

```
├── server/
│   ├── analyzer.ts              # Motor de auditoria com regras completas e scoring
│   ├── geminiFix.ts             # Integração com Gemini SDK para guias de correção
│   ├── geminiSummary.ts         # Geração de Sumário Executivo Estratégico com Gemini 3.8 Flash
│   └── techDetector.ts          # Detecção de servidores, CMS e frameworks
├── src/
│   ├── components/
│   │   ├── ReportSummaryPanel.tsx   # Painel executivo com Top 3 problemas e roadmap
│   │   ├── VisualRegressionView.tsx # Estúdio de regressão visual e diff de screenshots
│   │   ├── SiteComparator.tsx       # Comparador de sites, histórico e toggle de regressão
│   │   ├── SeoQuickStartModal.tsx   # Checklist interativo e gerador Schema.org JSON-LD
│   │   ├── CategoryScoreCard.tsx    # Cards dos pilares com tooltip de métricas
│   │   ├── AIFixModal.tsx           # Modal de guia de correção inteligente com IA
│   │   ├── ActionPlanDrawer.tsx     # Gaveta de plano de ação e acompanhamento
│   │   ├── AuditSummaryHero.tsx     # Gauge central de score e diagnóstico rápido
│   │   ├── SocialPreview.tsx        # Simulador de SERP e cards de redes sociais
│   │   ├── HeadersInspector.tsx     # Inspetor de headers HTTP brutos
│   │   ├── TechStackView.tsx        # Detecção de stack tecnológica
│   │   ├── MobileSimulatorView.tsx  # Simulador multi-dispositivo e viewport
│   │   ├── WhiteLabelPdfModal.tsx   # Exportador de PDF institucional
│   │   └── WebhookAlertModal.tsx    # Configurador de notificações via webhook
│   ├── services/
│   │   └── clientAnalyzer.ts        # Motor de auditoria client-side
│   ├── types.ts                     # Definições completas TypeScript
│   ├── App.tsx                      # Orquestrador principal da aplicação
│   ├── main.tsx                     # Ponto de entrada React
│   └── index.css                    # Estilização global com Tailwind CSS v4
├── server.ts                        # Servidor Express com rotas de API e Vite middleware
├── vite.config.ts                   # Configuração de build do Vite
├── metadata.json                    # Metadados e permissões da aplicação
└── package.json                     # Dependências e scripts npm
```

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- **Node.js 20+**
- **npm** ou **pnpm**

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
   Crie um arquivo `.env` na raiz do projeto:
   ```env
   PORT=3000
   GEMINI_API_KEY="SUA_CHAVE_GEMINI_AQUI"
   ```
   *(Nota: Caso a chave do Gemini não seja configurada, a ferramenta utilizará motores determinísticos de fallback inteligentes sem interromper o funcionamento).*

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse a aplicação no navegador em [http://localhost:3000](http://localhost:3000).

5. **Verificação de Tipos e Build de Produção:**
   ```bash
   npm run lint
   npm run build
   ```

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: [React 19](https://react.dev/), [TypeScript 5.8](https://www.typescriptlang.org/), [Tailwind CSS v4](https://tailwindcss.com/), [Lucide React](https://lucide.dev/), [Canvas Confetti](https://www.npmjs.com/package/canvas-confetti).
- **Backend & IA**: [Node.js](https://nodejs.org/), [Express.js](https://expressjs.com/), [`@google/genai`](https://www.npmjs.com/package/@google/genai) com modelo **Gemini 3.8 Flash**.
- **Ferramentas de Build**: [Vite 6](https://vitejs.dev/), [tsx](https://github.com/privatenumber/tsx).

---

## 📄 Licença

Distribuído sob a licença **Apache-2.0**. Consulte o arquivo de licença para mais detalhes.
