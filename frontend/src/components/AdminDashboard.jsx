// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect } from "react";

import HomeDashboard from "./HomeDashboard";
import EvidentiaDashboard from "./EvidentiaDashboard";
import UserManagement from "./UserManagement";
import EvidenceCollectorView from "./EvidenceCollectorView";
import EvidenceCustodianView from "./EvidenceCustodianView";
import EvidenceSupervisorView from "./EvidenceSupervisorView";
import AuditManagement from "./AuditManagement";

// import EvidenceCollectorView from "./EvidenceCollectorView";
// import EvidenceCustodianView from "./EvidenceCustodianView";
// import AuditorView from "./AuditorView";

export default function AdminDashboard({ activeUser, onLogout }) {
  // Mobile Navigation Drawer Toggle State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Navigation view window selector - Admins start with full system visibility
  const [currentView, setCurrentView] = useState("home");

  // Added exclusive safety guardrail block. If a non-admin bypasses App.jsx somehow, block rendering.
  if (!activeUser || activeUser.role !== "admin") {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-center">
        <div className="bg-slate-900 border border-red-900/40 rounded-xl p-6 max-w-sm shadow-xl">
          <p className="text-sm font-semibold text-red-400 font-mono">
            ACCESS VIOLATION DETECTED
          </p>
          <p className="text-xs text-slate-400 mt-2">
            Your current security profile lacks clearance to initialize the
            Admin Console workspace.
          </p>
          <button
            onClick={onLogout}
            className="mt-4 px-4 py-2 bg-red-950 text-red-400 border border-red-800 rounded-lg text-xs font-bold hover:bg-red-900 transition-colors"
          >
            Terminate Session Intercept
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans flex flex-col md:flex-row overflow-x-hidden">
      {/* Mobile top nav bar */}
      <header className="w-full bg-slate-900 border-b border-slate-800 p-4 flex items-center justify-between md:hidden sticky top-0 z-50 backdrop-blur-md bg-opacity-90">
        <div>
          <h2 className="text-xl font-black bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent tracking-tight">
            EVICHAIN ADMIN
          </h2>
          <div className="flex flex-col gap-0.5 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <p className="tracking-wide">
                <span className="text-slate-200 font-medium">
                  {activeUser.username}
                </span>
              </p>
            </div>
            <span className="text-[10px] text-emerald-400 pl-3 italic font-mono uppercase tracking-widest">
              {activeUser.sub_role}
            </span>
          </div>
        </div>

        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-slate-400 hover:text-white transition-colors focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            className="w-6 h-6"
          >
            {isMobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            )}
          </svg>
        </button>
      </header>

      {/* Mobile overlay background shade */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Navigation sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 w-60 bg-slate-900 border-r border-slate-800 p-6 flex flex-col justify-between z-50 shrink-0
          transform transition-transform duration-300 ease-in-out
          md:translate-x-0 md:static md:h-screen
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full"}
        `}
      >
        <div>
          <div className="hidden md:block mb-1">
            <h2 className="text-2xl font-black bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent tracking-tight">
              EVICHAIN
            </h2>
          </div>

          <div className="mb-6 space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] shrink-0" />
              <p className="tracking-wide truncate">
                Secure Session:{" "}
                <span className="text-slate-200 font-medium">
                  {activeUser.username}
                </span>
              </p>
            </div>
            <p className="text-[11px] text-emerald-400 font-mono uppercase tracking-widest bg-emerald-950/40 border border-emerald-900/30 px-2 py-0.5 rounded-md inline-block max-w-full truncate">
              {activeUser.sub_role}
            </p>
          </div>

          {/* ALL LINKS UNMASKED: Navigation options */}
          <nav className="space-y-1.5 mt-8 overflow-y-auto max-h-[calc(100vh-250px)] pr-1 scrollbar-thin scrollbar-thumb-slate-800">
            {/* Dashboard */}
            <button
              onClick={() => {
                setCurrentView("home");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-3 border ${
                currentView === "home"
                  ? "bg-blue-600/10 text-blue-400 border-blue-500/20 shadow-lg shadow-blue-950/10"
                  : "bg-transparent text-slate-400 border-transparent hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 .594-.482 1.076-1.076 1.076H4.826c-.594 0-1.076-.482-1.076-1.076v-4.25m16.5 0a2.04 2.04 0 00-.044-.425l-1.68-6.162a2.04 2.04 0 00-1.965-1.503H6.365c-.883 0-1.656.565-1.965 1.503l-1.68 6.162a2.04 2.04 0 00-.044.425m16.5 0a2.04 2.04 0 01-1.076 1.833h-2.14a2.039 2.039 0 01-1.834-1.183l-.332-.746a2.039 2.039 0 00-1.834-1.183h-3.414a2.039 2.039 0 00-1.834 1.183l-.332.746a2.039 2.039 0 01-1.834 1.183h-2.14A2.04 2.04 0 013.75 14.15m9.462-10.15H10.5a1.5 1.5 0 00-1.5 1.5v2.25A1.5 1.5 0 0010.5 9.3h2.712a1.5 1.5 0 001.5-1.5V5.5a1.5 1.5 0 00-1.5-1.5z" />
              </svg>
              Dashboard
            </button>

            {/* Manage Evidence */}
            <button
              onClick={() => {
                setCurrentView("evidence");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-3 border ${
                currentView === "evidence"
                  ? "bg-blue-600/10 text-blue-400 border-blue-500/20 shadow-lg shadow-blue-950/10"
                  : "bg-transparent text-slate-400 border-transparent hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
              Manage Evidence
            </button>

            {/* Submenu Divider */}
            <div className="pt-2 pb-1">
              <hr className="border-slate-800/80 my-1" />
              <span className="text-[10px] uppercase font-mono text-slate-500 tracking-wider px-2">Role Views</span>
            </div>

            {/* Collector View */}
            <button
              onClick={() => {
                setCurrentView("collector");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left pl-6 pr-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-3 border ${
                currentView === "collector"
                  ? "bg-blue-600/10 text-blue-400 border-blue-500/20 shadow-lg shadow-blue-950/10"
                  : "bg-transparent text-slate-400 border-transparent hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
              Collector View
            </button>

            {/* Custodian View */}
            <button
              onClick={() => {
                setCurrentView("custodian");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left pl-6 pr-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-3 border ${
                currentView === "custodian"
                  ? "bg-blue-600/10 text-blue-400 border-blue-500/20 shadow-lg shadow-blue-950/10"
                  : "bg-transparent text-slate-400 border-transparent hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 10V11.25M6 19.5h12a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 10.5v6.75A2.25 2.25 0 006 19.5z" />
              </svg>
              Custodian View
            </button>

            {/* Supervisor View */}
            <button
              onClick={() => {
                setCurrentView("supervisor");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left pl-6 pr-4 py-2 rounded-xl font-bold text-xs transition-all flex items-center gap-3 border ${
                currentView === "supervisor"
                  ? "bg-blue-600/10 text-blue-400 border-blue-500/20 shadow-lg shadow-blue-950/10"
                  : "bg-transparent text-slate-400 border-transparent hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.25 2.25 0 0115 23.25H4.5A2.25 2.25 0 012.25 21V6A2.25 2.25 0 014.5 3.75h6.75m0 0h4.5a2.25 2.25 0 012.25 2.25v7.5m-9-9V12m0-8.25l3.75 3.75" />
              </svg>
              Supervisor View
            </button>

            {/* Submenu Divider */}
            <div className="pt-2 pb-1">
              <hr className="border-slate-800/80 my-1" />
            </div>

            {/* Manage Identity */}
            <button
              onClick={() => {
                setCurrentView("identity");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-3 border ${
                currentView === "identity"
                  ? "bg-blue-600/10 text-blue-400 border-blue-500/20 shadow-lg shadow-blue-950/10"
                  : "bg-transparent text-slate-400 border-transparent hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-9-4.5h12a2.25 2.25 0 012.25 2.25v10.5A2.25 2.25 0 0118 18.75H6a2.25 2.25 0 01-2.25-2.25V5.25A2.25 2.25 0 016 3.75z" />
              </svg>
              Manage Identity
            </button>

            {/* Manage Audit */}
            <button
              onClick={() => {
                setCurrentView("audit");
                setIsMobileMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 rounded-xl font-bold text-xs transition-all flex items-center gap-3 border ${
                currentView === "audit"
                  ? "bg-blue-600/10 text-blue-400 border-blue-500/20 shadow-lg shadow-blue-950/10"
                  : "bg-transparent text-slate-400 border-transparent hover:bg-slate-800/50 hover:text-slate-200"
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
              </svg>
              Manage Audit
            </button>
          </nav>
        </div>

        <button
          onClick={() => {
            setIsMobileMenuOpen(false);
            onLogout();
          }}
          className="mt-4 w-full py-2.5 bg-slate-950 hover:bg-red-950/40 border border-slate-800 hover:border-red-500/30 text-slate-400 hover:text-red-400 font-bold rounded-xl text-xs uppercase tracking-wider transition-all duration-150 flex items-center justify-center gap-2"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="2"
            stroke="currentColor"
            className="w-4 h-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
            />
          </svg>
          Logout
        </button>
      </aside>

      {/* CORE WORKSPACE CONTAINER */}
      <main className="flex-1 min-w-0 md:h-screen md:overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
        {currentView === "home" && <HomeDashboard activeUser={activeUser} />}
        {currentView === "evidence" && <EvidentiaDashboard activeUser={activeUser} />}
        {currentView === "identity" && <UserManagement activeUser={activeUser} />}
        {currentView === "collector" && <EvidenceCollectorView activeUser={activeUser} />}
        {currentView === "custodian" && <EvidenceCustodianView activeUser={activeUser} />}
        {currentView === "supervisor" && <EvidenceSupervisorView activeUser={activeUser} />}
        {currentView === "audit" && <AuditManagement activeUser={activeUser} />}
      </main>
    </div>
  );
}