import { useEffect, useMemo, useState } from "react";
import { API_ENDPOINTS, getAuthHeaders } from "../../config/api";
import ForecastSummaryCombinedChart from "../ForecastSummary/components/ForecastSummaryCombinedChart";
import CombinedRealTimeWeatherChart from "./components/CombinedRealTimeWeatherChart";

const DEFAULT_DISTRICT = "Gazipur";
const DAY_OPTIONS = [3, 5, 7, 10];
const DISTRICT_STATION_MAP = {
  habiganj: { stationId: "42", stationLabel: "BRRI R/S Habiganj" },
  faridpur: { stationId: "98", stationLabel: "BRRI R/S Faridpur" },
  gopalganj: { stationId: "122", stationLabel: "BRRI R/S Gopalganj" },
  gopalgonj: { stationId: "122", stationLabel: "BRRI R/S Gopalganj" },
  kushtia: { stationId: "124", stationLabel: "BRRI R/S Kushtia" },
  rajshahi: { stationId: "126", stationLabel: "BRRI R/S Rajshahi" },
  cumilla: { stationId: "137", stationLabel: "BRRI R/S Cumilla" },
  comilla: { stationId: "137", stationLabel: "BRRI R/S Cumilla" },
  rangpur: { stationId: "147", stationLabel: "BRRI R/S Rangpur" },
  sirajganj: { stationId: "310", stationLabel: "BRRI R/S Sirajganj" },
  barishal: { stationId: "352", stationLabel: "BRRI R/S Barishal" },
  barisal: { stationId: "352", stationLabel: "BRRI R/S Barishal" },
  satkhira: { stationId: "375", stationLabel: "BRRI R/S Satkhira" },
  sonagazi: { stationId: "383", stationLabel: "BRRI R/S Sonagazi" },
  feni: { stationId: "383", stationLabel: "BRRI R/S Sonagazi" },
  gazipur: { stationId: "415", stationLabel: "BRRI HQ Gazipur" },
};

const normalizeName = (value = "") =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

const CombinedClimateOverview = () => {
  const [districts, setDistricts] = useState([]);
  const [selectedDistrictCode, setSelectedDistrictCode] = useState("");
  const [selectedDays, setSelectedDays] = useState(10);
  const [summaryData, setSummaryData] = useState(null);
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchLocations = async () => {
      setLoadingLocations(true);

      try {
        const response = await fetch(API_ENDPOINTS.forecastSummaryLocations, {
          headers: getAuthHeaders(),
        });
        const payload = await response.json();

        if (!response.ok || !payload.success) {
          throw new Error(payload.message || "Failed to load districts");
        }

        const districtOptions = payload.data?.districts || [];
        setDistricts(districtOptions);

        const defaultDistrict =
          districtOptions.find((district) => district.name === DEFAULT_DISTRICT) ||
          districtOptions[0];

        setSelectedDistrictCode(defaultDistrict?.code || "");
      } catch (fetchError) {
        console.error("Combined climate location load error:", fetchError);
        setError(fetchError.message || "Unable to load districts");
      } finally {
        setLoadingLocations(false);
      }
    };

    fetchLocations();
  }, []);

  useEffect(() => {
    if (!selectedDistrictCode) {
      setSummaryData(null);
      setLoadingSummary(false);
      return;
    }

    const fetchSummary = async () => {
      setLoadingSummary(true);
      setError("");

      try {
        const params = new URLSearchParams({
          days: String(selectedDays),
          selectionType: "district",
          selectionCode: selectedDistrictCode,
        });

        const response = await fetch(`${API_ENDPOINTS.forecastSummary}?${params.toString()}`, {
          headers: getAuthHeaders(),
        });
        const payload = await response.json();

        if (!response.ok || !payload.success) {
          throw new Error(payload.message || "Failed to load combined climate overview");
        }

        setSummaryData(payload.data);
      } catch (fetchError) {
        console.error("Combined climate summary load error:", fetchError);
        setSummaryData(null);
        setError(fetchError.message || "Unable to load combined climate overview");
      } finally {
        setLoadingSummary(false);
      }
    };

    fetchSummary();
  }, [selectedDays, selectedDistrictCode]);

  const selectedDistrictLabel =
    districts.find((district) => district.code === selectedDistrictCode)?.label ||
    districts.find((district) => district.code === selectedDistrictCode)?.name ||
    "Selected District";

  const realTimeStation = DISTRICT_STATION_MAP[normalizeName(selectedDistrictLabel)] || null;

  const combinedChartData = useMemo(() => {
    if (!summaryData?.dates?.length || !summaryData?.rows?.length) return null;

    const dayTempRow = summaryData.rows.find((row) => row.key === "day_temperature");
    const nightTempRow = summaryData.rows.find((row) => row.key === "night_temperature");
    const dewPointRow = summaryData.rows.find((row) => row.key === "dew_point");
    const humidityRow = summaryData.rows.find((row) => row.key === "relative_humidity");
    const rainfallRow = summaryData.rows.find((row) => row.key === "rainfall");

    if (!dayTempRow || !nightTempRow || !dewPointRow || !humidityRow || !rainfallRow) {
      return null;
    }

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
          key: "day_temperature",
          name: dayTempRow.label || "DayT",
          color: "#f97316",
          type: "spline",
          unit: "°C",
          yAxis: 0,
          data: dates.map((date, index) => [date.timestamp, dayTempRow.values[index]?.value ?? null]),
        },
        {
          key: "night_temperature",
          name: nightTempRow.label || "NightT",
          color: "#6366f1",
          type: "spline",
          unit: "°C",
          yAxis: 0,
          data: dates.map((date, index) => [date.timestamp, nightTempRow.values[index]?.value ?? null]),
        },
        {
          key: "dew_point",
          name: dewPointRow.label || "Dew Point",
          color: "#ec4899",
          type: "spline",
          unit: "°C",
          yAxis: 0,
          data: dates.map((date, index) => [date.timestamp, dewPointRow.values[index]?.value ?? null]),
        },
        {
          key: "relative_humidity",
          name: humidityRow.label || "RH",
          color: "#8b5cf6",
          type: "spline",
          unit: "%",
          yAxis: 1,
          data: dates.map((date, index) => [date.timestamp, humidityRow.values[index]?.value ?? null]),
        },
        {
          key: "rainfall",
          name: rainfallRow.label || "Rainfall",
          color: "#06b6d4",
          type: "column",
          unit: "mm",
          yAxis: 2,
          data: dates.map((date, index) => [date.timestamp, rainfallRow.values[index]?.value ?? null]),
        },
      ],
    };
  }, [summaryData]);

  const daySelector = (
    <div className="inline-grid grid-cols-4 overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm sm:rounded-lg">
      {DAY_OPTIONS.map((day) => (
        <button
          key={day}
          type="button"
          onClick={() => setSelectedDays(day)}
          className={`px-2 py-1 text-[10px] font-semibold transition-colors sm:px-3 sm:py-1.5 sm:text-xs ${
            selectedDays === day
              ? "bg-teal-600 text-white"
              : "text-gray-600 hover:bg-gray-50"
          }`}
        >
          {day}D
        </button>
      ))}
    </div>
  );

  return (
    <div className="w-full min-h-full space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">
            Combined Climate Overview
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            District-wise combined weather overview from the local forecast summary
          </p>
        </div>

        <div className="w-full sm:w-72">
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
            District
          </label>
          <select
            value={selectedDistrictCode}
            onChange={(event) => setSelectedDistrictCode(event.target.value)}
            disabled={loadingLocations || !districts.length}
            className="w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 disabled:cursor-not-allowed disabled:bg-gray-100"
          >
            {districts.map((district) => (
              <option key={district.code} value={district.code}>
                {district.label || district.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {loadingLocations || loadingSummary ? (
        <div className="rounded-2xl border border-gray-100 bg-white px-6 py-12 text-center shadow-sm">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-[3px] border-teal-200 border-t-teal-600" />
          <p className="text-sm font-semibold text-gray-700">Loading combined climate overview…</p>
          <p className="mt-1 text-xs text-gray-400">Preparing district forecast chart</p>
        </div>
      ) : combinedChartData ? (
        <div className="space-y-5">
          <ForecastSummaryCombinedChart
            title="Combined Weather Forecast Overview"
            subtitle={`${selectedDistrictLabel} | DayT, NightT, Dew Point, RH and Rainfall`}
            icon="🌦️"
            dates={combinedChartData.dates}
            series={combinedChartData.series}
            csvFilename="combined_climate_overview.csv"
            imageFilename="combined_climate_overview"
            headerActions={daySelector}
          />

          {realTimeStation ? (
            <CombinedRealTimeWeatherChart
              stationId={realTimeStation.stationId}
              districtLabel={selectedDistrictLabel}
            />
          ) : null}
        </div>
      ) : (
        <div className="rounded-2xl border border-gray-100 bg-white px-6 py-12 text-center shadow-sm">
          <p className="text-sm font-semibold text-gray-700">
            No combined climate overview data is available right now.
          </p>
          <p className="mt-2 text-xs text-gray-400">
            Once forecast summary rows are available for the selected district, the combined chart will appear here.
          </p>
        </div>
      )}
    </div>
  );
};

export default CombinedClimateOverview;
