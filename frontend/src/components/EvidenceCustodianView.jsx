// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect, useRef, useCallback } from "react";
import axios from "axios";
import EvidentiaFooter from "./EvidentiaFooter";
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

export default function EvidenceCustodianView({ currentUser }) {
  const [loading, setLoading] = useState(false);
  const [evidenceList, setEvidenceList] = useState([]);
  const [stationPersonnel, setStationPersonnel] = useState([]);
  const [activePrintRow, setActivePrintRow] = useState(null);

  // Sets the target capacity limit per view context
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Search and filtering metadata
  const [searchTerm, setSearchTerm] = useState("");
  const [filterAgency, setFilterAgency] = useState("All"); // Default to "All"
  const [filterStage, setFilterStage] = useState("");

  // Notification & Toast States
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [toast, setToast] = useState({ isVisible: false, message: "" });

  // Verification & Handshake Acceptance States
  const [selectedEvidenceItem, setSelectedEvidenceItem] = useState(null);
  const [turnoverRemarks, setTurnoverRemarks] = useState("");
  const [handshakeTargetCustodian, setHandshakeTargetCustodian] = useState("");
  const [handshakeTargetSupervisor, setHandshakeTargetSupervisor] =
    useState("");

  // Modal Control Toggle
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);

  // Clear system notifications banner automatically
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 4000);
    return () => clearTimeout(timer);
  }, [message]);

  // Fetch pending transfers from the shared cluster node endpoint
  const fetchPendingTurnovers = useCallback(async () => {
    setLoading(true);
    try {
      // const response = await axios.get("http://localhost:8081/intake_triage.php",
      const response = await axios.get("https://steadier-headscarf-maggot.ngrok-free.dev/intake_triage.php",
        {
          headers: { "ngrok-skip-browser-warning": "true" },
        },
      );
      if (response.data?.status === "success") {
        setEvidenceList(
          (response.data.records || []).sort(
            (a, b) => Number(b.id) - Number(a.id),
          ),
        );
      }
    } catch (err) {
      console.error("Fetch failure on pending turnovers", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Hook dependency configuration matching standard system patterns
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchPendingTurnovers();
  }, [fetchPendingTurnovers]);

  // Load Station Personnel to sign-off handovers automatically
  useEffect(() => {
    const fetchStationPersonnel = async () => {
      try {
        // const response = await axios.get("http://localhost:8081/get_users.php",
        const response = await axios.get("https://steadier-headscarf-maggot.ngrok-free.dev/get_users.php",
          {
            headers: { "ngrok-skip-browser-warning": "true" },
          },
        );
        if (response.data?.status === "success") {
          setStationPersonnel(response.data.users || []);
        }
      } catch (err) {
        console.error("Failed to load official station personnel matrix", err);
      }
    };
    fetchStationPersonnel();
  }, []);

  const formatEvidenceId = (item) => {
    if (item?.evidence_id?.startsWith("EV2026")) return item.evidence_id;
    return `EV-2026-${String(item?.id || 0).padStart(4, "0")}`;
  };

  const closeTurnoverModal = () => {
    setIsSignatureModalOpen(false);
    setSelectedEvidenceItem(null);
    setTurnoverRemarks("");
    setHandshakeTargetCustodian("");
    setHandshakeTargetSupervisor("");
  };

  // Process Handshake Verification and Commit Item Into Next Stage with Applied Signature Data
  const executeAcceptTurnover = async (custodianSignatureBase64) => {
    if (!handshakeTargetCustodian) {
      setMessageType("error");
      setMessage(
        "Error: Receiving Custodian Officer designation signature is mandatory.",
      );
      return;
    }

    setLoading(true);
    try {
      const payload = {
        ...selectedEvidenceItem, // 1. Crucial: This maintains 'collector_signature_hash' in the request payload
        workflow_stage: "In Storage",

        // 2. Map names matching the backend PUT parameter expectations
        received_by_name: handshakeTargetCustodian,
        certified_by:
          selectedEvidenceItem?.certified_by ||
          currentUser?.fullName ||
          "System Custodian",
        noted_by: handshakeTargetSupervisor, // Saves the supervisor chosen in the modal dropdown

        // 3. Save signatures to matching database column destinations
        custodian_signature_hash: custodianSignatureBase64,
        supervisor_signature_hash: null, // Starts as null until the supervisor signs explicitly later

        condition_received: turnoverRemarks.trim()
          ? `[Handover Note]: ${turnoverRemarks.trim()} | ${selectedEvidenceItem.condition_received || ""}`
          : selectedEvidenceItem.condition_received,
      };

      // const response = await axios.put("http://localhost:8081/intake_triage.php",
      const response = await axios.put("https://steadier-headscarf-maggot.ngrok-free.dev/intake_triage.php",
        payload,
      );

      if (response.data?.status === "success") {
        setToast({
          isVisible: true,
          message: "Handover acknowledged and logged securely.",
        });
        setTimeout(() => setToast({ isVisible: false, message: "" }), 4000);
        closeTurnoverModal();
        fetchPendingTurnovers(); // Refresh table view cache
      } else {
        setMessageType("error");
        setMessage(response.data?.message || "Transaction failure.");
      }
    } catch (err) {
      console.error(err);
      setMessageType("error");
      setMessage("Connection error updating custody records.");
    } finally {
      setLoading(false);
    }
  };

  // Single consolidated filter pipeline for search terms, agency, and workflow stages
  const filteredEvidence = evidenceList.filter((item) => {
    const target = searchTerm.toLowerCase().trim();

    const matchesSearch =
      target === "" ||
      (item.case_number || "").toLowerCase().includes(target) ||
      (item.evidence_id || "").toLowerCase().includes(target) ||
      (item.evidence_type || "").toLowerCase().includes(target) ||
      (item.collector_name || "").toLowerCase().includes(target) ||
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
      filterAgency === "All" || filterAgency === "" || item.investigating_agency === filterAgency;

    const matchesStage =
      filterStage === "" || item.workflow_stage === filterStage;

    return matchesSearch && matchesAgency && matchesStage;
  });

  // const handlePrintSlip = (row) => {
  //   setActivePrintRow(row);
  //   setTimeout(() => { window.print(); }, 250);
  // };

  // Metrics filtering matching telemetry structures
  const totalIncoming = evidenceList.filter(
    (i) => i.workflow_stage === "Turnover Pending",
  ).length;
  const totalSecured = evidenceList.filter(
    (i) => i.workflow_stage === "In Storage",
  ).length;

  // const filteredEvidence = evidenceList.filter((item) => {
  //   if (filterAgency === "All") return true;
  //   return item.investigating_agency === filterAgency;
  // });

  return (
    <div className="w-full space-y-6 print:p-0 font-sans text-slate-300">
      {/* HEADER SECTION */}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5 print:hidden">
        <div>
          <h2 className="text-xl font-bold text-white uppercase tracking-tight flex items-center gap-2">
            Evidence Custody Facility
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Validate chain of custody handovers.
          </p>
        </div>
      </header>

      {/* SYSTEM MESSAGES */}
      {message && (
        <div
          className={`p-4 rounded-xl text-sm border shadow-xl print:hidden animate-fadeIn ${messageType === "error"
            ? "bg-red-950/40 border-red-900/50 text-red-400"
            : "bg-emerald-950/40 border-emerald-900/50 text-emerald-400"
            }`}
        >
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full shrink-0 bg-current animate-pulse" />
            <p className="font-medium tracking-wide">{message}</p>
          </div>
        </div>
      )}

      {/* STORAGE & INTAKE TELEMETRY STATISTICS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 print:hidden">
        {/* AWAITING HANDOVER HANDSHAKE */}
        <div className="group relative bg-slate-900/35 border border-slate-800/60 rounded-2xl p-5 flex flex-col justify-between shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-purple-500/40 hover:shadow-purple-500/5 overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/[0.015] before:to-transparent before:pointer-events-none">
          {/* Tech Glowing Top Bar Accent */}
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-purple-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <span className="text-[10px] text-purple-400/90 font-black uppercase tracking-wider transition-colors group-hover:text-purple-400">
                Awaiting Evidence Handovers
              </span>
              <div className="text-[9px] text-slate-500 font-mono uppercase tracking-tight">
                Pipeline Triage
              </div>
            </div>
            <div className="p-2 rounded-xl bg-purple-950/20 border border-purple-900/30 text-purple-400/70 group-hover:text-purple-400 group-hover:border-purple-500/30 transition-all shadow-inner">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                />
              </svg>
            </div>
          </div>

          <div className="flex items-baseline gap-1 mt-5">
            <span className="text-3xl font-black text-purple-400 font-mono tracking-tight drop-shadow-[0_2px_10px_rgba(168,85,247,0.1)]">
              {totalIncoming}
            </span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide ml-1.5">
              incoming transfers
            </span>
          </div>
        </div>

        {/* SECURED VAULT INVENTORY */}
        <div className="group relative bg-slate-900/35 border border-slate-800/60 rounded-2xl p-5 flex flex-col justify-between shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-blue-500/40 hover:shadow-blue-500/5 overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/[0.015] before:to-transparent before:pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <span className="text-[10px] text-blue-400/90 font-black uppercase tracking-wider transition-colors group-hover:text-blue-400">
                Secured Evidence Inventory
              </span>
              <div className="text-[9px] text-slate-500 font-mono uppercase tracking-tight">
                Evidence Vault
              </div>
            </div>
            <div className="p-2 rounded-xl bg-blue-950/20 border border-blue-900/30 text-blue-400/70 group-hover:text-blue-400 group-hover:border-blue-500/30 transition-all shadow-inner">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293h3.172a1 1 0 00.707-.293l2.414-2.414a1 1 0 01.707-.293H20"
                />
              </svg>
            </div>
          </div>

          <div className="flex items-baseline gap-1 mt-5">
            <span className="text-3xl font-black text-blue-400 font-mono tracking-tight drop-shadow-[0_2px_10px_rgba(59,130,246,0.1)]">
              {totalSecured}
            </span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide ml-1.5">
              Items inside storage
            </span>
          </div>
        </div>

        {/* ACTIVE IN FIELD / OUT ON RELEASE */}
        <div className="group relative bg-slate-900/35 border border-slate-800/60 rounded-2xl p-5 flex flex-col justify-between shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-amber-500/40 hover:shadow-amber-500/5 overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/[0.015] before:to-transparent before:pointer-events-none">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-amber-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

          <div className="flex justify-between items-start">
            <div className="space-y-0.5">
              <span className="text-[10px] text-amber-400/90 font-black uppercase tracking-wider transition-colors group-hover:text-amber-400">
                Active On Field | Released
              </span>
              <div className="text-[9px] text-slate-500 font-mono uppercase tracking-tight">
                External Custody
              </div>
            </div>
            <div className="p-2 rounded-xl bg-amber-950/20 border border-amber-900/30 text-amber-400/70 group-hover:text-amber-400 group-hover:border-amber-500/30 transition-all shadow-inner">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </div>
          </div>

          <div className="flex items-baseline gap-1 mt-5">
            <span className="text-3xl font-black text-amber-400 font-mono tracking-tight drop-shadow-[0_2px_10px_rgba(245,158,11,0.1)]">
              {/* Dynamic calculation: filters out any item currently safely banked inside the lock vault */}
              {
                evidenceList.filter(
                  (item) => item.workflow_stage !== "In Storage",
                ).length
              }
            </span>
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide ml-1.5">
              items out on release
            </span>
          </div>
        </div>
      </div>



      {/* LOG REGISTRY CLUSTER MODULE */}
      <section className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl print:hidden transition-all my-6">

        {/* Module Header Segment */}
        <div className="p-6 bg-slate-950/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h3 className="text-xs font-black uppercase text-slate-200 tracking-wider flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
              Chain of Custody Handover Registry
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Verify deployment transactions and sign off intermediate transfer
              requests below
            </p>
          </div>
          <button
            onClick={() => {
              setCurrentPage(1);
              fetchPendingTurnovers();
            }}
            disabled={loading}
            className="text-[10px] bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-mono font-bold px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm transition-colors"
          >
            {loading ? "Synchronizing Cluster..." : "Refresh Registry Cache"}
          </button>
        </div>

        {/* Integrated Search & Filter Controls Matrix Bar */}
        <div className="px-6 pb-5 pt-1 bg-slate-950/60 border-b border-slate-800/60 flex flex-col xl:flex-row items-stretch xl:items-center justify-start gap-4 relative z-10 w-full">

          {/* Unified Global Search Phrase Input Component */}
          <div className="relative min-w-[280px] xl:w-96">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                className="w-4 h-4 text-slate-500"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.603 10.601z"
                />
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on lookup parameters change
              }}
              placeholder="Search records (Ref ID, Case No, Title, Staff, Items)..."
              className="w-full pl-10 pr-4 py-2 bg-slate-950/50 backdrop-blur-md border border-slate-800/60 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all duration-200 font-medium tracking-wide"
            />
          </div>

          {/* Combined Dropdowns Row Container */}
          <div className="flex flex-col sm:flex-row items-stretch gap-4 w-full xl:w-auto">
            {/* Workflow Phase Pipeline Dropdown Filter */}
            <div className="flex items-center gap-2.5 min-w-[210px] w-full sm:w-auto">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider font-mono select-none whitespace-nowrap">
                Stage:
              </span>
              <div className="relative w-full">
                <select
                  value={filterStage}
                  onChange={(e) => {
                    setFilterStage(e.target.value);
                    setCurrentPage(1); // Reset pagination index
                  }}
                  className="w-full pl-3.5 pr-10 py-2 bg-slate-950/50 backdrop-blur-md border border-slate-800/60 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all duration-200 font-medium tracking-wide appearance-none cursor-pointer"
                >
                  <option value="" className="bg-slate-950 text-slate-400">All Workflow Phases</option>
                  <option value="On Field" className="bg-slate-950 text-slate-200">On Field</option>
                  <option value="Turnover Pending" className="bg-slate-950 text-slate-200">Turnover Pending</option>
                  <option value="In Storage" className="bg-slate-950 text-slate-200">In Storage</option>
                  <option value="In Court" className="bg-slate-950 text-slate-200">In Court</option>
                  <option value="Archived" className="bg-slate-950 text-slate-200">Archived</option>
                </select>
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-3 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Investigating Agency / Station Dropdown Filter */}
            <div className="flex items-center gap-2.5 min-w-[260px] max-w-sm w-full sm:w-auto">
              <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider font-mono select-none whitespace-nowrap">
                Agencies:
              </span>
              <div className="relative w-full">
                <select
                  value={filterAgency}
                  onChange={(e) => {
                    setFilterAgency(e.target.value);
                    setCurrentPage(1); // Reset pagination index
                  }}
                  className="w-full pl-3.5 pr-10 py-2 bg-slate-950/50 backdrop-blur-md border border-slate-800/60 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/30 transition-all duration-200 font-medium tracking-wide appearance-none cursor-pointer truncate"
                >
                  <option value="All" className="bg-slate-950 text-slate-400">All Inbound Agencies</option>
                  {BENGUET_AGENCIES.map((agency) => (
                    <option key={agency} value={agency} className="bg-slate-950 text-slate-200">
                      {agency}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none text-slate-500">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-3 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Sleek Dynamic Custom Modern Scrollbar Horizontal Track wrapper */}
        <div className="w-full overflow-x-auto scrollbar-thin scrollbar-track-slate-950 scrollbar-thumb-slate-800 hover:scrollbar-thumb-purple-500/40 [&::-webkit-scrollbar]:h-2 [&::-webkit-scrollbar-track]:bg-slate-950/40 [&::-webkit-scrollbar-thumb]:bg-slate-800/80 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-purple-500/30 transition-all duration-300">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-slate-950/40 text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800 font-black font-mono select-none">
                <th className="p-5 text-center w-[150px]">Evidence ID</th>
                <th className="p-5 w-[280px]">Origin Station / Source</th>
                <th className="p-5 w-[280px]">Case Identification</th>
                <th className="p-5 min-w-[250px]">Item Description & Remarks</th>
                <th className="p-5 text-center w-[80px]">Qty</th>
                <th className="p-5 text-center w-[160px]">Workflow State</th>
                <th className="p-5 text-right w-[320px]">Handover Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-xs text-slate-300">
              {loading ? (
                <tr>
                  <td colSpan="7" className="p-16 text-center text-slate-500 font-medium animate-pulse font-mono tracking-wide">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <svg className="animate-spin h-5 w-5 text-purple-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Synchronizing chain ledger index cluster...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredEvidence.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="p-16 text-center text-slate-500 italic font-medium font-mono bg-slate-950/10 tracking-wide"
                  >
                    [System Condition: No evidence records matched the designated search parameters or workspace logs.]
                  </td>
                </tr>
              ) : (
                /* CLIENT-SIDE ARRAYS PAGINATION COMPUTE SLICE PIPELINE */
                filteredEvidence
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((item) => (
                    <tr
                      key={item.id}
                      className="hover:bg-slate-900/30 group transition-all duration-150"
                    >
                      <td className="p-5 font-mono text-center text-slate-400 font-black tracking-tight group-hover:text-purple-400 transition-colors">
                        {formatEvidenceId(item)}
                      </td>

                      <td className="p-5 font-semibold text-slate-200 leading-relaxed pr-4">
                        <div className="text-slate-200">
                          {item.investigating_agency}
                        </div>
                        {item.turned_over_by_name && (
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            Log Source: {item.turned_over_by_name}
                          </div>
                        )}
                      </td>

                      <td className="p-5 space-y-1.5 pr-4">
                        <div className="font-mono font-bold text-blue-400 tracking-tight text-[12px]">
                          {item.case_number}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium line-clamp-2 leading-normal">
                          {item.case_title || "Unspecified Case Base File"}
                        </div>
                      </td>

                      <td className="p-5 space-y-2 pr-4">
                        <div className="text-slate-200 font-medium">
                          {item.physical_description}
                        </div>
                        {item.turnover_remarks && (
                          <div className="text-[10px] text-purple-400 font-mono border-l-2 border-purple-900 pl-2.5 py-0.5 line-clamp-2">
                            <span className="text-slate-600 font-bold uppercase tracking-wider text-[9px] mr-1">
                              Turnover Log:
                            </span>
                            {item.turnover_remarks}
                          </div>
                        )}
                      </td>

                      <td className="p-5 text-center font-mono font-black text-slate-100 bg-slate-950/10 text-sm">
                        {item.quantity}
                      </td>

                      <td className="p-5 text-center">
                        <span
                          className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border font-mono shadow-sm ${item.workflow_stage === "Turnover Pending"
                            ? "bg-purple-950/40 border-purple-900/60 text-purple-400 animate-pulse"
                            : item.workflow_stage === "In Storage"
                              ? "bg-blue-950/40 border-blue-900/60 text-blue-400"
                              : "bg-amber-950/40 border-amber-900/60 text-amber-400"
                            }`}
                        >
                          {item.workflow_stage || "On Field"}
                        </span>
                      </td>

                      <td className="p-5 text-right">
                        <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-2 font-bold text-[11px]">
                          {item.workflow_stage === "Turnover Pending" && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedEvidenceItem(item);
                                setTurnoverRemarks("");
                                setHandshakeTargetCustodian(
                                  currentUser?.fullName || "",
                                );
                                setHandshakeTargetSupervisor(item.noted_by || "");
                                setIsSignatureModalOpen(true);
                              }}
                              className="whitespace-nowrap bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-2 rounded-lg transition-all"
                            >
                              Acknowledge Handover
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => setActivePrintRow(item)}
                            className="whitespace-nowrap bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 px-3 py-2 rounded-lg transition-all"
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

        {/* INTEGRATED COMMAND HIGH-FIDELITY PAGINATION PANEL */}
        {!loading && filteredEvidence.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-slate-950/60 border-t border-slate-800/60 gap-4">
            <div className="text-[11px] text-slate-400 font-medium">
              Showing{" "}
              <span className="font-bold text-slate-200">
                {Math.min((currentPage - 1) * itemsPerPage + 1, filteredEvidence.length)}
              </span>{" "}
              to{" "}
              <span className="font-bold text-slate-200">
                {Math.min(currentPage * itemsPerPage, filteredEvidence.length)}
              </span>{" "}
              of <span className="font-bold text-purple-400">{filteredEvidence.length}</span> audit records
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
              {Array.from({ length: Math.ceil(filteredEvidence.length / itemsPerPage) }).map((_, index) => {
                const pageNum = index + 1;
                return (
                  <button
                    key={pageNum}
                    type="button"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`min-w-[32px] h-8 text-[11px] font-bold rounded-xl transition-all duration-200 border ${currentPage === pageNum
                      ? "bg-purple-600 border-purple-500 text-white shadow-md shadow-purple-500/10"
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
                disabled={currentPage === Math.ceil(filteredEvidence.length / itemsPerPage)}
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(filteredEvidence.length / itemsPerPage)))}
                className="inline-flex items-center justify-center p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:hover:text-slate-400 transition-all duration-200 cursor-pointer disabled:cursor-not-allowed"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* SIGNATURE MODAL INTERFACE ROUTING */}
      {isSignatureModalOpen && (
        <SignaturePadModal
          isOpen={isSignatureModalOpen}
          onClose={closeTurnoverModal}
          currentUser={currentUser}
          evidenceItem={selectedEvidenceItem}
          turnoverRemarks={turnoverRemarks}
          setTurnoverRemarks={setTurnoverRemarks}
          stationPersonnel={stationPersonnel}
          handshakeTargetCustodian={handshakeTargetCustodian}
          setHandshakeTargetCustodian={setHandshakeTargetCustodian}
          handshakeTargetSupervisor={handshakeTargetSupervisor}
          setHandshakeTargetSupervisor={setHandshakeTargetSupervisor}
          onSave={(base64Data) => {
            executeAcceptTurnover(base64Data);
          }}
        />
      )}

      {/* TOAST SYSTEM NOTIFICATION POPUPS */}
      {toast.isVisible && (
        <div className="fixed top-5 right-5 z-50 transform transition-all duration-300 animate-slide-in-right">
          <div className="flex items-center gap-3 bg-slate-900/90 border border-emerald-500/30 backdrop-blur-md px-4 py-3.5 rounded-xl shadow-2xl min-w-[300px]">
            <div className="flex-shrink-0 flex items-center justify-center h-8 w-8 rounded-lg bg-emerald-500/10 text-emerald-400">
              <svg
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-white tracking-wide">
                Handover Stage Recorded
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-tight font-medium">
                {toast.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Print row */}
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
            /* 1. Hide the entire body visually, but keep layout trees alive to prevent collapsing */
            html, body {
              background-color: #ffffff !important;
              color: #000000 !important;
              margin: 0 !important;
              padding: 0 !important;
              visibility: hidden !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            /* 2. Force ONLY our specific printable template area and its contents to be visible */
            .print-portal-container,
            .print-portal-container * {
              visibility: visible !important;
            }
            
            /* 3. Absolute anchor the visible container to the top-left of Page 1 */
            .print-portal-container {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
              max-width: 100% !important;
              background-color: #ffffff !important;
              color: #000000 !important;
              padding: 0 !important;
              margin: 0 !important;
              box-shadow: none !important;
              border: none !important;
              display: flex !important;
              flex-direction: column !important;
            }

            .print-portal-container > div {
              background-color: #ffffff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            /* 4. Force ink override rules so elements don't drop text contrast */
            .print-portal-container text,
            .print-portal-container p,
            .print-portal-container span,
            .print-portal-container h1,
            .print-portal-container h2,
            .print-portal-container h3,
            .print-portal-container div {
              color: #000000 !important;
            }

            @page { 
              margin: 10mm !important; 
              background-color: #ffffff !important;
            }
            
            .print\\:hidden { 
              display: none !important; 
            }
          }
        `}} />

            {/* Printable Portal Window Container */}
            <div className="print-portal-container bg-white text-black w-full max-w-[210mm] mx-auto shadow-2xl flex flex-col relative print:shadow-none print:p-0">

              {/* ================= SHEET 1: PROPERTY EVIDENCE LOG LAYOUT ================= */}
              <div className="bg-white p-8 sm:p-10 flex flex-col justify-between print:h-[297mm] print:box-border print:page-break-after-always" style={{ pageBreakAfter: 'always', breakAfter: 'page', backgroundColor: '#ffffff' }}>
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
                          ).toLocaleDateString()
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
                          {activePrintRow.date_collected
                            ? new Date(
                              activePrintRow.date_collected,
                            ).toLocaleDateString()
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
                        <td className="p-2 text-left italic text-gray-400 font-mono text-[9px] pt-6">
                          (Place signature stamp here)
                        </td>
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
              <div className="bg-white p-8 sm:p-10 flex flex-col justify-between border-t-2 border-dashed border-gray-300 print:border-none print:h-[297mm] print:box-border" style={{ backgroundColor: '#ffffff' }}>
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
                        {activePrintRow.date_collected
                          ? `${new Date(activePrintRow.date_collected).toLocaleString()} `
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
                      <div className="grid grid-cols-12 gap-2 items-start">
                        <div className="col-span-4 font-normal pt-1">
                          TURNED OVER BY
                        </div>
                        <div className="col-span-8 space-y-1.5">
                          <div className="border-b border-gray-300 min-h-[1.25rem]"></div>
                          <div className="border-b border-gray-300 min-h-[1.25rem]"></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-12 gap-2 items-start pt-1">
                        <div className="col-span-4 font-normal pt-1">
                          RECEIVED BY
                        </div>
                        <div className="col-span-8 space-y-1.5">
                          <div className="border-b border-gray-300 min-h-[1.25rem]"></div>
                          <div className="border-b border-gray-300 min-h-[1.25rem]"></div>
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
                  onClick={() => window.print()}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-xs text-white transition-colors font-bold uppercase tracking-wider rounded-lg shadow-sm flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
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

      {/* SIGNATURE MODAL INTERFACE ROUTING */}
      {isSignatureModalOpen && (
        <SignaturePadModal
          isOpen={isSignatureModalOpen}
          onClose={closeTurnoverModal}
          currentUser={currentUser}
          evidenceItem={selectedEvidenceItem}
          turnoverRemarks={turnoverRemarks}
          setTurnoverRemarks={setTurnoverRemarks}
          stationPersonnel={stationPersonnel}
          handshakeTargetCustodian={handshakeTargetCustodian}
          setHandshakeTargetCustodian={setHandshakeTargetCustodian}
          handshakeTargetSupervisor={handshakeTargetSupervisor}
          setHandshakeTargetSupervisor={setHandshakeTargetSupervisor}
          onSave={async (signatureData) => {
            // signatureData is the clean Base64 string passed up from the modal tab layout canvas

            if (selectedEvidenceItem?.workflow_stage === "In Storage") {
              // SCENARIO A: The item is already in storage, so this signature belongs to the Station Supervisor!
              setLoading(true);
              try {
                const payload = {
                  ...selectedEvidenceItem,
                  supervisor_signature_hash: signatureData, // Assigned to supervisor column
                };

                // const response = await axios.put("http://localhost:8081/intake_triage.php",
                const response = await axios.put("https://steadier-headscarf-maggot.ngrok-free.dev/intake_triage.php",
                  payload,
                );
                if (response.data?.status === "success") {
                  setToast({
                    isVisible: true,
                    message: "Supervisor authentication recorded successfully.",
                  });
                  setTimeout(
                    () => setToast({ isVisible: false, message: "" }),
                    4000,
                  );
                  closeTurnoverModal();
                  fetchPendingTurnovers();
                }
              } catch (err) {
                console.error("Supervisor signoff crash:", err);
              } finally {
                setLoading(false);
              }
            } else {
              // SCENARIO B: Standard transfer execution sequence (Custodian Signature)
              executeAcceptTurnover(signatureData);
            }
          }}
        />
      )}
      <EvidentiaFooter />
    </div>
  );
}
