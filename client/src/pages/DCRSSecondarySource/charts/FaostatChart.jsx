import React, { useState, useEffect } from "react";
import RiceChart from "../RiceChart";
import axios from "axios";
import { DCRS_API_URL } from "../../../config/api";

const FaostatChart = () => {
  const [emissionsData, setEmissionsData] = useState([]);
  const [areaData, setAreaData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchFaostatData();
  }, []);

  const fetchFaostatData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all FAOStat data
      const response = await axios.get(`${DCRS_API_URL}/api/faostat-data`, {
        params: {
          page: 1,
          limit: 1000, // Get all data
        },
      });

      if (response.data.success) {
        const allData = response.data.data;

        // Filter data for emissions CH4
        const emissions = allData
          .filter(
            (item) =>
              item.element === "Emissions CH4 (kt) from Rice Cultivation"
          )
          .map((item) => {
            const year = parseInt(item.year);
            const value = parseFloat(item.value);
            return [year, value];
          })
          .sort((a, b) => a[0] - b[0]); // Sort by year ascending

        // Filter data for harvested area
        const area = allData
          .filter((item) => item.element === "Harvested Rice Area (ha)")
          .map((item) => {
            const year = parseInt(item.year);
            const value = parseFloat(item.value);
            return [year, value];
          })
          .sort((a, b) => a[0] - b[0]); // Sort by year ascending

        setEmissionsData(emissions);
        setAreaData(area);
      } else {
        setError(response.data.message || "Failed to fetch FAOStat data");
      }
    } catch (err) {
      console.error("Error fetching FAOStat data:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Failed to fetch FAOStat data"
      );
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-teal-600 mb-4"></div>
          <p className="text-gray-600 font-medium">Loading FAOStat data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-red-500 mb-4">
            <svg
              className="w-16 h-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Error Loading Data
          </h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchFaostatData}
            className="px-6 py-2 bg-[#0d4a4a] text-white rounded-lg hover:bg-[#0a3d3d] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (emissionsData.length === 0 && areaData.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="text-gray-300 mb-4">
            <svg
              className="w-16 h-16"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            No FAOStat Data Available
          </h3>
          <p className="text-gray-500 max-w-md mx-auto text-center">
            Please upload FAOStat data from the "Add Data" section to view
            visualizations here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-linear-to-r from-[#0a3d3d] to-[#0d5555] rounded-2xl shadow-sm p-6 text-white">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-white/15 rounded-lg flex items-center justify-center backdrop-blur-sm">
            <svg
              className="w-7 h-7"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <div>
            <h2 className="text-2xl font-bold">FAOStat Global Rice Data</h2>
            <p className="text-teal-200/70 text-sm mt-1">
              Global rice statistics from Food and Agriculture Organization
            </p>
          </div>
        </div>
      </div>

      {/* Emissions Chart */}
      {emissionsData.length > 0 && (
        <div>
          <RiceChart
            data={emissionsData}
            title="Emissions CH4 (kt) from Rice Cultivation"
            yAxisTitle="CH4 Emissions (kt)"
            showDecimals={false}
            color="#DC2626"
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
                />
              </svg>
            }
          />
        </div>
      )}

      {/* Harvested Area Chart */}
      {areaData.length > 0 && (
        <div>
          <RiceChart
            data={areaData}
            title="Harvested Rice Area (ha)"
            yAxisTitle="Area (hectares)"
            showDecimals={false}
            color="#059669"
            icon={
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
                />
              </svg>
            }
          />
        </div>
      )}
    </div>
  );
};

export default FaostatChart;
