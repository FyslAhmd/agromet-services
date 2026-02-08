import { useState, useEffect } from "react";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./WeatherAlert.css";
import {
  CheckCircle,
  AlertTriangle,
  AlertCircle,
  Flame,
  CloudRain,
  Thermometer,
  Wind,
  Snowflake,
  Download,
} from "lucide-react";

import { API_BASE_URL } from "../../config/api";

const WEATHER_API_URL = `${API_BASE_URL}/weather`;

const WeatherAlert = () => {
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [selectedAlert, setSelectedAlert] = useState("rainfall");
  const [selectedLevel, setSelectedLevel] = useState("district");
  const [bangladeshGeoJSON, setBangladeshGeoJSON] = useState(null);
  const [alertData, setAlertData] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [mapCenter] = useState([23.8, 90.3]);
  const [mapZoom] = useState(7.2);
  const [locationsData, setLocationsData] = useState([]);

  // Alert thresholds and colors
  const alertThresholds = {
    rainfall: [
      { level: "no-alert", min: 0, max: 22, color: "#84cc16", label: "No Alert", icon: CheckCircle },
      { level: "moderate", min: 22, max: 43, color: "#eab308", label: "Moderate", icon: AlertTriangle },
      { level: "heavy", min: 43, max: 88, color: "#f97316", label: "Heavy", icon: AlertCircle },
      { level: "extreme", min: 88, max: 1000, color: "#dc2626", label: "Extreme", icon: Flame },
    ],
    heat: [
      { level: "no-alert", min: 0, max: 36, color: "#16a34a", label: "No Alert", icon: CheckCircle },
      { level: "mild", min: 36, max: 38, color: "#84cc16", label: "Mild", icon: CheckCircle },
      { level: "moderate", min: 38, max: 40, color: "#eab308", label: "Moderate", icon: AlertTriangle },
      { level: "severe", min: 40, max: 42, color: "#f97316", label: "Severe", icon: AlertCircle },
      { level: "very-severe", min: 42, max: 100, color: "#dc2626", label: "Very Severe", icon: Flame },
    ],
    cold: [
      { level: "no-alert", min: 10, max: 50, color: "#16a34a", label: "No Alert", icon: CheckCircle },
      { level: "mild", min: 8, max: 10, color: "#84cc16", label: "Mild", icon: CheckCircle },
      { level: "moderate", min: 6, max: 8, color: "#eab308", label: "Moderate", icon: AlertTriangle },
      { level: "severe", min: 4, max: 6, color: "#f97316", label: "Severe", icon: AlertCircle },
      { level: "very-severe", min: -20, max: 4, color: "#dc2626", label: "Very Severe", icon: Flame },
    ],
    wind: [
      { level: "no-alert", min: 0, max: 40, color: "#84cc16", label: "No Alert", icon: CheckCircle },
      { level: "moderate", min: 40, max: 60, color: "#eab308", label: "Moderate", icon: AlertTriangle },
      { level: "severe", min: 60, max: 80, color: "#f97316", label: "Severe", icon: AlertCircle },
      { level: "extreme", min: 80, max: 200, color: "#dc2626", label: "Extreme", icon: Flame },
    ],
  };

  const alertTypes = [
    { id: "rainfall", label: "Heavy Rainfall", unit: "mm", parameter: 1, icon: CloudRain },
    { id: "heat", label: "Heat", unit: "°C", parameter: 21, icon: Thermometer },
    { id: "cold", label: "Cold", unit: "°C", parameter: 22, icon: Snowflake },
    { id: "wind", label: "Wind", unit: "km/h", parameter: 9, icon: Wind },
    { id: "flood", label: "Flood", unit: "wl", parameter: 10, icon: Wind },
  ];

  // Load GeoJSON data based on selected level
  useEffect(() => {
    const geoJSONFile =
      selectedLevel === "upazila" ? "/amd3.json" : "/district_shape.geojson";

    fetch(geoJSONFile)
      .then((response) => response.json())
      .then((data) => setBangladeshGeoJSON(data))
      .catch((error) => console.error("Error loading GeoJSON:", error));
  }, [selectedLevel]);

  // Load locations data from API
  useEffect(() => {
    fetch(`${WEATHER_API_URL}/locations`)
      .then((response) => response.json())
      .then((data) => {
        if (data.success && data.data) {
          const result = data.data.status ? data.data.result : data.data;
          setLocationsData(result);
        }
      })
      .catch((error) => console.error("Error loading locations:", error));
  }, []);

  // Fetch alert data from API
  useEffect(() => {
    if (!bangladeshGeoJSON) return;

    const fetchAlertData = async () => {
      setIsLoading(true);
      try {
        const alertType = alertTypes.find((t) => t.id === selectedAlert);
        const parameter = alertType?.parameter || 1;

        const endpoint =
          selectedLevel === "upazila"
            ? `${WEATHER_API_URL}/alert-upazila?district_id=0&parameter=${parameter}&fdate=${selectedDate}`
            : `${WEATHER_API_URL}/alert-district?parameter=${parameter}&fdate=${selectedDate}`;

        const response = await fetch(endpoint);
        const result = await response.json();

        if (result.success && result.data && result.data.result) {
          const newAlertData = {};

          const nameKey =
            selectedLevel === "upazila" ? "upazila_name" : "district_name";

          result.data.result.forEach((item) => {
            const locationName = item[nameKey];
            if (locationName) {
              let value = 0;

              if (selectedAlert === "rainfall") {
                value = parseFloat(item.val_max) || 0;
              } else if (selectedAlert === "heat") {
                value = parseFloat(item.val_max) || 0;
              } else if (selectedAlert === "cold") {
                value = parseFloat(item.val_min) || 0;
              } else if (selectedAlert === "wind") {
                value = parseFloat(item.val_max) || 0;
              }

              newAlertData[locationName] = {
                value: value,
                color: item.color || "#84cc16",
                alert: item.alert,
                val_min: parseFloat(item.val_min),
                val_avg: parseFloat(item.val_avg),
                val_max: parseFloat(item.val_max),
              };
            }
          });

          setAlertData(newAlertData);
        }
      } catch (error) {
        console.error("Error fetching alert data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlertData();
  }, [selectedDate, selectedAlert, selectedLevel, bangladeshGeoJSON]);

  // Get alert level for a value
  const getAlertLevel = (value) => {
    const thresholds = alertThresholds[selectedAlert];
    for (let i = thresholds.length - 1; i >= 0; i--) {
      if (value >= thresholds[i].min && value <= thresholds[i].max) {
        return thresholds[i];
      }
    }
    return thresholds[0];
  };

  // Calculate summary statistics
  const getSummary = () => {
    const summary = {};
    const thresholds = alertThresholds[selectedAlert];

    thresholds.forEach((threshold) => {
      summary[threshold.level] = {
        count: 0,
        label: threshold.label,
        range: `${threshold.min} – ${threshold.max}`,
        color: threshold.color,
        icon: threshold.icon,
        minValue: threshold.min,
        maxValue: threshold.max,
      };
    });

    Object.values(alertData).forEach((districtData) => {
      const value = districtData.value;
      for (let i = thresholds.length - 1; i >= 0; i--) {
        if (value >= thresholds[i].min && value <= thresholds[i].max) {
          summary[thresholds[i].level].count++;
          break;
        }
      }
    });

    return Object.values(summary);
  };

  // Get filtered GeoJSON
  const getFilteredGeoJSON = () => {
    if (!bangladeshGeoJSON)
      return { type: "FeatureCollection", features: [] };
    return bangladeshGeoJSON;
  };

  // Style function for GeoJSON
  const geoJSONStyle = (feature) => {
    const nameProperty =
      selectedLevel === "upazila" ? "ADM3_EN" : "ADM2_EN";
    const locationName = feature.properties[nameProperty];
    const locationData = alertData[locationName];

    if (!locationData) {
      return {
        fillColor: "#e5e7eb",
        weight: 1,
        opacity: 1,
        color: "#fff",
        fillOpacity: 0.5,
      };
    }

    const level = getAlertLevel(locationData.value);

    return {
      fillColor: level.color,
      weight: 0.5,
      opacity: 1,
      color: "#fff",
      fillOpacity: 0.8,
    };
  };

  // On each feature — popup
  const onEachFeature = (feature, layer) => {
    const nameProperty =
      selectedLevel === "upazila" ? "ADM3_EN" : "ADM2_EN";
    const locationName = feature.properties[nameProperty];
    const locationData = alertData[locationName];

    if (locationData) {
      const unit =
        alertTypes.find((t) => t.id === selectedAlert)?.unit || "";
      const level = getAlertLevel(locationData.value);

      layer.bindPopup(`
        <div style="font-family: system-ui, -apple-system, sans-serif; min-width: 180px;">
          <strong style="font-size: 14px; color: #1f2937;">${locationName}</strong>
          <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #e5e7eb;">
            <div style="color: #4b5563; font-size: 13px; margin-bottom: 6px;">
              Alert Level: <strong style="color: ${level.color};">${level.label}</strong>
            </div>
            <div style="color: #6b7280; font-size: 12px; line-height: 1.6;">
              Min: <strong>${locationData.val_min.toFixed(1)} ${unit}</strong><br/>
              Avg: <strong>${locationData.val_avg.toFixed(1)} ${unit}</strong><br/>
              Max: <strong>${locationData.val_max.toFixed(1)} ${unit}</strong>
            </div>
          </div>
        </div>
      `);
    }
  };

  const summary = getSummary();
  const currentAlertType = alertTypes.find((t) => t.id === selectedAlert);

  return (
    <div className="w-full min-h-full space-y-5">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
            Weather Alert
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Weather alerts &amp; monitoring across Bangladesh
          </p>
        </div>

        {/* Level toggle */}
        <div className="flex items-center gap-0.5 sm:gap-1 bg-white rounded-xl border border-gray-200 p-1 shadow-sm shrink-0">
          {[
            { value: "degion", label: "Region" },
            { value: "division", label: "Division" },
            { value: "district", label: "District" },
            { value: "upazila", label: "Upazila" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => setSelectedLevel(opt.value)}
              className={`flex-1 sm:flex-none px-3 sm:px-4 py-1.5 rounded-lg text-[11px] sm:text-xs font-semibold transition-all duration-150 text-center ${
                selectedLevel === opt.value
                  ? "bg-[#0d4a4a] text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Controls bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        {/* Date picker */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            Date
          </label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all shadow-sm bg-white"
          />
        </div>

        {/* Alert type buttons */}
        <div className="flex gap-1.5 sm:ml-auto flex-wrap">
          {alertTypes.map((type) => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setSelectedAlert(type.id)}
                className={`flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-150 ${
                  selectedAlert === type.id
                    ? "bg-[#0d4a4a] text-white shadow-md"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-gray-300 hover:bg-gray-50 shadow-sm"
                }`}
              >
                <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                {type.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main content — map + summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Map section */}
        <div className="lg:col-span-8 xl:col-span-9">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden weather-alert-map">
            <div className="relative" style={{ height: "calc(100vh - 280px)", minHeight: "450px" }}>
              {!bangladeshGeoJSON ? (
                <div className="h-full flex items-center justify-center bg-gray-50/50">
                  <div className="text-center">
                    <div className="w-10 h-10 border-[3px] border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-sm font-medium text-gray-500">
                      Loading map…
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      Preparing geographic data
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <MapContainer
                    center={mapCenter}
                    zoom={mapZoom}
                    style={{ height: "100%", width: "100%" }}
                    zoomControl={true}
                    scrollWheelZoom={true}
                  >
                    <TileLayer
                      url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
                      opacity={0.35}
                    />
                    <GeoJSON
                      key={`${selectedAlert}-${selectedDate}-${selectedLevel}`}
                      data={getFilteredGeoJSON()}
                      style={geoJSONStyle}
                      onEachFeature={onEachFeature}
                    />
                  </MapContainer>

                  {/* Download button — top-right */}
                  <button
                    className="absolute top-3 right-3 z-400 w-9 h-9 bg-green-500 hover:bg-green-600 text-white rounded-lg shadow-lg flex items-center justify-center transition-all duration-150 hover:scale-105 cursor-pointer"
                    title="Download map"
                  >
                    <Download className="w-4.5 h-4.5" />
                  </button>

                  {/* Legend — floating bottom row */}
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-400">
                    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/60 px-3 py-2 flex items-center gap-3 sm:gap-4">
                      {alertThresholds[selectedAlert].map((t, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <span
                            className="w-3 h-3 rounded-sm shrink-0"
                            style={{ backgroundColor: t.color }}
                          />
                          <span className="text-[10px] text-gray-600 font-medium whitespace-nowrap">
                            {t.label}
                          </span>
                        </div>
                      ))}
                      <div className="flex items-center gap-1.5">
                        <span
                          className="w-3 h-3 rounded-sm shrink-0"
                          style={{ backgroundColor: "#e5e7eb" }}
                        />
                        <span className="text-[10px] text-gray-400 font-medium whitespace-nowrap">
                          No Data
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Loading overlay */}
                  {isLoading && (
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-500">
                      <div className="text-center bg-white rounded-2xl p-6 shadow-xl border border-gray-100">
                        <div className="w-10 h-10 border-[3px] border-teal-200 border-t-teal-600 rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-sm font-semibold text-gray-700">
                          Loading alert data…
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Fetching latest information
                        </p>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Summary sidebar */}
        <div className="lg:col-span-4 xl:col-span-3 space-y-4">
          {/* Summary header card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 bg-linear-to-r from-[#0a3d3d] to-[#0d5555]">
              <h2 className="text-sm font-semibold text-white">
                {selectedLevel === "upazila" ? "Upazila" : "District"} Alert
                Summary
              </h2>
              <p className="text-[11px] text-teal-300/70 mt-0.5">
                Distribution of alert levels
              </p>
            </div>

            <div className="p-4 grid grid-cols-2 gap-3">
              {summary.map((item, index) => {
                const Icon = item.icon;
                return (
                  <div
                    key={index}
                    className="rounded-xl p-3.5 transition-all duration-200 hover:scale-[1.02] hover:shadow-md"
                    style={{
                      background: `linear-gradient(135deg, ${item.color}18, ${item.color}08)`,
                      border: `1px solid ${item.color}30`,
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${item.color}20` }}
                      >
                        <Icon
                          className="w-3.5 h-3.5"
                          style={{ color: item.color }}
                        />
                      </div>
                    </div>
                    <p
                      className="text-2xl font-bold"
                      style={{ color: item.color }}
                    >
                      {item.count}
                    </p>
                    <p className="text-[11px] font-semibold text-gray-600 mt-0.5">
                      {item.label}
                    </p>
                    <p className="text-[9px] text-gray-400 mt-0.5">
                      {item.range} {currentAlertType?.unit}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Alert info card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h3 className="text-xs font-semibold text-gray-700">
                Alert Information
              </h3>
            </div>
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500">
                  Total {selectedLevel}s monitored
                </span>
                <span className="text-sm font-bold text-gray-800">
                  {Object.keys(alertData).length}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500">Selected date</span>
                <span className="text-sm font-bold text-gray-800">
                  {new Date(selectedDate).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500">Alert Parameter</span>
                <span className="text-sm font-bold text-gray-800 capitalize">
                  {selectedAlert}
                </span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                <span className="text-xs text-gray-500">
                  Locations with alerts
                </span>
                <span className="text-sm font-bold text-amber-600">
                  {
                    Object.values(alertData).filter((d) => {
                      const level = getAlertLevel(d.value);
                      return level.level !== "no-alert";
                    }).length
                  }
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pb-2">
        <p className="text-[11px] text-gray-400">
          Data source: Bangladesh Meteorological Department (BMD) · Updated daily
        </p>
      </div>
    </div>
  );
};

export default WeatherAlert;
