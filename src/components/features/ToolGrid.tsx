"use client";

import Link from "next/link";
import {
  FileStack,
  Scissors,
  Minimize2,
  FileType,
  Image as ImageIcon,
  FileText,
  Presentation,
  ArrowRight,
} from "lucide-react";
import { toolsConfig } from "@/lib/tools";

const iconMap: Record<string, any> = {
  "merge-pdf": FileStack,
  "split-pdf": Scissors,
  "compress-pdf": Minimize2,
  "jpg-to-pdf": ImageIcon,
  "word-to-pdf": FileText,
  "powerpoint-to-pdf": Presentation,
  "convert-pdf": FileType,
  "compress-image": ImageIcon,
  "pdf-to-image": ImageIcon,
  "pdf-to-ppt": Presentation,
  "pdf-to-doc": FileText,
};

// Unique gradient for each tool icon to add color variety
const iconGradients: Record<string, string> = {
  "merge-pdf": "from-blue-500 to-blue-600",
  "split-pdf": "from-violet-500 to-violet-600",
  "compress-pdf": "from-indigo-500 to-indigo-600",
  "jpg-to-pdf": "from-sky-500 to-sky-600",
  "word-to-pdf": "from-blue-600 to-indigo-600",
  "powerpoint-to-pdf": "from-purple-500 to-purple-600",
  "convert-pdf": "from-blue-500 to-violet-500",
  "compress-image": "from-indigo-500 to-purple-500",
  "pdf-to-image": "from-sky-500 to-blue-500",
  "pdf-to-ppt": "from-violet-600 to-purple-600",
  "pdf-to-doc": "from-blue-500 to-blue-700",
};

export function ToolGrid() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 px-4">
      {Object.entries(toolsConfig).map(([key, tool], index) => {
        const Icon = iconMap[key] || FileType;
        const gradient = iconGradients[key] || "from-blue-500 to-violet-500";
        return (
          <Link
            href={`/${key}`}
            key={key}
            className="group relative block h-full animate-fade-up"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <div className="relative h-full overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.02] p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1.5 hover:border-blue-500/30 hover:bg-white/[0.05] hover:shadow-2xl hover:shadow-blue-500/[0.08]">
              {/* Hover glow */}
              <div className="absolute -right-24 -top-24 z-0 h-[200px] w-[200px] rounded-full bg-blue-500/0 blur-[80px] transition-all duration-500 group-hover:bg-blue-500/10" />
              
              <div className="relative z-10 flex flex-col items-start gap-4">
                {/* Icon */}
                <div
                  className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-xl group-hover:shadow-blue-500/20`}
                >
                  <Icon className="h-5 w-5 text-white" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {tool.title}
                    <ArrowRight className="h-3.5 w-3.5 text-slate-500 opacity-0 -translate-x-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0 group-hover:text-blue-400" />
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed group-hover:text-slate-400 transition-colors duration-300">
                    {tool.description}
                  </p>
                </div>
              </div>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
