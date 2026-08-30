import React, { useState, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Calendar,
  Layers,
  Filter,
  RefreshCw,
  Clock,
  Sparkles,
} from 'lucide-react';
import { SavedAuditSummary } from '../types';
import { formatDate } from '../utils/formatters';

interface HistoricalTrendsChartProps {
  savedAudits: SavedAuditSummary[];
  currentUrl?: string;
  onSelectAudit?: (id: string) => void;
  onReaudit?: (url: string) => void;
}

export const HistoricalTrendsChart: React.FC<HistoricalTrendsChartProps> = ({
  savedAudits,
  currentUrl,
  onSelectAudit,
  onReaudit,
}) => {
  // Extract unique URLs
  const uniqueUrls = useMemo(() => {
    const urls = Array.from(new Set(savedAudits.map((a) => a.targetUrl)));
    return urls;
  }, [savedAudits]);

  // Selected URL filter (default to currentUrl if available in list, else first URL, else 'all')
  const [selectedUrl, setSelectedUrl] = useState<string>(() => {
    if (currentUrl && uniqueUrls.includes(currentUrl)) return currentUrl;
    if (uniqueUrls.length > 0) return uniqueUrls[0];
    return 'all';
  });

  // Metric line visibility toggles
  const [showOverall, setShowOverall] = useState(true);
  const [showSecurity, setShowSecurity] = useState(true);
  const [showSeo, setShowSeo] = useState(true);
  const [showPerf, setShowPerf] = useState(true);
  const [showBestPractices, setShowBestPractices] = useState(false);

  // Filter and sort audits chronologically (oldest to newest for trend timeline)
  const chartData = useMemo(() => {
    let filtered = savedAudits;
    if (selectedUrl !== 'all') {
      filtered = savedAudits.filter((a) => a.targetUrl === selectedUrl);
    }

    // Sort ascending by analyzedAt
    const sorted = [...filtered].sort(
      (a, b) => new Date(a.analyzedAt).getTime() - new Date(b.analyzedAt).getTime()
    );

    return sorted.map((audit, index) => {
      const d = new Date(audit.analyzedAt);
      const timeStr = `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
      const dateStr = `${d.getDate()}/${d.getMonth() + 1}`;
      let host = audit.targetUrl;
      try {
        host = new URL(audit.targetUrl).hostname;
      } catch {
        // ignore
      }

      return {
        id: audit.id,
        runNumber: `Run #${index + 1}`,
        rawDate: audit.analyzedAt,
        dateFormatted: `${dateStr} ${timeStr}`,
        hostname: host,
        targetUrl: audit.targetUrl,
        overall: audit.overallScore,
        security: audit.securityScore,
        seo: audit.seoScore,
        perf: audit.perfScore,
        bestPractices: audit.bestPracticesScore,
      };
    });
  }, [savedAudits, selectedUrl]);

  // Summary statistics
  const stats = useMemo(() => {
    if (chartData.length === 0) return null;

    const first = chartData[0];
    const latest = chartData[chartData.length - 1];
    const overallDelta = latest.overall - first.overall;
    const scores = chartData.map((d) => d.overall);
    const maxScore = Math.max(...scores);
    const minScore = Math.min(...scores);
    const avgScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

    return {
      runsCount: chartData.length,
      firstScore: first.overall,
      latestScore: latest.overall,
      overallDelta,
      maxScore,
      minScore,
      avgScore,
      latestDate: latest.dateFormatted,
    };
  }, [chartData]);

  // Custom Recharts Tooltip styled in High-Density theme
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="border-2 border-[#141414] bg-white p-3 shadow-[4px_4px_0px_#141414] font-mono text-xs text-[#141414] min-w-[200px]">
          <div className="flex items-center justify-between border-b border-[#141414] pb-1.5 mb-2 font-bold">
            <span className="text-[11px] uppercase">{data.runNumber}</span>
            <span className="text-[10px] text-[#141414]/70">{data.dateFormatted}</span>
          </div>
          <div className="text-[10px] text-[#141414]/80 mb-2 truncate max-w-[220px]">
            {data.hostname}
          </div>

          <div className="space-y-1 text-[11px]">
            {showOverall && (
              <div className="flex justify-between items-center bg-[#141414] text-white px-1.5 py-0.5 font-black">
                <span>SCORE GERAL:</span>
                <span>{data.overall} / 100</span>
              </div>
            )}
            {showSecurity && (
              <div className="flex justify-between items-center text-emerald-800 font-bold">
                <span>SEGURANÇA:</span>
                <span>{data.security}%</span>
              </div>
            )}
            {showSeo && (
              <div className="flex justify-between items-center text-blue-800 font-bold">
                <span>SEO:</span>
                <span>{data.seo}%</span>
              </div>
            )}
            {showPerf && (
              <div className="flex justify-between items-center text-amber-800 font-bold">
                <span>PERFORMANCE:</span>
                <span>{data.perf}%</span>
              </div>
            )}
            {showBestPractices && (
              <div className="flex justify-between items-center text-purple-800 font-bold">
                <span>BOAS PRÁTICAS:</span>
                <span>{data.bestPractices}%</span>
              </div>
            )}
          </div>

          {onSelectAudit && (
            <div className="mt-2 pt-1.5 border-t border-[#141414]/20 text-[9px] text-[#141414]/60 uppercase text-center">
              Clique no ponto para carregar este relatório
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (savedAudits.length === 0) {
    return (
      <div className="border-2 border-[#141414] bg-white p-8 text-center font-mono shadow-[4px_4px_0px_#141414]">
        <Activity className="h-8 w-8 text-[#141414]/40 mx-auto mb-2" />
        <h4 className="text-xs font-black uppercase text-[#141414]">NENHUM DADO HISTÓRICO DISPONÍVEL</h4>
        <p className="text-[11px] text-[#141414]/70 mt-1 max-w-md mx-auto">
          Execute uma ou mais auditorias para gerar a curva temporal de evolução de score, segurança, SEO e performance.
        </p>
      </div>
    );
  }

  return (
    <div className="border-2 border-[#141414] bg-white p-5 sm:p-6 shadow-[4px_4px_0px_#141414] font-mono text-[#141414] space-y-5">
      {/* Header & URL Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-[#141414] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#141414]" />
            <h3 className="text-xs sm:text-sm font-black text-[#141414] uppercase">
              EVOLUÇÃO TEMPORAL & TENDÊNCIAS HISTÓRICAS
            </h3>
          </div>
          <p className="text-[11px] text-[#141414]/70 mt-0.5">
            Acompanhe como os scores de segurança, SEO, performance e conformidade evoluíram ao longo das auditorias.
          </p>
        </div>

        {/* URL Filter selector */}
        <div className="flex items-center gap-2 shrink-0">
          <label htmlFor="url-filter-select" className="text-[11px] font-bold uppercase text-[#141414]">
            FILTRAR URL:
          </label>
          <select
            id="url-filter-select"
            value={selectedUrl}
            onChange={(e) => setSelectedUrl(e.target.value)}
            className="bg-[#E4E3E0] border-2 border-[#141414] px-2.5 py-1 text-xs font-mono font-bold text-[#141414] focus:outline-none focus:bg-white"
          >
            {uniqueUrls.length > 1 && <option value="all">TODAS AS URLS ({uniqueUrls.length})</option>}
            {uniqueUrls.map((url) => {
              let display = url;
              try {
                display = new URL(url).hostname;
              } catch {
                // ignore
              }
              return (
                <option key={url} value={url}>
                  {display}
                </option>
              );
            })}
          </select>

          {onReaudit && selectedUrl !== 'all' && (
            <button
              type="button"
              onClick={() => onReaudit(selectedUrl)}
              className="flex items-center gap-1 bg-[#141414] text-white hover:bg-black px-2.5 py-1 text-xs font-black uppercase border border-[#141414] shadow-[2px_2px_0px_#888888] cursor-pointer"
              title="Executar nova auditoria agora para registrar um novo ponto na linha do tempo"
            >
              <RefreshCw className="h-3 w-3" />
              <span>REAUDITAR</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Stats bar */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Total Runs */}
          <div className="border border-[#141414] bg-[#E4E3E0]/30 p-2.5">
            <span className="text-[10px] font-bold uppercase text-[#141414]/70 block">EXECUÇÕES:</span>
            <div className="text-base font-black text-[#141414] mt-0.5">{stats.runsCount} AUDITORIAS</div>
          </div>

          {/* Latest Score & Delta */}
          <div className="border border-[#141414] bg-[#E4E3E0]/30 p-2.5">
            <span className="text-[10px] font-bold uppercase text-[#141414]/70 block">SCORE ATUAL:</span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-base font-black text-[#141414]">{stats.latestScore}/100</span>
              {stats.runsCount > 1 && (
                <span
                  className={`flex items-center text-[10px] font-bold px-1 border ${
                    stats.overallDelta > 0
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-700'
                      : stats.overallDelta < 0
                      ? 'bg-rose-100 text-rose-800 border-rose-700'
                      : 'bg-neutral-200 text-[#141414] border-[#141414]/40'
                  }`}
                >
                  {stats.overallDelta > 0 ? (
                    <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
                  ) : stats.overallDelta < 0 ? (
                    <TrendingDown className="h-2.5 w-2.5 mr-0.5" />
                  ) : (
                    <Minus className="h-2.5 w-2.5 mr-0.5" />
                  )}
                  {stats.overallDelta > 0 ? `+${stats.overallDelta}` : stats.overallDelta} PTS
                </span>
              )}
            </div>
          </div>

          {/* Peak Score */}
          <div className="border border-[#141414] bg-[#E4E3E0]/30 p-2.5">
            <span className="text-[10px] font-bold uppercase text-[#141414]/70 block">PICO MÁXIMO:</span>
            <div className="text-base font-black text-emerald-800 mt-0.5">{stats.maxScore} PTS</div>
          </div>

          {/* Average Score */}
          <div className="border border-[#141414] bg-[#E4E3E0]/30 p-2.5">
            <span className="text-[10px] font-bold uppercase text-[#141414]/70 block">MÉDIA GERAL:</span>
            <div className="text-base font-black text-[#141414] mt-0.5">{stats.avgScore} PTS</div>
          </div>
        </div>
      )}

      {/* Metrics visibility toggle buttons */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#141414]/20">
        <span className="text-[10px] font-bold uppercase text-[#141414]/70 mr-1">EXIBIR SÉRIES:</span>

        <button
          type="button"
          onClick={() => setShowOverall(!showOverall)}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-black uppercase border border-[#141414] transition-all cursor-pointer ${
            showOverall ? 'bg-[#141414] text-white shadow-[2px_2px_0px_#888888]' : 'bg-[#E4E3E0] text-[#141414]/60'
          }`}
        >
          <span className="h-2 w-2 bg-white inline-block border border-black" />
          <span>SCORE GERAL</span>
        </button>

        <button
          type="button"
          onClick={() => setShowSecurity(!showSecurity)}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-black uppercase border border-[#141414] transition-all cursor-pointer ${
            showSecurity ? 'bg-emerald-700 text-white shadow-[2px_2px_0px_#888888]' : 'bg-[#E4E3E0] text-[#141414]/60'
          }`}
        >
          <span className="h-2 w-2 bg-emerald-300 inline-block border border-black" />
          <span>SEGURANÇA</span>
        </button>

        <button
          type="button"
          onClick={() => setShowSeo(!showSeo)}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-black uppercase border border-[#141414] transition-all cursor-pointer ${
            showSeo ? 'bg-blue-700 text-white shadow-[2px_2px_0px_#888888]' : 'bg-[#E4E3E0] text-[#141414]/60'
          }`}
        >
          <span className="h-2 w-2 bg-blue-300 inline-block border border-black" />
          <span>SEO</span>
        </button>

        <button
          type="button"
          onClick={() => setShowPerf(!showPerf)}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-black uppercase border border-[#141414] transition-all cursor-pointer ${
            showPerf ? 'bg-amber-600 text-white shadow-[2px_2px_0px_#888888]' : 'bg-[#E4E3E0] text-[#141414]/60'
          }`}
        >
          <span className="h-2 w-2 bg-amber-300 inline-block border border-black" />
          <span>PERFORMANCE</span>
        </button>

        <button
          type="button"
          onClick={() => setShowBestPractices(!showBestPractices)}
          className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-black uppercase border border-[#141414] transition-all cursor-pointer ${
            showBestPractices ? 'bg-purple-700 text-white shadow-[2px_2px_0px_#888888]' : 'bg-[#E4E3E0] text-[#141414]/60'
          }`}
        >
          <span className="h-2 w-2 bg-purple-300 inline-block border border-black" />
          <span>BOAS PRÁTICAS</span>
        </button>
      </div>

      {/* Chart Canvas */}
      <div className="border-2 border-[#141414] bg-white p-3 pt-6 shadow-[2px_2px_0px_#141414]">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 10, right: 25, left: -15, bottom: 5 }}
              onClick={(e: any) => {
                if (e && e.activePayload && e.activePayload.length && onSelectAudit) {
                  onSelectAudit(e.activePayload[0].payload.id);
                }
              }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#141414" strokeOpacity={0.15} vertical={false} />
              
              <XAxis
                dataKey="runNumber"
                stroke="#141414"
                tick={{ fill: '#141414', fontSize: 11, fontFamily: 'monospace', fontWeight: 'bold' }}
                tickLine={{ stroke: '#141414' }}
              />
              
              <YAxis
                domain={[0, 100]}
                stroke="#141414"
                tick={{ fill: '#141414', fontSize: 11, fontFamily: 'monospace' }}
                tickLine={{ stroke: '#141414' }}
                ticks={[0, 25, 50, 75, 100]}
              />

              <ReferenceLine y={90} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Meta 90+', fill: '#047857', fontSize: 10, position: 'insideTopRight' }} />
              <ReferenceLine y={50} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: 'Alerta <50', fill: '#be123c', fontSize: 10, position: 'insideBottomRight' }} />

              <Tooltip content={<CustomTooltip />} />
              
              <Legend
                wrapperStyle={{ paddingTop: '10px', fontSize: '11px', fontFamily: 'monospace', textTransform: 'uppercase', fontWeight: 'bold' }}
              />

              {showOverall && (
                <Line
                  type="monotone"
                  dataKey="overall"
                  name="Score Geral"
                  stroke="#141414"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#141414', stroke: '#ffffff', strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: '#141414', stroke: '#E4E3E0', strokeWidth: 3 }}
                />
              )}

              {showSecurity && (
                <Line
                  type="monotone"
                  dataKey="security"
                  name="Segurança"
                  stroke="#047857"
                  strokeWidth={2}
                  strokeDasharray={showOverall ? "4 2" : undefined}
                  dot={{ r: 4, fill: '#047857' }}
                  activeDot={{ r: 6 }}
                />
              )}

              {showSeo && (
                <Line
                  type="monotone"
                  dataKey="seo"
                  name="SEO"
                  stroke="#1d4ed8"
                  strokeWidth={2}
                  strokeDasharray={showOverall ? "4 2" : undefined}
                  dot={{ r: 4, fill: '#1d4ed8' }}
                  activeDot={{ r: 6 }}
                />
              )}

              {showPerf && (
                <Line
                  type="monotone"
                  dataKey="perf"
                  name="Performance"
                  stroke="#d97706"
                  strokeWidth={2}
                  strokeDasharray={showOverall ? "4 2" : undefined}
                  dot={{ r: 4, fill: '#d97706' }}
                  activeDot={{ r: 6 }}
                />
              )}

              {showBestPractices && (
                <Line
                  type="monotone"
                  dataKey="bestPractices"
                  name="Boas Práticas"
                  stroke="#7e22ce"
                  strokeWidth={2}
                  strokeDasharray={showOverall ? "4 2" : undefined}
                  dot={{ r: 4, fill: '#7e22ce' }}
                  activeDot={{ r: 6 }}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Audit Points Timeline Table */}
      <div className="space-y-2">
        <h4 className="text-[11px] font-black uppercase text-[#141414]">
          REGISTROS DA LINHA DO TEMPO ({chartData.length} PONTOS):
        </h4>

        <div className="overflow-x-auto border-2 border-[#141414]">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#141414] text-white uppercase text-[10px] font-bold">
              <tr>
                <th className="p-2 border-r border-white/20">EXECUÇÃO</th>
                <th className="p-2 border-r border-white/20">DATA / HORA</th>
                <th className="p-2 border-r border-white/20">DOMÍNIO</th>
                <th className="p-2 border-r border-white/20 text-center">GERAL</th>
                <th className="p-2 border-r border-white/20 text-center">SEC</th>
                <th className="p-2 border-r border-white/20 text-center">SEO</th>
                <th className="p-2 border-r border-white/20 text-center">PERF</th>
                <th className="p-2 text-right">AÇÃO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#141414]">
              {chartData.map((row) => (
                <tr key={row.id} className="hover:bg-[#E4E3E0]/40 transition-colors">
                  <td className="p-2 font-bold border-r border-[#141414]">{row.runNumber}</td>
                  <td className="p-2 border-r border-[#141414] text-[11px] text-[#141414]/80">{row.dateFormatted}</td>
                  <td className="p-2 border-r border-[#141414] font-bold truncate max-w-[150px]">{row.hostname}</td>
                  <td className="p-2 border-r border-[#141414] text-center font-black">
                    <span className={`px-1.5 py-0.2 border border-[#141414] ${
                      row.overall >= 90 ? 'bg-emerald-200' : row.overall >= 70 ? 'bg-blue-200' : row.overall >= 50 ? 'bg-amber-200' : 'bg-rose-200'
                    }`}>
                      {row.overall}
                    </span>
                  </td>
                  <td className="p-2 border-r border-[#141414] text-center font-mono font-bold text-emerald-800">{row.security}%</td>
                  <td className="p-2 border-r border-[#141414] text-center font-mono font-bold text-blue-800">{row.seo}%</td>
                  <td className="p-2 border-r border-[#141414] text-center font-mono font-bold text-amber-800">{row.perf}%</td>
                  <td className="p-2 text-right">
                    {onSelectAudit && (
                      <button
                        type="button"
                        onClick={() => onSelectAudit(row.id)}
                        className="bg-white hover:bg-[#141414] hover:text-white px-2 py-0.5 border border-[#141414] text-[10px] font-bold uppercase transition-colors cursor-pointer"
                      >
                        ABRIR
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
