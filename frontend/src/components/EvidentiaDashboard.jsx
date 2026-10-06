// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect } from "react";
import axios from "axios";
import EvidentiaFooter from "./EvidentiaFooter";

import ArchiveEvidenceModal from "./ArchiveEvidenceModal";

// Verification Sub-Category Profiles Metric Mapping Map
const CATEGORY_MAP = {
  "Digital Media Unit": [
    "Hard Drive (HDD)",
    "Solid State Drive (SSD)",
    "Mobile Device",
    "SIM Card",
    "Flash Drive Media",
  ],
  "Physical Specimen": [
    "Latent Print Lift",
    "DNA Swab",
    "Controlled Substance / Narcotics",
    "Ballistic Shell Casings",
  ],
  "Documentary Evidence": [
    "Business Accounting Ledger",
    "System Log Printout",
    "Printed Configuration / Notes",
  ],
};

// Investigating Agency / Stations
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

// Structural format map for each specialized localized agency/station/unit
const AGENCY_CASE_FORMATS = {
  "Baguio City Police Office (BCPO) - Main": "SOCO-BCFU-26-XXXX-H",
  "BCPO - Station 1 (Naguilian)": "BCPO1-BL-06-2026-XXXX",
  "BCPO - Station 2 (Camdas)": "BCPO2-BL-06-2026-XXXX",
  "BCPO - Station 3 (Pacdal)": "BCPO3-BL-06-2026-XXXX",
  "BCPO - Station 4 (Loakan)": "BCPO4-BL-06-2026-XXXX",
  "BCPO - Station 5 (Legarda)": "BCPO5-BL-06-2026-XXXX",
  "BCPO - Station 6 (Aurora Hill)": "BCPO6-BL-06-2026-XXXX",
  "BCPO - Station 7 (Abanao)": "BCPO7-BL-06-2026-XXXX",
  "BCPO - Station 8 (Kennon)": "BCPO8-BL-06-2026-XXXX",
  "BCPO - Station 9 (Irisan)": "BCPO9-BL-06-2026-XXXX",
  "BCPO - Station 10 (Marcos Highway)": "BCPO10-BL-06-2026-XXXX",
  "La Trinidad Municipal Police Station (LTMPS)": "LTMPS-BL-06-2026-XXXX",
  "Benguet Provincial Police Office (BPPO) - Camp Dangwa":
    "SOCO-BPFU-26-XXXX-H",
  "National Bureau of Investigation - Cordillera (NBI-CAR)":
    "NBI-CAR-CR-2026-XXXX",
  "PDEA - Cordillera Administrative Region (PDEA-CAR)": "PDEA-CAR-2026-06-XXXX",
  "CIDG - Benguet Provincial Field Unit": "CIDG-BEN-2026-XXXX",
  "PNP Forensic Group - Regional Forensic Unit (RFU-CAR)":
    "SOCO-RFU-CAR-26-XXXX-H",
};

export default function EvidentiaDashboard() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [loading, setLoading] = useState(false);
  const [evidenceList, setEvidenceList] = useState([]);
  const [activePrintRow, setActivePrintRow] = useState(null);

  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [selectedEvidenceItem, setSelectedEvidenceItem] = useState(null);
  const [isArchivingSubmitting, setIsArchivingSubmitting] = useState(false);

  const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

  const userRole = storedUser.role; // Reads 'admin' or 'officer' directly from DB session
  const subRole = storedUser.sub_role; // Reads your exact sub_role string from DB session
  const currentUser = { fullName: storedUser.full_name };

  // Your states will now gracefully auto-initialize with real database records!
  const [collectorName, setCollectorName] = useState(
    currentUser?.fullName || "",
  );

  // Individual Form State Variables
  const [investigatingAgency, setInvestigatingAgency] = useState(
    BENGUET_AGENCIES[0],
  );
  const [caseNumber, setCaseNumber] = useState("SOCO-BCFU-26-XXXX-H"); // Updated default string!
  const [caseTitle, setCaseTitle] = useState("");
  const [suspectNames, setSuspectNames] = useState("");
  const [witnessNames, setWitnessNames] = useState("");
  const [evidenceType, setEvidenceType] = useState("Digital Media Unit");
  const [physicalDescription, setPhysicalDescription] =
    useState("Hard Drive (HDD)");
  const [quantity, setQuantity] = useState(1);
  const [conditionReceived, setConditionReceived] = useState("");
  const [certifiedBy, setCertifiedBy] = useState("");
  const [notedBy, setNotedBy] = useState("");
  const [dateCollected, setDateCollected] = useState("");
  const [collectionPlace, setCollectionPlace] = useState("");
  const [retrievalAddress, setRetrievalAddress] = useState("");
  const [storageVault, setStorageVault] = useState("");
  const [workflowStage, setWorkflowStage] = useState("On Field");

  const [turnedOverByName, setTurnedOverByName] = useState("");
  const [turnedOverByAgency, setTurnedOverByAgency] = useState("");
  const [receivedByName, setReceivedByName] = useState("");
  const [receivedByAgency, setReceivedByAgency] = useState("");

  // const API_URL = "http://localhost:8081/intake_triage.php";

  // Evidence ID format
  const formatEvidenceId = (item) => {
    if (item && item.evidence_id && item.evidence_id.startsWith("EV2026")) {
      return item.evidence_id;
    }
    const numericId =
      item && item.id ? String(item.id).padStart(4, "0") : "0000";
    return `EV-2026-${numericId}`;
  };

  // Automatic alert dismiss timer
  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 4000);
    return () => clearTimeout(timer);
  }, [message]);

  // Read all records from the endpoint
  const fetchEvidence = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        "https://steadier-headscarf-maggot.ngrok-free.dev/intake_triage.php",
        // "http://localhost:8081/intake_triage.php",
        {
          headers: {
            "ngrok-skip-browser-warning": "ayakerrtssss",
          },
        },
      );
      if (response.data && response.data.status === "success") {
        const sortedRecords = (response.data.records || []).sort((a, b) => {
          return Number(b.id) - Number(a.id);
        });
        setEvidenceList(sortedRecords);
      }
    } catch (err) {
      console.error("Error pulling registry indices:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEvidence();
  }, []);

  useEffect(() => {
    // If a regular officer logs in, force-overwrite the field with their real DB name
    if (
      userRole === "officer" &&
      subRole !== "Supervisor / Reviewer" &&
      currentUser?.fullName
    ) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCollectorName(currentUser.fullName);
    }
  }, [userRole, subRole, currentUser?.fullName]);

  const handleEvidenceTypeChange = (e) => {
    const selectedType = e.target.value;
    setEvidenceType(selectedType);
    if (CATEGORY_MAP[selectedType]) {
      setPhysicalDescription(CATEGORY_MAP[selectedType][0]);
    }
  };

  const clearFormState = () => {
    setEditingId(null);
    setInvestigatingAgency(BENGUET_AGENCIES[0]);
    setCaseNumber("");
    setCaseTitle("");
    setSuspectNames("");
    setWitnessNames("");
    setEvidenceType("Digital Media Unit");
    setPhysicalDescription("Hard Drive (HDD)");
    setQuantity(1);
    setConditionReceived("");
    setCollectorName("");
    setCertifiedBy("");
    setNotedBy("");
    setDateCollected("");
    setCollectionPlace("");
    setRetrievalAddress("");
    setStorageVault("");
    setWorkflowStage("On Field");
    setTurnedOverByName("");
    setTurnedOverByAgency("");
    setReceivedByName("");
    setReceivedByAgency("");
  };

  // CREATE OR UPDATE SUBMIT ACTION TRACE
  const handleSaveEvidence = async (e) => {
    e.preventDefault();
    setMessage("");
    setMessageType("");

    if (caseNumber.includes("XXXX") || caseNumber.trim() === "") {
      setMessageType("error");
      setMessage(
        "Operational Failure: Please replace 'XXXX' with the valid sequential log number from the unit ledger.",
      );
      return; // Stops submission to PHP if they forgot to change XXXX
    }

    const expectedFormat = AGENCY_CASE_FORMATS[investigatingAgency] || "";
    // Get the core prefix before the "XXXX" marker (e.g., "SOCO-BCFU-26-" or "LTMPS-BL-06-2026-")
    const corePrefix = expectedFormat.split("XXXX")[0];

    // MULTI-LAYER GUARDRAIL
    if (caseNumber.trim() === "" || caseNumber.includes("XXXX")) {
      setMessageType("error");
      setMessage(
        "Operational Failure: Please replace 'XXXX' with the valid sequential log number from the unit ledger.",
      );
      return;
    }

    // CATCHES DELETIONS & GIBBERISH: Enforces that the text must start with the correct agency prefix
    if (corePrefix && !caseNumber.startsWith(corePrefix)) {
      setMessageType("error");
      setMessage(
        `Format Deviation: The case number for this station must begin with "${corePrefix}". Please restore the pattern.`,
      );
      return;
    }

    if (parseInt(quantity) < 1) {
      setMessageType("error");
      setMessage(
        "Validation Failure: Quantity metrics must equal or exceed 1 entry unit.",
      );
      return;
    }

    setLoading(true);

    const payload = {
      id: editingId,
      investigating_agency: investigatingAgency.trim(),
      case_number: caseNumber.trim(),
      case_title: caseTitle.trim(),
      suspect_names: suspectNames.trim(),
      witness_names: witnessNames.trim(),
      evidence_type: evidenceType,
      physical_description: physicalDescription,
      quantity: parseInt(quantity),
      condition_received: conditionReceived.trim(),
      collector_name: collectorName.trim(),
      certified_by: certifiedBy.trim(),
      noted_by: notedBy.trim(),
      date_collected: dateCollected,
      collection_place: collectionPlace.trim(),
      retrieval_address: retrievalAddress.trim(),
      storage_vault: storageVault.trim(),
      workflow_stage: workflowStage,
      turned_over_by_name: turnedOverByName.trim(),
      turned_over_by_agency: turnedOverByAgency.trim(),
      received_by_name: receivedByName.trim(),
      received_by_agency: receivedByAgency.trim(),
    };

    try {
      const response = editingId
        ? await axios.put(
            "https://steadier-headscarf-maggot.ngrok-free.dev/intake_triage.php",
            // "http://localhost:8081/intake_triage.php",
            payload,
            {
              headers: { "Content-Type": "application/json" },
            },
          )
        : await axios.post(
            "https://steadier-headscarf-maggot.ngrok-free.dev/intake_triage.php",
            // "http://localhost:8081/intake_triage.php",
            payload,
            {
              headers: { "Content-Type": "application/json" },
            },
          );

      if (response.data && response.data.status === "success") {
        setMessageType("success");
        const feedbackId =
          response.data.evidence_id ||
          `EV-2026-${String(response.data.id || editingId).padStart(4, "0")}`;
        setMessage(
          editingId
            ? "System directory parameters synchronized."
            : `Node integrated: #${feedbackId}`,
        );
        clearFormState();
        setIsFormOpen(false);
        fetchEvidence();
      } else {
        setMessageType("error");
        setMessage(
          response.data?.message || "Failed to save registry modification.",
        );
      }
    } catch (err) {
      console.error(err);
      setMessageType("error");
      setMessage(
        err.response?.data?.message ||
          "Transaction aborted: Server interface exception.",
      );
    } finally {
      setLoading(false);
    }
  };

  // POPULATE FORM FOR UPDATE LOGIC
  const startEditMode = (item) => {
    setEditingId(item.id);
    setInvestigatingAgency(item.investigating_agency || "");
    setCaseNumber(item.case_number || "");
    setCaseTitle(item.case_title || "");
    setSuspectNames(item.suspect_names || "");
    setWitnessNames(item.witness_names || "");
    setEvidenceType(item.evidence_type || "Digital Media Unit");
    setPhysicalDescription(
      item.physical_description || item.unit_descriptor || "",
    );
    setQuantity(item.quantity || 1);
    setConditionReceived(item.condition_received || "");
    setCollectorName(item.collector_name || "");
    setCertifiedBy(item.certified_by || "");
    setNotedBy(item.noted_by || "");
    setDateCollected(item.date_collected || "");
    setCollectionPlace(item.collection_place || "");
    setRetrievalAddress(item.retrieval_address || "");
    setStorageVault(item.storage_vault || "");

    const databaseStage = item.workflow_stage || "";
    if (databaseStage.startsWith("On Field") || !databaseStage) {
      setWorkflowStage("On Field");
    } else if (databaseStage.startsWith("In Storage")) {
      setWorkflowStage("In Storage");
    } else {
      setWorkflowStage(databaseStage);
    }

    setTurnedOverByName(item.turned_over_by_name || "");
    setTurnedOverByAgency(item.turned_over_by_agency || "");
    setReceivedByName(item.received_by_name || "");
    setReceivedByAgency(item.received_by_agency || "");

    setIsFormOpen(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // UPDATE: LOGICAL ARCHIVE TRANSACTION FUNCTION
  const handleExecuteArchive = async (evidenceId, archiveReason) => {
    setIsArchivingSubmitting(true);
    try {
      const response = await axios.delete(
        // "http://localhost:8081/request_reset.php",
        "https://steadier-headscarf-maggot.ngrok-free.dev/intake_triage.php",
        {
          data: {
            id: evidenceId,
            reason: archiveReason,
          },
          headers: { "Content-Type": "application/json" },
        },
      );

      if (response.data && response.data.status === "success") {
        setMessageType("success");
        setMessage(
          "Evidence entry registry successfully updated to Archived status.",
        );
        setIsArchiveModalOpen(false); // Gracefully close modal chassis
        setSelectedEvidenceItem(null); // Clear active item reference
        fetchEvidence(); // Re-fetch list to sync data grid
      } else {
        setMessageType("error");
        setMessage(response.data?.message || "Unable to drop entity target.");
      }
    } catch (err) {
      console.error("Archive transaction error:", err);
      setMessageType("error");
      setMessage("Failed to interact with database target dropping profile.");
    } finally {
      setIsArchivingSubmitting(false);
    }
  };

  const executeReceiptPrint = (item) => {
    setActivePrintRow(item);
    setTimeout(() => {
      window.print();
    }, 120);
  };

  const handleDataImportTrigger = () => {
    const sampleInput = window.prompt(
      "Paste valid Evidentia raw JSON string batch object data here:",
    );
    if (!sampleInput) return;
    try {
      const parsed = JSON.parse(sampleInput);
      alert(
        "JSON scheme matched configuration telemetry profiles successfully compiled into application staging context.",
      );
      console.log("Imported data payload staging packet: ", parsed);
    } catch (err) {
      console.log(err);
      alert("Invalid JSON format compilation structure validation failure.");
    }
  };

  const validSubCategories = CATEGORY_MAP[evidenceType] || [];

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8 p-4 sm:p-6 print:bg-white print:text-black print:p-0">
      {/* SCREEN VIEW INTERFACE BLOCK */}
      <div className="print:hidden space-y-6">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-5 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
              EviChain Central Registry
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm mt-1">
              Acquisition Triage Portal & Relational Audit Pipeline Engine
            </p>
          </div>
          <div className="flex flex-col sm:flex-row w-full md:w-auto items-center gap-3">
            <button
              type="button"
              onClick={handleDataImportTrigger}
              className="w-full sm:w-auto bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs px-5 py-3 rounded-xl uppercase tracking-wider transition-all shadow-md"
            >
              📥 Import Data
            </button>
            <button
              type="button"
              onClick={() => {
                if (isFormOpen) {
                  clearFormState();
                  setIsFormOpen(false);
                } else {
                  setIsFormOpen(true);
                }
              }}
              className={`w-full sm:w-auto text-white font-bold text-xs px-5 py-3 rounded-xl uppercase tracking-wider transition-all shadow-md ${
                isFormOpen
                  ? "bg-amber-600 hover:bg-amber-500"
                  : "bg-blue-600 hover:bg-blue-500"
              }`}
            >
              {isFormOpen
                ? "Cancel / Collapse Form"
                : "Add Evidence / Intake Form"}
            </button>
          </div>
        </header>

        {message && (
          <div
            className={`p-4 rounded-xl text-sm border ${
              messageType === "error"
                ? "bg-red-950/40 border-red-900 text-red-400"
                : "bg-emerald-950/40 border-emerald-900 text-emerald-400"
            }`}
          >
            {messageType === "error" ? "⚠️" : "🛡️"} {message}
          </div>
        )}

        {/* INTAKE FORM */}
        {isFormOpen && (
          <form
            onSubmit={handleSaveEvidence}
            noValidate
            className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-2xl p-5 sm:p-8 shadow-2xl space-y-6"
          >
            <h3 className="text-base sm:text-lg font-bold text-slate-200 flex items-center gap-2 pb-2 border-b border-slate-800">
              <span
                className={`h-2 w-2 rounded-full ${
                  editingId ? "bg-amber-400" : "bg-blue-400"
                } animate-pulse`}
              />
              {editingId
                ? `Update Custody Evidence Row Target: [Row Key ID: #EV-2026-${String(
                    editingId,
                  ).padStart(4, "0")}]`
                : "Unified Evidence Intake Form"}
            </h3>

            {/* GRID SECTION A: CASE INFORMATION */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                  Agency / Station *
                </label>
                <select
                  value={investigatingAgency}
                  onChange={(e) => {
                    const selectedAgency = e.target.value;
                    setInvestigatingAgency(selectedAgency);

                    setCaseNumber(AGENCY_CASE_FORMATS[selectedAgency] || "");

                    // Auto-populate or switch prefix pattern context fields cleanly
                    if (
                      !caseNumber ||
                      Object.values(AGENCY_CASE_FORMATS).includes(caseNumber) ||
                      caseNumber.includes("XXXX")
                    ) {
                      setCaseNumber(AGENCY_CASE_FORMATS[selectedAgency] || "");
                    }
                  }}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl outline-none text-white focus:ring-2 ring-blue-500/30 transition-all text-sm appearance-none pr-10"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 1rem center",
                    backgroundSize: "1rem",
                  }}
                  required
                >
                  {BENGUET_AGENCIES.map((agency) => (
                    <option
                      key={agency}
                      value={agency}
                      className="bg-slate-950 text-white"
                    >
                      {agency}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                  RE SOCO NR *
                </label>
                <input
                  type="text"
                  value={caseNumber}
                  onChange={(e) => {
                    const input = e.target.value;
                    const expectedPrefix =
                      AGENCY_CASE_FORMATS[investigatingAgency]?.split(
                        "XXXX",
                      )[0] || "";

                    // If the user completely clears the field or deletes into the prefix,
                    // instantly lock it back to the required prefix so they can't break it.
                    if (
                      input.length < expectedPrefix.length &&
                      !expectedPrefix.startsWith(input)
                    ) {
                      setCaseNumber(expectedPrefix);
                    } else {
                      setCaseNumber(input);
                    }
                  }}
                  placeholder={AGENCY_CASE_FORMATS[investigatingAgency]}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl outline-none text-white focus:ring-2 ring-blue-500/30 transition-all text-sm font-mono"
                  required
                />
                <p className="mt-1.5 text-[10px] text-slate-500 italic leading-tight pl-1">
                  Reference Profile:{" "}
                  <span className="text-blue-400 font-mono font-medium">
                    {AGENCY_CASE_FORMATS[investigatingAgency]}
                  </span>
                </p>
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                  Nature of Case
                </label>
                <input
                  type="text"
                  value={caseTitle}
                  onChange={(e) => setCaseTitle(e.target.value)}
                  placeholder="e.g. Homicide / Cyber Fraud"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl outline-none text-white focus:ring-2 ring-blue-500/30 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                  Name of Suspects
                </label>
                <input
                  type="text"
                  value={suspectNames}
                  onChange={(e) => setSuspectNames(e.target.value)}
                  placeholder="e.g. Juan Dela Cruz"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl outline-none text-white focus:ring-2 ring-blue-500/30 transition-all text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 tracking-wider mb-2">
                  Name of Witnesses
                </label>
                <input
                  type="text"
                  value={witnessNames}
                  onChange={(e) => setWitnessNames(e.target.value)}
                  placeholder="e.g. Witness A, Witness B"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl outline-none text-white focus:ring-2 ring-blue-500/30 transition-all text-sm"
                />
              </div>
            </div>

            {/* SELECTION ASSIGNMENTS */}
            {/* SELECTION ASSIGNMENTS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
              <div className="flex flex-col justify-end">
                <label className="block text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-2">
                  Classification Type
                </label>
                <select
                  value={evidenceType}
                  onChange={handleEvidenceTypeChange}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-lg outline-none text-white focus:border-blue-500 text-xs appearance-none pr-8"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 0.75rem center",
                    backgroundSize: "1rem",
                  }}
                >
                  <option
                    value="Digital Media Unit"
                    className="bg-slate-900 text-white"
                  >
                    Digital Media Unit
                  </option>
                  <option
                    value="Physical Specimen"
                    className="bg-slate-900 text-white"
                  >
                    Physical Specimen
                  </option>
                  <option
                    value="Documentary Evidence"
                    className="bg-slate-900 text-white"
                  >
                    Documentary Evidence
                  </option>
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <label className="block text-[11px] font-bold text-blue-400 uppercase tracking-wider mb-2">
                  Specific Sub-Item Profile
                </label>
                <select
                  value={physicalDescription}
                  onChange={(e) => setPhysicalDescription(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-lg outline-none text-white focus:border-blue-500 text-xs appearance-none pr-8"
                  style={{
                    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                    backgroundRepeat: "no-repeat",
                    backgroundPosition: "right 0.75rem center",
                    backgroundSize: "1rem",
                  }}
                >
                  {validSubCategories.map((opt, idx) => (
                    <option
                      key={idx}
                      value={opt}
                      className="bg-slate-900 text-white"
                    >
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex flex-col justify-end">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Quantity Verification *
                </label>

                {/* Flex Wrapper for Custom Counter Layout */}
                <div className="flex items-center w-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden group focus-within:border-slate-700 transition-colors">
                  {/* Decrement Button */}
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((prev) =>
                        Math.max(1, parseInt(prev || 1) - 1),
                      )
                    }
                    className="px-3 py-2.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors font-bold text-xs select-none"
                  >
                    −
                  </button>

                  {/* Style Overrides Added to Class Name to Scrub Default Spinners */}
                  <input
                    type="number"
                    value={quantity}
                    onChange={(e) => {
                      const val = e.target.value;
                      setQuantity(
                        val === "" ? "" : Math.max(1, parseInt(val) || 1),
                      );
                    }}
                    min="1"
                    className="w-full bg-transparent text-center outline-none text-white text-xs py-2.5 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none font-mono"
                    required
                  />

                  {/* Increment Button */}
                  <button
                    type="button"
                    onClick={() =>
                      setQuantity((prev) => parseInt(prev || 0) + 1)
                    }
                    className="px-3 py-2.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors font-bold text-xs select-none"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="flex flex-col justify-end">
                <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Condition Descriptor / Remarks
                </label>
                <input
                  type="text"
                  value={conditionReceived}
                  onChange={(e) => setConditionReceived(e.target.value)}
                  placeholder="Remarks / Status description"
                  className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-lg outline-none text-white text-xs"
                />
              </div>
            </div>

            {/* SECTIONS C & D */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-slate-800 p-4 rounded-xl bg-slate-950/50 space-y-3">
                <span className="text-xs font-bold uppercase text-slate-300 block tracking-wider">
                  Chain Acquisition Specifics
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
                      Evidence Collector / Searcher *
                    </label>
                    <input
                      type="text"
                      value={collectorName}
                      onChange={(e) => setCollectorName(e.target.value)}
                      placeholder="Officer name"
                      className={`w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white outline-none transition-all focus:ring-1 ring-blue-500/30 ${
                        userRole === "officer" &&
                        subRole !== "Supervisor / Reviewer"
                          ? "opacity-60 cursor-not-allowed bg-slate-950 focus:ring-0 border-slate-900"
                          : ""
                      }`}
                      /* RBAC ENFORCEMENT: 
      - 'admin' can ALWAYS edit anything (System Administrator, etc.)
      - 'officer' with 'Supervisor / Reviewer' can edit to reassign cases.
      - All other officers (Collectors, Custodians, Auditors) are locked to their session name.
    */
                      disabled={
                        userRole === "officer" &&
                        subRole !== "Supervisor / Reviewer"
                      }
                      required
                    />

                    {/* Dynamic Helper Text matching your exact sub-role access profile */}
                    <p className="mt-1 text-[9px] italic leading-tight pl-0.5">
                      {userRole === "admin" && (
                        <span className="text-blue-400 font-medium">
                          🛡️ Admin [ {subRole} ]: Full operational override
                          permitted.
                        </span>
                      )}
                      {userRole === "officer" &&
                        subRole === "Supervisor / Reviewer" && (
                          <span className="text-amber-400 font-medium">
                            📋 Supervisor Mode: Permitted to reassign case
                            collector tracking.
                          </span>
                        )}
                      {userRole === "officer" &&
                        subRole !== "Supervisor / Reviewer" && (
                          <span className="text-slate-500">
                            🔒 Chain of Custody Locked: Assigned to your active
                            session name.
                          </span>
                        )}
                    </p>
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
                      Date Collected
                    </label>
                    <input
                      type="date"
                      value={dateCollected}
                      onChange={(e) => setDateCollected(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
                      Specific Room
                    </label>
                    <input
                      type="text"
                      value={collectionPlace}
                      onChange={(e) => setCollectionPlace(e.target.value)}
                      placeholder="e.g. Master Bedroom Desk"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
                      Retrieval Address Location
                    </label>
                    <input
                      type="text"
                      value={retrievalAddress}
                      onChange={(e) => setRetrievalAddress(e.target.value)}
                      placeholder="e.g. Brgy. Baybayin, Los Baños"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="border border-slate-800 p-4 rounded-xl bg-slate-950/50 space-y-3">
                <span className="text-xs font-bold uppercase text-slate-300 block tracking-wider">
                  Signatures & Storage Allocation
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
                      Certified By: SOCO TL
                    </label>
                    <input
                      type="text"
                      value={certifiedBy}
                      onChange={(e) => setCertifiedBy(e.target.value)}
                      placeholder="Team Leader Name"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
                      Noted By: Chief of Office
                    </label>
                    <input
                      type="text"
                      value={notedBy}
                      onChange={(e) => setNotedBy(e.target.value)}
                      placeholder="Chief Name"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
                      Storage Location Vault
                    </label>
                    <input
                      type="text"
                      value={storageVault}
                      onChange={(e) => setStorageVault(e.target.value)}
                      placeholder="e.g. Vault Locker 4"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] uppercase font-semibold text-slate-400 mb-1">
                      Current Custody Status
                    </label>
                    <select
                      value={workflowStage}
                      onChange={(e) => setWorkflowStage(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white outline-none focus:border-slate-700 transition-colors"
                    >
                      <option
                        value="On Field"
                        className="bg-slate-900 text-white"
                      >
                        On Field
                      </option>
                      <option
                        value="In Storage"
                        className="bg-slate-900 text-white"
                      >
                        In Storage
                      </option>
                      <option
                        value="Transferred for Analysis"
                        className="bg-slate-900 text-white"
                      >
                        Transferred for Analysis
                      </option>
                      <option
                        value="Presented in Court"
                        className="bg-slate-900 text-white"
                      >
                        Presented in Court
                      </option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* CO-SIGNATURE ENTRY BLOCK */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-4">
              <h3 className="text-xs font-bold text-yellow-500 uppercase tracking-wider">
                Chain of Custody Handover Sign-Off Parameters
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-2">
                  <label className="block text-[10px] font-bold text-red-400 uppercase tracking-wider">
                    Turned Over By *
                  </label>
                  <input
                    type="text"
                    value={turnedOverByName}
                    onChange={(e) => setTurnedOverByName(e.target.value)}
                    placeholder="Officer Name & Designation"
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-2.5 py-2 text-xs text-white mb-2"
                    required
                  />
                  <input
                    type="text"
                    value={turnedOverByAgency}
                    onChange={(e) => setTurnedOverByAgency(e.target.value)}
                    placeholder="Operating Unit / Agency Address"
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-2.5 py-2 text-xs text-white"
                  />
                </div>
                <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800 space-y-2">
                  <label className="block text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                    Received By *
                  </label>
                  <input
                    type="text"
                    value={receivedByName}
                    onChange={(e) => setReceivedByName(e.target.value)}
                    placeholder="Custodian Name & Designation"
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-2.5 py-2 text-xs text-white mb-2"
                    required
                  />
                  <input
                    type="text"
                    value={receivedByAgency}
                    onChange={(e) => setReceivedByAgency(e.target.value)}
                    placeholder="Receiving Command / Agency Address"
                    className="w-full bg-slate-950 border border-slate-800 rounded-md px-2.5 py-2 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            {/* SYSTEM BUTTON TRIGGER SUBMIT */}
            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={loading}
                className={`w-full sm:w-auto text-white font-bold text-xs px-8 py-3.5 rounded-xl uppercase tracking-widest transition-all cursor-pointer ${
                  editingId
                    ? "bg-amber-600 hover:bg-amber-500"
                    : "bg-emerald-600 hover:bg-emerald-500"
                } disabled:bg-slate-800`}
              >
                {loading
                  ? "Executing Evichain Request..."
                  : editingId
                    ? "Update Evidence Parameters"
                    : "Save Evidence"}
              </button>
            </div>
          </form>
        )}

        {/* REGISTRY RECORD RENDERING SECTION */}
        <section className="bg-slate-900/40 backdrop-blur-md border border-slate-800/60 rounded-2xl p-4 sm:p-5 shadow-xl">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 border-b border-slate-800 pb-3 gap-2">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-300">
              System Ledger Directory
            </h2>
            <span className="bg-slate-950 text-slate-300 px-3 py-1 rounded-xl text-xs font-mono border border-slate-800">
              Evidence Collection {evidenceList.length}
            </span>
          </div>

          <div className="overflow-x-auto w-full rounded-xl border border-slate-800/40">
            <table className="w-full text-left text-xs table-auto min-w-[800px]">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                <tr>
                  <th className="p-3 w-[12%]">Evidence ID</th>
                  <th className="p-3 w-[20%]">Case Mapping</th>
                  <th className="p-3 w-[25%]">Evidence Profile</th>
                  <th className="p-3 w-[18%]">Storage Allocation</th>
                  <th className="p-3 w-[15%]">Turnover Logs</th>
                  <th className="p-3 text-center w-[10%]">System Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {loading && evidenceList.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="p-8 text-center text-blue-400 font-mono animate-pulse"
                    >
                      Synchronizing directory node entries...
                    </td>
                  </tr>
                ) : evidenceList.length === 0 ? (
                  <tr>
                    <td
                      colSpan="6"
                      className="p-8 text-center text-slate-500 font-mono"
                    >
                      No telemetry objects discovered inside database layer.
                    </td>
                  </tr>
                ) : (
                  evidenceList.map((item, idx) => (
                    <tr
                      key={item.id || idx}
                      className="hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="p-3 font-mono text-blue-400 font-bold tracking-wider break-all">
                        {formatEvidenceId(item)}
                      </td>
                      <td className="p-3 whitespace-normal">
                        <div className="font-semibold text-white break-words">
                          {item.case_number}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 break-words">
                          {item.case_title || "No Title"}
                        </div>
                      </td>
                      <td className="p-3 whitespace-normal">
                        <div className="text-slate-200 font-medium break-words">
                          {item.physical_description ||
                            item.unit_descriptor ||
                            "Not Specified"}
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5 break-words">
                          {item.evidence_type} • Quant: {item.quantity}
                        </div>
                        {(item.suspect_names || item.witness_names) && (
                          <div className="mt-1 pt-1 border-t border-slate-800/50 text-[10px] text-slate-400 space-y-0.5">
                            {item.suspect_names && (
                              <div>
                                <span className="text-red-400/80 font-medium">
                                  Suspects:
                                </span>{" "}
                                {item.suspect_names}
                              </div>
                            )}
                            {item.witness_names && (
                              <div>
                                <span className="text-yellow-400/80 font-medium">
                                  Witnesses:
                                </span>{" "}
                                {item.witness_names}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="p-3 whitespace-normal">
                        <span className="inline-block bg-blue-950/60 text-blue-400 border border-blue-900/40 px-2 py-0.5 rounded font-mono text-[10px] max-w-full truncate">
                          {item.workflow_stage}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-1 font-mono break-words">
                          {item.storage_vault || "Unassigned Secure Node"}
                        </div>
                      </td>
                      <td className="p-3 text-slate-400 whitespace-normal">
                        <div className="text-[10px] break-words">
                          From:{" "}
                          <span className="text-slate-200 font-medium">
                            {item.turned_over_by_name}
                          </span>
                        </div>
                        <div className="text-[10px] mt-0.5 break-words">
                          To:{" "}
                          <span className="text-slate-200 font-medium">
                            {item.received_by_name}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5 flex-wrap md:flex-nowrap">
                          <button
                            type="button"
                            onClick={() => startEditMode(item)}
                            className="bg-slate-950 hover:bg-amber-900/40 text-amber-400 border border-slate-800 text-[10px] font-bold tracking-wider px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                          >
                            EDIT
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedEvidenceItem(item); // Pass the current row object
                              setIsArchiveModalOpen(true); // Pop up the smooth backdrop overlay
                            }}
                            className="bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-amber-400 border border-slate-800 text-[10px] font-bold tracking-wider px-2.5 py-1.5 rounded-lg transition-all cursor-pointer"
                          >
                            DESTROY
                          </button>
                          <button
                            type="button"
                            onClick={() => executeReceiptPrint(item)}
                            className="bg-slate-950 hover:bg-slate-800 text-blue-400 border border-slate-800 text-[10px] font-bold tracking-wider px-2.5 py-1.5 rounded-lg transition-all shadow cursor-pointer whitespace-nowrap"
                          >
                            🖨️ PRINT
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <ArchiveEvidenceModal
        isOpen={isArchiveModalOpen}
        onClose={() => {
          setIsArchiveModalOpen(false);
          setSelectedEvidenceItem(null);
        }}
        onConfirm={handleExecuteArchive}
        evidenceItem={selectedEvidenceItem}
        isArchiving={isArchivingSubmitting}
      />

      {/* Print row */}
      {activePrintRow && (
        <div className="hidden print:block text-black bg-white font-sans text-xs p-0 max-w-4xl mx-auto space-y-0">
          {/* CRITICAL PRINTER OVERRIDE: Suppresses default browser URL headers and footers */}
          <style
            dangerouslySetInnerHTML={{
              __html: ` @page { size: auto; margin: 0mm; } body { margin: 0px; }`,
            }}
          />

          {/* Document formatting */}
          <div className="break-after-page min-h-screen flex flex-col justify-between p-8 bg-white text-black">
            <div>
              <div className="text-[11px] font-normal font-sans leading-tight">
                <p>CSI Form "4"</p>
                <p>SOCO REPORT FORM "2"</p>
              </div>

              <div className="text-center space-y-0.5 -mt-4">
                <p className="text-xs">Republic of the Philippines</p>
                <p className="text-xs">National Police Commission</p>
                <p className="text-sm font-medium">
                  Philippine National Police
                </p>
                <p className="text-xs uppercase font-semibold">
                  {activePrintRow.investigating_agency ||
                    "LAGUNA POLICE PROVINCIAL OFFICE"}
                </p>
                <p className="text-xs font-bold uppercase tracking-wide">
                  LOS BAÑOS MUNICIPAL POLICE STATION
                </p>
                <p className="text-[11px] italic text-gray-700">
                  Villegas Street: Brgy. Baybayin; Los Baños, Laguna
                </p>
                <p className="text-[11px] text-gray-700">
                  Tel/Fax (049) 534-5631
                </p>
              </div>

              <div className="flex justify-end mt-6">
                <div className="text-center w-52">
                  <div className="border-b border-black text-xs px-2 py-0.5 min-h-[1.5rem]">
                    {activePrintRow.date_collected
                      ? new Date(
                          activePrintRow.date_collected,
                        ).toLocaleDateString()
                      : ""}
                  </div>
                  <p className="text-xs mt-1">Date</p>
                </div>
              </div>

              <div className="mt-4 text-xs font-bold flex items-center">
                <span>RE SOCO REPORT NR:</span>
                <span className="border-b border-black ml-1 flex-1 max-w-xs px-2 font-mono text-sm tracking-wider">
                  {activePrintRow.case_number}
                </span>
              </div>

              <h2 className="text-center text-sm font-bold tracking-wider uppercase my-6">
                EVIDENCE LOG
              </h2>

              <table className="w-full border-collapse border border-black text-center text-xs">
                <thead>
                  <tr className="border-b border-black divide-x divide-black font-bold text-[11px] h-12 bg-gray-50/50">
                    <th className="p-1 w-12 tracking-tight">QTY</th>
                    <th className="p-1 w-1/4 text-center leading-tight">
                      DESCRIPTION OF SPECIMEN COLLECTED
                    </th>
                    <th className="p-1 tracking-tight">COLLECTED BY</th>
                    <th className="p-1 leading-tight">TIME COLLECTED</th>
                    <th className="p-1 tracking-tight">SPECIFIC PLACE</th>
                    <th className="p-1 tracking-tight">REMARKS</th>
                    <th className="p-1 leading-tight">SIGNATURE OF SEARCHER</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black font-sans">
                  <tr className="divide-x divide-black align-top h-20 text-[11px]">
                    <td className="p-2 font-bold">{activePrintRow.quantity}</td>
                    <td className="p-2 text-left leading-normal">
                      <span className="font-bold text-[10px] block text-gray-600">
                        [{activePrintRow.evidence_type}]
                      </span>
                      {activePrintRow.physical_description ||
                        activePrintRow.unit_descriptor}
                    </td>
                    <td className="p-2">
                      {activePrintRow.collector_name || ""}
                    </td>
                    <td className="p-2 whitespace-normal leading-tight">
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
                    <td className="p-2 text-left italic text-gray-700">
                      {activePrintRow.collector_name || ""}
                    </td>
                    {/* <td className="p-2"></td> */}
                  </tr>
                  {[1, 2, 3, 4, 5, 6].map((idx) => (
                    <tr key={idx} className="divide-x divide-black h-12">
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

            <div className="grid grid-cols-3 gap-6 pt-12 text-xs text-center font-normal">
              <div className="space-y-12">
                <p className="text-left pl-4">Prepared by:</p>
                <div>
                  <div className="border-b border-black w-11/12 mx-auto font-medium uppercase min-h-[1.25rem]">
                    {activePrintRow.collector_name}
                  </div>
                  <p className="text-[11px] mt-1 text-gray-900">
                    Evidence Custodian
                  </p>
                </div>
              </div>

              <div className="space-y-12">
                <p className="text-left pl-4">Certified by:</p>
                <div>
                  <div className="border-b border-black w-11/12 mx-auto font-medium uppercase min-h-[1.25rem]">
                    {activePrintRow.certified_by}
                  </div>
                  <p className="text-[11px] mt-1 text-gray-900">
                    SOCO Team Leader
                  </p>
                </div>
              </div>

              <div className="space-y-12">
                <p className="text-left pl-4">Noted by:</p>
                <div>
                  <div className="border-b border-black w-11/12 mx-auto font-medium uppercase min-h-[1.25rem]">
                    {activePrintRow.noted_by}
                  </div>
                  <p className="text-[11px] mt-1 text-gray-900">
                    Chief of Office
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Chain of Custody */}
          <div className="min-h-screen flex flex-col justify-between p-10 bg-white text-black">
            <div>
              <div className="text-center space-y-0.5">
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

              <h2 className="text-center text-sm font-bold tracking-wider uppercase my-8">
                CHAIN OF CUSTODY FORM
              </h2>

              <div className="space-y-3 text-xs font-sans">
                <div className="flex items-end">
                  <span className="whitespace-nowrap pr-1">
                    Nature of Case:
                  </span>
                  <div className="flex-1 border-b border-black font-medium px-2 pb-0.5">
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

                <div className="flex items-end">
                  <span className="whitespace-nowrap pr-1">
                    Time, Date and Place of Occurrence:
                  </span>
                  <div className="flex-1 border-b border-black font-medium px-2 pb-0.5">
                    {activePrintRow.date_collected
                      ? `${new Date(
                          activePrintRow.date_collected,
                        ).toLocaleString()} `
                      : ""}
                    {activePrintRow.collection_place ||
                    activePrintRow.retrieval_address
                      ? `at ${activePrintRow.collection_place || ""} ${
                          activePrintRow.retrieval_address
                            ? `(${activePrintRow.retrieval_address})`
                            : ""
                        }`
                      : ""}
                  </div>
                </div>

                <div className="flex items-end">
                  <span className="whitespace-nowrap pr-1">
                    Operating Unit:
                  </span>
                  <div className="flex-1 border-b border-black font-medium px-2 pb-0.5">
                    {activePrintRow.investigating_agency}
                  </div>
                </div>

                <div className="space-y-2 pt-1">
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
                  {/* <div className="border-b border-black w-full min-h-[1.25rem]"></div>
                  <div className="border-b border-black w-full min-h-[1.25rem]"></div> */}
                </div>
              </div>

              <div className="mt-4 space-y-6 font-sans text-xs">
                {/* CUSTODY ROW BLOCK 1 */}
                <div className="space-y-4">
                  <div className="grid grid-cols-12 gap-1 items-start">
                    <div className="col-span-4 font-normal pt-1">
                      TURNED OVER BY
                    </div>
                    <div className="col-span-8 space-y-3">
                      <div className="text-center">
                        <div className="border-b border-black px-4 font-medium uppercase min-h-[1.25rem]">
                          {activePrintRow.turned_over_by_name}
                        </div>
                        <span className="text-[10px] text-gray-600 block mt-0.5">
                          (Name and Designation)
                        </span>
                      </div>
                      <div className="grid grid-cols-12 gap-1 items-end">
                        <span className="col-span-3 text-left">
                          Agency/Address
                        </span>
                        <div className="col-span-9 border-b border-black px-2 min-h-[1.25rem]">
                          {activePrintRow.turned_over_by_agency}
                        </div>
                      </div>
                      <div className="grid grid-cols-12 gap-1 items-end">
                        <span className="col-span-3 text-left">
                          Time and Date
                        </span>
                        <div className="col-span-9 border-b border-black px-2 min-h-[1.25rem]">
                          {activePrintRow.date_collected
                            ? new Date(
                                activePrintRow.date_collected,
                              ).toLocaleString()
                            : ""}
                        </div>
                      </div>
                      <div className="grid grid-cols-12 gap-1 items-end">
                        <span className="col-span-3 text-left">Remarks</span>
                        <div className="col-span-9 border-b border-black px-2 italic text-gray-600 min-h-[1.25rem]">
                          Initial Processing Handover /{" "}
                          {activePrintRow.condition_received}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-2 items-start pt-2">
                    <div className="col-span-4 font-normal pt-1">
                      RECEIVED BY
                    </div>
                    <div className="col-span-8 space-y-3">
                      <div className="text-center">
                        <div className="border-b border-black px-4 font-medium uppercase min-h-[1.25rem]">
                          {activePrintRow.received_by_name}
                        </div>
                        <span className="text-[10px] text-gray-600 block mt-0.5">
                          (Name and Designation)
                        </span>
                      </div>
                      <div className="grid grid-cols-12 gap-1 items-end">
                        <span className="col-span-3 text-left">
                          Agency/Address
                        </span>
                        <div className="col-span-9 border-b border-black px-2 min-h-[1.25rem]">
                          {activePrintRow.received_by_agency}
                        </div>
                      </div>
                      <div className="grid grid-cols-12 gap-1 items-end">
                        <span className="col-span-3 text-left">
                          Time and Date
                        </span>
                        <div className="col-span-9 border-b border-black px-2 min-h-[1.25rem]">
                          {activePrintRow.date_collected
                            ? new Date(
                                activePrintRow.date_collected,
                              ).toLocaleString()
                            : ""}
                        </div>
                      </div>
                      <div className="grid grid-cols-12 gap-1 items-end">
                        <span className="col-span-3 text-left">Remarks</span>
                        <div className="col-span-9 border-b border-black px-2 min-h-[1.25rem] font-medium">
                          Allocated to Secure Storage Location:{" "}
                          {activePrintRow.storage_vault || "Vault"} [
                          {activePrintRow.workflow_stage}]
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t border-black my-4"></div>

                {/* CUSTODY ROW BLOCK 2 (Blank continuation layout) */}
                <div className="space-y-4">
                  <div className="grid grid-cols-12 gap-2 items-start">
                    <div className="col-span-4 font-normal pt-1">
                      TURNED OVER BY
                    </div>
                    <div className="col-span-8 space-y-3">
                      <div className="text-center">
                        <div className="border-b border-black px-4 font-medium uppercase min-h-[1.25rem]">
                          {activePrintRow.turned_over_by_name}
                        </div>
                        <span className="text-[10px] text-gray-600 block mt-0.5">
                          (Name and Designation)
                        </span>
                      </div>
                      <div className="grid grid-cols-12 gap-1 items-end">
                        <span className="col-span-3 text-left">
                          Agency/Address
                        </span>
                        <div className="col-span-9 border-b border-black px-2 min-h-[1.25rem]">
                          {activePrintRow.turned_over_by_agency}
                        </div>
                      </div>
                      <div className="grid grid-cols-12 gap-1 items-end">
                        <span className="col-span-3 text-left">
                          Time and Date
                        </span>
                        <div className="col-span-9 border-b border-black px-2 min-h-[1.25rem]">
                          {activePrintRow.date_collected
                            ? new Date(
                                activePrintRow.date_collected,
                              ).toLocaleString()
                            : ""}
                        </div>
                      </div>
                      <div className="grid grid-cols-12 gap-1 items-end">
                        <span className="col-span-3 text-left">Remarks</span>
                        <div className="col-span-9 border-b border-black px-2 italic text-gray-600 min-h-[1.25rem]">
                          Initial Processing Handover /{" "}
                          {activePrintRow.condition_received}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-12 gap-2 items-start pt-2">
                    <div className="col-span-4 font-normal pt-1">
                      RECEIVED BY
                    </div>
                    <div className="col-span-8 space-y-3">
                      <div className="text-center">
                        <div className="border-b border-black px-4 font-medium uppercase min-h-[1.25rem]">
                          {activePrintRow.received_by_name}
                        </div>
                        <span className="text-[10px] text-gray-600 block mt-0.5">
                          (Name and Designation)
                        </span>
                      </div>
                      <div className="grid grid-cols-12 gap-1 items-end">
                        <span className="col-span-3 text-left">
                          Agency/Address
                        </span>
                        <div className="col-span-9 border-b border-black px-2 min-h-[1.25rem]">
                          {activePrintRow.received_by_agency}
                        </div>
                      </div>
                      <div className="grid grid-cols-12 gap-1 items-end">
                        <span className="col-span-3 text-left">
                          Time and Date
                        </span>
                        <div className="col-span-9 border-b border-black px-2 min-h-[1.25rem]">
                          {activePrintRow.date_collected
                            ? new Date(
                                activePrintRow.date_collected,
                              ).toLocaleString()
                            : ""}
                        </div>
                      </div>
                      <div className="grid grid-cols-12 gap-1 items-end">
                        <span className="col-span-3 text-left">Remarks</span>
                        <div className="col-span-9 border-b border-black px-2 min-h-[1.25rem] font-medium">
                          Allocated to Secure Storage Location:{" "}
                          {activePrintRow.storage_vault || "Vault"} [
                          {activePrintRow.workflow_stage}]
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-right text-[9px] text-gray-400 font-mono pt-4 border-t border-gray-100">
              Record ID Trace Reference:{" "}
              {activePrintRow.id
                ? `EV-2026-${String(activePrintRow.id).padStart(4, "0")}`
                : "UNINITIALIZED"}
            </div>
          </div>
        </div>
      )}
      <EvidentiaFooter />
    </div>
  );
}
