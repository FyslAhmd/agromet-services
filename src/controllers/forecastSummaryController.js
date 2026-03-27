import sequelize from "../config/database.js";
import {
  getUpazilaByCode,
  getUpazilaOptions,
  isPointInsideUpazila,
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
    description: "Daily rainfall sum across matched forecast rows",
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
    unit: "m/s",
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

    const selectedUpazilaCode = req.query.upazilaCode?.trim() || "";
    const selectedUpazila = selectedUpazilaCode
      ? getUpazilaByCode(selectedUpazilaCode)
      : null;

    if (selectedUpazilaCode && !selectedUpazila) {
      console.log("[forecast-summary] invalid upazila code", {
        selectedUpazilaCode,
        days,
      });
      return res.status(404).json({
        success: false,
        message: "Selected upazila was not found",
      });
    }

    const todayDhaka = getDhakaToday();
    const forecastColumns = await getForecastTableColumns();
    const batchInfo = await resolveTodayFilter(forecastColumns, todayDhaka);

    console.log("[forecast-summary] request received", {
      days,
      selectedUpazilaCode: selectedUpazilaCode || null,
      selectedUpazilaLabel: selectedUpazila?.label || null,
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
          ${batchInfo.whereClause}
          GROUP BY DATE(forecast_time)
          ORDER BY forecast_date ASC
          LIMIT :days
        ) AS latest_dates
        ORDER BY forecast_date ASC
      `,
      {
        replacements: {
          ...batchInfo.replacements,
          days,
        },
        type: sequelize.QueryTypes.SELECT,
      }
    );

    console.log("[forecast-summary] forecast dates query result", {
      selectedUpazilaCode: selectedUpazilaCode || null,
      count: forecastDates.length,
      dates: forecastDates.map((row) => row.forecast_date),
    });

    if (!forecastDates.length) {
      console.log("[forecast-summary] no forecast dates found after created_at filter", {
        todayDhaka,
        selectedUpazilaCode: selectedUpazilaCode || null,
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
      selectedUpazilaCode: selectedUpazilaCode || null,
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
      selectedUpazilaCode: selectedUpazilaCode || null,
      sample: rawForecastRows.slice(0, 3).map((row) => ({
        forecast_time: row.forecast_time,
        latitude: row.latitude,
        longitude: row.longitude,
        rainfall: row.rainfall,
      })),
    });

    const filteredForecastRows = selectedUpazila
      ? rawForecastRows.filter((row) =>
          isPointInsideUpazila(row.latitude, row.longitude, selectedUpazila)
        )
      : rawForecastRows;

    console.log("[forecast-summary] spatial filter result", {
      selectedUpazilaCode: selectedUpazilaCode || null,
      selectedUpazilaLabel: selectedUpazila?.label || null,
      rawCount: rawForecastRows.length,
      filteredCount: filteredForecastRows.length,
      sampleMatchedPoints: filteredForecastRows.slice(0, 5).map((row) => ({
        latitude: row.latitude,
        longitude: row.longitude,
        forecast_time: row.forecast_time,
      })),
    });

    if (selectedUpazila) {
      const uniqueRawPoints = new Set(
        rawForecastRows.map((row) => `${row.latitude}|${row.longitude}`)
      ).size;
      const uniqueMatchedPoints = new Set(
        filteredForecastRows.map((row) => `${row.latitude}|${row.longitude}`)
      ).size;

      console.log("[forecast-summary] upazila boundary stats", {
        code: selectedUpazila.code,
        label: selectedUpazila.label,
        district: selectedUpazila.district,
        division: selectedUpazila.division,
        bbox: selectedUpazila.bbox,
        uniqueRawPoints,
        uniqueMatchedPoints,
      });
    }

    const dailyAccumulator = new Map();

    filteredForecastRows.forEach((row) => {
      const forecastDate = new Date(row.forecast_time).toISOString().slice(0, 10);

      if (!dailyAccumulator.has(forecastDate)) {
        dailyAccumulator.set(forecastDate, {
          maxTemperature: -Infinity,
          minTemperature: Infinity,
          rainfallSum: 0,
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
          rowCount: 0,
          firstForecastTime: row.forecast_time,
          lastForecastTime: row.forecast_time,
        });
      }

      const aggregate = dailyAccumulator.get(forecastDate);
      const temperature = normalizeNumber(row.temperature);
      const rainfall = normalizeNumber(row.rainfall);
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

      if (rainfall !== null) {
        aggregate.rainfallSum += rainfall;
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

      aggregate.rowCount += 1;
      aggregate.firstForecastTime =
        row.forecast_time < aggregate.firstForecastTime
          ? row.forecast_time
          : aggregate.firstForecastTime;
      aggregate.lastForecastTime =
        row.forecast_time > aggregate.lastForecastTime
          ? row.forecast_time
          : aggregate.lastForecastTime;
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
              rawValue = Number.isFinite(aggregate.maxTemperature)
                ? aggregate.maxTemperature
                : null;
              break;
            case "min_temperature":
              rawValue = Number.isFinite(aggregate.minTemperature)
                ? aggregate.minTemperature
                : null;
              break;
            case "rainfall":
              rawValue = aggregate.rainfallSum;
              break;
            case "relative_humidity":
              rawValue = aggregate.humidityCount
                ? aggregate.humiditySum / aggregate.humidityCount
                : null;
              break;
            case "wind_speed":
              rawValue = aggregate.windSpeedCount
                ? aggregate.windSpeedSum / aggregate.windSpeedCount
                : null;
              break;
            case "wind_direction":
              rawValue = aggregate.windDirectionCount
                ? (Math.atan2(
                    aggregate.windDirectionSinSum / aggregate.windDirectionCount,
                    aggregate.windDirectionCosSum / aggregate.windDirectionCount
                  ) *
                    180) /
                    Math.PI
                : null;
              if (rawValue !== null) {
                rawValue = (rawValue + 360) % 360;
              }
              break;
            case "solar_radiation":
              rawValue = aggregate.solarRadiationCount
                ? aggregate.solarRadiationSum / aggregate.solarRadiationCount
                : null;
              break;
            case "cloud_cover":
              rawValue = aggregate.cloudCoverCount
                ? aggregate.cloudCoverSum / aggregate.cloudCoverCount
                : null;
              break;
            case "soil_moisture":
              rawValue = aggregate.soilMoistureCount
                ? aggregate.soilMoistureSum / aggregate.soilMoistureCount
                : null;
              break;
            case "dew_point":
              rawValue = aggregate.dewPointCount
                ? aggregate.dewPointSum / aggregate.dewPointCount
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
      dailySummaries.length
        ? dailySummaries.reduce((latest, item) =>
            !latest || item.lastForecastTime > latest ? item.lastForecastTime : latest,
          null)
        : null;
    const firstForecastTime =
      dailySummaries.length
        ? dailySummaries.reduce((first, item) =>
            !first || item.firstForecastTime < first ? item.firstForecastTime : first,
          null)
        : null;

    console.log("[forecast-summary] aggregation complete", {
      selectedUpazilaCode: selectedUpazilaCode || null,
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
          selectedUpazila: selectedUpazila
            ? {
                code: selectedUpazila.code,
                name: selectedUpazila.name,
                label: selectedUpazila.label,
                district: selectedUpazila.district,
                division: selectedUpazila.division,
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

export const getForecastUpazilas = async (req, res) => {
  try {
    const upazilas = getUpazilaOptions();
    res.status(200).json({
      success: true,
      data: upazilas,
    });
  } catch (error) {
    console.error("Error fetching forecast upazilas:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch forecast upazilas",
      error: error.message,
    });
  }
};
