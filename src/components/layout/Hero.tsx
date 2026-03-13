import Link from "next/link";

export function Hero() {
  return (
    <section className="max-w-5xl mx-auto px-6 mb-16 pt-16 md:pt-24 lg:pt-32 min-h-[calc(100vh-8rem)] flex items-center">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center w-full">
        <div className="flex flex-col items-start text-left w-full">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black leading-[1.1] mb-6 md:mb-8 text-white tracking-tighter animate-fade-up">
            Powerful tools for <br />
            <span className="text-gradient-custom luminous-glow leading-[1.2] inline-block pb-2">every document.</span>
          </h1>
          <p className="text-lg text-slate-400 max-w-md mb-8 md:mb-10 leading-relaxed font-medium animate-fade-up animation-delay-100">
            Surgical precision in file conversion and management. Architected for peak performance and military-grade security.
          </p>
          <div className="flex gap-4 animate-fade-up animation-delay-200 mt-8">
            <a 
              href="#tools" 
              className="btn-premium group text-white px-8 md:px-10 py-3 md:py-4 rounded-full text-base font-black flex items-center justify-center gap-2 md:gap-3 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-blue-900/40"
            >
              Explore All Tools
              <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </a>
          </div>
        </div>
        
        <div className="relative group animate-fade-up animation-delay-300 w-full max-w-[320px] lg:max-w-[500px] mx-auto lg:ml-auto mt-12 lg:mt-0">
          <div className="absolute -inset-8 bg-blue-600/20 blur-3xl rounded-full opacity-30 group-hover:opacity-50 transition-opacity"></div>
          <div className="relative aspect-square w-full rounded-[2rem] overflow-hidden glass-card border-white/5">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-slate-900/40 to-slate-950/60"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="grid grid-cols-2 gap-4 md:gap-6 p-8 md:p-12">
                <div className="w-20 md:w-28 h-28 md:h-36 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center justify-center gap-2 md:gap-3 backdrop-blur-sm transition-transform hover:scale-105">
                  <span className="material-symbols-outlined text-blue-400 text-3xl md:text-4xl">picture_as_pdf</span>
                  <div className="h-1 w-10 md:w-14 bg-white/10 rounded-full mt-2"></div>
                </div>
                <div className="w-20 md:w-28 h-28 md:h-36 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center justify-center gap-2 md:gap-3 backdrop-blur-sm mt-6 md:mt-10 transition-transform hover:scale-105">
                  <span className="material-symbols-outlined text-blue-500 text-3xl md:text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
                  <div className="h-1 w-10 md:w-14 bg-white/10 rounded-full mt-2"></div>
                </div>
                <div className="w-20 md:w-28 h-28 md:h-36 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center justify-center gap-2 md:gap-3 backdrop-blur-sm -mt-4 md:-mt-6 transition-transform hover:scale-105">
                  <span className="material-symbols-outlined text-cyan-400 text-3xl md:text-4xl">image</span>
                  <div className="h-1 w-10 md:w-14 bg-white/10 rounded-full mt-2"></div>
                </div>
                <div className="w-20 md:w-28 h-28 md:h-36 bg-white/5 rounded-2xl border border-white/10 flex flex-col items-center justify-center gap-2 md:gap-3 backdrop-blur-sm mt-2 md:mt-4 transition-transform hover:scale-105">
                  <span className="material-symbols-outlined text-indigo-400 text-3xl md:text-4xl">analytics</span>
                  <div className="h-1 w-10 md:w-14 bg-white/10 rounded-full mt-2"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
