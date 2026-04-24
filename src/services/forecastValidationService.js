import axios from "axios";
import sequelize from "../config/database.js";
import ForecastValidationRun from "../models/ForecastValidationRun.js";
import ForecastValidationRecord from "../models/ForecastValidationRecord.js";
import {
  getForecastLocationOptions,
  getSelectionMatcher,
  getSelectionMeta,
  resolveForecastSelection,
} from "./upazilaGeometryService.js";

const DHAKA_TIME_ZONE = "Asia/Dhaka";
const SAADS_API_BASE_URL = "https://saads.brri.gov.bd/api";
const VALIDATION_PARAMETERS = [
  { key: "max_temperature", label: "Max Temperature", unit: "°C", decimals: 2 },
  { key: "min_temperature", label: "Min Temperature", unit: "°C", decimals: 2 },
  { key: "average_temperature", label: "Average Temperature", unit: "°C", decimals: 2 },
  { key: "rainfall", label: "Rainfall", unit: "mm", decimals: 2 },
  { key: "relative_humidity", label: "Relative Humidity", unit: "%", decimals: 2 },
  { key: "wind_speed", label: "Wind Speed", unit: "km/h", decimals: 2 },
  { key: "wind_direction", label: "Wind Direction", unit: "°", decimals: 2 },
  { key: "solar_radiation", label: "Solar Radiation", unit: "W/m²", decimals: 2 },
  { key: "sunshine_hour", label: "Sunshine Hour", unit: "h", decimals: 2 },
];

const ANGSTROM_PRESCOTT_A = 0.25;
const ANGSTROM_PRESCOTT_B = 0.5;
const SOLAR_RADIATION_WATTS_TO_MJ_PER_DAY = 0.0864;

const STATION_DEFINITIONS = [
  { stationId: "42", stationName: "BRRI R/S Habiganj", label: "Habiganj", scope: "district", forecastName: "Habiganj" },
  { stationId: "98", stationName: "BRRI R/S Faridpur", label: "Faridpur", scope: "district", forecastName: "Faridpur" },
  { stationId: "122", stationName: "BRRI R/S Gopalganj", label: "Gopalganj", scope: "district", forecastName: "Gopalganj" },
  { stationId: "124", stationName: "BRRI R/S Kushtia", label: "Kushtia", scope: "district", forecastName: "Kushtia" },
  { stationId: "126", stationName: "BRRI R/S Rajshahi", label: "Rajshahi", scope: "district", forecastName: "Rajshahi" },
  { stationId: "137", stationName: "BRRI R/S Cumilla", label: "Cumilla", scope: "district", forecastName: "Comilla" },
  { stationId: "147", stationName: "BRRI R/S Rangpur", label: "Rangpur", scope: "district", forecastName: "Rangpur" },
  { stationId: "310", stationName: "BRRI R/S Sirajganj", label: "Sirajganj", scope: "district", forecastName: "Sirajganj" },
  { stationId: "352", stationName: "BRRI R/S Barishal", label: "Barishal", scope: "district", forecastName: "Barisal" },
  { stationId: "375", stationName: "BRRI R/S Satkhira", label: "Satkhira", scope: "district", forecastName: "Satkhira" },
  { stationId: "383", stationName: "BRRI R/S Sonagazi", label: "Sonagazi", scope: "upazila", forecastName: "Sonagazi" },
  { stationId: "415", stationName: "BRRI HQ Gazipur", label: "Gazipur", scope: "district", forecastName: "Gazipur" },
];

const AWS_MEASURES = {
  airTemperature: "Air Temperature",
  rainfall: "Accumulated Rain 1h",
  humidity: "Air Humidity",
  windSpeed: "Wind Speed Gust",
  windDirection: "Wind Direction Gust",
  solarRadiation: "Solar Radiation",
  sunshineDuration: "Sunshine Duration",
};

const normalizeName = (value = "") => value.trim().toLowerCase().replace(/\s+/g, " ");

const normalizeNumber = (value) => {
  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? null : numericValue;
};

const roundValue = (value, decimals = 4) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return null;
  const factor = 10 ** decimals;
  return Math.round(Number(value) * factor) / factor;
};

const dateKeyFromParts = (year, month, day) =>
  `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;

const getDhakaToday = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: DHAKA_TIME_ZONE }).format(new Date());

const getDhakaDateParts = (dateString) => {
  const [year, month, day] = dateString.split("-").map(Number);
  return { year, month, day };
};

const getDaysInMonth = (year, month) => new Date(Date.UTC(year, month, 0)).getUTCDate();

const getDhakaDayRangeUtc = (dateString) => {
  const startUtc = new Date(`${dateString}T00:00:00+06:00`);
  const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000);
  const toMysqlDateTime = (date) => date.toISOString().slice(0, 19).replace("T", " ");

  return {
    startUtc: toMysqlDateTime(startUtc),
    endUtc: toMysqlDateTime(endUtc),
  };
};

const getForecastDateKey = (row) =>
  row?.forecast_date || new Date(row.forecast_time).toISOString().slice(0, 10);

const getForecastHour = (row) => {
  const parsedHour = Number.parseInt(row?.forecast_hour, 10);
  if (!Number.isNaN(parsedHour) && parsedHour >= 0 && parsedHour <= 23) return parsedHour;
  if (!row?.forecast_time) return null;
  const fallbackDate = new Date(row.forecast_time);
  return Number.isNaN(fallbackDate.getTime()) ? null : fallbackDate.getHours();
};

const getSpatialWeight = (latitude) => {
  const normalizedLatitude = normalizeNumber(latitude);
  if (normalizedLatitude === null) return null;
  return Math.cos((normalizedLatitude * Math.PI) / 180);
};

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const getDayOfYear = (dateString) => {
  const date = new Date(`${dateString}T00:00:00Z`);
  const start = new Date(Date.UTC(date.getUTCFullYear(), 0, 0));
  return Math.floor((date.getTime() - start.getTime()) / (24 * 60 * 60 * 1000));
};

const calculateSunshineHour = ({ solarRadiationWatts, latitude, forecastDate }) => {
  const normalizedSolarRadiation = normalizeNumber(solarRadiationWatts);
  const normalizedLatitude = normalizeNumber(latitude);
  if (normalizedSolarRadiation === null || normalizedLatitude === null || !forecastDate) return null;

  const dayOfYear = getDayOfYear(forecastDate);
  const latitudeRadians = (normalizedLatitude * Math.PI) / 180;
  const inverseRelativeDistance = 1 + 0.033 * Math.cos((2 * Math.PI * dayOfYear) / 365);
  const solarDeclination = 0.409 * Math.sin((2 * Math.PI * dayOfYear) / 365 - 1.39);
  const sunsetHourAngle = Math.acos(
    clamp(-Math.tan(latitudeRadians) * Math.tan(solarDeclination), -1, 1)
  );
  const maximumDayLength = (24 / Math.PI) * sunsetHourAngle;
  const extraterrestrialRadiation =
    ((24 * 60) / Math.PI) *
    0.082 *
    inverseRelativeDistance *
    (
      sunsetHourAngle * Math.sin(latitudeRadians) * Math.sin(solarDeclination) +
      Math.cos(latitudeRadians) * Math.cos(solarDeclination) * Math.sin(sunsetHourAngle)
    );

  if (extraterrestrialRadiation <= 0 || maximumDayLength <= 0) return null;

  const solarRadiationMjPerDay = normalizedSolarRadiation * SOLAR_RADIATION_WATTS_TO_MJ_PER_DAY;
  const relativeSunshineDuration =
    (solarRadiationMjPerDay / extraterrestrialRadiation - ANGSTROM_PRESCOTT_A) /
    ANGSTROM_PRESCOTT_B;

  return clamp(relativeSunshineDuration, 0, 1) * maximumDayLength;
};

export const getForecastValidationStations = () => STATION_DEFINITIONS.map((station) => ({ ...station }));

export const resolveForecastValidationStation = (stationDefinition) => {
  const options = getForecastLocationOptions();
  const collection = stationDefinition.scope === "upazila" ? options.upazilas : options.districts;
  const matched = collection.find(
    (item) => normalizeName(item.name) === normalizeName(stationDefinition.forecastName)
      || normalizeName(item.label) === normalizeName(stationDefinition.forecastName)
  );

  if (!matched) {
    throw new Error(`Forecast geography not found for ${stationDefinition.label}`);
  }

  const selection = resolveForecastSelection(stationDefinition.scope, matched.code);
  const meta = getSelectionMeta(selection);

  return {
    ...stationDefinition,
    forecastCode: matched.code,
    forecastLabel: meta?.label || matched.label || matched.name,
    selectedSelection: selection,
    selectedSelectionMeta: meta,
  };
};

export const getForecastValidationWindow = (runDate = getDhakaToday()) => {
  const { year, month, day } = getDhakaDateParts(runDate);
  const daysInMonth = getDaysInMonth(year, month);
  const isFinalDay = day === 30 || day === daysInMonth;

  if (day === 10) {
    return {
      runDate,
      windowStartDate: dateKeyFromParts(year, month, 1),
      windowEndDate: dateKeyFromParts(year, month, 10),
      forecastCreatedAtDate: dateKeyFromParts(year, month, 1),
      scheduled: true,
    };
  }

  if (day === 20) {
    return {
      runDate,
      windowStartDate: dateKeyFromParts(year, month, 11),
      windowEndDate: dateKeyFromParts(year, month, 20),
      forecastCreatedAtDate: dateKeyFromParts(year, month, 11),
      scheduled: true,
    };
  }

  if (isFinalDay) {
    return {
      runDate,
      windowStartDate: dateKeyFromParts(year, month, 21),
      windowEndDate: dateKeyFromParts(year, month, Math.min(day, daysInMonth)),
      forecastCreatedAtDate: dateKeyFromParts(year, month, 21),
      scheduled: true,
    };
  }

  return {
    runDate,
    windowStartDate: dateKeyFromParts(year, month, day <= 10 ? 1 : day <= 20 ? 11 : 21),
    windowEndDate: runDate,
    forecastCreatedAtDate: dateKeyFromParts(year, month, day <= 10 ? 1 : day <= 20 ? 11 : 21),
    scheduled: false,
  };
};

const buildPointRainfallDayTotals = (rows) => {
  const rowsByPoint = new Map();
  rows.forEach((row) => {
    const pointKey = `${row.latitude}|${row.longitude}`;
    if (!rowsByPoint.has(pointKey)) rowsByPoint.set(pointKey, []);
    rowsByPoint.get(pointKey).push(row);
  });

  const pointDayRainfallTotals = new Map();
  rowsByPoint.forEach((pointRows, pointKey) => {
    const sortedRows = [...pointRows].sort(
      (a, b) => new Date(a.forecast_time).getTime() - new Date(b.forecast_time).getTime()
    );
    let previousRainfall = null;

    sortedRows.forEach((row) => {
      const currentRainfall = normalizeNumber(row.rainfall);
      if (currentRainfall === null) {
        previousRainfall = currentRainfall;
        return;
      }

      let rainfallIncrement = 0;
      if (previousRainfall !== null) {
        const delta = currentRainfall - previousRainfall;
        rainfallIncrement = delta >= 0 ? delta : currentRainfall;
      }

      const forecastDate = getForecastDateKey(row);
      const pointDayKey = `${forecastDate}|${pointKey}`;
      pointDayRainfallTotals.set(
        pointDayKey,
        (pointDayRainfallTotals.get(pointDayKey) || 0) + rainfallIncrement
      );
      previousRainfall = currentRainfall;
    });
  });

  return pointDayRainfallTotals;
};

const getForecastAggregates = async ({ station, windowStartDate, windowEndDate, forecastCreatedAtDate }) => {
  const createdAtRange = getDhakaDayRangeUtc(forecastCreatedAtDate);
  const meta = station.selectedSelectionMeta;
  const bboxFilterClause = meta?.bbox
    ? `
        AND latitude >= :bboxMinLat
        AND latitude <= :bboxMaxLat
        AND longitude >= :bboxMinLon
        AND longitude <= :bboxMaxLon
      `
    : "";

  const rawRows = await sequelize.query(
    `
      SELECT
        forecast_time,
        DATE(forecast_time) AS forecast_date,
        HOUR(forecast_time) AS forecast_hour,
        latitude,
        longitude,
        temperature,
        rainfall,
        humidity,
        wind_speed,
        wind_direction,
        solar_radiation
      FROM wrf_bangladesh_forecast
      WHERE forecast_time >= :windowStartDate
        AND forecast_time < DATE_ADD(:windowEndDate, INTERVAL 1 DAY)
        AND created_at >= :createdAtStartUtc
        AND created_at < :createdAtEndUtc
        ${bboxFilterClause}
      ORDER BY forecast_time ASC
    `,
    {
      replacements: {
        windowStartDate,
        windowEndDate,
        createdAtStartUtc: createdAtRange.startUtc,
        createdAtEndUtc: createdAtRange.endUtc,
        ...(meta?.bbox
          ? {
              bboxMinLat: meta.bbox.minY,
              bboxMaxLat: meta.bbox.maxY,
              bboxMinLon: meta.bbox.minX,
              bboxMaxLon: meta.bbox.maxX,
            }
          : {}),
      },
      type: sequelize.QueryTypes.SELECT,
    }
  );

  const selectionMatcher = getSelectionMatcher(station.selectedSelection);
  const rows = rawRows.filter((row) => selectionMatcher(row.latitude, row.longitude));
  const rainfallTotals = buildPointRainfallDayTotals(rows);
  const pointDayAccumulator = new Map();

  rows.forEach((row) => {
    const forecastDate = getForecastDateKey(row);
    const pointKey = `${forecastDate}|${row.latitude}|${row.longitude}`;
    if (!pointDayAccumulator.has(pointKey)) {
      pointDayAccumulator.set(pointKey, {
        forecastDate,
        latitude: normalizeNumber(row.latitude),
        spatialWeight: getSpatialWeight(row.latitude),
        maxTemperature: -Infinity,
        minTemperature: Infinity,
        temperatureSum: 0,
        temperatureCount: 0,
        rainfallTotal: 0,
        humiditySum: 0,
        humidityCount: 0,
        windSpeedSum: 0,
        windSpeedCount: 0,
        windDirectionSinSum: 0,
        windDirectionCosSum: 0,
        windDirectionCount: 0,
        solarRadiationSum: 0,
        solarRadiationCount: 0,
      });
    }

    const aggregate = pointDayAccumulator.get(pointKey);
    const temperature = normalizeNumber(row.temperature);
    const humidity = normalizeNumber(row.humidity);
    const windSpeed = normalizeNumber(row.wind_speed);
    const windDirection = normalizeNumber(row.wind_direction);
    const solarRadiation = normalizeNumber(row.solar_radiation);

    if (temperature !== null) {
      aggregate.maxTemperature = Math.max(aggregate.maxTemperature, temperature);
      aggregate.minTemperature = Math.min(aggregate.minTemperature, temperature);
      aggregate.temperatureSum += temperature;
      aggregate.temperatureCount += 1;
    }
    if (humidity !== null) {
      aggregate.humiditySum += humidity;
      aggregate.humidityCount += 1;
    }
    if (windSpeed !== null) {
      aggregate.windSpeedSum += windSpeed;
      aggregate.windSpeedCount += 1;
    }
    if (windDirection !== null) {
      aggregate.windDirectionSinSum += Math.sin((windDirection * Math.PI) / 180);
      aggregate.windDirectionCosSum += Math.cos((windDirection * Math.PI) / 180);
      aggregate.windDirectionCount += 1;
    }
    if (solarRadiation !== null) {
      aggregate.solarRadiationSum += solarRadiation;
      aggregate.solarRadiationCount += 1;
    }
  });

  pointDayAccumulator.forEach((pointAggregate, key) => {
    pointAggregate.rainfallTotal = rainfallTotals.get(key) || 0;
  });

  const dailyAccumulator = new Map();
  pointDayAccumulator.forEach((pointAggregate) => {
    const weight = pointAggregate.spatialWeight;
    if (weight === null || Number.isNaN(weight) || weight <= 0) return;

    if (!dailyAccumulator.has(pointAggregate.forecastDate)) {
      dailyAccumulator.set(pointAggregate.forecastDate, {
        sums: {},
        weights: {},
        windDirectionSinSum: 0,
        windDirectionCosSum: 0,
        windDirectionWeightTotal: 0,
      });
    }

    const daily = dailyAccumulator.get(pointAggregate.forecastDate);
    const addWeighted = (key, value) => {
      if (value === null || value === undefined || Number.isNaN(Number(value))) return;
      daily.sums[key] = (daily.sums[key] || 0) + weight * Number(value);
      daily.weights[key] = (daily.weights[key] || 0) + weight;
    };

    addWeighted("max_temperature", Number.isFinite(pointAggregate.maxTemperature) ? pointAggregate.maxTemperature : null);
    addWeighted("min_temperature", Number.isFinite(pointAggregate.minTemperature) ? pointAggregate.minTemperature : null);
    addWeighted(
      "average_temperature",
      pointAggregate.temperatureCount ? pointAggregate.temperatureSum / pointAggregate.temperatureCount : null
    );
    addWeighted("rainfall", pointAggregate.rainfallTotal);
    addWeighted("relative_humidity", pointAggregate.humidityCount ? pointAggregate.humiditySum / pointAggregate.humidityCount : null);
    addWeighted("wind_speed", pointAggregate.windSpeedCount ? (pointAggregate.windSpeedSum / pointAggregate.windSpeedCount) * 3.6 : null);

    if (pointAggregate.windDirectionCount) {
      const pointWindDirection = Math.atan2(
        pointAggregate.windDirectionSinSum,
        pointAggregate.windDirectionCosSum
      );
      daily.windDirectionSinSum += weight * Math.sin(pointWindDirection);
      daily.windDirectionCosSum += weight * Math.cos(pointWindDirection);
      daily.windDirectionWeightTotal += weight;
    }

    if (pointAggregate.solarRadiationCount) {
      const solarAverage = pointAggregate.solarRadiationSum / pointAggregate.solarRadiationCount;
      addWeighted("solar_radiation", solarAverage);
      addWeighted(
        "sunshine_hour",
        calculateSunshineHour({
          solarRadiationWatts: solarAverage,
          latitude: pointAggregate.latitude,
          forecastDate: pointAggregate.forecastDate,
        })
      );
    }
  });

  const dailyValues = new Map();
  dailyAccumulator.forEach((daily, date) => {
    const valueFor = (key) => daily.weights[key] ? daily.sums[key] / daily.weights[key] : null;
    let windDirection = null;
    if (daily.windDirectionWeightTotal) {
      windDirection =
        ((Math.atan2(daily.windDirectionSinSum, daily.windDirectionCosSum) * 180) / Math.PI + 360) %
        360;
    }

    dailyValues.set(date, {
      max_temperature: valueFor("max_temperature"),
      min_temperature: valueFor("min_temperature"),
      average_temperature: valueFor("average_temperature"),
      rainfall: valueFor("rainfall"),
      relative_humidity: valueFor("relative_humidity"),
      wind_speed: valueFor("wind_speed"),
      wind_direction: windDirection,
      solar_radiation: valueFor("solar_radiation"),
      sunshine_hour: valueFor("sunshine_hour"),
    });
  });

  return dailyValues;
};

const parseAwsDateKey = (dateValue) => {
  if (!dateValue || typeof dateValue !== "string") return null;
  return dateValue.slice(0, 10);
};

const fetchAwsMeasure = async ({ stationId, measure, startDate, endDate }) => {
  const url = `${SAADS_API_BASE_URL}/research-measures/station/${stationId}/parameter/${encodeURIComponent(measure)}`;
  const response = await axios.get(url, {
    params: {
      startDate,
      endDate,
      interval: 1,
    },
    timeout: 30000,
  });

  return Array.isArray(response.data) ? response.data : [];
};

const addObservedSeries = (target, rows, measureKey) => {
  rows.forEach((row) => {
    const date = parseAwsDateKey(row.date_value);
    const value = normalizeNumber(row.last_value);
    if (!date || value === null) return;
    if (!target.has(date)) target.set(date, {});
    if (!target.get(date)[measureKey]) target.get(date)[measureKey] = [];
    target.get(date)[measureKey].push(value);
  });
};

const average = (values = []) =>
  values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : null;

const getObservedAggregates = async ({ stationId, windowStartDate, windowEndDate }) => {
  const observedMap = new Map();

  await Promise.all(
    Object.entries(AWS_MEASURES).map(async ([measureKey, measure]) => {
      try {
        const rows = await fetchAwsMeasure({
          stationId,
          measure,
          startDate: windowStartDate,
          endDate: windowEndDate,
        });
        addObservedSeries(observedMap, rows, measureKey);
      } catch (error) {
        console.error("[forecast-validation] AWS measure fetch failed", {
          stationId,
          measure,
          message: error.message,
        });
      }
    })
  );

  const dailyValues = new Map();
  observedMap.forEach((series, date) => {
    const temperatureValues = series.airTemperature || [];
    const rainfallValues = series.rainfall || [];
    const windSpeedAverage = average(series.windSpeed);

    dailyValues.set(date, {
      max_temperature: temperatureValues.length ? Math.max(...temperatureValues) : null,
      min_temperature: temperatureValues.length ? Math.min(...temperatureValues) : null,
      average_temperature: average(temperatureValues),
      rainfall: rainfallValues.length ? rainfallValues.reduce((sum, value) => sum + value, 0) : null,
      relative_humidity: average(series.humidity),
      wind_speed: windSpeedAverage === null ? null : windSpeedAverage * 3.6,
      wind_direction: average(series.windDirection),
      solar_radiation: average(series.solarRadiation),
      sunshine_hour: average(series.sunshineDuration),
    });
  });

  return dailyValues;
};

const enumerateDates = (startDate, endDate) => {
  const dates = [];
  const cursor = new Date(`${startDate}T12:00:00+06:00`);
  const end = new Date(`${endDate}T12:00:00+06:00`);

  while (cursor <= end) {
    dates.push(new Intl.DateTimeFormat("en-CA", { timeZone: DHAKA_TIME_ZONE }).format(cursor));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return dates;
};

const buildRecord = ({ runId, station, date, parameterConfig, forecastValue, observedValue }) => {
  const hasForecast = forecastValue !== null && forecastValue !== undefined && !Number.isNaN(Number(forecastValue));
  const hasObserved = observedValue !== null && observedValue !== undefined && !Number.isNaN(Number(observedValue));
  const difference = hasForecast && hasObserved ? Number(forecastValue) - Number(observedValue) : null;
  const absoluteError = difference === null ? null : Math.abs(difference);
  const percentError = hasObserved && Number(observedValue) !== 0
    ? (absoluteError / Math.abs(Number(observedValue))) * 100
    : null;

  return {
    run_id: runId,
    station_id: station.stationId,
    station_name: station.stationName,
    forecast_scope: station.scope,
    forecast_code: station.forecastCode,
    forecast_label: station.forecastLabel,
    date,
    parameter: parameterConfig.label,
    unit: parameterConfig.unit,
    forecast_value: roundValue(forecastValue),
    observed_value: roundValue(observedValue),
    difference: roundValue(difference),
    absolute_error: roundValue(absoluteError),
    percent_error: roundValue(percentError),
  };
};

export const runForecastValidation = async ({ runDate = getDhakaToday() } = {}) => {
  const windowInfo = getForecastValidationWindow(runDate);
  const transaction = await sequelize.transaction();
  let run;

  try {
    const [existingRun] = await ForecastValidationRun.findOrCreate({
      where: { run_date: windowInfo.runDate },
      defaults: {
        run_date: windowInfo.runDate,
        window_start_date: windowInfo.windowStartDate,
        window_end_date: windowInfo.windowEndDate,
        forecast_created_at_date: windowInfo.forecastCreatedAtDate,
        status: "running",
        message: "Validation run started",
      },
      transaction,
    });

    run = existingRun;
    await run.update(
      {
        window_start_date: windowInfo.windowStartDate,
        window_end_date: windowInfo.windowEndDate,
        forecast_created_at_date: windowInfo.forecastCreatedAtDate,
        status: "running",
        message: "Validation run started",
      },
      { transaction }
    );
    await ForecastValidationRecord.destroy({ where: { run_id: run.id }, transaction });
    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }

  try {
    const records = [];
    const dates = enumerateDates(windowInfo.windowStartDate, windowInfo.windowEndDate);
    const stations = STATION_DEFINITIONS.map(resolveForecastValidationStation);

    for (const station of stations) {
      const [forecastValues, observedValues] = await Promise.all([
        getForecastAggregates({
          station,
          windowStartDate: windowInfo.windowStartDate,
          windowEndDate: windowInfo.windowEndDate,
          forecastCreatedAtDate: windowInfo.forecastCreatedAtDate,
        }),
        getObservedAggregates({
          stationId: station.stationId,
          windowStartDate: windowInfo.windowStartDate,
          windowEndDate: windowInfo.windowEndDate,
        }),
      ]);

      dates.forEach((date) => {
        const forecastDayValues = forecastValues.get(date) || {};
        const observedDayValues = observedValues.get(date) || {};
        VALIDATION_PARAMETERS.forEach((parameterConfig) => {
          records.push(
            buildRecord({
              runId: run.id,
              station,
              date,
              parameterConfig,
              forecastValue: forecastDayValues[parameterConfig.key] ?? null,
              observedValue: observedDayValues[parameterConfig.key] ?? null,
            })
          );
        });
      });
    }

    if (records.length) {
      await ForecastValidationRecord.bulkCreate(records);
    }

    await run.update({
      status: "completed",
      message: `Stored ${records.length} validation records`,
    });

    return run.reload();
  } catch (error) {
    await run.update({
      status: "failed",
      message: error.message,
    });
    throw error;
  }
};

export const getForecastValidationData = async ({ stationId, runId } = {}) => {
  const stationList = getForecastValidationStations();
  const selectedStationId = stationId || "415";

  const runs = await ForecastValidationRun.findAll({
    order: [["run_date", "DESC"]],
    limit: 24,
  });

  const selectedRun = runId
    ? await ForecastValidationRun.findByPk(runId)
    : runs.find((run) => run.status === "completed") || runs[0] || null;

  const records = selectedRun
    ? await ForecastValidationRecord.findAll({
        where: {
          run_id: selectedRun.id,
          station_id: selectedStationId,
        },
        order: [
          ["date", "ASC"],
          ["parameter", "ASC"],
        ],
      })
    : [];

  return {
    stations: stationList,
    runs,
    selectedRun,
    selectedStationId,
    records,
  };
};

export const shouldRunForecastValidationToday = (dateString = getDhakaToday()) =>
  getForecastValidationWindow(dateString).scheduled;

export const startForecastValidationScheduler = () => {
  let lastAttemptDate = null;

  const tick = async () => {
    const today = getDhakaToday();
    const nowDhaka = new Intl.DateTimeFormat("en-GB", {
      timeZone: DHAKA_TIME_ZONE,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date());

    if (lastAttemptDate === today || !shouldRunForecastValidationToday(today) || nowDhaka < "02:30") {
      return;
    }

    lastAttemptDate = today;
    try {
      console.log("[forecast-validation] scheduled run started", { runDate: today });
      await runForecastValidation({ runDate: today });
      console.log("[forecast-validation] scheduled run completed", { runDate: today });
    } catch (error) {
      console.error("[forecast-validation] scheduled run failed", error.message);
    }
  };

  setInterval(tick, 30 * 60 * 1000);
  tick();
};
