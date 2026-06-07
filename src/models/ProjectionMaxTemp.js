import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const ProjectionMaxTemp = sequelize.define("ProjectionMaxTemp", {
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
  max_kelvin: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  max_celcius: {
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
  tableName: 'projection_max_temps',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['district', 'date', 'model', 'scenario'],
      name: 'unique_max_temp_projection'
    },
    {
      fields: ['model', 'scenario', 'date', 'district'],
      name: 'idx_max_temp_map_query'
    }
  ]
});

export default ProjectionMaxTemp;
