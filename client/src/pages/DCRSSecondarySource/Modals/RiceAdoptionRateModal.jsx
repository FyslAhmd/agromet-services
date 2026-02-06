import React, { useState, useEffect } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { DCRS_API_URL } from "../../../config/api";

const RiceAdoptionRateModal = ({ 
  isOpen, 
  onClose, 
  adoptionFilter, 
  setAdoptionFilter, 
  onSubmit 
}) => {
  const [availableVarieties, setAvailableVarieties] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && adoptionFilter.selectedSeason) {
      fetchVarieties();
    }
  }, [isOpen, adoptionFilter.selectedSeason]);

  const fetchVarieties = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${DCRS_API_URL}/api/rice-adoption-rate/filters`);
      
      if (response.data?.success && response.data?.data?.varieties) {
        setAvailableVarieties(response.data.data.varieties);
      } else {
        setAvailableVarieties([]);
      }
    } catch (error) {
      console.error("Error fetching varieties:", error);
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: 'Failed to load varieties from database',
        confirmButtonColor: '#F59E0B'
      });
      setAvailableVarieties([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSeasonChange = (e) => {
    const season = e.target.value;
    setAdoptionFilter(prev => ({
      ...prev,
      selectedSeason: season,
      // Reset varieties when season changes
      selectedVarieties: []
    }));
  };

  const handleVarietyToggle = (variety) => {
    setAdoptionFilter(prev => {
      const currentVarieties = prev.selectedVarieties || [];
      
      // Toggle individual variety
      if (currentVarieties.includes(variety)) {
        return { ...prev, selectedVarieties: currentVarieties.filter(v => v !== variety) };
      } else {
        return { ...prev, selectedVarieties: [...currentVarieties, variety] };
      }
    });
  };

  const handleSubmit = () => {
    if (!adoptionFilter.selectedSeason) {
      Swal.fire({
        icon: 'warning',
        title: 'Season Not Selected',
        text: 'Please select a season first.',
        confirmButtonColor: '#F59E0B'
      });
      return;
    }
    
    const selectedVarieties = adoptionFilter.selectedVarieties || [];
    if (selectedVarieties.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Variety Not Selected',
        text: 'Please select at least one rice variety.',
        confirmButtonColor: '#F59E0B'
      });
      return;
    }
    onSubmit();
  };

  const handleCancel = () => {
    setAdoptionFilter({ selectedVarieties: [], selectedSeason: "" });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCancel} />
      <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="bg-linear-to-r from-[#0a3d3d] to-[#0d5555] text-white px-4 sm:px-5 md:px-6 py-4 sm:py-5 rounded-t-xl sm:rounded-t-2xl flex justify-between items-start gap-3 sticky top-0 z-10">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
              <span className="truncate">Rice Adoption Rate</span>
            </h3>
            <p className="text-teal-200/70 text-xs sm:text-sm mt-1">
              Select season and varieties to view adoption trends
            </p>
          </div>
          <button
            onClick={handleCancel}
            className="text-teal-200/70 hover:text-white hover:bg-white/10 rounded-lg p-1.5 sm:p-2 transition-all shrink-0"
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 md:p-6 space-y-4 sm:space-y-5 md:space-y-6">
          {/* Season Selection - FIRST */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2 sm:mb-3">
              Select Season
            </label>
            <select
              value={adoptionFilter.selectedSeason}
              onChange={handleSeasonChange}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm sm:text-base"
            >
              <option value="">-- Choose a season --</option>
              <option value="Aus">Aus (March - July)</option>
              <option value="Aman">Aman (June - November)</option>
              <option value="Boro">Boro (December - May)</option>
            </select>
            
            {adoptionFilter.selectedSeason && (
              <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-teal-50 border-l-4 border-teal-500 rounded-r-lg">
                <p className="text-xs sm:text-sm text-teal-800">
                  <span className="font-bold">Selected Season:</span> {adoptionFilter.selectedSeason}
                </p>
                <p className="text-xs text-teal-600 mt-1">
                  {loading ? "Loading varieties..." : `${availableVarieties.length} varieties available`}
                </p>
              </div>
            )}
          </div>

          {/* Variety Selection - SECOND (conditionally shown) */}
          {adoptionFilter.selectedSeason && (
            <div>
              <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2 sm:mb-3">
                Select Varieties (Multiple Selection)
              </label>
              
              {loading ? (
                <div className="flex items-center justify-center py-6 sm:py-8">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
                </div>
              ) : availableVarieties.length === 0 ? (
                <div className="text-center py-6 sm:py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                  <svg className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                  <p className="text-sm sm:text-base text-gray-600">No varieties found for this season</p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">Please upload data first</p>
                </div>
              ) : (
                <>
                  <div className="mb-2 sm:mb-3 text-xs sm:text-sm text-gray-600">
                    <span className="font-semibold text-teal-600">
                      {(adoptionFilter.selectedVarieties || []).length}
                    </span> of {availableVarieties.length} varieties selected
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 max-h-72 sm:max-h-80 md:max-h-96 overflow-y-auto p-2 border-2 border-gray-200 rounded-lg">
                    {availableVarieties.map((variety, index) => (
                      <div
                        key={index}
                        onClick={() => handleVarietyToggle(variety)}
                        className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 border-2 rounded-lg cursor-pointer transition-all ${
                          (adoptionFilter.selectedVarieties || []).includes(variety)
                            ? "border-teal-500 bg-teal-50"
                            : "border-gray-300 hover:border-teal-300 hover:bg-gray-50"
                        }`}
                      >
                        <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                          (adoptionFilter.selectedVarieties || []).includes(variety)
                            ? "bg-teal-500 border-teal-500"
                            : "border-gray-400"
                        }`}>
                          {(adoptionFilter.selectedVarieties || []).includes(variety) && (
                            <svg className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                          )}
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-gray-700 flex-1">
                          {variety}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {(adoptionFilter.selectedVarieties || []).length > 0 && (
                <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-green-50 border-l-4 border-green-500 rounded-r-lg">
                  <p className="text-xs sm:text-sm text-green-800 font-semibold mb-1">
                    Selected Varieties:
                  </p>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2">
                    {(adoptionFilter.selectedVarieties || []).map((variety, idx) => (
                      <span key={idx} className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-green-300 rounded text-xs text-green-700">
                        {variety}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleVarietyToggle(variety);
                          }}
                          className="text-green-700 hover:text-green-900"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 px-4 sm:px-5 md:px-6 py-3 sm:py-4 rounded-b-xl sm:rounded-b-2xl flex flex-col sm:flex-row justify-end gap-2 sm:gap-3 border-t">
          <button
            onClick={handleCancel}
            className="order-2 sm:order-1 w-full sm:w-auto px-4 sm:px-6 py-2.5 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 font-medium transition-all text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="order-1 sm:order-2 w-full sm:w-auto px-4 sm:px-6 py-2.5 bg-linear-to-r from-[#0a3d3d] to-[#0d5555] text-white rounded-lg hover:from-[#083535] hover:to-[#0a3d3d] font-medium transition-all shadow-lg hover:shadow-xl text-sm sm:text-base"
          >
            Show Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default RiceAdoptionRateModal;
