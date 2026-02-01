import express from "express";
import {
  uploadRelativeHumidityData,
  getAllRelativeHumidityData,
  getStations,
  getYears,
  getRelativeHumidityDataById,
  createRelativeHumidityData,
  updateRelativeHumidityData,
  deleteRelativeHumidityData,
} from "../controllers/relativeHumidityController.js";

const router = express.Router();

// Upload relative humidity data from CSV/XLSX
router.post("/upload", uploadRelativeHumidityData);

// Get all relative humidity data with pagination
router.get("/", getAllRelativeHumidityData);

// Get unique stations
router.get("/stations", getStations);

// Get unique years
router.get("/years", getYears);

// Get relative humidity data by ID
router.get("/:id", getRelativeHumidityDataById);

// Create a single relative humidity record
router.post("/", createRelativeHumidityData);

// Update relative humidity data
router.put("/:id", updateRelativeHumidityData);

// Delete relative humidity data
router.delete("/:id", deleteRelativeHumidityData);

export default router;
