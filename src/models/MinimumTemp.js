import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const MinimumTemp = sequelize.define('MinimumTemp', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  station: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  year: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  month: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  day1: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  day2: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  day3: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  day4: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  day5: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  day6: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  day7: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  day8: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  day9: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  day10: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  day11: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  day12: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  day13: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  day14: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  day15: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  day16: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  day17: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  day18: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  day19: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  day20: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  day21: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  day22: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  day23: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  day24: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  day25: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  day26: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  day27: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  day28: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  day29: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  day30: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
  day31: { type: DataTypes.DECIMAL(5, 2), allowNull: true },
}, {
  tableName: 'minimum_temp',
  timestamps: false,
  indexes: [
    {
      unique: true,
      fields: ['station', 'year', 'month'],
    },
  ],
});

export default MinimumTemp;