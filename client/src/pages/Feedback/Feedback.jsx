import React, { useState } from "react";
import { toast } from "react-hot-toast";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";
import { useAuthContext } from "../../components/context/AuthProvider";
import { StarIcon } from "@heroicons/react/24/solid";
import { StarIcon as StarOutline } from "@heroicons/react/24/outline";

const Feedback = () => {
  const { authUser } = useAuthContext();
  const [feedback, setFeedback] = useState("");
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!feedback.trim()) {
      toast.error("Please write your feedback");
      return;
    }

    if (rating === 0) {
      toast.error("Please select a rating");
      return;
    }

    setIsLoading(true);

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API_BASE_URL}/feedbacks`,
        { feedback, rating },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Thank you for your feedback!");
        setFeedback("");
        setRating(0);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit feedback");
    } finally {
      setIsLoading(false);
    }
  };

  const getRatingLabel = (value) => {
    const labels = {
      1: "Poor",
      2: "Fair",
      3: "Good",
      4: "Very Good",
      5: "Excellent",
    };
    return labels[value] || "";
  };

  const ratingEmojis = {
    1: { emoji: "😞", bg: "bg-red-50", border: "border-red-200", activeBg: "bg-red-100" },
    2: { emoji: "😕", bg: "bg-orange-50", border: "border-orange-200", activeBg: "bg-orange-100" },
    3: { emoji: "😐", bg: "bg-yellow-50", border: "border-yellow-200", activeBg: "bg-yellow-100" },
    4: { emoji: "😊", bg: "bg-lime-50", border: "border-lime-200", activeBg: "bg-lime-100" },
    5: { emoji: "🤩", bg: "bg-emerald-50", border: "border-emerald-200", activeBg: "bg-emerald-100" },
  };

  const activeRating = hoveredRating || rating;

  return (
    <div className="min-h-[80vh] bg-gray-50/50 p-3 sm:p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-5">

            {/* Left - Info Panel */}
            <div className="lg:col-span-2 bg-linear-to-br from-[#0a3d3d] via-[#0d4a4a] to-[#083535] p-5 sm:p-6 md:p-8 lg:p-10 flex flex-col justify-between relative overflow-hidden">
              {/* Decorative circles */}
              <div className="absolute -top-16 -right-16 w-48 h-48 bg-white/5 rounded-full" />
              <div className="absolute -bottom-20 -left-20 w-56 h-56 bg-white/5 rounded-full" />

              <div className="relative z-10">
                <div className="hidden md:flex w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-xl items-center justify-center mb-4 sm:mb-6">
                  <svg className="hidden md:block w-5 h-5 sm:w-6 sm:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight">
                  We'd love to hear from you
                </h1>
                <p className="text-teal-200/70 text-xs sm:text-sm mt-2 sm:mt-3 leading-relaxed">
                  Your feedback helps us improve the Agromet Services Portal. Share your thoughts, suggestions, or report any issues.
                </p>

                {/* Quick stats */}
                <div className="flex gap-3 sm:gap-4 mt-6 sm:mt-8">
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 flex-1 text-center">
                    <p className="text-lg sm:text-xl font-bold text-white">4.8</p>
                    <p className="text-[10px] sm:text-xs text-teal-200/60 mt-0.5">Avg. Rating</p>
                  </div>
                  <div className="bg-white/10 backdrop-blur-sm rounded-xl px-3 py-2.5 sm:px-4 sm:py-3 flex-1 text-center">
                    <p className="text-lg sm:text-xl font-bold text-white">200+</p>
                    <p className="text-[10px] sm:text-xs text-teal-200/60 mt-0.5">Feedbacks</p>
                  </div>
                </div>
              </div>

              {/* User badge at bottom */}
              <div className="relative z-10 mt-6 sm:mt-8 lg:mt-0">
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4">
                  <p className="text-[10px] sm:text-xs text-teal-200/50 font-medium uppercase tracking-wider mb-1.5">Submitting as</p>
                  <p className="text-sm sm:text-base font-semibold text-white truncate">{authUser?.name}</p>
                  <p className="text-xs sm:text-sm text-teal-200/70 truncate">{authUser?.email}</p>
                </div>
              </div>
            </div>

            {/* Right - Form */}
            <div className="lg:col-span-3 p-5 sm:p-6 md:p-8 lg:p-10">
              <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 md:space-y-8">

                {/* Rating with Emojis */}
                <div>
                  <label className="block text-sm sm:text-base font-semibold text-gray-900 mb-1">
                    How was your experience?
                  </label>
                  <p className="text-xs text-gray-400 mb-3 sm:mb-4">Select a rating below</p>
                  <div className="flex items-center justify-between gap-1.5 sm:gap-2 md:gap-3">
                    {[1, 2, 3, 4, 5].map((value) => {
                      const { emoji, bg, border, activeBg } = ratingEmojis[value];
                      const isActive = activeRating === value;
                      const isInRange = activeRating >= value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => setRating(value)}
                          onMouseEnter={() => setHoveredRating(value)}
                          onMouseLeave={() => setHoveredRating(0)}
                          className={`flex-1 flex flex-col items-center gap-1 sm:gap-1.5 py-2.5 sm:py-3 md:py-4 rounded-xl border-2 transition-all duration-200 focus:outline-none ${
                            isActive
                              ? `${activeBg} ${border} scale-105 shadow-sm`
                              : isInRange
                                ? `${bg} ${border}`
                                : "bg-gray-50 border-gray-100 hover:border-gray-200"
                          }`}
                        >
                          <span className={`text-xl sm:text-2xl md:text-3xl transition-transform duration-200 ${isActive ? "scale-110" : ""}`}>
                            {emoji}
                          </span>
                          <span className={`text-[9px] sm:text-[10px] md:text-xs font-medium ${isActive ? "text-gray-700" : "text-gray-400"}`}>
                            {getRatingLabel(value)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                  {activeRating > 0 && (
                    <div className="flex items-center justify-center gap-1 mt-2.5 sm:mt-3">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((v) => (
                          <StarIcon key={v} className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${v <= activeRating ? "text-amber-400" : "text-gray-200"}`} />
                        ))}
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-[#0d4a4a] ml-1">{activeRating}/5</span>
                    </div>
                  )}
                </div>

                {/* Feedback Text */}
                <div>
                  <label htmlFor="feedback" className="block text-sm sm:text-base font-semibold text-gray-900 mb-1">
                    Tell us more
                  </label>
                  <p className="text-xs text-gray-400 mb-2 sm:mb-3">Your detailed feedback helps us the most</p>
                  <textarea
                    id="feedback"
                    rows={5}
                    value={feedback}
                    onChange={(e) => setFeedback(e.target.value)}
                    placeholder="What did you like? What can we improve? Any suggestions..."
                    className="w-full px-3.5 sm:px-4 py-3 text-sm sm:text-base text-gray-700 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400 resize-none bg-gray-50/50 placeholder:text-gray-300 transition-all"
                  />
                  <p className="text-[10px] sm:text-xs text-gray-300 mt-1.5 text-right">
                    {feedback.length > 0 ? `${feedback.length} characters` : ""}
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || rating === 0 || !feedback.trim()}
                  className="w-full py-3 sm:py-3.5 px-4 bg-[#0d4a4a] hover:bg-[#0a3d3d] text-white text-sm sm:text-base font-semibold rounded-xl shadow-sm hover:shadow-md transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-sm flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                      </svg>
                      <span>Send Feedback</span>
                    </>
                  )}
                </button>

                {/* Helper note */}
                {(rating === 0 || !feedback.trim()) && (
                  <p className="text-center text-[10px] sm:text-xs text-gray-300">
                    {rating === 0 && !feedback.trim()
                      ? "Please select a rating and write your feedback to continue"
                      : rating === 0
                        ? "Please select a rating to continue"
                        : "Please write your feedback to continue"}
                  </p>
                )}
              </form>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Feedback;
