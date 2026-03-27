import sequelize from "../config/database.js";

const DEFAULT_DAYS = 7;
const MAX_DAYS = 14;

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

const getForecastTableColumns = async () => {
  const columns = await sequelize.query("SHOW COLUMNS FROM wrf_bangladesh_forecast", {
    type: sequelize.QueryTypes.SELECT,
  });

  return new Set(columns.map((column) => column.Field));
};

const resolveTodayFilter = async (columnSet, todayDhaka) => {
  const batchInfo = {
    whereClause: " AND DATE(created_at) = :todayDhaka",
    replacements: { todayDhaka },
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

    const todayDhaka = getDhakaToday();
    const forecastColumns = await getForecastTableColumns();
    const batchInfo = await resolveTodayFilter(forecastColumns, todayDhaka);

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
            todayFilterDate: todayDhaka,
            notes: [
              `No WRF forecast records were found for rows imported on ${todayDhaka}.`,
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
        const rawValue = dailySummary?.[rowConfig.key] ?? null;

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
          todayFilterDate: todayDhaka,
          notes: [
            `Only rows whose created_at date matches ${todayDhaka} are included.`,
            "Cloud cover is derived from the mean of low, mid, and high cloud layers.",
            "Rainfall represents the daily mean value across today's imported forecast grid rows.",
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
