import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";
import { StarIcon } from "@heroicons/react/24/solid";
import { TrashIcon, ChatBubbleLeftRightIcon, EyeIcon, XMarkIcon } from "@heroicons/react/24/outline";

const FeedbackManagement = () => {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [ratingFilter, setRatingFilter] = useState("");
  const [pageSize] = useState(20);
  const [selectedFeedback, setSelectedFeedback] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      const params = new URLSearchParams();
      params.append("page", currentPage);
      params.append("limit", pageSize);
      if (ratingFilter) params.append("rating", ratingFilter);

      const response = await axios.get(`${API_BASE_URL}/feedbacks?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setFeedbacks(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
        setTotalRecords(response.data.pagination.total);
      }
    } catch (error) {
      console.error("Error fetching feedbacks:", error);
      toast.error("Failed to fetch feedbacks");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedbacks();
  }, [currentPage, ratingFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this feedback?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API_BASE_URL}/feedbacks/${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      toast.success("Feedback deleted successfully");
      fetchFeedbacks();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete feedback");
    }
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((value) => (
          <StarIcon
            key={value}
            className={`w-4 h-4 ${value <= rating ? "text-yellow-400" : "text-gray-300"}`}
          />
        ))}
      </div>
    );
  };

  const getRatingLabel = (rating) => {
    const labels = {
      1: "Poor",
      2: "Fair",
      3: "Good",
      4: "Very Good",
      5: "Excellent",
    };
    return labels[rating] || "";
  };

  const handleView = (feedback) => {
    setSelectedFeedback(feedback);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedFeedback(null);
  };

  // Calculate average rating
  const avgRating =
    feedbacks.length > 0
      ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
      : 0;

  // Count by rating
  const ratingCounts = feedbacks.reduce((acc, f) => {
    acc[f.rating] = (acc[f.rating] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 to-gray-100 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
                <ChatBubbleLeftRightIcon className="w-8 h-8 text-[#026666]" />
                User Feedbacks
              </h1>
              <p className="text-gray-600 mt-1">View and manage all user feedbacks</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="bg-[#026666]/10 rounded-lg px-4 py-2 text-center">
                <p className="text-2xl font-bold text-[#026666]">{avgRating}</p>
                <p className="text-xs text-gray-600">Avg Rating</p>
              </div>
              <div className="bg-gray-100 rounded-lg px-4 py-2 text-center">
                <p className="text-2xl font-bold text-gray-800">{totalRecords}</p>
                <p className="text-xs text-gray-600">Total</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
            <label className="text-sm font-medium text-gray-700">Filter by Rating:</label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setRatingFilter("");
                  setCurrentPage(1);
                }}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  ratingFilter === ""
                    ? "bg-[#026666] text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              {[5, 4, 3, 2, 1].map((r) => (
                <button
                  key={r}
                  onClick={() => {
                    setRatingFilter(r.toString());
                    setCurrentPage(1);
                  }}
                  className={`px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-1 ${
                    ratingFilter === r.toString()
                      ? "bg-[#026666] text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {r} <StarIcon className="w-4 h-4 text-yellow-400" />
                </button>
              ))}
            </div>
            <button
              onClick={fetchFeedbacks}
              className="ml-auto px-4 py-2 bg-[#026666] hover:bg-[#024444] text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Feedbacks Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-[#026666] mb-4"></div>
              <p className="text-gray-600">Loading feedbacks...</p>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-16">
              <ChatBubbleLeftRightIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600 text-lg">No feedbacks found</p>
              <p className="text-gray-500 text-sm mt-2">
                {ratingFilter ? "Try a different rating filter" : "No users have submitted feedback yet"}
              </p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">User</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Rating</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Feedback</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold text-gray-700">Date</th>
                      <th className="text-center px-6 py-4 text-sm font-semibold text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {feedbacks.map((fb) => (
                      <tr key={fb.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">{fb.userName}</p>
                            <p className="text-xs text-gray-500">{fb.userEmail}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            {renderStars(fb.rating)}
                            <span className="text-xs text-gray-600 hidden sm:inline">({getRatingLabel(fb.rating)})</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-gray-700 text-sm truncate max-w-xs" title={fb.feedback}>
                            {fb.feedback.length > 60 ? fb.feedback.substring(0, 60) + "..." : fb.feedback}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600">
                            {new Date(fb.createdAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(fb.createdAt).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => handleView(fb)}
                              className="p-2 text-gray-500 hover:text-[#026666] hover:bg-[#026666]/10 rounded-lg transition-colors"
                              title="View Details"
                            >
                              <EyeIcon className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDelete(fb.id)}
                              className="p-2 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Showing {(currentPage - 1) * pageSize + 1} to{" "}
                  {Math.min(currentPage * pageSize, totalRecords)} of {totalRecords} feedbacks
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>

                  <div className="flex items-center gap-2 px-4 py-2 bg-[#026666] text-white rounded-lg">
                    <span className="text-sm font-medium">
                      Page {currentPage} of {totalPages}
                    </span>
                  </div>

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Last
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* View Feedback Modal */}
      {showModal && selectedFeedback && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <ChatBubbleLeftRightIcon className="w-6 h-6 text-[#026666]" />
                Feedback Details
              </h3>
              <button
                onClick={closeModal}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <XMarkIcon className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-5">
              {/* User Info */}
              <div className="bg-gray-50 rounded-xl p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">User</label>
                <p className="font-semibold text-gray-900 mt-1">{selectedFeedback.userName}</p>
                <p className="text-sm text-gray-600">{selectedFeedback.userEmail}</p>
              </div>

              {/* Rating */}
              <div className="bg-gray-50 rounded-xl p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Rating</label>
                <div className="flex items-center gap-3 mt-2">
                  {renderStars(selectedFeedback.rating)}
                  <span className="text-lg font-semibold text-gray-800">
                    {selectedFeedback.rating}/5
                  </span>
                  <span className="text-sm text-gray-600 bg-[#026666]/10 px-2 py-1 rounded-full">
                    {getRatingLabel(selectedFeedback.rating)}
                  </span>
                </div>
              </div>

              {/* Feedback Text */}
              <div className="bg-gray-50 rounded-xl p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Feedback</label>
                <p className="text-gray-700 mt-2 leading-relaxed whitespace-pre-wrap">
                  {selectedFeedback.feedback}
                </p>
              </div>

              {/* Date */}
              <div className="bg-gray-50 rounded-xl p-4">
                <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Submitted On</label>
                <p className="text-gray-700 mt-1">
                  {new Date(selectedFeedback.createdAt).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  handleDelete(selectedFeedback.id);
                  closeModal();
                }}
                className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <TrashIcon className="w-4 h-4" />
                Delete
              </button>
              <button
                onClick={closeModal}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeedbackManagement;
