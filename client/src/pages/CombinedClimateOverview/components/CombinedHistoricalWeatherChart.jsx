import React, { useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../../config/api";

const PARAMETER_CONFIG = [
  {
    key: "maximum-temp",
    name: "Maximum Temperature",
    legendLabel: "MaxT",
    color: "#ef4444",
    type: "areaspline",
    unit: "°C",
    yAxis: 0,
  },
  {
    key: "minimum-temp",
    name: "Minimum Temperature",
    legendLabel: "MinT",
    color: "#3b82f6",
    type: "areaspline",
    unit: "°C",
    yAxis: 0,
  },
  {
    key: "relative-humidity",
    name: "Relative Humidity",
    legendLabel: "RH",
    color: "#8b5cf6",
    type: "areaspline",
    unit: "%",
    yAxis: 1,
  },
  {
    key: "rainfall",
    name: "Rainfall",
    legendLabel: "Rainfall",
    color: "#06b6d4",
    type: "column",
    unit: "mm",
    yAxis: 2,
  },
];

const normalizeName = (value = "") =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

const processRawData = (records) => {
  const chartData = [];

  records.forEach((record) => {
    for (let day = 1; day <= 31; day += 1) {
      const value = record[`day${day}`];
      if (value !== null && value !== undefined && value !== "") {
        const year = Number.parseInt(record.year, 10);
        const month = Number.parseInt(record.month, 10);
        const date = new Date(year, month - 1, day);

        if (date.getDate() === day && date.getMonth() === month - 1) {
          chartData.push([date.getTime(), Number.parseFloat(value)]);
        }
      }
    }
  });

  return chartData.sort((a, b) => a[0] - b[0]);
};

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
    "3M": 90,
    "6M": 180,
    "1Y": 365,
    "5Y": 1825,
    "10Y": 3650,
    "20Y": 7300,
    "30Y": 10950,
    "50Y": 18250,
    All: Infinity,
  };

  const daysBack = intervalDays[range] || 90;
  const startDate = new Date(mostRecentDate);
  startDate.setDate(startDate.getDate() - daysBack);

  return fullData.filter((point) => point[0] >= startDate.getTime());
};

const aggregateDataByInterval = (data, interval) => {
  if (!data || data.length === 0 || interval === "none") return data;

  if (interval === "1W") {
    const sortedData = [...data].sort((a, b) => a[0] - b[0]);
    if (sortedData.length === 0) return [];

    const buckets = new Map();
    sortedData.forEach((point) => {
      const date = new Date(point[0]);
      const startOfYear = new Date(date.getFullYear(), 0, 1);
      const dayOfYear = Math.floor((date - startOfYear) / (24 * 60 * 60 * 1000));
      const weekNum = Math.floor(dayOfYear / 7);
      const bucketKey = `${date.getFullYear()}-W${weekNum}`;

      if (!buckets.has(bucketKey)) {
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

  const months = intervalMonths[interval];
  if (!months) return data;

  const sortedData = [...data].sort((a, b) => a[0] - b[0]);
  if (sortedData.length === 0) return [];

  const buckets = new Map();

  sortedData.forEach((point) => {
    const date = new Date(point[0]);
    const year = date.getFullYear();
    const month = date.getMonth();

    let bucketKey;
    if (months < 12) {
      const bucketIndex = Math.floor(month / months);
      bucketKey = `${year}-${bucketIndex}`;
    } else {
      const yearsPerBucket = months / 12;
      const bucketYear = Math.floor(year / yearsPerBucket) * yearsPerBucket;
      bucketKey = `${bucketYear}`;
    }

    if (!buckets.has(bucketKey)) {
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
        centerDate = new Date(centerYear, 6, 1);
      }

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
};

const getValidDataAverageOptions = (timeRange) => {
  const timeRangeMonths = {
    "3M": 3,
    "6M": 6,
    "1Y": 12,
    "5Y": 60,
    "10Y": 120,
    "20Y": 240,
    "30Y": 360,
    "50Y": 600,
    All: Infinity,
  };

  const dataAverageMonths = {
    "1W": 0.25,
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

  return Object.entries(dataAverageMonths)
    .filter(([, months]) => months <= selectedRangeMonths / 2)
    .map(([key]) => key);
};

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

const CombinedHistoricalWeatherChart = ({ districtLabel, stationCandidates = [] }) => {
  const [HC, setHC] = useState(null);
  const [HCReact, setHCReact] = useState(null);
  const [hcReady, setHcReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [resolvedStation, setResolvedStation] = useState("");
  const [stationLookupReady, setStationLookupReady] = useState(false);
  const [rawParameterData, setRawParameterData] = useState({
    "maximum-temp": [],
    "minimum-temp": [],
    rainfall: [],
    "relative-humidity": [],
  });
  const [timeRange, setTimeRange] = useState("3M");
  const [dataAverage, setDataAverage] = useState("none");
  const [customDateRange, setCustomDateRange] = useState({
    startDate: "",
    endDate: "",
    enabled: false,
  });
  const chartRef = useRef(null);
  const chartHeight = isMobile ? 320 : 460;

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
        console.error("Failed to load combined historical weather chart:", loadError);
        if (mounted) setHcReady(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const fetchStationList = async () => {
      setStationLookupReady(false);

      try {
        const response = await axios.get(`${API_BASE_URL}/maximum-temp/stations`);
        const stationList = response.data?.success ? response.data.data || [] : [];

        const normalizedStationMap = new Map(
          stationList.map((station) => [normalizeName(station), station])
        );

        const candidateList = [
          ...stationCandidates,
          districtLabel,
        ].filter(Boolean);

        let matchedStation = "";
        for (const candidate of candidateList) {
          const directMatch = normalizedStationMap.get(normalizeName(candidate));
          if (directMatch) {
            matchedStation = directMatch;
            break;
          }
        }

        if (active) {
          setResolvedStation(matchedStation);
          setStationLookupReady(true);
        }
      } catch (stationError) {
        console.error("Combined historical station load error:", stationError);
        if (active) {
          setResolvedStation("");
          setStationLookupReady(true);
        }
      }
    };

    fetchStationList();

    return () => {
      active = false;
    };
  }, [districtLabel, stationCandidates]);

  useEffect(() => {
    if (!stationLookupReady) return;

    if (!resolvedStation) {
      setRawParameterData({
        "maximum-temp": [],
        "minimum-temp": [],
        rainfall: [],
        "relative-humidity": [],
      });
      setLoading(false);
      setError("");
      return;
    }

    const fetchHistoricalData = async () => {
      setLoading(true);
      setError("");

      try {
        const responses = await Promise.all(
          PARAMETER_CONFIG.map((parameter) =>
            axios.get(
              `${API_BASE_URL}/${parameter.key}?station=${encodeURIComponent(resolvedStation)}&limit=10000`
            )
          )
        );

        const nextData = {};
        responses.forEach((response, index) => {
          const parameterKey = PARAMETER_CONFIG[index].key;
          nextData[parameterKey] =
            response.data?.success && Array.isArray(response.data?.data)
              ? processRawData(response.data.data)
              : [];
        });

        setRawParameterData(nextData);

        const hasAnyData = Object.values(nextData).some((series) => series.length > 0);
        if (!hasAnyData) {
          setError("No historical data is available for the selected district station.");
        }
      } catch (fetchError) {
        console.error("Combined historical weather load error:", fetchError);
        setRawParameterData({
          "maximum-temp": [],
          "minimum-temp": [],
          rainfall: [],
          "relative-humidity": [],
        });
        setError("Failed to load historical weather data");
      } finally {
        setLoading(false);
      }
    };

    fetchHistoricalData();
  }, [resolvedStation, stationLookupReady]);

  const filteredParameterData = useMemo(() => {
    const filtered = {};

    PARAMETER_CONFIG.forEach((parameter) => {
      let data = filterDataByTimeRange(
        rawParameterData[parameter.key] || [],
        timeRange,
        customDateRange.enabled ? customDateRange : null
      );

      if (dataAverage !== "none") {
        data = aggregateDataByInterval(data, dataAverage);
      }

      filtered[parameter.key] = data;
    });

    return filtered;
  }, [customDateRange, dataAverage, rawParameterData, timeRange]);

  const chartSeries = useMemo(
    () =>
      PARAMETER_CONFIG.map((parameter) => ({
        ...parameter,
        data: (filteredParameterData[parameter.key] || []).filter(
          (point) =>
            Array.isArray(point) &&
            point.length === 2 &&
            typeof point[0] === "number" &&
            typeof point[1] === "number" &&
            !Number.isNaN(point[0]) &&
            !Number.isNaN(point[1])
        ),
      })).filter((series) => series.data.length > 0),
    [filteredParameterData]
  );

  const hasData = chartSeries.some((series) => series.data.length > 0);

  const chartOptions = useMemo(() => {
    if (!hcReady || !chartSeries.length) return null;

    const temperatureValues = chartSeries
      .filter((series) => series.yAxis === 0)
      .flatMap((series) => series.data.map((point) => point[1]))
      .filter((value) => typeof value === "number" && !Number.isNaN(value));

    const rainfallValues = chartSeries
      .filter((series) => series.yAxis === 2)
      .flatMap((series) => series.data.map((point) => point[1]))
      .filter((value) => typeof value === "number" && !Number.isNaN(value));

    const tempMin = temperatureValues.length ? Math.min(...temperatureValues) : null;
    const tempMax = temperatureValues.length ? Math.max(...temperatureValues) : null;
    const tempRange =
      tempMin !== null && tempMax !== null ? Math.max(tempMax - tempMin, 1) : 1;
    const tempPadding = tempRange * 0.08;
    const rainfallMax = rainfallValues.length ? Math.max(...rainfallValues) : 0;

    return {
      time: { useUTC: false },
      chart: {
        type: "areaspline",
        zooming: { type: "x" },
        backgroundColor: "transparent",
        height: chartHeight,
        animation: { duration: 800 },
        spacingTop: 12,
        spacingBottom: isMobile ? 28 : 36,
        spacingLeft: isMobile ? 6 : 10,
        spacingRight: isMobile ? 8 : 38,
        style: { fontFamily: '"Inter", "Segoe UI", Roboto, sans-serif' },
      },
      title: { text: null },
      subtitle: { text: null },
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
        title: {
          text: "Rainfall (mm)",
          style: { fontSize: "12px", fontWeight: "600", color: "#06b6d4" },
          margin: isMobile ? 10 : 14,
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
          min: tempMin !== null ? Math.max(0, tempMin - tempPadding) : undefined,
          max: tempMax !== null ? tempMax + tempPadding : undefined,
          labels: { style: { fontSize: "11px", color: "#6B7280" } },
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
          title: { text: null },
          min: 0,
          max: Math.max(1, rainfallMax * 1.2),
          opposite: true,
          offset: isMobile ? 12 : 30,
          gridLineWidth: 0,
          labels: { enabled: false },
          tickLength: 0,
          lineWidth: 0,
        },
      ],
      tooltip: {
        shared: true,
        crosshairs: true,
        xDateFormat: "%A, %b %e, %Y",
        formatter: function () {
          const hoveredPoints = this.points || (this.point ? [this.point] : []);
          const dateLabel =
            typeof this.x === "number" ? HC.dateFormat("%A, %b %e, %Y", this.x) : "";

          const tooltipRows = hoveredPoints.map((point) => {
            const unit = point.series.userOptions.unit || "";
            const decimals = point.series.type === "column" ? 1 : 2;
            const valueText =
              typeof point.y === "number" && !Number.isNaN(point.y)
                ? point.y.toFixed(decimals)
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
            `<div style="font-size:12px;font-weight:bold;margin-bottom:8px;">${dateLabel}</div>` +
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
        margin: isMobile ? 10 : 16,
        itemWidth: isMobile ? 120 : undefined,
        itemMarginTop: 4,
        itemMarginBottom: 4,
        itemStyle: { fontSize: isMobile ? "11px" : "12px", fontWeight: "500", color: "#374151" },
        symbolRadius: 6,
        labelFormatter: function () {
          return this.userOptions.legendLabel || this.name;
        },
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
      series: chartSeries.map((series) => ({
        type: series.type,
        name: series.name,
        legendLabel: series.legendLabel,
        data: series.data,
        color: series.color,
        yAxis: series.yAxis,
        unit: series.unit,
        lineWidth: series.type === "column" ? 0 : 2.5,
        marker: {
          enabled: series.type !== "column",
          radius: 4,
          lineWidth: 2,
          lineColor: "#ffffff",
        },
      })),
      credits: { enabled: false },
      exporting: {
        enabled: true,
        buttons: { contextButton: { enabled: false } },
      },
    };
  }, [HC, chartHeight, chartSeries, hcReady, isMobile]);

  const handleTimeRangeChange = (range) => {
    setTimeRange(range);
    setCustomDateRange({
      startDate: "",
      endDate: "",
      enabled: false,
    });

    const validOptions = getValidDataAverageOptions(range);
    if (dataAverage !== "none" && !validOptions.includes(dataAverage)) {
      setDataAverage("none");
    }
  };

  const handleDataAverageChange = (average) => {
    setDataAverage(average);
  };

  const handleCustomDateChange = (field, value) => {
    const nextRange = { ...customDateRange, [field]: value };

    if (nextRange.startDate && nextRange.endDate) {
      setCustomDateRange({
        ...nextRange,
        enabled: true,
      });
      setTimeRange("custom");
    } else {
      setCustomDateRange({
        ...nextRange,
        enabled: false,
      });
    }
  };

  const clearCustomDateRange = () => {
    setCustomDateRange({
      startDate: "",
      endDate: "",
      enabled: false,
    });
    setTimeRange("3M");
    setDataAverage("none");
  };

  const handleImageDownload = () => {
    if (!HC || !chartOptions || !hasData) return;

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
        spacingTop: 28,
        spacingRight: 26,
        spacingBottom: 40,
        spacingLeft: 24,
      },
      title: {
        text: "Combined Historical Weather Overview",
        align: "left",
        margin: 18,
        style: { fontSize: "28px", fontWeight: "700", color: "#1f2937" },
      },
      subtitle: {
        text: `${districtLabel} | Maximum Temperature, Minimum Temperature, Rainfall and Relative Humidity`,
        align: "left",
        style: { fontSize: "16px", color: "#6b7280" },
      },
      legend: {
        ...chartOptions.legend,
        itemWidth: undefined,
        itemStyle: { fontSize: "14px", fontWeight: "500", color: "#374151" },
      },
    });

    const exportMethod = exportChart.exportChartLocal || exportChart.exportChart;
    exportMethod.call(exportChart, {
      type: "image/png",
      filename: `combined_historical_weather_overview_${districtLabel.toLowerCase().replace(/\s+/g, "_")}`,
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
    const maxTempSeries = filteredParameterData["maximum-temp"] || [];
    const minTempSeries = filteredParameterData["minimum-temp"] || [];
    const rainfallSeries = filteredParameterData.rainfall || [];
    const humiditySeries = filteredParameterData["relative-humidity"] || [];

    const timestamps = new Set();
    [maxTempSeries, minTempSeries, rainfallSeries, humiditySeries].forEach((series) => {
      series.forEach((point) => timestamps.add(point[0]));
    });

    const sortedTimestamps = Array.from(timestamps).sort((a, b) => a - b);
    const csvRows = [
      "Date,Maximum Temperature (°C),Minimum Temperature (°C),Rainfall (mm),Relative Humidity (%)",
    ];

    const getValueAtTimestamp = (series, timestamp) => {
      const point = series.find((item) => item[0] === timestamp);
      return point ? point[1].toFixed(2) : "";
    };

    sortedTimestamps.forEach((timestamp) => {
      csvRows.push(
        [
          new Date(timestamp).toLocaleDateString(),
          getValueAtTimestamp(maxTempSeries, timestamp),
          getValueAtTimestamp(minTempSeries, timestamp),
          getValueAtTimestamp(rainfallSeries, timestamp),
          getValueAtTimestamp(humiditySeries, timestamp),
        ].join(",")
      );
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `combined_historical_weather_overview_${districtLabel.toLowerCase().replace(/\s+/g, "_")}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (stationLookupReady && !resolvedStation) {
    return null;
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="p-4 sm:p-5">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-[#0a3d3d] to-[#0d5555] shadow-sm">
              <span className="text-lg text-white">📚</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800 sm:text-xl">
                Combined Historical Weather Overview
              </h2>
              <p className="text-xs text-gray-400">
                {districtLabel} | Maximum Temperature, Minimum Temperature, Rainfall and Relative Humidity
              </p>
            </div>
          </div>

          {hasData ? (
            <div className="flex gap-1.5 self-start sm:self-auto">
              <button
                onClick={handleImageDownload}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#0d4a4a] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#0a3d3d]"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Image
              </button>
              <button
                onClick={handleCSVDownload}
                className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-teal-700"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                CSV
              </button>
            </div>
          ) : null}
        </div>

        <div className="mb-4 overflow-hidden rounded-xl border border-gray-100">
          <div className="flex flex-col xl:flex-row">
            <div className="flex-1 space-y-2.5 p-3">
              <div className="flex items-center gap-2">
                <div className="flex shrink-0 items-center gap-1.5">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-[#0d4a4a]" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Range</span>
                </div>
                <div className="flex flex-wrap gap-0.5 rounded-lg bg-gray-100 p-0.5">
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
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">Average</span>
                </div>
                <div className="flex flex-wrap gap-0.5 rounded-lg bg-gray-100 p-0.5">
                  {[
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
                    const validOptions = getValidDataAverageOptions(timeRange);
                    const isValid = option.key === "none" || validOptions.includes(option.key);

                    return (
                      <button
                        key={option.key}
                        onClick={() => isValid && handleDataAverageChange(option.key)}
                        disabled={!isValid}
                        className={`rounded-md px-2 py-1 text-[11px] font-semibold transition-all duration-150 sm:px-2.5 ${
                          dataAverage === option.key
                            ? "bg-teal-600 text-white shadow-sm"
                            : isValid
                              ? "text-gray-500 hover:bg-white/60 hover:text-gray-700"
                              : "cursor-not-allowed text-gray-300"
                        }`}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {dataAverage !== "none" ? (
                <p className="ml-18 text-[11px] text-gray-400">
                  Data averaged over {dataAverage} intervals
                </p>
              ) : null}
            </div>

            <div className="flex flex-col justify-center gap-2 border-t border-gray-100 bg-gray-50/60 p-3 xl:w-72 xl:border-l xl:border-t-0 2xl:w-80">
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
                  onChange={(event) => handleCustomDateChange("startDate", event.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30"
                />
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 shrink-0 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                </svg>
                <input
                  type="date"
                  value={customDateRange.endDate}
                  onChange={(event) => handleCustomDateChange("endDate", event.target.value)}
                  className="min-w-0 flex-1 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-xs outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/30"
                  min={customDateRange.startDate}
                />
              </div>
            </div>
          </div>
        </div>

        {loading || !hcReady ? (
          <div className="flex h-96 flex-col items-center justify-center gap-2">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
            <p className="text-xs font-medium text-gray-400">
              {!hcReady ? "Initializing chart engine…" : "Loading historical weather data…"}
            </p>
          </div>
        ) : error ? (
          <div className="flex h-96 flex-col items-center justify-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-gray-300" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
            </svg>
            <p className="max-w-md text-center text-xs text-gray-500">{error}</p>
          </div>
        ) : hasData && chartOptions ? (
          <div className="overflow-hidden rounded-xl border border-gray-100 bg-white p-2">
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
          <div className="flex h-96 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50">
            <span className="text-3xl opacity-30">📚</span>
            <p className="text-xs text-gray-400">
              No historical data is available for the selected range
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CombinedHistoricalWeatherChart;
