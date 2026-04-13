import { useEffect, useMemo, useState } from "react";
import { GeoJSON, MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./WeatherAlert.css";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  CloudRain,
  Flame,
  Snowflake,
  Thermometer,
  Waves,
  Wind,
} from "lucide-react";
import { API_ENDPOINTS, getAuthHeaders } from "../../config/api";

const DEFAULT_MAP_CENTER = [23.8, 90.3];
const DEFAULT_LEVEL = "district";

const LEVEL_OPTIONS = [
  { value: "region", label: "Region" },
  { value: "division", label: "Division" },
  { value: "district", label: "District" },
  { value: "upazila", label: "Upazila" },
];

const REGION_DEFINITIONS = [
  { name: "Dhaka", districts: ["Dhaka", "Gazipur", "Munshiganj", "Manikganj", "Narayanganj", "Narsingdi", "Tangail", "Kishoreganj"] },
  { name: "Mymensingh", districts: ["Mymensingh", "Sherpur", "Jamalpur", "Netrakona"] },
  { name: "Comilla", districts: ["Comilla", "Chandpur", "Brahamanbaria"] },
  { name: "Chittagong", districts: ["Chittagong", "Feni", "Noakhali", "Lakshmipur", "Cox's Bazar"] },
  { name: "Rangamati", districts: ["Rangamati", "Bandarban", "Khagrachhari"] },
  { name: "Sylhet", districts: ["Sylhet", "Maulvibazar", "Habiganj", "Sunamganj"] },
  { name: "Rajshahi", districts: ["Rajshahi", "Natore", "Naogaon"] },
  { name: "Bogra", districts: ["Bogra", "Pabna", "Sirajganj", "Joypurhat"] },
  { name: "Rangpur", districts: ["Rangpur", "Lalmonirhat", "Nilphamari", "Gaibandha", "Kurigram"] },
  { name: "Dinajpur", districts: ["Dinajpur", "Thakurgaon", "Panchagarh"] },
  { name: "Khulna", districts: ["Khulna", "Satkhira", "Narail", "Bagerhat"] },
  { name: "Jessore", districts: ["Jessore", "Chuadanga", "Kushtia", "Magura", "Jhenaidah", "Meherpur"] },
  { name: "Barisal", districts: ["Barisal", "Jhalokati", "Patuakhali", "Pirojpur", "Bhola", "Barguna"] },
  { name: "Faridpur", districts: ["Faridpur", "Madaripur", "Rajbari", "Gopalganj", "Shariatpur"] },
];

const DISTRICT_NAME_ALIASES = {
  brahamanbaria: "brahmanbaria",
  brahmanbaria: "brahamanbaria",
};

const ALERT_TYPES = [
  { id: "rainfall", label: "Heavy Rainfall", unit: "mm", icon: CloudRain, disabled: false },
  { id: "heat", label: "Heat", unit: "°C", icon: Thermometer, disabled: false },
  { id: "cold", label: "Cold", unit: "°C", icon: Snowflake, disabled: false },
  { id: "wind", label: "Wind", unit: "km/h", icon: Wind, disabled: false },
  { id: "flood", label: "Flood", unit: "wl", icon: Waves, disabled: true },
];

const ALERT_THRESHOLDS = {
  rainfall: [
    { level: "no-alert", color: "#84cc16", label: "No Alert", icon: CheckCircle, alert: 1, range: "0 - 22" },
    { level: "moderate", color: "#eab308", label: "Moderate", icon: AlertTriangle, alert: 2, range: "22 - 43" },
    { level: "heavy", color: "#f97316", label: "Heavy", icon: AlertCircle, alert: 3, range: "43 - 88" },
    { level: "extreme", color: "#dc2626", label: "Extreme", icon: Flame, alert: 4, range: "88+" },
  ],
  heat: [
    { level: "no-alert", color: "#16a34a", label: "No Alert", icon: CheckCircle, alert: 1, range: "< 36" },
    { level: "mild", color: "#84cc16", label: "Mild", icon: CheckCircle, alert: 2, range: "36 - 38" },
    { level: "moderate", color: "#eab308", label: "Moderate", icon: AlertTriangle, alert: 3, range: "38 - 40" },
    { level: "severe", color: "#f97316", label: "Severe", icon: AlertCircle, alert: 4, range: "40 - 42" },
    { level: "very-severe", color: "#dc2626", label: "Very Severe", icon: Flame, alert: 5, range: "42+" },
  ],
  cold: [
    { level: "no-alert", color: "#16a34a", label: "No Alert", icon: CheckCircle, alert: 1, range: "> 10" },
    { level: "mild", color: "#84cc16", label: "Mild", icon: CheckCircle, alert: 2, range: "8 - 10" },
    { level: "moderate", color: "#eab308", label: "Moderate", icon: AlertTriangle, alert: 3, range: "6 - 8" },
    { level: "severe", color: "#f97316", label: "Severe", icon: AlertCircle, alert: 4, range: "4 - 6" },
    { level: "very-severe", color: "#dc2626", label: "Very Severe", icon: Flame, alert: 5, range: "< 4" },
  ],
  wind: [
    { level: "no-alert", color: "#84cc16", label: "No Alert", icon: CheckCircle, alert: 1, range: "< 40" },
    { level: "moderate", color: "#eab308", label: "Moderate", icon: AlertTriangle, alert: 2, range: "40 - 60" },
    { level: "severe", color: "#f97316", label: "Severe", icon: AlertCircle, alert: 3, range: "60 - 80" },
    { level: "extreme", color: "#dc2626", label: "Extreme", icon: Flame, alert: 4, range: "80+" },
  ],
  flood: [],
};

const normalizeName = (value = "") =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

const toRegionCode = (name) =>
  `region-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}`;

const geometryToMultiPolygonCoordinates = (geometry) => {
  if (!geometry?.type || !geometry?.coordinates) return [];
  if (geometry.type === "Polygon") return [geometry.coordinates];
  if (geometry.type === "MultiPolygon") return geometry.coordinates;
  return [];
};

const createMergedFeature = (features, properties) => ({
  type: "Feature",
  properties,
  geometry: {
    type: "MultiPolygon",
    coordinates: features.flatMap((feature) =>
      geometryToMultiPolygonCoordinates(feature.geometry)
    ),
  },
});

const formatAlertValue = (value) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue.toFixed(1) : "—";
};

const getResponsiveAlertMapZoom = () => {
  if (typeof window === "undefined") return 7.2;
  return window.innerWidth >= 1024 ? 7.2 : 6;
};

const getResponsiveAlertMapHeight = () => {
  if (typeof window === "undefined") return "620px";
  if (window.innerWidth >= 1024) return "calc(100vh - 220px)";
  if (window.innerWidth >= 768) return "520px";
  return "400px";
};

const getDhakaToday = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
  }).format(new Date());

const getDhakaRelativeDate = (dateString, offsetDays) => {
  const baseDate = new Date(`${dateString}T12:00:00+06:00`);
  baseDate.setUTCDate(baseDate.getUTCDate() + offsetDays);

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
  }).format(baseDate);
};

const TODAY = getDhakaToday();
const MAX_DATE = getDhakaRelativeDate(TODAY, 9);

const WeatherAlert = () => {
  const [selectedLevel, setSelectedLevel] = useState(DEFAULT_LEVEL);
  const [selectedAlert, setSelectedAlert] = useState("rainfall");
  const [startDate, setStartDate] = useState(TODAY);
  const [endDate, setEndDate] = useState(TODAY);
  const [mapZoom, setMapZoom] = useState(getResponsiveAlertMapZoom);
  const [mapHeight, setMapHeight] = useState(getResponsiveAlertMapHeight);
  const [baseGeoJSON, setBaseGeoJSON] = useState(null);
  const [alertRows, setAlertRows] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSummaryLevel, setSelectedSummaryLevel] = useState(null);

  useEffect(() => {
    fetch("/amd3.json")
      .then((response) => response.json())
      .then((data) => setBaseGeoJSON(data))
      .catch((error) => console.error("Error loading amd3:", error));
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setMapZoom(getResponsiveAlertMapZoom());
      setMapHeight(getResponsiveAlertMapHeight());
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (selectedAlert === "flood") return;

    const fetchAlerts = async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({
          level: selectedLevel,
          alertType: selectedAlert,
          startDate,
          endDate,
        });

        const response = await fetch(`${API_ENDPOINTS.weatherAlert}?${params.toString()}`, {
          headers: getAuthHeaders(),
        });
        const payload = await response.json();

        if (!response.ok || !payload.success) {
          throw new Error(payload.message || "Failed to load local weather alerts");
        }

        setAlertRows(Array.isArray(payload.data) ? payload.data : []);
      } catch (error) {
        console.error("Error loading local weather alerts:", error);
        setAlertRows([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlerts();
  }, [endDate, selectedAlert, selectedLevel, startDate]);

  const mapFeatures = useMemo(() => {
    if (!baseGeoJSON?.features?.length) return [];

    const upazilaFeatures = baseGeoJSON.features
      .map((feature) => ({
        ...feature,
        properties: {
          ...feature.properties,
          code: feature.properties.ADM3_PCODE,
          name: feature.properties.ADM3_EN,
          label: feature.properties.ADM3_EN,
          level: "upazila",
          district: feature.properties.ADM2_EN,
          districtCode: feature.properties.ADM2_PCODE,
          division: feature.properties.ADM1_EN,
          divisionCode: feature.properties.ADM1_PCODE,
        },
      }))
      .filter((feature) => feature.properties.code);

    if (selectedLevel === "upazila") {
      return upazilaFeatures.sort((a, b) =>
        (a.properties.label || "").localeCompare(b.properties.label || "")
      );
    }

    if (selectedLevel === "district") {
      const districtMap = new Map();

      upazilaFeatures.forEach((feature) => {
        const districtCode = feature.properties.districtCode;
        if (!districtCode) return;
        if (!districtMap.has(districtCode)) {
          districtMap.set(districtCode, []);
        }
        districtMap.get(districtCode).push(feature);
      });

      return Array.from(districtMap.values())
        .map((features) =>
          createMergedFeature(features, {
            code: features[0].properties.districtCode,
            name: features[0].properties.district,
            label: features[0].properties.district,
            level: "district",
            division: features[0].properties.division,
            divisionCode: features[0].properties.divisionCode,
          })
        )
        .sort((a, b) => (a.properties.label || "").localeCompare(b.properties.label || ""));
    }

    if (selectedLevel === "division") {
      const divisionMap = new Map();

      upazilaFeatures.forEach((feature) => {
        const divisionCode = feature.properties.divisionCode;
        if (!divisionCode) return;
        if (!divisionMap.has(divisionCode)) {
          divisionMap.set(divisionCode, []);
        }
        divisionMap.get(divisionCode).push(feature);
      });

      return Array.from(divisionMap.values())
        .map((features) =>
          createMergedFeature(features, {
            code: features[0].properties.divisionCode,
            name: features[0].properties.division,
            label: features[0].properties.division,
            level: "division",
          })
        )
        .sort((a, b) => (a.properties.label || "").localeCompare(b.properties.label || ""));
    }

    const districtCodeToFeatures = new Map();
    upazilaFeatures.forEach((feature) => {
      const districtCode = feature.properties.districtCode;
      if (!districtCode) return;
      if (!districtCodeToFeatures.has(districtCode)) {
        districtCodeToFeatures.set(districtCode, []);
      }
      districtCodeToFeatures.get(districtCode).push(feature);
    });

    const districtCodeToName = new Map();
    upazilaFeatures.forEach((feature) => {
      if (feature.properties.districtCode && feature.properties.district) {
        districtCodeToName.set(feature.properties.districtCode, feature.properties.district);
      }
    });

    const districtNameToCode = new Map(
      Array.from(districtCodeToName.entries()).flatMap(([districtCode, districtName]) => {
        const normalizedDistrictName = normalizeName(districtName);
        const aliasName = DISTRICT_NAME_ALIASES[normalizedDistrictName];
        return aliasName
          ? [
              [normalizedDistrictName, districtCode],
              [aliasName, districtCode],
            ]
          : [[normalizedDistrictName, districtCode]];
      })
    );

    const regionOptions = REGION_DEFINITIONS.map((region) => ({
      code: toRegionCode(region.name),
      name: region.name,
      label: region.name,
      districtCodes: region.districts
        .map((districtName) => districtNameToCode.get(normalizeName(districtName)))
        .filter(Boolean),
    }));

    return regionOptions
      .map((region) => {
        const regionFeatures = (region.districtCodes || []).flatMap(
          (districtCode) => districtCodeToFeatures.get(districtCode) || []
        );

        if (!regionFeatures.length) return null;

        return createMergedFeature(regionFeatures, {
          code: region.code,
          name: region.name,
          label: region.label,
          level: "region",
        });
      })
      .filter(Boolean)
      .sort((a, b) => (a.properties.label || "").localeCompare(b.properties.label || ""));
  }, [baseGeoJSON, selectedLevel]);

  const currentAlertType = ALERT_TYPES.find((type) => type.id === selectedAlert);
  const currentThresholds = ALERT_THRESHOLDS[selectedAlert] || [];

  const alertDataById = useMemo(
    () =>
      alertRows.reduce((accumulator, row) => {
        if (row?.id) {
          accumulator[row.id] = {
            ...row,
            alert: Number.parseInt(row.alert, 10),
            value: Number.isFinite(Number(row.value)) ? Number(row.value) : null,
          };
        }
        return accumulator;
      }, {}),
    [alertRows]
  );

  const getAlertLevel = (alertCode) =>
    currentThresholds.find((threshold) => threshold.alert === alertCode) || null;

  const geoJSONStyle = (feature) => {
    const alertRow = alertDataById[feature.properties.code];
    const level = getAlertLevel(alertRow?.alert);

    if (!level) {
      return {
        fillColor: "#e5e7eb",
        weight: selectedLevel === "upazila" ? 0.4 : 0.8,
        opacity: 1,
        color: "#ffffff",
        fillOpacity: 0.5,
      };
    }

    return {
      fillColor: level.color,
      weight: selectedLevel === "upazila" ? 0.4 : 0.8,
      opacity: 1,
      color: "#ffffff",
      fillOpacity: 0.8,
    };
  };

  const onEachFeature = (feature, layer) => {
    const alertRow = alertDataById[feature.properties.code];
    const level = getAlertLevel(alertRow?.alert);
    const label = feature.properties.label || feature.properties.name || "";

    layer.bindTooltip(label, {
      permanent: false,
      direction: "top",
      opacity: 0.95,
    });

    const alertLabel = level?.label || "No Data";
    const alertColor = level?.color || "#9ca3af";
    const alertValue = formatAlertValue(alertRow?.value);

    layer.bindPopup(`
      <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 180px;">
        <strong style="font-size: 14px; color: #1f2937;">${label}</strong>
        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
          <div style="color: #4b5563; font-size: 13px; margin-bottom: 6px;">
            Alert Level: <strong style="color: ${alertColor};">${alertLabel}</strong>
          </div>
          <div style="color: #6b7280; font-size: 12px; line-height: 1.6;">
            Value: <strong>${alertValue} ${currentAlertType?.unit || ""}</strong>
          </div>
        </div>
      </div>
    `);

    layer.on({
      click: () => {
        layer.openPopup();
      },
    });
  };

  const summary = useMemo(
    () =>
      currentThresholds.map((threshold) => ({
        ...threshold,
        count: alertRows.filter((row) => row.alert === threshold.alert).length,
      })),
    [alertRows, currentThresholds]
  );

  const alertDataVersion = useMemo(
    () =>
      alertRows
        .map((row) => `${row.id}:${row.alert}:${row.value}`)
        .sort()
        .join("|"),
    [alertRows]
  );

  const selectedSummaryDetails = selectedSummaryLevel
    ? summary.find((item) => item.level === selectedSummaryLevel)
    : null;

  const summaryLocations = selectedSummaryDetails
    ? alertRows
        .filter((row) => row.alert === selectedSummaryDetails.alert)
        .map((row) => row.name)
        .sort((a, b) => a.localeCompare(b))
    : [];

  const levelLabel = LEVEL_OPTIONS.find((option) => option.value === selectedLevel)?.label || "Area";

  const totalLocationsWithAlerts = alertRows.filter((row) => {
    const level = getAlertLevel(row.alert);
    return level && level.level !== "no-alert";
  }).length;

  const handleStartDateChange = (value) => {
    const nextStart = value < TODAY ? TODAY : value > MAX_DATE ? MAX_DATE : value;
    setStartDate(nextStart);
    if (endDate < nextStart) {
      setEndDate(nextStart);
    }
  };

  const handleEndDateChange = (value) => {
    const nextEnd = value < startDate ? startDate : value > MAX_DATE ? MAX_DATE : value;
    setEndDate(nextEnd);
  };

  return (
    <div className="w-full min-h-full space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 sm:text-3xl">Weather Alert</h1>
          <p className="mt-1 text-sm text-gray-500">
            Local WRF-based alert monitoring across Bangladesh
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-0.5 rounded-xl border border-gray-200 bg-white p-1 shadow-sm sm:gap-1">
          {LEVEL_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedLevel(option.value)}
              className={`flex-1 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all duration-150 text-center sm:flex-none sm:px-4 sm:text-xs ${
                selectedLevel === option.value
                  ? "bg-[#0d4a4a] text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            From
          </label>
          <input
            type="date"
            value={startDate}
            min={TODAY}
            max={MAX_DATE}
            onChange={(event) => handleStartDateChange(event.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <label className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            To
          </label>
          <input
            type="date"
            value={endDate}
            min={startDate}
            max={MAX_DATE}
            onChange={(event) => handleEndDateChange(event.target.value)}
            className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 sm:ml-auto">
          {ALERT_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                type="button"
                disabled={type.disabled}
                onClick={() => {
                  if (!type.disabled) {
                    setSelectedAlert(type.id);
                  }
                }}
                className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150 sm:px-4 sm:text-sm ${
                  type.disabled
                    ? "cursor-not-allowed border border-dashed border-gray-200 bg-gray-100 text-gray-400"
                    : selectedAlert === type.id
                      ? "bg-[#0d4a4a] text-white shadow-md"
                      : "border border-gray-200 bg-white text-gray-600 shadow-sm hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {type.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-8 xl:col-span-9">
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm weather-alert-map">
            <div className="relative" style={{ height: mapHeight, minHeight: mapHeight }}>
              {!baseGeoJSON ? (
                <div className="flex h-full items-center justify-center bg-gray-50/50">
                  <div className="text-center">
                    <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-[3px] border-teal-200 border-t-teal-600" />
                    <p className="text-sm font-medium text-gray-500">Loading map…</p>
                    <p className="mt-1 text-xs text-gray-400">Preparing geographic data</p>
                  </div>
                </div>
              ) : (
                <>
                  <MapContainer
                    center={DEFAULT_MAP_CENTER}
                    zoom={mapZoom}
                    style={{ height: "100%", width: "100%" }}
                    zoomControl
                    attributionControl={false}
                  >
                    <TileLayer
                      url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
                      opacity={0.35}
                    />
                    <GeoJSON
                      key={`${selectedAlert}-${selectedLevel}-${startDate}-${endDate}-${alertDataVersion}`}
                      data={{ type: "FeatureCollection", features: mapFeatures }}
                      style={geoJSONStyle}
                      onEachFeature={onEachFeature}
                    />
                  </MapContainer>

                  <div className="absolute bottom-3 left-1/2 z-400 -translate-x-1/2">
                    <div className="flex items-center gap-3 rounded-xl border border-gray-200/60 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm sm:gap-4">
                      {currentThresholds.map((threshold) => (
                        <div key={threshold.level} className="flex items-center gap-1.5">
                          <span
                            className="h-3 w-3 shrink-0 rounded-sm"
                            style={{ backgroundColor: threshold.color }}
                          />
                          <span className="whitespace-nowrap text-[10px] font-medium text-gray-600">
                            {threshold.label} ({threshold.range} {currentAlertType?.unit || ""})
                          </span>
                        </div>
                      ))}
                      <div className="flex items-center gap-1.5">
                        <span className="h-3 w-3 shrink-0 rounded-sm bg-gray-200" />
                        <span className="whitespace-nowrap text-[10px] font-medium text-gray-400">
                          No Data
                        </span>
                      </div>
                    </div>
                  </div>

                  {isLoading ? (
                    <div className="absolute inset-0 z-500 flex items-center justify-center bg-white/80 backdrop-blur-sm">
                      <div className="rounded-2xl border border-gray-100 bg-white p-6 text-center shadow-xl">
                        <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-[3px] border-teal-200 border-t-teal-600" />
                        <p className="text-sm font-semibold text-gray-700">Loading alert data…</p>
                        <p className="mt-1 text-xs text-gray-400">Fetching local forecast alerts</p>
                      </div>
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4 lg:col-span-4 xl:col-span-3">
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="bg-linear-to-r from-[#0a3d3d] to-[#0d5555] px-4 py-3">
              <h2 className="text-sm font-semibold text-white">{levelLabel} Alert Summary</h2>
              <p className="mt-0.5 text-[11px] text-teal-300/70">
                Distribution of alert levels
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 p-4">
              {summary.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.level}
                    type="button"
                    onClick={() => setSelectedSummaryLevel(item.level)}
                    className="rounded-xl p-3.5 text-left transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
                    style={{
                      background: `linear-gradient(135deg, ${item.color}18, ${item.color}08)`,
                      border: `1px solid ${item.color}30`,
                    }}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <div
                        className="flex h-7 w-7 items-center justify-center rounded-lg"
                        style={{ backgroundColor: `${item.color}20` }}
                      >
                        <Icon className="h-3.5 w-3.5" style={{ color: item.color }} />
                      </div>
                    </div>
                    <p className="text-2xl font-bold" style={{ color: item.color }}>
                      {item.count}
                    </p>
                    <p className="mt-0.5 text-[11px] font-semibold text-gray-600">{item.label}</p>
                    <p className="mt-0.5 text-[9px] text-gray-400">
                      {item.range} {currentAlertType?.unit}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 px-4 py-3">
              <h3 className="text-xs font-semibold text-gray-700">Alert Information</h3>
            </div>
            <div className="space-y-2 p-3">
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                <span className="text-xs text-gray-500">Total {normalizeName(levelLabel)}s monitored</span>
                <span className="text-sm font-bold text-gray-800">{alertRows.length}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                <span className="text-xs text-gray-500">Selected range</span>
                <span className="text-sm font-bold text-gray-800">
                  {startDate === endDate ? startDate : `${startDate} to ${endDate}`}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                <span className="text-xs text-gray-500">Alert parameter</span>
                <span className="text-sm font-bold capitalize text-gray-800">{selectedAlert}</span>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                <span className="text-xs text-gray-500">Locations with alerts</span>
                <span className="text-sm font-bold text-amber-600">{totalLocationsWithAlerts}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="pb-2 text-center">
        <p className="text-[11px] text-gray-400">
          Data source: Local WRF forecast database · Updated by latest import batch
        </p>
      </div>

      {selectedSummaryDetails ? (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/45 backdrop-blur-sm"
            onClick={() => setSelectedSummaryLevel(null)}
          />
          <div className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl">
            <div
              className="px-5 py-4 text-white"
              style={{
                background: `linear-gradient(135deg, ${selectedSummaryDetails.color}, ${selectedSummaryDetails.color}dd)`,
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white/75">
                    {levelLabel} List
                  </p>
                  <h3 className="mt-1 text-lg font-bold sm:text-xl">
                    {selectedSummaryDetails.label}
                  </h3>
                  <p className="mt-1 text-sm text-white/85">
                    {summaryLocations.length} {normalizeName(levelLabel)}
                    {summaryLocations.length === 1 ? "" : "s"} under{" "}
                    {currentAlertType?.label?.toLowerCase()} alert
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedSummaryLevel(null)}
                  className="rounded-xl bg-white/12 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/20"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="max-h-[70vh] overflow-y-auto p-4 sm:p-5">
              {summaryLocations.length ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {summaryLocations.map((locationName, index) => (
                    <div
                      key={`${selectedSummaryLevel}-${locationName}-${index}`}
                      className="flex items-center gap-3 rounded-xl border border-gray-100 bg-gray-50/70 px-3.5 py-3"
                    >
                      <div
                        className="h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: selectedSummaryDetails.color }}
                      />
                      <span className="text-sm font-medium text-gray-700">{locationName}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex min-h-40 items-center justify-center rounded-2xl border border-dashed border-gray-200 bg-gray-50/70 px-6 text-center">
                  <div>
                    <p className="text-sm font-semibold text-gray-600">
                      No {normalizeName(levelLabel)}s in this alert group
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      There are currently no locations classified as{" "}
                      {selectedSummaryDetails.label.toLowerCase()} for the selected range and parameter.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default WeatherAlert;
