import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import { DCRS_API_URL } from "../../config/api";
import RiceChart from "./RiceChart";

const SeasonalRiceChart = ({ selectedSeason }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [seasonalData, setSeasonalData] = useState({
    area: [],
    production: [],
    yield: []
  });

  useEffect(() => {
    const fetchSeasonalData = async () => {
      if (!selectedSeason) return;

      setLoading(true);
      setError(null);

      try {
        console.log(`Fetching data for season: ${selectedSeason}`);
        
        // Fetch all season data from backend (get all records)
        const response = await axios.get(`${DCRS_API_URL}/api/all-season-data`);
        
        console.log("API Response:", response.data);

        // Extract data array from response
        const data = response.data.data || response.data;
        
        console.log("Data array:", data);

        // Process the data based on selected season
        const processedData = processSeasonData(data, selectedSeason);
        
        console.log("Processed Data:", processedData);
        
        setSeasonalData(processedData);
      } catch (err) {
        console.error("Error fetching seasonal data:", err);
        setError(err.response?.data?.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchSeasonalData();
  }, [selectedSeason]);

  // Process data based on selected season
  const processSeasonData = (data, season) => {
    const areaData = [];
    const productionData = [];
    const yieldData = [];

    // Sort data by year
    const sortedData = data.sort((a, b) => {
      const yearA = parseInt(a.year);
      const yearB = parseInt(b.year);
      return yearA - yearB;
    });

    sortedData.forEach(record => {
      const year = parseInt(record.year);

      // Map season to data fields
      let areaField, prodField, yieldField;
      
      if (season === "Aus") {
        areaField = "areaAus";
        prodField = "prodAus";
        yieldField = "yieldAus";
      } else if (season === "Aman") {
        areaField = "areaAman";
        prodField = "prodAman";
        yieldField = "yieldAman";
      } else if (season === "Boro") {
        areaField = "areaBoro";
        prodField = "prodBoro";
        yieldField = "yieldBoro";
      }

      // Extract values
      const areaValue = parseFloat(record[areaField]) || 0;
      const prodValue = parseFloat(record[prodField]) || 0;
      const yieldValue = parseFloat(record[yieldField]) || 0;

      // Add to arrays if values are non-zero
      if (areaValue > 0) {
        areaData.push([year, areaValue]);
      }
      if (prodValue > 0) {
        productionData.push([year, prodValue]);
      }
      if (yieldValue > 0) {
        yieldData.push([year, yieldValue]);
      }
    });

    return {
      area: areaData,
      production: productionData,
      yield: yieldData
    };
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 sm:py-16 md:py-20">
        <div className="animate-spin rounded-full h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 border-b-4 border-green-600 mb-3 sm:mb-4"></div>
        <p className="text-gray-600 text-sm sm:text-base md:text-lg px-4 text-center">Loading {selectedSeason} season data...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 sm:p-5 md:p-6 rounded-r-lg">
        <div className="flex items-center">
          <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-red-500 mr-2 sm:mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="min-w-0">
            <h3 className="text-red-800 font-bold text-sm sm:text-base md:text-lg">Error Loading Data</h3>
            <p className="text-red-600 text-xs sm:text-sm mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (seasonalData.area.length === 0 && seasonalData.production.length === 0 && seasonalData.yield.length === 0) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 sm:p-5 md:p-6 rounded-r-lg">
        <div className="flex items-center">
          <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-yellow-500 mr-2 sm:mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="min-w-0">
            <h3 className="text-yellow-800 font-bold text-sm sm:text-base md:text-lg">No Data Available</h3>
            <p className="text-yellow-600 text-xs sm:text-sm mt-1">
              No data found for {selectedSeason} season. Please check if data has been uploaded.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Display charts
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4 sm:space-y-5 md:space-y-6"
    >
      {/* Season Header */}
      <div className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 sm:p-5 md:p-6 rounded-lg shadow-lg">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2 sm:gap-3">
          <span className="text-2xl sm:text-3xl flex-shrink-0">🌾</span>
          <span className="min-w-0 truncate">{selectedSeason} Season Rice Statistics</span>
        </h2>
        <p className="text-green-100 mt-1.5 sm:mt-2 text-xs sm:text-sm md:text-base">
          Historical data showing area, production, and yield trends
        </p>
      </div>

      {/* Rice Area Chart */}
      {seasonalData.area.length > 0 && (
        <RiceChart
          title={`${selectedSeason} Rice Area`}
          unit="Thousand Hectares (000' ha)"
          data={seasonalData.area}
          color="#059669"
          icon="🌾"
        />
      )}

      {/* Rice Production Chart */}
      {seasonalData.production.length > 0 && (
        <RiceChart
          title={`${selectedSeason} Rice Production`}
          unit="Thousand Metric Tons (000' MT)"
          data={seasonalData.production}
          color="#2563eb"
          icon="📦"
        />
      )}

      {/* Rice Yield Chart */}
      {seasonalData.yield.length > 0 && (
        <RiceChart
          title={`${selectedSeason} Rice Yield`}
          unit="Metric Tons per Hectare (MT/ha)"
          data={seasonalData.yield}
          color="#f59e0b"
          icon="📊"
        />
      )}
    </motion.div>
  );
};

export default SeasonalRiceChart;
