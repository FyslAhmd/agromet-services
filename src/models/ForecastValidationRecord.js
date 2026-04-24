import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import ForecastValidationRun from "./ForecastValidationRun.js";

const ForecastValidationRecord = sequelize.define(
  "ForecastValidationRecord",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    run_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: ForecastValidationRun,
        key: "id",
      },
      onDelete: "CASCADE",
    },
    station_id: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    station_name: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    forecast_scope: {
      type: DataTypes.STRING(20),
      allowNull: false,
    },
    forecast_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    forecast_label: {
      type: DataTypes.STRING(120),
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    parameter: {
      type: DataTypes.STRING(80),
      allowNull: false,
    },
    unit: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    forecast_value: {
      type: DataTypes.DECIMAL(12, 4),
      allowNull: true,
    },
    observed_value: {
      type: DataTypes.DECIMAL(12, 4),
      allowNull: true,
    },
    difference: {
      type: DataTypes.DECIMAL(12, 4),
      allowNull: true,
    },
    absolute_error: {
      type: DataTypes.DECIMAL(12, 4),
      allowNull: true,
    },
    percent_error: {
      type: DataTypes.DECIMAL(12, 4),
      allowNull: true,
    },
  },
  {
    tableName: "forecast_validation_records",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["run_id", "station_id", "date", "parameter"],
        name: "uniq_forecast_validation_record",
      },
      {
        fields: ["station_id", "date"],
      },
    ],
  }
);

ForecastValidationRun.hasMany(ForecastValidationRecord, {
  foreignKey: "run_id",
  as: "records",
});
ForecastValidationRecord.belongsTo(ForecastValidationRun, {
  foreignKey: "run_id",
  as: "run",
});

export default ForecastValidationRecord;
