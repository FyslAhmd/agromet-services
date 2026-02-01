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
        <div className="text-center">
          <div className="loading loading-spinner loading-lg text-primary mb-2"></div>
          <p className="text-sm">Preparing chart...</p>
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
    <div className="card bg-base-100 shadow-xl mx-1 sm:mx-0">
      <div className="card-body p-4 sm:p-6">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-focus rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white text-2xl">{icon}</span>
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">{title}</h2>
              <p className="text-sm text-gray-500">{stations.length} station{stations.length > 1 ? 's' : ''} selected</p>
            </div>
          </div>

          {hasData && (
            <div className="flex gap-2">
              <button
                onClick={handleImageDownload}
                className="btn btn-sm bg-emerald-500 hover:bg-emerald-600 text-white border-none gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Image
              </button>
              <button
                onClick={handleCSVDownload}
                className="btn btn-sm bg-blue-500 hover:bg-blue-600 text-white border-none gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                CSV
              </button>
            </div>
          )}
        </div>

        {/* Time Range Controls - Improved Design */}
        <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 mb-4 border border-gray-100">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Preset Time Ranges */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Data Requirements
              </label>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { key: "3M", label: "3M", tip: "3 Months" },
                  { key: "6M", label: "6M", tip: "6 Months" },
                  { key: "1Y", label: "1Y", tip: "1 Year" },
                  { key: "5Y", label: "5Y", tip: "5 Years" },
                  { key: "10Y", label: "10Y", tip: "10 Years" },
                  { key: "20Y", label: "20Y", tip: "20 Years" },
                  { key: "30Y", label: "30Y", tip: "30 Years" },
                  { key: "50Y", label: "50Y", tip: "50 Years" },
                  { key: "All", label: "All", tip: "All Data" },
                ].map((range) => (
                  <button
                    key={range.key}
                    onClick={() => handleTimeRangeChange(range.key)}
                    title={range.tip}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                      timeRange === range.key && !customDateRange.enabled
                        ? "bg-primary text-white shadow-md shadow-primary/30"
                        : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200 hover:border-primary/50"
                    }`}
                  >
                    {range.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Date Range */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Custom Range
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <input
                    type="date"
                    value={customDateRange.startDate}
                    onChange={(e) => handleCustomDateChange("startDate", e.target.value)}
                    className={`input input-sm bg-white border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 w-36 ${
                      customDateRange.enabled ? "border-primary" : ""
                    }`}
                  />
                </div>
                <span className="text-gray-400 font-medium">to</span>
                <div className="relative">
                  <input
                    type="date"
                    value={customDateRange.endDate}
                    onChange={(e) => handleCustomDateChange("endDate", e.target.value)}
                    className={`input input-sm bg-white border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 w-36 ${
                      customDateRange.enabled ? "border-primary" : ""
                    }`}
                  />
                </div>
                {customDateRange.enabled && (
                  <button
                    onClick={clearCustomDateRange}
                    className="btn btn-sm btn-ghost text-gray-500 hover:text-red-500 hover:bg-red-50"
                    title="Clear custom range"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Data Average Section */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Data Average
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(() => {
                  const validOptions = getValidDataAverageOptions(timeRange, customDateRange);
                  const allOptions = [
                    { key: "none", label: "None", tip: "No averaging" },
                    { key: "1W", label: "1W", tip: "1-week average" },
                    { key: "1M", label: "1M", tip: "1-month average" },
                    { key: "3M", label: "3M", tip: "3-month average" },
                    { key: "6M", label: "6M", tip: "6-month average" },
                    { key: "1Y", label: "1Y", tip: "1-year average" },
                    { key: "5Y", label: "5Y", tip: "5-year average" },
                    { key: "10Y", label: "10Y", tip: "10-year average" },
                    { key: "20Y", label: "20Y", tip: "20-year average" },
                    { key: "30Y", label: "30Y", tip: "30-year average" },
                  ];
                  
                  return allOptions.map((option) => {
                    const isValid = validOptions.includes(option.key);
                    const isActive = dataAverage === option.key;
                    
                    return (
                      <button
                        key={option.key}
                        onClick={() => isValid && handleDataAverageChange(option.key)}
                        title={isValid ? option.tip : `Requires longer time range`}
                        disabled={!isValid}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? "bg-blue-600 text-white shadow-md shadow-secondary/30"
                            : isValid
                            ? "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200 hover:border-secondary/50"
                            : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed opacity-50"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  });
                })()}
              </div>
              {dataAverage !== "none" && (
                <p className="text-xs text-gray-500 mt-1">
                  📊 Data is being averaged over {dataAverage === "6M" ? "6-month" : dataAverage} intervals
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Chart Area */}
        {loading || !hcReady ? (
          <div className="flex flex-col items-center justify-center h-96 space-y-4">
            <div className="loading loading-spinner loading-lg text-primary"></div>
            <p className="text-gray-600">{!hcReady ? "Initializing chart engine..." : "Loading station data..."}</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-96 space-y-4">
            <div className="text-6xl opacity-30">⚠️</div>
            <p className="text-gray-600 text-center max-w-md">{error}</p>
          </div>
        ) : hasData ? (
          <div className="space-y-4">
            {/* Chart */}
            <div className="bg-white rounded-xl border border-gray-100 p-2 overflow-hidden">
              <div className="h-[450px]">
                <ChartRenderer
                  HC={HC}
                  HCReact={HCReact}
                  chartOptions={chartOptions}
                  chartRef={chartRef}
                />
              </div>
            </div>

            {/* Station Statistics Table */}
            <div className="bg-gradient-to-r from-gray-50 to-white rounded-xl p-4 border border-gray-100">
              <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Station Statistics (Selected Period)
              </h4>
              <div className="overflow-x-auto">
                <table className="table table-sm w-full">
                  <thead>
                    <tr className="bg-gray-100/50">
                      <th className="text-gray-600 font-semibold">Station</th>
                      <th className="text-gray-600 font-semibold text-center">Min</th>
                      <th className="text-gray-600 font-semibold text-center">Max</th>
                      <th className="text-gray-600 font-semibold text-center">Average</th>
                      <th className="text-gray-600 font-semibold text-center">Data Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stations.map((station, index) => {
                      const stats = getStationStats(station);
                      return (
                        <tr key={station} className="hover:bg-gray-50">
                          <td className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: STATION_COLORS[index % STATION_COLORS.length] }}
                            />
                            <span className="font-medium text-gray-700">{station}</span>
                          </td>
                          <td className="text-center text-blue-600 font-medium">{stats.min}</td>
                          <td className="text-center text-red-600 font-medium">{stats.max}</td>
                          <td className="text-center text-emerald-600 font-medium">{stats.avg}</td>
                          <td className="text-center text-gray-500">{stats.count.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-96 space-y-4">
            <div className="text-6xl opacity-30">📊</div>
            <p className="text-gray-600">No data available for the selected time range</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoricalDataChart;
