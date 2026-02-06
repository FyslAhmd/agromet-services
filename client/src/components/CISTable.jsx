import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import CISMonthlyChart from "./CISMonthlyChart";
import { API_BASE_URL } from "../config/api";

const CISTable = () => {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dataType, setDataType] = useState("agws"); // "agws" or "historical"
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  // Sample data - replace with actual API call
  useEffect(() => {
    if (dataType === "agws") {
      fetchCISRequests();
    } else {
      fetchHistoricalRequests();
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
  const currentItems = filteredRequests.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
  const totalPages = Math.ceil(filteredRequests.length / itemsPerPage);

  // Helper functions
  const formatDate = (dateString) => {
    if (!dateString || dateString === null) {
      return 'N/A';
    }
    return new Date(dateString).toLocaleDateString("en-BD", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString("en-BD", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "Pending":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
            {/* <div className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-2"></div> */}
            Pending
          </span>
        );
      case "Approved":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
            {/* <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mr-2"></div> */}
            Approved
          </span>
        );
      case "Rejected":
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200">
            {/* <div className="w-1.5 h-1.5 bg-red-500 rounded-full mr-2"></div> */}
            Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 border border-gray-200">
            <div className="w-1.5 h-1.5 bg-gray-500 rounded-full mr-2"></div>
            Unknown
          </span>
        );
    }
  };

  const getTimeIntervalLabel = (interval) => {
    const labels = {
      // AgWS labels
      day: "1 Day",
      week: "1 Week",
      month: "1 Month",
      "3month": "3 Months",
      "6month": "6 Months",
      "1year": "1 Year",
      all: "All Data",
      // Historical Data labels
      "1D": "1 Day",
      "1W": "1 Week",
      "1M": "1 Month",
      "3M": "3 Months",
      "6M": "6 Months",
      "1Y": "1 Year",
      "5Y": "5 Years",
      "10Y": "10 Years",
      "20Y": "20 Years",
      "30Y": "30 Years",
      "50Y": "50 Years",
      "All": "All Data",
    };
    return labels[interval] || interval;
  };

  const getDataAverageLabel = (average) => {
    const labels = {
      none: "None (Raw Data)",
      "1W": "Weekly Average",
      "1M": "Monthly Average",
      "3M": "3-Month Average",
      "6M": "6-Month Average",
      "1Y": "Yearly Average",
      "5Y": "5-Year Average",
      "10Y": "10-Year Average",
      "20Y": "20-Year Average",
      "30Y": "30-Year Average",
    };
    return labels[average] || average;
  };

  // Action handlers
  const handleViewRequest = (request) => {
    setSelectedRequest(request);
    setShowViewModal(true);
  };

  const handleAcceptRequest = async (requestId, requestName) => {
    const result = await Swal.fire({
      title: "Accept Request?",
      text: `Are you sure you want to accept the ${dataType === "agws" ? "weather" : "historical"} data request from ${requestName}?`,
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
        if (dataType === "agws") {
          // Make API call to update AgWS status
          response = await axios.put(
            `https://saads.brri.gov.bd/api/cis/${requestId}/status`,
            {
              status: "Approved",
              remarks: "Request approved for processing",
            }
          );
        } else {
          // Make API call to update Historical Data status
          response = await axios.put(
            `${API_BASE_URL}/historical-data-requests/${requestId}/status`,
            {
              status: "Approved",
              remarks: "Request approved for processing",
            }
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
        Swal.fire({
          title: "Request Accepted!",
          text: `The ${dataType === "agws" ? "weather" : "historical"} data request has been successfully approved.`,
          icon: "success",
          confirmButtonColor: "#10b981",
          draggable: true,
        });

        // Refresh data from server to ensure sync
        if (dataType === "agws") {
          fetchCISRequests();
        } else {
          fetchHistoricalRequests();
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
    const result = await Swal.fire({
      title: "Reject Request?",
      text: `Are you sure you want to reject the ${dataType === "agws" ? "weather" : "historical"} data request from ${requestName}?`,
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
        if (dataType === "agws") {
          // Make API call to update AgWS status
          response = await axios.put(
            `https://saads.brri.gov.bd/api/cis/${requestId}/status`,
            {
              status: "Rejected",
              remarks: remarks,
            }
          );
        } else {
          // Make API call to update Historical Data status
          response = await axios.put(
            `${API_BASE_URL}/historical-data-requests/${requestId}/status`,
            {
              status: "Rejected",
              remarks: remarks,
            }
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
        Swal.fire({
          title: "Request Rejected!",
          text: `The ${dataType === "agws" ? "weather" : "historical"} data request has been rejected.`,
          icon: "success",
          confirmButtonColor: "#ef4444",
          draggable: true,
        });

        // Refresh data from server to ensure sync
        if (dataType === "agws") {
          fetchCISRequests();
        } else {
          fetchHistoricalRequests();
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
            </div>
          </div>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="stat bg-base-100 shadow-lg rounded-lg p-3 md:p-4">
            <div className="stat-figure text-primary hidden md:block">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div className="stat-title text-xs md:text-sm">Total Requests</div>
            <div className="stat-value text-primary text-2xl md:text-4xl">{requests.length}</div>
            <div className="stat-desc text-[10px] md:text-xs">All time submissions</div>
          </div>

          <div className="stat bg-base-100 shadow-lg rounded-lg p-3 md:p-4">
            <div className="stat-figure text-warning hidden md:block">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="stat-title text-xs md:text-sm">Pending</div>
            <div className="stat-value text-warning text-2xl md:text-4xl">
              {requests.filter((r) => r.status === "Pending").length}
            </div>
            <div className="stat-desc text-[10px] md:text-xs">Awaiting review</div>
          </div>

          <div className="stat bg-base-100 shadow-lg rounded-lg p-3 md:p-4">
            <div className="stat-figure text-success hidden md:block">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="stat-title text-xs md:text-sm">Approved</div>
            <div className="stat-value text-success text-2xl md:text-4xl">
              {requests.filter((r) => r.status === "Approved").length}
            </div>
            <div className="stat-desc text-[10px] md:text-xs">Successfully processed</div>
          </div>

          <div className="stat bg-base-100 shadow-lg rounded-lg p-3 md:p-4">
            <div className="stat-figure text-error hidden md:block">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div className="stat-title text-xs md:text-sm">Rejected</div>
            <div className="stat-value text-error text-2xl md:text-4xl">
              {requests.filter((r) => r.status === "Rejected").length}
            </div>
            <div className="stat-desc text-[10px] md:text-xs">Declined requests</div>
          </div>
        </div>

        {/* charts */}
        <div>
          <div>
            <CISMonthlyChart />
          </div>
          <div>{/* chart 2 */}</div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="p-6">
            <div className="flex flex-col lg:flex-row gap-6 items-stretch lg:items-center justify-between">
              {/* Search */}
              <div className="flex-1 max-w-md">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Requests
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name, organization, email..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="m21 21-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Status Filter */}
              <div className="flex flex-col">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by Status
                </label>
                <select
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-35"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            // Loading State
            <div className="flex justify-center items-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                <p className="text-gray-600 font-medium">
                  Loading CIS requests...
                </p>
              </div>
            </div>
          ) : error ? (
            // Error State
            <div className="flex justify-center items-center py-12">
              <div className="flex flex-col items-center space-y-4 max-w-md text-center">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-8 w-8 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-red-600 font-medium mb-2">
                    Failed to load requests
                  </p>
                  <p className="text-gray-500 text-sm">{error}</p>
                </div>
                <button
                  onClick={fetchCISRequests}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            </div>
          ) : (
            // Data Table Content
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Organization
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Submit Time
                    </th>
                    <th className="px-6 py-4 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentItems.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-8 w-8 text-gray-400"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                              />
                            </svg>
                          </div>
                          <p className="text-gray-500 text-lg font-medium">
                            No requests found
                          </p>
                          <p className="text-gray-400 text-sm mt-1">
                            Try adjusting your search or filter criteria
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    currentItems.map((request, index) => (
                      <tr
                        key={request.id}
                        className="hover:bg-gray-50 transition-colors duration-150"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {request.name}
                              </div>
                              <div className="text-sm text-gray-500">
                                {request.designation}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-center">
                          <div className="text-sm text-gray-900">
                            {request.organization}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(request.status)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {formatDateTime(request.submitTime)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center space-x-2">
                            {/* View Button */}
                            <button
                              className="inline-flex items-center px-3 py-2 shadow-sm text-sm leading-4 font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                              onClick={() => handleViewRequest(request)}
                              title="View Details"
                            >
                              <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="h-4 w-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                                />
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth="2"
                                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                                />
                              </svg>
                            </button>

                            {/* Accept Button */}
                            {request.status === "Pending" && (
                              <button
                                className="inline-flex items-center px-3 py-2 text-sm leading-4 font-medium rounded-lg text-black bg-green-300 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200 shadow-sm"
                                onClick={() =>
                                  handleAcceptRequest(request.id, request.name)
                                }
                                title="Accept Request"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </button>
                            )}

                            {/* Reject Button */}
                            {request.status === "Pending" && (
                              <button
                                className="inline-flex items-center px-3 py-2 text-sm leading-4 font-medium rounded-lg text-black bg-red-400 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200 shadow-sm"
                                onClick={() =>
                                  handleRejectRequest(request.id, request.name)
                                }
                                title="Reject Request"
                              >
                                <svg
                                  xmlns="http://www.w3.org/2000/svg"
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M6 18L18 6M6 6l12 12"
                                  />
                                </svg>
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Previous
              </button>

              <div className="flex gap-1">
                {Array.from({ length: totalPages }, (_, index) => (
                  <button
                    key={index + 1}
                    className={`inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                      currentPage === index + 1
                        ? "bg-blue-600 text-white border border-blue-600"
                        : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    }`}
                    onClick={() => setCurrentPage(index + 1)}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>

              <button
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 ml-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* View Details Modal */}
      {showViewModal && selectedRequest && (
        <div className="modal modal-open">
          <div className="modal-box max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              {dataType === "agws" ? "Weather Data Request Details" : "Historical Climate Data Request Details"}
              <div className="ml-auto">
                {getStatusBadge(selectedRequest.status)}
              </div>
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="card bg-base-200">
                <div className="card-body p-4">
                  <h4 className="card-title text-base mb-3 flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-primary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Personal Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-600">
                        Full Name
                      </span>
                      <span className="text-base font-semibold">
                        {selectedRequest.name}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-600">
                        Designation
                      </span>
                      <span className="text-base">
                        {selectedRequest.designation}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-600">
                        Organization
                      </span>
                      <span className="text-base">
                        {selectedRequest.organization}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-600">
                        Address
                      </span>
                      <span className="text-base">
                        {selectedRequest.address}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="card bg-base-200">
                <div className="card-body p-4">
                  <h4 className="card-title text-base mb-3 flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-secondary"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    Contact Information
                  </h4>
                  <div className="space-y-3">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-600">
                        Email Address
                      </span>
                      <span className="text-base break-all">
                        {selectedRequest.email}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-600">
                        Mobile Number
                      </span>
                      <span className="text-base">
                        {selectedRequest.mobile}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-600">
                        Request Submitted
                      </span>
                      <span className="text-base">
                        {formatDateTime(selectedRequest.submitTime)}
                      </span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-600">
                        Request ID
                      </span>
                      <span className="text-base font-mono">
                        #{selectedRequest.id.toString().padStart(6, "0")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Weather Stations */}
            <div className="card bg-base-200 mt-6">
              <div className="card-body p-4">
                <h4 className="card-title text-base mb-3 flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-accent"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                    />
                  </svg>
                  {dataType === "agws" ? "Selected Weather Stations" : "Selected Research Stations"} (
                  {selectedRequest.selectedStations?.length || 0})
                </h4>
                <div className="flex flex-wrap gap-2">
                  {(selectedRequest.selectedStations || []).map((station, index) => (
                    <div
                      key={index}
                      className="badge badge-outline badge-lg p-3"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      {station}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Weather/Climate Parameters */}
            <div className="card bg-base-200 mt-6">
              <div className="card-body p-4">
                <h4 className="card-title text-base mb-3 flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-warning"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                    />
                  </svg>
                  {dataType === "agws" ? "Weather Parameters" : "Climate Parameters"} (
                  {selectedRequest.selectedWeatherParameters?.length || 0})
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {(selectedRequest.selectedWeatherParameters || []).map(
                    (parameter, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-3 bg-base-100 rounded-lg border"
                      >
                        <div className="w-8 h-8 bg-warning/20 rounded-full flex items-center justify-center">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-4 w-4 text-warning"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M13 10V3L4 14h7v7l9-11h-7z"
                            />
                          </svg>
                        </div>
                        <span className="text-sm font-medium">{parameter}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Data Formats */}
            <div className="card bg-base-200 mt-6">
              <div className="card-body p-4">
                <h4 className="card-title text-base mb-3 flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-primary"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  Required Data Formats (
                  {selectedRequest.selectedDataFormats?.length || 0})
                </h4>
                <div className="flex flex-wrap gap-3">
                  {selectedRequest.selectedDataFormats?.map((format, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 p-3 bg-base-100 rounded-lg border border-primary/20"
                    >
                      <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                        {format === "CSV" && (
                          <span className="text-lg">📊</span>
                        )}
                        {format === "Image" && (
                          <span className="text-lg">📈</span>
                        )}
                        {format === "Table" && (
                          <span className="text-lg">📋</span>
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">{format}</span>
                        <span className="text-xs text-gray-500">
                          {format === "CSV" && "Raw Data"}
                          {format === "Image" && "Chart Image"}
                          {format === "Table" && "Formatted Table"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Remarks Section - Only show for Approved or Rejected */}
            {(selectedRequest.status === "Approved" || selectedRequest.status === "Rejected") && selectedRequest.remarks && (
              <div className="card bg-base-200 mt-6">
                <div className="card-body p-4">
                  <h4 className="card-title text-base mb-3 flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-warning"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                      />
                    </svg>
                    {selectedRequest.status === "Approved" ? "Approval" : "Rejection"} Remarks
                  </h4>
                  <div className={`p-4 rounded-lg ${
                    selectedRequest.status === "Approved" 
                      ? "bg-green-50 border border-green-200" 
                      : "bg-red-50 border border-red-200"
                  }`}>
                    <p className={`text-sm ${
                      selectedRequest.status === "Approved" 
                        ? "text-green-800" 
                        : "text-red-800"
                    }`}>
                      {selectedRequest.remarks}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Date Range and Intervals */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <div className="card bg-base-200">
                <div className="card-body p-4">
                  <h4 className="card-title text-base mb-3 flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-info"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    Date Range
                  </h4>
                  <div className="space-y-3">
                    {selectedRequest.startDate && selectedRequest.endDate ? (
                      <>
                        <div className="flex items-center justify-between p-3 bg-base-100 rounded">
                          <span className="text-sm font-medium">From:</span>
                          <span className="text-base font-semibold">
                            {formatDate(selectedRequest.startDate)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-base-100 rounded">
                          <span className="text-sm font-medium">To:</span>
                          <span className="text-base font-semibold">
                            {formatDate(selectedRequest.endDate)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-info/10 rounded border border-info/20">
                          <span className="text-sm font-medium">Duration:</span>
                          <span className="text-base font-semibold text-info">
                            {Math.ceil(
                              (new Date(selectedRequest.endDate) -
                                new Date(selectedRequest.startDate)) /
                                (1000 * 60 * 60 * 24)
                            )}{" "}
                            days
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-base-100 rounded">
                        <span className="text-sm font-medium">Date Range:</span>
                        <span className="text-base font-semibold text-gray-500 italic">
                          Using preset time interval
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="card bg-base-200">
                <div className="card-body p-4">
                  <h4 className="card-title text-base mb-3 flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-success"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Data Intervals
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-base-100 rounded">
                      <span className="text-sm font-medium">
                        Time Interval:
                      </span>
                      <span className="badge badge-info">
                        {getTimeIntervalLabel(selectedRequest.timeInterval)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-base-100 rounded">
                      <span className="text-sm font-medium">
                        {dataType === "agws" ? "Data Interval:" : "Data Average:"}
                      </span>
                      <span className="badge badge-success">
                        {dataType === "agws" 
                          ? `${selectedRequest.dataInterval} Hours`
                          : getDataAverageLabel(selectedRequest.dataInterval)
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="modal-action mt-8">
              <div className="flex gap-2 flex-wrap">
                {selectedRequest.status === "Pending" && (
                  <>
                    <button
                      className="btn btn-success"
                      onClick={() => {
                        handleAcceptRequest(
                          selectedRequest.id,
                          selectedRequest.name
                        );
                        setShowViewModal(false);
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Accept Request
                    </button>
                    <button
                      className="btn btn-error"
                      onClick={() => {
                        handleRejectRequest(
                          selectedRequest.id,
                          selectedRequest.name
                        );
                        setShowViewModal(false);
                      }}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                      Reject Request
                    </button>
                  </>
                )}
                <button
                  className="btn btn-ghost"
                  onClick={() => setShowViewModal(false)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CISTable;
