import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { API_BASE_URL } from "../../config/api";

const DataAccessRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, [filterStatus]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      if (!token) {
        console.error("No token found in localStorage");
        Swal.fire({
          icon: "error",
          title: "Authentication Required",
          text: "Please log in to access this page",
          confirmButtonColor: "#ef4444",
        });
        setLoading(false);
        return;
      }
      
      const url = filterStatus === "all" 
        ? `${API_BASE_URL}/dcrs-proxy/secondary-data-requests`
        : `${API_BASE_URL}/dcrs-proxy/secondary-data-requests?status=${filterStatus}`;
      
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setRequests(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching requests:", error);
      
      let errorMessage = "Failed to load data access requests";
      if (error.response?.status === 401) {
        errorMessage = error.response?.data?.message || "Your session has expired. Please log in again.";
      }
      
      Swal.fire({
        icon: "error",
        title: "Error",
        text: errorMessage,
        confirmButtonColor: "#ef4444",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id) => {
    const result = await Swal.fire({
      title: "Accept Request?",
      text: "Are you sure you want to accept this data access request?",
      icon: "question",
      showCancelButton: true,
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, Accept",
      cancelButtonText: "Cancel",
    });

    if (result.isConfirmed) {
      try {
        setProcessingId(id);
        const token = localStorage.getItem("token");
        const response = await axios.patch(
          `${API_BASE_URL}/dcrs-proxy/secondary-data-requests/${id}/accept`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          Swal.fire({
            icon: "success",
            title: "Request Accepted!",
            text: "The data access request has been accepted successfully.",
            confirmButtonColor: "#10b981",
          });
          setIsModalOpen(false);
          fetchRequests();
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

  const handleReject = async (id) => {
    const result = await Swal.fire({
      title: "Reject Request",
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
        const token = localStorage.getItem("token");
        const response = await axios.patch(
          `${API_BASE_URL}/dcrs-proxy/secondary-data-requests/${id}/reject`,
          { rejectionReason: result.value },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          Swal.fire({
            icon: "success",
            title: "Request Rejected",
            text: "The data access request has been rejected.",
            confirmButtonColor: "#10b981",
          });
          setIsModalOpen(false);
          fetchRequests();
        }
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.response?.data?.message || "Failed to reject request",
          confirmButtonColor: "#ef4444",
        });
      }
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
      accepted: "bg-green-100 text-green-800 border-green-300",
      rejected: "bg-red-100 text-red-800 border-red-300",
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getDataSourceNames = (dataSources) => {
    const sourceMap = {
      "seasonal-rice": "Seasonal Rice",
      "varietal-rice": "Varietal Rice",
      "district-wise": "District Wise",
      "adoption-rate": "Rice Adoption Rate",
      "cropping-intensity": "Cropping Intensity",
      "export-import": "Export/Import",
      "faostat": "FAOStat",
    };

    return dataSources.map(ds => sourceMap[ds.id] || ds.id).join(", ");
  };

  const handleViewDetails = (request) => {
    setSelectedRequest(request);
    setIsModalOpen(true);
  };

  const filteredRequests = requests.filter(request => {
    const searchLower = searchTerm.toLowerCase();
    return (
      request.name.toLowerCase().includes(searchLower) ||
      request.email.toLowerCase().includes(searchLower) ||
      request.organization.toLowerCase().includes(searchLower)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#026666]/20 border-t-[#026666] rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">
          📋 Secondary Data Access Requests
        </h1>
        <p className="text-gray-600">
          Manage and review all secondary data access requests
        </p>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filter by Status
            </label>
            <div className="flex flex-wrap gap-2">
              {["all", "pending", "accepted", "rejected"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    filterStatus === status
                      ? "bg-[#026666] text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Search Requests
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by name, email, or organization..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#026666] focus:border-[#026666]"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <div className="text-2xl font-bold text-gray-800">{requests.length}</div>
            <div className="text-sm text-gray-600">Total Requests</div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-800">
              {requests.filter(r => r.status === "pending").length}
            </div>
            <div className="text-sm text-yellow-700">Pending</div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="text-2xl font-bold text-green-800">
              {requests.filter(r => r.status === "accepted").length}
            </div>
            <div className="text-sm text-green-700">Accepted</div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="text-2xl font-bold text-red-800">
              {requests.filter(r => r.status === "rejected").length}
            </div>
            <div className="text-sm text-red-700">Rejected</div>
          </div>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredRequests.length === 0 ? (
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 text-gray-300 mx-auto mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">No Requests Found</h3>
            <p className="text-gray-500">
              {searchTerm
                ? "No requests match your search criteria"
                : "There are no data access requests yet"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-[#026666] to-[#024444] text-white">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                    #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                    Organization
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                    Data Sources
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRequests.map((request, index) => (
                  <tr key={request.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-4 text-sm text-gray-500">
                      {index + 1}
                    </td>
                    <td className="px-4 py-4">
                      <div className="font-semibold text-gray-900">{request.name}</div>
                      <div className="text-xs text-gray-500">{request.email}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-900">{request.organization}</div>
                      <div className="text-xs text-gray-500">{request.designation}</div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-700">
                        {request.dataSources.length} source(s)
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="text-sm text-gray-700">
                        {new Date(request.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {getStatusBadge(request.status)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleViewDetails(request)}
                          className="px-2 py-1.5 bg-[#026666] text-white text-sm font-medium rounded hover:bg-[#024444] transition-colors"
                          title="View Details"
                        >
                          👁️
                        </button>
                        {request.status === "pending" && (
                          <>
                            <button
                              onClick={() => handleAccept(request.id)}
                              disabled={processingId === request.id}
                              className={`px-2 py-1.5 text-white text-sm font-medium rounded transition-colors min-w-[32px] flex items-center justify-center ${
                                processingId === request.id
                                  ? "bg-green-400 cursor-not-allowed"
                                  : "bg-green-600 hover:bg-green-700"
                              }`}
                              title={processingId === request.id ? "Processing..." : "Accept"}
                            >
                              {processingId === request.id ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                              ) : (
                                "✓"
                              )}
                            </button>
                            <button
                              onClick={() => handleReject(request.id)}
                              disabled={processingId === request.id}
                              className={`px-2 py-1.5 bg-red-600 text-white text-sm font-medium rounded hover:bg-red-700 transition-colors ${
                                processingId === request.id ? "opacity-50 cursor-not-allowed" : ""
                              }`}
                              title="Reject"
                            >
                              ✗
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {isModalOpen && selectedRequest && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-gradient-to-r from-[#026666] to-[#024444] text-white px-6 py-4 rounded-t-xl flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold">Request Details</h3>
                <p className="text-white/70 text-sm">ID: #{selectedRequest.id}</p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-all"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Status and Date */}
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Status</p>
                  {getStatusBadge(selectedRequest.status)}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Submitted</p>
                  <p className="text-sm font-semibold text-gray-900">{formatDate(selectedRequest.createdAt)}</p>
                  {selectedRequest.processedAt && (
                    <>
                      <p className="text-sm text-gray-600 mt-2">Processed</p>
                      <p className="text-sm font-semibold text-gray-900">{formatDate(selectedRequest.processedAt)}</p>
                    </>
                  )}
                </div>
              </div>

              {/* Requester Information */}
              <div>
                <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span>👤</span> Requester Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Full Name</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedRequest.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Designation</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedRequest.designation}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Organization</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedRequest.organization}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Address</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedRequest.address}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Email</p>
                    <p className="text-sm font-semibold text-[#026666]">{selectedRequest.email}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Mobile</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedRequest.mobile}</p>
                  </div>
                </div>
              </div>

              {/* Data Sources Requested */}
              <div>
                <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span>📊</span> Data Sources Requested
                </h4>
                <div className="space-y-3">
                  {selectedRequest.dataSources.map((source, index) => (
                    <div key={index} className="bg-[#026666]/10 border border-[#026666]/20 p-4 rounded-lg">
                      <h5 className="font-semibold text-[#026666] mb-2">
                        {getDataSourceNames([source])}
                      </h5>
                      {source.filters && Object.keys(source.filters).length > 0 && (
                        <div className="text-sm text-gray-700 space-y-1">
                          {Object.entries(source.filters).map(([key, value]) => (
                            <div key={key} className="flex gap-2">
                              <span className="font-medium capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</span>
                              <span className="text-gray-600">
                                {Array.isArray(value) ? value.join(", ") : value || "All"}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Request Settings */}
              <div>
                <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span>⚙️</span> Request Settings
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Data Requirements (Year)</p>
                    <p className="text-sm font-semibold text-gray-900">{selectedRequest.timeInterval}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Data Average</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedRequest.dataAverage || "Not specified"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 mb-1">Download Formats</p>
                    <p className="text-sm font-semibold text-gray-900">
                      {selectedRequest.downloadFormats.join(", ").toUpperCase()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Purpose */}
              <div>
                <h4 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                  <span>📝</span> Purpose of Request
                </h4>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedRequest.purpose}</p>
                </div>
              </div>

              {/* Rejection Reason (if rejected) */}
              {selectedRequest.status === "rejected" && selectedRequest.rejectionReason && (
                <div>
                  <h4 className="text-lg font-bold text-red-800 mb-3 flex items-center gap-2">
                    <span>❌</span> Rejection Reason
                  </h4>
                  <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                    <p className="text-sm text-red-900">{selectedRequest.rejectionReason}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer with Actions */}
            {selectedRequest.status === "pending" && (
              <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-xl flex justify-end gap-3 border-t">
                <button
                  onClick={() => setIsModalOpen(false)}
                  disabled={processingId === selectedRequest.id}
                  className={`px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-all ${
                    processingId === selectedRequest.id ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  Close
                </button>
                <button
                  onClick={() => handleReject(selectedRequest.id)}
                  disabled={processingId === selectedRequest.id}
                  className={`px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium transition-all shadow-md hover:shadow-lg ${
                    processingId === selectedRequest.id ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  ✗ Reject Request
                </button>
                <button
                  onClick={() => handleAccept(selectedRequest.id)}
                  disabled={processingId === selectedRequest.id}
                  className={`px-6 py-2.5 text-white rounded-lg font-medium transition-all shadow-md hover:shadow-lg flex items-center gap-2 min-w-[160px] justify-center ${
                    processingId === selectedRequest.id
                      ? "bg-green-400 cursor-not-allowed"
                      : "bg-green-600 hover:bg-green-700"
                  }`}
                >
                  {processingId === selectedRequest.id ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <span>✓</span>
                      <span>Accept Request</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DataAccessRequests;
