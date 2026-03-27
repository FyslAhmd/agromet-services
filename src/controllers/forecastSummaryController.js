import sequelize from "../config/database.js";

const DEFAULT_DAYS = 7;
const MAX_DAYS = 14;
const SUNSHINE_RADIATION_THRESHOLD = 120;

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
    description: "Daily average rainfall across the forecast grid",
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
    key: "sunshine",
    label: "Sunshine",
    unit: "hrs",
    description: "Derived from time steps where mean solar radiation is above threshold",
    decimals: 1,
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

const getMedian = (values) => {
  if (!values.length) return 1;

  const sorted = [...values].sort((a, b) => a - b);
  const middleIndex = Math.floor(sorted.length / 2);

  if (sorted.length % 2 === 0) {
    return (sorted[middleIndex - 1] + sorted[middleIndex]) / 2;
  }

  return sorted[middleIndex];
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

const getForecastTableColumns = async () => {
  const columns = await sequelize.query("SHOW COLUMNS FROM wrf_bangladesh_forecast", {
    type: sequelize.QueryTypes.SELECT,
  });

  return new Set(columns.map((column) => column.Field));
};

const getLatestImportMetadata = async () => {
  try {
    const tables = await sequelize.query("SHOW TABLES LIKE 'wrf_imported_files'", {
      type: sequelize.QueryTypes.SELECT,
    });

    if (!tables.length) {
      return null;
    }

    const importColumns = await sequelize.query("SHOW COLUMNS FROM wrf_imported_files", {
      type: sequelize.QueryTypes.SELECT,
    });

    const columnSet = new Set(importColumns.map((column) => column.Field));
    const orderColumn = columnSet.has("imported_at")
      ? "imported_at"
      : columnSet.has("created_at")
        ? "created_at"
        : null;

    if (!orderColumn) {
      return null;
    }

    const latestImportRows = await sequelize.query(
      `SELECT * FROM wrf_imported_files ORDER BY ${orderColumn} DESC LIMIT 1`,
      { type: sequelize.QueryTypes.SELECT }
    );

    return latestImportRows[0] || null;
  } catch (error) {
    console.warn("Unable to inspect wrf_imported_files metadata:", error.message);
    return null;
  }
};

const resolveLatestBatchFilter = async (columnSet) => {
  const batchInfo = {
    whereClause: "",
    replacements: {},
    label: "Latest available forecast data",
    type: "unfiltered",
    value: null,
  };

  if (columnSet.has("model_run")) {
    const latestModelRunRows = await sequelize.query(
      `
        SELECT model_run
        FROM wrf_bangladesh_forecast
        WHERE model_run IS NOT NULL
        ORDER BY model_run DESC
        LIMIT 1
      `,
      { type: sequelize.QueryTypes.SELECT }
    );

    const latestModelRun = latestModelRunRows[0]?.model_run;

    if (latestModelRun !== undefined && latestModelRun !== null) {
      batchInfo.whereClause = " AND model_run = :latestModelRun";
      batchInfo.replacements.latestModelRun = latestModelRun;
      batchInfo.label = `Model run ${latestModelRun}`;
      batchInfo.type = "model_run";
      batchInfo.value = latestModelRun;
      return batchInfo;
    }
  }

  if (columnSet.has("created_at")) {
    const latestCreatedAtRows = await sequelize.query(
      `
        SELECT
          DATE_FORMAT(MAX(created_at), '%Y-%m-%d %H:%i:00') AS batch_start,
          MAX(created_at) AS latest_created_at
        FROM wrf_bangladesh_forecast
      `,
      { type: sequelize.QueryTypes.SELECT }
    );

    const batchStart = latestCreatedAtRows[0]?.batch_start;

    if (batchStart) {
      batchInfo.whereClause = `
        AND created_at >= :batchStart
        AND created_at < DATE_ADD(:batchStart, INTERVAL 1 MINUTE)
      `;
      batchInfo.replacements.batchStart = batchStart;
      batchInfo.label = `Imported ${new Date(batchStart).toLocaleString("en-GB")}`;
      batchInfo.type = "created_at_minute";
      batchInfo.value = batchStart;
    }
  }

  return batchInfo;
};

const buildSunshineByDate = (sunshineRows) => {
  if (!sunshineRows.length) {
    return {
      sunshineByDate: {},
      stepHours: 1,
    };
  }

  const distinctTimes = Array.from(
    new Set(sunshineRows.map((row) => new Date(row.forecast_time).getTime()))
  ).sort((a, b) => a - b);

  const timeDiffHours = [];
  for (let index = 1; index < distinctTimes.length; index += 1) {
    const hours = (distinctTimes[index] - distinctTimes[index - 1]) / (1000 * 60 * 60);
    if (hours > 0 && hours <= 24) {
      timeDiffHours.push(hours);
    }
  }

  const stepHours = getMedian(timeDiffHours);
  const sunshineByDate = {};

  sunshineRows.forEach((row) => {
    const dateKey = row.forecast_date;
    const meanSolarRadiation = Number(row.mean_solar_radiation || 0);

    if (!sunshineByDate[dateKey]) {
      sunshineByDate[dateKey] = 0;
    }

    if (meanSolarRadiation > SUNSHINE_RADIATION_THRESHOLD) {
      sunshineByDate[dateKey] += stepHours;
    }
  });

  Object.keys(sunshineByDate).forEach((dateKey) => {
    sunshineByDate[dateKey] = Math.min(24, Number(sunshineByDate[dateKey].toFixed(2)));
  });

  return {
    sunshineByDate,
    stepHours,
  };
};

export const getForecastSummary = async (req, res) => {
  try {
    const requestedDays = Number.parseInt(req.query.days, 10);
    const days = Number.isNaN(requestedDays)
      ? DEFAULT_DAYS
      : Math.min(Math.max(requestedDays, 3), MAX_DAYS);

    const forecastColumns = await getForecastTableColumns();
    const batchInfo = await resolveLatestBatchFilter(forecastColumns);
    const latestImport = await getLatestImportMetadata();

    const forecastDates = await sequelize.query(
      `
        SELECT forecast_date
        FROM (
          SELECT DATE(forecast_time) AS forecast_date
          FROM wrf_bangladesh_forecast
          WHERE forecast_time IS NOT NULL
          ${batchInfo.whereClause}
          GROUP BY DATE(forecast_time)
          ORDER BY forecast_date DESC
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

    if (!forecastDates.length) {
      return res.status(200).json({
        success: true,
        data: {
          dates: [],
          rows: [],
          meta: {
            daysRequested: days,
            batchLabel: formatBatchLabel(batchInfo),
            importMetadata: latestImport,
            notes: [
              "No WRF forecast records were found for the latest available batch.",
            ],
          },
        },
      });
    }

    const startDate = forecastDates[0].forecast_date;
    const endDate = forecastDates[forecastDates.length - 1].forecast_date;

    const dailySummaryRows = await sequelize.query(
      `
        SELECT
          DATE(forecast_time) AS forecast_date,
          ROUND(MAX(temperature), 2) AS max_temperature,
          ROUND(MIN(temperature), 2) AS min_temperature,
          ROUND(AVG(rainfall), 2) AS rainfall,
          ROUND(AVG(humidity), 2) AS relative_humidity,
          ROUND(AVG(wind_speed), 2) AS wind_speed,
          ROUND(
            MOD(
              DEGREES(
                ATAN2(
                  AVG(SIN(RADIANS(wind_direction))),
                  AVG(COS(RADIANS(wind_direction)))
                )
              ) + 360,
              360
            ),
            2
          ) AS wind_direction,
          ROUND(AVG(solar_radiation), 2) AS solar_radiation,
          ROUND(
            AVG(
              LEAST(
                100,
                (
                  COALESCE(cloud_low, 0) +
                  COALESCE(cloud_mid, 0) +
                  COALESCE(cloud_high, 0)
                ) / 3
              )
            ),
            2
          ) AS cloud_cover,
          ROUND(AVG(soil_moisture), 3) AS soil_moisture,
          ROUND(AVG(dewpoint), 2) AS dew_point,
          COUNT(*) AS row_count,
          MIN(forecast_time) AS first_forecast_time,
          MAX(forecast_time) AS last_forecast_time
        FROM wrf_bangladesh_forecast
        WHERE forecast_time >= :startDate
          AND forecast_time < DATE_ADD(:endDate, INTERVAL 1 DAY)
          ${batchInfo.whereClause}
        GROUP BY DATE(forecast_time)
        ORDER BY forecast_date ASC
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

    const sunshineRows = await sequelize.query(
      `
        SELECT
          DATE(forecast_time) AS forecast_date,
          forecast_time,
          AVG(solar_radiation) AS mean_solar_radiation
        FROM wrf_bangladesh_forecast
        WHERE forecast_time >= :startDate
          AND forecast_time < DATE_ADD(:endDate, INTERVAL 1 DAY)
          ${batchInfo.whereClause}
        GROUP BY DATE(forecast_time), forecast_time
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

    const { sunshineByDate, stepHours } = buildSunshineByDate(sunshineRows);
    const dailySummaryMap = new Map(
      dailySummaryRows.map((row) => [row.forecast_date, row])
    );

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
        const dailySummary = dailySummaryMap.get(dateInfo.key);
        const rawValue = rowConfig.key === "sunshine"
          ? sunshineByDate[dateInfo.key] ?? null
          : dailySummary?.[rowConfig.key] ?? null;

        return {
          date: dateInfo.key,
          value: rawValue,
          displayValue: formatDisplayValue(rowConfig, rawValue),
        };
      }),
    }));

    const latestForecastTime = dailySummaryRows[dailySummaryRows.length - 1]?.last_forecast_time || null;
    const firstForecastTime = dailySummaryRows[0]?.first_forecast_time || null;

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
          importMetadata: latestImport,
          inferredTimeStepHours: Number(stepHours.toFixed(2)),
          notes: [
            "Sunshine is derived from forecast time steps where mean solar radiation exceeds 120 W/m².",
            "Cloud cover is derived from the mean of low, mid, and high cloud layers.",
            "Rainfall represents the daily mean value across forecast grid records for the selected forecast batch.",
          ],
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
