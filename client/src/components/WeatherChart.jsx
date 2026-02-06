import React, { useState, useEffect, useRef } from "react";
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

const WeatherChart = ({ stationId, parameter, title, unit, icon }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [timeRange, setTimeRange] = useState("month");
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [intervalHours, setIntervalHours] = useState(8);
  const [customDateRange, setCustomDateRange] = useState({
    startDate: "",
    endDate: "",
    enabled: false,
  });
  const chartRef = useRef(null);

  const chartId = `chart-wrapper-${parameter
    ?.replace(/\s+/g, "-")
    .toLowerCase()}-${stationId || "default"}`;

  const parseDate = (dateString) => {
    if (!dateString) return null;
    try {
      let date;
      if (typeof dateString === "string") {
        date = new Date(dateString);
        if (isNaN(date.getTime())) {
          date = new Date(dateString.replace(" ", "T"));
        }
      } else if (dateString instanceof Date) {
        date = dateString;
      } else {
        return null;
      }
      if (isNaN(date.getTime())) {
        console.warn("Invalid date:", dateString);
        return null;
      }
      return date.getTime();
    } catch (error) {
      console.warn("Error parsing date:", dateString, error);
      return null;
    }
  };

  const parseValue = (value) => {
    if (value === null || value === undefined || value === "") {
      return null;
    }
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  };

  const filterDataByTimeRange = (fullData, range, customRange = null) => {
    if (fullData.length === 0) {
      return fullData;
    }

    if (
      range === "custom" &&
      customRange &&
      customRange.startDate &&
      customRange.endDate
    ) {
      const startTime = new Date(customRange.startDate).getTime();
      const endTime = new Date(customRange.endDate).setHours(23, 59, 59, 999);

      return fullData.filter(
        (point) => point[0] >= startTime && point[0] <= endTime
      );
    }

    if (range === "all") {
      return fullData;
    }

    const now = new Date();
    let startDate;

    switch (range) {
      case "day":
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "week":
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "3month":
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "6month":
        startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
        break;
      case "1year":
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        return fullData;
    }

    return fullData.filter((point) => point[0] >= startDate.getTime());
  };

  const filterByInterval = (data, intervalHours) => {
    if (data.length === 0) return data;

    const sortedData = [...data].sort((a, b) => a[0] - b[0]);

    const hourlyFiltered = [];
    const seenHours = new Set();

    sortedData.forEach(([timestamp, value]) => {
      const date = new Date(timestamp);

      const hourKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}-${String(
        date.getHours()
      ).padStart(2, "0")}`;

      if (!seenHours.has(hourKey)) {
        hourlyFiltered.push([timestamp, value]);
        seenHours.add(hourKey);
      }
    });

    if (intervalHours === 1) {
      return hourlyFiltered;
    }

    const filtered = [];
    const seenIntervals = new Set();

    hourlyFiltered.forEach(([timestamp, value]) => {
      const date = new Date(timestamp);
      const hour = date.getHours();

      let intervalKey;

      if (intervalHours >= 24) {
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const daysSinceEpoch = Math.floor(
          dayStart.getTime() / (24 * 60 * 60 * 1000)
        );
        const intervalSlot = Math.floor(daysSinceEpoch % (intervalHours / 24));
        intervalKey = `day_${daysSinceEpoch - intervalSlot}`;
      } else {
        const dayStart = new Date(date);
        dayStart.setHours(0, 0, 0, 0);
        const slot = Math.floor(hour / intervalHours);
        intervalKey = `${dayStart.getTime()}_${slot}`;
      }

      if (!seenIntervals.has(intervalKey)) {
        filtered.push([timestamp, value]);
        seenIntervals.add(intervalKey);
      }
    });

    return filtered;
  };

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    setCustomDateRange({ ...customDateRange, enabled: false });
    fetchData(stationId, parameter, range, null, intervalHours);
  };

  const handleIntervalChange = (hours) => {
    setIntervalHours(hours);
    // Refetch data with the new interval from backend
    fetchData(stationId, parameter, timeRange, customDateRange.enabled ? customDateRange : null, hours);
  };

  const handleCustomDateRangeChange = (field, value) => {
    const newRange = { ...customDateRange, [field]: value };
    setCustomDateRange(newRange);

    if (newRange.startDate && newRange.endDate) {
      setTimeRange("custom");
      newRange.enabled = true;
      setCustomDateRange(newRange);
      fetchData(stationId, parameter, "custom", newRange, intervalHours);
    }
  };

  const clearCustomDateRange = () => {
    setCustomDateRange({ startDate: "", endDate: "", enabled: false });
    setTimeRange("month");
    fetchData(stationId, parameter, "month", null, intervalHours);
  };

  const handleImageDownload = async () => {
    try {
      const timeLabels = {
        day: "1Day",
        week: "1Week",
        month: "1Month",
        "3month": "3Months",
        "6month": "6Months",
        "1year": "1Year",
        all: "AllData",
        custom: customDateRange.enabled
          ? `${customDateRange.startDate}_to_${customDateRange.endDate}`
          : "Custom",
      };

      const timeLabel = timeLabels[timeRange] || timeRange;
      const filename = `${title.replace(/\s+/g, "_")}_${timeLabel}_${
        new Date().toISOString().split("T")[0]
      }`;

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
          return;
        } catch (exportError) {
          console.warn(
            "Highcharts export failed, trying alternative method:",
            exportError
          );
        }
      }

      if (chartRef.current?.chart) {
        const chart = chartRef.current.chart;

        try {
          const svg = chart.getSVG({
            width: 1000,
            height: 500,
          });

          const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
          const link = document.createElement("a");
          link.download = filename + ".svg";
          link.href = URL.createObjectURL(blob);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(link.href);

          console.log("Download completed as SVG");
          return;
        } catch (svgError) {
          console.warn("SVG export failed:", svgError);
        }
      }

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

  const handleCSVDownload = () => {
    try {
      const timeLabels = {
        day: "1Day",
        week: "1Week",
        month: "1Month",
        "3month": "3Months",
        "6month": "6Months",
        "1year": "1Year",
        all: "AllData",
        custom: customDateRange.enabled
          ? `${customDateRange.startDate}_to_${customDateRange.endDate}`
          : "Custom",
      };

      const timeLabel = timeLabels[timeRange] || timeRange;
      const filename = `${title.replace(/\s+/g, "_")}_${timeLabel}_${
        new Date().toISOString().split("T")[0]
      }.csv`;

      let csvContent = `Date,Time,${title} (${unit || ""})\n`;

      filteredData.forEach(([timestamp, value]) => {
        const date = new Date(timestamp);
        const dateStr = date.toLocaleDateString("en-US");
        const timeStr = date.toLocaleTimeString("en-US");
        csvContent += `${dateStr},${timeStr},${value}\n`;
      });

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

  const handleTableDownload = () => {
    try {
      const filename = `${title.replace(/\s+/g, "_")}_DailyAverages_${
        new Date().toISOString().split("T")[0]
      }.csv`;

      const dailyData = getDailyAverages();

      let csvContent;
      if (parameter === "Air Temperature") {
        csvContent = `Date,Min ${unit},Max ${unit},Avg ${unit}\n`;
        dailyData.forEach((item) => {
          csvContent += `${item.date},${item.min},${item.max},${item.average}\n`;
        });
      } else if (parameter === "Accumulated Rain 1h") {
        csvContent = `Date,Total ${unit}\n`;
        dailyData.forEach((item) => {
          csvContent += `${item.date},${item.total}\n`;
        });
      } else {
        csvContent = `Date,Average ${unit}\n`;
        dailyData.forEach((item) => {
          csvContent += `${item.date},${item.average}\n`;
        });
      }

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

  const fetchData = async (stationId, measure, range = timeRange, customRange = null, dataInterval = intervalHours) => {
    if (!stationId || !measure) return;

    setLoading(true);
    setError(null);

    try {
      let url = `https://saads.brri.gov.bd/api/research-measures/station/${stationId}/parameter/${encodeURIComponent(
        measure
      )}`;

      const params = new URLSearchParams();
      
      if (customRange && customRange.enabled && customRange.startDate && customRange.endDate) {
        params.append('startDate', customRange.startDate);
        params.append('endDate', customRange.endDate);
      } else if (range && range !== 'custom') {
        params.append('timeRange', range);
      }

      // Always send the interval parameter for backend filtering
      params.append('interval', dataInterval.toString());

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error("Failed to fetch data");
      }
      const measuresData = await response.json();

      const chartData = measuresData
        .map((item) => {
          const timestamp = parseDate(item.date_value);
          const value = parseValue(item.last_value);

          if (timestamp !== null && value !== null) {
            return [timestamp, value];
          }
          return null;
        })
        .filter((item) => item !== null)
        .sort((a, b) => a[0] - b[0]);

      setData(chartData);
      // Data is already filtered by interval from backend, use directly
      setFilteredData(chartData);

      if (chartData.length === 0) {
        setError("No valid data available for this parameter");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("Failed to load chart data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (stationId && parameter) {
      fetchData(stationId, parameter, timeRange, null, intervalHours);
    }
  }, [stationId, parameter]);

  // Remove client-side interval filtering since backend handles it now
  // useEffect removed - backend handles interval filtering

  const getDailyAverages = () => {
    if (data.length === 0) return [];

    const hourlyDeduped = {};

    data.forEach(([timestamp, value]) => {
      const date = new Date(timestamp);

      const hourKey = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}-${String(
        date.getHours()
      ).padStart(2, "0")}`;

      if (!hourlyDeduped[hourKey]) {
        hourlyDeduped[hourKey] = { timestamp, value };
      }
    });

    const dailyGroups = {};

    Object.values(hourlyDeduped).forEach(({ timestamp, value }) => {
      const date = new Date(timestamp);
      const dateKey = date.toISOString().split("T")[0];

      if (!dailyGroups[dateKey]) {
        dailyGroups[dateKey] = [];
      }
      dailyGroups[dateKey].push(value);
    });

    const isTemperature = parameter === "Air Temperature";
    const isRainfall = parameter === "Accumulated Rain 1h";

    const dailyAverages = Object.entries(dailyGroups)
      .map(([date, values]) => {
        if (isTemperature) {
          const average =
            values.reduce((sum, val) => sum + val, 0) / values.length;
          const min = Math.min(...values);
          const max = Math.max(...values);
          return {
            date,
            average: average.toFixed(1),
            min: min.toFixed(1),
            max: max.toFixed(1),
            count: values.length,
          };
        } else if (isRainfall) {
          const total = values.reduce((sum, val) => sum + val, 0);
          return {
            date,
            total: total.toFixed(1),
            count: values.length,
          };
        } else {
          const average =
            values.reduce((sum, val) => sum + val, 0) / values.length;
          return {
            date,
            average: average.toFixed(1),
            count: values.length,
          };
        }
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .slice(0, 7);

    return dailyAverages;
  };

  const getColorConfig = () => {
    const paramLower = parameter?.toLowerCase() || "";

    if (paramLower.includes("temperature") || paramLower.includes("temp")) {
      return {
        lineColor: "#eb1010",
        hoverLineColor: "#f50505",
      };
    } else if (paramLower.includes("humidity")) {
      return {
        lineColor: "#0891B2",
        hoverLineColor: "#0891B2",
      };
    } else if (
      paramLower.includes("rain") ||
      paramLower.includes("precipitation")
    ) {
      return {
        lineColor: "#7690db",
        hoverLineColor: "#1E3A8A",
      };
    } else if (paramLower.includes("wind")) {
      return {
        lineColor: "#166534",
        hoverLineColor: "#166534",
      };
    } else if (
      paramLower.includes("solar") ||
      paramLower.includes("radiation")
    ) {
      return {
        lineColor: "#EA580C",
        hoverLineColor: "#EA580C",
      };
    } else if (paramLower.includes("pressure")) {
      return {
        lineColor: "#7C3AED",
        hoverLineColor: "#7C3AED",
      };
    } else {
      return {
        lineColor: "#1E40AF",
        hoverLineColor: "#1E40AF",
      };
    }
  };

  const getHighchartsOptions = () => {
    if (filteredData.length === 0) return {};

    const chartData = filteredData.map((point) => [point[0], point[1]]);
    const colorConfig = getColorConfig();

    const isRainData = parameter === "Accumulated Rain 1h";
    const chartType = isRainData ? "column" : "areaspline";

    const values = chartData.map((point) => point[1]);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue;
    const padding = Math.max(range * 0.05, 1);

    return {
      chart: {
        type: chartType,
        zooming: { type: "x" },
        backgroundColor: "transparent",
        height: 380,
        animation: { duration: 1000, easing: "easeOutQuart" },
        style: { fontFamily: '"Inter", "Segoe UI", Roboto, sans-serif' },
      },
      title: {
        text: title,
        align: "left",
        style: { fontSize: "16px", fontWeight: "bold", color: "#374151" },
      },
      subtitle: {
        text: unit
          ? `Unit: ${unit} • ${intervalHours}H intervals`
          : `${intervalHours}H intervals`,
        align: "left",
        style: { color: "#6B7280", fontSize: "12px" },
      },
      xAxis: {
        type: "datetime",
        gridLineColor: "rgba(0, 0, 0, 0.1)",
        gridLineDashStyle: "Dash",
        labels: { style: { fontSize: "10px" } },
      },
      yAxis: {
        title: {
          text: unit || "",
          style: { fontSize: "12px", fontWeight: "bold" },
        },
        gridLineColor: "rgba(0, 0, 0, 0.1)",
        gridLineDashStyle: "Dash",
        min: Math.max(0, minValue - padding),
        max: maxValue + padding,
        labels: { style: { fontSize: "10px" } },
      },
      tooltip: {
        crosshairs: true,
        shared: true,
        xDateFormat: "%A, %b %e, %Y %H:%M",
        headerFormat: "<b>{point.key}</b><br/>",
        pointFormat: `<span style="color:{series.color}">${title}</span>: <b>{point.y:.2f}</b> ${
          unit || ""
        }<br/>`,
        style: { fontSize: "11px" },
      },
      legend: { enabled: false },
      plotOptions: {
        areaspline: {
          lineWidth: 2,
          fillOpacity: 0.1,
          marker: {
            enabled: true,
            radius: 6,
            fillColor: colorConfig.lineColor,
            lineColor: "#ffffff",
            lineWidth: 2,
            states: {
              hover: {
                enabled: true,
                radius: 8,
                fillColor: colorConfig.lineColor,
                lineColor: "#ffffff",
                lineWidth: 2,
              },
            },
          },
          connectNulls: true,
          states: { hover: { lineWidth: 3 } },
        },
        column: {
          pointPadding: 0.3,
          borderWidth: 0,
          groupPadding: 0.1,
          pointWidth: 4,
          states: {
            hover: {
              brightness: 0.1,
            },
          },
        },
      },
      series: [
        {
          name: title,
          data: chartData,
          color: colorConfig.lineColor,
          fillColor: isRainData ? colorConfig.lineColor : "transparent",
          lineWidth: isRainData ? 0 : 2,
          marker: isRainData
            ? { enabled: false }
            : {
                enabled: true,
                radius: 6,
                fillColor: colorConfig.lineColor,
                lineColor: "#ffffff",
                lineWidth: 2,
              },
          connectNulls: !isRainData,
        },
      ],
      credits: { enabled: false },
      exporting: {
        enabled: true,
        buttons: {
          contextButton: {
            enabled: false,
          },
        },
      },
    };
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4">
        {/* Chart Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2.5 flex-1 min-w-0">
            <span className="text-xl shrink-0">{icon}</span>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-gray-800 text-sm sm:text-base truncate">
                {title}
              </h3>
              <p className="text-xs text-gray-400">
                {unit} • {intervalHours}H intervals
              </p>
            </div>
          </div>
          {data.length > 0 && (
            <button
              onClick={() => setShowDownloadModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-[#0d4a4a] hover:bg-[#0a3d3d] rounded-lg transition-colors shadow-sm"
              title="Download options"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              <span className="hidden sm:inline">Download</span>
            </button>
          )}
        </div>

        {/* Filter Controls */}
        {data.length > 0 && (
          <div className="mb-3 rounded-xl overflow-hidden border border-gray-100">
            <div className="flex flex-col lg:flex-row">
              {/* Left: Time Range + Interval */}
              <div className="flex-1 p-3 space-y-2.5">
                {/* Time Range Row */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-[#0d4a4a]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Range</span>
                  </div>
                  <div className="flex gap-0.5 bg-gray-100 p-0.5 rounded-lg">
                    {[
                      { key: "day", label: "1D" },
                      { key: "week", label: "1W" },
                      { key: "month", label: "1M" },
                      { key: "3month", label: "3M" },
                      { key: "6month", label: "6M" },
                      { key: "1year", label: "1Y" },
                      { key: "all", label: "All" },
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

                {/* Interval Row */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 shrink-0">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-teal-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
                    </svg>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Interval</span>
                  </div>
                  <div className="flex gap-0.5 bg-gray-100 p-0.5 rounded-lg">
                    {[
                      { hours: 1, label: "1H" },
                      { hours: 4, label: "4H" },
                      { hours: 8, label: "8H" },
                      { hours: 12, label: "12H" },
                      { hours: 24, label: "24H" },
                      { hours: 48, label: "48H" },
                      { hours: 72, label: "72H" },
                    ].map((interval) => (
                      <button
                        key={interval.hours}
                        onClick={() => handleIntervalChange(interval.hours)}
                        className={`px-2 sm:px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all duration-150 ${
                          intervalHours === interval.hours
                            ? "bg-teal-600 text-white shadow-sm"
                            : "text-gray-500 hover:text-gray-700 hover:bg-white/60"
                        }`}
                      >
                        {interval.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right: Custom Date Range */}
              <div className="lg:w-72 xl:w-80 border-t lg:border-t-0 lg:border-l border-gray-100 bg-gray-50/60 p-3 flex flex-col justify-center gap-2">
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
                    onChange={(e) => handleCustomDateRangeChange("startDate", e.target.value)}
                    className="flex-1 min-w-0 px-2 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none transition-all"
                    max={new Date().toISOString().split("T")[0]}
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 text-gray-300 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                  <input
                    type="date"
                    value={customDateRange.endDate}
                    onChange={(e) => handleCustomDateRangeChange("endDate", e.target.value)}
                    className="flex-1 min-w-0 px-2 py-1.5 text-xs bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 outline-none transition-all"
                    min={customDateRange.startDate}
                    max={new Date().toISOString().split("T")[0]}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chart Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium text-gray-400">Loading {title}…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-48 gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <p className="text-xs text-gray-500 text-center">{error}</p>
          </div>
        ) : filteredData.length > 0 ? (
          <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-4">
            {/* Chart */}
            <div className="lg:col-span-7">
              <div className="w-full bg-white rounded-xl border border-gray-100 overflow-hidden">
                <div id={chartId} className="h-96 w-full">
                  <HighchartsReact
                    highcharts={Highcharts}
                    options={getHighchartsOptions()}
                    ref={chartRef}
                  />
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-xl border border-gray-100 p-3 sm:p-4 lg:h-96 flex flex-col">
                <h4 className="text-xs sm:text-sm font-semibold text-gray-600 mb-3 flex items-center gap-1.5 shrink-0">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 text-teal-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0118 16.5h-2.25m-7.5 0h7.5m-7.5 0l-1 3m8.5-3l1 3m0 0l.5 1.5m-.5-1.5h-9.5m0 0l-.5 1.5" />
                  </svg>
                  Recent 7 Days —{" "}
                  {parameter === "Air Temperature"
                    ? "Temperature Range"
                    : parameter === "Accumulated Rain 1h"
                    ? "Total Rainfall"
                    : "Average"}
                </h4>
                <div className="overflow-x-auto flex-1">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="text-left text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 sm:px-3 py-2 border-b border-gray-100">
                          Date
                        </th>
                        {parameter === "Air Temperature" ? (
                          <>
                            <th className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-1 sm:px-2 py-2 border-b border-gray-100">
                              Min
                            </th>
                            <th className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-1 sm:px-2 py-2 border-b border-gray-100">
                              Max
                            </th>
                            <th className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-1 sm:px-2 py-2 border-b border-gray-100">
                              Avg
                            </th>
                          </>
                        ) : (
                          <th className="text-center text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 sm:px-3 py-2 border-b border-gray-100">
                            {parameter === "Accumulated Rain 1h"
                              ? "Total"
                              : parameter === "Air Humidity"
                              ? "RH"
                              : parameter === "Wind Speed Gust"
                              ? "WS"
                              : parameter === "Wind Direction Gust"
                              ? "WD"
                              : parameter === "Solar Radiation"
                              ? "SR"
                              : parameter === "Sunshine Duration"
                              ? "SD"
                              : "Avg"}{" "}
                            ({unit})
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {getDailyAverages().map((item, index) => (
                        <tr
                          key={item.date}
                          className={`transition-colors ${index === 0 ? "bg-teal-50/50" : "hover:bg-gray-50/50"}`}
                        >
                          <td className="text-xs sm:text-sm text-gray-700 px-2 sm:px-3 py-2">
                            <span className="hidden sm:inline">
                              {new Date(item.date).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "2-digit" })}
                            </span>
                            <span className="sm:hidden">
                              {new Date(item.date).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" })}
                            </span>
                          </td>
                          {parameter === "Air Temperature" ? (
                            <>
                              <td className="text-xs sm:text-sm font-medium text-blue-600 text-center px-1 sm:px-2 py-2">{item.min}</td>
                              <td className="text-xs sm:text-sm font-medium text-red-500 text-center px-1 sm:px-2 py-2">{item.max}</td>
                              <td className="text-xs sm:text-sm font-semibold text-gray-800 text-center px-1 sm:px-2 py-2">{item.average}</td>
                            </>
                          ) : parameter === "Accumulated Rain 1h" ? (
                            <td className="text-xs sm:text-sm font-semibold text-teal-700 text-center px-2 sm:px-3 py-2">{item.total}</td>
                          ) : (
                            <td className="text-xs sm:text-sm font-semibold text-teal-700 text-center px-2 sm:px-3 py-2">{item.average}</td>
                          )}
                        </tr>
                      ))}
                      {getDailyAverages().length === 0 && (
                        <tr>
                          <td colSpan={parameter === "Air Temperature" ? "4" : "2"} className="text-center text-xs text-gray-400 py-6">
                            No daily data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-48 gap-2 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <span className="text-3xl opacity-30">{icon}</span>
            <p className="text-xs text-gray-400">No data available</p>
          </div>
        )}
      </div>

      {/* Download Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowDownloadModal(false)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden">
            {/* Modal Header */}
            <div className="bg-linear-to-r from-[#0a3d3d] to-[#0d5555] px-5 py-3.5 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Download Options</h3>
              <button onClick={() => setShowDownloadModal(false)} className="p-1 rounded-lg text-teal-200/70 hover:text-white hover:bg-white/10 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5 space-y-2.5">
              <p className="text-xs text-gray-500 mb-3">Choose a format for "{title}"</p>

              {/* CSV */}
              <button
                onClick={handleCSVDownload}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-teal-200 hover:bg-teal-50/50 transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0 group-hover:bg-blue-100 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-800">CSV Data</p>
                  <p className="text-[11px] text-gray-400">Raw chart data with timestamps</p>
                </div>
              </button>

              {/* Image */}
              <button
                onClick={handleImageDownload}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-teal-200 hover:bg-teal-50/50 transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0 group-hover:bg-emerald-100 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-800">Image</p>
                  <p className="text-[11px] text-gray-400">High-quality PNG of the chart</p>
                </div>
              </button>

              {/* Table */}
              <button
                onClick={handleTableDownload}
                className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-teal-200 hover:bg-teal-50/50 transition-all group"
              >
                <div className="w-9 h-9 rounded-lg bg-violet-50 flex items-center justify-center shrink-0 group-hover:bg-violet-100 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-4.5 h-4.5 text-violet-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium text-gray-800">Daily Table</p>
                  <p className="text-[11px] text-gray-400">Daily averages summary</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherChart;
