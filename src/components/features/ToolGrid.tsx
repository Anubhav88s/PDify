import Link from "next/link";
import { Card } from "@/components/ui/Card";
import {
  FileStack,
  Scissors,
  Minimize2,
  FileType,
  Image as ImageIcon,
  FileText,
  Presentation,
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

export function ToolGrid() {
  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {Object.entries(toolsConfig).map(([key, tool]) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const Icon = iconMap[key] || FileType;
        return (
          <Link href={`/${key}`} key={key} className="group">
            <Card className="h-full border-white/5 bg-white/5 hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300">
              <div className="flex flex-col items-start gap-4">
                <div className="p-3 rounded-lg bg-white/5 group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                    {tool.title}
                  </h3>
                  <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                    {tool.description}
                  </p>
                </div>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
