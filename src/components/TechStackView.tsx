import React from 'react';
import { Layers, Server, Globe, Cpu, Palette, BarChart, Shield } from 'lucide-react';
import { TechStackItem } from '../types';

interface TechStackViewProps {
  techStack: TechStackItem[];
  serverHeader?: string;
}

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'CDN / Proxy': Shield,
  'Web Server': Server,
  'PaaS / Hosting': Globe,
  'Backend Framework': Cpu,
  'Frontend Framework': Cpu,
  'JavaScript Library': Cpu,
  'CMS': Globe,
  'E-commerce': Globe,
  'CSS Framework': Palette,
  'Analytics': BarChart,
  'Tag Management': BarChart,
  'UX Analytics': BarChart,
  'Marketing': BarChart,
  'Fonts': Palette,
  'Icons': Palette,
};

export const TechStackView: React.FC<TechStackViewProps> = ({ techStack, serverHeader }) => {
  return (
    <div className="border-2 border-[#141414] bg-white p-5 sm:p-6 shadow-[4px_4px_0px_#141414] font-mono text-[#141414]">
      <div className="flex items-center gap-2 pb-4 border-b-2 border-[#141414]">
        <Layers className="h-5 w-5 text-[#141414]" />
        <div>
          <h3 className="text-xs sm:text-sm font-black text-[#141414] uppercase">
            STACK TECNOLÓGICO & INFRAESTRUTURA DETECTADA
          </h3>
          <p className="text-[11px] text-[#141414]/70">
            Tecnologias, servidores, bibliotecas e CDNs identificados via assinaturas HTTP e DOM.
          </p>
        </div>
      </div>

      {techStack.length === 0 ? (
        <div className="text-center py-8 text-[#141414]/70">
          <p className="text-xs">Nenhuma tecnologia específica identificada por assinaturas padrão.</p>
          {serverHeader && (
            <p className="text-[11px] text-[#141414] mt-1">
              CABEÇALHO SERVER: <strong className="bg-[#E4E3E0] px-1 py-0.5 border border-[#141414]">{serverHeader}</strong>
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-5">
          {techStack.map((tech, idx) => {
            const Icon = CATEGORY_ICONS[tech.category] || Cpu;
            return (
              <div
                key={idx}
                className="flex items-center gap-3 border-2 border-[#141414] bg-[#E4E3E0]/30 p-3 hover:bg-[#E4E3E0] transition-colors shadow-[2px_2px_0px_#141414]"
              >
                <div className="flex h-9 w-9 items-center justify-center border border-[#141414] bg-[#141414] text-[#E4E3E0] shrink-0">
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#141414]/70 block truncate">
                    {tech.category}
                  </span>
                  <h4 className="text-xs font-black text-[#141414] truncate uppercase">
                    {tech.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-[#141414]/80">
                      CONFIANÇA: <strong>{tech.confidence}%</strong>
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
