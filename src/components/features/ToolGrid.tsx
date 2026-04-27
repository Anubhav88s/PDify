"use client";

import Link from "next/link";
import { toolsConfig } from "@/lib/tools";
import { useAuth } from "@/lib/AuthContext";

const iconMap: Record<string, string> = {
  "merge-pdf": "call_merge",
  "split-pdf": "content_cut",
  "compress-pdf": "expand_less",
  "jpg-to-pdf": "image",
  "word-to-pdf": "description",
  "powerpoint-to-pdf": "slideshow",
  "convert-pdf": "autorenew",
  "compress-image": "photo_size_select_small",
  "pdf-to-image": "collections",
  "pdf-to-ppt": "present_to_all",
  "pdf-to-doc": "view_day",
  "summarize-pdf": "auto_awesome",
  "generate-notes": "school",
};

const visualMap: Record<string, any> = {
  "merge-pdf": { color: "blue", action: "Get Started" },
  "split-pdf": { color: "deepblue", action: "Get Started" },
  "compress-pdf": { color: "blue", action: "Get Started" },
  "jpg-to-pdf": { color: "blue", action: "Get Started" },
  "word-to-pdf": { color: "blue", action: "Get Started" },
  "powerpoint-to-pdf": { color: "orange", action: "Get Started" },
  "convert-pdf": { color: "blue", action: "Get Started" },
  "compress-image": { color: "emerald", action: "Get Started" },
  "pdf-to-image": { color: "blue", action: "Get Started" },
  "pdf-to-ppt": { color: "orange", action: "Get Started" },
  "pdf-to-doc": { color: "blue", action: "Get Started" },
  "summarize-pdf": { color: "blue", action: "Try AI Magic", isAi: true },
  "generate-notes": { color: "violet", action: "Try AI Magic", isAi: true },
};

const styles = {
  blue: {
    glowBg: "bg-blue-500/5",
    iconWrapper: "bg-blue-500/10 border-blue-500/20 icon-glow-blue",
    iconText: "text-blue-400",
    actionText: "text-blue-400",
  },
  deepblue: {
    glowBg: "bg-blue-600/5",
    iconWrapper: "bg-blue-700/10 border-blue-700/20 icon-glow-deepblue",
    iconText: "text-blue-500",
    actionText: "text-blue-500",
  },
  emerald: {
    glowBg: "bg-emerald-500/5",
    iconWrapper: "bg-emerald-500/10 border-emerald-500/20 icon-glow-emerald",
    iconText: "text-emerald-400",
    actionText: "text-emerald-400",
  },
  orange: {
    glowBg: "bg-orange-500/5",
    iconWrapper: "bg-orange-500/10 border-orange-500/20 icon-glow-orange",
    iconText: "text-orange-400",
    actionText: "text-orange-400",
  },
  violet: {
    glowBg: "bg-violet-500/5",
    iconWrapper: "bg-violet-500/10 border-violet-500/20 icon-glow-violet",
    iconText: "text-violet-400",
    actionText: "text-violet-400",
  },
};

export function ToolGrid() {
  const { user } = useAuth();

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 md:gap-8">
      {Object.entries(toolsConfig).map(([key, tool], index) => {
        const iconName = iconMap[key] || "description";
        const visual = visualMap[key] || { color: "blue", action: "Get Started" };
        const s = styles[visual.color as keyof typeof styles];
        const isLocked = tool.requiresAuth && !user;

        const isAi = visual.isAi;
        const cardClasses = isAi 
          ? "glass-card relative overflow-hidden p-8 md:p-10 rounded-3xl group flex flex-col h-full border-blue-500/30 bg-blue-500/[0.04] cursor-pointer animate-fade-up"
          : "glass-card relative overflow-hidden p-8 md:p-10 rounded-3xl group flex flex-col h-full cursor-pointer animate-fade-up";

        return (
          <Link
            href={`/${key}`}
            key={key}
            className={cardClasses}
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <div className={`tool-inner-glow ${s.glowBg}`}></div>
            
            <div className={`flex ${isAi || tool.requiresAuth ? 'justify-between items-start' : ''} mb-6 md:mb-12 relative z-10`}>
              <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform border ${s.iconWrapper}`}>
                <span className={`material-symbols-outlined text-2xl md:text-3xl ${s.iconText}`}>{iconName}</span>
              </div>
              
              {tool.requiresAuth && (
                <div className="flex items-center gap-1.5 bg-blue-600 text-white text-[8px] md:text-[9px] font-black px-2 md:px-3 py-1 md:py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-blue-500/30">
                  {isLocked ? "SIGN IN" : (isAi ? "AI PRO" : "PRO")}
                </div>
              )}
              {!tool.requiresAuth && isAi && (
                <div className="flex items-center gap-1.5 bg-blue-600 text-white text-[8px] md:text-[9px] font-black px-2 md:px-3 py-1 md:py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-blue-500/30">
                  AI PRO
                </div>
              )}
            </div>

            <h3 className="text-xl md:text-2xl font-bold mb-2 md:mb-4 text-white relative z-10">{tool.title}</h3>
            <p className="text-slate-400 text-sm leading-relaxed mb-6 md:mb-12 relative z-10 font-medium">
              {tool.description}
            </p>

            <div className={`mt-auto flex items-center ${s.actionText} text-[10px] font-black tracking-[0.2em] group-hover:translate-x-2 transition-transform relative z-10 uppercase`}>
              {visual.action} <span className="material-symbols-outlined text-sm ml-2">arrow_forward</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
