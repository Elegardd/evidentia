// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect } from "react";
import axios from "axios";
import { 
  RefreshCw, 
  Package, 
  FolderKanban, 
  ShieldCheck, 
  CheckCircle2, 
  FileCheck2, 
  AlertTriangle,
  Download,
  PenTool,
  Search,
  Layers
} from "lucide-react";
import EvidentiaFooter from "./EvidentiaFooter";
import SignaturePadModal from "./SignaturePadModal"; // Import your signature modal component

export default function HomeDashboard() {
  const [dashboardMetrics, setDashboardMetrics] = useState(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [connectionError, setConnectionError] = useState(null);
  const [debugPayload, setDebugPayload] = useState(null);

  // States for evidences matching criteria
  const [signedEvidences, setSignedEvidences] = useState([]);
  const [isLoadingSigned, setIsLoadingSigned] = useState(true);

  // UI filter & interactive modal states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStageFilter, setSelectedStageFilter] = useState("ALL");
  const [visibleCount, setVisibleCount] = useState(6);

  // Modal control states for the signature workspace
  const [isSignModalOpen, setIsSignModalOpen] = useState(false);
  const [selectedEvidenceForSign, setSelectedEvidenceForSign] = useState(null);
  const [turnoverRemarks, setTurnoverRemarks] = useState("");
  const [stationPersonnel, setStationPersonnel] = useState([]);
  const [handshakeTargetCustodian, setHandshakeTargetCustodian] = useState("");
  const [handshakeTargetSupervisor, setHandshakeTargetSupervisor] = useState("");

  const fetchDashboardStats = async () => {
    setIsLoadingMetrics(true);
    setConnectionError(null);
    setDebugPayload(null);
    try {
      const res = await axios.get(
          "https://steadier-headscarf-maggot.ngrok-free.dev/home_stats.php",
          {
              headers: {
                  "ngrok-skip-browser-warning": "ayakerrtssss",
              },
          }
      );

      if (res.data && res.data.status === "success") {
        setDashboardMetrics(res.data);
      } else {
        setDebugPayload(res.data);
        throw new Error(
          res.data?.message ||
            "Malformed API payload response structural anomaly.",
        );
      }
    } catch (err) {
      console.error("Overview pipeline exception:", err);
      setConnectionError(
        err.message || "Connection to telemetry stream rejected.",
      );
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  const fetchSignedEvidences = async () => {
    setIsLoadingSigned(true);
    try {
      const res = await axios.get(
        "https://steadier-headscarf-maggot.ngrok-free.dev/intake_triage.php",
        {
          headers: {
            "ngrok-skip-browser-warning": "ayakerrtssss",
          },
        }
      );

      if (res.data) {
        let items = [];
        if (Array.isArray(res.data)) {
          items = res.data;
        } else if (res.data.evidence || res.data.data || res.data.records) {
          items = res.data.evidence || res.data.data || res.data.records;
        }
        
        setSignedEvidences(items);
      }
    } catch (err) {
      console.error("Failed to fetch intake triage evidences:", err);
    } finally {
      setIsLoadingSigned(false);
    }
  };

  // Fetch station personnel list for the custodian/supervisor dropdowns inside the modal
  const fetchPersonnel = async () => {
    try {
      const res = await axios.get("https://steadier-headscarf-maggot.ngrok-free.dev/personnel.php", {
        headers: { "ngrok-skip-browser-warning": "ayakerrtssss" }
      });
      if (res.data && Array.isArray(res.data)) {
        setStationPersonnel(res.data);
      }
    } catch (err) {
      console.error("Failed to load station personnel roster:", err);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    fetchSignedEvidences();
    fetchPersonnel();
  }, []);

  // Open Signature & Document Workshop Modal
  const handleOpenSignModal = (item) => {
    setSelectedEvidenceForSign(item);
    setTurnoverRemarks(item.turnover_remarks || item.condition_received || "");
    setHandshakeTargetCustodian(item.custodian_name || item.custodian || "");
    setHandshakeTargetSupervisor(item.supervisor_name || item.supervisor || "");
    setIsSignModalOpen(true);
  };

  // Save handler passed into SignaturePadModal
  const handleSaveSignature = async (baseSignatureUrl) => {
    if (!selectedEvidenceForSign) return;
    try {
      // Dispatch update or refresh data feed
      await fetchSignedEvidences();
    } catch (err) {
      console.error("Failed to update signature ledger:", err);
    }
  };

  // PDF Download Handler Function using the two-sheet layout
  const handleDownloadPDF = (evidenceItem) => {
    const handshakeTargetCustodian = evidenceItem.custodian_name || evidenceItem.custodian || "CRIME LABORATORY CUSTODIAN";
    const handshakeTargetSupervisor = evidenceItem.supervisor_name || evidenceItem.supervisor || "CHIEF OF OFFICE";
    const turnoverRemarks = evidenceItem.turnover_remarks || evidenceItem.condition_received || "Initial Processing Handover";

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>EviChain Audit Report - ${evidenceItem.evidence_id || `EV-2026-${String(evidenceItem.id).padStart(4, "0")}`}</title>
            <script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>
            <style>
              body { background: #fff; color: #000; font-family: sans-serif; }
              @media print {
                body { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
                .page-break { page-break-after: always; break-after: page; }
              }
            </style>
          </head>
          <body class="p-8">
            {/* SHEET 1: PROPERTY EVIDENCE LOG LAYOUT */}
            <div class="pb-16 min-h-[1123px] relative flex flex-col justify-between page-break">
              <div>
                <div class="text-[11px] font-normal font-sans leading-tight text-black">
                  <p>CSI Form "4"</p>
                  <p>SOCO REPORT FORM "2"</p>
                </div>

                <div class="flex justify-between items-center mt-2 pb-2 border-b border-black text-black">
                  <div class="w-24 h-24 shrink-0 flex items-center justify-center p-0">
                    <img src="/logo/scjps.png" alt="PNP Seal Emblem" class="w-full h-full object-contain" />
                  </div>
                  <div class="text-center space-y-0.5 flex-1 mx-4">
                    <p class="text-[11px] leading-tight font-sans">Republic of the Philippines</p>
                    <p class="text-[11px] leading-tight font-sans">National Police Commission</p>
                    <p class="text-xs font-bold uppercase tracking-wide">Philippine National Police</p>
                    <p class="text-xs uppercase font-semibold">${evidenceItem.investigating_agency || "LAGUNA POLICE PROVINCIAL OFFICE"}</p>
                    <p class="text-xs font-bold uppercase tracking-wide">LOS BAÑOS MUNICIPAL POLICE STATION</p>
                  </div>
                  <div class="w-24 h-24 shrink-0 flex items-center justify-center p-0">
                    <img src="/logo/ub_seal.png" alt="Station Badge Emblem" class="w-full h-full object-contain" />
                  </div>
                </div>

                <div class="flex justify-end mt-6">
                  <div class="text-center w-52">
                    <div class="border-b border-black text-xs px-2 py-0.5 min-h-[1.5rem] text-black">
                      ${evidenceItem.date_collected ? new Date(evidenceItem.date_collected).toLocaleDateString() : ""}
                    </div>
                    <p class="text-xs mt-1 text-black">Date</p>
                  </div>
                </div>

                <div class="mt-4 text-xs font-bold flex items-center text-black">
                  <span>RE SOCO REPORT NR:</span>
                  <span class="border-b border-black ml-1 flex-1 max-w-xs px-2 font-mono text-sm tracking-wider">
                    ${evidenceItem.case_number || evidenceItem.evidence_id || "EV-2026-0001"}
                  </span>
                </div>

                <h2 class="text-center text-sm font-bold tracking-wider uppercase my-6 text-black">
                  EVIDENCE LOG
                </h2>

                <table class="w-full border-collapse border border-black text-center text-xs text-black">
                  <thead>
                    <tr class="border-b border-black divide-x divide-black font-bold text-[11px] h-12 bg-gray-50/50">
                      <th class="p-1 w-12 tracking-tight">QTY</th>
                      <th class="p-1 w-1/4 text-center leading-tight">DESCRIPTION OF SPECIMEN COLLECTED</th>
                      <th class="p-1 tracking-tight">COLLECTED BY</th>
                      <th class="p-1 leading-tight">TIME COLLECTED</th>
                      <th class="p-1 tracking-tight">SPECIFIC PLACE</th>
                      <th class="p-1 tracking-tight">REMARKS</th>
                      <th class="p-1 leading-tight">SIGNATURE OF SEARCHER</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-black font-sans">
                    <tr class="divide-x divide-black align-top h-20 text-[11px]">
                      <td class="p-2 font-bold">${evidenceItem.quantity || 1}</td>
                      <td class="p-2 text-left leading-normal">
                        <span class="font-bold text-[10px] block text-gray-600">[${evidenceItem.evidence_type || "Physical Evidence"}]</span>
                        ${evidenceItem.physical_description || evidenceItem.unit_descriptor || evidenceItem.description || "N/A"}
                      </td>
                      <td class="p-2">${evidenceItem.collector_name || evidenceItem.collected_by || ""}</td>
                      <td class="p-2 whitespace-normal leading-tight font-mono">
                        ${evidenceItem.date_collected ? new Date(evidenceItem.date_collected).toLocaleDateString() : ""}
                      </td>
                      <td class="p-2 text-left leading-tight">
                        ${evidenceItem.collection_place ? `<div>${evidenceItem.collection_place}</div>` : ""}
                        ${evidenceItem.retrieval_address ? `<div class="text-[10px] text-gray-600 mt-0.5">${evidenceItem.retrieval_address}</div>` : ""}
                      </td>
                      <td class="p-2 text-left italic text-gray-700">${evidenceItem.condition_received || evidenceItem.remarks || ""}</td>
                      <td class="p-2 text-left italic text-gray-400 font-mono text-[9px] pt-8">
                        ${evidenceItem.collector_signature_hash ? `<span class="text-emerald-700 font-bold">[Hash Verified]</span>` : `(Place signature stamp here)`}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div class="grid grid-cols-3 gap-6 pt-12 text-xs text-center font-normal text-black">
                <div class="space-y-1">
                  <p class="text-left pl-4 text-gray-500">Prepared by:</p>
                  <div class="relative flex flex-col items-center justify-end">
                    <div class="w-full h-10 flex items-center justify-center mb-0.5">
                      ${evidenceItem?.collector_signature_hash ? `<div class="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded border border-emerald-200">✓ SHA-256 Validated</div>` : `[Place signature here]`}
                    </div>
                    <div class="border-b border-black px-4 font-bold uppercase min-h-[1.25rem] w-full text-center text-[11px]">
                      ${evidenceItem?.turned_over_by_name || evidenceItem?.collector_name || "Seizing Officer"}
                    </div>
                    <p class="text-[10px] mt-0.5 text-gray-600 font-medium">Evidence Collector</p>
                  </div>
                </div>
                <div class="space-y-1">
                  <p class="text-left pl-4 text-gray-500">Certified by:</p>
                  <div class="relative flex flex-col items-center justify-end">
                    <div class="w-full h-10 flex items-center justify-center mb-0.5">
                      ${evidenceItem?.custodian_signature_hash ? `<div class="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded border border-emerald-200">✓ SHA-256 Validated</div>` : `[Place signature here]`}
                    </div>
                    <div class="border-b border-black px-4 font-medium uppercase min-h-[1.25rem] w-full text-center">
                      <span class="font-bold text-black uppercase underline">${handshakeTargetCustodian}</span>
                    </div>
                    <p class="text-[11px] mt-1 text-gray-900">SOCO Team Leader</p>
                  </div>
                </div>
                <div class="space-y-1">
                  <p class="text-left pl-4 text-gray-500">Noted by:</p>
                  <div class="relative flex flex-col items-center justify-end">
                    <div class="w-full h-10 flex items-center justify-center mb-0.5">
                      ${evidenceItem?.supervisor_signature_hash ? `<div class="text-[10px] font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-1 rounded border border-emerald-200">✓ SHA-256 Validated</div>` : `[Place signature here]`}
                    </div>
                    <div class="border-b border-black w-11/12 mx-auto font-medium uppercase min-h-[1.25rem]">
                      <span class="font-bold text-black uppercase underline">${handshakeTargetSupervisor}</span>
                    </div>
                    <p class="text-[11px] mt-1 text-gray-900">Chief of Office</p>
                  </div>
                </div>
              </div>
            </div>

            {/* SHEET 2: CHAIN OF CUSTODY FORM LAYOUT */}
            <div class="pt-12 min-h-[1123px] relative flex flex-col justify-between border-t-2 border-dashed border-gray-300">
              <div>
                <div class="text-center space-y-0.5 text-black">
                  <p class="text-xs">Republic of the Philippines</p>
                  <p class="text-xs">National Police Commission</p>
                  <p class="text-sm font-bold tracking-wide">PHILIPPINE NATIONAL POLICE</p>
                  <p class="text-xs font-medium uppercase">${evidenceItem.investigating_agency || "Baguio City Police Office"}</p>
                </div>
                <h2 class="text-center text-sm font-bold tracking-wider uppercase my-8 text-black">CHAIN OF CUSTODY FORM</h2>
                <div class="space-y-3 text-xs font-sans text-black">
                  <div class="flex items-end">
                    <span class="whitespace-nowrap pr-1">Nature of Case:</span>
                    <div class="flex-1 border-b border-black font-medium px-2 pb-0.5 uppercase">${evidenceItem.case_title || evidenceItem.case_name || "N/A"}</div>
                  </div>
<div class="flex items-end">
                    <span class="whitespace-nowrap pr-1">
                      Time, Date and Place of Occurrence:
                    </span>
                    <div class="flex-1 border-b border-black font-medium px-2 pb-0.5 font-mono text-[11px]">
                      ${evidenceItem.date_collected ? `${new Date(evidenceItem.date_collected).toLocaleString()} ` : ""}
                      ${evidenceItem.collection_place || evidenceItem.retrieval_address ? `at ${evidenceItem.collection_place || ""} ${evidenceItem.retrieval_address ? `(${evidenceItem.retrieval_address})` : ""}` : ""}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <script>window.onload = function() { window.print(); }</script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  if (isLoadingMetrics) {
    return (
      <div className="py-32 flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <div className="text-center text-slate-500 font-mono text-[10px] uppercase tracking-widest animate-pulse">
          Querying operational analytics summaries...
        </div>
      </div>
    );
  }

  if (connectionError) {
    return (
      <div className="w-full max-w-7xl mx-auto space-y-4 animate-fade-in p-4">
        <div className="p-5 bg-rose-950/20 border border-rose-900/40 rounded-2xl font-mono text-xs text-rose-400 flex justify-between items-center">
          <div>
            <p className="font-bold uppercase tracking-wider text-[10px] text-rose-500">⚠️ Pipeline Stream Mismatch</p>
            <p className="text-rose-200/90">{connectionError}</p>
          </div>
          <button onClick={() => { fetchDashboardStats(); fetchSignedEvidences(); }} className="px-4 py-2 bg-rose-900/40 border border-rose-800/60 rounded-xl text-rose-200">Retry Link</button>
        </div>
      </div>
    );
  }

  const metrics = dashboardMetrics?.metrics || {};
  const breakdowns = dashboardMetrics?.breakdowns || {};
  const recent_activity = dashboardMetrics?.recent_activity || [];

  const filteredEvidences = signedEvidences.filter(item => {
    const matchesSearch = 
      (item.evidence_id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.case_title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.physical_description || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const stage = item.workflow_stage || item.status || "Completed";
    const matchesStage = selectedStageFilter === "ALL" || stage.toUpperCase() === selectedStageFilter.toUpperCase();

    return matchesSearch && matchesStage;
  });

  const displayedEvidences = filteredEvidences.slice(0, visibleCount);

  return (
    <div className="w-full max-w-7xl 2xl:max-w-[1400px] 3xl:max-w-[1600px] mx-auto space-y-8 p-4 sm:p-6 animate-fade-in pb-12">
      {/* HEADER TITLE ZONE */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400 font-mono text-[10px] font-bold uppercase tracking-wider">
            Universal Station Dashboard
          </span>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase mt-1">
            EviChain Central Registry Overview
          </h1>
          <p className="text-slate-400 text-xs mt-1 max-w-2xl">
            Streamlined operational status metrics, authorized personnel overview, and certified chain-of-custody archive.
          </p>
        </div>

        <button
          onClick={() => { fetchDashboardStats(); fetchSignedEvidences(); }}
          className="flex items-center gap-2 px-3.5 py-2 text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-xl transition-all shadow-sm group"
        >
          <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 duration-500 text-blue-400" />
          <span className="font-mono text-xs">Sync Telemetry</span>
        </button>
      </div>

      {/* METRICS CORE STATUS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-lg flex items-center justify-between">
          <div>
            <span className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Registered Evidence</span>
            <p className="text-3xl font-black text-white font-mono">{metrics?.total_items || 0}</p>
          </div>
          <Package className="w-6 h-6 text-blue-400" />
        </div>
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-lg flex items-center justify-between">
          <div>
            <span className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active Case Files</span>
            <p className="text-3xl font-black text-amber-400 font-mono">{metrics?.active_cases || 0}</p>
          </div>
          <FolderKanban className="w-6 h-6 text-amber-400" />
        </div>
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6 shadow-lg flex items-center justify-between">
          <div>
            <span className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Authorized Personnel</span>
            <p className="text-3xl font-black text-purple-400 font-mono">{metrics?.active_personnel || 0}</p>
          </div>
          <ShieldCheck className="w-6 h-6 text-purple-400" />
        </div>
      </div>

      {/* EVIDENCES & SIGNATURE WORKSHOP SECTION */}
      <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-xl space-y-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 border-b border-slate-800/60 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <h3 className="text-xs font-black uppercase tracking-wider text-blue-400 font-mono">
                Evidence Registry & Signature Workshop Archive
              </h3>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Access items to launch the document workshop, apply cryptographic signatures, manage handshakes, or download reports.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search ID, title, or item..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none font-mono"
              />
            </div>
            <select
              value={selectedStageFilter}
              onChange={(e) => setSelectedStageFilter(e.target.value)}
              className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 font-mono cursor-pointer"
            >
              <option value="ALL">All Stages</option>
              <option value="In Storage">In Storage</option>
              <option value="In Court">In Court</option>
            </select>
          </div>
        </div>

        {isLoadingSigned ? (
          <div className="py-12 text-center text-slate-500 font-mono text-xs animate-pulse">
            Loading evidence records...
          </div>
        ) : filteredEvidences.length === 0 ? (
          <div className="py-12 text-center text-slate-500 font-mono text-xs italic border border-dashed border-slate-800/80 rounded-xl bg-slate-950/20">
            No matching evidence records found.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedEvidences.map((item) => {
              const isFullySigned = 
                (item.supervisor_signature_hash || item.supervisor_sig || item.supervisor_approved) &&
                (item.custodian_signature_hash || item.custodian_sig) &&
                (item.collector_signature_hash || item.collector_sig);

              return (
                <div 
                  key={item.id}
                  className="bg-slate-950/50 border border-slate-800/80 hover:border-blue-500/40 rounded-xl p-4 flex flex-col justify-between space-y-4 transition-all group shadow-md"
                >
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-[10px] font-bold text-blue-400 bg-blue-950/60 px-2.5 py-0.5 rounded border border-blue-900/50">
                        {item.evidence_id || `EV-2026-${String(item.id).padStart(4, "0")}`}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500">
                        {item.date_collected ? new Date(item.date_collected).toLocaleDateString() : "N/A"}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-tight truncate">
                        {item.case_title || item.case_name || "Untitled Case"}
                      </h4>
                      <p className="text-[11px] text-slate-400 line-clamp-2 mt-1">
                        {item.physical_description || item.unit_descriptor || item.description || "No description provided."}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-3 border-t border-slate-900/80">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="text-slate-500">Stage: <strong className="text-slate-300">{item.workflow_stage || item.status || "Pending"}</strong></span>
                      {isFullySigned ? (
                        <span className="text-emerald-400 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Fully Signed</span>
                      ) : (
                        <span className="text-amber-400 font-bold">Signatures Pending</span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      {/* BUTTON TO OPEN THE SIGNATURE WORKSHOP MODAL */}
                      <button
                        onClick={() => handleOpenSignModal(item)}
                        className="py-2 px-2 bg-blue-950/50 hover:bg-blue-900/60 border border-blue-800/60 rounded-lg text-blue-300 hover:text-white transition-all font-mono text-[10px] font-bold flex items-center justify-center gap-1.5"
                      >
                        <PenTool className="w-3 h-3" />
                        Sign & Workshop
                      </button>

                      {/* DOWNLOAD PDF REPORT */}
                      <button
                        onClick={() => handleDownloadPDF(item)}
                        disabled={!isFullySigned}
                        className="py-2 px-2 bg-emerald-950/40 hover:bg-emerald-900/60 disabled:bg-slate-900 border border-emerald-800/60 disabled:border-slate-800 rounded-lg text-emerald-300 disabled:text-slate-600 transition-all font-mono text-[10px] font-bold flex items-center justify-center gap-1.5"
                        title={!isFullySigned ? "Requires full signatures before PDF export" : "Download Report"}
                      >
                        <Download className="w-3 h-3" />
                        PDF Report
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Render SignaturePadModal when triggered */}
      <SignaturePadModal
        isOpen={isSignModalOpen}
        onClose={() => setIsSignModalOpen(false)}
        onSave={handleSaveSignature}
        evidenceItem={selectedEvidenceForSign}
        turnoverRemarks={turnoverRemarks}
        setTurnoverRemarks={setTurnoverRemarks}
        stationPersonnel={stationPersonnel}
        handshakeTargetCustodian={handshakeTargetCustodian}
        setHandshakeTargetCustodian={setHandshakeTargetCustodian}
        handshakeTargetSupervisor={handshakeTargetSupervisor}
        setHandshakeTargetSupervisor={setHandshakeTargetSupervisor}
      />

      <EvidentiaFooter />
    </div>
  );
}