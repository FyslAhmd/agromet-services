import SolarRadiation from "../models/SolarRadiation.js";
import { Op } from "sequelize";
import sequelize from "../config/database.js";

const parseNumericValue = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
};

const uploadSolarRadiationData = async (req, res) => {
  try {
    const { data } = req.body;
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ success: false, message: "No data provided or invalid format" });
    }

    const results = { total: data.length, successful: 0, failed: 0, updated: 0, details: { success: [], failed: [], updated: [] } };

    // Process all rows and prepare data for bulk insert
    const recordsToProcess = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      const station = row["Stations"] || row["Station"] || row["station"] || row["STATION"];
      const year = row["Year"] || row["year"] || row["YEAR"] || row["Fiscal Year"];
      const month = row["Month"] || row["month"] || row["MONTH"];

      if (!station || !year || !month) {
        results.failed++;
        results.details.failed.push({ row: i + 1, error: "Missing required fields: Station, Year, or Month", data: row });
        continue;
      }

      const yearInt = parseInt(year);
      const monthInt = parseInt(month);
      if (isNaN(yearInt) || isNaN(monthInt) || monthInt < 1 || monthInt > 12) {
        results.failed++;
        results.details.failed.push({ row: i + 1, error: "Invalid year or month value", data: row });
        continue;
      }

      const dayData = {};
      for (let day = 1; day <= 31; day++) {
        const dayKey = `day${day}`;
        const value = row[day.toString()] || row[day] || row[`Day${day}`];
        dayData[dayKey] = parseNumericValue(value);
      }

      const recordData = { station: station.trim(), year: yearInt, month: monthInt, ...dayData };
      recordsToProcess.push({ rowIndex: i + 1, recordData });
    }

    // Use bulkCreate with updateOnDuplicate for efficient upsert
    if (recordsToProcess.length > 0) {
      try {
        const recordDataArray = recordsToProcess.map(r => r.recordData);
        await SolarRadiation.bulkCreate(recordDataArray, {
          updateOnDuplicate: [
            'day1', 'day2', 'day3', 'day4', 'day5', 'day6', 'day7', 'day8', 'day9', 'day10',
            'day11', 'day12', 'day13', 'day14', 'day15', 'day16', 'day17', 'day18', 'day19', 'day20',
            'day21', 'day22', 'day23', 'day24', 'day25', 'day26', 'day27', 'day28', 'day29', 'day30', 'day31'
          ],
        });
        results.successful = recordsToProcess.length;
        results.details.success = recordsToProcess.map(r => ({ station: r.recordData.station, year: r.recordData.year, month: r.recordData.month }));
      } catch (bulkError) {
        console.error("Bulk insert error, falling back to individual inserts:", bulkError.message);
        for (const record of recordsToProcess) {
          try {
            const existingRecord = await SolarRadiation.findOne({ where: { station: record.recordData.station, year: record.recordData.year, month: record.recordData.month } });
            if (existingRecord) {
              await existingRecord.update(record.recordData);
              results.updated++;
              results.details.updated.push({ station: record.recordData.station, year: record.recordData.year, month: record.recordData.month });
            } else {
              await SolarRadiation.create(record.recordData);
              results.successful++;
              results.details.success.push({ station: record.recordData.station, year: record.recordData.year, month: record.recordData.month });
            }
          } catch (error) {
            results.failed++;
            results.details.failed.push({ row: record.rowIndex, error: error.message });
          }
        }
      }
    }
    return res.status(200).json({ success: true, message: "Upload completed", results });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to upload data" });
  }
};

const getAllSolarRadiationData = async (req, res) => {
  try {
    const { page = 1, limit = 50, station, year, month, sortBy = "year", sortOrder = "DESC" } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const whereClause = {};
    if (station) whereClause.station = station;
    if (year) whereClause.year = parseInt(year);
    if (month) whereClause.month = parseInt(month);
    const total = await SolarRadiation.count({ where: whereClause });
    const data = await SolarRadiation.findAll({ where: whereClause, limit: parseInt(limit), offset: offset, order: [[sortBy, sortOrder]] });
    return res.status(200).json({ success: true, data, pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch data" });
  }
};

const getStations = async (req, res) => {
  try {
    const stations = await SolarRadiation.findAll({ attributes: [[sequelize.fn("DISTINCT", sequelize.col("station")), "station"]], order: [["station", "ASC"]], raw: true });
    return res.status(200).json({ success: true, data: stations.map((s) => s.station) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch stations" });
  }
};

const getYears = async (req, res) => {
  try {
    const years = await SolarRadiation.findAll({ attributes: [[sequelize.fn("DISTINCT", sequelize.col("year")), "year"]], order: [["year", "DESC"]], raw: true });
    return res.status(200).json({ success: true, data: years.map((y) => y.year) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch years" });
  }
};

const getSolarRadiationDataById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await SolarRadiation.findByPk(id);
    if (!data) return res.status(404).json({ success: false, message: "Record not found" });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch data" });
  }
};

const createSolarRadiationData = async (req, res) => {
  try {
    const data = await SolarRadiation.create(req.body);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to create data" });
  }
};

const updateSolarRadiationData = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await SolarRadiation.findByPk(id);
    if (!data) return res.status(404).json({ success: false, message: "Record not found" });
    await data.update(req.body);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to update data" });
  }
};

const deleteSolarRadiationData = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await SolarRadiation.findByPk(id);
    if (!data) return res.status(404).json({ success: false, message: "Record not found" });
    await data.destroy();
    return res.status(200).json({ success: true, message: "Record deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to delete data" });
  }
};

export { uploadSolarRadiationData, getAllSolarRadiationData, getStations, getYears, getSolarRadiationDataById, createSolarRadiationData, updateSolarRadiationData, deleteSolarRadiationData };
