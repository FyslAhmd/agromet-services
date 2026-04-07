import sequelize from "../config/database.js";

const FORECAST_SUMMARY_INDEXES = [
  {
    name: "idx_wrf_created_at_forecast_time",
    columns: ["created_at", "forecast_time"],
  },
  {
    name: "idx_wrf_forecast_time_latitude_longitude",
    columns: ["forecast_time", "latitude", "longitude"],
  },
  {
    name: "idx_wrf_created_at_latitude_longitude",
    columns: ["created_at", "latitude", "longitude"],
  },
];

export const ensureForecastSummaryIndexes = async () => {
  try {
    const [tableCheck] = await sequelize.query(
      `
        SELECT COUNT(*) AS count
        FROM information_schema.tables
        WHERE table_schema = DATABASE()
          AND table_name = 'wrf_bangladesh_forecast'
      `,
      { type: sequelize.QueryTypes.SELECT }
    );

    if (!Number(tableCheck?.count)) {
      console.log(
        "[forecast-summary] skipped index setup because wrf_bangladesh_forecast does not exist yet"
      );
      return;
    }

    const existingIndexes = await sequelize.query(
      "SHOW INDEX FROM wrf_bangladesh_forecast",
      { type: sequelize.QueryTypes.SELECT }
    );

    const existingIndexNames = new Set(existingIndexes.map((index) => index.Key_name));

    for (const indexDefinition of FORECAST_SUMMARY_INDEXES) {
      if (existingIndexNames.has(indexDefinition.name)) {
        continue;
      }

      const columnList = indexDefinition.columns.map((column) => `\`${column}\``).join(", ");

      console.log("[forecast-summary] creating missing index", {
        indexName: indexDefinition.name,
        columns: indexDefinition.columns,
      });

      await sequelize.query(
        `CREATE INDEX \`${indexDefinition.name}\` ON wrf_bangladesh_forecast (${columnList})`
      );
    }
  } catch (error) {
    console.error("[forecast-summary] failed to ensure indexes:", error.message);
  }
};
