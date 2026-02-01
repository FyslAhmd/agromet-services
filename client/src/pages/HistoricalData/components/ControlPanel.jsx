import React from "react";

const ControlPanel = ({
  selectedParameter,
  onParameterChange,
  dataParameters,
  dataInterval,
  onIntervalChange,
  intervals,
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  selectedDistricts,
  onRemoveDistrict,
  onAddMoreClick,
  onGenerateChart,
}) => {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-100 p-6 mb-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-6">
        {/* Parameter Selection */}
        <div className="lg:col-span-1">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            📊 Parameter
          </label>
          <select
            value={selectedParameter}
            onChange={onParameterChange}
            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-gray-700"
          >
            <option value="">Select Parameter</option>
            {dataParameters.map((param) => (
              <option key={param.value} value={param.value}>
                {param.label}
              </option>
            ))}
          </select>
        </div>

        {/* Data Interval */}
        <div className="lg:col-span-1">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            📅 Time Range
          </label>
          <select
            value={dataInterval}
            onChange={(e) => onIntervalChange(e.target.value)}
            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all font-medium text-gray-700"
          >
            {intervals.map((interval) => (
              <option key={interval.value} value={interval.value}>
                {interval.label}
              </option>
            ))}
          </select>
        </div>

        {/* Custom Date Range */}
        <div className="lg:col-span-1">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            📆 Start Date
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-700"
          />
        </div>
        <div className="lg:col-span-1">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            📆 End Date
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all text-gray-700"
          />
        </div>
      </div>

      {/* Selected Districts Display */}
      {selectedDistricts.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            🏢 Selected Stations ({selectedDistricts.length})
          </label>
          <div className="flex flex-wrap gap-2">
            {selectedDistricts.map((district) => (
              <span
                key={district}
                className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-md"
              >
                {district}
                <button
                  onClick={() => onRemoveDistrict(district)}
                  className="ml-2 hover:bg-white/20 rounded-full p-0.5 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
            <button
              onClick={onAddMoreClick}
              className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-md hover:shadow-lg transition-all"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add More
            </button>
          </div>
        </div>
      )}

      {/* Generate Button */}
      {selectedParameter && selectedDistricts.length > 0 && (
        <button
          onClick={onGenerateChart}
          className="w-full py-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          Generate Chart
        </button>
      )}
    </div>
  );
};

export default ControlPanel;
