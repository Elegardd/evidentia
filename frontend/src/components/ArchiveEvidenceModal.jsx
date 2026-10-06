// eslint-disable-next-line no-unused-vars
import React, { useState } from "react";

export default function ArchiveEvidenceModal({
  isOpen,
  onClose,
  onConfirm,
  evidenceItem,
  isArchiving,
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  // Guard clause: If the modal shouldn't be open, or no item selected, render nothing
  if (!isOpen || !evidenceItem) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError("An archiving justification reason is strictly required.");
      return;
    }
    setError("");
    onConfirm(evidenceItem.id, reason.trim());
    setReason(""); // Reset field state on successful submission
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Premium Glassmorphic Overlay Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/45 backdrop-blur-md transition-opacity duration-300"
        onClick={() => !isArchiving && onClose()}
      />

      {/* Modal Card Chassis */}
      <div className="relative bg-slate-900 border border-slate-800/80 rounded-2xl max-w-md w-full p-6 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] transform scale-100 transition-all duration-200 overflow-hidden">
        {/* Subtle Ambient Amber Alert Glow Strip on top edge */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

        <div className="flex items-start gap-3.5">
          {/* Minimalist Alert Structural Box Indicator (Amber for Archiving status) */}
          <div className="h-10 w-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
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
                d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z"
              />
            </svg>
          </div>

          <div className="space-y-1.5 w-full">
            <h3 className="text-base font-bold text-slate-100 tracking-tight">
              Archive Evidence Registry Entry
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              You are flagging Case No:{" "}
              <span className="text-amber-400 font-mono font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20 text-xs">
                {evidenceItem.case_number}
              </span>{" "}
              Item ID: <span className="text-slate-100 font-semibold">#{evidenceItem.item_number}</span> as archived. This record remains permanently in the system log.
            </p>
          </div>
        </div>

        {/* Audit Form Integration */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-[10px] font-bold tracking-wider text-slate-400 uppercase mb-1.5">
              Reason for Archiving *
            </label>
            <textarea
              required
              disabled={isArchiving}
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder='e.g., "Logged in duplicate", "Entered in Error", "Case Closed"'
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500/50 resize-none transition-all duration-150 disabled:opacity-50"
            />
            {error && (
              <p className="text-[10px] font-semibold text-rose-400 mt-1">
                {error}
              </p>
            )}
          </div>

          {/* Refined Action Control System Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-800/40">
            <button
              type="button"
              disabled={isArchiving}
              onClick={() => {
                setReason("");
                setError("");
                onClose();
              }}
              className="px-4 py-2 bg-transparent hover:bg-slate-800 border border-slate-700/60 text-slate-300 hover:text-slate-100 font-bold rounded-xl text-xs uppercase tracking-wider transition-all duration-150 disabled:opacity-40"
            >
              Abort Action
            </button>

            <button
              type="submit"
              disabled={isArchiving}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-xl text-xs uppercase tracking-wider transition-all duration-150 shadow-lg shadow-amber-950/10 hover:shadow-amber-600/20 disabled:opacity-40 min-w-[125px] text-center"
            >
              {isArchiving ? "Archiving..." : "Confirm Archive"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}