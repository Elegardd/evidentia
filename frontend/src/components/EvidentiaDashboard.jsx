// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect, useRef } from "react";
import { PenTool, ImagePlus, Image } from "lucide-react";
import axios from "axios";
import EvidentiaFooter from "./EvidentiaFooter";
import Spline from "@splinetool/react-spline";
import ArchiveEvidenceModal from "./ArchiveEvidenceModal";
import SignaturePadModal from "./SignaturePadModal";
import WitnessSignatureModal from "./WitnessSignatureModal";

import { handleExcelImport } from "./utils/evidenceImportService";
import { handleImageCollectionUpload } from "./utils/uploadEvidenceImages";
import { NotificationModal } from "./NotificationModal";

// Evidence Categories and Items Mapping
const CATEGORY_MAP = {
  "Digital Media": [
    "Solid State Drive (SSD)",
    "Mobile Device",
    "SIM Card",
    "Flash Drive Media",
    "Computers", "Tablets", "Storage media",
    "Emails", "Messages", "Social media",
    "Network and cloud data", "Logs",
    "CCTV", "Audio", "Video", "Metadata",
    "GPS and vehicle/IoT data"
  ],
  "Physical Specimen": [
    "Latent Print Lift", "DNA Swab",
    "Controlled Substance / Narcotics",
    "Ballistic Shell Casings",
  ],
  "Documentary Evidence": [
    "Business Accounting Ledger",
    "System Log Printout",
    "Printed Configuration / Notes",
  ],
  "Biological": [
    "Blood and bloodstain patterns",
    "Semen", "Saliva", "Urine", "Vaginal fluids",
    "Hair", "Skin", "Tissue", "Bones", "Teeth",
    "DNA(nuclear, mitochondrial, Touch DNA)",
    "Insects(forensic entomology)",
    "Plant material(botany)", "Pollen"
  ],
  "Trace": [
    "Fibers and textiles",
    "Glass", "Paint", "Soil",
    "Gunshot and explosive residue",
    "Fire", "Debris and accelerants",
    "Dust", "Wood", "Cosmetics", "Lubricants"
  ],
  "Impression and Pattern": [
    "Fingerprints", "Palm prints", "Footprints",
    "Footwear", "Tire impressions", "Tool marks",
    "Bite marks", "Lip prints", "Ear prints", "Glove prints"
  ],
  "Firearms adn Toolmarks": [
    "Firearms", "Bullets",
    "Cartridge cases"
  ],
  "Chemical and Toxicology": [
    "Drugs and narcotics", "Poisons", "Alcohol",
    "Explosives and arson residue", "Unknown powders and liquids"
  ],
  "Questioned Documents": [
    "Handwriting and signatures",
    "Forgery", "Alterations", "Erasures",
    "Inks", "Paper", "Printers",
    "Counterfeit currency", "Fake ID"
  ]
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

export default function EvidenceDashboard({ currentUser }) {
  const formRef = useRef(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // For Notifications
  // const [toast, setToast] = useState({ isVisible: false, message: "" });
  const [toast, setToast] = useState({
    isVisible: false,
    message: "",
    type: "error",
  });
  const triggerToast = (message, type = "error") => {
    setToast({ isVisible: true, message, type });
  };

  // eslint-disable-next-line no-unused-vars
  const [loading, setLoading] = useState(false);
  const [evidenceList, setEvidenceList] = useState([]);
  const [activePrintRow, setActivePrintRow] = useState(null);

  const [isUploading, setIsUploading] = useState(false);
  const [evidenceImages, setEvidenceImages] = useState([]);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const handleFile = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newImages = files.map(file => {
      const blobUrl = URL.createObjectURL(file);
      console.log("Generated Blob URL for file:", file.name, blobUrl);
      return {
        file: file,
        name: file.name,
        size: file.size,
        type: file.type,
        previewUrl: blobUrl
      };
    });

    setEvidenceImages(prev => [...prev, ...newImages]);
    e.target.value = ""; // Reset input
  };

  const [isArchiveModalOpen, setIsArchiveModalOpen] = useState(false);
  const [selectedEvidenceItem, setSelectedEvidenceItem] = useState(null);
  const [isArchivingSubmitting, setIsArchivingSubmitting] = useState(false);

  // Turnover Modals
  // const [handshakeTargetAgency, setHandshakeTargetAgency] = useState(BENGUET_AGENCIES[0]);
  // const [isTurnoverModalOpen, setIsTurnoverModalOpen] = useState(false);
  const [handshakeTargetCustodian, setHandshakeTargetCustodian] = useState("");
  const [handshakeTargetSupervisor, setHandshakeTargetSupervisor] =
    useState("");
  const [turnoverRemarks, setTurnoverRemarks] = useState("");
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  // const [collectorSignatureData, setCollectorSignatureData] = useState(null);
  const [isInitialCreation, setIsInitialCreation] = useState(false);
  // const [collectorSignature, setCollectorSignature] = useState(null);

  // Replace single strings with an array
  const [witnesses, setWitnesses] = useState([]);
  const [isWitnessModalOpen, setIsWitnessModalOpen] = useState(false);

  const [stationPersonnel, setStationPersonnel] = useState([]);

  // Form Fields
  const [investigatingAgency, setInvestigatingAgency] = useState(
    BENGUET_AGENCIES[0],
  );
  const [caseNumber, setCaseNumber] = useState("SOCO-BCFU-26-XXXX-H");
  const [caseTitle, setCaseTitle] = useState("");
  const [suspectNames, setSuspectNames] = useState("");
  const [witnessNames, setWitnessNames] = useState("");
  const [evidenceType, setEvidenceType] = useState("Digital Media");
  const [physicalDescription, setPhysicalDescription] =
    useState("Hard Drive (HDD)");
  const [quantity, setQuantity] = useState(1);
  const [conditionReceived, setConditionReceived] = useState("");
  const [certifiedBy, setCertifiedBy] = useState("");
  const [notedBy, setNotedBy] = useState("");
  const [dateCollected, setDateCollected] = useState("");
  const [collectionPlace, setCollectionPlace] = useState("");
  const [retrievalAddress, setRetrievalAddress] = useState("");

  // For export/import
  const formSetters = {
    setInvestigatingAgency,
    setCaseNumber,
    setCaseTitle,
    setSuspectNames,
    setWitnessNames,
    setEvidenceType,
    setPhysicalDescription,
    setQuantity,
    setConditionReceived,
    setDateCollected,
    setCollectionPlace,
    setRetrievalAddress,
  };

  useEffect(() => {
    if (!message) return;
    const timer = setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 4000);
    return () => clearTimeout(timer);
  }, [message]);

  const formatEvidenceId = (item) => {
    if (item?.evidence_id?.startsWith("EV2026")) return item.evidence_id;
    return `EV-2026-${String(item?.id || 0).padStart(4, "0")}`;
  };

  const closeTurnoverModal = () => {
    // setIsTurnoverModalOpen(false);
    setHandshakeTargetCustodian("");
    setHandshakeTargetSupervisor("");
    setTurnoverRemarks("");
  };

  const fetchEvidence = async () => {
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
      console.error("Fetch failure", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchEvidence();
  }, []);

  useEffect(() => {
    const fetchStationPersonnel = async () => {
      if (!investigatingAgency) return;
      try {
        // 1. Points to get_users.php instead of users.php
        // const response = await axios.get("http://localhost:8081/get_users.php",
        const response = await axios.get("https://steadier-headscarf-maggot.ngrok-free.dev/get_users.php",
          {
            headers: { "ngrok-skip-browser-warning": "true" },
          },
        );

        if (response.data?.status === "success") {
          // 2. Extract users from response.data.users instead of response.data.records
          const allUsers = response.data.users || [];

          // 3. Filter users strictly by matching their department_division on the frontend
          const users = allUsers.filter(
            (user) => user.department_division === investigatingAgency,
          );

          // Sort alphabetically/by rank text safely
          const sortedUsers = users.sort((a, b) => {
            const rankA = a.agency_rank_title || "";
            const rankB = b.agency_rank_title || "";
            return rankA.localeCompare(rankB);
          });

          setStationPersonnel(sortedUsers);

          // REMOVED AUTO-SELECTION:
          // The old block that automatically defaulted setNotedBy(...) has been
          // removed to ensure signature strings are only written when explicitly
          // approved via the backend turnover workflows.
        }
      } catch (err) {
        console.error("Failed to load station personnel", err);
      }
    };

    fetchStationPersonnel();
  }, [investigatingAgency, editingId]);

  const handleEvidenceTypeChange = (e) => {
    const selectedType = e.target.value;
    setEvidenceType(selectedType);
    if (CATEGORY_MAP[selectedType])
      setPhysicalDescription(CATEGORY_MAP[selectedType][0]);
  };

  const clearFormState = () => {
    setEditingId(null);
    setInvestigatingAgency(BENGUET_AGENCIES[0]);
    setCaseNumber(AGENCY_CASE_FORMATS[BENGUET_AGENCIES[0]]);
    setCaseTitle("");
    setSuspectNames("");
    setWitnessNames("");
    setWitnesses([]);
    setEvidenceType("Digital Media");
    setPhysicalDescription("Hard Drive (HDD)");
    setQuantity(1);
    setConditionReceived("");
    setCertifiedBy("");
    setNotedBy("");
    setDateCollected("");
    setCollectionPlace("");
    setRetrievalAddress("");
    setEvidenceImages([]);
  };

  // const handleSaveEvidence = async (e) => {
  //   e.preventDefault();
  //   if (caseNumber.includes("XXXX") || caseNumber.trim() === "") {
  //     setMessageType("error");
  //     triggerToast(
  //       "Error: Please replace 'XXXX' with the valid sequential case log number.",
  //     );
  //     return;
  //   }

  //   const corePrefix = (AGENCY_CASE_FORMATS[investigatingAgency] || "").split(
  //     "XXXX",
  //   )[0];
  //   if (corePrefix && !caseNumber.startsWith(corePrefix)) {
  //     setMessageType("error");
  //     setMessage(
  //       `Format Error: Case number for this station must begin with "${corePrefix}"`,
  //     );
  //     return;
  //   }

  //   // PREVENT ACCIDENTAL DUPLICATES CLIENT SIDE
  //   if (!editingId) {
  //     const isDuplicate = evidenceList.some(
  //       (item) =>
  //         item.investigating_agency?.toLowerCase() ===
  //         investigatingAgency.toLowerCase() &&
  //         item.case_number?.toLowerCase() === caseNumber.trim().toLowerCase(),
  //     );

  //     if (isDuplicate) {
  //       setMessageType("error");
  //       triggerToast(
  //         "Collision Alert: Duplicate case layout entry rejected.",
  //         "error",
  //       );
  //       // setMessage(`Collision Alert: An entry with Case Number "${caseNumber.trim()}" already exists for ${investigatingAgency}. Duplicate logs are prohibited.`);
  //       return;
  //     }
  //   }

  //   setLoading(true);

  //   // --- UPDATE MARKER: SAVE EVIDENCE NORMALLY WITHOUT REDIRECTING TO SIGNATURE MODAL ---
  //   if (!editingId) {
  //     // Pathway: Normal direct POST creation payload setup
  //     const payload = {
  //       investigating_agency: investigatingAgency,
  //       case_number: caseNumber,
  //       case_title: caseTitle,
  //       suspect_names: suspectNames,
  //       witness_names: witnessNames,
  //       witnesses: witnesses.map(w => ({
  //         name: w.witnessName,
  //         signature_url: w.signatureUrl,
  //         timestamp: new Date().toISOString()
  //       })),
  //       evidence_type: evidenceType,
  //       physical_description: physicalDescription,
  //       quantity: parseInt(quantity),
  //       condition_received: conditionReceived,
  //       collector_name: currentUser.fullName,
  //       certified_by: certifiedBy,
  //       noted_by: notedBy,
  //       date_collected: dateCollected,
  //       collection_place: collectionPlace,
  //       retrieval_address: retrievalAddress,
  //       workflow_stage: "On Field",
  //       turned_over_by_name: currentUser.fullName,
  //       collector_signature_hash: null, // Storing empty hash since signature collection step is removed
  //     };

  //     try {
  //       // const url = "http://localhost:8081/intake_triage.php";
  //       const url = "https://steadier-headscarf-maggot.ngrok-free.dev/intake_triage.php";
  //       const response = await axios.post(url, payload);
  //       if (response.data?.status === "success") {
  //         setMessageType("success");
  //         triggerToast("New evidence record successfully created.", "success");
  //         // setMessage({
  //         //   isVisible: true,
  //         //   message: "New evidence record successfully created.",
  //         // });
  //         setMessage("");
  //         setTimeout(() => {
  //           setToast({ isVisible: false, message: "", type: "error" });
  //         }, 4000);
  //         clearFormState();
  //         fetchEvidence();
  //         setCurrentPage(1);
  //       }
  //     } catch (err) {
  //       console.error(err);
  //       setMessageType("error");
  //       setMessage("Transaction failed. Could not create evidence record.");
  //     } finally {
  //       setLoading(false);
  //     }
  //     return;
  //   }

  //   // --- RETAIN DIRECT SUBMIT PATH ONLY FOR EDITS (PUT REQUEST) ---
  //   const payload = {
  //     id: editingId,
  //     investigating_agency: investigatingAgency,
  //     case_number: caseNumber,
  //     case_title: caseTitle,
  //     suspect_names: suspectNames,
  //     witness_names: witnessNames,
  //     witnesses: witnesses.map(w => ({
  //       name: w.witnessName,
  //       signature_url: w.signatureUrl,
  //       timestamp: w.timestamp || new Date().toISOString()
  //     })),
  //     evidence_type: evidenceType,
  //     physical_description: physicalDescription,
  //     quantity: parseInt(quantity),
  //     condition_received: conditionReceived,
  //     collector_name: currentUser.fullName,
  //     certified_by: certifiedBy,
  //     noted_by: notedBy,
  //     date_collected: dateCollected,
  //     collection_place: collectionPlace,
  //     retrieval_address: retrievalAddress,
  //     workflow_stage:
  //       evidenceList.find((item) => item.id === editingId)?.workflow_stage ||
  //       "On Field",
  //   };

  //   try {
  //     // const url = "http://localhost:8081/intake_triage.php";
  //     const url = "https://steadier-headscarf-maggot.ngrok-free.dev/intake_triage.php";
  //     const response = await axios.put(url, payload);
  //     if (response.data?.status === "success") {
  //       setMessageType("success");
  //       setToast({
  //         isVisible: true,
  //         message: "Evidence record updated successfully.",
  //       });
  //       setMessage("");
  //       setTimeout(() => {
  //         setToast({ isVisible: false, message: "" });
  //       }, 4000);
  //       clearFormState();
  //       fetchEvidence();
  //     }
  //   } catch (err) {
  //     console.log(err);
  //     setMessageType("error");
  //     setMessage("Transaction failed. Please try again.");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleSaveEvidence = async (e) => {
    e.preventDefault();
    if (caseNumber.includes("XXXX") || caseNumber.trim() === "") {
      setMessageType("error");
      triggerToast(
        "Error: Please replace 'XXXX' with the valid sequential case log number."
      );
      return;
    }

    const corePrefix = (AGENCY_CASE_FORMATS[investigatingAgency] || "").split(
      "XXXX"
    )[0];
    if (corePrefix && !caseNumber.startsWith(corePrefix)) {
      setMessageType("error");
      setMessage(
        `Format Error: Case number for this station must begin with "${corePrefix}"`
      );
      return;
    }

    // PREVENT ACCIDENTAL DUPLICATES CLIENT SIDE
    if (!editingId) {
      const isDuplicate = evidenceList.some(
        (item) =>
          item.investigating_agency?.toLowerCase() ===
          investigatingAgency.toLowerCase() &&
          item.case_number?.toLowerCase() === caseNumber.trim().toLowerCase(),
      );

      if (isDuplicate) {
        setMessageType("error");
        triggerToast(
          "Collision Alert: Duplicate case layout entry rejected.",
          "error",
        );
        return;
      }
    }

    setLoading(true);

    try {
      const url = "https://steadier-headscarf-maggot.ngrok-free.dev/intake_triage.php";
      let targetId = editingId;

      const payload = {
        ...(editingId ? { id: editingId } : {}),
        investigating_agency: investigatingAgency,
        case_number: caseNumber,
        case_title: caseTitle,
        suspect_names: suspectNames,
        witness_names: witnessNames,
        witnesses: witnesses.map(w => ({
          name: w.witnessName,
          signature_url: w.signatureUrl,
          timestamp: w.timestamp || new Date().toISOString()
        })),
        evidence_type: evidenceType,
        physical_description: physicalDescription,
        quantity: parseInt(quantity),
        condition_received: conditionReceived,
        collector_name: currentUser.fullName,
        certified_by: certifiedBy,
        noted_by: notedBy,
        date_collected: dateCollected,
        collection_place: collectionPlace,
        retrieval_address: retrievalAddress,
        workflow_stage: editingId ? (evidenceList.find((item) => item.id === editingId)?.workflow_stage || "On Field") : "On Field",
        turned_over_by_name: currentUser.fullName,
        collector_signature_hash: null,
      };

      let response;
      if (editingId) {
        response = await axios.put(url, payload);
      } else {
        response = await axios.post(url, payload);
      }

      if (response.data?.status === "success") {
        // If it's a new record, capture the newly generated ID from the server response
        if (!editingId && response.data.id) {
          targetId = response.data.id;
        }

        // AUTO-UPLOAD STAGED FILES TO THEIR SPECIFIC evidence_[ID] FOLDER
        // AUTO-UPLOAD STAGED FILES TO THEIR SPECIFIC FOLDER
        const filesToUpload = evidenceImages.filter(img => img.file instanceof File);
        if (filesToUpload.length > 0) {
          const formData = new FormData();

          // 1. Pass numeric ID if available
          if (targetId) {
            formData.append("id", targetId);
          }

          // 2. Always pass an evidence_id fallback (derived safely from the case number)
          const safeCaseNum = caseNumber.replace(/[^a-zA-Z0-9]/g, '_');
          formData.append("evidence_id", `EV-2026-${safeCaseNum}`);

          filesToUpload.forEach(imgObj => {
            formData.append("evidence_files[]", imgObj.file);
          });

          const uploadRes = await fetch("https://steadier-headscarf-maggot.ngrok-free.dev/upload_evidence_image.php", {
            method: "POST",
            headers: {
              "ngrok-skip-browser-warning": "true"
            },
            body: formData,
          });

          const uploadResult = await uploadRes.json();
          if (uploadResult.status !== "success") {
            triggerToast(`Upload Error: ${uploadResult.message}`, "error");
            console.error("File upload failure:", uploadResult.message);
            return; // Stops execution so you can see the exact error message
          }
        }

        setMessageType("success");
        triggerToast(
          editingId ? "Evidence record updated successfully." : "New evidence record and files successfully created.",
          "success"
        );
        setMessage("");

        // Clear form and wipe staged images so nothing lingers behind
        clearFormState();
        setEvidenceImages([]);
        setIsImageModalOpen(false);

        fetchEvidence();
        setCurrentPage(1);
      }
    } catch (err) {
      console.error("Save process error:", err);
      setMessageType("error");
      triggerToast("Transaction failed. Could not save evidence record.");
    } finally {
      setLoading(false);
    }
  };

  const handleUploadSubmit = async (formDataPayload) => {
    if (evidenceImages.length === 0) {
      triggerToast("Please select at least one evidence image to upload.", "error");
      return;
    }

    setIsUploading(true);
    try {
      let targetId = formDataPayload?.id || editingId;

      // STEP 1: If it's a new record (no editingId yet), create the database record first
      if (!targetId) {
        const createPayload = {
          investigating_agency: investigatingAgency,
          case_number: caseNumber,
          case_title: caseTitle || "Untitled Case",
          suspect_names: suspectNames,
          witness_names: witnessNames,
          witnesses: witnesses.map(w => ({
            name: w.witnessName,
            signature_url: w.signatureUrl,
            timestamp: w.timestamp || new Date().toISOString()
          })),
          evidence_type: evidenceType,
          physical_description: physicalDescription,
          quantity: parseInt(quantity) || 1,
          condition_received: conditionReceived,
          collector_name: currentUser.fullName,
          certified_by: certifiedBy,
          noted_by: notedBy,
          date_collected: dateCollected || new Date().toISOString().slice(0, 16),
          collection_place: collectionPlace,
          retrieval_address: retrievalAddress,
          workflow_stage: "On Field",
          turned_over_by_name: currentUser.fullName,
          collector_signature_hash: null,
        };

        const createRes = await axios.post("https://steadier-headscarf-maggot.ngrok-free.dev/intake_triage.php", createPayload);
        if (createRes.data?.status === "success" && createRes.data.id) {
          targetId = createRes.data.id;
          setEditingId(targetId);
        } else {
          throw new Error(createRes.data?.message || "Failed to create initial record for file attachment.");
        }
      }

      // STEP 2: Proceed to upload the staged files
      const data = new FormData();
      data.append("id", targetId);

      evidenceImages.forEach((imgObj) => {
        if (imgObj.file instanceof File) {
          data.append("evidence_files[]", imgObj.file);
        }
      });

      const response = await fetch("https://steadier-headscarf-maggot.ngrok-free.dev/upload_evidence_image.php", {
        method: "POST",
        headers: {
          "ngrok-skip-browser-warning": "true"
        },
        body: data,
      });

      const rawText = await response.text();
      let result;
      try {
        result = JSON.parse(rawText);
      } catch (e) {
        throw new Error("Invalid server response: " + rawText);
      }

      if (result.status === "success") {
        triggerToast("Evidence record and files uploaded successfully!", "success");
        fetchEvidence();
        setEvidenceImages([]);
        setIsImageModalOpen(false);
      } else {
        throw new Error(result.message || "Upload failed.");
      }

    } catch (error) {
      console.error("Upload error details:", error);
      triggerToast(`Upload failed: ${error.message}`, "error");
    } finally {
      setIsUploading(false);
    }
  };

  // const handleSaveEvidence = async (e) => {
  //   e.preventDefault();
  //   if (caseNumber.includes("XXXX") || caseNumber.trim() === "") {
  //     setMessageType("error");
  //     setMessage("Error: Please replace 'XXXX' with the valid sequential case log number.");
  //     return;
  //   }

  //   const corePrefix = (AGENCY_CASE_FORMATS[investigatingAgency] || "").split("XXXX")[0];
  //   if (corePrefix && !caseNumber.startsWith(corePrefix)) {
  //     setMessageType("error");
  //     setMessage(`Format Error: Case number for this station must begin with "${corePrefix}"`);
  //     return;
  //   }

  //   // --- INTERCEPT NEW CREATIONS TO FORWARD TO THE SIGNATURE CANVAS ---
  //   if (!editingId) {
  //     // Build a simulated payload item for the preview modal panel layout
  //     setSelectedEvidenceItem({
  //       id: null,
  //       investigating_agency: investigatingAgency,
  //       case_number: caseNumber,
  //       case_title: caseTitle,
  //       suspect_names: suspectNames,
  //       witness_names: witnessNames,
  //       evidence_type: evidenceType,
  //       physical_description: physicalDescription,
  //       quantity: parseInt(quantity),
  //       condition_received: conditionReceived,
  //       collector_name: currentUser.fullName,
  //       certified_by: certifiedBy,
  //       noted_by: notedBy,
  //       date_collected: dateCollected,
  //       collection_place: collectionPlace,
  //       retrieval_address: retrievalAddress,
  //       workflow_stage: "On Field",
  //       turned_over_by_name: currentUser.fullName
  //     });

  //     setIsInitialCreation(true);  // Set our creation flow flag
  //     setIsSignatureModalOpen(true); // Fire up your signature window overlay
  //     return;
  //   }

  //   // --- RETAIN DIRECT SUBMIT PATH ONLY FOR EDITS ---
  //   setLoading(true);
  //   const payload = {
  //     id: editingId,
  //     investigating_agency: investigatingAgency,
  //     case_number: caseNumber,
  //     case_title: caseTitle,
  //     suspect_names: suspectNames,
  //     witness_names: witnessNames,
  //     evidence_type: evidenceType,
  //     physical_description: physicalDescription,
  //     quantity: parseInt(quantity),
  //     condition_received: conditionReceived,
  //     collector_name: currentUser.fullName,
  //     certified_by: certifiedBy,
  //     noted_by: notedBy,
  //     date_collected: dateCollected,
  //     collection_place: collectionPlace,
  //     retrieval_address: retrievalAddress,
  //     workflow_stage: evidenceList.find(item => item.id === editingId)?.workflow_stage || "On Field",
  //   };

  //   try {
  //     const url = "https://steadier-headscarf-maggot.ngrok-free.dev/intake_triage.php";
  //     const response = await axios.put(url, payload);
  //     if (response.data?.status === "success") {
  //       setMessageType("success");
  //       setToast({
  //         isVisible: true,
  //         message: "Evidence record updated successfully."
  //       });
  //       setMessage("");
  //       setTimeout(() => { setToast({ isVisible: false, message: "" }); }, 4000);
  //       clearFormState();
  //       fetchEvidence();
  //     }
  //   } catch (err) {
  //     console.log(err);
  //     setMessageType("error"); setMessage("Transaction failed. Please try again.");
  //   } finally { setLoading(false); }
  // };

  const startEditMode = (item) => {
    setEditingId(item.id);
    setInvestigatingAgency(item.investigating_agency);
    setCaseNumber(item.case_number);
    setCaseTitle(item.case_title || "");
    setSuspectNames(item.suspect_names || "");
    setWitnessNames(item.witness_names || "");
    // Robustly parse witnesses from backend (handles array, JSON string, or fallback keys)
    let parsedWitnesses = [];
    const rawWitnesses = item.witnesses || item.witnesses_data || item.witness_list;

    if (Array.isArray(rawWitnesses)) {
      parsedWitnesses = rawWitnesses;
    } else if (typeof rawWitnesses === "string" && rawWitnesses.trim() !== "") {
      try {
        parsedWitnesses = JSON.parse(rawWitnesses);
      } catch (e) {
        parsedWitnesses = [];
      }
    }

    setWitnesses(
      parsedWitnesses.map((w) => ({
        // Look for any variation of the name key returned by the backend
        witnessName: w.witnessName || w.name || w.witness_name || "",
        signatureUrl: w.signatureUrl || w.signature_url || "",
        timestamp: w.timestamp || "",
      }))
    );

    let parsedImages = [];
    const rawImages = item.images || item.images_data || item.image_list;
    if (Array.isArray(rawImages)) {
      parsedImages = rawImages;
    } else if (typeof rawImages === "string" && rawImages.trim() !== "") {
      try { parsedImages = JSON.parse(rawImages); } catch (e) { parsedImages = []; }
    }

    const formattedExistingImages = parsedImages.map(img => {
      const rawPath = typeof img === 'string' ? img : (img.file_path || img.previewUrl || "");
      let cleanPath = rawPath.replace(/\\/g, "/").replace(/^\/+/, "");

      if (cleanPath.startsWith("backend/")) {
        cleanPath = cleanPath.replace("backend/", "");
      }

      return {
        file: null,
        name: img.file_name || "Evidence Image",
        file_path: cleanPath, // Store clean relative path (e.g. uploads/evidence_images/...)
        previewUrl: `https://steadier-headscarf-maggot.ngrok-free.dev/${cleanPath}`
      };
    });

    setEvidenceImages(formattedExistingImages);

    async function fetchSecureImage(url) {
      try {
        const response = await fetch(url, {
          headers: { "ngrok-skip-browser-warning": "true" }
        });
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      } catch (err) {
        console.error("Failed to load secure image", err);
        return "";
      }
    }

    setEvidenceType(
      item.evidence_type === "Digital Media Unit"
        ? "Digital Media"
        : item.evidence_type,
    );
    setPhysicalDescription(item.physical_description);
    setQuantity(item.quantity);
    setConditionReceived(item.condition_received || "");
    setCertifiedBy(item.certified_by || "");
    setNotedBy(item.noted_by || "");
    // setDateCollected(item.date_collected || "");
    // Safely parse and format date_collected for the datetime-local input (YYYY-MM-DDTHH:mm)
    const rawDate = item.created_at || item.date_collected || item.date || item.datetime_collected;

    if (rawDate) {
      let formattedDate = String(rawDate).trim();

      // Replace space with 'T' if it's in SQL format ('YYYY-MM-DD HH:mm:ss')
      if (formattedDate.includes(" ")) {
        formattedDate = formattedDate.replace(" ", "T");
      }

      // Trim seconds/milliseconds off if present to fit YYYY-MM-DDTHH:mm (16 characters)
      if (formattedDate.length > 16) {
        formattedDate = formattedDate.slice(0, 16);
      }

      setDateCollected(formattedDate);
    } else {
      setDateCollected("");
    }

    setCollectionPlace(item.collection_place || "");
    setRetrievalAddress(item.retrieval_address || "");
    setIsFormOpen(true);

    // Then wait a brief moment for the DOM element to mount before scrolling to it
    setTimeout(() => {
      formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  };

  const executeInitiateTurnover = async (signatureBase64) => {
    setLoading(true);
    try {
      // const response = await axios.put("http://localhost:8081/intake_triage.php",
      const response = await axios.put("https://steadier-headscarf-maggot.ngrok-free.dev/intake_triage.php",
        {
          ...selectedEvidenceItem,
          workflow_stage: "Turnover Pending",
          turned_over_by_name: currentUser.fullName,
          turned_over_by_agency: selectedEvidenceItem.investigating_agency,
          received_by_name:
            handshakeTargetCustodian || "Pending Custodian Signature",
          noted_by: handshakeTargetSupervisor || "Pending Administration Note",
          turnover_remarks:
            turnoverRemarks.trim() || "No physical state remarks logged.",
          collector_signature_hash: signatureBase64,
        },
      );

      if (response.data?.status === "success") {
        setMessageType("success");

        // Trigger the green emerald success toast notification
        triggerToast(
          "Turnover routing initiated. Secure snapshot and stamp applied to registry ledger.",
          "success"
        );

        setMessage(""); // Clear any lingering legacy message strings
        closeTurnoverModal();
        fetchEvidence();
      }
    } catch (err) {
      console.error(err);
      setMessageType("error");

      // Trigger the red rose-tinted error toast notification instead of a static message string
      triggerToast(
        "Transaction Failed: Turnover transfer request could not be processed by the server ledger.",
        "error"
      );

      setMessage(""); // Clear legacy state string bounds
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteArchive = async (evidenceId, archiveReason) => {
    setIsArchivingSubmitting(true);
    try {
      // await axios.delete("http://localhost:8081/intake_triage.php",
      await axios.delete("https://steadier-headscarf-maggot.ngrok-free.dev/intake_triage.php",
        {
          data: { id: evidenceId, reason: archiveReason },
        },
      );
      setMessageType("success");
      setMessage("Evidence record has been marked as Archived.");
      setIsArchiveModalOpen(false);
      fetchEvidence();
    } catch (err) {
      console.log(err);
      setMessageType("error");
      setMessage("Archive processing failed.");
    } finally {
      setIsArchivingSubmitting(false);
    }
  };

  // const handlePrintSlip = (row) => {
  //   setActivePrintRow(row);
  //   setTimeout(() => {
  //     window.print();
  //   }, 250);
  // };

  const totalItems = evidenceList.length;
  const onFieldItems = evidenceList.filter(
    (i) => i.workflow_stage === "On Field" || !i.workflow_stage,
  ).length;
  const storageItems = evidenceList.filter(
    (i) => i.workflow_stage === "In Storage",
  ).length;
  const turnoverPendingItems = evidenceList.filter(
    (i) => i.workflow_stage === "Turnover Pending",
  ).length;

  const countSubCategory = (category) => {
    const list = CATEGORY_MAP[category] || [];
    return evidenceList.filter((i) => list.includes(i.physical_description))
      .length;
  };

  const safeEvidenceList = Array.isArray(evidenceList) ? evidenceList : [];
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = safeEvidenceList.slice(
    indexOfFirstItem,
    indexOfLastItem,
  );
  const totalPages = Math.ceil(safeEvidenceList.length / itemsPerPage) || 1;
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="w-full space-y-6 print:p-0 font-sans text-slate-300">
      {/* HEADER SECTION */}
      <div className="relative w-full z-10">
        {/* SPLINE BACKGROUND LAYER - Positioned at the very baseline back */}
        <div className="absolute inset-0 w-full h-full z-0 overflow-hidden opacity-100 transition-opacity duration-700 ease-in-out pointer-events-none">
          <Spline
            // scene="https://prod.spline.design/y9kiQ0qCdATiQ1s0/scene.splinecode"
            // scene="https://prod.spline.design/8z1DQ8eWmkaOnZ4z/scene.splinecode"
            // scene="https://prod.spline.design/PiKPIho3wMQ1ZoFe/scene.splinecode"
            scene="https://prod.spline.design/fyKP5gxeJ0N1Ae9c/scene.splinecode"
          // scene="https://prod.spline.design/FBB4nfclSJeOSSQ6/scene.splinecode"
          />

          {/* Vignette & Contrast Shading Overlays */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-slate-950/50 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/20 via-transparent to-slate-950/20 pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-72 h-32 bg-gradient-to-br from-transparent via-slate-950 to-slate-950 pointer-events-none filter blur-sm" />
        </div>

        {/* MAIN CONTENT HEADER ZONE - Positioned securely above the Spline canvas */}
        <header className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-900/60 pb-5 backdrop-blur-[2px] print:hidden">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl font-black text-white uppercase tracking-tight drop-shadow-md">
                Evidence Collection Dashboard
              </h2>
              <span className="text-[10px] uppercase font-mono tracking-widest text-blue-400 font-bold bg-blue-950/30 border border-blue-900/40 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(59,130,246,0.05)]">
                Collector Workspace
              </span>
            </div>
            <p className="text-slate-300 text-xs tracking-wide drop-shadow-sm">
              Manage initial evidence logging, secure labels, and tracking
              chain-of-custody turnovers.
            </p>
          </div>

          <button
            onClick={() => {
              if (isFormOpen) clearFormState();
              setIsFormOpen(!isFormOpen);
            }}
            className={`font-black text-[11px] px-5 py-3 rounded-xl uppercase tracking-wider transition-all duration-200 border shadow-md active:scale-[0.98] ${isFormOpen
              ? "bg-slate-900/60 text-slate-200 border-slate-800/80 hover:bg-slate-800/80 hover:text-white"
              : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/10 border-blue-500/20"
              }`}
          >
            {isFormOpen ? "Close Form" : "Log New Evidence"}
          </button>
        </header>
      </div>

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

      {/* SUMMARY STATISTICS */}
      {!isFormOpen && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
          {/* Total Logged Items Card */}
          <div className="group relative bg-slate-900/35 border border-slate-800/60 rounded-2xl p-5 flex flex-col justify-between shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-blue-500/40 hover:shadow-blue-500/5 overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/[0.015] before:to-transparent before:pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider transition-colors group-hover:text-blue-400">
                Total Logged Items
              </span>
              <div className="p-1.5 rounded-lg bg-slate-950/40 border border-slate-800/40 text-slate-400 group-hover:text-blue-400 group-hover:border-blue-500/20 transition-all">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
            <div className="flex items-baseline gap-1 mt-4">
              <span className="text-3xl font-black text-white font-mono tracking-tight drop-shadow-[0_2px_10px_rgba(255,255,255,0.05)]">
                {totalItems}
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide ml-1">
                records
              </span>
            </div>
          </div>

          {/* Active in the Field Card */}
          <div className="group relative bg-slate-900/35 border border-slate-800/60 rounded-2xl p-5 flex flex-col justify-between shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-amber-500/40 hover:shadow-amber-500/5 overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/[0.015] before:to-transparent before:pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-amber-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-amber-400/90 font-black uppercase tracking-wider transition-colors group-hover:text-amber-400">
                Active in the Field
              </span>
              <div className="p-1.5 rounded-lg bg-amber-950/20 border border-amber-900/30 text-amber-400/70 group-hover:text-amber-400 group-hover:border-amber-500/30 transition-all">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
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
            <div className="flex items-baseline gap-1 mt-4">
              <span className="text-3xl font-black text-amber-400 font-mono tracking-tight drop-shadow-[0_2px_10px_rgba(245,158,11,0.1)]">
                {onFieldItems}
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide ml-1">
                items
              </span>
            </div>
          </div>

          {/* Secured In Storage Card */}
          <div className="group relative bg-slate-900/35 border border-slate-800/60 rounded-2xl p-5 flex flex-col justify-between shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-blue-500/40 hover:shadow-blue-500/5 overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/[0.015] before:to-transparent before:pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-blue-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-blue-400/90 font-black uppercase tracking-wider transition-colors group-hover:text-blue-400">
                Secured In Storage
              </span>
              <div className="p-1.5 rounded-lg bg-blue-950/20 border border-blue-900/30 text-blue-400/70 group-hover:text-blue-400 group-hover:border-blue-500/30 transition-all">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
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
            <div className="flex items-baseline gap-1 mt-4">
              <span className="text-3xl font-black text-blue-400 font-mono tracking-tight drop-shadow-[0_2px_10px_rgba(59,130,246,0.1)]">
                {storageItems}
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide ml-1">
                items
              </span>
            </div>
          </div>

          {/* Turnovers Pending Card */}
          <div className="group relative bg-slate-900/35 border border-slate-800/60 rounded-2xl p-5 flex flex-col justify-between shadow-xl backdrop-blur-xl transition-all duration-300 hover:border-purple-500/40 hover:shadow-purple-500/5 overflow-hidden before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/[0.015] before:to-transparent before:pointer-events-none">
            <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-purple-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="flex justify-between items-start">
              <span className="text-[10px] text-purple-400/90 font-black uppercase tracking-wider transition-colors group-hover:text-purple-400">
                Turnovers Pending
              </span>
              <div className="p-1.5 rounded-lg bg-purple-950/20 border border-purple-900/30 text-purple-400/70 group-hover:text-purple-400 group-hover:border-purple-500/30 transition-all">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
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
            <div className="flex items-baseline gap-1 mt-4">
              <span className="text-3xl font-black text-purple-400 font-mono tracking-tight drop-shadow-[0_2px_10px_rgba(168,85,247,0.1)]">
                {turnoverPendingItems}
              </span>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wide ml-1">
                transfers
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ACQUISITION FORM */}
      {isFormOpen && (
        <form
          ref={formRef}
          onSubmit={handleSaveEvidence}
          className="bg-slate-900/40 border border-slate-800/60 rounded-2xl p-6 space-y-6 print:hidden shadow-xl backdrop-blur-md"
        >
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-wider">
              {editingId
                ? `Edit Evidence Record: ${formatEvidenceId({ id: editingId })}`
                : "Log New Evidence Entry"}
            </h3>
          </div>

          {/* Section 1: Case Details */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-start">
            {/* Column 1: Investigating Agency */}
            <div className="space-y-1.5 relative group">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider transition-colors group-focus-within:text-blue-400">
                Investigating Agency / Station *
              </label>
              <div className="relative">
                <select
                  value={investigatingAgency}
                  onChange={(e) => {
                    setInvestigatingAgency(e.target.value);
                    setCaseNumber(AGENCY_CASE_FORMATS[e.target.value]);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-10 py-3 text-sm text-slate-200 focus:text-white focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10 focus:outline-none appearance-none cursor-pointer transition-all duration-200 shadow-inner hover:border-slate-700"
                >
                  {BENGUET_AGENCIES.map((a) => (
                    <option
                      key={a}
                      value={a}
                      className="bg-slate-950 text-slate-200 py-2"
                    >
                      {a}
                    </option>
                  ))}
                </select>

                {/* Modern Custom Dropdown Arrow */}
                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-500 transition-colors group-focus-within:text-blue-400">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2.5"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            {/* Column 2: RE SOCO NR */}
            <div className="space-y-1.5 relative group">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider transition-colors group-focus-within:text-blue-400">
                RE SOCO NR *
              </label>
              <input
                type="text"
                value={caseNumber}
                onChange={(e) => {
                  const input = e.target.value;

                  // Safe extraction lookup check
                  const currentFormat = investigatingAgency
                    ? AGENCY_CASE_FORMATS[investigatingAgency]
                    : "";
                  const expectedPrefix =
                    currentFormat && typeof currentFormat === "string"
                      ? currentFormat.split("XXXX")[0]
                      : "";

                  // Guard condition to prevent breaking the prefix bounds
                  if (
                    expectedPrefix &&
                    input.length < expectedPrefix.length &&
                    !expectedPrefix.startsWith(input)
                  ) {
                    setCaseNumber(expectedPrefix);
                  } else {
                    setCaseNumber(input);
                  }
                }}
                placeholder={AGENCY_CASE_FORMATS[investigatingAgency]}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl outline-none text-white focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/60 transition-all text-sm font-mono"
                required
              />
              <p className="text-[10px] text-slate-500 italic leading-none pl-1">
                Reference Profile:{" "}
                <span className="text-blue-400 font-mono font-medium">
                  {AGENCY_CASE_FORMATS[investigatingAgency]}
                </span>
              </p>
            </div>

            {/* Column 3: Nature of Offense */}
            <div className="space-y-1.5 relative group">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider transition-colors group-focus-within:text-blue-400">
                Nature of Offense / Case Title*
              </label>
              <input
                type="text"
                value={caseTitle}
                onChange={(e) => setCaseTitle(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500/60 focus:outline-none transition-all hover:border-slate-700"
                placeholder="e.g., Cyber Financial Fraud, Theft"
              />
            </div>
          </div>

          {/* Section 2: Involved Parties */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-start">
            {/* Left Column: Suspect Names */}
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2 tracking-wide">
                Suspect Name(s){" "}
                <span className="text-[10px] normal-case font-normal text-slate-500">
                  (Separate with commas)
                </span>
              </label>
              <input
                type="text"
                value={suspectNames}
                onChange={(e) => setSuspectNames(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-blue-500/50 focus:outline-none"
                placeholder="e.g. Juan De La Cruz (Leave blank if unknown)"
              />
            </div>

            {/* Right Column: Witnesses / Complainants (Required: 2) */}
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold uppercase text-slate-400 tracking-wide">
                  Witnesses / Complainants <span className="text-blue-400 font-mono">(Req: 2)</span>
                </label>

                {witnesses.length < 2 && (
                  <button
                    type="button"
                    onClick={() => setIsWitnessModalOpen(true)}
                    className="text-[10px] font-bold uppercase bg-blue-600/20 text-blue-400 border border-blue-500/30 px-2.5 py-1 rounded-lg hover:bg-blue-600/30 transition-all flex items-center gap-1.5"
                  >
                    <PenTool className="w-3.5 h-3.5" /> Add Witness
                  </button>
                )}
              </div>

              {/* Compact Stack for Witness Slots */}
              <div className="space-y-2">
                {[0, 1].map((index) => {
                  const witness = witnesses[index];
                  return witness ? (
                    <div key={index} className="flex items-center justify-between bg-slate-950 border border-slate-800 px-3.5 py-2.5 rounded-xl">
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <span className="w-5 h-5 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                          {index + 1}
                        </span>
                        <div className="overflow-hidden">
                          <p className="text-xs font-bold text-white truncate">{witness.witnessName}</p>
                          <p className="text-[9px] text-emerald-400 font-mono mt-1">Signature Attached</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setWitnesses(witnesses.filter((_, i) => i !== index))}
                        className="text-[10px] bg-red-950/40 text-red-400 border border-red-900/50 px-2 py-1 rounded-lg hover:bg-red-900/40 shrink-0 ml-2"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div key={index} className="flex items-center justify-between bg-slate-950/40 border border-dashed border-slate-800/80 px-3.5 py-2.5 rounded-xl text-slate-600 text-xs">
                      <span className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-full bg-slate-900 border border-slate-800 text-slate-600 flex items-center justify-center text-[10px] font-bold">
                          {index + 1}
                        </span>
                        <span>Awaiting Witness {index + 1} Signature...</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2 tracking-wide">
                Suspect Name(s){" "}
                <span className="text-[10px] normal-case font-normal text-slate-500">
                  (Separate with commas)
                </span>
              </label>
              <input
                type="text"
                value={suspectNames}
                onChange={(e) => setSuspectNames(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-blue-500/50 focus:outline-none"
                placeholder="e.g. Juan De La Cruz (Leave blank if unknown)"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-2 tracking-wide">
                Witness Name(s) / Complainant
              </label>
              <input
                type="text"
                value={witnessNames}
                onChange={(e) => setWitnessNames(e.target.value)}
                className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl text-white text-sm focus:border-blue-500/50 focus:outline-none"
                placeholder="Enter witness description or info"
              />
            </div>
          </div> */}

          {/* Section 3: Evidence Specifications */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-950 p-4 rounded-xl border border-slate-800">
            {/* Evidence Category Select */}
            <div className="flex flex-col justify-end">
              <label className="block text-[11px] font-bold text-blue-400 uppercase mb-2 tracking-wide">
                Evidence Category
              </label>
              <select
                value={evidenceType}
                onChange={handleEvidenceTypeChange}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-lg outline-none text-white focus:border-blue-500 text-xs appearance-none pr-8 transition-colors"
                style={{
                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 0.75rem center",
                  backgroundSize: "1rem",
                }}
              >
                <option
                  value="Digital Media"
                  className="bg-slate-900 text-white"
                >
                  Digital Media
                </option>
                <option
                  value="Physical Specimen"
                  className="bg-slate-900 text-white"
                >
                  Physical Specimen
                </option>
                <option
                  value="Documentary Evidence"
                  className="bg-slate-900 text-white text-xs"
                >
                  Documentary Evidence
                </option>
                <option
                  value="Biological"
                  className="bg-slate-900 text-white text-xs"
                >
                  Biological
                </option>
                <option
                  value="Trace"
                  className="bg-slate-900 text-white text-xs"
                >
                  Trace
                </option>
                <option
                  value="Impression and Pattern"
                  className="bg-slate-900 text-white text-xs"
                >
                  Impression and Pattern
                </option>
                <option
                  value="Firearms and Toolmarks"
                  className="bg-slate-900 text-white text-xs"
                >
                  Firearms and Toolmarks
                </option>
                <option
                  value="Chemical and Toxicology"
                  className="bg-slate-900 text-white text-xs"
                >
                  Chemical and Toxicology
                </option>
                <option
                  value="Questioned Documents"
                  className="bg-slate-900 text-white text-xs"
                >
                  Questioned Documents
                </option>
              </select>
            </div>

            {/* Item Type / Description Select */}
            <div className="flex flex-col justify-end">
              <label className="block text-[11px] font-bold text-blue-400 uppercase mb-2 tracking-wide">
                Item Type / Description
              </label>
              <select
                value={physicalDescription}
                onChange={(e) => setPhysicalDescription(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-lg outline-none text-white focus:border-blue-500 text-xs appearance-none pr-8 transition-colors"
                style={{
                  backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`,
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "right 0.75rem center",
                  backgroundSize: "1rem",
                }}
              >
                {(
                  CATEGORY_MAP[evidenceType] ||
                  CATEGORY_MAP["Digital Media"] ||
                  []
                ).map((o, i) => (
                  <option key={i} value={o} className="bg-slate-900 text-white">
                    {o}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity Counter */}
            <div className="flex flex-col justify-end">
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-2 tracking-wide">
                Quantity
              </label>
              <div className="flex items-center w-full bg-slate-900 border border-slate-800 rounded-lg overflow-hidden group focus-within:border-slate-700 transition-colors">
                <button
                  type="button"
                  onClick={() => setQuantity((p) => Math.max(1, p - 1))}
                  className="px-3 py-2.5 text-slate-400 hover:text-white font-bold transition-colors bg-slate-850 hover:bg-slate-800 text-xs select-none"
                >
                  -
                </button>
                <input
                  type="number"
                  value={quantity}
                  readOnly
                  className="w-full bg-transparent text-center text-white text-xs font-mono select-none py-2.5 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() => setQuantity((p) => p + 1)}
                  className="px-3 py-2.5 text-slate-400 hover:text-white font-bold transition-colors bg-slate-850 hover:bg-slate-800 text-xs select-none"
                >
                  +
                </button>
              </div>
            </div>

            {/* Remarks / Serial Input */}
            <div className="flex flex-col justify-end">
              <label className="block text-[11px] font-bold text-slate-400 uppercase mb-2 tracking-wide">
                Condition / Device Serial No.
              </label>
              <input
                type="text"
                value={conditionReceived}
                onChange={(e) => setConditionReceived(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs outline-none focus:border-blue-500 transition-colors"
                placeholder="Brand, Serial, or visible defects"
              />
            </div>
          </div>

          {/* Section 4: Collection Specifics & Authorizations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-slate-800 p-4 rounded-xl bg-slate-950/50 space-y-4">
              <span className="text-xs font-bold uppercase text-slate-300 block tracking-wider">
                Collection Details
              </span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-slate-400 font-bold">
                    Assigned Collector
                  </label>
                  <input
                    type="text"
                    value={currentUser?.fullName || ""}
                    disabled
                    className="w-full bg-slate-950 border border-slate-900 rounded-lg px-2 py-1.5 text-xs text-slate-500 cursor-not-allowed font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-slate-400 font-bold">
                    Date Collected
                  </label>
                  <input
                    type="datetime-local"
                    value={dateCollected}
                    onChange={(e) => setDateCollected(e.target.value)}
                    className="w-full px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-lg text-white text-xs outline-none focus:border-blue-500 transition-colors 
                    [&::-webkit-calendar-picker-indicator]:invert 
                    [&::-webkit-calendar-picker-indicator]:opacity-60 
                    [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] uppercase text-slate-400 font-bold">
                    Place of Collection{" "}
                    <span className="text-[9px] text-slate-500 lowercase">
                      (container/room)
                    </span>
                  </label>
                  <input
                    type="text"
                    value={collectionPlace}
                    onChange={(e) => setCollectionPlace(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                    placeholder="e.g., Office Desk Drawer"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase text-slate-400 font-bold">
                    Geographic Address Location
                  </label>
                  <input
                    type="text"
                    value={retrievalAddress}
                    onChange={(e) => setRetrievalAddress(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                    placeholder="Street/Barangay address"
                  />
                </div>
              </div>
            </div>

            <div className="border border-slate-800 p-4 rounded-xl bg-slate-950/50 flex flex-col justify-between space-y-4">
              <div>
                <span className="text-xs font-bold uppercase text-slate-300 block tracking-wider">
                  Sign-off Verification Status
                </span>
                <div className="grid grid-cols-2 gap-3 mt-4">
                  {/* Certified By - Permanently Locked for Handshake Signatures */}
                  <div>
                    <label className="block text-[10px] uppercase text-slate-400 font-bold mb-1">
                      Certified By: Team Leader
                    </label>
                    <select
                      value={certifiedBy}
                      onChange={(e) => setCertifiedBy(e.target.value)}
                      /* LOCKED AT ALL TIMES: Signatures happen externally via turnover flow */
                      disabled={true}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {/* If certifiedBy is empty string, show the workflow tracking placeholder */}
                      {!certifiedBy ? (
                        <option value="">
                          — Awaiting Handshake Turn-over —
                        </option>
                      ) : (
                        <option value={certifiedBy}>{certifiedBy}</option>
                      )}

                      {/* Keep personnel array as fallback structure underneath if needed */}
                      {stationPersonnel.map((user) => {
                        const formattedName =
                          `${user.agency_rank_title || ""} ${user.first_name || ""} ${user.last_name || ""}`.trim();
                        return (
                          <option key={user.id} value={formattedName}>
                            {user.agency_rank_title
                              ? `[${user.agency_rank_title}] `
                              : ""}
                            {user.first_name} {user.last_name} —{" "}
                            {user.sub_role || "Officer"}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Noted By - Permanently Locked for Administrative Signatures */}
                  <div>
                    <label className="block text-[10px] uppercase text-slate-400 font-bold mb-1">
                      Noted By: Chief of Station
                    </label>
                    <select
                      value={notedBy}
                      onChange={(e) => setNotedBy(e.target.value)}
                      /* LOCKED AT ALL TIMES: Signatures happen externally via turnover flow */
                      disabled={true}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {!notedBy ? (
                        /* Displays strictly while workflow is incomplete */
                        <option value="">
                          — Awaiting Custody Verification —
                        </option>
                      ) : (
                        /* Displays strictly the finalized signature authority once signed off */
                        <option value={notedBy}>{notedBy}</option>
                      )}
                    </select>
                  </div>
                </div>
              </div>
              <div className="text-[10px] text-slate-500 italic font-medium leading-relaxed pt-2 border-t border-slate-900">
                Notice: All entries submitted to the system log individual
                cryptographic transaction tracking IDs permanently for complete
                chain of custody validation.
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-3 border-t border-slate-800/60 pt-5 mt-4">
            {/* HIDDEN UNIVERSAL FILE INPUT BRIDGE */}
            <input
              type="file"
              id="evidentia-universal-import"
              accept=".xlsx, .xls, .csv, .txt"
              onChange={(e) =>
                handleExcelImport(
                  e,
                  formSetters,
                  BENGUET_AGENCIES,
                  CATEGORY_MAP,
                  evidenceList,
                  triggerToast,
                )
              }
              className="hidden"
            />

            {/* HIDDEN IMAGE COLLECTION UPLOAD BRIDGE */}
            <input
              id="evidentia-image-collection-upload"
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleFile}
            />

            {/* IMAGE MANAGEMENT ACTION BAR */}
            <div className="flex items-center gap-3 mt-3">
              <button
                type="button"
                onClick={() => document.getElementById("evidentia-image-collection-upload").click()}
                className="px-5 py-2.5 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 font-bold text-[11px] rounded-xl uppercase tracking-widest transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 shadow-md group"
              >
                <ImagePlus className="w-3.5 h-3.5 text-blue-400 transition-transform group-hover:-translate-y-0.5" />
                Upload Images ({evidenceImages.length})
              </button>

              {evidenceImages.length > 0 && (
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => setIsImageModalOpen(true)}
                  className="px-5 py-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 font-bold text-[11px] rounded-xl uppercase tracking-widest transition-all duration-200 flex items-center gap-2"
                >
                  View Staged Images/Saved Images ({evidenceImages.length})
                </button>
              )}
            </div>

            {/* IMAGE PREVIEW / FILE MANIFEST MODAL */}
            {/* IMAGE PREVIEW / FILE MANIFEST MODAL WITH SMALL THUMBNAILS & CRUD */}
            {/* IMAGE PREVIEW / FILE MANIFEST MODAL */}
            {/* IMAGE PREVIEW / FILE MANIFEST MODAL */}
            {isImageModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-2xl p-6 shadow-2xl flex flex-col max-h-[85vh]">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div>
                      <h3 className="text-white font-bold text-sm uppercase tracking-wider">
                        Linked Evidence Files Manifest ({evidenceImages.length})
                      </h3>
                      <p className="text-[10px] text-slate-400">Secure record registry mapping & file management</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsImageModalOpen(false)}
                        className="text-slate-400 hover:text-white text-xs font-bold uppercase bg-slate-800 px-3 py-1.5 rounded-lg"
                      >
                        Close
                      </button>

                      <button
                        type="button"
                        disabled={isUploading}
                        onClick={() => handleUploadSubmit({ id: editingId })}
                        className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase rounded-lg shadow-md"
                      >
                        {isUploading ? "Uploading..." : "Confirm & Save Files"}
                      </button>
                    </div>
                  </div>

                  {/* Clean File List Manifest with Lucide Icon & Download Feature */}
                  <div className="space-y-2.5 overflow-y-auto py-4 max-h-[60vh] pr-1">
                    {evidenceImages.map((img, idx) => {
                      // Determine the proper download URL (supports both local blobs and server-stored paths)
                      const downloadUrl = img.file instanceof File ? img.previewUrl : img.file_path;

                      return (
                        <div key={idx} className="flex items-center justify-between bg-slate-950 border border-slate-800/80 px-4 py-3 rounded-xl hover:border-slate-700 transition-all">
                          <div className="flex items-center gap-3 overflow-hidden">

                            {/* File Icon Badge using Lucide Image Icon */}
                            <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 flex items-center justify-center shrink-0 shadow-inner">
                              <Image className="w-5 h-5 text-blue-400" />
                            </div>

                            <div className="overflow-hidden">
                              <p className="text-xs font-bold text-white truncate max-w-xs sm:max-w-md" title={img.name}>
                                {img.name || "Evidence Document / Image"}
                              </p>
                              <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                                {img.file instanceof File ? `Staged: ${(img.file.size / 1024).toFixed(1)} KB` : "Stored on Server Record"}
                              </p>
                            </div>
                          </div>

                          {/* Action Buttons: Download & Delete */}
                          <div className="flex items-center gap-2 shrink-0 ml-3">
                            {/* Download Button via PHP Streamer */}
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  if (img.file instanceof File) {
                                    const link = document.createElement('a');
                                    link.href = img.previewUrl;
                                    link.download = img.name;
                                    document.body.appendChild(link);
                                    link.click();
                                    document.body.removeChild(link);
                                    return;
                                  }

                                  // Point directly to download_file.php endpoint with relative path
                                  const downloadEndpoint = `https://steadier-headscarf-maggot.ngrok-free.dev/download_file.php?file=${encodeURIComponent(img.file_path)}`;

                                  const response = await fetch(downloadEndpoint, {
                                    headers: { "ngrok-skip-browser-warning": "true" }
                                  });

                                  if (!response.ok) throw new Error("File not found on server");

                                  const blob = await response.blob();
                                  const blobUrl = window.URL.createObjectURL(blob);
                                  const link = document.createElement('a');
                                  link.href = blobUrl;
                                  link.download = img.name || "evidence_file";
                                  document.body.appendChild(link);
                                  link.click();
                                  document.body.removeChild(link);
                                  window.URL.revokeObjectURL(blobUrl);
                                } catch (err) {
                                  triggerToast("Download failed: File path could not be resolved.", "error");
                                }
                              }}
                              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 rounded-lg font-bold transition-all flex items-center gap-1 cursor-pointer"
                            >
                              Download
                            </button>

                            {/* Delete Button (CRUD) */}
                            <button
                              type="button"
                              onClick={async () => {
                                if (!img.file && editingId) {
                                  try {
                                    await axios.delete("https://steadier-headscarf-maggot.ngrok-free.dev/upload_evidence_image.php", {
                                      headers: { "ngrok-skip-browser-warning": "true" },
                                      data: { id: editingId, file_path: img.file_path }
                                    });
                                    triggerToast("File successfully deleted from directory and database.", "success");
                                  } catch (err) {
                                    triggerToast("Failed to delete file from server.", "error");
                                    return;
                                  }
                                }
                                setEvidenceImages(evidenceImages.filter((_, i) => i !== idx));
                              }}
                              className="text-xs bg-red-950/40 text-red-400 border border-red-900/50 hover:bg-red-900/40 px-3 py-1.5 rounded-lg font-bold transition-all"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {evidenceImages.length === 0 && (
                      <div className="text-center py-12 text-slate-500 text-xs italic font-mono">
                        No files staged or linked to this record yet.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* IMPORT BUTTON (Secondary Action) */}
            <button
              type="button"
              onClick={() =>
                document.getElementById("evidentia-universal-import").click()
              }
              className="px-5 py-2.5 bg-slate-900/60 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 font-bold text-[11px] rounded-xl uppercase tracking-widest transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2 shadow-md group"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2.5}
                stroke="currentColor"
                className="w-3.5 h-3.5 text-emerald-500 transition-transform group-hover:-translate-y-0.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 16.5V3.75m0 12.75l-4.5-4.5m4.5 4.5l4.5-4.5M3 20.25h18"
                />
              </svg>
              Import Template
            </button>

            {/* 2. TOGGLE / CLOSE INTAKE FORM BUTTON (Secondary Contextual Action) */}
            <button
              type="button"
              onClick={() => {
                if (isFormOpen) clearFormState();
                setIsFormOpen(!isFormOpen);
              }}
              className={`font-bold text-[11px] px-5 py-2.5 rounded-xl uppercase tracking-widest transition-all duration-200 border backdrop-blur-sm active:scale-[0.98] flex items-center justify-center gap-2 ${isFormOpen
                ? "bg-slate-900/40 text-sky-400 border-sky-950/60 hover:bg-sky-950/20 hover:border-sky-900/50"
                : "bg-slate-900/60 text-blue-400 border-slate-800 hover:bg-slate-800 hover:text-blue-300"
                }`}
            >
              {isFormOpen ? (
                <>Close Form</>
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className="w-3.5 h-3.5 animate-pulse text-blue-500"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 4.5v15m7.5-7.5h-15"
                    />
                  </svg>
                  Log New Evidence
                </>
              )}
            </button>

            {/* 3. CLEAR FIELDS BUTTON (Tertiary Action) */}
            <button
              type="button"
              onClick={clearFormState}
              className="px-5 py-2.5 bg-slate-950/40 hover:bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-900 font-bold text-[11px] rounded-xl uppercase tracking-widest transition-all duration-200 active:scale-[0.98] flex items-center justify-center gap-2"
            >
              Clear Fields
            </button>

            {/* 4. SUBMIT / SAVE RECORD BUTTON (Primary Action) */}
            <button
              type="submit"
              className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-[11px] rounded-xl uppercase tracking-widest transition-all duration-200 shadow-lg shadow-blue-500/15 border border-blue-500/20 active:scale-[0.98] flex items-center justify-center gap-2 group"
            >
              {editingId ? (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2.5}
                    stroke="currentColor"
                    className="w-3.5 h-3.5 transition-transform group-hover:rotate-180 duration-300"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99"
                    />
                  </svg>
                  Update Record
                </>
              ) : (
                <>
                  <span>Save Evidence</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}

      {/* REGISTRY LOG TABLE */}
      <section className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl overflow-hidden shadow-2xl print:hidden transition-all my-6">
        {/* Registry Section Header Grid */}
        <div className="p-6 bg-slate-950/60 border-b border-slate-800/60 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h3 className="text-xs font-black uppercase text-slate-200 tracking-wider flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              Active Intake Evidence Records Registry
            </h3>
            <p className="text-[11px] text-slate-500 font-medium">
              Live database index logs from local workstation cluster nodes
            </p>
          </div>
          <span className="text-[10px] bg-blue-950/30 border border-blue-900/40 text-blue-400 font-mono font-bold px-3 py-1.5 rounded-lg flex items-center gap-2 shadow-sm select-none">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
            System is Actively Synchronized
          </span>
        </div>

        {/* Responsive Overflow Horizontal Table Container */}
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-slate-950/40 text-slate-400 text-[10px] uppercase tracking-wider border-b border-slate-800 font-black font-mono select-none">
                <th className="p-5 text-center w-[150px]">Evidence ID</th>
                <th className="p-5 w-[280px]">
                  Investigating Station / Agency
                </th>
                <th className="p-5 w-[280px]">Case Identification / Offense</th>
                <th className="p-5 min-w-[250px]">Item Type & Description</th>
                <th className="p-5 text-center w-[80px]">Qty</th>
                <th className="p-5 text-center w-[160px]">Current Status</th>
                <th className="p-5 text-right w-[320px]">Available Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-xs text-slate-300">
              {currentItems.length === 0 ? (
                <tr>
                  <td
                    colSpan="7"
                    className="p-16 text-center text-slate-500 italic font-medium font-mono bg-slate-950/10 tracking-wide"
                  >
                    [Empty Context Node: No logged evidence records found in
                    this workstation cache. Click "Log New Evidence" to begin.]
                  </td>
                </tr>
              ) : (
                currentItems.map((item) => (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-900/30 group transition-all duration-150"
                  >
                    {/* Evidence ID Node */}
                    <td className="p-5 font-mono text-center text-slate-400 font-black tracking-tight group-hover:text-blue-400 transition-colors select-all">
                      {formatEvidenceId(item)}
                    </td>

                    {/* Station Row Entry */}
                    <td className="p-5 font-semibold text-slate-200 leading-relaxed pr-4">
                      {item.investigating_agency}
                    </td>

                    {/* Case Identification Core Metadata */}
                    <td className="p-5 space-y-1.5 pr-4">
                      <div className="font-mono font-bold text-blue-400 tracking-tight text-[12px]">
                        {item.case_number}
                      </div>
                      <div
                        className="text-[10px] text-slate-500 font-medium line-clamp-2 leading-normal"
                        title={item.case_title}
                      >
                        {item.case_title || "Unspecified Offense Record"}
                      </div>
                    </td>

                    {/* Item Type & Remarks Descriptions */}
                    <td className="p-5 space-y-2 pr-4">
                      <div className="text-slate-200 font-medium leading-relaxed">
                        {item.physical_description}
                      </div>
                      {item.condition_received && (
                        <div
                          className="text-[10px] text-slate-400 font-mono border-l-2 border-slate-800 pl-2.5 py-0.5 line-clamp-2 leading-normal"
                          title={item.condition_received}
                        >
                          <span className="text-slate-600 font-bold uppercase tracking-wider text-[9px] mr-1">
                            Remarks:
                          </span>
                          {item.condition_received}
                        </div>
                      )}
                    </td>

                    {/* Verified Quantitative Metrics */}
                    <td className="p-5 text-center font-mono font-black text-slate-100 bg-slate-950/10 text-sm">
                      {item.quantity}
                    </td>

                    {/* Pipeline Workflow Telemetry States Status Badges */}
                    <td className="p-5 text-center">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border font-mono select-none shadow-sm ${item.workflow_stage === "Turnover Pending"
                          ? "bg-purple-950/40 border-purple-900/60 text-purple-400 animate-pulse"
                          : item.workflow_stage === "In Storage"
                            ? "bg-blue-950/40 border-blue-900/60 text-blue-400"
                            : item.workflow_stage === "Released"
                              ? "bg-slate-800 border-slate-700 text-slate-500 line-through"
                              : "bg-amber-950/40 border-amber-900/60 text-amber-400"
                          }`}
                      >
                        {item.workflow_stage || "On Field"}
                      </span>
                    </td>

                    {/* Available Controls Actions Button Array */}
                    <td className="p-5 text-right">
                      <div className="flex flex-col sm:flex-row justify-end items-stretch sm:items-center gap-2 font-bold text-[11px]">
                        {(item.workflow_stage === "On Field" ||
                          !item.workflow_stage) && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedEvidenceItem(item);
                                setTurnoverRemarks("");
                                setIsSignatureModalOpen(true);
                              }}
                              className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-2 rounded-lg transition-all active:scale-[0.97]"
                            >
                              Turnover
                            </button>
                          )}

                        {(item.workflow_stage === "On Field" ||
                          !item.workflow_stage) && (
                            <button
                              type="button"
                              onClick={() => startEditMode(item)}
                              className="whitespace-nowrap bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 px-3 py-2 rounded-lg transition-all active:scale-[0.97] flex items-center justify-center"
                            >
                              Edit
                            </button>
                          )}

                        <button
                          type="button"
                          onClick={() => setActivePrintRow(item)}
                          className="whitespace-nowrap bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 px-3 py-2 rounded-lg transition-all active:scale-[0.97]"
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

        {safeEvidenceList.length > itemsPerPage && (
          <div className="px-6 py-4 bg-slate-950/60 border-t border-slate-800/60 flex flex-col sm:flex-row justify-between items-center gap-4 select-none print:hidden">
            <span className="text-[11px] text-slate-500 font-medium font-mono">
              Showing{" "}
              <span className="text-slate-300 font-bold">
                {indexOfFirstItem + 1}
              </span>{" "}
              to{" "}
              <span className="text-slate-300 font-bold">
                {Math.min(indexOfLastItem, safeEvidenceList.length)}
              </span>{" "}
              of{" "}
              <span className="text-blue-400 font-bold">
                {safeEvidenceList.length}
              </span>{" "}
              registered indices
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => paginate(currentPage - 1)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-all text-[11px] font-bold font-mono disabled:cursor-not-allowed"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="1em"
                  height="1em"
                  viewBox="0 0 24 24"
                >
                  <path d="M0 0h24v24H0z" fill="none" />
                  <g fill="none" stroke="currentColor" stroke-width="1.5">
                    <path
                      stroke-linejoin="round"
                      d="M8.065 12.626c.254 1.211 1.608 2.082 4.315 3.822c2.945 1.893 4.417 2.84 5.61 2.475c.403-.124.775-.34 1.088-.635C20 17.418 20 15.612 20 12s0-5.418-.922-6.288a2.8 2.8 0 0 0-1.088-.635c-1.193-.365-2.665.582-5.61 2.475c-2.707 1.74-4.06 2.61-4.315 3.822c-.087.412-.087.84 0 1.252Z"
                    />
                    <path stroke-linecap="round" d="M4 4v16" />
                  </g>
                </svg>
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (number) => (
                  <button
                    key={number}
                    type="button"
                    onClick={() => paginate(number)}
                    className={`px-3 py-1.5 h-8 min-w-8 rounded-lg font-mono font-black text-xs transition-all ${currentPage === number
                      ? "bg-blue-600 border border-blue-500 text-white shadow-lg shadow-blue-950/40"
                      : "border border-slate-800/60 bg-slate-900/20 text-slate-400 hover:text-slate-200 hover:bg-slate-800"
                      }`}
                  >
                    {number}
                  </button>
                ),
              )}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => paginate(currentPage + 1)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800 disabled:opacity-20 disabled:hover:bg-transparent disabled:hover:text-slate-400 transition-all text-[11px] font-bold font-mono disabled:cursor-not-allowed"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="1em"
                  height="1em"
                  viewBox="0 0 24 24"
                >
                  <path d="M0 0h24v24H0z" fill="none" />
                  <g fill="none" stroke="currentColor" stroke-width="1.5">
                    <path
                      stroke-linejoin="round"
                      d="M15.935 12.626c-.254 1.211-1.608 2.082-4.315 3.822c-2.945 1.893-4.417 2.84-5.61 2.475a2.8 2.8 0 0 1-1.088-.635C4 17.418 4 15.612 4 12s0-5.418.922-6.288a2.8 2.8 0 0 1 1.089-.635c1.192-.365 2.664.582 5.609 2.475c2.707 1.74 4.06 2.61 4.315 3.822c.087.412.087.84 0 1.252Z"
                    />
                    <path stroke-linecap="round" d="M20 5v14" />
                  </g>
                </svg>
              </button>
            </div>
          </div>
        )}
      </section>

      {/* {isTurnoverModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800/80 w-full max-w-md rounded-2xl p-6 space-y-5 shadow-2xl">

            <div className="border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold uppercase text-blue-400 tracking-wider flex items-center gap-2">
                Submit for Command Chain Verification
              </h3>
              <p className="text-[11px] text-slate-500 mt-1">
                Route this item to your Unit Leadership Matrix for certification and official oversight notation.
              </p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); setIsSignatureModalOpen(true); }} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1.5 tracking-wide">Turnover Execution Remarks</label>
                <textarea
                  required
                  placeholder="Describe physical packaging condition (e.g., Heat-sealed evidence bag lock #12345)..."
                  value={turnoverRemarks || ""}
                  onChange={(e) => setTurnoverRemarks?.(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-slate-700 h-24 resize-none"
                />
              </div>

              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                <span className="font-bold text-slate-400 uppercase text-[10px]">Your Signature Authorization:</span>
                {collectorSignature ? (
                  <span className="text-emerald-400 font-mono font-bold flex items-center gap-1.5">
                    ✓ Ink Applied Ready
                    <button type="button" onClick={() => setCollectorSignature(null)} className="text-red-400 hover:underline text-[9px] uppercase pl-1">Reset</button>
                  </span>
                ) : (
                  <span className="text-amber-400 font-mono font-bold animate-pulse"> Signature Required Next</span>
                )}
              </div>

              <div className="flex justify-end gap-2 text-xs uppercase font-bold pt-2 border-t border-slate-800/60">
                <button type="button" onClick={closeTurnoverModal} className="px-3 py-2 bg-slate-800 text-slate-300 rounded-lg transition-colors">Cancel</button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg transition-all shadow-md flex items-center gap-1"
                >
                  Proceed to Sign
                </button>
              </div>
            </form>

          </div>
        </div>
      )} */}

      {/* DRAGGABLE ACROBAT TURNOVER MODAL FRAMEWORK */}
      {isSignatureModalOpen && (
        <SignaturePadModal
          isOpen={isSignatureModalOpen}
          onClose={() => {
            setIsSignatureModalOpen(false);
            setIsInitialCreation(false); // Reset the flow flag on close
            closeTurnoverModal();
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
          onSave={async (signatureData) => {
            if (isInitialCreation) {
              // PATHWAY A: Initial Item Creation with Signature Sign-off
              setLoading(true);
              try {
                // const url = "http://localhost:8081/intake_triage.php";
                const url = "https://steadier-headscarf-maggot.ngrok-free.dev/intake_triage.php";
                const response = await axios.post(url, {
                  investigating_agency: investigatingAgency,
                  case_number: caseNumber,
                  case_title: caseTitle,
                  suspect_names: suspectNames,
                  witness_names: witnessNames,
                  evidence_type: evidenceType,
                  physical_description: physicalDescription,
                  quantity: parseInt(quantity),
                  condition_received: conditionReceived,
                  collector_name: currentUser.fullName,
                  certified_by: certifiedBy,
                  noted_by: notedBy,
                  date_collected: dateCollected,
                  collection_place: collectionPlace,
                  retrieval_address: retrievalAddress,
                  workflow_stage: "On Field",
                  turned_over_by_name: currentUser.fullName,

                  // INJECT GENERATED SIGNATURE INTO THE CREATION RECORD PAYLOAD:
                  collector_signature_hash: signatureData,
                });

                if (response.data?.status === "success") {
                  setToast({
                    isVisible: true,
                    message: "New signed evidence record successfully added.",
                  });
                  setMessage("");
                  setTimeout(() => {
                    setToast({ isVisible: false, message: "" });
                  }, 4000);
                  clearFormState();
                  setIsSignatureModalOpen(false);
                  setIsInitialCreation(false);
                  fetchEvidence();
                }
              } catch (err) {
                console.error(err);
                setMessageType("error");
                setMessage("Failed to submit and sign the new record.");
              } finally {
                setLoading(false);
              }
            } else {
              // PATHWAY B: Regular Transfer/Turnover handover (Triggers your existing workflow handler)
              executeInitiateTurnover(signatureData);
              setIsSignatureModalOpen(false);
            }
          }}
        />
      )}

      {/* ARCHIVE DESTROY MODAL */}
      {isArchiveModalOpen && (
        <ArchiveEvidenceModal
          isOpen={isArchiveModalOpen}
          onClose={() => setIsArchiveModalOpen(false)}
          onConfirm={(reason) =>
            handleExecuteArchive(selectedEvidenceItem?.id, reason)
          }
          evidenceId={
            selectedEvidenceItem ? formatEvidenceId(selectedEvidenceItem) : ""
          }
          isSubmitting={isArchivingSubmitting}
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
      /* 1. Reset root elements to allow multi-page flow */
      html, body {
        background-color: #ffffff !important;
        color: #000000 !important;
        margin: 0 !important;
        padding: 0 !important;
        visibility: hidden !important;
        height: auto !important;
        overflow: visible !important;
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }

      /* 2. Show printable container elements */
      .print-portal-container,
      .print-portal-container * {
        visibility: visible !important;
      }
      
      /* 3. Use static/relative positioning so pagination is respected */
      .print-portal-wrapper {
        position: static !important;
        background: white !important;
        padding: 0 !important;
        overflow: visible !important;
      }

      .print-portal-container {
        position: relative !important;
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
        display: block !important;
        overflow: visible !important;
      }

      /* 4. Page break controls */
      .print-page-break {
        page-break-after: always !important;
        break-after: page !important;
        height: auto !important;
        min-h-[297mm] !important;
      }

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
        size: A4 portrait;
      }
      
      .print\\:hidden { 
        display: none !important; 
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

      <NotificationModal
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
        duration={5000}
      />

      <WitnessSignatureModal
        isOpen={isWitnessModalOpen}
        onClose={() => setIsWitnessModalOpen(false)}
        onSave={({ witnessName, signatureUrl }) => {
          setWitnesses((prev) => [...prev, { witnessName, signatureUrl }]);
          triggerToast(`Witness ${witnesses.length + 1} signature attached.`, "success");
        }}
      />

      <EvidentiaFooter />
    </div>
  );
}
