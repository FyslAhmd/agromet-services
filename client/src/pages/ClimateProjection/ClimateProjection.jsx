import { useState, useEffect } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { API_ENDPOINTS, apiFetch } from "../../config/api";

// Fix Leaflet marker icons not appearing out of the box in React
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow
});
L.Marker.prototype.options.icon = DefaultIcon;

const DEFAULT_MAP_CENTER = [23.8, 90.3];
const DEFAULT_MAP_ZOOM = 7.2;

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

  const [filterOptions, setFilterOptions] = useState({
    districts: [],
    models: [],
    scenarios: []
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
          scenarios: response.scenarios || []
        });
        setDistrict("");
        setModel("");
        setScenario("");
        setThreshold("");
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
      <div className="border-b border-teal-100 bg-[#0c4a4a] px-2 py-3 sm:px-3 md:px-4">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-2 md:grid-cols-3 md:gap-3 lg:grid-cols-6">
          <div className="space-y-1">
            <label className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-teal-100/70">
              Weather Parameter
            </label>
            <select
              value={dataType}
              onChange={(e) => setDataType(e.target.value)}
              className="h-10 w-full rounded-xl border border-white/10 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-teal-200"
            >
              {DATA_TYPES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
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
              onChange={(e) => setTimePeriod(e.target.value)}
              className="h-10 w-full rounded-xl border border-white/10 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-teal-200"
            >
              <option value="">All Seasons</option>
              {TIME_PERIODS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
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
              onChange={(e) => setDistrict(e.target.value)}
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
              onChange={(e) => setModel(e.target.value)}
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
              onChange={(e) => setScenario(e.target.value)}
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
              onChange={(e) => setThreshold(e.target.value)}
              className="h-10 w-full rounded-xl border border-white/10 bg-white px-3 text-sm font-medium text-slate-800 outline-none transition focus:border-teal-200"
            >
              <option value="">No Threshold</option>
              {currentThresholds.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="relative flex-1 bg-[#edf5f4]">
        <div className="absolute inset-0">
          <MapContainer
            center={DEFAULT_MAP_CENTER}
            zoom={DEFAULT_MAP_ZOOM}
            zoomControl={false}
            className="h-full w-full"
            style={{ background: "#f8f9fa" }}
          >
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              opacity={0.6}
            />
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default ClimateProjection;
