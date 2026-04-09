import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./WeatherForecast.css";
import {
  AlertTriangle,
  CalendarDays,
  Cloud,
  CloudRain,
  CloudDrizzle,
  Droplets,
  MapPin,
  Navigation,
  Sprout,
  Sun,
  Thermometer,
  Wind,
} from "lucide-react";
import { API_ENDPOINTS, getAuthHeaders } from "../../config/api";

const DEFAULT_MAP_CENTER = [23.8103, 90.4125];
const DEFAULT_SCOPE = "region";
const DEFAULT_REGION = "Dhaka";
const DEFAULT_DIVISION = "Dhaka";
const DEFAULT_DISTRICT = "Gazipur";
const DEFAULT_UPAZILA = "Gazipur Sadar";

const SCOPE_OPTIONS = [
  { value: "region", label: "Region" },
  { value: "division", label: "Division" },
  { value: "district", label: "District" },
  { value: "upazila", label: "Upazila" },
];

const DISPLAY_ROW_ORDER = [
  "max_temperature",
  "min_temperature",
  "rainfall",
  "relative_humidity",
  "wind_speed",
  "wind_direction",
  "solar_radiation",
  "sunshine_hour",
  "cloud_cover",
  "soil_moisture",
  "dew_point",
];

const METRIC_CONFIG = {
  temp: {
    label: "Temperature",
    unit: "°C",
    icon: Thermometer,
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-100",
    rows: ["max_temperature", "min_temperature"],
  },
  rf: {
    label: "Rainfall",
    unit: "mm",
    icon: CloudDrizzle,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
    rows: ["rainfall"],
  },
  rh: {
    label: "Humidity",
    unit: "%",
    icon: Droplets,
    color: "text-cyan-600",
    bg: "bg-cyan-50",
    border: "border-cyan-100",
    rows: ["relative_humidity"],
  },
  windspd: {
    label: "Wind Speed",
    unit: "km/h",
    icon: Wind,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
    rows: ["wind_speed"],
  },
  winddir: {
    label: "Direction",
    unit: "°",
    icon: Navigation,
    color: "text-sky-600",
    bg: "bg-sky-50",
    border: "border-sky-100",
    rows: ["wind_direction"],
  },
  cldcvr: {
    label: "Cloud Cover",
    unit: "%",
    icon: Cloud,
    color: "text-violet-600",
    bg: "bg-violet-50",
    border: "border-violet-100",
    rows: ["cloud_cover"],
  },
  solar: {
    label: "Solar Radiation",
    unit: "W/m²",
    icon: Sun,
    color: "text-amber-600",
    bg: "bg-amber-50",
    border: "border-amber-100",
    rows: ["solar_radiation"],
  },
};

const METRIC_BUTTONS = [
  { key: "rf", shortLabel: "Rainfall", icon: CloudDrizzle },
  { key: "temp", shortLabel: "Temp", icon: Thermometer },
  { key: "rh", shortLabel: "Humidity", icon: Droplets },
  { key: "windspd", shortLabel: "Wind", icon: Wind },
  { key: "winddir", shortLabel: "Dir", icon: Navigation },
  { key: "cldcvr", shortLabel: "Cloud", icon: Cloud },
  { key: "solar", shortLabel: "Solar", icon: Sun },
];

const ROW_ICONS = {
  max_temperature: Thermometer,
  min_temperature: Thermometer,
  rainfall: CloudRain,
  relative_humidity: Droplets,
  wind_speed: Wind,
  wind_direction: Navigation,
  solar_radiation: Sun,
  sunshine_hour: Sun,
  cloud_cover: Cloud,
  soil_moisture: Sprout,
  dew_point: Droplets,
};

const getResponsiveMapZoom = () => {
  if (typeof window === "undefined") return 7;
  return window.innerWidth >= 1024 ? 7 : 6;
};

const getResponsiveMapHeight = () => {
  if (typeof window === "undefined") return "620px";
  if (window.innerWidth >= 1024) return "620px";
  if (window.innerWidth >= 768) return "520px";
  return "420px";
};

const MapController = ({ center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    if (center && zoom) {
      map.setView(center, zoom);
    }
  }, [center, zoom, map]);

  return null;
};

const normalizeName = (value = "") =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

const geometryToMultiPolygonCoordinates = (geometry) => {
  if (!geometry?.type || !geometry?.coordinates) return [];
  if (geometry.type === "Polygon") {
    return [geometry.coordinates];
  }
  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates;
  }
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

const WeatherForecast = () => {
  const [locationType, setLocationType] = useState(DEFAULT_SCOPE);
  const [mapCenter, setMapCenter] = useState(DEFAULT_MAP_CENTER);
  const [mapZoom, setMapZoom] = useState(getResponsiveMapZoom);
  const [mapHeight, setMapHeight] = useState(getResponsiveMapHeight);
  const [baseGeoJSON, setBaseGeoJSON] = useState(null);
  const [locationsData, setLocationsData] = useState({
    regions: [],
    divisions: [],
    districts: [],
    upazilas: [],
  });
  const [loadingLocations, setLoadingLocations] = useState(true);
  const [selectedFeatureCode, setSelectedFeatureCode] = useState("");
  const [locationSearch, setLocationSearch] = useState("");
  const [locationDropdownOpen, setLocationDropdownOpen] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [isLoadingForecast, setIsLoadingForecast] = useState(false);
  const [forecastError, setForecastError] = useState(null);
  const [activeMetric, setActiveMetric] = useState("temp");

  useEffect(() => {
    fetch("/amd3.json")
      .then((response) => response.json())
      .then((data) => setBaseGeoJSON(data))
      .catch((error) => console.error("Error loading amd3:", error));
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setMapHeight(getResponsiveMapHeight());
      setMapZoom(getResponsiveMapZoom());
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchLocations = async () => {
      setLoadingLocations(true);
      try {
        const response = await fetch(API_ENDPOINTS.forecastSummaryLocations, {
          headers: getAuthHeaders(),
        });
        const payload = await response.json();

        if (!response.ok || !payload.success) {
          throw new Error(payload.message || "Failed to load locations");
        }

        setLocationsData(
          payload.data || { regions: [], divisions: [], districts: [], upazilas: [] }
        );
      } catch (error) {
        console.error("Error loading forecast locations:", error);
      } finally {
        setLoadingLocations(false);
      }
    };

    fetchLocations();
  }, []);

  const mapFeatures = useMemo(() => {
    if (!baseGeoJSON?.features?.length) return [];

    const upazilaFeatures = baseGeoJSON.features.map((feature) => ({
      ...feature,
      properties: {
        code: feature.properties.ADM3_PCODE,
        name: feature.properties.ADM3_EN,
        label: feature.properties.ADM3_EN,
        level: "upazila",
        district: feature.properties.ADM2_EN,
        districtCode: feature.properties.ADM2_PCODE,
        division: feature.properties.ADM1_EN,
        divisionCode: feature.properties.ADM1_PCODE,
      },
    }));

    if (locationType === "upazila") {
      return upazilaFeatures
        .filter((feature) => feature.properties.code)
        .sort((a, b) =>
          (a.properties.label || "").localeCompare(b.properties.label || "")
        );
    }

    if (locationType === "district") {
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
        .sort((a, b) =>
          (a.properties.label || "").localeCompare(b.properties.label || "")
        );
    }

    if (locationType === "division") {
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
        .sort((a, b) =>
          (a.properties.label || "").localeCompare(b.properties.label || "")
        );
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

    return (locationsData.regions || [])
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
      .sort((a, b) =>
        (a.properties.label || "").localeCompare(b.properties.label || "")
      );
  }, [baseGeoJSON, locationType, locationsData.regions]);

  const featureOptions = useMemo(
    () =>
      mapFeatures.map((feature) => ({
        code: feature.properties.code,
        name: feature.properties.name,
        label: feature.properties.label,
        feature,
      })),
    [mapFeatures]
  );

  const selectedFeature = useMemo(
    () =>
      featureOptions.find((option) => option.code === selectedFeatureCode)?.feature || null,
    [featureOptions, selectedFeatureCode]
  );

  useEffect(() => {
    if (!featureOptions.length) {
      setSelectedFeatureCode("");
      return;
    }

    const hasSelectedFeature = featureOptions.some(
      (option) => option.code === selectedFeatureCode
    );

    if (hasSelectedFeature) return;

    let defaultOption = null;

    if (locationType === "region") {
      defaultOption = featureOptions.find((option) => option.name === DEFAULT_REGION);
    } else if (locationType === "division") {
      defaultOption = featureOptions.find((option) => option.name === DEFAULT_DIVISION);
    } else if (locationType === "district") {
      defaultOption = featureOptions.find((option) => option.name === DEFAULT_DISTRICT);
    } else {
      defaultOption = featureOptions.find((option) => option.name === DEFAULT_UPAZILA);
    }

    setSelectedFeatureCode(defaultOption?.code || featureOptions[0].code);
  }, [featureOptions, locationType, selectedFeatureCode]);

  useEffect(() => {
    if (!selectedFeatureCode) {
      setSummaryData(null);
      setForecastError(null);
      return;
    }

    const fetchForecast = async () => {
      setIsLoadingForecast(true);
      setForecastError(null);

      try {
        const params = new URLSearchParams({
          days: "10",
          selectionType: locationType,
          selectionCode: selectedFeatureCode,
        });

        const response = await fetch(`${API_ENDPOINTS.forecastSummary}?${params.toString()}`, {
          headers: getAuthHeaders(),
        });
        const payload = await response.json();

        if (!response.ok || !payload.success) {
          throw new Error(payload.message || "Failed to load forecast data");
        }

        setSummaryData(payload.data);
      } catch (error) {
        console.error("Error loading local forecast:", error);
        setSummaryData(null);
        setForecastError(
          "Unable to load local forecast data for this location right now."
        );
      } finally {
        setIsLoadingForecast(false);
      }
    };

    fetchForecast();
  }, [locationType, selectedFeatureCode]);

  const colors = [
    "#4ECDC4",
    "#45B7D1",
    "#FFA07A",
    "#98D8C8",
    "#F7DC6F",
    "#BB8FCE",
    "#85C1E2",
    "#F8B88B",
    "#ABEBC6",
    "#F1948A",
    "#73C6B6",
    "#FAD7A0",
    "#D7BDE2",
    "#A9CCE3",
    "#F9E79F",
    "#A3E4D7",
    "#FADBD8",
    "#D5F4E6",
    "#EBDEF0",
    "#FF6B6B",
  ];

  const getColorForFeature = (feature) => {
    const name = feature?.properties?.label || feature?.properties?.name || "";
    let hash = 0;
    for (let i = 0; i < name.length; i += 1) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  const isSelected = (feature) => feature?.properties?.code === selectedFeatureCode;

  const geoJSONStyle = (feature) => ({
    fillColor: getColorForFeature(feature),
    weight: isSelected(feature) ? 1.3 : locationType === "upazila" ? 0.5 : 1,
    opacity: isSelected(feature) ? 1 : 0.45,
    color: "#ffffff",
    fillOpacity: isSelected(feature) ? 0.95 : 0.45,
  });

  const onEachFeature = (feature, layer) => {
    const label = feature.properties?.label || feature.properties?.name || "";
    if (!label) return;

    layer.bindTooltip(label, {
      permanent: false,
      direction: "top",
      opacity: 0.95,
    });

    layer.on({
      click: () => {
        setSelectedFeatureCode(feature.properties.code);
        setLocationDropdownOpen(false);
      },
      mouseover: (event) => {
        if (!isSelected(feature)) {
          event.target.setStyle({
            fillOpacity: 0.7,
            weight: 1,
            color: "#ffffff",
            opacity: 0.85,
          });
        }
        event.target.bringToFront();
      },
      mouseout: (event) => {
        if (!isSelected(feature)) {
          event.target.setStyle(geoJSONStyle(feature));
        }
      },
    });
  };

  const filteredLocationOptions = featureOptions.filter((option) =>
    option.label.toLowerCase().includes(locationSearch.toLowerCase())
  );

  const handleLocationTypeChange = (nextType) => {
    setLocationType(nextType);
    setSelectedFeatureCode("");
    setLocationSearch("");
    setLocationDropdownOpen(false);
    setMapCenter(DEFAULT_MAP_CENTER);
  };

  const handleLocationSelect = (code) => {
    setSelectedFeatureCode(code);
    setLocationSearch("");
    setLocationDropdownOpen(false);
  };

  const selectedLabel =
    selectedFeature?.properties?.label || selectedFeature?.properties?.name || "";
  const activeMetricInfo = METRIC_CONFIG[activeMetric] || METRIC_CONFIG.temp;
  const ActiveMetricIcon = activeMetricInfo.icon;
  const orderedRows = useMemo(() => {
    const rows = summaryData?.rows || [];
    return DISPLAY_ROW_ORDER.map((key) => rows.find((row) => row.key === key)).filter(Boolean);
  }, [summaryData]);

  const dailyCards = useMemo(() => {
    if (!summaryData?.dates?.length || !orderedRows.length) return [];

    const selectedRows = activeMetricInfo.rows
      .map((key) => orderedRows.find((row) => row.key === key))
      .filter(Boolean);

    return summaryData.dates.map((dateInfo, index) => ({
      ...dateInfo,
      metrics: selectedRows.map((row) => ({
        key: row.key,
        label: row.label,
        unit: row.unit,
        value: row.values[index]?.displayValue || "—",
      })),
    }));
  }, [activeMetricInfo.rows, orderedRows, summaryData]);

  return (
    <div className="w-full min-h-full space-y-4 sm:space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Weather Forecast
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            10-day local WRF forecast across Bangladesh
          </p>
        </div>

        <div className="flex items-center gap-0.5 sm:gap-1 rounded-xl border border-gray-200 bg-white p-1 shadow-sm shrink-0">
          {SCOPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => handleLocationTypeChange(option.value)}
              className={`flex-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg transition-all duration-150 text-center sm:flex-none sm:px-3.5 sm:text-xs ${
                locationType === option.value
                  ? "bg-[#0d4a4a] text-white shadow-sm"
                  : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm flex flex-col">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-teal-600" />
                <h2 className="text-sm font-semibold text-gray-700">Bangladesh Map</h2>
                <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400">
                  {locationType} view
                </span>
              </div>
              {selectedLabel ? (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-teal-100 bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700">
                  <span className="h-1.5 w-1.5 rounded-full bg-teal-500 animate-pulse" />
                  {selectedLabel}
                </span>
              ) : null}
            </div>

            <div className="relative weather-map" style={{ height: mapHeight }}>
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                className="absolute inset-0"
                style={{ height: "100%", width: "100%", backgroundColor: "#f0f4f8" }}
                zoomControl
                attributionControl={false}
              >
                <MapController center={mapCenter} zoom={mapZoom} />
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
                  opacity={0.4}
                />
                {mapFeatures.length ? (
                  <GeoJSON
                    key={`weather-forecast-map-${locationType}-${selectedFeatureCode || "none"}`}
                    data={{ type: "FeatureCollection", features: mapFeatures }}
                    style={geoJSONStyle}
                    onEachFeature={onEachFeature}
                  />
                ) : null}
              </MapContainer>

              <div className="absolute left-2 top-12.5 md:top-25 z-400 flex flex-col gap-1.5">
                {METRIC_BUTTONS.map(({ key, icon: Icon }) => {
                  const info = METRIC_CONFIG[key];
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveMetric(key)}
                      title={info.label}
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 shadow-md transition-all duration-150 sm:h-10 sm:w-10 ${
                        activeMetric === key
                          ? "scale-110 border-white bg-[#0d9e6d] text-white"
                          : "border-transparent bg-[#5a6068] text-white/80 hover:scale-105 hover:bg-[#4a5058]"
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5 sm:h-4.5 sm:w-4.5" />
                    </button>
                  );
                })}
              </div>

              <div className="absolute bottom-4 left-4 right-4 z-400">
                <div className="mx-auto max-w-[16rem] rounded-xl border border-gray-200/80 bg-white/95 p-2 shadow-xl backdrop-blur-sm sm:max-w-md sm:rounded-2xl sm:p-3">
                  <div className="mb-1.5 flex items-center gap-1.5 sm:mb-2 sm:gap-2">
                    <MapPin className="h-3.5 w-3.5 text-teal-600 sm:h-4 sm:w-4" />
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500 sm:text-xs">
                      Select {locationType}
                    </p>
                  </div>
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setLocationDropdownOpen((current) => !current)}
                      className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-left text-xs text-gray-700 outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm"
                    >
                      <span className="truncate pr-2">{selectedLabel || `Choose ${locationType}...`}</span>
                      <svg
                        className={`h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform sm:h-4 sm:w-4 ${
                          locationDropdownOpen ? "rotate-180" : ""
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </button>

                    {locationDropdownOpen ? (
                      <div className="absolute bottom-full left-0 right-0 mb-2 rounded-xl border border-gray-200 bg-white p-1.5 shadow-2xl sm:rounded-2xl sm:p-2">
                        <input
                          type="text"
                          value={locationSearch}
                          onChange={(event) => setLocationSearch(event.target.value)}
                          placeholder={`Search ${locationType} name...`}
                          className="mb-1.5 w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-xs text-gray-700 outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 sm:mb-2 sm:rounded-xl sm:px-3 sm:py-2 sm:text-sm"
                        />
                        <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-100 bg-gray-50/50 p-1 sm:rounded-xl">
                          {filteredLocationOptions.length ? (
                            filteredLocationOptions.map((option) => (
                              <button
                                key={option.code}
                                type="button"
                                onClick={() => handleLocationSelect(option.code)}
                                className={`flex w-full items-center rounded-md px-2.5 py-1.5 text-left text-xs transition-colors sm:rounded-lg sm:px-3 sm:py-2 sm:text-sm ${
                                  option.code === selectedFeatureCode
                                    ? "bg-teal-50 text-teal-700"
                                    : "text-gray-700 hover:bg-white"
                                }`}
                              >
                                <span className="truncate">{option.label}</span>
                              </button>
                            ))
                          ) : (
                            <div className="px-2.5 py-1.5 text-xs text-gray-400 sm:px-3 sm:py-2 sm:text-sm">
                              No matching {locationType} found.
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between bg-linear-to-r from-[#0a3d3d] to-[#0d5555] px-4 py-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10">
                  <ActiveMetricIcon className="h-4.5 w-4.5 text-teal-300" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold leading-tight text-white">
                    10-Day {activeMetricInfo.label} Forecast
                  </h3>
                  <p className="text-[11px] text-teal-300/70">
                    {selectedLabel ? `${selectedLabel} · ${locationType}` : `Select a ${locationType}`}
                  </p>
                </div>
              </div>
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-medium text-teal-300/80">
                {activeMetricInfo.label} ({activeMetricInfo.unit})
              </span>
            </div>

            <div className="flex-1 overflow-y-auto">
              {isLoadingForecast || loadingLocations ? (
                <div className="flex flex-col items-center justify-center gap-3 py-12">
                  <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-teal-200 border-t-teal-600" />
                  <p className="text-xs font-medium text-gray-400">
                    Loading 10-day {activeMetricInfo.label.toLowerCase()} forecast…
                  </p>
                </div>
              ) : forecastError ? (
                <div className="px-5 py-10 text-center">
                  <p className="text-sm font-semibold text-gray-700">Forecast Unavailable</p>
                  <p className="mt-2 text-xs leading-relaxed text-gray-400">
                    {forecastError}
                  </p>
                </div>
              ) : dailyCards.length ? (
                <div className="overflow-x-auto p-3 sm:p-4">
                  <div className="min-w-max overflow-hidden rounded-2xl border border-gray-200">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="min-w-28 border-b border-r border-gray-200 px-3 py-3 text-left text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">
                            Date
                          </th>
                          {(dailyCards[0]?.metrics || []).map((metric, index) => (
                            <th
                              key={metric.key}
                              className="min-w-24 border-b border-gray-200 px-3 py-3 text-center bg-white"
                            >
                              <div className="flex items-center justify-center gap-1.5">
                                {(() => {
                                  const MetricIcon = ROW_ICONS[metric.key] || Thermometer;
                                  return <MetricIcon className="h-3.5 w-3.5 text-teal-600" />;
                                })()}
                                <span className="text-[10px] font-bold uppercase tracking-[0.14em] text-teal-700">
                                  {metric.label}
                                </span>
                              </div>
                              <div className="mt-1 text-[10px] text-gray-500">
                                {metric.unit}
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>

                      <tbody>
                        {dailyCards.map((dayCard, dayIndex) => (
                          <tr
                            key={dayCard.key}
                            className={dayIndex % 2 === 0 ? "bg-white" : "bg-gray-50/50"}
                          >
                            <td className={`border-r border-t border-gray-200 px-3 py-3 text-left ${
                              dayIndex === 0 ? activeMetricInfo.bg : ""
                            }`}>
                              <span className="text-xs font-semibold text-gray-900">
                                {dayCard.label}
                              </span>
                            </td>

                            {dayCard.metrics.map((metric) => (
                              <td
                                key={`${dayCard.key}-${metric.key}`}
                                className={`border-t border-gray-200 px-3 py-3 text-center ${
                                  dayIndex === 0 ? activeMetricInfo.bg : ""
                                }`}
                              >
                                <div className="text-sm font-semibold text-gray-900">
                                  {metric.value}
                                </div>
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="px-5 py-10 text-center">
                  <p className="text-sm font-semibold text-gray-700">No Forecast Yet</p>
                  <p className="mt-2 text-xs leading-relaxed text-gray-400">
                    Select a {locationType} on the map to view the local 10-day {activeMetricInfo.label.toLowerCase()} forecast.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherForecast;
