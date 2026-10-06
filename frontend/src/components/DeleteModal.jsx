// eslint-disable-next-line no-unused-vars
import React from "react";

export default function DeleteModal({
  isOpen,
  onClose,
  onConfirm,
  username,
  isDeleting,
}) {
  // Guard clause: If the modal shouldn't be open, render nothing
  if (!isOpen || !username) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Premium Glassmorphic Overlay Backdrop (Softer, less pitch-black) */}
      <div
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-md transition-opacity duration-300"
        onClick={() => !isDeleting && onClose()}
      />

      {/* Modal Card Chassis */}
      <div className="relative bg-slate-900 border border-slate-800/80 rounded-2xl max-w-md w-full p-6 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] transform scale-100 transition-all duration-200 overflow-hidden">
        {/* Subtle Ambient Red Alert Glow Strip on top edge */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500/40 to-transparent" />

        {/* Adjusted layout gap from 4 to 3.5 */}
        <div className="flex items-start gap-3.5">
          {/* Minimalist Alert Structural Box Indicator */}
          <div className="h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 shrink-0">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2"
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
              />
            </svg>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-base font-bold text-slate-100 tracking-tight">
              Revoke Operational Access Profile
            </h3>
            {/* Swapped text-xs to text-sm & text-slate-400 to text-slate-300 */}
            <p className="text-sm text-slate-300 leading-relaxed">
              Are you absolutely sure you want to permanently delete operational
              profile{" "}
              <span className="text-rose-400 font-mono font-semibold bg-rose-500/10 px-1.5 py-0.5 rounded border border-rose-500/20 text-xs">
                {username}
              </span>
              ? This action will completely purge their credentials from the
              workspace.
            </p>
          </div>
        </div>

        {/* Refined Action Control System Buttons */}
        <div className="mt-2 flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800/40">
          <button
            disabled={isDeleting}
            onClick={onClose}
            className="px-4 py-2 bg-transparent hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-slate-100 font-bold rounded-xl text-xs uppercase tracking-wider transition-all duration-150 disabled:opacity-40"
          >
            Abort Action
          </button>

          <button
            disabled={isDeleting}
            onClick={onConfirm}
            className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all duration-150 shadow-lg shadow-rose-950/10 hover:shadow-rose-600/20 disabled:opacity-40 min-w-[115px] text-center"
          >
            {isDeleting ? "Purging..." : "Confirm Purge"}
          </button>
        </div>
      </div>
    </div>
  );
}
