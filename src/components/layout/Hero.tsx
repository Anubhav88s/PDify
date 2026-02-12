import Link from "next/link";
import {
  Zap,
  Shield,
  Sparkles,
} from "lucide-react";

export function Hero() {
  return (
    <div className="relative isolate overflow-hidden min-h-[calc(100vh-4rem)] flex flex-col justify-center">
      {/* Background Effects */}
      <div className="absolute inset-0 -z-10 bg-grid-pattern opacity-40" />
      <div className="absolute inset-0 -z-10 bg-noise" />

      {/* Top Glow Orb */}
      <div
        className="absolute -top-48 left-1/2 -translate-x-1/2 -z-10 w-[800px] h-[600px] rounded-full opacity-20 blur-[120px]"
        style={{
          background:
            "radial-gradient(ellipse, #3b82f6 0%, #7c3aed 40%, transparent 70%)",
        }}
      />

      {/* Side Orbs */}
      <div className="absolute top-1/3 -left-32 -z-10 w-[400px] h-[400px] rounded-full bg-blue-500/10 blur-[100px] animate-float" />
      <div className="absolute top-1/4 -right-32 -z-10 w-[300px] h-[300px] rounded-full bg-violet-500/10 blur-[100px] animate-float-delay" />

      <div className="mx-auto max-w-7xl px-6 lg:px-8 py-6 sm:py-10 flex-grow flex flex-col justify-center">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="animate-fade-up inline-flex items-center gap-2 rounded-full bg-white/[0.06] border border-white/10 px-3 py-1 text-xs text-slate-300 mb-6 backdrop-blur-sm">
            <Sparkles className="h-3 w-3 text-blue-400" />
            <span>100% Free &amp; Open Source</span>
          </div>

          {/* Heading */}
          <h1 className="animate-fade-up animation-delay-100 text-3xl font-extrabold tracking-tight text-white sm:text-5xl lg:text-6xl leading-[1.1]">
            Everything for your{" "}
            <br className="hidden sm:block" />
            <span className="text-gradient-hero inline-block mt-1">
              PDFs &amp; Files
            </span>{" "}
            <br className="hidden sm:block" />
            in one place
          </h1>

          {/* Subtitle */}
          <p className="animate-fade-up animation-delay-200 mt-4 text-sm sm:text-base leading-6 text-slate-400 max-w-2xl mx-auto">
            Merge, split, compress, and convert PDFs, images, and documents with just a few clicks — no signup required.
          </p>

          {/* CTA */}
          <div className="animate-fade-up animation-delay-300 mt-6 flex items-center justify-center gap-x-4">
            <Link
              href="#tools"
              className="group relative inline-flex items-center gap-2 bg-gradient-brand text-white text-sm sm:text-base font-semibold px-6 py-2.5 sm:px-8 sm:py-3 rounded-full shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.03] transition-all duration-300 shimmer"
            >
              Explore All Tools
              <span
                aria-hidden="true"
                className="transition-transform duration-300 group-hover:translate-x-1"
              >
                →
              </span>
            </Link>
          </div>

          {/* Trust Indicators */}
          <div className="animate-fade-up animation-delay-500 mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto">
            {[
              {
                icon: Zap,
                label: "Lightning Fast",
              },
              {
                icon: Shield,
                label: "100% Secure",
              },
              {
                icon: Sparkles,
                label: "No Signup",
              },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center justify-center gap-2 rounded-lg bg-white/[0.03] border border-white/[0.06] px-3 py-2 backdrop-blur-sm"
              >
                <item.icon className="h-3.5 w-3.5 text-blue-400" />
                <p className="text-xs font-medium text-white">
                  {item.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Bottom gradient fade */}
      <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-950 to-transparent -z-[5]" />
    </div>
  );
}
