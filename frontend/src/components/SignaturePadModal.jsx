// eslint-disable-next-line no-unused-vars
import React, { useRef, useState, useEffect } from "react";
import { NotificationModal } from "./NotificationModal";

export default function SignaturePadModal({
  isOpen,
  onClose,
  onSave,
  currentUser,
  evidenceItem,
  turnoverRemarks,
  setTurnoverRemarks,
  stationPersonnel = [],
  handshakeTargetCustodian,
  setHandshakeTargetCustodian,
  handshakeTargetSupervisor,
  setHandshakeTargetSupervisor,
}) {
  const [activeTab, setActiveTab] = useState("draw"); // "draw" | "upload"
  const [isAgreed, setIsAgreed] = useState(false);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [baseSignatureUrl, setBaseSignatureUrl] = useState(null);

  // Array to manage multiple duplicated signatures on the form template layout
  const [signatures, setSignatures] = useState([]);
  const [activeDragId, setActiveDragId] = useState(null);
  const dragStartRef = useRef({ x: 0, y: 0 });
  const containerRef = useRef(null);

  const [toast, setToast] = useState({
    isVisible: false,
    message: "",
    type: "success"
  });

  // Initialize canvas drawing dimensions
  useEffect(() => {
    if (isOpen && activeTab === "draw" && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;

      ctx.strokeStyle = "#1e3a8a"; // Deep secure blue ink stamp
      ctx.lineWidth = 2.5;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
    }
  }, [isOpen, activeTab]);

  if (!isOpen || !evidenceItem) return null;

  // Safe formatting utility for record referencing IDs
  const formatEvidenceId = (item) => {
    if (item?.evidence_id) return item.evidence_id;
    return `EV-2026-${String(item?.id || 0).padStart(4, "0")}`;
  };

  // --- SIGNATURE CANVAS DRAWING TRACKERS ---
  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const rect = canvas.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    e.preventDefault();
  };

  const syncSignatureToDoc = () => {
    if (activeTab === "draw" && canvasRef.current) {
      const url = canvasRef.current.toDataURL("image/png");
      setBaseSignatureUrl(url);
      setSignatures([
        { id: Date.now(), url, position: { x: 280, y: 940 }, scale: 1.5 },
      ]);
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setBaseSignatureUrl(null);
    setSignatures([]);
  };

  // --- IMAGE FILE INPUT CONVERSION ---
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const tempCanvas = document.createElement("canvas");
        const tempCtx = tempCanvas.getContext("2d");
        tempCanvas.width = img.width;
        tempCanvas.height = img.height;
        tempCtx.drawImage(img, 0, 0);

        const imgData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imgData.data;

        for (let i = 0; i < data.length; i += 4) {
          if (data[i] > 220 && data[i + 1] > 220 && data[i + 2] > 220) {
            data[i + 3] = 0;
          }
        }
        tempCtx.putImageData(imgData, 0, 0);
        const url = tempCanvas.toDataURL();
        setUploadedImage(url);
        setBaseSignatureUrl(url);
        setSignatures([
          { id: Date.now(), url, position: { x: 580, y: 340 }, scale: 0.9 },
        ]);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  // --- INTERACTION HANDLING (DRAG, DROP & SCALE ENGINE) ---
  const handleDragStart = (e, id, currentPos) => {
    if (e.target.closest(".signature-control-btn")) return;

    setActiveDragId(id);
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    dragStartRef.current = {
      x: clientX - currentPos.x,
      y: clientY - currentPos.y,
    };
  };

  const handleDragMove = (e) => {
    if (!activeDragId) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    let newX = clientX - dragStartRef.current.x;
    let newY = clientY - dragStartRef.current.y;

    if (containerRef.current) {
      const boundary = containerRef.current.getBoundingClientRect();
      const currentSig = signatures.find((s) => s.id === activeDragId);
      const width = 144 * (currentSig?.scale || 1.0);
      const height = 56 * (currentSig?.scale || 1.0);

      newX = Math.max(0, Math.min(newX, boundary.width - width));
      newY = Math.max(0, Math.min(newY, boundary.height - height));
    }

    setSignatures((prev) =>
      prev.map((sig) =>
        sig.id === activeDragId
          ? { ...sig, position: { x: newX, y: newY } }
          : sig,
      ),
    );
  };

  const handleDragEnd = () => setActiveDragId(null);

  const duplicateSignature = (e, targetSig) => {
    e.stopPropagation();
    const newSignatureInstance = {
      id: Date.now() + Math.random(),
      url: targetSig.url,
      position: {
        x: Math.min(targetSig.position.x + 25, 620),
        y: Math.min(targetSig.position.y + 35, 1800),
      },
      scale: targetSig.scale,
    };
    setSignatures((prev) => [...prev, newSignatureInstance]);
  };

  const deleteSignatureInstance = (e, id) => {
    e.stopPropagation();
    setSignatures((prev) => prev.filter((sig) => sig.id !== id));
  };

  const adjustScale = (id, factor) => {
    setSignatures((prev) =>
      prev.map((sig) =>
        sig.id === id
          ? { ...sig, scale: Math.max(0.4, Math.min(2.5, sig.scale + factor)) }
          : sig,
      ),
    );
  };

  const handleApplySignature = () => {
    if (
      !isAgreed ||
      !turnoverRemarks.trim() ||
      signatures.length === 0 ||
      !handshakeTargetCustodian ||
      !handshakeTargetSupervisor
    ) {
      setToast({
        isVisible: true,
        message: "Validation Error: Complete all cryptographic handshake requirements.",
        type: "error",
      });
      return;
    }

    onSave(baseSignatureUrl);

    setToast({
      isVisible: true,
      message: "Secure Chain of Custody signature recorded successfully. Appending ledger blocks...",
      type: "success",
    });

    setTimeout(() => {
      handleCloseReset();
    }, 300);
  };

  const handleCloseReset = () => {
    setUploadedImage(null);
    setBaseSignatureUrl(null);
    setSignatures([]);
    setIsAgreed(false);
    setActiveTab("draw");
    if (typeof onClose === "function") {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-[90vw] h-[92vh] rounded-2xl flex flex-col overflow-hidden shadow-2xl text-slate-300">
        {/* Modal Window Top Header Bar */}
        <div className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex justify-between items-center shrink-0">
          <div>
            <h3 className="text-sm font-black uppercase text-blue-400 tracking-wider">
              Chain of Custody Document Workshop
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Reviewing Registry Target:{" "}
              <span className="text-white font-mono font-bold">
                {formatEvidenceId(evidenceItem)}
              </span>
            </p>
          </div>
          <button
            onClick={handleCloseReset}
            className="text-slate-500 hover:text-slate-300 transition-colors font-mono text-sm"
          >
            ✕
          </button>
        </div>

        {/* Workspace Splitting Layout */}
        <div className="flex-1 flex overflow-hidden min-h-0">
          {/* LEFT INTERACTIVE WINDOW: Replicated Official Form Layout */}
          <div className="w-2/3 bg-slate-950 p-6 overflow-y-auto border-r border-slate-800/60 custom-scrollbar flex justify-center items-start">
            <div
              ref={containerRef}
              onMouseMove={handleDragMove}
              onTouchMove={handleDragMove}
              onMouseUp={handleDragEnd}
              onTouchEnd={handleDragEnd}
              className="bg-white text-black w-[794px] min-h-[2246px] shadow-2xl relative font-sans text-xs p-8 space-y-0 select-none border border-slate-300 rounded-sm overflow-hidden shrink-0"
              style={{ minHeight: "2246px" }}
            >
              {/* SHEET 1: PROPERTY EVIDENCE LOG LAYOUT */}
              <div className="pb-16 min-h-[1123px] relative flex flex-col justify-between">
                <div>
                  <div className="text-[11px] font-normal font-sans leading-tight text-black">
                    <p>CSI Form "4"</p>
                    <p>SOCO REPORT FORM "2"</p>
                  </div>

                  <div className="flex justify-between items-center mt-2 pb-2 border-b border-black text-black">
                    <div className="w-24 h-24 shrink-0 flex items-center justify-center p-0">
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
                        {evidenceItem.investigating_agency ||
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

                    <div className="w-24 h-24 shrink-0 flex items-center justify-center p-0">
                      <img
                        src="/logo/ub_seal.png"
                        alt="Station Badge Emblem"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end mt-6">
                    <div className="text-center w-52">
                      <div className="border-b border-black text-xs px-2 py-0.5 min-h-[1.5rem] text-black">
                        {evidenceItem.created_at
                          ? new Date(
                            evidenceItem.created_at,
                          ).toLocaleDateString(undefined, {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                          : ""}
                      </div>
                      <p className="text-xs mt-1 text-black">Date</p>
                    </div>
                  </div>

                  <div className="mt-4 text-xs font-bold flex items-center text-black">
                    <span>RE SOCO REPORT NR:</span>
                    <span className="border-b border-black ml-1 flex-1 max-w-xs px-2 font-mono text-sm tracking-wider">
                      {evidenceItem.case_number}
                    </span>
                  </div>

                  <h2 className="text-center text-sm font-bold tracking-wider uppercase my-6 text-black">
                    EVIDENCE LOG
                  </h2>

                  <table className="w-full border-collapse border border-black text-center text-xs text-black">
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
                        <th className="p-1 leading-tight">
                          SIGNATURE OF SEARCHER
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black font-sans">
                      <tr className="divide-x divide-black align-top h-20 text-[11px]">
                        <td className="p-2 font-bold">
                          {evidenceItem.quantity}
                        </td>
                        <td className="p-2 text-left leading-normal">
                          <span className="font-bold text-[10px] block text-gray-600">
                            [{evidenceItem.evidence_type}]
                          </span>
                          {evidenceItem.physical_description ||
                            evidenceItem.unit_descriptor}
                        </td>
                        <td className="p-2">
                          {evidenceItem.collector_name ||
                            currentUser?.fullName ||
                            ""}
                        </td>
                        <td className="p-2 whitespace-normal leading-tight font-mono">
                          {evidenceItem.created_at
                            ? new Date(evidenceItem.created_at).toLocaleString([], {
                              dateStyle: "short",
                              timeStyle: "short",
                            })
                            : ""}
                        </td>
                        <td className="p-2 text-left leading-tight">
                          {evidenceItem.collection_place && (
                            <div>{evidenceItem.collection_place}</div>
                          )}
                          {evidenceItem.retrieval_address && (
                            <div className="text-[10px] text-gray-600 mt-0.5">
                              {evidenceItem.retrieval_address}
                            </div>
                          )}
                        </td>
                        <td className="p-2 text-left italic text-gray-700">
                          {evidenceItem.condition_received || ""}
                        </td>
                        <td className="p-2 text-left align-middle relative pt-8">
                          {evidenceItem?.collector_signature_hash ? (
                            <img
                              src={evidenceItem.collector_signature_hash}
                              alt="Collector Signature"
                              className="mx-auto max-h-6 max-w-full object-contain"
                            />
                          ) : (
                            <span className="italic text-gray-400 font-mono text-[9px]">
                              (Place signature stamp here)
                            </span>
                          )}
                        </td>
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

                <div className="grid grid-cols-3 gap-6 pt-12 text-xs text-center font-normal text-black">
                  <div className="space-y-1">
                    <p className="text-left pl-4 text-gray-500">Prepared by:</p>
                    <div className="relative flex flex-col items-center justify-end group">
                      <div className="w-full h-10 flex items-center justify-center mb-0.5 relative z-10">
                        {evidenceItem?.collector_signature_hash ? (
                          <img
                            src={evidenceItem.collector_signature_hash}
                            alt="Collector Signature"
                            className="absolute max-h-12 object-contain"
                          />
                        ) : (
                          <div className="text-gray-400 italic text-[9px]">
                            [Place signature here]
                          </div>
                        )}
                      </div>
                      <div className="border-b border-black px-4 font-bold uppercase min-h-[1.25rem] w-full text-center text-[11px] relative z-20 bg-transparent">
                        {evidenceItem?.turned_over_by_name ||
                          evidenceItem?.collector_name ||
                          "Seizing Officer"}
                      </div>
                      <p className="text-[10px] mt-0.5 text-gray-600 font-medium tracking-wide">
                        Evidence Collector
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-left pl-4 text-gray-500">
                      Certified by:
                    </p>
                    <div className="relative flex flex-col items-center justify-end group">
                      <div className="w-full h-10 flex items-center justify-center mb-0.5 relative z-10">
                        {evidenceItem?.custodian_signature_hash ? (
                          <img
                            src={evidenceItem.custodian_signature_hash}
                            alt="Custodian Signature"
                            className="absolute max-h-12 object-contain"
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
                            {handshakeTargetCustodian || "AWAITING SELECTION"}
                          </span>
                        </div>
                      </div>
                      <p className="text-[11px] mt-1 text-gray-900">
                        SOCO Team Leader
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <p className="text-left pl-4 text-gray-500">Noted by:</p>
                    <div className="relative flex flex-col items-center justify-end group">
                      <div className="w-full h-10 flex items-center justify-center mb-0.5 relative z-10">
                        {evidenceItem?.supervisor_signature_hash ? (
                          <img
                            src={evidenceItem.supervisor_signature_hash}
                            alt="Supervisor Signature"
                            className="absolute max-h-12 object-contain"
                          />
                        ) : (
                          <div className="text-gray-400 italic text-[9px]">
                            [Place signature here]
                          </div>
                        )}
                      </div>
                      <div className="border-b border-black w-11/12 mx-auto font-medium uppercase min-h-[1.25rem]">
                        <span className="font-bold text-black uppercase underline">
                          {handshakeTargetSupervisor || "AWAITING SELECTION"}
                        </span>
                      </div>
                      <p className="text-[11px] mt-1 text-gray-900">
                        Chief of Office
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* SHEET 2: CHAIN OF CUSTODY FORM LAYOUT */}
              <div className="pt-12 min-h-[1123px] relative flex flex-col justify-between border-t-2 border-dashed border-gray-300">
                <div>
                  <div className="text-center space-y-0.5 text-black">
                    <p className="text-xs">Republic of the Philippines</p>
                    <p className="text-xs">National Police Commission</p>
                    <p className="text-sm font-bold tracking-wide">
                      PHILIPPINE NATIONAL POLICE
                    </p>
                    <p className="text-xs font-medium uppercase">
                      {evidenceItem.investigating_agency ||
                        "Baguio City Police Office"}
                    </p>
                    <p className="text-xs font-medium">Station 5</p>
                    <p className="text-[11px] text-gray-700 italic">
                      Marcos Highway, Legarda Road, Baguio City
                    </p>
                  </div>

                  <h2 className="text-center text-sm font-bold tracking-wider uppercase my-8 text-black">
                    CHAIN OF CUSTODY FORM
                  </h2>

                  <div className="space-y-3 text-xs font-sans text-black">
                    <div className="flex items-end">
                      <span className="whitespace-nowrap pr-1">
                        Nature of Case:
                      </span>
                      <div className="flex-1 border-b border-black font-medium px-2 pb-0.5 uppercase">
                        {evidenceItem.case_title || "N/A"}
                      </div>
                    </div>

                    <div className="flex items-end">
                      <span className="whitespace-nowrap pr-1">
                        Name of Suspects:
                      </span>
                      <div className="flex-1 border-b border-black font-medium px-2 pb-0.5 min-h-[1.25rem]">
                        {evidenceItem.suspect_names || ""}
                      </div>
                    </div>

                    <div className="space-y-1 pt-1">
                      <span className="font-bold text-gray-700 block text-[11px] uppercase tracking-wider">
                        Witness Manifest & Verification:
                      </span>
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs">
                        {(() => {
                          const witnessList = evidenceItem.witness_names
                            ? evidenceItem.witness_names.split(',').map(name => name.trim()).filter(Boolean)
                            : [];
                          const structuredWitnesses = Array.isArray(evidenceItem.witnesses)
                            ? evidenceItem.witnesses
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
                                    {w.name || w.witnessName || w}
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
                                  {evidenceItem.witness_names || "(No Witness Registered)"}
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
                        {evidenceItem.created_at
                          ? `${new Date(evidenceItem.created_at).toLocaleString()} `
                          : ""}
                        {evidenceItem.collection_place ||
                          evidenceItem.retrieval_address
                          ? `at ${evidenceItem.collection_place || ""} ${evidenceItem.retrieval_address ? `(${evidenceItem.retrieval_address})` : ""}`
                          : ""}
                      </div>
                    </div>

                    <div className="flex items-end">
                      <span className="whitespace-nowrap pr-1">
                        Operating Unit:
                      </span>
                      <div className="flex-1 border-b border-black font-medium px-2 pb-0.5 uppercase">
                        {evidenceItem.investigating_agency}
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      <div className="flex items-end">
                        <span className="whitespace-nowrap pr-1">
                          Description of Evidence:
                        </span>
                        <div className="flex-1 border-b border-black font-bold px-2 pb-0.5 text-xs">
                          ({evidenceItem.quantity}x){" "}
                          {evidenceItem.physical_description ||
                            evidenceItem.unit_descriptor}
                        </div>
                      </div>
                      <div className="border-b border-black w-full min-h-[1.25rem] font-mono text-[11px] text-gray-500 pl-2">
                        Classification Category Status:{" "}
                        {evidenceItem.evidence_type}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 space-y-6 font-sans text-xs text-black">
                    {/* CUSTODY BLOCK 1 */}
                    <div className="space-y-4">
                      <div className="grid grid-cols-12 gap-1 items-start">
                        <div className="col-span-4 font-normal pt-1 uppercase text-[10px] text-gray-600 font-bold">
                          TURNED OVER BY
                        </div>
                        <div className="col-span-8 space-y-3">
                          <div className="text-center">
                            <div className="border-b border-black px-4 font-medium uppercase min-h-[1.25rem]">
                              {evidenceItem.turned_over_by_name ||
                                evidenceItem.collector_name ||
                                currentUser?.fullName}
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
                              {evidenceItem.turned_over_by_agency ||
                                evidenceItem.investigating_agency}
                            </div>
                          </div>
                          <div className="grid grid-cols-12 gap-1 items-end">
                            <span className="col-span-3 text-left text-gray-500">
                              Time and Date
                            </span>
                            <div className="col-span-9 border-b border-black px-2 min-h-[1.25rem] font-mono">
                              {evidenceItem.created_at
                                ? new Date(evidenceItem.created_at).toLocaleString('en-US', {
                                  dateStyle: 'medium',
                                  timeStyle: 'medium'
                                })
                                : ""}
                            </div>
                          </div>
                          <div className="grid grid-cols-12 gap-1 items-end">
                            <span className="col-span-3 text-left text-gray-500">
                              Remarks
                            </span>
                            <div className="col-span-9 border-b border-black px-2 italic text-gray-600 min-h-[1.25rem]">
                              Initial Processing Handover /{" "}
                              {evidenceItem.condition_received}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-12 gap-2 items-start pt-2 border-t border-dashed border-gray-200">
                        <div className="col-span-4 font-normal pt-1 uppercase text-[10px] text-blue-900 font-bold">
                          RECEIVED BY (LIVE HANDSHAKE Target)
                        </div>
                        <div className="col-span-8 space-y-3">
                          <div className="text-center">
                            <div className="border-b border-black px-4 font-bold text-blue-900 uppercase min-h-[1.25rem]">
                              {handshakeTargetCustodian ||
                                "______________________________________"}
                            </div>
                            <span className="text-[10px] text-gray-500 block mt-0.5">
                              (Name and Designation of Custodian Recipient)
                            </span>
                          </div>
                          <div className="grid grid-cols-12 gap-1 items-end">
                            <span className="col-span-3 text-left text-gray-500">
                              Agency/Address
                            </span>
                            <div className="col-span-9 border-b border-black px-2 min-h-[1.25rem] uppercase">
                              {evidenceItem.received_by_agency ||
                                "CRIME LABORATORY EVIDENCE VAULT DIVISION"}
                            </div>
                          </div>
                          <div className="grid grid-cols-12 gap-1 items-end">
                            <span className="col-span-3 text-left text-gray-500">
                              Time and Date
                            </span>
                            <div className="col-span-9 border-b border-black px-2 min-h-[1.25rem] font-mono">
                              {evidenceItem.created_at
                                ? new Date(
                                  evidenceItem.created_at,
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
                              {evidenceItem.storage_vault || "Vault Room"} [
                              {evidenceItem.workflow_stage ||
                                "Turnover Pending"}
                              ]
                            </div>
                          </div>
                          <div className="p-2 bg-slate-50 border border-slate-200 rounded text-[11px] leading-tight mt-1">
                            <span className="font-bold text-gray-500 uppercase text-[9px] block">
                              Live Custom Handshake Comments:
                            </span>
                            <span className="italic underline font-mono text-slate-800">
                              {turnoverRemarks.trim() ||
                                "No customized comments appended."}
                            </span>
                          </div>
                          <div className="text-[10px] text-gray-500">
                            Authorization Supervisor / Witness:{" "}
                            <span className="font-bold text-black uppercase underline">
                              {handshakeTargetSupervisor ||
                                "AWAITING SELECTION"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-black my-4"></div>

                    {/* CUSTODY BLOCK 2 */}
                    <div className="space-y-4 opacity-40 select-none">
                      <div className="grid grid-cols-12 gap-2 items-start">
                        <div className="col-span-4 font-normal pt-1">
                          TURNED OVER BY
                        </div>
                        <div className="col-span-8 space-y-2">
                          <div className="border-b border-gray-300 min-h-[1.25rem]"></div>
                          <div className="border-b border-gray-300 min-h-[1.25rem]"></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-12 gap-2 items-start pt-2">
                        <div className="col-span-4 font-normal pt-1">
                          RECEIVED BY
                        </div>
                        <div className="col-span-8 space-y-2">
                          <div className="border-b border-gray-300 min-h-[1.25rem]"></div>
                          <div className="border-b border-gray-300 min-h-[1.25rem]"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="text-right text-[9px] text-gray-400 font-mono pt-4 border-t border-gray-100">
                  Record ID Trace Reference:{" "}
                  {evidenceItem.id
                    ? `EV-2026-${String(evidenceItem.id).padStart(4, "0")}`
                    : "UNINITIALIZED"}
                </div>
              </div>

              {/* MULTI-SIGNATURE STAMP OVERLAYS */}
              {signatures.map((sig) => (
                <div
                  key={sig.id}
                  onMouseDown={(e) => handleDragStart(e, sig.id, sig.position)}
                  onTouchStart={(e) => handleDragStart(e, sig.id, sig.position)}
                  style={{
                    position: "absolute",
                    left: `${sig.position.x}px`,
                    top: `${sig.position.y}px`,
                    transform: `scale(${sig.scale})`,
                    transformOrigin: "top left",
                  }}
                  className={`absolute h-14 w-36 select-none border border-dashed ${activeDragId === sig.id
                    ? "border-blue-500 cursor-grabbing bg-blue-50/10"
                    : "border-emerald-500 cursor-grab bg-transparent"
                    } flex flex-col items-center justify-center p-0.5 group z-50`}
                >
                  <img
                    src={sig.url}
                    alt="E-Signature Ink"
                    className="max-w-full max-h-full object-contain pointer-events-none filter drop-shadow-sm"
                  />

                  <div className="absolute -top-6 right-0 bg-slate-950 text-white rounded px-1 text-[11px] opacity-0 group-hover:opacity-100 transition-opacity font-sans flex items-center gap-1 shadow-md pointer-events-auto z-[60]">
                    <button
                      type="button"
                      onClick={() => adjustScale(sig.id, -0.1)}
                      className="signature-control-btn font-bold px-1 text-red-400 hover:bg-slate-800 rounded"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="1em"
                        height="1em"
                        viewBox="0 0 24 24"
                      >
                        <path d="M0 0h24v24H0z" fill="none" />
                        <path
                          fill="currentColor"
                          d="M16 17.75a.75.75 0 0 0 1.5 0v-9a.75.75 0 0 0-1.5 0zM9.22 2.72a.75.75 0 0 0-.073.976l.073.084l2 2a.75.75 0 0 0 .976.073l.084-.073l2-2a.75.75 0 0 0-.976-1.133l-.084.073l-1.47 1.47l-1.47-1.47a.75.75 0 0 0-1.06 0M11 20.75a.75.75 0 0 0 1.5 0v-12a.75.75 0 0 0-1.5 0zm-5-3a.75.75 0 0 0 1.5 0v-9a.75.75 0 0 0-1.5 0z"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustScale(sig.id, 0.1)}
                      className="signature-control-btn font-bold px-1 text-green-400 hover:bg-slate-800 rounded"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="1em"
                        height="1em"
                        viewBox="0 0 24 24"
                      >
                        <path d="M0 0h24v24H0z" fill="none" />
                        <path
                          fill="currentColor"
                          d="M16 6.25a.75.75 0 0 1 1.5 0v9a.75.75 0 0 1-1.5 0zM9.22 21.28a.75.75 0 0 1-.073-.976l.073-.084l2-2a.75.75 0 0 1 .976-.073l.084.073l2 2a.75.75 0 0 1-.976 1.133l-.084-.073l-1.47-1.47l-1.47 1.47a.75.75 0 0 1-1.06 0M11 3.25a.75.75 0 0 1 1.5 0v12a.75.75 0 0 1-1.5 0zm-5 3a.75.75 0 0 1 1.5 0v9a.75.75 0 0 1-1.5 0z"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => duplicateSignature(e, sig)}
                      className="signature-control-btn px-1 text-blue-400 hover:bg-slate-800 rounded font-bold font-mono"
                      title="Duplicate/Copy Stamp"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="1em"
                        height="1em"
                        viewBox="0 0 24 24"
                      >
                        <path d="M0 0h24v24H0z" fill="none" />
                        <path
                          fill="none"
                          stroke="currentColor"
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="M6 15.5H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h9.5a1 1 0 0 1 1 1v1m-6 14H19a1 1 0 0 0 1-1V9.5a1 1 0 0 0-1-1H9.5a1 1 0 0 0-1 1V19a1 1 0 0 0 1 1"
                        />
                      </svg>
                    </button>
                    {signatures.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => deleteSignatureInstance(e, sig.id)}
                        className="signature-control-btn px-1 text-rose-500 hover:bg-slate-800 rounded font-bold"
                        title="Remove Copy"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <span className="text-[6px] leading-none bg-blue-600 text-white font-mono uppercase px-1 py-0.5 rounded font-bold tracking-wider pointer-events-none mt-auto">
                    {activeDragId === sig.id
                      ? "Moving..."
                      : `🎯 Scale: ${Math.round(sig.scale * 100)}%`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* RIGHT CONTROL COLUMN: Configuration Panel */}
          <div className="w-1/3 bg-slate-900 p-5 flex flex-col justify-between overflow-y-auto border-l border-slate-950">
            <div className="space-y-4">
              <div className="space-y-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80 backdrop-blur-sm shadow-xl">
                <div className="flex items-center gap-2 pb-1 border-b border-slate-800/50">
                  <span className="w-1 h-3.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></span>
                  <span className="text-[10px] font-black uppercase text-blue-400 tracking-wider block">
                    1. Chain Matrix Target
                  </span>
                </div>

                <div className="space-y-1.5 relative group">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide transition-colors group-focus-within:text-blue-400">
                    Receiving Custodian Officer
                  </label>
                  <div className="relative">
                    <select
                      value={handshakeTargetCustodian}
                      onChange={(e) =>
                        setHandshakeTargetCustodian(e.target.value)
                      }
                      className="w-full bg-slate-900/90 border border-slate-800 rounded-lg pl-3 pr-10 py-2 text-xs text-slate-200 focus:text-white focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10 focus:outline-none appearance-none cursor-pointer transition-all duration-200 shadow-inner hover:border-slate-700"
                    >
                      <option value="" className="bg-slate-900 text-slate-500">
                        Select Custodian Target
                      </option>
                      {stationPersonnel.map((p, i) => (
                        <option
                          key={i}
                          value={`${p.agency_rank_title || ""} ${p.first_name} ${p.last_name}`.trim()}
                          className="bg-slate-900 text-slate-200 py-2"
                        >
                          {p.agency_rank_title
                            ? `[${p.agency_rank_title}] `
                            : ""}
                          {p.first_name} {p.last_name}
                        </option>
                      ))}
                    </select>
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

                <div className="space-y-1.5 relative group">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide transition-colors group-focus-within:text-blue-400">
                    Oversight Station Supervisor
                  </label>
                  <div className="relative">
                    <select
                      value={handshakeTargetSupervisor}
                      onChange={(e) =>
                        setHandshakeTargetSupervisor(e.target.value)
                      }
                      className="w-full bg-slate-900/90 border border-slate-800 rounded-lg pl-3 pr-10 py-2 text-xs text-slate-200 focus:text-white focus:border-blue-500/60 focus:ring-2 focus:ring-blue-500/10 focus:outline-none appearance-none cursor-pointer transition-all duration-200 shadow-inner hover:border-slate-700"
                    >
                      <option value="" className="bg-slate-900 text-slate-500">
                        Select Supervisor
                      </option>
                      {stationPersonnel.map((p, i) => (
                        <option
                          key={i}
                          value={`${p.agency_rank_title || ""} ${p.first_name} ${p.last_name}`.trim()}
                          className="bg-slate-900 text-slate-200 py-2"
                        >
                          {p.agency_rank_title
                            ? `[${p.agency_rank_title}] `
                            : ""}
                          {p.first_name} {p.last_name}
                        </option>
                      ))}
                    </select>
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
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-400 uppercase">
                  2. Handshake Turnover Remarks *
                </label>
                <textarea
                  rows="2"
                  value={turnoverRemarks}
                  onChange={(e) => setTurnoverRemarks(e.target.value)}
                  placeholder="Specify verification remarks, transfer properties, or condition states..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-blue-500/50 focus:outline-none resize-none placeholder:text-slate-600 font-mono"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    3. Autograph Signature Ink Pad
                  </label>
                  <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px] font-bold uppercase">
                    <button
                      type="button"
                      onClick={() => setActiveTab("draw")}
                      className={`px-2 py-1 rounded-md transition-all ${activeTab === "draw" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
                    >
                      Draw
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab("upload")}
                      className={`px-2 py-1 rounded-md transition-all ${activeTab === "upload" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
                    >
                      Upload Signature
                    </button>
                  </div>
                </div>

                {activeTab === "draw" ? (
                  <div className="space-y-2">
                    <div className="relative w-full h-24 bg-white rounded-xl overflow-hidden border border-slate-800 cursor-crosshair">
                      <canvas
                        ref={canvasRef}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={() => {
                          setIsDrawing(false);
                          syncSignatureToDoc();
                        }}
                        onMouseLeave={() => {
                          setIsDrawing(false);
                        }}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={() => {
                          setIsDrawing(false);
                          syncSignatureToDoc();
                        }}
                        className="w-full h-full touch-none"
                      />
                    </div>
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={clearCanvas}
                        className="text-[9px] bg-slate-950 text-slate-400 hover:text-white px-2 py-0.5 rounded font-mono font-bold uppercase"
                      >
                        Clear Pad
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="w-full h-24 bg-slate-950 border border-slate-800 rounded-xl flex flex-col items-center justify-center p-4 relative">
                      {uploadedImage ? (
                        <img
                          src={uploadedImage}
                          alt="Uploaded preset silhouette"
                          className="max-h-full max-w-full object-contain filter invert opacity-85"
                        />
                      ) : (
                        <div className="text-center space-y-0.5">
                          <p className="text-[10px] text-slate-500">
                            No signature file loaded yet.
                          </p>
                          <p className="text-[8px] text-slate-600">
                            Supports transparency backgrounds
                          </p>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="bg-blue-950/40 border border-blue-900/40 text-blue-300 rounded-xl p-2.5 text-[9px] leading-snug">
                💡 <span className="font-bold">Multi-Signing Action:</span> Drag
                signature overlays to position them. Hover over any signature
                stamp on the white preview sheet and click{" "}
                <span className="font-mono text-white bg-slate-800 px-1 rounded font-bold">
                  👥 Copy
                </span>{" "}
                to duplicate it across form page zones.
              </div>

              <div className="flex gap-2 items-start bg-slate-950/40 border border-slate-800/50 p-2.5 rounded-xl">
                <input
                  type="checkbox"
                  id="legal-esign-agreement"
                  checked={isAgreed}
                  onChange={(e) => setIsAgreed(e.target.checked)}
                  className="mt-0.5 h-3.5 w-3.5 accent-blue-500 cursor-pointer rounded shrink-0"
                />
                <label
                  htmlFor="legal-esign-agreement"
                  className="text-[9px] font-medium text-slate-400 leading-tight cursor-pointer"
                >
                  I certify that placing this image placeholder onto the form
                  layout constitutes a legally binding signature under digital
                  asset regulations.
                </label>
              </div>
            </div>

            <div className="flex gap-2 text-xs uppercase font-bold pt-3 border-t border-slate-800 mt-2 shrink-0">
              <button
                type="button"
                onClick={handleCloseReset}
                className="w-1/3 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 transition-colors text-center"
              >
                Cancel
              </button>

              <button
                type="button"
                disabled={
                  !isAgreed ||
                  !turnoverRemarks.trim() ||
                  signatures.length === 0 ||
                  !handshakeTargetCustodian ||
                  !handshakeTargetSupervisor
                }
                onClick={handleApplySignature}
                className="w-2/3 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white disabled:text-slate-500 rounded-lg shadow-md transition-all disabled:cursor-not-allowed text-center"
              >
                Sign & Finalize
              </button>
            </div>
          </div>
        </div>
      </div>
      <NotificationModal
        isVisible={toast.isVisible}
        message={toast.message}
        type={toast.type}
        onClose={() => setToast((prev) => ({ ...prev, isVisible: false }))}
        duration={4500}
      />
    </div>
  );
}