import React from "react";
import { motion } from "framer-motion";
import Swal from "sweetalert2";

const SeasonalRiceModal = ({ 
  isOpen, 
  onClose, 
  seasonalFilter, 
  setSeasonalFilter, 
  onSubmit 
}) => {
  if (!isOpen) return null;

  const handleSeasonChange = (e) => {
    setSeasonalFilter({
      selectedSeason: e.target.value
    });
  };

  const handleSubmit = () => {
    if (!seasonalFilter.selectedSeason) {
      Swal.fire({
        icon: 'warning',
        title: 'No Season Selected',
        text: 'Please select a season.',
        confirmButtonColor: '#3B82F6'
      });
      return;
    }
    onSubmit();
  };

  const handleCancel = () => {
    setSeasonalFilter({ selectedSeason: "" });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 sm:px-5 md:px-6 py-4 sm:py-5 rounded-t-xl sm:rounded-t-2xl flex justify-between items-start gap-3 shadow-lg">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="truncate">Seasonal Rice Data</span>
            </h3>
            <p className="text-green-100 text-xs sm:text-sm mt-1">
              Select a rice season to view statistics
            </p>
          </div>
          <button
            onClick={handleCancel}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-1.5 sm:p-2 transition-all flex-shrink-0"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-6">
          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2 sm:mb-3">
              Select Season *
            </label>
            <select
              value={seasonalFilter.selectedSeason}
              onChange={handleSeasonChange}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm sm:text-base"
            >
              <option value="">-- Choose a season --</option>
              <option value="Aus">Aus (March - July)</option>
              <option value="Aman">Aman (June - November)</option>
              <option value="Boro">Boro (December - May)</option>
            </select>
            
            {seasonalFilter.selectedSeason && (
              <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
                <p className="text-xs sm:text-sm text-green-800">
                  <span className="font-bold">Selected:</span> {seasonalFilter.selectedSeason} Season
                </p>
                <p className="text-[10px] sm:text-xs text-green-600 mt-1">
                  You will see area, production, and yield statistics for this season.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 px-4 sm:px-5 md:px-6 py-3 sm:py-4 rounded-b-xl sm:rounded-b-2xl border-t flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-all font-medium text-sm sm:text-base order-2 sm:order-1"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 transition-all shadow-lg font-medium flex items-center justify-center gap-2 text-sm sm:text-base order-1 sm:order-2"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Show Statistics</span>
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default SeasonalRiceModal;
