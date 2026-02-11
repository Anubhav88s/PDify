import { Hero } from "@/components/layout/Hero";
import { ToolGrid } from "@/components/features/ToolGrid";

export default function Home() {
  return (
    <main className="min-h-screen bg-transparent">
      <Hero />
      <div id="tools" className="pb-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center mb-12">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Most Popular PDF Tools
            </h2>
            <p className="mt-4 text-lg leading-8 text-muted-foreground">
              Check out our most popular tools for managing your PDF files.
            </p>
          </div>
          <ToolGrid />
        </div>
      </div>
    </main>
  );
}
