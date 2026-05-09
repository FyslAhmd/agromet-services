import React, { useEffect, useMemo, useRef, useState } from "react";
import { SAADS_API_URL } from "../../../config/api";

const TIME_RANGE_OPTIONS = [
  { key: "day", label: "1D" },
  { key: "week", label: "1W" },
  { key: "month", label: "1M" },
  { key: "3month", label: "3M" },
  { key: "6month", label: "6M" },
  { key: "1year", label: "1Y" },
  { key: "all", label: "All" },
];

const INTERVAL_OPTIONS = [
  { hours: 1, label: "1H" },
  { hours: 4, label: "4H" },
  { hours: 8, label: "8H" },
  { hours: 12, label: "12H" },
  { hours: 24, label: "24H" },
  { hours: 48, label: "48H" },
  { hours: 72, label: "72H" },
];

const PARAMETER_CONFIG = {
  temperature: {
    measure: "Air Temperature",
    unit: "°C",
  },
  rainfall: {
    measure: "Accumulated Rain 1h",
    unit: "mm",
  },
  humidity: {
    measure: "Air Humidity",
    unit: "%",
  },
};

const getDhakaToday = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
  }).format(new Date());

const parseDate = (dateString) => {
  if (!dateString) return null;

  if (typeof dateString === "string") {
    const match = dateString.match(
      /^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/
    );

    if (match) {
      const [, year, month, day, hour, minute, second = "00"] = match;
      const date = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second)
      );

      if (!Number.isNaN(date.getTime())) {
        return date.getTime();
      }
    }

    const fallbackDate = new Date(dateString);
    if (!Number.isNaN(fallbackDate.getTime())) {
      return fallbackDate.getTime();
    }
  }

  return null;
};

const parseValue = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const numericValue = Number.parseFloat(value);
  return Number.isNaN(numericValue) ? null : numericValue;
};

const getBucketTimestamp = (timestamp, intervalHours) => {
  const bucketDate = new Date(timestamp);
  bucketDate.setMinutes(0, 0, 0);

  if (intervalHours >= 24) {
    bucketDate.setHours(0, 0, 0, 0);

    const daysPerBucket = intervalHours / 24;
    const daysSinceEpoch = Math.floor(bucketDate.getTime() / (24 * 60 * 60 * 1000));
    const bucketStartDay = daysSinceEpoch - (daysSinceEpoch % daysPerBucket);
    return bucketStartDay * 24 * 60 * 60 * 1000;
  }

  const currentHour = bucketDate.getHours();
  const bucketHour = Math.floor(currentHour / intervalHours) * intervalHours;
  bucketDate.setHours(bucketHour, 0, 0, 0);

  return bucketDate.getTime();
};

const formatTooltipDate = (timestamp) =>
  new Date(timestamp).toLocaleString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

const ChartRenderer = React.memo(({ HC, HCReact, chartOptions, chartRef }) => {
  if (!HC || !HCReact || !chartOptions) {
    return (
      <div className="flex h-full items-center justify-center text-gray-400">
        <div className="space-y-2 text-center">
          <div className="mx-auto h-6 w-6 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
          <p className="text-xs text-gray-400">Preparing chart...</p>
        </div>
      </div>
    );
  }

  return <HCReact highcharts={HC} options={chartOptions} ref={chartRef} />;
});

ChartRenderer.displayName = "ChartRenderer";

const CombinedRealTimeWeatherChart = ({ stationId, districtLabel }) => {
  const [HC, setHC] = useState(null);
  const [HCReact, setHCReact] = useState(null);
  const [hcReady, setHcReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timeRange, setTimeRange] = useState("month");
  const [intervalHours, setIntervalHours] = useState(8);
  const [customDateRange, setCustomDateRange] = useState({
    startDate: "",
    endDate: "",
    enabled: false,
  });
  const [rawSeries, setRawSeries] = useState({
    temperature: [],
    rainfall: [],
    humidity: [],
  });
  const chartRef = useRef(null);

  const chartHeight = isMobile ? 300 : 470;
  const todayDate = getDhakaToday();

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const mediaQuery = window.matchMedia("(max-width: 639px)");
    const syncViewport = () => setIsMobile(mediaQuery.matches);

    syncViewport();
    mediaQuery.addEventListener("change", syncViewport);

    return () => {
      mediaQuery.removeEventListener("change", syncViewport);
    };
  }, []);

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
      } catch (loadError) {
        console.error("Failed to load combined real-time weather chart:", loadError);
        if (mounted) setHcReady(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const fetchMeasureData = async (measure, range, customRange) => {
    let url = `${SAADS_API_URL}/research-measures/station/${stationId}/parameter/${encodeURIComponent(measure)}`;
    const params = new URLSearchParams();

    if (customRange?.enabled && customRange.startDate && customRange.endDate) {
      params.append("startDate", customRange.startDate);
      params.append("endDate", customRange.endDate);
    } else if (range) {
      params.append("timeRange", range);
    }

    params.append("interval", "1");

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${measure}`);
    }

    const payload = await response.json();

    return payload
      .map((item) => {
        const timestamp = parseDate(item.date_value);
        const value = parseValue(item.last_value);

        if (timestamp === null || value === null) {
          return null;
        }

        return {
          timestamp,
          value,
          raw: item,
        };
      })
      .filter(Boolean)
      .sort((a, b) => a.timestamp - b.timestamp);
  };

  useEffect(() => {
    if (!stationId) {
      setRawSeries({
        temperature: [],
        rainfall: [],
        humidity: [],
      });
      setLoading(false);
      return;
    }

    const fetchAllSeries = async () => {
      setLoading(true);
      setError("");

      try {
        const [temperature, rainfall, humidity] = await Promise.all([
          fetchMeasureData(PARAMETER_CONFIG.temperature.measure, timeRange, customDateRange),
          fetchMeasureData(PARAMETER_CONFIG.rainfall.measure, timeRange, customDateRange),
          fetchMeasureData(PARAMETER_CONFIG.humidity.measure, timeRange, customDateRange),
        ]);

        setRawSeries({
          temperature,
          rainfall,
          humidity,
        });
      } catch (fetchError) {
        console.error("Combined real-time weather chart load error:", fetchError);
        setRawSeries({
          temperature: [],
          rainfall: [],
          humidity: [],
        });
        setError(fetchError.message || "Failed to load real-time weather data");
      } finally {
        setLoading(false);
      }
    };

    fetchAllSeries();
  }, [customDateRange, stationId, timeRange]);

  const aggregatedData = useMemo(() => {
    const bucketMap = new Map();

    rawSeries.temperature.forEach((point) => {
      const bucketTimestamp = getBucketTimestamp(point.timestamp, intervalHours);
      if (!bucketMap.has(bucketTimestamp)) {
        bucketMap.set(bucketTimestamp, {
          timestamp: bucketTimestamp,
          tempValues: [],
          humidityValues: [],
          rainfallValues: [],
        });
      }

      bucketMap.get(bucketTimestamp).tempValues.push(point.value);
    });

    rawSeries.humidity.forEach((point) => {
      const bucketTimestamp = getBucketTimestamp(point.timestamp, intervalHours);
      if (!bucketMap.has(bucketTimestamp)) {
        bucketMap.set(bucketTimestamp, {
          timestamp: bucketTimestamp,
          tempValues: [],
          humidityValues: [],
          rainfallValues: [],
        });
      }

      bucketMap.get(bucketTimestamp).humidityValues.push(point.value);
    });

    rawSeries.rainfall.forEach((point) => {
      const bucketTimestamp = getBucketTimestamp(point.timestamp, intervalHours);
      if (!bucketMap.has(bucketTimestamp)) {
        bucketMap.set(bucketTimestamp, {
          timestamp: bucketTimestamp,
          tempValues: [],
          humidityValues: [],
          rainfallValues: [],
        });
      }

      bucketMap.get(bucketTimestamp).rainfallValues.push(point.value);
    });

    return Array.from(bucketMap.values())
      .sort((a, b) => a.timestamp - b.timestamp)
      .map((bucket) => ({
        timestamp: bucket.timestamp,
        maxTemperature: bucket.tempValues.length ? Math.max(...bucket.tempValues) : null,
        minTemperature: bucket.tempValues.length ? Math.min(...bucket.tempValues) : null,
        humidity: bucket.humidityValues.length
          ? bucket.humidityValues.reduce((sum, value) => sum + value, 0) / bucket.humidityValues.length
          : null,
        rainfall: bucket.rainfallValues.length
          ? bucket.rainfallValues.reduce((sum, value) => sum + value, 0)
          : null,
      }));
  }, [intervalHours, rawSeries]);

  const chartSeries = useMemo(
    () => [
      {
        name: "Max Temperature",
        legendLabel: "Max Temp",
        color: "#ef4444",
        type: "spline",
        unit: PARAMETER_CONFIG.temperature.unit,
        yAxis: 0,
        data: aggregatedData.map((item) => [item.timestamp, item.maxTemperature]),
      },
      {
        name: "Min Temperature",
        legendLabel: "Min Temp",
        color: "#3b82f6",
        type: "spline",
        unit: PARAMETER_CONFIG.temperature.unit,
        yAxis: 0,
        data: aggregatedData.map((item) => [item.timestamp, item.minTemperature]),
      },
      {
        name: "Air Humidity",
        legendLabel: "Humidity",
        color: "#8b5cf6",
        type: "spline",
        unit: PARAMETER_CONFIG.humidity.unit,
        yAxis: 1,
        data: aggregatedData.map((item) => [item.timestamp, item.humidity]),
      },
      {
        name: "Accumulated Rain 1h",
        legendLabel: "Rain 1h",
        color: "#06b6d4",
        type: "column",
        unit: PARAMETER_CONFIG.rainfall.unit,
        yAxis: 2,
        data: aggregatedData.map((item) => [item.timestamp, item.rainfall]),
      },
    ],
    [aggregatedData]
  );

  const chartOptions = useMemo(() => {
    if (!hcReady || !chartSeries.length || !aggregatedData.length) {
      return null;
    }

    const leftAxisValues = chartSeries
      .filter((item) => item.yAxis === 0)
      .flatMap((item) =>
        item.data
          .map((point) => point[1])
          .filter((value) => typeof value === "number" && !Number.isNaN(value))
      );

    const rainfallValues = chartSeries
      .filter((item) => item.yAxis === 2)
      .flatMap((item) =>
        item.data
          .map((point) => point[1])
          .filter((value) => typeof value === "number" && !Number.isNaN(value))
      );

    const leftMin = leftAxisValues.length ? Math.min(...leftAxisValues) : null;
    const leftMax = leftAxisValues.length ? Math.max(...leftAxisValues) : null;
    const leftRange =
      leftMin !== null && leftMax !== null ? Math.max(leftMax - leftMin, 1) : 1;
    const leftPadding = leftRange * 0.12;

    const rainfallMax = rainfallValues.length ? Math.max(...rainfallValues) : 0;

    return {
      time: { useUTC: false },
      chart: {
        type: "spline",
        zooming: { type: "x" },
        backgroundColor: "#ffffff",
        height: chartHeight,
        animation: { duration: 700 },
        spacingTop: isMobile ? 10 : 16,
        spacingBottom: isMobile ? 28 : 40,
        spacingLeft: isMobile ? 4 : 10,
        spacingRight: isMobile ? 6 : 42,
        style: { fontFamily: '"Montserrat", "Segoe UI", Roboto, sans-serif' },
      },
      title: { text: null },
      subtitle: { text: null },
      xAxis: {
        type: "datetime",
        gridLineColor: "rgba(0, 0, 0, 0.08)",
        gridLineDashStyle: "Dash",
        labels: {
          style: { fontSize: "11px", color: "#6B7280" },
          format: "{value:%d %b}",
        },
        lineColor: "#E5E7EB",
        title: {
          text: "Rainfall (mm)",
          style: { fontSize: "12px", fontWeight: "600", color: "#06b6d4" },
          margin: isMobile ? 10 : 16,
        },
      },
      yAxis: [
        {
          title: {
            text: "Temperature (°C)",
            style: { fontSize: "12px", fontWeight: "600", color: "#ef4444" },
          },
          gridLineColor: "rgba(0, 0, 0, 0.08)",
          gridLineDashStyle: "Dash",
          min: leftMin !== null ? leftMin - leftPadding : undefined,
          max: leftMax !== null ? leftMax + leftPadding : undefined,
          labels: { style: { fontSize: "11px", color: "#ef4444" } },
        },
        {
          title: {
            text: "Relative Humidity (%)",
            style: { fontSize: "12px", fontWeight: "600", color: "#8b5cf6" },
          },
          min: 0,
          max: 100,
          opposite: true,
          gridLineWidth: 0,
          labels: { style: { fontSize: "11px", color: "#8b5cf6" } },
        },
        {
          title: {
            text: null,
          },
          min: 0,
          max: Math.max(1, rainfallMax * 1.2),
          opposite: true,
          offset: isMobile ? 14 : 34,
          gridLineWidth: 0,
          labels: { enabled: false },
          tickLength: 0,
          lineWidth: 0,
        },
      ],
      tooltip: {
        shared: true,
        crosshairs: true,
        formatter: function () {
          const hoveredPoints = this.points || (this.point ? [this.point] : []);
          const tooltipRows = hoveredPoints.map((point) => {
            const unit = point.series.userOptions.unit || "";
            const valueText =
              typeof point.y === "number" && !Number.isNaN(point.y)
                ? point.y.toFixed(point.series.type === "column" ? 1 : 2)
                : "—";

            return (
              '<div style="display:flex;align-items:center;gap:8px;margin:4px 0;">' +
              `<span style="color:${point.series.color}">●</span>` +
              `<span style="font-weight:500;">${point.series.name}:</span>` +
              `<b>${valueText}</b> ${unit}` +
              "</div>"
            );
          });

          return (
            `<div style="font-size:12px;font-weight:bold;margin-bottom:8px;">${formatTooltipDate(this.x)}</div>` +
            tooltipRows.join("")
          );
        },
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
        margin: isMobile ? 8 : 16,
        itemMarginTop: 4,
        itemMarginBottom: 4,
        itemStyle: {
          fontSize: isMobile ? "11px" : "12px",
          fontWeight: "500",
          color: "#374151",
        },
        itemWidth: isMobile ? 120 : undefined,
        symbolRadius: 6,
        labelFormatter: function () {
          return this.userOptions.legendLabel || this.name;
        },
      },
      plotOptions: {
        spline: {
          lineWidth: 2.4,
          marker: { radius: 3.5, lineWidth: 1.5, lineColor: "#ffffff" },
          connectNulls: true,
          states: { hover: { lineWidth: 3.2 } },
        },
        column: {
          pointPadding: 0.16,
          borderWidth: 0,
          groupPadding: 0.08,
          states: { hover: { brightness: 0.08 } },
        },
      },
      series: chartSeries.map((item) => ({
        ...item,
        lineWidth: item.type === "column" ? 0 : 2.4,
        marker: {
          enabled: item.type !== "column",
          radius: 3.5,
          lineWidth: 1.5,
          lineColor: "#ffffff",
        },
      })),
      credits: { enabled: false },
      exporting: {
        enabled: true,
        buttons: { contextButton: { enabled: false } },
      },
    };
  }, [aggregatedData, chartHeight, chartSeries, hcReady, isMobile]);

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    setCustomDateRange({
      startDate: "",
      endDate: "",
      enabled: false,
    });
  };

  const handleIntervalChange = (hours) => {
    setIntervalHours(hours);
  };

  const handleCustomDateRangeChange = (field, value) => {
    const nextRange = { ...customDateRange, [field]: value };
    setCustomDateRange(nextRange);

    if (nextRange.startDate && nextRange.endDate) {
      setTimeRange("custom");
      setCustomDateRange({
        ...nextRange,
        enabled: true,
      });
    }
  };

  const clearCustomDateRange = () => {
    setCustomDateRange({
      startDate: "",
      endDate: "",
      enabled: false,
    });
    setTimeRange("month");
  };

  const hasData = chartSeries.some((item) =>
    item.data.some((point) => typeof point[1] === "number" && !Number.isNaN(point[1]))
  );

  const handleImageDownload = () => {
    if (!HC || !chartOptions || !hasData) {
      return;
    }

    const exportContainer = document.createElement("div");
    exportContainer.style.position = "fixed";
    exportContainer.style.left = "-99999px";
    exportContainer.style.top = "0";
    exportContainer.style.width = "1800px";
    exportContainer.style.height = "860px";
    exportContainer.style.pointerEvents = "none";
    exportContainer.style.opacity = "0";
    document.body.appendChild(exportContainer);

    const exportChart = HC.chart(exportContainer, {
      ...chartOptions,
      chart: {
        ...chartOptions.chart,
        renderTo: exportContainer,
        width: 1800,
        height: 860,
        backgroundColor: "#ffffff",
        animation: false,
        spacingTop: 30,
        spacingRight: 26,
        spacingBottom: 40,
        spacingLeft: 24,
        style: { fontFamily: '"Montserrat", "Segoe UI", Roboto, sans-serif' },
      },
      title: {
        text: "Combined Real Time Weather Overview",
        align: "left",
        margin: 18,
        style: { fontSize: "28px", fontWeight: "700", color: "#1f2937" },
      },
      subtitle: {
        text: `${districtLabel} | Air Temperature min/max, Accumulated Rain 1h and Air Humidity`,
        align: "left",
        style: { fontSize: "16px", color: "#6b7280" },
      },
      legend: {
        ...chartOptions.legend,
        itemStyle: { fontSize: "14px", fontWeight: "500", color: "#374151" },
      },
    });

    const exportMethod = exportChart.exportChartLocal || exportChart.exportChart;
    exportMethod.call(exportChart, {
      type: "image/png",
      filename: `combined_real_time_weather_overview_${districtLabel.toLowerCase().replace(/\s+/g, "_")}`,
      sourceWidth: 1800,
      sourceHeight: 860,
      scale: 2,
    });

    window.setTimeout(() => {
      exportChart.destroy();
      exportContainer.remove();
    }, 1500);
  };

  const handleCSVDownload = () => {
    const csvRows = [
      "Date,Max Temperature (°C),Min Temperature (°C),Air Humidity (%),Accumulated Rain 1h (mm)",
    ];

    aggregatedData.forEach((item) => {
      const rowDate = new Date(item.timestamp).toLocaleString("en-US");
      csvRows.push(
        [
          rowDate,
          item.maxTemperature ?? "",
          item.minTemperature ?? "",
          item.humidity ?? "",
          item.rainfall ?? "",
        ].join(",")
      );
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `combined_real_time_weather_overview_${districtLabel.toLowerCase().replace(/\s+/g, "_")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm sm:rounded-2xl">
      <div className="p-1.5 sm:p-5">
        <div className="mb-2 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div className="flex items-start gap-1.5 sm:items-center sm:gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-[#0a3d3d] to-[#0d5555] shadow-sm sm:h-10 sm:w-10 sm:rounded-xl">
              <span className="text-base text-white sm:text-lg">⛅</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-gray-800 sm:text-xl">
                Combined Real Time Weather Overview
              </h2>
              <p className="text-[10px] leading-3.5 text-gray-400 sm:text-xs sm:leading-4">
                {districtLabel} | Air Temperature min/max, Accumulated Rain 1h and Air Humidity
              </p>
            </div>
          </div>

          {/* {hasData && (
            <div className="flex gap-1.5 self-start sm:self-auto">
              <button
                onClick={handleImageDownload}
                className="inline-flex items-center gap-1 rounded-md bg-[#0d4a4a] px-2 py-1 text-[10px] font-semibold text-white shadow-sm transition-colors hover:bg-[#0a3d3d] sm:gap-1.5 sm:rounded-lg sm:px-3 sm:py-1.5 sm:text-xs"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Image
              </button>
              <button
                onClick={handleCSVDownload}
                className="inline-flex items-center gap-1 rounded-md bg-teal-600 px-2 py-1 text-[10px] font-semibold text-white shadow-sm transition-colors hover:bg-teal-700 sm:gap-1.5 sm:rounded-lg sm:px-3 sm:py-1.5 sm:text-xs"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                CSV
              </button>
            </div>
          )} */}
        </div>

        {hasData && (
          <div className="mb-3 overflow-hidden rounded-xl border border-gray-100">
            <div className="flex flex-col lg:flex-row">
              <div className="flex-1 space-y-2.5 p-3">
                <div className="flex items-center gap-2">
                  <div className="flex shrink-0 items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-[#0d4a4a]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Range</span>
                  </div>
                  <div className="flex gap-0.5 rounded-lg bg-gray-100 p-0.5">
                    {TIME_RANGE_OPTIONS.map((range) => (
                      <button
                        key={range.key}
                        onClick={() => handleTimeRangeChange(range.key)}
                        className={`rounded-md px-2 py-1 text-[11px] font-semibold transition-all duration-150 sm:px-2.5 ${
                          timeRange === range.key && !customDateRange.enabled
                            ? "bg-[#0d4a4a] text-white shadow-sm"
                            : "text-gray-500 hover:bg-white/60 hover:text-gray-700"
                        }`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex shrink-0 items-center gap-1.5">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-teal-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 7.5L7.5 3m0 0L12 7.5M7.5 3v13.5m13.5 0L16.5 21m0 0L12 16.5m4.5 4.5V7.5" />
                    </svg>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Interval</span>
                  </div>
                  <div className="flex gap-0.5 rounded-lg bg-gray-100 p-0.5">
                    {INTERVAL_OPTIONS.map((interval) => (
                      <button
                        key={interval.hours}
                        onClick={() => handleIntervalChange(interval.hours)}
                        className={`rounded-md px-2 py-1 text-[11px] font-semibold transition-all duration-150 sm:px-2.5 ${
                          intervalHours === interval.hours
                            ? "bg-teal-600 text-white shadow-sm"
                            : "text-gray-500 hover:bg-white/60 hover:text-gray-700"
                        }`}
                      >
                        {interval.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col justify-center gap-2 border-t border-gray-100 bg-gray-50/60 p-3 lg:w-72 lg:border-l lg:border-t-0 xl:w-80">
                <div className="flex items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
                  </svg>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Custom Range</span>
                  {customDateRange.enabled ? (
                    <button
                      onClick={clearCustomDateRange}
                      className="ml-auto flex items-center gap-0.5 text-[10px] font-medium text-red-400 transition-colors hover:text-red-500"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                      Clear
                    </button>
                  ) : null}
                </div>
                <div className="flex items-center gap-1.5">
                  <input
                    type="date"
                    value={customDateRange.startDate}
                    onChange={(event) => handleCustomDateRangeChange("startDate", event.target.value)}
                    className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30"
                    max={todayDate}
                  />
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                  <input
                    type="date"
                    value={customDateRange.endDate}
                    onChange={(event) => handleCustomDateRangeChange("endDate", event.target.value)}
                    className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30"
                    min={customDateRange.startDate}
                    max={todayDate}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
            <p className="text-xs font-medium text-gray-400">Loading combined real-time weather…</p>
          </div>
        ) : error ? (
          <div className="flex h-48 flex-col items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <p className="text-center text-xs text-gray-500">{error}</p>
          </div>
        ) : hasData && hcReady && chartOptions ? (
          <div className="overflow-hidden rounded-lg border border-gray-100 bg-white p-0 sm:rounded-xl sm:p-2">
            <div style={{ height: `${chartHeight}px` }}>
              <ChartRenderer
                HC={HC}
                HCReact={HCReact}
                chartOptions={chartOptions}
                chartRef={chartRef}
              />
            </div>
          </div>
        ) : (
          <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50">
            <span className="text-3xl opacity-30">⛅</span>
            <p className="text-xs text-gray-400">No real-time data available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CombinedRealTimeWeatherChart;
