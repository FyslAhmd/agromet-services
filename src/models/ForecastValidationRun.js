import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const ForecastValidationRun = sequelize.define(
  "ForecastValidationRun",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    run_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    window_start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    window_end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    forecast_created_at_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("running", "completed", "failed"),
      allowNull: false,
      defaultValue: "running",
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    tableName: "forecast_validation_runs",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["run_date"],
      },
      {
        fields: ["status", "run_date"],
      },
    ],
  }
);

export default ForecastValidationRun;
