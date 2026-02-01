import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CloudArrowUpIcon,
  ArrowUpTrayIcon,
  DocumentTextIcon,
  XCircleIcon,
  TableCellsIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import axios from "axios";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../config/api";

const AddData = () => {
  const [selectedDataType, setSelectedDataType] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  const dataTypeOptions = [
    { value: "maximum-temp", label: "Maximum Temperature (°C)" },
    { value: "minimum-temp", label: "Minimum Temperature (°C)" },
    { value: "rainfall", label: "Rainfall (mm)" },
    { value: "relative-humidity", label: "Relative Humidity (%)" },
    { value: "sunshine", label: "Sunshine (hrs)" },
    { value: "wind-speed", label: "Wind Speed (km/h)" },
    { value: "soil-moisture", label: "Soil Moisture (%)" },
    { value: "soil-temperature", label: "Soil Temperature (°C)" },
    { value: "average-temperature", label: "Average Temperature (°C)" },
    { value: "solar-radiation", label: "Solar Radiation (W/m²)" },
    { value: "evapo-transpiration", label: "Evapo Transpiration (mm)" },
  ];

  const handleDataTypeChange = (e) => {
    setSelectedDataType(e.target.value);
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (file) => {
    const validTypes = [
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!file || !validTypes.includes(file.type)) {
      Swal.fire({
        icon: "error",
        title: "Invalid File",
        text: "Please upload a valid CSV or XLSX file",
      });
      setUploadedFile(null);
      return;
    }

    setUploadedFile(file);
  };

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

  const handleFileInputChange = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

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
        },
      });
    });
  };

  const parseXLSX = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target.result);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
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

  const handleUpload = async () => {
    if (!uploadedFile || !selectedDataType) {
      Swal.fire({
        icon: "warning",
        title: "Missing Information",
        text: "Please select a data type and upload a file",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      setUploadProgress(20);

      let parsedData;
      if (uploadedFile.type === "text/csv") {
        parsedData = await parseCSV(uploadedFile);
      } else {
        parsedData = await parseXLSX(uploadedFile);
      }

      setUploadProgress(50);

      const response = await axios.post(
        `${API_BASE_URL}/${selectedDataType}/upload`,
        {
          data: parsedData,
          filename: uploadedFile.name,
        }
      );

      setUploadProgress(100);

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
              ${details.failed.map((f) => `<li>Row ${f.row}: ${f.error}</li>`).join("")}
            </ul>
          </div>
        `;
      }

      Swal.fire({
        icon: failed === total ? "error" : "success",
        title: failed === total ? "Upload Failed" : "Upload Complete",
        html: resultHtml,
        width: 600,
      });

      if (successful > 0 || updated > 0) {
        setUploadedFile(null);
        setSelectedDataType("");
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      }
    } catch (error) {
      console.error("Upload error:", error);
      Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text: error.response?.data?.message || error.message || "Failed to upload file",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-gray-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6 sm:mb-8"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-2 sm:mb-3 px-2">
            Upload Climate Data
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
            Select a data type and upload your CSV or XLSX file to add data to the system
          </p>
        </motion.div>

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
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                Select Data Type
              </h2>
              <p className="text-xs sm:text-sm text-gray-600">
                Choose the type of climate data you want to upload
              </p>
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
                {dataTypeOptions.find((opt) => opt.value === selectedDataType)?.label}
              </p>
            </motion.div>
          )}
        </motion.div>

        <AnimatePresence>
          {selectedDataType && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="bg-white rounded-2xl shadow-xl overflow-hidden"
            >
              <div
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => !uploadedFile && fileInputRef.current?.click()}
                className={`
                  relative border-2 sm:border-4 border-dashed rounded-xl sm:rounded-2xl p-6 sm:p-10 md:p-12 m-3 sm:m-4 md:m-6
                  transition-all duration-300
                  ${!uploadedFile ? "cursor-pointer" : ""}
                  ${
                    isDragging
                      ? "border-blue-500 bg-blue-50 scale-[0.98]"
                      : uploadedFile
                      ? "border-green-300 bg-green-50"
                      : "border-gray-300 bg-gray-50 hover:border-blue-400 hover:bg-blue-50"
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
                        <div
                          className={`
                          p-4 sm:p-5 md:p-6 rounded-full transition-all duration-300
                          ${isDragging ? "bg-blue-100 scale-110" : "bg-gray-100"}
                        `}
                        >
                          <ArrowUpTrayIcon
                            className={`
                            w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 transition-colors duration-300
                            ${isDragging ? "text-blue-600" : "text-gray-400"}
                          `}
                          />
                        </div>
                      </motion.div>

                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-2 sm:mb-3 px-2">
                        {isDragging ? "Drop your file here" : "Drag and drop your file"}
                      </h3>

                      <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">or</p>

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
                      <div className="flex justify-center mb-4 sm:mb-6">
                        <div className="bg-green-100 p-4 sm:p-5 md:p-6 rounded-full">
                          <DocumentTextIcon className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-green-600" />
                        </div>
                      </div>

                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-2 px-2 break-words">
                        {uploadedFile.name}
                      </h3>

                      <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
                        {formatFileSize(uploadedFile.size)}
                      </p>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-green-100 border border-green-300 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 mx-2"
                      >
                        <p className="text-green-800 font-semibold text-sm sm:text-base">
                          ✓ File selected successfully!
                        </p>
                      </motion.div>

                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-2">
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
                              <span className="hidden sm:inline">
                                Uploading... {uploadProgress}%
                              </span>
                              <span className="sm:hidden">Uploading...</span>
                            </>
                          ) : (
                            <>
                              <CloudArrowUpIcon className="w-5 h-5" />
                              Upload Data
                            </>
                          )}
                        </button>

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
