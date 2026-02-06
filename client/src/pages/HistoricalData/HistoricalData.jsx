import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config/api";
import HistoricalDataChart from "./components/HistoricalDataChart";
import DistrictModal from "./components/DistrictModal";
import RequestDataModal from "./components/RequestDataModal";
import { dataParameters } from "./components/chartConfig";

const HistoricalData = () => {
  // State management - default to Maximum Temperature with Gazipur station
  const [selectedParameter, setSelectedParameter] = useState("maximum-temp");
  const [selectedStations, setSelectedStations] = useState(["Gazipur"]);
  const [availableStations, setAvailableStations] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [allStations, setAllStations] = useState([]);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
            // Update allStations for request modal
            setAllStations(prev => {
              const newStations = response.data.data.filter(s => !prev.includes(s));
              return [...prev, ...newStations];
            });
            // Only show modal when user manually changes parameter (not on initial load)
            if (!isInitialLoad) {
              setShowModal(true);
            } else {
              setIsInitialLoad(false);
            }
          }
        } catch (error) {
          console.error("Error fetching stations:", error);
          setAvailableStations([]);
        }
      }
    };
    fetchStations();
  }, [selectedParameter]);

  // Fetch all unique stations for request modal on mount
  useEffect(() => {
    const fetchAllStations = async () => {
      try {
        // Fetch stations from a common parameter to get the list
        const response = await axios.get(
          `${API_BASE_URL}/maximum-temp/stations`
        );
        if (response.data.success) {
          setAllStations(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching all stations:", error);
      }
    };
    fetchAllStations();
  }, []);

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
    <div className="w-full min-h-full lg:p-6">
      <div className="space-y-4 sm:space-y-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Historical Climate Data
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Long-term climate patterns and trends from BRRI Research Stations
            </p>
          </div>
          <button
            onClick={() => setShowRequestModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#0d4a4a] hover:bg-[#0a3d3d] rounded-xl transition-colors shadow-sm shrink-0 self-start sm:self-auto"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
            Request Data
          </button>
        </div>

        {/* Parameter Selection Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            {/* Label */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="w-9 h-9 bg-linear-to-br from-[#0a3d3d] to-[#0d5555] rounded-xl flex items-center justify-center shadow-sm shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
                </svg>
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-gray-800 text-sm">Climate Parameter</h3>
                <p className="text-xs text-gray-400 hidden sm:block">Select a parameter to explore</p>
              </div>
            </div>

            {/* Custom Dropdown */}
            <div className="relative flex-1" ref={dropdownRef}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                  dropdownOpen
                    ? 'border-teal-400 ring-2 ring-teal-500/20 bg-white'
                    : 'border-gray-200 bg-gray-50/50 hover:border-gray-300 hover:bg-white'
                }`}
              >
                {paramInfo ? (
                  <>
                    <span className="text-lg leading-none shrink-0">{paramInfo.icon}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-800 truncate">
                        {paramInfo.label.replace(/\s*\([^)]*\)/, '')}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {paramInfo.label.match(/\(([^)]+)\)/)?.[1] || ''}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <span className="text-lg leading-none shrink-0 opacity-40">📊</span>
                    <p className="text-sm text-gray-400 flex-1">Choose climate parameter...</p>
                  </>
                )}
                <svg xmlns="http://www.w3.org/2000/svg" className={`w-4 h-4 text-gray-400 shrink-0 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                </svg>
              </button>

              {/* Dropdown Panel */}
              {dropdownOpen && (
                <div className="absolute z-50 mt-1.5 w-full bg-white rounded-xl border border-gray-200 shadow-xl shadow-gray-200/50 overflow-hidden">
                  <div className="max-h-72 overflow-y-auto py-1">
                    {dataParameters.map((param) => {
                      const isActive = selectedParameter === param.value;
                      return (
                        <button
                          key={param.value}
                          onClick={() => {
                            handleParameterChange(param.value);
                            setDropdownOpen(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors cursor-pointer ${
                            isActive
                              ? 'bg-teal-50'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <span className="text-lg leading-none shrink-0">{param.icon}</span>
                          <div className="min-w-0 flex-1">
                            <p className={`text-sm font-medium truncate ${
                              isActive ? 'text-teal-700' : 'text-gray-700'
                            }`}>
                              {param.label.replace(/\s*\([^)]*\)/, '')}
                            </p>
                            <p className={`text-[10px] ${
                              isActive ? 'text-teal-500' : 'text-gray-400'
                            }`}>
                              {param.label.match(/\(([^)]+)\)/)?.[1] || ''}
                            </p>
                          </div>
                          {isActive && (
                            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-teal-600 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Selected Stations Strip */}
          {selectedStations.length > 0 && (
            <div className="mt-4 pt-3 border-t border-gray-100">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                  Selected Stations ({selectedStations.length})
                </p>
                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center gap-1 text-[10px] font-semibold text-teal-600 hover:text-teal-700 uppercase tracking-wider transition-colors cursor-pointer"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487zm0 0L19.5 7.125" />
                  </svg>
                  Edit
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {selectedStations.map((station) => (
                  <span key={station} className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-teal-50 text-teal-700 border border-teal-200 rounded-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500" />
                    {station}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* District Selection Modal */}
        <DistrictModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          stations={availableStations}
          onConfirm={handleModalConfirm}
        />

        {/* Request Data Modal */}
        <RequestDataModal
          isOpen={showRequestModal}
          onClose={() => setShowRequestModal(false)}
          availableStations={allStations}
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

        {/* Empty State - No Parameter */}
        {!selectedParameter && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
              <div className="text-center max-w-sm">
                <h3 className="text-lg font-semibold text-gray-700 mb-1">
                  Select a Climate Parameter
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Choose a climate parameter from the dropdown above to view historical data across research stations.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State - No Stations */}
        {selectedParameter && selectedStations.length === 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12">
            <div className="flex flex-col items-center justify-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gray-50 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                </svg>
              </div>
              <div className="text-center max-w-sm">
                <h3 className="text-lg font-semibold text-gray-700 mb-1">
                  Select Research Stations
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Choose one or more research stations to view their historical {paramInfo?.label.toLowerCase() || "climate"} data.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Timestamp */}
        <p className="text-center text-xs text-gray-400 pt-2">
          Last updated: {new Date().toLocaleString("en-BD", { timeZone: "Asia/Dhaka", year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} BD
        </p>
      </div>
    </div>
  );
};

export default HistoricalData;