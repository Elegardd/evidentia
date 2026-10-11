// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { 
  RefreshCw, 
  Package, 
  FolderKanban, 
  ShieldCheck, 
  Search,
  Layers,
  FileText,
  BarChart3,
  PieChart,
  Users,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  SlidersHorizontal
} from "lucide-react";
import EvidentiaFooter from "./EvidentiaFooter";

export default function HomeDashboard() {
  const [dashboardMetrics, setDashboardMetrics] = useState(null);
  const [isLoadingMetrics, setIsLoadingMetrics] = useState(true);
  const [connectionError, setConnectionError] = useState(null);

  // States for evidences matching criteria
  const [signedEvidences, setSignedEvidences] = useState([]);
  const [isLoadingSigned, setIsLoadingSigned] = useState(true);

  // Analytics Filter States (Slicers)
  const [selectedStageFilter, setSelectedStageFilter] = useState("ALL");
  const [selectedTypeFilter, setSelectedTypeFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Dropdown open/close states
  const [isStageOpen, setIsStageOpen] = useState(false);
  const [isTypeOpen, setIsTypeOpen] = useState(false);

  // References for click-outside closing
  const stageRef = useRef(null);
  const typeRef = useRef(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 9;

  // Station personnel roster state
  const [stationPersonnel, setStationPersonnel] = useState([]);

  // Modals
  const [isTimelineModalOpen, setIsTimelineModalOpen] = useState(false);
  const [selectedEvidenceForTimeline, setSelectedEvidenceForTimeline] = useState(null);

  const [isSlipModalOpen, setIsSlipModalOpen] = useState(false);
  const [selectedEvidenceForSlip, setSelectedEvidenceForSlip] = useState(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (stageRef.current && !stageRef.current.contains(event.target)) {
        setIsStageOpen(false);
      }
      if (typeRef.current && !typeRef.current.contains(event.target)) {
        setIsTypeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchDashboardStats = async () => {
    setIsLoadingMetrics(true);
    setConnectionError(null);
    try {
      const res = await axios.get(
        "https://steadier-headscarf-maggot.ngrok-free.dev/home_stats.php",
        { headers: { "ngrok-skip-browser-warning": "ayakerrtssss" } }
      );

      if (res.data && res.data.status === "success") {
        setDashboardMetrics(res.data);
      } else {
        throw new Error(res.data?.message || "Malformed API payload.");
      }
    } catch (err) {
      console.error("Overview pipeline exception:", err);
      setConnectionError(err.message || "Connection to telemetry stream rejected.");
    } finally {
      setIsLoadingMetrics(false);
    }
  };

  const fetchSignedEvidences = async () => {
    setIsLoadingSigned(true);
    try {
      const res = await axios.get(
        "https://steadier-headscarf-maggot.ngrok-free.dev/intake_triage.php",
        { headers: { "ngrok-skip-browser-warning": "ayakerrtssss" } }
      );

      if (res.data) {
        let items = Array.isArray(res.data) ? res.data : (res.data.evidence || res.data.records || []);
        setSignedEvidences(items);
      }
    } catch (err) {
      console.error("Failed to fetch intake triage evidences:", err);
    } finally {
      setIsLoadingSigned(false);
    }
  };

  const fetchPersonnel = async () => {
    try {
      const res = await axios.get("https://steadier-headscarf-maggot.ngrok-free.dev/get_users.php", {
        headers: { "ngrok-skip-browser-warning": "ayakerrtssss" }
      });
      if (res.data && res.data.users && Array.isArray(res.data.users)) {
        setStationPersonnel(res.data.users);
      } else if (Array.isArray(res.data)) {
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

  // Export filtered evidences to CSV for Excel analysis
  const exportToCSV = () => {
    const headers = ["Evidence ID,Case Number,Case Title,Evidence Type,Workflow Stage,Collector Name,Investigating Agency,Date Collected"];
    const rows = filteredEvidences.map(item => 
      `"${item.evidence_id || ""}","${item.case_number || ""}","${item.case_title || ""}","${item.evidence_type || ""}","${item.workflow_stage || ""}","${item.collector_name || ""}","${item.investigating_agency || ""}","${item.date_collected || ""}"`
    );
    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `EviChain_Analytics_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoadingMetrics) {
    return (
      <div className="py-32 flex flex-col items-center justify-center space-y-4">
        <div className="w-8 h-8 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <div className="text-center text-slate-500 font-mono text-[10px] uppercase tracking-widest animate-pulse">
          Generating Analytics Dashboard...
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

  // Analytics Computation for Visualization Widgets
  const totalItemsCount = signedEvidences.length || 1;
  const inStorageCount = signedEvidences.filter(i => (i.workflow_stage || "").toLowerCase() === "in storage").length;
  const storagePercentage = Math.round((inStorageCount / totalItemsCount) * 100);

  // Dynamic Type Breakdown Metrics
  const evidenceTypes = {};
  signedEvidences.forEach(item => {
    const type = item.evidence_type || "Uncategorized";
    evidenceTypes[type] = (evidenceTypes[type] || 0) + 1;
  });

  // Dynamic Stage Breakdown Metrics
  const stageBreakdown = {
    "On Field": signedEvidences.filter(i => (i.workflow_stage || "").toLowerCase() === "on field").length,
    "Turnover Pending": signedEvidences.filter(i => (i.workflow_stage || "").toLowerCase() === "turnover pending").length,
    "In Storage": signedEvidences.filter(i => (i.workflow_stage || "").toLowerCase() === "in storage").length,
    "In Court": signedEvidences.filter(i => (i.workflow_stage || "").toLowerCase() === "in court").length,
  };

  const filteredEvidences = signedEvidences.filter(item => {
    const matchesSearch = 
      (item.evidence_id || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.case_number || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.case_title || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.physical_description || "").toLowerCase().includes(searchQuery.toLowerCase());
    
    const stage = item.workflow_stage || "On Field";
    const matchesStage = selectedStageFilter === "ALL" || stage.toUpperCase() === selectedStageFilter.toUpperCase();
    
    const type = item.evidence_type || "";
    const matchesType = selectedTypeFilter === "ALL" || type.toUpperCase() === selectedTypeFilter.toUpperCase();

    return matchesSearch && matchesStage && matchesType;
  });

  // Pagination Calculations (10 items per page)
  const totalPages = Math.ceil(filteredEvidences.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentEvidences = filteredEvidences.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 p-4 sm:p-6 animate-fade-in pb-12 text-slate-100">
      
      {/* HEADER TITLE BAR */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase mt-1">
            EviChain Central Intelligence Command
          </h1>
          <p className="text-slate-400 text-xs mt-1 max-w-2xl">
            Real-time evidence tracking, custody stage breakdowns, officer activity ratios, and verified digital chain-of-custody archive.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-3.5 py-2 text-emerald-300 hover:text-white bg-emerald-950/40 border border-emerald-800/60 rounded-xl transition-all shadow-sm group cursor-pointer"
            title="Export filtered records to Excel / CSV"
          >
            <Download className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
            <span className="font-mono text-xs">Export CSV</span>
          </button>

          <button
            onClick={() => { fetchDashboardStats(); fetchSignedEvidences(); fetchPersonnel(); }}
            className="flex items-center gap-2 px-3.5 py-2 text-slate-300 hover:text-white bg-slate-900 border border-slate-800 rounded-xl transition-all shadow-sm group cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 group-hover:rotate-180 duration-500 text-blue-400" />
            <span className="font-mono text-xs">Sync</span>
          </button>
        </div>
      </div>

      {/* TOP KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 shadow-lg flex items-center justify-between backdrop-blur-md">
          <div>
            <span className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Total Evidence</span>
            <p className="text-2xl sm:text-3xl font-black text-white font-mono mt-1">{metrics?.total_items || signedEvidences.length || 0}</p>
          </div>
          <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <Package className="w-5 h-5 text-blue-400" />
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 shadow-lg flex items-center justify-between backdrop-blur-md">
          <div>
            <span className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Active Cases</span>
            <p className="text-2xl sm:text-3xl font-black text-amber-400 font-mono mt-1">{metrics?.active_cases || 0}</p>
          </div>
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <FolderKanban className="w-5 h-5 text-amber-400" />
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 shadow-lg flex items-center justify-between backdrop-blur-md">
          <div>
            <span className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Vault Secured</span>
            <p className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono mt-1">{inStorageCount}</p>
          </div>
          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
          </div>
        </div>

        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl p-5 shadow-lg flex items-center justify-between backdrop-blur-md">
          <div>
            <span className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Personnel</span>
            <p className="text-2xl sm:text-3xl font-black text-purple-400 font-mono mt-1">{metrics?.active_personnel || stationPersonnel.length || 0}</p>
          </div>
          <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl">
            <Users className="w-5 h-5 text-purple-400" />
          </div>
        </div>
      </div>

      {/* DASHBOARD ANALYTICS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* WIDGET 1: Vault Secured Ratio Gauge */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-md shadow-xl flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold uppercase text-white tracking-wider flex items-center gap-2">
              <PieChart className="w-4 h-4 text-emerald-400" /> Evidence Metrics
            </h3>
            <span className="text-[10px] font-mono text-slate-500">Ratio Metric</span>
          </div>

          <div className="flex flex-col items-center justify-center py-4 space-y-2">
            <div className="relative w-32 h-32 flex items-center justify-center rounded-full border-8 border-slate-800 border-t-emerald-500 border-r-emerald-500 animate-pulse">
              <span className="text-2xl font-black font-mono text-white">{storagePercentage}%</span>
            </div>
            <p className="text-xs text-slate-400 font-mono text-center">
              <strong className="text-emerald-400">{inStorageCount}</strong> of <strong className="text-white">{totalItemsCount}</strong> items fully checked into evidence vault storage.
            </p>
          </div>
        </div>

        {/* WIDGET 2: Workflow Lifecycle Breakdown Bar Chart */}
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-md shadow-xl flex flex-col justify-between space-y-4 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h3 className="text-xs font-bold uppercase text-white tracking-wider flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-blue-400" /> Evidence Lifecycle Stage Distribution
            </h3>
            <span className="text-[10px] font-mono text-slate-500">Live Status</span>
          </div>

          <div className="space-y-3 py-2">
            {Object.entries(stageBreakdown).map(([stage, count]) => {
              const pct = Math.round((count / totalItemsCount) * 100) || 0;
              return (
                <div key={stage} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-slate-300 font-semibold">{stage}</span>
                    <span className="text-slate-400">{count} items ({pct}%)</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-2.5 overflow-hidden border border-slate-800">
                    <div 
                      className={`h-full rounded-full transition-all duration-1000 ${
                        stage === "In Storage" ? "bg-emerald-500" :
                        stage === "Turnover Pending" ? "bg-purple-500" :
                        stage === "In Court" ? "bg-indigo-500" : "bg-amber-500"
                      }`} 
                      style={{ width: `${pct}%` }} 
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* CERTIFIED EVIDENCE ARCHIVE TABLE WITH SLICER FILTERS */}
      <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 space-y-6 backdrop-blur-md shadow-xl">
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-sm font-bold uppercase text-white tracking-wider flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" /> Certified Chain-of-Custody Archive
            </h3>
            <p className="text-xs text-slate-400">Search records, click ID for lifecycle timeline, or view document slip reviews (10 items per page).</p>
          </div>

          {/* Interactive Slicers Toolbar */}
          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            {/* Search Input */}
            <div className="relative flex-1 md:w-56">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search case, ID..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
              />
            </div>

            {/* Custom Theme-Matched Stage Filter Dropdown */}
            <div className="relative" ref={stageRef}>
              <button
                type="button"
                onClick={() => {
                  setIsStageOpen(!isStageOpen);
                  setIsTypeOpen(false);
                }}
                className="flex items-center gap-2 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 cursor-pointer transition-colors shadow-inner"
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-medium">{selectedStageFilter === "ALL" ? "All Stages" : selectedStageFilter}</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isStageOpen ? "rotate-180" : ""}`} />
              </button>

              {isStageOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-48 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50 space-y-1">
                  {["ALL", "On Field", "Turnover Pending", "In Storage", "In Court"].map((stage) => (
                    <button
                      key={stage}
                      type="button"
                      onClick={() => {
                        setSelectedStageFilter(stage);
                        setIsStageOpen(false);
                        setCurrentPage(1);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                        selectedStageFilter === stage
                          ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                          : "text-slate-300 hover:bg-slate-900 hover:text-white"
                      }`}
                    >
                      {stage === "ALL" ? "All Stages" : stage}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Custom Theme-Matched Type Filter Dropdown */}
            <div className="relative" ref={typeRef}>
              <button
                type="button"
                onClick={() => {
                  setIsTypeOpen(!isTypeOpen);
                  setIsStageOpen(false);
                }}
                className="flex items-center gap-2 bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 cursor-pointer transition-colors shadow-inner"
              >
                <span className="font-medium">{selectedTypeFilter === "ALL" ? "All Types" : selectedTypeFilter}</span>
                <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isTypeOpen ? "rotate-180" : ""}`} />
              </button>

              {isTypeOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-52 bg-slate-950 border border-slate-800 rounded-xl shadow-2xl p-1.5 z-50 max-h-56 overflow-y-auto space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedTypeFilter("ALL");
                      setIsTypeOpen(false);
                      setCurrentPage(1);
                    }}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      selectedTypeFilter === "ALL"
                        ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                        : "text-slate-300 hover:bg-slate-900 hover:text-white"
                    }`}
                  >
                    All Types
                  </button>
                  {Object.keys(evidenceTypes).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setSelectedTypeFilter(type);
                        setIsTypeOpen(false);
                        setCurrentPage(1);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer truncate ${
                        selectedTypeFilter === type
                          ? "bg-blue-600/20 text-blue-400 border border-blue-500/30"
                          : "text-slate-300 hover:bg-slate-900 hover:text-white"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Evidence Cards Grid */}
        {isLoadingSigned ? (
          <div className="py-16 text-center text-slate-500 text-xs font-mono animate-pulse">
            Loading registry archive items...
          </div>
        ) : currentEvidences.length === 0 ? (
          <div className="py-16 text-center text-slate-500 text-xs font-mono italic">
            No verified evidence records found matching criteria.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {currentEvidences.map((item) => {
              const displayId = item.evidence_id || `EV-2026-${String(item.id || 0).padStart(4, "0")}`;
              const stage = item.workflow_stage || "On Field";

              return (
                <div key={item.id || displayId} className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-all">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start">
                      <button
                        onClick={() => {
                          setSelectedEvidenceForTimeline(item);
                          setIsTimelineModalOpen(true);
                        }}
                        className="font-mono text-xs font-bold text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
                        title="Click to view full Chain-of-Custody timeline"
                      >
                        {displayId} 🔍
                      </button>
                      <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md border ${
                        stage === "In Storage" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" :
                        stage === "Turnover Pending" ? "bg-purple-500/10 text-purple-400 border-purple-500/20" :
                        "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      }`}>
                        {stage}
                      </span>
                    </div>

                    <div>
                      <h4 className="font-bold text-slate-200 text-xs uppercase truncate">{item.case_title || item.case_number || "Unspecified Case"}</h4>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5 line-clamp-2">{item.physical_description || item.evidence_type || "No description provided."}</p>
                    </div>

                    <div className="text-[10px] text-slate-500 space-y-0.5 pt-1 border-t border-slate-900">
                      <p><span className="text-slate-400 font-bold">Station:</span> {item.investigating_agency || "N/A"}</p>
                      <p><span className="text-slate-400 font-bold">Collector:</span> {item.collector_name || "N/A"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-900">
                    <button
                      onClick={() => {
                        setSelectedEvidenceForSlip(item);
                        setIsSlipModalOpen(true);
                      }}
                      className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold py-2 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      title="View Form Slip"
                    >
                      <FileText className="w-3.5 h-3.5" /> View Form Slip
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls Footer */}
        {!isLoadingSigned && filteredEvidences.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between pt-4 border-t border-slate-800 gap-4">
            <span className="text-xs text-slate-400 font-mono">
              Showing <span className="text-white font-bold">{indexOfFirstItem + 1}</span> to <span className="text-white font-bold">{Math.min(indexOfLastItem, filteredEvidences.length)}</span> of <span className="text-white font-bold">{filteredEvidences.length}</span> records
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>

              <div className="flex items-center gap-1 px-2 font-mono text-xs text-slate-300">
                <span>Page</span>
                <span className="font-bold text-blue-400">{currentPage}</span>
                <span>of</span>
                <span className="font-bold text-white">{totalPages}</span>
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* CHAIN-OF-CUSTODY LIFECYCLE TIMELINE MODAL */}
      {isTimelineModalOpen && selectedEvidenceForTimeline && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-start border-b border-slate-800 pb-3">
              <div>
                <span className="text-[10px] font-mono text-blue-400 font-bold uppercase">Lifecycle Audit Trail</span>
                <h3 className="text-sm font-bold text-white uppercase mt-0.5">
                  {selectedEvidenceForTimeline.evidence_id || `EV-2026-${String(selectedEvidenceForTimeline.id || 0).padStart(4, "0")}`}
                </h3>
              </div>
              <button
                onClick={() => setIsTimelineModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs bg-slate-800 px-3 py-1.5 rounded-lg cursor-pointer font-bold"
              >
                Close
              </button>
            </div>

            <div className="space-y-4 relative pl-4 border-l-2 border-slate-800 my-2">
              <div className="relative">
                <div className="absolute -left-[21px] top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-slate-900" />
                <p className="text-xs font-bold text-white">1. Field Collection Logged</p>
                <p className="text-[11px] text-slate-400">Collected by {selectedEvidenceForTimeline.collector_name || "Officer"} at {selectedEvidenceForTimeline.collection_place || "Field Site"}.</p>
                <span className="text-[9px] text-slate-500 font-mono">{selectedEvidenceForTimeline.date_collected || "Initial Timestamp"}</span>
              </div>

              <div className="relative">
                <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-slate-900 ${selectedEvidenceForTimeline.workflow_stage !== "On Field" ? "bg-purple-500" : "bg-slate-700"}`} />
                <p className="text-xs font-bold text-white">2. Turnover Handshake & Verification</p>
                <p className="text-[11px] text-slate-400">{selectedEvidenceForTimeline.received_by_name ? `Received by Custodian: ${selectedEvidenceForTimeline.received_by_name}` : "Pending custodian confirmation."}</p>
              </div>

              <div className="relative">
                <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-slate-900 ${selectedEvidenceForTimeline.workflow_stage === "In Storage" || selectedEvidenceForTimeline.workflow_stage === "In Court" ? "bg-emerald-500" : "bg-slate-700"}`} />
                <p className="text-xs font-bold text-white">3. Secured Vault Storage</p>
                <p className="text-[11px] text-slate-400">{selectedEvidenceForTimeline.workflow_stage === "In Storage" ? "Item verified and secured in evidence locker vault." : "Awaiting vault check-in."}</p>
              </div>

              <div className="relative">
                <div className={`absolute -left-[21px] top-1 w-3 h-3 rounded-full border-2 border-slate-900 ${selectedEvidenceForTimeline.workflow_stage === "In Court" ? "bg-indigo-500" : "bg-slate-700"}`} />
                <p className="text-xs font-bold text-white">4. Court Dispatch & Presentation</p>
                <p className="text-[11px] text-slate-400">{selectedEvidenceForTimeline.workflow_stage === "In Court" ? "Dispatched for active judicial proceedings." : "Standard custody state."}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 text-right">
              <button
                onClick={() => {
                  setIsTimelineModalOpen(false);
                  setSelectedEvidenceForSlip(selectedEvidenceForTimeline);
                  setIsSlipModalOpen(true);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                View Form Slip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMBINED FORM SLIP PREVIEW MODAL */}
      {isSlipModalOpen && selectedEvidenceForSlip && (() => {
        const witnessList = selectedEvidenceForSlip.witness_names
          ? selectedEvidenceForSlip.witness_names.split(',').map(name => name.trim()).filter(Boolean)
          : [];

        return (
          <div className="print-portal-wrapper fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto flex justify-center p-4 sm:p-6 print:absolute print:inset-0 print:bg-white print:p-0 print:block print:z-[99999]">
            
            {/* Print CSS Override Styles */}
            <style dangerouslySetInnerHTML={{
              __html: `
                @media print {
                  body * {
                    visibility: hidden !important;
                  }

                  .print-portal-wrapper,
                  .print-portal-wrapper * {
                    visibility: visible !important;
                  }

                  html, body {
                    background-color: #ffffff !important;
                    color: #000000 !important;
                    margin: 0 !important;
                    padding: 0 !important;
                    height: auto !important;
                    overflow: visible !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }

                  .print-portal-wrapper {
                    position: absolute !important;
                    top: 0 !important;
                    left: 0 !important;
                    width: 100% !important;
                    background: #ffffff !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    overflow: visible !important;
                  }

                  .print-portal-card {
                    max-width: 100% !important;
                    width: 100% !important;
                    box-shadow: none !important;
                    border: none !important;
                    border-radius: 0 !important;
                    padding: 0 !important;
                    margin: 0 !important;
                    background: #ffffff !important;
                  }

                  .print-page-break {
                    page-break-after: always !important;
                    break-after: page !important;
                    border: none !important;
                    padding: 0 !important;
                    margin-bottom: 20px !important;
                  }

                  .print\\:hidden {
                    display: none !important;
                  }

                  @page {
                    size: A4 portrait;
                    margin: 10mm;
                  }
                }
              `
            }} />

            {/* Modal Card Container */}
            <div className="print-portal-card bg-white text-black w-full max-w-[210mm] mx-auto rounded-2xl shadow-2xl flex flex-col relative p-6 sm:p-10 my-auto print:p-0 print:my-0">
              
              {/* Action Bar Header */}
              <div className="flex justify-between items-center pb-4 border-b border-gray-300 print:hidden">
                <h3 className="font-bold text-sm uppercase tracking-wider text-black">Official Evidence & Chain of Custody Form Slip</h3>
                <div className="flex items-center gap-2">
                  {/* <button
                    type="button"
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-xs text-white font-bold uppercase rounded-lg cursor-pointer transition-colors"
                  >
                    Print / Export PDF
                  </button> */}
                  <button
                    type="button"
                    onClick={() => setIsSlipModalOpen(false)}
                    className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-xs text-gray-800 font-bold uppercase rounded-lg cursor-pointer transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>

              {/* Single Combined Scrollable Document Canvas */}
              <div className="py-6 space-y-10 overflow-y-auto max-h-[75vh] pr-2 print:overflow-visible print:max-h-none print:p-0 print:space-y-6">
                
                {/* SECTION 1: PROPERTY EVIDENCE LOG LAYOUT */}
                <div className="bg-white p-6 border border-gray-200 rounded-xl space-y-4 print-page-break print:p-0 print:border-none">
                  <div>
                    <div className="text-[11px] font-normal font-sans leading-tight text-black">
                      <p>CSI Form "4"</p>
                      <p>SOCO REPORT FORM "2"</p>
                    </div>

                    <div className="flex justify-between items-center mt-2 pb-2 border-b border-black text-black">
                      <div className="w-20 h-20 shrink-0 flex items-center justify-center p-0">
                        <img src="/logo/scjps.png" alt="PNP Seal Emblem" className="w-full h-full object-contain" />
                      </div>

                      <div className="text-center space-y-0.5 flex-1 mx-4">
                        <p className="text-[11px] leading-tight font-sans">Republic of the Philippines</p>
                        <p className="text-[11px] leading-tight font-sans">National Police Commission</p>
                        <p className="text-xs font-bold uppercase tracking-wide">PHILIPPINE NATIONAL POLICE</p>
                        <p className="text-xs uppercase font-semibold">{selectedEvidenceForSlip.investigating_agency || "PNP FORENSIC GROUP - REGIONAL FORENSIC UNIT"}</p>
                      </div>

                      <div className="w-20 h-20 shrink-0 flex items-center justify-center p-0">
                        <img src="/logo/ub_seal.png" alt="Station Badge Emblem" className="w-full h-full object-contain" />
                      </div>
                    </div>

                    <div className="flex justify-end mt-4">
                      <div className="text-center w-48">
                        <div className="border-b border-black text-xs px-2 py-0.5 min-h-[1.5rem] text-black">
                          {selectedEvidenceForSlip.date_collected ? new Date(selectedEvidenceForSlip.date_collected).toLocaleDateString(undefined, { month: "long", day: "numeric", year: "numeric" }) : ""}
                        </div>
                        <p className="text-xs mt-1 text-black">Date</p>
                      </div>
                    </div>

                    <div className="mt-3 text-xs font-bold flex items-center text-black">
                      <span>RE SOCO REPORT NR:</span>
                      <span className="border-b border-black ml-1 flex-1 max-w-xs px-2 font-mono text-sm tracking-wider">
                        {selectedEvidenceForSlip.case_number || "SOCO-REPORT-2026"}
                      </span>
                    </div>

                    <h2 className="text-center text-sm font-bold tracking-wider uppercase my-4 text-black">
                      EVIDENCE LOG SHEET
                    </h2>

                    <table className="w-full border-collapse border border-black text-center text-xs text-black">
                      <thead>
                        <tr className="border-b border-black divide-x divide-black font-bold text-[11px] h-10 bg-gray-50">
                          <th className="p-1 w-12 tracking-tight">QTY</th>
                          <th className="p-1 w-1/4 text-center leading-tight">DESCRIPTION OF SPECIMEN COLLECTED</th>
                          <th className="p-1 tracking-tight">COLLECTED BY</th>
                          <th className="p-1 leading-tight">TIME COLLECTED</th>
                          <th className="p-1 tracking-tight">SPECIFIC PLACE</th>
                          <th className="p-1 tracking-tight">REMARKS</th>
                          <th className="p-1 leading-tight">SIGNATURE OF SEARCHER</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-black font-sans">
                        <tr className="divide-x divide-black align-top h-16 text-[11px]">
                          <td className="p-2 font-bold">{selectedEvidenceForSlip.quantity || 1}</td>
                          <td className="p-2 text-left leading-normal">
                            <span className="font-bold text-[10px] block text-gray-600">[{selectedEvidenceForSlip.evidence_type || "Specimen"}]</span>
                            {selectedEvidenceForSlip.physical_description || selectedEvidenceForSlip.unit_descriptor || "N/A"}
                          </td>
                          <td className="p-2">{selectedEvidenceForSlip.collector_name || selectedEvidenceForSlip.turned_over_by_name || "Forensic Technician"}</td>
                          <td className="p-2 whitespace-normal leading-tight font-mono">
                            {selectedEvidenceForSlip.created_at ? new Date(selectedEvidenceForSlip.created_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" }) : ""}
                          </td>
                          <td className="p-2 text-left leading-tight">
                            {selectedEvidenceForSlip.collection_place && <div>{selectedEvidenceForSlip.collection_place}</div>}
                            {selectedEvidenceForSlip.retrieval_address && <div className="text-[10px] text-gray-600 mt-0.5">{selectedEvidenceForSlip.retrieval_address}</div>}
                          </td>
                          <td className="p-2 text-left italic text-gray-700">{selectedEvidenceForSlip.condition_received || "[Handover Note]: Stored"}</td>
                          <td className="p-2 text-center align-middle relative min-w-[100px]">
                            {selectedEvidenceForSlip?.collector_signature_hash ? (
                              <img src={selectedEvidenceForSlip.collector_signature_hash} alt="Searcher Signature" className="mx-auto max-h-10 max-w-full object-contain" />
                            ) : (
                              <span className="text-[9px] text-gray-400 italic">(Signature Stamp)</span>
                            )}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Signatures Block with Rendered Signature Images */}
                  <div className="grid grid-cols-3 gap-6 pt-6 text-xs text-center font-normal text-black">
                    <div className="space-y-1 relative flex flex-col items-center justify-end">
                      <p className="text-left w-full text-gray-500">Prepared by:</p>
                      <div className="w-full h-10 flex items-center justify-center mb-0.5">
                        {selectedEvidenceForSlip?.collector_signature_hash ? (
                          <img src={selectedEvidenceForSlip.collector_signature_hash} alt="Prepared By Signature" className="max-h-10 max-w-full object-contain" />
                        ) : (
                          <span className="text-[9px] text-gray-400 italic">[Signature]</span>
                        )}
                      </div>
                      <div className="border-b border-black font-bold uppercase min-h-[1.25rem] text-[11px] w-full">
                        {selectedEvidenceForSlip.collector_name || "FORENSIC TECHNICIAN"}
                      </div>
                      <p className="text-[10px] text-gray-600">Evidence Collector</p>
                    </div>

                    <div className="space-y-1 relative flex flex-col items-center justify-end">
                      <p className="text-left w-full text-gray-500">Certified by:</p>
                      <div className="w-full h-10 flex items-center justify-center mb-0.5">
                        {selectedEvidenceForSlip?.custodian_signature_hash ? (
                          <img src={selectedEvidenceForSlip.custodian_signature_hash} alt="Certified By Signature" className="max-h-10 max-w-full object-contain" />
                        ) : (
                          <span className="text-[9px] text-gray-400 italic">[Signature]</span>
                        )}
                      </div>
                      <div className="border-b border-black font-bold uppercase min-h-[1.25rem] text-[11px] w-full">
                        {selectedEvidenceForSlip.received_by_name || selectedEvidenceForSlip.certified_by || "PSSG CUSTODIAN CUSTODIAN"}
                      </div>
                      <p className="text-[10px] text-gray-600">SOCO Team Leader</p>
                    </div>

                    <div className="space-y-1 relative flex flex-col items-center justify-end">
                      <p className="text-left w-full text-gray-500">Noted by:</p>
                      <div className="w-full h-10 flex items-center justify-center mb-0.5">
                        {selectedEvidenceForSlip?.supervisor_signature_hash ? (
                          <img src={selectedEvidenceForSlip.supervisor_signature_hash} alt="Noted By Signature" className="max-h-10 max-w-full object-contain" />
                        ) : (
                          <span className="text-[9px] text-gray-400 italic">[Signature]</span>
                        )}
                      </div>
                      <div className="border-b border-black font-bold uppercase min-h-[1.25rem] text-[11px] w-full">
                        {selectedEvidenceForSlip.noted_by || "SUPERVISOR SUPERVISOR"}
                      </div>
                      <p className="text-[10px] text-gray-600">Chief of Office</p>
                    </div>
                  </div>
                </div>

                {/* SECTION 2: CHAIN OF CUSTODY FORM LAYOUT */}
                <div className="bg-white p-6 border border-gray-200 rounded-xl space-y-4 print-page-break print:p-0 print:border-none">
                  <div className="text-center space-y-0.5 text-black">
                    <p className="text-xs">Republic of the Philippines</p>
                    <p className="text-xs">National Police Commission</p>
                    <p className="text-sm font-bold tracking-wide">PHILIPPINE NATIONAL POLICE</p>
                    <p className="text-xs font-medium uppercase">{selectedEvidenceForSlip.investigating_agency || "PNP FORENSIC GROUP - REGIONAL FORENSIC UNIT (RFU-CAR)"}</p>
                  </div>

                  <h2 className="text-center text-sm font-bold tracking-wider uppercase my-4 text-black">
                    CHAIN OF CUSTODY FORM
                  </h2>

                  <div className="space-y-2.5 text-xs font-sans text-black">
                    <div className="flex items-end">
                      <span className="whitespace-nowrap pr-2 font-bold">Nature of Case:</span>
                      <div className="flex-1 border-b border-black font-medium px-2 pb-0.5 uppercase">
                        {selectedEvidenceForSlip.case_title || selectedEvidenceForSlip.case_number || "PINAKAAAA TESTING"}
                      </div>
                    </div>

                    <div className="flex items-end">
                      <span className="whitespace-nowrap pr-2 font-bold">Evidence ID:</span>
                      <div className="flex-1 border-b border-black font-mono font-bold px-2 pb-0.5">
                        {selectedEvidenceForSlip.evidence_id || `EV-2026-${String(selectedEvidenceForSlip.id || 0).padStart(4, "0")}`}
                      </div>
                    </div>

                    <div className="flex items-end">
                      <span className="whitespace-nowrap pr-2 font-bold">Workflow Stage:</span>
                      <div className="flex-1 border-b border-black font-bold px-2 pb-0.5 text-blue-800">
                        {selectedEvidenceForSlip.workflow_stage || "In Court"}
                      </div>
                    </div>

                    <div className="flex items-end">
                      <span className="whitespace-nowrap pr-2 font-bold">Name of Suspects:</span>
                      <div className="flex-1 border-b border-black px-2 pb-0.5">
                        {selectedEvidenceForSlip.suspect_names || "Plengggggg"}
                      </div>
                    </div>

                    {/* Witness Block */}
                    <div className="space-y-1 pt-1">
                      <span className="font-bold text-gray-700 block text-[11px] uppercase tracking-wider">
                        WITNESS MANIFEST & VERIFICATION:
                      </span>
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs">
                        {witnessList.length > 0 ? (
                          <div className="grid grid-cols-2 gap-2 font-mono">
                            {witnessList.map((w, idx) => (
                              <div key={idx} className="border-b border-gray-400 pb-0.5">
                                Witness {idx + 1}: {w}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-gray-500 italic text-[11px]">No witness names registered.</div>
                        )}
                      </div>
                    </div>

                    {/* Custody Handover Signoff Blocks with Rendered Signatures */}
                    <div className="mt-4 pt-3 border-t border-black space-y-3">
                      <div className="grid grid-cols-2 gap-6">
                        <div className="relative flex flex-col items-start justify-end">
                          <p className="text-[10px] font-bold uppercase text-gray-600">TURNED OVER BY:</p>
                          <div className="w-full h-10 flex items-center justify-start mb-0.5">
                            {selectedEvidenceForSlip?.collector_signature_hash ? (
                              <img src={selectedEvidenceForSlip.collector_signature_hash} alt="Turned Over By Signature" className="max-h-10 max-w-full object-contain" />
                            ) : (
                              <span className="text-[9px] text-gray-400 italic">[Signature]</span>
                            )}
                          </div>
                          <p className="font-bold border-b border-black pb-0.5 text-xs w-full uppercase">{selectedEvidenceForSlip.collector_name || "Forensic Technician"}</p>
                          <p className="text-[9px] text-gray-500 mt-0.5">Agency: {selectedEvidenceForSlip.investigating_agency || "PNP Forensic Group - Regional Forensic Unit (RFU-CAR)"}</p>
                        </div>

                        <div className="relative flex flex-col items-start justify-end">
                          <p className="text-[10px] font-bold uppercase text-blue-900">RECEIVED BY:</p>
                          <div className="w-full h-10 flex items-center justify-start mb-0.5">
                            {selectedEvidenceForSlip?.custodian_signature_hash ? (
                              <img src={selectedEvidenceForSlip.custodian_signature_hash} alt="Received By Signature" className="max-h-10 max-w-full object-contain" />
                            ) : (
                              <span className="text-[9px] text-gray-400 italic">[Signature]</span>
                            )}
                          </div>
                          <p className="font-bold border-b border-black pb-0.5 text-xs text-blue-950 w-full uppercase">{selectedEvidenceForSlip.received_by_name || "PSSg Custodian Custodian"}</p>
                          <p className="text-[9px] text-gray-500 mt-0.5">Vault Allocation: Secured Storage</p>
                        </div>
                      </div>
                    </div>

                  </div>
                </div>

              </div>

            </div>
          </div>
        );
      })()}

      <EvidentiaFooter />
    </div>
  );
}