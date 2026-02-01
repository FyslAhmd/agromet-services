import React from "react";
import { motion } from "framer-motion";
import Swal from "sweetalert2";

const DistrictWiseModal = ({ 
  isOpen, 
  onClose, 
  districtFilter, 
  setDistrictFilter, 
  onSubmit,
  bangladeshDistricts,
  riceSeasons
}) => {
  if (!isOpen) return null;

  const handleDistrictToggle = (district) => {
    setDistrictFilter(prev => ({
      ...prev,
      selectedDistricts: prev.selectedDistricts.includes(district)
        ? prev.selectedDistricts.filter(d => d !== district)
        : [...prev.selectedDistricts, district]
    }));
  };

  const handleSeasonChange = (season) => {
    setDistrictFilter(prev => ({
      ...prev,
      selectedSeason: season
    }));
  };

  const handleSubmit = () => {
    if (districtFilter.selectedDistricts.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'No District Selected',
        text: 'Please select at least one district.',
        confirmButtonColor: '#3B82F6'
      });
      return;
    }
    
    if (!districtFilter.selectedSeason) {
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
    setDistrictFilter({ selectedDistricts: [], selectedSeason: "" });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Modal Header */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 sm:px-5 md:px-6 py-4 sm:py-5 rounded-t-xl sm:rounded-t-2xl flex justify-between items-start gap-3 shadow-lg z-10">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
              <span className="truncate">District & Season Selection</span>
            </h3>
            <p className="text-blue-100 text-xs sm:text-sm mt-1">
              Select districts and seasons to view rice statistics
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
        <div className="p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5 md:space-y-6">
          {/* Districts Section */}
          <div>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-3 sm:mb-4">
              <h4 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
                <span className="bg-blue-100 text-blue-700 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                  {districtFilter.selectedDistricts.length} Selected
                </span>
                Select Districts
              </h4>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setDistrictFilter(prev => ({
                    ...prev,
                    selectedDistricts: bangladeshDistricts
                  }))}
                  className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors font-medium"
                >
                  Select All
                </button>
                <button
                  type="button"
                  onClick={() => setDistrictFilter(prev => ({
                    ...prev,
                    selectedDistricts: []
                  }))}
                  className="text-xs sm:text-sm px-2 sm:px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors font-medium"
                >
                  Clear All
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 max-h-60 sm:max-h-72 md:max-h-80 overflow-y-auto p-2 bg-gray-50 rounded-lg sm:rounded-xl border border-gray-200">
              {bangladeshDistricts.map((district) => (
                <label
                  key={district}
                  className={`flex items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg cursor-pointer transition-all duration-200 ${
                    districtFilter.selectedDistricts.includes(district)
                      ? 'bg-blue-100 border-2 border-blue-500 shadow-sm'
                      : 'bg-white border-2 border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={districtFilter.selectedDistricts.includes(district)}
                    onChange={() => handleDistrictToggle(district)}
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 flex-shrink-0"
                  />
                  <span className={`text-xs sm:text-sm font-medium ${
                    districtFilter.selectedDistricts.includes(district)
                      ? 'text-blue-900'
                      : 'text-gray-700'
                  }`}>
                    {district}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Seasons Section */}
          <div>
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h4 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
                <span className="bg-green-100 text-green-700 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                  {districtFilter.selectedSeason ? '1 Selected' : '0 Selected'}
                </span>
                Select Season
              </h4>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
              {riceSeasons.map((season) => (
                <label
                  key={season}
                  className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-lg sm:rounded-xl cursor-pointer transition-all duration-200 ${
                    districtFilter.selectedSeason === season
                      ? 'bg-green-100 border-2 border-green-500 shadow-md'
                      : 'bg-white border-2 border-gray-200 hover:border-green-300 hover:bg-green-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="season"
                    checked={districtFilter.selectedSeason === season}
                    onChange={() => handleSeasonChange(season)}
                    className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 focus:ring-2 focus:ring-green-500 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className={`text-sm sm:text-base font-bold ${
                      districtFilter.selectedSeason === season
                        ? 'text-green-900'
                        : 'text-gray-700'
                    }`}>
                      {season}
                    </span>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {season === 'Aus' && 'March-July'}
                      {season === 'Aman' && 'June-November'}
                      {season === 'Boro' && 'December-May'}
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="sticky bottom-0 bg-gray-50 px-4 sm:px-5 md:px-6 py-3 sm:py-4 rounded-b-xl sm:rounded-b-2xl border-t flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
            <span className="font-semibold">{districtFilter.selectedDistricts.length}</span> district(s) and{' '}
            <span className="font-semibold">{districtFilter.selectedSeason ? '1' : '0'}</span> season selected
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleCancel}
              className="order-2 sm:order-1 w-full sm:w-auto px-4 sm:px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-all font-medium text-sm sm:text-base"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              className="order-1 sm:order-2 w-full sm:w-auto px-4 sm:px-6 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg font-medium flex items-center justify-center gap-2 text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              Show Statistics
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DistrictWiseModal;
