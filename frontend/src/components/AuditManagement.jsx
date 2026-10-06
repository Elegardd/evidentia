// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect } from "react";
import axios from "axios";
import EvidentiaFooter from "./EvidentiaFooter";

// eslint-disable-next-line no-unused-vars
export default function AuditManagement({ onLogout }) {
  // ACTIVE SESSION STATE: Extrats logged-in profile data
  // eslint-disable-next-line no-unused-vars
  const [activeUser] = useState(() => {
    const savedUser = localStorage.getItem("evidentia_session");
    return savedUser
      ? JSON.parse(savedUser)
      : { username: "Admin Operator", role: "admin" };
  });

  // Integrated ledger & audit tracking hooks
  const [isLoadingAudit, setIsLoadingAudit] = useState(false);
  const [auditLogsList, setAuditLogsList] = useState([]);

  // Search filter
  const [auditSearchQuery, setAuditSearchQuery] = useState("");
  const [selectedActionFilter, setSelectedActionFilter] = useState("ALL");

  // Audit page control
  const [auditCurrentPage, setAuditCurrentPage] = useState(1);
  const rowsPerPage = 10;

  // --- Status update modal mutation states
  // const [statusModal, setStatusModal] = useState({
  //     isOpen: false,
  //     evidenceId: null,
  //     caseTitle: "",
  //     currentStatus: "",
  //     targetStatus: "",
  // });

  // Modal notes and notifications
  // const [modalNotes, setModalNotes] = useState("");
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  // Automatic toast feedback alert clear timeout
  useEffect(() => {
    if (!toast.show) return;
    const timer = setTimeout(() => {
      setToast((prev) => ({ ...prev, show: false }));
    }, 4000);
    return () => clearTimeout(timer);
  }, [toast.show]);

  // Function to pull security records from get_audit_logs.php
  const fetchAuditLogs = async () => {
    setIsLoadingAudit(true);
    try {
      // const res = await axios.get("http://localhost:8081/get_audit_logs.php");
      const res = await axios.get(
        "https://steadier-headscarf-maggot.ngrok-free.dev/get_audit_logs.php",
        {
          headers: {
            "ngrok-skip-browser-warning": "ayakerrtssss",
          },
        },
      );

      if (res.data.status === "success") {
        setAuditLogsList(res.data.data || []);
      }
    } catch (err) {
      console.error(
        "Failed connecting to security verification pipeline:",
        err,
      );
    } finally {
      setIsLoadingAudit(false);
    }
  };

  const filteredAuditLogs = auditLogsList.filter((log) => {
    // 1. Action Layer Category Filter
    if (
      selectedActionFilter !== "ALL" &&
      log.action_type !== selectedActionFilter
    ) {
      return false;
    }

    // 2. Global Text Query Filter (Matches description, user, or log ID node)
    const query = auditSearchQuery.toLowerCase();
    const matchId = String(log.id).toLowerCase().includes(query);
    const matchDesc = (log.description || "").toLowerCase().includes(query);
    const matchUser = (log.username || `uid: ${log.user_id}`)
      .toLowerCase()
      .includes(query);

    return matchId || matchDesc || matchUser;
  });

  // Run database sync on mounting cycle
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAuditLogs();
  }, []);

  return (
    /* Layout Fixes Applied:
          - Replaced raw parent layout blocks with the responsive engine layout context wrapper
          - Implemented full scaling limits supporting 7xl up to ultrawide configurations (3xl max width)
          - Created fully fluid responsive layout patterns for controls engine
        */
    <div className="w-full max-w-7xl 2xl:max-w-[1400px] 3xl:max-w-[1600px] mx-auto space-y-8 animate-fade-in">
      {/* HEADER TITLE ZONE */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
          System Activity Audit Log
        </h1>
        <p className="text-slate-400 text-xs sm:text-sm mt-1">
          History log capturing all access layers, entity creations, and
          lifecycle adjustments.
        </p>
      </div>

      {/* CARD MAIN ENGINE */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-2xl p-5 sm:p-8 shadow-xl">
        {/* CONTROLS ENGINE: SEARCH AND LAYER FILTERS */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-stretch sm:items-center mb-6">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            {/* Text Input Node Search */}
            <input
              type="text"
              placeholder="Search logs by operator, keyword, or ID..."
              value={auditSearchQuery}
              onChange={(e) => {
                setAuditSearchQuery(e.target.value);
                setAuditCurrentPage(1);
              }}
              className="bg-slate-950 text-slate-200 placeholder-slate-600 border border-slate-800 rounded-xl px-4 py-3 sm:py-2 font-mono text-xs focus:outline-none focus:border-blue-500 w-full sm:w-72 transition-all"
            />

            {/* Action Type Select Dropdown */}
            <div className="relative w-full sm:w-auto">
              <select
                value={selectedActionFilter}
                onChange={(e) => {
                  setSelectedActionFilter(e.target.value);
                  setAuditCurrentPage(1);
                }}
                className="bg-slate-950 text-slate-300 border border-slate-800 rounded-xl pl-4 pr-10 py-3 sm:py-2 font-mono text-xs cursor-pointer focus:outline-none focus:border-blue-500 transition-all w-full appearance-none"
              >
                <option value="ALL">All Categories</option>
                <option value="USER_LOGIN">Logins</option>
                <option value="FAILED_LOGIN">Failed Access</option>
                <option value="INSERT_EVIDENCE">Item Intake</option>
                <option value="UPDATE_STATUS">Lifecycle Shifts</option>
              </select>
              <div className="absolute inset-y-0 right-4 flex items-center pointer-events-none text-slate-500">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth="2.5"
                  stroke="currentColor"
                  className="w-3.5 h-3.5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M19.5 8.25l-7.5 7.5-7.5-7.5"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 justify-between sm:justify-end">
            <span className="font-mono text-[11px] text-slate-500 uppercase tracking-wider">
              Page {auditCurrentPage} of{" "}
              {Math.ceil(filteredAuditLogs.length / rowsPerPage) || 1}
            </span>
            <button
              onClick={fetchAuditLogs}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/50 border border-slate-800/60 rounded-xl transition-all"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                className={`w-4 h-4 ${isLoadingAudit ? "animate-spin" : ""}`}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                />
              </svg>
            </button>
          </div>
        </div>

        {isLoadingAudit ? (
          <div className="py-12 text-center text-slate-500 font-mono text-xs tracking-wider">
            Querying ledger database registries...
          </div>
        ) : filteredAuditLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-500 font-mono text-xs tracking-wider border border-dashed border-slate-800 rounded-xl">
            No system operational audit indices found matching current query
            boundaries.
          </div>
        ) : (
          <div className="space-y-4">
            {/* DESKTOP VIEW WORKSPACE: Hidden on small devices */}
            <div className="hidden md:block overflow-x-auto border border-slate-800/80 rounded-xl bg-slate-950/40">
              <table className="w-full border-collapse text-left text-sm min-w-[850px]">
                <thead className="bg-slate-900 border-b border-slate-800 font-mono uppercase text-slate-400 text-xs tracking-wider">
                  <tr>
                    <th className="px-6 py-4 font-bold">Log ID</th>
                    <th className="px-6 py-4 font-bold">Action Layer</th>
                    <th className="px-6 py-4 font-bold">Description Metrics</th>
                    <th className="px-6 py-4 font-bold">Operator Profile</th>
                    <th className="px-6 py-4 font-bold text-right">
                      Timestamp
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50 text-slate-300">
                  {filteredAuditLogs
                    .slice(
                      (auditCurrentPage - 1) * rowsPerPage,
                      auditCurrentPage * rowsPerPage,
                    )
                    .map((log) => (
                      <tr
                        key={log.id}
                        className="hover:bg-slate-900/20 transition-colors"
                      >
                        <td className="px-6 py-4 font-mono font-bold text-blue-400">
                          {log.id}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                              log.action_type === "USER_LOGIN"
                                ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                                : log.action_type === "FAILED_LOGIN"
                                  ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                                  : log.action_type === "INSERT_EVIDENCE" ||
                                      log.action_type === "INSERT"
                                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                    : log.action_type === "UPDATE_STATUS" ||
                                        log.action_type === "UPDATE"
                                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                      : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                            }`}
                          >
                            {log.action_type}
                          </span>
                        </td>
                        <td
                          className="px-6 py-4 font-sans text-slate-200 max-w-sm truncate"
                          title={log.description}
                        >
                          {log.description}
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-300">
                          {log.username ? log.username : `UID: #${log.user_id}`}
                        </td>
                        <td className="px-6 py-4 text-right text-slate-500 text-xs font-mono">
                          {log.timestamp}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>

            {/* MOBILE CONTAINER CARDS LAYOUT: Visible exclusively on small displays */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {filteredAuditLogs
                .slice(
                  (auditCurrentPage - 1) * rowsPerPage,
                  auditCurrentPage * rowsPerPage,
                )
                .map((log) => (
                  <div
                    key={log.id}
                    className="bg-slate-950/60 border border-slate-800/80 p-4 rounded-xl space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-blue-400">
                        #{log.id}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                          log.action_type === "USER_LOGIN"
                            ? "bg-purple-500/10 text-purple-400 border-purple-500/20"
                            : log.action_type === "FAILED_LOGIN"
                              ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                              : log.action_type === "INSERT_EVIDENCE" ||
                                  log.action_type === "INSERT"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : log.action_type === "UPDATE_STATUS" ||
                                    log.action_type === "UPDATE"
                                  ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                                  : "bg-blue-500/10 text-blue-400 border-blue-500/20"
                        }`}
                      >
                        {log.action_type}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 leading-relaxed font-sans">
                      {log.description}
                    </p>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-900 text-[11px] font-mono">
                      <span className="text-slate-400 font-bold">
                        {log.username ? log.username : `UID: #${log.user_id}`}
                      </span>
                      <span className="text-slate-600">{log.timestamp}</span>
                    </div>
                  </div>
                ))}
            </div>

            {/* PAGINATION CONTROL BAR */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-800/40">
              <span className="font-mono text-[11px] text-slate-400 order-2 sm:order-1">
                Showing{" "}
                {Math.min(
                  filteredAuditLogs.length,
                  (auditCurrentPage - 1) * rowsPerPage + 1,
                )}
                -
                {Math.min(
                  filteredAuditLogs.length,
                  auditCurrentPage * rowsPerPage,
                )}{" "}
                out of {filteredAuditLogs.length} logs
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end order-1 sm:order-2">
                <button
                  disabled={auditCurrentPage === 1}
                  onClick={() => setAuditCurrentPage((prev) => prev - 1)}
                  className="px-4 py-2 sm:py-1.5 flex-1 sm:flex-none text-center font-mono text-xs text-slate-400 hover:text-white border border-slate-800 rounded-xl bg-slate-950/60 disabled:opacity-30 disabled:hover:text-slate-400 transition-all"
                >
                  &lt; Previous
                </button>
                <button
                  disabled={
                    auditCurrentPage >=
                    Math.ceil(filteredAuditLogs.length / rowsPerPage)
                  }
                  onClick={() => setAuditCurrentPage((prev) => prev + 1)}
                  className="px-4 py-2 sm:py-1.5 flex-1 sm:flex-none text-center font-mono text-xs text-slate-400 hover:text-white border border-slate-800 rounded-xl bg-slate-950/60 disabled:opacity-30 disabled:hover:text-slate-400 transition-all"
                >
                  Next &gt;
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODERN SYSTEM TOAST BANNER */}
      {toast.show && (
        <div className="fixed bottom-5 right-5 z-50 animate-fade-in max-w-sm w-full p-4 rounded-xl border font-mono text-xs backdrop-blur-md shadow-2xl flex items-center gap-3 bg-slate-900/90 border-slate-800">
          <div
            className={`w-2 h-2 rounded-full shrink-0 ${toast.type === "success" ? "bg-emerald-500 animate-pulse" : "bg-rose-500 animate-ping"}`}
          />
          <div className="flex-1 min-w-0">
            <p className="font-bold uppercase tracking-wider text-[10px] text-slate-400">
              {toast.type === "success"
                ? "⚙️ System Broadcast"
                : "⚠️ Interface Alert"}
            </p>
            <p className="text-slate-200 mt-0.5 leading-relaxed truncate">
              {toast.message}
            </p>
          </div>
          <button
            onClick={() => setToast({ ...toast, show: false })}
            className="text-slate-500 hover:text-slate-300 transition-colors font-sans text-sm px-1"
          >
            ✕
          </button>
        </div>
      )}
      <EvidentiaFooter />
    </div>
  );
}
