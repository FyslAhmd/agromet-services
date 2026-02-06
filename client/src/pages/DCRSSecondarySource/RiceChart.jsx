import React, { useRef, useState, useEffect } from "react";
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 sm:p-5">
        {/* Chart Header */}
        <div className="flex items-center justify-between mb-4 gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 bg-linear-to-br from-[#0a3d3d] to-[#0d5555] rounded-xl flex items-center justify-center shadow-sm shrink-0">
              <span className="text-white text-sm">{icon}</span>
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-gray-800 text-sm sm:text-base truncate">{title}</h3>
              <p className="text-[10px] sm:text-xs text-gray-400">{unit}</p>
            </div>
          </div>
          <button
            onClick={() => setShowDownloadModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0d4a4a] hover:bg-[#0a3d3d] rounded-lg transition-colors shrink-0"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
            </svg>
            <span className="hidden sm:inline">Download</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="bg-gray-50/60 rounded-xl p-3 sm:p-4 mb-4">
          <div className="flex flex-col lg:flex-row gap-3 lg:gap-6">
            {/* Left: Range + Average */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-5 flex-1">
              {/* Time Range */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Range</span>
                </div>
                <div className="flex bg-gray-100 p-0.5 rounded-lg">
                  {["1Y","5Y","10Y","20Y","30Y","50Y","All"].map((r) => (
                    <button
                      key={r}
                      onClick={() => handleTimeRangeChange(r)}
                      className={`px-2 py-1 text-[10px] sm:text-xs font-medium rounded-md transition-all cursor-pointer ${
                        timeRange === r && !useCustomRange
                          ? 'bg-[#0d4a4a] text-white shadow-sm'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Data Average */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5-3L16.5 18m0 0L12 13.5m4.5 4.5V4.5" />
                  </svg>
                  <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Average</span>
                </div>
                <div className="flex bg-gray-100 p-0.5 rounded-lg">
                  {["1Y","5Y","10Y","20Y","30Y","50Y"].map((avg) => {
                    const disabled = isAverageDisabled(avg);
                    return (
                      <button
                        key={avg}
                        onClick={() => !disabled && handleAverageRangeChange(avg)}
                        disabled={disabled}
                        className={`px-2 py-1 text-[10px] sm:text-xs font-medium rounded-md transition-all ${
                          averageRange === avg
                            ? 'bg-teal-600 text-white shadow-sm'
                            : disabled
                            ? 'text-gray-300 cursor-not-allowed'
                            : 'text-gray-500 hover:text-gray-700 cursor-pointer'
                        }`}
                      >
                        {avg}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right: Custom Range */}
            <div className="flex items-center gap-2 lg:ml-auto">
              <div className="flex items-center gap-1.5 shrink-0">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">Custom</span>
              </div>
              <select
                value={fromYear || ''}
                onChange={(e) => handleFromYearChange(e.target.value)}
                className={`px-2 py-1 text-xs border rounded-lg outline-none transition-all ${
                  useCustomRange ? 'border-teal-400 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-600'
                }`}
              >
                {availableYears.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              <span className="text-xs text-gray-400">—</span>
              <select
                value={toYear || ''}
                onChange={(e) => handleToYearChange(e.target.value)}
                className={`px-2 py-1 text-xs border rounded-lg outline-none transition-all ${
                  useCustomRange ? 'border-teal-400 bg-teal-50 text-teal-700' : 'border-gray-200 text-gray-600'
                }`}
              >
                {availableYears.filter(y => y >= (fromYear || 0)).map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
              {useCustomRange && (
                <span className="text-[10px] font-medium text-teal-600 bg-teal-50 px-1.5 py-0.5 rounded border border-teal-200">
                  {toYear - fromYear + 1}yr
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Chart and Table Grid */}
        <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-5">
          {/* Chart */}
          <div className="lg:col-span-8">
            <div className="w-full rounded-xl border border-gray-100 overflow-hidden">
              <div id={chartId} className="w-full">
                <HighchartsReact highcharts={Highcharts} options={getHighchartsOptions()} ref={chartRef} />
              </div>
            </div>
          </div>

          {/* Stats Table */}
          <div className="lg:col-span-4">
            <div className="bg-gray-50/60 rounded-xl border border-gray-100 p-3 sm:p-4 h-full flex flex-col">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 flex items-center gap-1.5 pb-2 border-b border-gray-200">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                </svg>
                Recent 5 Years
              </h4>
              <div className="overflow-x-auto flex-1">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left text-[10px] font-semibold text-gray-500 uppercase tracking-wider py-2 px-2">Year</th>
                      <th className="text-right text-[10px] font-semibold text-gray-500 uppercase tracking-wider py-2 px-2">{getColumnHeader()}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getYearlyStats().map((item, index) => (
                      <tr key={item.year} className={`border-b border-gray-100 last:border-b-0 ${index === 0 ? 'bg-teal-50/50' : ''}`}>
                        <td className="py-2 px-2 text-xs font-medium text-gray-700">{item.year}</td>
                        <td className="py-2 px-2 text-xs text-right font-bold" style={{ color }}>{item.value}</td>
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDownloadModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden">
            <div className="bg-linear-to-r from-[#0a3d3d] to-[#0d5555] px-5 py-4">
              <div className="flex justify-between items-center">
                <h3 className="text-base font-semibold text-white">Download Options</h3>
                <button onClick={() => setShowDownloadModal(false)} className="p-1 rounded-lg text-teal-200/70 hover:text-white hover:bg-white/10 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-teal-200/70 text-xs mt-0.5">Export "{title}" data</p>
            </div>
            <div className="p-4 space-y-2">
              <button onClick={handleCSVDownload} className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-teal-50 hover:border-teal-200 transition-colors group">
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center group-hover:bg-teal-200 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-teal-700" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-800">CSV Data</p>
                  <p className="text-[10px] text-gray-400">Spreadsheet with year and values</p>
                </div>
              </button>
              <button onClick={handleImageDownload} className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-teal-50 hover:border-teal-200 transition-colors group">
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center group-hover:bg-teal-200 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-teal-700" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909M2.25 18.75h19.5" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-800">PNG Image</p>
                  <p className="text-[10px] text-gray-400">High-quality chart image</p>
                </div>
              </button>
              <button onClick={handleTableDownload} className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-teal-50 hover:border-teal-200 transition-colors group">
                <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center group-hover:bg-teal-200 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-teal-700" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-800">Yearly Table</p>
                  <p className="text-[10px] text-gray-400">Recent 5 years summary</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RiceChart;
