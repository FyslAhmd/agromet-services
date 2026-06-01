import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const GuestLoginLog = sequelize.define("GuestLoginLog", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  ipAddress: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  userAgent: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
}, {
  tableName: 'guest_login_logs',
  timestamps: true, // Automatically adds createdAt and updatedAt
  updatedAt: false, // We only need createdAt for a log
});

export default GuestLoginLog;
