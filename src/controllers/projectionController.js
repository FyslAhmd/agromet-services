import fs from "fs";
import path from "path";
import csv from "csv-parser";
import crypto from "crypto";
import DataUploadJob from "../models/DataUploadJob.js";
import ProjectionMinTemp from "../models/ProjectionMinTemp.js";
import ProjectionMaxTemp from "../models/ProjectionMaxTemp.js";
import ProjectionPrecipitation from "../models/ProjectionPrecipitation.js";
import ProjectionRelativeHumidity from "../models/ProjectionRelativeHumidity.js";
import sequelize from "../config/database.js";

const BATCH_SIZE = 5000;

// Helper to format date strings from M/D/YYYY to YYYY-MM-DD
const parseDate = (dateString) => {
  if (!dateString) return null;
  const dateObj = new Date(dateString);
  if (isNaN(dateObj.getTime())) return null;
  return dateObj.toISOString().split("T")[0];
};

const parseNumeric = (val) => {
  if (val === null || val === undefined || val === "") return null;
  const parsed = parseFloat(val);
  return isNaN(parsed) ? null : parsed;
};

// Main processing worker function (runs asynchronously)
const processCSV = async (jobId, filePath, dataType) => {
  let job;
  try {
    job = await DataUploadJob.findByPk(jobId);
    if (!job) return;

    job.status = "processing";
    await job.save();

    let batch = [];
    let processedCount = 0;
    let errorLog = [];

    // Determine the Sequelize Model and update keys based on dataType
    let Model;
    let updateFields = [];

    switch (dataType) {
      case "minimum-temperature":
        Model = ProjectionMinTemp;
        updateFields = ["min_kelvin", "min_celcius"];
        break;
      case "maximum-temperature":
        Model = ProjectionMaxTemp;
        updateFields = ["max_kelvin", "max_celcius"];
        break;
      case "precipitation":
        Model = ProjectionPrecipitation;
        updateFields = ["precipitation_flux", "precipitation_mm"];
        break;
      case "relative-humidity":
        Model = ProjectionRelativeHumidity;
        updateFields = ["rh_percentage"];
        break;
      default:
        throw new Error("Invalid data type");
    }

    const stream = fs.createReadStream(filePath).pipe(csv());

    for await (const row of stream) {
      try {
        const district = row.District || row.district || row.DISTRICT;
        const dateRaw = row.Date || row.date || row.DATE;
        const model = row.Model || row.model || row.MODEL;
        const scenario = row.Scenario || row.scenario || row.SCENARIO;

        const formattedDate = parseDate(dateRaw);

        if (!district || !formattedDate || !model || !scenario) {
          errorLog.push(`Row ${processedCount + 1}: Missing required composite fields.`);
          continue;
        }

        let recordData = {
          district: district.trim(),
          date: formattedDate,
          model: model.trim(),
          scenario: scenario.trim(),
        };

        if (dataType === "minimum-temperature") {
          recordData.min_kelvin = parseNumeric(row.Min_kelvin || row.min_kelvin);
          recordData.min_celcius = parseNumeric(row.Min_celcius || row.min_celcius);
        } else if (dataType === "maximum-temperature") {
          recordData.max_kelvin = parseNumeric(row.Max_kelvin || row.max_kelvin);
          recordData.max_celcius = parseNumeric(row.Max_celcius || row.max_celcius);
        } else if (dataType === "precipitation") {
          recordData.precipitation_flux = parseNumeric(row.precipitation_flux || row.Precipitation_flux);
          recordData.precipitation_mm = parseNumeric(row.precipitation_mm || row.Precipitation_mm);
        } else if (dataType === "relative-humidity") {
          recordData.rh_percentage = parseNumeric(row['Rh (%)'] || row.rh || row.RH || row.rh_percentage);
        }

        batch.push(recordData);
      } catch (err) {
        errorLog.push(`Row ${processedCount + 1}: ${err.message}`);
      }

      processedCount++;

      // When batch size is reached, flush to database
      if (batch.length >= BATCH_SIZE) {
        stream.pause(); // Pause stream while inserting

        try {
          await Model.bulkCreate(batch, {
            updateOnDuplicate: updateFields,
            logging: false, // Turn off query logging for speed
          });
        } catch (dbErr) {
          errorLog.push(`Batch insert error at row ${processedCount}: ${dbErr.message}`);
        }

        job.processedRows = processedCount;
        await job.save();

        batch = [];
        stream.resume(); // Resume stream
      }
    }

    // Process any remaining items in the batch
    if (batch.length > 0) {
      try {
        await Model.bulkCreate(batch, {
          updateOnDuplicate: updateFields,
          logging: false,
        });
      } catch (dbErr) {
        errorLog.push(`Final batch insert error: ${dbErr.message}`);
      }
      job.processedRows = processedCount;
    }

    job.status = "completed";
    job.totalRows = processedCount;
    if (errorLog.length > 0) {
      job.errorLog = JSON.stringify(errorLog.slice(0, 100)); // Store top 100 errors to avoid huge text
    }
    await job.save();

  } catch (error) {
    console.error("Background Processing Error:", error);
    if (job) {
      job.status = "failed";
      job.errorLog = error.message;
      await job.save();
    }
  } finally {
    // Clean up the temp file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
};

export const uploadProjectionFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const { dataType } = req.body;
    if (!dataType) {
      // Clean up file if validation fails
      fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: "Data type is required" });
    }

    // Create a new Job entry
    const jobId = crypto.randomUUID();
    
    await DataUploadJob.create({
      id: jobId,
      filename: req.file.originalname,
      dataType: dataType,
      status: "pending",
    });

    // Start background processing WITHOUT awaiting it
    processCSV(jobId, req.file.path, dataType);

    // Immediately respond to the client
    return res.status(202).json({
      message: "File received and processing started",
      jobId: jobId,
    });
  } catch (error) {
    console.error("Upload initialization error:", error);
    return res.status(500).json({ message: "Server error during upload initialization" });
  }
};

export const getJobStatus = async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await DataUploadJob.findByPk(jobId);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    return res.json({
      id: job.id,
      status: job.status,
      totalRows: job.totalRows,
      processedRows: job.processedRows,
      errorLog: job.errorLog,
    });
  } catch (error) {
    console.error("Status check error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const getProjectionData = async (req, res) => {
  try {
    const { dataType, page = 1, limit = 20, district, model, scenario, startDate, endDate } = req.query;

    if (!dataType) {
      return res.status(400).json({ message: "dataType is required" });
    }

    let Model;
    switch (dataType) {
      case "minimum-temperature":
        Model = ProjectionMinTemp;
        break;
      case "maximum-temperature":
        Model = ProjectionMaxTemp;
        break;
      case "precipitation":
        Model = ProjectionPrecipitation;
        break;
      case "relative-humidity":
        Model = ProjectionRelativeHumidity;
        break;
      default:
        return res.status(400).json({ message: "Invalid data type" });
    }

    const where = {};
    if (district) where.district = { [Op.like]: `%${district}%` };
    if (model) where.model = { [Op.like]: `%${model}%` };
    if (scenario) where.scenario = { [Op.like]: `%${scenario}%` };

    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date[Op.gte] = startDate;
      if (endDate) where.date[Op.lte] = endDate;
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Model.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset,
      order: [['date', 'ASC'], ['district', 'ASC']],
    });

    return res.json({
      total: count,
      totalPages: Math.ceil(count / parseInt(limit)),
      currentPage: parseInt(page),
      data: rows,
    });
  } catch (error) {
    console.error("Error fetching projection data:", error);
    return res.status(500).json({ message: "Server error fetching projection data" });
  }
};
