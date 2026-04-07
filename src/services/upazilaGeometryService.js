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
      const districtCode = properties.ADM2_PCODE?.trim() || "";
      const district = properties.ADM2_EN?.trim() || "";
      const divisionCode = properties.ADM1_PCODE?.trim() || "";
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
        level: "upazila",
        divisionCode,
        districtCode,
        district,
        division,
        geometry: feature.geometry,
        bbox: computeBoundingBox(feature.geometry),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.label.localeCompare(b.label));

  const upazilaMap = new Map(upazilas.map((upazila) => [upazila.code, upazila]));

  const divisionMap = new Map();
  const districtMap = new Map();

  upazilas.forEach((upazila) => {
    if (upazila.divisionCode && !divisionMap.has(upazila.divisionCode)) {
      divisionMap.set(upazila.divisionCode, {
        code: upazila.divisionCode,
        name: upazila.division,
        label: upazila.division,
        level: "division",
      });
    }

    if (upazila.districtCode && !districtMap.has(upazila.districtCode)) {
      districtMap.set(upazila.districtCode, {
        code: upazila.districtCode,
        name: upazila.district,
        label: upazila.district,
        level: "district",
        divisionCode: upazila.divisionCode,
        division: upazila.division,
      });
    }
  });

  const divisions = Array.from(divisionMap.values()).sort((a, b) => a.label.localeCompare(b.label));
  const districts = Array.from(districtMap.values()).sort((a, b) => a.label.localeCompare(b.label));

  return {
    divisions,
    divisionMap,
    districts,
    districtMap,
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

  return upazilas.map(
    ({
      code,
      name,
      label,
      divisionCode,
      districtCode,
      district,
      division,
    }) => ({
      code,
      name,
      label,
      divisionCode,
      districtCode,
      district,
      division,
    })
  );
};

export const getDivisionOptions = () => {
  const { divisions } = getCache();
  return divisions;
};

export const getDistrictOptions = () => {
  const { districts } = getCache();
  return districts;
};

export const getUpazilaByCode = (code) => {
  if (!code) return null;
  const { upazilaMap } = getCache();
  return upazilaMap.get(code) || null;
};

export const getDistrictByCode = (code) => {
  if (!code) return null;
  const { districtMap } = getCache();
  return districtMap.get(code) || null;
};

export const getDivisionByCode = (code) => {
  if (!code) return null;
  const { divisionMap } = getCache();
  return divisionMap.get(code) || null;
};

export const getForecastLocationOptions = () => ({
  divisions: getDivisionOptions(),
  districts: getDistrictOptions(),
  upazilas: getUpazilaOptions(),
});

export const resolveForecastSelection = (selectionType, selectionCode) => {
  if (!selectionType || !selectionCode) {
    return null;
  }

  const normalizedType = selectionType.trim().toLowerCase();

  if (normalizedType === "division") {
    return getDivisionByCode(selectionCode);
  }

  if (normalizedType === "district") {
    return getDistrictByCode(selectionCode);
  }

  if (normalizedType === "upazila") {
    return getUpazilaByCode(selectionCode);
  }

  return null;
};

export const getSelectionUpazilas = (selection) => {
  const { upazilas } = getCache();

  if (!selection) {
    return upazilas;
  }

  if (selection.level === "division") {
    return upazilas.filter((upazila) => upazila.divisionCode === selection.code);
  }

  if (selection.level === "district") {
    return upazilas.filter((upazila) => upazila.districtCode === selection.code);
  }

  if (selection.level === "upazila") {
    return upazilas.filter((upazila) => upazila.code === selection.code);
  }

  return [];
};

const computeCombinedBoundingBox = (upazilas) => {
  if (!upazilas.length) return null;

  return upazilas.reduce(
    (combined, upazila) => ({
      minX: Math.min(combined.minX, upazila.bbox.minX),
      minY: Math.min(combined.minY, upazila.bbox.minY),
      maxX: Math.max(combined.maxX, upazila.bbox.maxX),
      maxY: Math.max(combined.maxY, upazila.bbox.maxY),
    }),
    {
      minX: Infinity,
      minY: Infinity,
      maxX: -Infinity,
      maxY: -Infinity,
    }
  );
};

export const getSelectionMeta = (selection) => {
  if (!selection) return null;

  const memberUpazilas = getSelectionUpazilas(selection);
  const firstUpazila = memberUpazilas[0] || null;
  const bbox =
    selection.level === "upazila" ? selection.bbox : computeCombinedBoundingBox(memberUpazilas);

  return {
    ...selection,
    bbox,
    memberCount: memberUpazilas.length,
    district: selection.level === "district" ? selection.name : firstUpazila?.district || null,
    division:
      selection.level === "division"
        ? selection.name
        : selection.level === "district"
          ? selection.division
          : firstUpazila?.division || null,
  };
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

export const isPointInsideSelection = (latitude, longitude, selection) => {
  if (!selection) return true;

  const lat = Number(latitude);
  const lon = Number(longitude);

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return false;
  }

  const memberUpazilas = getSelectionUpazilas(selection);
  if (!memberUpazilas.length) {
    return false;
  }

  const selectionMeta = getSelectionMeta(selection);
  const bbox = selectionMeta?.bbox;

  if (
    bbox &&
    (lon < bbox.minX || lon > bbox.maxX || lat < bbox.minY || lat > bbox.maxY)
  ) {
    return false;
  }

  return memberUpazilas.some((upazila) => isPointInsideUpazila(lat, lon, upazila));
};

export const getSelectionMatcher = (selection) => {
  if (!selection) {
    return () => true;
  }

  const memberUpazilas = getSelectionUpazilas(selection);
  const selectionMeta = getSelectionMeta(selection);
  const bbox = selectionMeta?.bbox || null;

  return (latitude, longitude) => {
    const lat = Number(latitude);
    const lon = Number(longitude);

    if (Number.isNaN(lat) || Number.isNaN(lon) || !memberUpazilas.length) {
      return false;
    }

    if (
      bbox &&
      (lon < bbox.minX || lon > bbox.maxX || lat < bbox.minY || lat > bbox.maxY)
    ) {
      return false;
    }

    return memberUpazilas.some((upazila) => isPointInsideUpazila(lat, lon, upazila));
  };
};
