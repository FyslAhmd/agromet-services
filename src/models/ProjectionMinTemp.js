import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";

const ProjectionMinTemp = sequelize.define("ProjectionMinTemp", {
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
  min_kelvin: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  min_celcius: {
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
  tableName: 'projection_min_temps',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['district', 'date', 'model', 'scenario'],
      name: 'unique_min_temp_projection'
    }
  ]
});

export default ProjectionMinTemp;