/**
 * Handles the selection and validation of an image collection for evidence records.
 * 
 * @param {Event} e - The file input change event.
 * @param {Function} triggerToast - Toast notification function for UI feedback.
 * @param {Function} onImagesSelected - Callback function receiving the array of validated image files.
 */
export const handleImageCollectionUpload = (e, triggerToast, onImagesSelected) => {
  const files = Array.from(e.target.files || []);
  
  if (files.length === 0) return;

  // Validate file types (only allow images)
  const invalidFiles = files.filter(file => !file.type.startsWith("image/"));
  if (invalidFiles.length > 0) {
    triggerToast("Error: Only image files (.jpg, .jpeg, .png, .webp) are permitted for evidence collection.", "error");
    e.target.value = ""; // Reset input
    return;
  }

  // Optional: Limit maximum batch upload count (e.g., max 10 images at once)
  if (files.length > 10) {
    triggerToast("Warning: You can upload a maximum of 10 images per batch.", "error");
    e.target.value = "";
    return;
  }

  // Map files to preview objects or base64/URL references
  const processedImages = files.map(file => ({
    file,
    name: file.name,
    size: file.size,
    type: file.type,
    previewUrl: URL.createObjectURL(file)
  }));

  if (typeof onImagesSelected === "function") {
    onImagesSelected(processedImages);
  }

  triggerToast(`Successfully loaded ${files.length} evidence image(s).`, "success");
  
  // Reset input value so the same files can be re-selected if needed
  e.target.value = "";
};