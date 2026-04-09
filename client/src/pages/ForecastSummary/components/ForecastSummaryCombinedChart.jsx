import React, { useEffect, useMemo, useRef, useState } from "react";

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

const ForecastSummaryCombinedChart = ({
  title,
  subtitle,
  icon,
  dates,
  series,
  csvFilename,
  imageFilename,
}) => {
  const [HC, setHC] = useState(null);
  const [HCReact, setHCReact] = useState(null);
  const [hcReady, setHcReady] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const chartRef = useRef(null);
  const chartHeight = isMobile ? 280 : 470;

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
      } catch (error) {
        console.error("Failed to load combined forecast chart:", error);
        if (mounted) setHcReady(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  const chartSeries = useMemo(
    () =>
      series.map((item) => ({
        type: item.type || "spline",
        name: item.name,
        data: item.data,
        color: item.color,
        yAxis: item.yAxis || 0,
        unit: item.unit || "",
        lineWidth: (item.type || "spline") === "column" ? 0 : 2.4,
        fillOpacity: (item.type || "spline") === "column" ? 0 : 0.06,
        marker: {
          enabled: (item.type || "spline") !== "column",
          radius: 3.5,
          lineWidth: 1.5,
          lineColor: "#ffffff",
        },
      })),
    [series]
  );

  const chartOptions = useMemo(() => {
    if (!hcReady || !chartSeries.length) return null;

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
      chart: {
        type: "spline",
        zooming: { type: "x" },
        backgroundColor: "#ffffff",
        height: chartHeight,
        animation: { duration: 700 },
        spacingTop: 16,
        spacingBottom: 22,
        spacingLeft: 10,
        spacingRight: isMobile ? 18 : 82,
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
      },
      yAxis: [
        {
          title: {
            text: "Temperature / Dew Point (°C)",
            style: { fontSize: "12px", fontWeight: "600", color: "#374151" },
          },
          gridLineColor: "rgba(0, 0, 0, 0.08)",
          gridLineDashStyle: "Dash",
          min: leftMin !== null ? leftMin - leftPadding : undefined,
          max: leftMax !== null ? leftMax + leftPadding : undefined,
          labels: { style: { fontSize: "11px", color: "#6B7280" } },
        },
        {
          title: {
            text: "Relative Humidity (%)",
            style: { fontSize: "12px", fontWeight: "600", color: "#6B7280" },
          },
          min: 0,
          max: 100,
          opposite: true,
          gridLineWidth: 0,
          labels: { style: { fontSize: "11px", color: "#6B7280" } },
        },
        {
          title: {
            text: "Rainfall (mm)",
            style: { fontSize: "12px", fontWeight: "600", color: "#0891b2" },
          },
          min: 0,
          max: Math.max(1, rainfallMax * 1.2),
          opposite: true,
          offset: 56,
          gridLineWidth: 0,
          labels: { style: { fontSize: "11px", color: "#0891b2" } },
        },
      ],
      tooltip: {
        shared: true,
        crosshairs: true,
        xDateFormat: "%A, %b %e, %Y",
        headerFormat:
          '<div style="font-size:12px;font-weight:bold;margin-bottom:8px;">{point.key}</div>',
        pointFormatter: function () {
          const unit = this.series.userOptions.unit || "";
          const decimals = this.series.type === "column" ? 1 : 2;
          const valueText = typeof this.y === "number" ? this.y.toFixed(decimals) : "—";

          return (
            '<div style="display:flex;align-items:center;gap:8px;margin:4px 0;">' +
            `<span style="color:${this.series.color}">●</span>` +
            `<span style="font-weight:500;">${this.series.name}:</span>` +
            `<b>${valueText}</b> ${unit}` +
            "</div>"
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
        itemMarginTop: 4,
        itemMarginBottom: 4,
        itemStyle: { fontSize: "12px", fontWeight: "500", color: "#374151" },
        symbolRadius: 6,
      },
      plotOptions: {
        spline: {
          lineWidth: 2.4,
          marker: { radius: 3.5, lineWidth: 1.5, lineColor: "#ffffff" },
          connectNulls: true,
          states: { hover: { lineWidth: 3.2 } },
        },
        areaspline: {
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
      series: chartSeries,
      credits: { enabled: false },
      exporting: {
        enabled: true,
        buttons: { contextButton: { enabled: false } },
      },
    };
  }, [chartHeight, chartSeries, hcReady, isMobile]);

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
        spacingBottom: 24,
        spacingLeft: 24,
        style: { fontFamily: '"Montserrat", "Segoe UI", Roboto, sans-serif' },
      },
      title: {
        text: title,
        align: "left",
        margin: 18,
        style: { fontSize: "28px", fontWeight: "700", color: "#1f2937" },
      },
      subtitle: {
        text: subtitle,
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
      filename: imageFilename,
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
    const csvRows = ["Date," + series.map((item) => item.name).join(",")];

    dates.forEach((date, index) => {
      const rowValues = series.map((item) => {
        const point = item.data[index];
        return point && typeof point[1] === "number" ? point[1].toFixed(2) : "";
      });
      csvRows.push(`${date.label},${rowValues.join(",")}`);
    });

    const blob = new Blob([csvRows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = csvFilename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const hasData = series.some((item) =>
    item.data.some((point) => typeof point[1] === "number" && !Number.isNaN(point[1]))
  );

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm sm:rounded-2xl">
      <div className="p-2 sm:p-5">
        <div className="mb-2 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
          <div className="flex items-start gap-1.5 sm:items-center sm:gap-2.5">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-[#0a3d3d] to-[#0d5555] shadow-sm sm:h-10 sm:w-10 sm:rounded-xl">
              <span className="text-base text-white sm:text-lg">{icon}</span>
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-gray-800 sm:text-xl">{title}</h2>
              <p className="text-[10px] leading-3.5 text-gray-400 sm:text-xs sm:leading-4">{subtitle}</p>
            </div>
          </div>

          {hasData && (
            <div className="flex gap-1.5 self-start sm:self-auto">
              <button
                onClick={handleImageDownload}
                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-white bg-[#0d4a4a] hover:bg-[#0a3d3d] rounded-md transition-colors shadow-sm sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs sm:rounded-lg"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Image
              </button>
              <button
                onClick={handleCSVDownload}
                className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold text-white bg-teal-600 hover:bg-teal-700 rounded-md transition-colors shadow-sm sm:gap-1.5 sm:px-3 sm:py-1.5 sm:text-xs sm:rounded-lg"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                CSV
              </button>
            </div>
          )}
        </div>

        {hcReady && chartOptions ? (
          <div className="overflow-hidden rounded-lg border border-gray-100 bg-white p-0.5 sm:rounded-xl sm:p-2">
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
          <div className="flex h-48 flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-200 bg-gray-50 sm:h-80 sm:rounded-xl">
            <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-gray-400">Loading chart...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForecastSummaryCombinedChart;
