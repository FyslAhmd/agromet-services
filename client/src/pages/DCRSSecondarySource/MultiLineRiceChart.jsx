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
                      {processedData.map((series, idx) => (
                        <th
                          key={idx}
                          className="text-right text-[10px] font-semibold uppercase tracking-wider py-2 px-2"
                          style={{ color: series.color }}
                        >
                          {getColumnHeader(series.name)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {yearlyStats.map((item, index) => (
                      <tr key={item.year} className={`border-b border-gray-100 last:border-b-0 ${index === 0 ? 'bg-teal-50/50' : ''}`}>
                        <td className="py-2 px-2 text-xs font-medium text-gray-700">{item.year}</td>
                        {processedData.map((series, idx) => (
                          <td
                            key={idx}
                            className="py-2 px-2 text-xs text-right font-bold"
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
              <button onClick={() => { handleCSVDownload(); setShowDownloadModal(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-teal-50 hover:border-teal-200 transition-colors group">
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
              <button onClick={() => { handleImageDownload(); setShowDownloadModal(false); }} className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-teal-50 hover:border-teal-200 transition-colors group">
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
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiLineRiceChart;
