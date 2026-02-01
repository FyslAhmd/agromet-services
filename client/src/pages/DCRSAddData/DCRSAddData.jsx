import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  CloudArrowUpIcon,
  ArrowUpTrayIcon,
  DocumentTextIcon,
  XCircleIcon,
  InformationCircleIcon,
  CheckCircleIcon,
  TableCellsIcon,
  ArrowPathIcon
} from "@heroicons/react/24/outline";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import axios from "axios";
import Swal from "sweetalert2";
import { DCRS_API_URL } from "../../config/api";

const AddData = () => {
  const [selectedDataType, setSelectedDataType] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  // Data type options with backend mapping
  const dataTypeOptions = [
    { value: "seasonal-rice-area", label: "Seasonal Rice Area Data", backendType: "area" },
    { value: "seasonal-total-production", label: "Seasonal Total Production", backendType: "production" },
    { value: "seasonal-yield", label: "Seasonal Yield", backendType: "yield" },
    { value: "all-season-data", label: "All Season Data", backendType: "all-season" },
    { value: "district-wise-data", label: "District Wise Data", backendType: "district" },
    { value: "export-import-rice", label: "Export and Import Rice Data", backendType: "export-import" },
    { value: "cropping-intensity", label: "Cropping Intensity Data", backendType: "cropping" },
    { value: "rice-adoption-rate", label: "Rice Adoption Rate Data", backendType: "adoption" },
    { value: "faostat-data", label: "FAOStat Data", backendType: "faostat" }
  ];

  // Handle data type selection
  const handleDataTypeChange = (e) => {
    setSelectedDataType(e.target.value);
    // Reset file when changing data type
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle file selection
  const handleFileSelect = (file) => {
    // Validate file type (CSV or XLSX)
    const validTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ];
    
    if (!file || !validTypes.includes(file.type)) {
      Swal.fire({
        icon: "error",
        title: "Invalid File",
        text: "Please upload a valid CSV or XLSX file"
      });
      setUploadedFile(null);
      return;
    }

    setUploadedFile(file);
  };

  // Handle drag events
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Handle file input change
  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + " " + sizes[i];
  };

  // Remove file
  const handleRemoveFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Parse CSV file
  const parseCSV = (file) => {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          resolve(results.data);
        },
        error: (error) => {
          reject(error);
        }
      });
    });
  };

  // Parse XLSX file
  const parseXLSX = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          
          // Get first sheet
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Convert to JSON
          const jsonData = XLSX.utils.sheet_to_json(worksheet);
          resolve(jsonData);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = (error) => reject(error);
      reader.readAsArrayBuffer(file);
    });
  };

  // Handle file upload
  const handleUpload = async () => {
    if (!uploadedFile || !selectedDataType) {
      Swal.fire({
        icon: "warning",
        title: "Missing Information",
        text: "Please select a data type and upload a file"
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress
      setUploadProgress(20);

      // Parse file based on type
      let parsedData;
      if (uploadedFile.type === "text/csv") {
        parsedData = await parseCSV(uploadedFile);
      } else {
        parsedData = await parseXLSX(uploadedFile);
      }

      setUploadProgress(50);

      // Get backend data type
      const selectedOption = dataTypeOptions.find(opt => opt.value === selectedDataType);
      const backendType = selectedOption?.backendType;

      // Check if this is seasonal data
      if (["area", "production", "yield"].includes(backendType)) {
        // Send to seasonal data endpoint
        const response = await axios.post(
          `${DCRS_API_URL}/api/seasonal-data/upload`,
          {
            data: parsedData,
            filename: uploadedFile.name,
            dataType: backendType
          }
        );

        setUploadProgress(100);

        // Show results
        const result = response.data.results || response.data;
        const total = result.total || 0;
        const success = result.success || [];
        const failed = result.failed || [];
        const updated = result.updated || [];
        
        let resultHtml = `
          <div style="text-align: left;">
            <p><strong>Total Rows:</strong> ${total}</p>
            <p style="color: green;"><strong>Successfully Created:</strong> ${success.length}</p>
            <p style="color: orange;"><strong>Updated:</strong> ${updated.length}</p>
            <p style="color: red;"><strong>Failed:</strong> ${failed.length}</p>
          </div>
        `;

        if (failed.length > 0) {
          resultHtml += `
            <div style="text-align: left; margin-top: 15px; max-height: 200px; overflow-y: auto;">
              <strong>Failed Rows:</strong>
              <ul style="margin-top: 5px;">
                ${failed.map(f => `<li>Row ${f.row}: ${f.error}</li>`).join("")}
              </ul>
            </div>
          `;
        }

        Swal.fire({
          icon: failed.length === total ? "error" : "success",
          title: failed.length === total ? "Upload Failed" : "Upload Complete",
          html: resultHtml,
          width: 600
        });

        // Reset form on success
        if (success.length > 0 || updated.length > 0) {
          setUploadedFile(null);
          setSelectedDataType("");
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      } else if (backendType === "export-import") {
        // Send to export-import data endpoint
        const response = await axios.post(
          `${DCRS_API_URL}/api/export-import/upload`,
          {
            data: parsedData,
            filename: uploadedFile.name
          }
        );

        setUploadProgress(100);

        // Show results
        const result = response.data.results || response.data;
        const total = result.total || 0;
        const successful = result.successful || 0;
        const failed = result.failed || 0;
        const updated = result.updated || 0;
        const details = result.details || {};
        
        let resultHtml = `
          <div style="text-align: left;">
            <p><strong>Total Rows:</strong> ${total}</p>
            <p style="color: green;"><strong>Successfully Created:</strong> ${successful}</p>
            <p style="color: orange;"><strong>Updated:</strong> ${updated}</p>
            <p style="color: red;"><strong>Failed:</strong> ${failed}</p>
          </div>
        `;

        if (details.failed && details.failed.length > 0) {
          resultHtml += `
            <div style="text-align: left; margin-top: 15px; max-height: 200px; overflow-y: auto;">
              <strong>Failed Rows:</strong>
              <ul style="margin-top: 5px;">
                ${details.failed.map(f => `<li>Row ${f.row}: ${f.error}</li>`).join("")}
              </ul>
            </div>
          `;
        }

        Swal.fire({
          icon: failed === total ? "error" : "success",
          title: failed === total ? "Upload Failed" : "Upload Complete",
          html: resultHtml,
          width: 600
        });

        // Reset form on success
        if (successful > 0 || updated > 0) {
          setUploadedFile(null);
          setSelectedDataType("");
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      } else if (backendType === "cropping") {
        // Send to cropping intensity data endpoint
        const response = await axios.post(
          `${DCRS_API_URL}/api/cropping-intensity/upload`,
          {
            data: parsedData,
            filename: uploadedFile.name
          }
        );

        setUploadProgress(100);

        // Show results
        const result = response.data.results || response.data;
        const total = result.total || 0;
        const successful = result.successful || 0;
        const failed = result.failed || 0;
        const updated = result.updated || 0;
        const details = result.details || {};
        
        let resultHtml = `
          <div style="text-align: left;">
            <p><strong>Total Rows:</strong> ${total}</p>
            <p style="color: green;"><strong>Successfully Created:</strong> ${successful}</p>
            <p style="color: orange;"><strong>Updated:</strong> ${updated}</p>
            <p style="color: red;"><strong>Failed:</strong> ${failed}</p>
          </div>
        `;

        if (details.failed && details.failed.length > 0) {
          resultHtml += `
            <div style="text-align: left; margin-top: 15px; max-height: 200px; overflow-y: auto;">
              <strong>Failed Rows:</strong>
              <ul style="margin-top: 5px;">
                ${details.failed.map(f => `<li>Row ${f.row}: ${f.error}</li>`).join("")}
              </ul>
            </div>
          `;
        }

        Swal.fire({
          icon: failed === total ? "error" : "success",
          title: failed === total ? "Upload Failed" : "Upload Complete",
          html: resultHtml,
          width: 600
        });

        // Reset form on success
        if (successful > 0 || updated > 0) {
          setUploadedFile(null);
          setSelectedDataType("");
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      } else if (backendType === "all-season") {
        // Send to all season data endpoint
        const response = await axios.post(
          `${DCRS_API_URL}/api/all-season-data/upload`,
          parsedData
        );

        setUploadProgress(100);

        const result = response.data;
        
        Swal.fire({
          icon: result.success ? "success" : "error",
          title: result.success ? "Upload Complete" : "Upload Failed",
          html: `
            <div style="text-align: left;">
              <p>${result.message}</p>
              ${result.imported ? `<p style="color: green;"><strong>Imported:</strong> ${result.imported} records</p>` : ''}
              ${result.errors && result.errors.length > 0 ? `
                <div style="text-align: left; margin-top: 15px; max-height: 200px; overflow-y: auto;">
                  <strong>Errors:</strong>
                  <ul style="margin-top: 5px;">
                    ${result.errors.map(err => `<li>${err}</li>`).join("")}
                  </ul>
                </div>
              ` : ''}
            </div>
          `,
          width: 600
        });

        // Reset form on success
        if (result.success && result.imported > 0) {
          setUploadedFile(null);
          setSelectedDataType("");
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      } else if (backendType === "adoption") {
        // Send to rice adoption rate endpoint
        const formData = new FormData();
        formData.append('file', uploadedFile);

        const response = await axios.post(
          `${DCRS_API_URL}/api/rice-adoption-rate/upload`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        );

        setUploadProgress(100);

        const result = response.data;
        const stats = result.data || {};
        
        Swal.fire({
          icon: result.success ? "success" : "error",
          title: result.success ? "Upload Complete" : "Upload Failed",
          html: `
            <div style="text-align: left;">
              <p>${result.message}</p>
              ${stats.totalRecords ? `<p style="color: green;"><strong>Total Records:</strong> ${stats.totalRecords}</p>` : ''}
              ${stats.uniqueYears ? `<p><strong>Unique Years:</strong> ${stats.uniqueYears}</p>` : ''}
              ${stats.uniqueSeasons ? `<p><strong>Unique Seasons:</strong> ${stats.uniqueSeasons}</p>` : ''}
              ${stats.uniqueVarieties ? `<p><strong>Unique Varieties:</strong> ${stats.uniqueVarieties}</p>` : ''}
            </div>
          `,
          width: 600
        });

        // Reset form on success
        if (result.success && stats.totalRecords > 0) {
          setUploadedFile(null);
          setSelectedDataType("");
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      } else if (backendType === "district") {
        // Send to district-wise data endpoint
        const response = await axios.post(
          `${DCRS_API_URL}/api/district-wise/upload`,
          {
            data: parsedData,
            filename: uploadedFile.name
          }
        );

        setUploadProgress(100);

        // Show results
        const result = response.data.results || response.data;
        const total = result.total || 0;
        const successful = result.successful || 0;
        const failed = result.failed || 0;
        const updated = result.updated || 0;
        const details = result.details || {};
        
        let resultHtml = `
          <div style="text-align: left;">
            <p><strong>Total Rows:</strong> ${total}</p>
            <p style="color: green;"><strong>Successfully Created:</strong> ${successful}</p>
            <p style="color: orange;"><strong>Updated:</strong> ${updated}</p>
            <p style="color: red;"><strong>Failed:</strong> ${failed}</p>
          </div>
        `;

        if (details.failed && details.failed.length > 0) {
          resultHtml += `
            <div style="text-align: left; margin-top: 15px; max-height: 200px; overflow-y: auto;">
              <strong>Failed Rows:</strong>
              <ul style="margin-top: 5px;">
                ${details.failed.map(f => `<li>Row ${f.row}: ${f.error}</li>`).join("")}
              </ul>
            </div>
          `;
        }

        Swal.fire({
          icon: failed === total ? "error" : "success",
          title: failed === total ? "Upload Failed" : "Upload Complete",
          html: resultHtml,
          width: 600
        });

        // Reset form on success
        if (successful > 0 || updated > 0) {
          setUploadedFile(null);
          setSelectedDataType("");
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      } else if (backendType === "faostat") {
        // Send to FAOStat data endpoint
        const response = await axios.post(
          `${DCRS_API_URL}/api/faostat-data/upload`,
          {
            data: parsedData,
            filename: uploadedFile.name
          }
        );

        setUploadProgress(100);

        // Show results
        const result = response.data.results || response.data;
        const total = result.total || 0;
        const successful = result.successful || 0;
        const failed = result.failed || 0;
        const updated = result.updated || 0;
        const details = result.details || {};
        
        let resultHtml = `
          <div style="text-align: left;">
            <p><strong>Total Rows:</strong> ${total}</p>
            <p style="color: green;"><strong>Successfully Created:</strong> ${successful}</p>
            <p style="color: orange;"><strong>Updated:</strong> ${updated}</p>
            <p style="color: red;"><strong>Failed:</strong> ${failed}</p>
          </div>
        `;

        if (details.failed && details.failed.length > 0) {
          resultHtml += `
            <div style="text-align: left; margin-top: 15px; max-height: 200px; overflow-y: auto;">
              <strong>Failed Rows:</strong>
              <ul style="margin-top: 5px;">
                ${details.failed.map(f => `<li>Row ${f.row}: ${f.error}</li>`).join("")}
              </ul>
            </div>
          `;
        }

        Swal.fire({
          icon: failed === total ? "error" : "success",
          title: failed === total ? "Upload Failed" : "Upload Complete",
          html: resultHtml,
          width: 600
        });

        // Reset form on success
        if (successful > 0 || updated > 0) {
          setUploadedFile(null);
          setSelectedDataType("");
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }
      } else {
        // Other data types - not implemented yet
        setUploadProgress(100);
        Swal.fire({
          icon: "info",
          title: "Coming Soon",
          text: `Upload functionality for ${selectedOption?.label} will be available soon`
        });
      }
    } catch (error) {
      console.error("Upload error:", error);
      Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text: error.response?.data?.message || error.message || "Failed to upload file"
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6 sm:mb-8"
        >
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-2 sm:mb-3 px-2"
          >
            Upload Data to DCRS
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4"
          >
            Select a data type and upload your CSV or XLSX file to add data to the system
          </motion.p>
        </motion.div>

        {/* Data Type Selection */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-4">
            <div className="bg-blue-100 p-2 sm:p-3 rounded-lg sm:rounded-xl">
              <TableCellsIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Select Data Type</h2>
              <p className="text-xs sm:text-sm text-gray-600">Choose the type of data you want to upload</p>
            </div>
          </div>

          <select
            value={selectedDataType}
            onChange={handleDataTypeChange}
            className="w-full px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base border-2 border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          >
            <option value="">-- Select a data type --</option>
            {dataTypeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>

          {selectedDataType && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 sm:mt-4 p-3 sm:p-4 bg-blue-50 border-l-4 border-blue-500 rounded-lg"
            >
              <p className="text-xs sm:text-sm text-blue-800">
                <span className="font-bold">Selected:</span>{" "}
                {dataTypeOptions.find(opt => opt.value === selectedDataType)?.label}
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* File Upload Section - Only shown when data type is selected */}
        <AnimatePresence>
          {selectedDataType && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden"
            >
              {/* Drag and Drop Zone */}
              <div
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !uploadedFile && fileInputRef.current?.click()}
                className={`
                  relative border-2 sm:border-4 border-dashed rounded-xl sm:rounded-2xl p-6 sm:p-10 md:p-12 m-3 sm:m-4 md:m-6
                  transition-all duration-300
                  ${!uploadedFile ? 'cursor-pointer' : ''}
                  ${isDragging 
                    ? 'border-blue-500 bg-blue-50 scale-[0.98]' 
                    : uploadedFile
                      ? 'border-green-300 bg-green-50'
                      : 'border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50'
                  }
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileInputChange}
                  className="hidden"
                />

                <AnimatePresence mode="wait">
                  {!uploadedFile ? (
                    <motion.div
                      key="upload-prompt"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-center"
                    >
                      <motion.div
                        animate={{ y: isDragging ? -10 : 0 }}
                        transition={{ duration: 0.2 }}
                        className="flex justify-center mb-4 sm:mb-6"
                      >
                        <div className={`
                          p-4 sm:p-5 md:p-6 rounded-full transition-all duration-300
                          ${isDragging 
                            ? 'bg-blue-100 scale-110' 
                            : 'bg-gray-100'
                          }
                        `}>
                          <ArrowUpTrayIcon className={`
                            w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 transition-colors duration-300
                            ${isDragging ? 'text-blue-600' : 'text-gray-400'}
                          `} />
                        </div>
                      </motion.div>

                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-2 sm:mb-3 px-2">
                        {isDragging ? 'Drop your file here' : 'Drag and drop your CSV file'}
                      </h3>
                      
                      <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
                        or
                      </p>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="
                          bg-gradient-to-r from-blue-600 to-blue-700
                          hover:from-blue-700 hover:to-blue-800
                          text-white font-semibold text-sm sm:text-base md:text-lg
                          px-6 sm:px-7 md:px-8 py-3 sm:py-3.5 md:py-4 rounded-lg sm:rounded-xl
                          shadow-lg hover:shadow-xl
                          transition-all duration-300
                          transform hover:scale-105
                          flex items-center gap-2 sm:gap-3 mx-auto
                        "
                      >
                        <DocumentTextIcon className="w-5 h-5 sm:w-6 sm:h-6" />
                        Browse Files
                      </button>

                      <p className="text-xs sm:text-sm text-gray-500 mt-4 sm:mt-6 px-2">
                        Supported formats: CSV, XLSX • Maximum file size: 10MB
                      </p>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="file-info"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="text-center"
                    >
                      {/* File Icon */}
                      <div className="flex justify-center mb-4 sm:mb-6">
                        <div className="bg-green-100 p-4 sm:p-5 md:p-6 rounded-full">
                          <DocumentTextIcon className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-green-600" />
                        </div>
                      </div>

                      {/* File Name */}
                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-2 px-2 break-words">
                        {uploadedFile.name}
                      </h3>

                      {/* File Size */}
                      <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
                        {formatFileSize(uploadedFile.size)}
                      </p>

                      {/* Success Message */}
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-green-100 border border-green-300 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 mx-2"
                      >
                        <p className="text-green-800 font-semibold text-sm sm:text-base">
                          ✓ File selected successfully!
                        </p>
                      </motion.div>

                      {/* Action Buttons */}
                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-2">
                        {/* Upload Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpload();
                          }}
                          disabled={isUploading}
                          className="
                            bg-gradient-to-r from-blue-600 to-blue-700
                            hover:from-blue-700 hover:to-blue-800
                            disabled:from-gray-400 disabled:to-gray-500
                            text-white font-semibold text-sm sm:text-base
                            px-6 sm:px-8 py-3 rounded-lg
                            shadow-lg hover:shadow-xl
                            transition-all duration-300
                            flex items-center gap-2 justify-center
                            disabled:cursor-not-allowed
                            w-full sm:w-auto
                          "
                        >
                          {isUploading ? (
                            <>
                              <ArrowPathIcon className="w-5 h-5 animate-spin" />
                              <span className="hidden sm:inline">Uploading... {uploadProgress}%</span>
                              <span className="sm:hidden">Uploading...</span>
                            </>
                          ) : (
                            <>
                              <CloudArrowUpIcon className="w-5 h-5" />
                              Upload Data
                            </>
                          )}
                        </button>

                        {/* Remove Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile();
                          }}
                          disabled={isUploading}
                          className="
                            bg-red-50 hover:bg-red-100
                            text-red-600 font-semibold text-sm sm:text-base
                            px-5 sm:px-6 py-3 rounded-lg
                            border-2 border-red-200 hover:border-red-300
                            transition-all duration-300
                            flex items-center gap-2 justify-center
                            disabled:opacity-50 disabled:cursor-not-allowed
                            w-full sm:w-auto
                          "
                        >
                          <XCircleIcon className="w-5 h-5" />
                          Remove
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Info Message when no data type selected */}
        {!selectedDataType && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-4 sm:p-6 text-center"
          >
            <p className="text-blue-800 text-sm sm:text-base md:text-lg px-2">
              👆 Please select a data type above to begin uploading your file
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AddData;
