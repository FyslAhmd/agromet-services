import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const AMD3_PATH = path.join(__dirname, "..", "..", "client", "public", "amd3.json");

let cachedData = null;

const computeBoundingBox = (geometry) => {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  const visitCoordinates = (coordinates) => {
    if (!Array.isArray(coordinates)) return;

    if (
      coordinates.length >= 2 &&
      typeof coordinates[0] === "number" &&
      typeof coordinates[1] === "number"
    ) {
      const [x, y] = coordinates;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
      return;
    }

    coordinates.forEach(visitCoordinates);
  };

  visitCoordinates(geometry.coordinates);

  return {
    minX,
    minY,
    maxX,
    maxY,
  };
};

const isPointInRing = (point, ring) => {
  const [x, y] = point;
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];

    const intersects =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / ((yj - yi) || Number.EPSILON) + xi;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
};

const isPointInPolygonGeometry = (point, geometry) => {
  if (!geometry?.type || !geometry?.coordinates) {
    return false;
  }

  const polygons = geometry.type === "Polygon"
    ? [geometry.coordinates]
    : geometry.type === "MultiPolygon"
      ? geometry.coordinates
      : [];

  for (const polygon of polygons) {
    if (!polygon.length) continue;

    const [outerRing, ...holes] = polygon;
    if (!isPointInRing(point, outerRing)) {
      continue;
    }

    const insideHole = holes.some((hole) => isPointInRing(point, hole));
    if (!insideHole) {
      return true;
    }
  }

  return false;
};

const buildUpazilaCache = () => {
  const raw = fs.readFileSync(AMD3_PATH, "utf8");
  const geojson = JSON.parse(raw);
  const features = geojson.features || [];

  const nameCounts = new Map();
  features.forEach((feature) => {
    const name = feature.properties?.ADM3_EN?.trim();
    if (!name) return;
    nameCounts.set(name, (nameCounts.get(name) || 0) + 1);
  });

  const upazilas = features
    .map((feature) => {
      const properties = feature.properties || {};
      const name = properties.ADM3_EN?.trim();
      const code = properties.ADM3_PCODE?.trim();
      const district = properties.ADM2_EN?.trim() || "";
      const division = properties.ADM1_EN?.trim() || "";

      if (!name || !code) {
        return null;
      }

      const duplicateName = (nameCounts.get(name) || 0) > 1;
      const label = duplicateName ? `${name}, ${district}` : name;

      return {
        code,
        name,
        label,
        district,
        division,
        geometry: feature.geometry,
        bbox: computeBoundingBox(feature.geometry),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.label.localeCompare(b.label));

  const upazilaMap = new Map(upazilas.map((upazila) => [upazila.code, upazila]));

  return {
    upazilas,
    upazilaMap,
  };
};

const getCache = () => {
  if (!cachedData) {
    cachedData = buildUpazilaCache();
  }

  return cachedData;
};

export const getUpazilaOptions = () => {
  const { upazilas } = getCache();

  return upazilas.map(({ code, name, label, district, division }) => ({
    code,
    name,
    label,
    district,
    division,
  }));
};

export const getUpazilaByCode = (code) => {
  if (!code) return null;
  const { upazilaMap } = getCache();
  return upazilaMap.get(code) || null;
};

export const isPointInsideUpazila = (latitude, longitude, upazila) => {
  if (!upazila) return true;

  const lat = Number(latitude);
  const lon = Number(longitude);

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return false;
  }

  const { bbox } = upazila;
  if (
    lon < bbox.minX ||
    lon > bbox.maxX ||
    lat < bbox.minY ||
    lat > bbox.maxY
  ) {
    return false;
  }

  return isPointInPolygonGeometry([lon, lat], upazila.geometry);
};
