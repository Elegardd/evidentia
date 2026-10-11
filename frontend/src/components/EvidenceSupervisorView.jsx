// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import EvidentiaFooter from "./EvidentiaFooter";
import { NotificationModal } from "./NotificationModal";
// import Spline from "@splinetool/react-spline";

import SignaturePadModal from "./SignaturePadModal";

const BENGUET_AGENCIES = [
  "Baguio City Police Office (BCPO) - Main",
  "BCPO - Station 1 (Naguilian)",
  "BCPO - Station 2 (Camdas)",
  "BCPO - Station 3 (Pacdal)",
  "BCPO - Station 4 (Loakan)",
  "BCPO - Station 5 (Legarda)",
  "BCPO - Station 6 (Aurora Hill)",
  "BCPO - Station 7 (Abanao)",
  "BCPO - Station 8 (Kennon)",
  "BCPO - Station 9 (Irisan)",
  "BCPO - Station 10 (Marcos Highway)",
  "La Trinidad Municipal Police Station (LTMPS)",
  "Benguet Provincial Police Office (BPPO) - Camp Dangwa",
  "National Bureau of Investigation - Cordillera (NBI-CAR)",
  "PDEA - Cordillera Administrative Region (PDEA-CAR)",
  "CIDG - Benguet Provincial Field Unit",
  "PNP Forensic Group - Regional Forensic Unit (RFU-CAR)",
];

export default function EvidenceSupervisorView({ currentUser }) {
  const [loading, setLoading] = useState(false);
  const [evidenceList, setEvidenceList] = useState([]);
  const [stationPersonnel, setStationPersonnel] = useState([]);
  const [activePrintRow, setActivePrintRow] = useState(null);

  // Sets the target capacity limit per view context
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Search and filtering metadata
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAgency, setFilterAgency] = useState("");
  const [filterStage, setFilterStage] = useState("");

  // Integration of workflow modal workspace states
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [selectedEvidenceItem, setSelectedEvidenceItem] = useState(null);
  const [turnoverRemarks, setTurnoverRemarks] = useState("");
  const [handshakeTargetCustodian, setHandshakeTargetCustodian] = useState("");
  const [handshakeTargetSupervisor, setHandshakeTargetSupervisor] = useState("");

  const [toast, setToast] = useState({
    isVisible: false,
    message: "",
    type: "error",
  });
  const triggerToast = (message, type = "error") => {
    setToast({ isVisible: true, message, type });
  };

  // Alert feedback banners
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  // const [toast, setToast] = useState({ isVisible: false, message: "" });

  const fetchEvidenceData = useCallback(async () => {
    setLoading(true);
    try {
      // const url = "http://localhost:8081/intake_triage.php";
      const url = "https://steadier-headscarf-maggot.ngrok-free.dev/intake_triage.php";
      const response = await axios.get(url, {
        headers: { "ngrok-skip-browser-warning": "true" },
      });
      if (response.data && response.data.status === "success") {
        setEvidenceList(response.data.records || []);
      }
    } catch (err) {
      console.error(err);
      setMessageType("error");
      setMessage(
        "Failed to sync structural registry rows via Ngrok Gateway endpoint.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPersonnelData = useCallback(async () => {
    try {
      // const url = "http://localhost:8081/get_users.php?action=personnel";
      const url = "https://steadier-headscarf-maggot.ngrok-free.dev/get_users.php?action=personnel";
      const response = await axios.get(url, {
        headers: { "ngrok-skip-browser-warning": "true" },
      });
      if (response.data && response.data.status === "success") {
        setStationPersonnel(response.data.personnel || []);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEvidenceData();
    fetchPersonnelData();
  }, [fetchEvidenceData, fetchPersonnelData]);

  // Securing signature execution, signature pool
  const executeSupervisorApproval = async (signatureBase64String) => {
    if (!selectedEvidenceItem) return;
    setLoading(true);
    try {
      const payload = {
        ...selectedEvidenceItem,
        noted_by:
          handshakeTargetSupervisor ||
          currentUser?.fullName ||
          "Station Supervisor",
        supervisor_signature_hash: signatureBase64String,
      };

      // const url = "http://localhost:8081/intake_triage.php";
      const url = "https://steadier-headscarf-maggot.ngrok-free.dev/intake_triage.php";
      const response = await axios.put(url, payload);

      if (response.data?.status === "success") {
        triggerToast("Supervisor digital counter-sign saved securely.", "success");

        setIsSignatureModalOpen(false);
        fetchEvidenceData();
      } else {
        setMessageType("error");
        triggerToast(
          response.data?.message ||
          "Failed to commit signature block verification.",
        );
      }
    } catch (err) {
      console.error(err);
      setMessageType("error");
      triggerToast("Network connection error updating custody approval status.");
    } finally {
      setLoading(false);
    }
  };

  const executeCourtDispatch = async (item) => {
    setLoading(true);
    try {
      const payload = {
        ...item,
        workflow_stage: "In Court",
        turnover_remarks: `[Authorized Court Dispatch] - Released under supervision of ${currentUser?.fullName || "Station Supervisor"} for active case presentation.`,
      };

      const url = "https://steadier-headscarf-maggot.ngrok-free.dev/intake_triage.php";
      const response = await axios.put(url, payload);

      if (response.data?.status === "success") {
        triggerToast("Evidence status securely updated to 'In Court'.", "success");
        fetchEvidenceData();
      } else {
        triggerToast(response.data?.message || "Failed to update court log state.");
      }
    } catch (err) {
      console.error(err);
      triggerToast("Network gateway error during court transition execution.");
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = evidenceList.filter((item) => {
    // Convert the search term to lowercase once for better performance
    const target = searchTerm.toLowerCase();

    const matchesSearch =
      searchTerm === "" || // If search is empty, match everything
      (item.case_number || "").toLowerCase().includes(target) ||
      (item.evidence_id || "").toLowerCase().includes(target) ||
      (item.evidence_type || "").toLowerCase().includes(target) ||
      (item.collector_name || "").toLowerCase().includes(target) ||
      // --- NEW EXPANDED DATABASE FIELDS BELOW ---
      (item.case_title || "").toLowerCase().includes(target) ||
      (item.suspect_names || "").toLowerCase().includes(target) ||
      (item.investigating_agency || "").toLowerCase().includes(target) ||
      (item.unit_descriptor || "").toLowerCase().includes(target) ||
      (item.physical_description || "").toLowerCase().includes(target) ||
      (item.received_by_name || "").toLowerCase().includes(target) ||
      (item.noted_by || "").toLowerCase().includes(target) ||
      (item.workflow_stage || "").toLowerCase().includes(target) ||
      (item.turnover_remarks || "").toLowerCase().includes(target) ||
      (item.condition_received || "").toLowerCase().includes(target) ||
      (item.date_collected || "").toLowerCase().includes(target);

    const matchesAgency =
      filterAgency === "" || item.investigating_agency === filterAgency;
    const matchesStage =
      filterStage === "" || item.workflow_stage === filterStage;

    return matchesSearch && matchesAgency && matchesStage;
  });

  // const filteredItems = evidenceList.filter((item) => {
  //   const matchesSearch =
  //     (item.case_number || "")
  //       .toLowerCase()
  //       .includes(searchTerm.toLowerCase()) ||
  //     (item.evidence_id || "")
  //       .toLowerCase()
  //       .includes(searchTerm.toLowerCase()) ||
  //     (item.evidence_type || "")
  //       .toLowerCase()
  //       .includes(searchTerm.toLowerCase()) ||
  //     (item.collector_name || "")
  //       .toLowerCase()
  //       .includes(searchTerm.toLowerCase());

  //   const matchesAgency =
  //     filterAgency === "" || item.investigating_agency === filterAgency;
  //   const matchesStage =
  //     filterStage === "" || item.workflow_stage === filterStage;

  //   return matchesSearch && matchesAgency && matchesStage;
  // });

  const formatEvidenceId = (item) => {
    if (item?.evidence_id?.startsWith("EV2026")) return item.evidence_id;
    return `EV-2026-${String(item?.id || 0).padStart(4, "0")}`;
  };

  // const formatEvidenceId = (item) => {
  //     if (!item) return "";
  //     if (item.evidence_id && !item.evidence_id.startsWith("EV-2026-")) {
  //         return item.evidence_id;
  //     }
  //     return `EV-2026-${String(item.id || 0).padStart(4, "0")}`;
  // };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto text-slate-100 min-h-screen">
      {/* Toast Alert Popup Layout */}
      {toast.isVisible && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 border border-emerald-500 text-white px-4 py-3 rounded-xl shadow-2xl font-bold text-xs tracking-wide animate-bounce">
          {toast.message}
        </div>
      )}

      {/* View Header Dashboard Panel Title */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-slate-800 pb-5 gap-4">
        <div>
          <h1 className="text-xl font-black uppercase tracking-wider bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
            Supervisor Audit Control Registry
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            Reviewing chain of custody states, tracking evidentiary integrity
            validation, and authorizing storage logs.
          </p>
        </div>
        {/* <div className="flex items-center gap-2 self-start md:self-auto bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-[11px] font-mono">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              Active Supervisor Profile: <span className="font-bold text-slate-200">{currentUser?.fullName || "Administrator"}</span>
            </div> */}
      </div>

      {/* Banner Interface Logs Messages */}
      {message && (
        <div className={`p-3 text-xs font-bold rounded-lg ${messageType === "error" ? "bg-red-950/40 border border-red-900/60 text-red-400" : "bg-emerald-950/40 border border-emerald-900/60 text-emerald-400"}`}>
          {message}
        </div>
      )}

      {/* Search Filters Execution Management Deck Bar */}
      <div className="relative z-10 grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/40 backdrop-blur-md p-4 border border-slate-800/40 rounded-2xl shadow-xl shadow-black/10">
        {/* Parameter Input Filter */}
        <div className="relative flex items-center">
          <span className="absolute left-3.5 text-slate-500 pointer-events-none">
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
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search records parameters..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/60 hover:bg-slate-950/80 border border-slate-800/80 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-200 placeholder:text-slate-500 font-medium tracking-wide focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-all duration-200"
          />
        </div>

        {/* Station/Agency Dropdown Filter */}
        <div className="relative flex items-center">
          <span className="absolute left-3.5 text-slate-500 pointer-events-none">
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
                d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 1115 0z"
              />
            </svg>
          </span>
          <select
            value={filterAgency}
            onChange={(e) => setFilterAgency(e.target.value)}
            className="w-full appearance-none bg-slate-950/60 hover:bg-slate-950/80 border border-slate-800/80 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-300 font-medium tracking-wide focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-all duration-200 cursor-pointer"
          >
            <option value="" className="bg-slate-900">
              All Investigating Stations
            </option>
            {BENGUET_AGENCIES.map((st) => (
              <option key={st} value={st} className="bg-slate-900">
                {st}
              </option>
            ))}
          </select>
          <span className="absolute right-3.5 text-slate-500 pointer-events-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              stroke="currentColor"
              className="w-3 h-3"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
              />
            </svg>
          </span>
        </div>

        {/* Workflow Phase Dropdown Filter */}
        <div className="relative flex items-center">
          <span className="absolute left-3.5 text-slate-500 pointer-events-none">
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
                d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
              />
            </svg>
          </span>
          <select
            value={filterStage}
            onChange={(e) => setFilterStage(e.target.value)}
            className="w-full appearance-none bg-slate-950/60 hover:bg-slate-950/80 border border-slate-800/80 rounded-xl pl-10 pr-10 py-2.5 text-xs text-slate-300 font-medium tracking-wide focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/10 transition-all duration-200 cursor-pointer"
          >
            <option value="" className="bg-slate-900">
              All Workflow Phases
            </option>
            <option value="On Field" className="bg-slate-900">
              On Field Log
            </option>
            <option value="Turnover Pending" className="bg-slate-900">
              Handover Handshake Pending
            </option>
            <option value="In Storage" className="bg-slate-900">
              Secured In Vault Storage
            </option>
            <option value="In Court" className="bg-slate-900">
              Released In Court Processing
            </option>
            <option value="Archived" className="bg-slate-900">
              Archived / Purged Logs
            </option>
          </select>
          <span className="absolute right-3.5 text-slate-500 pointer-events-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth="2.5"
              stroke="currentColor"
              className="w-3 h-3"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19.5 8.25l-7.5 7.5-7.5-7.5"
              />
            </svg>
          </span>
        </div>
      </div>

      {/* MAIN DATA ARCHITECTURE CONTROL LOG INDEX GRID BOX */}
      <div className="relative z-10 bg-slate-950/40 backdrop-blur-md border border-slate-800/60 rounded-2xl shadow-2xl overflow-hidden">
        {/* Scroll bar UI */}
        <div className="w-full overflow-x-auto scrollbar-thin scrollbar-track-slate-950 scrollbar-thumb-slate-800 hover:scrollbar-thumb-amber-500/40 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-slate-950/40 [&::-webkit-scrollbar-thumb]:bg-slate-800/80 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-amber-500/30 transition-all duration-300">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-900/50 text-[10px] text-slate-400 uppercase tracking-widest font-bold border-b border-slate-800/80">
                <th className="p-4 font-semibold">Reference ID</th>
                <th className="p-4 font-semibold">Case Information Context</th>
                <th className="p-4 font-semibold">
                  Item Classification Specifications
                </th>
                <th className="p-4 font-semibold">
                  Chain Tracker Verification Roles
                </th>
                <th className="p-4 text-right font-semibold">
                  Operational Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-900/60 block md:table-row-group">
              {loading ? (
                <tr className="block md:table-row">
                  <td
                    colSpan="5"
                    className="p-12 text-center text-slate-500 font-medium animate-pulse block md:table-cell"
                  >
                    <div className="flex flex-col items-center justify-center gap-3">
                      <svg
                        className="animate-spin h-5 w-5 text-amber-500"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      <span className="tracking-wide text-xs">
                        Refreshing internal evidence ledger caches, please stand
                        by...
                      </span>
                    </div>
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr className="block md:table-row">
                  <td
                    colSpan="5"
                    className="p-12 text-center text-slate-500 font-medium italic block md:table-cell"
                  >
                    <div className="flex flex-col items-center justify-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth="1.5"
                        stroke="currentColor"
                        className="w-6 h-6 text-slate-600"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m6 4.125l2.25 2.25m0 0l2.25 2.25m-2.25-2.25l-2.25 2.25m2.25-2.25l2.25-2.25M3.75 7.5A2.25 2.25 0 016 5.25h12a2.25 2.25 0 012.25 2.25m-18 0h18"
                        />
                      </svg>
                      <span className="text-xs text-slate-500 tracking-wide">
                        No verified chain of custody records matching parameters
                        found.
                      </span>
                    </div>
                  </td>
                </tr>
              ) : (
                /* CLIENT-SIDE ARRAYS PAGINATION COMPUTE SLICE PIPELINE */
                filteredItems
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-900/40 transition-all duration-200 block md:table-row border-b border-slate-900 md:border-none p-4 md:p-0 space-y-3 md:space-y-0"
                    >
                      {/* Reference ID Column */}
                      <td className="p-0 md:p-4 align-top font-mono block md:table-cell">
                        <div className="flex items-center justify-between md:block">
                          <span className="text-[10px] uppercase font-bold text-slate-500 md:hidden">
                            Ref ID
                          </span>
                          <div>
                            <span className="block font-bold text-amber-400 text-[13px] tracking-wide">
                              {formatEvidenceId(item)}
                            </span>
                            <span className="block text-[10px] text-slate-500 font-medium tracking-tight mt-0.5 uppercase">
                              {item.case_number}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Case Info Context Column */}
                      <td className="p-0 md:p-4 align-top block md:table-cell">
                        <div className="flex flex-col md:block">
                          <span className="text-[10px] uppercase font-bold text-slate-500 mb-1 md:hidden">
                            Case Info
                          </span>
                          <div className="font-semibold text-slate-200 uppercase tracking-wide text-[12px]">
                            {item.case_title || "Unspecified Case Title Log"}
                          </div>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 font-medium">
                            <span className="text-slate-500 text-[10px] uppercase tracking-wider">
                              Station:
                            </span>
                            <span className="text-slate-300">
                              {item.investigating_agency}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Item Specifications Column */}
                      <td className="p-0 md:p-4 align-top block md:table-cell">
                        <div className="flex flex-col md:block">
                          <span className="text-[10px] uppercase font-bold text-slate-500 mb-1 md:hidden">
                            Specifications
                          </span>
                          <div className="font-semibold text-slate-200 text-[12px] flex items-center gap-1.5">
                            <span className="inline-flex items-center justify-center bg-slate-900 border border-slate-800 text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded">
                              {item.quantity}
                            </span>
                            <span>{item.evidence_type}</span>
                          </div>
                          <div className="text-[11px] font-mono text-slate-400 max-w-xs truncate italic mt-1 pl-1 border-l border-slate-800">
                            {item.unit_descriptor ||
                              item.physical_description ||
                              "No descriptions attached."}
                          </div>
                        </div>
                      </td>

                      {/* Workflow & Verification Roles Column */}
                      <td className="p-0 md:p-4 align-top block md:table-cell">
                        <div className="flex flex-col md:block space-y-2 md:space-y-1.5">
                          <div className="flex items-center justify-between md:justify-start gap-2">
                            <span className="text-[10px] uppercase font-bold text-slate-500 md:hidden">
                              Verification
                            </span>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md ring-1 ring-inset ${item.workflow_stage === "In Storage"
                                ? "bg-emerald-500/10 text-emerald-400 ring-emerald-500/20"
                                : item.workflow_stage === "Turnover Pending"
                                  ? "bg-blue-500/10 text-blue-400 ring-blue-500/20"
                                  : item.workflow_stage === "In Court"
                                    ? "bg-purple-500/10 text-purple-400 ring-purple-500/20"
                                    : item.workflow_stage === "Archived"
                                      ? "bg-red-500/10 text-red-400 ring-red-500/20"
                                      : "bg-amber-500/10 text-amber-400 ring-amber-500/20"
                                }`}
                            >
                              <span
                                className={`w-1 h-1 rounded-full mr-1.5 ${item.workflow_stage === "In Storage"
                                  ? "bg-emerald-400"
                                  : item.workflow_stage === "Turnover Pending"
                                    ? "bg-blue-400"
                                    : item.workflow_stage === "In Court"
                                      ? "bg-purple-400"
                                      : item.workflow_stage === "Archived"
                                        ? "bg-red-400"
                                        : "bg-amber-400"
                                  }`}
                              />
                              {item.workflow_stage || "On Field"}
                            </span>
                          </div>

                          <div className="text-[11px] space-y-0.5 text-slate-300 font-medium">
                            <div className="flex justify-between md:justify-start gap-4">
                              <span className="text-slate-500 text-[10px] uppercase tracking-wider w-16">
                                Collector:
                              </span>{" "}
                              {item.collector_name}
                            </div>
                            {item.received_by_name && (
                              <div className="flex justify-between md:justify-start gap-4">
                                <span className="text-slate-500 text-[10px] uppercase tracking-wider w-16">
                                  Custodian:
                                </span>{" "}
                                {item.received_by_name}
                              </div>
                            )}
                            <div className="flex justify-between md:justify-start items-center gap-4 pt-0.5">
                              <span className="text-slate-500 text-[10px] uppercase tracking-wider w-16">
                                Signoff:
                              </span>
                              {item.supervisor_signature_hash ? (
                                <span className="inline-flex items-center gap-1 text-emerald-400 text-[10px] font-bold bg-emerald-500/5 px-1.5 py-0.5 rounded border border-emerald-500/10">
                                  <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 20 20"
                                    fill="currentColor"
                                    className="w-3 h-3"
                                  >
                                    <path
                                      fillRule="evenodd"
                                      d="M16.403 12.652a3 3 0 000-5.304 3 3 0 00-3.75-3.751 3 3 0 00-5.305 0 3 3 0 00-3.751 3.75 3 3 0 000 5.305 3 3 0 003.75 3.751 3 3 0 005.305 0 3 3 0 003.751-3.75zm-7.446-2.603a.75.75 0 00-1.164.946l1.25 1.5a.75.75 0 001.164-.006l2.5-3a.75.75 0 10-1.154-.958l-1.926 2.312-?.67-.804z"
                                      clipRule="evenodd"
                                    />
                                  </svg>
                                  Authenticated
                                </span>
                              ) : (
                                <span className="text-amber-500/90 text-[10px] font-medium italic">
                                  Pending Signature Verification
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Action Operations Column */}
                      <td className="p-0 md:p-4 align-middle text-right block md:table-cell pt-2 md:pt-4">
                        <div className="flex flex-row md:justify-end items-center gap-2 font-semibold">
                          {item.workflow_stage === "In Storage" &&
                            !item.supervisor_signature_hash && (
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedEvidenceItem(item);
                                  setTurnoverRemarks(
                                    item.turnover_remarks ||
                                    "[Supervisor Audit Verification Signature]",
                                  );
                                  setHandshakeTargetCustodian(
                                    item.received_by_name || "",
                                  );
                                  setHandshakeTargetSupervisor(
                                    currentUser?.fullName || "",
                                  );
                                  setIsSignatureModalOpen(true);
                                }}
                                className="flex-1 md:flex-none justify-center inline-flex items-center gap-1.5 whitespace-nowrap bg-amber-600 hover:bg-amber-500 text-white px-3 py-2 text-xs rounded-xl transition-all duration-200 font-bold active:scale-[0.98] shadow-lg shadow-amber-950/20"
                              >
                                Authorize
                              </button>
                            )}

                          {item.workflow_stage === "In Storage" && item.supervisor_signature_hash && (
                            <button
                              type="button"
                              onClick={() => executeCourtDispatch(item)}
                              className="flex-1 md:flex-none justify-center inline-flex items-center gap-1.5 whitespace-nowrap bg-purple-600 hover:bg-purple-500 text-white px-3 py-2 text-xs rounded-xl transition-all duration-200 font-bold active:scale-[0.98] shadow-lg shadow-purple-950/20"
                            >
                              Dispatch to Court
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setActivePrintRow(item)}
                            className="flex-1 md:flex-none justify-center inline-flex items-center gap-1.5 whitespace-nowrap bg-slate-900/80 hover:bg-slate-800 text-slate-200 border border-slate-800 hover:border-slate-700 px-3 py-2 text-xs rounded-xl transition-all duration-200 font-bold active:scale-[0.98]"
                          >
                            View Form Slip
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>

        {/* Integrating pagination panel */}
        {!loading && filteredItems.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-950/60 border-t border-slate-900 gap-4">
            <div className="text-[11px] text-slate-400 font-medium">
              Showing{" "}
              <span className="font-bold text-slate-200">
                {Math.min((currentPage - 1) * itemsPerPage + 1, filteredItems.length)}
              </span>{" "}
              to{" "}
              <span className="font-bold text-slate-200">
                {Math.min(currentPage * itemsPerPage, filteredItems.length)}
              </span>{" "}
              of <span className="font-bold text-amber-500">{filteredItems.length}</span> audit records
            </div>

            <div className="flex items-center gap-1.5">
              {/* Previous Button */}
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className="inline-flex items-center justify-center p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:hover:text-slate-400 transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                </svg>
              </button>

              {/* Dynamic Number Map Cluster */}
              {Array.from({ length: Math.ceil(filteredItems.length / itemsPerPage) }).map((_, index) => {
                const pageNum = index + 1;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`min-w-[32px] h-8 text-[11px] font-bold rounded-xl transition-all duration-200 border ${currentPage === pageNum
                      ? "bg-amber-500 border-amber-400 text-slate-950 shadow-md shadow-amber-500/10"
                      : "bg-slate-900/60 hover:bg-slate-900 border-slate-800 text-slate-300 hover:text-white"
                      }`}
                  >
                    {pageNum}
                  </button>
                );
              })}

              {/* Next Button */}
              <button
                type="button"
                disabled={currentPage === Math.ceil(filteredItems.length / itemsPerPage)}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(filteredItems.length / itemsPerPage)))}
                className="inline-flex items-center justify-center p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:hover:text-slate-400 transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Shared modal canvas handshake */}
      {isSignatureModalOpen && (
        <SignaturePadModal
          isOpen={isSignatureModalOpen}
          onClose={() => {
            setIsSignatureModalOpen(false);
            setSelectedEvidenceItem(null);
          }}
          currentUser={currentUser}
          evidenceItem={selectedEvidenceItem}
          turnoverRemarks={turnoverRemarks}
          setTurnoverRemarks={setTurnoverRemarks}
          stationPersonnel={stationPersonnel}
          handshakeTargetCustodian={handshakeTargetCustodian}
          setHandshakeTargetCustodian={setHandshakeTargetCustodian}
          handshakeTargetSupervisor={handshakeTargetSupervisor}
          setHandshakeTargetSupervisor={setHandshakeTargetSupervisor}
          onSave={(signatureData) => {
            executeSupervisorApproval(signatureData);
          }}
        />
      )}

      {/* Print row */}
      {activePrintRow && (() => {
        // Safely parse witness names splitting on commas
        const witnessList = activePrintRow.witness_names
          ? activePrintRow.witness_names.split(',').map(name => name.trim()).filter(Boolean)
          : [];

        return (
          <div className="print-portal-wrapper fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto flex justify-center p-0 sm:p-6 print:absolute print:inset-0 print:bg-white print:block print:z-[99999]">
            <style dangerouslySetInnerHTML={{
              __html: `
    @media print {
      /* Force everything off except the print portal */
      body * {
        visibility: hidden !important;
      }
      
      .print-portal-container,
      .print-portal-container * {
        visibility: visible !important;
      }

      .print-portal-wrapper {
        position: absolute !important;
        left: 0 !important;
        top: 0 !important;
        width: 100% !important;
        height: auto !important;
        background: white !important;
        z-index: 999999 !important;
        overflow: visible !important;
      }

      .print-page-break {
        page-break-after: always !important;
        break-after: page !important;
        display: block !important;
        height: auto !important;
      }

      @page {
        size: A4 portrait;
        margin: 10mm;
      }
    }
  `
            }} />

            {/* Printable Portal Window Container */}
            <div className="print-portal-container bg-white text-black w-full max-w-[210mm] mx-auto shadow-2xl flex flex-col relative print:shadow-none print:p-0">

              {/* ================= SHEET 1: PROPERTY EVIDENCE LOG LAYOUT ================= */}
              <div className="bg-white p-8 sm:p-10 flex flex-col justify-between print-page-break print:p-0 print:box-border" style={{ backgroundColor: '#ffffff' }}>
                <div>
                  <div className="text-[11px] font-normal font-sans leading-tight text-black">
                    <p>CSI Form "4"</p>
                    <p>SOCO REPORT FORM "2"</p>
                  </div>

                  <div className="flex justify-between items-center mt-2 pb-2 border-b border-black text-black">
                    {/* LEFT LOGO */}
                    <div className="w-20 h-20 shrink-0 flex items-center justify-center p-0">
                      <img
                        src="/logo/scjps.png"
                        alt="PNP Seal Emblem"
                        className="w-full h-full object-contain"
                      />
                    </div>

                    <div className="text-center space-y-0.5 flex-1 mx-4">
                      <p className="text-[11px] leading-tight font-sans">
                        Republic of the Philippines
                      </p>
                      <p className="text-[11px] leading-tight font-sans">
                        National Police Commission
                      </p>
                      <p className="text-xs font-bold uppercase tracking-wide">
                        Philippine National Police
                      </p>
                      <p className="text-xs uppercase font-semibold">
                        {activePrintRow.investigating_agency ||
                          "LAGUNA POLICE PROVINCIAL OFFICE"}
                      </p>
                      <p className="text-xs font-bold uppercase tracking-wide">
                        LOS BAÑOS MUNICIPAL POLICE STATION
                      </p>
                      <p className="text-[10px] italic text-gray-700">
                        Villegas Street: Brgy. Baybayin; Los Baños, Laguna
                      </p>
                      <p className="text-[10px] text-gray-700">
                        Tel/Fax (049) 534-5631
                      </p>
                    </div>

                    {/* RIGHT LOGO */}
                    <div className="w-20 h-20 shrink-0 flex items-center justify-center p-0">
                      <img
                        src="/logo/ub_seal.png"
                        alt="Station Badge Emblem"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end mt-4">
                    <div className="text-center w-48">
                      <div className="border-b border-black text-xs px-2 py-0.5 min-h-[1.5rem] text-black">
                        {activePrintRow.date_collected
                          ? new Date(
                            activePrintRow.date_collected,
                          ).toLocaleDateString(undefined, {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })
                          : ""}
                      </div>
                      <p className="text-xs mt-1 text-black">Date</p>
                    </div>
                  </div>

                  <div className="mt-3 text-xs font-bold flex items-center text-black">
                    <span>RE SOCO REPORT NR:</span>
                    <span className="border-b border-black ml-1 flex-1 max-w-xs px-2 font-mono text-sm tracking-wider">
                      {activePrintRow.case_number}
                    </span>
                  </div>

                  <h2 className="text-center text-sm font-bold tracking-wider uppercase my-4 text-black">
                    EVIDENCE LOG
                  </h2>

                  <table className="w-full border-collapse border border-black text-center text-xs text-black">
                    <thead>
                      <tr className="border-b border-black divide-x divide-black font-bold text-[11px] h-10 bg-gray-50/50">
                        <th className="p-1 w-12 tracking-tight">QTY</th>
                        <th className="p-1 w-1/4 text-center leading-tight">
                          DESCRIPTION OF SPECIMEN COLLECTED
                        </th>
                        <th className="p-1 tracking-tight">COLLECTED BY</th>
                        <th className="p-1 leading-tight">TIME COLLECTED</th>
                        <th className="p-1 tracking-tight">SPECIFIC PLACE</th>
                        <th className="p-1 tracking-tight">REMARKS</th>
                        <th className="p-1 leading-tight">
                          SIGNATURE OF SEARCHER
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black font-sans">
                      <tr className="divide-x divide-black align-top h-16 text-[11px]">
                        <td className="p-2 font-bold">
                          {activePrintRow.quantity}
                        </td>
                        <td className="p-2 text-left leading-normal">
                          <span className="font-bold text-[10px] block text-gray-600">
                            [{activePrintRow.evidence_type}]
                          </span>
                          {activePrintRow.physical_description ||
                            activePrintRow.unit_descriptor}
                        </td>
                        <td className="p-2">
                          {activePrintRow.collector_name ||
                            activePrintRow.turned_over_by_name ||
                            ""}
                        </td>
                        <td className="p-2 whitespace-normal leading-tight font-mono">
                          {activePrintRow.created_at
                            ? new Date(activePrintRow.created_at).toLocaleString([], {
                              dateStyle: "short",
                              timeStyle: "short",
                            })
                            : ""}
                        </td>
                        <td className="p-2 text-left leading-tight">
                          {activePrintRow.collection_place && (
                            <div>{activePrintRow.collection_place}</div>
                          )}
                          {activePrintRow.retrieval_address && (
                            <div className="text-[10px] text-gray-600 mt-0.5">
                              {activePrintRow.retrieval_address}
                            </div>
                          )}
                        </td>
                        <td className="p-2 text-left italic text-gray-700">
                          {activePrintRow.condition_received || ""}
                        </td>
                        {activePrintRow?.collector_signature_hash ? (
                          <td className="p-1 text-center align-middle relative">
                            <img
                              src={activePrintRow.collector_signature_hash}
                              alt="Collector Signature"
                              className="mx-auto max-h-6 max-w-full object-contain"
                            />
                          </td>
                        ) : (
                          <td className="p-2 text-left italic text-gray-400 font-mono text-[9px] pt-6">
                            (Place signature stamp here)
                          </td>
                        )}
                      </tr>
                      {[1, 2, 3, 4, 5, 6].map((idx) => (
                        <tr key={idx} className="divide-x divide-black h-10">
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                          <td></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid grid-cols-3 gap-6 pt-8 text-xs text-center font-normal text-black">
                  {/* PREPARED BY BLOCK */}
                  <div className="space-y-1">
                    <p className="text-left pl-4 text-gray-500">Prepared by:</p>
                    <div className="relative flex flex-col items-center justify-end group">
                      <div className="w-full h-8 flex items-center justify-center mb-0.5 relative z-10">
                        {activePrintRow?.collector_signature_hash ? (
                          <img
                            src={activePrintRow.collector_signature_hash}
                            alt="Collector Signature"
                            className="absolute max-h-10 object-contain"
                          />
                        ) : (
                          <div className="text-gray-400 italic text-[9px]">
                            [Place signature here]
                          </div>
                        )}
                      </div>
                      <div className="border-b border-black px-4 font-bold uppercase min-h-[1.25rem] w-full text-center text-[11px] relative z-20 bg-transparent">
                        {activePrintRow?.turned_over_by_name ||
                          activePrintRow?.collector_name ||
                          "Seizing Officer"}
                      </div>
                      <p className="text-[10px] mt-0.5 text-gray-600 font-medium tracking-wide">
                        Evidence Collector
                      </p>
                    </div>
                  </div>

                  {/* CERTIFIED BY BLOCK */}
                  <div className="space-y-1">
                    <p className="text-left pl-4 text-gray-500">
                      Certified by:
                    </p>
                    <div className="relative flex flex-col items-center justify-end group">
                      <div className="w-full h-8 flex items-center justify-center mb-0.5 relative z-10">
                        {activePrintRow?.custodian_signature_hash ? (
                          <img
                            src={activePrintRow.custodian_signature_hash}
                            alt="Custodian Signature"
                            className="absolute max-h-10 object-contain"
                          />
                        ) : (
                          <div className="text-gray-400 italic text-[9px]">
                            [Place signature here]
                          </div>
                        )}
                      </div>
                      <div className="text-center w-full">
                        <div className="border-b border-black px-4 font-medium uppercase min-h-[1.25rem]">
                          <span className="font-bold text-black uppercase underline">
                            {activePrintRow.received_by_name || activePrintRow.custodian_name || "SOCO Team Leader"}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] mt-1 text-gray-900">
                        SOCO Team Leader
                      </p>
                    </div>
                  </div>

                  {/* NOTED BY BLOCK */}
                  <div className="space-y-1">
                    <p className="text-left pl-4 text-gray-500">Noted by:</p>
                    <div className="relative flex flex-col items-center justify-end group">
                      <div className="w-full h-8 flex items-center justify-center mb-0.5 relative z-10">
                        {activePrintRow?.supervisor_signature_hash ? (
                          <img
                            src={activePrintRow.supervisor_signature_hash}
                            alt="Supervisor Signature"
                            className="absolute max-h-10 object-contain"
                          />
                        ) : (
                          <div className="text-gray-400 italic text-[9px]">
                            [Place signature here]
                          </div>
                        )}
                      </div>
                      <div className="border-b border-black w-11/12 mx-auto font-medium uppercase min-h-[1.25rem]">
                        <span className="font-bold text-black uppercase underline">
                          {activePrintRow.noted_by || activePrintRow.supervisor_name || "Chief of Office"}
                        </span>
                      </div>
                      <p className="text-[11px] mt-1 text-gray-900">
                        Chief of Office
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* ================= SHEET 2: CHAIN OF CUSTODY FORM LAYOUT ================= */}
              <div className="bg-white p-8 sm:p-10 flex flex-col justify-between border-t-2 border-dashed border-gray-300 print:border-none print-page-break print:p-0 print:box-border" style={{ backgroundColor: '#ffffff' }}>
                <div>
                  <div className="text-center space-y-0.5 text-black">
                    <p className="text-xs">Republic of the Philippines</p>
                    <p className="text-xs">National Police Commission</p>
                    <p className="text-sm font-bold tracking-wide">
                      PHILIPPINE NATIONAL POLICE
                    </p>
                    <p className="text-xs font-medium uppercase">
                      {activePrintRow.investigating_agency ||
                        "Baguio City Police Office"}
                    </p>
                    <p className="text-xs font-medium">Station 5</p>
                    <p className="text-[11px] text-gray-700 italic">
                      Marcos Highway, Legarda Road, Baguio City
                    </p>
                  </div>

                  <h2 className="text-center text-sm font-bold tracking-wider uppercase my-5 text-black">
                    CHAIN OF CUSTODY FORM
                  </h2>

                  <div className="space-y-2.5 text-xs font-sans text-black">
                    <div className="flex items-end">
                      <span className="whitespace-nowrap pr-1">
                        Nature of Case:
                      </span>
                      <div className="flex-1 border-b border-black font-medium px-2 pb-0.5 uppercase">
                        {activePrintRow.case_title || "N/A"}
                      </div>
                    </div>

                    <div className="flex items-end">
                      <span className="whitespace-nowrap pr-1">
                        Name of Suspects:
                      </span>
                      <div className="flex-1 border-b border-black font-medium px-2 pb-0.5 min-h-[1.25rem]">
                        {activePrintRow.suspect_names || ""}
                      </div>
                    </div>

                    {/* ================= UPDATED WITNESS MANIFEST SECTION ================= */}
                    <div className="space-y-1 pt-1">
                      <span className="font-bold text-gray-700 block text-[11px] uppercase tracking-wider">
                        Witness Manifest & Verification:
                      </span>
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs">
                        {(() => {
                          const structuredWitnesses = Array.isArray(activePrintRow.witnesses)
                            ? activePrintRow.witnesses
                            : (witnessList.map(name => ({ name, signature_url: null, timestamp: null })));

                          return structuredWitnesses.length > 0 ? (
                            <div className={`grid gap-4 ${structuredWitnesses.length === 1 ? 'grid-cols-1 max-w-sm mx-auto' : 'grid-cols-2'}`}>
                              {structuredWitnesses.map((w, idx) => (
                                <div key={idx} className="flex flex-col justify-end text-center space-y-1">
                                  <div className="h-10 w-full flex items-center justify-center relative">
                                    {w.signature_url ? (
                                      <img
                                        src={w.signature_url}
                                        alt={`Witness ${idx + 1} Signature`}
                                        className="max-h-10 object-contain mix-blend-multiply absolute opacity-100"
                                      />
                                    ) : (
                                      <span className="text-[9px] text-gray-400 italic">(No Signature Captured)</span>
                                    )}
                                  </div>
                                  <div className="border-b border-black font-bold uppercase text-gray-900 pb-0.5 text-center font-mono tracking-wide">
                                    {w.name || w}
                                  </div>
                                  <span className="block text-[8px] uppercase tracking-wider text-gray-500 font-bold">
                                    Witness {idx + 1}: Signature over Printed Name
                                  </span>
                                  {w.timestamp && (
                                    <span className="text-[7px] text-gray-400 font-mono">
                                      Signed: {new Date(w.timestamp).toLocaleString()}
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 max-w-sm mx-auto">
                              <div className="flex flex-col justify-end h-10 text-center">
                                <div className="border-b border-gray-400 text-gray-400 pb-0.5">
                                  {activePrintRow.witness_names || "(No Witness Registered)"}
                                </div>
                                <span className="block text-[8px] uppercase tracking-wider text-gray-500 font-bold mt-0.5">
                                  Witness Signature Block
                                </span>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    <div className="flex items-end">
                      <span className="whitespace-nowrap pr-1">
                        Time, Date and Place of Occurrence:
                      </span>
                      <div className="flex-1 border-b border-black font-medium px-2 pb-0.5 font-mono text-[11px]">
                        {activePrintRow.created_at
                          ? `${new Date(activePrintRow.created_at).toLocaleString()} `
                          : ""}
                        {activePrintRow.collection_place ||
                          activePrintRow.retrieval_address
                          ? `at ${activePrintRow.collection_place || ""} ${activePrintRow.retrieval_address ? `(${activePrintRow.retrieval_address})` : ""}`
                          : ""}
                      </div>
                    </div>

                    <div className="flex items-end">
                      <span className="whitespace-nowrap pr-1">
                        Operating Unit:
                      </span>
                      <div className="flex-1 border-b border-black font-medium px-2 pb-0.5 uppercase">
                        {activePrintRow.investigating_agency}
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-end">
                        <span className="whitespace-nowrap pr-1">
                          Description of Evidence:
                        </span>
                        <div className="flex-1 border-b border-black font-bold px-2 pb-0.5 text-xs">
                          ({activePrintRow.quantity}x){" "}
                          {activePrintRow.physical_description ||
                            activePrintRow.unit_descriptor}
                        </div>
                      </div>
                      <div className="border-b border-black w-full min-h-[1.25rem] font-mono text-[11px] text-gray-500 pl-2">
                        Classification Category Status:{" "}
                        {activePrintRow.evidence_type}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 space-y-4 font-sans text-xs text-black">
                    {/* CUSTODY BLOCK 1 */}
                    <div className="space-y-3">
                      <div className="grid grid-cols-12 gap-1 items-start">
                        <div className="col-span-4 font-normal pt-1 uppercase text-[10px] text-gray-600 font-bold">
                          TURNED OVER BY
                        </div>
                        <div className="col-span-8 space-y-2">
                          <div className="text-center">
                            <div className="border-b border-black px-4 font-medium uppercase min-h-[1.25rem]">
                              {activePrintRow.certified_by ||
                                activePrintRow.collector_name ||
                                "Seizing Officer"}
                            </div>
                            <span className="text-[10px] text-gray-500 block mt-0.5">
                              (Name and Designation)
                            </span>
                          </div>
                          <div className="grid grid-cols-12 gap-1 items-end">
                            <span className="col-span-3 text-left text-gray-500">
                              Agency/Address
                            </span>
                            <div className="col-span-9 border-b border-black px-2 min-h-[1.25rem] uppercase">
                              {activePrintRow.turned_over_by_agency ||
                                activePrintRow.investigating_agency}
                            </div>
                          </div>
                          <div className="grid grid-cols-12 gap-1 items-end">
                            <span className="col-span-3 text-left text-gray-500">
                              Time and Date
                            </span>
                            <div className="col-span-9 border-b border-black px-2 min-h-[1.25rem] font-mono">
                              {activePrintRow.created_at
                                ? new Date(
                                  activePrintRow.created_at,
                                ).toLocaleString()
                                : ""}
                            </div>
                          </div>
                          <div className="grid grid-cols-12 gap-1 items-end">
                            <span className="col-span-3 text-left text-gray-500">
                              Remarks
                            </span>
                            <div className="col-span-9 border-b border-black px-2 italic text-gray-600 min-h-[1.25rem]">
                              Initial Processing Handover /{" "}
                              {activePrintRow.condition_received}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-12 gap-2 items-start pt-1 border-t border-dashed border-gray-200">
                        <div className="col-span-4 font-normal pt-1 uppercase text-[10px] text-blue-900 font-bold">
                          RECEIVED BY
                        </div>
                        <div className="col-span-8 space-y-2">
                          <div className="text-center">
                            <div className="border-b border-black px-4 font-bold text-blue-900 uppercase min-h-[1.25rem]">
                              {activePrintRow.turned_over_by_agency ||
                                activePrintRow.investigating_agency} -
                              {activePrintRow.noted_by ||
                                "______________________________________"}
                            </div>
                            <span className="text-[10px] text-gray-500 block mt-0.5">
                              (Name and Designation)
                            </span>
                          </div>
                          <div className="grid grid-cols-12 gap-1 items-end">
                            <span className="col-span-3 text-left text-gray-500">
                              Agency/Address
                            </span>
                            <div className="col-span-9 border-b border-black px-2 min-h-[1.25rem] uppercase">
                              {activePrintRow.received_by_agency ||
                                "CRIME LABORATORY EVIDENCE VAULT DIVISION"}
                            </div>
                          </div>
                          <div className="grid grid-cols-12 gap-1 items-end">
                            <span className="col-span-3 text-left text-gray-500">
                              Time and Date
                            </span>
                            <div className="col-span-9 border-b border-black px-2 min-h-[1.25rem] font-mono">
                              {activePrintRow.created_at
                                ? new Date(
                                  activePrintRow.created_at,
                                ).toLocaleString()
                                : ""}
                            </div>
                          </div>
                          <div className="grid grid-cols-12 gap-1 items-end">
                            <span className="col-span-3 text-left text-gray-500">
                              Remarks Ledger
                            </span>
                            <div className="col-span-9 border-b border-black px-2 min-h-[1.25rem] font-mono text-xs text-blue-950 font-semibold">
                              Vault Allocation:{" "}
                              {activePrintRow.storage_vault || "Vault Room"} [
                              {activePrintRow.workflow_stage ||
                                "Turnover Pending"}
                              ]
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-black my-3"></div>

                    {/* CUSTODY BLOCK 2 */}
                    <div className="space-y-3 opacity-40 select-none">
                      <div className="grid grid-cols-12 gap-1 items-start">
                        <div className="col-span-4 font-normal pt-1 uppercase text-[10px] text-gray-600 font-bold">
                          TURNED OVER BY
                        </div>
                        <div className="col-span-8 space-y-2">
                          <div className="text-center">
                            <div className="border-b border-black px-4 font-medium uppercase min-h-[1.25rem]">
                              {activePrintRow.certified_by ||
                                activePrintRow.collector_name ||
                                "Seizing Officer"}
                            </div>
                            <span className="text-[10px] text-gray-500 block mt-0.5">
                              (Name and Designation)
                            </span>
                          </div>
                          <div className="grid grid-cols-12 gap-1 items-end">
                            <span className="col-span-3 text-left text-gray-500">
                              Agency/Address
                            </span>
                            <div className="col-span-9 border-b border-black px-2 min-h-[1.25rem] uppercase">
                              {activePrintRow.turned_over_by_agency ||
                                activePrintRow.investigating_agency}
                            </div>
                          </div>
                          <div className="grid grid-cols-12 gap-1 items-end">
                            <span className="col-span-3 text-left text-gray-500">
                              Time and Date
                            </span>
                            <div className="col-span-9 border-b border-black px-2 min-h-[1.25rem] font-mono">
                              {activePrintRow.created_at
                                ? new Date(
                                  activePrintRow.created_at,
                                ).toLocaleString()
                                : ""}
                            </div>
                          </div>
                          <div className="grid grid-cols-12 gap-1 items-end">
                            <span className="col-span-3 text-left text-gray-500">
                              Remarks
                            </span>
                            <div className="col-span-9 border-b border-black px-2 italic text-gray-600 min-h-[1.25rem]">
                              Initial Processing Handover /{" "}
                              {activePrintRow.condition_received}
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="grid grid-cols-12 gap-2 items-start pt-1 border-t border-dashed border-gray-200">
                        <div className="col-span-4 font-normal pt-1 uppercase text-[10px] text-blue-900 font-bold">
                          RECEIVED BY
                        </div>
                        <div className="col-span-8 space-y-2">
                          <div className="text-center">
                            <div className="border-b border-black px-4 font-bold text-blue-900 uppercase min-h-[1.25rem]">
                              {activePrintRow.turned_over_by_agency ||
                                activePrintRow.investigating_agency} -
                              {activePrintRow.noted_by ||
                                "______________________________________"}
                            </div>
                            <span className="text-[10px] text-gray-500 block mt-0.5">
                              (Name and Designation)
                            </span>
                          </div>
                          <div className="grid grid-cols-12 gap-1 items-end">
                            <span className="col-span-3 text-left text-gray-500">
                              Agency/Address
                            </span>
                            <div className="col-span-9 border-b border-black px-2 min-h-[1.25rem] uppercase">
                              {activePrintRow.received_by_agency ||
                                "CRIME LABORATORY EVIDENCE VAULT DIVISION"}
                            </div>
                          </div>
                          <div className="grid grid-cols-12 gap-1 items-end">
                            <span className="col-span-3 text-left text-gray-500">
                              Time and Date
                            </span>
                            <div className="col-span-9 border-b border-black px-2 min-h-[1.25rem] font-mono">
                              {activePrintRow.created_at
                                ? new Date(
                                  activePrintRow.created_at,
                                ).toLocaleString()
                                : ""}
                            </div>
                          </div>
                          <div className="grid grid-cols-12 gap-1 items-end">
                            <span className="col-span-3 text-left text-gray-500">
                              Remarks Ledger
                            </span>
                            <div className="col-span-9 border-b border-black px-2 min-h-[1.25rem] font-mono text-xs text-blue-950 font-semibold">
                              Vault Allocation:{" "}
                              {activePrintRow.storage_vault || "Vault Room"} [
                              {activePrintRow.workflow_stage ||
                                "Turnover Pending"}
                              ]
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-right text-[9px] text-gray-400 font-mono pt-3 border-t border-gray-100">
                  Record ID Trace Reference:{" "}
                  {activePrintRow.id
                    ? `EV-2026-${String(activePrintRow.id).padStart(4, "0")}`
                    : "UNINITIALIZED"}
                </div>
              </div>

              {/* OVERLAY ACTIONS FOOTER (HIDDEN IN PRINT) */}
              <div className="p-6 bg-slate-50 border-t border-slate-200 print:hidden flex justify-end items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    // Force a brief timeout to ensure DOM rendering completes before print dialog triggers
                    setTimeout(() => {
                      window.print();
                    }, 100);
                  }}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-xs text-white transition-colors font-bold uppercase tracking-wider rounded-lg shadow-sm flex items-center gap-2"
                >
                  Export Report to PDF
                </button>

                <button
                  type="button"
                  onClick={() => setActivePrintRow(null)}
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-white transition-colors font-bold uppercase tracking-wider rounded-lg shadow-sm"
                >
                  Close
                </button>
              </div>

            </div>
          </div>
        );
      })()}

      {/* SHARED MODAL CANVAS HANDSHAKE WIRE ENGINE PORTAL */}
      {isSignatureModalOpen && (
        <SignaturePadModal
          isOpen={isSignatureModalOpen}
          onClose={() => {
            setIsSignatureModalOpen(false);
            setSelectedEvidenceItem(null);
          }}
          currentUser={currentUser}
          evidenceItem={selectedEvidenceItem}
          turnoverRemarks={turnoverRemarks}
          setTurnoverRemarks={setTurnoverRemarks}
          stationPersonnel={stationPersonnel}
          handshakeTargetCustodian={handshakeTargetCustodian}
          setHandshakeTargetCustodian={setHandshakeTargetCustodian}
          handshakeTargetSupervisor={handshakeTargetSupervisor}
          setHandshakeTargetSupervisor={setHandshakeTargetSupervisor}
          onSave={(signatureData) => {
            executeSupervisorApproval(signatureData);
          }}
        />
      )}

      <EvidentiaFooter />

      <NotificationModal
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
        duration={4000} // Keeps the notification alive for 4 seconds
      />
    </div>
  );
}
