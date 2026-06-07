import { useEffect, useMemo, useState } from "react";
import { GeoJSON, MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapPin } from "lucide-react";

const DEFAULT_MAP_CENTER = [23.8103, 90.4125];
const DEFAULT_MAP_ZOOM = 7;
const MAP_BOUNDS_PADDING = [18, 18];

const DISTRICT_COLORS = [
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

const normalizeName = (value = "") =>
  value
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

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

const getColorForFeature = (feature) => {
  const name = feature?.properties?.label || feature?.properties?.name || "";
  let hash = 0;

  for (let index = 0; index < name.length; index += 1) {
    hash = name.charCodeAt(index) + ((hash << 5) - hash);
  }

  return DISTRICT_COLORS[Math.abs(hash) % DISTRICT_COLORS.length];
};

const MapViewport = ({ selectedFeature }) => {
  const map = useMap();

  useEffect(() => {
    if (!selectedFeature) {
      map.setView(DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM);
      return;
    }

    const layer = L.geoJSON(selectedFeature);
    const bounds = layer?.getBounds?.();

    if (bounds?.isValid?.()) {
      map.fitBounds(bounds, { padding: MAP_BOUNDS_PADDING, maxZoom: 8 });
    }
  }, [map, selectedFeature]);

  return null;
};

const ProjectionMap = ({ district, onDistrictChange }) => {
  const [baseGeoJSON, setBaseGeoJSON] = useState(null);
  const [mapError, setMapError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadMap = async () => {
      try {
        const response = await fetch("/amd3.json");
        const payload = await response.json();

        if (!response.ok) {
          throw new Error("Failed to load district boundaries");
        }

        if (!cancelled) {
          setBaseGeoJSON(payload);
          setMapError("");
        }
      } catch (error) {
        if (!cancelled) {
          console.error("Error loading climate projection map:", error);
          setMapError("Unable to load the district map right now.");
        }
      }
    };

    loadMap();

    return () => {
      cancelled = true;
    };
  }, []);

  const districtFeatures = useMemo(() => {
    if (!baseGeoJSON?.features?.length) return [];

    const upazilaFeatures = baseGeoJSON.features.map((feature) => ({
      ...feature,
      properties: {
        code: feature.properties.ADM3_PCODE,
        name: feature.properties.ADM3_EN,
        district: feature.properties.ADM2_EN,
        districtCode: feature.properties.ADM2_PCODE,
        division: feature.properties.ADM1_EN,
        divisionCode: feature.properties.ADM1_PCODE,
      },
    }));

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
          division: features[0].properties.division,
          divisionCode: features[0].properties.divisionCode,
        })
      )
      .sort((left, right) =>
        (left.properties.label || "").localeCompare(right.properties.label || "")
      );
  }, [baseGeoJSON]);

  const selectedFeature = useMemo(() => {
    if (!district) return null;

    const normalizedDistrict = normalizeName(district);
    return (
      districtFeatures.find(
        (feature) => normalizeName(feature.properties?.label) === normalizedDistrict
      ) || null
    );
  }, [district, districtFeatures]);

  const isSelected = (feature) =>
    normalizeName(feature?.properties?.label) === normalizeName(district);

  const geoJSONStyle = (feature) => ({
    fillColor: getColorForFeature(feature),
    weight: isSelected(feature) ? 2.2 : 1,
    opacity: isSelected(feature) ? 1 : 0.55,
    color: "#ffffff",
    fillOpacity: isSelected(feature) ? 0.92 : 0.55,
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
      click: () => onDistrictChange(label),
      mouseover: (event) => {
        if (!isSelected(feature)) {
          event.target.setStyle({
            fillOpacity: 0.75,
            weight: 1.3,
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

  return (
    <div className="relative flex-1 bg-[#edf5f4]">
      <div className="relative h-full min-h-105">
        {mapError ? (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <p className="text-sm font-medium text-slate-500">{mapError}</p>
          </div>
        ) : (
          <MapContainer
            center={DEFAULT_MAP_CENTER}
            zoom={DEFAULT_MAP_ZOOM}
            zoomControl
            attributionControl={false}
            className="h-full w-full"
            style={{ backgroundColor: "#f0f4f8" }}
          >
            <MapViewport selectedFeature={selectedFeature} />
            <TileLayer
              url="https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png"
              opacity={0.4}
            />
            {districtFeatures.length ? (
              <GeoJSON
                key={`climate-projection-districts-${district || "all"}`}
                data={{ type: "FeatureCollection", features: districtFeatures }}
                style={geoJSONStyle}
                onEachFeature={onEachFeature}
              />
            ) : null}
          </MapContainer>
        )}
      </div>
    </div>
  );
};

export default ProjectionMap;
