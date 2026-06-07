const ProjectionFilters = ({
  dataType,
  district,
  timePeriod,
  model,
  scenario,
  threshold,
  dataTypes,
  timePeriods,
  currentThresholds,
  filterOptions,
  onDataTypeChange,
  onTimePeriodChange,
  onDistrictChange,
  onModelChange,
  onScenarioChange,
  onThresholdChange,
}) => {
  return (
    <div className="border-b border-teal-100 bg-[#0c4a4a] px-2 py-3 sm:px-3 md:px-4">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 md:grid-cols-3 md:gap-3 lg:grid-cols-6">
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
      </div>
    </div>
  );
};

export default ProjectionFilters;
