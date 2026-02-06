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
    <div className="min-h-screen bg-gray-50/50 p-3 sm:p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-5">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 md:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-linear-to-br from-[#0a3d3d] to-[#0d5555] flex items-center justify-center shrink-0">
                <ChatBubbleLeftRightIcon className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-900">User Feedbacks</h1>
                <p className="text-xs sm:text-sm text-gray-500 mt-0.5 hidden sm:block">View and manage all user feedbacks</p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="bg-teal-50 rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 text-center border border-teal-100">
                <p className="text-lg sm:text-xl font-bold text-[#0d4a4a]">{avgRating}</p>
                <p className="text-[10px] sm:text-xs text-gray-500">Avg Rating</p>
              </div>
              <div className="bg-gray-50 rounded-xl px-3 py-2 sm:px-4 sm:py-2.5 text-center border border-gray-100">
                <p className="text-lg sm:text-xl font-bold text-gray-800">{totalRecords}</p>
                <p className="text-[10px] sm:text-xs text-gray-500">Total</p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-5">
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-start sm:items-center">
            <label className="text-xs sm:text-sm font-medium text-gray-600 shrink-0">Filter by Rating:</label>
            <div className="flex flex-wrap gap-1.5 sm:gap-2 flex-1">
              <button
                onClick={() => { setRatingFilter(""); setCurrentPage(1); }}
                className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                  ratingFilter === ""
                    ? "bg-[#0d4a4a] text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                All
              </button>
              {[5, 4, 3, 2, 1].map((r) => (
                <button
                  key={r}
                  onClick={() => { setRatingFilter(r.toString()); setCurrentPage(1); }}
                  className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg text-xs sm:text-sm font-medium transition-all flex items-center gap-1 ${
                    ratingFilter === r.toString()
                      ? "bg-[#0d4a4a] text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {r} <StarIcon className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-yellow-400" />
                </button>
              ))}
            </div>
            <button
              onClick={fetchFeedbacks}
              className="px-3 py-1.5 sm:px-4 sm:py-2 bg-[#0d4a4a] hover:bg-[#0a3d3d] text-white text-xs sm:text-sm rounded-lg transition-colors flex items-center gap-1.5 shrink-0"
            >
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>

        {/* Feedbacks Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16">
              <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-[3px] border-gray-200 border-t-[#0d4a4a] mb-3 sm:mb-4" />
              <p className="text-xs sm:text-sm text-gray-500">Loading feedbacks...</p>
            </div>
          ) : feedbacks.length === 0 ? (
            <div className="text-center py-12 sm:py-16 px-4">
              <ChatBubbleLeftRightIcon className="w-12 h-12 sm:w-16 sm:h-16 text-gray-200 mx-auto mb-3 sm:mb-4" />
              <p className="text-sm sm:text-base text-gray-600 font-medium">No feedbacks found</p>
              <p className="text-xs sm:text-sm text-gray-400 mt-1">
                {ratingFilter ? "Try a different rating filter" : "No users have submitted feedback yet"}
              </p>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block md:hidden divide-y divide-gray-100">
                {feedbacks.map((fb) => (
                  <div key={fb.id} className="p-3 sm:p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">{fb.userName}</p>
                        <p className="text-xs text-gray-400 truncate">{fb.userEmail}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => handleView(fb)} className="p-1.5 text-gray-400 hover:text-[#0d4a4a] hover:bg-teal-50 rounded-lg transition-colors">
                          <EyeIcon className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(fb.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      {renderStars(fb.rating)}
                      <span className="text-[10px] text-gray-400">({getRatingLabel(fb.rating)})</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-2 line-clamp-2">{fb.feedback}</p>
                    <p className="text-[10px] text-gray-400 mt-2">
                      {new Date(fb.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                    </p>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50/80 border-b border-gray-100">
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">User</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Rating</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Feedback</th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Date</th>
                      <th className="text-center px-5 py-3.5 text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {feedbacks.map((fb) => (
                      <tr key={fb.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <p className="text-sm font-medium text-gray-900">{fb.userName}</p>
                          <p className="text-xs text-gray-400">{fb.userEmail}</p>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            {renderStars(fb.rating)}
                            <span className="text-xs text-gray-400">({getRatingLabel(fb.rating)})</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-sm text-gray-600 truncate max-w-xs" title={fb.feedback}>
                            {fb.feedback.length > 60 ? fb.feedback.substring(0, 60) + "..." : fb.feedback}
                          </p>
                        </td>
                        <td className="px-5 py-3.5">
                          <p className="text-sm text-gray-600">
                            {new Date(fb.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(fb.createdAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center justify-center gap-1">
                            <button onClick={() => handleView(fb)} className="p-2 text-gray-400 hover:text-[#0d4a4a] hover:bg-teal-50 rounded-lg transition-colors" title="View Details">
                              <EyeIcon className="w-4.5 h-4.5" />
                            </button>
                            <button onClick={() => handleDelete(fb.id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                              <TrashIcon className="w-4.5 h-4.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="px-3 sm:px-5 py-3 sm:py-4 bg-gray-50/50 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
                <p className="text-[10px] sm:text-xs text-gray-500 order-2 sm:order-1">
                  Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, totalRecords)} of {totalRecords}
                </p>
                <div className="flex items-center gap-1 sm:gap-1.5 order-1 sm:order-2">
                  <button
                    onClick={() => setCurrentPage(1)}
                    disabled={currentPage === 1}
                    className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    First
                  </button>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Prev
                  </button>
                  <span className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium bg-[#0d4a4a] text-white rounded-lg">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => setCurrentPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-2 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={closeModal} />
          <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-linear-to-r from-[#0a3d3d] to-[#0d5555] px-4 sm:px-5 py-3.5 sm:py-4 rounded-t-2xl flex items-center justify-between">
              <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                <ChatBubbleLeftRightIcon className="w-5 h-5 text-teal-200" />
                Feedback Details
              </h3>
              <button
                onClick={closeModal}
                className="text-teal-200/70 hover:text-white hover:bg-white/10 rounded-lg p-1.5 transition-all"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-5 space-y-3 sm:space-y-4">
              <div className="bg-gray-50/80 rounded-xl p-3 sm:p-4 border border-gray-100">
                <p className="text-[10px] sm:text-xs font-medium text-gray-400 uppercase tracking-wide">User</p>
                <p className="text-sm font-semibold text-gray-900 mt-1">{selectedFeedback.userName}</p>
                <p className="text-xs text-gray-500">{selectedFeedback.userEmail}</p>
              </div>

              <div className="bg-gray-50/80 rounded-xl p-3 sm:p-4 border border-gray-100">
                <p className="text-[10px] sm:text-xs font-medium text-gray-400 uppercase tracking-wide">Rating</p>
                <div className="flex items-center gap-2 sm:gap-3 mt-1.5">
                  {renderStars(selectedFeedback.rating)}
                  <span className="text-base sm:text-lg font-bold text-gray-800">{selectedFeedback.rating}/5</span>
                  <span className="text-xs font-medium text-[#0d4a4a] bg-teal-50 px-2 py-0.5 rounded-full border border-teal-100">
                    {getRatingLabel(selectedFeedback.rating)}
                  </span>
                </div>
              </div>

              <div className="bg-gray-50/80 rounded-xl p-3 sm:p-4 border border-gray-100">
                <p className="text-[10px] sm:text-xs font-medium text-gray-400 uppercase tracking-wide">Feedback</p>
                <p className="text-sm text-gray-700 mt-1.5 leading-relaxed whitespace-pre-wrap">
                  {selectedFeedback.feedback}
                </p>
              </div>

              <div className="bg-gray-50/80 rounded-xl p-3 sm:p-4 border border-gray-100">
                <p className="text-[10px] sm:text-xs font-medium text-gray-400 uppercase tracking-wide">Submitted On</p>
                <p className="text-sm text-gray-700 mt-1">
                  {new Date(selectedFeedback.createdAt).toLocaleDateString("en-US", {
                    weekday: "long", year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
                  })}
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-2 sm:gap-3 px-4 sm:px-5 py-3 sm:py-4 border-t border-gray-100 bg-gray-50/50 rounded-b-2xl">
              <button
                onClick={() => { handleDelete(selectedFeedback.id); closeModal(); }}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-red-500 hover:bg-red-600 text-white text-xs sm:text-sm rounded-lg transition-colors flex items-center gap-1.5"
              >
                <TrashIcon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Delete
              </button>
              <button
                onClick={closeModal}
                className="px-3 sm:px-4 py-1.5 sm:py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 text-xs sm:text-sm rounded-lg transition-colors"
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
