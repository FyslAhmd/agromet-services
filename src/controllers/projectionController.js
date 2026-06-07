import fs from "fs";
import path from "path";
import csv from "csv-parser";
import crypto from "crypto";
import { Op, QueryTypes } from "sequelize";
import DataUploadJob from "../models/DataUploadJob.js";
import ProjectionMinTemp from "../models/ProjectionMinTemp.js";
import ProjectionMaxTemp from "../models/ProjectionMaxTemp.js";
import ProjectionPrecipitation from "../models/ProjectionPrecipitation.js";
import ProjectionRelativeHumidity from "../models/ProjectionRelativeHumidity.js";
import sequelize from "../config/database.js";

const BATCH_SIZE = 5000;

const DATA_TYPE_CONFIG = {
  "minimum-temperature": {
    model: ProjectionMinTemp,
    tableName: "projection_min_temps",
    valueColumn: "min_celcius",
  },
  "maximum-temperature": {
    model: ProjectionMaxTemp,
    tableName: "projection_max_temps",
    valueColumn: "max_celcius",
  },
  precipitation: {
    model: ProjectionPrecipitation,
    tableName: "projection_precipitations",
    valueColumn: "precipitation_mm",
  },
  "relative-humidity": {
    model: ProjectionRelativeHumidity,
    tableName: "projection_relative_humidities",
    valueColumn: "rh_percentage",
  },
};

const SEASON_CONFIG = {
  aus: {
    startMonth: 3,
    endMonth: 6,
    months: [3, 4, 5, 6],
    dateRange: (startYear, endYear) => ({
      startDate: `${startYear}-03-01`,
      endDate: `${endYear}-06-30`,
    }),
    seasonYearSql: "YEAR(`date`)",
  },
  aman: {
    startMonth: 6,
    endMonth: 11,
    months: [6, 7, 8, 9, 10, 11],
    dateRange: (startYear, endYear) => ({
      startDate: `${startYear}-06-01`,
      endDate: `${endYear}-11-30`,
    }),
    seasonYearSql: "YEAR(`date`)",
  },
  boro: {
    startMonth: 12,
    endMonth: 5,
    months: [12, 1, 2, 3, 4, 5],
    dateRange: (startYear, endYear) => ({
      startDate: `${startYear - 1}-12-01`,
      endDate: `${endYear}-05-31`,
    }),
    seasonYearSql: "CASE WHEN MONTH(`date`) = 12 THEN YEAR(`date`) + 1 ELSE YEAR(`date`) END",
  },
};

const getProjectionConfig = (dataType) => DATA_TYPE_CONFIG[dataType] || null;

const parseThreshold = (threshold) => {
  if (!threshold) return null;

  const match = String(threshold)
    .trim()
    .match(/^(<=|>=)\s*(-?\d+(?:\.\d+)?)$/);

  if (!match) return null;

  return {
    operator: match[1],
    value: Number(match[2]),
  };
};

const parseAverageRangeYears = (averageRange) => {
  const normalized = String(averageRange || "1Y").trim().toUpperCase();
  const match = normalized.match(/^(\d+)Y$/);
  if (!match) return 1;

  const parsed = Number(match[1]);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : 1;
};

const buildMapQueryConfig = ({ dataType, season, startYear, endYear, threshold }) => {
  const projectionConfig = getProjectionConfig(dataType);
  if (!projectionConfig) {
    throw new Error("Invalid data type");
  }

  const seasonConfig = season ? SEASON_CONFIG[season] : null;
  if (season && !seasonConfig) {
    throw new Error("Invalid season");
  }

  const thresholdConfig = parseThreshold(threshold);
  if (threshold && !thresholdConfig) {
    throw new Error("Invalid threshold");
  }

  const dateRange = seasonConfig
    ? seasonConfig.dateRange(startYear, endYear)
    : {
        startDate: `${startYear}-01-01`,
        endDate: `${endYear}-12-31`,
      };

  return {
    ...projectionConfig,
    seasonConfig,
    thresholdConfig,
    dateRange,
    seasonYearSql: seasonConfig?.seasonYearSql || "YEAR(`date`)",
    monthSql: seasonConfig
      ? `MONTH(\`date\`) IN (${seasonConfig.months.join(", ")})`
      : "1 = 1",
  };
};

// Helper to format date strings from M/D/YYYY to YYYY-MM-DD safely without timezone shifts
const parseDate = (dateString) => {
  if (!dateString) return null;
  
  // Create date and extract local parts instead of using toISOString() which shifts to UTC
  const dateObj = new Date(dateString);
  if (isNaN(dateObj.getTime())) return null;
  
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
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
        // Convert all keys to lowercase and trim them to avoid case sensitivity issues
        const normalizedRow = {};
        for (const key in row) {
          normalizedRow[key.trim().toLowerCase()] = row[key];
        }

        const district = normalizedRow['district'];
        const dateRaw = normalizedRow['date'];
        const model = normalizedRow['model'];
        const scenario = normalizedRow['scenario'];

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
          recordData.min_kelvin = parseNumeric(normalizedRow['min_kelvin']);
          recordData.min_celcius = parseNumeric(normalizedRow['min_celcius']);
        } else if (dataType === "maximum-temperature") {
          recordData.max_kelvin = parseNumeric(normalizedRow['max_kelvin']);
          recordData.max_celcius = parseNumeric(normalizedRow['max_celcius']);
        } else if (dataType === "precipitation") {
          recordData.precipitation_flux = parseNumeric(normalizedRow['precipitation_flux']);
          recordData.precipitation_mm = parseNumeric(normalizedRow['precipitation_mm']);
        } else if (dataType === "relative-humidity") {
          recordData.rh_percentage = parseNumeric(normalizedRow['rh (%)'] || normalizedRow['rh']);
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

    const projectionConfig = getProjectionConfig(dataType);
    if (!projectionConfig) {
      return res.status(400).json({ message: "Invalid data type" });
    }
    const Model = projectionConfig.model;

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

export const getProjectionFilters = async (req, res) => {
  try {
    const { dataType } = req.query;

    if (!dataType) {
      return res.status(400).json({ message: "dataType is required" });
    }

    const projectionConfig = getProjectionConfig(dataType);
    if (!projectionConfig) {
      return res.status(400).json({ message: "Invalid data type" });
    }
    const Model = projectionConfig.model;

    const getYearFromDate = (value) => {
      if (!value) return null;
      const parsedDate = new Date(value);
      if (Number.isNaN(parsedDate.getTime())) return null;
      return parsedDate.getFullYear();
    };

    // Use group by to get unique values. Using raw: true for better performance.
    const [districts, models, scenarios, minDate, maxDate] = await Promise.all([
      Model.findAll({ attributes: ['district'], group: ['district'], order: [['district', 'ASC']], raw: true }),
      Model.findAll({ attributes: ['model'], group: ['model'], order: [['model', 'ASC']], raw: true }),
      Model.findAll({ attributes: ['scenario'], group: ['scenario'], order: [['scenario', 'ASC']], raw: true }),
      Model.min("date"),
      Model.max("date"),
    ]);

    const startYear = getYearFromDate(minDate);
    const endYear = getYearFromDate(maxDate);
    const years =
      startYear && endYear && endYear >= startYear
        ? Array.from({ length: endYear - startYear + 1 }, (_, index) => startYear + index)
        : [];

    return res.json({
      districts: districts.map(d => d.district).filter(Boolean),
      models: models.map(m => m.model).filter(Boolean),
      scenarios: scenarios.map(s => s.scenario).filter(Boolean),
      startYear,
      endYear,
      years,
    });
  } catch (error) {
    console.error("Error fetching projection filters:", error);
    return res.status(500).json({ message: "Server error fetching projection filters" });
  }
};

export const getProjectionMapData = async (req, res) => {
  try {
    const {
      dataType,
      season = "",
      model = "",
      scenario = "",
      threshold = "",
      averageRange = "1Y",
      startYear,
      endYear,
    } = req.query;

    if (!dataType) {
      return res.status(400).json({ message: "dataType is required" });
    }

    if (!model) {
      return res.status(400).json({ message: "model is required" });
    }

    if (!scenario) {
      return res.status(400).json({ message: "scenario is required" });
    }

    const parsedStartYear = Number(startYear);
    const parsedEndYear = Number(endYear);

    if (!Number.isInteger(parsedStartYear) || !Number.isInteger(parsedEndYear)) {
      return res.status(400).json({ message: "startYear and endYear must be valid years" });
    }

    if (parsedEndYear < parsedStartYear) {
      return res.status(400).json({ message: "endYear must be greater than or equal to startYear" });
    }

    const rangeYears = parseAverageRangeYears(averageRange);
    const queryConfig = buildMapQueryConfig({
      dataType,
      season,
      startYear: parsedStartYear,
      endYear: parsedEndYear,
      threshold,
    });

    const thresholdSql = queryConfig.thresholdConfig
      ? `AND \`${queryConfig.valueColumn}\` ${queryConfig.thresholdConfig.operator} :thresholdValue`
      : "";

    const rows = await sequelize.query(
      `
        SELECT
          aggregated.district,
          FLOOR((aggregated.season_year - :startYear) / :rangeYears) AS periodIndex,
          MIN(aggregated.season_year) AS periodStartYear,
          MAX(aggregated.season_year) AS periodEndYear,
          AVG(aggregated.metric_value) AS averageValue,
          COUNT(*) AS sampleCount
        FROM (
          SELECT
            district,
            ${queryConfig.seasonYearSql} AS season_year,
            \`${queryConfig.valueColumn}\` AS metric_value
          FROM \`${queryConfig.tableName}\`
          WHERE model = :model
            AND scenario = :scenario
            AND \`${queryConfig.valueColumn}\` IS NOT NULL
            AND \`date\` BETWEEN :startDate AND :endDate
            AND ${queryConfig.monthSql}
            ${thresholdSql}
        ) AS aggregated
        WHERE aggregated.season_year BETWEEN :startYear AND :endYear
        GROUP BY aggregated.district, FLOOR((aggregated.season_year - :startYear) / :rangeYears)
        ORDER BY aggregated.district ASC, periodIndex ASC
      `,
      {
        replacements: {
          model,
          scenario,
          startDate: queryConfig.dateRange.startDate,
          endDate: queryConfig.dateRange.endDate,
          startYear: parsedStartYear,
          endYear: parsedEndYear,
          rangeYears,
          thresholdValue: queryConfig.thresholdConfig?.value ?? null,
        },
        type: QueryTypes.SELECT,
      }
    );

    const periods = [];
    for (let periodStart = parsedStartYear; periodStart <= parsedEndYear; periodStart += rangeYears) {
      const periodEnd = Math.min(periodStart + rangeYears - 1, parsedEndYear);
      periods.push({
        key: `${periodStart}-${periodEnd}`,
        label: periodStart === periodEnd ? `${periodStart}` : `${periodStart}-${periodEnd}`,
        startYear: periodStart,
        endYear: periodEnd,
      });
    }

    const data = rows.map((row) => {
      const periodIndex = Number(row.periodIndex);
      const periodStartYear = parsedStartYear + periodIndex * rangeYears;
      const periodEndYear = Math.min(periodStartYear + rangeYears - 1, parsedEndYear);

      return {
        district: row.district,
        periodIndex,
        periodKey: `${periodStartYear}-${periodEndYear}`,
        periodLabel:
          periodStartYear === periodEndYear
            ? `${periodStartYear}`
            : `${periodStartYear}-${periodEndYear}`,
        periodStartYear,
        periodEndYear,
        actualDataStartYear: Number(row.periodStartYear),
        actualDataEndYear: Number(row.periodEndYear),
        value: row.averageValue === null ? null : Number(Number(row.averageValue).toFixed(3)),
        sampleCount: Number(row.sampleCount),
      };
    });

    return res.json({
      filters: {
        dataType,
        season,
        model,
        scenario,
        threshold: threshold || null,
        averageRange: `${rangeYears}Y`,
        startYear: parsedStartYear,
        endYear: parsedEndYear,
      },
      periods,
      totalDistricts: new Set(data.map((row) => row.district)).size,
      totalPoints: data.length,
      data,
    });
  } catch (error) {
    console.error("Error fetching projection map data:", error);
    return res.status(500).json({ message: "Server error fetching projection map data" });
  }
};
