import * as XLSX from "xlsx";

/**
 * Universal Multi-Format Import Service
 * Automatically detects and reads .xlsx, .xls, .csv, and .txt template files.
 * Includes explicit validation checks to prevent duplicate records using modern toasts.
 *
 * @param {Event} event - The file input HTML upload change event
 * @param {Object} setters - Object containing all your React state updater functions
 * @param {Array} allowedAgencies - BENGUET_AGENCIES array validation reference
 * @param {Object} categoryMap - CATEGORY_MAP dictionary data validation reference
 * @param {Array} evidenceList - The state array containing all currently loaded records (for duplicate tracking)
 * @param {Function} triggerToast - The parent component's custom top-center alert function callback
 */
export const handleExcelImport = (event, setters, allowedAgencies, categoryMap, evidenceList = [], triggerToast) => {
  const file = event.target.files[0];
  if (!file) return;

  const fileExtension = file.name.split('.').pop().toLowerCase();
  const reader = new FileReader();

  // Helper logic to distribute the parsed data object straight to your React form states
  const mapDataToForm = (dataRow) => {
    
    // --- COLLISION / DUPLICATE CHECK UPFRONT ---
    const importedAgency = dataRow.agency ? dataRow.agency.trim() : "";
    const importedCaseNum = dataRow.caseNumber ? dataRow.caseNumber.trim() : "";

    if (importedAgency && importedCaseNum) {
      const isDuplicate = evidenceList.some(
        (item) =>
          item.investigating_agency?.toLowerCase() === importedAgency.toLowerCase() &&
          item.case_number?.toLowerCase() === importedCaseNum.toLowerCase()
      );

      if (isDuplicate) {
        if (triggerToast) {
          triggerToast(
            `Collision Alert: An entry with Case Number "${importedCaseNum}" already exists for ${importedAgency}. Template import halted.`, 
            "error"
          );
        }
        return; // Halts filling the form fields completely
      }
    }

    // 1. SAFE STATION & AGENCY MATCHING
    if (dataRow.agency && allowedAgencies.includes(dataRow.agency)) {
      setters.setInvestigatingAgency(dataRow.agency);
    } else if (dataRow.agency) {
      console.warn(`Agency "${dataRow.agency}" not recognized in system dictionaries.`);
    }

    if (dataRow.caseNumber) setters.setCaseNumber(dataRow.caseNumber);
    if (dataRow.caseTitle) setters.setCaseTitle(dataRow.caseTitle);
    if (dataRow.suspects) setters.setSuspectNames(dataRow.suspects);
    if (dataRow.witnesses) setters.setWitnessNames(dataRow.witnesses);
    
    // 2. SAFE DEPENDENT CATEGORY & ITEM MAPPING
    if (dataRow.category && Object.keys(categoryMap).includes(dataRow.category)) {
      setters.setEvidenceType(dataRow.category);

      const validOptions = categoryMap[dataRow.category] || [];
      if (dataRow.description && validOptions.includes(dataRow.description)) {
        setters.setPhysicalDescription(dataRow.description);
      } else if (validOptions.length > 0) {
        setters.setPhysicalDescription(validOptions[0]); // Safe fallback
      }
    }
    
    if (dataRow.serial) setters.setConditionReceived(dataRow.serial);
    if (dataRow.quantity) setters.setQuantity(Math.max(1, Number(dataRow.quantity) || 1));
    
    // 3. COLLECTION LOG DETAILS
    if (dataRow.dateCollected) setters.setDateCollected(dataRow.dateCollected);
    if (dataRow.collectionPlace) setters.setCollectionPlace(dataRow.collectionPlace);
    if (dataRow.retrievalAddress) setters.setRetrievalAddress(dataRow.retrievalAddress);

    // Success Notification trigger
    if (triggerToast) {
      triggerToast(`Template values matching case entry log parsed successfully into active form inputs.`, "success");
    }
  };

  // --- BRANCH A: EXCEL BINARY PROCESSING (.xlsx, .xls) ---
  if (fileExtension === "xlsx" || fileExtension === "xls") {
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet);

        if (rows.length === 0) {
          if (triggerToast) triggerToast("The uploaded spreadsheet contains no readable data rows.", "error");
          return;
        }
        mapDataToForm(rows[0]);
      } catch (err) {
        console.error("Excel processing failure:", err);
        if (triggerToast) triggerToast("Error reading file stream properties as valid binary workspace layout sheets.", "error");
      }
    };
    reader.readAsArrayBuffer(file);

  // --- BRANCH B: TEXT PROCESSING (.csv, .txt) ---
  } else if (fileExtension === "csv" || fileExtension === "txt") {
    reader.onload = (e) => {
      try {
        const text = e.target.result;
        const lines = text.split(/\r?\n/).map(line => line.trim()).filter(line => line);
        
        if (lines.length < 2) {
          if (triggerToast) triggerToast("The uploaded data text layout does not contain a row entry beneath the primary headers.", "error");
          return;
        }

        const parseCSVLine = (line) => {
          return line.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(cell => 
            cell.trim().replace(/^["']|["']$/g, "")
          );
        };

        const headers = parseCSVLine(lines[0]);
        const values = parseCSVLine(lines[1]);

        const dataRow = {};
        headers.forEach((header, index) => {
          dataRow[header] = values[index] || "";
        });

        mapDataToForm(dataRow);
      } catch (err) {
        console.error("Flat-text template processing failure:", err);
        if (triggerToast) triggerToast("Error parsing characters out of comma-separated lines layout format.", "error");
      }
    };
    reader.readAsText(file);
    
  } else {
    if (triggerToast) triggerToast(`Unsupported document structure layout extension (.${fileExtension}). Use .xlsx, .xls, .csv, or .txt.`, "error");
  }
};