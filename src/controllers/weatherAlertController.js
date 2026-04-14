import sequelize from "../config/database.js";
import {
  getForecastLocationOptions,
  getSelectionUpazilas,
} from "../services/upazilaGeometryService.js";

const DHAKA_TIME_ZONE = "Asia/Dhaka";
const MAX_FORECAST_DATE_OFFSET = 9;
const FLOOD_FORECAST_DATE_OFFSET = 2;
const WEATHER_ALERT_CACHE_TTL_MS = 5 * 60 * 1000;

const weatherAlertCache = new Map();
const pointUpazilaCache = new Map();

const ALERT_CONFIG = {
  rainfall: {
    thresholds: [
      { min: 0, max: 22, alert: 1 },
      { min: 22, max: 43, alert: 2 },
      { min: 43, max: 88, alert: 3 },
      { min: 88, max: Infinity, alert: 4 },
    ],
  },
  heat: {
    thresholds: [
      { min: 0, max: 36, alert: 1 },
      { min: 36, max: 38, alert: 2 },
      { min: 38, max: 40, alert: 3 },
      { min: 40, max: 42, alert: 4 },
      { min: 42, max: Infinity, alert: 5 },
    ],
  },
  cold: {
    thresholds: [
      { min: 10, max: Infinity, alert: 1 },
      { min: 8, max: 10, alert: 2 },
      { min: 6, max: 8, alert: 3 },
      { min: 4, max: 6, alert: 4 },
      { min: -Infinity, max: 4, alert: 5 },
    ],
  },
  wind: {
    thresholds: [
      { min: 0, max: 40, alert: 1 },
      { min: 40, max: 60, alert: 2 },
      { min: 60, max: 80, alert: 3 },
      { min: 80, max: Infinity, alert: 4 },
    ],
  },
  flood: {
    thresholds: [
      { min: -Infinity, max: 121.6, alert: 1 },
      { min: 121.6, max: 152, alert: 2 },
      { min: 152, max: Infinity, alert: 3 },
    ],
  },
};

const normalizeNumber = (value) => {
  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? null : numericValue;
};

const getDhakaToday = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: DHAKA_TIME_ZONE,
  }).format(new Date());

const getDhakaRelativeDate = (dateString, offsetDays) => {
  const baseDate = new Date(`${dateString}T12:00:00+06:00`);
  baseDate.setUTCDate(baseDate.getUTCDate() + offsetDays);

  return new Intl.DateTimeFormat("en-CA", {
    timeZone: DHAKA_TIME_ZONE,
  }).format(baseDate);
};

const toDateKey = (value) => new Date(value).toISOString().slice(0, 10);

const getDhakaDayRangeUtc = (dateString) => {
  const startUtc = new Date(`${dateString}T00:00:00+06:00`);
  const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000);

  const toMysqlDateTime = (date) => date.toISOString().slice(0, 19).replace("T", " ");

  return {
    startUtc: toMysqlDateTime(startUtc),
    endUtc: toMysqlDateTime(endUtc),
  };
};

const getSpatialWeight = (latitude) => {
  const numericLatitude = normalizeNumber(latitude);
  if (numericLatitude === null) return null;
  return Math.cos((numericLatitude * Math.PI) / 180);
};

const getAlertFromValue = (alertType, value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return null;
  }

  const numericValue = Number(value);

  if (alertType === "flood") {
    if (numericValue < 121.6) return 1;
    if (numericValue <= 152) return 2;
    return 3;
  }

  const thresholds = ALERT_CONFIG[alertType]?.thresholds || [];

  const matchedThreshold = thresholds.find(
    (threshold) => numericValue >= threshold.min && numericValue < threshold.max
  );

  return matchedThreshold?.alert ?? null;
};

const getForecastTableColumns = async () => {
  const columns = await sequelize.query("SHOW COLUMNS FROM wrf_bangladesh_forecast", {
    type: sequelize.QueryTypes.SELECT,
  });

  return new Set(columns.map((column) => column.Field));
};

const resolveCreatedAtFilter = async (columnSet, dateString) => {
  const dayRange = getDhakaDayRangeUtc(dateString);

  if (!columnSet.has("created_at")) {
    return {
      whereClause: "",
      replacements: {},
      value: null,
    };
  }

  return {
    whereClause: `
      AND created_at >= :createdAtStartUtc
      AND created_at < :createdAtEndUtc
    `,
    replacements: {
      createdAtStartUtc: dayRange.startUtc,
      createdAtEndUtc: dayRange.endUtc,
    },
    value: dateString,
  };
};

const getWeatherAlertCacheKey = ({
  level,
  alertType,
  startDate,
  endDate,
  todayDhaka,
}) => `${todayDhaka}|${level}|${alertType}|${startDate}|${endDate}`;

const getCachedWeatherAlert = (cacheKey) => {
  const cachedEntry = weatherAlertCache.get(cacheKey);
  if (!cachedEntry) return null;

  if (Date.now() - cachedEntry.createdAt > WEATHER_ALERT_CACHE_TTL_MS) {
    weatherAlertCache.delete(cacheKey);
    return null;
  }

  return cachedEntry.payload;
};

const setCachedWeatherAlert = (cacheKey, payload) => {
  weatherAlertCache.set(cacheKey, {
    createdAt: Date.now(),
    payload,
  });

  if (weatherAlertCache.size > 100) {
    const oldestKey = weatherAlertCache.keys().next().value;
    if (oldestKey) {
      weatherAlertCache.delete(oldestKey);
    }
  }
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

  const polygons =
    geometry.type === "Polygon"
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

const resolvePointUpazila = (latitude, longitude) => {
  const pointKey = `${latitude}|${longitude}`;
  if (pointUpazilaCache.has(pointKey)) {
    return pointUpazilaCache.get(pointKey);
  }

  const lat = Number(latitude);
  const lon = Number(longitude);

  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    pointUpazilaCache.set(pointKey, null);
    return null;
  }

  const match =
    getSelectionUpazilas(null).find((upazila) => {
      const bbox = upazila.bbox;
      if (
        lon < bbox.minX ||
        lon > bbox.maxX ||
        lat < bbox.minY ||
        lat > bbox.maxY
      ) {
        return false;
      }

      return isPointInPolygonGeometry([lon, lat], upazila.geometry);
    }) || null;

  pointUpazilaCache.set(pointKey, match);
  return match;
};

const getLevelOptions = (level) => {
  const locations = getForecastLocationOptions();

  if (level === "region") return locations.regions || [];
  if (level === "division") return locations.divisions || [];
  if (level === "district") return locations.districts || [];
  return locations.upazilas || [];
};

const getAreaMetaFromUpazila = (level, upazila) => {
  if (!upazila) return null;

  if (level === "region") {
    const matchedRegion = (getForecastLocationOptions().regions || []).find((region) =>
      (region.districtCodes || []).includes(upazila.districtCode)
    );

    return matchedRegion
      ? {
          id: matchedRegion.code,
          name: matchedRegion.label || matchedRegion.name,
        }
      : null;
  }

  if (level === "division") {
    return {
      id: upazila.divisionCode,
      name: upazila.division,
    };
  }

  if (level === "district") {
    return {
      id: upazila.districtCode,
      name: upazila.district,
    };
  }

  return {
    id: upazila.code,
    name: upazila.label || upazila.name,
  };
};

const buildPointRainfallDayTotals = (rows) => {
  const rowsByPoint = new Map();

  rows.forEach((row) => {
    const pointKey = `${row.latitude}|${row.longitude}`;
    if (!rowsByPoint.has(pointKey)) {
      rowsByPoint.set(pointKey, []);
    }
    rowsByPoint.get(pointKey).push({
      forecast_time: row.forecast_time,
      rainfall: normalizeNumber(row.rainfall),
      latitude: normalizeNumber(row.latitude),
      longitude: normalizeNumber(row.longitude),
    });
  });

  const pointDayRainfallTotals = new Map();

  rowsByPoint.forEach((pointRows, pointKey) => {
    const sortedRows = [...pointRows].sort(
      (a, b) => new Date(a.forecast_time).getTime() - new Date(b.forecast_time).getTime()
    );

    let previousRainfall = null;

    sortedRows.forEach((row) => {
      const currentRainfall = row.rainfall;
      if (currentRainfall === null) {
        previousRainfall = currentRainfall;
        return;
      }

      let rainfallIncrement = 0;
      if (previousRainfall !== null) {
        const delta = currentRainfall - previousRainfall;
        rainfallIncrement = delta >= 0 ? delta : currentRainfall;
      }

      const forecastDate = toDateKey(row.forecast_time);
      const pointDayKey = `${forecastDate}|${pointKey}`;

      if (!pointDayRainfallTotals.has(pointDayKey)) {
        pointDayRainfallTotals.set(pointDayKey, 0);
      }

      pointDayRainfallTotals.set(
        pointDayKey,
        pointDayRainfallTotals.get(pointDayKey) + rainfallIncrement
      );

      previousRainfall = currentRainfall;
    });
  });

  return pointDayRainfallTotals;
};

const buildAlertResponseRows = ({
  level,
  alertType,
  areaMetrics,
}) => {
  const responseRows = getLevelOptions(level).map((option) => {
    const metricValue = areaMetrics.get(option.code) ?? null;
    const alert = getAlertFromValue(alertType, metricValue);
    const keyPrefix = `${level}_`;

    return {
      id: option.code,
      name: option.label || option.name,
      [`${keyPrefix}id`]: option.code,
      [`${keyPrefix}name`]: option.label || option.name,
      alert,
      value:
        metricValue === null || metricValue === undefined || Number.isNaN(Number(metricValue))
          ? null
          : Number(metricValue.toFixed(1)),
    };
  });

  if (level === "region") {
    return responseRows.map((row) => ({
      ...row,
      region_id: row.region_id,
      region_name: row.region_name,
    }));
  }

  return responseRows;
};

export const getLocalWeatherAlert = async (req, res) => {
  try {
    const level = (req.query.level || "district").trim().toLowerCase();
    const alertType = (req.query.alertType || "rainfall").trim().toLowerCase();
    const todayDhaka = getDhakaToday();
    const maxForecastDateOffset =
      alertType === "flood" ? FLOOD_FORECAST_DATE_OFFSET : MAX_FORECAST_DATE_OFFSET;
    const maxSelectableDate = getDhakaRelativeDate(todayDhaka, maxForecastDateOffset);

    let startDate = req.query.startDate?.trim() || todayDhaka;
    let endDate = req.query.endDate?.trim() || startDate;

    if (!["region", "division", "district", "upazila"].includes(level)) {
      return res.status(400).json({
        success: false,
        message: "Invalid alert geography level",
      });
    }

    if (!ALERT_CONFIG[alertType]) {
      return res.status(400).json({
        success: false,
        message: "Unsupported alert type",
      });
    }

    if (startDate < todayDhaka) startDate = todayDhaka;
    if (endDate < startDate) endDate = startDate;
    if (startDate > maxSelectableDate) startDate = maxSelectableDate;
    if (endDate > maxSelectableDate) endDate = maxSelectableDate;

    const cacheKey = getWeatherAlertCacheKey({
      level,
      alertType,
      startDate,
      endDate,
      todayDhaka,
    });
    const cachedPayload = getCachedWeatherAlert(cacheKey);
    if (cachedPayload) {
      return res.status(200).json(cachedPayload);
    }

    const forecastColumns = await getForecastTableColumns();
    const todayBatchInfo = await resolveCreatedAtFilter(forecastColumns, todayDhaka);
    const yesterdayDhaka = getDhakaRelativeDate(todayDhaka, -1);
    const yesterdayBatchInfo = await resolveCreatedAtFilter(forecastColumns, yesterdayDhaka);

    const queryRowsForBatch = async (batchInfo) =>
      sequelize.query(
        `
          SELECT
            forecast_time,
            latitude,
            longitude,
            temperature,
            rainfall,
            wind_speed
          FROM wrf_bangladesh_forecast
          WHERE forecast_time >= :startDate
            AND forecast_time < DATE_ADD(:endDate, INTERVAL 1 DAY)
            ${batchInfo.whereClause}
          ORDER BY forecast_time ASC
        `,
        {
          replacements: {
            startDate,
            endDate,
            ...batchInfo.replacements,
          },
          type: sequelize.QueryTypes.SELECT,
        }
      );

    let batchInfo = todayBatchInfo;
    let rawRows = await queryRowsForBatch(batchInfo);

    if (!rawRows.length && todayBatchInfo.value !== null) {
      batchInfo = yesterdayBatchInfo;
      rawRows = await queryRowsForBatch(batchInfo);
    }

    if (!rawRows.length) {
      const emptyPayload = {
        success: true,
        data: [],
        meta: {
          level,
          alertType,
          startDate,
          endDate,
          todayFilterDate: todayDhaka,
          effectiveImportDate: batchInfo.value,
          fallbackUsed: batchInfo.value === yesterdayDhaka,
        },
      };

      setCachedWeatherAlert(cacheKey, emptyPayload);
      return res.status(200).json(emptyPayload);
    }

    const pointDayRainfallTotals = buildPointRainfallDayTotals(rawRows);
    const pointDayMetrics = new Map();

    rawRows.forEach((row) => {
      const forecastDate = toDateKey(row.forecast_time);
      const pointKey = `${row.latitude}|${row.longitude}`;
      const aggregateKey = `${forecastDate}|${pointKey}`;
      const pointUpazila = resolvePointUpazila(row.latitude, row.longitude);

      if (!pointUpazila) return;

      if (!pointDayMetrics.has(aggregateKey)) {
        pointDayMetrics.set(aggregateKey, {
          forecastDate,
          latitude: normalizeNumber(row.latitude),
          spatialWeight: getSpatialWeight(row.latitude),
          upazila: pointUpazila,
          maxTemperature: -Infinity,
          minTemperature: Infinity,
          maxWindSpeed: -Infinity,
        });
      }

      const aggregate = pointDayMetrics.get(aggregateKey);
      const temperature = normalizeNumber(row.temperature);
      const windSpeed = normalizeNumber(row.wind_speed);

      if (temperature !== null) {
        aggregate.maxTemperature = Math.max(aggregate.maxTemperature, temperature);
        aggregate.minTemperature = Math.min(aggregate.minTemperature, temperature);
      }

      if (windSpeed !== null) {
        aggregate.maxWindSpeed = Math.max(aggregate.maxWindSpeed, windSpeed * 3.6);
      }
    });

    pointDayMetrics.forEach((aggregate, aggregateKey) => {
      aggregate.rainfallTotal = pointDayRainfallTotals.get(aggregateKey) ?? 0;
    });

    const areaDayMetrics = new Map();

    pointDayMetrics.forEach((pointDayMetric) => {
      const areaMeta = getAreaMetaFromUpazila(level, pointDayMetric.upazila);
      if (!areaMeta?.id) return;

      const areaDayKey = `${pointDayMetric.forecastDate}|${areaMeta.id}`;
      if (!areaDayMetrics.has(areaDayKey)) {
        areaDayMetrics.set(areaDayKey, {
          id: areaMeta.id,
          name: areaMeta.name,
          forecastDate: pointDayMetric.forecastDate,
          rainfallWeightedSum: 0,
          rainfallWeightTotal: 0,
          heatWeightedSum: 0,
          heatWeightTotal: 0,
          coldWeightedSum: 0,
          coldWeightTotal: 0,
          windWeightedSum: 0,
          windWeightTotal: 0,
        });
      }

      const areaDayAggregate = areaDayMetrics.get(areaDayKey);
      const weight = pointDayMetric.spatialWeight;

      if (!weight) return;

      if (Number.isFinite(pointDayMetric.rainfallTotal)) {
        areaDayAggregate.rainfallWeightedSum += pointDayMetric.rainfallTotal * weight;
        areaDayAggregate.rainfallWeightTotal += weight;
      }

      if (Number.isFinite(pointDayMetric.maxTemperature)) {
        areaDayAggregate.heatWeightedSum += pointDayMetric.maxTemperature * weight;
        areaDayAggregate.heatWeightTotal += weight;
      }

      if (Number.isFinite(pointDayMetric.minTemperature)) {
        areaDayAggregate.coldWeightedSum += pointDayMetric.minTemperature * weight;
        areaDayAggregate.coldWeightTotal += weight;
      }

      if (Number.isFinite(pointDayMetric.maxWindSpeed)) {
        areaDayAggregate.windWeightedSum += pointDayMetric.maxWindSpeed * weight;
        areaDayAggregate.windWeightTotal += weight;
      }
    });

    const areaMetrics = new Map();

    areaDayMetrics.forEach((areaDayMetric) => {
      const rainfallValue =
        areaDayMetric.rainfallWeightTotal > 0
          ? areaDayMetric.rainfallWeightedSum / areaDayMetric.rainfallWeightTotal
          : null;
      const heatValue =
        areaDayMetric.heatWeightTotal > 0
          ? areaDayMetric.heatWeightedSum / areaDayMetric.heatWeightTotal
          : null;
      const coldValue =
        areaDayMetric.coldWeightTotal > 0
          ? areaDayMetric.coldWeightedSum / areaDayMetric.coldWeightTotal
          : null;
      const windValue =
        areaDayMetric.windWeightTotal > 0
          ? areaDayMetric.windWeightedSum / areaDayMetric.windWeightTotal
          : null;

      if (!areaMetrics.has(areaDayMetric.id)) {
        areaMetrics.set(areaDayMetric.id, null);
      }

      const currentAreaValue = areaMetrics.get(areaDayMetric.id);

      if (alertType === "rainfall" || alertType === "flood") {
        areaMetrics.set(
          areaDayMetric.id,
          (currentAreaValue || 0) + (rainfallValue || 0)
        );
      } else if (alertType === "heat") {
        areaMetrics.set(
          areaDayMetric.id,
          currentAreaValue === null ? heatValue : Math.max(currentAreaValue, heatValue ?? -Infinity)
        );
      } else if (alertType === "cold") {
        areaMetrics.set(
          areaDayMetric.id,
          currentAreaValue === null ? coldValue : Math.min(currentAreaValue, coldValue ?? Infinity)
        );
      } else if (alertType === "wind") {
        areaMetrics.set(
          areaDayMetric.id,
          currentAreaValue === null ? windValue : Math.max(currentAreaValue, windValue ?? -Infinity)
        );
      }
    });

    const payload = {
      success: true,
      data: buildAlertResponseRows({
        level,
        alertType,
        areaMetrics,
      }),
      meta: {
        level,
        alertType,
        startDate,
        endDate,
        todayFilterDate: todayDhaka,
        effectiveImportDate: batchInfo.value,
        fallbackUsed: batchInfo.value === yesterdayDhaka,
      },
    };

    setCachedWeatherAlert(cacheKey, payload);
    return res.status(200).json(payload);
  } catch (error) {
    console.error("Weather Alert Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to build local weather alerts",
    });
  }
};

export const getLocalWeatherAlertLocations = async (_req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: getForecastLocationOptions(),
    });
  } catch (error) {
    console.error("Weather Alert Locations Error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to load alert locations",
    });
  }
};
