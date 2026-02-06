import React from "react";
import Swal from "sweetalert2";

const CroppingIntensityModal = ({ 
  isOpen, 
  onClose, 
  croppingFilter, 
  setCroppingFilter, 
  onSubmit 
}) => {
  if (!isOpen) return null;

  const handleDataTypeChange = (e) => {
    setCroppingFilter(prev => ({
      ...prev,
      selectedDataType: e.target.value
    }));
  };

  const handleSubmit = () => {
    if (!croppingFilter.selectedDataType) {
      Swal.fire({
        icon: 'warning',
        title: 'No Data Type Selected',
        text: 'Please select a data type (Cropped Area or Cropping Intensity %).',
        confirmButtonColor: '#14B8A6'
      });
      return;
    }
    onSubmit();
  };

  const handleCancel = () => {
    setCroppingFilter({ selectedDataType: "" });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={handleCancel} />
      <div className="relative bg-white rounded-xl sm:rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="bg-linear-to-r from-[#0a3d3d] to-[#0d5555] text-white px-4 sm:px-5 md:px-6 py-4 sm:py-5 rounded-t-xl sm:rounded-t-2xl flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2">
              <svg className="w-5 h-5 sm:w-6 sm:h-6 md:w-7 md:h-7 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span className="truncate">Cropping Intensity Data</span>
            </h3>
            <p className="text-teal-200/70 text-xs sm:text-sm mt-1">
              Select data type to view statistics
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
          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-2 sm:mb-3">
              Select Data Type *
            </label>
            <select
              value={croppingFilter.selectedDataType}
              onChange={handleDataTypeChange}
              className="w-full px-3 sm:px-4 py-2.5 sm:py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-sm sm:text-base"
            >
              <option value="">-- Choose a data type --</option>
              <option value="Cropped Area">Cropped Area</option>
              <option value="Cropping Intensity %">Cropping Intensity %</option>
            </select>
            
            {croppingFilter.selectedDataType && (
              <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-teal-50 border-l-4 border-teal-500 rounded-r-lg">
                <p className="text-xs sm:text-sm text-teal-800">
                  <span className="font-bold">Selected:</span> {croppingFilter.selectedDataType}
                </p>
                <p className="text-xs text-teal-600 mt-1">
                  {croppingFilter.selectedDataType === 'Cropped Area' 
                    ? 'View data about Cropped area over time'
                    : 'View cropping intensity percentage statistics'}
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

export default CroppingIntensityModal;
