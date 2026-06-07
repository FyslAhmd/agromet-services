import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const ProjectionPrecipitation = sequelize.define("ProjectionPrecipitation", {
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
  precipitation_flux: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  precipitation_mm: {
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
  tableName: 'projection_precipitations',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['district', 'date', 'model', 'scenario'],
      name: 'unique_precipitation_projection'
    },
    {
      fields: ['model', 'scenario', 'date', 'district'],
      name: 'idx_precipitation_map_query'
    }
  ]
});

export default ProjectionPrecipitation;
