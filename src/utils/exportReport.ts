import { AuditReport } from '../types';

export function formatDate(isoDate: string): string {
  try {
    const d = new Date(isoDate);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch {
    return isoDate;
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function generateMarkdownReport(report: AuditReport): string {
  const dateStr = formatDate(report.analyzedAt);
  const hostname = new URL(report.targetUrl).hostname;

  let md = `# 📊 Relatório de Auditoria Web: ${hostname}\n\n`;
  md += `> **Data da Análise:** ${dateStr}  \n`;
  md += `> **URL Auditada:** ${report.targetUrl}  \n`;
  md += `> **Pontuação Geral:** **${report.overallScore}/100** (Classificação: **${report.overallGrade}**)  \n\n`;

  md += `## 🎯 Resumo Executivo da IA\n\n${report.aiExecutiveSummary}\n\n`;

  md += `## 📈 Pontuações por Categoria\n\n`;
  md += `| Categoria | Score | Nota | Aprovados | Alertas | Críticos |\n`;
  md += `| :--- | :---: | :---: | :---: | :---: | :---: |\n`;
  md += `| 🛡️ Segurança | ${report.categories.security.score}% | ${report.categories.security.grade} | ${report.categories.security.passedCount} | ${report.categories.security.warningCount} | ${report.categories.security.criticalCount} |\n`;
  md += `| 🔍 SEO & Visibilidade | ${report.categories.seo.score}% | ${report.categories.seo.grade} | ${report.categories.seo.passedCount} | ${report.categories.seo.warningCount} | ${report.categories.seo.criticalCount} |\n`;
  md += `| ✨ Boas Práticas | ${report.categories.best_practices.score}% | ${report.categories.best_practices.grade} | ${report.categories.best_practices.passedCount} | ${report.categories.best_practices.warningCount} | ${report.categories.best_practices.criticalCount} |\n`;
  md += `| ⚡ Performance & Acessibilidade | ${report.categories.performance_accessibility.score}% | ${report.categories.performance_accessibility.grade} | ${report.categories.performance_accessibility.passedCount} | ${report.categories.performance_accessibility.warningCount} | ${report.categories.performance_accessibility.criticalCount} |\n\n`;

  md += `## 🚨 Correções de Alta Prioridade\n\n`;
  report.topPriorityFixes.forEach((fix, idx) => {
    md += `${idx + 1}. ${fix}\n`;
  });
  md += `\n`;

  md += `## 🛠️ Detalhamento dos Itens Auditados\n\n`;
  const criticals = report.items.filter((i) => i.severity === 'critical');
  const warnings = report.items.filter((i) => i.severity === 'warning');
  const goods = report.items.filter((i) => i.severity === 'good');

  if (criticals.length > 0) {
    md += `### 🔴 Falhas Críticas (${criticals.length})\n\n`;
    criticals.forEach((item) => {
      md += `#### ❌ ${item.title}\n`;
      md += `- **Impacto:** ${item.impact}\n`;
      md += `- **Detalhe:** ${item.summary}\n`;
      if (item.codeSnippet) {
        md += `\n\`\`\`${item.codeSnippet.language}\n// ${item.codeSnippet.title}\n${item.codeSnippet.code}\n\`\`\`\n\n`;
      }
    });
  }

  if (warnings.length > 0) {
    md += `### 🟡 Alertas & Atenção (${warnings.length})\n\n`;
    warnings.forEach((item) => {
      md += `#### ⚠️ ${item.title}\n`;
      md += `- **Impacto:** ${item.impact}\n`;
      md += `- **Detalhe:** ${item.summary}\n`;
      if (item.codeSnippet) {
        md += `\n\`\`\`${item.codeSnippet.language}\n// ${item.codeSnippet.title}\n${item.codeSnippet.code}\n\`\`\`\n\n`;
      }
    });
  }

  if (goods.length > 0) {
    md += `### 🟢 Aprovados (${goods.length})\n\n`;
    goods.forEach((item) => {
      md += `- ✅ **${item.title}**: ${item.summary}\n`;
    });
    md += `\n`;
  }

  if (report.rawData.techStack.length > 0) {
    md += `## 💻 Tecnologias Detectadas\n\n`;
    report.rawData.techStack.forEach((tech) => {
      md += `- **${tech.category}:** ${tech.name} (Confiança: ${tech.confidence}%)\n`;
    });
    md += `\n`;
  }

  md += `---\n*Relatório gerado automaticamente pela ferramenta Website Analyzer & Audit Tool.*`;
  return md;
}
