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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary-focus text-white p-6 rounded-t-2xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold mb-1">Select Research Stations</h2>
              <p className="text-primary-content/80 text-sm">
                Choose one or more stations to analyze climate data
              </p>
            </div>
            <button
              onClick={handleClose}
              className="btn btn-sm btn-circle btn-ghost hover:bg-white/20"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Select All Checkbox */}
          <div className="mb-4 p-4 bg-blue-50 rounded-lg border-2 border-blue-200">
            <label className="flex items-center cursor-pointer gap-3">
              <input
                type="checkbox"
                className="checkbox checkbox-primary checkbox-lg"
                checked={selectAll}
                onChange={handleSelectAll}
              />
              <div>
                <span className="text-lg font-semibold text-gray-800">
                  Select All Stations
                </span>
                <p className="text-sm text-gray-600">
                  {selectedStations.length} of {stations.length} selected
                </p>
              </div>
            </label>
          </div>

          {/* Station List */}
          <div className="space-y-2">
            {stations.map((station) => (
              <div
                key={station}
                className={`p-4 rounded-lg border-2 transition-all duration-200 cursor-pointer ${
                  selectedStations.includes(station)
                    ? "bg-primary/10 border-primary shadow-md"
                    : "bg-white border-gray-200 hover:border-primary/50 hover:shadow-sm"
                }`}
                onClick={() => handleStationToggle(station)}
              >
                <label className="flex items-center cursor-pointer gap-3">
                  <input
                    type="checkbox"
                    className="checkbox checkbox-primary"
                    checked={selectedStations.includes(station)}
                    onChange={() => handleStationToggle(station)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <div className="flex-1">
                    <span className="text-base font-medium text-gray-800">
                      📍 {station}
                    </span>
                  </div>
                  {selectedStations.includes(station) && (
                    <div className="badge badge-primary badge-sm">Selected</div>
                  )}
                </label>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50 rounded-b-2xl">
          <div className="flex gap-3 justify-end">
            <button onClick={handleClose} className="btn btn-outline btn-md">
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="btn btn-primary btn-md"
              disabled={selectedStations.length === 0}
            >
              Confirm {selectedStations.length > 0 && `(${selectedStations.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DistrictModal;
