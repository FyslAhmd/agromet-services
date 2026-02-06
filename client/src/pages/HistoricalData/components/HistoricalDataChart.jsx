import React, { useState, useEffect, useRef, useMemo } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../config/api";

// Color palette for multiple stations
const STATION_COLORS = [
  "#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6",
  "#ec4899", "#06b6d4", "#84cc16", "#f97316", "#6366f1",
  "#14b8a6", "#e11d48", "#7c3aed", "#0ea5e9", "#22c55e"
];

// Chart Renderer Component - isolated to prevent re-render issues
const ChartRenderer = React.memo(({ HC, HCReact, chartOptions, chartRef }) => {
  if (!HC || !HCReact || !chartOptions) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center space-y-2">
          <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-gray-400">Preparing chart...</p>
        </div>
      </div>
    );
  }

  return <HCReact highcharts={HC} options={chartOptions} ref={chartRef} />;
});

ChartRenderer.displayName = "ChartRenderer";

const HistoricalDataChart = ({ stations, parameter, title, unit, icon, color }) => {
  // Highcharts dynamic loader states
  const [HC, setHC] = useState(null);
  const [HCReact, setHCReact] = useState(null);
  const [hcReady, setHcReady] = useState(false);

  // Data states - keyed by station name
  const [stationData, setStationData] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Time range states
  const [timeRange, setTimeRange] = useState("3M");
  const [dataAverage, setDataAverage] = useState("none"); // none, 6M, 1Y, 5Y, 10Y, 20Y, 30Y, 40Y, 50Y
  const [customDateRange, setCustomDateRange] = useState({
    startDate: "",
    endDate: "",
    enabled: false,
  });
  const [showDownloadModal, setShowDownloadModal] = useState(false);

  const chartRef = useRef(null);

  // === DYNAMICALLY LOAD HIGHCHARTS + MODULES ===
  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const HighchartsModule = await import("highcharts");
        const Highcharts = HighchartsModule?.default ?? HighchartsModule;

        const HighchartsReactModule = await import("highcharts-react-official");
        const HighchartsReact = HighchartsReactModule?.default ?? HighchartsReactModule;

        const exporting = await import("highcharts/modules/exporting");
        const exportData = await import("highcharts/modules/export-data");
        const offlineExporting = await import("highcharts/modules/offline-exporting");

        const applyModule = (mod) => {
          if (!mod) return;
          if (typeof mod.default === "function") mod.default(Highcharts);
          else if (typeof mod === "function") mod(Highcharts);
        };

        applyModule(exporting);
        applyModule(exportData);
        applyModule(offlineExporting);

        if (mounted) {
          setHC(Highcharts);
          setHCReact(() => HighchartsReact);
          setHcReady(true);
        }
      } catch (err) {
        console.error("Failed to load Highcharts:", err);
        if (mounted) setHcReady(false);
      }
    })();

    return () => { mounted = false; };
  }, []);

  // Process raw database data to chart format
  const processRawData = (records) => {
    const chartData = [];
    records.forEach((record) => {
      for (let day = 1; day <= 31; day++) {
        const value = record[`day${day}`];
        if (value !== null && value !== undefined && value !== "") {
          const year = parseInt(record.year);
          const month = parseInt(record.month);
          const date = new Date(year, month - 1, day);
          if (date.getDate() === day && date.getMonth() === month - 1) {
            chartData.push([date.getTime(), parseFloat(value)]);
          }
        }
      }
    });
    return chartData.sort((a, b) => a[0] - b[0]);
  };

  // Filter data by time range
  const filterDataByTimeRange = (fullData, range, customRange = null) => {
    if (!fullData || fullData.length === 0) return [];

    if (range === "custom" && customRange?.startDate && customRange?.endDate) {
      const startTime = new Date(customRange.startDate).getTime();
      const endTime = new Date(customRange.endDate).setHours(23, 59, 59, 999);
      return fullData.filter((point) => point[0] >= startTime && point[0] <= endTime);
    }

    if (range === "All") return fullData;

    const mostRecentTimestamp = fullData[fullData.length - 1][0];
    const mostRecentDate = new Date(mostRecentTimestamp);

    const intervalDays = {
      "3M": 90, "6M": 180,
      "1Y": 365, "5Y": 1825, "10Y": 3650,
      "20Y": 7300, "30Y": 10950, "50Y": 18250,
      "All": Infinity,
    };

    const daysBack = intervalDays[range] || 90;
    const startDate = new Date(mostRecentDate);
    startDate.setDate(startDate.getDate() - daysBack);

    return fullData.filter((point) => point[0] >= startDate.getTime());
  };

  // Aggregate data by interval (for Data Average feature)
  const aggregateDataByInterval = (data, interval) => {
    if (!data || data.length === 0 || interval === "none") return data;

    // Define interval in days/months for precise calculation
    const intervalDays = {
      "1W": 7,
      "1M": null, // handled as months
      "3M": null,
      "6M": null,
      "1Y": null,
      "5Y": null,
      "10Y": null,
      "20Y": null,
      "30Y": null,
    };

    const intervalMonths = {
      "1M": 1,
      "3M": 3,
      "6M": 6,
      "1Y": 12,
      "5Y": 60,
      "10Y": 120,
      "20Y": 240,
      "30Y": 360,
    };

    // Handle weekly aggregation separately
    if (interval === "1W") {
      const sortedData = [...data].sort((a, b) => a[0] - b[0]);
      if (sortedData.length === 0) return [];

      const buckets = new Map();
      sortedData.forEach((point) => {
        const date = new Date(point[0]);
        // Get week number (ISO week)
        const startOfYear = new Date(date.getFullYear(), 0, 1);
        const dayOfYear = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
        const weekNum = Math.floor(dayOfYear / 7);
        const bucketKey = `${date.getFullYear()}-W${weekNum}`;

        if (!buckets.has(bucketKey)) {
          // Center of the week
          const weekStart = new Date(date.getFullYear(), 0, 1 + weekNum * 7);
          const centerDate = new Date(weekStart.getTime() + 3.5 * 24 * 60 * 60 * 1000);
          buckets.set(bucketKey, {
            sum: 0,
            count: 0,
            timestamp: centerDate.getTime(),
          });
        }

        const bucket = buckets.get(bucketKey);
        bucket.sum += point[1];
        bucket.count += 1;
      });

      return Array.from(buckets.values())
        .map((bucket) => [bucket.timestamp, bucket.sum / bucket.count])
        .sort((a, b) => a[0] - b[0]);
    }

    const months = intervalMonths[interval];
    if (!months) return data;

    // Sort data by timestamp
    const sortedData = [...data].sort((a, b) => a[0] - b[0]);
    if (sortedData.length === 0) return [];

    // Group data by interval buckets
    const buckets = new Map();

    sortedData.forEach((point) => {
      const date = new Date(point[0]);
      const year = date.getFullYear();
      const month = date.getMonth();

      // Calculate bucket key based on interval
      // For 6M: buckets are Jan-Jun (0) and Jul-Dec (1) of each year
      // For 1Y: buckets are per year
      // For 5Y, 10Y, etc.: buckets span multiple years
      let bucketKey;
      if (months < 12) {
        // Sub-yearly intervals (6M)
        const bucketIndex = Math.floor(month / months);
        bucketKey = `${year}-${bucketIndex}`;
      } else {
        // Yearly or multi-year intervals
        const yearsPerBucket = months / 12;
        const bucketYear = Math.floor(year / yearsPerBucket) * yearsPerBucket;
        bucketKey = `${bucketYear}`;
      }

      if (!buckets.has(bucketKey)) {
        // Calculate the center timestamp for this bucket
        let centerDate;
        if (months < 12) {
          const bucketIndex = Math.floor(month / months);
          const startMonth = bucketIndex * months;
          const centerMonth = startMonth + Math.floor(months / 2);
          centerDate = new Date(year, centerMonth, 15);
        } else {
          const yearsPerBucket = months / 12;
          const bucketYear = Math.floor(year / yearsPerBucket) * yearsPerBucket;
          const centerYear = bucketYear + Math.floor(yearsPerBucket / 2);
          centerDate = new Date(centerYear, 6, 1); // Middle of center year
        }

        buckets.set(bucketKey, {
          sum: 0,
          count: 0,
          timestamp: centerDate.getTime(),
          values: [],
        });
      }

      const bucket = buckets.get(bucketKey);
      bucket.sum += point[1];
      bucket.count += 1;
      bucket.values.push(point[1]);
    });

    // Calculate averages and return aggregated data
    const aggregatedData = Array.from(buckets.values())
      .map((bucket) => [bucket.timestamp, bucket.sum / bucket.count])
      .sort((a, b) => a[0] - b[0]);

    return aggregatedData;
  };

  // Validate data average selection based on time range
  const getValidDataAverageOptions = () => {
    const timeRangeMonths = {
      "3M": 3,
      "6M": 6,
      "1Y": 12,
      "5Y": 60,
      "10Y": 120,
      "20Y": 240,
      "30Y": 360,
      "50Y": 600,
      "All": Infinity,
    };

    const dataAverageMonths = {
      "1W": 0.25, // ~1 week in months
      "1M": 1,
      "3M": 3,
      "6M": 6,
      "1Y": 12,
      "5Y": 60,
      "10Y": 120,
      "20Y": 240,
      "30Y": 360,
    };

    const selectedRangeMonths = timeRangeMonths[timeRange] || Infinity;

    // Filter options: average interval must be less than or equal to half the time range
    // to have at least 2 data points
    return Object.entries(dataAverageMonths)
      .filter(([key, months]) => months <= selectedRangeMonths / 2)
      .map(([key]) => key);
  };

  // Fetch data for all stations
  useEffect(() => {
    const fetchAllStationsData = async () => {
      if (!stations || stations.length === 0 || !parameter) return;

      setLoading(true);
      setError(null);

      try {
        const promises = stations.map((station) =>
          axios.get(`${API_BASE_URL}/${parameter}?station=${encodeURIComponent(station)}&limit=10000`)
        );

        const responses = await Promise.all(promises);
        const newStationData = {};

        responses.forEach((response, index) => {
          const station = stations[index];
          if (response.data.success && response.data.data?.length > 0) {
            newStationData[station] = processRawData(response.data.data);
          } else {
            newStationData[station] = [];
          }
        });

        setStationData(newStationData);

        // Check if any station has data
        const hasAnyData = Object.values(newStationData).some(d => d.length > 0);
        if (!hasAnyData) {
          setError("No data available for the selected stations");
        }
      } catch (err) {
        console.error("Error fetching station data:", err);
        setError("Failed to load chart data");
      } finally {
        setLoading(false);
      }
    };

    fetchAllStationsData();
  }, [stations, parameter]);

  // Build filtered data for all stations
  const filteredStationData = useMemo(() => {
    const filtered = {};
    Object.keys(stationData).forEach((station) => {
      // First filter by time range
      let data = filterDataByTimeRange(
        stationData[station],
        timeRange,
        customDateRange.enabled ? customDateRange : null
      );
      
      // Then apply data aggregation if selected
      if (dataAverage !== "none") {
        data = aggregateDataByInterval(data, dataAverage);
      }
      
      filtered[station] = data;
    });
    return filtered;
  }, [stationData, timeRange, customDateRange, dataAverage]);

  // Build chart options
  const chartOptions = useMemo(() => {
    if (!hcReady || Object.keys(filteredStationData).length === 0) return null;

    // Check if any station has data
    const hasData = Object.values(filteredStationData).some(d => d.length > 0);
    if (!hasData) return null;

    const isRainData = parameter === "rainfall";
    const chartType = isRainData ? "column" : "areaspline";

    // Calculate min/max across all stations
    let allValues = [];
    Object.values(filteredStationData).forEach(data => {
      data.forEach(point => {
        if (typeof point[1] === 'number' && !isNaN(point[1])) {
          allValues.push(point[1]);
        }
      });
    });

    if (allValues.length === 0) return null;

    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    const range = maxValue - minValue;
    const padding = Math.max(range * 0.05, 1);

    // Build series for each station
    const series = Object.keys(filteredStationData).map((station, index) => {
      const data = filteredStationData[station].filter(
        point => Array.isArray(point) && point.length === 2 && 
                 typeof point[0] === 'number' && typeof point[1] === 'number' &&
                 !isNaN(point[0]) && !isNaN(point[1])
      );

      return {
        type: chartType,
        name: station,
        data: data,
        color: STATION_COLORS[index % STATION_COLORS.length],
        lineWidth: isRainData ? 0 : 2,
        marker: {
          enabled: data.length <= 50,
          radius: data.length > 100 ? 0 : 4,
        },
      };
    }).filter(s => s.data.length > 0);

    if (series.length === 0) return null;

    return {
      chart: {
        type: chartType,
        zooming: { type: "x" },
        backgroundColor: "transparent",
        height: 450,
        animation: { duration: 800 },
        style: { fontFamily: '"Inter", "Segoe UI", Roboto, sans-serif' },
      },
      title: {
        text: `${title} Comparison${dataAverage !== "none" ? ` (${dataAverage} Average)` : ""}`,
        align: "left",
        style: { fontSize: "18px", fontWeight: "bold", color: "#374151" },
      },
      subtitle: {
        text: `${stations.length} Station${stations.length > 1 ? 's' : ''} | ${unit || ''}${dataAverage !== "none" ? ` | Averaged by ${dataAverage}` : ""}`,
        align: "left",
        style: { color: "#6B7280", fontSize: "13px" },
      },
      xAxis: {
        type: "datetime",
        gridLineColor: "rgba(0, 0, 0, 0.08)",
        gridLineDashStyle: "Dash",
        labels: {
          style: { fontSize: "11px", color: "#6B7280" },
          format: "{value:%m/%y}",
        },
        dateTimeLabelFormats: {
          day: "%m/%y",
          week: "%m/%y",
          month: "%m/%y",
          year: "%m/%y",
        },
        lineColor: "#E5E7EB",
      },
      yAxis: {
        title: { text: unit || "", style: { fontSize: "12px", fontWeight: "600", color: "#374151" } },
        gridLineColor: "rgba(0, 0, 0, 0.08)",
        gridLineDashStyle: "Dash",
        min: Math.max(0, minValue - padding),
        max: maxValue + padding,
        labels: { style: { fontSize: "11px", color: "#6B7280" } },
      },
      tooltip: {
        shared: true,
        crosshairs: true,
        xDateFormat: "%A, %b %e, %Y",
        headerFormat: '<div style="font-size:12px;font-weight:bold;margin-bottom:8px;">{point.key}</div>',
        pointFormat: '<div style="display:flex;align-items:center;gap:8px;margin:4px 0;"><span style="color:{series.color}">●</span> <span style="font-weight:500;">{series.name}:</span> <b>{point.y:.2f}</b> ' + (unit || '') + '</div>',
        useHTML: true,
        backgroundColor: "rgba(255, 255, 255, 0.95)",
        borderColor: "#E5E7EB",
        borderRadius: 8,
        shadow: true,
        style: { fontSize: "12px" },
      },
      legend: {
        enabled: true,
        align: "center",
        verticalAlign: "bottom",
        layout: "horizontal",
        itemStyle: { fontSize: "12px", fontWeight: "500", color: "#374151" },
        itemHoverStyle: { color: "#1D4ED8" },
        symbolRadius: 6,
      },
      plotOptions: {
        areaspline: {
          lineWidth: 2.5,
          fillOpacity: 0.08,
          marker: { radius: 4, lineWidth: 2, lineColor: "#ffffff" },
          connectNulls: true,
          states: { hover: { lineWidth: 3.5 } },
        },
        column: {
          pointPadding: 0.2,
          borderWidth: 0,
          groupPadding: 0.1,
          states: { hover: { brightness: 0.1 } },
        },
      },
      series: series,
      credits: { enabled: false },
      exporting: {
        enabled: true,
        buttons: { contextButton: { enabled: false } },
      },
    };
  }, [hcReady, filteredStationData, parameter, title, unit, stations, dataAverage]);

  // Handle time range change
  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    setCustomDateRange({ ...customDateRange, enabled: false });
    
    // Reset data average if it becomes invalid for new time range
    const timeRangeMonths = {
      "1D": 0, "1W": 0, "1M": 1, "3M": 3, "6M": 6,
      "1Y": 12, "5Y": 60, "10Y": 120, "All": Infinity,
    };
    const dataAverageMonths = {
      "6M": 6, "1Y": 12, "5Y": 60, "10Y": 120,
      "20Y": 240, "30Y": 360, "40Y": 480, "50Y": 600,
    };
    
    const rangeMonths = timeRangeMonths[range] || Infinity;
    const avgMonths = dataAverageMonths[dataAverage] || 0;
    
    if (avgMonths > rangeMonths / 2) {
      setDataAverage("none");
    }
  };

  // Handle data average change
  const handleDataAverageChange = (avg) => {
    setDataAverage(avg);
  };

  // Handle custom date range
  const handleCustomDateChange = (field, value) => {
    const newRange = { ...customDateRange, [field]: value };
    setCustomDateRange(newRange);
    if (newRange.startDate && newRange.endDate) {
      setTimeRange("custom");
      newRange.enabled = true;
    }
  };

  const clearCustomDateRange = () => {
    setCustomDateRange({ startDate: "", endDate: "", enabled: false });
    setTimeRange("1M");
    setDataAverage("none");
  };

  // Handle image download
  const handleImageDownload = () => {
    if (chartRef.current?.chart) {
      const filename = `${title.replace(/\s+/g, "_")}_${stations.join("_")}_${new Date().toISOString().split("T")[0]}`;
      chartRef.current.chart.exportChart({ type: "image/png", filename, width: 1400, height: 700, scale: 2 });
    }
  };

  // Handle CSV download
  const handleCSVDownload = () => {
    const csvRows = ["Date," + stations.join(",")];
    
    // Get all unique timestamps
    const allTimestamps = new Set();
    Object.values(filteredStationData).forEach(data => {
      data.forEach(point => allTimestamps.add(point[0]));
    });

    // Sort timestamps
    const sortedTimestamps = Array.from(allTimestamps).sort((a, b) => a - b);

    // Build CSV rows
    sortedTimestamps.forEach(timestamp => {
      const date = new Date(timestamp).toLocaleDateString();
      const values = stations.map(station => {
        const point = filteredStationData[station]?.find(p => p[0] === timestamp);
        return point ? point[1].toFixed(2) : "";
      });
      csvRows.push(`${date},${values.join(",")}`);
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "_")}_data.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Calculate statistics for display
  const getStationStats = (station) => {
    const data = filteredStationData[station] || [];
    if (data.length === 0) return { min: "-", max: "-", avg: "-", count: 0 };
    
    const values = data.map(p => p[1]).filter(v => !isNaN(v));
    if (values.length === 0) return { min: "-", max: "-", avg: "-", count: 0 };
    
    return {
      min: Math.min(...values).toFixed(2),
      max: Math.max(...values).toFixed(2),
      avg: (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2),
      count: values.length,
    };
  };

  const hasData = Object.values(filteredStationData).some(d => d.length > 0);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 sm:p-5">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-linear-to-br from-[#0a3d3d] to-[#0d5555] rounded-xl flex items-center justify-center shadow-sm shrink-0">
              <span className="text-white text-lg">{icon}</span>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-800">{title}</h2>
              <p className="text-xs text-gray-400">{stations.length} station{stations.length > 1 ? 's' : ''} selected</p>
            </div>
          </div>

          {hasData && (
            <div className="flex gap-1.5 self-start sm:self-auto">
              <button
                onClick={handleImageDownload}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0d4a4a] hover:bg-[#0a3d3d] rounded-lg transition-colors shadow-sm"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Image
              </button>
              <button
                onClick={handleCSVDownload}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-colors shadow-sm"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                CSV
              </button>
            </div>
          )}
        </div>

        {/* Filter Controls */}
        <div className="mb-4 rounded-xl overflow-hidden border border-gray-100">
          <div className="flex flex-col xl:flex-row">
            {/* Left: Time Range + Data Average */}
            <div className="flex-1 p-3 space-y-2.5">
              {/* Time Range */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-[#0d4a4a]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Range</span>
                </div>
                <div className="flex gap-0.5 bg-gray-100 p-0.5 rounded-lg flex-wrap">
                  {[
                    { key: "3M", label: "3M" },
                    { key: "6M", label: "6M" },
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
                      className={`px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all duration-150 ${
                        timeRange === range.key && !customDateRange.enabled
                          ? "bg-[#0d4a4a] text-white shadow-sm"
                          : "text-gray-500 hover:text-gray-700 hover:bg-white/60"
                      }`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Data Average */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-teal-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
                  </svg>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Average</span>
                </div>
                <div className="flex gap-0.5 bg-gray-100 p-0.5 rounded-lg flex-wrap">
                  {(() => {
                    const validOptions = getValidDataAverageOptions(timeRange, customDateRange);
                    return [
                      { key: "none", label: "None" },
                      { key: "1W", label: "1W" },
                      { key: "1M", label: "1M" },
                      { key: "3M", label: "3M" },
                      { key: "6M", label: "6M" },
                      { key: "1Y", label: "1Y" },
                      { key: "5Y", label: "5Y" },
                      { key: "10Y", label: "10Y" },
                      { key: "20Y", label: "20Y" },
                      { key: "30Y", label: "30Y" },
                    ].map((option) => {
                      const isValid = validOptions.includes(option.key);
                      return (
                        <button
                          key={option.key}
                          onClick={() => isValid && handleDataAverageChange(option.key)}
                          disabled={!isValid}
                          className={`px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all duration-150 ${
                            dataAverage === option.key
                              ? "bg-teal-600 text-white shadow-sm"
                              : isValid
                              ? "text-gray-500 hover:text-gray-700 hover:bg-white/60"
                              : "text-gray-300 cursor-not-allowed"
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    });
                  })()}
                </div>
              </div>

              {dataAverage !== "none" && (
                <p className="text-[11px] text-gray-400 ml-18">
                  Data averaged over {dataAverage} intervals
                </p>
              )}
            </div>

            {/* Right: Custom Date Range */}
            <div className="xl:w-72 2xl:w-80 border-t xl:border-t-0 xl:border-l border-gray-100 bg-gray-50/60 p-3 flex flex-col justify-center gap-2">
              <div className="flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                </svg>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Custom Range</span>
                {customDateRange.enabled && (
                  <button
                    onClick={clearCustomDateRange}
                    className="ml-auto text-[10px] font-medium text-red-400 hover:text-red-500 transition-colors flex items-center gap-0.5"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="date"
                  value={customDateRange.startDate}
                  onChange={(e) => handleCustomDateChange("startDate", e.target.value)}
                  className="flex-1 min-w-0 px-2 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none transition-all"
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
                <input
                  type="date"
                  value={customDateRange.endDate}
                  onChange={(e) => handleCustomDateChange("endDate", e.target.value)}
                  className="flex-1 min-w-0 px-2 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none transition-all"
                  min={customDateRange.startDate}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Chart Area */}
        {loading || !hcReady ? (
          <div className="flex flex-col items-center justify-center h-96 gap-2">
            <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium text-gray-400">{!hcReady ? "Initializing chart engine…" : "Loading station data…"}</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-96 gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <p className="text-xs text-gray-500 text-center max-w-md">{error}</p>
          </div>
        ) : hasData ? (
          <div className="space-y-4">
            {/* Chart */}
            <div className="bg-white rounded-xl border border-gray-100 p-2 overflow-hidden">
              <div className="h-112.5">
                <ChartRenderer
                  HC={HC}
                  HCReact={HCReact}
                  chartOptions={chartOptions}
                  chartRef={chartRef}
                />
              </div>
            </div>

            {/* Station Statistics Table */}
            <div className="bg-white rounded-xl border border-gray-100 p-4">
              <h4 className="text-xs font-semibold text-gray-600 mb-3 flex items-center gap-1.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
                </svg>
                Station Statistics (Selected Period)
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr>
                      <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-3 py-2 border-b border-gray-100">Station</th>
                      <th className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 py-2 border-b border-gray-100">Min</th>
                      <th className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 py-2 border-b border-gray-100">Max</th>
                      <th className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 py-2 border-b border-gray-100">Average</th>
                      <th className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 py-2 border-b border-gray-100">Data Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {stations.map((station, index) => {
                      const stats = getStationStats(station);
                      return (
                        <tr key={station} className="hover:bg-gray-50/50 transition-colors">
                          <td className="flex items-center gap-2 px-3 py-2.5">
                            <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: STATION_COLORS[index % STATION_COLORS.length] }} />
                            <span className="font-medium text-sm text-gray-700">{station}</span>
                          </td>
                          <td className="text-center text-sm font-medium text-blue-600 px-2 py-2.5">{stats.min}</td>
                          <td className="text-center text-sm font-medium text-red-500 px-2 py-2.5">{stats.max}</td>
                          <td className="text-center text-sm font-semibold text-teal-700 px-2 py-2.5">{stats.avg}</td>
                          <td className="text-center text-sm text-gray-400 px-2 py-2.5">{stats.count.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-96 gap-2 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <span className="text-3xl opacity-30">📊</span>
            <p className="text-xs text-gray-400">No data available for the selected time range</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoricalDataChart;
