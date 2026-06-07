import { useState, useEffect } from "react";
import { API_ENDPOINTS, apiFetch } from "../../config/api";
import ProjectionFilters from "./components/ProjectionFilters";
import ProjectionMap from "./components/ProjectionMap";

const DATA_TYPES = [
  { value: "minimum-temperature", label: "Minimum Temp" },
  { value: "maximum-temperature", label: "Maximum Temp" },
  { value: "precipitation", label: "Precipitation" },
  { value: "relative-humidity", label: "RH" },
];

const TIME_PERIODS = [
  { value: "aus", label: "Aus (March to June)", months: [3, 4, 5, 6] },
  { value: "aman", label: "Aman (June to November)", months: [6, 7, 8, 9, 10, 11] },
  { value: "boro", label: "Boro (December to May)", months: [12, 1, 2, 3, 4, 5] },
];

const AVERAGE_RANGES = [
  { value: "1Y", label: "1Y" },
  { value: "5Y", label: "5Y" },
  { value: "10Y", label: "10Y" },
  { value: "15Y", label: "15Y" },
  { value: "20Y", label: "20Y" },
];

const THRESHOLDS = {
  "minimum-temperature": [
    { value: "<=6", label: "Min <= 6°C" },
    { value: "<=10", label: "Min <= 10°C" },
    { value: "<=20", label: "Min <= 20°C" },
  ],
  "maximum-temperature": [
    { value: ">=30", label: "Max >= 30°C" },
    { value: ">=35", label: "Max >= 35°C" },
    { value: ">=38", label: "Max >= 38°C" },
    { value: ">=40", label: "Max >= 40°C" },
    { value: ">=42", label: "Max >= 42°C" },
  ],
  "precipitation": [
    { value: ">=5", label: "Preci >= 5 mm" },
    { value: ">=8", label: "Preci >= 8 mm" },
    { value: ">=10", label: "Preci >= 10 mm" },
  ],
  "relative-humidity": [
    { value: ">=50", label: "RH >= 50%" },
    { value: ">=60", label: "RH >= 60%" },
    { value: ">=70", label: "RH >= 70%" },
    { value: ">=80", label: "RH >= 80%" },
  ],
};

const ClimateProjection = () => {
  const [dataType, setDataType] = useState("maximum-temperature");
  const [district, setDistrict] = useState("");
  const [timePeriod, setTimePeriod] = useState("");
  const [model, setModel] = useState("");
  const [scenario, setScenario] = useState("");
  const [threshold, setThreshold] = useState("");
  const [averageRange, setAverageRange] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");

  const [filterOptions, setFilterOptions] = useState({
    districts: [],
    models: [],
    scenarios: [],
    years: [],
    startYear: null,
    endYear: null,
  });

  useEffect(() => {
    let cancelled = false;

    const loadFilterOptions = async () => {
      try {
        const response = await apiFetch(`${API_ENDPOINTS.projectionsFilters}?dataType=${dataType}`);
        if (cancelled) return;

        setFilterOptions({
          districts: response.districts || [],
          models: response.models || [],
          scenarios: response.scenarios || [],
          years: response.years || [],
          startYear: response.startYear || null,
          endYear: response.endYear || null,
        });
        setDistrict("");
        setModel("");
        setScenario("");
        setThreshold("");
        setAverageRange("");
        setStartYear(response.startYear ? String(response.startYear) : "");
        setEndYear(response.endYear ? String(response.endYear) : "");
      } catch (error) {
        if (!cancelled) {
          console.error("Error fetching filter options:", error);
        }
      }
    };

    loadFilterOptions();

    return () => {
      cancelled = true;
    };
  }, [dataType]);

  const currentThresholds = THRESHOLDS[dataType] || [];

  return (
    <div className="flex h-[calc(100vh-5.5rem)] min-h-170 flex-col overflow-hidden rounded-2xl border border-teal-100 bg-white shadow-[0_24px_80px_rgba(8,53,53,0.12)]">
      <ProjectionFilters
        dataType={dataType}
        district={district}
        timePeriod={timePeriod}
        model={model}
        scenario={scenario}
        threshold={threshold}
        averageRange={averageRange}
        startYear={startYear}
        endYear={endYear}
        dataTypes={DATA_TYPES}
        timePeriods={TIME_PERIODS}
        averageRanges={AVERAGE_RANGES}
        currentThresholds={currentThresholds}
        filterOptions={filterOptions}
        onDataTypeChange={setDataType}
        onTimePeriodChange={setTimePeriod}
        onDistrictChange={setDistrict}
        onModelChange={setModel}
        onScenarioChange={setScenario}
        onThresholdChange={setThreshold}
        onAverageRangeChange={setAverageRange}
        onStartYearChange={setStartYear}
        onEndYearChange={setEndYear}
      />
      <ProjectionMap district={district} onDistrictChange={setDistrict} />
    </div>
  );
};

export default ClimateProjection;
