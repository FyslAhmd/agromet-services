const ProjectionFilters = ({
  dataType,
  district,
  timePeriod,
  model,
  scenario,
  threshold,
  averageRange,
  startYear,
  endYear,
  dataTypes,
  timePeriods,
  averageRanges,
  currentThresholds,
  filterOptions,
  onDataTypeChange,
  onTimePeriodChange,
  onDistrictChange,
  onModelChange,
  onScenarioChange,
  onThresholdChange,
  onAverageRangeChange,
  onStartYearChange,
  onEndYearChange,
  onSearch,
  isSearching,
}) => {
  return (
    <div className="border-b border-teal-100 bg-[#0c4a4a] px-2 py-3 sm:px-3 md:px-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 md:grid-cols-3 md:gap-3 lg:grid-cols-10">
        <div className="space-y-1">
          <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-100/70">
            Weather Parameter
          </label>
          <select
            value={dataType}
            onChange={(e) => onDataTypeChange(e.target.value)}
            className="h-10 w-full rounded-xl border border-white/10 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-teal-200"
          >
            {dataTypes.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-100/70">
            Season
          </label>
          <select
            value={timePeriod}
            onChange={(e) => onTimePeriodChange(e.target.value)}
            className="h-10 w-full rounded-xl border border-white/10 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-teal-200"
          >
            <option value="">All Seasons</option>
            {timePeriods.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-100/70">
            District
          </label>
          <select
            value={district}
            onChange={(e) => onDistrictChange(e.target.value)}
            className="h-10 w-full rounded-xl border border-white/10 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-teal-200"
          >
            <option value="">All Districts</option>
            {filterOptions.districts.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-100/70">
            Model
          </label>
          <select
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
            className="h-10 w-full rounded-xl border border-white/10 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-teal-200"
          >
            <option value="">All Models</option>
            {filterOptions.models.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-100/70">
            Scenario
          </label>
          <select
            value={scenario}
            onChange={(e) => onScenarioChange(e.target.value)}
            className="h-10 w-full rounded-xl border border-white/10 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-teal-200"
          >
            <option value="">All Scenarios</option>
            {filterOptions.scenarios.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-100/70">
            Threshold
          </label>
          <select
            value={threshold}
            onChange={(e) => onThresholdChange(e.target.value)}
            className="h-10 w-full rounded-xl border border-white/10 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-teal-200"
          >
            <option value="">No Threshold</option>
            {currentThresholds.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-100/70">
            Average Range
          </label>
          <select
            value={averageRange}
            onChange={(e) => onAverageRangeChange(e.target.value)}
            className="h-10 w-full rounded-xl border border-white/10 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-teal-200"
          >
            {averageRanges.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-100/70">
            Start Year
          </label>
          <select
            value={startYear}
            onChange={(e) => onStartYearChange(e.target.value)}
            className="h-10 w-full rounded-xl border border-white/10 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-teal-200"
          >
            <option value="">Start Year</option>
            {filterOptions.years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-100/70">
            End Year
          </label>
          <select
            value={endYear}
            onChange={(e) => onEndYearChange(e.target.value)}
            className="h-10 w-full rounded-xl border border-white/10 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-teal-200"
          >
            <option value="">End Year</option>
            {filterOptions.years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1">
          <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-100/70">
            Action
          </label>
          <button
            type="button"
            onClick={onSearch}
            disabled={isSearching}
            className="h-10 w-full rounded-xl bg-emerald-500 px-3 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-300"
          >
            {isSearching ? "Searching..." : "Search"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProjectionFilters;
