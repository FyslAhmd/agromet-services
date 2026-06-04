import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { toast } from "react-hot-toast";
import { API_ENDPOINTS, apiFetch } from "../../config/api";
import {
  TableCellsIcon,
  MagnifyingGlassIcon,
} from "@heroicons/react/24/outline";

const ViewProjectionData = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  
  const [dataType, setDataType] = useState("minimum-temperature");
  const [district, setDistrict] = useState("");
  const [model, setModel] = useState("");
  const [scenario, setScenario] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [limit, setLimit] = useState(20);

  const dataTypeOptions = [
    { value: "minimum-temperature", label: "Minimum Temperature" },
    { value: "maximum-temperature", label: "Maximum Temperature" },
    { value: "precipitation", label: "Precipitation" },
    { value: "relative-humidity", label: "Relative Humidity" },
  ];

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        dataType,
        page: currentPage,
        limit,
      });

      if (district) params.append("district", district);
      if (model) params.append("model", model);
      if (scenario) params.append("scenario", scenario);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const response = await apiFetch(`${API_ENDPOINTS.projectionsData}?${params.toString()}`);
      setData(response.data || []);
      setTotalPages(response.totalPages || 1);
      setTotalRecords(response.total || 0);
    } catch (error) {
      console.error("Error fetching projection data:", error);
      toast.error("Failed to load projection data");
    } finally {
      setLoading(false);
    }
  }, [dataType, currentPage, limit, district, model, scenario, startDate, endDate]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleApplyFilters = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchData();
  };

  const clearFilters = () => {
    setDistrict("");
    setModel("");
    setScenario("");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

  const renderTableHeaders = () => {
    const commonHeaders = [
      <th key="district" className="px-4 py-3 text-left text-sm font-semibold">District</th>,
      <th key="date" className="px-4 py-3 text-left text-sm font-semibold">Date</th>,
      <th key="model" className="px-4 py-3 text-left text-sm font-semibold">Model</th>,
      <th key="scenario" className="px-4 py-3 text-left text-sm font-semibold">Scenario</th>,
    ];

    switch (dataType) {
      case "minimum-temperature":
        return [
          ...commonHeaders,
          <th key="min_k" className="px-4 py-3 text-right text-sm font-semibold">Min Temp (K)</th>,
          <th key="min_c" className="px-4 py-3 text-right text-sm font-semibold">Min Temp (°C)</th>,
        ];
      case "maximum-temperature":
        return [
          ...commonHeaders,
          <th key="max_k" className="px-4 py-3 text-right text-sm font-semibold">Max Temp (K)</th>,
          <th key="max_c" className="px-4 py-3 text-right text-sm font-semibold">Max Temp (°C)</th>,
        ];
      case "precipitation":
        return [
          ...commonHeaders,
          <th key="precip_flux" className="px-4 py-3 text-right text-sm font-semibold">Precipitation Flux</th>,
          <th key="precip_mm" className="px-4 py-3 text-right text-sm font-semibold">Precipitation (mm)</th>,
        ];
      case "relative-humidity":
        return [
          ...commonHeaders,
          <th key="rh" className="px-4 py-3 text-right text-sm font-semibold">RH (%)</th>,
        ];
      default:
        return commonHeaders;
    }
  };

  const renderTableRow = (row) => {
    const commonCells = (
      <>
        <td className="px-4 py-3 text-sm text-gray-900 font-medium">{row.district}</td>
        <td className="px-4 py-3 text-sm text-gray-600">{row.date}</td>
        <td className="px-4 py-3 text-sm text-gray-600">{row.model}</td>
        <td className="px-4 py-3 text-sm text-gray-600">
          <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs font-mono">
            {row.scenario}
          </span>
        </td>
      </>
    );

    switch (dataType) {
      case "minimum-temperature":
        return (
          <>
            {commonCells}
            <td className="px-4 py-3 text-sm text-right text-gray-900">{row.min_kelvin !== null ? row.min_kelvin.toFixed(4) : '-'}</td>
            <td className="px-4 py-3 text-sm text-right text-gray-900">{row.min_celcius !== null ? row.min_celcius.toFixed(4) : '-'}</td>
          </>
        );
      case "maximum-temperature":
        return (
          <>
            {commonCells}
            <td className="px-4 py-3 text-sm text-right text-gray-900">{row.max_kelvin !== null ? row.max_kelvin.toFixed(4) : '-'}</td>
            <td className="px-4 py-3 text-sm text-right text-gray-900">{row.max_celcius !== null ? row.max_celcius.toFixed(4) : '-'}</td>
          </>
        );
      case "precipitation":
        return (
          <>
            {commonCells}
            <td className="px-4 py-3 text-sm text-right text-gray-900">{row.precipitation_flux !== null ? row.precipitation_flux.toExponential(4) : '-'}</td>
            <td className="px-4 py-3 text-sm text-right text-gray-900">{row.precipitation_mm !== null ? row.precipitation_mm.toFixed(4) : '-'}</td>
          </>
        );
      case "relative-humidity":
        return (
          <>
            {commonCells}
            <td className="px-4 py-3 text-sm text-right text-gray-900">{row.rh_percentage !== null ? row.rh_percentage.toFixed(2) : '-'}</td>
          </>
        );
      default:
        return commonCells;
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-gray-50 via-teal-50 to-gray-100 p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
              <TableCellsIcon className="w-8 h-8 text-teal-600" />
              View Projection Data
            </h1>
            <p className="text-gray-600 mt-1">Explore and filter large-scale projection models</p>
          </div>
          <div className="flex items-center gap-4 bg-teal-50 p-2 rounded-xl border border-teal-100">
             <label className="text-sm font-semibold text-teal-800 ml-2">Data Type:</label>
             <select
                value={dataType}
                onChange={(e) => {
                  setDataType(e.target.value);
                  setCurrentPage(1);
                }}
                className="px-3 py-2 text-sm border border-teal-300 rounded-lg focus:ring-2 focus:ring-teal-500 bg-white"
             >
                {dataTypeOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
             </select>
          </div>
        </div>

        {/* Filters */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-lg p-6"
        >
          <form onSubmit={handleApplyFilters} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">District</label>
              <input
                type="text"
                placeholder="e.g. THAKURGAON"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Model</label>
              <input
                type="text"
                placeholder="e.g. ACCESS-CM2"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Scenario</label>
              <input
                type="text"
                placeholder="e.g. ssp245"
                value={scenario}
                onChange={(e) => setScenario(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-sm"
              />
            </div>
            <div className="col-span-1 sm:col-span-2 md:col-span-5 flex justify-end gap-3 pt-2">
               <button
                  type="button"
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition"
               >
                 Clear
               </button>
               <button
                  type="submit"
                  className="px-5 py-2 text-sm bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-medium shadow flex items-center gap-2 transition"
               >
                 <MagnifyingGlassIcon className="w-4 h-4" />
                 Apply Filters
               </button>
            </div>
          </form>
        </motion.div>

        {/* Data Table */}
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden flex flex-col">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mb-4"></div>
              <p className="text-gray-500">Fetching massive data...</p>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-20">
              <TableCellsIcon className="w-16 h-16 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">No projection data found matching these filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-linear-to-r from-teal-600 to-emerald-600 text-white">
                  <tr>
                    {renderTableHeaders()}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {data.map((row) => (
                    <tr key={row.id} className="hover:bg-teal-50/50 transition-colors">
                      {renderTableRow(row)}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {!loading && data.length > 0 && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-sm text-gray-600 font-medium">
                Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, totalRecords)} of <span className="text-teal-700">{totalRecords.toLocaleString()}</span> records
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-teal-500 bg-white mr-2"
                >
                  <option value="20">20 per page</option>
                  <option value="50">50 per page</option>
                  <option value="100">100 per page</option>
                </select>

                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  First
                </button>
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Prev
                </button>

                <div className="px-3 py-1.5 text-sm bg-teal-100 text-teal-800 font-bold rounded">
                  Page {currentPage} of {totalPages.toLocaleString()}
                </div>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Next
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 text-sm bg-white border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50"
                >
                  Last
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ViewProjectionData;
