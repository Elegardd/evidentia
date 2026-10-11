/**
 * Uploads staged images to the backend server tied to a specific evidence record.
 */
export async function uploadEvidenceImages(evidenceRecord, imageObjects, apiUrl) {
  if (!imageObjects || imageObjects.length === 0) return [];

  const newFilesToUpload = imageObjects.filter(img => img.file instanceof File);
  if (newFilesToUpload.length === 0) return [];

  const formData = new FormData();
  
  // Support passing either an object or a direct ID string/number
  const recordId = typeof evidenceRecord === 'object' ? evidenceRecord.id : evidenceRecord;
  const formattedEvidenceId = typeof evidenceRecord === 'object' 
    ? (evidenceRecord.evidence_id || `EV-2026-${String(evidenceRecord.id || 0).padStart(4, "0")}`) 
    : null;

  if (recordId) formData.append("id", recordId);
  if (formattedEvidenceId) formData.append("evidence_id", formattedEvidenceId);

  newFilesToUpload.forEach((imgObj) => {
    formData.append("evidence_files[]", imgObj.file);
  });

  try {
    const response = await fetch(`${apiUrl}/upload_evidence_image.php`, {
      method: "POST",
      headers: {
        "ngrok-skip-browser-warning": "true"
      },
      body: formData,
    });

    const result = await response.json();
    if (!response.ok || result.status !== "success") {
      throw new Error(result.message || "Failed to upload evidence images.");
    }
    return result.files || [];
  } catch (error) {
    console.error("Image upload error:", error);
    throw error;
  }
}

/**
 * Handles picking and previewing image files locally before staging/upload.
 */
export function handleImageCollectionUpload(e, setEvidenceImages) {
  const files = Array.from(e.target.files || []);
  if (files.length === 0) return;

  const newImages = files.map(file => {
    const blobUrl = URL.createObjectURL(file);
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
}