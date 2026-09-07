import React, { useRef, useEffect } from "react";
import {
  Activity,
  Terminal,
  ShieldCheck,
  AlertOctagon,
  CheckCircle2,
  Clock,
  Radio,
  Trash2,
} from "lucide-react";
import { AgentActivityEvent } from "../types";

interface AgentActivityCenterProps {
  events: AgentActivityEvent[];
  onClear?: () => void;
}

export const AgentActivityCenter: React.FC<AgentActivityCenterProps> = ({
  events,
  onClear,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new events arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  const getLevelBadge = (level: AgentActivityEvent["level"]) => {
    switch (level) {
      case "success":
        return "text-emerald-400";
      case "danger":
        return "text-rose-400";
      case "warning":
        return "text-amber-400";
      default:
        return "text-cyan-400";
    }
  };

  return (
    <div
      id="agent-activity-center"
      className="bg-[#0b1018] border border-[#1e2738] rounded-lg font-mono text-xs select-none flex flex-col h-full shadow-md"
    >
      {/* Header */}
      <div className="h-9 px-3 border-b border-[#1b2536] flex items-center justify-between bg-[#0e1420] rounded-t-lg">
        <div className="flex items-center space-x-2">
          <Terminal className="w-3.5 h-3.5 text-emerald-400" />
          <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
            Agent Activity Center
          </span>
          <span className="flex items-center space-x-1 text-[10px] text-emerald-400 bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-500/30">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>LIVE</span>
          </span>
        </div>

        <div className="flex items-center space-x-2 text-[10px] text-slate-400">
          <span>{events.length} events</span>
          {onClear && (
            <button
              onClick={onClear}
              className="p-1 hover:text-slate-200 transition-colors"
              title="Clear activity log"
            >
              <Trash2 className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Events Stream */}
      <div
        ref={scrollRef}
        className="flex-1 p-2.5 overflow-y-auto space-y-1.5 max-h-60 sm:max-h-72 scrollbar-thin scrollbar-thumb-[#1e293b]"
      >
        {events.length === 0 ? (
          <div className="py-6 text-center text-slate-500 text-[11px]">
            Awaiting agent execution. Click "RUN AGENT" to trigger autonomous loop.
          </div>
        ) : (
          events.map((evt) => (
            <div
              key={evt.id}
              className="flex items-start space-x-2 p-1.5 rounded bg-[#0f1622]/60 hover:bg-[#131c2b] border border-[#182332] text-[11px] transition-colors leading-relaxed"
            >
              {/* Timestamp */}
              <span className="text-slate-500 text-[10px] shrink-0 font-medium pt-0.5">
                {evt.timeString.slice(0, 5)}
              </span>

              {/* Step Type Tag */}
              <span
                className={`text-[9px] px-1 py-0.2 rounded font-bold uppercase shrink-0 border ${
                  evt.type === "RISK"
                    ? "bg-purple-950/40 border-purple-500/30 text-purple-300"
                    : evt.type === "VETO"
                    ? "bg-rose-950/40 border-rose-500/40 text-rose-300"
                    : evt.type === "ACT"
                    ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300"
                    : evt.type === "OBSERVE"
                    ? "bg-cyan-950/40 border-cyan-500/30 text-cyan-300"
                    : "bg-blue-950/40 border-blue-500/30 text-blue-300"
                }`}
              >
                {evt.type}
              </span>

              {/* Message */}
              <div className="flex-1 text-slate-200 break-words">
                <span className={getLevelBadge(evt.level)}>{evt.message}</span>
                {evt.asset && (
                  <span className="ml-1.5 text-[9px] px-1 py-0.2 rounded bg-[#182232] text-slate-300 font-bold">
                    {evt.asset}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Status Bar */}
      <div className="h-6 px-3 border-t border-[#172130] bg-[#0c121c] rounded-b-lg flex items-center justify-between text-[10px] text-slate-500">
        <div className="flex items-center space-x-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span>Loop: OBSERVE → ANALYZE → PLAN → RISK CHECK → ACT → MONITOR</span>
        </div>
        <span>Protected Capital Principle</span>
      </div>
    </div>
  );
};
