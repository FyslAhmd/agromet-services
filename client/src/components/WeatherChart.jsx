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
    <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-shadow duration-300 mx-1 sm:mx-0">
      <div className="card-body p-3 sm:p-4">
        {/* Chart Header */}
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <span className="text-xl sm:text-2xl shrink-0">{icon}</span>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-gray-800 text-sm sm:text-base truncate">
                {title}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500">
                {unit} • {intervalHours}H intervals
              </p>
            </div>
          </div>
          {data.length > 0 && (
            <button
              onClick={() => setShowDownloadModal(true)}
              className="btn btn-sm bg-green-600 hover:bg-green-700 text-white border-none shadow-md hover:shadow-lg transition-all duration-300 flex items-center gap-2 px-4 py-2 rounded-lg font-medium"
              title="Download options"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
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
              <span className="text-sm font-semibold">Download</span>
            </button>
          )}
        </div>

        {/* Time Range Selection */}
        {data.length > 0 && (
          <div className="mb-2 sm:mb-3 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div className="flex flex-col gap-2">
                {/* Preset Time Range Buttons */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs sm:text-sm font-medium text-gray-600">
                    Data Requirement (time):
                  </label>
                  <div className="flex flex-wrap gap-1 sm:gap-2 justify-center sm:justify-start">
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
                        className={`btn btn-xs sm:btn-sm transition-all duration-200 text-xs sm:text-sm ${
                          timeRange === range.key && !customDateRange.enabled
                            ? "btn-primary"
                            : "btn-outline btn-primary"
                        }`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Interval Selection */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs sm:text-sm font-medium text-gray-600">
                    Data Interval:
                  </label>
                  <div className="flex flex-wrap gap-1 sm:gap-2 justify-center sm:justify-start">
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
                        className={`btn btn-xs sm:btn-sm transition-all duration-200 text-xs sm:text-sm ${
                          intervalHours === interval.hours
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                            : "btn-outline border-emerald-600 text-emerald-600 hover:bg-emerald-600 hover:text-white"
                        }`}
                      >
                        {interval.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Custom Date Range Picker */}
              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-end">
                <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                  <label className="text-xs sm:text-sm font-medium text-gray-600">
                    Custom Range:
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="date"
                      value={customDateRange.startDate}
                      onChange={(e) =>
                        handleCustomDateRangeChange("startDate", e.target.value)
                      }
                      className="input input-sm sm:input-md input-bordered text-sm sm:text-base w-36 sm:w-48"
                      max={new Date().toISOString().split("T")[0]}
                    />
                    <span className="text-gray-400 text-sm">to</span>
                    <input
                      type="date"
                      value={customDateRange.endDate}
                      onChange={(e) =>
                        handleCustomDateRangeChange("endDate", e.target.value)
                      }
                      className="input input-sm sm:input-md input-bordered text-sm sm:text-base w-36 sm:w-48"
                      min={customDateRange.startDate}
                      max={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                </div>

                {customDateRange.enabled && (
                  <button
                    onClick={clearCustomDateRange}
                    className="btn btn-xs sm:btn-sm btn-ghost text-xs sm:text-sm text-gray-500 hover:text-gray-700"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Chart Content */}
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 space-y-3">
            <div className="loading loading-spinner loading-md text-primary"></div>
            <p className="text-sm text-gray-600">Loading {title}...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-48 space-y-3">
            <div className="text-4xl opacity-30">⚠️</div>
            <p className="text-sm text-gray-600 text-center">{error}</p>
          </div>
        ) : filteredData.length > 0 ? (
          <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-12 lg:gap-4">
            {/* Chart Section */}
            <div className="lg:col-span-7">
              <div className="w-full bg-white rounded-lg border border-gray-100 overflow-hidden">
                <div id={chartId} className="h-96 w-full">
                  <HighchartsReact
                    highcharts={Highcharts}
                    options={getHighchartsOptions()}
                    ref={chartRef}
                  />
                </div>
              </div>
            </div>

            {/* Table Section */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-lg border border-gray-100 p-3 sm:p-4 min-h-64 sm:min-h-80 lg:h-96 flex flex-col">
                <h4 className="text-sm sm:text-base font-semibold text-gray-700 mb-3 sm:mb-4 flex items-center gap-2 shrink-0">
                  📊 <span className="hidden sm:inline">Recent 7 Days</span>
                  <span className="sm:hidden">7 Days</span>
                  {parameter === "Air Temperature"
                    ? "Temperature Range"
                    : parameter === "Accumulated Rain 1h"
                    ? "Total Rainfall"
                    : "Average"}
                </h4>
                <div className="overflow-x-auto flex-1">
                  <table className="table table-zebra w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="text-xs sm:text-sm font-semibold text-gray-600 px-2 sm:px-3">
                          Date
                        </th>
                        {parameter === "Air Temperature" ? (
                          <>
                            <th className="text-xs sm:text-sm font-semibold text-gray-600 px-1 sm:px-2">
                              Min ({unit})
                            </th>
                            <th className="text-xs sm:text-sm font-semibold text-gray-600 px-1 sm:px-2">
                              Max ({unit})
                            </th>
                            <th className="text-xs sm:text-sm font-semibold text-gray-600 px-1 sm:px-2">
                              Avg ({unit})
                            </th>
                          </>
                        ) : (
                          <th className="text-xs sm:text-sm font-semibold text-gray-600 px-2 sm:px-3">
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
                    <tbody>
                      {getDailyAverages().map((item, index) => (
                        <tr
                          key={item.date}
                          className={index === 0 ? "bg-blue-100" : ""}
                        >
                          <td className="text-xs sm:text-sm text-gray-700 px-2 sm:px-3">
                            <span className="hidden sm:inline">
                              {new Date(item.date).toLocaleDateString("en-US", {
                                month: "2-digit",
                                day: "2-digit",
                                year: "2-digit",
                              })}
                            </span>
                            <span className="sm:hidden">
                              {new Date(item.date).toLocaleDateString("en-US", {
                                month: "2-digit",
                                day: "2-digit",
                              })}
                            </span>
                          </td>
                          {parameter === "Air Temperature" ? (
                            <>
                              <td className="text-xs sm:text-sm font-medium text-blue-600 px-1 sm:px-2">
                                {item.min}
                              </td>
                              <td className="text-xs sm:text-sm font-medium text-red-600 px-1 sm:px-2">
                                {item.max}
                              </td>
                              <td className="text-xs sm:text-sm font-medium text-gray-800 px-1 sm:px-2">
                                {item.average}
                              </td>
                            </>
                          ) : parameter === "Accumulated Rain 1h" ? (
                            <td className="text-xs sm:text-sm font-medium text-gray-800 px-2 sm:px-3">
                              {item.total}
                            </td>
                          ) : (
                            <td className="text-xs sm:text-sm font-medium text-gray-800 px-2 sm:px-3">
                              {item.average}
                            </td>
                          )}
                        </tr>
                      ))}
                      {getDailyAverages().length === 0 && (
                        <tr>
                          <td
                            colSpan={
                              parameter === "Air Temperature" ? "4" : "2"
                            }
                            className="text-center text-xs sm:text-sm text-gray-500 py-4 sm:py-6"
                          >
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
          <div className="flex flex-col items-center justify-center h-48 space-y-3 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
            <div className="text-4xl opacity-30">{icon}</div>
            <p className="text-sm text-gray-500 text-center">
              No data available
            </p>
          </div>
        )}
      </div>

      {/* Download Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl border border-gray-200 pointer-events-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Download Options
              </h3>
              <button
                onClick={() => setShowDownloadModal(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
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

            <p className="text-gray-600 mb-6 text-sm">
              Choose what you'd like to download for "{title}":
            </p>

            <div className="space-y-3">
              {/* CSV Button */}
              <button
                onClick={handleCSVDownload}
                className="w-full flex items-center gap-3 p-4 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-200 transition-colors group"
              >
                <div className="bg-blue-600 p-2 rounded-lg group-hover:bg-blue-700 transition-colors">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-white"
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
                <div className="text-left">
                  <div className="font-medium text-gray-800">CSV Data</div>
                  <div className="text-sm text-gray-500">
                    Raw chart data with timestamps
                  </div>
                </div>
              </button>

              {/* Image Button */}
              <button
                onClick={handleImageDownload}
                className="w-full flex items-center gap-3 p-4 bg-green-50 hover:bg-green-100 rounded-lg border border-green-200 transition-colors group"
              >
                <div className="bg-green-600 p-2 rounded-lg group-hover:bg-green-700 transition-colors">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-white"
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
                <div className="text-left">
                  <div className="font-medium text-gray-800">Image</div>
                  <div className="text-sm text-gray-500">
                    High-quality PNG of the chart
                  </div>
                </div>
              </button>

              {/* Table Button */}
              <button
                onClick={handleTableDownload}
                className="w-full flex items-center gap-3 p-4 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 transition-colors group"
              >
                <div className="bg-purple-600 p-2 rounded-lg group-hover:bg-purple-700 transition-colors">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 text-white"
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
                <div className="text-left">
                  <div className="font-medium text-gray-800">Daily Table</div>
                  <div className="text-sm text-gray-500">
                    Daily averages summary
                  </div>
                </div>
              </button>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowDownloadModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WeatherChart;
