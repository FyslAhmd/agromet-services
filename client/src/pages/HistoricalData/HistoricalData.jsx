import React, { useState, useEffect } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";
import HistoricalDataChart from "./components/HistoricalDataChart";
import DistrictModal from "./components/DistrictModal";
import { dataParameters } from "./components/chartConfig";

const HistoricalData = () => {
  // State management
  const [selectedParameter, setSelectedParameter] = useState("");
  const [selectedStations, setSelectedStations] = useState([]);
  const [availableStations, setAvailableStations] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // Fetch available stations when parameter changes
  useEffect(() => {
    const fetchStations = async () => {
      if (selectedParameter) {
        try {
          const response = await axios.get(
            `${API_BASE_URL}/${selectedParameter}/stations`
          );
          if (response.data.success) {
            setAvailableStations(response.data.data);
            // Show modal when stations are fetched
            setShowModal(true);
          }
        } catch (error) {
          console.error("Error fetching stations:", error);
          setAvailableStations([]);
        }
      }
    };
    fetchStations();
  }, [selectedParameter]);

  // Get parameter info
  const getParameterInfo = () => {
    return dataParameters.find(p => p.value === selectedParameter);
  };

  const paramInfo = getParameterInfo();

  // Handle modal confirm
  const handleModalConfirm = (stations) => {
    setSelectedStations(stations);
    setShowModal(false);
  };

  // Handle parameter change
  const handleParameterChange = (value) => {
    setSelectedParameter(value);
    setSelectedStations([]);
  };

  return (
    <div className="min-h-screen bg-base-200 p-2 sm:p-4 lg:p-6">
      <div className="space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="text-center mb-4 sm:mb-8 px-2">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-base-content mb-2 leading-tight">
            📊 Historical Climate Data Analytics
          </h1>
          <p className="text-base-content/70 text-sm sm:text-base lg:text-lg px-2 sm:px-0">
            Comprehensive long-term climate patterns and trends from{" "}
            <span className="font-semibold text-primary">
              BRRI Research Stations
            </span>{" "}
            across Bangladesh
          </p>
          <div className="flex justify-center mt-2 sm:mt-3">
            <div className="badge badge-outline badge-sm sm:badge-md lg:badge-lg">
              Multi-Station Climate Analysis
            </div>
          </div>
        </div>

        {/* Parameter Selection */}
        <div className="card bg-gradient-to-r from-white to-gray-50 shadow-lg hover:shadow-xl transition-all duration-300 mx-1 sm:mx-0">
          <div className="card-body p-3 sm:p-4 lg:p-5">
            <div className="flex items-center gap-3 sm:gap-4 mb-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-primary to-primary-focus rounded-lg sm:rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                <span className="text-white text-sm sm:text-lg">
                  {paramInfo ? paramInfo.icon : "📊"}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-800 text-sm sm:text-base truncate">
                  Climate Parameter Selection
                </h3>
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  Choose a parameter to begin analysis
                </p>
              </div>
              <button
                onClick={() => {/* TODO: Implement request data modal */}}
                className="btn btn-primary btn-sm sm:btn-md flex-shrink-0"
              >
                📋 Request Data
              </button>
            </div>

            <div className="relative">
              <select
                value={selectedParameter}
                onChange={(e) => handleParameterChange(e.target.value)}
                className="select select-bordered select-sm sm:select-md w-full bg-white border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 text-gray-700 shadow-sm hover:shadow-md transition-all duration-200 text-xs sm:text-sm"
              >
                <option value="">🔍 Choose climate parameter...</option>
                {dataParameters.map((param) => (
                  <option key={param.value} value={param.value}>
                    {param.icon} {param.label}
                  </option>
                ))}
              </select>
            </div>

            {selectedStations.length > 0 && (
              <div className="mt-3">
                <p className="text-xs text-gray-600 mb-2">
                  Selected Stations ({selectedStations.length}):
                </p>
                <div className="flex flex-wrap gap-2">
                  {selectedStations.map((station) => (
                    <div key={station} className="badge badge-primary gap-2">
                      {station}
                    </div>
                  ))}
                  <button
                    onClick={() => setShowModal(true)}
                    className="badge badge-outline hover:badge-primary gap-1 cursor-pointer"
                  >
                    ✎ Edit Selection
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* District Selection Modal */}
        <DistrictModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          stations={availableStations}
          onConfirm={handleModalConfirm}
        />

        {/* Combined Chart for All Selected Stations */}
        {selectedParameter && selectedStations.length > 0 && (
          <HistoricalDataChart
            stations={selectedStations}
            parameter={selectedParameter}
            title={paramInfo?.label || selectedParameter}
            unit={paramInfo?.label?.match(/\(([^)]+)\)/)?.[1] || ""}
            icon={paramInfo?.icon || "📊"}
            color={paramInfo?.color || "#3b82f6"}
          />
        )}

        {/* Empty State */}
        {!selectedParameter && (
          <div className="card bg-base-100 shadow-xl mx-1 sm:mx-0">
            <div className="card-body p-6 sm:p-8 lg:p-12">
              <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6">
                <div className="text-4xl sm:text-6xl lg:text-8xl opacity-30">
                  📊
                </div>
                <div className="text-center max-w-sm sm:max-w-md px-2">
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-base-content/70 mb-2 sm:mb-3">
                    Select a Climate Parameter
                  </h3>
                  <p className="text-sm sm:text-base text-base-content/50 leading-relaxed">
                    Choose a climate parameter from the dropdown above to view
                    historical data across different research stations. Analyze
                    trends in temperature, rainfall, humidity, and more.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedParameter && selectedStations.length === 0 && (
          <div className="card bg-base-100 shadow-xl mx-1 sm:mx-0">
            <div className="card-body p-6 sm:p-8 lg:p-12">
              <div className="flex flex-col items-center justify-center space-y-4 sm:space-y-6">
                <div className="text-4xl sm:text-6xl lg:text-8xl opacity-30">
                  📍
                </div>
                <div className="text-center max-w-sm sm:max-w-md px-2">
                  <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-base-content/70 mb-2 sm:mb-3">
                    Select Research Stations
                  </h3>
                  <p className="text-sm sm:text-base text-base-content/50 leading-relaxed">
                    Choose one or more research stations (up to 5) to view their
                    historical {paramInfo?.label.toLowerCase() || "climate"} data.
                    Each station will display as a separate chart with
                    comprehensive analysis tools.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Timestamp */}
        <div className="mt-4 sm:mt-6 py-3 sm:py-4 text-center px-2">
          <p className="text-xs sm:text-sm text-base-content/60 leading-relaxed">
            🕒 Last updated:{" "}
            <span className="hidden sm:inline">
              {new Date().toLocaleString("en-BD", {
                timeZone: "Asia/Dhaka",
                year: "numeric",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              BD Time
            </span>
            <span className="sm:hidden">
              {new Date().toLocaleString("en-BD", {
                timeZone: "Asia/Dhaka",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}{" "}
              BD
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default HistoricalData;