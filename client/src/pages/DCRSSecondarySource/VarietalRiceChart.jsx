import React, { useState, useEffect } from "react";
import axios from "axios";
import { motion } from "framer-motion";
import RiceChart from "./RiceChart";
import MultiLineRiceChart from "./MultiLineRiceChart";
import { DCRS_API_URL } from "../../config/api";

const VarietalRiceChart = ({ selectedSeason, selectedVarieties = [] }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [varietalData, setVarietalData] = useState({
    area: [],
    production: [],
    yield: []
  });

  useEffect(() => {
    if (selectedSeason && selectedVarieties.length > 0) {
      fetchVarietalData();
    }
  }, [selectedSeason, selectedVarieties]);

  const fetchVarietalData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all three data types from seasonal_data table
      const [areaResponse, productionResponse, yieldResponse] = await Promise.all([
        axios.get(`${DCRS_API_URL}/api/seasonal-data`, { params: { dataType: 'area' } }),
        axios.get(`${DCRS_API_URL}/api/seasonal-data`, { params: { dataType: 'production' } }),
        axios.get(`${DCRS_API_URL}/api/seasonal-data`, { params: { dataType: 'yield' } })
      ]);

      console.log("Varietal Area API Response:", areaResponse.data);
      console.log("Varietal Production API Response:", productionResponse.data);
      console.log("Varietal Yield API Response:", yieldResponse.data);

      if (areaResponse.data?.data && productionResponse.data?.data && yieldResponse.data?.data) {
        setVarietalData({
          area: areaResponse.data.data,
          production: productionResponse.data.data,
          yield: yieldResponse.data.data
        });
      } else {
        setError("No data available");
      }
    } catch (err) {
      console.error("Error fetching varietal data:", err);
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[250px] sm:min-h-[300px] md:min-h-[350px]">
        <div className="flex flex-col items-center gap-3 sm:gap-4 px-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium text-sm sm:text-base text-center">Loading varietal rice data...</p>
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

  // Map season to database field prefix
  const getSeasonFieldPrefix = (season) => {
    switch (season) {
      case "Aus":
        return "aus";
      case "T. Aman":
        return "taman";
      case "B. Aman":
        return "baman";
      case "Boro":
        return "boro";
      default:
        return "aus";
    }
  };

  // Map variety to database field suffix
  const getVarietySuffix = (variety) => {
    if (variety === "MV") return "Mv";
    if (variety === "LV") return "Lv";
    return "Mv"; // Default
  };

  // Process data for single variety
  const processSingleVarietyData = (dataType, variety) => {
    const data = varietalData[dataType];
    if (!data || data.length === 0) return [];

    const seasonPrefix = getSeasonFieldPrefix(selectedSeason);
    
    // For B. Aman, use bamanMv field (no LV option)
    let fieldName;
    if (selectedSeason === "B. Aman") {
      fieldName = "bamanMv";
    } else {
      const varietySuffix = getVarietySuffix(variety);
      fieldName = `${seasonPrefix}${varietySuffix}`;
    }

    console.log(`Processing ${dataType} data for field: ${fieldName}`);

    return data
      .map(item => {
        const value = item[fieldName];
        return [parseInt(item.year), parseFloat(value) || 0];
      })
      .filter(([year, value]) => value > 0) // Filter out zero values
      .sort((a, b) => a[0] - b[0]);
  };

  // Get base color for each data type (matching RiceChart colors)
  const getDataTypeColor = (dataType) => {
    switch (dataType) {
      case "area":
        return "#059669"; // Green
      case "production":
        return "#2563eb"; // Blue
      case "yield":
        return "#f59e0b"; // Amber/Orange
      default:
        return "#6b7280"; // Gray
    }
  };

  // Get color variations: First matches RiceChart, second uses different color
  const getVarietyColor = (dataType, variety, index) => {
    // First color matches RiceChart, second uses contrasting color
    const baseColors = {
      area: ["#059669", "#3b82f6"],      // Green (base), then Blue
      production: ["#2563eb", "#f59e0b"], // Blue (base), then Amber
      yield: ["#f59e0b", "#8b5cf6"]       // Amber (base), then Purple
    };
    
    const colors = baseColors[dataType] || ["#6b7280", "#3b82f6"];
    return colors[index] || colors[0];
  };

  // Process data for multiple varieties (for MultiLineRiceChart)
  const processMultiVarietyData = (dataType) => {
    return selectedVarieties.map((variety, index) => {
      const data = processSingleVarietyData(dataType, variety);
      return {
        name: variety === "MV" ? "Modern Variety (MV)" : "Local Variety (LV)",
        data: data,
        color: getVarietyColor(dataType, variety, index)
      };
    });
  };

  // Check if we're showing multiple varieties
  const isMultiVariety = selectedVarieties.length > 1;

  // Process data based on single or multiple variety
  let areaData, productionData, yieldData;
  if (isMultiVariety) {
    areaData = processMultiVarietyData("area");
    productionData = processMultiVarietyData("production");
    yieldData = processMultiVarietyData("yield");
    
    console.log("Processed Multi-Variety Area Data:", areaData);
    console.log("Processed Multi-Variety Production Data:", productionData);
    console.log("Processed Multi-Variety Yield Data:", yieldData);
  } else {
    areaData = processSingleVarietyData("area", selectedVarieties[0]);
    productionData = processSingleVarietyData("production", selectedVarieties[0]);
    yieldData = processSingleVarietyData("yield", selectedVarieties[0]);
    
    console.log("Processed Single Variety Area Data:", areaData);
    console.log("Processed Single Variety Production Data:", productionData);
    console.log("Processed Single Variety Yield Data:", yieldData);
  }

  // Check if data is empty
  const hasData = isMultiVariety 
    ? (areaData.some(s => s.data.length > 0) || productionData.some(s => s.data.length > 0) || yieldData.some(s => s.data.length > 0))
    : (areaData.length > 0 || productionData.length > 0 || yieldData.length > 0);

  if (!hasData) {
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
            There is no varietal rice data available for {selectedSeason}
            {selectedSeason !== "B. Aman" && ` - ${selectedVarieties.join(" & ")}`}.
          </p>
        </div>
      </div>
    );
  }

  // Get title based on season and varieties
  const getTitle = (dataType) => {
    const varietyText = selectedSeason === "B. Aman" 
      ? "B. Aman" 
      : isMultiVariety
        ? `${selectedSeason} - ${selectedVarieties.join(" & ")}`
        : `${selectedSeason} - ${selectedVarieties[0]}`;
    
    switch (dataType) {
      case "area":
        return `Rice Area (${varietyText})`;
      case "production":
        return `Rice Production (${varietyText})`;
      case "yield":
        return `Rice Yield (${varietyText})`;
      default:
        return `Rice ${dataType}`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-4 sm:space-y-5 md:space-y-6"
    >
      {/* Info Banner */}
      <div className="bg-purple-50 border-l-4 border-purple-500 p-3 sm:p-4 rounded-r-lg">
        <div className="flex items-start gap-2 sm:gap-3">
          <svg
            className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500 mt-0.5 flex-shrink-0"
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
            <h4 className="text-xs sm:text-sm font-semibold text-purple-800 mb-1">
              Selected Filters
            </h4>
            <p className="text-xs sm:text-sm text-purple-700">
              <span className="font-medium">Season:</span> {selectedSeason}
              {selectedSeason !== "B. Aman" && (
                <> | <span className="font-medium">Varieties:</span> {selectedVarieties.join(" & ")}</>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Render Charts based on single or multiple varieties */}
      {isMultiVariety ? (
        <>
          {/* Multi-Variety Charts using MultiLineRiceChart */}
          {areaData.some(s => s.data.length > 0) && (
            <MultiLineRiceChart
              title={getTitle("area")}
              unit="Thousand Hectares"
              seriesData={areaData}
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
          )}

          {productionData.some(s => s.data.length > 0) && (
            <MultiLineRiceChart
              title={getTitle("production")}
              unit="Thousand Metric Tons"
              seriesData={productionData}
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
          )}

          {yieldData.some(s => s.data.length > 0) && (
            <MultiLineRiceChart
              title={getTitle("yield")}
              unit="Metric Tons/Hectare"
              seriesData={yieldData}
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
          )}
        </>
      ) : (
        <>
          {/* Single Variety Charts using RiceChart */}
          {areaData.length > 0 && (
            <RiceChart
              title={getTitle("area")}
              unit="Thousand Hectares"
              data={areaData}
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
          )}

          {productionData.length > 0 && (
            <RiceChart
              title={getTitle("production")}
              unit="Thousand Metric Tons"
              data={productionData}
              color="#2563eb"
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
          )}

          {yieldData.length > 0 && (
            <RiceChart
              title={getTitle("yield")}
              unit="Metric Tons/Hectare"
              data={yieldData}
              color="#f59e0b"
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
          )}
        </>
      )}
    </motion.div>
  );
};

export default VarietalRiceChart;
