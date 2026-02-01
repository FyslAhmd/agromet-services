import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";

// Try to load Highcharts export modules
if (typeof window !== "undefined") {
  try {
    const exporting = require("highcharts/modules/exporting");
    const exportData = require("highcharts/modules/export-data");
    const offlineExporting = require("highcharts/modules/offline-exporting");

    exporting(Highcharts);
    exportData(Highcharts);
    offlineExporting(Highcharts);
  } catch (error) {
    console.warn("Some Highcharts export modules could not be loaded:", error);
  }
}

const MultiLineRiceChart = ({ title, unit, seriesData, icon }) => {
  // seriesData format: [{ name: "Export", data: [[year, value], ...], color: "#10b981" }, ...]

  const chartRef = useRef(null);
  const [timeRange, setTimeRange] = useState("10Y");
  const [averageRange, setAverageRange] = useState(null);
  const [filteredData, setFilteredData] = useState(seriesData);
  const [processedData, setProcessedData] = useState(seriesData);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [chartHeight, setChartHeight] = useState(380);
  const chartId = `chart-${title.replace(/\s+/g, "-").toLowerCase()}`;
  
  // Custom year range state
  const [useCustomRange, setUseCustomRange] = useState(false);
  const [fromYear, setFromYear] = useState(null);
  const [toYear, setToYear] = useState(null);
  
  // Get available years from all series data
  const availableYears = useMemo(() => {
    if (!seriesData || seriesData.length === 0) return [];
    const yearsSet = new Set();
    seriesData.forEach(s => {
      s.data.forEach(([year]) => yearsSet.add(year));
    });
    return Array.from(yearsSet).sort((a, b) => a - b);
  }, [seriesData]);
  
  // Initialize fromYear and toYear when availableYears changes
  useEffect(() => {
    if (availableYears.length > 0 && fromYear === null) {
      setFromYear(availableYears[0]);
      setToYear(availableYears[availableYears.length - 1]);
    }
  }, [availableYears]);

  // Define filter functions first (before useEffect hooks that use them)
  const filterDataByTimeRange = useCallback((series, range, customRange = false, startYear = null, endYear = null) => {
    // If using custom range
    if (customRange && startYear !== null && endYear !== null) {
      return series.map((s) => ({
        ...s,
        data: s.data.filter(([year]) => year >= startYear && year <= endYear),
      }));
    }
    
    if (range === "All") {
      return series;
    }

    const years = parseInt(range.replace("Y", ""));

    // Get max year from all series
    let maxYear = 0;
    series.forEach((s) => {
      s.data.forEach(([year]) => {
        if (year > maxYear) maxYear = year;
      });
    });

    const minYear = maxYear - years + 1;

    return series.map((s) => ({
      ...s,
      data: s.data.filter(([year]) => year >= minYear),
    }));
  }, []);

  const applyAveraging = useCallback((series, avgRange) => {
    const avgYears = parseInt(avgRange.replace("Y", ""));

    return series.map((s) => {
      const averaged = [];
      const sortedData = [...s.data].sort((a, b) => a[0] - b[0]);

      for (let i = 0; i < sortedData.length; i += avgYears) {
        const group = sortedData.slice(i, i + avgYears);
        if (group.length === 0) continue;

        const avgYear = Math.round(
          group.reduce((sum, [year]) => sum + year, 0) / group.length
        );
        const avgValue =
          group.reduce((sum, [, value]) => sum + value, 0) / group.length;

        averaged.push([avgYear, parseFloat(avgValue.toFixed(2))]);
      }

      return { ...s, data: averaged };
    });
  }, []);

  // Handle responsive chart height
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setChartHeight(280); // Mobile
      } else if (window.innerWidth < 768) {
        setChartHeight(320); // Tablet
      } else {
        setChartHeight(380); // Desktop
      }
    };

    handleResize(); // Initial call
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Update filtered and processed data when seriesData, time range, or average changes
  // This matches the RiceChart pattern - do everything in one effect
  useEffect(() => {
    if (!seriesData || seriesData.length === 0) {
      setFilteredData([]);
      setProcessedData([]);
      return;
    }

    // Step 1: Filter by time range or custom range (always from original seriesData)
    const filtered = filterDataByTimeRange(seriesData, timeRange, useCustomRange, fromYear, toYear);
    setFilteredData(filtered);

    // Step 2: Apply averaging to the filtered data
    if (averageRange) {
      const averaged = applyAveraging(filtered, averageRange);
      setProcessedData(averaged);
    } else {
      // No averaging - just use the time-filtered data directly
      setProcessedData(filtered);
    }
  }, [
    seriesData,
    timeRange,
    averageRange,
    useCustomRange,
    fromYear,
    toYear,
    filterDataByTimeRange,
    applyAveraging,
  ]);

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    setUseCustomRange(false); // Disable custom range when preset is selected
  };
  
  // Handle custom year range change
  const handleFromYearChange = (year) => {
    const yearNum = parseInt(year);
    setFromYear(yearNum);
    setUseCustomRange(true);
    // Ensure toYear is not less than fromYear
    if (toYear < yearNum) {
      setToYear(yearNum);
    }
  };
  
  const handleToYearChange = (year) => {
    const yearNum = parseInt(year);
    setToYear(yearNum);
    setUseCustomRange(true);
    // Ensure fromYear is not greater than toYear
    if (fromYear > yearNum) {
      setFromYear(yearNum);
    }
  };

  const handleAverageRangeChange = (range) => {
    // Don't toggle - just set the new average range
    // If clicking the same range, set to null to disable averaging
    setAverageRange(averageRange === range ? null : range);
  };

  const isAverageDisabled = (avgRange) => {
    if (timeRange === "All") return false;

    const timeYears = parseInt(timeRange.replace("Y", ""));
    const avgYears = parseInt(avgRange.replace("Y", ""));

    return avgYears >= timeYears;
  };

  // Get dynamic column header with unit based on series name and chart title
  const getColumnHeader = (seriesName) => {
    const lowerName = seriesName.toLowerCase();
    const lowerTitle = title.toLowerCase();
    
    // Extract short form if series name contains abbreviation in parentheses
    // e.g., "Modern Variety (MV)" -> "MV", "Local Variety (LV)" -> "LV"
    let displayName = seriesName;
    const abbreviationMatch = seriesName.match(/\(([^)]+)\)$/);
    if (abbreviationMatch) {
      displayName = abbreviationMatch[1]; // Use the abbreviation
    }
    
    // First check if the series name itself contains keywords
    if (lowerName.includes('area')) return `${displayName} (000' ha)`;
    if (lowerName.includes('production')) return `${displayName} (000' ton)`;
    if (lowerName.includes('yield')) return `${displayName} (ton/ha)`;
    if (lowerName.includes('export')) return `${displayName} (000' ton)`;
    if (lowerName.includes('import')) return `${displayName} (000' ton)`;
    if (lowerName.includes('intensity') || lowerName.includes('cropping')) return `${displayName} (%)`;
    if (lowerName.includes('adoption') || lowerName.includes('rate')) return `${displayName} (%)`;
    
    // If series name doesn't have keyword, check the chart title to determine unit
    // This handles cases like "MV", "LV" where unit depends on chart type
    if (lowerTitle.includes('area')) return `${displayName} (000' ha)`;
    if (lowerTitle.includes('production')) return `${displayName} (000' ton)`;
    if (lowerTitle.includes('yield')) return `${displayName} (ton/ha)`;
    if (lowerTitle.includes('intensity') || lowerTitle.includes('cropping')) return `${displayName} (%)`;
    if (lowerTitle.includes('adoption') || lowerTitle.includes('rate')) return `${displayName} (%)`;
    if (lowerTitle.includes('export') || lowerTitle.includes('import')) return `${displayName} (000' ton)`;
    
    // Default: return display name as-is
    return displayName;
  };

  const handleCSVDownload = () => {
    try {
      const filename = `${title.replace(/\s+/g, "_")}_${timeRange}_${
        new Date().toISOString().split("T")[0]
      }.csv`;

      // Get all unique years
      const allYears = new Set();
      processedData.forEach((series) => {
        series.data.forEach(([year]) => allYears.add(year));
      });
      const sortedYears = Array.from(allYears).sort((a, b) => b - a); // Sort descending (recent first)

      // Create CSV header
      let csvContent = `Year,${processedData.map((s) => s.name).join(",")}\n`;

      // Create CSV rows
      sortedYears.forEach((year) => {
        const values = processedData.map((series) => {
          const point = series.data.find(([y]) => y === year);
          return point ? point[1].toFixed(2) : "";
        });
        csvContent += `${year},${values.join(",")}\n`;
      });

      // Download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.download = filename;
      link.href = URL.createObjectURL(blob);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      console.log("CSV download completed");
    } catch (error) {
      console.error("CSV download failed:", error);
      alert("CSV download failed. Please try again.");
    }
  };

  const handleImageDownload = () => {
    try {
      if (chartRef.current?.chart) {
        const chart = chartRef.current.chart;
        const filename = `${title.replace(/\s+/g, "_")}_${timeRange}_${
          new Date().toISOString().split("T")[0]
        }`;

        chart.exportChart({
          type: "image/png",
          filename: filename,
          width: 1200,
          height: 600,
          scale: 2,
        });
      }
    } catch (error) {
      console.error("Image download failed:", error);
      alert("Image download failed. Please try again.");
    }
  };

  const getHighchartsOptions = () => {
    // Get all values to calculate dynamic range
    const allValues = [];
    processedData.forEach((series) => {
      series.data.forEach(([, value]) => allValues.push(value));
    });

    const minValue = allValues.length > 0 ? Math.min(...allValues) : 0;
    const maxValue = allValues.length > 0 ? Math.max(...allValues) : 100;
    const range = maxValue - minValue;
    const padding = range * 0.1; // 10% padding

    return {
      chart: {
        type: "areaspline",
        backgroundColor: "transparent",
        height: chartHeight,
        animation: {
          duration: 800,
        },
        style: { fontFamily: '"Inter", "Segoe UI", Roboto, sans-serif' },
      },
      title: {
        text: title,
        align: "left",
        style: { fontSize: "16px", fontWeight: "bold", color: "#374151" },
      },
      subtitle: {
        text: `Unit: ${unit}`,
        align: "left",
        style: { color: "#6B7280", fontSize: "12px" },
      },
      xAxis: {
        type: "linear",
        reversed: false, // Show old years first, recent years last
        title: { text: null },
        gridLineColor: "rgba(0, 0, 0, 0.1)",
        gridLineDashStyle: "Dash",
        labels: { style: { fontSize: "10px" } },
      },
      yAxis: {
        title: { text: null },
        gridLineColor: "rgba(0, 0, 0, 0.1)",
        gridLineDashStyle: "Dash",
        labels: { style: { fontSize: "10px" } },
        min: Math.max(0, minValue - padding), // Never allow negative values
        max: maxValue + padding,
      },
      tooltip: {
        crosshairs: true,
        shared: true,
        headerFormat: "<b>{point.key}</b><br/>",
        pointFormat:
          '<span style="color:{series.color}">{series.name}</span>: <b>{point.y:.2f}</b><br/>',
        style: { fontSize: "11px" },
      },
      legend: {
        enabled: true,
        align: "center",
        verticalAlign: "bottom",
        itemStyle: { fontSize: "11px", fontWeight: "500" },
      },
      plotOptions: {
        areaspline: {
          lineWidth: 3,
          fillOpacity: 0.2, // Light fill for gradient effect
          marker: {
            enabled: true,
            symbol: "circle", // Force all markers to be circles
            radius: 5,
            lineColor: "#ffffff",
            lineWidth: 2,
            states: {
              hover: {
                enabled: true,
                radius: 7,
                lineColor: "#ffffff",
                lineWidth: 2,
                animation: {
                  duration: 150,
                },
              },
            },
          },
          states: {
            hover: {
              lineWidth: 4,
              animation: {
                duration: 150,
              },
            },
            inactive: {
              opacity: 1,
            },
          },
          animation: {
            duration: 800,
          },
        },
      },
      series: processedData.map((series) => ({
        name: series.name,
        data: series.data,
        color: series.color,
        fillColor: {
          linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
          stops: [
            [0, Highcharts.color(series.color).setOpacity(0.3).get("rgba")],
            [1, Highcharts.color(series.color).setOpacity(0.05).get("rgba")],
          ],
        },
      })),
      credits: { enabled: false },
      exporting: { enabled: false },
      accessibility: { enabled: false },
    };
  };

  const getYearlyStats = () => {
    // Get recent 5 years data
    const allYears = new Set();
    processedData.forEach((series) => {
      series.data.forEach(([year]) => allYears.add(year));
    });

    const sortedYears = Array.from(allYears)
      .sort((a, b) => b - a)
      .slice(0, 5);

    return sortedYears.map((year) => {
      const values = {};
      processedData.forEach((series) => {
        const point = series.data.find(([y]) => y === year);
        values[series.name] = point ? point[1] : null;
      });
      return { year, ...values };
    });
  };

  // Format value based on chart type (yield charts show 2 decimals, others show integers)
  const formatValue = (value) => {
    if (value === null) return "-";
    const isYieldChart = title.toLowerCase().includes("yield");
    return isYieldChart ? value.toFixed(2) : Math.round(value).toString();
  };

  const yearlyStats = getYearlyStats();

  return (
    <div className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="p-3 sm:p-4 md:p-6">
        {/* Chart Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <span className="text-xl sm:text-2xl md:text-3xl flex-shrink-0">
              {icon}
            </span>
            <div className="min-w-0">
              <h3 className="font-bold text-gray-800 text-sm sm:text-base md:text-lg truncate">
                {title}
              </h3>
              <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 truncate">
                {unit}
              </p>
            </div>
          </div>

          {/* Download Button */}
          <button
            onClick={() => setShowDownloadModal(true)}
            className="btn btn-xs sm:btn-sm bg-green-600 hover:bg-green-700 text-white border-none shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-1.5 sm:py-2 rounded-lg font-medium flex-shrink-0"
            title="Download options"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-3 w-3 sm:h-4 sm:w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
              />
            </svg>
            <span className="text-[10px] sm:text-xs md:text-sm font-semibold hidden sm:inline">
              Download
            </span>
          </button>
        </div>

        {/* Time Interval and Data Average Selection */}
        <div className="mb-3 sm:mb-4 space-y-2 sm:space-y-3">
          {/* Time Interval Buttons */}
          <div className="flex flex-col gap-1.5 sm:gap-2">
            <label className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-600">
              Data Requirements(Year):
            </label>
            <div className="flex flex-wrap gap-1 sm:gap-1.5 md:gap-2">
              {[
                { key: "1Y", label: "1Y" },
                { key: "5Y", label: "5Y" },
                { key: "10Y", label: "10Y" },
                { key: "20Y", label: "20Y" },
                { key: "30Y", label: "30Y" },
                { key: "50Y", label: "50Y" },
                { key: "All", label: "All" },
              ].map((range) => (
                <button
                  key={range.key}
                  onClick={() => handleTimeRangeChange(range.key)}
                  className={`btn btn-xs sm:btn-sm transition-all duration-200 text-[10px] sm:text-xs md:text-sm px-2 sm:px-3 ${
                    timeRange === range.key && !useCustomRange
                      ? "btn-primary"
                      : "btn-outline btn-primary"
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
          </div>
          
          {/* Custom Year Range Selection */}
          <div className="flex flex-col gap-1.5 sm:gap-2">
            <label className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-600">
              Custom Year Range:
            </label>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-[10px] sm:text-xs text-gray-500">From:</span>
                <select
                  value={fromYear || ''}
                  onChange={(e) => handleFromYearChange(e.target.value)}
                  className={`select select-xs sm:select-sm border-2 rounded-lg text-[10px] sm:text-xs md:text-sm min-w-[70px] sm:min-w-[80px] ${
                    useCustomRange ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                >
                  {availableYears.map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <span className="text-[10px] sm:text-xs text-gray-500">To:</span>
                <select
                  value={toYear || ''}
                  onChange={(e) => handleToYearChange(e.target.value)}
                  className={`select select-xs sm:select-sm border-2 rounded-lg text-[10px] sm:text-xs md:text-sm min-w-[70px] sm:min-w-[80px] ${
                    useCustomRange ? 'border-blue-500 bg-blue-50' : 'border-gray-300'
                  }`}
                >
                  {availableYears.filter(year => year >= (fromYear || 0)).map((year) => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              {useCustomRange && (
                <span className="text-[10px] sm:text-xs text-blue-600 font-medium bg-blue-100 px-2 py-1 rounded">
                  {toYear - fromYear + 1} years selected
                </span>
              )}
            </div>
          </div>

          {/* Data Average Selection */}
          <div className="flex flex-col gap-1.5 sm:gap-2">
            <label className="text-[10px] sm:text-xs md:text-sm font-medium text-gray-600">
              Data Average:
            </label>
            <div className="flex flex-wrap gap-1 sm:gap-1.5 md:gap-2">
              {[
                { key: "1Y", label: "1Y" },
                { key: "5Y", label: "5Y" },
                { key: "10Y", label: "10Y" },
                { key: "20Y", label: "20Y" },
                { key: "30Y", label: "30Y" },
                { key: "50Y", label: "50Y" },
              ].map((avg) => {
                const disabled = isAverageDisabled(avg.key);
                return (
                  <button
                    key={avg.key}
                    onClick={() =>
                      !disabled && handleAverageRangeChange(avg.key)
                    }
                    disabled={disabled}
                    className={`btn btn-xs sm:btn-sm transition-all duration-200 text-[10px] sm:text-xs md:text-sm px-2 sm:px-3 ${
                      averageRange === avg.key
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                        : disabled
                        ? "btn-disabled opacity-30 cursor-not-allowed"
                        : "btn-outline border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white"
                    }`}
                    title={
                      disabled
                        ? `Cannot average ${avg.key} with ${timeRange} time interval`
                        : ""
                    }
                  >
                    {avg.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Chart and Table Grid */}
        <div className="space-y-3 sm:space-y-4 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-4 xl:gap-6">
          {/* Chart Section - 70% width on desktop */}
          <div className="lg:col-span-8">
            <div className="w-full bg-white rounded-lg border border-gray-100 overflow-hidden">
              <div id={chartId} className="w-full">
                <HighchartsReact
                  highcharts={Highcharts}
                  options={{ ...getHighchartsOptions() }}
                  immutable={true}
                  ref={chartRef}
                  key={`chart-${title}-${timeRange}-${averageRange}-${processedData
                    .map((s) => s.data.length)
                    .join("-")}`}
                />
              </div>
            </div>
          </div>

          {/* Table Section - 30% width on desktop */}
          <div className="lg:col-span-4">
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 p-3 sm:p-4 md:p-5 h-full flex flex-col shadow-sm">
              <h4 className="text-xs sm:text-sm md:text-base font-semibold text-gray-700 mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2 pb-2 sm:pb-3 border-b border-gray-200">
                <span className="text-sm sm:text-base">📋</span>{" "}
                <span>Recent 5 Years</span>
              </h4>
              <div className="overflow-x-auto flex-1">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-100 to-gray-50">
                      <th className="text-left text-[10px] sm:text-xs md:text-sm font-semibold text-gray-700 py-2 sm:py-2.5 md:py-3 px-2 sm:px-3 md:px-4 rounded-tl-lg">
                        Year
                      </th>
                      {processedData.map((series, idx) => (
                        <th
                          key={idx}
                          className="text-right text-[10px] sm:text-xs md:text-sm font-semibold text-gray-700 py-2 sm:py-2.5 md:py-3 px-2 sm:px-3 md:px-4"
                          style={{ color: series.color }}
                        >
                          {getColumnHeader(series.name)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {yearlyStats.map((item, index) => (
                      <tr
                        key={item.year}
                        className={`
                          transition-all duration-200 ease-in-out
                          ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                          ${
                            index === 0
                              ? "bg-blue-50 hover:bg-blue-100"
                              : "hover:bg-gray-100"
                          }
                          border-b border-gray-100 last:border-b-0
                        `}
                      >
                        <td className="py-2 sm:py-2.5 md:py-3 px-2 sm:px-3 md:px-4 text-[10px] sm:text-xs md:text-sm text-gray-700 font-medium">
                          {item.year}
                        </td>
                        {processedData.map((series, idx) => (
                          <td
                            key={idx}
                            className="py-2 sm:py-2.5 md:py-3 px-2 sm:px-3 md:px-4 text-[10px] sm:text-xs md:text-sm text-right font-bold"
                            style={{ color: series.color }}
                          >
                            {formatValue(item[series.name])}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Download Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none p-4">
          <div className="bg-white rounded-lg p-4 sm:p-5 md:p-6 max-w-md w-full shadow-2xl border border-gray-200 pointer-events-auto">
            <div className="flex justify-between items-center mb-3 sm:mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                Download Options
              </h3>
              <button
                onClick={() => setShowDownloadModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5 sm:h-6 sm:w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <p className="text-gray-600 mb-4 sm:mb-6 text-xs sm:text-sm">
              Choose what you'd like to download for "{title}":
            </p>

            <div className="space-y-2 sm:space-y-3">
              {/* CSV Button */}
              <button
                onClick={() => {
                  handleCSVDownload();
                  setShowDownloadModal(false);
                }}
                className="w-full flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors group"
              >
                <div className="bg-blue-600 p-1.5 sm:p-2 rounded-lg group-hover:bg-blue-700 transition-colors flex-shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 sm:h-5 sm:w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div className="text-left min-w-0">
                  <div className="font-medium text-gray-800 text-xs sm:text-sm">
                    CSV Data
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-500 truncate">
                    Chart data with year and values
                  </div>
                </div>
              </button>

              {/* Image Button */}
              <button
                onClick={() => {
                  handleImageDownload();
                  setShowDownloadModal(false);
                }}
                className="w-full flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors group"
              >
                <div className="bg-green-600 p-1.5 sm:p-2 rounded-lg group-hover:bg-green-700 transition-colors flex-shrink-0">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4 sm:h-5 sm:w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="text-left min-w-0">
                  <div className="font-medium text-gray-800 text-xs sm:text-sm">
                    PNG Image
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-500 truncate">
                    High-resolution chart image
                  </div>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiLineRiceChart;
