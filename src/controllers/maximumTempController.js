import MaximumTemp from "../models/MaximumTemp.js";
import { Op } from "sequelize";
import sequelize from "../config/database.js";

// Helper to parse numeric value
const parseNumericValue = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
};

// Upload maximum temperature data from CSV/XLSX
const uploadMaximumTempData = async (req, res) => {
  try {
    const { data } = req.body;

    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({
        success: false,
        message: "No data provided or invalid format",
      });
    }

    console.log("Received data rows:", data.length);
    console.log("First row sample:", data[0]);

    const results = {
      total: data.length,
      successful: 0,
      failed: 0,
      updated: 0,
      details: {
        success: [],
        failed: [],
        updated: [],
      },
    };

    for (let i = 0; i < data.length; i++) {
      try {
        const row = data[i];

        // Extract station, year, month
        const station =
          row["Stations"] || row["Station"] || row["station"] || row["STATION"];
        const year =
          row["Year"] || row["year"] || row["YEAR"] || row["Fiscal Year"];
        const month = row["Month"] || row["month"] || row["MONTH"];

        if (!station || !year || !month) {
          results.failed++;
          results.details.failed.push({
            row: i + 1,
            error: "Missing required fields: Station, Year, or Month",
            data: row,
          });
          continue;
        }

        // Parse year and month
        const yearInt = parseInt(year);
        const monthInt = parseInt(month);

        if (isNaN(yearInt) || isNaN(monthInt) || monthInt < 1 || monthInt > 12) {
          results.failed++;
          results.details.failed.push({
            row: i + 1,
            error: "Invalid year or month value",
            data: row,
          });
          continue;
        }

        // Extract day values (1-31)
        const dayData = {};
        for (let day = 1; day <= 31; day++) {
          const dayKey = `day${day}`;
          const value = row[day.toString()] || row[day] || row[`Day${day}`];
          dayData[dayKey] = parseNumericValue(value);
        }

        // Check if record exists
        const existingRecord = await MaximumTemp.findOne({
          where: {
            station: station.trim(),
            year: yearInt,
            month: monthInt,
          },
        });

        const recordData = {
          station: station.trim(),
          year: yearInt,
          month: monthInt,
          ...dayData,
        };

        if (existingRecord) {
          // Update existing record
          await existingRecord.update(recordData);
          results.updated++;
          results.details.updated.push({
            station: station.trim(),
            year: yearInt,
            month: monthInt,
          });
        } else {
          // Create new record
          await MaximumTemp.create(recordData);
          results.successful++;
          results.details.success.push({
            station: station.trim(),
            year: yearInt,
            month: monthInt,
          });
        }
      } catch (error) {
        console.error(`Error processing row ${i + 1}:`, error);
        results.failed++;
        results.details.failed.push({
          row: i + 1,
          error: error.message,
          data: data[i],
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: "Upload completed",
      results,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to upload data",
    });
  }
};

// Get all maximum temperature data with pagination and filters
const getAllMaximumTempData = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      station,
      year,
      month,
      startDate,
      endDate,
      sortBy = "year",
      sortOrder = "DESC",
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build where clause
    const whereClause = {};
    if (station) whereClause.station = station;
    if (year) whereClause.year = parseInt(year);
    if (month) whereClause.month = parseInt(month);

    // Add date range filtering if provided
    if (startDate || endDate) {
      const dateConditions = [];
      
      if (startDate) {
        const start = new Date(startDate);
        dateConditions.push({
          [Op.or]: [
            { year: { [Op.gt]: start.getFullYear() } },
            {
              [Op.and]: [
                { year: start.getFullYear() },
                { month: { [Op.gte]: start.getMonth() + 1 } }
              ]
            }
          ]
        });
      }
      
      if (endDate) {
        const end = new Date(endDate);
        dateConditions.push({
          [Op.or]: [
            { year: { [Op.lt]: end.getFullYear() } },
            {
              [Op.and]: [
                { year: end.getFullYear() },
                { month: { [Op.lte]: end.getMonth() + 1 } }
              ]
            }
          ]
        });
      }
      
      if (dateConditions.length > 0) {
        whereClause[Op.and] = dateConditions;
      }
    }

    // Get total count
    const total = await MaximumTemp.count({ where: whereClause });

    // Get paginated data - sort by year DESC, month DESC for recent first
    const data = await MaximumTemp.findAll({
      where: whereClause,
      limit: parseInt(limit),
      offset: offset,
      order: [
        ['year', sortOrder],
        ['month', sortOrder]
      ],
    });

    return res.status(200).json({
      success: true,
      data,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch data",
    });
  }
};

// Get unique stations
const getStations = async (req, res) => {
  try {
    const stations = await MaximumTemp.findAll({
      attributes: [[sequelize.fn("DISTINCT", sequelize.col("station")), "station"]],
      order: [["station", "ASC"]],
      raw: true,
    });

    return res.status(200).json({
      success: true,
      data: stations.map((s) => s.station),
    });
  } catch (error) {
    console.error("Error fetching stations:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch stations",
    });
  }
};

// Get unique years
const getYears = async (req, res) => {
  try {
    const years = await MaximumTemp.findAll({
      attributes: [[sequelize.fn("DISTINCT", sequelize.col("year")), "year"]],
      order: [["year", "DESC"]],
      raw: true,
    });

    return res.status(200).json({
      success: true,
      data: years.map((y) => y.year),
    });
  } catch (error) {
    console.error("Error fetching years:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch years",
    });
  }
};

// Get maximum temperature data by ID
const getMaximumTempDataById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await MaximumTemp.findByPk(id);

    if (!data) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch data",
    });
  }
};

// Create a single maximum temperature record
const createMaximumTempData = async (req, res) => {
  try {
    const data = await MaximumTemp.create(req.body);

    return res.status(201).json({
      success: true,
      message: "Record created successfully",
      data,
    });
  } catch (error) {
    console.error("Error creating record:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create record",
    });
  }
};

// Update maximum temperature data
const updateMaximumTempData = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await MaximumTemp.findByPk(id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    await record.update(req.body);

    return res.status(200).json({
      success: true,
      message: "Record updated successfully",
      data: record,
    });
  } catch (error) {
    console.error("Error updating record:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update record",
    });
  }
};

// Delete maximum temperature data
const deleteMaximumTempData = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await MaximumTemp.findByPk(id);

    if (!record) {
      return res.status(404).json({
        success: false,
        message: "Record not found",
      });
    }

    await record.destroy();

    return res.status(200).json({
      success: true,
      message: "Record deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting record:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete record",
    });
  }
};

export {
  uploadMaximumTempData,
  getAllMaximumTempData,
  getStations,
  getYears,
  getMaximumTempDataById,
  createMaximumTempData,
  updateMaximumTempData,
  deleteMaximumTempData,
};
