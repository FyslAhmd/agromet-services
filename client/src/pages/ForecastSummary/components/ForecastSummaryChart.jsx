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

const ForecastSummaryChart = ({
  title,
  subtitle,
  unit,
  icon,
  dates,
  series,
  csvFilename,
  imageFilename,
  chartType = "areaspline",
}) => {
  const [HC, setHC] = useState(null);
  const [HCReact, setHCReact] = useState(null);
  const [hcReady, setHcReady] = useState(false);
  const chartRef = useRef(null);

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
        console.error("Failed to load forecast summary chart:", error);
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
        type: item.type || chartType,
        name: item.name,
        data: item.data,
        color: item.color,
        lineWidth: (item.type || chartType) === "column" ? 0 : 2.5,
        fillOpacity: (item.type || chartType) === "column" ? 0 : 0.08,
        marker: {
          enabled: true,
          radius: 4,
          lineWidth: 2,
          lineColor: "#ffffff",
        },
      })),
    [series]
  );

  const chartOptions = useMemo(() => {
    if (!hcReady || !chartSeries.length) return null;

    const allValues = chartSeries.flatMap((item) =>
      item.data.map((point) => point[1]).filter((value) => typeof value === "number" && !Number.isNaN(value))
    );

    if (!allValues.length) return null;

    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    const range = maxValue - minValue;
    const padding = Math.max(range * 0.08, 1);

    return {
      chart: {
        type: chartType,
        zooming: { type: "x" },
        backgroundColor: "#ffffff",
        height: 420,
        animation: { duration: 700 },
        style: { fontFamily: '"Montserrat", "Segoe UI", Roboto, sans-serif' },
      },
      title: {
        text: null,
        align: "left",
        style: { fontSize: "18px", fontWeight: "bold", color: "#374151" },
      },
      subtitle: {
        text: null,
        align: "left",
        style: { color: "#6B7280", fontSize: "13px" },
      },
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
      yAxis: {
        title: {
          text: unit,
          style: { fontSize: "12px", fontWeight: "600", color: "#374151" },
        },
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
        headerFormat:
          '<div style="font-size:12px;font-weight:bold;margin-bottom:8px;">{point.key}</div>',
        pointFormat:
          '<div style="display:flex;align-items:center;gap:8px;margin:4px 0;"><span style="color:{series.color}">●</span> <span style="font-weight:500;">{series.name}:</span> <b>{point.y:.2f}</b> ' +
          unit +
          "</div>",
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
  }, [chartSeries, chartType, hcReady, unit]);

  const handleImageDownload = () => {
    if (chartRef.current?.chart) {
      const chart = chartRef.current.chart;
      const previousOptions = {
        chart: {
          width: chart.options.chart?.width ?? null,
          height: chart.options.chart?.height ?? null,
          backgroundColor: chart.options.chart?.backgroundColor ?? "#ffffff",
          spacingTop: chart.options.chart?.spacingTop,
          spacingRight: chart.options.chart?.spacingRight,
          spacingBottom: chart.options.chart?.spacingBottom,
          spacingLeft: chart.options.chart?.spacingLeft,
        },
        title: {
          text: chart.options.title?.text ?? null,
        },
        subtitle: {
          text: chart.options.subtitle?.text ?? null,
        },
      };

      chart.update(
        {
          chart: {
            backgroundColor: "#ffffff",
            width: 1800,
            height: 800,
            spacingTop: 30,
            spacingRight: 24,
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
            itemStyle: { fontSize: "14px", fontWeight: "500", color: "#374151" },
            symbolRadius: 8,
          },
          xAxis: {
            labels: {
              style: { fontSize: "13px", color: "#6B7280" },
            },
          },
          yAxis: {
            title: {
              style: { fontSize: "14px", fontWeight: "600", color: "#374151" },
            },
            labels: {
              style: { fontSize: "13px", color: "#6B7280" },
            },
          },
        },
        false
      );
      chart.redraw();

      const exportMethod = chart.exportChartLocal || chart.exportChart;
      exportMethod.call(chart, {
        type: "image/png",
        filename: imageFilename,
        sourceWidth: 1800,
        sourceHeight: 800,
        scale: 2,
      });

      chart.update(
        {
          chart: previousOptions.chart,
          title: previousOptions.title,
          subtitle: previousOptions.subtitle,
        },
        false
      );
      chart.redraw();
    }
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

  const hasData = series.some((item) => item.data.some((point) => typeof point[1] === "number"));

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-linear-to-br from-[#0a3d3d] to-[#0d5555] rounded-xl flex items-center justify-center shadow-sm shrink-0">
              <span className="text-white text-lg">{icon}</span>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-gray-800">{title}</h2>
              <p className="text-xs text-gray-400">{subtitle}</p>
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

        {hcReady && chartOptions ? (
          <div className="bg-white rounded-xl border border-gray-100 p-2 overflow-hidden">
            <div className="h-105">
              <ChartRenderer
                HC={HC}
                HCReact={HCReact}
                chartOptions={chartOptions}
                chartRef={chartRef}
              />
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-80 gap-2 bg-gray-50 rounded-xl border border-dashed border-gray-200">
            <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-gray-400">Loading chart...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ForecastSummaryChart;
