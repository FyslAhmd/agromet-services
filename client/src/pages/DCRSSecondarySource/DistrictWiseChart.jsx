import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import MultiLineRiceChart from "./MultiLineRiceChart";
import { DCRS_API_URL } from "../../config/api";

const DistrictWiseChart = ({ selectedDistricts, selectedSeason, dataType = "area" }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [districtData, setDistrictData] = useState(null);

  useEffect(() => {
    if (selectedDistricts && selectedDistricts.length > 0 && selectedSeason) {
      fetchDistrictWiseData();
    }
  }, [selectedDistricts, selectedSeason, dataType]);

  const fetchDistrictWiseData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Join districts with comma for query parameter
      const districtsParam = selectedDistricts.join(',');
      
      const response = await axios.get(`${DCRS_API_URL}/api/district-wise`, {
        params: {
          districts: districtsParam,
          season: selectedSeason,
          // No limit - fetch all data
        }
      });

      console.log("District Wise API Response:", response.data);
      console.log("Total records fetched:", response.data.count);
      console.log("Total records in database:", response.data.total);
      
      if (response.data && response.data.data) {
        setDistrictData(response.data.data);
      } else {
        setError("No data available");
      }
    } catch (err) {
      console.error("Error fetching district-wise data:", err);
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[250px] sm:min-h-[300px] md:min-h-[350px]">
        <div className="flex flex-col items-center gap-3 sm:gap-4 px-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium text-sm sm:text-base text-center">Loading district-wise data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[250px] sm:min-h-[300px] md:min-h-[350px]">
        <div className="text-center px-4">
          <svg
            className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-red-500 mx-auto mb-3 sm:mb-4"
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
          <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 mb-2">Error Loading Data</h3>
          <p className="text-gray-600 text-sm sm:text-base">{error}</p>
        </div>
      </div>
    );
  }

  if (!districtData || districtData.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[250px] sm:min-h-[300px] md:min-h-[350px]">
        <div className="text-center px-4">
          <svg
            className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-gray-400 mx-auto mb-3 sm:mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 className="text-base sm:text-lg md:text-xl font-semibold text-gray-800 mb-2">No Data Available</h3>
          <p className="text-gray-600 text-sm sm:text-base">
            There is no district-wise data available for the selected districts and season.
          </p>
        </div>
      </div>
    );
  }

  // Get color palette: First color matches RiceChart, then use variety of colors
  const getColorPaletteForDataType = (chartType) => {
    switch (chartType) {
      case "area":
        // First color is RiceChart green, then variety of distinct colors
        return [
          "#059669", // Green (RiceChart base)
          "#3b82f6", // Blue
          "#f59e0b", // Amber
          "#8b5cf6", // Purple
          "#ef4444", // Red
          "#06b6d4", // Cyan
          "#ec4899", // Pink
          "#84cc16", // Lime
          "#f97316", // Orange
          "#6366f1", // Indigo
          "#14b8a6", // Teal
          "#a855f7", // Violet
          "#f43f5e", // Rose
          "#22c55e", // Emerald
          "#eab308", // Yellow
        ];
      case "production":
        // First color is RiceChart blue, then variety of distinct colors
        return [
          "#2563eb", // Blue (RiceChart base)
          "#059669", // Green
          "#f59e0b", // Amber
          "#8b5cf6", // Purple
          "#ef4444", // Red
          "#06b6d4", // Cyan
          "#ec4899", // Pink
          "#84cc16", // Lime
          "#f97316", // Orange
          "#6366f1", // Indigo
          "#14b8a6", // Teal
          "#a855f7", // Violet
          "#f43f5e", // Rose
          "#22c55e", // Emerald
          "#eab308", // Yellow
        ];
      case "yield":
        // First color is RiceChart amber, then variety of distinct colors
        return [
          "#f59e0b", // Amber (RiceChart base)
          "#2563eb", // Blue
          "#059669", // Green
          "#8b5cf6", // Purple
          "#ef4444", // Red
          "#06b6d4", // Cyan
          "#ec4899", // Pink
          "#84cc16", // Lime
          "#f97316", // Orange
          "#6366f1", // Indigo
          "#14b8a6", // Teal
          "#a855f7", // Violet
          "#f43f5e", // Rose
          "#22c55e", // Emerald
          "#eab308", // Yellow
        ];
      default:
        // Gray shades as fallback
        return [
          "#6b7280", "#3b82f6", "#059669", "#f59e0b", "#8b5cf6",
          "#ef4444", "#06b6d4", "#ec4899", "#84cc16", "#f97316",
          "#6366f1", "#14b8a6", "#a855f7", "#f43f5e", "#22c55e"
        ];
    }
  };

  // Process data by district - accepts data type parameter
  const processDataByDistrict = (chartDataType) => {
    const districtMap = {};
    const colors = getColorPaletteForDataType(chartDataType);
    
    districtData.forEach(item => {
      if (!districtMap[item.district]) {
        districtMap[item.district] = [];
      }
      districtMap[item.district].push(item);
    });

    // Create series data for each district
    const seriesData = Object.keys(districtMap).map((district, index) => {
      const districtItems = districtMap[district];
      
      // Sort by year
      const sortedData = districtItems
        .map(item => [
          parseInt(item.year),
          parseFloat(item[chartDataType]) || 0
        ])
        .sort((a, b) => a[0] - b[0]);

      return {
        name: district,
        data: sortedData,
        color: colors[index % colors.length]
      };
    });

    return seriesData;
  };



  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4 sm:space-y-5 md:space-y-6"
    >
      {/* Info Banner */}
      <div className="bg-blue-50 border-l-4 border-blue-500 p-3 sm:p-4 rounded-r-lg">
        <div className="flex items-start gap-2 sm:gap-3">
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500 mt-0.5 flex-shrink-0"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
              clipRule="evenodd"
            />
          </svg>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs sm:text-sm font-semibold text-blue-800 mb-1">
              Selected Filters
            </h4>
            <p className="text-xs sm:text-sm text-blue-700 break-words">
              <span className="font-medium">Season:</span> {selectedSeason} | 
              <span className="font-medium ml-2">Districts:</span> {selectedDistricts.join(", ")}
            </p>
          </div>
        </div>
      </div>

      {/* Area Chart */}
      <MultiLineRiceChart
        title={`District-Wise Rice Area - ${selectedSeason} Season`}
        unit="Hectares"
        seriesData={processDataByDistrict("area")}
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

      {/* Production Chart */}
      <MultiLineRiceChart
        title={`District-Wise Rice Production - ${selectedSeason} Season`}
        unit="Metric Tons"
        seriesData={processDataByDistrict("production")}
        icon={
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        }
      />

      {/* Yield Chart */}
      <MultiLineRiceChart
        title={`District-Wise Rice Yield - ${selectedSeason} Season`}
        unit="MT/Hectare"
        seriesData={processDataByDistrict("yield")}
        icon={
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        }
      />
    </motion.div>
  );
};

export default DistrictWiseChart;
