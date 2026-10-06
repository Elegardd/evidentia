// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect } from "react";

export default function EvidentiaFooter() {
  const [systemTime, setSystemTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setSystemTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <footer className="w-full bg-slate-950 border-t border-slate-900/60 text-slate-400 py-4 px-6 mt-auto select-none font-sans tracking-wide">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px]">
        
        {/* LEFT: BRANDING & CORE RIGHTS */}
        <div className="flex items-center gap-2.5 text-center sm:text-left">
          <div className="flex items-center justify-center w-5 h-5 opacity-90">
            <img 
              src="/web_logo.png" 
              alt="Evidentia Logo" 
              className="w-full h-full object-contain filter brightness-95"
              onError={(e) => { e.target.style.display = 'none'; }} 
            />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
            <p className="font-semibold text-slate-200 tracking-wider">
              EviChain
            </p>
            <span className="hidden sm:inline text-slate-700">|</span>
            <p className="text-slate-500 text-[10px]">
              &copy; {new Date().getFullYear()} Republic of the Philippines. All rights reserved.
            </p>
          </div>
        </div>

        {/* CENTER/RIGHT GATHERED: CONTROL & METRICS STATUS */}
        <div className="flex flex-col md:flex-row items-center gap-3 md:gap-5 font-mono text-[10px]">
          
          {/* SECURE CLASSIFICATION NOTICE */}
          <div className="text-amber-600/90 font-medium tracking-widest uppercase flex items-center gap-1.5 border border-amber-500/10 bg-amber-500/[0.01] px-2.5 py-0.5 rounded">
            <span className="w-1 h-1 rounded-full bg-amber-600/80" />
            RESTRICTED LAW ENFORCEMENT SENSITIVE
          </div>

          <span className="hidden md:inline text-slate-800">|</span>

          {/* TIME SYNC LEDGER */}
          <div className="text-slate-500 flex items-center gap-1.5">
            <span className="text-[9px] font-bold text-slate-400 bg-slate-900 border border-slate-800 px-1 py-0.5 rounded tracking-wider uppercase">
              SYSTEM LIVE
            </span>
            <span className="text-slate-400 font-medium font-sans">
              {systemTime.toLocaleDateString()}
            </span>
            <span className="text-slate-700 font-sans">&#8226;</span>
            <span className="text-slate-300 font-bold">
              {systemTime.toLocaleTimeString()}
            </span>
          </div>

        </div>

      </div>
    </footer>
  );
}