import { useState, useEffect } from "react";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./WeatherForecast.css";
import {
  CloudRain,
  Wind,
  Droplets,
  CloudDrizzle,
  Thermometer,
  Navigation,
  Cloud,
  MapPin,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  BarChart3,
} from "lucide-react";

import L from "leaflet";

const IRAS_API_URL = "https://iras.brri.gov.bd";

// Component to handle map zoom and center changes
const MapController = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    if (center && zoom) map.setView(center, zoom);
  }, [center, zoom, map]);
  return null;
};

// Component to auto-fit map to a GeoJSON feature's bounds
const FitBoundsController = ({ feature }) => {
  const map = useMap();
  useEffect(() => {
    if (!feature) return;
    try {
      const geoLayer = L.geoJSON(feature);
      const bounds = geoLayer.getBounds();
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [20, 20], maxZoom: 12 });
      }
    } catch (e) {
      console.error("Error fitting bounds:", e);
    }
  }, [feature, map]);
  return null;
};

const WeatherForecast = () => {
  const [locationType, setLocationType] = useState("division");
  const [mapCenter, setMapCenter] = useState([23.8103, 90.4125]);
  const [mapZoom, setMapZoom] = useState(7);
  const [geoJSONData, setGeoJSONData] = useState(null);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [forecastData, setForecastData] = useState([]);
  const [isLoadingForecast, setIsLoadingForecast] = useState(false);
  const [forecastError, setForecastError] = useState(null);
  const [locationsData, setLocationsData] = useState([]);
  const [activeMetric, setActiveMetric] = useState("temp");

  // Load GeoJSON data
  useEffect(() => {
    fetch("/bangladesh.geojson")
      .then((response) => response.json())
      .then((data) => setGeoJSONData(data))
      .catch((error) => console.error("Error loading GeoJSON:", error));
  }, []);

  // Auto-select on initial load
  useEffect(() => {
    if (!geoJSONData) return;

    let feature = null;

    if (locationType === "division") {
      const dhakaFeatures = geoJSONData.features.filter(
        (f) => f.properties.NAME_1 === "Dhaka",
      );
      if (dhakaFeatures.length > 0) {
        feature = {
          type: "Feature",
          properties: { NAME_1: "Dhaka", NAME_2: null, NAME_3: null },
          geometry: { type: "MultiPolygon", coordinates: [] },
        };
        dhakaFeatures.forEach((f) => {
          if (f.geometry.type === "Polygon")
            feature.geometry.coordinates.push(f.geometry.coordinates);
          else if (f.geometry.type === "MultiPolygon")
            feature.geometry.coordinates.push(...f.geometry.coordinates);
        });
      }
    } else if (locationType === "district") {
      const districtMap = new Map();
      geoJSONData.features.forEach((f) => {
        const name = f.properties.NAME_2;
        if (!districtMap.has(name)) districtMap.set(name, []);
        districtMap.get(name).push(f);
      });
      const firstName = districtMap.keys().next().value;
      const feats = districtMap.get(firstName);
      if (feats?.length > 0) {
        feature = {
          type: "Feature",
          properties: {
            NAME_1: feats[0].properties.NAME_1,
            NAME_2: firstName,
            NAME_3: null,
          },
          geometry: { type: "MultiPolygon", coordinates: [] },
        };
        feats.forEach((f) => {
          if (f.geometry.type === "Polygon")
            feature.geometry.coordinates.push(f.geometry.coordinates);
          else if (f.geometry.type === "MultiPolygon")
            feature.geometry.coordinates.push(...f.geometry.coordinates);
        });
      }
    } else {
      feature = geoJSONData.features.find((f) => f.properties.NAME_3);
    }

    if (feature) {
      setSelectedFeature(feature);
    }
  }, [geoJSONData, locationType]);

  // Load locations data from API
  useEffect(() => {
    fetch(`${IRAS_API_URL}/api/weather/locations`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.success && data.data?.result)
          setLocationsData(data.data.result);
      })
      .catch((err) => console.error("Error loading locations:", err));
  }, []);

  // Fetch forecast data when a feature is selected
  useEffect(() => {
    if (!selectedFeature) {
      setForecastData([]);
      setForecastError(null);
      return;
    }
    if (locationsData.length === 0) return;

    const fetchForecast = async () => {
      setIsLoadingForecast(true);
      setForecastError(null);
      try {
        let url = "";
        if (locationType === "division") {
          url = `${IRAS_API_URL}/api/weather/forecast?type=division&id=${getDivisionId(selectedFeature.properties.NAME_1)}`;
        } else if (locationType === "district") {
          url = `${IRAS_API_URL}/api/weather/forecast?type=district&id=${getDistrictId(selectedFeature.properties.NAME_2)}`;
        } else {
          url = `${IRAS_API_URL}/api/weather/forecast?type=upazila&id=${getUpazilaId(selectedFeature.properties.NAME_3)}`;
        }

        const response = await fetch(url);
        const text = await response.text();
        // BMD API sometimes returns PHP errors before JSON
        const jsonStart = text.indexOf("{");
        if (jsonStart === -1)
          throw new Error("Invalid response from weather service");
        const data = JSON.parse(text.slice(jsonStart));

        if (data?.success && data.data?.result?.daily) {
          setForecastData(data.data.result.daily.slice(0, 5));
        } else {
          setForecastData([]);
          setForecastError("No forecast data returned for this location.");
        }
      } catch (error) {
        console.error("Error fetching forecast:", error);
        setForecastData([]);
        setForecastError(
          "Unable to load forecast. The weather service may be temporarily unavailable.",
        );
      } finally {
        setIsLoadingForecast(false);
      }
    };

    fetchForecast();
  }, [selectedFeature, locationType, locationsData]);

  // ID resolution helpers
  const getDivisionId = (name) => {
    const loc = locationsData.find((l) => l.division === name);
    return loc ? loc.adm1_pcode : "30";
  };
  const getDistrictId = (name) => {
    const loc = locationsData.find((l) => l.district === name);
    return loc ? loc.adm2_pcode : locationsData[0]?.adm2_pcode || "3026";
  };
  const getUpazilaId = (name) => {
    const loc = locationsData.find((l) => l.upazila === name);
    return loc ? loc.adm3_pcode : locationsData[0]?.adm3_pcode || "302602";
  };

  const handleLocationTypeChange = (type) => {
    setLocationType(type);
    setMapCenter([23.8103, 90.4125]);
    setSelectedFeature(null);
    setMapZoom(type === "upazila" ? 8 : 7);
  };

  // GeoJSON filtering / merging
  const getFilteredGeoJSON = () => {
    if (!geoJSONData) return null;
    if (locationType === "upazila") return geoJSONData;

    const groupKey = locationType === "district" ? "NAME_2" : "NAME_1";
    const groupMap = new Map();
    geoJSONData.features.forEach((f) => {
      const name = f.properties[groupKey];
      if (!groupMap.has(name)) groupMap.set(name, []);
      groupMap.get(name).push(f);
    });

    const merged = [];
    groupMap.forEach((feats, name) => {
      if (feats.length === 0) return;
      const m = {
        type: "Feature",
        properties: {
          NAME_1: feats[0].properties.NAME_1,
          NAME_2: locationType === "district" ? name : null,
          NAME_3: null,
        },
        geometry: { type: "MultiPolygon", coordinates: [] },
      };
      feats.forEach((f) => {
        if (f.geometry.type === "Polygon")
          m.geometry.coordinates.push(f.geometry.coordinates);
        else if (f.geometry.type === "MultiPolygon")
          m.geometry.coordinates.push(...f.geometry.coordinates);
      });
      merged.push(m);
    });
    return { type: "FeatureCollection", features: merged };
  };

  // Colors
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

  const getColorForLocation = (feature) => {
    let name = "";
    if (locationType === "division") name = feature.properties.NAME_1 || "";
    else if (locationType === "district")
      name = feature.properties.NAME_2 || "";
    else name = feature.properties.NAME_3 || "";
    let hash = 0;
    for (let i = 0; i < name.length; i++)
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const isSelected = (feature) => {
    if (!selectedFeature) return false;
    if (locationType === "division")
      return feature.properties.NAME_1 === selectedFeature.properties.NAME_1;
    if (locationType === "district")
      return feature.properties.NAME_2 === selectedFeature.properties.NAME_2;
    return feature.properties.NAME_3 === selectedFeature.properties.NAME_3;
  };

  const geoJSONStyle = (feature) => ({
    fillColor: getColorForLocation(feature),
    weight: isSelected(feature) ? 1 : locationType === "upazila" ? 0.5 : 1.5,
    opacity: isSelected(feature) ? 1 : 0.4,
    color: isSelected(feature) ? "#fff" : "#fff",
    fillOpacity: isSelected(feature) ? 1 : 0.4,
  });

  const getFeatureName = (feature) => {
    if (!feature) return "";
    return (
      feature.properties.NAME_3 ||
      feature.properties.NAME_2 ||
      feature.properties.NAME_1 ||
      ""
    );
  };

  const onEachFeature = (feature, layer) => {
    const name = getFeatureName(feature);

    if (name) {
      layer.bindTooltip(name, {
        permanent: false,
        direction: "top",
        opacity: 0.95,
      });

      layer.on({
        click: () => {
          setSelectedFeature(feature);
        },
        mouseover: (e) => {
          if (!isSelected(feature)) {
            e.target.setStyle({
              fillOpacity: 0.65,
              weight: 1,
              color: "#fff",
              opacity: 0.8,
            });
          }
          e.target.bringToFront();
        },
        mouseout: (e) => {
          if (!isSelected(feature)) e.target.setStyle(geoJSONStyle(feature));
        },
      });
    }
  };

  const getSecondaryMapData = () => {
    if (!selectedFeature) return getFilteredGeoJSON();
    return { type: "FeatureCollection", features: [selectedFeature] };
  };

  const getMetricInfo = (metric) => {
    const map = {
      rf: {
        label: "Rainfall",
        unit: "mm",
        icon: Droplets,
        color: "text-blue-600",
        bg: "bg-blue-50",
        border: "border-blue-100",
      },
      temp: {
        label: "Temperature",
        unit: "°C",
        icon: Thermometer,
        color: "text-orange-600",
        bg: "bg-orange-50",
        border: "border-orange-100",
      },
      rh: {
        label: "Humidity",
        unit: "%",
        icon: CloudDrizzle,
        color: "text-cyan-600",
        bg: "bg-cyan-50",
        border: "border-cyan-100",
      },
      windspd: {
        label: "Wind Speed",
        unit: "km/h",
        icon: Wind,
        color: "text-emerald-600",
        bg: "bg-emerald-50",
        border: "border-emerald-100",
      },
      winddir: {
        label: "Direction",
        unit: "°",
        icon: Navigation,
        color: "text-sky-600",
        bg: "bg-sky-50",
        border: "border-sky-100",
      },
      cldcvr: {
        label: "Cloud Cover",
        unit: "oktas",
        icon: Cloud,
        color: "text-violet-600",
        bg: "bg-violet-50",
        border: "border-violet-100",
      },
      windgust: {
        label: "Wind Gust",
        unit: "km/h",
        icon: CloudRain,
        color: "text-rose-600",
        bg: "bg-rose-50",
        border: "border-rose-100",
      },
    };
    return (
      map[metric] || {
        label: "Unknown",
        unit: "",
        icon: BarChart3,
        color: "text-gray-600",
        bg: "bg-gray-50",
        border: "border-gray-100",
      }
    );
  };

  const metricButtons = [
    { key: "rf", shortLabel: "Rainfall", icon: Droplets },
    { key: "temp", shortLabel: "Temp", icon: Thermometer },
    { key: "rh", shortLabel: "Humidity", icon: CloudDrizzle },
    { key: "windspd", shortLabel: "Wind", icon: Wind },
    { key: "winddir", shortLabel: "Dir", icon: Navigation },
    { key: "cldcvr", shortLabel: "Cloud", icon: Cloud },
    { key: "windgust", shortLabel: "Gust", icon: CloudRain },
  ];

  const locationTypeOptions = [
    { value: "region", label: "Region" },
    { value: "division", label: "Division" },
    { value: "district", label: "District" },
    { value: "upazila", label: "Upazila" },
  ];

  const selectedName = getFeatureName(selectedFeature);
  const selectedDivision = selectedFeature?.properties?.NAME_1;

  const formatDate = (dateStr) => {
    try {
      const d = new Date(dateStr);
      return {
        day: d.toLocaleDateString("en-US", { weekday: "short" }),
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      };
    } catch {
      return { day: "", date: dateStr };
    }
  };

  return (
    <div className="w-full min-h-full space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Weather Forecast
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            5-day weather forecast across Bangladesh — powered by BMD
          </p>
        </div>

        {/* Location type toggle */}
        <div className="flex items-center gap-0.5 sm:gap-1 bg-white rounded-xl border border-gray-200 p-1 shadow-sm shrink-0">
          {locationTypeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => opt.value !== "region" && handleLocationTypeChange(opt.value)}
              className={`flex-1 sm:flex-none px-2.5 sm:px-3.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-all duration-150 text-center ${
                locationType === opt.value
                  ? "bg-[#0d4a4a] text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* LEFT: Map */}
        <div className="lg:col-span-7">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-teal-600" />
                <h2 className="text-sm font-semibold text-gray-700">
                  Bangladesh Map
                </h2>
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                  {locationType} view
                </span>
              </div>
              {selectedFeature && (
                <span className="inline-flex items-center gap-1.5 text-xs font-medium bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full border border-teal-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-pulse" />
                  {selectedName}
                </span>
              )}
            </div>

            <div className="relative weather-map" style={{ height: "620px" }}>
              <MapContainer
                center={mapCenter}
                zoom={mapZoom}
                className="absolute inset-0"
                style={{
                  height: "100%",
                  width: "100%",
                  backgroundColor: "#f0f4f8",
                }}
                zoomControl={true}
                attributionControl={false}
              >
                <MapController center={mapCenter} zoom={mapZoom} />
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
                  opacity={0.4}
                />
                {geoJSONData && (
                  <GeoJSON
                    key={`geojson-${locationType}-${selectedName}`}
                    data={getFilteredGeoJSON()}
                    style={geoJSONStyle}
                    onEachFeature={onEachFeature}
                  />
                )}
              </MapContainer>

              {/* Metric selector buttons - horizontal on mobile (top-right), vertical on desktop (left below zoom) */}
              <div className="absolute z-400 flex
                top-3 right-16 flex-row gap-1
                sm:top-22.5 sm:left-2 sm:right-auto sm:flex-col sm:gap-1.5"
              >
                {metricButtons.map(({ key, icon: Icon }) => {
                  const info = getMetricInfo(key);
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveMetric(key)}
                      title={info.label}
                      className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-md transition-all duration-150 border-2 ${
                        activeMetric === key
                          ? "bg-[#0d9e6d] border-white text-white scale-110"
                          : "bg-[#5a6068] border-transparent text-white/80 hover:bg-[#4a5058] hover:scale-105"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5 sm:w-4.5 sm:h-4.5" />
                    </button>
                  );
                })}
              </div>

              {!selectedFeature && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-400 pointer-events-none">
                  <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg border border-gray-200/60 text-xs font-medium text-gray-600">
                    Click a {locationType} on the map to see its forecast
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Info + Forecast */}
        <div className="lg:col-span-5 flex flex-col gap-5">
          {/* Selected Area mini map */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-teal-600" />
                <h2 className="text-sm font-semibold text-gray-700">
                  Selected Area
                </h2>
              </div>
              {selectedDivision && selectedDivision !== selectedName && (
                <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">
                  {selectedDivision} Div.
                </span>
              )}
            </div>
            <div className="relative" style={{ height: "200px" }}>
              <MapContainer
                center={[23.8103, 90.4125]}
                zoom={7}
                className="absolute inset-0"
                style={{
                  height: "100%",
                  width: "100%",
                  backgroundColor: "#f0f4f8",
                }}
                zoomControl={true}
                scrollWheelZoom={true}
                dragging={true}
                doubleClickZoom={true}
                attributionControl={false}
              >
                <FitBoundsController feature={selectedFeature} />
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
                  opacity={0.35}
                />
                {geoJSONData && (
                  <GeoJSON
                    key={`secondary-${locationType}-${selectedName || "all"}`}
                    data={getSecondaryMapData()}
                    style={(f) => ({
                      fillColor: getColorForLocation(f),
                      weight: 1,
                      opacity: 0.8,
                      color: "#fff",
                      fillOpacity: 0.6,
                    })}
                  />
                )}
              </MapContainer>

              <div className="absolute bottom-3 left-3 z-400">
                <div className="bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg shadow-md border border-gray-200/60">
                  <p className="text-sm font-bold text-gray-800">
                    {selectedName || "No area selected"}
                  </p>
                  {selectedFeature && (
                    <p className="text-[10px] text-gray-500 capitalize">
                      {locationType}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Forecast Card — ALWAYS VISIBLE */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col flex-1">
            {/* Card header */}
            <div className="px-4 py-3 bg-linear-to-r from-[#0a3d3d] to-[#0d5555] flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <CloudRain className="w-4.5 h-4.5 text-teal-300" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white leading-tight">
                    5-Day Forecast
                  </h3>
                  <p className="text-[11px] text-teal-300/70">
                    {selectedName
                      ? `${selectedName} · ${locationType}`
                      : `Select a ${locationType}`}
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-teal-300/80 bg-white/10 px-2.5 py-1 rounded-full">
                {(() => { const info = getMetricInfo(activeMetric); const MI = info.icon; return <><MI className="w-3 h-3" />{info.label} ({info.unit})</>; })()}
              </span>
            </div>

            {/* Forecast content */}
            <div className="flex-1 overflow-y-auto">
              {isLoadingForecast ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <div className="w-8 h-8 border-[3px] border-teal-200 border-t-teal-600 rounded-full animate-spin" />
                  <p className="text-xs font-medium text-gray-400">
                    Loading forecast data…
                  </p>
                </div>
              ) : forecastError && forecastData.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 px-6 text-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center">
                    <AlertTriangle className="w-6 h-6 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-700">
                      Forecast Unavailable
                    </p>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed max-w-65">
                      {forecastError}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const f = selectedFeature;
                      setSelectedFeature(null);
                      setTimeout(() => setSelectedFeature(f), 50);
                    }}
                    className="mt-1 px-4 py-1.5 text-xs font-semibold text-teal-700 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors border border-teal-200"
                  >
                    Retry
                  </button>
                </div>
              ) : forecastData.length > 0 ? (
                <div className="p-3 space-y-2">
                  {forecastData.map((item, index) => {
                    const metric = item[activeMetric];
                    const avg =
                      metric?.val_avg != null
                        ? parseFloat(metric.val_avg)
                        : null;
                    const min =
                      metric?.val_min != null
                        ? parseFloat(metric.val_min)
                        : null;
                    const max =
                      metric?.val_max != null
                        ? parseFloat(metric.val_max)
                        : null;
                    const { day, date } = formatDate(item.date);
                    const info = getMetricInfo(activeMetric);
                    const MetricIcon = info.icon;

                    return (
                      <div
                        key={index}
                        className={`group flex items-center gap-3 p-3 rounded-xl border transition-all hover:shadow-sm ${
                          index === 0
                            ? `${info.bg} ${info.border}`
                            : "border-gray-100 hover:border-gray-200 bg-white"
                        }`}
                      >
                        {/* Date */}
                        <div className="w-14 shrink-0 text-center">
                          <p
                            className={`text-[10px] font-bold uppercase tracking-wider ${index === 0 ? info.color : "text-gray-400"}`}
                          >
                            {index === 0 ? "Today" : day}
                          </p>
                          <p className="text-xs font-medium text-gray-600 mt-0.5">
                            {date}
                          </p>
                        </div>

                        <div className="w-px h-8 bg-gray-200 shrink-0" />

                        {/* Average */}
                        <div className="flex-1 flex items-center gap-2">
                          <MetricIcon
                            className={`w-4 h-4 shrink-0 ${index === 0 ? info.color : "text-gray-400"}`}
                          />
                          <span
                            className={`text-lg font-bold ${index === 0 ? info.color : "text-gray-800"}`}
                          >
                            {avg != null ? avg.toFixed(1) : "—"}
                          </span>
                          <span className="text-[10px] text-gray-400 font-medium">
                            {info.unit}
                          </span>
                        </div>

                        {/* Min / Max */}
                        {(min != null || max != null) && (
                          <div className="flex items-center gap-2.5 shrink-0">
                            {min != null && (
                              <div
                                className="flex items-center gap-0.5"
                                title="Minimum"
                              >
                                <TrendingDown className="w-3 h-3 text-blue-400" />
                                <span className="text-[11px] font-semibold text-blue-600">
                                  {min.toFixed(1)}
                                </span>
                              </div>
                            )}
                            {max != null && (
                              <div
                                className="flex items-center gap-0.5"
                                title="Maximum"
                              >
                                <TrendingUp className="w-3 h-3 text-red-400" />
                                <span className="text-[11px] font-semibold text-red-500">
                                  {max.toFixed(1)}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-6 text-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-gray-300" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-600">
                      No Forecast Yet
                    </p>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      Select a {locationType} on the map to view its 5-day
                      weather forecast.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-2">
        <p className="text-[11px] text-gray-400">
          Data source: Bangladesh Meteorological Department (BMD) · Updated
          daily
        </p>
      </div>
    </div>
  );
};

export default WeatherForecast;
