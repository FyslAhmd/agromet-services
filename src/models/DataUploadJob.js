import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const DataUploadJob = sequelize.define("DataUploadJob", {
  id: {
    type: DataTypes.STRING,
    primaryKey: true,
    allowNull: false,
  },
  filename: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  dataType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('pending', 'processing', 'completed', 'failed'),
    defaultValue: 'pending',
  },
  totalRows: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  processedRows: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  errorLog: {
    type: DataTypes.TEXT('long'),
    allowNull: true,
  }
}, {
  tableName: 'data_upload_jobs',
  timestamps: true,
});

export default DataUploadJob;