import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import { API_ENDPOINTS, getAuthHeaders } from "../../config/api";
import { useAuthContext } from "../../components/context/AuthProvider";

const DEFAULT_STATION_ID = "415";
const PARAMETER_ORDER = [
  "Max Temperature",
  "Min Temperature",
  "Average Temperature",
  "Rainfall",
  "Relative Humidity",
  "Wind Speed",
  "Wind Direction",
  "Solar Radiation",
  "Sunshine Hour",
];

const formatDate = (value) => {
  if (!value) return "-";
  return new Date(`${value}T12:00:00`).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatNumber = (value, unit = "") => {
  if (value === null || value === undefined || value === "") return "-";
  const numericValue = Number(value);
  if (Number.isNaN(numericValue)) return "-";
  return `${numericValue.toFixed(2)}${unit ? ` ${unit}` : ""}`;
};

const getStatusClass = (status) => {
  if (status === "completed") return "bg-emerald-50 text-emerald-700 border-emerald-100";
  if (status === "failed") return "bg-red-50 text-red-700 border-red-100";
  return "bg-amber-50 text-amber-700 border-amber-100";
};

const ForecastValidation = () => {
  const { authUser } = useAuthContext();
  const [stations, setStations] = useState([]);
  const [runs, setRuns] = useState([]);
  const [selectedStationId, setSelectedStationId] = useState(DEFAULT_STATION_ID);
  const [selectedRunId, setSelectedRunId] = useState("");
  const [selectedRun, setSelectedRun] = useState(null);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");

  const fetchValidationData = useCallback(async ({ stationId = DEFAULT_STATION_ID, runId = "" } = {}) => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (stationId) params.append("stationId", stationId);
      if (runId) params.append("runId", runId);

      const response = await fetch(`${API_ENDPOINTS.forecastValidation}?${params.toString()}`, {
        headers: getAuthHeaders(),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Failed to fetch forecast validation data");
      }

      const nextData = payload.data || {};
      setStations(nextData.stations || []);
      setRuns(nextData.runs || []);
      setSelectedRun(nextData.selectedRun || null);
      setRecords(nextData.records || []);
      setSelectedStationId(nextData.selectedStationId || stationId || DEFAULT_STATION_ID);

      if (!runId && nextData.selectedRun?.id) {
        setSelectedRunId(String(nextData.selectedRun.id));
      }
    } catch (fetchError) {
      console.error("Forecast validation load error:", fetchError);
      setError(fetchError.message || "Unable to load forecast validation data");
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchValidationData({ stationId: DEFAULT_STATION_ID, runId: "" });
  }, [fetchValidationData]);

  const selectedStation = useMemo(
    () => stations.find((station) => station.stationId === selectedStationId),
    [stations, selectedStationId]
  );

  const sortedRecords = useMemo(
    () =>
      [...records].sort((a, b) => {
        if (a.date !== b.date) return a.date.localeCompare(b.date);
        return PARAMETER_ORDER.indexOf(a.parameter) - PARAMETER_ORDER.indexOf(b.parameter);
      }),
    [records]
  );

  const handleStationChange = (event) => {
    const stationId = event.target.value;
    setSelectedStationId(stationId);
    fetchValidationData({ stationId, runId: selectedRunId });
  };

  const handleRunChange = (event) => {
    const runId = event.target.value;
    setSelectedRunId(runId);
    fetchValidationData({ stationId: selectedStationId, runId });
  };

  const handleManualRun = async () => {
    setRunning(true);
    try {
      const response = await fetch(API_ENDPOINTS.forecastValidationRun, {
        method: "POST",
        headers: getAuthHeaders(),
        body: JSON.stringify({}),
      });
      const payload = await response.json();

      if (!response.ok || !payload.success) {
        throw new Error(payload.message || "Failed to run forecast validation");
      }

      toast.success("Forecast validation run completed");
      setSelectedRunId(String(payload.data?.id || ""));
      await fetchValidationData({
        stationId: selectedStationId,
        runId: payload.data?.id ? String(payload.data.id) : "",
      });
    } catch (runError) {
      console.error("Forecast validation run error:", runError);
      toast.error(runError.message || "Forecast validation run failed");
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="min-h-full sm:px-3 sm:py-3 lg:p-6">
      <div className="space-y-4">
        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm sm:rounded-3xl">
          <div className="bg-linear-to-r from-[#0a3d3d] via-[#0d4a4a] to-[#083535] px-4 py-5 text-white sm:px-6 lg:px-8">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-100/70">
                  Forecast vs observed AWS
                </p>
                <h1 className="mt-1.5 text-2xl font-bold tracking-tight sm:text-3xl">
                  Forecast Validation
                </h1>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-teal-100/80">
                  Compare stored 10-day forecast windows with observed BRRI weather station data.
                </p>
              </div>

              {authUser?.role === "admin" ? (
                <button
                  type="button"
                  onClick={handleManualRun}
                  disabled={running}
                  className="inline-flex items-center justify-center rounded-xl bg-white px-4 py-2 text-sm font-semibold text-[#0a3d3d] shadow-sm transition-colors hover:bg-teal-50 disabled:cursor-not-allowed disabled:bg-white/60"
                >
                  {running ? "Running..." : "Run Validation"}
                </button>
              ) : null}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm sm:rounded-3xl sm:p-5">
          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                Station / District
              </label>
              <select
                value={selectedStationId}
                onChange={handleStationChange}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-800 outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
              >
                {stations.map((station) => (
                  <option key={station.stationId} value={station.stationId}>
                    {station.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                Validation Run
              </label>
              <select
                value={selectedRunId}
                onChange={handleRunChange}
                disabled={!runs.length}
                className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-800 outline-none transition-colors focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 disabled:bg-gray-50"
              >
                {!runs.length ? <option value="">No runs available</option> : null}
                {runs.map((run) => (
                  <option key={run.id} value={run.id}>
                    {formatDate(run.run_date)} ({run.status})
                  </option>
                ))}
              </select>
            </div>

            <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">
                Selected Area
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {selectedStation?.stationName || "BRRI HQ Gazipur"}
              </p>
            </div>
          </div>
        </section>

        {selectedRun ? (
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Window</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {formatDate(selectedRun.window_start_date)} - {formatDate(selectedRun.window_end_date)}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Forecast Import</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {formatDate(selectedRun.forecast_created_at_date)}
              </p>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Status</p>
              <span className={`mt-1 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${getStatusClass(selectedRun.status)}`}>
                {selectedRun.status}
              </span>
            </div>
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500">Records</p>
              <p className="mt-1 text-sm font-semibold text-gray-900">{sortedRecords.length}</p>
            </div>
          </section>
        ) : null}

        <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm sm:rounded-3xl">
          <div className="border-b border-gray-100 px-4 py-4 sm:px-6">
            <h2 className="text-base font-bold text-gray-900 sm:text-lg">Validation Table</h2>
          </div>

          {loading ? (
            <div className="flex min-h-64 items-center justify-center px-4 py-10">
              <div className="text-center">
                <div className="mx-auto h-9 w-9 animate-spin rounded-full border-3 border-teal-500 border-t-transparent" />
                <p className="mt-3 text-sm font-medium text-gray-500">Loading validation data...</p>
              </div>
            </div>
          ) : error ? (
            <div className="p-4 sm:p-6">
              <div className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            </div>
          ) : !sortedRecords.length ? (
            <div className="p-4 sm:p-6">
              <div className="rounded-xl border border-gray-100 bg-gray-50 px-4 py-8 text-center">
                <p className="text-sm font-semibold text-gray-700">No validation data is available yet.</p>
                <p className="mt-2 text-xs text-gray-500">
                  A scheduled or manual run will populate this table.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-230 border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-50 text-left">
                    <th className="border-b border-gray-200 px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-gray-500">Date</th>
                    <th className="border-b border-gray-200 px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-gray-500">Parameter</th>
                    <th className="border-b border-gray-200 px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-gray-500">Forecast</th>
                    <th className="border-b border-gray-200 px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-gray-500">Observed</th>
                    <th className="border-b border-gray-200 px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-gray-500">Difference</th>
                    <th className="border-b border-gray-200 px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-gray-500">Absolute Error</th>
                    <th className="border-b border-gray-200 px-4 py-3 text-xs font-bold uppercase tracking-[0.12em] text-gray-500">Percent Error</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedRecords.map((record, index) => (
                    <tr key={record.id} className={index % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                      <td className="border-t border-gray-100 px-4 py-3 font-medium text-gray-800">
                        {formatDate(record.date)}
                      </td>
                      <td className="border-t border-gray-100 px-4 py-3 text-gray-700">{record.parameter}</td>
                      <td className="border-t border-gray-100 px-4 py-3 text-gray-900">
                        {formatNumber(record.forecast_value, record.unit)}
                      </td>
                      <td className="border-t border-gray-100 px-4 py-3 text-gray-900">
                        {formatNumber(record.observed_value, record.unit)}
                      </td>
                      <td className="border-t border-gray-100 px-4 py-3 text-gray-700">
                        {formatNumber(record.difference, record.unit)}
                      </td>
                      <td className="border-t border-gray-100 px-4 py-3 text-gray-700">
                        {formatNumber(record.absolute_error, record.unit)}
                      </td>
                      <td className="border-t border-gray-100 px-4 py-3 text-gray-700">
                        {formatNumber(record.percent_error, "%")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default ForecastValidation;
