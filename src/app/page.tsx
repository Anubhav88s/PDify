import { Hero } from "@/components/layout/Hero";
import { ToolGrid } from "@/components/features/ToolGrid";

export default function Home() {
  return (
    <main className="min-h-screen bg-transparent pb-32">
      <Hero />

      {/* Tools Section */}
      <section id="tools" className="px-4 md:px-6 max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-12 md:mb-24 animate-fade-up">
          <span className="text-[10px] md:text-[11px] font-black text-blue-500 uppercase tracking-[0.5em] mb-3 md:mb-4 block">Professional Suite</span>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-black mb-4 md:mb-6 text-white tracking-tight">All Professional Tools</h2>
          <div className="w-12 md:w-16 h-1 bg-gradient-to-r from-blue-600 to-transparent mx-auto rounded-full"></div>
        </div>

        <ToolGrid />
      </section>
    </main>
  );
}
