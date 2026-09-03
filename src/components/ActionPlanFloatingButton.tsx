import React from 'react';
import { ListTodo, AlertCircle, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react';
import { motion } from 'motion/react';
import { AuditItem } from '../types';

interface ActionPlanFloatingButtonProps {
  items: AuditItem[];
  completedFixIds: Record<string, boolean>;
  onClick: () => void;
  isOpen: boolean;
}

export const ActionPlanFloatingButton: React.FC<ActionPlanFloatingButtonProps> = ({
  items,
  completedFixIds,
  onClick,
  isOpen,
}) => {
  // Only critical and warning items are aggregated into the action plan
  const actionItems = items.filter(
    (item) => item.severity === 'critical' || item.severity === 'warning'
  );

  const totalCount = actionItems.length;
  if (totalCount === 0 || isOpen) return null;

  const completedCount = actionItems.filter((i) => !!completedFixIds[i.id]).length;
  const pendingCount = totalCount - completedCount;
  const pendingCriticalCount = actionItems.filter(
    (i) => i.severity === 'critical' && !completedFixIds[i.id]
  ).length;
  const pendingWarningCount = actionItems.filter(
    (i) => i.severity === 'warning' && !completedFixIds[i.id]
  ).length;

  const progressPercent = Math.round((completedCount / totalCount) * 100);

  return (
    <motion.aside
      initial={{ scale: 0.85, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.85, opacity: 0, y: 20 }}
      transition={{ duration: 0.25 }}
      aria-label="Plano de Ação Flutuante"
      className="fixed bottom-5 right-4 sm:right-6 z-40 font-mono"
    >
      <button
        type="button"
        id="btn-floating-action-plan"
        onClick={onClick}
        aria-label={`Abrir Plano de Ação. ${pendingCount} pendências restantes.`}
        className="group flex items-center gap-2.5 sm:gap-3 bg-[#141414] text-white p-2.5 sm:px-4 sm:py-3 border-2 border-[#141414] shadow-[4px_4px_0px_#888888] hover:shadow-[6px_6px_0px_#141414] hover:-translate-y-0.5 transition-all cursor-pointer select-none"
      >
        {/* Icon & Mini Progress Ring */}
        <div className="relative flex items-center justify-center">
          <div className="flex h-9 w-9 items-center justify-center bg-amber-400 text-[#141414] border border-white">
            <ListTodo className="h-5 w-5 stroke-[2.5]" />
          </div>
          {pendingCriticalCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 flex h-4 min-w-4 items-center justify-center bg-rose-600 border border-white text-[9px] font-black text-white px-1">
              !
            </span>
          )}
        </div>

        {/* Labels & Counts */}
        <div className="text-left">
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-sm font-black uppercase tracking-wide text-white">
              PLANO DE AÇÃO
            </span>
            <span className="text-[10px] font-bold text-amber-300 bg-white/10 px-1.5 py-0.2 border border-white/20">
              {progressPercent}%
            </span>
          </div>

          <div className="flex items-center gap-1.5 mt-0.5 text-[10px] sm:text-[11px] font-bold">
            {pendingCount === 0 ? (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" /> TUDO RESOLVIDO!
              </span>
            ) : (
              <>
                {pendingCriticalCount > 0 && (
                  <span className="text-rose-400 flex items-center gap-0.5">
                    <AlertCircle className="h-3 w-3" />
                    {pendingCriticalCount} {pendingCriticalCount === 1 ? 'crítico' : 'críticos'}
                  </span>
                )}
                {pendingCriticalCount > 0 && pendingWarningCount > 0 && (
                  <span className="text-white/40">•</span>
                )}
                {pendingWarningCount > 0 && (
                  <span className="text-amber-300 flex items-center gap-0.5">
                    <AlertTriangle className="h-3 w-3" />
                    {pendingWarningCount} {pendingWarningCount === 1 ? 'alerta' : 'alertas'}
                  </span>
                )}
              </>
            )}
          </div>
        </div>

        {/* Chevron arrow indicator */}
        <div className="hidden sm:flex items-center justify-center pl-1 text-white/70 group-hover:text-white group-hover:translate-x-0.5 transition-transform">
          <ChevronRight className="h-5 w-5" />
        </div>
      </button>
    </motion.aside>
  );
};
