import sequelize from "../config/database.js";
import {
  getForecastLocationOptions,
  getSelectionMatcher,
  getSelectionMeta,
  resolveForecastSelection,
} from "../services/upazilaGeometryService.js";

const DEFAULT_DAYS = 10;
const MAX_DAYS = 10;

const SUMMARY_ROW_CONFIG = [
  {
    key: "max_temperature",
    label: "MaxT",
    unit: "°C",
    description: "Daily maximum temperature",
    decimals: 1,
  },
  {
    key: "min_temperature",
    label: "MinT",
    unit: "°C",
    description: "Daily minimum temperature",
    decimals: 1,
  },
  {
    key: "rainfall",
    label: "Rainfall",
    unit: "mm",
    description: "Daily spatial-average rainfall from forecast timestep increments",
    decimals: 1,
  },
  {
    key: "relative_humidity",
    label: "RH",
    unit: "%",
    description: "Daily average relative humidity",
    decimals: 1,
  },
  {
    key: "wind_speed",
    label: "Wind Speed",
    unit: "km/h",
    description: "Daily average wind speed",
    decimals: 1,
  },
  {
    key: "wind_direction",
    label: "Wind Direction",
    unit: "°",
    description: "Daily circular-mean wind direction",
    decimals: 0,
  },
  {
    key: "solar_radiation",
    label: "Solar Radiation",
    unit: "W/m²",
    description: "Daily average solar radiation",
    decimals: 0,
  },
  {
    key: "cloud_cover",
    label: "Cloud Cover",
    unit: "%",
    description: "Derived from low, mid, and high cloud layers",
    decimals: 1,
  },
  {
    key: "soil_moisture",
    label: "Soil Moisture",
    unit: "m³/m³",
    description: "Daily average soil moisture",
    decimals: 3,
  },
  {
    key: "dew_point",
    label: "Dew Point",
    unit: "°C",
    description: "Daily average dew point",
    decimals: 1,
  },
];

const formatNumber = (value, decimals = 1) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—";
  }

  return Number(value).toFixed(decimals);
};

const formatDisplayValue = (row, value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "—";
  }

  const numericValue = Number(value);

  if (row.key === "wind_direction") {
    return `${Math.round(numericValue)}°`;
  }

  if (row.key === "solar_radiation") {
    return Math.round(numericValue).toString();
  }

  return formatNumber(numericValue, row.decimals);
};

const formatBatchLabel = (batchInfo) => {
  if (!batchInfo) return "Latest available forecast data";

  if (batchInfo.label) return batchInfo.label;

  if (batchInfo.type === "model_run" && batchInfo.value !== null) {
    return `Model run ${batchInfo.value}`;
  }

  if (batchInfo.type === "created_at_minute" && batchInfo.value) {
    return `Imported ${new Date(batchInfo.value).toLocaleString("en-GB")}`;
  }

  return "Latest available forecast data";
};

const getDhakaToday = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Dhaka",
  }).format(new Date());

const getDhakaDayRangeUtc = (dateString) => {
  const startUtc = new Date(`${dateString}T00:00:00+06:00`);
  const endUtc = new Date(startUtc.getTime() + 24 * 60 * 60 * 1000);

  const toMysqlDateTime = (date) => date.toISOString().slice(0, 19).replace("T", " ");

  return {
    startUtc: toMysqlDateTime(startUtc),
    endUtc: toMysqlDateTime(endUtc),
  };
};

const normalizeNumber = (value) => {
  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? null : numericValue;
};

const getSpatialWeight = (latitude) => {
  const normalizedLatitude = normalizeNumber(latitude);
  if (normalizedLatitude === null) return null;
  return Math.cos((normalizedLatitude * Math.PI) / 180);
};

const buildRainfallDiagnostics = (rows, selectedSelection, selectionType, selectionCode) => {
  if (!rows.length) {
    console.log("[forecast-summary][rainfall] no matched rows for rainfall diagnostics", {
      selectionType: selectionType || null,
      selectionCode: selectionCode || null,
      selectedLabel: selectedSelection?.label || null,
    });
    return;
  }

  const rowsByDay = new Map();
  const rowsByPoint = new Map();

  rows.forEach((row) => {
    const forecastDate = new Date(row.forecast_time).toISOString().slice(0, 10);
    const pointKey = `${row.latitude}|${row.longitude}`;
    const rainfall = normalizeNumber(row.rainfall);

    if (!rowsByDay.has(forecastDate)) {
      rowsByDay.set(forecastDate, []);
    }
    rowsByDay.get(forecastDate).push({
      forecast_time: row.forecast_time,
      latitude: row.latitude,
      longitude: row.longitude,
      rainfall,
    });

    if (!rowsByPoint.has(pointKey)) {
      rowsByPoint.set(pointKey, []);
    }
    rowsByPoint.get(pointKey).push({
      forecastDate,
      forecast_time: row.forecast_time,
      rainfall,
    });
  });

  const dayDiagnostics = Array.from(rowsByDay.entries()).map(([forecastDate, dayRows]) => {
    const rainfallValues = dayRows
      .map((row) => row.rainfall)
      .filter((value) => value !== null);

    const uniquePointCount = new Set(
      dayRows.map((row) => `${row.latitude}|${row.longitude}`)
    ).size;
    const uniqueTimeCount = new Set(
      dayRows.map((row) => new Date(row.forecast_time).toISOString())
    ).size;

    return {
      forecastDate,
      matchedRows: dayRows.length,
      uniquePointCount,
      uniqueTimeCount,
      rainfallMin: rainfallValues.length ? Math.min(...rainfallValues) : null,
      rainfallMax: rainfallValues.length ? Math.max(...rainfallValues) : null,
      rainfallAvg: rainfallValues.length
        ? rainfallValues.reduce((sum, value) => sum + value, 0) / rainfallValues.length
        : null,
    };
  });

  const pointDiagnostics = Array.from(rowsByPoint.entries())
    .slice(0, 8)
    .map(([pointKey, pointRows]) => {
      const sortedRows = [...pointRows].sort(
        (a, b) => new Date(a.forecast_time).getTime() - new Date(b.forecast_time).getTime()
      );

      const rainfallSeries = sortedRows
        .map((row) => row.rainfall)
        .filter((value) => value !== null);

      let deltaSum = 0;
      for (let index = 1; index < sortedRows.length; index += 1) {
        const previous = sortedRows[index - 1].rainfall;
        const current = sortedRows[index].rainfall;
        if (previous !== null && current !== null) {
          deltaSum += current - previous;
        }
      }

      let positiveDeltaSum = 0;
      for (let index = 1; index < sortedRows.length; index += 1) {
        const previous = sortedRows[index - 1].rainfall;
        const current = sortedRows[index].rainfall;
        if (previous !== null && current !== null) {
          positiveDeltaSum += Math.max(0, current - previous);
        }
      }

      const monotonicNonDecreasing = sortedRows.every((row, index) => {
        if (index === 0) return true;
        const previous = sortedRows[index - 1].rainfall;
        const current = row.rainfall;
        if (previous === null || current === null) return true;
        return current >= previous;
      });

      return {
        pointKey,
        totalRows: sortedRows.length,
        firstTime: sortedRows[0]?.forecast_time || null,
        lastTime: sortedRows[sortedRows.length - 1]?.forecast_time || null,
        firstRainfall: sortedRows[0]?.rainfall ?? null,
        lastRainfall: sortedRows[sortedRows.length - 1]?.rainfall ?? null,
        simpleSum: rainfallSeries.reduce((sum, value) => sum + value, 0),
        deltaSum,
        positiveDeltaSum,
        monotonicNonDecreasing,
        rainfallSeries: sortedRows.map((row) => ({
          forecastDate: row.forecastDate,
          forecast_time: row.forecast_time,
          rainfall: row.rainfall,
        })),
      };
    });

  console.log("[forecast-summary][rainfall] diagnostics", {
    selectionType: selectionType || null,
    selectionCode: selectionCode || null,
    selectedLabel: selectedSelection?.label || null,
    totalMatchedRows: rows.length,
    uniqueGridPoints: rowsByPoint.size,
    dailyBreakdown: dayDiagnostics,
    samplePointBreakdown: pointDiagnostics,
  });
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
  const rainfallDeltaDiagnostics = [];

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

      let rainfallIncrement;
      if (previousRainfall === null) {
        // The first stored value at a grid point may already be cumulative,
        // so we treat it as the baseline instead of new rainfall.
        rainfallIncrement = 0;
      } else {
        const delta = currentRainfall - previousRainfall;
        rainfallIncrement = delta >= 0 ? delta : currentRainfall;
      }

      const forecastDate = new Date(row.forecast_time).toISOString().slice(0, 10);
      const pointDayKey = `${forecastDate}|${pointKey}`;

      if (!pointDayRainfallTotals.has(pointDayKey)) {
        pointDayRainfallTotals.set(pointDayKey, {
          forecastDate,
          pointKey,
          latitude: row.latitude,
          longitude: row.longitude,
          rainfallTotal: 0,
          incrementCount: 0,
          series: [],
        });
      }

      const dayAggregate = pointDayRainfallTotals.get(pointDayKey);
      dayAggregate.rainfallTotal += rainfallIncrement;
      dayAggregate.incrementCount += 1;
      dayAggregate.series.push({
        forecast_time: row.forecast_time,
        rawRainfall: currentRainfall,
        incrementRainfall: rainfallIncrement,
      });

      rainfallDeltaDiagnostics.push({
        pointKey,
        forecastDate,
        forecast_time: row.forecast_time,
        rawRainfall: currentRainfall,
        incrementRainfall: rainfallIncrement,
      });

      previousRainfall = currentRainfall;
    });
  });

  return {
    pointDayRainfallTotals,
    rainfallDeltaDiagnostics,
  };
};

const getForecastTableColumns = async () => {
  const columns = await sequelize.query("SHOW COLUMNS FROM wrf_bangladesh_forecast", {
    type: sequelize.QueryTypes.SELECT,
  });

  return new Set(columns.map((column) => column.Field));
};

const resolveTodayFilter = async (columnSet, todayDhaka) => {
  const dayRange = getDhakaDayRangeUtc(todayDhaka);
  const batchInfo = {
    whereClause: `
      AND created_at >= :createdAtStartUtc
      AND created_at < :createdAtEndUtc
    `,
    replacements: {
      createdAtStartUtc: dayRange.startUtc,
      createdAtEndUtc: dayRange.endUtc,
    },
    label: `Imported on ${todayDhaka}`,
    type: "today_created_at",
    value: todayDhaka,
  };

  if (!columnSet.has("created_at")) {
    batchInfo.whereClause = "";
    batchInfo.replacements = {};
    batchInfo.label = "created_at column not available";
    batchInfo.type = "unfiltered";
    batchInfo.value = null;
  }

  return batchInfo;
};

export const getForecastSummary = async (req, res) => {
  try {
    const requestedDays = Number.parseInt(req.query.days, 10);
    const days = Number.isNaN(requestedDays)
      ? DEFAULT_DAYS
      : Math.min(Math.max(requestedDays, 3), MAX_DAYS);

    const selectionType = (req.query.selectionType?.trim() || "").toLowerCase();
    const selectionCode = (
      req.query.selectionCode?.trim() ||
      req.query.upazilaCode?.trim() ||
      req.query.districtCode?.trim() ||
      req.query.regionCode?.trim() ||
      ""
    );

    const normalizedSelectionType = selectionType || (req.query.upazilaCode ? "upazila" : "");
    const selectedSelection = selectionCode
      ? resolveForecastSelection(normalizedSelectionType, selectionCode)
      : null;
    const selectedSelectionMeta = selectedSelection
      ? getSelectionMeta(selectedSelection)
      : null;

    if (selectionCode && !selectedSelection) {
      console.log("[forecast-summary] invalid selection", {
        selectionType: normalizedSelectionType || null,
        selectionCode,
        days,
      });
      return res.status(404).json({
        success: false,
        message: "Selected forecast geography was not found",
      });
    }

    const todayDhaka = getDhakaToday();
    const forecastColumns = await getForecastTableColumns();
    const batchInfo = await resolveTodayFilter(forecastColumns, todayDhaka);

    console.log("[forecast-summary] request received", {
      days,
      selectionType: normalizedSelectionType || null,
      selectionCode: selectionCode || null,
      selectedLabel: selectedSelectionMeta?.label || null,
      todayDhaka,
      batchType: batchInfo.type,
      batchLabel: batchInfo.label,
      batchReplacements: batchInfo.replacements,
    });

    const forecastDates = await sequelize.query(
      `
        SELECT forecast_date
        FROM (
          SELECT DATE(forecast_time) AS forecast_date
          FROM wrf_bangladesh_forecast
          WHERE forecast_time IS NOT NULL
            AND DATE(forecast_time) >= :todayDhaka
          ${batchInfo.whereClause}
          GROUP BY DATE(forecast_time)
          ORDER BY forecast_date ASC
          LIMIT :days
        ) AS latest_dates
        ORDER BY forecast_date ASC
      `,
      {
        replacements: {
          todayDhaka,
          ...batchInfo.replacements,
          days,
        },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    console.log("[forecast-summary] forecast dates query result", {
      selectionType: normalizedSelectionType || null,
      selectionCode: selectionCode || null,
      count: forecastDates.length,
      dates: forecastDates.map((row) => row.forecast_date),
    });

    if (!forecastDates.length) {
      console.log("[forecast-summary] no forecast dates found after created_at filter", {
        todayDhaka,
        selectionType: normalizedSelectionType || null,
        selectionCode: selectionCode || null,
        batchReplacements: batchInfo.replacements,
      });
      return res.status(200).json({
        success: true,
        data: {
          dates: [],
          rows: [],
          meta: {
            daysRequested: days,
            batchLabel: formatBatchLabel(batchInfo),
            todayFilterDate: todayDhaka,
          },
        },
      });
    }

    const startDate = forecastDates[0].forecast_date;
    const endDate = forecastDates[forecastDates.length - 1].forecast_date;

    console.log("[forecast-summary] querying raw forecast rows", {
      startDate,
      endDate,
      selectionType: normalizedSelectionType || null,
      selectionCode: selectionCode || null,
    });

    const rawForecastRows = await sequelize.query(
      `
        SELECT
          forecast_time,
          latitude,
          longitude,
          temperature,
          rainfall,
          humidity,
          wind_speed,
          wind_direction,
          solar_radiation,
          soil_moisture,
          dewpoint,
          cloud_low,
          cloud_mid,
          cloud_high
        FROM wrf_bangladesh_forecast
        WHERE forecast_time >= :startDate
          AND forecast_time < DATE_ADD(:endDate, INTERVAL 1 DAY)
          ${batchInfo.whereClause}
        ORDER BY forecast_time ASC
      `,
      {
        replacements: {
          ...batchInfo.replacements,
          startDate,
          endDate,
        },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    console.log("[forecast-summary] raw forecast rows fetched", {
      count: rawForecastRows.length,
      selectionType: normalizedSelectionType || null,
      selectionCode: selectionCode || null,
      sample: rawForecastRows.slice(0, 3).map((row) => ({
        forecast_time: row.forecast_time,
        latitude: row.latitude,
        longitude: row.longitude,
        rainfall: row.rainfall,
      })),
    });

    const selectionMatcher = getSelectionMatcher(selectedSelection);
    const filteredForecastRows = rawForecastRows.filter((row) =>
      selectionMatcher(row.latitude, row.longitude)
    );

    console.log("[forecast-summary] spatial filter result", {
      selectionType: normalizedSelectionType || null,
      selectionCode: selectionCode || null,
      selectedLabel: selectedSelectionMeta?.label || null,
      rawCount: rawForecastRows.length,
      filteredCount: filteredForecastRows.length,
      sampleMatchedPoints: filteredForecastRows.slice(0, 5).map((row) => ({
        latitude: row.latitude,
        longitude: row.longitude,
        forecast_time: row.forecast_time,
      })),
    });

    if (selectedSelectionMeta) {
      const uniqueRawPoints = new Set(
        rawForecastRows.map((row) => `${row.latitude}|${row.longitude}`)
      ).size;
      const uniqueMatchedPoints = new Set(
        filteredForecastRows.map((row) => `${row.latitude}|${row.longitude}`)
      ).size;

      console.log("[forecast-summary] geography boundary stats", {
        level: selectedSelectionMeta.level,
        code: selectedSelectionMeta.code,
        label: selectedSelectionMeta.label,
        district: selectedSelectionMeta.district,
        division: selectedSelectionMeta.division,
        bbox: selectedSelectionMeta.bbox,
        memberCount: selectedSelectionMeta.memberCount,
        uniqueRawPoints,
        uniqueMatchedPoints,
      });
    }

    buildRainfallDiagnostics(
      filteredForecastRows,
      selectedSelectionMeta,
      normalizedSelectionType,
      selectionCode
    );

    const { pointDayRainfallTotals, rainfallDeltaDiagnostics } =
      buildPointRainfallDayTotals(filteredForecastRows);

    console.log("[forecast-summary][rainfall] increment diagnostics", {
      selectionType: normalizedSelectionType || null,
      selectionCode: selectionCode || null,
      selectedLabel: selectedSelectionMeta?.label || null,
      sampleIncrements: rainfallDeltaDiagnostics.slice(0, 24),
      samplePointDayTotals: Array.from(pointDayRainfallTotals.values())
        .slice(0, 8)
        .map((item) => ({
          forecastDate: item.forecastDate,
          pointKey: item.pointKey,
          rainfallTotal: item.rainfallTotal,
          incrementCount: item.incrementCount,
          series: item.series.slice(0, 8),
        })),
    });

    const pointDayAccumulator = new Map();

    filteredForecastRows.forEach((row) => {
      const forecastDate = new Date(row.forecast_time).toISOString().slice(0, 10);
      const pointKey = `${forecastDate}|${row.latitude}|${row.longitude}`;

      if (!pointDayAccumulator.has(pointKey)) {
        pointDayAccumulator.set(pointKey, {
          forecastDate,
          latitude: normalizeNumber(row.latitude),
          longitude: normalizeNumber(row.longitude),
          spatialWeight: getSpatialWeight(row.latitude),
          maxTemperature: -Infinity,
          minTemperature: Infinity,
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
          cloudCoverSum: 0,
          cloudCoverCount: 0,
          soilMoistureSum: 0,
          soilMoistureCount: 0,
          dewPointSum: 0,
          dewPointCount: 0,
        });
      }

      const aggregate = pointDayAccumulator.get(pointKey);
      const temperature = normalizeNumber(row.temperature);
      const humidity = normalizeNumber(row.humidity);
      const windSpeed = normalizeNumber(row.wind_speed);
      const windDirection = normalizeNumber(row.wind_direction);
      const solarRadiation = normalizeNumber(row.solar_radiation);
      const soilMoisture = normalizeNumber(row.soil_moisture);
      const dewPoint = normalizeNumber(row.dewpoint);
      const cloudLow = normalizeNumber(row.cloud_low);
      const cloudMid = normalizeNumber(row.cloud_mid);
      const cloudHigh = normalizeNumber(row.cloud_high);

      if (temperature !== null) {
        aggregate.maxTemperature = Math.max(aggregate.maxTemperature, temperature);
        aggregate.minTemperature = Math.min(aggregate.minTemperature, temperature);
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

      const cloudValues = [cloudLow, cloudMid, cloudHigh].filter((value) => value !== null);
      if (cloudValues.length) {
        const cloudCover = Math.min(
          100,
          cloudValues.reduce((sum, value) => sum + value, 0) / cloudValues.length
        );
        aggregate.cloudCoverSum += cloudCover;
        aggregate.cloudCoverCount += 1;
      }

      if (soilMoisture !== null) {
        aggregate.soilMoistureSum += soilMoisture;
        aggregate.soilMoistureCount += 1;
      }

      if (dewPoint !== null) {
        aggregate.dewPointSum += dewPoint;
        aggregate.dewPointCount += 1;
      }
    });

    pointDayAccumulator.forEach((pointAggregate, pointKey) => {
      pointAggregate.rainfallTotal =
        pointDayRainfallTotals.get(pointKey)?.rainfallTotal ?? 0;
    });

    const dailyAccumulator = new Map();

    pointDayAccumulator.forEach((pointAggregate) => {
      const {
        forecastDate,
        spatialWeight,
        maxTemperature,
        minTemperature,
        rainfallTotal,
        humiditySum,
        humidityCount,
        windSpeedSum,
        windSpeedCount,
        windDirectionSinSum,
        windDirectionCosSum,
        windDirectionCount,
        solarRadiationSum,
        solarRadiationCount,
        cloudCoverSum,
        cloudCoverCount,
        soilMoistureSum,
        soilMoistureCount,
        dewPointSum,
        dewPointCount,
      } = pointAggregate;

      if (!dailyAccumulator.has(forecastDate)) {
        dailyAccumulator.set(forecastDate, {
          maxTemperatureWeightedSum: 0,
          maxTemperatureWeightTotal: 0,
          minTemperatureWeightedSum: 0,
          minTemperatureWeightTotal: 0,
          rainfallWeightedSum: 0,
          rainfallWeightTotal: 0,
          humidityWeightedSum: 0,
          humidityWeightTotal: 0,
          windSpeedWeightedSum: 0,
          windSpeedWeightTotal: 0,
          windDirectionWeightedSinSum: 0,
          windDirectionWeightedCosSum: 0,
          windDirectionWeightTotal: 0,
          solarRadiationWeightedSum: 0,
          solarRadiationWeightTotal: 0,
          cloudCoverWeightedSum: 0,
          cloudCoverWeightTotal: 0,
          soilMoistureWeightedSum: 0,
          soilMoistureWeightTotal: 0,
          dewPointWeightedSum: 0,
          dewPointWeightTotal: 0,
        });
      }

      const dailyAggregate = dailyAccumulator.get(forecastDate);
      if (spatialWeight === null || Number.isNaN(spatialWeight) || spatialWeight <= 0) {
        return;
      }

      if (Number.isFinite(maxTemperature)) {
        dailyAggregate.maxTemperatureWeightedSum += spatialWeight * maxTemperature;
        dailyAggregate.maxTemperatureWeightTotal += spatialWeight;
      }

      if (Number.isFinite(minTemperature)) {
        dailyAggregate.minTemperatureWeightedSum += spatialWeight * minTemperature;
        dailyAggregate.minTemperatureWeightTotal += spatialWeight;
      }

      dailyAggregate.rainfallWeightedSum += spatialWeight * rainfallTotal;
      dailyAggregate.rainfallWeightTotal += spatialWeight;

      if (humidityCount) {
        const humidityAverage = humiditySum / humidityCount;
        dailyAggregate.humidityWeightedSum += spatialWeight * humidityAverage;
        dailyAggregate.humidityWeightTotal += spatialWeight;
      }

      if (windSpeedCount) {
        const windSpeedAverage = windSpeedSum / windSpeedCount;
        dailyAggregate.windSpeedWeightedSum += spatialWeight * windSpeedAverage;
        dailyAggregate.windSpeedWeightTotal += spatialWeight;
      }

      if (windDirectionCount) {
        const pointWindDirection = Math.atan2(windDirectionSinSum, windDirectionCosSum);
        dailyAggregate.windDirectionWeightedSinSum += spatialWeight * Math.sin(pointWindDirection);
        dailyAggregate.windDirectionWeightedCosSum += spatialWeight * Math.cos(pointWindDirection);
        dailyAggregate.windDirectionWeightTotal += spatialWeight;
      }

      if (solarRadiationCount) {
        const solarRadiationAverage = solarRadiationSum / solarRadiationCount;
        dailyAggregate.solarRadiationWeightedSum += spatialWeight * solarRadiationAverage;
        dailyAggregate.solarRadiationWeightTotal += spatialWeight;
      }

      if (cloudCoverCount) {
        const cloudCoverAverage = cloudCoverSum / cloudCoverCount;
        dailyAggregate.cloudCoverWeightedSum += spatialWeight * cloudCoverAverage;
        dailyAggregate.cloudCoverWeightTotal += spatialWeight;
      }

      if (soilMoistureCount) {
        const soilMoistureAverage = soilMoistureSum / soilMoistureCount;
        dailyAggregate.soilMoistureWeightedSum += spatialWeight * soilMoistureAverage;
        dailyAggregate.soilMoistureWeightTotal += spatialWeight;
      }

      if (dewPointCount) {
        const dewPointAverage = dewPointSum / dewPointCount;
        dailyAggregate.dewPointWeightedSum += spatialWeight * dewPointAverage;
        dailyAggregate.dewPointWeightTotal += spatialWeight;
      }
    });

    const dates = forecastDates.map(({ forecast_date }) => {
      const date = new Date(forecast_date);
      return {
        key: forecast_date,
        label: date.toLocaleDateString("en-GB", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        dayLabel: date.toLocaleDateString("en-GB", { weekday: "short" }),
      };
    });

    const rows = SUMMARY_ROW_CONFIG.map((rowConfig) => ({
      key: rowConfig.key,
      label: rowConfig.label,
      unit: rowConfig.unit,
      description: rowConfig.description,
      values: dates.map((dateInfo) => {
        const aggregate = dailyAccumulator.get(dateInfo.key);
        let rawValue = null;

        if (aggregate) {
          switch (rowConfig.key) {
            case "max_temperature":
              rawValue = aggregate.maxTemperatureWeightTotal
                ? aggregate.maxTemperatureWeightedSum / aggregate.maxTemperatureWeightTotal
                : null;
              break;
            case "min_temperature":
              rawValue = aggregate.minTemperatureWeightTotal
                ? aggregate.minTemperatureWeightedSum / aggregate.minTemperatureWeightTotal
                : null;
              break;
            case "rainfall":
              rawValue = aggregate.rainfallWeightTotal
                ? aggregate.rainfallWeightedSum / aggregate.rainfallWeightTotal
                : null;
              break;
            case "relative_humidity":
              rawValue = aggregate.humidityWeightTotal
                ? aggregate.humidityWeightedSum / aggregate.humidityWeightTotal
                : null;
              break;
            case "wind_speed":
              rawValue = aggregate.windSpeedWeightTotal
                ? (aggregate.windSpeedWeightedSum / aggregate.windSpeedWeightTotal) * 3.6
                : null;
              break;
            case "wind_direction":
              rawValue = aggregate.windDirectionWeightTotal
                ? (Math.atan2(
                    aggregate.windDirectionWeightedSinSum,
                    aggregate.windDirectionWeightedCosSum
                  ) *
                    180) /
                    Math.PI
                : null;
              if (rawValue !== null) {
                rawValue = (rawValue + 360) % 360;
              }
              break;
            case "solar_radiation":
              rawValue = aggregate.solarRadiationWeightTotal
                ? aggregate.solarRadiationWeightedSum / aggregate.solarRadiationWeightTotal
                : null;
              break;
            case "cloud_cover":
              rawValue = aggregate.cloudCoverWeightTotal
                ? aggregate.cloudCoverWeightedSum / aggregate.cloudCoverWeightTotal
                : null;
              break;
            case "soil_moisture":
              rawValue = aggregate.soilMoistureWeightTotal
                ? aggregate.soilMoistureWeightedSum / aggregate.soilMoistureWeightTotal
                : null;
              break;
            case "dew_point":
              rawValue = aggregate.dewPointWeightTotal
                ? aggregate.dewPointWeightedSum / aggregate.dewPointWeightTotal
                : null;
              break;
            default:
              rawValue = null;
          }
        }

        return {
          date: dateInfo.key,
          value: rawValue,
          displayValue: formatDisplayValue(rowConfig, rawValue),
        };
      }),
    }));

    const dailySummaries = Array.from(dailyAccumulator.values());
    const matchedGridPoints = new Set(
      filteredForecastRows.map((row) => `${row.latitude}|${row.longitude}`)
    ).size;
    const latestForecastTime =
      filteredForecastRows.length
        ? filteredForecastRows.reduce((latest, row) =>
            !latest || row.forecast_time > latest ? row.forecast_time : latest,
          null)
        : null;
    const firstForecastTime =
      filteredForecastRows.length
        ? filteredForecastRows.reduce((first, row) =>
            !first || row.forecast_time < first ? row.forecast_time : first,
          null)
        : null;

    console.log("[forecast-summary] aggregation complete", {
      selectionType: normalizedSelectionType || null,
      selectionCode: selectionCode || null,
      matchedGridPoints,
      matchedPointRows: filteredForecastRows.length,
      aggregatedDays: dailySummaries.length,
      availableDates: dates.map((date) => date.key),
      latestForecastTime,
      firstForecastTime,
    });

    res.status(200).json({
      success: true,
      data: {
        dates,
        rows,
        meta: {
          daysRequested: days,
          availableDays: dates.length,
          batchLabel: formatBatchLabel(batchInfo),
          batchType: batchInfo.type,
          batchValue: batchInfo.value,
          latestForecastTime,
          firstForecastTime,
          todayFilterDate: todayDhaka,
          selectedSelection: selectedSelectionMeta
            ? {
                code: selectedSelectionMeta.code,
                name: selectedSelectionMeta.name,
                label: selectedSelectionMeta.label,
                level: selectedSelectionMeta.level,
                district: selectedSelectionMeta.district,
                division: selectedSelectionMeta.division,
                memberCount: selectedSelectionMeta.memberCount,
              }
            : null,
          matchedGridPoints,
          matchedPointRows: filteredForecastRows.length,
        },
      },
    });
  } catch (error) {
    console.error("Error fetching forecast summary:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch forecast summary",
      error: error.message,
    });
  }
};

export const getForecastLocations = async (req, res) => {
  try {
    const locations = getForecastLocationOptions();
    res.status(200).json({
      success: true,
      data: locations,
    });
  } catch (error) {
    console.error("Error fetching forecast locations:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch forecast locations",
      error: error.message,
    });
  }
};

export const getForecastUpazilas = getForecastLocations;
