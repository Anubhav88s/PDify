import { Hero } from "@/components/layout/Hero";
import { ToolGrid } from "@/components/features/ToolGrid";
import { ArrowDown } from "lucide-react";

export default function Home() {
  return (
    <main className="min-h-screen bg-transparent">
      <Hero />

      {/* Tools Section */}
      <div id="tools" className="relative pb-24">
        {/* Background decorations */}
        <div className="absolute inset-0 -z-10 bg-grid-pattern opacity-30" />

        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {/* Section Header */}
          <div className="mx-auto max-w-2xl text-center mb-14 animate-fade-up">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Most Popular{" "}
              <span className="text-gradient">PDF Tools</span>
            </h2>
            <p className="mt-4 text-base sm:text-lg leading-8 text-slate-400">
              Powerful tools to handle all your PDF and file conversion needs.
              Fast, free, and secure.
            </p>
          </div>

          <ToolGrid />
        </div>
      </div>
    </main>
  );
}
