import React, { useState } from "react";

const DistrictModal = ({ isOpen, onClose, stations, onConfirm }) => {
  const [selectedStations, setSelectedStations] = useState([]);
  const [selectAll, setSelectAll] = useState(false);

  // Handle select all toggle
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedStations([]);
      setSelectAll(false);
    } else {
      setSelectedStations([...stations]);
      setSelectAll(true);
    }
  };

  // Handle individual station toggle
  const handleStationToggle = (station) => {
    setSelectedStations((prev) => {
      if (prev.includes(station)) {
        const updated = prev.filter((s) => s !== station);
        if (updated.length === 0) setSelectAll(false);
        return updated;
      } else {
        const updated = [...prev, station];
        if (updated.length === stations.length) setSelectAll(true);
        return updated;
      }
    });
  };

  // Handle confirm
  const handleConfirm = () => {
    onConfirm(selectedStations);
    onClose();
    // Reset state
    setSelectedStations([]);
    setSelectAll(false);
  };

  // Handle close
  const handleClose = () => {
    onClose();
    // Reset state
    setSelectedStations([]);
    setSelectAll(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-r from-[#0a3d3d] to-[#0d5555] px-5 py-4 shrink-0">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-base font-semibold text-white">Select Research Stations</h2>
              <p className="text-teal-200/70 text-xs mt-0.5">
                Choose one or more stations to analyze climate data
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-1 rounded-lg text-teal-200/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {/* Select All */}
          <label className="flex items-center gap-3 p-3 mb-3 bg-teal-50 rounded-xl border border-teal-200 cursor-pointer hover:bg-teal-100/60 transition-colors">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500/30"
              checked={selectAll}
              onChange={handleSelectAll}
            />
            <div>
              <span className="text-sm font-semibold text-gray-800">Select All Stations</span>
              <p className="text-xs text-gray-500">{selectedStations.length} of {stations.length} selected</p>
            </div>
          </label>

          {/* Station List */}
          <div className="space-y-1.5">
            {stations.map((station) => (
              <label
                key={station}
                className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all duration-150 ${
                  selectedStations.includes(station)
                    ? "bg-teal-50/50 border-teal-300"
                    : "bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50/50"
                }`}
              >
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500/30 accent-teal-600"
                  checked={selectedStations.includes(station)}
                  onChange={() => handleStationToggle(station)}
                />
                <span className="flex-1 text-sm font-medium text-gray-700">{station}</span>
                {selectedStations.includes(station) && (
                  <span className="text-[10px] font-semibold text-teal-600 bg-teal-100 px-2 py-0.5 rounded-full">Selected</span>
                )}
              </label>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 px-5 py-3 flex gap-2 justify-end shrink-0">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-5 py-2 text-sm font-semibold text-white bg-[#0d4a4a] hover:bg-[#0a3d3d] rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={selectedStations.length === 0}
          >
            Confirm {selectedStations.length > 0 && `(${selectedStations.length})`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DistrictModal;
