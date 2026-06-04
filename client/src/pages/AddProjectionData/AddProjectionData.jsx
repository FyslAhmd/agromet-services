import { useState, useRef, useEffect } from "react";
// eslint-disable-next-line no-unused-vars
import { AnimatePresence, motion } from "framer-motion";
import {
  CloudArrowUpIcon,
  ArrowUpTrayIcon,
  DocumentTextIcon,
  XCircleIcon,
  TableCellsIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import axios from "axios";
import Swal from "sweetalert2";
import { API_ENDPOINTS, getAuthHeaders } from "../../config/api";

const AddProjectionData = () => {
  const [selectedDataType, setSelectedDataType] = useState("");
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Job Tracking State
  const [jobId, setJobId] = useState(null);
  const [jobStatus, setJobStatus] = useState(null); // 'pending', 'processing', 'completed', 'failed'
  const [totalRows, setTotalRows] = useState(0);
  const [processedRows, setProcessedRows] = useState(0);
  const [errorLog, setErrorLog] = useState("");

  const fileInputRef = useRef(null);

  const dataTypeOptions = [
    { value: "minimum-temperature", label: "Minimum Temperature" },
    { value: "maximum-temperature", label: "Maximum Temperature" },
    { value: "precipitation", label: "Precipitation" },
    { value: "relative-humidity", label: "Relative Humidity" },
  ];

  const handleDataTypeChange = (e) => {
    setSelectedDataType(e.target.value);
    setUploadedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (file) => {
    // CSV is preferred for large data streaming
    if (!file || file.name.split('.').pop().toLowerCase() !== 'csv') {
      Swal.fire({
        icon: "error",
        title: "Invalid File",
        text: "Please upload a valid CSV file for projection data",
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

  // The actual form upload
  const handleUpload = async () => {
    if (!uploadedFile || !selectedDataType) {
      Swal.fire({
        icon: "warning",
        title: "Missing Information",
        text: "Please select a data type and upload a CSV file",
      });
      return;
    }

    const formData = new FormData();
    formData.append("file", uploadedFile);
    formData.append("dataType", selectedDataType);

    try {
      setJobStatus("pending");
      setTotalRows(0);
      setProcessedRows(0);

      const headers = getAuthHeaders();
      // Remove content-type to allow browser to automatically set multipart/form-data with boundary
      delete headers["Content-Type"]; 

      const response = await axios.post(
        API_ENDPOINTS.projectionsUpload,
        formData,
        { headers }
      );

      const newJobId = response.data.jobId;
      setJobId(newJobId);
      
    } catch (error) {
      console.error("Upload error:", error);
      setJobStatus(null);
      Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text: error.response?.data?.message || error.message || "Failed to initiate file upload",
      });
    }
  };

  // Polling Effect
  useEffect(() => {
    let intervalId;

    const checkJobStatus = async () => {
      try {
        const response = await axios.get(API_ENDPOINTS.projectionsStatus(jobId), {
          headers: getAuthHeaders()
        });

        const data = response.data;
        setJobStatus(data.status);
        setTotalRows(data.totalRows || 0);
        setProcessedRows(data.processedRows || 0);
        setErrorLog(data.errorLog || "");

        if (data.status === "completed" || data.status === "failed") {
          clearInterval(intervalId);
          
          if (data.status === "completed") {
            Swal.fire({
              icon: "success",
              title: "Upload Complete",
              text: `Successfully processed ${data.totalRows} rows.`,
            }).then(() => {
               // Reset state after success
               setJobId(null);
               setJobStatus(null);
               handleRemoveFile();
               setSelectedDataType("");
            });
          } else {
            Swal.fire({
              icon: "error",
              title: "Processing Failed",
              text: data.errorLog || "An error occurred during backend processing.",
            }).then(() => {
               setJobId(null);
               setJobStatus(null);
            });
          }
        }
      } catch (error) {
        console.error("Error checking job status:", error);
      }
    };

    if (jobId && (jobStatus === "pending" || jobStatus === "processing")) {
      // Check immediately
      checkJobStatus();
      // Then poll every 2 seconds
      intervalId = setInterval(checkJobStatus, 2000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [jobId, jobStatus]);

  // Calculate progress percentage
  const progressPercentage = totalRows > 0 ? Math.round((processedRows / totalRows) * 100) : 0;
  // If we don't know totalRows yet but are processing, show a generic loading or pseudo progress
  const displayPercentage = totalRows > 0 ? progressPercentage : (jobStatus === 'processing' ? Math.min(Math.round((processedRows / 100000) * 10), 99) : 0);

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-teal-50 to-gray-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6 sm:mb-8"
        >
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-800 mb-2 sm:mb-3 px-2">
            Upload Projection Data
          </h1>
          <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto px-4">
            Upload large CSV projection models. The file will be streamed to the database in the background.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 mb-4 sm:mb-6"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3 mb-4">
            <div className="bg-teal-100 p-2 sm:p-3 rounded-lg sm:rounded-xl">
              <TableCellsIcon className="w-5 h-5 sm:w-6 sm:h-6 text-teal-600" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                Select Model Type
              </h2>
              <p className="text-xs sm:text-sm text-gray-600">
                Choose the type of projection data you are uploading
              </p>
            </div>
          </div>

          <select
            value={selectedDataType}
            onChange={handleDataTypeChange}
            disabled={jobId !== null}
            className="w-full px-3 sm:px-4 py-3 sm:py-4 text-sm sm:text-base border-2 border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all disabled:opacity-50 disabled:bg-gray-100"
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
              className="mt-3 sm:mt-4 p-3 sm:p-4 bg-teal-50 border-l-4 border-teal-500 rounded-lg"
            >
              <p className="text-xs sm:text-sm text-teal-800">
                <span className="font-bold">Selected:</span>{" "}
                {dataTypeOptions.find((opt) => opt.value === selectedDataType)?.label}
              </p>
              <p className="text-xs text-teal-700 mt-1">
                CSV Must contain columns: <span className="font-mono bg-teal-100 px-1 rounded">District, date, model, scenario</span> plus data columns.
              </p>
            </motion.div>
          )}
        </motion.div>

        <AnimatePresence mode="wait">
          {jobId ? (
            /* PROGRESS VIEW */
            <motion.div
              key="progress-view"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-2xl shadow-xl p-8 sm:p-12 text-center"
            >
               <div className="flex flex-col items-center justify-center">
                  <ArrowPathIcon className="w-16 h-16 text-teal-600 animate-spin mb-4" />
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    {jobStatus === "pending" ? "Initializing Upload..." : "Processing Data..."}
                  </h3>
                  <p className="text-gray-600 mb-8">
                    Please wait while your data is safely streamed to the database. You can leave this page open.
                  </p>

                  {/* Progress Bar Container */}
                  <div className="w-full max-w-2xl bg-gray-200 rounded-full h-6 mb-4 overflow-hidden relative">
                    <motion.div 
                      className="bg-linear-to-r from-teal-500 to-emerald-400 h-6 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${displayPercentage}%` }}
                      transition={{ duration: 0.5 }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center text-xs font-bold text-gray-800 drop-shadow-xs mix-blend-overlay">
                      {displayPercentage}%
                    </div>
                  </div>

                  <div className="flex justify-between w-full max-w-2xl text-sm font-semibold text-gray-600">
                    <span>{processedRows.toLocaleString()} rows processed</span>
                    {totalRows > 0 && <span>{totalRows.toLocaleString()} total rows</span>}
                  </div>
                  {errorLog && (
                    <div className="mt-4 text-xs text-red-500 max-w-2xl text-left bg-red-50 p-2 rounded">
                      <strong>Recent Errors:</strong> {errorLog.substring(0, 100)}...
                    </div>
                  )}
               </div>
            </motion.div>
          ) : selectedDataType && (
            /* UPLOAD VIEW */
            <motion.div
              key="upload-view"
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
                      ? "border-teal-500 bg-teal-50 scale-[0.98]"
                      : uploadedFile
                      ? "border-emerald-300 bg-emerald-50"
                      : "border-gray-300 bg-gray-50 hover:border-teal-400 hover:bg-teal-50"
                  }
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
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
                          ${isDragging ? "bg-teal-100 scale-110" : "bg-gray-100"}
                        `}
                        >
                          <ArrowUpTrayIcon
                            className={`
                            w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 transition-colors duration-300
                            ${isDragging ? "text-teal-600" : "text-gray-400"}
                          `}
                          />
                        </div>
                      </motion.div>

                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-2 sm:mb-3 px-2">
                        {isDragging ? "Drop your CSV here" : "Drag and drop your CSV file"}
                      </h3>

                      <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">or</p>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="
                          bg-linear-to-r from-teal-600 to-teal-700
                          hover:from-teal-700 hover:to-teal-800
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
                        Supported format: CSV strictly • Handled asynchronously
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
                        <div className="bg-emerald-100 p-4 sm:p-5 md:p-6 rounded-full">
                          <DocumentTextIcon className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-emerald-600" />
                        </div>
                      </div>

                      <h3 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 mb-2 px-2 wrap-break-word">
                        {uploadedFile.name}
                      </h3>

                      <p className="text-gray-600 mb-4 sm:mb-6 text-sm sm:text-base">
                        {formatFileSize(uploadedFile.size)}
                      </p>

                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-emerald-100 border border-emerald-300 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6 mx-2"
                      >
                        <p className="text-emerald-800 font-semibold text-sm sm:text-base">
                          ✓ File selected successfully!
                        </p>
                      </motion.div>

                      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpload();
                          }}
                          className="
                            bg-linear-to-r from-teal-600 to-teal-700
                            hover:from-teal-700 hover:to-teal-800
                            text-white font-semibold text-sm sm:text-base
                            px-6 sm:px-8 py-3 rounded-lg
                            shadow-lg hover:shadow-xl
                            transition-all duration-300
                            flex items-center gap-2 justify-center
                            w-full sm:w-auto
                          "
                        >
                          <CloudArrowUpIcon className="w-5 h-5" />
                          Stream & Upload Data
                        </button>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFile();
                          }}
                          className="
                            bg-red-50 hover:bg-red-100
                            text-red-600 font-semibold text-sm sm:text-base
                            px-5 sm:px-6 py-3 rounded-lg
                            border-2 border-red-200 hover:border-red-300
                            transition-all duration-300
                            flex items-center gap-2 justify-center
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
            transition={{ delay: 0.4 }}
            className="bg-teal-50 border-l-4 border-teal-500 rounded-lg p-4 sm:p-6 text-center"
          >
            <p className="text-teal-800 text-sm sm:text-base md:text-lg px-2">
              👆 Please select a data type above to begin uploading your file
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AddProjectionData;
