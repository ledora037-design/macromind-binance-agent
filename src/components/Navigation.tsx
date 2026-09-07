import React from "react";
import {
  LayoutDashboard,
  Radar,
  ArrowLeftRight,
  Cpu,
  Briefcase,
  Terminal,
} from "lucide-react";

export type ActiveNavMode = "dashboard" | "scanner" | "trade" | "strategies" | "portfolio";

interface NavigationProps {
  activeMode: ActiveNavMode;
  onSelectMode: (mode: ActiveNavMode) => void;
  openPositionsCount: number;
  activeSetupsCount: number;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeMode,
  onSelectMode,
  openPositionsCount,
  activeSetupsCount,
}) => {
  const navItems: {
    id: ActiveNavMode;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
    badgeColor?: string;
  }[] = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      id: "scanner",
      label: "AI Scanner",
      icon: Radar,
      badge: activeSetupsCount > 0 ? activeSetupsCount : undefined,
      badgeColor: "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30",
    },
    {
      id: "trade",
      label: "Trade",
      icon: ArrowLeftRight,
    },
    {
      id: "strategies",
      label: "Strategies",
      icon: Cpu,
    },
    {
      id: "portfolio",
      label: "Portfolio",
      icon: Briefcase,
      badge: openPositionsCount > 0 ? openPositionsCount : undefined,
      badgeColor: "bg-blue-500/20 text-blue-400 border border-blue-500/30",
    },
  ];

  return (
    <nav
      id="terminal-navigation-bar"
      className="bg-[#0e131b] border-b border-[#1c2432] px-3 md:px-5 flex items-center justify-between overflow-x-auto select-none scrollbar-none"
    >
      <div className="flex items-center space-x-1 sm:space-x-2 py-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeMode === item.id;
          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => onSelectMode(item.id)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded text-xs font-mono font-medium transition-all ${
                isActive
                  ? "bg-[#192231] text-slate-100 border border-[#2b394e] shadow-sm"
                  : "text-slate-400 hover:text-slate-200 hover:bg-[#131a26]"
              }`}
            >
              <Icon
                className={`w-3.5 h-3.5 ${
                  isActive ? "text-emerald-400" : "text-slate-500"
                }`}
              />
              <span className="whitespace-nowrap">{item.label}</span>
              {item.badge !== undefined && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                    item.badgeColor || "bg-slate-800 text-slate-300"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="hidden lg:flex items-center space-x-2 text-[11px] font-mono text-slate-500 py-1.5">
        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
        <span>LATENCY: 14ms</span>
        <span className="text-slate-700">|</span>
        <span>CONFLUENCE ENGINE: ACTIVE</span>
      </div>
    </nav>
  );
};
