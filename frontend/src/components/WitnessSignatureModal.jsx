// eslint-disable-next-line no-unused-vars
import React, { useRef, useState, useEffect } from "react";

export default function WitnessSignatureModal({
  isOpen,
  onClose,
  onSave,
}) {
  const [activeTab, setActiveTab] = useState("draw"); // "draw" | "upload"
  const [localWitnessName, setLocalWitnessName] = useState("");
  const [isAgreed, setIsAgreed] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [signatureUrl, setSignatureUrl] = useState(null);

  // Reset states completely when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setLocalWitnessName("");
      setIsAgreed(false);
      setHasSignature(false);
      setUploadedImage(null);
      setSignatureUrl(null);
      setActiveTab("draw");

      setTimeout(() => {
        if (canvasRef.current) {
          const canvas = canvasRef.current;
          const ctx = canvas.getContext("2d");
          canvas.width = canvas.offsetWidth;
          canvas.height = canvas.offsetHeight;
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.strokeStyle = "#1e3a8a";
          ctx.lineWidth = 2.5;
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
        }
      }, 50);
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
    setHasSignature(true);
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

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureUrl(null);
    setHasSignature(false);
  };

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
        setSignatureUrl(url);
        setHasSignature(true);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    let url = signatureUrl;
    if (activeTab === "draw" && canvasRef.current) {
      url = canvasRef.current.toDataURL("image/png");
    }
    if (!url || !localWitnessName.trim() || !isAgreed || !hasSignature) return;

    onSave({
      witnessName: localWitnessName.trim(),
      signatureUrl: url,
      timestamp: new Date().toISOString()
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-sm flex items-center justify-center p-4 z-[100] animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 w-full max-w-lg rounded-2xl flex flex-col overflow-hidden shadow-2xl text-slate-300">
        <div className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex justify-between items-center">
          <h3 className="text-sm font-black uppercase text-blue-400 tracking-wider">
            Witness Signature Capture
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-300 font-mono text-sm">
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-1.5">
            <label className="block text-[10px] font-bold text-slate-400 uppercase">
              Witness / Complainant Full Name *
            </label>
            <input
              type="text"
              value={localWitnessName}
              onChange={(e) => setLocalWitnessName(e.target.value)}
              placeholder="Enter witness full name..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-white focus:border-blue-500/50 focus:outline-none"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold text-slate-400 uppercase">
                Signature Autograph Pad *
              </label>
              <div className="flex bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[10px] font-bold uppercase">
                <button
                  type="button"
                  onClick={() => { setActiveTab("draw"); setUploadedImage(null); }}
                  className={`px-2.5 py-1 rounded-md transition-all ${activeTab === "draw" ? "bg-blue-600 text-white" : "text-slate-400 hover:text-white"}`}
                >
                  Draw |
                </button>
              </div>
            </div>

            {activeTab === "draw" ? (
              <div className="space-y-2">
                <div className="relative w-full h-36 bg-white rounded-xl overflow-hidden border border-slate-800 cursor-crosshair">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={() => setIsDrawing(false)}
                    onMouseLeave={() => setIsDrawing(false)}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={() => setIsDrawing(false)}
                    className="w-full h-full touch-none"
                  />
                </div>
                <div className="text-right">
                  <button
                    type="button"
                    onClick={clearCanvas}
                    className="text-[9px] bg-slate-950 text-slate-400 hover:text-white px-2.5 py-1 rounded font-mono font-bold uppercase border border-slate-800"
                  >
                    Clear Pad
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-full h-36 bg-slate-950 border border-slate-800 rounded-xl flex flex-col items-center justify-center p-4 relative">
                  {uploadedImage ? (
                    <img src={uploadedImage} alt="Witness Signature" className="max-h-full max-w-full object-contain filter invert" />
                  ) : (
                    <div className="text-center space-y-0.5">
                      <p className="text-[10px] text-slate-500">Click or drag signature image here</p>
                      <p className="text-[8px] text-slate-600">Supports transparent background PNG</p>
                    </div>
                  )}
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 items-start bg-slate-950/40 border border-slate-800/50 p-3 rounded-xl">
            <input
              type="checkbox"
              id="witness-esign-agreement"
              checked={isAgreed}
              onChange={(e) => setIsAgreed(e.target.checked)}
              className="mt-0.5 h-3.5 w-3.5 accent-blue-500 cursor-pointer rounded shrink-0"
            />
            <label htmlFor="witness-esign-agreement" className="text-[9px] font-medium text-slate-400 leading-tight cursor-pointer">
              I verify that this electronic signature is authorized by the witness/complainant for inclusion in the evidence chain of custody log.
            </label>
          </div>
        </div>

        <div className="bg-slate-950 border-t border-slate-800 px-6 py-4 flex gap-3 justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold uppercase hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!localWitnessName.trim() || !isAgreed || !hasSignature}
            onClick={handleSave}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white disabled:text-slate-500 rounded-xl text-xs font-bold uppercase transition-all shadow-md disabled:cursor-not-allowed"
          >
            Attach Signature
          </button>
        </div>
      </div>
    </div>
  );
}