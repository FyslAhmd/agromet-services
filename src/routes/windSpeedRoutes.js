import express from "express";
import {
  uploadWindSpeedData,
  getAllWindSpeedData,
  getStations,
  getYears,
  getWindSpeedDataById,
  createWindSpeedData,
  updateWindSpeedData,
  deleteWindSpeedData,
} from "../controllers/windSpeedController.js";

const router = express.Router();

// Upload wind speed data from CSV/XLSX
router.post("/upload", uploadWindSpeedData);

// Get all wind speed data with pagination
router.get("/", getAllWindSpeedData);

// Get unique stations
router.get("/stations", getStations);

// Get unique years
router.get("/years", getYears);

// Get wind speed data by ID
router.get("/:id", getWindSpeedDataById);

// Create a single wind speed record
router.post("/", createWindSpeedData);

// Update wind speed data
router.put("/:id", updateWindSpeedData);

// Delete wind speed data
router.delete("/:id", deleteWindSpeedData);

export default router;
