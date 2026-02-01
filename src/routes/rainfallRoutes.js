import express from "express";
import {
  uploadRainfallData,
  getAllRainfallData,
  getStations,
  getYears,
  getRainfallDataById,
  createRainfallData,
  updateRainfallData,
  deleteRainfallData,
} from "../controllers/rainfallController.js";

const router = express.Router();

// Upload rainfall data from CSV/XLSX
router.post("/upload", uploadRainfallData);

// Get all rainfall data with pagination
router.get("/", getAllRainfallData);

// Get unique stations
router.get("/stations", getStations);

// Get unique years
router.get("/years", getYears);

// Get rainfall data by ID
router.get("/:id", getRainfallDataById);

// Create a single rainfall record
router.post("/", createRainfallData);

// Update rainfall data
router.put("/:id", updateRainfallData);

// Delete rainfall data
router.delete("/:id", deleteRainfallData);

export default router;
