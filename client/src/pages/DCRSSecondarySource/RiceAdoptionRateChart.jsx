import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import MultiLineRiceChart from "./MultiLineRiceChart";
import { DCRS_API_URL } from "../../config/api";

const RiceAdoptionRateChart = ({ selectedSeason, selectedVarieties = [] }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adoptionData, setAdoptionData] = useState([]);

  useEffect(() => {
    if (selectedSeason && selectedVarieties.length > 0) {
      fetchAdoptionData();
    }
  }, [selectedSeason, selectedVarieties]);

  const fetchAdoptionData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch rice adoption rate data for the selected season
      const response = await axios.get(`${DCRS_API_URL}/api/rice-adoption-rate`, {
        params: {
          season: selectedSeason,
          limit: 10000 // Get all records
        }
      });

      console.log("Rice Adoption Rate API Response:", response.data);

      if (response.data?.success && response.data?.data) {
        setAdoptionData(response.data.data);
      } else {
        setError("No data available");
      }
    } catch (err) {
      console.error("Error fetching adoption rate data:", err);
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[250px] sm:min-h-[300px] md:min-h-[350px]">
        <div className="flex flex-col items-center gap-3 sm:gap-4 px-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium text-sm sm:text-base text-center">Loading rice adoption rate data...</p>
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

  // Process data for selected varieties
  const processAdoptionData = () => {
    const seriesData = [];

    // Define color palette for varieties (orange family as main, then varied colors)
    const colorPalette = [
      '#f59e0b', // Amber-500 (Orange - main theme)
      '#3b82f6', // Blue-500
      '#10b981', // Green-500
      '#8b5cf6', // Purple-500
      '#ef4444', // Red-500
      '#06b6d4', // Cyan-500
      '#ec4899', // Pink-500
      '#f97316', // Orange-600
      '#14b8a6', // Teal-500
      '#6366f1', // Indigo-500
      '#84cc16', // Lime-500
      '#f43f5e', // Rose-500
      '#a855f7', // Purple-600
      '#22d3ee', // Cyan-400
      '#fb923c', // Orange-400
    ];

    selectedVarieties.forEach((variety, index) => {
      // Filter data for this variety and season
      const varietyData = adoptionData.filter(
        item => item.variety === variety && item.season === selectedSeason
      );

      if (varietyData.length > 0) {
        // Convert to [year, adoptionRate] format and sort by year
        const chartData = varietyData
          .map(item => [
            parseInt(item.year),
            parseFloat(item.adoptionRate) || 0
          ])
          .sort((a, b) => a[0] - b[0]); // Sort by year ascending

        // Get color from palette (cycle through if more varieties than colors)
        const color = colorPalette[index % colorPalette.length];

        seriesData.push({
          name: variety,
          data: chartData,
          color: color
        });
      }
    });

    return seriesData;
  };

  const seriesData = processAdoptionData();

  if (seriesData.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[250px] sm:min-h-[300px] md:min-h-[350px]">
        <div className="text-center">
          <svg
            className="w-16 h-16 text-gray-400 mx-auto mb-4"
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
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Data Available</h3>
          <p className="text-gray-600">
            No adoption rate data found for the selected season and varieties.
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4 sm:space-y-5 md:space-y-6"
    >
      {/* Info Banner */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border-l-4 border-orange-500 p-3 sm:p-4 rounded-lg shadow-sm">
        <div className="flex items-start gap-2 sm:gap-3">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="min-w-0 flex-1">
            <h4 className="text-orange-900 font-bold text-xs sm:text-sm mb-1">
              Rice Adoption Rate - {selectedSeason} Season
            </h4>
            <p className="text-orange-800 text-xs sm:text-sm break-words">
              Showing adoption rate trends for <span className="font-semibold">{selectedVarieties.length}</span> selected {selectedVarieties.length === 1 ? 'variety' : 'varieties'}: 
              <span className="font-semibold"> {selectedVarieties.join(', ')}</span>
            </p>
            <p className="text-orange-700 text-[10px] sm:text-xs mt-1">
              Adoption rates are shown as percentages (%) over the years
            </p>
          </div>
        </div>
      </div>

      {/* Adoption Rate Chart */}
      <MultiLineRiceChart
        title={`Rice Adoption Rate - ${selectedSeason} Season`}
        unit="Adoption Rate (%)"
        seriesData={seriesData}
        icon="📊"
      />
    </motion.div>
  );
};

export default RiceAdoptionRateChart;
