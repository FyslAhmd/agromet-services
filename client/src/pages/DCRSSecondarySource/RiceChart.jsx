import React, { useRef, useState, useEffect } from "react";
import Highcharts from "highcharts";
import HighchartsReact from "highcharts-react-official";
import { motion } from "framer-motion";

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

const RiceChart = ({ title, unit, data, color, icon }) => {
  const chartRef = useRef(null);
  const [timeRange, setTimeRange] = useState("10Y");
  const [averageRange, setAverageRange] = useState("1Y");
  const [filteredData, setFilteredData] = useState(data);
  const [displayData, setDisplayData] = useState(data);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [chartHeight, setChartHeight] = useState(380);
  
  // Custom year range state
  const [useCustomRange, setUseCustomRange] = useState(false);
  const [fromYear, setFromYear] = useState(null);
  const [toYear, setToYear] = useState(null);
  
  // Get available years from data
  const availableYears = React.useMemo(() => {
    if (!data || data.length === 0) return [];
    const years = data.map(([year]) => year).sort((a, b) => a - b);
    return years;
  }, [data]);
  
  // Initialize fromYear and toYear when availableYears changes
  useEffect(() => {
    if (availableYears.length > 0 && fromYear === null) {
      setFromYear(availableYears[0]);
      setToYear(availableYears[availableYears.length - 1]);
    }
  }, [availableYears]);

  // Create unique ID for this chart instance
  const chartId = `chart-wrapper-${title.replace(/\s+/g, "-").toLowerCase()}`;

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
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Filter data based on selected time range or custom year range
  const filterDataByTimeRange = (fullData, range, customRange = false, startYear = null, endYear = null) => {
    // If using custom range
    if (customRange && startYear !== null && endYear !== null) {
      return fullData.filter(([year]) => year >= startYear && year <= endYear);
    }
    
    if (range === "All") {
      return fullData;
    }

    const years = parseInt(range.replace("Y", ""));
    const allYears = fullData.map(([year]) => year);
    const maxYear = Math.max(...allYears);
    const minYear = maxYear - years + 1;

    return fullData.filter(([year]) => year >= minYear);
  };

  // Group and average data based on period
  const groupAndAverageData = (fullData, period) => {
    const periodYears = parseInt(period.replace("Y", ""));

    // If period is 1Y, return data as-is (no averaging)
    if (periodYears === 1) {
      return fullData;
    }

    const grouped = [];
    const reversedData = [...fullData].reverse(); // Start from most recent

    // Group data into chunks of periodYears
    for (let i = 0; i < reversedData.length; i += periodYears) {
      const chunk = reversedData.slice(i, i + periodYears);

      if (chunk.length > 0) {
        // Calculate average year (middle of the period)
        const years = chunk.map(([year]) => year);
        const avgYear = Math.round(
          years.reduce((sum, y) => sum + y, 0) / years.length
        );

        // Calculate average value
        const values = chunk.map(([, value]) => value);
        const avgValue = values.reduce((sum, v) => sum + v, 0) / values.length;

        grouped.push([avgYear, avgValue]);
      }
    }

    return grouped; // Keep in reverse chronological order (recent first)
  };

  // Update filtered and display data when time range, custom range, or average changes
  useEffect(() => {
    const filtered = filterDataByTimeRange(data, timeRange, useCustomRange, fromYear, toYear);
    setFilteredData(filtered);

    const averaged = groupAndAverageData(filtered, averageRange);
    setDisplayData(averaged);
  }, [data, timeRange, averageRange, useCustomRange, fromYear, toYear]);

  // Handle time range change
  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    setUseCustomRange(false); // Disable custom range when preset is selected

    // Auto-adjust average range if it's invalid for the new time range
    // If "All" is selected, no validation needed (user can select any average)
    if (range === "All") return;
    
    const timeYears = parseInt(range.replace("Y", ""));
    const avgYears = parseInt(averageRange.replace("Y", ""));

    // If current average is greater than time range, reset to match time range
    if (avgYears > timeYears) {
      setAverageRange(range);
    }
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

  // Handle average range change
  const handleAverageRangeChange = (range) => {
    setAverageRange(range);
  };

  // Check if a data average option should be disabled
  const isAverageDisabled = (avgOption) => {
    const timeYears =
      timeRange === "All" ? 50 : parseInt(timeRange.replace("Y", ""));
    const avgYears = parseInt(avgOption.replace("Y", ""));

    // Disable if average period is greater than time range
    return avgYears > timeYears;
  };

  // Calculate yearly statistics for the table (show original filtered data)
  const getYearlyStats = () => {
    // Check if this is a yield chart (show 2 decimals), otherwise show integer
    const isYieldChart = title.toLowerCase().includes('yield');
    
    return filteredData
      .map(([year, value]) => ({
        year: year,
        value: isYieldChart ? value.toFixed(2) : Math.round(value).toString(),
      }))
      .sort((a, b) => b.year - a.year) // Sort by year descending (most recent first)
      .slice(0, 5); // Show last 5 years
  };

  // Get dynamic column header based on title
  const getColumnHeader = () => {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('area')) return 'Area (000\' ha)';
    if (lowerTitle.includes('production')) return 'Production (000\' ton)';
    if (lowerTitle.includes('yield')) return 'Yield (ton/ha)';
    if (lowerTitle.includes('export')) return 'Export';
    if (lowerTitle.includes('import')) return 'Import';
    if (lowerTitle.includes('intensity')) return 'Intensity';
    
    // Default: extract main word from title
    return title.split(' ')[0];
  };

  // Handle chart download using Highcharts native export or fallback methods
  const handleImageDownload = async () => {
    try {
      // Get time range label for filename
      const timeLabels = {
        "1Y": "1Year",
        "5Y": "5Years",
        "10Y": "10Years",
        "20Y": "20Years",
        "30Y": "30Years",
        "50Y": "50Years",
        All: "AllData",
      };

      const timeLabel = timeLabels[timeRange] || timeRange;
      const avgLabel = averageRange !== "1Y" ? `_${averageRange}Avg` : "";
      const filename = `${title.replace(/\s+/g, "_")}_${timeLabel}${avgLabel}_${
        new Date().toISOString().split("T")[0]
      }`;

      // Method 1: Try Highcharts built-in export
      if (chartRef.current?.chart) {
        const chart = chartRef.current.chart;

        try {
          chart.exportChart({
            type: "image/png",
            filename: filename,
            width: 1000,
            height: 500,
            scale: 2,
          });
          console.log("Download completed using Highcharts export");
          setShowDownloadModal(false);
          return;
        } catch (exportError) {
          console.warn(
            "Highcharts export failed, trying alternative method:",
            exportError
          );
        }
      }

      // Method 2: SVG conversion fallback
      if (chartRef.current?.chart) {
        const chart = chartRef.current.chart;

        try {
          // Get SVG string from Highcharts
          const svg = chart.getSVG({
            width: 1000,
            height: 500,
          });

          // Create a blob and download
          const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
          const link = document.createElement("a");
          link.download = filename + ".svg";
          link.href = URL.createObjectURL(blob);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);

          console.log("Download completed as SVG");
          setShowDownloadModal(false);
          return;
        } catch (svgError) {
          console.warn("SVG export failed:", svgError);
        }
      }

      // Method 3: Simple canvas conversion
      const chartContainer = document.getElementById(chartId);
      if (chartContainer) {
        const svg = chartContainer.querySelector("svg");
        if (svg) {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          canvas.width = 1000;
          canvas.height = 500;

          const svgData = new XMLSerializer().serializeToString(svg);
          const img = new Image();

          img.onload = function () {
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            canvas.toBlob(function (blob) {
              const link = document.createElement("a");
              link.download = filename + ".png";
              link.href = URL.createObjectURL(blob);
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
              URL.revokeObjectURL(link.href);
            });
          };

          img.onerror = function () {
            alert("Failed to convert chart to image. Please try again.");
          };

          const svgBlob = new Blob([svgData], {
            type: "image/svg+xml;charset=utf-8",
          });
          const url = URL.createObjectURL(svgBlob);
          img.src = url;

          setShowDownloadModal(false);
          return;
        }
      }

      alert("Unable to download chart. Please try refreshing the page.");
    } catch (error) {
      console.error("Download failed:", error);
      alert("Download failed. Please try again or refresh the page.");
    }
    setShowDownloadModal(false);
  };

  // Handle CSV download
  const handleCSVDownload = () => {
    try {
      const timeLabels = {
        "1Y": "1Year",
        "5Y": "5Years",
        "10Y": "10Years",
        "20Y": "20Years",
        "30Y": "30Years",
        "50Y": "50Years",
        All: "AllData",
      };

      const timeLabel = timeLabels[timeRange] || timeRange;
      const avgLabel = averageRange !== "1Y" ? `_${averageRange}Avg` : "";
      const filename = `${title.replace(/\s+/g, "_")}_${timeLabel}${avgLabel}_${
        new Date().toISOString().split("T")[0]
      }.csv`;

      // Create CSV content
      let csvContent = `Year,${title} (${unit})\n`;

      displayData.forEach(([year, value]) => {
        csvContent += `${year},${value.toFixed(2)}\n`;
      });

      // Create and download CSV file
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
    setShowDownloadModal(false);
  };

  // Handle table download (yearly data)
  const handleTableDownload = () => {
    try {
      const filename = `${title.replace(/\s+/g, "_")}_YearlyData_${
        new Date().toISOString().split("T")[0]
      }.csv`;

      const yearlyData = getYearlyStats();

      let csvContent = `Year,${unit}\n`;
      yearlyData.forEach((item) => {
        csvContent += `${item.year},${item.value}\n`;
      });

      // Create and download CSV file
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      link.download = filename;
      link.href = URL.createObjectURL(blob);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      console.log("Table download completed");
    } catch (error) {
      console.error("Table download failed:", error);
      alert("Table download failed. Please try again.");
    }
    setShowDownloadModal(false);
  };

  // Highcharts configuration
  const getHighchartsOptions = () => {
    const chartData = displayData.map(([year, value]) => [year, value]);

    // Calculate dynamic Y-axis range based on data
    const values = chartData.map((point) => point[1]);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue;
    const padding = range * 0.1; // 10% padding above and below

    return {
      chart: {
        type: "areaspline",
        backgroundColor: "transparent",
        height: chartHeight,
        animation: { 
          duration: 800
        },
        style: { fontFamily: '"Inter", "Segoe UI", Roboto, sans-serif' },
      },
      title: {
        text: title,
        align: "left",
        style: { fontSize: "16px", fontWeight: "bold", color: "#374151" },
      },
      subtitle: {
        text: unit ? `Unit: ${unit}` : null,
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
        min: Math.max(0, minValue - padding), // Dynamic minimum, but never below 0
        max: maxValue + padding, // Dynamic maximum
      },
      tooltip: {
        crosshairs: true,
        shared: true,
        headerFormat: "<b>{point.key}</b><br/>",
        pointFormat: `<span style="color:{series.color}">{series.name}</span>: <b>{point.y:.2f}</b> ${unit}<br/>`,
        style: { fontSize: "11px" },
      },
      legend: {
        enabled: false,
      },
      plotOptions: {
        areaspline: {
          lineWidth: 3,
          marker: {
            enabled: true,
            radius: 5,
            fillColor: color,
            lineColor: "#ffffff",
            lineWidth: 2,
            symbol: 'circle',
            states: {
              hover: {
                enabled: true,
                radius: 7,
                fillColor: color,
                lineColor: "#ffffff",
                lineWidth: 2,
                animation: {
                  duration: 150
                }
              },
            },
          },
          states: { 
            hover: { 
              lineWidth: 4,
              animation: {
                duration: 150
              }
            },
            inactive: {
              opacity: 1
            }
          },
          animation: {
            duration: 800
          }
        },
      },
      series: [
        {
          type: "areaspline",
          name: title,
          data: chartData,
          color: color,
          lineWidth: 3,
          fillColor: {
            linearGradient: { x1: 0, y1: 0, x2: 0, y2: 1 },
            stops: [
              [0, Highcharts.color(color).setOpacity(0.5).get("rgba")], // Medium opacity at top (50%)
              [1, Highcharts.color(color).setOpacity(0.05).get("rgba")], // Very light at bottom (5%)
            ],
          },
        },
      ],
      credits: { enabled: false },
      exporting: {
        enabled: true,
        buttons: {
          contextButton: {
            enabled: false, // Hide default export button
          },
        },
      },
    };
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300"
    >
      <div className="p-3 sm:p-4 md:p-6">
        {/* Chart Header */}
        <div className="flex items-center justify-between mb-3 sm:mb-4 gap-2">
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <span className="text-xl sm:text-2xl md:text-3xl flex-shrink-0">{icon}</span>
            <div className="min-w-0">
              <h3 className="font-bold text-gray-800 text-sm sm:text-base md:text-lg truncate">
                {title}
              </h3>
              <p className="text-[10px] sm:text-xs md:text-sm text-gray-500 truncate">{unit}</p>
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
                  options={getHighchartsOptions()}
                  ref={chartRef}
                />
              </div>
            </div>
          </div>

          {/* Table Section - 30% width on desktop */}
          <div className="lg:col-span-4">
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 p-3 sm:p-4 md:p-5 h-full flex flex-col shadow-sm">
              <h4 className="text-xs sm:text-sm md:text-base font-semibold text-gray-700 mb-3 sm:mb-4 flex items-center gap-1.5 sm:gap-2 pb-2 sm:pb-3 border-b border-gray-200">
                <span className="text-sm sm:text-base">📋</span> <span>Recent 5 Years</span>
              </h4>
              <div className="overflow-x-auto flex-1">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-100 to-gray-50">
                      <th className="text-left text-[10px] sm:text-xs md:text-sm font-semibold text-gray-700 py-2 sm:py-2.5 md:py-3 px-2 sm:px-3 md:px-4 rounded-tl-lg">
                        Year
                      </th>
                      <th className="text-right text-[10px] sm:text-xs md:text-sm font-semibold text-gray-700 py-2 sm:py-2.5 md:py-3 px-2 sm:px-3 md:px-4 rounded-tr-lg">
                        {getColumnHeader()}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {getYearlyStats().map((item, index) => (
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
                        <td
                          className="py-2 sm:py-2.5 md:py-3 px-2 sm:px-3 md:px-4 text-[10px] sm:text-xs md:text-sm text-right font-bold"
                          style={{ color }}
                        >
                          {item.value}
                        </td>
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
                onClick={handleCSVDownload}
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
                  <div className="font-medium text-gray-800 text-xs sm:text-sm">CSV Data</div>
                  <div className="text-[10px] sm:text-xs text-gray-500 truncate">
                    Chart data with year and values
                  </div>
                </div>
              </button>

              {/* Image Button */}
              <button
                onClick={handleImageDownload}
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
                  <div className="font-medium text-gray-800 text-xs sm:text-sm">Image</div>
                  <div className="text-[10px] sm:text-xs text-gray-500 truncate">
                    High-quality PNG of the chart
                  </div>
                </div>
              </button>

              {/* Table Button */}
              <button
                onClick={handleTableDownload}
                className="w-full flex items-center gap-2 sm:gap-3 p-3 sm:p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors group"
              >
                <div className="bg-purple-600 p-1.5 sm:p-2 rounded-lg group-hover:bg-purple-700 transition-colors flex-shrink-0">
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
                      d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <div className="text-left min-w-0">
                  <div className="font-medium text-gray-800 text-xs sm:text-sm">Yearly Table</div>
                  <div className="text-[10px] sm:text-xs text-gray-500 truncate">
                    Recent 5 years summary
                  </div>
                </div>
              </button>
            </div>

            <div className="mt-4 sm:mt-6 flex justify-end">
              <button
                onClick={() => setShowDownloadModal(false)}
                className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default RiceChart;
