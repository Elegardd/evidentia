// eslint-disable-next-line no-unused-vars
import React, { useEffect } from "react";

/**
 * Reusable Global Toast Notification Banner
 * @param {boolean} isVisible - Controls the entry/exit viewport tracking animations
 * @param {string} message - The textual string payload displaying context information
 * @param {string} type - System variation status theme configuration ('error' | 'success' | 'warning' | 'info')
 * @param {function} onClose - Clear/dismiss functional callback context handler mapping
 * @param {number} duration - Auto-dismiss timeout threshold defaults to 5000ms
 */
export const NotificationModal = ({ 
  isVisible, 
  message, 
  type = "error", 
  onClose, 
  duration = 5000 
}) => {
  
  // Track auto-dismiss rules anytime visibility updates
  useEffect(() => {
    if (isVisible && onClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      
      return () => clearTimeout(timer); // Clean thread context allocation stacks
    }
  }, [isVisible, duration, onClose]);

  return (
    <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-md px-4 pointer-events-none transition-all duration-300 ease-out ${
      isVisible ? 'translate-y-0 opacity-100 scale-100' : '-translate-y-4 opacity-0 scale-95 pointer-events-none'
    }`}>
      <div className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl backdrop-blur-xl border shadow-xl shadow-slate-950/40 transition-all duration-200 ${
        type === 'error' 
          ? 'bg-rose-950/40 text-rose-200 border-rose-500/20' 
          : type === 'success'
          ? 'bg-emerald-950/40 text-emerald-200 border-emerald-500/20'
          : type === 'warning'
          ? 'bg-amber-950/40 text-amber-200 border-amber-500/20'
          : 'bg-slate-900/80 text-slate-200 border-slate-800'
      }`}>
        
        {/* Context-Aware Dynamic SVG Icon */}
        <div className="mt-0.5 shrink-0">
          {type === 'error' && (
            <svg className="w-5 h-5 text-rose-500 animate-bounce" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.249-8.25-3.286zm0 13.036h.008v.008H12v-.008z" />
            </svg>
          )}
          {type === 'success' && (
            <svg className="w-5 h-5 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
            </svg>
          )}
          {(type !== 'error' && type !== 'success') && (
            <svg className="w-5 h-5 text-sky-500" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 111.063.852l-.708 2.836a.75.75 0 001.063.852l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
            </svg>
          )}
        </div>

        {/* Text Frame Body Layout */}
        <div className="flex-1 min-w-0">
          <h6 className="text-[10px] font-black uppercase tracking-widest opacity-50">
            System Alert
          </h6>
          <p className="text-[12px] font-semibold leading-relaxed mt-0.5 break-words">
            {message}
          </p>
        </div>

        {/* Manual Dismiss Trigger Action */}
        <button
          type="button"
          onClick={onClose}
          className="text-slate-400 hover:text-white transition-colors duration-150 p-0.5 rounded-lg hover:bg-slate-800/50 shrink-0"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};