import { DataTypes } from "sequelize";
import sequelize from "../config/database.js";
import User from "./User.js";

const HistoricalDataRequest = sequelize.define("HistoricalDataRequest", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  // Personal Information
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  designation: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  organization: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isEmail: true,
    },
  },
  mobile: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  // Date Selection - Custom date range mode
  startDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: "Start date for custom date range (null if using timeInterval)"
  },
  endDate: {
    type: DataTypes.DATEONLY,
    allowNull: true,
    comment: "End date for custom date range (null if using timeInterval)"
  },
  // Date Selection - Preset time interval mode
  timeInterval: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isIn: [['3M', '6M', '1Y', '5Y', '10Y', '20Y', '30Y', '50Y', 'All']],
    },
    comment: "Preset time interval (null if using custom startDate/endDate)"
  },
  // Data Average - for aggregating data points
  dataAverage: {
    type: DataTypes.STRING,
    allowNull: true,
    defaultValue: 'none',
    validate: {
      isIn: [['none', '1W', '1M', '3M', '6M', '1Y', '5Y', '10Y', '20Y', '30Y']],
    },
    comment: "Data averaging interval for smoothing"
  },
  // Selected Stations (array of station names)
  selectedStations: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: "Array of selected research station names",
  },
  // Selected Climate Parameters (array of parameter values)
  selectedParameters: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: "Array of selected climate parameters (maximum-temp, rainfall, etc.)",
  },
  // Selected Data Formats
  selectedDataFormats: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: "Array of selected data formats (CSV, Image)",
  },
  // Request Status
  status: {
    type: DataTypes.STRING,
    defaultValue: "Pending",
    validate: {
      isIn: [['Pending', 'Processing', 'Completed', 'Rejected']],
    },
  },
  // Admin Remarks
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: "Admin remarks or notes",
  },
  // Request DateTime
  requestDateTime: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
    allowNull: false,
  },
  // Optional User reference
  UserId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: User,
      key: 'id',
    },
  },
}, {
  tableName: "HistoricalDataRequests",
  timestamps: true,
  indexes: [
    {
      fields: ['email']
    },
    {
      fields: ['status']
    },
    {
      fields: ['requestDateTime']
    },
    {
      fields: ['organization']
    }
  ]
});

// Association with User model
HistoricalDataRequest.belongsTo(User, { foreignKey: 'UserId', as: 'user' });

export default HistoricalDataRequest;
