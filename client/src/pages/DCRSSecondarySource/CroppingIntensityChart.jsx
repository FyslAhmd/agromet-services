import React, { useState, useEffect } from "react";
import axios from "axios";
import RiceChart from "./RiceChart";
import MultiLineRiceChart from "./MultiLineRiceChart";
import { DCRS_API_URL } from "../../config/api";

const CroppingIntensityChart = ({ selectedDataType }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [croppingData, setcroppingData] = useState(null);

  useEffect(() => {
    fetchCroppingIntensityData();
  }, []);

  const fetchCroppingIntensityData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${DCRS_API_URL}/api/cropping-intensity`);
      console.log("Cropping Intensity API Response:", response.data);
      
      if (response.data && response.data.data) {
        setcroppingData(response.data.data);
      } else {
        setError("No data available");
      }
    } catch (err) {
      console.error("Error fetching cropping intensity data:", err);
      setError(err.message || "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-62.5 sm:min-h-75 md:min-h-87.5">
        <div className="flex flex-col items-center gap-3 sm:gap-4 px-4">
          <div className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 border-4 border-teal-200 border-t-teal-600 rounded-full animate-spin"></div>
          <p className="text-gray-600 font-medium text-sm sm:text-base text-center">Loading cropping intensity data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-62.5 sm:min-h-75 md:min-h-87.5">
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

  if (!croppingData || croppingData.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-62.5 sm:min-h-75 md:min-h-87.5">
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
            There is no cropping intensity data to display at the moment.
          </p>
        </div>
      </div>
    );
  }

  // Process data based on selected type
  if (selectedDataType === "Cropped Area") {
    // Show MultiLineRiceChart with 4 series
    // First color matches RiceChart (green for area), then use variety of colors
    const seriesData = [
      {
        name: "Single Cropped Area",
        data: croppingData
          .map((item) => [
            parseInt(item.year),
            parseFloat(item.singleCroppedArea) || null,
          ])
          .filter(([year, value]) => value !== null)
          .sort((a, b) => a[0] - b[0]),
        color: "#059669", // Green (RiceChart base for area)
      },
      {
        name: "Double Cropped Area",
        data: croppingData
          .map((item) => [
            parseInt(item.year),
            parseFloat(item.doubleCroppedArea) || null,
          ])
          .filter(([year, value]) => value !== null)
          .sort((a, b) => a[0] - b[0]),
        color: "#3b82f6", // Blue
      },
      {
        name: "Triple Cropped Area",
        data: croppingData
          .map((item) => [
            parseInt(item.year),
            parseFloat(item.tripleCroppedArea) || null,
          ])
          .filter(([year, value]) => value !== null)
          .sort((a, b) => a[0] - b[0]),
        color: "#f59e0b", // Amber
      },
      {
        name: "Net Cropped Area",
        data: croppingData
          .map((item) => [
            parseInt(item.year),
            parseFloat(item.netCroppedArea) || null,
          ])
          .filter(([year, value]) => value !== null)
          .sort((a, b) => a[0] - b[0]),
        color: "#8b5cf6", // Purple
      },
    ];

    console.log("Cropped Area Series Data:", seriesData);

    return (
      <div>
        <MultiLineRiceChart
          title="Cropped Area Over Time"
          unit="Hectares"
          seriesData={seriesData}
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
      </div>
    );
  } else if (selectedDataType === "Cropping Intensity %") {
    // Show RiceChart with single series: cropping intensity percentage
    const intensityData = croppingData
      .map((item) => [
        parseInt(item.year),
        parseFloat(item.croppingIntensity) || null,
      ])
      .filter(([year, value]) => value !== null)
      .sort((a, b) => a[0] - b[0]);

    console.log("Cropping Intensity Data:", intensityData);

    return (
      <div>
        <RiceChart
          title="Cropping Intensity (%)"
          unit="%"
          data={intensityData}
          color="#14b8a6"
          icon={
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
              />
            </svg>
          }
        />
      </div>
    );
  }

  return null;
};

export default CroppingIntensityChart;
