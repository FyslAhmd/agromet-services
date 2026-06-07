import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const ProjectionRelativeHumidity = sequelize.define("ProjectionRelativeHumidity", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  district: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false,
  },
  rh_percentage: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  model: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  scenario: {
    type: DataTypes.STRING,
    allowNull: false,
  }
}, {
  tableName: 'projection_relative_humidities',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['district', 'date', 'model', 'scenario'],
      name: 'unique_rh_projection'
    },
    {
      fields: ['model', 'scenario', 'date', 'district'],
      name: 'idx_rh_map_query'
    }
  ]
});

export default ProjectionRelativeHumidity;
