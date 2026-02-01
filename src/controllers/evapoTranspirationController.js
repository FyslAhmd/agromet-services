import EvapoTranspiration from "../models/EvapoTranspiration.js";
import { Op } from "sequelize";
import sequelize from "../config/database.js";

const parseNumericValue = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = parseFloat(value);
  return isNaN(parsed) ? null : parsed;
};

const uploadEvapoTranspirationData = async (req, res) => {
  try {
    const { data } = req.body;
    if (!data || !Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ success: false, message: "No data provided or invalid format" });
    }

    const results = { total: data.length, successful: 0, failed: 0, updated: 0, details: { success: [], failed: [], updated: [] } };

    for (let i = 0; i < data.length; i++) {
      try {
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

        const existingRecord = await EvapoTranspiration.findOne({ where: { station: station.trim(), year: yearInt, month: monthInt } });
        const recordData = { station: station.trim(), year: yearInt, month: monthInt, ...dayData };

        if (existingRecord) {
          await existingRecord.update(recordData);
          results.updated++;
          results.details.updated.push({ station: station.trim(), year: yearInt, month: monthInt });
        } else {
          await EvapoTranspiration.create(recordData);
          results.successful++;
          results.details.success.push({ station: station.trim(), year: yearInt, month: monthInt });
        }
      } catch (error) {
        results.failed++;
        results.details.failed.push({ row: i + 1, error: error.message, data: data[i] });
      }
    }
    return res.status(200).json({ success: true, message: "Upload completed", results });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to upload data" });
  }
};

const getAllEvapoTranspirationData = async (req, res) => {
  try {
    const { page = 1, limit = 50, station, year, month, sortBy = "year", sortOrder = "DESC" } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const whereClause = {};
    if (station) whereClause.station = station;
    if (year) whereClause.year = parseInt(year);
    if (month) whereClause.month = parseInt(month);
    const total = await EvapoTranspiration.count({ where: whereClause });
    const data = await EvapoTranspiration.findAll({ where: whereClause, limit: parseInt(limit), offset: offset, order: [[sortBy, sortOrder]] });
    return res.status(200).json({ success: true, data, pagination: { page: parseInt(page), limit: parseInt(limit), total, totalPages: Math.ceil(total / parseInt(limit)) } });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch data" });
  }
};

const getStations = async (req, res) => {
  try {
    const stations = await EvapoTranspiration.findAll({ attributes: [[sequelize.fn("DISTINCT", sequelize.col("station")), "station"]], order: [["station", "ASC"]], raw: true });
    return res.status(200).json({ success: true, data: stations.map((s) => s.station) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch stations" });
  }
};

const getYears = async (req, res) => {
  try {
    const years = await EvapoTranspiration.findAll({ attributes: [[sequelize.fn("DISTINCT", sequelize.col("year")), "year"]], order: [["year", "DESC"]], raw: true });
    return res.status(200).json({ success: true, data: years.map((y) => y.year) });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch years" });
  }
};

const getEvapoTranspirationDataById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await EvapoTranspiration.findByPk(id);
    if (!data) return res.status(404).json({ success: false, message: "Record not found" });
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to fetch data" });
  }
};

const createEvapoTranspirationData = async (req, res) => {
  try {
    const data = await EvapoTranspiration.create(req.body);
    return res.status(201).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to create data" });
  }
};

const updateEvapoTranspirationData = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await EvapoTranspiration.findByPk(id);
    if (!data) return res.status(404).json({ success: false, message: "Record not found" });
    await data.update(req.body);
    return res.status(200).json({ success: true, data });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to update data" });
  }
};

const deleteEvapoTranspirationData = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await EvapoTranspiration.findByPk(id);
    if (!data) return res.status(404).json({ success: false, message: "Record not found" });
    await data.destroy();
    return res.status(200).json({ success: true, message: "Record deleted successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message || "Failed to delete data" });
  }
};

export { uploadEvapoTranspirationData, getAllEvapoTranspirationData, getStations, getYears, getEvapoTranspirationDataById, createEvapoTranspirationData, updateEvapoTranspirationData, deleteEvapoTranspirationData };
