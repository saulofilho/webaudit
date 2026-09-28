import React, { useState, useMemo } from 'react';
import {
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Sliders,
  Type,
  Maximize2,
  FileCheck2,
  Layout,
  MousePointer,
  Sparkles,
} from 'lucide-react';
import { AuditReport } from '../types';

interface AccessibilityWcagViewProps {
  report: AuditReport;
}

// Relative luminance helper for WCAG contrast calculation
function getLuminance(r: number, g: number, b: number): number {
  const a = [r, g, b].map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const sanitized = hex.replace('#', '');
  if (sanitized.length === 3) {
    const r = parseInt(sanitized[0] + sanitized[0], 16);
    const g = parseInt(sanitized[1] + sanitized[1], 16);
    const b = parseInt(sanitized[2] + sanitized[2], 16);
    return { r, g, b };
  }
  if (sanitized.length === 6) {
    const r = parseInt(sanitized.slice(0, 2), 16);
    const g = parseInt(sanitized.slice(2, 4), 16);
    const b = parseInt(sanitized.slice(4, 6), 16);
    return { r, g, b };
  }
  return null;
}

export const AccessibilityWcagView: React.FC<AccessibilityWcagViewProps> = ({ report }) => {
  const [fgColor, setFgColor] = useState<string>('#141414');
  const [bgColor, setBgColor] = useState<string>('#FFFFFF');

  // Calculate contrast ratio
  const contrastRatio = useMemo(() => {
    const rgb1 = hexToRgb(fgColor);
    const rgb2 = hexToRgb(bgColor);
    if (!rgb1 || !rgb2) return 21; // fallback max

    const lum1 = getLuminance(rgb1.r, rgb1.g, rgb1.b);
    const lum2 = getLuminance(rgb2.r, rgb2.g, rgb2.b);

    const brightest = Math.max(lum1, lum2);
    const darkest = Math.min(lum1, lum2);

    const ratio = (brightest + 0.05) / (darkest + 0.05);
    return parseFloat(ratio.toFixed(2));
  }, [fgColor, bgColor]);

  const wcagAaNormal = contrastRatio >= 4.5;
  const wcagAaLarge = contrastRatio >= 3.0;
  const wcagAaaNormal = contrastRatio >= 7.0;
  const wcagAaaLarge = contrastRatio >= 4.5;

  // Real audit stats from page
  const imagesTotal = report.rawData.imagesTotal || 0;
  const imagesMissingAlt = report.rawData.imagesMissingAlt || 0;
  const imagesWithAlt = Math.max(0, imagesTotal - imagesMissingAlt);
  const altComplianceRate = imagesTotal > 0 ? Math.round((imagesWithAlt / imagesTotal) * 100) : 100;

  const h1Count = report.rawData.h1Count;
  const h2Count = report.rawData.h2Count;
  const formsCount = report.rawData.formsCount;
  const formsWithoutHttps = report.rawData.formsWithoutHttps;

  return (
    <div className="space-y-6 text-[#141414]">
      {/* Header Banner */}
      <div className="border-2 border-[#141414] bg-white p-5 shadow-[4px_4px_0px_#141414]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center border-2 border-[#141414] bg-purple-600 text-white">
              <Eye className="h-5 w-5 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight">
                Auditoria de Acessibilidade WCAG 2.1 & Conformidade ADA
              </h2>
              <p className="text-xs text-[#141414]/70">
                Padrões internacionais de inclusão digital, navegação assistiva e proteção contra litígios ADA
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 font-mono text-xs">
            <span className="border border-[#141414] bg-[#E4E3E0] px-3 py-1 font-bold">
              PADRÃO-ALVO: <strong>WCAG 2.1 NÍVEL AA</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Interactive Color Contrast Validator */}
      <div className="border-2 border-[#141414] bg-white p-5 shadow-[4px_4px_0px_#141414] space-y-4">
        <div className="flex items-center justify-between border-b-2 border-[#141414] pb-3">
          <div className="flex items-center gap-2">
            <Sliders className="h-4 w-4 text-[#141414]" />
            <h3 className="text-sm font-black uppercase">Validador de Contraste de Cores em Tempo Real</h3>
          </div>
          <span className="font-mono text-xs bg-purple-100 text-purple-950 border border-purple-800 px-2 py-0.5 font-bold">
            RATIO: {contrastRatio}:1
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center font-mono">
          {/* Controls */}
          <div className="lg:col-span-5 space-y-3 text-xs">
            <div>
              <label className="font-bold block mb-1">Cor do Texto (Primeiro Plano):</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="w-10 h-8 p-0 border border-[#141414] cursor-pointer"
                />
                <input
                  type="text"
                  value={fgColor}
                  onChange={(e) => setFgColor(e.target.value)}
                  className="border border-[#141414] px-2 py-1 uppercase text-xs w-28 font-bold"
                />
                <span className="text-[10px] text-[#141414]/60">(Hexadecimal)</span>
              </div>
            </div>

            <div>
              <label className="font-bold block mb-1">Cor de Fundo (Plano de Fundo):</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-10 h-8 p-0 border border-[#141414] cursor-pointer"
                />
                <input
                  type="text"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="border border-[#141414] px-2 py-1 uppercase text-xs w-28 font-bold"
                />
                <span className="text-[10px] text-[#141414]/60">(Hexadecimal)</span>
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="flex flex-wrap gap-1.5 pt-1 text-[10px]">
              <span className="text-[#141414]/70 mr-1 font-bold">PRESETS:</span>
              <button
                type="button"
                onClick={() => { setFgColor('#141414'); setBgColor('#FFFFFF'); }}
                className="border border-[#141414] px-1.5 py-0.5 bg-neutral-100 hover:bg-white cursor-pointer"
              >
                Preto / Branco
              </button>
              <button
                type="button"
                onClick={() => { setFgColor('#FFFFFF'); setBgColor('#047857'); }}
                className="border border-[#141414] px-1.5 py-0.5 bg-neutral-100 hover:bg-white cursor-pointer"
              >
                Branco / Verde
              </button>
              <button
                type="button"
                onClick={() => { setFgColor('#71717A'); setBgColor('#FFFFFF'); }}
                className="border border-[#141414] px-1.5 py-0.5 bg-neutral-100 hover:bg-white cursor-pointer"
              >
                Cinza Claro (Alerta)
              </button>
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="lg:col-span-4">
            <div
              className="p-4 border-2 border-[#141414] transition-colors rounded-none min-h-[110px] flex flex-col justify-center"
              style={{ backgroundColor: bgColor, color: fgColor }}
            >
              <p className="font-bold text-sm">
                Texto de Exemplo em Destaque
              </p>
              <p className="text-xs mt-1 leading-relaxed opacity-90">
                O contraste adequado garante que pessoas com baixa visão ou sob luz solar intensa possam ler perfeitamente.
              </p>
            </div>
          </div>

          {/* WCAG Compliance Verdict */}
          <div className="lg:col-span-3 space-y-1.5 text-xs font-mono">
            <div className="flex items-center justify-between border border-[#141414] p-1.5 bg-[#E4E3E0]">
              <span className="text-[11px] font-bold">WCAG AA Normal:</span>
              <span className={`px-1.5 py-0.2 text-[10px] font-black border ${wcagAaNormal ? 'bg-emerald-100 text-emerald-950 border-emerald-700' : 'bg-rose-100 text-rose-950 border-rose-700'}`}>
                {wcagAaNormal ? 'PASSOU (≥4.5)' : 'FALHOU'}
              </span>
            </div>

            <div className="flex items-center justify-between border border-[#141414] p-1.5 bg-[#E4E3E0]">
              <span className="text-[11px] font-bold">WCAG AA Grande:</span>
              <span className={`px-1.5 py-0.2 text-[10px] font-black border ${wcagAaLarge ? 'bg-emerald-100 text-emerald-950 border-emerald-700' : 'bg-rose-100 text-rose-950 border-rose-700'}`}>
                {wcagAaLarge ? 'PASSOU (≥3.0)' : 'FALHOU'}
              </span>
            </div>

            <div className="flex items-center justify-between border border-[#141414] p-1.5 bg-[#E4E3E0]">
              <span className="text-[11px] font-bold">WCAG AAA Rigoroso:</span>
              <span className={`px-1.5 py-0.2 text-[10px] font-black border ${wcagAaaNormal ? 'bg-emerald-100 text-emerald-950 border-emerald-700' : 'bg-rose-100 text-rose-950 border-rose-700'}`}>
                {wcagAaaNormal ? 'PASSOU (≥7.0)' : 'FALHOU'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* WCAG Heuristics & Diagnostics Checklist */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
        {/* Images Alt Text */}
        <div className="border-2 border-[#141414] bg-white p-4 shadow-[2px_2px_0px_#141414] space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold uppercase flex items-center gap-1.5">
              <FileCheck2 className="h-4 w-4" />
              Texto Alternativo em Imagens (Alt Text)
            </span>
            <span className={`px-2 py-0.5 border font-bold text-[10px] ${altComplianceRate >= 90 ? 'bg-emerald-100 text-emerald-950 border-emerald-700' : 'bg-rose-100 text-rose-950 border-rose-700'}`}>
              {altComplianceRate}% CONFORME
            </span>
          </div>
          <p className="text-[11px] text-[#141414]/70">
            {imagesTotal} imagens auditadas. {imagesMissingAlt > 0 ? `${imagesMissingAlt} imagem(ns) não possuem o atributo alt, impedindo a compreensão por deficientes visuais.` : 'Todas as imagens possuem atributo alt correspondente.'}
          </p>
        </div>

        {/* Heading Hierarchy */}
        <div className="border-2 border-[#141414] bg-white p-4 shadow-[2px_2px_0px_#141414] space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold uppercase flex items-center gap-1.5">
              <Type className="h-4 w-4" />
              Hierarquia de Títulos (H1 / H2 / H3)
            </span>
            <span className={`px-2 py-0.5 border font-bold text-[10px] ${h1Count === 1 ? 'bg-emerald-100 text-emerald-950 border-emerald-700' : 'bg-amber-100 text-amber-950 border-amber-700'}`}>
              {h1Count === 1 ? 'H1 ÚNICO (EXCELENTE)' : `${h1Count} TAGS H1`}
            </span>
          </div>
          <p className="text-[11px] text-[#141414]/70">
            H1: {h1Count} | H2: {h2Count} | H3: {report.rawData.h3Count}. A estrutura semântica permite navegação rápida via leitor de tela por tópicos.
          </p>
        </div>

        {/* Focus Rings & Keyboard Navigation */}
        <div className="border-2 border-[#141414] bg-white p-4 shadow-[2px_2px_0px_#141414] space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold uppercase flex items-center gap-1.5">
              <MousePointer className="h-4 w-4" />
              Navegação por Teclado & Foco Visível
            </span>
            <span className="px-2 py-0.5 border font-bold text-[10px] bg-emerald-100 text-emerald-950 border-emerald-700">
              RECOMENDADO
            </span>
          </div>
          <p className="text-[11px] text-[#141414]/70">
            Certifique-se de nunca utilizar <code>outline: none</code> sem substituir por um anel de foco visível com <code>:focus-visible</code> para usuários que navegam via tecla Tab.
          </p>
        </div>

        {/* Forms & Labels */}
        <div className="border-2 border-[#141414] bg-white p-4 shadow-[2px_2px_0px_#141414] space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold uppercase flex items-center gap-1.5">
              <Layout className="h-4 w-4" />
              Formulários & Rótulos Acessíveis (Labels)
            </span>
            <span className={`px-2 py-0.5 border font-bold text-[10px] ${formsWithoutHttps === 0 ? 'bg-emerald-100 text-emerald-950 border-emerald-700' : 'bg-rose-100 text-rose-950 border-rose-700'}`}>
              {formsCount} FORMULÁRIOS
            </span>
          </div>
          <p className="text-[11px] text-[#141414]/70">
            Todos os campos de entrada (input, select, textarea) devem conter <code>&lt;label for="..."&gt;</code> ou <code>aria-label</code> correspondente para leitura automática.
          </p>
        </div>
      </div>
    </div>
  );
};
