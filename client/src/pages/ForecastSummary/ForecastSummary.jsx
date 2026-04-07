import { useEffect, useState } from "react";
import { API_ENDPOINTS, getAuthHeaders } from "../../config/api";
import ForecastSummaryChart from "./components/ForecastSummaryChart";

const DAY_OPTIONS = [3, 5, 7, 10];
const SCOPE_OPTIONS = [
  { value: "division", label: "Division" },
  { value: "district", label: "District" },
  { value: "upazila", label: "Upazila" },
];
const DEFAULT_DIVISION = "Dhaka";
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
  const [selectedScope, setSelectedScope] = useState("upazila");
  const [locations, setLocations] = useState({
    divisions: [],
    districts: [],
    upazilas: [],
  });
  const [selectedDivisionCode, setSelectedDivisionCode] = useState("");
  const [selectedDistrictCode, setSelectedDistrictCode] = useState("");
  const [selectedUpazilaCode, setSelectedUpazilaCode] = useState("");
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchLocations = async () => {
    setLoadingLocations(true);

    try {
      const response = await fetch(API_ENDPOINTS.forecastSummaryLocations, {
        headers: getAuthHeaders(),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Failed to load forecast locations");
      }

      const nextLocations = payload.data || {
        divisions: [],
        districts: [],
        upazilas: [],
      };
      setLocations(nextLocations);

      const defaultDivision =
        nextLocations.divisions.find((division) => division.name === DEFAULT_DIVISION) ||
        nextLocations.divisions[0];
      const defaultDistrict =
        nextLocations.districts.find((district) => district.name === DEFAULT_DISTRICT) ||
        nextLocations.districts[0];
      const defaultUpazila =
        nextLocations.upazilas.find((upazila) => upazila.name === DEFAULT_UPAZILA) ||
        nextLocations.upazilas[0];

      setSelectedDivisionCode((currentValue) => currentValue || defaultDivision?.code || "");
      setSelectedDistrictCode((currentValue) => currentValue || defaultDistrict?.code || "");
      setSelectedUpazilaCode((currentValue) => currentValue || defaultUpazila?.code || "");
    } catch (fetchError) {
      console.error("Forecast location load error:", fetchError);
      setError(fetchError.message || "Unable to load forecast locations");
    } finally {
      setLoadingLocations(false);
    }
  };

  const fetchSummary = async (
    days = selectedDays,
    selectionType = selectedScope,
    selectionCode = ""
  ) => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        days: String(days),
        selectionType,
      });

      if (selectionCode) {
        params.append("selectionCode", selectionCode);
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
    fetchLocations();
  }, []);

  const divisionOptions = locations.divisions || [];
  const districtOptions = locations.districts || [];
  const upazilaOptions = locations.upazilas || [];

  const activeDivisionCodeFromDistrict =
    districtOptions.find((district) => district.code === selectedDistrictCode)?.divisionCode || "";

  const filteredUpazilas = upazilaOptions.filter(
    (upazila) => !selectedDistrictCode || upazila.districtCode === selectedDistrictCode
  );

  useEffect(() => {
    if (!divisionOptions.length) {
      setSelectedDivisionCode("");
      return;
    }

    const hasSelectedDivision = divisionOptions.some((division) => division.code === selectedDivisionCode);
    if (!hasSelectedDivision) {
      const defaultDivision =
        divisionOptions.find((division) => division.name === DEFAULT_DIVISION) || divisionOptions[0];
      setSelectedDivisionCode(defaultDivision?.code || "");
    }
  }, [divisionOptions, selectedDivisionCode]);

  useEffect(() => {
    if (!districtOptions.length) {
      setSelectedDistrictCode("");
      return;
    }

    const hasSelectedDistrict = districtOptions.some(
      (district) => district.code === selectedDistrictCode
    );

    if (!hasSelectedDistrict) {
      const defaultDistrict =
        districtOptions.find((district) => district.name === DEFAULT_DISTRICT) ||
        districtOptions[0];
      setSelectedDistrictCode(defaultDistrict?.code || "");
    }
  }, [districtOptions, selectedDistrictCode]);

  useEffect(() => {
    if (!filteredUpazilas.length) {
      setSelectedUpazilaCode("");
      return;
    }

    const hasSelectedUpazila = filteredUpazilas.some(
      (upazila) => upazila.code === selectedUpazilaCode
    );

    if (!hasSelectedUpazila) {
      const defaultUpazila =
        filteredUpazilas.find((upazila) => upazila.name === DEFAULT_UPAZILA) ||
        filteredUpazilas[0];
      setSelectedUpazilaCode(defaultUpazila?.code || "");
    }
  }, [filteredUpazilas, selectedUpazilaCode]);

  useEffect(() => {
    if (selectedScope !== "upazila") {
      return;
    }

    const activeDistrict = districtOptions.find(
      (district) => district.code === selectedDistrictCode
    );

    if (activeDistrict?.divisionCode && activeDistrict.divisionCode !== selectedDivisionCode) {
      setSelectedDivisionCode(activeDistrict.divisionCode);
    }
  }, [districtOptions, selectedDistrictCode, selectedDivisionCode, selectedScope]);

  useEffect(() => {
    let selectionCode = "";

    if (selectedScope === "division") {
      selectionCode = selectedDivisionCode;
    } else if (selectedScope === "district") {
      selectionCode = selectedDistrictCode;
    } else {
      selectionCode = selectedUpazilaCode;
    }

    if (!selectionCode) return;
    fetchSummary(selectedDays, selectedScope, selectionCode);
  }, [
    selectedDays,
    selectedScope,
    selectedDivisionCode,
    selectedDistrictCode,
    selectedUpazilaCode,
  ]);

  const hasRows = Boolean(summaryData?.rows?.length && summaryData?.dates?.length);
  const selectedLabel = summaryData?.meta?.selectedSelection?.label || "Selected Area";

  const temperatureChartData = (() => {
    if (!summaryData?.dates?.length || !summaryData?.rows?.length) return null;

    const maxTempRow = summaryData.rows.find((row) => row.key === "max_temperature");
    const minTempRow = summaryData.rows.find((row) => row.key === "min_temperature");

    if (!maxTempRow || !minTempRow) return null;

    const dates = summaryData.dates.map((date) => ({
      ...date,
      timestamp: Date.UTC(
        Number(date.key.slice(0, 4)),
        Number(date.key.slice(5, 7)) - 1,
        Number(date.key.slice(8, 10))
      ),
    }));

    return {
      dates,
      series: [
        {
          name: "Max Temperature",
          color: "#ef4444",
          data: dates.map((date, index) => [date.timestamp, maxTempRow.values[index]?.value ?? null]),
        },
        {
          name: "Min Temperature",
          color: "#3b82f6",
          data: dates.map((date, index) => [date.timestamp, minTempRow.values[index]?.value ?? null]),
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
            data: dates.map((date, index) => [date.timestamp, row.values[index]?.value ?? null]),
          },
        ],
      };
    }).filter(Boolean);
  })();

  return (
    <div className="min-h-full sm:px-3 sm:py-3 lg:p-6">
      <div className="space-y-3 sm:space-y-4 lg:space-y-5">
        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm sm:rounded-3xl">
          <div className="bg-linear-to-r from-[#0a3d3d] via-[#0d4a4a] to-[#083535] px-3 py-4 text-white sm:px-5 sm:py-6 lg:px-8">
            <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-100/70">
                  WRF Bangladesh
                </p>
                <h1 className="mt-1.5 text-xl font-bold tracking-tight sm:mt-2 sm:text-3xl">
                  Forecast Summary
                </h1>
                <p className="mt-1.5 text-xs leading-5 text-teal-100/80 sm:mt-2 sm:text-base sm:leading-6">
                  View spatially averaged forecast values for a division, district, or upazila.
                </p>
              </div>

              <div className="grid gap-2 sm:gap-3 md:min-w-130 md:grid-cols-6">
                <div
                  className={`rounded-xl bg-white/10 p-1 backdrop-blur-sm sm:rounded-2xl sm:p-1.5 ${
                    selectedScope === "upazila" ? "md:col-span-2" : "md:col-span-3"
                  }`}
                >
                  <label className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-100/70 sm:text-[11px]">
                    Scope
                  </label>
                  <select
                    value={selectedScope}
                    onChange={(event) => setSelectedScope(event.target.value)}
                    disabled={loadingLocations}
                    className="w-full rounded-lg border border-white/10 bg-white px-2.5 py-2 text-sm font-medium text-gray-900 outline-none transition-colors focus:border-teal-300 sm:rounded-xl sm:px-3 sm:py-2.5"
                  >
                    {SCOPE_OPTIONS.map((scopeOption) => (
                      <option key={scopeOption.value} value={scopeOption.value}>
                        {scopeOption.label}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedScope === "division" ? (
                  <div className="rounded-xl bg-white/10 p-1 backdrop-blur-sm sm:rounded-2xl sm:p-1.5 md:col-span-3">
                    <label className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-100/70 sm:text-[11px]">
                      Division
                    </label>
                    <select
                      value={selectedDivisionCode}
                      onChange={(event) => setSelectedDivisionCode(event.target.value)}
                      disabled={loadingLocations || !divisionOptions.length}
                      className="w-full rounded-lg border border-white/10 bg-white px-2.5 py-2 text-sm font-medium text-gray-900 outline-none transition-colors focus:border-teal-300 sm:rounded-xl sm:px-3 sm:py-2.5"
                    >
                      {divisionOptions.map((division) => (
                        <option key={division.code} value={division.code}>
                          {division.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                {selectedScope === "district" ? (
                  <div className="rounded-xl bg-white/10 p-1 backdrop-blur-sm sm:rounded-2xl sm:p-1.5 md:col-span-3">
                    <label className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-100/70 sm:text-[11px]">
                      District
                    </label>
                    <select
                      value={selectedDistrictCode}
                      onChange={(event) => setSelectedDistrictCode(event.target.value)}
                      disabled={loadingLocations || !districtOptions.length}
                      className="w-full rounded-lg border border-white/10 bg-white px-2.5 py-2 text-sm font-medium text-gray-900 outline-none transition-colors focus:border-teal-300 sm:rounded-xl sm:px-3 sm:py-2.5"
                    >
                      {districtOptions.map((district) => (
                        <option key={district.code} value={district.code}>
                          {district.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : null}

                {selectedScope === "upazila" ? (
                  <>
                    <div className="rounded-xl bg-white/10 p-1 backdrop-blur-sm sm:rounded-2xl sm:p-1.5 md:col-span-2">
                      <label className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-100/70 sm:text-[11px]">
                        District
                      </label>
                      <select
                        value={selectedDistrictCode}
                        onChange={(event) => setSelectedDistrictCode(event.target.value)}
                        disabled={loadingLocations || !districtOptions.length}
                        className="w-full rounded-lg border border-white/10 bg-white px-2.5 py-2 text-sm font-medium text-gray-900 outline-none transition-colors focus:border-teal-300 sm:rounded-xl sm:px-3 sm:py-2.5"
                      >
                        {districtOptions.map((district) => (
                          <option key={district.code} value={district.code}>
                            {district.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="rounded-xl bg-white/10 p-1 backdrop-blur-sm sm:rounded-2xl sm:p-1.5 md:col-span-2">
                      <label className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-100/70 sm:text-[11px]">
                        Upazila
                      </label>
                      <select
                        value={selectedUpazilaCode}
                        onChange={(event) => setSelectedUpazilaCode(event.target.value)}
                        disabled={loadingLocations || !filteredUpazilas.length}
                        className="w-full rounded-lg border border-white/10 bg-white px-2.5 py-2 text-sm font-medium text-gray-900 outline-none transition-colors focus:border-teal-300 sm:rounded-xl sm:px-3 sm:py-2.5"
                      >
                        {filteredUpazilas.map((upazila) => (
                          <option key={upazila.code} value={upazila.code}>
                            {upazila.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : null}

                <div className="rounded-xl bg-white/10 p-1 backdrop-blur-sm sm:rounded-2xl md:col-span-6 md:self-center">
                  <div className="grid grid-cols-4 gap-1 md:flex md:flex-wrap md:justify-center">
                    {DAY_OPTIONS.map((dayOption) => (
                      <button
                        key={dayOption}
                        type="button"
                        onClick={() => setSelectedDays(dayOption)}
                        className={`w-full rounded-lg px-2 py-2 text-[11px] font-semibold transition-colors sm:rounded-xl sm:px-4 sm:text-xs md:w-auto ${
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
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white shadow-sm sm:rounded-3xl">
          <div className="border-b border-gray-100 px-3 py-3.5 sm:px-6 sm:py-5">
            <div>
              <h2 className="text-base font-bold text-gray-900 sm:text-lg">Daily Forecast Matrix</h2>
            </div>
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center px-4 py-8 sm:min-h-80 sm:px-6 sm:py-10">
              <div className="text-center">
                <div className="mx-auto h-8 w-8 animate-spin rounded-full border-3 border-teal-500 border-t-transparent sm:h-10 sm:w-10" />
                <p className="mt-3 text-sm font-medium text-gray-500 sm:mt-4">
                  Preparing forecast summary...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="px-3 py-6 sm:px-6 sm:py-12">
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 sm:rounded-2xl sm:px-5 sm:py-4">
                {error}
              </div>
            </div>
          ) : !hasRows ? (
            <div className="px-3 py-6 sm:px-6 sm:py-12">
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-6 text-center sm:rounded-2xl sm:px-5 sm:py-8">
                <p className="text-sm font-semibold text-gray-700 sm:text-base">
                  No forecast summary data is available right now.
                </p>
                <p className="mt-2 text-xs text-gray-500 sm:text-sm">
                  Once rows are imported today for the selected geography, the summary table will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-max overflow-hidden border border-gray-200">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="sticky left-0 z-20 min-w-40 border-b border-r border-gray-200 bg-gray-50 px-2.5 py-3 text-left text-[10px] font-bold uppercase tracking-[0.16em] text-gray-500 sm:min-w-55 sm:px-4 sm:py-4 sm:text-xs sm:tracking-[0.18em]">
                        Parameter
                      </th>
                      {summaryData.dates.map((date) => (
                        <th
                          key={date.key}
                          className="min-w-24 border-b border-gray-200 px-2.5 py-3 text-center sm:min-w-33 sm:px-4 sm:py-4"
                        >
                          <div className="text-[10px] font-bold uppercase tracking-[0.14em] text-teal-700 sm:text-xs sm:tracking-[0.16em]">
                            {date.dayLabel}
                          </div>
                          <div className="mt-1 text-xs font-semibold text-gray-900 sm:text-sm">
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
                        <th className="sticky left-0 z-10 border-r border-t border-gray-200 bg-inherit px-2.5 py-3 text-left sm:px-4 sm:py-4">
                          <div className="text-xs font-semibold text-gray-900 sm:text-sm">{row.label}</div>
                          <div className="mt-1 text-[10px] text-gray-500 sm:text-xs">{row.unit}</div>
                        </th>

                        {row.values.map((value) => (
                          <td
                            key={`${row.key}-${value.date}`}
                            className="border-t border-gray-200 px-2.5 py-3 text-center sm:px-4 sm:py-4"
                          >
                            <div className="text-xs font-semibold text-gray-900 sm:text-sm">
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
            subtitle={`${selectedLabel} | MaxT and MinT`}
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
            subtitle={`${selectedLabel} | ${chart.subtitleSuffix}`}
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
