import { useEffect, useMemo, useState } from "react";
import { API_ENDPOINTS, getAuthHeaders } from "../../config/api";

const DAY_OPTIONS = [5, 7, 10, 14];

const ForecastSummary = () => {
  const [selectedDays, setSelectedDays] = useState(7);
  const [summaryData, setSummaryData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchSummary = async (days = selectedDays) => {
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_ENDPOINTS.forecastSummary}?days=${days}`, {
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
    fetchSummary(selectedDays);
  }, [selectedDays]);

  const metaCards = useMemo(() => {
    if (!summaryData?.meta) return [];

    const latestForecastText = summaryData.meta.latestForecastTime
      ? new Date(summaryData.meta.latestForecastTime).toLocaleString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Not available";

    return [
      {
        label: "Forecast Days",
        value: summaryData.meta.availableDays || 0,
      },
      {
        label: "Latest Batch",
        value: summaryData.meta.batchLabel || "Latest available",
      },
      {
        label: "Latest Forecast Time",
        value: latestForecastText,
      },
      {
        label: "Derived Sunshine Step",
        value: `${summaryData.meta.inferredTimeStepHours || 1} hr`,
      },
    ];
  }, [summaryData]);

  const hasRows = Boolean(summaryData?.rows?.length && summaryData?.dates?.length);

  return (
    <div className="min-h-full lg:p-6">
      <div className="space-y-5">
        <section className="overflow-hidden rounded-3xl bg-linear-to-br from-[#0a3d3d] via-[#0d4a4a] to-[#083535] text-white shadow-sm">
          <div className="px-5 py-6 sm:px-6 sm:py-7 lg:px-8">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold tracking-wide text-teal-100">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  WRF Bangladesh Forecast Summary
                </div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Forecast Summary
                </h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-teal-100/80 sm:text-base">
                  A clean daily snapshot of the latest imported WRF forecast, arranged as a
                  summary table with dates across the top and forecast parameters down the side.
                </p>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="inline-flex rounded-2xl border border-white/10 bg-white/8 p-1 backdrop-blur-sm">
                  {DAY_OPTIONS.map((dayOption) => (
                    <button
                      key={dayOption}
                      type="button"
                      onClick={() => setSelectedDays(dayOption)}
                      className={`rounded-xl px-3 py-2 text-xs font-semibold transition-colors sm:px-4 ${
                        selectedDays === dayOption
                          ? "bg-white text-[#0a3d3d]"
                          : "text-teal-100 hover:bg-white/10"
                      }`}
                    >
                      {dayOption} Days
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => fetchSummary(selectedDays)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/15"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.023 9.348h4.992v-.001M2.985 19.644v-.001h4.992m0 0a8.25 8.25 0 0013.803-3.7M4.977 19.644a8.25 8.25 0 013.7-13.803m0 0V.849m0 4.992h4.992"
                    />
                  </svg>
                  Refresh
                </button>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              {metaCards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl border border-white/10 bg-white/8 p-4 backdrop-blur-sm"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-100/60">
                    {card.label}
                  </p>
                  <p className="mt-2 text-sm font-semibold leading-6 text-white sm:text-base">
                    {card.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="rounded-3xl border border-gray-100 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-gray-100 px-5 py-5 sm:px-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Daily Forecast Matrix</h2>
              <p className="mt-1 text-sm text-gray-500">
                The first column stays fixed while forecast dates scroll horizontally.
              </p>
            </div>
            {summaryData?.meta?.notes?.length ? (
              <div className="max-w-xl rounded-2xl bg-teal-50 px-4 py-3 text-xs leading-5 text-teal-800">
                {summaryData.meta.notes.map((note) => (
                  <p key={note}>{note}</p>
                ))}
              </div>
            ) : null}
          </div>

          {loading ? (
            <div className="flex min-h-[320px] items-center justify-center px-6 py-10">
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
                  Once the latest WRF forecast batch is present, the summary table will appear here.
                </p>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto px-4 py-4 sm:px-6">
              <div className="min-w-max overflow-hidden rounded-2xl border border-gray-200">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-50">
                      <th className="sticky left-0 z-20 min-w-[220px] border-b border-r border-gray-200 bg-gray-50 px-4 py-4 text-left text-xs font-bold uppercase tracking-[0.18em] text-gray-500">
                        Parameter
                      </th>
                      {summaryData.dates.map((date) => (
                        <th
                          key={date.key}
                          className="min-w-[132px] border-b border-gray-200 px-4 py-4 text-center"
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
      </div>
    </div>
  );
};

export default ForecastSummary;
