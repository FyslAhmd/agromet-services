import React, { useEffect, useState } from "react";
import axios from "axios";
import { DCRS_API_URL } from "../../config/api";
import MultiLineRiceChart from "./MultiLineRiceChart";

const SEASONS = [
  { name: "Aus", areaField: "areaAus", productionField: "prodAus", yieldField: "yieldAus", color: "#059669" },
  { name: "Aman", areaField: "areaAman", productionField: "prodAman", yieldField: "yieldAman", color: "#2563eb" },
  { name: "Boro", areaField: "areaBoro", productionField: "prodBoro", yieldField: "yieldBoro", color: "#f59e0b" },
];

const CHARTS = [
  {
    key: "area",
    title: "Combined Seasonal Rice Area",
    unit: "Thousand Hectares (000' ha)",
    fieldKey: "areaField",
    iconPath:
      "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7",
  },
  {
    key: "production",
    title: "Combined Seasonal Rice Production",
    unit: "Thousand Metric Tons (000' MT)",
    fieldKey: "productionField",
    iconPath:
      "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4",
  },
  {
    key: "yield",
    title: "Combined Seasonal Rice Yield",
    unit: "Metric Tons per Hectare (MT/ha)",
    fieldKey: "yieldField",
    iconPath:
      "M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z",
  },
];

const ChartIcon = ({ path }) => (
  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
  </svg>
);

const CombinedSeasonalRiceChart = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allSeasonData, setAllSeasonData] = useState([]);

  useEffect(() => {
    const fetchAllSeasonData = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await axios.get(`${DCRS_API_URL}/api/all-season-data`);
        const data = response.data.data || response.data;
        setAllSeasonData(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Error fetching combined seasonal rice data:", err);
        setError(err.response?.data?.message || "Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchAllSeasonData();
  }, []);

  const buildSeries = (fieldKey) => {
    const sortedData = [...allSeasonData].sort((a, b) => parseInt(a.year) - parseInt(b.year));

    return SEASONS.map((season) => ({
      name: season.name,
      color: season.color,
      data: sortedData
        .map((record) => {
          const year = parseInt(record.year);
          const value = parseFloat(record[season[fieldKey]]) || 0;
          return [year, value];
        })
        .filter(([year, value]) => Number.isFinite(year) && value > 0),
    }));
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 sm:py-16 md:py-20">
        <div className="animate-spin rounded-full h-12 w-12 sm:h-14 sm:w-14 md:h-16 md:w-16 border-4 border-teal-200 border-t-teal-600 mb-3 sm:mb-4"></div>
        <p className="text-gray-600 text-sm sm:text-base md:text-lg px-4 text-center">
          Loading combined seasonal rice data...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border-l-4 border-red-500 p-4 sm:p-5 md:p-6 rounded-r-lg">
        <div className="flex items-center">
          <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-red-500 mr-2 sm:mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

  if (allSeasonData.length === 0 || CHARTS.every((chart) => buildSeries(chart.fieldKey).every((series) => series.data.length === 0))) {
    return (
      <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 sm:p-5 md:p-6 rounded-r-lg">
        <div className="flex items-center">
          <svg className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-yellow-500 mr-2 sm:mr-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="min-w-0">
            <h3 className="text-yellow-800 font-bold text-sm sm:text-base md:text-lg">No Data Available</h3>
            <p className="text-yellow-600 text-xs sm:text-sm mt-1">
              No combined seasonal rice data found. Please check if all season data has been uploaded.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5 md:space-y-6">
      <div className="bg-linear-to-r from-[#0a3d3d] to-[#0d5555] text-white p-4 sm:p-5 md:p-6 rounded-2xl shadow-sm">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-2 sm:gap-3">
          <svg className="w-6 h-6 sm:w-7 sm:h-7 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
          <span className="min-w-0 truncate">Combined Seasonal Rice Statistics</span>
        </h2>
        <p className="text-teal-200/70 mt-1.5 sm:mt-2 text-xs sm:text-sm md:text-base">
          Aus, Aman, and Boro trends shown together for area, production, and yield
        </p>
      </div>

      {CHARTS.map((chart) => {
        const seriesData = buildSeries(chart.fieldKey);

        if (seriesData.every((series) => series.data.length === 0)) {
          return null;
        }

        return (
          <MultiLineRiceChart
            key={chart.key}
            title={chart.title}
            unit={chart.unit}
            seriesData={seriesData}
            icon={<ChartIcon path={chart.iconPath} />}
          />
        );
      })}
    </div>
  );
};

export default CombinedSeasonalRiceChart;
