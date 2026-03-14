import Link from "next/link";

export function Hero() {
  return (
    <section className="max-w-6xl mx-auto px-6 py-12 md:py-0 flex items-center justify-between min-h-[calc(100vh-4rem)]">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10 items-center w-full">
        <div className="flex flex-col items-start text-left w-full -translate-y-8 md:-translate-y-12">
          <h1 className="text-5xl md:text-6xl lg:text-[4.5rem] font-black leading-[1.05] mb-3 md:mb-5 text-white tracking-tighter animate-fade-up">
            Powerful <br />
            tools for <br />
            <span className="text-gradient-custom luminous-glow inline-block pt-1 pb-1">
              every <br /> document.
            </span>
          </h1>
          <p className="text-lg text-slate-400 max-w-md mb-5 md:mb-6 leading-relaxed font-medium animate-fade-up animation-delay-100">
            Surgical precision in file conversion and management. Architected for peak performance and military-grade security.
          </p>
          <div className="flex gap-4 animate-fade-up animation-delay-200 mt-2">
            <a 
              href="#tools" 
              className="btn-premium group text-white px-8 md:px-10 py-3 md:py-4 rounded-full text-base font-black flex items-center justify-center gap-2 md:gap-3 transition-all hover:scale-105 active:scale-95 shadow-xl shadow-blue-900/40"
            >
              Explore All Tools
              <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </a>
          </div>
        </div>
        
        <div className="relative group animate-fade-up animation-delay-300 w-full max-w-[320px] md:max-w-[340px] lg:max-w-[480px] mx-auto md:ml-auto mt-8 md:mt-0">
          <div className="absolute -inset-8 bg-blue-600/20 blur-3xl rounded-full opacity-30 group-hover:opacity-50 transition-opacity"></div>
          <div className="relative aspect-square w-full rounded-[2rem] overflow-hidden glass-card border-white/5">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-slate-900/40 to-slate-950/60"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex justify-center gap-4 lg:gap-6 p-6 lg:p-12">
                {/* Left Column */}
                <div className="flex flex-col gap-4 lg:gap-6">
                  <div className="w-24 lg:w-32 h-32 lg:h-44 bg-white/[0.03] rounded-2xl lg:rounded-[1.5rem] border border-white/10 flex flex-col items-center justify-center gap-3 lg:gap-5 backdrop-blur-sm transition-transform hover:-translate-y-2 hover:bg-white/[0.06] group">
                    <span className="material-symbols-outlined text-blue-400 text-3xl lg:text-4xl group-hover:scale-110 transition-transform">picture_as_pdf</span>
                    <div className="h-1 w-8 lg:w-10 bg-white/10 rounded-full mt-1"></div>
                  </div>
                  <div className="w-24 lg:w-32 h-32 lg:h-44 bg-white/[0.03] rounded-2xl lg:rounded-[1.5rem] border border-white/10 flex flex-col items-center justify-center gap-3 lg:gap-5 backdrop-blur-sm transition-transform hover:-translate-y-2 hover:bg-white/[0.06] group">
                    <span className="material-symbols-outlined text-cyan-400 text-3xl lg:text-4xl group-hover:scale-110 transition-transform">image</span>
                    <div className="h-1 w-8 lg:w-10 bg-white/10 rounded-full mt-1"></div>
                  </div>
                </div>
                {/* Right Column */}
                <div className="flex flex-col gap-4 lg:gap-6 translate-y-8 lg:translate-y-12">
                  <div className="w-24 lg:w-32 h-32 lg:h-44 bg-white/[0.03] rounded-2xl lg:rounded-[1.5rem] border border-white/10 flex flex-col items-center justify-center gap-3 lg:gap-5 backdrop-blur-sm transition-transform hover:-translate-y-2 hover:bg-white/[0.06] group">
                    <span className="material-symbols-outlined text-blue-500 text-3xl lg:text-4xl group-hover:scale-110 transition-transform" style={{ fontVariationSettings: "'FILL' 1" }}>description</span>
                    <div className="h-1 w-8 lg:w-10 bg-white/10 rounded-full mt-1"></div>
                  </div>
                  <div className="w-24 lg:w-32 h-32 lg:h-44 bg-white/[0.03] rounded-2xl lg:rounded-[1.5rem] border border-white/10 flex flex-col items-center justify-center gap-3 lg:gap-5 backdrop-blur-sm transition-transform hover:-translate-y-2 hover:bg-white/[0.06] group">
                    <span className="material-symbols-outlined text-indigo-400 text-3xl lg:text-4xl group-hover:scale-110 transition-transform">analytics</span>
                    <div className="h-1 w-8 lg:w-10 bg-white/10 rounded-full mt-1"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
