import React from "react";
import Swal from "sweetalert2";

const VarietalRiceModal = ({ 
  isOpen, 
  onClose, 
  varietalFilter, 
  setVarietalFilter, 
  onSubmit 
}) => {
  if (!isOpen) return null;

  const handleSeasonChange = (e) => {
    const season = e.target.value;
    setVarietalFilter(prev => ({
      ...prev,
      selectedSeason: season,
      // Reset varieties when season changes
      selectedVarieties: season === "B. Aman" ? ["B. Aman"] : []
    }));
  };

  const handleVarietyChange = (variety) => {
    setVarietalFilter(prev => {
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
    if (!varietalFilter.selectedSeason) {
      Swal.fire({
        icon: 'warning',
        title: 'Season Not Selected',
        text: 'Please select a season first.',
        confirmButtonColor: '#9333EA'
      });
      return;
    }
    // B. Aman doesn't need variety selection (no MV/LV)
    const selectedVarieties = varietalFilter.selectedVarieties || [];
    if (varietalFilter.selectedSeason !== "B. Aman" && selectedVarieties.length === 0) {
      Swal.fire({
        icon: 'warning',
        title: 'Variety Not Selected',
        text: 'Please select at least one rice variety (MV, LV, or both).',
        confirmButtonColor: '#9333EA'
      });
      return;
    }
    onSubmit();
  };

  const handleCancel = () => {
    setVarietalFilter({ selectedVarieties: [], selectedSeason: "" });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCancel} />
      <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="bg-linear-to-r from-[#0a3d3d] to-[#0d5555] text-white px-4 sm:px-5 md:px-6 py-4 sm:py-5 rounded-t-xl sm:rounded-t-2xl flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
              </svg>
              <span className="truncate">Varietal Rice Data</span>
            </h3>
            <p className="text-teal-200/70 text-xs sm:text-sm mt-1">
              Select variety and season to view statistics
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
              value={varietalFilter.selectedSeason}
              onChange={handleSeasonChange}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm sm:text-base"
            >
              <option value="">-- Choose a season --</option>
              <option value="Aus">Aus (March - July)</option>
              <option value="T. Aman">T. Aman (June - November)</option>
              <option value="B. Aman">B. Aman (June - November)</option>
              <option value="Boro">Boro (December - May)</option>
            </select>
            
            {varietalFilter.selectedSeason && (
              <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-teal-50 border-l-4 border-teal-500 rounded-r-lg">
                <p className="text-xs sm:text-sm text-teal-800">
                  <span className="font-bold">Selected Season:</span> {varietalFilter.selectedSeason}
                </p>
                <p className="text-xs text-teal-600 mt-1">
                  {varietalFilter.selectedSeason === 'Aus' && 'March - August'}
                  {varietalFilter.selectedSeason === 'T. Aman' && 'June - December'}
                  {varietalFilter.selectedSeason === 'B. Aman' && 'August - December (No variety selection needed)'}
                  {varietalFilter.selectedSeason === 'Boro' && 'November - June'}
                </p>
              </div>
            )}
          </div>

          {/* Variety Selection - SECOND (conditionally shown) */}
          {varietalFilter.selectedSeason && varietalFilter.selectedSeason !== "B. Aman" && (
            <div>
              <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2 sm:mb-3">
                Select Variety (Single or Multiple)
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* MV Option */}
                <div
                  onClick={() => handleVarietyChange("MV")}
                  className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    (varietalFilter.selectedVarieties || []).includes("MV")
                      ? "border-teal-500 bg-teal-50"
                      : "border-gray-300 hover:border-teal-300 hover:bg-gray-50"
                  }`}
                >
                  <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                    (varietalFilter.selectedVarieties || []).includes("MV")
                      ? "bg-teal-500 border-teal-500"
                      : "border-gray-400"
                  }`}>
                    {(varietalFilter.selectedVarieties || []).includes("MV") && (
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm sm:text-base">MV</p>
                    <p className="text-xs text-gray-600">Modern Variety</p>
                  </div>
                </div>

                {/* LV Option */}
                <div
                  onClick={() => handleVarietyChange("LV")}
                  className={`flex items-center gap-2 sm:gap-3 p-3 sm:p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    (varietalFilter.selectedVarieties || []).includes("LV")
                      ? "border-teal-500 bg-teal-50"
                      : "border-gray-300 hover:border-teal-300 hover:bg-gray-50"
                  }`}
                >
                  <div className={`w-4 h-4 sm:w-5 sm:h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                    (varietalFilter.selectedVarieties || []).includes("LV")
                      ? "bg-teal-600 border-teal-600"
                      : "border-gray-400"
                  }`}>
                    {(varietalFilter.selectedVarieties || []).includes("LV") && (
                      <svg className="w-3 h-3 sm:w-4 sm:h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm sm:text-base">LV</p>
                    <p className="text-xs text-gray-600">Local Variety</p>
                  </div>
                </div>
              </div>
              
              {(varietalFilter.selectedVarieties || []).length > 0 && (
                <div className="mt-2 sm:mt-3 p-2 sm:p-3 bg-teal-50 border-l-4 border-teal-500 rounded-r-lg">
                  <p className="text-xs sm:text-sm text-teal-800">
                    <span className="font-bold">Selected:</span> {(varietalFilter.selectedVarieties || []).join(" & ")}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* B. Aman Info */}
          {varietalFilter.selectedSeason === "B. Aman" && (
            <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-teal-50 border-l-4 border-teal-500 rounded-r-lg">
              <div className="flex items-start gap-2">
                <svg className="w-4 h-4 sm:w-5 sm:h-5 text-teal-600 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm font-bold text-teal-800">B. Aman Season</p>
                  <p className="text-xs text-teal-700 mt-1">
                    B. Aman doesn't have variety classification (no MV/LV). Data will be shown directly.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Summary */}
          {varietalFilter.selectedSeason && (varietalFilter.selectedSeason === "B. Aman" || (varietalFilter.selectedVarieties || []).length > 0) && (
            <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-teal-50/50 border-2 border-teal-200 rounded-lg sm:rounded-xl">
              <p className="text-xs sm:text-sm font-bold text-gray-800 mb-2">📊 You will see statistics for:</p>
              <div className="space-y-1 text-xs sm:text-sm text-gray-700">
                <p>• <span className="font-semibold">Season:</span> {varietalFilter.selectedSeason}</p>
                {varietalFilter.selectedSeason !== "B. Aman" && (
                  <p>• <span className="font-semibold">Varieties:</span> {(varietalFilter.selectedVarieties || []).join(" & ")}</p>
                )}
                <p className="text-xs text-gray-500 mt-2">
                  {(varietalFilter.selectedVarieties || []).length > 1 
                    ? "Multi-line chart will compare varieties side by side." 
                    : "Area, production, and yield data will be displayed."}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="bg-gray-50 px-4 sm:px-5 md:px-6 py-3 sm:py-4 rounded-b-xl sm:rounded-b-2xl border-t flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
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
            className="order-1 sm:order-2 w-full sm:w-auto px-4 sm:px-6 py-2.5 bg-linear-to-r from-[#0a3d3d] to-[#0d5555] text-white rounded-lg hover:from-[#083535] hover:to-[#0a3d3d] transition-all shadow-lg font-medium flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Show Statistics
          </button>
        </div>
      </div>
    </div>
  );
};

export default VarietalRiceModal;
