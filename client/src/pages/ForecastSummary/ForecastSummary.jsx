import { useEffect, useState } from "react";
import { API_ENDPOINTS, getAuthHeaders } from "../../config/api";
import ForecastSummaryChart from "./components/ForecastSummaryChart";

const DAY_OPTIONS = [3, 5, 7, 10];
const DEFAULT_DISTRICT = "Gazipur";
const DEFAULT_UPAZILA = "Gazipur Sadar";
const FORECAST_CHART_CONFIGS = [
  {
    key: "rainfall",
    title: "02. Rainfall Forecast",
    subtitleSuffix: "Rainfall",
    unit: "mm",
    icon: "🌧️",
    color: "#06b6d4",
    chartType: "column",
    fileKey: "rainfall",
  },
  {
    key: "relative_humidity",
    title: "03. Relative Humidity Forecast",
    subtitleSuffix: "Relative Humidity",
    unit: "%",
    icon: "💧",
    color: "#8b5cf6",
    chartType: "areaspline",
    fileKey: "relative_humidity",
  },
  {
    key: "wind_speed",
    title: "04. Wind Speed Forecast",
    subtitleSuffix: "Wind Speed",
    unit: "km/h",
    icon: "💨",
    color: "#10b981",
    chartType: "areaspline",
    fileKey: "wind_speed",
  },
  {
    key: "wind_direction",
    title: "05. Wind Direction Forecast",
    subtitleSuffix: "Wind Direction",
    unit: "°",
    icon: "🧭",
    color: "#f59e0b",
    chartType: "areaspline",
    fileKey: "wind_direction",
  },
  {
    key: "solar_radiation",
    title: "06. Solar Radiation Forecast",
    subtitleSuffix: "Solar Radiation",
    unit: "W/m²",
    icon: "☀️",
    color: "#f97316",
    chartType: "areaspline",
    fileKey: "solar_radiation",
  },
  {
    key: "cloud_cover",
    title: "07. Cloud Cover Forecast",
    subtitleSuffix: "Cloud Cover",
    unit: "%",
    icon: "☁️",
    color: "#6366f1",
    chartType: "areaspline",
    fileKey: "cloud_cover",
  },
  {
    key: "soil_moisture",
    title: "08. Soil Moisture Forecast",
    subtitleSuffix: "Soil Moisture",
    unit: "m³/m³",
    icon: "🌱",
    color: "#84cc16",
    chartType: "areaspline",
    fileKey: "soil_moisture",
  },
  {
    key: "dew_point",
    title: "09. Dew Point Forecast",
    subtitleSuffix: "Dew Point",
    unit: "°C",
    icon: "🌫️",
    color: "#ec4899",
    chartType: "areaspline",
    fileKey: "dew_point",
  },
];

const ForecastSummary = () => {
  const [selectedDays, setSelectedDays] = useState(10);
  const [upazilas, setUpazilas] = useState([]);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedUpazilaCode, setSelectedUpazilaCode] = useState("");
  const [loadingUpazilas, setLoadingUpazilas] = useState(true);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchUpazilas = async () => {
    setLoadingUpazilas(true);

    try {
      const response = await fetch(API_ENDPOINTS.forecastSummaryUpazilas, {
        headers: getAuthHeaders(),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Failed to load upazilas");
      }

      const options = payload.data || [];
      setUpazilas(options);

      if (options.length > 0) {
        const defaultDistrictOption = options.find(
          (upazila) => upazila.district === DEFAULT_DISTRICT
        );

        setSelectedDistrict(
          (currentValue) => currentValue || defaultDistrictOption?.district || options[0].district || ""
        );
      }
    } catch (fetchError) {
      console.error("Upazila load error:", fetchError);
      setError(fetchError.message || "Unable to load upazila options");
    } finally {
      setLoadingUpazilas(false);
    }
  };

  const fetchSummary = async (days = selectedDays, upazilaCode = selectedUpazilaCode) => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        days: String(days),
      });

      if (upazilaCode) {
        params.append("upazilaCode", upazilaCode);
      }

      const response = await fetch(`${API_ENDPOINTS.forecastSummary}?${params.toString()}`, {
        headers: getAuthHeaders(),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Failed to load forecast summary");
      }

      setSummaryData(payload.data);
    } catch (fetchError) {
      console.error("Forecast summary load error:", fetchError);
      setError(fetchError.message || "Unable to load forecast summary");
      setSummaryData(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpazilas();
  }, []);

  const districtOptions = Array.from(
    new Set(upazilas.map((upazila) => upazila.district).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  const filteredUpazilas = upazilas.filter(
    (upazila) => !selectedDistrict || upazila.district === selectedDistrict
  );

  useEffect(() => {
    if (!filteredUpazilas.length) {
      setSelectedUpazilaCode("");
      return;
    }

    const hasSelectedUpazila = filteredUpazilas.some(
      (upazila) => upazila.code === selectedUpazilaCode
    );

    if (!hasSelectedUpazila) {
      const defaultUpazilaOption = filteredUpazilas.find(
        (upazila) => upazila.name === DEFAULT_UPAZILA
      );

      setSelectedUpazilaCode(defaultUpazilaOption?.code || filteredUpazilas[0].code);
    }
  }, [filteredUpazilas, selectedUpazilaCode]);

  useEffect(() => {
    if (!selectedUpazilaCode) return;
    fetchSummary(selectedDays, selectedUpazilaCode);
  }, [selectedDays, selectedUpazilaCode]);

  const hasRows = Boolean(summaryData?.rows?.length && summaryData?.dates?.length);
  const temperatureChartData = (() => {
    if (!summaryData?.dates?.length || !summaryData?.rows?.length) return null;

    const maxTempRow = summaryData.rows.find((row) => row.key === "max_temperature");
    const minTempRow = summaryData.rows.find((row) => row.key === "min_temperature");

    if (!maxTempRow || !minTempRow) return null;

    const dates = summaryData.dates.map((date) => ({
      ...date,
      timestamp: new Date(`${date.key}T00:00:00`).getTime(),
    }));

    return {
      dates,
      series: [
        {
          name: "Max Temperature",
          color: "#ef4444",
          data: dates.map((date, index) => [
            Date.UTC(
              Number(date.key.slice(0, 4)),
              Number(date.key.slice(5, 7)) - 1,
              Number(date.key.slice(8, 10))
            ),
            maxTempRow.values[index]?.value ?? null,
          ]),
        },
        {
          name: "Min Temperature",
          color: "#3b82f6",
          data: dates.map((date, index) => [
            Date.UTC(
              Number(date.key.slice(0, 4)),
              Number(date.key.slice(5, 7)) - 1,
              Number(date.key.slice(8, 10))
            ),
            minTempRow.values[index]?.value ?? null,
          ]),
        },
      ],
    };
  })();

  const otherCharts = (() => {
    if (!summaryData?.dates?.length || !summaryData?.rows?.length) return [];

    const dates = summaryData.dates.map((date) => ({
      ...date,
      timestamp: Date.UTC(
        Number(date.key.slice(0, 4)),
        Number(date.key.slice(5, 7)) - 1,
        Number(date.key.slice(8, 10))
      ),
    }));

    return FORECAST_CHART_CONFIGS.map((config) => {
      const row = summaryData.rows.find((item) => item.key === config.key);
      if (!row) return null;

      return {
        ...config,
        dates,
        series: [
          {
            name: row.label,
            color: config.color,
            type: config.chartType,
            data: dates.map((date, index) => [
              date.timestamp,
              row.values[index]?.value ?? null,
            ]),
          },
        ],
      };
    }).filter(Boolean);
  })();

  return (
    <div className="min-h-full lg:p-6">
      <div className="space-y-5">
        <section className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div className="bg-linear-to-r from-[#0a3d3d] via-[#0d4a4a] to-[#083535] px-5 py-6 text-white sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-100/70">
                  WRF Bangladesh
                </p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
                  Forecast Summary
                </h1>
                <p className="mt-2 text-sm leading-6 text-teal-100/80 sm:text-base">
                  Select an upazila and choose how many upcoming forecast days you want to see.
                </p>
              </div>

              <div className="grid gap-3 md:min-w-130 md:grid-cols-2 md:items-end">
                <div className="rounded-2xl bg-white/10 p-1.5 backdrop-blur-sm">
                  <label className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-100/70">
                    District
                  </label>
                  <select
                    value={selectedDistrict}
                    onChange={(event) => setSelectedDistrict(event.target.value)}
                    disabled={loadingUpazilas || !districtOptions.length}
                    className="w-full rounded-xl border border-white/10 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 outline-none transition-colors focus:border-teal-300"
                  >
                    {districtOptions.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="rounded-2xl bg-white/10 p-1.5 backdrop-blur-sm">
                  <label className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-100/70">
                    Upazila
                  </label>
                  <select
                    value={selectedUpazilaCode}
                    onChange={(event) => setSelectedUpazilaCode(event.target.value)}
                    disabled={loadingUpazilas || !filteredUpazilas.length}
                    className="w-full rounded-xl border border-white/10 bg-white px-3 py-2.5 text-sm font-medium text-gray-900 outline-none transition-colors focus:border-teal-300"
                  >
                    {filteredUpazilas.map((upazila) => (
                      <option key={upazila.code} value={upazila.code}>
                        {upazila.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/*
                <div className="rounded-2xl bg-white/10 p-1 backdrop-blur-sm md:self-center">
                  <div className="grid grid-cols-4 gap-1 md:flex md:flex-wrap md:justify-center">
                    {DAY_OPTIONS.map((dayOption) => (
                      <button
                        key={dayOption}
                        type="button"
                        onClick={() => setSelectedDays(dayOption)}
                        className={`w-full rounded-xl px-3 py-2 text-xs font-semibold transition-colors sm:px-4 md:w-auto ${
                          selectedDays === dayOption
                            ? "bg-white text-[#0a3d3d]"
                            : "text-teal-100 hover:bg-white/10"
                        }`}
                      >
                        {dayOption} Days
                      </button>
                    ))}
                  </div>
                </div>
                */}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 px-5 py-5 sm:px-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Daily Forecast Matrix</h2>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-80 items-center justify-center px-6 py-10">
              <div className="text-center">
                <div className="mx-auto h-10 w-10 animate-spin rounded-full border-3 border-teal-500 border-t-transparent" />
                <p className="mt-4 text-sm font-medium text-gray-500">
                  Preparing forecast summary...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="px-6 py-12">
              <div className="rounded-2xl border border-red-100 bg-red-50 px-5 py-4 text-sm text-red-700">
                {error}
              </div>
            </div>
          ) : !hasRows ? (
            <div className="px-6 py-12">
              <div className="rounded-2xl border border-gray-100 bg-gray-50 px-5 py-8 text-center">
                <p className="text-base font-semibold text-gray-700">
                  No forecast summary data is available right now.
                </p>
                <p className="mt-2 text-sm text-gray-500">
                  Once rows are imported today for the selected upazila, the summary table will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-max overflow-hidden border border-gray-200">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="sticky left-0 z-20 min-w-55 border-b border-r border-gray-200 bg-gray-50 px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
                        Parameter
                      </th>
                      {summaryData.dates.map((date) => (
                        <th
                          key={date.key}
                          className="min-w-33 border-b border-gray-200 px-4 py-4 text-center"
                        >
                          <div className="text-xs font-bold uppercase tracking-[0.16em] text-teal-700">
                            {date.dayLabel}
                          </div>
                          <div className="mt-1 text-sm font-semibold text-gray-900">
                            {date.label}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {summaryData.rows.map((row, rowIndex) => (
                      <tr
                        key={row.key}
                        className={rowIndex % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                      >
                        <th className="sticky left-0 z-10 border-r border-t border-gray-200 bg-inherit px-4 py-4 text-left">
                          <div className="text-sm font-semibold text-gray-900">{row.label}</div>
                          <div className="mt-1 text-xs text-gray-500">{row.unit}</div>
                        </th>

                        {row.values.map((value) => (
                          <td
                            key={`${row.key}-${value.date}`}
                            className="border-t border-gray-200 px-4 py-4 text-center"
                          >
                            <div className="text-sm font-semibold text-gray-900">
                              {value.displayValue}
                            </div>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </section>

        {temperatureChartData ? (
          <ForecastSummaryChart
            title="01. Temperature Forecast"
            subtitle={`${summaryData?.meta?.selectedUpazila?.label || "Selected Upazila"} | MaxT and MinT`}
            unit="°C"
            icon="🌡️"
            dates={temperatureChartData.dates}
            series={temperatureChartData.series}
            csvFilename="forecast_summary_temperature.csv"
            imageFilename="forecast_summary_temperature"
          />
        ) : null}

        {otherCharts.map((chart) => (
          <ForecastSummaryChart
            key={chart.key}
            title={chart.title}
            subtitle={`${summaryData?.meta?.selectedUpazila?.label || "Selected Upazila"} | ${chart.subtitleSuffix}`}
            unit={chart.unit}
            icon={chart.icon}
            dates={chart.dates}
            series={chart.series}
            csvFilename={`forecast_summary_${chart.fileKey}.csv`}
            imageFilename={`forecast_summary_${chart.fileKey}`}
            chartType={chart.chartType}
          />
        ))}
      </div>
    </div>
  );
};

export default ForecastSummary;
