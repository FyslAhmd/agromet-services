import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../config/api";
import CISMonthlyChart from "./CIS/CISMonthlyChart";
import CISStats from "./CIS/CISStats";
import CISFilters from "./CIS/CISFilters";
import CISTableView from "./CIS/CISTableView";
import CISRequestModal from "./CIS/CISRequestModal";
import {
  formatDate,
  formatDateTime,
  getStatusBadge,
  getTimeIntervalLabel,
  getDataAverageLabel,
} from "./CIS/cisUtils";

const CISTable = () => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dataType, setDataType] = useState("agws"); // "agws", "historical", or "secondary"
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  // Fetch CIS requests from API (AgWS)
  const fetchCISRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching CIS requests from API...");
      const response = await axios.get("https://saads.brri.gov.bd/api/cis");

      console.log("API Response:", response.data);

      // Handle different response structures
      const requestsData = Array.isArray(response.data)
        ? response.data
        : response.data.data
        ? response.data.data
        : response.data.requests
        ? response.data.requests
        : [];

      setRequests(requestsData);
      setFilteredRequests(requestsData);
    } catch (error) {
      console.error("Error fetching CIS requests:", error);
      setError(error.message);

      console.log("Using fallback mock data due to API error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch Historical Data requests from Agromet-Services API
  const fetchHistoricalRequests = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log("Fetching Historical Data requests from API...");
      const response = await axios.get(`${API_BASE_URL}/historical-data-requests`);

      console.log("Historical API Response:", response.data);

      // Handle response structure
      const requestsData = response.data.success && response.data.data
        ? response.data.data
        : [];

      // Normalize the data to match AgWS structure
      const normalizedData = requestsData.map(req => ({
        ...req,
        submitTime: req.requestDateTime || req.createdAt,
        selectedWeatherParameters: req.selectedParameters || [],
        selectedStations: req.selectedStations || [],
        selectedDataFormats: req.selectedDataFormats || [],
        timeInterval: req.timeInterval || "Custom",
        dataInterval: req.dataAverage || "N/A",
      }));

      setRequests(normalizedData);
      setFilteredRequests(normalizedData);
    } catch (error) {
      console.error("Error fetching Historical Data requests:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchSecondaryRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        console.error("No token found in localStorage");
        setError("Authentication required");
        setLoading(false);
        return;
      }
      
      const response = await axios.get(`${API_BASE_URL}/dcrs-proxy/secondary-data-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        // Normalize status to one of 'Pending', 'Approved', 'Rejected' (case-insensitive)
        const normalizeStatus = (status) => {
          if (!status) return "Pending";
          const s = status.toString().trim().toLowerCase();
          if (["pending", "requested", "request", "waiting"].includes(s)) return "Pending";
          if (["approved", "approve", "accepted", "accept"].includes(s)) return "Approved";
          if (["rejected", "reject", "declined", "denied"].includes(s)) return "Rejected";
          return "Pending";
        };
        const normalizedData = response.data.data.map((req) => ({
          id: req.id || 0,
          name: req.name || "Not Provided",
          organization: req.organization || "Not Provided",
          designation: req.designation || "Not Provided",
          email: req.email || "Not Provided",
          mobile: req.mobile || "Not Provided",
          address: req.address || "Not Provided",
          status: normalizeStatus(req.status),
          requestDate: req.createdAt || new Date().toISOString(),
          submitTime: req.createdAt || new Date().toISOString(),
          purpose: req.purpose || "Not Provided",
          dataSources: Array.isArray(req.dataSources) ? req.dataSources : [],
          methodology: req.methodology || "Not Specified",
          downloadFormats: Array.isArray(req.downloadFormats) && req.downloadFormats.length > 0 ? req.downloadFormats : ["CSV"],
          timeInterval: req.timeInterval || "Not Specified",
          dataAverage: req.dataAverage || "Not Specified",
          rejectionReason: req.rejectionReason || null,
          selectedDataFormats: Array.isArray(req.downloadFormats) && req.downloadFormats.length > 0 ? req.downloadFormats : ["CSV"],
          dataInterval: req.dataAverage || "Not Specified",
          startDate: req.startDate || null,
          endDate: req.endDate || null,
        }));

        setRequests(normalizedData);
        setFilteredRequests(normalizedData);
      }
    } catch (error) {
      console.error("Error fetching Secondary Data requests:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  // Sample data - replace with actual API call
  useEffect(() => {
    if (dataType === "agws") {
      fetchCISRequests();
    } else if (dataType === "historical") {
      fetchHistoricalRequests();
    } else if (dataType === "secondary") {
      fetchSecondaryRequests();
    }
  }, [dataType]);

  // Filter and search functionality
  useEffect(() => {
    let filtered = requests;

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (request) =>
          request.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          request.organization
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          request.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((request) => request.status === statusFilter);
    }

    setFilteredRequests(filtered);
    setCurrentPage(1);
  }, [searchTerm, statusFilter, requests]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredRequests.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  // Action handlers
  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setShowViewModal(true);
  };

  const handleAcceptRequest = async (requestId, requestName) => {
    const requestTypeName = dataType === "agws" ? "weather" : dataType === "historical" ? "historical" : "secondary source";
    const result = await Swal.fire({
      title: "Accept Request?",
      text: `Are you sure you want to accept the ${requestTypeName} data request from ${requestName}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Accept!",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        // Show loading
        Swal.fire({
          title: "Processing...",
          text: "Updating request status",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        let response;
        const token = localStorage.getItem("token");
        if (dataType === "agws") {
          // Make API call to update AgWS status
          response = await axios.put(
            `https://saads.brri.gov.bd/api/cis/${requestId}/status`,
            {
              status: "Approved",
              remarks: "Request approved for processing",
            }
          );
        } else if (dataType === "historical") {
          // Make API call to update Historical Data status
          response = await axios.put(
            `${API_BASE_URL}/historical-data-requests/${requestId}/status`,
            {
              status: "Approved",
              remarks: "Request approved for processing",
            }
          );
        } else if (dataType === "secondary") {
          // Make API call to update Secondary Data status
          response = await axios.patch(
            `${API_BASE_URL}/dcrs-proxy/secondary-data-requests/${requestId}/accept`,
            {},
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }

        console.log("Accept API Response:", response.data);

        // Update local state
        setRequests((prev) =>
          prev.map((req) =>
            req.id === requestId ? { ...req, status: "Approved" } : req
          )
        );

        // Show success message
        const requestTypeName = dataType === "agws" ? "weather" : dataType === "historical" ? "historical" : "secondary source";
        Swal.fire({
          title: "Request Accepted!",
          text: `The ${requestTypeName} data request has been successfully approved.`,
          icon: "success",
          confirmButtonColor: "#10b981",
          draggable: true,
        });

        // Refresh data from server to ensure sync
        if (dataType === "agws") {
          fetchCISRequests();
        } else if (dataType === "historical") {
          fetchHistoricalRequests();
        } else if (dataType === "secondary") {
          fetchSecondaryRequests();
        }
      } catch (error) {
        console.error("Error accepting request:", error);
        Swal.fire({
          title: "Error!",
          text:
            error.response?.data?.message ||
            "Failed to accept request. Please try again.",
          icon: "error",
          confirmButtonColor: "#ef4444",
        });
      }
    }
  };

  const handleRejectRequest = async (requestId, requestName) => {
    const requestTypeName = dataType === "agws" ? "weather" : dataType === "historical" ? "historical" : "secondary source";
    const result = await Swal.fire({
      title: "Reject Request?",
      text: `Are you sure you want to reject the ${requestTypeName} data request from ${requestName}?`,
      icon: "warning",
      input: "textarea",
      inputLabel: "Reason for rejection (required)",
      inputPlaceholder: "Enter the reason for rejecting this request...",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Reject!",
      cancelButtonText: "Cancel",
      inputValidator: (value) => {
        if (!value || value.trim() === '') {
          return 'Please provide a reason for rejection';
        }
      },
    });

    if (result.isConfirmed) {
      try {
        // Show loading
        Swal.fire({
          title: "Processing...",
          text: "Updating request status",
          allowOutsideClick: false,
          didOpen: () => {
            Swal.showLoading();
          },
        });

        const remarks = result.value || "Request rejected";

        let response;
        const token = localStorage.getItem("token");
        if (dataType === "agws") {
          // Make API call to update AgWS status
          response = await axios.put(
            `https://saads.brri.gov.bd/api/cis/${requestId}/status`,
            {
              status: "Rejected",
              remarks: remarks,
            }
          );
        } else if (dataType === "historical") {
          // Make API call to update Historical Data status
          response = await axios.put(
            `${API_BASE_URL}/historical-data-requests/${requestId}/status`,
            {
              status: "Rejected",
              remarks: remarks,
            }
          );
        } else if (dataType === "secondary") {
          // Make API call to update Secondary Data status
          response = await axios.patch(
            `${API_BASE_URL}/dcrs-proxy/secondary-data-requests/${requestId}/reject`,
            { rejectionReason: remarks },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }

        console.log("Reject API Response:", response.data);

        // Update local state
        setRequests((prev) =>
          prev.map((req) =>
            req.id === requestId ? { ...req, status: "Rejected" } : req
          )
        );

        // Show success message
        const requestTypeName = dataType === "agws" ? "weather" : dataType === "historical" ? "historical" : "secondary source";
        Swal.fire({
          title: "Request Rejected!",
          text: `The ${requestTypeName} data request has been rejected.`,
          icon: "success",
          confirmButtonColor: "#ef4444",
          draggable: true,
        });

        // Refresh data from server to ensure sync
        if (dataType === "agws") {
          fetchCISRequests();
        } else if (dataType === "historical") {
          fetchHistoricalRequests();
        } else if (dataType === "secondary") {
          fetchSecondaryRequests();
        }
      } catch (error) {
        console.error("Error rejecting request:", error);
        Swal.fire({
          title: "Error!",
          text:
            error.response?.data?.message ||
            "Failed to reject request. Please try again.",
          icon: "error",
          confirmButtonColor: "#ef4444",
        });
      }
    }
  };

  const handleAcceptSecondaryRequest = async (requestId, requestName) => {
    const result = await Swal.fire({
      title: "Accept Secondary Data Request?",
      text: `Are you sure you want to accept the secondary data request from ${requestName}?`,
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Accept",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        setProcessingId(requestId);
        const token = localStorage.getItem("token");
        const response = await axios.patch(
          `${API_BASE_URL}/dcrs-proxy/secondary-data-requests/${requestId}/accept`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          Swal.fire({
            icon: "success",
            title: "Request Accepted!",
            text: "The secondary data access request has been accepted successfully.",
            confirmButtonColor: "#10b981",
          });
          fetchSecondaryRequests();
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.response?.data?.message || "Failed to accept request",
          confirmButtonColor: "#ef4444",
        });
      } finally {
        setProcessingId(null);
      }
    }
  };

  const handleRejectSecondaryRequest = async (requestId, requestName) => {
    const result = await Swal.fire({
      title: "Reject Secondary Data Request",
      text: "Please provide a reason for rejecting this request:",
      input: "textarea",
      inputPlaceholder: "Enter rejection reason here...",
      inputAttributes: {
        "aria-label": "Enter rejection reason",
      },
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Reject Request",
      cancelButtonText: "Cancel",
      inputValidator: (value) => {
        if (!value) {
          return "You must provide a reason for rejection!";
        }
      },
    });

    if (result.isConfirmed) {
      try {
        setProcessingId(requestId);
        const token = localStorage.getItem("token");
        const response = await axios.patch(
          `${API_BASE_URL}/dcrs-proxy/secondary-data-requests/${requestId}/reject`,
          { rejectionReason: result.value },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          Swal.fire({
            icon: "success",
            title: "Request Rejected",
            text: "The secondary data access request has been rejected.",
            confirmButtonColor: "#10b981",
          });
          fetchSecondaryRequests();
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.response?.data?.message || "Failed to reject request",
          confirmButtonColor: "#ef4444",
        });
      } finally {
        setProcessingId(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="text-center mb-8 px-4">
          <h1 className="text-2xl md:text-4xl font-bold text-gray-800 mb-3 leading-tight">
            Climate Information Service
          </h1>

          {/* Data Type Selector - Tabs Style */}
          <div className="flex justify-center mt-6">
            <div className="inline-flex bg-gray-100 rounded-2xl p-1.5 shadow-inner">
              <button
                onClick={() => {
                  setDataType("agws");
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  dataType === "agws"
                    ? "bg-white text-primary shadow-lg shadow-primary/20 scale-[1.02]"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="text-lg">🌤️</span>
                <span className="hidden sm:inline">Agromet Weather Station</span>
                <span className="sm:hidden">AgWS</span>
              </button>
              <button
                onClick={() => {
                  setDataType("historical");
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  dataType === "historical"
                    ? "bg-white text-secondary shadow-lg shadow-secondary/20 scale-[1.02]"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="text-lg">📊</span>
                <span className="hidden sm:inline">Historical Climate Data</span>
                <span className="sm:hidden">Historical</span>
              </button>
              <button
                onClick={() => {
                  setDataType("secondary");
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 ${
                  dataType === "secondary"
                    ? "bg-white text-accent shadow-lg shadow-accent/20 scale-[1.02]"
                    : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                }`}
              >
                <span className="text-lg">📑</span>
                <span className="hidden sm:inline">Secondary Source Data</span>
                <span className="sm:hidden">Secondary</span>
              </button>
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <CISStats requests={requests} />

        {/* Charts */}
        <div>
          <div>
            <CISMonthlyChart />
          </div>
          <div>{/* chart 2 */}</div>
        </div>

        {/* Filters and Search */}
        <CISFilters
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
        />

        {/* Data Table */}
        <CISTableView
          loading={loading}
          error={error}
          currentItems={currentItems}
          dataType={dataType}
          getStatusBadge={getStatusBadge}
          formatDateTime={formatDateTime}
          handleViewRequest={handleViewRequest}
          handleAcceptRequest={handleAcceptRequest}
          handleRejectRequest={handleRejectRequest}
          handleAcceptSecondaryRequest={handleAcceptSecondaryRequest}
          handleRejectSecondaryRequest={handleRejectSecondaryRequest}
          fetchCISRequests={fetchCISRequests}
          totalPages={totalPages}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
      </div>

      {/* View Details Modal */}
      <CISRequestModal
        showViewModal={showViewModal}
        setShowViewModal={setShowViewModal}
        selectedRequest={selectedRequest}
        dataType={dataType}
        getStatusBadge={getStatusBadge}
        formatDate={formatDate}
        formatDateTime={formatDateTime}
        getTimeIntervalLabel={getTimeIntervalLabel}
        getDataAverageLabel={getDataAverageLabel}
        handleAcceptRequest={handleAcceptRequest}
        handleRejectRequest={handleRejectRequest}
        handleAcceptSecondaryRequest={handleAcceptSecondaryRequest}
        handleRejectSecondaryRequest={handleRejectSecondaryRequest}
      />
    </div>
  );
};
export default CISTable;
